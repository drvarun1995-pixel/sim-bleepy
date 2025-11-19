# Cyber Essentials Compliance Guide
## Bleepy Medical Education Platform

**Version:** 1.0  
**Date:** January 2025  
**Status:** Not Started

---

## 1. Executive Summary

### 1.1 What is Cyber Essentials?

**Cyber Essentials** is a UK government-backed certification scheme that helps organizations protect themselves against common cyber attacks. It demonstrates that you have essential cybersecurity controls in place.

### 1.2 Why is Cyber Essentials Important for NHS?

- **Required** for many NHS contracts
- **Demonstrates** basic cybersecurity posture
- **Trust Building** with NHS stakeholders
- **Competitive Advantage** in NHS procurement
- **Low Cost** compared to other certifications

### 1.3 Certification Levels

**Cyber Essentials (Basic):**
- Self-assessment questionnaire
- Annual renewal
- Cost: £300-£500

**Cyber Essentials Plus:**
- Self-assessment + technical verification
- Annual renewal
- Cost: £1,500-£3,000
- **Required** for some high-value NHS contracts

### 1.4 Current Status

**Status:** ⚠️ **Not Started**

**Timeline:** 1-3 months  
**Cost:** £300-£500 (basic) or £1,500-£3,000 (Plus)

---

## 2. Cyber Essentials Requirements

### 2.1 The 5 Technical Controls

Cyber Essentials focuses on 5 key technical controls:

1. **Firewalls and Internet Gateways**
2. **Secure Configuration**
3. **Access Control**
4. **Malware Protection**
5. **Patch Management**

### 2.2 Assessment Questions

The assessment covers:
- Network security
- Device security
- Software security
- Access control
- Update management
- Malware protection

---

## 3. Current State Assessment

### 3.1 Control 1: Firewalls and Internet Gateways ✅

**Current State:**
- ✅ Vercel provides firewall/DDoS protection
- ✅ Network security configured
- ✅ Internet gateway secured

**Status:** ✅ **Compliant**

**Evidence:**
- Vercel security documentation
- Network configuration
- Firewall rules

### 3.2 Control 2: Secure Configuration ✅

**Current State:**
- ✅ HTTPS/TLS enforced
- ✅ Security headers configured
- ✅ Default passwords changed
- ✅ Unnecessary services disabled

**Status:** ✅ **Compliant**

**Evidence:**
- SSL certificates
- Security headers configuration
- Server configuration

### 3.3 Control 3: Access Control ✅

**Current State:**
- ✅ User authentication (NextAuth.js)
- ✅ Role-based access control
- ✅ Strong passwords (bcrypt)
- ✅ 2FA on admin accounts
- ✅ Session management

**Status:** ✅ **Compliant**

**Evidence:**
- Authentication implementation
- Access control documentation
- 2FA configuration

### 3.4 Control 4: Malware Protection ⚠️

**Current State:**
- ✅ Server-side protection (Vercel)
- ⚠️ Client-side protection (user responsibility)
- ⚠️ Email protection (Microsoft 365)

**Status:** ⚠️ **Partially Compliant**

**Action Required:**
- Document server-side protection
- Document email protection
- Note client-side is user responsibility

### 3.5 Control 5: Patch Management ✅

**Current State:**
- ✅ Dependency updates (npm/pnpm)
- ✅ Security patches applied
- ✅ Regular updates
- ⚠️ Patch management process (to be documented)

**Status:** ✅ **Compliant** (needs documentation)

**Action Required:**
- Document patch management process
- Create update schedule
- Document update procedures

---

## 4. Implementation Checklist

### 4.1 Pre-Assessment Preparation

- [ ] Review all 5 controls
- [ ] Assess current state
- [ ] Identify gaps
- [ ] Document evidence
- [ ] Create policies (if needed)

### 4.2 Assessment Completion

- [ ] Complete self-assessment questionnaire
- [ ] Answer all questions accurately
- [ ] Provide evidence where required
- [ ] Review answers
- [ ] Submit to certification body

### 4.3 For Cyber Essentials Plus

- [ ] Complete basic assessment
- [ ] Schedule technical verification
- [ ] Prepare for technical test
- [ ] Complete technical verification
- [ ] Address any findings

---

## 5. Assessment Questions (Key Areas)

### 5.1 Network Security

**Q: Do you use a firewall?**
- **Answer:** Yes
- **Evidence:** Vercel firewall/DDoS protection
- **Status:** ✅ Ready

**Q: Do you secure your internet gateway?**
- **Answer:** Yes
- **Evidence:** Vercel security configuration
- **Status:** ✅ Ready

### 5.2 Device Security

**Q: Are all devices configured securely?**
- **Answer:** Yes
- **Evidence:** Server configuration, security headers
- **Status:** ✅ Ready

**Q: Are default passwords changed?**
- **Answer:** Yes
- **Evidence:** No default passwords used
- **Status:** ✅ Ready

### 5.3 Access Control

**Q: Do you use strong authentication?**
- **Answer:** Yes
- **Evidence:** Password hashing (bcrypt), 2FA
- **Status:** ✅ Ready

**Q: Do you control user access?**
- **Answer:** Yes
- **Evidence:** Role-based access control
- **Status:** ✅ Ready

### 5.4 Software Security

**Q: Do you keep software up to date?**
- **Answer:** Yes
- **Evidence:** Dependency updates, patch management
- **Status:** ✅ Ready (needs documentation)

**Q: Do you remove unsupported software?**
- **Answer:** Yes
- **Evidence:** Only supported software used
- **Status:** ✅ Ready

### 5.5 Malware Protection

**Q: Do you have malware protection?**
- **Answer:** Yes (server-side)
- **Evidence:** Vercel protection, Microsoft 365 protection
- **Status:** ✅ Ready (needs documentation)

---

## 6. Evidence Collection

### 6.1 Required Evidence

**Network Security:**
- Firewall configuration
- Network diagram
- Gateway security settings

**Device Security:**
- Server configuration
- Security headers
- Default password policy

**Access Control:**
- Authentication implementation
- Access control documentation
- 2FA configuration

**Software Security:**
- Patch management process
- Update schedule
- Dependency update logs

**Malware Protection:**
- Server-side protection documentation
- Email protection documentation

### 6.2 Evidence Storage

**Recommended Structure:**
```
legal/
├── cyber-essentials/
│   ├── evidence/
│   │   ├── network/
│   │   ├── devices/
│   │   ├── access/
│   │   ├── software/
│   │   └── malware/
│   └── assessment/
│       └── [assessment files]
```

---

## 7. Certification Process

### 7.1 Step 1: Choose Certification Body

**Recommended Bodies:**
- IASME Consortium
- CREST
- APMG International
- Others (accredited)

**Selection Criteria:**
- Cost
- Timeline
- Support provided
- Reputation

### 7.2 Step 2: Complete Assessment

**For Basic:**
1. Register with certification body
2. Complete self-assessment
3. Submit for review
4. Receive certificate

**For Plus:**
1. Complete basic assessment
2. Schedule technical verification
3. Complete technical test
4. Address findings
5. Receive certificate

### 7.3 Step 3: Maintain Certification

- **Renewal:** Annual
- **Updates:** Update if significant changes
- **Re-assessment:** May be required

---

## 8. Cost Breakdown

### 8.1 Cyber Essentials (Basic)

| Item | Cost | Notes |
|------|------|-------|
| **Certification Body** | £300-£500 | Annual |
| **Internal Time** | £0-£500 | Your time |
| **Total** | £300-£1,000 | |

### 8.2 Cyber Essentials Plus

| Item | Cost | Notes |
|------|------|-------|
| **Certification Body** | £1,500-£3,000 | Annual |
| **Technical Verification** | Included | Part of cost |
| **Internal Time** | £0-£1,000 | Your time |
| **Total** | £1,500-£4,000 | |

### 8.3 Cost Comparison

**Basic vs. Plus:**
- Basic: Lower cost, self-assessment only
- Plus: Higher cost, includes technical verification
- **Recommendation:** Start with Basic, upgrade to Plus if required by NHS

---

## 9. Timeline

### 9.1 Cyber Essentials (Basic)

**Timeline:**
- Week 1: Preparation and evidence collection
- Week 2: Complete assessment
- Week 3: Submit and review
- Week 4: Receive certificate

**Total: 3-4 weeks**

### 9.2 Cyber Essentials Plus

**Timeline:**
- Week 1-2: Complete basic assessment
- Week 3: Schedule technical verification
- Week 4: Complete technical test
- Week 5-6: Address findings (if any)
- Week 7: Receive certificate

**Total: 6-8 weeks**

---

## 10. NHS Requirements

### 10.1 Common NHS Requirements

**Many NHS contracts require:**
- Cyber Essentials (basic) - minimum
- Cyber Essentials Plus - preferred/high-value contracts
- Annual renewal
- Evidence of certification

### 10.2 For Bleepy Platform

**Recommended Approach:**
1. Start with Cyber Essentials (basic)
2. Upgrade to Plus if required by specific NHS contracts
3. Maintain annually
4. Display certificate

---

## 11. Action Plan

### 11.1 Immediate Actions (This Week)

1. [ ] Review 5 controls
2. [ ] Assess current state
3. [ ] Identify gaps
4. [ ] Choose certification body

### 11.2 Short-Term Actions (This Month)

1. [ ] Document patch management process
2. [ ] Collect evidence
3. [ ] Complete assessment
4. [ ] Submit for certification

### 11.3 Certification Actions

1. [ ] Receive certificate
2. [ ] Display certificate
3. [ ] Add to compliance records
4. [ ] Set renewal reminder

---

## 12. Resources

### 12.1 Official Resources

- **Cyber Essentials Website:** https://www.cyberessentials.ncsc.gov.uk/
- **NCSC Guidance:** https://www.ncsc.gov.uk/cyberessentials/overview
- **Certification Bodies:** Listed on Cyber Essentials website

### 12.2 Support

- **NCSC Support:** Available through website
- **Certification Body Support:** Available through chosen body
- **Guidance Documents:** Available on NCSC website

---

## 13. Success Criteria

### 13.1 Certification Success

- ✅ All 5 controls implemented
- ✅ Assessment completed
- ✅ Evidence provided
- ✅ Certificate received

### 13.2 Ongoing Success

- ✅ Annual renewal
- ✅ Continuous improvement
- ✅ Controls maintained
- ✅ Evidence updated

---

**END OF CYBER ESSENTIALS COMPLIANCE DOCUMENT**


