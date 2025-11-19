# Data Processing Agreement (DPA) Status and Requirements
## Bleepy Medical Education Platform

**Version:** 2.0  
**Date:** 19 November 2025  
**Status:** Current Status and Additional Requirements  
**Last Updated:** 19 November 2025 (OpenAI DPA obtained)

---

## 1. Executive Summary

### 1.1 Purpose

This document provides a comprehensive overview of:
- **Current DPA Status:** What DPAs we currently have
- **Additional Requirements:** What DPAs we need additionally
- **Gap Analysis:** What's missing and what to do about it

### 1.2 Current Status

**Overall Status:** ✅ **Excellent** (4/4 core services covered)

**Coverage:**
- ✅ Database/Storage: Supabase DPA
- ✅ Hosting: Vercel DPA
- ✅ Email: Microsoft 365 DPA
- ✅ AI Processing: OpenAI DPA

**Additional Services:** ⚠️ Need to review and obtain if required

---

## 2. Current DPA Status

### 2.1 ✅ DPAs Currently in Place

#### 2.1.1 Supabase DPA ✅

**Status:** ✅ **SIGNED AND COMPLETE**

**Details:**
- **Provider:** Supabase Inc.
- **Service:** Database (PostgreSQL), Storage, Authentication
- **Date Signed:** November 7, 2025
- **Location:** `legal/dpas/Supabase_DPA_Signed_2025-11-07.pdf`
- **Coverage:**
  - All data stored in Supabase database
  - All files stored in Supabase Storage
  - User authentication data
  - All personal data processed by Supabase

**Key Points:**
- ✅ Countersigned by Supabase
- ✅ Covers all Supabase services used
- ✅ GDPR compliant
- ✅ Valid and current

**Action Required:** ✅ None (complete)

---

#### 2.1.2 Vercel DPA ✅

**Status:** ✅ **SIGNED AND COMPLETE**

**Details:**
- **Provider:** Vercel Inc.
- **Service:** Application hosting, CDN, Serverless functions
- **Date Signed:** November 7, 2025
- **Location:** `legal/dpas/Vercel_DPA_Signed_2025-11-07.pdf`
- **Coverage:**
  - Application hosting
  - CDN services
  - Server logs (IP addresses, user agents)
  - Environment variables
  - All data processed by Vercel infrastructure

**Key Points:**
- ✅ Pre-countersigned by Vercel
- ✅ Covers all Vercel services used
- ✅ GDPR compliant
- ✅ Valid and current

**Action Required:** ✅ None (complete)

---

#### 2.1.3 Microsoft 365 DPA ✅

**Status:** ✅ **COMPLETE**

**Details:**
- **Provider:** Microsoft Corporation
- **Service:** Email (Exchange Online), Microsoft Graph API, Azure AD
- **Date Obtained:** November 7, 2025
- **Location:** `legal/dpas/Microsoft_365_DPA_2025-11-07.pdf`
- **Coverage:**
  - Exchange Online (email delivery)
  - Microsoft Graph API (email sending)
  - Azure Active Directory (authentication, if used)
  - All Microsoft 365 services

**Key Points:**
- ✅ Pre-signed by Microsoft (no countersignature needed)
- ✅ Automatically in effect
- ✅ Covers all Microsoft Online Services
- ✅ Includes Exchange Online (under "Microsoft Online Services")
- ✅ GDPR compliant
- ✅ Valid and current

**Action Required:** ✅ None (complete)

**Note:** See `MICROSOFT_365_DPA_COVERAGE_EXPLANATION.md` for details on Exchange Online coverage.

---

## 3. Additional DPA Requirements

### 3.1 ⚠️ Services Requiring DPA Review

#### 3.1.1 OpenAI (AI Processing) ✅

**Status:** ✅ **SIGNED AND COMPLETE**

**Details:**
- **Provider:** OpenAI, L.L.C.
- **Service:** AI processing (GPT-4, GPT-4o) for bulk upload feature
- **Usage:** Bulk question upload AI processing, content generation, consultation scoring
- **Data Processed:**
  - Document content (Word documents, Excel files, PDFs)
  - Extracted text
  - AI-generated content
  - May contain personal data if documents contain it

**Current Status:**
- ✅ DPA status: Signed
- ✅ Date Signed: November 19, 2025
- ✅ Location: `legal/dpas/OpenAI_DPA_Signed_2025-11-19.pdf`
- ✅ Coverage:
  - All AI processing services (GPT-4, GPT-4o)
  - Bulk upload feature
  - Content generation
  - Consultation scoring
  - All personal data processed by OpenAI

**Key Points:**
- ✅ DPA signed with OpenAI
- ✅ Covers all OpenAI services used
- ✅ GDPR compliant with SCCs
- ✅ Valid and current

**Action Required:** ✅ None (complete)

**Note:** OpenAI processes data in the US. GDPR compliance ensured through DPA and Standard Contractual Clauses (SCCs).

---

#### 3.1.2 Hume AI (Audio Processing) ⚠️

**Status:** ⚠️ **NEEDS REVIEW** (if used)

**Details:**
- **Provider:** Hume AI
- **Service:** Audio processing, emotion analysis (legacy feature)
- **Usage:** AI patient simulator (if actively used)
- **Data Processed:**
  - Voice recordings
  - Emotion analysis data
  - Speech-to-text transcripts
  - Personal data (if recordings contain identifiable information)

**Current Status:**
- ⚠️ Feature appears to be legacy/optional
- ⚠️ DPA status: Unknown
- ⚠️ Need to verify if feature is actively used
- ⚠️ Need to check DPA availability if used

**Action Required:**
1. [ ] Verify if Hume AI is actively used
2. [ ] If used, check Hume AI website for DPA
3. [ ] Review Hume AI terms of service
4. [ ] Obtain DPA if available/required
5. [ ] Document decision
6. [ ] If not used, document as "Not Applicable"

**Timeline:** 1-2 weeks (if used)

**Resources:**
- Hume AI Website: https://www.hume.ai/
- Hume AI Terms: Check their website
- Hume AI Privacy Policy: Check their website

---

#### 3.1.3 Other Third-Party Services ⚠️

**Status:** ⚠️ **NEEDS AUDIT**

**Services to Review:**
- Analytics services (if any)
- Monitoring/logging services (if any)
- Payment processors (if any)
- Other APIs/services (if any)

**Action Required:**
1. [ ] Audit all third-party services used
2. [ ] Identify which process personal data
3. [ ] Determine which require DPAs
4. [ ] Obtain DPAs for data processors
5. [ ] Document all services

**Timeline:** 2-4 weeks

---

## 4. Gap Analysis

### 4.1 Current Coverage ✅

**What We Have:**
- ✅ **Core Infrastructure:** All covered (Supabase, Vercel, Microsoft)
- ✅ **Database/Storage:** Covered (Supabase)
- ✅ **Hosting:** Covered (Vercel)
- ✅ **Email:** Covered (Microsoft 365)
- ✅ **AI Processing:** Covered (OpenAI)

**Coverage Status:** ✅ **100% of core services**

### 4.2 Additional Requirements ⚠️

**What We Need:**
- ✅ **AI Processing:** OpenAI DPA (obtained 19 November 2025)
- ⚠️ **Audio Processing:** Hume AI DPA (if used)
- ⚠️ **Other Services:** Audit and obtain DPAs as needed

**Gap Status:** ⚠️ **Minimal - only optional services need review**

---

## 5. DPA Requirements by Service Type

### 5.1 Data Processors (Require DPA)

**Definition:** Organizations that process personal data on your behalf.

**Current Processors:**
- ✅ Supabase (database, storage)
- ✅ Vercel (hosting)
- ✅ Microsoft 365 (email)
- ✅ OpenAI (AI processing - DPA signed 19 November 2025)
- ⚠️ Hume AI (audio processing - if used)

### 5.2 Data Controllers (Do Not Require DPA)

**Definition:** Organizations that determine purposes and means of processing.

**Current Controllers:**
- ✅ Your organization (Bleepy)
- ✅ NHS Trusts (for their data)
- ✅ Medical Schools (for their data)

**Note:** You don't need DPAs with data controllers - you need contracts/agreements.

---

## 6. Action Plan

### 6.1 Immediate Actions (This Week)

1. [ ] **Audit All Third-Party Services**
   - List all services used
   - Identify which process personal data
   - Categorize as processor vs. controller

2. [x] **Review OpenAI DPA** ✅
   - ✅ DPA obtained and signed
   - ✅ Stored in legal/dpas/
   - ✅ Documented in compliance records

3. [ ] **Review Hume AI DPA** (if used)
   - Check if feature is actively used
   - If used, check for DPA
   - Document decision

### 6.2 Short-Term Actions (This Month)

1. [x] **Obtain Missing DPAs** ✅
   - ✅ OpenAI (obtained 19 November 2025)
   - Hume AI (if used and required)
   - Any other identified processors

2. [ ] **Document All Services**
   - Create service inventory
   - Document DPA status for each
   - Update compliance records

3. [ ] **Review Existing DPAs**
   - Verify all are current
   - Check for updates
   - Renew if needed

### 6.3 Ongoing Actions

1. [ ] **Regular Reviews**
   - Review DPAs annually
   - Check for updates from providers
   - Update when providers update DPAs

2. [ ] **New Service Onboarding**
   - Check DPA requirement before adding new service
   - Obtain DPA before processing personal data
   - Document in records

---

## 7. DPA Checklist

### 7.1 For Each Data Processor

- [ ] Service identified
- [ ] Personal data processing confirmed
- [ ] DPA available/required determined
- [ ] DPA obtained (if required)
- [ ] DPA stored in `legal/dpas/`
- [ ] DPA documented in compliance records
- [ ] DPA reviewed for key terms
- [ ] DPA renewal date noted

### 7.2 Key Terms to Verify in DPAs

- ✅ Data processing scope
- ✅ Security measures
- ✅ Data location/transfer
- ✅ Sub-processors
- ✅ Data breach notification
- ✅ Data subject rights
- ✅ Data deletion/return
- ✅ Audit rights
- ✅ Liability and indemnification

---

## 8. Current DPA Inventory

### 8.1 Complete List

| Provider | Service | DPA Status | Date | Location | Renewal |
|----------|---------|------------|------|----------|---------|
| **Supabase** | Database, Storage | ✅ Signed | Nov 7, 2025 | `legal/dpas/Supabase_DPA_Signed_2025-11-07.pdf` | Annual |
| **Vercel** | Hosting, CDN | ✅ Signed | Nov 7, 2025 | `legal/dpas/Vercel_DPA_Signed_2025-11-07.pdf` | Annual |
| **Microsoft 365** | Email, Graph API | ✅ Complete | Nov 7, 2025 | `legal/dpas/Microsoft_365_DPA_2025-11-07.pdf` | Ongoing |
| **OpenAI** | AI Processing | ✅ Signed | Nov 19, 2025 | `legal/dpas/OpenAI_DPA_Signed_2025-11-19.pdf` | Ongoing |
| **Hume AI** | Audio Processing | ⚠️ To Review | - | - | - |

### 8.2 Summary

**Total Services:** 5  
**DPAs Obtained:** 4  
**DPAs Needed:** 1 (to be reviewed - Hume AI if used)  
**Coverage:** 80% (100% of core services)

---

## 9. DPA Best Practices

### 9.1 Before Adding New Service

1. **Check DPA Availability:**
   - Review provider's website
   - Check terms of service
   - Contact provider if unclear

2. **Verify GDPR Compliance:**
   - Ensure provider is GDPR compliant
   - Check data location (EU/UK preferred)
   - Verify security measures

3. **Review DPA Terms:**
   - Ensure adequate protection
   - Check for unfavorable terms
   - Verify coverage of services used

4. **Document:**
   - Store DPA in `legal/dpas/`
   - Update compliance records
   - Note renewal dates

### 9.2 DPA Maintenance

1. **Annual Review:**
   - Review all DPAs annually
   - Check for updates
   - Renew if needed

2. **Provider Updates:**
   - Monitor for provider DPA updates
   - Review new versions
   - Update records

3. **Service Changes:**
   - Review DPA when adding new services
   - Verify coverage
   - Obtain additional DPAs if needed

---

## 10. Resources

### 10.1 Provider Resources

**Supabase:**
- DPA: Already obtained ✅
- Support: Available through dashboard

**Vercel:**
- DPA: Already obtained ✅
- Support: Available through website

**Microsoft:**
- DPA: Already obtained ✅
- Trust Center: https://www.microsoft.com/trust-center

**OpenAI:**
- DPA: ✅ Signed 19 November 2025
- Location: `legal/dpas/OpenAI_DPA_Signed_2025-11-19.pdf`
- Website: https://openai.com/
- Trust & Safety: https://openai.com/safety
- Terms: https://openai.com/policies/terms

**Hume AI:**
- Website: https://www.hume.ai/
- Terms: Check their website

### 10.2 Legal Resources

- **ICO Guidance:** https://ico.org.uk/
- **GDPR Guidance:** https://ico.org.uk/for-organisations/guide-to-data-protection/
- **DPA Templates:** Available from ICO

---

## 11. Next Steps

### 11.1 This Week

1. [ ] Audit all third-party services
2. [x] Review OpenAI DPA requirement ✅ (Completed 19 November 2025)
3. [ ] Review Hume AI usage and DPA requirement

### 11.2 This Month

1. [x] Obtain missing DPAs (if required) ✅ (OpenAI DPA obtained 19 November 2025)
2. [x] Document all services ✅
3. [x] Update compliance records ✅

### 11.3 Ongoing

1. [ ] Annual DPA review
2. [ ] Monitor for updates
3. [ ] Maintain records

---

## 12. Summary

### 12.1 What We Have ✅

- ✅ **4 Core DPAs:** Supabase, Vercel, Microsoft 365, OpenAI
- ✅ **100% Core Coverage:** All essential services covered
- ✅ **All Signed/Complete:** All current DPAs valid
- ✅ **Well Documented:** All stored and documented

### 12.2 What We Need ⚠️

- ✅ **OpenAI DPA:** Obtained and signed 19 November 2025
- ⚠️ **Hume AI DPA:** Review and obtain if used and required
- ⚠️ **Service Audit:** Complete audit of all services
- ✅ **Documentation:** All core services documented

### 12.3 Overall Assessment

**Status:** ✅ **Excellent** (all core services covered, optional services need review)

**Priority:** Low (all core services covered, only optional services need review)

**Timeline:** 1-2 weeks to complete review of optional services (Hume AI if used)

---

**END OF DPA STATUS AND REQUIREMENTS DOCUMENT**


