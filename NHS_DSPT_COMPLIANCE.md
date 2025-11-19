# NHS Data Security and Protection Toolkit (DSPT) Compliance
## Bleepy Medical Education Platform

**Version:** 1.0  
**Date:** January 2025  
**Status:** In Progress (30% Complete)

---

## 1. Executive Summary

### 1.1 What is DSPT?

The **Data Security and Protection Toolkit (DSPT)** is a mandatory self-assessment tool for all organizations that process NHS patient data or provide services to the NHS. It replaced the previous Information Governance Toolkit (IGT) in 2018.

### 1.2 Why is DSPT Required?

- **Mandatory** for all NHS suppliers and contractors
- **Required** before processing NHS patient data
- **Annual renewal** required
- **Evidence** of compliance with NHS data security standards
- **Contract requirement** for many NHS procurements

### 1.3 Current Status

**Status:** ⚠️ **In Progress** (30% Complete)

**What's Done:**
- ✅ DPIA completed (prerequisite)
- ✅ Technical security measures implemented
- ✅ DPAs obtained
- ✅ Data breach procedure documented

**What's Remaining:**
- ⚠️ DSPT self-assessment completion
- ⚠️ Evidence collection
- ⚠️ Submission to NHS Digital
- ⚠️ Achievement of "Standards Met" status

---

## 2. DSPT Requirements Overview

### 2.1 The 10 Data Security Standards

The DSPT is based on 10 Data Security Standards:

1. **All staff ensure that personal confidential data is handled, stored and transmitted securely**
2. **All personal confidential data is processed lawfully**
3. **All staff understand their responsibilities under the National Data Guardian's Data Security Standards**
4. **All personal confidential data is only accessible to staff who need it for their current role**
5. **Processes are reviewed at least annually to identify and improve processes which have caused breaches or near misses**
6. **Cyber attacks against services are identified and resisted**
7. **A continuity plan is in place to respond to threats to data security**
8. **No unsupported systems are used to process personal confidential data**
9. **A strategy is in place for protecting IT systems from cyber threats**
10. **IT suppliers are held accountable via contracts for protecting personal confidential data**

### 2.2 DSPT Evidence Types

The DSPT requires evidence for each standard:

- **Policies and Procedures** (written documentation)
- **Training Records** (staff training evidence)
- **Technical Evidence** (screenshots, configurations)
- **Contractual Evidence** (DPAs, contracts)
- **Audit Evidence** (audit reports, logs)

---

## 3. DSPT Self-Assessment

### 3.1 Registration

**Step 1: Register for DSPT**
- Go to: https://www.dsptoolkit.nhs.uk/
- Click "Register" or "Sign In"
- Create account (if new)
- Select organization type: "Commercial Third Party"

**Step 2: Organization Details**
- Company name: [Your Company Name]
- Company registration number: [Your Company Number]
- Address: [Your Address]
- Contact details: [Your Contact]

### 3.2 Assessment Questions

The DSPT contains approximately **54 questions** across the 10 standards. Each question requires:
- **Answer** (Yes/No/Partial/Not Applicable)
- **Evidence** (upload documents, provide links)
- **Comments** (explanations where needed)

### 3.3 Key Questions for Bleepy Platform

#### Standard 1: Secure Handling, Storage and Transmission

**Q1.1: Do you have a data security policy?**
- **Answer:** Yes
- **Evidence:** 
  - Data breach response procedure
  - Security policies (to be created)
  - DPIA document
- **Status:** ✅ Ready

**Q1.2: Do you encrypt personal data in transit?**
- **Answer:** Yes
- **Evidence:**
  - HTTPS/SSL certificates (Vercel)
  - TLS 1.2+ enforced
  - Database connection encryption (Supabase)
- **Status:** ✅ Ready

**Q1.3: Do you encrypt personal data at rest?**
- **Answer:** Yes
- **Evidence:**
  - Supabase encryption at rest
  - Database encryption documentation
  - Storage encryption (Supabase Storage)
- **Status:** ✅ Ready

#### Standard 2: Lawful Processing

**Q2.1: Do you have a DPIA?**
- **Answer:** Yes
- **Evidence:**
  - `DPIA_BLEEPY_PLATFORM.md`
  - DPIA review date documented
- **Status:** ✅ Ready

**Q2.2: Do you have a privacy policy?**
- **Answer:** Yes
- **Evidence:**
  - `app/privacy/page.tsx`
  - Privacy policy URL
- **Status:** ✅ Ready

**Q2.3: Do you have legal basis for processing?**
- **Answer:** Yes
- **Evidence:**
  - DPIA (Section 2.3 - Legal Basis)
  - Privacy policy
- **Status:** ✅ Ready

#### Standard 3: Staff Responsibilities

**Q3.1: Do staff receive data protection training?**
- **Answer:** Partial (if you have staff)
- **Evidence:**
  - Training records (to be created)
  - Training materials (to be created)
- **Status:** ⚠️ Needs work (if you have staff)

**Q3.2: Do you have a data protection policy?**
- **Answer:** Yes
- **Evidence:**
  - Privacy policy
  - Data breach procedure
  - DSAR procedure
- **Status:** ✅ Ready

#### Standard 4: Access Control

**Q4.1: Do you have role-based access control?**
- **Answer:** Yes
- **Evidence:**
  - Role-based authorization (admin, educator, student, etc.)
  - API route protection
  - Database RLS policies (where enabled)
- **Status:** ✅ Ready

**Q4.2: Do you use strong authentication?**
- **Answer:** Yes
- **Evidence:**
  - Password hashing (bcrypt, salt rounds: 12)
  - 2FA on admin accounts
  - Session management (NextAuth.js)
- **Status:** ✅ Ready

#### Standard 5: Breach Management

**Q5.1: Do you have a data breach procedure?**
- **Answer:** Yes
- **Evidence:**
  - `DATA_BREACH_RESPONSE_PROCEDURE.md`
  - Incident response plan
- **Status:** ✅ Ready

**Q5.2: Do you log security incidents?**
- **Answer:** Yes
- **Evidence:**
  - Error logging (lib/logger.ts)
  - Audit trails (timestamps on all data)
  - Security monitoring (to be enhanced)
- **Status:** ✅ Ready

#### Standard 6: Cyber Attack Resistance

**Q6.1: Do you have cyber security measures?**
- **Answer:** Yes
- **Evidence:**
  - HTTPS/SSL
  - Firewall (Vercel)
  - DDoS protection (Vercel)
  - Security headers
- **Status:** ✅ Ready

**Q6.2: Do you have vulnerability management?**
- **Answer:** Partial
- **Evidence:**
  - Dependency updates
  - Security patches
  - Vulnerability scanning (to be implemented)
- **Status:** ⚠️ Needs enhancement

#### Standard 7: Business Continuity

**Q7.1: Do you have a business continuity plan?**
- **Answer:** Partial
- **Evidence:**
  - Database backups (Supabase - daily)
  - Point-in-time recovery (Supabase)
  - Disaster recovery plan (to be created)
- **Status:** ⚠️ Needs documentation

**Q7.2: Do you test your backup and recovery?**
- **Answer:** Partial
- **Evidence:**
  - Backup documentation (Supabase)
  - Recovery testing (to be documented)
- **Status:** ⚠️ Needs documentation

#### Standard 8: Supported Systems

**Q8.1: Do you use supported software?**
- **Answer:** Yes
- **Evidence:**
  - Next.js (actively maintained)
  - Supabase (actively maintained)
  - Vercel (actively maintained)
  - Regular dependency updates
- **Status:** ✅ Ready

#### Standard 9: Cyber Threat Protection

**Q9.1: Do you have a cyber security strategy?**
- **Answer:** Partial
- **Evidence:**
  - Security measures documented
  - Cyber security strategy (to be created)
- **Status:** ⚠️ Needs documentation

**Q9.2: Do you monitor for cyber threats?**
- **Answer:** Partial
- **Evidence:**
  - Error logging
  - Security monitoring (to be enhanced)
  - Threat detection (to be implemented)
- **Status:** ⚠️ Needs enhancement

#### Standard 10: Supplier Accountability

**Q10.1: Do you have DPAs with all suppliers?**
- **Answer:** Yes
- **Evidence:**
  - Supabase DPA
  - Vercel DPA
  - Microsoft 365 DPA
  - DPA documentation
- **Status:** ✅ Ready

**Q10.2: Do you audit your suppliers?**
- **Answer:** Partial
- **Evidence:**
  - Supplier list documented
  - DPA reviews (to be scheduled)
- **Status:** ⚠️ Needs documentation

---

## 4. Evidence Collection

### 4.1 Documents to Prepare

#### 4.1.1 Policies and Procedures ✅
- ✅ Data breach response procedure
- ✅ DSAR procedure
- ✅ Privacy policy
- ✅ DPIA
- ⚠️ Data security policy (to be created)
- ⚠️ Data protection policy (to be created)
- ⚠️ Business continuity plan (to be created)
- ⚠️ Cyber security strategy (to be created)

#### 4.1.2 Technical Evidence ✅
- ✅ HTTPS/SSL certificates
- ✅ Encryption documentation
- ✅ Access control documentation
- ✅ Backup documentation
- ⚠️ Vulnerability scanning reports (to be created)
- ⚠️ Security monitoring logs (to be created)

#### 4.1.3 Contractual Evidence ✅
- ✅ Supabase DPA
- ✅ Vercel DPA
- ✅ Microsoft 365 DPA
- ✅ Service agreements (if any)

#### 4.1.4 Training Evidence ⚠️
- ⚠️ Staff training records (if you have staff)
- ⚠️ Training materials (to be created)
- ⚠️ Training certificates (if applicable)

### 4.2 Evidence Storage

**Recommended Structure:**
```
legal/
├── dspt/
│   ├── evidence/
│   │   ├── policies/
│   │   ├── technical/
│   │   ├── contractual/
│   │   └── training/
│   └── submission/
│       └── [DSPT submission files]
```

---

## 5. DSPT Submission Process

### 5.1 Step-by-Step Guide

**Step 1: Complete Self-Assessment**
- Answer all 54 questions
- Upload evidence for each question
- Add comments where needed
- Review all answers

**Step 2: Internal Review**
- Review all answers
- Verify all evidence
- Check for completeness
- Ensure accuracy

**Step 3: Submit Assessment**
- Click "Submit" in DSPT portal
- Assessment is locked
- NHS Digital reviews (if required)

**Step 4: Achieve Status**
- **Standards Met:** All requirements met
- **Standards Not Met:** Some requirements not met (need to address)
- **Approved:** Approved by NHS Digital (if required)

### 5.2 Timeline

- **Self-Assessment:** 2-4 weeks
- **Evidence Collection:** 1-2 weeks
- **Review:** 1 week
- **Submission:** Immediate
- **NHS Review (if required):** 2-4 weeks
- **Total:** 4-8 weeks

---

## 6. Action Items

### 6.1 Immediate Actions (This Week)

1. [ ] Register for DSPT portal
2. [ ] Review all 54 questions
3. [ ] Identify evidence gaps
4. [ ] Create evidence collection plan

### 6.2 Short-Term Actions (This Month)

1. [ ] Create missing policies:
   - Data security policy
   - Data protection policy
   - Business continuity plan
   - Cyber security strategy

2. [ ] Collect technical evidence:
   - Screenshots of security configurations
   - Encryption documentation
   - Access control documentation

3. [ ] Complete self-assessment:
   - Answer all questions
   - Upload all evidence
   - Add comments

### 6.3 Submission Actions (Before NHS Deployment)

1. [ ] Review completed assessment
2. [ ] Verify all evidence
3. [ ] Submit to NHS Digital
4. [ ] Achieve "Standards Met" status

---

## 7. Common Challenges and Solutions

### 7.1 Challenge: Missing Policies

**Solution:**
- Use templates from NHS Digital
- Adapt from existing procedures
- Document current practices

### 7.2 Challenge: Technical Evidence

**Solution:**
- Screenshot configurations
- Export documentation
- Use provider documentation (Supabase, Vercel)

### 7.3 Challenge: Training Evidence

**Solution:**
- If no staff: Document as "Not Applicable"
- If staff: Create training records
- Use online training certificates

---

## 8. DSPT Maintenance

### 8.1 Annual Renewal

- **Frequency:** Annually
- **Deadline:** Before expiry date
- **Process:** Update assessment, review evidence, resubmit

### 8.2 Significant Changes

Update DSPT when:
- New services added
- New data processors added
- Security incidents occur
- Major system changes

---

## 9. Resources

### 9.1 Official Resources

- **DSPT Portal:** https://www.dsptoolkit.nhs.uk/
- **NHS Digital Guidance:** https://digital.nhs.uk/data-and-information/looking-after-information/data-security-and-information-governance/data-security-and-protection-toolkit
- **DSPT User Guide:** Available in portal

### 9.2 Support

- **DSPT Support:** Available through portal
- **NHS Digital Support:** support@nhs.net
- **Community Forums:** Available in portal

---

## 10. Success Criteria

### 10.1 Minimum Requirement

- ✅ Complete all 54 questions
- ✅ Provide evidence for all questions
- ✅ Achieve "Standards Met" status
- ✅ Submit before NHS deployment

### 10.2 Best Practice

- ✅ Exceed minimum requirements
- ✅ Comprehensive evidence
- ✅ Clear documentation
- ✅ Regular updates

---

## 11. Next Steps

1. **This Week:**
   - Register for DSPT portal
   - Review questions
   - Identify gaps

2. **This Month:**
   - Create missing policies
   - Collect evidence
   - Complete assessment

3. **Before NHS Deployment:**
   - Submit assessment
   - Achieve "Standards Met"
   - Maintain annually

---

**END OF DSPT COMPLIANCE DOCUMENT**


