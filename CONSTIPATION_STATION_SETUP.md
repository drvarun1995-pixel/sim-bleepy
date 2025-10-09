# Constipation Station Setup Guide

## Overview
This guide covers the setup of the new **Constipation Assessment** station under the Gastrointestinal category.

## Station Details

### Patient Profile
- **Name**: Robert Thompson
- **Age**: 67 years old
- **Gender**: Male
- **Occupation**: Retired accountant
- **Presenting Complaint**: Constipation for 6 weeks

### Clinical Scenario
Robert presents with a 6-week history of constipation with hard, difficult-to-pass stools. He's opening his bowels every 4-5 days (previously daily). He started taking co-codamol for knee pain 2 months ago. He has reduced mobility, poor fluid intake, and a low-fibre diet. He's concerned about bowel cancer as a friend was recently diagnosed.

### Diagnosis
**Opioid-Induced Constipation**

### Key Learning Areas
1. History taking
2. Bowel habit changes
3. Red flag screening
4. Medication review
5. Dietary assessment
6. Functional impact
7. Communication
8. Clinical reasoning

### Difficulty Level
**Basic** - Suitable for early clinical students

## Setup Steps

### 1. Database Setup ✅ (Completed)
Run the SQL script to add the station to your Supabase database:

```bash
# The script has been created: add-constipation-station.sql
# Run this in your Supabase SQL Editor
```

### 2. Code Configuration ✅ (Completed)
The following files have been updated:
- ✅ `utils/stationConfigs.ts` - Added constipation station configuration
- ✅ `utils/medicalCategories.ts` - Added 'constipation' to gastrointestinal category

### 3. Hume AI Configuration (Required)

You need to create a Hume AI configuration for this station:

#### A. Create Hume Configuration
1. Log in to your Hume AI dashboard
2. Create a new EVI (Empathic Voice Interface) configuration
3. Use the following system prompt:

```
You are Robert Thompson, a 67-year-old retired accountant presenting to your GP with constipation.

PATIENT BACKGROUND:
- You've had constipation for 6 weeks
- Hard, difficult-to-pass stools
- Opening bowels every 4-5 days (used to be daily)
- Started co-codamol for knee pain 2 months ago
- Have hypertension and osteoarthritis
- Take amlodipine and co-codamol
- Live with your wife
- Reduced mobility due to knee pain
- Poor fluid intake (2-3 cups of tea per day)
- Low-fibre diet (white bread, not many vegetables)
- Concerned about bowel cancer (friend recently diagnosed)

SYMPTOMS TO REVEAL:
- Mild lower abdominal discomfort, relieved after passing stool
- No blood in stool
- No weight loss
- No change in appetite
- Stool is hard and pellet-like
- Sometimes need to strain
- No family history of bowel cancer

MEDICATION HISTORY:
- Amlodipine 5mg daily for blood pressure (5 years)
- Co-codamol 30/500 twice daily (started 2 months ago for knee pain)
- No allergies

SOCIAL HISTORY:
- Retired accountant
- Live with wife in bungalow
- Independent but limited mobility
- Don't exercise much due to knee pain
- Non-smoker
- Occasional alcohol (1-2 beers per week)

RED FLAGS TO DENY:
- No blood in stool (neither bright red nor dark/black)
- No unintentional weight loss
- No family history of bowel cancer
- No change in stool calibre
- No alternating constipation/diarrhea
- No abdominal mass felt
- No night sweats or fever

COMMUNICATION STYLE:
- Polite and cooperative
- Slightly embarrassed discussing bowel habits
- Worried about cancer but trying not to show it
- Willing to answer questions honestly
- Appreciates clear explanations
- Concerned about becoming dependent on laxatives

RESPOND NATURALLY:
- Answer questions as the patient would
- Don't volunteer all information at once
- Show appropriate emotion (worry, embarrassment, relief)
- Ask relevant questions about treatment
- React positively to reassurance and clear explanations
```

#### B. Add Environment Variable
Add the Hume configuration ID to your `.env.local` file:

```bash
NEXT_PUBLIC_HUME_CONFIG_CONSTIPATION=your_hume_config_id_here
```

#### C. Restart Development Server
After adding the environment variable:
```bash
npm run dev
```

### 4. Testing the Station

1. Navigate to the dashboard: `/dashboard`
2. Click on "Clinical Stations"
3. You should see the Gastrointestinal category now has 1 station
4. Click on the Gastrointestinal category
5. Click on "Constipation Assessment"
6. Test the station to ensure:
   - Patient responds appropriately
   - All key areas can be assessed
   - Scoring works correctly
   - Session records properly

## Clinical Teaching Points

### Red Flags for Constipation (to rule out)
- Blood in stool (PR bleeding or melaena)
- Unintentional weight loss
- Family history of colorectal cancer
- New onset in patient >50 years
- Abdominal mass
- Change in stool calibre
- Alternating bowel habit

### Common Causes of Constipation
1. **Medications** (most common in this case)
   - Opioids (co-codamol)
   - Anticholinergics
   - Iron supplements
   - Calcium channel blockers

2. **Lifestyle Factors**
   - Low fibre diet
   - Poor fluid intake
   - Reduced mobility
   - Ignoring urge to defecate

3. **Medical Conditions**
   - Hypothyroidism
   - Diabetes
   - Parkinson's disease
   - IBS

### Management Approach
1. **Immediate**
   - Review medications (consider reducing/stopping opioid)
   - Dietary advice (increase fibre gradually)
   - Fluid intake (aim for 2L per day)
   - Mobility/exercise advice
   - Laxatives (osmotic first-line: lactulose or macrogol)

2. **Safety Netting**
   - Red flag symptoms
   - When to seek urgent review
   - Expected timeline for improvement

3. **Follow-up**
   - Review in 2-4 weeks
   - Consider FIT test if red flags
   - Refer if not improving or red flags develop

## Station Objectives

By the end of this station, students should be able to:
1. Take a comprehensive constipation history
2. Identify medication-induced constipation
3. Screen for red flag symptoms
4. Assess dietary and lifestyle factors
5. Provide appropriate patient education
6. Demonstrate empathy and address patient concerns
7. Formulate an appropriate management plan

## Assessment Criteria

### Communication Skills
- Introduces self and confirms patient identity
- Uses open questions appropriately
- Shows empathy and addresses patient concerns
- Explains clearly and checks understanding

### Data Gathering
- Systematic bowel history (frequency, consistency, straining)
- Medication review
- Red flag screening
- Dietary and fluid intake assessment
- Mobility and lifestyle factors

### Clinical Reasoning
- Identifies opioid as likely cause
- Rules out red flags appropriately
- Considers differential diagnoses
- Formulates appropriate management plan

### Management
- Discusses medication review
- Provides dietary and lifestyle advice
- Explains laxative options
- Appropriate safety netting
- Arranges follow-up

## Notes
- This is a **Basic** level station, suitable for early clinical students
- Focuses on history taking and communication rather than examination
- Good station for teaching medication review and lifestyle advice
- Emphasizes the importance of red flag screening
- Demonstrates common GP presentation

## Support
If you encounter any issues with the station setup, check:
1. Hume configuration is active and accessible
2. Environment variable is correctly set
3. Database has the station entry
4. No console errors in browser developer tools

