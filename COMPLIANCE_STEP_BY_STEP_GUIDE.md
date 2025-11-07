# Step-by-Step Compliance Guide: Cyber Essentials, DSPT & GDPR
## Cost-Minimized Approach for Bleepy Platform

**Priority Order:** GDPR → Cyber Essentials → DSPT  
**Total Minimum Cost: £360 - £2,000** (if done yourself)  
**Timeline: 2-4 months**

---

## 🎯 PRIORITY 1: GDPR Compliance (Do This First)

**Why First:** Required by law, no certification needed, you can do it yourself  
**Cost: £0 - £1,500** (depending on DIY vs templates)  
**Timeline: 2-4 weeks**

### Step 1: Data Protection Impact Assessment (DPIA) - FREE

**What:** Document showing you've assessed data privacy risks  
**Cost: £0 (DIY)** or £500-£1,000 (template/consultant)

**DIY Steps:**
1. Download DPIA template from ICO: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/accountability-and-governance/data-protection-impact-assessments/
2. Fill out sections:
   - What data you collect (user names, emails, event attendance)
   - Why you collect it (event management, attendance tracking)
   - How you store it (Supabase database, encrypted)
   - Who has access (your team, NHS trust admins)
   - Risks (data breach, unauthorized access)
   - Mitigations (encryption, access controls, RLS policies)
3. Save as PDF document

**Time Required:** 4-8 hours  
**Cost:** £0

### Step 2: Privacy Policy - £0-£500

**What:** Legal document explaining how you handle personal data  
**Cost: £0 (DIY)** or £200-£500 (template/legal review)

**DIY Steps:**
1. Use free privacy policy generator: https://www.privacypolicygenerator.info/ or https://www.privacypolicytemplate.net/
2. Customize for your platform:
   - What data: Names, emails, event attendance, feedback
   - Purpose: Event management, attendance tracking, certificates
   - Legal basis: Legitimate interest (NHS education)
   - Data retention: 7 years (NHS requirement)
   - User rights: Access, deletion, correction
   - Contact: Your email/address
3. Add to your website footer
4. Show on registration/login page

**Time Required:** 2-4 hours  
**Cost:** £0 (DIY) or £200-£500 (legal review recommended)

**Cheap Option:** Buy GDPR privacy policy template from Etsy/LegalZoom: £10-£50

### Step 3: Data Processing Agreement (DPA) Template - £0-£800

**What:** Contract template for NHS trusts (they sign when using your platform)  
**Cost: £0 (DIY)** or £300-£800 (legal template)

**DIY Steps:**
1. Download DPA template from ICO: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/contracts-and-liabilities/
2. Customize:
   - Your company name
   - Data you process (user data, event data)
   - Security measures (encryption, access controls)
   - Data breach procedures
   - Data retention (7 years)
3. Have NHS trust sign before they use platform

**Time Required:** 3-6 hours  
**Cost:** £0 (DIY) or £300-£800 (legal review recommended)

**Cheap Option:** Buy DPA template: £50-£200

### Step 4: Data Subject Access Request (DSAR) Procedure - FREE

**What:** Process for when users request their data  
**Cost: £0 (DIY)**

**DIY Steps:**
1. Create email: dsar@yourcompany.com
2. Document process:
   - User emails request
   - You verify identity
   - Export their data from database (within 30 days)
   - Send as CSV/PDF
3. Add to privacy policy: "To request your data, email dsar@yourcompany.com"

**Time Required:** 1-2 hours  
**Cost:** £0

### Step 5: Data Breach Procedure - FREE

**What:** What to do if data is compromised  
**Cost: £0 (DIY)**

**DIY Steps:**
1. Document procedure:
   - Detect breach (monitoring, alerts)
   - Assess impact (how many users affected)
   - Notify ICO within 72 hours (if high risk)
   - Notify affected users (if high risk)
   - Document everything
2. Add to your internal documentation

**Time Required:** 1-2 hours  
**Cost:** £0

### GDPR Summary

| Task | DIY Cost | Paid Cost | Time | Priority |
|------|----------|-----------|------|----------|
| DPIA | £0 | £500-£1,000 | 4-8 hours | ✅ Must do |
| Privacy Policy | £0-£50 | £200-£500 | 2-4 hours | ✅ Must do |
| DPA Template | £0-£200 | £300-£800 | 3-6 hours | ✅ Must do |
| DSAR Procedure | £0 | £0 | 1-2 hours | ✅ Must do |
| Breach Procedure | £0 | £0 | 1-2 hours | ✅ Must do |
| **TOTAL** | **£0-£250** | **£1,000-£2,300** | **11-22 hours** | |

**Recommendation:** Do DPIA, Privacy Policy, and Procedures yourself (£0). Pay for DPA template review (£300-£500) to ensure it's legally sound.

---

## 🎯 PRIORITY 2: Cyber Essentials Basic (Cheapest Certification)

**Why Second:** Shows NHS you take security seriously, required for contracts  
**Cost: £300-£360** (fixed cost, can't reduce)  
**Timeline: 2-4 weeks**

### What is Cyber Essentials?

Government-backed cybersecurity certification. Two levels:
- **Cyber Essentials (Basic):** Self-assessment, £300+VAT = **£360** ✅ Start here
- **Cyber Essentials Plus:** External audit, £1,000-£2,500 ❌ Skip initially

### Step 1: Prepare Your Systems (FREE)

**Before applying, ensure you have:**

1. **Firewall:**
   - ✅ Vercel/Supabase have built-in firewalls
   - ✅ No action needed if using cloud services

2. **Secure Configuration:**
   - ✅ Use HTTPS (SSL certificates - free with Let's Encrypt)
   - ✅ Disable unnecessary services
   - ✅ Change default passwords
   - ✅ Supabase/Vercel handle this automatically

3. **Access Control:**
   - ✅ User authentication (Supabase Auth)
   - ✅ Role-based access (admin, user)
   - ✅ Strong passwords required
   - ✅ Two-factor authentication (2FA) - enable in Supabase

4. **Malware Protection:**
   - ✅ Use reputable cloud services (Supabase, Vercel)
   - ✅ Keep dependencies updated
   - ✅ Scan for vulnerabilities (npm audit, Snyk)

5. **Patch Management:**
   - ✅ Keep dependencies updated
   - ✅ Use automated updates where possible
   - ✅ Monitor security advisories

**Time Required:** 4-8 hours to review and document  
**Cost:** £0

### Step 2: Complete Self-Assessment (£360)

**Process:**
1. Go to: https://www.cyberessentials.ncsc.gov.uk/
2. Choose certification body (cheapest: IASME, IT Governance, or APMG)
3. Register and pay: **£300 + VAT = £360**
4. Complete online questionnaire (takes 1-2 hours):
   - Questions about your IT setup
   - Security measures in place
   - Policies and procedures
5. Submit for review
6. Receive certificate (valid 12 months)

**Time Required:** 2-4 hours  
**Cost:** £360 (fixed, cannot reduce)

**Tips to Pass:**
- Answer honestly
- If you use cloud services (Supabase/Vercel), mention they handle security
- Document your security measures
- Enable 2FA on all accounts

### Step 3: Display Certificate (FREE)

**After receiving certificate:**
1. Download certificate PDF
2. Add to your website: "Cyber Essentials Certified"
3. Include in NHS proposals
4. Renew annually (£360/year)

**Time Required:** 30 minutes  
**Cost:** £0

### Cyber Essentials Summary

| Task | Cost | Time | Priority |
|------|------|------|----------|
| System Preparation | £0 | 4-8 hours | ✅ Must do |
| Self-Assessment | £360 | 2-4 hours | ✅ Must do |
| Display Certificate | £0 | 30 min | ✅ Must do |
| **TOTAL** | **£360** | **6-12 hours** | |

**Note:** This is the minimum cost - Cyber Essentials Basic is £360 and cannot be done cheaper. The "Plus" version costs £1,000-£2,500 but is NOT required initially.

---

## 🎯 PRIORITY 3: DSPT (Data Security & Protection Toolkit)

**Why Third:** Free to complete, but takes time. Shows NHS you're serious  
**Cost: £0** (completely free)  
**Timeline: 2-4 weeks**

### What is DSPT?

Annual self-assessment showing you meet NHS data security standards.  
**It's FREE** - no certification body, no fees, just documentation.

### Step 1: Register for DSPT (FREE)

**Process:**
1. Go to: https://www.dsptoolkit.nhs.uk/
2. Click "Register" or "Sign In"
3. Register as "Organisation" (not individual)
4. Use your company details
5. Verify email

**Time Required:** 15 minutes  
**Cost:** £0

### Step 2: Complete Self-Assessment (FREE)

**The assessment covers 10 categories:**

1. **Data Protection Impact Assessment (DPIA)**
   - ✅ You already did this for GDPR (Step 1 above)
   - Upload your DPIA document

2. **Information Governance Policies**
   - ✅ Privacy Policy (already done)
   - ✅ Data Breach Procedure (already done)
   - ✅ Access Control Policy (document who can access data)
   - ✅ Data Retention Policy (7 years for NHS)

3. **Staff Training**
   - Document that you/your team understand data protection
   - Can be simple: "All team members have completed GDPR awareness"

4. **Access Controls**
   - Document: Role-based access, authentication, 2FA
   - Show: Supabase RLS policies, user roles

5. **Data Encryption**
   - Document: Data encrypted in transit (HTTPS) and at rest (Supabase encryption)
   - Show: SSL certificates, database encryption

6. **Network Security**
   - Document: Firewalls, secure connections
   - Show: Vercel/Supabase security measures

7. **Malware Protection**
   - Document: Dependencies updated, vulnerability scanning
   - Show: npm audit results, security monitoring

8. **Backup & Recovery**
   - Document: Regular backups, recovery procedures
   - Show: Supabase automatic backups

9. **Incident Management**
   - Document: Data breach procedure (already done for GDPR)
   - Show: How you'd respond to incidents

10. **Business Continuity**
    - Document: How service continues if issues occur
    - Show: Redundancy, monitoring, uptime

**Time Required:** 8-16 hours (first time, then 2-4 hours annually)  
**Cost:** £0

### Step 3: Submit & Get Status (FREE)

**After completing:**
1. Submit assessment
2. Receive status:
   - **"Standards Met"** ✅ (best - shows full compliance)
   - **"Standards Not Met"** ⚠️ (shows effort, can improve)
   - **"Not Published"** (private, for your records)

**For NHS contracts:** "Standards Met" is preferred, but "Standards Not Met" with improvement plan is acceptable for pilots.

**Time Required:** 1 hour  
**Cost:** £0

### Step 4: Annual Renewal (FREE)

**DSPT must be renewed annually:**
- Update any changes
- Re-submit assessment
- Keep status current

**Time Required:** 2-4 hours annually  
**Cost:** £0

### DSPT Summary

| Task | Cost | Time | Priority |
|------|------|------|----------|
| Register | £0 | 15 min | ✅ Must do |
| Complete Assessment | £0 | 8-16 hours | ✅ Must do |
| Submit | £0 | 1 hour | ✅ Must do |
| Annual Renewal | £0 | 2-4 hours/year | ✅ Must do |
| **TOTAL** | **£0** | **9-17 hours** | |

**Note:** DSPT is completely free. The time investment is the only cost. You may not achieve "Standards Met" on first try, but that's okay - you can improve and resubmit.

---

## 📊 Complete Cost Breakdown (Minimum)

### Option A: Maximum DIY (Cheapest)

| Compliance | Cost | Time | When |
|------------|------|------|------|
| GDPR (DIY) | £0-£250 | 11-22 hours | Week 1-2 |
| Cyber Essentials | £360 | 6-12 hours | Week 3-4 |
| DSPT | £0 | 9-17 hours | Week 5-6 |
| **TOTAL** | **£360-£610** | **26-51 hours** | **6-8 weeks** |

### Option B: Minimal Paid Help (Recommended)

| Compliance | Cost | Time | When |
|------------|------|------|------|
| GDPR (with DPA review) | £300-£500 | 8-15 hours | Week 1-2 |
| Cyber Essentials | £360 | 6-12 hours | Week 3-4 |
| DSPT | £0 | 9-17 hours | Week 5-6 |
| **TOTAL** | **£660-£860** | **23-44 hours** | **6-8 weeks** |

### Option C: Full Professional Help (Not Recommended Initially)

| Compliance | Cost | Time | When |
|------------|------|------|------|
| GDPR (consultant) | £1,000-£2,300 | 2-4 hours | Week 1-2 |
| Cyber Essentials | £360 | 2-4 hours | Week 3-4 |
| DSPT (consultant) | £500-£1,500 | 2-4 hours | Week 5-6 |
| **TOTAL** | **£1,860-£4,160** | **6-12 hours** | **6-8 weeks** |

**Recommendation:** Use Option B - DIY most things, pay for DPA legal review (£300-£500) to ensure it's correct.

---

## 🗓️ Recommended Timeline

### Month 1: GDPR Compliance

**Week 1:**
- [ ] Complete DPIA (4-8 hours)
- [ ] Create Privacy Policy (2-4 hours)
- [ ] Set up DSAR email and procedure (1-2 hours)

**Week 2:**
- [ ] Create DPA template (3-6 hours)
- [ ] Get DPA reviewed by lawyer (£300-£500) - optional but recommended
- [ ] Document data breach procedure (1-2 hours)
- [ ] Publish Privacy Policy on website

**Cost: £0-£500**  
**Time: 11-22 hours**

### Month 2: Cyber Essentials

**Week 3:**
- [ ] Review system security (4-8 hours)
- [ ] Enable 2FA on all accounts
- [ ] Document security measures
- [ ] Register for Cyber Essentials (£360)

**Week 4:**
- [ ] Complete self-assessment (2-4 hours)
- [ ] Submit for review
- [ ] Receive certificate
- [ ] Display on website

**Cost: £360**  
**Time: 6-12 hours**

### Month 2-3: DSPT

**Week 5-6:**
- [ ] Register for DSPT (15 min)
- [ ] Complete self-assessment (8-16 hours)
- [ ] Upload supporting documents
- [ ] Submit assessment

**Week 7-8:**
- [ ] Review feedback (if any)
- [ ] Make improvements
- [ ] Resubmit if needed
- [ ] Achieve "Standards Met" or "Standards Not Met" status

**Cost: £0**  
**Time: 9-17 hours**

---

## ✅ Quick Start Checklist

### Immediate Actions (This Week)

1. **GDPR:**
   - [ ] Download DPIA template from ICO
   - [ ] Start filling out DPIA (what data, why, how, risks)
   - [ ] Use free privacy policy generator
   - [ ] Create dsar@yourcompany.com email

2. **Cyber Essentials:**
   - [ ] Review: https://www.cyberessentials.ncsc.gov.uk/
   - [ ] Enable 2FA on Supabase, Vercel, email accounts
   - [ ] Run `npm audit` to check dependencies

3. **DSPT:**
   - [ ] Register at https://www.dsptoolkit.nhs.uk/
   - [ ] Bookmark the site

### This Month

- [ ] Complete GDPR documentation
- [ ] Register and pay for Cyber Essentials (£360)
- [ ] Start DSPT assessment

### Next Month

- [ ] Receive Cyber Essentials certificate
- [ ] Complete DSPT assessment
- [ ] Display certificates on website
- [ ] Include in NHS proposals

---

## 💡 Cost-Saving Tips

1. **Do GDPR yourself:** Templates are free, just takes time
2. **Skip Cyber Essentials Plus:** Basic version (£360) is enough initially
3. **DSPT is free:** Just requires time investment
4. **Use free tools:**
   - Privacy policy generators (free)
   - ICO templates (free)
   - Let's Encrypt SSL (free)
5. **Skip ISO 27001 initially:** Add later when you have revenue (£15,000-£31,000)
6. **Skip clinical safety initially:** Only needed if handling clinical data
7. **Skip NHS frameworks initially:** Register when you have customers

---

## 🚨 What NOT to Do (Save Money)

❌ **Don't hire consultants for everything** - Do GDPR and DSPT yourself  
❌ **Don't get Cyber Essentials Plus** - Basic is enough (£360 vs £1,000-£2,500)  
❌ **Don't get ISO 27001 yet** - Wait until you have revenue  
❌ **Don't register on NHS frameworks yet** - Wait until you have customers  
❌ **Don't hire DPO (Data Protection Officer)** - Only required for large companies  

---

## 📞 Resources & Links

**GDPR:**
- ICO Guide: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/
- DPIA Template: https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/accountability-and-governance/data-protection-impact-assessments/
- Privacy Policy Generator: https://www.privacypolicygenerator.info/

**Cyber Essentials:**
- Official Site: https://www.cyberessentials.ncsc.gov.uk/
- Certification Bodies: IASME, IT Governance, APMG (compare prices)

**DSPT:**
- Official Site: https://www.dsptoolkit.nhs.uk/
- Guidance: https://www.dsptoolkit.nhs.uk/Help/29

---

## 🎯 Summary

**Minimum Cost to Get Started: £360-£610**

1. **GDPR:** £0-£250 (DIY) or £300-£500 (with DPA review)
2. **Cyber Essentials:** £360 (fixed, cannot reduce)
3. **DSPT:** £0 (completely free)

**Total Time:** 26-51 hours over 6-8 weeks

**Priority Order:**
1. GDPR (legal requirement, do first)
2. Cyber Essentials (shows security, required for contracts)
3. DSPT (shows NHS compliance, free but takes time)

**Recommendation:** Start with GDPR (Week 1-2), then Cyber Essentials (Week 3-4), then DSPT (Week 5-8). Total cost: **£360-£860** if you do most yourself.

