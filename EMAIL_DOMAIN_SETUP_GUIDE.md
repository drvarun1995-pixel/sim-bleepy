# 📧 Email Domain Authentication Setup for bleepy.co.uk

## The Problem
Microsoft Graph API emails from newly created domains trigger security warnings because email providers can't verify the domain's authenticity.

## ✅ Solution: Set Up Domain Authentication

### Step 1: SPF Record (Sender Policy Framework)
Add this DNS record to your domain:

**Type:** TXT  
**Name:** @ (or leave blank)  
**Value:** `v=spf1 include:_spf.google.com include:spf.protection.outlook.com ~all`

### Step 2: DKIM Record (DomainKeys Identified Mail)
Microsoft Graph API automatically handles DKIM signing, but you need to add the DKIM record to your DNS.

**For Microsoft Graph API, add this record:**
- **Type:** CNAME
- **Name:** `selector1._domainkey.bleepy.co.uk`
- **Value:** `selector1-bleepy-co-uk._domainkey.outlook.com`

### Step 3: DMARC Record (Domain-based Message Authentication)
Add this DNS record:

**Type:** TXT  
**Name:** `_dmarc.bleepy.co.uk`  
**Value:** `v=DMARC1; p=quarantine; rua=mailto:dmarc@bleepy.co.uk; ruf=mailto:dmarc@bleepy.co.uk; fo=1`

### Step 4: Verify Domain in Azure
1. Go to Azure Portal → Azure Active Directory
2. Navigate to "Branding" → "Custom domain names"
3. Add `bleepy.co.uk` as a custom domain
4. Verify ownership by adding the required DNS record

## 🔧 Alternative: Use a Subdomain

If the above is complex, consider using a subdomain for emails:

**Option A: Use `mail.bleepy.co.uk`**
- Set up SPF, DKIM, DMARC for the subdomain
- Update your `SMTP_USER` to `support@mail.bleepy.co.uk`

**Option B: Use `noreply.bleepy.co.uk`**
- Often has fewer authentication requirements
- Update your `SMTP_USER` to `noreply@bleepy.co.uk`

## 🚀 Quick Fix: Switch to Resend API

If domain authentication is too complex, consider switching to Resend API:

### Benefits:
- ✅ No domain authentication needed
- ✅ Better deliverability
- ✅ Professional email templates
- ✅ Easy setup

### Implementation:
1. Sign up at resend.com
2. Get API key
3. Update email service in your code

## 📋 Immediate Actions

### Option 1: Fix Domain Authentication (Recommended)
1. Add SPF, DKIM, DMARC records to your DNS
2. Verify domain in Azure
3. Wait 24-48 hours for propagation
4. Test email delivery

### Option 2: Switch to Resend API (Faster)
1. Sign up for Resend
2. Update environment variables
3. Modify email service code
4. Test immediately

## 🔍 Testing Your Setup

After implementing, test with:
```bash
# Test email delivery
curl -X POST https://sim.bleepy.co.uk/api/test-email/verification \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

## 📞 Need Help?

If you need assistance with DNS records or want to switch to Resend API, I can help you implement either solution.




