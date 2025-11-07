# Data Breach Response Procedure
## Bleepy Medical Education Platform

**Version:** 1.0  
**Date:** January 2025  
**Review Date:** January 2026

---

## 1. Purpose

This procedure outlines the steps to be taken in the event of a data breach or security incident affecting personal data processed by the Bleepy platform.

**Legal Requirement:** Under GDPR Article 33, we must notify the ICO within 72 hours of becoming aware of a breach that is likely to result in a risk to individuals' rights and freedoms.

---

## 2. Definition of a Data Breach

A data breach is a security incident that leads to:
- **Accidental or unlawful destruction** of personal data
- **Loss, alteration, or unauthorized disclosure** of personal data
- **Unauthorized access** to personal data

**Examples:**
- Database compromise or unauthorized access
- Credential theft (passwords, API keys)
- Ransomware or malware attack
- Physical theft of devices containing data
- Accidental data exposure (misconfigured permissions, public URLs)
- Email sent to wrong recipient containing personal data

---

## 3. Incident Response Team

### 3.1 Roles and Responsibilities

| Role | Responsibility | Contact |
|------|---------------|---------|
| **Incident Lead** | Overall coordination, decision-making | [Your Name/Partner Name] |
| **Technical Lead** | Technical investigation, containment | [Technical Team] |
| **Data Protection Lead** | GDPR compliance, ICO notification | [Your Name] |
| **Legal Advisor** | Legal guidance (if available) | [Lawyer Contact] |

### 3.2 Escalation Path

1. **Immediate:** Technical Lead → Incident Lead
2. **Within 1 hour:** Incident Lead → Data Protection Lead
3. **Within 4 hours:** Data Protection Lead → Legal Advisor (if high risk)
4. **Within 72 hours:** Data Protection Lead → ICO (if required)

---

## 4. Response Procedure

### Phase 1: Detection and Initial Assessment (0-1 hour)

#### Step 1: Detect the Breach
**Sources of Detection:**
- Security monitoring alerts
- User reports
- Third-party notifications (Supabase, Vercel)
- Internal discovery
- External security researcher disclosure

#### Step 2: Immediate Containment
**Actions:**
1. **Isolate affected systems:**
   - Disable compromised accounts/API keys
   - Revoke access tokens
   - Block suspicious IP addresses
   - Temporarily disable affected features (if necessary)

2. **Preserve evidence:**
   - Take screenshots
   - Export logs
   - Document timeline
   - Do NOT delete anything yet (preserve for investigation)

3. **Notify Incident Lead immediately**

#### Step 3: Initial Assessment
**Questions to Answer:**
- What data was affected? (user emails, names, bookings, etc.)
- How many individuals affected?
- What was the cause? (hack, misconfiguration, human error)
- Is the breach ongoing or contained?
- What is the potential impact? (identity theft, financial loss, etc.)

**Risk Assessment:**
- **High Risk:** Financial data, passwords, large-scale exposure
- **Medium Risk:** Email addresses, names, limited exposure
- **Low Risk:** Anonymized data, minimal exposure

---

### Phase 2: Investigation and Assessment (1-24 hours)

#### Step 4: Detailed Investigation
**Actions:**
1. **Review logs:**
   - Supabase access logs
   - Vercel server logs
   - API access logs
   - Authentication logs

2. **Identify scope:**
   - Which tables/data were accessed?
   - Which users are affected?
   - When did the breach occur?
   - How long was it ongoing?

3. **Assess impact:**
   - Type of data exposed
   - Sensitivity of data
   - Number of affected individuals
   - Potential harm (identity theft, discrimination, etc.)

#### Step 5: Document Everything
**Create Incident Report:**
- Date/time of discovery
- Date/time of breach (if known)
- How breach was discovered
- What data was affected
- Number of individuals affected
- Cause of breach
- Containment actions taken
- Remediation steps planned

---

### Phase 3: Notification and Remediation (24-72 hours)

#### Step 6: ICO Notification (if required)
**When to Notify ICO:**
- **Required:** If breach is likely to result in a **high risk** to individuals' rights and freedoms
- **Not Required:** If breach is unlikely to result in risk (e.g., encrypted data, accidental internal access)

**ICO Notification Deadline:** Within 72 hours of becoming aware

**ICO Notification Form:** https://ico.org.uk/for-organisations/report-a-breach/

**Information to Provide:**
1. Nature of breach (what happened)
2. Categories and approximate number of data subjects affected
3. Categories and approximate number of personal data records concerned
4. Likely consequences of the breach
5. Measures proposed or taken to address the breach

**Template ICO Notification:**
```
Subject: Personal Data Breach Notification - Bleepy Platform

Dear ICO,

We are notifying you of a personal data breach under Article 33 of GDPR.

1. Nature of Breach: [Description]
2. Date/Time of Breach: [Date/Time]
3. Date/Time of Discovery: [Date/Time]
4. Categories of Data: [e.g., email addresses, names, booking data]
5. Number of Data Subjects Affected: [Number]
6. Likely Consequences: [e.g., unauthorized access to personal information]
7. Measures Taken: [Containment and remediation steps]
8. Measures Proposed: [Future prevention measures]

We will provide updates as the investigation progresses.

[Your Contact Details]
```

#### Step 7: Individual Notification (if required)
**When to Notify Individuals:**
- **Required:** If breach is likely to result in a **high risk** to individuals' rights and freedoms
- **Not Required:** If data was encrypted, or if you've taken measures to mitigate the risk

**Notification Deadline:** Without undue delay (typically within 72 hours)

**Notification Method:**
- Email to affected users
- Public notice on website (if email unavailable)
- Direct communication (if small number affected)

**Information to Provide:**
1. Nature of breach
2. Contact details of DPO/data protection lead
3. Likely consequences
4. Measures taken/proposed to address breach
5. Advice on steps individuals can take

**Template User Notification Email:**
```
Subject: Important: Security Incident Notification

Dear [User Name],

We are writing to inform you of a security incident that may have affected your personal data.

What Happened:
[Brief description of the incident]

What Data Was Affected:
[Type of data - e.g., email address, name, booking history]

What We're Doing:
[Steps taken to contain and remediate]

What You Can Do:
[Advice - e.g., change password, monitor accounts]

We take data protection seriously and apologize for any concern this may cause.

If you have questions, please contact us at: [Contact Email]

[Your Name]
Data Protection Lead
```

#### Step 8: Remediation
**Immediate Actions:**
1. **Fix the vulnerability:**
   - Patch security hole
   - Update permissions
   - Change compromised credentials
   - Implement additional security measures

2. **Prevent recurrence:**
   - Review security policies
   - Update access controls
   - Implement monitoring
   - Staff training (if human error)

3. **Document lessons learned:**
   - What went wrong?
   - How can we prevent this?
   - What processes need improvement?

---

### Phase 4: Post-Incident (After 72 hours)

#### Step 9: Review and Improve
**Actions:**
1. **Post-incident review meeting:**
   - What happened?
   - What went well?
   - What could be improved?
   - Update procedures

2. **Update security measures:**
   - Implement additional controls
   - Update monitoring
   - Review access permissions
   - Update documentation

3. **Follow-up with affected individuals:**
   - Answer questions
   - Provide updates
   - Monitor for further issues

---

## 5. Contact Information

### Internal Contacts
- **Incident Lead:** [Name] - [Email] - [Phone]
- **Technical Lead:** [Name] - [Email] - [Phone]
- **Data Protection Lead:** [Name] - [Email] - [Phone]

### External Contacts
- **ICO:** https://ico.org.uk/concerns/ - 0303 123 1113
- **Supabase Support:** support@supabase.io
- **Vercel Support:** support@vercel.com
- **Legal Advisor:** [If available]

---

## 6. Prevention Measures

### Current Measures
- ✅ Password hashing (bcrypt)
- ✅ HTTPS/SSL encryption
- ✅ Database encryption at rest
- ✅ Role-based access control
- ✅ API authentication
- ✅ Regular security updates

### Recommended Improvements
- ⚠️ Enable 2FA on all admin accounts
- ⚠️ Implement security monitoring/alerts
- ⚠️ Regular security audits
- ⚠️ Staff security training
- ⚠️ Incident response drills

---

## 7. Record Keeping

**Requirement:** Maintain records of all personal data breaches (Article 33(5))

**What to Record:**
- Facts of the breach
- Effects of the breach
- Remedial action taken
- Whether ICO/individuals were notified

**Storage:** Secure location, retained for audit purposes

---

## 8. Testing and Review

**Frequency:** Review this procedure annually or after any incident

**Testing:** Conduct tabletop exercises to test the procedure

**Last Review:** January 2025  
**Next Review:** January 2026

---

## Appendix A: Quick Reference Checklist

### Immediate Actions (0-1 hour)
- [ ] Contain the breach (disable access, revoke credentials)
- [ ] Preserve evidence (logs, screenshots)
- [ ] Notify Incident Lead
- [ ] Assess initial risk level

### Investigation (1-24 hours)
- [ ] Review logs and identify scope
- [ ] Document incident details
- [ ] Assess impact on individuals
- [ ] Determine if ICO notification required

### Notification (24-72 hours)
- [ ] Notify ICO (if high risk)
- [ ] Notify affected individuals (if high risk)
- [ ] Implement remediation measures
- [ ] Document all actions

### Post-Incident
- [ ] Conduct review meeting
- [ ] Update security measures
- [ ] Update this procedure
- [ ] Follow up with affected individuals

---

**END OF PROCEDURE**

