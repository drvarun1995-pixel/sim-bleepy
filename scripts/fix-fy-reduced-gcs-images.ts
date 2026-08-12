/**
 * Fix GCS components infographic text overflow and add official GCS Assessment Aid
 * image (with dofollow source link) under it on the reduced-GCS guide.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/fix-fy-reduced-gcs-images.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { execFileSync } from 'child_process'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const SLUG = 'fy-reduced-gcs-approach'
const IMAGE_DIR = `foundation-year/general/on-calls/${SLUG}/images`
const W = 1280
const INFO_H = 980
const GCS_PDF_URL =
  'https://www.glasgowcomascale.org/downloads/GCS-Assessment-Aid-English.pdf?v=3'
const LOCAL_PDF = path.resolve('tmp-psi/GCS-Assessment-Aid-English.pdf')
const LOCAL_AID_PNG = path.resolve('tmp-psi/gcs-assessment-aid-english.png')

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrappedTspans(
  lines: string[],
  x: number,
  y0: number,
  lineHeight: number,
  fontSize: number,
  fill: string,
  fontWeight = '700'
): string {
  return lines
    .map((line, i) => {
      const y = y0 + i * lineHeight
      return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}">${escapeXml(line)}</text>`
    })
    .join('\n')
}

function gcsComponentsSvg(): Buffer {
  const panels = [
    {
      title: 'EYES',
      lines: ['Spontaneous', '→ voice', '→ stimulus', '→ none'],
      tip: 'Record E',
    },
    {
      title: 'VERBAL',
      lines: ['Oriented', '→ confused', '→ words', '→ sounds', '→ none'],
      tip: 'Record V',
    },
    {
      title: 'MOTOR',
      lines: ['Obeys', '→ localises', '→ withdraws', '→ abnormal', '→ none'],
      tip: 'Record M',
    },
  ]

  const cards = panels
    .map((panel, i) => {
      const x = 70 + i * 390
      const cx = x + 175
      const body = wrappedTspans(panel.lines, cx, 390, 42, 20, '#334155')
      return `
      <rect x="${x}" y="200" width="350" height="520" rx="22" fill="#F8FAFC" stroke="#1E3A5F" stroke-width="3"/>
      <rect x="${x + 40}" y="230" width="270" height="70" rx="14" fill="#4F46E5"/>
      <text x="${cx}" y="275" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="28" fill="#fff">${escapeXml(panel.title)}</text>
      ${body}
      <text x="${cx}" y="670" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="22" fill="#F25006">${escapeXml(panel.tip)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="30" fill="#1E3A5F">GCS COMPONENTS — RECORD E, V AND M</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748B">The components are more useful than a total score alone — trend them over time</text>
  ${cards}
  <text x="640" y="900" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#F25006">Write E3 V3 M5, not just “GCS 11”</text>
</svg>`)
}

function viewUrl(storagePath: string) {
  return `/api/placements/images/view?path=${encodeURIComponent(storagePath)}`
}

async function uploadBuffer(storagePath: string, buffer: Buffer, contentType: string) {
  const { error } = await sb.storage.from('placements').upload(storagePath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  console.log('  uploaded', storagePath, `(${buffer.length} bytes)`)
  return storagePath
}

function renderPdfToPng() {
  if (!fs.existsSync(LOCAL_PDF)) {
    throw new Error(`Missing PDF at ${LOCAL_PDF}`)
  }
  // High-DPI render via PyMuPDF
  const py = `
import pymupdf
doc = pymupdf.open(r"${LOCAL_PDF.replace(/\\/g, '\\\\')}")
page = doc[0]
# ~300 DPI
mat = pymupdf.Matrix(3.0, 3.0)
pix = page.get_pixmap(matrix=mat, alpha=False)
pix.save(r"${LOCAL_AID_PNG.replace(/\\/g, '\\\\')}")
print(pix.width, pix.height)
`
  const out = execFileSync('python', ['-c', py], { encoding: 'utf-8' })
  console.log('  rendered PDF page:', out.trim())
}

async function main() {
  console.log('Fixing GCS components infographic...')
  const componentsPng = await sharp(gcsComponentsSvg()).png().toBuffer()
  const componentsPath = await uploadBuffer(
    `${IMAGE_DIR}/gcs-components-fy-infographic.png`,
    componentsPng,
    'image/png'
  )

  console.log('Rendering official GCS Assessment Aid from PDF...')
  renderPdfToPng()
  const aidRaw = fs.readFileSync(LOCAL_AID_PNG)
  // Keep quality high: convert to webp q=95 or keep png
  const aidWebp = await sharp(aidRaw).webp({ quality: 95, effort: 5 }).toBuffer()
  const aidPath = await uploadBuffer(
    `${IMAGE_DIR}/gcs-assessment-aid-english.webp`,
    aidWebp,
    'image/webp'
  )

  const componentsFigure = `<figure class="fy-figure"><p style="text-align:center"><img src="${viewUrl(componentsPath)}" alt="Glasgow Coma Scale eye verbal and motor assessment for Foundation doctors" width="1280" loading="lazy" decoding="async" class="fy-img fy-img-wide" /></p><figcaption>Record the individual eye, verbal and motor responses — the components are more useful than a total GCS alone.</figcaption></figure>`

  const aidFigure = `<figure class="fy-figure"><p style="text-align:center"><img src="${viewUrl(aidPath)}" alt="Official Glasgow Coma Scale assessment aid — Eyes, Verbal and Motor scoring guide" width="1280" loading="lazy" decoding="async" class="fy-img fy-img-wide" /></p>
<p class="fy-image-source" style="text-align:center;margin-top:0.25rem;margin-bottom:0.5rem;font-size:0.9rem"><strong>Source:</strong> <a class="fy-source-link" href="${GCS_PDF_URL}" target="_blank" rel="noopener">GCS Assessment Aid (PDF) — glasgowcomascale.org</a></p>
<figcaption>Official GCS assessment aid: check, observe, stimulate and rate Eye / Verbal / Motor responses.</figcaption></figure>`

  const { data: page, error } = await sb
    .from('fy_pages')
    .select('id, content')
    .eq('slug', SLUG)
    .maybeSingle()
  if (error) throw error
  if (!page) throw new Error(`Page ${SLUG} not found`)

  let content = page.content || ''

  // Replace existing components figure block if present; otherwise insert after the h2
  const componentsRe =
    /<figure class="fy-figure">[\s\S]*?gcs-components-fy-infographic\.png[\s\S]*?<\/figure>/i
  if (componentsRe.test(content)) {
    content = content.replace(componentsRe, `${componentsFigure}\n\n${aidFigure}`)
  } else if (content.includes('Measure the GCS properly')) {
    content = content.replace(
      /(<\/h2>\s*)/,
      (_m, h2close) => {
        // Only first occurrence after that heading — safer: find heading then insert
        return h2close
      }
    )
    const heading =
      /(<h2>4\.\s*Measure the GCS properly[\s\S]*?<\/h2>)([\s\S]*?)(<p>The Glasgow Coma Scale)/i
    if (heading.test(content)) {
      content = content.replace(
        heading,
        `$1\n${componentsFigure}\n\n${aidFigure}\n$3`
      )
      // Remove any leftover duplicate old figure after insertion if still there
      content = content.replace(
        /(<figure class="fy-figure">[\s\S]*?gcs-components-fy-infographic\.png[\s\S]*?<\/figure>\s*<figure class="fy-figure">[\s\S]*?gcs-assessment-aid-english\.webp[\s\S]*?<\/figure>)([\s\S]*?)<figure class="fy-figure">[\s\S]*?gcs-components-fy-infographic\.png[\s\S]*?<\/figure>/i,
        '$1'
      )
    } else {
      throw new Error('Could not locate GCS heading/figure insertion point')
    }
  } else {
    throw new Error('Unexpected page content structure')
  }

  // If replace path already injected aid, avoid double-aid
  const aidCount = (content.match(/gcs-assessment-aid-english\.webp/g) || []).length
  if (aidCount > 1) {
    let seen = 0
    content = content.replace(
      /<figure class="fy-figure">[\s\S]*?gcs-assessment-aid-english\.webp[\s\S]*?<\/figure>/gi,
      (m) => {
        seen += 1
        return seen === 1 ? m : ''
      }
    )
  }

  const { error: upErr } = await sb
    .from('fy_pages')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', page.id)
  if (upErr) throw upErr

  console.log('Updated page content.')
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
