/**
 * Seed / refresh the on-call Foundation Year article with images from bleepy.co.uk
 * Run: $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy-on-call-post.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TITLE = 'What Are On-Call Shifts?'
const SLUG = 'what-are-on-call-shifts'
const SCOPE = 'foundation-year/general/working-on-calls'
const IMAGE_DIR = `${SCOPE}/${SLUG}/images`

const SOURCES = {
  featured: {
    url: 'https://bleepy.co.uk/wp-content/uploads/2025/08/What-are-on-call-shifts.webp',
    file: 'featured.webp',
    contentType: 'image/webp',
  },
  giphy3: {
    url: 'https://i0.wp.com/scrubtales.co.uk/wp-content/uploads/giphy-3.gif?fit=480%2C256&ssl=1',
    file: 'giphy-3.gif',
    contentType: 'image/gif',
  },
  giphy4: {
    url: 'https://i0.wp.com/scrubtales.co.uk/wp-content/uploads/giphy-4.gif?fit=398%2C478&ssl=1',
    file: 'giphy-4.gif',
    contentType: 'image/gif',
  },
  team: {
    url: 'https://i0.wp.com/scrubtales.co.uk/wp-content/uploads/Medical-on-call-team.png?fit=1536%2C1024&ssl=1',
    file: 'medical-on-call-team.webp',
    contentType: 'image/webp',
    convertWebp: true,
  },
  duties: {
    url: 'https://scrubtales.co.uk/wp-content/uploads/What-Doctors-Actually-Do-During-NHS-On-Call-Shifts.png',
    file: 'what-doctors-actually-do.webp',
    contentType: 'image/webp',
    convertWebp: true,
  },
  proforma: {
    url: 'https://i0.wp.com/scrubtales.co.uk/wp-content/uploads/Medical-Admissions-Clerking-proforma.png?fit=1280%2C1811&ssl=1',
    file: 'clerking-proforma.webp',
    contentType: 'image/webp',
    convertWebp: true,
  },
  giphy5: {
    url: 'https://i0.wp.com/scrubtales.co.uk/wp-content/uploads/giphy-5.gif?fit=480%2C366&ssl=1',
    file: 'giphy-5.gif',
    contentType: 'image/gif',
  },
  giphy6: {
    url: 'https://i0.wp.com/scrubtales.co.uk/wp-content/uploads/giphy-6.gif?fit=480%2C362&ssl=1',
    file: 'giphy-6.gif',
    contentType: 'image/gif',
  },
  accurx: {
    url: 'https://i0.wp.com/scrubtales.co.uk/wp-content/uploads/Accurx-Induction-Switch-App.png?fit=1080%2C1920&ssl=1',
    file: 'accurx-induction.webp',
    contentType: 'image/webp',
    convertWebp: true,
  },
  handbook: {
    url: 'https://i0.wp.com/scrubtales.co.uk/wp-content/uploads/Foundation-Year-Doctor-Handbook-App.png?fit=657%2C1526&ssl=1',
    file: 'foundation-handbook.webp',
    contentType: 'image/webp',
    convertWebp: true,
  },
  giphy7: {
    url: 'https://i0.wp.com/scrubtales.co.uk/wp-content/uploads/giphy-7.gif?fit=480%2C364&ssl=1',
    file: 'giphy-7.gif',
    contentType: 'image/gif',
  },
} as const

type SourceKey = keyof typeof SOURCES

function viewUrl(path: string) {
  return `/api/placements/images/view?path=${encodeURIComponent(path)}`
}

function img(path: string, alt: string, className = '') {
  const cls = className ? ` class="${className}"` : ''
  return `<p style="text-align:center"><img src="${viewUrl(path)}" alt="${alt}"${cls} /></p>`
}

async function downloadAndUpload(key: SourceKey): Promise<string> {
  const source = SOURCES[key]
  console.log(`Downloading ${key}...`)
  const res = await fetch(source.url)
  if (!res.ok) throw new Error(`Failed to download ${key}: ${res.status}`)
  let buffer: Buffer = Buffer.from(await res.arrayBuffer())
  let contentType = source.contentType
  let file = source.file

  if ('convertWebp' in source && source.convertWebp) {
    buffer = Buffer.from(await sharp(buffer).webp({ quality: 82, effort: 4 }).toBuffer())
    contentType = 'image/webp'
  }

  const path = `${IMAGE_DIR}/${file}`
  const { error } = await supabase.storage.from('placements').upload(path, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })

  if (error) throw new Error(`Upload failed for ${key}: ${error.message}`)
  console.log(`  -> ${path}`)
  return path
}

function buildContent(paths: Record<SourceKey, string>) {
  return `
<p>If you’re a doctor new to the NHS, you’ve probably wondered: <strong>“What exactly happens during an on-call shift?”</strong></p>
<p>You hear terms like clerking, ward cover, night shifts, post-take rounds — but no one really explains what you’ll be doing hour to hour. I had the same questions before starting my first on-call rota.</p>
${img(paths.giphy3, 'On-call shift reaction', 'fy-img fy-img-gif')}
<p>I learned through experience that NHS on-call shifts are intense but manageable if you know:</p>
<ul>
  <li><strong>Who’s on your team:</strong> Consultant on-call, registrar, SHOs, FY doctors.</li>
  <li><strong>What your actual tasks are:</strong> Clerking, ward cover, night duties, chasing results.</li>
  <li><strong>How to manage stress, time, and escalation:</strong> Especially as a new doctor adjusting to UK protocols.</li>
</ul>
<p>In this guide, I’ll break down exactly what happens during NHS on-call shifts, how rota banding pay works, and share practical tips I wish I knew before my first shift.</p>

<h2>NHS On-Call Pay and Perks: What New Doctors Should Know</h2>
<p>Many new doctors ask: “Is doing NHS on-call worth it for the pay?” Realistically, on-call shifts can be tiring, but they do come with financial and professional benefits.</p>

<h3>How NHS On-Call Banding Works</h3>
<ul>
  <li>NHS on-call shifts attract additional pay through something called <strong>rota banding</strong>.</li>
  <li>For most full-time junior doctors, especially those at the IMT and SHO levels, this is typically a <strong>40% or 50% banding</strong> on top of their basic salary.</li>
</ul>
<blockquote>
<p><strong>Example (2025):</strong> FY2 basic pay ~£37,303/year + 50% banding (~£18,650) = about <strong>£55,950/year</strong> before tax. Banding varies with rota intensity (nights, weekends, frequency).</p>
</blockquote>
${img(paths.giphy4, 'On-call pay reaction', 'fy-img fy-img-gif')}

<h3>Professional Perks Beyond Pay</h3>
<ul>
  <li><strong>Faster clinical learning:</strong> Especially in clerking, emergency management, and escalation skills.</li>
  <li><strong>Better MRCP preparation:</strong> Real-world exposure helps reinforce exam topics such as ECGs and ABGs.</li>
  <li><strong>Team integration:</strong> Build relationships with registrars, consultants, and nursing teams.</li>
  <li><strong>Confidence boosting:</strong> Once you’ve done the toughest jobs, ward work feels more manageable.</li>
</ul>

<h2>NHS On-Call Team Structure: Who’s Who on Shift</h2>
<p>Before your first NHS on-call shift, know exactly who is on your team. Many new doctors feel lost early on simply because they don’t know who to escalate to.</p>

<h3>Consultant On-Call</h3>
<ul>
  <li>Senior-most doctor for major clinical decisions and post-take rounds.</li>
  <li>Usually not physically present overnight, but always contactable via registrar.</li>
</ul>

<h3>Registrar (Medical Registrar / Med Reg)</h3>
<ul>
  <li>Main point of senior support during on-call shifts.</li>
  <li>Reviews complex cases, accepts referrals, and supports junior decision-making.</li>
  <li>Covers multiple wards and admissions overnight.</li>
</ul>

<h3>SHOs (Senior House Officers)</h3>
<p>Includes IMT1–3 doctors, ST1–2 doctors in other specialities, and trust-grade doctors. SHOs handle most clerking, ward cover, and reviews before registrar involvement.</p>

<h3>Foundation Doctors (FY1–FY2)</h3>
<ul>
  <li><strong>FY1:</strong> Primarily ward cover; not usually responsible for clerking new patients alone.</li>
  <li><strong>FY2:</strong> More independent — clerking, ward cover, and basic escalation expected.</li>
</ul>

<h2>Early Ward Round and Team Introduction</h2>
<p>Before each on-call shift there is usually a team meeting or early ward round where everyone introduces themselves:</p>
<ul>
  <li>Consultant, registrar, SHOs, and FY1–FY2 doctors state their name and role.</li>
  <li>This clarifies who is responsible for what.</li>
  <li><strong>Practical tip:</strong> Speak up confidently so the team knows you’re on the rota.</li>
</ul>
<p>You are also issued a bleep for your role — carry it throughout your shift.</p>
${img(paths.team, 'Medical on-call team', 'fy-img fy-img-wide')}

<h2>What Doctors Actually Do During NHS On-Call Shifts</h2>
${img(paths.duties, 'What doctors actually do during NHS on-call shifts', 'fy-img fy-img-wide')}
<p>On paper the job says clerking, ward cover, and night shifts — here’s what that means in practice.</p>

<h3>Clerking New Admissions</h3>
<p>A key task for FY2s, IMT doctors, and SHOs. Clerking means:</p>
<ul>
  <li>Taking a full history and examination</li>
  <li>Ordering blood tests, ECGs, and chest X-rays</li>
  <li>Writing an admission note in EPR or paper notes</li>
  <li>Starting the initial management plan</li>
</ul>
<p><strong>Practical point:</strong> Clerking forms the backbone of post-take ward rounds the next morning.</p>
${img(paths.proforma, 'Medical admissions clerking proforma', 'fy-img fy-img-portrait')}

<p>Make sure these are done during a clerking shift:</p>
<ol>
  <li><strong>Clerking proforma:</strong> Bloods, patient details, CXR, ECG, scans, red flags, plan, treatments and investigations.</li>
  <li><strong>TEP and DNAR:</strong> Always check. If not for full escalation, complete DNAR with clear discussion documentation. If capacity is lacking, discuss with NOK where appropriate.</li>
  <li><strong>Target location:</strong> State the destination from A&amp;E (e.g. geriatrics, respiratory, ambulatory, AMU, procedure room).</li>
  <li><strong>VTE prophylaxis:</strong> Commonly missed — complete and tick it.</li>
  <li><strong>Medications:</strong> Check GP records, previous admissions, shared care, or ask patient/family — then document and prescribe on ePMA.</li>
</ol>

<h3>How much time should I take for clerking a patient?</h3>
<p>If you are new, it usually takes around <strong>1–1.5 hours</strong> to clerk safely. On a normal 12-hour shift, teams often clerk <strong>8–10 patients</strong>. A team of 4 overnight may clerk around <strong>25–30 patients</strong>.</p>
<p>Clerking isn’t finished until you’ve chased urgent jobs, started treatment, arranged referrals, and handed over outstanding tasks. Escalate to your registrar early if something is going wrong.</p>
${img(paths.giphy5, 'Busy clerking shift', 'fy-img fy-img-gif')}

<h3>Ward Cover Duties</h3>
<ul>
  <li>Responding to bleeps for chest pain, sepsis, falls, fluid reviews, cannulas, catheters</li>
  <li>Prioritising acutely unwell patients before non-urgent jobs</li>
  <li>Documenting assessments and management clearly</li>
</ul>

<h3>Night Shifts</h3>
<ul>
  <li>Clerk new admissions from A&amp;E or GP referrals</li>
  <li>Cover wards and step-down units</li>
  <li>Handle cardiac arrests, MET calls, and sepsis alerts</li>
</ul>
<p>You may cover multiple wards alone overnight as FY2 or IMT1 — prioritisation and documentation matter.</p>

<h3>Post-Take Ward Rounds</h3>
<ul>
  <li>Present patients you clerked overnight</li>
  <li>Consultants review cases and update plans</li>
  <li>Update EPR notes and chase outstanding investigations</li>
</ul>

<h3>Weekend Ward Cover</h3>
<ul>
  <li>Review unwell admitted patients (usually no routine clerking)</li>
  <li>Handle medication reviews, fluids, falls, and deterioration</li>
  <li>Focus on essential jobs: discharges, bloods, emergencies</li>
</ul>

<h2>Who covers MET calls and where?</h2>
${img(paths.giphy6, 'MET call confusion', 'fy-img fy-img-gif')}
<p>As a medic you are generally expected to respond to MET calls:</p>
<ul>
  <li><strong>Clerking:</strong> respond to MET calls in wards and resus.</li>
  <li><strong>Ward cover:</strong> usually MET calls in wards only.</li>
</ul>
<p>You may also cover theatres or unexpected areas. If unsure, ask your registrar. If you missed the location, call switchboard.</p>

<h2>Practical Tools and Apps for NHS On-Call Shifts</h2>
<p>The right apps make on-call shifts smoother and safer.</p>

<h3>Accurx Induction App</h3>
${img(paths.accurx, 'Accurx Induction Switch App', 'fy-img fy-img-phone')}
<p>Quick access to bleep numbers, hospital switchboard, local policies, and emergency protocols — especially useful if you’re new to the hospital layout. (Induction is now Accurx.)</p>

<h3>MicroGuide</h3>
<ul>
  <li>Local hospital antimicrobial guidelines</li>
  <li>Dosing advice</li>
  <li>Step-by-step infection management plans</li>
</ul>

<h3>MDCalc or MedCalc</h3>
<ul>
  <li>Wells score for PE or DVT</li>
  <li>CURB-65 for pneumonia</li>
  <li>HAS-BLED and CHA2DS2-VASc for AF</li>
</ul>

<h3>Foundation Doctor Handbook</h3>
${img(paths.handbook, 'Foundation Year Doctor Handbook App', 'fy-img fy-img-phone')}
<p>Useful for common on-call scenarios such as fluid management, sepsis protocols, and escalation guidelines — especially in your first months.</p>

<h3>Using ChatGPT for Quick Clarification and Recall Lists</h3>
<ul>
  <li>Clarify protocols or management guidelines quickly between patients</li>
  <li>Build personalised recall lists organised by subject on your phone</li>
</ul>
<p>Personalise your toolkit — other medical apps can also help on busy shifts.</p>

<h2>Tips for Doctors Managing NHS On-Call Duties</h2>

<h3>Prioritise Tasks Smartly</h3>
<ul>
  <li>Chest pain, sepsis, or reduced consciousness always come first.</li>
  <li>Routine tasks (cannulas, drug charts) can wait if needed.</li>
</ul>

<h3>Understand UK Escalation Protocols</h3>
<ul>
  <li>FY1 → SHO → Registrar → Consultant On-Call</li>
  <li>Use <strong>SBAR</strong> when handing over or escalating</li>
  <li>Know when to call your med reg, especially overnight</li>
</ul>

<h3>Speak Up During Team Introductions</h3>
<ul>
  <li>State your name, grade, and role clearly</li>
  <li>Make sure others know you’re on the team and where to find you</li>
</ul>

<h3>Always Keep Essentials Handy</h3>
<ul>
  <li>Pen and notepad</li>
  <li>Trust ID and bleep</li>
  <li>Phone with Accurx and MicroGuide installed</li>
  <li>Snacks and water — especially on nights</li>
</ul>

<h3>Rely on Your Clinical Knowledge</h3>
<ul>
  <li>ECG interpretation</li>
  <li>ABG analysis</li>
  <li>Chest X-ray review</li>
  <li>Clinical scoring systems like CURB-65</li>
</ul>

<h2>My Final Thoughts on NHS On-Call Duties for Doctors</h2>
${img(paths.giphy7, 'End of on-call shift', 'fy-img fy-img-gif')}
<p>On-call isn’t just about surviving the rota — it’s about learning to manage patients safely, work as a team, and make decisions within real NHS protocols.</p>
<ul>
  <li>Know your on-call team structure</li>
  <li>Focus on clerking, ward cover, nights, and post-take</li>
  <li>Use apps like Accurx Induction and MicroGuide wisely</li>
  <li>Always escalate when unsure — patient safety comes first</li>
</ul>
<p>Even with long nights and stressful moments, each on-call builds confidence, sharpens clinical skills, and helps you settle into UK healthcare practice.</p>
`.trim()
}

async function main() {
  const uploaded = {} as Record<SourceKey, string>
  for (const key of Object.keys(SOURCES) as SourceKey[]) {
    uploaded[key] = await downloadAndUpload(key)
  }

  const { data: topic, error: topicError } = await supabase
    .from('fy_topics')
    .select('id, name')
    .eq('cohort', 'general')
    .eq('slug', 'working-on-calls')
    .single()

  if (topicError || !topic) {
    console.error('Topic not found:', topicError?.message)
    process.exit(1)
  }

  const content = buildContent(uploaded)
  const featuredPath = uploaded.featured

  const { data: existing } = await supabase
    .from('fy_pages')
    .select('id')
    .eq('topic_id', topic.id)
    .eq('slug', SLUG)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('fy_pages')
      .update({
        title: TITLE,
        content,
        featured_image: featuredPath,
        status: 'published',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (error) throw error
    console.log('Updated page', existing.id)
  } else {
    const { data: page, error } = await supabase
      .from('fy_pages')
      .insert({
        topic_id: topic.id,
        title: TITLE,
        slug: SLUG,
        content,
        featured_image: featuredPath,
        status: 'published',
        is_active: true,
        display_order: 1,
      })
      .select('id')
      .single()
    if (error) throw error
    console.log('Created page', page?.id)
  }

  console.log(
    'Open: http://localhost:3000/placements/foundation-year/general/working-on-calls/what-are-on-call-shifts'
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
