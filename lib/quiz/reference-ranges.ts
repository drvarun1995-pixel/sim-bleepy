// Medical Reference Ranges
// Reference ranges vary according to individual labs. All values are for adults unless otherwise stated.

export interface ReferenceRange {
  name: string
  range: string
  notes?: string
}

export interface ReferenceRangeCategory {
  category: string
  ranges: ReferenceRange[]
}

export const REFERENCE_RANGES: ReferenceRangeCategory[] = [
  {
    category: 'Full blood count',
    ranges: [
      { name: 'Haemoglobin', range: 'Men: 135-180 g/L\nWomen: 115-160 g/L' },
      { name: 'Mean cell volume', range: '82-100 fl' },
      { name: 'Platelets', range: '150-400 × 10⁹/L' },
      { name: 'White blood cells', range: '4.0-11.0 × 10⁹/L' },
      { name: 'Neutrophils', range: '2.0-7.0 × 10⁹/L' },
      { name: 'Lymphocytes', range: '1.0-3.5 × 10⁹/L' },
      { name: 'Eosinophils', range: '0.1-0.4 × 10⁹/L' },
    ],
  },
  {
    category: 'Urea and electrolytes',
    ranges: [
      { name: 'Sodium', range: '135-145 mmol/L' },
      { name: 'Potassium', range: '3.5-5.0 mmol/L' },
      { name: 'Urea', range: '2.0-7 mmol/L' },
      { name: 'Creatinine', range: '55-120 umol/L' },
      { name: 'Bicarbonate', range: '22-28 mmol/L' },
      { name: 'Chloride', range: '95-105 mmol/L' },
    ],
  },
  {
    category: 'Liver function tests',
    ranges: [
      { name: 'Bilirubin', range: '3-17 umol/L' },
      { name: 'Alanine transferase (ALT)', range: '3-40 iu/L' },
      { name: 'Aspartate transaminase (AST)', range: '3-30 iu/L' },
      { name: 'Alkaline phosphatase (ALP)', range: '30-100 umol/L' },
      { name: 'Gamma glutamyl transferase (γGT)', range: '8-60 u/L' },
      { name: 'Total protein', range: '60-80 g/L' },
    ],
  },
  {
    category: 'Other haematology',
    ranges: [
      { name: 'Erythrocyte sedimentation rate (ESR)', range: 'Men: < (age / 2) mm/hr\nWomen: < ((age + 10) / 2) mm/hr' },
      { name: 'Prothrombin time (PT)', range: '10-14 secs' },
      { name: 'Activated partial thromboplastin time (APTT)', range: '25-35 secs' },
      { name: 'Ferritin', range: '20-230 ng/ml' },
      { name: 'Vitamin B12', range: '200-900 ng/L' },
      { name: 'Folate', range: '3.0 nmol/L' },
      { name: 'Reticulocytes', range: '0.5-1.5%' },
      { name: 'D-Dimer', range: '< 400 ng/ml' },
    ],
  },
  {
    category: 'Other biochemistry',
    ranges: [
      { name: 'Calcium', range: '2.1-2.6 mmol/L' },
      { name: 'Phosphate', range: '0.8-1.4 mmol/L' },
      { name: 'CRP', range: '< 10 mg/L' },
      { name: 'Thyroid stimulating hormone (TSH)', range: '0.5-5.5 mu/L' },
      { name: 'Free thyroxine (T4)', range: '9-18 pmol/L' },
      { name: 'Total thyroxine (T4)', range: '70-140 nmol/L' },
      { name: 'Amylase', range: '70-300 u/L' },
      { name: 'Uric acid', range: '0.18-0.48 mmol/L' },
      { name: 'Creatine kinase', range: '35-250 u/L' },
    ],
  },
  {
    category: 'Arterial blood gases',
    ranges: [
      { name: 'pH', range: '7.35-7.45' },
      { name: 'pCO₂', range: '4.5-6.0 kPa' },
      { name: 'pO₂', range: '10-14 kPa' },
      { name: 'Bicarbonate', range: '22-28 mmol/L' },
      { name: 'Base excess', range: '-2 to +2 mmol/L' },
    ],
  },
  {
    category: 'Lipids',
    ranges: [
      { name: 'Total cholesterol', range: '< 5 mmol/L', notes: 'Desirable lipid values depend on other risk factors for cardiovascular disease, below is just a guide' },
      { name: 'Triglycerides', range: '< 2 mmol/L' },
      { name: 'HDL cholesterol', range: '> 1 mmol/L' },
      { name: 'LDL cholesterol', range: '< 3 mmol/L' },
    ],
  },
]

