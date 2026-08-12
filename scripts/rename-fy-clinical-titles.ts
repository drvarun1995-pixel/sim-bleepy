/**
 * Rename clinical FY titles to topic-first, plain professional SEO titles.
 * Keeps slugs stable (URLs unchanged).
 *
 * Run: $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/rename-fy-clinical-titles.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/** slug → { title, optional content heading replacements } */
const RENAMES: Record<
  string,
  { title: string; replaceHeadings?: Array<[RegExp, string]> }
> = {
  'foundation-doctor-chest-pain': {
    title: 'Chest Pain Assessment: FY Guide',
    replaceHeadings: [
      [
        /Called to a Patient With Chest Pain: A Foundation Doctor Approach/gi,
        'Chest Pain Assessment: FY Guide',
      ],
      [
        /Called to a Patient With Chest Pain: What Should You Do\?/gi,
        'Chest Pain on the Ward: What Should You Do?',
      ],
    ],
  },
  'fy-reduced-gcs-approach': {
    title: 'Reduced GCS Assessment: FY Guide',
    replaceHeadings: [
      [/Called to a Patient With Reduced GCS: An FY Approach/gi, 'Reduced GCS Assessment: FY Guide'],
      [/Called to a Patient With Reduced GCS/gi, 'Reduced GCS on the Ward'],
    ],
  },
  'fy1-approach-to-hypotension': {
    title: 'Hypotension on the Ward: FY Guide',
    replaceHeadings: [
      [/The FY Approach to Hypotension: A Practical Ward Guide/gi, 'Hypotension on the Ward: FY Guide'],
    ],
  },
  'fy1-new-oxygen-requirement': {
    title: 'New Oxygen Requirement: FY Guide',
    replaceHeadings: [
      [
        /The FY Approach to a New Oxygen Requirement: A Practical Guide/gi,
        'New Oxygen Requirement: FY Guide',
      ],
    ],
  },
  'fy1-review-patient-on-call': {
    title: 'On-Call Patient Review: FY Guide',
    replaceHeadings: [
      [
        /How to Review a Patient You(?:'|&#8217;|&apos;)?ve Never Met While On-Call: A Practical FY Guide/gi,
        'On-Call Patient Review: FY Guide',
      ],
    ],
  },
  'confusion-screen-bloods': {
    title: 'Confusion Screen Bloods: FY Guide',
  },
  'fy1-anticoagulation-ward-basics': {
    title: 'Anticoagulation Basics: FY Guide',
    replaceHeadings: [
      [
        /Anticoagulation for Foundation Doctors: The Ward Basics You Need/gi,
        'Anticoagulation Basics: FY Guide',
      ],
    ],
  },
  'fy1-iv-fluid-prescribing': {
    title: 'IV Fluid Prescribing: FY Guide',
    replaceHeadings: [
      [/How to Prescribe IV Fluids as an FY: A Practical Guide/gi, 'IV Fluid Prescribing: FY Guide'],
    ],
  },
  'fy1-potassium-prescribing-hypokalaemia': {
    title: 'Potassium Prescribing: FY Guide',
    replaceHeadings: [
      [
        /How to Prescribe Potassium Safely as an FY: A Practical Guide/gi,
        'Potassium Prescribing: FY Guide',
      ],
    ],
  },
  'what-are-on-call-shifts': {
    title: 'On-Call Shifts Explained: FY Guide',
    replaceHeadings: [
      [/On-Call Shifts for Foundation Doctors: What They Are/gi, 'On-Call Shifts Explained: FY Guide'],
      [/What Are On-Call Shifts\?/gi, 'On-Call Shifts Explained'],
    ],
  },
  'hyponatraemia-foundation-doctors': {
    title: 'Hyponatraemia Assessment: FY Guide',
    replaceHeadings: [
      [
        /Hyponatraemia for Foundation Doctors: A Practical Guide/gi,
        'Hyponatraemia Assessment: FY Guide',
      ],
    ],
  },
  'post-falls-assessment': {
    title: 'Post-Falls Assessment: FY Guide',
    replaceHeadings: [
      [
        /Post-Falls Assessment for Foundation Doctors: A Practical Ward Guide/gi,
        'Post-Falls Assessment: FY Guide',
      ],
    ],
  },
  'dnar-dnacpr-rules-for-doctors-fy-guide': {
    title: 'DNAR and DNACPR Rules: FY Guide',
    replaceHeadings: [
      [/DNAR \/ DNACPR Rules for Doctors: FY Guide/gi, 'DNAR and DNACPR Rules: FY Guide'],
    ],
  },
  'abg-made-easy': {
    title: 'ABG Interpretation: FY Guide',
    replaceHeadings: [
      [/ABG Interpretation Made Easy for Foundation Doctors/gi, 'ABG Interpretation: FY Guide'],
    ],
  },
  'aki-stages-quick-guide': {
    title: 'AKI Stages Explained: FY Guide',
    replaceHeadings: [
      [/AKI Stages Explained: Quick Guide for Junior Doctors/gi, 'AKI Stages Explained: FY Guide'],
    ],
  },
  'ecg-basics-guide': {
    title: 'ECG Basics: FY Guide',
    replaceHeadings: [
      [/ECG Basics for Foundation Doctors: Step-by-Step/gi, 'ECG Basics: FY Guide'],
    ],
  },
}

async function main() {
  const slugs = Object.keys(RENAMES)
  const { data: pages, error } = await sb
    .from('fy_pages')
    .select('id, slug, title, content')
    .in('slug', slugs)
  if (error) throw error

  for (const page of pages || []) {
    const spec = RENAMES[page.slug]
    if (!spec) continue
    let content = page.content || ''
    for (const [re, replacement] of spec.replaceHeadings || []) {
      content = content.replace(re, replacement)
    }
    const { error: upErr } = await sb
      .from('fy_pages')
      .update({
        title: spec.title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id)
    if (upErr) throw upErr
    console.log(`${page.slug}: "${page.title}" → "${spec.title}"`)
  }

  console.log(`\nUpdated ${(pages || []).length} titles.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
