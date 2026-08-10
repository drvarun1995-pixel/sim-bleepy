/**
 * Curated SEO meta descriptions for Foundation Year public guides.
 * Prefer DB `fy_pages.meta_description` when present; this map is the fallback source of truth.
 */
export const FY_META_DESCRIPTIONS: Record<string, string> = {
  'abg-made-easy':
    'Learn ABG interpretation step by step for foundation doctors — pH, PaCO₂, HCO₃⁻, oxygenation and common acid–base patterns on the wards.',
  'aki-stages-quick-guide':
    'Quick FY guide to AKI stages, creatinine criteria, warning signs and what junior doctors should check and escalate on the wards.',
  'all-nhs-discounts-list':
    'The best NHS staff discounts and offers for 2026 — Blue Light Card, retail, travel, food and how to claim perks as a UK doctor.',
  'als-courses-guide':
    'Why ALS certification matters for NHS jobs, what the course covers, and how foundation doctors can book and prepare for Advanced Life Support.',
  'bladder-scan-guide':
    'How to interpret bladder scan results in the NHS — volumes, retention, post-void residual and when FY doctors should act or escalate.',
  'clinical-gap-job-application':
    'How to explain clinical gaps in NHS job applications — practical wording, evidence and interview tips for UK doctors returning to practice.',
  'confusion-screen-bloods':
    'Confusion screen bloods for junior doctors — which tests to request, why they matter in delirium workups, and how to avoid missing reversible causes.',
  'cpd-courses-nhs':
    'Free and high-value CPD courses for NHS doctors in 2026 — practical options that strengthen your portfolio and Trac applications.',
  'dnar-dnacpr-guide':
    'DNAR/DNACPR explained for foundation doctors — discussions, documentation, ceilings of care and how to escalate sensitively on call.',
  'dvsa-theory-test':
    'How to pass the DVSA theory test quickly — a practical 2-day revision strategy used by doctors relocating or learning to drive in the UK.',
  'ecg-basics-guide':
    'ECG basics for foundation doctors — a clear step-by-step approach to rate, rhythm, axis, intervals and spotting common ward ECG problems.',
  'financial-guide-uk-doctors':
    'A practical financial guide for UK NHS doctors — budgeting, pensions, tax basics, indemnity costs and building security in foundation years.',
  'free-medical-apps':
    'Best free medical apps for UK NHS doctors in 2026 — prescribing aids, guidelines, ECG tools and study apps worth installing as an FY.',
  'fy1-iv-fluid-prescribing':
    'Members-only FY1 guide to IV fluid prescribing — assessment, 5 Rs, resuscitation, maintenance, replacement and Basildon Wellsky/EPMA steps.',
  'fy1-potassium-prescribing-hypokalaemia':
    'A practical FY1 guide to safe potassium prescribing — hypokalaemia assessment, oral and IV replacement, renal function, ECGs, monitoring and hyperkalaemia.',
  'fy1-anticoagulation-ward-basics':
    'A practical FY1 guide to anticoagulation on the ward — VTE prophylaxis, LMWH, DOACs, warfarin, renal function, bleeding risk and common prescribing pitfalls.',
  'fy1-new-oxygen-requirement':
    'A practical FY1 guide to a new oxygen requirement — ABCDE, oxygen targets, common causes, investigations, reassessment and escalation on call.',
  'fy1-review-patient-on-call':
    'How to review a patient on call as an FY1 — bedside assessment, ABCDE, NEWS2, investigations, escalation with SBAR and clear documentation.',
  'how-to-do-a-clinical-audit':
    'How to do a clinical audit in the NHS as a foundation doctor — choosing a topic, standards, data, interventions and closing the loop.',
  'iv-cannula-guide':
    'IV cannula sizes, colours and vein selection made simple — a practical FY guide to choosing the right cannula for common ward situations.',
  'mcdonalds-nhs-discount':
    'How to get the McDonald’s NHS discount in 2026 — eligibility, Blue Light Card tips and what foundation doctors need to claim the offer.',
  'medical-indemnity-insurance':
    'Compare medical indemnity options for UK NHS doctors — what FY doctors need, typical cover, and how to choose protection that fits your role.',
  'mrcp-1-pass-in-two-months':
    'How to pass MRCP Part 1 in two months — a focused study plan, question-bank strategy and timetable used by a UK junior doctor.',
  'nhs-bleep-system':
    'NHS bleep system explained for junior doctors — types of bleeps, how to respond, escalation etiquette and surviving on-call communication.',
  'nhs-discharge-letter-guide':
    'How to write a clear NHS discharge letter — structure, must-include details, common pitfalls and a practical FY step-by-step checklist.',
  'nhs-discounts-offers':
    'NHS discounts and offers for staff — where to find legitimate deals and how foundation doctors can make the most of staff benefits.',
  'nhs-jobs-guide':
    'Best places to find NHS jobs in 2026 — Trac, NHS Jobs, trusts, networks and practical tips for foundation and junior doctor applications.',
  'nhs-pension-contributions':
    'NHS pension contributions explained for 2026 — what you pay, what you get, and how foundation doctors can understand their pension basics.',
  'nhs-staff-roles-mdt':
    'NHS staff roles in the MDT explained — who does what on the ward, how to work with the team, and who to call as a foundation doctor.',
  'post-falls-assessment':
    'Post-falls assessment for on-call doctors — immediate checks, red flags, documentation and when to escalate after an inpatient fall.',
  'trust-induction-basildon-hospital':
    'Members-only Basildon Hospital trust induction for starters — site maps, systems, WellSky, first-week essentials and local FY practical tips.',
  'types-of-delusion':
    'Types of delusion explained with clinical examples — a practical psychiatry primer for foundation doctors clerking confused or psychotic patients.',
  'uk-bank-account-guide':
    'Best UK bank accounts for new NHS staff — practical options for salary, everyday banking and what foundation doctors usually need first.',
  'vte-prophylaxis-guide':
    'VTE prophylaxis for NHS wards — risk assessment, common regimens, contraindications and what FY doctors should check before prescribing.',
  'what-are-on-call-shifts':
    'What on-call shifts are for foundation doctors — how rotas work, what to expect overnight, pay basics and how to prepare for your first on-call.',
}

export function fyMetaDescription(
  slug: string,
  fallbackHtmlOrTitle?: string | null,
  dbMeta?: string | null
): string | null {
  const curated = dbMeta?.trim() || FY_META_DESCRIPTIONS[slug]?.trim()
  return curated || null
}
