# NHS Compliance Master Document
## Bleepy Medical Education Platform

**Version:** 1.0  
**Date:** January 2025  
**Organization:** [Your Company Name]  
**Platform:** Bleepy (sim-bleepy) - Medical Education Event Management System  
**Status:** Comprehensive Compliance Package

---

## 📋 Document Overview

This master document provides a complete overview of all NHS compliance requirements and documentation for the Bleepy platform. It serves as the central reference point for all compliance activities.

### Document Structure

1. **Executive Summary** - Overview of compliance status
2. **Compliance Requirements Checklist** - All NHS requirements
3. **Document Index** - Links to all compliance documents
4. **Current Status** - What we have vs. what we need
5. **Action Plan** - Next steps and priorities

---

## 1. Executive Summary

### 1.1 Platform Overview

**Bleepy** is a medical education event management platform used by:
- NHS Trusts (Basildon Hospital, etc.)
- Medical Schools (ARU, UCL)
- Foundation Year Programs
- Clinical Teaching Fellows (CTF)
- Medical Education Teams

**Primary Functions:**
- Event management and scheduling
- Attendance tracking (QR codes)
- Certificate generation (CPD records)
- Feedback collection
- Resource sharing
- Quiz/assessment management

### 1.2 Compliance Status Summary

| Requirement | Status | Completion | Document |
|------------|--------|------------|----------|
| **DPIA** | ✅ Complete | 100% | `DPIA_BLEEPY_PLATFORM.md` |
| **DSPT** | ⚠️ In Progress | 30% | `NHS_DSPT_COMPLIANCE.md` |
| **ISO 27001** | ⚠️ Not Started | 0% | `ISO_27001_COMPLIANCE.md` |
| **ICO Registration** | ⚠️ Pending Decision | 0% | `ICO_REGISTRATION_GUIDE.md` |
| **DPA (Data Processing Agreements)** | ✅ Complete | 100% | `legal/dpas/` |
| **Cyber Essentials** | ⚠️ Not Started | 0% | `CYBER_ESSENTIALS_COMPLIANCE.md` |
| **Data Breach Procedure** | ✅ Complete | 100% | `DATA_BREACH_RESPONSE_PROCEDURE.md` |
| **DSAR Procedure** | ✅ Complete | 100% | `DSAR_PROCEDURE.md` |

**Overall Compliance:** 60% Complete

---

## 2. NHS Compliance Requirements

### 2.1 Mandatory Requirements

#### 2.1.1 Data Protection Impact Assessment (DPIA) ✅
- **Status:** ✅ Complete
- **Document:** `DPIA_BLEEPY_PLATFORM.md`
- **Review Date:** January 2026
- **Action Required:** None (up to date)

#### 2.1.2 Data Security and Protection Toolkit (DSPT) ⚠️
- **Status:** ⚠️ In Progress
- **Document:** `NHS_DSPT_COMPLIANCE.md`
- **Requirement:** Mandatory for all NHS suppliers
- **Action Required:** Complete DSPT submission
- **Deadline:** Before NHS deployment

#### 2.1.3 Data Processing Agreements (DPA) ✅
- **Status:** ✅ Complete
- **Location:** `legal/dpas/`
- **Coverage:**
  - ✅ Supabase (Database/Storage)
  - ✅ Vercel (Hosting)
  - ✅ Microsoft 365 (Email)
  - ⚠️ OpenAI (if used - may need DPA)
  - ⚠️ Hume AI (if used - may need DPA)
- **Action Required:** Verify OpenAI/Hume DPAs if used

#### 2.1.4 Information Commissioner's Office (ICO) Registration ⚠️
- **Status:** ⚠️ Pending Decision
- **Document:** `ICO_REGISTRATION_GUIDE.md`
- **Requirement:** May be required depending on data controller status
- **Action Required:** Determine requirement and register if needed
- **Cost:** £40-£60 per year

### 2.2 Recommended Requirements

#### 2.2.1 ISO 27001 Certification ⚠️
- **Status:** ⚠️ Not Started
- **Document:** `ISO_27001_COMPLIANCE.md`
- **Requirement:** Highly recommended for NHS suppliers
- **Action Required:** Begin ISO 27001 implementation
- **Timeline:** 6-12 months
- **Cost:** £5,000-£15,000 (certification)

#### 2.2.2 Cyber Essentials Certification ⚠️
- **Status:** ⚠️ Not Started
- **Document:** `CYBER_ESSENTIALS_COMPLIANCE.md`
- **Requirement:** Required for many NHS contracts
- **Action Required:** Apply for Cyber Essentials certification
- **Timeline:** 1-3 months
- **Cost:** £300-£500 (certification)

#### 2.2.3 Cyber Essentials Plus ⚠️
- **Status:** ⚠️ Not Started
- **Document:** `CYBER_ESSENTIALS_COMPLIANCE.md`
- **Requirement:** Required for some high-value NHS contracts
- **Action Required:** Apply for Cyber Essentials Plus (after basic certification)
- **Timeline:** 1-2 months after basic certification
- **Cost:** £1,500-£3,000 (certification)

### 2.3 Additional Requirements

#### 2.3.1 Data Breach Response Procedure ✅
- **Status:** ✅ Complete
- **Document:** `DATA_BREACH_RESPONSE_PROCEDURE.md`
- **Action Required:** None

#### 2.3.2 Data Subject Access Request (DSAR) Procedure ✅
- **Status:** ✅ Complete
- **Document:** `DSAR_PROCEDURE.md`
- **Action Required:** None

#### 2.3.3 Privacy Policy ✅
- **Status:** ✅ Complete
- **Location:** `app/privacy/page.tsx`
- **Action Required:** Minor update for DSAR email (optional)

---

## 3. Document Index

### 3.1 Core Compliance Documents

| Document | Status | Location |
|----------|--------|----------|
| **DPIA** | ✅ Complete | `DPIA_BLEEPY_PLATFORM.md` |
| **DSPT Compliance** | ⚠️ In Progress | `NHS_DSPT_COMPLIANCE.md` |
| **ISO 27001** | ⚠️ Not Started | `ISO_27001_COMPLIANCE.md` |
| **ICO Registration** | ⚠️ Pending | `ICO_REGISTRATION_GUIDE.md` |
| **Cyber Essentials** | ⚠️ Not Started | `CYBER_ESSENTIALS_COMPLIANCE.md` |
| **Data Breach Procedure** | ✅ Complete | `DATA_BREACH_RESPONSE_PROCEDURE.md` |
| **DSAR Procedure** | ✅ Complete | `DSAR_PROCEDURE.md` |
| **GDPR Compliance Report** | ✅ Complete | `GDPR_COMPLIANCE_STATUS_REPORT.md` |

### 3.2 Legal Documents

| Document | Status | Location |
|----------|--------|----------|
| **Supabase DPA** | ✅ Signed | `legal/dpas/Supabase_DPA_Signed_2025-11-07.pdf` |
| **Vercel DPA** | ✅ Signed | `legal/dpas/Vercel_DPA_Signed_2025-11-07.pdf` |
| **Microsoft 365 DPA** | ✅ Complete | `legal/dpas/Microsoft_365_DPA_2025-11-07.pdf` |

### 3.3 Supporting Documentation

| Document | Status | Location |
|----------|--------|----------|
| **Microsoft DPA Coverage** | ✅ Complete | `MICROSOFT_365_DPA_COVERAGE_EXPLANATION.md` |
| **GDPR Mitigations** | ✅ Complete | `GDPR_MITIGATIONS_IMPLEMENTED.md` |

---

## 4. Current Status: What We Have vs. What We Need

### 4.1 ✅ What We Currently Have

#### 4.1.1 Data Protection Impact Assessment (DPIA)
- ✅ Comprehensive DPIA document completed
- ✅ Risk assessment completed
- ✅ Mitigation strategies documented
- ✅ Review date scheduled (January 2026)

#### 4.1.2 Data Processing Agreements (DPA)
- ✅ Supabase DPA signed (November 2025)
- ✅ Vercel DPA signed (November 2025)
- ✅ Microsoft 365 DPA obtained (November 2025)
- ✅ All DPAs stored in `legal/dpas/`

#### 4.1.3 Technical Implementations
- ✅ Account deletion functionality
- ✅ Data export functionality (DSAR support)
- ✅ Automated data purging
- ✅ Consent management
- ✅ 2FA on admin accounts

#### 4.1.4 Procedures
- ✅ Data breach response procedure
- ✅ DSAR procedure
- ✅ Privacy policy

### 4.2 ⚠️ What We Need Additionally

#### 4.2.1 Data Security and Protection Toolkit (DSPT)
- ⚠️ **Status:** Not submitted
- **What's Needed:**
  - Complete DSPT self-assessment
  - Submit to NHS Digital
  - Achieve "Standards Met" status
  - Annual renewal required
- **Timeline:** 2-4 weeks
- **Cost:** Free (but time-intensive)
- **Document:** `NHS_DSPT_COMPLIANCE.md` (to be created)

#### 4.2.2 ISO 27001 Certification
- ⚠️ **Status:** Not started
- **What's Needed:**
  - Information Security Management System (ISMS)
  - Risk assessment and treatment
  - Security controls implementation
  - Internal audits
  - Certification audit
- **Timeline:** 6-12 months
- **Cost:** £5,000-£15,000
- **Document:** `ISO_27001_COMPLIANCE.md` (to be created)

#### 4.2.3 ICO Registration
- ⚠️ **Status:** Pending decision
- **What's Needed:**
  - Determine if registration required
  - Complete registration form
  - Pay registration fee (£40-£60)
  - Annual renewal
- **Timeline:** 1-2 weeks
- **Cost:** £40-£60 per year
- **Document:** `ICO_REGISTRATION_GUIDE.md` (to be created)

#### 4.2.4 Cyber Essentials Certification
- ⚠️ **Status:** Not started
- **What's Needed:**
  - Self-assessment questionnaire
  - Technical verification (for Plus)
  - Certification body assessment
  - Annual renewal
- **Timeline:** 1-3 months
- **Cost:** £300-£500 (basic), £1,500-£3,000 (Plus)
- **Document:** `CYBER_ESSENTIALS_COMPLIANCE.md` (to be created)

#### 4.2.5 Additional DPAs (if applicable)
- ⚠️ **Status:** May be needed
- **What's Needed:**
  - OpenAI DPA (if using OpenAI API)
  - Hume AI DPA (if using Hume AI)
  - Any other third-party processors
- **Timeline:** 1-2 weeks per DPA
- **Cost:** Usually free
- **Action:** Review all third-party services

---

## 5. DPA Status: Current vs. Required

### 5.1 ✅ Currently Have DPAs

| Provider | Service | DPA Status | Date | Location |
|----------|---------|------------|------|----------|
| **Supabase** | Database, Storage, Auth | ✅ Signed | Nov 2025 | `legal/dpas/Supabase_DPA_Signed_2025-11-07.pdf` |
| **Vercel** | Hosting, CDN | ✅ Signed | Nov 2025 | `legal/dpas/Vercel_DPA_Signed_2025-11-07.pdf` |
| **Microsoft 365** | Email (Exchange Online) | ✅ Complete | Nov 2025 | `legal/dpas/Microsoft_365_DPA_2025-11-07.pdf` |

### 5.2 ⚠️ Additional DPAs Needed

| Provider | Service | Status | Action Required |
|----------|---------|--------|-----------------|
| **OpenAI** | AI Processing (GPT-4) | ⚠️ Check | Verify if DPA available/required |
| **Hume AI** | Audio Processing | ⚠️ Check | Verify if DPA available/required |
| **Other Services** | TBD | ⚠️ Review | Audit all third-party services |

### 5.3 DPA Coverage Summary

**Current Coverage:** 3/3 core services ✅

**Additional Services to Review:**
1. OpenAI (if used for bulk upload AI)
2. Hume AI (if used for audio processing)
3. Any analytics services
4. Any monitoring/logging services

**Action Required:**
- [ ] Audit all third-party services
- [ ] Identify which process personal data
- [ ] Obtain DPAs for all data processors
- [ ] Document in compliance records

---

## 6. Priority Action Plan

### 6.1 Immediate Priority (Before NHS Deployment)

#### Priority 1: DSPT Submission ⚠️
- **Timeline:** 2-4 weeks
- **Cost:** Free
- **Action:**
  1. Complete DSPT self-assessment
  2. Submit to NHS Digital
  3. Achieve "Standards Met" status
- **Document:** `NHS_DSPT_COMPLIANCE.md`

#### Priority 2: ICO Registration Decision ⚠️
- **Timeline:** 1-2 weeks
- **Cost:** £40-£60 per year
- **Action:**
  1. Determine if registration required
  2. Complete registration if needed
- **Document:** `ICO_REGISTRATION_GUIDE.md`

#### Priority 3: Cyber Essentials Certification ⚠️
- **Timeline:** 1-3 months
- **Cost:** £300-£500
- **Action:**
  1. Complete self-assessment
  2. Submit for certification
  3. Obtain certificate
- **Document:** `CYBER_ESSENTIALS_COMPLIANCE.md`

### 6.2 Short-Term Priority (Within 6 Months)

#### Priority 4: ISO 27001 Implementation ⚠️
- **Timeline:** 6-12 months
- **Cost:** £5,000-£15,000
- **Action:**
  1. Begin ISMS implementation
  2. Conduct risk assessment
  3. Implement security controls
  4. Internal audits
  5. Certification audit
- **Document:** `ISO_27001_COMPLIANCE.md`

#### Priority 5: Additional DPAs ⚠️
- **Timeline:** 1-2 weeks per DPA
- **Cost:** Usually free
- **Action:**
  1. Audit third-party services
  2. Identify data processors
  3. Obtain DPAs
  4. Document in records

### 6.3 Ongoing Requirements

- ✅ DPIA review (annually or on significant changes)
- ✅ DSPT renewal (annually)
- ✅ ICO registration renewal (annually)
- ✅ Cyber Essentials renewal (annually)
- ✅ ISO 27001 surveillance audits (annually)
- ✅ DPA reviews (when updated by providers)

---

## 7. Cost Summary

### 7.1 Completed (No Additional Cost)

- ✅ DPIA: £0 (completed internally)
- ✅ Technical implementations: £0 (internal development)
- ✅ DPAs (Supabase, Vercel, Microsoft): £0 (free)
- ✅ Procedures documentation: £0 (internal)
- ✅ 2FA setup: £0 (free)

**Total Spent:** £0

### 7.2 Required Costs

| Item | Cost | Frequency | Total (Year 1) |
|------|------|-----------|----------------|
| **ICO Registration** | £40-£60 | Annual | £40-£60 |
| **Cyber Essentials** | £300-£500 | Annual | £300-£500 |
| **Cyber Essentials Plus** | £1,500-£3,000 | Annual | £1,500-£3,000 (optional) |
| **ISO 27001 Certification** | £5,000-£15,000 | One-time + annual audits | £5,000-£15,000 (Year 1) |
| **ISO 27001 Surveillance** | £2,000-£5,000 | Annual | £2,000-£5,000 (Year 2+) |

**Total Required (Year 1):** £6,840-£18,560

**Total Required (Year 2+):** £2,340-£8,560 (excluding ISO initial certification)

### 7.3 Recommended Budget

**Minimum (Essential):**
- ICO Registration: £60
- Cyber Essentials: £500
- **Total: £560**

**Recommended (Standard):**
- ICO Registration: £60
- Cyber Essentials Plus: £3,000
- **Total: £3,060**

**Full Compliance (Ideal):**
- ICO Registration: £60
- Cyber Essentials Plus: £3,000
- ISO 27001: £15,000 (Year 1)
- **Total: £18,060 (Year 1)**

---

## 8. Compliance Roadmap

### Phase 1: Essential (Before NHS Deployment)
**Timeline:** 1-3 months  
**Cost:** £560-£3,060

1. ✅ Complete DSPT submission
2. ✅ ICO registration (if required)
3. ✅ Cyber Essentials certification

### Phase 2: Standard (Within 6 Months)
**Timeline:** 3-6 months  
**Cost:** £0-£3,000

1. ✅ Cyber Essentials Plus (if required by NHS)
2. ✅ Additional DPAs (if needed)
3. ✅ Enhanced security documentation

### Phase 3: Advanced (Within 12 Months)
**Timeline:** 6-12 months  
**Cost:** £5,000-£15,000

1. ✅ ISO 27001 implementation
2. ✅ ISO 27001 certification
3. ✅ Continuous improvement

---

## 9. Next Steps

### Immediate Actions (This Week)

1. [ ] Review this master document
2. [ ] Begin DSPT self-assessment
3. [ ] Determine ICO registration requirement
4. [ ] Start Cyber Essentials preparation

### Short-Term Actions (This Month)

1. [ ] Complete DSPT submission
2. [ ] Complete ICO registration (if required)
3. [ ] Begin Cyber Essentials application
4. [ ] Audit all third-party services for DPA requirements

### Medium-Term Actions (3-6 Months)

1. [ ] Obtain Cyber Essentials certification
2. [ ] Consider Cyber Essentials Plus
3. [ ] Begin ISO 27001 planning
4. [ ] Review and update all compliance documents

---

## 10. Support & Resources

### NHS Resources
- **DSPT Portal:** https://www.dsptoolkit.nhs.uk/
- **NHS Digital:** https://digital.nhs.uk/
- **NHS Data Security Standards:** https://www.england.nhs.uk/ourwork/tsd/data-security/

### Certification Bodies
- **Cyber Essentials:** https://www.cyberessentials.ncsc.gov.uk/
- **ISO 27001:** https://www.iso.org/isoiec-27001-information-security.html
- **ICO:** https://ico.org.uk/

### Contact Information
- **ICO Helpline:** 0303 123 1113
- **NHS DSPT Support:** Available through portal
- **Cyber Essentials Support:** Available through certification bodies

---

## 11. Document Control

**Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** February 2025  
**Status:** Active  
**Owner:** [Your Name/Company]  
**Approved By:** [To be completed]

---

## 12. Appendices

### Appendix A: Compliance Checklist
See individual compliance documents for detailed checklists.

### Appendix B: Third-Party Processor List
See `DPIA_BLEEPY_PLATFORM.md` Appendix B.

### Appendix C: Legal Basis Summary
See `DPIA_BLEEPY_PLATFORM.md` Appendix C.

### Appendix D: Retention Schedule
See `DPIA_BLEEPY_PLATFORM.md` Appendix D.

---

**END OF MASTER DOCUMENT**


