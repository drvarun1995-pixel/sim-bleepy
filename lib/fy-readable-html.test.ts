import { describe, expect, it } from 'vitest'
import {
  formatReadableHtml,
  splitSentences,
  tryListify,
} from '@/lib/fy-readable-html'

describe('splitSentences', () => {
  it('does not split labelled C. Send headings', () => {
    const parts = splitSentences(
      '<strong>C. Send the initial investigations</strong> — CBG and blood ketones.'
    )
    expect(parts).toHaveLength(1)
  })

  it('splits after a real sentence ending in mmol/L', () => {
    const parts = splitSentences(
      'Treat below 4.0 mmol/L. Further testing should be driven by context.'
    )
    expect(parts).toHaveLength(2)
  })
})

describe('tryListify', () => {
  it('turns a comma work-up into bullets and keeps nested including-clauses', () => {
    const html = tryListify(
      'A focused initial work-up commonly includes 12-lead ECG, continuous cardiac monitoring, full observations, IV access, U&amp;Es including potassium, magnesium and calcium, glucose, FBC where anaemia or infection is relevant, troponin if myocardial ischaemia is suspected, thyroid tests if the presentation suggests hypothyroidism or the cause remains unexplained, and a digoxin level if the patient is taking digoxin and toxicity is possible. Further testing should be driven by the clinical context rather than becoming an automatic bradycardia bundle.'
    )
    expect(html).toContain('<ul class="fy-scan-list">')
    expect(html).toContain('<li>U&amp;Es including potassium, magnesium and calcium</li>')
    expect(html).toContain('<li>glucose</li>')
    expect(html).toContain('<li>FBC where anaemia or infection is relevant</li>')
    expect(html).not.toContain('<li>magnesium and calcium</li>')
    expect(html).toContain('Further testing should be driven')
  })

  it('turns atropine reassessment questions into bullets', () => {
    const html = tryListify(
      'After atropine, reassess the patient rather than focusing only on whether the heart rate increased: has the blood pressure improved; has syncope or presyncope resolved; has chest pain or ischaemia improved; has pulmonary oedema or heart-failure compromise improved; and is the patient now alert and adequately perfused? If the adverse features have not improved, escalate immediately.'
    )
    expect(html).toContain('<ul class="fy-scan-list">')
    expect(html).toContain('has the blood pressure improved')
    expect(html).toContain('If the adverse features have not improved')
  })

  it('turns severe DKA criteria into bullets', () => {
    const html = tryListify(
      'One or more of the following should trigger immediate senior review and consideration of HDU / critical-care level monitoring: blood ketones &gt;6.0 mmol/L; bicarbonate &lt;5 mmol/L; venous or arterial pH &lt;7.0; potassium &lt;3.5 mmol/L on admission; GCS &lt;12 or abnormal AVPU; oxygen saturation &lt;92% on air (assuming normal respiratory baseline); systolic blood pressure &lt;90 mmHg; pulse &gt;100 or &lt;60 bpm; anion gap &gt;16.'
    )
    expect(html).toContain('<ul class="fy-scan-list">')
    expect(html).toContain('blood ketones &gt;6.0 mmol/L')
    expect(html).toContain('anion gap &gt;16')
  })

  it('turns timed DKA actions into an ordered list', () => {
    const html = tryListify(
      'This phase is about proving that treatment is working and catching complications early: continue hourly CBG and ketones; repeat VBG monitoring; continue staged 0.9% sodium chloride +/- potassium; add 10% glucose once CBG &lt;14 mmol/L; review treatment targets every hour; treat the precipitating cause; monitor urine output and fluid balance; and watch for hypoglycaemia, falling potassium, fluid overload and deterioration in conscious level.'
    )
    expect(html).toContain('<ol class="fy-scan-list">')
    expect(html).toContain('continue hourly CBG and ketones')
    expect(html).toContain('CBG &lt;14 mmol/L')
    expect(html).toContain('watch for hypoglycaemia')
  })

  it('turns a semicolon-only complications paragraph into bullets', () => {
    const html = tryListify(
      'Hypokalaemia or hyperkalaemia; hypoglycaemia; cerebral oedema, particularly with sudden deterioration in conscious level; fluid overload / pulmonary oedema; acute kidney injury; venous thromboembolism; aspiration pneumonia; hypomagnesaemia / hypophosphataemia; pancreatitis or raised pancreatic enzymes; rhabdomyolysis; gastrointestinal bleeding; and sudden neurological deterioration. A sudden fall in GCS during treatment should trigger urgent senior review.'
    )
    expect(html).toContain('<ul class="fy-scan-list">')
    expect(html).toContain('cerebral oedema, particularly with sudden deterioration in conscious level')
    expect(html).toContain('A sudden fall in GCS')
  })

  it('turns hypoglycaemia symptoms into bullets', () => {
    const html = tryListify(
      'Common features include shaking or tremor, sweating, palpitations, sudden hunger, irritability, unusual aggression or confusion, drowsiness, weakness or tiredness, difficulty speaking, incoordination, stumbling or unexplained falls, tingling around the lips or peripheries, nausea, poor concentration, visual disturbance, headache or dizziness.'
    )
    expect(html).toContain('<ul class="fy-scan-list">')
    expect(html).toContain('shaking or tremor')
    expect(html).toContain('headache or dizziness')
  })

  it('turns IV insulin hypo steps into an ordered list', () => {
    const html = tryListify(
      'If an IV insulin infusion is running when the hypo occurs: stop the insulin infusion immediately; treat the hypoglycaemia fully; check capillary glucose every 15 minutes until it is above 4.0 mmol/L; review the insulin dose and clinical context before restarting the infusion; and consider whether concurrent IV glucose or a lower insulin rate is required to prevent recurrence.'
    )
    expect(html).toContain('<ol class="fy-scan-list">')
    expect(html).toContain('stop the insulin infusion immediately')
  })

  it('leaves short include-lists as prose', () => {
    expect(
      tryListify(
        'Autonomic symptoms include sweating, tremor, hunger, palpitations and anxiety.'
      )
    ).toBeNull()
  })
})

describe('formatReadableHtml', () => {
  it('listifies selected paragraphs and is idempotent', () => {
    const src = `<p>Once the immediate episode is treated, look for the cause. In hospital, common medication and medical factors include too much rapid- or short-acting insulin, inappropriate insulin timing, changes to diabetes medication, recovery from acute illness, renal impairment, liver dysfunction, impaired awareness, previous severe hypoglycaemia, IV insulin without adequate glucose substrate, sulfonylurea or long-acting insulin exposure, medication interactions, and endocrine disease where relevant.</p>
<p>Food and ward factors include missed or delayed meals, reduced appetite, vomiting, prolonged fasting/NBM, less carbohydrate than usual, feeding interruption, inability to feed independently, changes in meal timing, mobility or activity, enteral feed interruption or a blocked tube, and TPN or IV glucose interruption.</p>
<p>If the usual explanation does not fit, broaden the differential: alcohol with little food intake, severe liver dysfunction, adrenal insufficiency or pituitary failure, post-bariatric or post-prandial hypoglycaemia, and rarely insulinoma or another endogenous hyperinsulinaemic disorder. Persistent hypotension, electrolyte abnormalities or recurrent unexplained episodes should prompt early senior review rather than repeated treatment alone.</p>
<blockquote><p>Leave this blockquote alone: a, b, c, d, e, f.</p></blockquote>`

    const once = formatReadableHtml(src)
    const twice = formatReadableHtml(once)
    expect(once).toBe(twice)
    expect(once).toContain('common medication and medical factors include:')
    expect(once).toContain('Food and ward factors include:')
    expect(once).toContain('broaden the differential:')
    expect(once).toContain('Persistent hypotension')
    expect(once).toContain('<blockquote><p>Leave this blockquote alone')
    expect((once.match(/<ul class="fy-scan-list">/g) || []).length).toBeGreaterThanOrEqual(3)
  })
})
