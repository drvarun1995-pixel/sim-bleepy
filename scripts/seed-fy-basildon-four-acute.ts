/**
 * Seed four Basildon-only, login-required FY guides:
 * hypoglycaemia, DKA, upper GI bleed, bradycardia.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-basildon-four-acute.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { formatReadableHtml } from '../lib/fy-readable-html'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const COHORT = 'basildon'
const TOPIC_SLUG = 'on-calls'
const W = 1280
const H = 720
const INFO_H = 900

const ASSETS = [
  path.resolve('assets/fy-unique-new'),
  path.resolve(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-FrostBite-Desktop-V-V1-1-sim-bleepy/assets'
  ),
]

type Post = {
  slug: string
  title: string
  featuredTitle: string
  meta: string
  baseFile: string
  displayOrder: number
  content: (imgs: Record<string, string>) => string
  infographics: Array<{ key: string; file: string; svg: () => Buffer }>
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapTitle(title: string, maxChars = 26): string[] {
  const words = title.trim().split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w
    if (next.length > maxChars && cur) {
      lines.push(cur)
      cur = w
    } else cur = next
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 2)
}

function bannerSvg(titleLines: string[], cat1: string, cat2: string): Buffer {
  const titleFs = titleLines.length > 1 ? 36 : 44
  const titleBlockH = titleLines.length > 1 ? 118 : 92
  const titleY0 = titleLines.length > 1 ? 52 : 62
  const titleTspans = titleLines
    .map((line, i) => {
      const y = titleY0 + i * 46
      return `<text x="640" y="${y}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="${titleFs}" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(line)}</text>`
    })
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="90" y="28" width="1100" height="${titleBlockH}" rx="18" ry="18" fill="#F25006"/>
  ${titleTspans}
  <rect x="160" y="560" width="960" height="110" rx="18" ry="18" fill="#EBA400"/>
  <text x="640" y="605" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat1)}</text>
  <text x="640" y="648" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="34" font-weight="900" fill="#ffffff" letter-spacing="1">${escapeXml(cat2)}</text>
</svg>`)
}

async function composeFeatured(basePath: string, title: string) {
  const lines = wrapTitle(title.toUpperCase())
  const overlay = bannerSvg(lines, 'ON-CALL & ACUTE CARE', 'BASILDON HOSPITAL')
  const whiteMasks = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="70" y="10" width="1140" height="150" rx="20" fill="#ffffff"/>
  <rect x="140" y="540" width="1000" height="150" rx="20" fill="#ffffff"/>
</svg>`)
  const meta = await sharp(basePath).metadata()
  const ratio = meta.width && meta.height ? meta.width / meta.height : 1
  const fit: keyof sharp.FitEnum = ratio >= 1.4 ? 'contain' : 'cover'
  return sharp(basePath)
    .resize(W, H, {
      fit,
      position: 'centre',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .composite([
      { input: await sharp(whiteMasks).png().toBuffer(), top: 0, left: 0 },
      { input: await sharp(overlay).png().toBuffer(), top: 0, left: 0 },
    ])
    .webp({ quality: 88, effort: 5 })
    .toBuffer()
}

function resolveBase(file: string) {
  const found = ASSETS.map((dir) => path.join(dir, file)).find((p) => fs.existsSync(p))
  if (!found) throw new Error(`Missing featured base: ${file}`)
  return found
}

function viewUrl(storagePath: string) {
  return `/api/placements/images/view?path=${encodeURIComponent(storagePath)}`
}

function figure(storagePath: string, alt: string, caption: string) {
  return `<figure class="fy-figure"><img src="${viewUrl(storagePath)}" alt="${alt.replace(/"/g, '&quot;')}" class="fy-img fy-img-wide" /><figcaption>${caption}</figcaption></figure>`
}

function note(text: string) {
  return `<blockquote><p><strong>${text}</strong></p></blockquote>`
}

function eduNote(extra: string) {
  return `<p><em>Educational note: This article is intended as an educational guide for Foundation doctors at Basildon. For individual patients, follow current NICE/BNF guidance and local deteriorating-patient pathways, and seek senior advice when appropriate. ${extra}</em></p>`
}

function cardsSvg(title: string, subtitle: string, items: [string, string][], footer: string): Buffer {
  const cards = items
    .map(([h, s], i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = 80 + col * 560
      const y = 180 + row * 150
      return `
      <rect x="${x}" y="${y}" width="520" height="130" rx="18" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="${x + 260}" y="${y + 55}" text-anchor="middle" font-family="Arial Black" font-size="20" fill="#7F1D1D">${escapeXml(h)}</text>
      <text x="${x + 260}" y="${y + 90}" text-anchor="middle" font-family="Arial" font-size="16" fill="#475569">${escapeXml(s)}</text>`
    })
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">${escapeXml(title)}</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">${escapeXml(subtitle)}</text>
  ${cards}
  <text x="640" y="850" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#F25006">${escapeXml(footer)}</text>
</svg>`)
}

function twoColSvg(
  title: string,
  leftTitle: string,
  leftItems: string[],
  rightTitle: string,
  rightItems: string[],
  footer: string
): Buffer {
  const left = leftItems
    .map(
      (t, i) =>
        `<text x="340" y="${250 + i * 42}" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">${escapeXml(t)}</text>`
    )
    .join('\n')
  const right = rightItems
    .map(
      (t, i) =>
        `<text x="940" y="${250 + i * 42}" text-anchor="middle" font-family="Arial" font-size="17" fill="#334155">${escapeXml(t)}</text>`
    )
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="60" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">${escapeXml(title)}</text>
  <rect x="70" y="110" width="540" height="680" rx="22" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
  <rect x="670" y="110" width="540" height="680" rx="22" fill="#FFF7ED" stroke="#F25006" stroke-width="3"/>
  <text x="340" y="175" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#7F1D1D">${escapeXml(leftTitle)}</text>
  <text x="940" y="175" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#9A3412">${escapeXml(rightTitle)}</text>
  ${left}
  ${right}
  <text x="640" y="860" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#F25006">${escapeXml(footer)}</text>
</svg>`)
}

function checklistSvg(
  title: string,
  sections: Array<{ heading: string; items: string[] }>,
  footer: string
): Buffer {
  const cols = sections
    .map((sec, i) => {
      const x = 50 + i * 310
      const lines = sec.items
        .map(
          (item, n) =>
            `<text x="${x + 145}" y="${250 + n * 48}" text-anchor="middle" font-family="Arial" font-size="15" fill="#334155">${escapeXml(item)}</text>`
        )
        .join('\n')
      return `
      <rect x="${x}" y="140" width="290" height="640" rx="18" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="${x + 145}" y="195" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#7F1D1D">${escapeXml(sec.heading)}</text>
      ${lines}`
    })
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">${escapeXml(title)}</text>
  ${cols}
  <text x="640" y="860" text-anchor="middle" font-family="Arial" font-size="17" font-weight="800" fill="#F25006">${escapeXml(footer)}</text>
</svg>`)
}

function timelineSvg(title: string, steps: [string, string][], footer: string): Buffer {
  const boxes = steps
    .map(([h, s], i) => {
      const y = 130 + i * 130
      return `
      <rect x="120" y="${y}" width="1040" height="110" rx="16" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="180" y="${y + 48}" font-family="Arial Black" font-size="20" fill="#7F1D1D">${escapeXml(h)}</text>
      <text x="180" y="${y + 82}" font-family="Arial" font-size="17" fill="#475569">${escapeXml(s)}</text>`
    })
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">${escapeXml(title)}</text>
  ${boxes}
  <text x="640" y="860" text-anchor="middle" font-family="Arial" font-size="17" font-weight="800" fill="#F25006">${escapeXml(footer)}</text>
</svg>`)
}

function stepsSvg(title: string, subtitle: string, steps: string[], footer: string): Buffer {
  const boxes = steps
    .map((label, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 400
      const y = 180 + row * 220
      return `
      <rect x="${x}" y="${y}" width="360" height="180" rx="18" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <circle cx="${x + 40}" cy="${y + 40}" r="22" fill="#DC2626"/>
      <text x="${x + 40}" y="${y + 47}" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">${i + 1}</text>
      <text x="${x + 180}" y="${y + 110}" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#7F1D1D">${escapeXml(label)}</text>`
    })
    .join('\n')
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="60" text-anchor="middle" font-family="Arial Black" font-size="26" fill="#1E3A5F">${escapeXml(title)}</text>
  <text x="640" y="105" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">${escapeXml(subtitle)}</text>
  ${boxes}
  <text x="640" y="860" text-anchor="middle" font-family="Arial" font-size="17" font-weight="800" fill="#F25006">${escapeXml(footer)}</text>
</svg>`)
}

const POSTS: Post[] = [
  {
    slug: 'hypoglycaemia-on-the-ward-fy-guide',
    title: 'Hypoglycaemia on the Ward: A Practical FY1 Guide',
    featuredTitle: 'HYPOGLYCAEMIA ON THE WARD',
    meta: 'A practical FY1 guide to recognising and treating hypoglycaemia on the ward, including oral glucose, IV glucose, glucagon, monitoring, common causes and preventing recurrence.',
    baseFile: 'fy-unique-hypoglycaemia-on-the-ward.png',
    displayOrder: 10,
    infographics: [
      {
        key: 'pathway',
        file: 'hypoglycaemia-treatment-pathway',
        svg: () =>
          cardsSvg(
            'HYPOGLYCAEMIA TREATMENT PATHWAY',
            'Low capillary glucose → ABCDE → can they swallow safely?',
            [
              ['CONFIRM CBG', 'Diabetes: treat CBG < 4.0 mmol/L promptly'],
              ['SAFE TO SWALLOW?', 'Oral 15–20 g rapid carbohydrate, then recheck'],
              ['CANNOT SWALLOW', 'Senior help + IV 20% glucose or IM glucagon'],
              ['THEN PREVENT', 'Longer-acting carbohydrate, find the cause, recheck'],
            ],
            'TREAT → RECHECK IN 10–15 MIN → FIND WHY → STOP THE NEXT EPISODE'
          ),
      },
      {
        key: 'causes',
        file: 'causes-of-inpatient-hypoglycaemia',
        svg: () =>
          twoColSvg(
            'WHY DID THE PATIENT BECOME HYPOGLYCAEMIC?',
            'MEDICATION / MEDICAL',
            [
              'Excess or mistimed insulin',
              'Sulfonylureas / long-acting insulin',
              'Renal or severe liver impairment',
              'Alcohol with poor intake',
              'Adrenal or pituitary disease',
              'Impaired hypo awareness',
            ],
            'FOOD / WARD FACTORS',
            [
              'Missed or delayed meals',
              'Vomiting or reduced appetite',
              'NBM or prolonged fasting',
              'Feeding / TPN interruption',
              'Mismatch of treatment and carbs',
              'Recovery from acute illness',
            ],
            'FIND THE CAUSE — OR THE NEXT EPISODE IS LIKELY'
          ),
      },
      {
        key: 'reassess',
        file: 'hypoglycaemia-reassessment-checklist',
        svg: () =>
          checklistSvg(
            'AFTER TREATING THE HYPO',
            [
              { heading: 'CONFIRM', items: ['Repeat capillary glucose', 'Symptoms resolved?', 'Safe swallow still?'] },
              { heading: 'REPLACE', items: ['Longer-acting carbohydrate', 'Meal if due', 'IV 10% glucose if NBM'] },
              { heading: 'REVIEW', items: ['Insulin and diabetes drugs', 'Meal timing and intake', 'Renal / liver function'] },
              { heading: 'PREVENT', items: ['Monitor for recurrence', 'Document the episode', 'Escalate if it persists'] },
            ],
            'SUCCESSFUL FIRST TREATMENT IS ONLY STEP ONE'
          ),
      },
    ],
    content: (imgs) => `
<p>A low glucose result can look deceptively simple, but the bedside decisions matter: is the patient conscious, can they swallow safely, is insulin still running, and is this likely to recur? The immediate aim is to raise the glucose safely, then work out why it happened and prevent the next episode.</p>
${note('Confirm the glucose, assess ABCDE, decide whether the patient can swallow safely, treat promptly, recheck, then give longer-acting carbohydrate and investigate the cause.')}

<h2>1. Definition: what counts as hypoglycaemia?</h2>
<p>For ward practice, the treatment threshold should be clear from the outset. In a person with diabetes, a capillary or blood glucose below <strong>4.0 mmol/L</strong> should be treated as hypoglycaemia.</p>
${note('BG / CBG &lt; 4.0 mmol/L = HYPOGLYCAEMIA. Treat promptly, then recheck the glucose after treatment.')}
<p>In non-diabetic patients, the Foundation Year pathway flags a capillary glucose below 3.3 mmol/L as abnormal and requiring assessment. The &lt;4.0 mmol/L treatment threshold above applies to people with diabetes.</p>

<h2>2. Recognise hypoglycaemia quickly</h2>
<p>Hypoglycaemia may present with autonomic symptoms, neuroglycopenic symptoms, or both. Common features include shaking or tremor, sweating, palpitations, sudden hunger, irritability, unusual aggression or confusion, drowsiness, weakness or tiredness, difficulty speaking, incoordination, stumbling or unexplained falls, tingling around the lips or peripheries, nausea, poor concentration, visual disturbance, headache or dizziness.</p>
<p>If the clinical picture suggests hypoglycaemia, check a capillary blood glucose immediately. If a continuous glucose monitor reports a low value, confirm it with a capillary reading before basing treatment on it.</p>
<p>Autonomic symptoms include sweating, tremor, hunger, palpitations and anxiety. Neuroglycopenic symptoms reflect reduced glucose availability to the brain and include confusion, behavioural change, drowsiness, visual disturbance, seizures and coma.</p>
<p>The presentation can be deceptive. Hypoglycaemia may resemble alcohol intoxication, delirium or a psychiatric problem, and it can occasionally produce focal neurological features such as transient weakness. In an acutely confused, drowsy or unexpectedly uncooperative patient, checking glucose early is a high-value bedside step.</p>

<h2>3. Before treatment: assess ABCDE</h2>
${figure(imgs.pathway, 'Adult inpatient hypoglycaemia treatment pathway for Foundation doctors', 'A simple treatment pathway helps Foundation doctors act quickly and safely.')}
<ul>
  <li><strong>A</strong> — Airway</li>
  <li><strong>B</strong> — Breathing</li>
  <li><strong>C</strong> — Circulation</li>
  <li><strong>D</strong> — Disability, including GCS and capillary glucose</li>
  <li><strong>E</strong> — Exposure, including temperature and clues to the cause</li>
</ul>
<p>If the patient has an IV insulin infusion running, stop it immediately while the hypoglycaemia is treated. Once the episode is fully corrected, the insulin infusion can be restarted after the dose and ongoing requirement have been reviewed.</p>
${note('First decision: can the patient take oral treatment safely? If yes, use rapid-acting oral carbohydrate. If no, or if they are significantly impaired, move to urgent parenteral treatment and senior help.')}

<h2>4. Conscious, cooperative and safe to swallow</h2>
<p>Give 15–20 g of rapid-acting carbohydrate. Suitable ward options include glucose tablets, a 15 g oral glucose drink, oral glucose gel, or 150–200 mL fruit juice where appropriate for the patient.</p>
<p>Recheck the capillary glucose after 10–15 minutes. If still below 4.0 mmol/L, repeat the rapid-acting carbohydrate treatment. Repeat up to three treatment cycles in total. If the glucose remains below 4.0 mmol/L after 30–45 minutes or three treatment cycles, call for medical assistance and escalate treatment.</p>
${note('Do not give the initial fast carbohydrate and walk away. The repeat glucose is part of the treatment.')}

<h2>5. Once the glucose is above 4 mmol/L</h2>
<p>When the patient has recovered and the capillary glucose is above 4.0 mmol/L, follow with longer-acting carbohydrate to reduce recurrence: toast or bread, a banana or other suitable fruit, biscuits, 200–300 mL milk, or the normal meal if it is due and contains carbohydrate.</p>
<p>Check the glucose again about one hour after the follow-up carbohydrate. Continued monitoring is particularly important when the cause is not yet clear or when long-acting glucose-lowering medication is involved.</p>
${figure(imgs.reassess, 'Post-treatment hypoglycaemia reassessment checklist', 'Successful initial treatment is only the first step; reassessment and prevention complete the review.')}

<h2>6. Patient cannot safely manage oral treatment</h2>
<p>If the patient is unconscious, severely confused, uncooperative or cannot swallow safely, call for senior help and treat promptly.</p>
<p>If IV access is available, give 100 mL of 20% glucose IV over 15 minutes. Recheck capillary glucose after about 10 minutes and repeat treatment if the glucose remains below 4.0 mmol/L.</p>
<p>If IV access is not available, 1 mg IM glucagon can be used for insulin-induced hypoglycaemia while IV access is being obtained. Glucagon relies on hepatic glycogen stores and may be less effective in prolonged starvation or malnutrition, alcohol misuse, chronic liver disease, adrenal insufficiency, and some sulfonylurea-related episodes. It should not be used repeatedly as a substitute for definitive glucose replacement.</p>
${note('Severe hypoglycaemia with impaired consciousness is an emergency. If IV access is difficult, call for help while treatment is being given rather than waiting for the perfect setup.')}

<h2>7. What if the patient is nil by mouth?</h2>
<p>If the patient is NBM, oral follow-up carbohydrate may not be possible. After the acute episode is corrected, consider 10% glucose at 100 mL/hour until the patient is no longer NBM or has been medically reviewed. Continue regular capillary glucose monitoring and review the insulin regimen.</p>

<h2>8. What if the patient is on IV insulin?</h2>
<p>If an IV insulin infusion is running when the hypo occurs: stop the insulin infusion immediately; treat the hypoglycaemia fully; check capillary glucose every 15 minutes until it is above 4.0 mmol/L; review the insulin dose and clinical context before restarting the infusion; and consider whether concurrent IV glucose or a lower insulin rate is required to prevent recurrence.</p>

<h2>9. Do not automatically omit the next insulin dose</h2>
<p>A common reaction after a hypo is to omit the next insulin dose. That can create a second problem. The insulin that caused the episode may have been given earlier, and the next scheduled dose may still be required.</p>
<p>Instead, review what insulin was active at the time of the hypo, whether the patient is eating, whether they are vomiting or NBM, and whether the prescribed regimen now needs adjustment. Discuss changes with a senior or diabetes team when needed.</p>

<h2>10. Why did the patient become hypoglycaemic?</h2>
${figure(imgs.causes, 'Common inpatient causes of hypoglycaemia', 'Finding the cause is essential to preventing a second episode.')}
<p>Once the immediate episode is treated, look for the cause. In hospital, common medication and medical factors include too much rapid- or short-acting insulin, inappropriate insulin timing, changes to diabetes medication, recovery from acute illness, renal impairment, liver dysfunction, impaired awareness, previous severe hypoglycaemia, IV insulin without adequate glucose substrate, sulfonylurea or long-acting insulin exposure, medication interactions, and endocrine disease where relevant.</p>
<p>Food and ward factors include missed or delayed meals, reduced appetite, vomiting, prolonged fasting/NBM, less carbohydrate than usual, feeding interruption, inability to feed independently, changes in meal timing, mobility or activity, enteral feed interruption or a blocked tube, and TPN or IV glucose interruption.</p>
<p>If the usual explanation does not fit, broaden the differential: alcohol with little food intake, severe liver dysfunction, adrenal insufficiency or pituitary failure, post-bariatric or post-prandial hypoglycaemia, and rarely insulinoma or another endogenous hyperinsulinaemic disorder. Persistent hypotension, electrolyte abnormalities or recurrent unexplained episodes should prompt early senior review rather than repeated treatment alone.</p>

<h2>11. When the hypo is unexplained or keeps recurring</h2>
<p>When there is no obvious insulin, medication or meal-related explanation, do not simply keep treating each low reading without asking why it is happening.</p>
<ul>
  <li>Try to document the glucose while the patient is symptomatic, before treatment if this does not delay urgent care.</li>
  <li>A laboratory glucose can be useful when recurrent unexplained episodes are being investigated because bedside meters are less reliable at very low concentrations.</li>
  <li>Think in terms of Whipple's triad: compatible symptoms, documented low glucose and improvement when the glucose is corrected.</li>
  <li>Review medicines, alcohol intake, nutritional status, renal and liver function, and whether there are clues to adrenal or pituitary disease.</li>
  <li>Consider post-bariatric or post-prandial hypoglycaemia when the history fits.</li>
  <li>Rare causes such as insulinoma are specialist investigations, not something a Foundation doctor is expected to diagnose during the acute episode.</li>
</ul>

<h2>12. Patients at risk of recurrent or prolonged hypoglycaemia</h2>
<p>Be particularly cautious when the episode follows sulfonylurea therapy or long-acting insulin. Hypoglycaemia may recur for 24–36 hours after the last dose, especially if renal function is impaired. These patients need ongoing capillary glucose monitoring and a clear review of the medication plan rather than a single successful glucose check followed by discharge from the problem.</p>

<h2>13. What should you monitor afterwards?</h2>
<ul>
  <li>Repeat glucose at the interval appropriate to the treatment given.</li>
  <li>Continue closer monitoring until readings are consistently above 4.0 mmol/L and the patient is clinically stable.</li>
  <li>Check again one hour after longer-acting carbohydrate or after starting IV 10% glucose if NBM.</li>
  <li>For significant or recurrent episodes, continue regular capillary glucose monitoring for at least 24–48 hours.</li>
  <li>Document the time, symptoms, glucose readings, treatment, response and likely cause.</li>
</ul>

<h2>14. A practical FY1 example</h2>
<p>A patient with diabetes becomes sweaty, irritable and confused before lunch. Capillary glucose is 2.8 mmol/L. They are awake, cooperative and can swallow safely. The behavioural change is part of the hypoglycaemia until proven otherwise.</p>
<ol>
  <li>Assess ABCDE and confirm there is no other immediate instability.</li>
  <li>Give 15–20 g rapid-acting carbohydrate.</li>
  <li>Recheck the capillary glucose after 10–15 minutes.</li>
  <li>If still below 4.0 mmol/L, repeat treatment.</li>
  <li>Once above 4.0 mmol/L and recovered, give longer-acting carbohydrate or the meal if due.</li>
  <li>Review the insulin chart, timing of the last dose and whether the meal was delayed or reduced.</li>
  <li>Recheck again and document the episode and prevention plan.</li>
</ol>

<h2>15. When should an FY1 escalate?</h2>
<ul>
  <li>Reduced consciousness or inability to swallow safely</li>
  <li>Seizure</li>
  <li>Persistent glucose below 4.0 mmol/L despite repeated treatment</li>
  <li>Need for IV glucose or difficulty obtaining IV access</li>
  <li>Recurrent hypoglycaemia</li>
  <li>Suspected sulfonylurea-related hypoglycaemia</li>
  <li>Severe renal or liver impairment</li>
  <li>Unclear cause, concern that the insulin regimen is unsafe, or any associated clinical deterioration</li>
</ul>
<p><strong>The FY1 hypoglycaemia rule:</strong> CONFIRM → ABCDE → SAFE SWALLOW? → RAPID GLUCOSE → RECHECK IN 10–15 MIN → REPEAT IF &lt;4 → LONGER-ACTING CARBOHYDRATE → FIND THE CAUSE → MONITOR FOR RECURRENCE → PREVENT THE NEXT EPISODE.</p>
<p>Treat the low glucose promptly, but do not stop there. The safest ward review includes confirming recovery, identifying why it happened and preventing the next episode.</p>
${eduNote('')}
`.trim(),
  },
  {
    slug: 'dka-management-foundation-year',
    title: 'DKA Management: A Guide for Foundation Year Doctors',
    featuredTitle: 'DKA MANAGEMENT',
    meta: 'A practical Foundation Year guide to diabetic ketoacidosis, covering diagnosis, the first hour, fluids, fixed-rate insulin, potassium, monitoring, treatment targets, complications and transition back to subcutaneous insulin.',
    baseFile: 'fy-unique-dka-management.png',
    displayOrder: 20,
    infographics: [
      {
        key: 'firstHour',
        file: 'dka-first-hour-pathway',
        svg: () =>
          cardsSvg(
            'DKA: THE FIRST HOUR',
            'Several treatments need to happen together, not one after another',
            [
              ['CONFIRM DKA', 'Glucose / known diabetes + ketones + acidosis'],
              ['ASSESS SEVERITY', 'Senior / HDU if high-risk features'],
              ['FLUIDS + FRIII', '0.9% saline, then fixed-rate insulin'],
              ['POTASSIUM + MONITOR', 'Do not add K+ to the first litre'],
            ],
            'NEVER MANAGE THE GLUCOSE IN ISOLATION — FOLLOW KETONES, pH, K+ AND PERFUSION'
          ),
      },
      {
        key: 'monitor',
        file: 'dka-monitoring-dashboard',
        svg: () =>
          cardsSvg(
            'DKA MONITORING DASHBOARD',
            'Management is driven by trends, not a single glucose result',
            [
              ['KETONES DOWN', 'Fall by at least 0.5 mmol/L per hour'],
              ['GLUCOSE DOWN', 'About 3 mmol/L per hour until CBG 14'],
              ['pH / HCO3 UP', 'Bicarbonate rise ≥3 mmol/L per hour'],
              ['K+ IN RANGE', 'Insulin can drop potassium quickly'],
              ['PERFUSION UP', 'Observations and conscious level improve'],
              ['ADD 10% GLUCOSE', 'When CBG <14 — do not stop FRIII'],
            ],
            'IF TARGETS ARE NOT MET, CHECK THE LINES AND CALL A SENIOR'
          ),
      },
      {
        key: 'timeline',
        file: 'dka-0-to-24-hour-timeline',
        svg: () =>
          timelineSvg(
            'DKA TIMELINE: 0 TO 24 HOURS',
            [
              ['0–60 MINUTES', 'Confirm DKA, fluids, FRIII, continue basal insulin, start monitoring'],
              ['1–6 HOURS', 'Hourly CBG/ketones, potassium replacement, add glucose substrate'],
              ['6–12 HOURS', 'Reassess volume status, watch overload and cerebral oedema'],
              ['12–24 HOURS', 'Confirm resolution, overlap and transition insulin'],
              ['RESOLUTION', 'Ketones <0.6 and pH >7.3 — not glucose alone'],
            ],
            'THE FIRST HOUR STARTS TREATMENT. THE NEXT 24 HOURS MAKE IT SAFE.'
          ),
      },
    ],
    content: (imgs) => `
<p>DKA is one of the emergencies where several treatments need to happen together: restore circulating volume, stop ketone production with insulin, prevent potassium-related harm, identify the trigger and monitor closely enough to know whether the patient is actually improving.</p>
<p>For a Foundation Year doctor, the safest way to think about DKA is as a timed pathway rather than a single prescription. The first hour matters, but so do the next 6, 12 and 24 hours.</p>
${note('CONFIRM DKA → ASSESS SEVERITY → IV ACCESS + FLUIDS → FRIII → POTASSIUM → HOURLY MONITORING → ADD GLUCOSE WHEN CBG &lt;14 → TREAT THE TRIGGER → CONFIRM RESOLUTION → TRANSITION INSULIN')}
${figure(imgs.firstHour, 'First-hour diabetic ketoacidosis management pathway for Foundation Year doctors', 'The first hour is about confirming DKA, restoring circulation, starting FRIII and establishing safe monitoring.')}

<h2>1. Confirm the diagnosis</h2>
<p>All three components should be present:</p>
<table>
  <thead><tr><th>Component</th><th>Diagnostic criterion</th></tr></thead>
  <tbody>
    <tr><td>D — Diabetes / glucose</td><td>Capillary blood glucose &gt;11.0 mmol/L, or known diabetes mellitus</td></tr>
    <tr><td>K — Ketones</td><td>Capillary or blood ketones &gt;3.0 mmol/L, or significant ketonuria (2+ or more)</td></tr>
    <tr><td>A — Acidosis</td><td>Venous pH &lt;7.3 and/or bicarbonate &lt;15 mmol/L</td></tr>
  </tbody>
</table>
<p>Typical features include nausea or vomiting, abdominal pain, polyuria, polydipsia, dehydration, tachypnoea/deep breathing, tachycardia, ketotic breath and reduced conscious level. DKA can present with abdominal pain significant enough to mimic a surgical abdomen.</p>
${note('Do not let a normal-looking glucose exclude DKA. Euglycaemic DKA can occur, particularly in people taking SGLT2 inhibitors. If a person with diabetes is unwell, check ketones and acid–base status even if the glucose is not markedly elevated.')}

<h2>2. Is this severe DKA?</h2>
<p>One or more of the following should trigger immediate senior review and consideration of HDU / critical-care level monitoring: blood ketones &gt;6.0 mmol/L; bicarbonate &lt;5 mmol/L; venous or arterial pH &lt;7.0; potassium &lt;3.5 mmol/L on admission; GCS &lt;12 or abnormal AVPU; oxygen saturation &lt;92% on air (assuming normal respiratory baseline); systolic blood pressure &lt;90 mmHg; pulse &gt;100 or &lt;60 bpm; anion gap &gt;16.</p>
${note('Severe DKA is not a routine ward insulin-infusion job. Involve a senior early, and escalate for anaesthetic / critical-care input when indicated.')}

<h2>3. The first hour: what you actually need to do</h2>
<p>Think of the first hour as eight parallel jobs rather than waiting for one step to finish before starting the next.</p>
<p><strong>A. ABCDE and observations</strong> — Rapid ABC assessment; respiratory rate, temperature, blood pressure, pulse and oxygen saturation; GCS / AVPU and NEWS; full clinical examination including volume status and a search for the precipitating cause.</p>
<p><strong>B. Get IV access</strong> — Insert two large-bore IV cannulae. If adequate IV access cannot be obtained, request critical-care support immediately.</p>
<p><strong>C. Send the initial investigations</strong> — CBG and blood ketones; VBG for pH, bicarbonate and potassium; laboratory glucose, U&amp;Es and FBC; anion gap; HbA1c; ECG; urinalysis +/- culture; blood cultures if infection is suspected; chest X-ray if indicated; pregnancy test where relevant; consider lactate, troponin or amylase when the picture suggests they are needed.</p>
<p><strong>D. Start 0.9% sodium chloride</strong> — If SBP is &lt;90 mmHg, give 500 mL 0.9% sodium chloride over 10–15 minutes and reassess; if still &lt;90 mmHg, repeat while awaiting senior input and consider critical-care outreach / ICU. Once SBP is &gt;90 mmHg, give 1 L over the next hour, adding potassium only if required. If SBP is ≥90 mmHg on admission, give 1 L over the first hour. Use a more cautious fluid strategy with frequent reassessment in people aged 18–25, older adults, pregnancy, heart failure, renal failure and other major comorbidity.</p>
<p><strong>E. Start FRIII</strong> — Human soluble insulin 50 units made up to 50 mL with 0.9% sodium chloride (1 unit/mL), start at 0.1 units/kg/hour using actual or estimated body weight, using an insulin unit-graduated syringe. Continue the patient’s usual long-acting basal insulin at the usual dose and time. Do not stop background insulin when FRIII starts. If newly diagnosed or the usual basal dose is unknown, the treatment chart uses 0.2 units/kg of long-acting insulin; involve the diabetes/senior team.</p>
<p><strong>F. Assess potassium before adding potassium</strong> — Do not add potassium to the first litre. Thereafter: &gt;5.5 mmol/L none; 3.5–5.5 mmol/L 40 mmol potassium chloride per litre; &lt;3.5 mmol/L senior / critical-care review with additional potassium replacement. The serum potassium may be normal or high at presentation even though total body potassium is depleted. Insulin and correction of acidosis drive potassium back into cells, so the level can fall quickly during treatment.</p>
<p><strong>G. Identify the precipitating cause</strong> — Infection/sepsis, dehydration, vomiting or diarrhoea, physiological stress or surgery, missed insulin, incorrect dosing or pump failure, steroids, pregnancy, alcohol, and myocardial infarction or pancreatitis where clinically suspected.</p>
<p><strong>H. Involve the diabetes team early</strong> — Particularly for newly diagnosed diabetes, recurrent DKA, insulin-pump users, complex comorbidity or difficulty transitioning off intravenous insulin.</p>

<h2>4. Know your treatment targets</h2>
${figure(imgs.monitor, 'DKA monitoring targets including ketones, glucose, pH, bicarbonate and potassium', 'DKA management is driven by trends, not a single glucose result.')}
<table>
  <thead><tr><th>Target</th><th>Expected change</th></tr></thead>
  <tbody>
    <tr><td>Blood ketones</td><td>Fall by at least 0.5 mmol/L/hour</td></tr>
    <tr><td>Venous bicarbonate</td><td>Rise by at least 3 mmol/L/hour</td></tr>
    <tr><td>Blood glucose</td><td>Fall by about 3 mmol/L/hour until CBG reaches 14 mmol/L</td></tr>
    <tr><td>Potassium</td><td>Maintain within the normal range</td></tr>
    <tr><td>Clinical state</td><td>Improving perfusion, observations and conscious level</td></tr>
  </tbody>
</table>
<p>If the targets are not met, check the IV lines, confirm the insulin pump is connected and working, confirm insulin remains in the syringe, and reassess the patient and precipitating cause. If the equipment is working but biochemical response is inadequate, seek senior review and adjust insulin according to the treatment pathway.</p>

<h2>5. Monitoring: the part of DKA management that prevents harm</h2>
<ul>
  <li>Capillary blood glucose hourly</li>
  <li>Capillary blood ketones hourly until &lt;0.6 mmol/L on consecutive checks</li>
  <li>Venous pH, bicarbonate and potassium at baseline, 1 hour, 2 hours and then every 2 hours</li>
  <li>Serum electrolytes at least 4-hourly</li>
  <li>Regular observations / NEWS</li>
  <li>Accurate fluid balance and urine output; aim for at least 0.5 mL/kg/hour</li>
  <li>Continuous cardiac monitoring if potassium is abnormal or there are cardiac concerns</li>
  <li>Continuous pulse oximetry when clinically required</li>
</ul>
<p>Consider urinary catheterisation if the patient is incontinent or has not passed urine after resuscitation and you need accurate fluid balance. Consider an NG tube with airway protection if the patient is obtunded or persistently vomiting.</p>

<h2>6. When glucose falls below 14 mmol/L, do not stop the insulin</h2>
<p>The aim of FRIII is to stop ketone production and clear ketoacidosis. Glucose often normalises before the ketones and acidosis have resolved. When CBG falls below 14 mmol/L, add 10% glucose at 125 mL/hour alongside 0.9% sodium chloride. Run glucose as a substrate fluid while continuing insulin. If glucose is falling faster than about 3 mmol/L/hour, or falls below 14 mmol/L, consider reducing FRIII to 0.05 units/kg/hour to reduce the risk of hypoglycaemia. Continue to follow ketones, pH, bicarbonate and potassium rather than using glucose alone as the endpoint.</p>
${note('Stopping FRIII because the glucose is now “normal” can allow ketogenesis to restart. DKA is not resolved just because the glucose has corrected.')}

<h2>7. Fluids after the first hour</h2>
<p>After initial resuscitation, continue 0.9% sodium chloride and add potassium according to the latest potassium result. A typical staged schedule is: 1st litre within the first hour; 2nd and 3rd litres over 2 hours each; 4th and 5th litres over 4 hours each; 6th litre over 6 hours; 7th litre over 6 hours if still required. This is not a “set and forget” prescription. Reassess cardiovascular status, urine output, JVP and chest findings, and slow or modify the regimen if there is a risk of fluid overload.</p>
${figure(imgs.timeline, 'DKA management timeline from first hour to resolution', 'A time-based pathway helps prevent premature stopping of insulin and missed monitoring.')}

<h2>8. From 60 minutes to 6 hours</h2>
<p>This phase is about proving that treatment is working and catching complications early: continue hourly CBG and ketones; repeat VBG monitoring; continue staged 0.9% sodium chloride +/- potassium; add 10% glucose once CBG &lt;14 mmol/L; review treatment targets every hour; treat the precipitating cause; monitor urine output and fluid balance; and watch for hypoglycaemia, falling potassium, fluid overload and deterioration in conscious level.</p>

<h2>9. From 6 to 12 hours</h2>
<p>Reassess the patient and repeat the clinical examination. Continue IV fluid replacement at the rate appropriate to volume status. Continue 10% glucose if CBG remains &lt;14 mmol/L while FRIII is still needed. Review venous pH, bicarbonate, potassium and glucose. Reassess cardiovascular status by 12 hours. Check for fluid overload and cerebral oedema. If biochemical targets are not being met, seek senior advice and reassess the insulin infusion and the diagnosis / trigger.</p>

<h2>10. From 12 to 24 hours</h2>
<p>By 24 hours, ketonaemia and acidosis should usually have resolved. If they have not, this requires senior and diabetes-team review. Continue monitoring until clinical and biochemical parameters are normalising. Continue IV fluid if the patient is not yet eating and drinking. Continue basal long-acting insulin while IV insulin is running. Continue treating the precipitating cause. If acidosis has cleared but the patient is not eating and drinking, move to a variable-rate IV insulin infusion rather than simply stopping insulin.</p>

<h2>11. When is DKA resolved?</h2>
<p>Do not declare DKA resolved on glucose alone. Use blood ketones &lt;0.6 mmol/L and venous pH &gt;7.3; bicarbonate should also have recovered (commonly &gt;15 mmol/L). If DKA has not resolved, look for the reason: inadequate insulin delivery, missed monitoring, insufficient fluid replacement, potassium problems, ongoing infection or another untreated precipitant.</p>

<h2>12. Transition back to subcutaneous insulin</h2>
<p>Once DKA has resolved, the next step depends on whether the patient is eating and drinking. If eating and drinking and it is mealtime, convert to the planned subcutaneous insulin regimen. Do not stop IV insulin until rapid-acting subcutaneous insulin has had time to take effect; the treatment chart uses an overlap of about 30–60 minutes. Ensure long-acting basal insulin has been continued / is active before stopping IV insulin. If the patient is not eating and drinking or a meal is not due, convert to a variable-rate IV insulin infusion until ready for subcutaneous treatment. Insulin-pump users should only restart their pump when well enough to self-manage it, with specialist diabetes support. Newly diagnosed type 1 diabetes should have specialist diabetes input before discharge so insulin education, supplies and follow-up are arranged.</p>

<h2>13. Euglycaemic DKA</h2>
<p>DKA can occur with a normal or only mildly raised glucose, particularly in people taking SGLT2 inhibitors. The diagnostic clue is ketosis plus acidosis, not the glucose number. Treat the ketoacidosis with the same underlying principles. Start 10% glucose early because the glucose may already be &lt;14 mmol/L. FRIII starts at 0.1 units/kg/hour; if glucose continues to fall despite glucose substrate, a reduction to 0.05 units/kg/hour may be required. Continue monitoring ketones and acid–base status until resolution.</p>

<h2>14. Patients who need extra caution or earlier escalation</h2>
<p>Age 18–25 years, older adults, pregnancy, heart failure, renal failure / dialysis, severe DKA and major co-morbidity all need extra caution. In these groups, standard fluid volumes can cause harm. Use smaller or slower fluid replacement when appropriate and involve senior / specialist teams early.</p>

<h2>15. DKA in pregnancy</h2>
<p>DKA in pregnancy is both a medical and obstetric emergency. It can occur without marked hyperglycaemia. Arrange urgent medical, obstetric, diabetes and critical-care review. Start IV fluid resuscitation promptly while help is being arranged. Use current pregnancy weight when calculating FRIII. If euglycaemic, start glucose substrate early. Use extra caution with IV fluids and potassium. Optimise maternal condition; fetal monitoring should be arranged by the obstetric team when appropriate.</p>

<h2>16. DKA in end-stage renal failure or dialysis</h2>
<p>This is a specialist situation because the usual dehydration and potassium assumptions may not apply. These patients may have little true fluid deficit; do not automatically give the standard fluid schedule. If genuinely hypovolaemic, use small fluid boluses with frequent reassessment. FRIII remains the main treatment, but insulin clearance is reduced and hypoglycaemia risk is higher. Potassium supplementation is often not required and hyperkalaemia may be significant. Continuous cardiac monitoring and early renal / critical-care involvement may be needed.</p>

<h2>17. Complications to actively look for</h2>
<p>Hypokalaemia or hyperkalaemia; hypoglycaemia; cerebral oedema, particularly with sudden deterioration in conscious level; fluid overload / pulmonary oedema; acute kidney injury; venous thromboembolism; aspiration pneumonia; hypomagnesaemia / hypophosphataemia; pancreatitis or raised pancreatic enzymes; rhabdomyolysis; gastrointestinal bleeding; and sudden neurological deterioration. A sudden fall in GCS during treatment should trigger urgent senior review and consideration of cerebral oedema, with escalation and imaging as clinically appropriate.</p>

<h2>18. Common Foundation Year pitfalls</h2>
<ul>
  <li>Assuming DKA is excluded because glucose is not very high</li>
  <li>Stopping insulin when glucose falls instead of adding glucose substrate</li>
  <li>Forgetting to continue long-acting basal insulin</li>
  <li>Adding potassium to the first bag, or failing to recheck potassium after insulin starts</li>
  <li>Using urinary ketones to decide that DKA has resolved</li>
  <li>Treating the pump rather than the patient when targets are not being met</li>
  <li>Giving the standard fluid schedule to a patient with heart or renal failure without reassessment</li>
  <li>Missing infection because the patient is afebrile, or being reassured by a high white-cell count alone — stress can raise WCC in DKA</li>
</ul>
<p><strong>The Foundation Year DKA checklist:</strong> CONFIRM DKA → CHECK SEVERITY → ABCDE → 2 LARGE-BORE CANNULAE → VBG + KETONES + BLOODS → 0.9% SALINE → FRIII 0.1 U/KG/H → CONTINUE BASAL INSULIN → POTASSIUM BY RESULT → HOURLY CBG + KETONES → ADD 10% GLUCOSE WHEN CBG &lt;14 → TREAT THE TRIGGER → CONFIRM KETONES &lt;0.6 + pH &gt;7.3 → OVERLAP AND TRANSITION INSULIN.</p>
<p>The first hour starts the treatment. The next 24 hours make it safe. In DKA, never manage the glucose in isolation: follow ketones, pH, bicarbonate, potassium, volume status and the patient's clinical trajectory together.</p>
${eduNote('')}
`.trim(),
  },
  {
    slug: 'upper-gi-bleed-on-the-ward-fy-guide',
    title: 'Upper GI Bleed on the Ward: A Guide for Foundation Year Doctors',
    featuredTitle: 'UPPER GI BLEED ON THE WARD',
    meta: 'A practical Foundation Year guide to upper GI bleeding on the ward, covering recognition, ABCDE, resuscitation, investigations, transfusion, variceal bleeding, endoscopy and risk scoring.',
    baseFile: 'fy-unique-upper-gi-bleed.png',
    displayOrder: 30,
    infographics: [
      {
        key: 'pathway',
        file: 'upper-gi-bleed-pathway',
        svg: () =>
          cardsSvg(
            'UPPER GI BLEED: ORDER OF PRIORITIES',
            'Resuscitate first, investigate in parallel, then treat the cause',
            [
              ['RECOGNISE', 'Haematemesis, coffee-ground vomit or melaena'],
              ['UNSTABLE?', 'Senior help, two large-bore IVs, major haemorrhage if needed'],
              ['VARICES?', 'Cirrhosis / portal hypertension changes the pathway'],
              ['THEN ENDOSCOPY', 'GBS at first assessment; definitive control after resuscitation'],
            ],
            'DO NOT WAIT FOR THE HAEMOGLOBIN BEFORE TREATING SHOCK'
          ),
      },
      {
        key: 'variceal',
        file: 'variceal-vs-nonvariceal-ugib',
        svg: () =>
          twoColSvg(
            'NON-VARICEAL VERSUS VARICEAL BLEED',
            'NON-VARICEAL',
            [
              'Peptic ulcer',
              'Gastritis / erosions',
              'Mallory-Weiss tear',
              'Malignancy',
              'Endoscopy is definitive',
              'PPI after endoscopy if indicated',
            ],
            'VARICEAL',
            [
              'Cirrhosis / portal hypertension',
              'Previous varices',
              'Chronic liver disease signs',
              'Early gastro / hepatology',
              'Vasoactive therapy',
              'Prophylactic antibiotics',
            ],
            'A POSSIBLE VARICEAL SOURCE CHANGES THE EARLY PATHWAY'
          ),
      },
      {
        key: 'checklist',
        file: 'gi-bleed-investigation-escalation-checklist',
        svg: () =>
          checklistSvg(
            'GI BLEED: FIRST-HOUR CHECKLIST',
            [
              { heading: 'ASSESS', items: ['ABCDE', 'Haemodynamics', 'Liver disease clues'] },
              { heading: 'BLOODS', items: ['FBC, U&E, LFT', 'Coag + fibrinogen', 'Group & save / X-match'] },
              { heading: 'MONITOR', items: ['Observations', 'ECG if indicated', 'Urine output if unwell'] },
              { heading: 'ESCALATE', items: ['Shock / fresh haematemesis', 'Suspected varices', 'Rebleeding / anticoagulants'] },
            ],
            'GBS AT FIRST ASSESSMENT — THEN GASTRO / ENDOSCOPY'
          ),
      },
    ],
    content: (imgs) => `
<p>A patient has passed black, tarry stool and their blood pressure is lower than earlier. Another has vomited a small amount of coffee-ground material but looks well. A third suddenly produces a large volume of fresh haematemesis. All three may have an upper gastrointestinal bleed, but the urgency is very different.</p>
<p>For a Foundation Year doctor, the safest approach is to follow a pathway: recognise the bleed, assess severity, resuscitate first, investigate in parallel, identify whether variceal bleeding is possible, correct major haemostatic problems with senior support, and arrange timely endoscopy.</p>
${note('RECOGNISE → ABCDE → SENIOR HELP IF UNSTABLE → IV ACCESS + BLOODS + GROUP &amp; SAVE/CROSSMATCH → RESUSCITATE → CORRECT COAGULOPATHY / ANTICOAGULATION ISSUES → CONSIDER VARICEAL BLEED → RISK SCORE → ENDOSCOPY → REASSESS FOR REBLEEDING')}
${note('Do not wait for the haemoglobin result before deciding whether a patient with obvious haemodynamic compromise is bleeding significantly. In acute blood loss, the initial haemoglobin can be misleadingly normal.')}
${figure(imgs.pathway, 'Step-by-step pathway for suspected upper GI bleeding on the ward', 'The pathway keeps the order of priorities clear: stabilise first, investigate in parallel, then treat the cause.')}

<h2>1. Recognise the presentation</h2>
<p>The pathway starts with the clinical picture rather than a single laboratory result. Important presentations include:</p>
<ul>
  <li>Haematemesis — fresh red blood or altered/coffee-ground vomit</li>
  <li>Melaena — black, tarry, often offensive stool caused by altered blood</li>
  <li>Symptoms of anaemia or reduced circulating volume: breathlessness, pallor, chest discomfort, dizziness or postural symptoms</li>
  <li>Abdominal or epigastric pain, which may point towards peptic ulcer disease</li>
  <li>Features of decompensated liver disease, which should raise concern for variceal haemorrhage</li>
</ul>
<p>See <a class="fy-source-link" href="https://www.nhs.uk/symptoms/vomiting-blood-haematemesis/" target="_blank" rel="noopener">NHS: vomiting blood (haematemesis)</a>.</p>

<h2>2. Take a focused history while assessing severity</h2>
<ul>
  <li>How much blood was seen? Fresh red blood, coffee-ground material, melaena or both?</li>
  <li>Was there syncope, dizziness, chest pain or breathlessness?</li>
  <li>Any previous GI bleed, peptic ulcer disease or previous endoscopy?</li>
  <li>Known cirrhosis, portal hypertension or oesophageal/gastric varices?</li>
  <li>Alcohol history and features of chronic liver disease?</li>
  <li>NSAIDs, aspirin, clopidogrel, warfarin, DOACs, steroids or other medicines that increase bleeding risk?</li>
  <li>Repeated retching or vomiting before the bleed, suggesting a possible Mallory-Weiss tear?</li>
  <li>Weight loss, dysphagia or other features that could suggest malignancy?</li>
  <li>Major comorbidity such as ischaemic heart disease, heart failure, renal disease or liver disease?</li>
</ul>

<h2>3. Examination: follow ABCDE, then look for the cause</h2>
<ul>
  <li><strong>A — Airway</strong> — Large-volume haematemesis can threaten the airway. If the patient is vomiting blood, has reduced consciousness or cannot protect the airway, call senior/anaesthetic help immediately.</li>
  <li><strong>B — Breathing</strong> — Respiratory rate, oxygen saturation and work of breathing. Give oxygen if hypoxaemic rather than routinely.</li>
  <li><strong>C — Circulation</strong> — Heart rate, blood pressure, capillary refill, peripheral temperature, urine output and overall perfusion. Tachycardia, postural hypotension, cool peripheries and falling urine output can indicate significant volume loss.</li>
  <li><strong>D — Disability</strong> — GCS/AVPU, confusion or encephalopathy, especially in decompensated liver disease.</li>
  <li><strong>E — Exposure</strong> — Pallor, abdominal tenderness, stigmata of chronic liver disease, ascites, bruising and other clues to the cause.</li>
</ul>
<p>Perform PR examination to confirm melaena where clinically appropriate, and examine the abdomen for tenderness, masses and signs of liver disease or other underlying pathology.</p>
${note('Fresh haematemesis with hypotension, syncope, reduced consciousness or poor perfusion is a resuscitation problem first and a diagnostic problem second.')}

<h2>4. Investigations: do them in parallel with resuscitation</h2>
${figure(imgs.checklist, 'Foundation Year checklist for upper GI bleeding', 'A practical ward checklist helps Foundation Year doctors organise the first hour of a suspected GI bleed.')}
<table>
  <thead><tr><th>Investigation</th><th>Why it matters</th></tr></thead>
  <tbody>
    <tr><td>FBC</td><td>Haemoglobin trend and platelet count. The initial Hb may not reflect the full extent of acute blood loss.</td></tr>
    <tr><td>U&amp;Es</td><td>Renal function, urea and electrolyte abnormalities; a disproportionately raised urea may support an upper GI source.</td></tr>
    <tr><td>LFTs</td><td>Useful when liver disease or variceal bleeding is possible.</td></tr>
    <tr><td>Coagulation + fibrinogen</td><td>Helps identify coagulopathy and guides blood-product decisions in active bleeding.</td></tr>
    <tr><td>Group &amp; save / crossmatch</td><td>Group and save all significant suspected bleeds; crossmatch early if there is ongoing or major blood loss.</td></tr>
    <tr><td>VBG/ABG when unwell</td><td>Can rapidly provide lactate, acid–base information and a point-in-time haemoglobin while formal laboratory tests are pending.</td></tr>
    <tr><td>ECG</td><td>Important in older patients, significant anaemia, chest pain or haemodynamic compromise because myocardial ischaemia can accompany severe blood loss.</td></tr>
    <tr><td>Previous OGD report</td><td>May reveal known ulcers, varices or other previous pathology and can guide the endoscopy team.</td></tr>
  </tbody>
</table>

<h2>5. Immediate management: follow a clear sequence</h2>
<ul>
  <li>Contact a senior immediately if bleeding is profuse or the patient is haemodynamically unstable.</li>
  <li>Consider activating the local major haemorrhage protocol for massive or rapidly ongoing bleeding.</li>
  <li>Obtain two large-bore IV cannulae.</li>
  <li>Keep the patient under close observation and attach appropriate monitoring.</li>
  <li>Send urgent bloods, group &amp; save and crossmatch if significant bleeding is suspected.</li>
  <li>Use IV fluid resuscitation while blood products are being arranged when clinically indicated.</li>
  <li>Consider urinary catheterisation in shocked or significantly unwell patients to monitor urine output.</li>
  <li>Reassess repeatedly — pulse, BP, mental state, perfusion, urine output and ongoing haematemesis/melaena.</li>
</ul>
${note('If the patient is shocked or continuing to bleed heavily, do not let completion of routine ward investigations delay senior escalation, blood-bank communication or a major haemorrhage response.')}

<h2>6. Blood transfusion: do not treat a number in isolation</h2>
<p>NICE advises basing transfusion decisions on the full clinical picture because over-transfusion can be as harmful as under-transfusion. In patients who are not having major haemorrhage or acute coronary syndrome, current NICE transfusion guidance supports a restrictive red-cell threshold around 70 g/L, but the decision in an active GI bleed must incorporate haemodynamics, ongoing blood loss, symptoms and comorbidity. This is particularly important because a patient with a large acute bleed may initially have a deceptively preserved haemoglobin.</p>

<h2>7. Correct coagulopathy — but use the current pathway, not a blanket rule</h2>
<ul>
  <li>Do not give platelets routinely if the patient is not actively bleeding and is haemodynamically stable.</li>
  <li>If actively bleeding and platelets are below 50 × 10⁹/L, offer platelet transfusion.</li>
  <li>If actively bleeding and PT/INR or APTT is greater than 1.5 times normal, offer fresh frozen plasma.</li>
  <li>If fibrinogen remains below 1.5 g/L despite FFP, offer cryoprecipitate.</li>
  <li>If the patient is taking warfarin and actively bleeding, NICE recommends prothrombin complex concentrate; involve senior/haematology support and follow the current reversal protocol.</li>
  <li>For DOAC-associated major bleeding, check the drug, last dose, renal function and current BNF/reversal guidance, and escalate early because specific reversal agents exist for some DOACs.</li>
</ul>

<h2>8. Decide early whether this could be variceal</h2>
${figure(imgs.variceal, 'Comparison of non-variceal and variceal upper GI bleeding', 'Recognising a possible variceal source changes the early treatment pathway.')}
<p>The pathway separates peptic-ulcer and variceal bleeding because the early drug treatment differs. Suspect variceal bleeding when there is known cirrhosis/portal hypertension, previous varices, significant alcohol-related liver disease or other convincing features of chronic liver disease.</p>
<p>NICE recommends offering terlipressin at presentation when variceal bleeding is suspected and giving prophylactic antibiotics at presentation. Current BNF dosing for bleeding oesophageal varices starts with terlipressin 2 mg IV every 4 hours until bleeding is controlled, with dose reduction thereafter if needed; dosing, contraindications and duration should be checked at the point of prescribing because terlipressin has important cardiovascular and respiratory cautions. See <a class="fy-source-link" href="https://bnf.nice.org.uk/drugs/terlipressin-acetate/" target="_blank" rel="noopener">BNF: terlipressin acetate</a>.</p>
${note('If you suspect a variceal bleed, escalate immediately. Starting vasoactive therapy and antibiotics should happen through the senior-led acute GI bleed pathway rather than as an isolated FY prescription.')}

<h2>9. What about IV PPI?</h2>
<p>Do not routinely start acid-suppression treatment before endoscopy for suspected non-variceal upper GI bleeding; current NICE guidance advises against this. After endoscopy, NICE recommends a PPI when non-variceal bleeding shows stigmata of recent haemorrhage. Therefore, do not automatically start a PPI simply because the patient has haematemesis unless your senior/local pathway has a specific indication that is consistent with current guidance.</p>

<h2>10. Endoscopy and specialist input</h2>
<p>Definitive management usually depends on endoscopy, so gastroenterology or hepatology involvement should occur early when appropriate. Unstable patients with severe upper GI bleeding: NICE recommends endoscopy immediately after resuscitation. All other admitted patients with upper GI bleeding: offer endoscopy within 24 hours. Suspected variceal bleeding: involve gastroenterology/hepatology early and ensure the endoscopy team knows varices are suspected. Ongoing bleeding despite endoscopic therapy may require interventional radiology, surgery or advanced hepatology input depending on the source. Patients with severe ongoing bleeding, organ dysfunction or escalating support needs may require HDU/critical care.</p>

<h2>11. Risk scoring: use it, but at the right time</h2>
<p>Use the Glasgow-Blatchford score at first assessment. Use the full Rockall score after endoscopy. A Glasgow-Blatchford score of 0 identifies a very-low-risk group in whom early discharge can be considered, but this is a senior decision and depends on the whole clinical context.</p>
${note('A hypotensive patient with active haematemesis needs resuscitation and senior help now. Calculate the score after the immediate priorities are under control.')}

<h2>12. Reassess for rebleeding</h2>
<p>Deterioration can be subtle before the blood pressure falls. Watch for rising heart rate; falling blood pressure or worsening postural symptoms; reduced urine output or worsening peripheral perfusion; fresh haematemesis; new or fresh melaena after apparent control; falling haemoglobin on serial testing; and reduced conscious level. A suspected rebleed should trigger urgent senior and endoscopy-team review rather than a routine repeat blood test and wait.</p>

<h2>13. A practical Foundation Year example</h2>
<p>A patient with alcohol-related cirrhosis develops fresh haematemesis on the ward. They are tachycardic, their blood pressure is falling and they look clammy.</p>
<ol>
  <li>Recognise a severe upper GI bleed with possible variceal source.</li>
  <li>Call senior help immediately and consider the major haemorrhage pathway.</li>
  <li>Start ABCDE; protect the airway and involve anaesthetics early if airway protection is a concern.</li>
  <li>Insert two large-bore IV cannulae and send urgent bloods, coagulation/fibrinogen, group &amp; save and crossmatch.</li>
  <li>Resuscitate while monitoring BP, perfusion, mental state and urine output.</li>
  <li>Flag known cirrhosis/possible varices clearly to the senior and endoscopy team.</li>
  <li>Start variceal-bleed treatment under the senior-led pathway, including terlipressin and prophylactic antibiotics when appropriate.</li>
  <li>Arrange urgent endoscopy after resuscitation.</li>
  <li>Continue to reassess — a temporary improvement in BP does not mean the bleeding has stopped.</li>
</ol>

<h2>14. When should a Foundation Year doctor escalate immediately?</h2>
<ul>
  <li>Fresh or profuse haematemesis</li>
  <li>Shock, hypotension, syncope or poor peripheral perfusion</li>
  <li>Reduced GCS or concern about airway protection</li>
  <li>Ongoing bleeding despite initial resuscitation</li>
  <li>Known/suspected cirrhosis or variceal bleeding</li>
  <li>Significant coagulopathy, thrombocytopenia or anticoagulant-associated bleeding</li>
  <li>Chest pain or suspected myocardial ischaemia during the bleed</li>
  <li>Need for blood products, major haemorrhage activation or urgent endoscopy</li>
  <li>Evidence of rebleeding after initial haemostasis, or any situation where the patient is deteriorating</li>
</ul>
<p><strong>The Foundation Year GI bleed rule:</strong> RECOGNISE → ABCDE → SENIOR HELP → TWO LARGE-BORE IVs → BLOODS + GROUP &amp; SAVE/CROSSMATCH → RESUSCITATE → CORRECT COAGULOPATHY/ANTICOAGULATION → THINK VARICES → GBS → ENDOSCOPY → REASSESS FOR REBLEEDING.</p>
<p>The most useful part of an upper GI bleed pathway is the order: resuscitation first, investigations in parallel, cause-specific treatment next, then definitive endoscopic control. As a Foundation Year doctor, recognising severity and escalating early is more important than memorising every drug dose.</p>
${eduNote('See <a class="fy-source-link" href="https://www.nice.org.uk/guidance/cg141" target="_blank" rel="noopener">NICE CG141</a> for acute upper gastrointestinal bleeding.')}
`.trim(),
  },
  {
    slug: 'bradycardia-management-foundation-year',
    title: 'Bradycardia Management: A Guide for Foundation Year Doctors',
    featuredTitle: 'BRADYCARDIA MANAGEMENT',
    meta: 'A practical guide to bradycardia management for Foundation Year doctors, covering assessment of a slow heart rate, ECG findings, reversible causes, atropine, pacing and escalation.',
    baseFile: 'fy-unique-bradycardia-management.png',
    displayOrder: 40,
    infographics: [
      {
        key: 'first',
        file: 'bradycardia-first-assessment-flowchart',
        svg: () =>
          cardsSvg(
            'BRADYCARDIA: FIRST ASSESSMENT',
            'Decide whether the patient is compromised before naming the rhythm',
            [
              ['ABCDE FIRST', 'Airway, breathing, circulation, GCS, glucose'],
              ['ADVERSE FEATURES', 'Shock, syncope, heart failure, ischaemia'],
              ['MONITOR + ECG', '12-lead ECG, cardiac monitoring, IV access'],
              ['IF COMPROMISED', 'Senior help, crash trolley, treat while assessing'],
            ],
            'START WITH STABILITY, NOT THE HEART-RATE NUMBER'
          ),
      },
      {
        key: 'asystole',
        file: 'bradycardia-risk-of-asystole',
        svg: () =>
          cardsSvg(
            'BRADYCARDIA: RISK OF ASYSTOLE',
            'Escalate early even if the patient currently looks reasonably well',
            [
              ['RECENT ASYSTOLE', 'High risk of further collapse'],
              ['MOBITZ II AV BLOCK', 'Unstable conduction — senior/cardiology'],
              ['COMPLETE HEART BLOCK', 'Especially with a broad QRS'],
              ['PAUSE > 3 SECONDS', 'Pacing may be required'],
            ],
            'TREAT THE PATIENT, NOT JUST THE HEART RATE'
          ),
      },
      {
        key: 'framework',
        file: 'foundation-year-bradycardia-framework',
        svg: () =>
          stepsSvg(
            'FOUNDATION YEAR BRADYCARDIA FRAMEWORK',
            'A simple sequence keeps the focus on stability and early escalation',
            [
              'ASSESS PATIENT',
              'ABCDE',
              'ECG + MONITORING',
              'ADVERSE FEATURES',
              'REVERSIBLE CAUSES',
              'ATROPINE IF NEEDED',
              'REASSESS',
              'RISK OF ASYSTOLE',
              'SENIOR / PACING',
            ],
            'DO NOT START PACING OR INFUSIONS ALONE'
          ),
      },
    ],
    content: (imgs) => `
<p>A heart rate of 38 appears on the observations chart. The number matters, but it does not tell you on its own whether the patient is in danger. One patient with a pulse of 40 may be comfortable and well perfused; another may be hypotensive, confused and peri-arrest.</p>
<p>For a Foundation Year doctor, the safest approach is to assess the patient first, identify adverse features, obtain an ECG, look for reversible causes and bring senior help in early when treatment or pacing may be needed.</p>
${note('Treat the patient, not just the heart rate. Clinical instability and the risk of asystole matter more than the number on the monitor.')}

<h2>1. What counts as bradycardia?</h2>
<p>Bradycardia is usually defined as a heart rate below 60 beats per minute. It is not automatically pathological. Fit young people and trained athletes can have low resting heart rates without symptoms. The important question is whether the slow rate is causing, or is associated with, clinical compromise.</p>

<h2>2. First decide: stable or unstable?</h2>
${figure(imgs.first, 'ABCDE and adverse-feature assessment for bradycardia', 'Start by deciding whether the patient is compromised before focusing on the rhythm diagnosis.')}
<p>The assessment pathway highlights four adverse features: shock, syncope, heart failure and myocardial ischaemia. In practical terms, look for hypotension, poor peripheral perfusion, altered consciousness, ongoing chest pain or ischaemic ECG changes, pulmonary oedema, severe breathlessness or collapse.</p>
${note('If adverse features are present: call for help, get the crash trolley, contact a senior immediately and continue ABCDE while preparing for treatment.')}

<h2>3. Start with ABCDE</h2>
<ul>
  <li><strong>A — Airway</strong> — Confirm the airway is patent. Reduced consciousness may make airway support necessary.</li>
  <li><strong>B — Breathing</strong> — Check respiratory rate, oxygen saturations and work of breathing. Give oxygen if the patient is hypoxic, using an appropriate target range.</li>
  <li><strong>C — Circulation</strong> — Check the heart rate manually, blood pressure, capillary refill, peripheral perfusion and signs of heart failure. Attach cardiac monitoring and obtain IV access.</li>
  <li><strong>D — Disability</strong> — Assess GCS or AVPU and check capillary blood glucose. Syncope, confusion or reduced consciousness can indicate poor cerebral perfusion.</li>
  <li><strong>E — Exposure</strong> — Look for fever, hypothermia, signs of infection, trauma and other clues to a reversible cause.</li>
</ul>

<h2>4. Get a 12-lead ECG early</h2>
<p>The ECG is essential because the same heart rate can arise from very different rhythms. Try to identify whether this is sinus bradycardia, atrioventricular (AV) block, atrial fibrillation with a slow ventricular response, atrial flutter with high-degree block, or a junctional bradycardia. Do not worry if you cannot name every conduction abnormality immediately. What matters is recognising high-risk patterns and involving senior help. Mobitz II AV block and complete heart block with a broad QRS are specifically highlighted as markers of increased risk of asystole.</p>

<h2>5. Look for reversible causes</h2>
<table>
  <thead><tr><th>Cause group</th><th>Examples</th></tr></thead>
  <tbody>
    <tr><td>Cardiac</td><td>Inferior MI, degenerative conduction disease, sick sinus syndrome, myocarditis, cardiomyopathy and heart block</td></tr>
    <tr><td>Metabolic / physiological</td><td>Hyperkalaemia, hypoxia, hypothermia and physiological bradycardia in fit people</td></tr>
    <tr><td>Endocrine</td><td>Hypothyroidism and adrenal insufficiency</td></tr>
    <tr><td>Reflex / neurological</td><td>Vasovagal episodes; raised intracranial pressure can produce bradycardia with hypertension and abnormal breathing</td></tr>
    <tr><td>Medication-related</td><td>Beta-blockers, digoxin, verapamil, diltiazem and amiodarone</td></tr>
  </tbody>
</table>
<p>Treating the reversible cause is often the most important intervention. For example, correct significant electrolyte abnormalities, treat hypoxia, review rate-slowing medicines and assess for acute myocardial ischaemia.</p>

<h2>6. Initial investigations</h2>
<p>A focused initial work-up commonly includes 12-lead ECG, continuous cardiac monitoring, full observations, IV access, U&amp;Es including potassium, magnesium and calcium, glucose, FBC where anaemia or infection is relevant, troponin if myocardial ischaemia is suspected, thyroid tests if the presentation suggests hypothyroidism or the cause remains unexplained, and a digoxin level if the patient is taking digoxin and toxicity is possible. Further testing should be driven by the clinical context rather than becoming an automatic bradycardia bundle.</p>

<h2>7. When is atropine used?</h2>
<p>If bradycardia is associated with adverse features, intravenous atropine is first-line. Give atropine 500 micrograms IV. If the response is inadequate and adverse features persist, the pathway allows repeated 500 microgram IV doses up to a total of 3 mg while senior help and further measures are arranged. See <a class="fy-source-link" href="https://bnf.nice.org.uk/drugs/atropine-sulfate/" target="_blank" rel="noopener">BNF: atropine sulfate</a>.</p>
<p>The decision to use atropine should not delay escalation in a deteriorating patient. It may also be ineffective in some forms of high-grade conduction block, so think ahead about pacing.</p>

<h2>8. Did the patient respond?</h2>
<p>After atropine, reassess the patient rather than focusing only on whether the heart rate increased: has the blood pressure improved; has syncope or presyncope resolved; has chest pain or ischaemia improved; has pulmonary oedema or heart-failure compromise improved; and is the patient now alert and adequately perfused? If the adverse features have not improved, escalate immediately and move to interim measures with senior support.</p>
${figure(imgs.asystole, 'Risk of asystole features in a patient with bradycardia', 'High-risk conduction features should trigger early senior and cardiology involvement.')}

<h2>9. Check the risk of asystole</h2>
<p>Even if the patient does not currently have adverse features, the pathway asks whether they have features that make progression to asystole more likely: recent asystole; Mobitz II AV block; complete heart block with a broad QRS; or a ventricular pause longer than 3 seconds. If any of these are present, involve a senior and cardiology early. The patient may need temporary pacing even if they currently look reasonably well.</p>
${figure(imgs.framework, 'Foundation Year approach to bradycardia on the ward', 'A simple framework keeps the focus on stability, reversible causes and early escalation.')}

<h2>10. If atropine is insufficient: interim measures</h2>
<p>If significant bradycardia persists despite atropine, or there is a high risk of asystole, this becomes senior-led management. The pathway includes repeating atropine up to the stated maximum total dose, transcutaneous pacing, isoprenaline infusion, adrenaline infusion, and other cause-specific treatment where appropriate.</p>
${note('Do not independently start pacing or vasoactive infusions because the algorithm is on your phone. These are escalation treatments requiring appropriate senior, monitoring and resuscitation support.')}

<h2>11. Pacing: what does the Foundation Year doctor need to know?</h2>
<p>If atropine fails and the patient remains compromised, transcutaneous pacing may be used as a bridge while expert help is obtained. The pathway then directs the team towards expert assessment and transvenous pacing when needed. As the Foundation Year doctor, your practical role is to recognise early that pacing may be needed; call senior / resuscitation help; ensure monitoring and IV access are in place; get the crash trolley / pacing-capable defibrillator; continue ABCDE and reassessment; and help prepare the patient and equipment while the senior team leads pacing. If a patient is paced, electrical capture on the monitor does not automatically mean effective circulation. A pulse and clinical perfusion must still be checked.</p>

<h2>12. Medication review can reveal the diagnosis</h2>
<p>Always check the drug chart. Particularly look for beta-blockers, digoxin, verapamil, diltiazem and amiodarone. Do not simply stop long-term cardiac medication without considering the indication and the clinical context, but suspected medication-related bradycardia should be highlighted to the senior reviewing the patient. Glucagon is a potential treatment in beta-blocker or calcium-channel blocker overdose. This is a specialist / toxicology-led situation rather than routine ward bradycardia management.</p>

<h2>13. A practical Foundation Year example</h2>
<p>A patient admitted with an inferior myocardial infarction develops a heart rate of 36. They feel dizzy, their blood pressure has fallen and the ECG shows a new conduction abnormality.</p>
<ol>
  <li>Recognise this as bradycardia with adverse features.</li>
  <li>Call for senior help and get the crash trolley.</li>
  <li>Start ABCDE and attach continuous cardiac monitoring.</li>
  <li>Obtain a 12-lead ECG and IV access.</li>
  <li>Treat hypoxia if present and check reversible causes.</li>
  <li>Give atropine according to the emergency pathway while senior help is present or en route.</li>
  <li>Reassess symptoms, blood pressure and perfusion immediately.</li>
  <li>If the response is inadequate, prepare for pacing / further senior-led treatment rather than repeatedly waiting for the heart rate to improve on its own.</li>
</ol>

<h2>14. When should you escalate immediately?</h2>
<ul>
  <li>Shock or significant hypotension</li>
  <li>Syncope or recurrent presyncope</li>
  <li>Myocardial ischaemia</li>
  <li>Acute heart failure / pulmonary oedema</li>
  <li>Mobitz II AV block</li>
  <li>Complete heart block, particularly with a broad QRS</li>
  <li>Recent asystole or prolonged ventricular pauses</li>
  <li>Persistent adverse features despite atropine</li>
  <li>Need for transcutaneous or transvenous pacing</li>
  <li>Suspected drug toxicity or severe electrolyte disturbance, or any situation where the patient's clinical state is deteriorating</li>
</ul>
<p><strong>The Foundation Year bradycardia rule:</strong> ASSESS THE PATIENT → ABCDE → LOOK FOR ADVERSE FEATURES → ECG + MONITORING + IV ACCESS → TREAT REVERSIBLE CAUSES → ATROPINE IF COMPROMISED → REASSESS → CHECK RISK OF ASYSTOLE → ESCALATE EARLY FOR PACING / SENIOR-LED TREATMENT.</p>
<p>A slow heart rate is not automatically dangerous. The dangerous combination is bradycardia with poor perfusion, adverse features or high-risk conduction disease. Assess the patient, not just the monitor.</p>
${eduNote('See <a class="fy-source-link" href="https://bnf.nice.org.uk/drugs/atropine-sulfate/" target="_blank" rel="noopener">BNF: atropine sulfate</a> at the point of prescribing.')}
`.trim(),
  },
]

async function uploadBuffer(storagePath: string, body: Buffer, contentType: string) {
  await sb.storage.from('placements').remove([storagePath])
  const { error } = await sb.storage.from('placements').upload(storagePath, body, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  return storagePath
}

async function ensureTopic() {
  const { data: existing } = await sb
    .from('fy_topics')
    .select('id')
    .eq('cohort', COHORT)
    .eq('slug', TOPIC_SLUG)
    .maybeSingle()
  if (existing?.id) {
    await sb
      .from('fy_topics')
      .update({
        name: 'On-calls',
        description: 'Basildon on-call and acute ward guides for foundation doctors',
        display_order: 3,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    return existing.id as string
  }
  const { data, error } = await sb
    .from('fy_topics')
    .insert({
      cohort: COHORT,
      slug: TOPIC_SLUG,
      name: 'On-calls',
      description: 'Basildon on-call and acute ward guides for foundation doctors',
      display_order: 3,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

async function upsertPage(post: Post, topicId: string, content: string, featuredPath: string) {
  const { data: existing } = await sb.from('fy_pages').select('id').eq('slug', post.slug).maybeSingle()
  const payload: Record<string, unknown> = {
    topic_id: topicId,
    title: post.title,
    content,
    featured_image: featuredPath,
    status: 'published',
    is_active: true,
    requires_auth: true,
    display_order: post.displayOrder,
    meta_description: post.meta,
    updated_at: new Date().toISOString(),
  }
  if (existing?.id) {
    let { error } = await sb.from('fy_pages').update(payload).eq('id', existing.id)
    if (error?.message?.includes('meta_description')) {
      delete payload.meta_description
      ;({ error } = await sb.from('fy_pages').update(payload).eq('id', existing.id))
    }
    if (error) throw error
    console.log(`  updated ${existing.id}`)
    return existing.id as string
  }
  const insertPayload = { slug: post.slug, ...payload }
  let { data, error } = await sb.from('fy_pages').insert(insertPayload).select('id').single()
  if (error?.message?.includes('meta_description')) {
    delete (insertPayload as any).meta_description
    ;({ data, error } = await sb.from('fy_pages').insert(insertPayload).select('id').single())
  }
  if (error) throw error
  console.log(`  created ${data!.id}`)
  return data!.id as string
}

async function main() {
  const topicId = await ensureTopic()
  const skipImages = process.argv.includes('--content-only')
  for (const post of POSTS) {
    console.log(`\n=== ${post.slug}`)
    const imageDir = `foundation-year/${COHORT}/${TOPIC_SLUG}/${post.slug}/images`
    const featuredPath = `${imageDir}/featured-bleepy-unique.webp`
    const imgs: Record<string, string> = {}
    if (!skipImages) {
      const featuredWebp = await composeFeatured(resolveBase(post.baseFile), post.featuredTitle)
      await uploadBuffer(featuredPath, featuredWebp, 'image/webp')
    }
    for (const info of post.infographics) {
      const storagePath = `${imageDir}/${info.file}.png`
      if (!skipImages) {
        const png = await sharp(info.svg()).png().toBuffer()
        await uploadBuffer(storagePath, png, 'image/png')
      }
      imgs[info.key] = storagePath
    }

    await upsertPage(
      post,
      topicId,
      formatReadableHtml(post.content(imgs), { splitAllSentences: true }),
      featuredPath
    )
    console.log(`  /placements/foundation-year/${COHORT}/${TOPIC_SLUG}/${post.slug}`)
  }
  console.log('\nDone. Members-only Basildon on-calls.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
