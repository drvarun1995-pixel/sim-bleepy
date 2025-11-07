# GDPR Setup Instructions - Step by Step
## Bleepy Medical Education Platform

**Date:** November 2025

---

## 1. ✅ Set Up Cron Job for Automated Data Purging

### Step 1: Update vercel.json

Your `vercel.json` already exists and has cron jobs. Add the data retention cron job:

**File:** `vercel.json`

**Current content:**
```json
{
  "functions": { ... },
  "crons": [
    {
      "path": "/api/jobs/feedback-invites",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/jobs/certificates-auto-generate",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Add this new cron job:**
```json
{
  "functions": { ... },
  "crons": [
    {
      "path": "/api/jobs/feedback-invites",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/jobs/certificates-auto-generate",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/data-retention",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `"0 2 * * *"` = Daily at 2:00 AM UTC
- Format: `minute hour day month weekday`
- You can change to `"0 3 * * *"` for 3 AM, etc.

### Step 2: Add Environment Variable

**In Vercel Dashboard:**
1. Go to: https://vercel.com/dashboard
2. Select your project: `sim-bleepy` (or your project name)
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Generate a random secret (see below)
   - **Environment:** Production, Preview, Development (all)
5. Click **Save**

**Generate Secret:**
```bash
# Option 1: Use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Use online generator
# https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")
```

**Or use this:** Copy a long random string like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

### Step 3: Test the Cron Job

**Option A: Test Manually (Before Deploying)**
1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/cron/data-retention?secret=YOUR_SECRET`
3. Check the response - should show cleanup results

**Option B: Test After Deploying**
1. Deploy to Vercel
2. Visit: `https://sim.bleepy.co.uk/api/cron/data-retention?secret=YOUR_SECRET`
3. Check response

**Option C: Check Vercel Cron Logs**
1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on latest deployment
3. Go to **Functions** tab
4. Look for cron job executions

### Step 4: Verify It's Working

**After 24 hours:**
1. Check Vercel logs for cron execution
2. Check database - old tokens should be deleted
3. Verify no errors in logs

**Done!** ✅ The cron job will now run daily at 2 AM UTC and automatically purge old data.

---

## 2. ✅ Request Data Processing Agreements (DPAs)

### What is a DPA?
A Data Processing Agreement (DPA) is a legal contract between you (data controller) and third-party services (data processors) that process personal data on your behalf.

**GDPR Requirement:** You must have DPAs with all processors.

### Step-by-Step: Request DPAs

#### A. Supabase DPA

**Step 1: Check if Already Available**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Legal** or **Compliance**
4. Look for "Data Processing Agreement" or "DPA"

**Step 2: Request DPA**
1. **Email:** support@supabase.io
2. **Subject:** "Request for Data Processing Agreement (DPA)"
3. **Template:**
```
Subject: Request for Data Processing Agreement (DPA)

Dear Supabase Team,

I am using Supabase for database and storage services for my medical education platform (Bleepy) which processes personal data of NHS staff and medical students in the UK.

Under GDPR Article 28, I require a Data Processing Agreement (DPA) with Supabase as a data processor.

Could you please provide:
1. Your standard DPA template
2. Instructions for signing/executing the DPA

My Supabase Project ID: [Your Project ID]
Organization: [Your Company Name]

Thank you,
[Your Name]
[Your Email]
```

**Step 3: Review and Sign**
- Review the DPA
- Check it covers:
  - GDPR compliance
  - Data security measures
  - Sub-processors
  - Data location (EU/UK preferred)
- Sign and store securely

---

#### B. Vercel DPA

**Step 1: Check if Already Available**
1. Go to: https://vercel.com/dashboard
2. Go to **Settings** → **Legal** or **Billing**
3. Look for "Data Processing Agreement"

**Step 2: Request DPA**
1. **Email:** enterprise@vercel.com (or support@vercel.com)
2. **Subject:** "Request for Data Processing Agreement (DPA)"
3. **Template:**
```
Subject: Request for Data Processing Agreement (DPA)

Dear Vercel Team,

I am using Vercel for hosting my medical education platform (Bleepy) which processes personal data of NHS staff and medical students in the UK.

Under GDPR Article 28, I require a Data Processing Agreement (DPA) with Vercel as a data processor.

Could you please provide:
1. Your standard DPA template
2. Instructions for signing/executing the DPA

My Vercel Account: [Your Email]
Organization: [Your Company Name]

Thank you,
[Your Name]
[Your Email]
```

**Note:** Vercel may have DPA available in dashboard for Pro/Enterprise plans.

---

---

#### D. Azure/Microsoft 365 DPA (If Using)

**Your Setup:**
- ✅ You're using **Microsoft Graph API** (Azure/Microsoft 365) for email sending
- ✅ Email migrated from Bluehost to **Microsoft Exchange Online**
- ✅ Email address: `support@bleepy.co.uk`
- ✅ Using Azure App Registration with: `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`

**Step 1: Understand Microsoft's DPA**

Microsoft's Data Processing Agreement (DPA) is **automatically included** in the Microsoft Online Services Terms (OST) when you use Microsoft 365 services. However, you should download and keep a copy for your records.

**Step 2: Download Microsoft DPA**

**Option A: Microsoft Trust Center (Recommended)**
1. Go to: **https://www.microsoft.com/trust-center**
2. Navigate to: **"Privacy"** → **"Data Protection Addendum"**
3. Or direct link: **https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA**
4. Download the latest version of the DPA PDF
5. The DPA is **pre-signed by Microsoft** and applies automatically to all Microsoft 365 services

**Option B: Microsoft 365 Admin Center**
1. Go to: **https://admin.microsoft.com**
2. Sign in with your admin account
3. Go to: **Settings** → **Org settings** → **Security & Privacy**
4. Look for "Data Processing Agreement" or "Privacy" section
5. Download the DPA if available

**Option C: Azure Portal**
1. Go to: **https://portal.azure.com**
2. Sign in with your Azure account
3. Go to: **Subscriptions** → Your subscription → **Legal** or **Compliance**
4. Look for "Data Processing Agreement"

**Step 3: Verify DPA Coverage**

The Microsoft DPA covers:
- ✅ **Exchange Online** (your email service)
- ✅ **Microsoft Graph API** (used for sending emails)
- ✅ **Azure Active Directory** (authentication)
- ✅ All Microsoft 365 services

**Step 4: Store the DPA**

1. Download the DPA PDF from Microsoft Trust Center
2. Save it to: `legal/dpas/Microsoft_365_DPA_YYYY-MM-DD.pdf`
3. Note: Microsoft's DPA is **pre-signed** by Microsoft, so you don't need to sign it separately
4. The DPA automatically applies when you use Microsoft 365 services

**Step 5: Document DPA Status**

Update your DPA tracking:
- **Status:** ✅ Automatically included (pre-signed by Microsoft)
- **Date Downloaded:** [Date you download it]
- **Version:** [Check the version number on the DPA]
- **Coverage:** Exchange Online, Microsoft Graph API, Azure AD

**Important Notes:**
- Microsoft's DPA is **automatically in effect** when you use their services
- No separate signing required (Microsoft pre-signs it)
- The DPA is part of the Microsoft Online Services Terms (OST)
- Keep a downloaded copy for your compliance records

---

#### E. OpenAI DPA (If Using)

**Step 1: Check Dashboard**
1. Go to: https://platform.openai.com
2. Check **Settings** → **Organization** → **Data Processing**

**Step 2: Request DPA**
1. **Email:** support@openai.com
2. **Subject:** "Request for Data Processing Agreement (DPA)"
3. **Template:** Similar to above

**Note:** OpenAI may require Business/Enterprise plan for DPA.

---

### Step 3: Organize DPAs

**Create a folder:** `legal/dpas/`

**Store:**
- Signed DPAs (PDFs)
- Email correspondence
- DPA templates

**Document:**
- Date received
- Date signed
- Expiry date (if any)
- Contact person at processor

**Create a spreadsheet:**
| Processor | DPA Status | Date Received | Date Signed | Expiry | Contact |
|-----------|------------|---------------|-------------|--------|---------|
| Supabase | Pending | - | - | - | support@supabase.io |
| Vercel | Pending | - | - | - | enterprise@vercel.com |
| Azure | Pending | - | - | - | Microsoft 365 Admin Center |

---

## 3. ✅ Set Up DSAR Email

### Yes, You Can Use support@bleepy.co.uk!

**Answer:** ✅ **YES** - You can absolutely use `support@bleepy.co.uk` for DSAR requests. This is perfectly acceptable and actually common practice.

### Step 1: Update Privacy Policy

**File:** `app/privacy/page.tsx`

**Find this section (around line 330-336):**
```tsx
<div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
  <h3 className="font-semibold text-yellow-800 mb-2">How to Exercise Your Rights</h3>
  <p className="text-yellow-700 mb-2">To exercise any of these rights, please contact us at:</p>
  <ul className="list-disc list-inside space-y-1 text-yellow-700 ml-4">
    <li>Email: <a href="mailto:support@bleepy.co.uk" className="hover:text-yellow-900 underline">support@bleepy.co.uk</a></li>
    <li>Subject line: "GDPR Data Request"</li>
    <li>Include your account email and specify which right you wish to exercise</li>
  </ul>
  <p className="text-yellow-700 mt-2 text-sm">We will respond within 30 days of receiving your request.</p>
</div>
```

**Update to be more specific:**
```tsx
<div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
  <h3 className="font-semibold text-yellow-800 mb-2">How to Exercise Your Rights</h3>
  <p className="text-yellow-700 mb-2">To exercise any of these rights, including requesting a copy of your data (Data Subject Access Request), please contact us at:</p>
  <ul className="list-disc list-inside space-y-1 text-yellow-700 ml-4">
    <li>Email: <a href="mailto:support@bleepy.co.uk" className="hover:text-yellow-900 underline">support@bleepy.co.uk</a></li>
    <li>Subject line: "GDPR Data Request" or "Data Subject Access Request"</li>
    <li>Include your account email and specify which right you wish to exercise</li>
  </ul>
  <p className="text-yellow-700 mt-2 text-sm">We will respond within 30 days of receiving your request.</p>
</div>
```

### Step 2: Update DSAR Procedure Document

**File:** `DSAR_PROCEDURE.md`

**Update the email address:**
- Change: `dsar@yourcompany.com`
- To: `support@bleepy.co.uk`

### Step 3: Set Up Email Filtering (Optional but Recommended)

**If using Gmail/Outlook:**
1. Create a label/folder: "DSAR Requests"
2. Create a filter:
   - **Subject contains:** "GDPR Data Request" OR "Data Subject Access Request" OR "DSAR"
   - **Action:** Apply label "DSAR Requests", Star it, Mark as important

**If using email service (Azure/Microsoft 365):**
- Set up email forwarding rules
- Or use email tags/labels

### Step 4: Create Email Template

**Create a quick response template:**

**Subject:** Re: GDPR Data Request - [Reference Number]

**Body:**
```
Dear [Name],

Thank you for your data access request received on [Date].

We have assigned your request reference number: [DSAR-2025-XXX]

We will respond to your request within 30 days as required by GDPR.

If you have any questions, please quote your reference number in any correspondence.

Best regards,
[Your Name]
Data Protection Lead
Bleepy Platform
support@bleepy.co.uk
```

**Done!** ✅ Your DSAR email is set up.

---

## 4. ⚠️ Is 2FA Needed?

### Short Answer: **YES, for Admin Accounts**

### Detailed Answer:

#### ✅ **YES - Required for:**
1. **Supabase Dashboard Access**
   - **Why:** Contains database with all user data
   - **Risk:** If compromised, attacker has full database access
   - **Action:** Enable 2FA immediately

2. **Vercel Dashboard Access**
   - **Why:** Can deploy code, access environment variables, view logs
   - **Risk:** If compromised, attacker can modify application
   - **Action:** Enable 2FA immediately

3. **Email Accounts (support@bleepy.co.uk)**
   - **Why:** Receives DSAR requests, can reset passwords
   - **Risk:** If compromised, attacker can access sensitive communications
   - **Action:** Enable 2FA immediately

4. **GitHub/Git Repository (if applicable)**
   - **Why:** Contains code, potentially environment variables
   - **Risk:** If compromised, attacker can see code structure
   - **Action:** Enable 2FA if using GitHub

#### ⚠️ **NOT Required (but recommended) for:**
- **Regular Users:** Not required by GDPR, but good security practice
- **Can be implemented later** as optional feature

### How to Enable 2FA

#### A. Supabase 2FA

**Step 1:**
1. Go to: https://supabase.com/dashboard
2. Click your profile (top right)
3. Go to **Account Settings** → **Security**
4. Click **Enable Two-Factor Authentication**
5. Follow setup instructions (use authenticator app like Google Authenticator)

**Step 2:**
- Scan QR code with authenticator app
- Enter verification code
- Save backup codes securely

**Done!** ✅

---

#### B. Vercel 2FA

**Step 1:**
1. Go to: https://vercel.com/dashboard
2. Click your profile (top right)
3. Go to **Settings** → **Security**
4. Click **Enable Two-Factor Authentication**
5. Follow setup instructions

**Step 2:**
- Scan QR code with authenticator app
- Enter verification code
- Save backup codes securely

**Done!** ✅

---

#### C. Email Account 2FA

**If using Gmail:**
1. Go to: https://myaccount.google.com/security
2. Click **2-Step Verification**
3. Follow setup instructions

**If using Outlook/Microsoft 365:**
1. Go to: https://account.microsoft.com/security
2. Click **Advanced security options**
3. Enable **Two-step verification**

**If using custom email (via Azure/Microsoft 365):**
- Check your email provider's documentation
- Usually in account settings → security

**Done!** ✅

---

#### D. GitHub 2FA (If Using)

**Step 1:**
1. Go to: https://github.com/settings/security
2. Click **Enable two-factor authentication**
3. Follow setup instructions

**Done!** ✅

---

### Priority Order

**Do These First (Critical):**
1. ✅ Supabase 2FA (highest priority - database access)
2. ✅ Vercel 2FA (high priority - can deploy code)
3. ✅ Email 2FA (high priority - DSAR requests)

**Do These Later:**
4. ⚠️ GitHub 2FA (if using)
5. ⚠️ User 2FA (optional feature for future)

---

## Summary Checklist

### ✅ Completed
- [x] Cron job code created (`app/api/cron/data-retention/route.ts`)
- [x] Account deletion enhanced
- [x] Data breach procedure documented
- [x] DSAR procedure documented

### ⚠️ Action Required

**This Week:**
- [ ] Add cron job to `vercel.json`
- [ ] Add `CRON_SECRET` to Vercel environment variables
- [ ] Update privacy policy with DSAR email (support@bleepy.co.uk)
- [ ] Enable 2FA on Supabase
- [ ] Enable 2FA on Vercel
- [ ] Enable 2FA on email account

**This Month:**
- [ ] Request DPA from Supabase
- [ ] Request DPA from Vercel
- [ ] Request DPA from Azure/Microsoft 365 (if using)
- [ ] Organize and store signed DPAs
- [ ] Test cron job after deployment

---

## Quick Reference

### Cron Job Schedule
- **Path:** `/api/cron/data-retention`
- **Schedule:** `0 2 * * *` (Daily at 2 AM UTC)
- **Secret:** Set `CRON_SECRET` environment variable

### DSAR Email
- **Email:** support@bleepy.co.uk
- **Response Time:** 30 days
- **Subject:** "GDPR Data Request" or "Data Subject Access Request"

### DPA Contacts
- **Supabase:** support@supabase.io
- **Vercel:** enterprise@vercel.com
- **Azure/Microsoft 365:** Microsoft 365 Admin Center

### 2FA Priority
1. Supabase (Critical)
2. Vercel (Critical)
3. Email (Critical)
4. GitHub (If using)

---

**Last Updated:** November 2025

