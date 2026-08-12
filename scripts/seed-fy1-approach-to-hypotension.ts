/**
 * Seed public FY guide:
 * "The FY1 Approach to Hypotension: A Practical Ward Guide"
 *
 * Cohort: general · Topic: on-calls
 * Featured: unique Bleepy logo card. Inline: teaching infographics.
 *
 * Run:
 *   $env:NODE_OPTIONS='--use-system-ca'; npx tsx scripts/seed-fy1-approach-to-hypotension.ts
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const TITLE = 'The FY1 Approach to Hypotension: A Practical Ward Guide'
const FEATURED_TITLE = 'APPROACH TO HYPOTENSION'
const SLUG = 'fy1-approach-to-hypotension'
const TOPIC_SLUG = 'on-calls'
const COHORT = 'general'
const IMAGE_DIR = `foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}/images`
const LOGO = path.resolve('public/Bleepy-Logo-128.webp')
const META =
  'A practical FY1 guide to reviewing hypotension on the ward, including ABCDE, causes, fluid assessment, investigations, reassessment and escalation.'

const W = 1280
const H = 720
const INFO_H = 900

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapTitle(title: string, maxChars = 22): string[] {
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
  const titleFs = titleLines.length > 1 ? 34 : 42
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

function bpPropsSvg(): Buffer {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(180,230)">
    <rect x="10" y="40" width="200" height="170" rx="18" fill="#FEF2F2" stroke="#DC2626" stroke-width="6"/>
    <rect x="50" y="18" width="120" height="36" rx="10" fill="#DC2626"/>
    <text x="110" y="42" text-anchor="middle" font-family="Arial" font-size="16" font-weight="800" fill="#fff">BP</text>
    <text x="110" y="120" text-anchor="middle" font-family="Arial Black" font-size="36" fill="#B91C1C">86/52</text>
    <text x="110" y="165" text-anchor="middle" font-family="Arial" font-size="15" font-weight="700" fill="#7F1D1D">mmHg</text>
  </g>
  <g transform="translate(920,250)">
    <ellipse cx="70" cy="55" rx="58" ry="42" fill="#FEE2E2" stroke="#DC2626" stroke-width="5"/>
    <path d="M30 55 q40 -35 80 0 q-40 35 -80 0" fill="none" stroke="#B91C1C" stroke-width="6"/>
    <circle cx="70" cy="55" r="10" fill="#DC2626"/>
    <text x="70" y="140" text-anchor="middle" font-family="Arial" font-size="15" font-weight="800" fill="#7F1D1D">PERFUSION</text>
  </g>
</svg>`)
}

async function composeFeaturedLogoCard(): Promise<Buffer> {
  if (!fs.existsSync(LOGO)) throw new Error(`Missing logo: ${LOGO}`)

  const logo = await sharp(LOGO)
    .resize(360, 360, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const watermark = await sharp(LOGO)
    .resize(700, 700, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .modulate({ brightness: 1.6, saturation: 0.05 })
    .png()
    .toBuffer()
  const watermarkSoft = await sharp(watermark)
    .composite([
      {
        input: Buffer.from(
          `<svg width="700" height="700"><rect width="700" height="700" fill="white" fill-opacity="0.55"/></svg>`
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()

  const lines = wrapTitle(FEATURED_TITLE)
  const banners = await sharp(bannerSvg(lines, 'ON-CALL & ACUTE CARE', 'FOUNDATION YEAR')).png().toBuffer()
  const props = await sharp(bpPropsSvg()).png().toBuffer()

  return sharp({
    create: { width: W, height: H, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([
      { input: watermarkSoft, top: 120, left: 290 },
      { input: props, top: 0, left: 0 },
      { input: logo, top: 210, left: 460 },
      {
        input: Buffer.from(
          `<svg width="220" height="28"><ellipse cx="110" cy="14" rx="100" ry="10" fill="#000" fill-opacity="0.12"/></svg>`
        ),
        top: 545,
        left: 530,
      },
      { input: banners, top: 0, left: 0 },
    ])
    .webp({ quality: 90, effort: 5 })
    .toBuffer()
}

function causesSvg(): Buffer {
  const items = [
    ['VOLUME LOSS', 'Dehydration / haemorrhage'],
    ['DISTRIBUTIVE', 'Sepsis / anaphylaxis'],
    ['PUMP FAILURE', 'MI / heart failure / arrhythmia'],
    ['OBSTRUCTION', 'PE / tension / tamponade'],
    ['DRUGS', 'Antihypertensives / diuretics'],
    ['ENDOCRINE', 'Adrenal crisis risk'],
  ]
  const cards = items
    .map(([title, sub], i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 70 + col * 390
      const y = 200 + row * 280
      return `
      <rect x="${x}" y="${y}" width="350" height="230" rx="20" fill="#FEF2F2" stroke="#DC2626" stroke-width="3"/>
      <text x="${x + 175}" y="${y + 95}" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#7F1D1D">${escapeXml(title)}</text>
      <text x="${x + 175}" y="${y + 140}" text-anchor="middle" font-family="Arial" font-size="17" fill="#475569">${escapeXml(sub)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="30" fill="#1E3A5F">WHY IS THE BLOOD PRESSURE LOW?</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Hypotension is a sign with mechanisms — volume loss is only one of them</text>
  ${cards}
  <text x="640" y="840" text-anchor="middle" font-family="Arial" font-size="18" font-weight="800" fill="#F25006">LOSS → DISTRIBUTION → PUMP → OBSTRUCTION → DRUGS / ENDOCRINE</text>
</svg>`)
}

function perfusionSvg(): Buffer {
  const checks = [
    'Mental state / new confusion',
    'Capillary refill',
    'Cool or mottled peripheries',
    'Pulse and heart rate',
    'Urine output',
    'Blood pressure trend',
    'Blood gas / lactate if indicated',
  ]
  const rows = checks
    .map((c, i) => {
      const y = 210 + i * 80
      return `
      <rect x="180" y="${y}" width="920" height="62" rx="12" fill="${i % 2 ? '#F8FAFC' : '#FEF2F2'}" stroke="#7F1D1D" stroke-width="2"/>
      <circle cx="230" cy="${y + 31}" r="16" fill="#F25006"/>
      <text x="230" y="${y + 37}" text-anchor="middle" font-family="Arial Black" font-size="14" fill="#fff">${i + 1}</text>
      <text x="280" y="${y + 38}" font-family="Arial" font-size="20" font-weight="700" fill="#1E3A5F">${escapeXml(c)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="30" fill="#1E3A5F">IS THE PATIENT SHOCKED?</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Shock is about organ perfusion — not one blood-pressure number</text>
  <rect x="320" y="145" width="640" height="42" rx="12" fill="#EBA400"/>
  <text x="640" y="173" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">Look at the patient + the trend</text>
  ${rows}
</svg>`)
}

function pathwaySvg(): Buffer {
  const steps = [
    'CONFIRM',
    'TREND',
    'ABCDE',
    'PERFUSION',
    'FIND CAUSE',
    'FLUID IF NEEDED',
    'REASSESS',
    'ESCALATE',
    'DOCUMENT',
  ]
  const boxes = steps
    .map((s, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 90 + col * 380
      const y = 180 + row * 210
      return `
      <rect x="${x}" y="${y}" width="320" height="140" rx="18" fill="#FFF7ED" stroke="#F25006" stroke-width="4"/>
      <text x="${x + 160}" y="${y + 55}" text-anchor="middle" font-family="Arial" font-size="16" fill="#9A3412">STEP ${i + 1}</text>
      <text x="${x + 160}" y="${y + 95}" text-anchor="middle" font-family="Arial Black" font-size="22" fill="#1E3A5F">${escapeXml(s)}</text>`
    })
    .join('\n')

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${INFO_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${INFO_H}" fill="#FFFFFF"/>
  <text x="640" y="70" text-anchor="middle" font-family="Arial Black" font-size="28" fill="#1E3A5F">FY1 HYPOTENSION — DECISION PATHWAY</text>
  <text x="640" y="115" text-anchor="middle" font-family="Arial" font-size="18" fill="#64748B">Confirm → assess perfusion → find the cause → treat selectively → reassess</text>
  ${boxes}
  <rect x="160" y="800" width="960" height="60" rx="14" fill="#EBA400"/>
  <text x="640" y="840" text-anchor="middle" font-family="Arial Black" font-size="18" fill="#fff">GIVE → REASSESS → THINK AGAIN — do not default to another bag of fluid</text>
</svg>`)
}

function viewUrl(storagePath: string) {
  return `/api/placements/images/view?path=${encodeURIComponent(storagePath)}`
}

function figure(storagePath: string, alt: string, caption?: string) {
  const img = `<p style="text-align:center"><img src="${viewUrl(storagePath)}" alt="${alt.replace(/"/g, '&quot;')}" width="1280" loading="lazy" decoding="async" class="fy-img fy-img-wide" /></p>`
  if (!caption) return img
  return `<figure class="fy-figure">${img}<figcaption>${caption}</figcaption></figure>`
}

async function uploadBuffer(storagePath: string, buffer: Buffer, contentType = 'image/webp') {
  const { error } = await sb.storage.from('placements').upload(storagePath, buffer, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error(`Upload failed ${storagePath}: ${error.message}`)
  console.log('  uploaded', storagePath)
  return storagePath
}

async function uploadPngFromSvg(svg: Buffer, outBase: string) {
  const png = await sharp(svg).png().toBuffer()
  return uploadBuffer(`${IMAGE_DIR}/${outBase}.png`, png, 'image/png')
}

function buildContent(imgs: { causes: string; perfusion: string; pathway: string }) {
  return `
<p>A practical FY1 guide to reviewing hypotension on the ward — ABCDE, causes, fluid assessment, investigations, reassessment and escalation.</p>

<p>It is 3 am and the nurse bleeps you: “Doctor, could you review this patient? Their blood pressure is 86/52.” You have never met them. They were apparently fine earlier, and now the NEWS2 has increased.</p>
<p>A low blood pressure is not a diagnosis. It may reflect dehydration, bleeding, infection, a cardiac problem, a medication effect or something more immediately dangerous. Your job as an FY1 is to recognise whether the patient is poorly perfused, start a structured assessment, treat obvious reversible problems and involve senior help early when needed.</p>
<p><strong>The key principle:</strong> Do not treat the blood-pressure number in isolation. Treat the patient, assess perfusion, look at the trend and work out why the pressure has fallen.</p>

<h2>1. First: confirm it and look at the trend</h2>
<p>Before building a differential, make sure the reading is meaningful. Ask:</p>
<ul>
  <li>Was the blood pressure repeated manually if the automated reading seems unexpected?</li>
  <li>What was the patient’s usual or earlier blood pressure?</li>
  <li>Has it fallen suddenly or gradually?</li>
  <li>What are the heart rate, respiratory rate, oxygen saturation, temperature and conscious level?</li>
  <li>What is the urine output?</li>
  <li>Has the NEWS2 changed?</li>
</ul>
<p>A blood pressure of 95/60 may be normal for one patient and a major deterioration in another whose systolic pressure was 150 mmHg a few hours earlier. The change from baseline matters. In suspected sepsis, a systolic blood pressure of 90 mmHg or less, or a fall of more than 40 mmHg from normal, is a high-risk feature.</p>
<p><strong>FY1 tip:</strong> If the blood pressure is unexpectedly low and the patient looks unwell, do not spend ten minutes reading the notes before seeing them. Go to the bedside and assess them.</p>

<h2>2. Is this hypotension causing poor perfusion?</h2>
${figure(
  imgs.perfusion,
  'Bedside signs of poor perfusion in a hypotensive patient',
  'Assess perfusion as well as blood pressure: mental state, skin, capillary refill, pulse, urine output and the overall physiological trend matter.'
)}
<p>The important question is not simply “Is the blood pressure low?” but “Is the circulation failing to deliver enough blood to the organs?” Look for features of poor perfusion or shock:</p>
<ul>
  <li>New confusion, agitation or reduced consciousness</li>
  <li>Cool, pale, clammy or mottled skin</li>
  <li>Prolonged capillary refill or weak peripheral pulses</li>
  <li>Tachycardia — although some patients may not mount one</li>
  <li>Reduced urine output</li>
  <li>Rising lactate or metabolic acidosis where a blood gas is taken</li>
  <li>Breathlessness, chest pain or signs of cardiac/respiratory compromise</li>
</ul>
<p>A patient can be deteriorating before the blood pressure becomes profoundly low, so do not use a single reassuring value to dismiss other abnormal physiology.</p>

<h2>3. If the patient is unwell, use ABCDE</h2>
<ul>
  <li><strong>A — Airway</strong> — Check that the airway is patent. If they can speak normally, that is reassuring, but reduced consciousness can quickly threaten the airway.</li>
  <li><strong>B — Breathing</strong> — Check respiratory rate, oxygen saturation, oxygen requirement, work of breathing and chest examination. Hypotension plus hypoxia should immediately broaden your differential to problems such as pulmonary embolism, tension pneumothorax, severe infection or cardiac failure.</li>
  <li><strong>C — Circulation</strong> — Repeat blood pressure, assess heart rate and rhythm, capillary refill, peripheral temperature, pulses, JVP, oedema and overall fluid status. Look specifically for bleeding. Ensure adequate IV access if the patient is significantly unwell.</li>
  <li><strong>D — Disability</strong> — Assess conscious level and check capillary blood glucose where appropriate. Confusion or drowsiness can be a sign of poor cerebral perfusion, sepsis or another acute process.</li>
  <li><strong>E — Exposure</strong> — Look for fever, rash, obvious bleeding, abdominal tenderness or distension, wounds, drains, calf swelling and other clues to the cause. Do not forget the back, dressings and drains where relevant.</li>
</ul>

<h2>4. Think in causes: where has the pressure gone?</h2>
${figure(
  imgs.causes,
  'Common causes of hypotension and shock for FY1 doctors',
  'A low blood pressure has several possible mechanisms — volume loss is only one of them.'
)}
<p>A useful FY1 differential is to divide the problem into a few broad groups.</p>
<ul>
  <li><strong>Volume loss / hypovolaemia</strong> — Vomiting, diarrhoea, poor intake, high-output stoma or NG losses, diuresis, third-space losses, or haemorrhage.</li>
  <li><strong>Bleeding</strong> — Gastrointestinal bleeding, postoperative bleeding, retroperitoneal bleeding, pelvic/long-bone trauma or bleeding in an anticoagulated patient. An early haemoglobin can be misleading in acute blood loss.</li>
  <li><strong>Sepsis / distributive physiology</strong> — Infection, fever or hypothermia, tachypnoea, altered mental state, reduced urine output, mottling and raised lactate.</li>
  <li><strong>Pump failure</strong> — Acute coronary syndrome, severe heart failure, dangerous arrhythmias or other cardiac causes.</li>
  <li><strong>Obstruction to circulation</strong> — Pulmonary embolism, tension pneumothorax and cardiac tamponade. These require urgent senior involvement rather than repeated blind fluid boluses.</li>
  <li><strong>Drugs and endocrine causes</strong> — Antihypertensives, diuretics and other medicines can contribute. Consider adrenal crisis in the right context.</li>
</ul>
<p><strong>FY1 memory aid:</strong> Think LOSS (fluid or blood) → DISTRIBUTION (sepsis/anaphylaxis) → PUMP (heart) → OBSTRUCTION (PE/tamponade/tension pneumothorax) → DRUGS/ENDOCRINE.</p>
<p><strong>Common FY1 trap:</strong> Seeing a low blood pressure and immediately prescribing a litre of fluid. Fluids may help hypovolaemia, but they can worsen pulmonary oedema or delay recognition of cardiogenic or obstructive shock.</p>

<h2>5. Does this patient actually need IV fluid resuscitation?</h2>
<p>NICE identifies features that may indicate a need for urgent fluid resuscitation, including systolic blood pressure below 100 mmHg, heart rate above 90 beats/min, prolonged capillary refill or cool peripheries, increased respiratory rate, and other evidence of acute deterioration.</p>
<p>But fluid should still have an indication. Ask whether the patient appears intravascularly depleted and whether a fluid bolus is likely to improve perfusion.</p>
<p>For adults who need general IV fluid resuscitation, NICE recommends a crystalloid containing sodium 130–154 mmol/L, typically as a 500 mL bolus over less than 15 minutes, followed by reassessment.</p>
<p><strong>Important sepsis update:</strong> If the hypotension is in the context of suspected sepsis, use the current NICE sepsis pathway rather than automatically applying the general-fluid algorithm. Current NICE sepsis guidance recommends an initial 250 mL crystalloid bolus, ideally over 10–15 minutes, with further 250 mL boluses if needed up to 1,000 mL total, reassessing after each bolus.</p>
<p>Patients with heart failure, significant renal impairment or signs of fluid overload need particular caution. If you are unsure whether fluid is appropriate, or the patient remains hypotensive after initial resuscitation, involve a senior early.</p>

<h2>6. Reassess after every intervention</h2>
<p>A fluid bolus is a clinical test as well as a treatment. After it, ask:</p>
<ul>
  <li>Has the blood pressure improved?</li>
  <li>Has the heart rate changed?</li>
  <li>Is capillary refill or peripheral perfusion better?</li>
  <li>Is the patient more alert?</li>
  <li>Is urine output improving?</li>
  <li>Has breathlessness worsened?</li>
  <li>Have new crackles, raised JVP or oxygen requirement appeared?</li>
</ul>
<p><strong>FY1 rule:</strong> GIVE → REASSESS → THINK AGAIN. Do not let “another bag of fluid” become the default plan for unexplained hypotension.</p>

<h2>7. What investigations should you consider?</h2>
<p>Investigations should follow the clinical problem rather than replace your assessment. Depending on the presentation, consider:</p>
<ul>
  <li>ECG — especially with chest pain, arrhythmia, bradycardia or suspected cardiac cause</li>
  <li>FBC — haemoglobin, white cell count and platelets</li>
  <li>U&amp;Es and creatinine — renal function and electrolyte disturbance</li>
  <li>CRP and other infection-focused tests where relevant</li>
  <li>Blood gas with lactate in a significantly unwell patient or when tissue hypoperfusion/sepsis is suspected</li>
  <li>Blood cultures before antibiotics when indicated and if this does not delay urgent treatment</li>
  <li>Chest X-ray where pneumonia, pulmonary oedema or another thoracic cause is suspected</li>
  <li>Group and save / crossmatch if bleeding is suspected</li>
  <li>Further imaging or specialist investigations directed by the differential</li>
</ul>
<p><strong>FY1 tip:</strong> Check previous results. A haemoglobin of 90 g/L is very different if it was 88 yesterday versus 135 earlier in the admission. The same applies to creatinine, lactate and inflammatory markers.</p>

<h2>8. Review the drug chart</h2>
<p>Medication review can explain or worsen hypotension. Check for antihypertensives, diuretics, nitrates and other vasodilating medicines, opioids or sedating medicines where relevant, anticoagulants if bleeding is possible, recent medication changes, and long-term corticosteroids or known adrenal insufficiency.</p>
<p>Do not automatically stop every blood-pressure-lowering medicine forever because of one reading. In an acutely hypotensive patient, however, the medication list is part of the immediate clinical assessment and should be discussed in the management plan.</p>

<h2>9. When to escalate</h2>
<p>Hypotension is a common reason to involve your senior early. Escalate promptly if:</p>
<ul>
  <li>Systolic blood pressure is very low, rapidly falling or markedly below the patient’s baseline</li>
  <li>There are signs of shock or poor organ perfusion</li>
  <li>The patient is confused, drowsy, mottled or oliguric</li>
  <li>Lactate is raised or increasing</li>
  <li>You suspect significant bleeding</li>
  <li>You suspect sepsis with high-risk features</li>
  <li>There is chest pain, significant arrhythmia or concern about cardiogenic shock</li>
  <li>You suspect pulmonary embolism, tension pneumothorax or tamponade</li>
  <li>The patient does not improve after appropriate initial treatment</li>
  <li>You are uncertain about giving more fluid</li>
  <li>You are worried</li>
</ul>
<p>You do not need to solve the entire diagnosis before calling. A useful escalation might be: “This patient has new hypotension at 84/50 from a baseline around 130 systolic. They are tachycardic, cool peripherally and have reduced urine output. I am concerned about hypovolaemia versus sepsis. I have started ABCDE assessment, obtained IV access and sent bloods including lactate. I would like you to review them now.”</p>

${figure(
  imgs.pathway,
  'Step-by-step FY1 approach to hypotension on the ward',
  'The safe FY1 approach is to confirm, assess perfusion, identify the cause, treat selectively and reassess.'
)}

<h2>10. Document and close the loop</h2>
<p>Document clearly why you were called, blood pressure and full observation trend, ABCDE assessment and examination findings, fluid status and evidence of poor perfusion, your working diagnosis and differential, investigations requested, treatment given and the response to it, who you escalated to and when, and the ongoing monitoring and review plan.</p>
<p>If repeat observations, lactate, haemoglobin or other results are due after your shift, hand them over explicitly. Hypotension is not safely managed until somebody has checked whether the patient improved.</p>

<h2>A practical FY1 example</h2>
<p>You are called to a patient with a blood pressure of 88/54. Earlier it was 132/76. They have had vomiting and diarrhoea for 24 hours. Heart rate is 112, they are alert, oxygen saturations are stable, capillary refill is prolonged and the JVP appears low. There is no obvious bleeding and the chest is clear.</p>
<ul>
  <li><strong>Is the low BP new?</strong> Yes — there is a clear fall from baseline.</li>
  <li><strong>Are they poorly perfused?</strong> Likely — tachycardia and prolonged capillary refill support this.</li>
  <li><strong>Most likely cause?</strong> Hypovolaemia from GI losses is high on the differential.</li>
  <li><strong>Immediate approach?</strong> ABCDE, IV access, bloods, assess renal function/electrolytes and consider appropriate IV crystalloid resuscitation.</li>
  <li><strong>What next?</strong> Reassess after the bolus rather than automatically prescribing another one.</li>
  <li><strong>What would change the plan?</strong> New crackles, rising oxygen requirement, failure to respond, significant AKI, bleeding, sepsis features or another concerning diagnosis should prompt urgent senior review.</li>
</ul>
<p>That is the level of reasoning expected from an FY1: recognise deterioration, assess systematically, start sensible initial treatment and ask for help when the picture is not straightforward.</p>

<h2>The FY1 rule for hypotension</h2>
<p><strong>CONFIRM → TREND → ABCDE → PERFUSION → FIND THE CAUSE → FLUID ONLY IF INDICATED → REASSESS → ESCALATE → DOCUMENT</strong></p>
<p><strong>The key message:</strong> Hypotension is a sign. The safe FY1 response is to work out whether the patient is shocked, identify the likely cause, treat reversible problems and reassess rather than chasing a blood-pressure target blindly.</p>

<p><em>Educational note: This article is intended as an educational guide for Foundation doctors. For individual patients, follow current NICE/BNF guidance and your NHS organisation’s deteriorating-patient, IV-fluid, sepsis, bleeding and emergency-care pathways, and seek senior advice when appropriate.</em></p>
`.trim()
}

async function ensureTopic(): Promise<string> {
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
        description: 'Bleeps, night cover and reviewing patients',
        display_order: 6,
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
      description: 'Bleeps, night cover and reviewing patients',
      display_order: 6,
      is_active: true,
    })
    .select('id')
    .single()
  if (error) throw error
  return data!.id as string
}

async function upsertPage(topicId: string, content: string, featuredPath: string) {
  const { data: existing } = await sb
    .from('fy_pages')
    .select('id')
    .eq('slug', SLUG)
    .maybeSingle()

  const payload: Record<string, unknown> = {
    topic_id: topicId,
    title: TITLE,
    content,
    featured_image: featuredPath,
    status: 'published' as const,
    is_active: true,
    requires_auth: false,
    updated_at: new Date().toISOString(),
  }

  // Best-effort SEO column when present
  payload.meta_description = META

  if (existing) {
    let { error } = await sb.from('fy_pages').update(payload).eq('id', existing.id)
    if (error?.message?.includes('meta_description')) {
      delete payload.meta_description
      ;({ error } = await sb.from('fy_pages').update(payload).eq('id', existing.id))
    }
    if (error?.message?.includes('requires_auth')) {
      const { requires_auth: _r, meta_description: _m, ...rest } = payload
      ;({ error } = await sb.from('fy_pages').update(rest).eq('id', existing.id))
    }
    if (error) throw error
    console.log(`Updated page ${existing.id}`)
    return existing.id as string
  }

  const insertPayload = {
    slug: SLUG,
    display_order: 50,
    ...payload,
  }
  let { data, error } = await sb.from('fy_pages').insert(insertPayload).select('id').single()
  if (error?.message?.includes('meta_description')) {
    delete (insertPayload as any).meta_description
    ;({ data, error } = await sb.from('fy_pages').insert(insertPayload).select('id').single())
  }
  if (error?.message?.includes('requires_auth')) {
    const { requires_auth: _r, ...rest } = insertPayload as any
    ;({ data, error } = await sb.from('fy_pages').insert(rest).select('id').single())
  }
  if (error) throw error
  console.log(`Created page ${data?.id}`)
  return data!.id as string
}

async function main() {
  console.log('Composing unique featured Bleepy card...')
  const featuredWebp = await composeFeaturedLogoCard()
  const featuredPath = `${IMAGE_DIR}/featured-bleepy-logo.webp`
  await uploadBuffer(featuredPath, featuredWebp, 'image/webp')

  console.log('Generating teaching infographics...')
  const causes = await uploadPngFromSvg(causesSvg(), 'causes-of-hypotension-fy1')
  const perfusion = await uploadPngFromSvg(perfusionSvg(), 'hypotension-perfusion-assessment')
  const pathway = await uploadPngFromSvg(pathwaySvg(), 'fy1-hypotension-decision-pathway')

  const content = buildContent({ causes, perfusion, pathway })
  const topicId = await ensureTopic()
  await upsertPage(topicId, content, featuredPath)

  console.log(`\nPlacements: /placements/foundation-year/${COHORT}/${TOPIC_SLUG}/${SLUG}`)
  console.log(`Public SEO URL: /guides/foundation-year/${TOPIC_SLUG}/${SLUG}`)
  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
