# Microsoft 365 / Azure DPA Guide
## For Bleepy Platform - Email Service (Exchange Online)

**Date:** November 2025  
**Service:** Microsoft Exchange Online (via Microsoft Graph API)  
**Email:** support@bleepy.co.uk

---

## Your Current Setup

✅ **Email Provider:** Microsoft Exchange Online (migrated from Bluehost)  
✅ **Email Address:** support@bleepy.co.uk  
✅ **Email Sending Method:** Microsoft Graph API  
✅ **Azure Configuration:**
   - `AZURE_TENANT_ID` - Your Azure tenant ID
   - `AZURE_CLIENT_ID` - Your Azure app registration client ID
   - `AZURE_CLIENT_SECRET` - Your Azure app registration secret
   - `SMTP_USER` - support@bleepy.co.uk

---

## Understanding Microsoft's DPA

### Key Points:

1. **Automatic Inclusion:** Microsoft's Data Processing Agreement (DPA) is **automatically included** in the Microsoft Online Services Terms (OST) when you use Microsoft 365 services.

2. **Pre-Signed by Microsoft:** The DPA is **pre-signed by Microsoft** and is legally binding without requiring your signature. By using Microsoft 365 services, you automatically agree to the DPA terms.

3. **No Countersignature Required:** Unlike Supabase and Vercel, Microsoft's DPA does **NOT** require you to sign it. The document you download from Trust Center is the official DPA - it's already legally effective.

4. **Comprehensive Coverage:** The DPA covers all Microsoft 365 services including:
   - Exchange Online (your email service)
   - Microsoft Graph API (used for sending emails)
   - Azure Active Directory (authentication)
   - All other Microsoft 365 services

5. **GDPR Compliant:** Microsoft's DPA is designed to comply with GDPR requirements and is automatically in effect when you use their services.

---

## Step-by-Step: Download Microsoft 365 DPA

### Method 1: Microsoft Trust Center (Recommended)

**Step 1: Access Microsoft Trust Center**
1. Go to: **https://www.microsoft.com/trust-center**
2. Click on **"Privacy"** in the top navigation
3. Look for **"Data Protection Addendum"** or **"DPA"**

**Step 2: Download the DPA**
1. Click on **"Microsoft Products and Services Data Protection Addendum"**
2. Or go directly to: **https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA**
3. Download the latest PDF version
4. The document will be **pre-signed by Microsoft**

**Step 3: Save the DPA**
1. Save the PDF as: `Microsoft_365_DPA_2025-11-07.pdf`
2. Move it to: `legal/dpas/` folder
3. Note the version number and date in the document

**Important:** The DPA you download will **NOT have your signature** - this is correct! Microsoft's DPA is pre-signed by Microsoft and is legally binding without requiring your signature. This is different from Supabase/Vercel where you need to countersign.

---

### Method 2: Microsoft 365 Admin Center

**Step 1: Access Admin Center**
1. Go to: **https://admin.microsoft.com**
2. Sign in with your admin account (the one that manages your Microsoft 365 subscription)

**Step 2: Navigate to Privacy Settings**
1. Click on **"Settings"** in the left sidebar
2. Click on **"Org settings"**
3. Go to **"Security & Privacy"** tab
4. Look for **"Data Processing Agreement"** or **"Privacy"** section

**Step 3: Download DPA**
1. If available, click to view or download the DPA
2. Save it to your `legal/dpas/` folder

**Note:** Not all Microsoft 365 subscriptions show the DPA in the admin center. If you don't see it, use Method 1 (Trust Center).

---

### Method 3: Azure Portal

**Step 1: Access Azure Portal**
1. Go to: **https://portal.azure.com**
2. Sign in with your Azure account

**Step 2: Navigate to Legal/Compliance**
1. Click on **"Subscriptions"** in the left sidebar
2. Select your Microsoft 365 subscription
3. Look for **"Legal"** or **"Compliance"** section
4. Check for DPA or Data Protection documents

---

## What to Do After Downloading

### 1. Review the DPA

Key sections to review:
- **Data Processing:** How Microsoft processes your data
- **Data Security:** Security measures Microsoft implements
- **Data Location:** Where your data is stored/processed
- **Sub-processors:** Third parties Microsoft uses
- **Your Rights:** Your rights as a data controller

### 2. Verify Coverage

Confirm the DPA covers:
- ✅ Exchange Online (email service)
- ✅ Microsoft Graph API (email sending)
- ✅ Azure Active Directory (authentication)
- ✅ Data stored in Microsoft 365

### 3. Store the DPA

1. **Save Location:** `legal/dpas/Microsoft_365_DPA_2025-11-07.pdf`
2. **Document Details:**
   - Version number
   - Effective date
   - Expiry date (if any)
   - Microsoft contact information

### 4. Update Your Records

Update your DPA tracking spreadsheet:

| Processor | DPA Status | Date Downloaded | Date Signed | Expiry | Contact |
|-----------|------------|-----------------|-------------|--------|---------|
| Microsoft 365 | ✅ Pre-signed by Microsoft | [Date] | Pre-signed | N/A | Microsoft Trust Center |

---

## Important Notes

### ✅ What You DON'T Need to Do:

- ❌ **You don't need to sign the DPA** - Microsoft pre-signs it and it's legally binding without your signature
- ❌ **You don't need to countersign it** - Unlike other providers, Microsoft's DPA doesn't require your signature
- ❌ **You don't need to request it** - It's automatically included in the OST
- ❌ **You don't need to submit it** - It applies automatically when you use Microsoft 365

### ✅ What You DO Need to Do:

- ✅ **Download a copy** for your compliance records (even though it's not signed by you)
- ✅ **Review the DPA** to understand Microsoft's data processing
- ✅ **Store it** in your `legal/dpas/` folder
- ✅ **Document it** in your compliance records with a note that it's pre-signed by Microsoft
- ✅ **Understand** that by using Microsoft 365, you've automatically accepted the DPA terms

---

## Email Template (If Needed)

If you need to contact Microsoft support about the DPA:

**Subject:** Request for Microsoft 365 Data Processing Agreement

**Body:**
```
Dear Microsoft Support,

I am using Microsoft Exchange Online (via Microsoft Graph API) for email services 
for my organization, Bleepy.

I would like to confirm:
1. That the Microsoft Products and Services Data Protection Addendum (DPA) 
   applies to my Microsoft 365 subscription
2. Where I can download the latest version of the DPA
3. Any additional steps required for GDPR compliance

My Microsoft 365 subscription details:
- Organization: Bleepy
- Email domain: bleepy.co.uk
- Primary email: support@bleepy.co.uk

Thank you for your assistance.

Best regards,
[Your Name]
```

---

## Verification Checklist

- [ ] Downloaded Microsoft DPA from Trust Center
- [ ] Saved DPA to `legal/dpas/` folder (even though it's not signed by you - this is correct!)
- [ ] Reviewed DPA to confirm Exchange Online coverage
- [ ] Documented DPA status in compliance records
- [ ] Verified DPA covers Microsoft Graph API usage
- [ ] Confirmed DPA is pre-signed by Microsoft (no your signature needed)
- [ ] Updated DPA tracking spreadsheet with note: "Pre-signed by Microsoft, automatically in effect"
- [ ] Understood that using Microsoft 365 = automatic acceptance of DPA terms

---

## Next Steps

After downloading the Microsoft 365 DPA:

1. ✅ **Store it** in `legal/dpas/` folder
2. ✅ **Update** your compliance documentation
3. ✅ **Move on** to other GDPR compliance tasks (if any remaining)

**You're all set!** Microsoft's DPA automatically applies to your Exchange Online service.

**Note:** The DPA you downloaded is **NOT signed by you** - this is correct and expected! Microsoft's DPA is pre-signed by Microsoft and is legally binding without requiring your signature. By using Microsoft 365 services, you've automatically accepted the DPA terms.

---

## Resources

- **Microsoft Trust Center:** https://www.microsoft.com/trust-center
- **Microsoft DPA Direct Link:** https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA
- **Microsoft 365 Admin Center:** https://admin.microsoft.com
- **Azure Portal:** https://portal.azure.com
- **Microsoft Support:** https://support.microsoft.com

---

**Last Updated:** November 2025

