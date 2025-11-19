# ISO 27001 Compliance Guide
## Bleepy Medical Education Platform

**Version:** 1.0  
**Date:** January 2025  
**Status:** Not Started (Planning Phase)

---

## 1. Executive Summary

### 1.1 What is ISO 27001?

**ISO/IEC 27001** is an international standard for Information Security Management Systems (ISMS). It provides a framework for managing information security risks and ensuring the confidentiality, integrity, and availability of information.

### 1.2 Why is ISO 27001 Important for NHS?

- **Highly Recommended** for NHS suppliers
- **Demonstrates** commitment to information security
- **Required** for many high-value NHS contracts
- **Competitive Advantage** in NHS procurement
- **Trust Building** with NHS stakeholders

### 1.3 Current Status

**Status:** ⚠️ **Not Started** (Planning Phase)

**Timeline:** 6-12 months to certification  
**Cost:** £5,000-£15,000 (certification) + ongoing audits

---

## 2. ISO 27001 Requirements

### 2.1 The Standard Structure

ISO 27001 consists of:
- **Clauses 4-10:** ISMS requirements (mandatory)
- **Annex A:** 93 security controls (select based on risk)

### 2.2 Key Requirements

1. **Context of the Organization** (Clause 4)
2. **Leadership** (Clause 5)
3. **Planning** (Clause 6)
4. **Support** (Clause 7)
5. **Operation** (Clause 8)
6. **Performance Evaluation** (Clause 9)
7. **Improvement** (Clause 10)

### 2.3 Annex A Controls (93 Controls)

Organized into 14 categories:
1. Information security policies
2. Organization of information security
3. Human resource security
4. Asset management
5. Access control
6. Cryptography
7. Physical and environmental security
8. Operations security
9. Communications security
10. System acquisition, development and maintenance
11. Supplier relationships
12. Information security incident management
13. Business continuity
14. Compliance

---

## 3. Implementation Roadmap

### Phase 1: Planning and Setup (Months 1-2)

#### 3.1 Define Scope
- **In Scope:**
  - Bleepy platform (sim-bleepy)
  - All data processing activities
  - All third-party services (Supabase, Vercel, Microsoft)
  - All staff (if any)

- **Out of Scope:**
  - Personal devices (if BYOD)
  - Third-party systems (covered by DPAs)

#### 3.2 Establish ISMS
- Appoint Information Security Manager
- Define ISMS scope
- Document ISMS policy
- Establish security objectives

#### 3.3 Risk Assessment
- Identify assets
- Identify threats and vulnerabilities
- Assess risks
- Document risk register
- Define risk treatment plan

### Phase 2: Implementation (Months 3-6)

#### 3.4 Implement Controls
- Implement selected Annex A controls
- Document control implementations
- Test controls
- Train staff (if applicable)

#### 3.5 Documentation
- Create required policies:
  - Information Security Policy
  - Access Control Policy
  - Incident Response Policy
  - Business Continuity Policy
  - Supplier Management Policy
  - (And many more...)

#### 3.6 Internal Audit
- Conduct internal audits
- Identify non-conformities
- Implement corrective actions
- Management review

### Phase 3: Certification (Months 7-12)

#### 3.7 Pre-Certification
- Select certification body
- Prepare for certification audit
- Conduct gap analysis
- Address any gaps

#### 3.8 Certification Audit
- Stage 1 Audit (documentation review)
- Stage 2 Audit (implementation review)
- Address non-conformities
- Receive certificate

---

## 4. Current State Assessment

### 4.1 What We Already Have ✅

#### 4.1.1 Policies and Procedures
- ✅ Data breach response procedure
- ✅ DSAR procedure
- ✅ Privacy policy
- ✅ DPIA

#### 4.1.2 Technical Controls
- ✅ Encryption in transit (HTTPS/TLS)
- ✅ Encryption at rest (Supabase)
- ✅ Access control (role-based)
- ✅ Authentication (NextAuth.js)
- ✅ Password hashing (bcrypt)
- ✅ 2FA (admin accounts)

#### 4.1.3 Supplier Management
- ✅ DPAs with all suppliers
- ✅ Supplier list documented

#### 4.1.4 Incident Management
- ✅ Data breach procedure
- ✅ Incident response plan

### 4.2 What We Need to Implement ⚠️

#### 4.2.1 Policies Required
- ⚠️ Information Security Policy
- ⚠️ Access Control Policy
- ⚠️ Asset Management Policy
- ⚠️ Business Continuity Policy
- ⚠️ Supplier Management Policy
- ⚠️ Change Management Policy
- ⚠️ Backup and Recovery Policy
- ⚠️ Vulnerability Management Policy
- ⚠️ (And 20+ more policies...)

#### 4.2.2 Processes Required
- ⚠️ Risk assessment process
- ⚠️ Internal audit process
- ⚠️ Management review process
- ⚠️ Continuous improvement process

#### 4.2.3 Documentation Required
- ⚠️ Asset register
- ⚠️ Risk register
- ⚠️ Control implementation records
- ⚠️ Audit reports
- ⚠️ Management review records

---

## 5. Key Controls for Bleepy Platform

### 5.1 High Priority Controls

#### A.9.2 User Access Management
- ✅ Role-based access control (implemented)
- ✅ User registration process (implemented)
- ⚠️ Access review process (to be implemented)
- ⚠️ Access revocation process (to be implemented)

#### A.10.1 Cryptographic Controls
- ✅ Encryption in transit (implemented)
- ✅ Encryption at rest (implemented)
- ✅ Password hashing (implemented)
- ⚠️ Key management policy (to be created)

#### A.12.6 Management of Technical Vulnerabilities
- ✅ Dependency updates (implemented)
- ⚠️ Vulnerability scanning (to be implemented)
- ⚠️ Patch management process (to be created)

#### A.13.1 Network Security Management
- ✅ HTTPS/TLS (implemented)
- ✅ Firewall (Vercel)
- ⚠️ Network segmentation (to be reviewed)
- ⚠️ Security monitoring (to be enhanced)

#### A.14.2 Security in Development
- ✅ Secure coding practices (implemented)
- ✅ Code review process (implemented)
- ⚠️ Security testing (to be enhanced)
- ⚠️ Secure development lifecycle (to be documented)

#### A.15.1 Information Security in Supplier Relationships
- ✅ DPAs with suppliers (implemented)
- ⚠️ Supplier security assessment (to be implemented)
- ⚠️ Supplier monitoring (to be implemented)

#### A.16.1 Management of Information Security Incidents
- ✅ Incident response procedure (implemented)
- ⚠️ Incident logging (to be enhanced)
- ⚠️ Incident analysis (to be implemented)

#### A.17.1 Information Security Aspects of Business Continuity
- ✅ Database backups (implemented)
- ⚠️ Business continuity plan (to be created)
- ⚠️ Disaster recovery testing (to be implemented)

---

## 6. Implementation Checklist

### 6.1 Phase 1: Planning (Months 1-2)

- [ ] Appoint Information Security Manager
- [ ] Define ISMS scope
- [ ] Create Information Security Policy
- [ ] Conduct risk assessment
- [ ] Create risk register
- [ ] Define risk treatment plan
- [ ] Select Annex A controls
- [ ] Create implementation plan

### 6.2 Phase 2: Implementation (Months 3-6)

- [ ] Create all required policies (30+ policies)
- [ ] Implement selected controls
- [ ] Document control implementations
- [ ] Create asset register
- [ ] Implement access review process
- [ ] Implement vulnerability management
- [ ] Create business continuity plan
- [ ] Conduct staff training (if applicable)
- [ ] Conduct internal audit
- [ ] Management review

### 6.3 Phase 3: Certification (Months 7-12)

- [ ] Select certification body
- [ ] Conduct gap analysis
- [ ] Address gaps
- [ ] Prepare for Stage 1 audit
- [ ] Stage 1 audit (documentation)
- [ ] Address Stage 1 findings
- [ ] Prepare for Stage 2 audit
- [ ] Stage 2 audit (implementation)
- [ ] Address Stage 2 findings
- [ ] Receive certificate

---

## 7. Cost Breakdown

### 7.1 Certification Costs

| Item | Cost Range | Notes |
|------|------------|-------|
| **Certification Body** | £3,000-£8,000 | One-time (Stage 1 + Stage 2) |
| **Consultant (Optional)** | £2,000-£7,000 | If using consultant |
| **Internal Resources** | £0-£5,000 | Your time (if doing yourself) |
| **Tools/Software** | £0-£1,000 | Documentation tools, etc. |
| **Total (Year 1)** | £5,000-£15,000 | |

### 7.2 Ongoing Costs

| Item | Cost Range | Frequency |
|------|------------|-----------|
| **Surveillance Audits** | £2,000-£5,000 | Annual |
| **Recertification** | £3,000-£8,000 | Every 3 years |
| **Maintenance** | £0-£2,000 | Annual (internal) |

### 7.3 Cost Optimization

**Option 1: DIY (Lowest Cost)**
- Do it yourself
- Use templates and guides
- Cost: £5,000-£8,000 (certification only)

**Option 2: Consultant (Recommended)**
- Use consultant for guidance
- You do the work
- Cost: £7,000-£12,000

**Option 3: Full Service (Easiest)**
- Consultant does everything
- Cost: £12,000-£15,000

---

## 8. Timeline

### 8.1 Realistic Timeline

**Fast Track (6 months):**
- Month 1-2: Planning and risk assessment
- Month 3-4: Implementation
- Month 5: Internal audit and gap analysis
- Month 6: Certification audit

**Standard Track (9 months):**
- Month 1-3: Planning and risk assessment
- Month 4-6: Implementation
- Month 7: Internal audit
- Month 8: Gap analysis and corrections
- Month 9: Certification audit

**Comprehensive Track (12 months):**
- Month 1-4: Planning and risk assessment
- Month 5-8: Implementation
- Month 9: Internal audit
- Month 10: Gap analysis and corrections
- Month 11-12: Certification audit

**Recommended:** 9-12 months for thorough implementation

---

## 9. Resources

### 9.1 Official Resources

- **ISO 27001 Standard:** https://www.iso.org/isoiec-27001-information-security.html
- **ISO 27002 (Controls):** https://www.iso.org/isoiec-27002-information-security.html
- **UKAS (Certification Bodies):** https://www.ukas.com/

### 9.2 Templates and Guides

- ISO 27001 Toolkit (commercial)
- IT Governance (templates and guides)
- Various online resources

### 9.3 Certification Bodies

- BSI (British Standards Institution)
- SGS
- LRQA
- DNV
- Others (UKAS accredited)

---

## 10. Next Steps

### 10.1 Immediate Actions

1. [ ] Decide on approach (DIY vs. Consultant)
2. [ ] Allocate budget
3. [ ] Set timeline
4. [ ] Appoint Information Security Manager

### 10.2 Short-Term Actions (This Month)

1. [ ] Begin Phase 1 planning
2. [ ] Define ISMS scope
3. [ ] Create Information Security Policy
4. [ ] Conduct initial risk assessment

### 10.3 Medium-Term Actions (3-6 Months)

1. [ ] Complete risk assessment
2. [ ] Select Annex A controls
3. [ ] Begin policy creation
4. [ ] Start control implementation

---

## 11. Success Criteria

### 11.1 Certification Success

- ✅ All mandatory clauses implemented
- ✅ Selected Annex A controls implemented
- ✅ Documentation complete
- ✅ Internal audit passed
- ✅ Certification audit passed
- ✅ Certificate received

### 11.2 Ongoing Success

- ✅ Annual surveillance audits passed
- ✅ Continuous improvement
- ✅ Risk management effective
- ✅ Security incidents managed
- ✅ Staff trained (if applicable)

---

**END OF ISO 27001 COMPLIANCE DOCUMENT**


