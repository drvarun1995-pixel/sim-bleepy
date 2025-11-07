# Data Subject Access Request (DSAR) Procedure
## Bleepy Medical Education Platform

**Version:** 1.0  
**Date:** January 2025  
**Review Date:** January 2026

---

## 1. Purpose

This procedure outlines how to handle Data Subject Access Requests (DSARs) under GDPR Article 15, ensuring individuals can access their personal data within the required timeframe.

**Legal Requirement:** Under GDPR Article 15, we must provide individuals with access to their personal data within **30 days** of receiving a request.

---

## 2. What is a DSAR?

A Data Subject Access Request is a request from an individual to:
- **Access** their personal data
- **Understand** how their data is being processed
- **Receive** a copy of their data in a portable format

**Who can make a DSAR:**
- The data subject (the individual whose data it is)
- Someone authorized to act on their behalf (with proof of authorization)

---

## 3. How DSARs Can Be Received

### 3.1 Acceptable Methods
- **Email:** dsar@yourcompany.com (recommended)
- **Postal mail:** [Your Company Address]
- **In-person:** [If applicable]
- **Online form:** [If you create one]

### 3.2 Current Setup
**Dedicated Email:** Set up `dsar@yourcompany.com` or use your main support email

**Privacy Policy:** Already states users can request their data (see `app/privacy/page.tsx`)

**Data Export API:** Already implemented at `/api/user/data-export` (see `app/api/user/data-export/route.ts`)

---

## 4. DSAR Procedure

### Phase 1: Receipt and Validation (Day 0-1)

#### Step 1: Receive Request
**Actions:**
1. **Acknowledge receipt** within 24 hours
2. **Log the request** in a tracking system (spreadsheet or database)
3. **Assign reference number** (e.g., DSAR-2025-001)

**Template Acknowledgment Email:**
```
Subject: Acknowledgement of Your Data Access Request [DSAR-2025-001]

Dear [Name],

Thank you for your data access request received on [Date].

We have assigned your request reference number: DSAR-2025-001

We will respond to your request within 30 days as required by GDPR.

If you have any questions, please quote your reference number in any correspondence.

Best regards,
[Your Name]
Data Protection Lead
```

#### Step 2: Validate the Request
**Check:**
- ✅ Is the requester the data subject? (verify identity)
- ✅ Is the request clear? (what data do they want?)
- ✅ Is it a valid DSAR? (not a complaint or other request)

**Identity Verification:**
- **If registered user:** Verify via account email
- **If not registered:** Request proof of identity (photo ID, etc.)

**If Request is Invalid:**
- Politely explain why
- Offer to help clarify what they need
- Still respond within 30 days

---

### Phase 2: Data Collection (Day 1-25)

#### Step 3: Collect the Data
**Use Existing API:** `/api/user/data-export` already exports:
- User profile data
- Event bookings
- Certificates
- Feedback responses
- Resources
- Analytics data

**Manual Collection (if needed):**
1. **Query database** for all user data:
   ```sql
   -- Get all data for user
   SELECT * FROM users WHERE email = 'user@example.com';
   SELECT * FROM event_bookings WHERE user_id = '...';
   SELECT * FROM feedback_responses WHERE user_id = '...';
   SELECT * FROM certificates WHERE user_id = '...';
   -- etc.
   ```

2. **Export to portable format:**
   - JSON (structured data)
   - CSV (for spreadsheets)
   - PDF (for certificates/documents)

3. **Include metadata:**
   - What data we hold
   - Why we hold it (purpose)
   - Who we share it with
   - How long we keep it
   - Their rights

#### Step 4: Prepare Response
**Response Should Include:**
1. **Confirmation** of what data we hold
2. **Purpose** of processing
3. **Categories** of personal data
4. **Recipients** (who we share with)
5. **Retention period**
6. **Their rights** (rectification, erasure, etc.)
7. **Copy of their data** (in portable format)

---

### Phase 3: Response (Day 25-30)

#### Step 5: Send Response
**Deadline:** Within 30 days (can extend to 60 days for complex requests, but must notify within 30 days)

**Delivery Method:**
- **Secure email** (password-protected ZIP if sensitive)
- **Postal mail** (if requested)
- **Online download link** (secure, time-limited)

**Template Response Email:**
```
Subject: Response to Your Data Access Request [DSAR-2025-001]

Dear [Name],

Thank you for your data access request. Please find attached your personal data.

**What Data We Hold:**
- Account information (email, name, profile)
- Event bookings and attendance records
- Feedback responses
- Certificates
- [Other relevant data]

**Why We Hold This Data:**
- To provide medical education event management services
- To track attendance and generate certificates
- To improve our services

**Who We Share Data With:**
- Supabase (database hosting)
- Vercel (application hosting)
- Resend/Azure (email delivery)
- [List other processors]

**How Long We Keep Data:**
- NHS education records: 7 years
- User accounts: While active + 7 years
- Analytics: 2 years

**Your Rights:**
- Right to rectification (correct inaccurate data)
- Right to erasure (delete your account)
- Right to restrict processing
- Right to data portability
- Right to object

If you have any questions or wish to exercise any of your rights, please contact us.

Best regards,
[Your Name]
Data Protection Lead
```

#### Step 6: Document the Request
**Record:**
- Request reference number
- Date received
- Date responded
- Method of response
- Any follow-up actions

---

## 5. Special Cases

### 5.1 Complex Requests
**If request is complex:**
- Can extend deadline to **60 days**
- Must notify requester within **30 days** of extension
- Explain why extension is needed

### 5.2 Third-Party Data
**If data includes information about others:**
- Redact third-party information
- Explain what was redacted and why

### 5.3 Excessive Requests
**If request is manifestly unfounded or excessive:**
- Can charge a reasonable fee
- Can refuse (but must explain why)
- Still respond within 30 days

### 5.4 Requests from Minors
**If requester is under 18:**
- Verify parental consent if required
- Consider age-appropriate language
- May need to involve parent/guardian

---

## 6. Automation

### Current Implementation
✅ **Data Export API:** `/api/user/data-export` - Users can export their own data

**To Use:**
1. User logs in
2. Goes to profile/settings page
3. Clicks "Export My Data"
4. Receives JSON/CSV/PDF download

### Future Improvements
- ⚠️ Create dedicated DSAR form/page
- ⚠️ Automated email responses
- ⚠️ DSAR tracking system
- ⚠️ Automated data collection script

---

## 7. Contact Information

### DSAR Email
**Primary:** support@bleepy.co.uk  
**Alternative:** [Your main support email]

### Response Time
**Target:** Within 30 days  
**Maximum:** 60 days (for complex requests)

### Contact Person
**Data Protection Lead:** [Your Name]  
**Email:** [Your Email]  
**Phone:** [If applicable]

---

## 8. Record Keeping

**Requirement:** Maintain records of all DSARs

**What to Record:**
- Request reference number
- Date received
- Requester details (anonymized)
- Date responded
- Method of response
- Any issues or complications

**Storage:** Secure location, retained for audit purposes

---

## 9. Privacy Policy Reference

**Current Privacy Policy** (`app/privacy/page.tsx`) already states:
> "You have the right to access your personal data. To request a copy of your data, please contact us at [email]."

**Update Required:**
- Add dedicated DSAR email: `dsar@yourcompany.com`
- Add reference to this procedure
- Add expected response time (30 days)

---

## 10. Quick Reference Checklist

### Receiving a DSAR
- [ ] Acknowledge within 24 hours
- [ ] Assign reference number
- [ ] Verify identity
- [ ] Log the request

### Processing a DSAR
- [ ] Collect all user data
- [ ] Prepare response document
- [ ] Include data copy
- [ ] Include rights information

### Responding to a DSAR
- [ ] Send within 30 days
- [ ] Use secure delivery method
- [ ] Document the response
- [ ] Follow up if needed

---

## Appendix A: DSAR Request Template

**For Users to Request Their Data:**

```
To: support@bleepy.co.uk
Subject: Data Access Request

Dear Bleepy Team,

I would like to request a copy of all personal data you hold about me under GDPR Article 15.

My Details:
- Email: [user@example.com]
- Name: [Your Name]
- Account ID (if known): [Optional]

I understand you will respond within 30 days.

Thank you,
[Your Name]
```

---

## Appendix B: Data Export Format

**Current Export Includes:**
- User profile (JSON)
- Event bookings (CSV)
- Certificates (PDF links)
- Feedback responses (JSON)
- Resources (file list)
- Analytics summary (JSON)

**Format:** ZIP file containing:
- `user-data.json` - All structured data
- `bookings.csv` - Event bookings
- `certificates/` - Certificate PDFs
- `feedback.json` - Feedback responses
- `resources/` - Resource files
- `README.txt` - Explanation of data

---

**END OF PROCEDURE**

