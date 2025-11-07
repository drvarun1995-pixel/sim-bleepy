# Data Protection Impact Assessment (DPIA)
## Bleepy Medical Education Platform

**Version:** 1.0  
**Date:** November 2025  
**Organization:** [Your Company Name]  
**Platform:** Bleepy (sim-bleepy) - Medical Education Event Management System  
**Assessment Date:** November 2025  
**Review Date:** January 2026 (or when significant changes occur)

---

## 1. Executive Summary

### 1.1 Purpose of Assessment
This DPIA assesses the data protection risks associated with the Bleepy platform, a medical education event management system used by NHS trusts, medical schools (ARU, UCL), and foundation year programs to manage teaching events, track attendance, collect feedback, and generate certificates.

### 1.2 Scope
- **Platform:** Bleepy (sim-bleepy.co.uk)
- **Users:** Medical students, educators, MedEd teams, clinical teaching fellows (CTF), administrators
- **Data Subjects:** All registered users and event attendees
- **Geographic Scope:** United Kingdom (primary), with potential international users

### 1.3 Legal Basis for Processing
- **Legitimate Interest:** Providing medical education event management services
- **Contractual Necessity:** Service delivery to NHS trusts and medical schools
- **Consent:** User registration, marketing communications, analytics (where applicable)

---

## 2. Description of Processing

### 2.1 What Personal Data is Collected?

#### 2.1.1 Account & Registration Data
**Data Collected:**
- Email address (required, unique identifier)
- Full name (required)
- Password (hashed using bcrypt, salt rounds: 12)
- Role (student, educator, admin, meded_team, ctf)
- Email verification status
- Authentication provider (email)
- Account creation timestamp

**Purpose:** User authentication, account management, role-based access control

**Legal Basis:** Contractual necessity (service delivery)

**Retention:** While account is active + 7 years (NHS requirement for medical education records)

#### 2.1.2 Profile Data
**Data Collected:**
- Role type (medical_student, foundation_doctor, clinical_fellow, specialty_doctor, registrar, consultant)
- University affiliation (ARU, UCL, etc.)
- Study year (1-6 for medical students)
- Foundation year (FY1, FY2)
- Hospital trust name
- Medical specialty
- Interests (JSON array of selected categories)
- Profile picture (optional, stored in Supabase Storage)
- Profile completion status
- Onboarding completion timestamp

**Purpose:** Personalization, event filtering, access control, educational planning

**Legal Basis:** Legitimate interest (service improvement, user experience)

**Retention:** While account is active + 7 years

#### 2.1.3 Consent Data
**Data Collected:**
- Consent given (boolean)
- Consent timestamp
- Consent version (currently "1.0")
- Marketing consent (boolean)
- Analytics consent (boolean)

**Purpose:** GDPR compliance, user preference management

**Legal Basis:** Consent (for marketing/analytics)

**Retention:** While account is active, or until consent withdrawn

#### 2.1.4 Event Booking Data
**Data Collected:**
- Event ID (reference to event)
- User ID (reference to user)
- Booking status (confirmed, waitlist, cancelled, attended, no-show)
- Booking timestamp
- Cancellation timestamp (if applicable)
- Cancellation reason (free text, optional)
- Check-in status (boolean)
- Check-in timestamp
- Confirmation checkbox states (2 checkboxes, boolean each)
- Notes (free text, optional)
- Soft delete timestamp (if deleted)

**Purpose:** Event management, capacity planning, attendance tracking, audit trail

**Legal Basis:** Contractual necessity (event registration service)

**Retention:** 7 years (NHS requirement for medical education records)

#### 2.1.5 Attendance & QR Code Data
**Data Collected:**
- QR code ID (reference)
- User ID (reference)
- Booking ID (reference)
- Scan timestamp
- Scan success status (boolean)
- Failure reason (if scan failed, text)
- Device information (from user agent)
- IP address (logged for security)

**Purpose:** Attendance verification, certificate generation, audit trail

**Legal Basis:** Contractual necessity (attendance tracking for CPD/education records)

**Retention:** 7 years

#### 2.1.6 Feedback Data
**Data Collected:**
- Feedback form ID (reference)
- Event ID (reference)
- User ID (reference, may be NULL if anonymous)
- Booking ID (reference, optional)
- Responses (JSONB object: question_id → answer)
- Completion timestamp
- Anonymous flag (boolean - if true, user_id is NULL)

**Purpose:** Event evaluation, quality improvement, certificate generation (if required)

**Legal Basis:** Legitimate interest (service improvement)

**Retention:** 7 years (if linked to certificate), 2 years (if anonymous only)

#### 2.1.7 Certificate Data
**Data Collected:**
- Certificate ID (UUID)
- User ID (reference)
- Event ID (reference)
- Booking ID (reference)
- Certificate template ID (reference)
- Certificate file (PDF, stored in Supabase Storage)
- Generation timestamp
- Email sent status (boolean)
- Email sent timestamp
- Download count
- Last downloaded timestamp

**Purpose:** CPD/education record generation, proof of attendance

**Legal Basis:** Contractual necessity (certificate provision)

**Retention:** 7 years (NHS requirement)

#### 2.1.8 Resource & File Data
**Data Collected:**
- File name
- File type
- File size
- Upload timestamp
- Uploader user ID
- Download count
- Download timestamps
- File metadata (JSONB)

**Purpose:** Learning resource sharing, portfolio management

**Legal Basis:** Legitimate interest (educational resource provision)

**Retention:** While resource is active, deleted upon user request or 2 years after last access

#### 2.1.9 Analytics & Usage Data
**Data Collected:**
- Session data (login timestamps, session duration)
- Page views
- Event views
- API usage (endpoints called, timestamps)
- Device information (browser, OS, device type)
- IP address (for security/analytics)
- User agent string

**Purpose:** Service improvement, security monitoring, usage analytics

**Legal Basis:** Legitimate interest (service optimization, security)

**Retention:** 2 years (anonymized after 1 year)

#### 2.1.10 Audio Data (Legacy Feature - Hume AI)
**Data Collected:**
- Voice recordings during AI patient simulator sessions
- Emotion analysis data
- Speech-to-text transcripts

**Purpose:** AI patient simulator training assessment

**Legal Basis:** Consent (explicit consent required for audio recording)

**Retention:** 1 year (transcripts), audio deleted after 30 days

**Note:** This feature appears to be legacy/optional and may not be actively used.

### 2.2 How is Data Collected?

#### 2.2.1 Direct Collection
- **User Registration:** Users provide email, name, password during account creation
- **Profile Completion:** Users optionally provide university, year, specialty, interests
- **Event Booking:** Users book events through the platform interface
- **Feedback Submission:** Users submit feedback forms after events
- **File Uploads:** Users upload resources, portfolio documents

#### 2.2.2 Automatic Collection
- **System Logs:** Login timestamps, API calls, error logs
- **QR Code Scans:** Automatic timestamp and device capture
- **Certificate Generation:** Automatic upon event completion (if enabled)
- **Analytics:** Automatic collection of usage patterns

#### 2.2.3 Third-Party Collection
- **Email Service (Azure/Microsoft 365):** Email delivery status, bounce tracking
- **Hosting (Vercel):** Server logs, IP addresses, request metadata
- **Database (Supabase):** Automatic backups, audit logs

### 2.3 Where is Data Stored?

#### 2.3.1 Primary Storage
- **Database:** Supabase (PostgreSQL) - EU region (default)
  - All structured data (users, events, bookings, feedback, certificates metadata)
  - Encrypted at rest (Supabase default encryption)
  - Backed up daily with point-in-time recovery

#### 2.3.2 File Storage
- **Supabase Storage:** 
  - Profile pictures
  - Certificate PDFs
  - Resource files
  - Encrypted at rest, accessible via signed URLs

#### 2.3.3 Application Hosting
- **Vercel:** 
  - Application code
  - Environment variables (encrypted)
  - Server logs (retained 30 days)
  - Global CDN (edge locations worldwide)

#### 2.3.4 Third-Party Services
- **Azure/Microsoft 365:** Email delivery logs (retained per provider policy, typically 30-90 days)
- **OpenAI:** API usage logs (retained per OpenAI policy, typically 30 days)
- **Hume AI:** Audio processing (if used, retained per Hume policy)

### 2.4 Who Has Access to Data?

#### 2.4.1 Internal Access (Your Organization)
- **System Administrators:** Full database access via service role key (for maintenance, support)
- **Developers:** Limited access via API routes (role-checked)
- **Support Staff:** Access to user data only when necessary for support (via admin interface)

**Access Controls:**
- Service role key stored in environment variables (encrypted)
- API routes require authentication (NextAuth.js sessions)
- Role-based authorization (admin, educator, meded_team, ctf, student)
- Row-Level Security (RLS) policies on database (though many disabled, using API-level auth)

#### 2.4.2 User Access
- **Users:** Can view and edit their own profile data
- **Users:** Can view their own bookings, certificates, feedback
- **Users:** Cannot access other users' data (except public event information)

#### 2.4.3 Role-Based Access
- **Students:** Own data only
- **Educators:** Aggregate data for their cohorts/events
- **MedEd Team/CTF:** Event management, booking management, feedback access
- **Admins:** Full access to all data (for platform management)

#### 2.4.4 Third-Party Access
- **Supabase:** Database hosting, storage (data processor)
- **Vercel:** Application hosting (data processor)
- **Azure/Microsoft 365:** Email delivery (data processor)
- **OpenAI:** AI processing (data processor, if used)
- **Hume AI:** Audio processing (data processor, if used)

**Data Processing Agreements:** Required with all third-party processors (see Section 5)

### 2.5 How is Data Used?

#### 2.5.1 Primary Uses
1. **Event Management:** Creating, scheduling, and managing medical education events
2. **Booking System:** Allowing users to register for events, manage capacity
3. **Attendance Tracking:** QR code scanning for attendance verification
4. **Certificate Generation:** Automatic certificate generation for completed events
5. **Feedback Collection:** Gathering event feedback for quality improvement
6. **Resource Sharing:** Sharing learning materials, portfolio documents
7. **User Authentication:** Login, password management, session management

#### 2.5.2 Secondary Uses
1. **Analytics:** Understanding usage patterns, popular events, user engagement
2. **Service Improvement:** Identifying bugs, performance issues, feature requests
3. **Security:** Detecting unauthorized access, abuse, fraud
4. **Communication:** Sending event reminders, booking confirmations, certificate emails

#### 2.5.3 Automated Decision-Making
- **Certificate Generation:** Automatically generates certificates when:
  - Event ends AND user attended (QR scan) AND feedback completed (if required)
- **Waitlist Management:** Automatically moves users from waitlist to confirmed when spots open
- **Access Control:** Automatically restricts event access based on user role/category

**No Profiling:** The platform does not perform automated profiling or decision-making that significantly affects users.

---

## 3. Necessity and Proportionality

### 3.1 Is Data Collection Necessary?

**Yes.** All data collected is necessary for:
- **Core Functionality:** Event management, booking, attendance tracking, certificates
- **Legal Compliance:** NHS requirements for 7-year retention of medical education records
- **Service Delivery:** User authentication, personalization, communication
- **Security:** Fraud prevention, abuse detection, audit trails

### 3.2 Is Data Collection Proportional?

**Yes.** Data collection is limited to:
- **Minimum Necessary:** Only data required for service delivery is collected
- **Purpose-Limited:** Data is not used for purposes beyond stated service
- **Time-Limited:** Data is retained only as long as necessary (7 years for NHS records, shorter for other data)

### 3.3 Data Minimization

**Implemented:**
- Optional profile fields (university, year, specialty) - users can skip
- Anonymous feedback option (user_id can be NULL)
- Soft deletes (data retained but marked deleted for audit)
- Automatic purging of old analytics data (2 years)

**Could Improve:**
- Consider shorter retention for non-NHS users (if applicable)
- Consider anonymization of old feedback data (after 2 years)

---

## 4. Risks to Data Subjects

### 4.1 Identified Risks

#### 4.1.1 High Risk: Unauthorized Access to Personal Data
**Risk Description:** Unauthorized individuals gaining access to user data (emails, names, booking history, feedback)

**Likelihood:** Medium  
**Impact:** High  
**Overall Risk:** **HIGH**

**Mitigation:**
- ✅ Password hashing (bcrypt, salt rounds: 12)
- ✅ HTTPS/SSL encryption (all traffic encrypted)
- ✅ Database encryption at rest (Supabase)
- ✅ Role-based access control (API-level authorization)
- ✅ Row-Level Security policies (where enabled)
- ✅ Service role key stored securely (environment variables)
- ⚠️ **Action Required:** Review RLS policies - many are disabled, relying on API-level auth (acceptable but document)

**Residual Risk:** Medium (acceptable with current mitigations)

#### 4.1.2 Medium Risk: Data Breach
**Risk Description:** Database compromise, credential theft, or unauthorized access to Supabase/Vercel accounts

**Likelihood:** Low  
**Impact:** High  
**Overall Risk:** **MEDIUM**

**Mitigation:**
- ✅ Strong password requirements (minimum 8 characters)
- ✅ Email verification required
- ✅ Two-factor authentication (2FA) available (Supabase)
- ✅ Regular security updates (dependencies, infrastructure)
- ✅ Environment variable encryption (Vercel)
- ✅ Database backups (daily, encrypted)
- ⚠️ **Action Required:** Enable 2FA on all admin accounts, implement regular security audits

**Residual Risk:** Low-Medium (acceptable with additional 2FA enforcement)

#### 4.1.3 Medium Risk: Inadequate Data Retention
**Risk Description:** Retaining data longer than necessary, or deleting data too early (violating NHS 7-year requirement)

**Likelihood:** Low  
**Impact:** Medium  
**Overall Risk:** **MEDIUM**

**Mitigation:**
- ✅ Documented retention periods (7 years for NHS records)
- ✅ Soft deletes (data marked deleted, not immediately purged)
- ⚠️ **Action Required:** Implement automated data purging after retention period (except NHS records)

**Residual Risk:** Low (acceptable with automated purging)

#### 4.1.4 Low Risk: Third-Party Data Processing
**Risk Description:** Third-party processors (Supabase, Vercel, Azure) mishandling data or experiencing breaches

**Likelihood:** Low  
**Impact:** Medium  
**Overall Risk:** **LOW**

**Mitigation:**
- ✅ Reputable providers (Supabase, Vercel are industry-standard)
- ✅ Data Processing Agreements required (see Section 5)
- ✅ Encryption in transit and at rest (all providers)
- ✅ GDPR-compliant providers (EU-based or compliant)
- ⚠️ **Action Required:** Ensure DPAs are signed with all processors

**Residual Risk:** Low (acceptable with DPAs in place)

#### 4.1.5 Low Risk: Inadequate User Rights
**Risk Description:** Users unable to exercise GDPR rights (access, deletion, portability)

**Likelihood:** Low  
**Impact:** Low  
**Overall Risk:** **LOW**

**Mitigation:**
- ✅ Privacy policy published (app/privacy/page.tsx)
- ✅ Data export functionality (app/api/user/data-export/route.ts)
- ⚠️ **Action Required:** Implement data deletion API endpoint, document DSAR procedure

**Residual Risk:** Low (acceptable with deletion endpoint)

### 4.2 Risk Summary

| Risk | Likelihood | Impact | Overall Risk | Mitigation Status |
|------|------------|--------|--------------|-------------------|
| Unauthorized Access | Medium | High | **HIGH** | ✅ Good (review RLS) |
| Data Breach | Low | High | **MEDIUM** | ✅ Good (enable 2FA) |
| Inadequate Retention | Low | Medium | **MEDIUM** | ⚠️ Needs automation |
| Third-Party Processing | Low | Medium | **LOW** | ✅ Good (need DPAs) |
| Inadequate User Rights | Low | Low | **LOW** | ⚠️ Needs deletion API |

**Overall Assessment:** Risks are **ACCEPTABLE** with recommended improvements.

---

## 5. Measures to Address Risks

### 5.1 Technical Measures

#### 5.1.1 Encryption
- ✅ **In Transit:** HTTPS/SSL (all traffic encrypted)
- ✅ **At Rest:** Database encryption (Supabase default)
- ✅ **Passwords:** Bcrypt hashing (salt rounds: 12)
- ✅ **Storage:** Supabase Storage encryption

#### 5.1.2 Access Controls
- ✅ **Authentication:** NextAuth.js (JWT sessions)
- ✅ **Authorization:** Role-based (admin, educator, meded_team, ctf, student)
- ✅ **API Protection:** All API routes require authentication
- ✅ **Database:** Row-Level Security (RLS) policies (where enabled)
- ⚠️ **Action:** Review and document RLS policy strategy

#### 5.1.3 Security Monitoring
- ✅ **Error Logging:** Comprehensive error logging (lib/logger.ts)
- ✅ **Audit Trails:** Timestamps on all data modifications
- ⚠️ **Action:** Implement security event monitoring/alerts

#### 5.1.4 Backup & Recovery
- ✅ **Database Backups:** Daily automated backups (Supabase)
- ✅ **Point-in-Time Recovery:** Available (Supabase)
- ✅ **Code Versioning:** Git repository with version control

### 5.2 Organizational Measures

#### 5.2.1 Staff Training
- ⚠️ **Action Required:** Document data protection training for all staff
- ⚠️ **Action Required:** Implement access logs for admin actions

#### 5.2.2 Data Processing Agreements
- ⚠️ **Action Required:** Sign DPAs with:
  - Supabase
  - Vercel
  - Resend/Azure
  - OpenAI (if used)
  - Hume AI (if used)

#### 5.2.3 Incident Response
- ⚠️ **Action Required:** Document data breach response procedure
- ⚠️ **Action Required:** Define ICO notification process (72-hour requirement)

### 5.3 User Rights Implementation

#### 5.3.1 Right to Access
- ✅ **Implemented:** Data export API endpoint (`/api/user/data-export`)
- ✅ **Documented:** Privacy policy explains how to request data
- ⚠️ **Action:** Create dedicated email (dsar@yourcompany.com) for data requests

#### 5.3.2 Right to Rectification
- ✅ **Implemented:** Users can edit their profile data
- ✅ **Implemented:** Admin can update user data

#### 5.3.3 Right to Erasure
- ⚠️ **Action Required:** Implement data deletion API endpoint
- ⚠️ **Action Required:** Document deletion procedure (including NHS 7-year retention exception)

#### 5.3.4 Right to Portability
- ✅ **Implemented:** Data export in JSON/CSV format

#### 5.3.5 Right to Object
- ✅ **Implemented:** Users can opt out of marketing communications
- ✅ **Implemented:** Users can opt out of analytics (analytics_consent flag)

### 5.4 Data Retention

#### 5.4.1 Retention Periods
- **NHS Records (bookings, certificates, attendance):** 7 years
- **User Accounts:** While active + 7 years
- **Feedback:** 7 years (if linked to certificate), 2 years (if anonymous)
- **Analytics:** 2 years (anonymized after 1 year)
- **Audio Data (Hume):** 1 year (transcripts), 30 days (audio files)
- **Email Logs:** 30-90 days (per provider policy)

#### 5.4.2 Deletion Procedures
- ⚠️ **Action Required:** Implement automated data purging after retention period
- ⚠️ **Action Required:** Document manual deletion procedure for user requests

---

## 6. Consultation

### 6.1 Internal Consultation
- **Technical Team:** Reviewed data flows, security measures
- **Legal/Compliance:** Review required (if available)
- **Data Protection Officer:** Appoint if required (for large-scale processing)

### 6.2 External Consultation
- **ICO:** Not required unless high risk (current assessment: acceptable risk)
- **NHS Trusts:** Consult with data protection teams at pilot trusts (Basildon Hospital)

---

## 7. Sign-Off and Approval

### 7.1 Assessment Completed By
- **Name:** [Your Name]  
- **Role:** Technical Director / Data Protection Lead  
- **Date:** November 2025

### 7.2 Approved By
- **Name:** [Partner Name]  
- **Role:** Company Director  
- **Date:** [Date]

### 7.3 Next Review Date
- **Date:** January 2026 (or when significant changes occur)

---

## 8. Action Items

### 8.1 High Priority
1. ✅ Complete this DPIA document
2. ⚠️ Sign Data Processing Agreements with all third-party processors
3. ⚠️ Implement data deletion API endpoint
4. ⚠️ Enable 2FA on all admin accounts
5. ⚠️ Document data breach response procedure

### 8.2 Medium Priority
1. ⚠️ Review and document RLS policy strategy
2. ⚠️ Implement automated data purging after retention period
3. ⚠️ Create dedicated DSAR email address
4. ⚠️ Implement security event monitoring/alerts

### 8.3 Low Priority
1. ⚠️ Document staff data protection training
2. ⚠️ Implement access logs for admin actions
3. ⚠️ Consider anonymization of old feedback data

---

## 9. Appendices

### Appendix A: Data Flow Diagrams
[To be added: Visual diagrams showing data flows]

### Appendix B: Third-Party Processor List
1. **Supabase** - Database, storage, authentication
2. **Vercel** - Application hosting, CDN
3. **Azure/Microsoft 365** - Email delivery
4. **OpenAI** - AI processing (if used)
5. **Hume AI** - Audio processing (if used)

### Appendix C: Legal Basis Summary
- **Contractual Necessity:** Event booking, attendance tracking, certificate generation
- **Legitimate Interest:** Analytics, service improvement, security
- **Consent:** Marketing communications, analytics (optional), audio recording (if used)

### Appendix D: Retention Schedule
| Data Type | Retention Period | Legal Basis |
|-----------|------------------|-------------|
| NHS Education Records | 7 years | NHS requirement |
| User Accounts | Active + 7 years | NHS requirement |
| Feedback (certificate-linked) | 7 years | NHS requirement |
| Feedback (anonymous) | 2 years | Legitimate interest |
| Analytics | 2 years (1 year anonymized) | Legitimate interest |
| Audio Data | 1 year (transcripts), 30 days (audio) | Consent |
| Email Logs | 30-90 days | Provider policy |

---

## Document Control

**Version:** 1.0  
**Last Updated:** November 2025  
**Next Review:** January 2026  
**Status:** Draft (awaiting approval)

---

**END OF DPIA**

