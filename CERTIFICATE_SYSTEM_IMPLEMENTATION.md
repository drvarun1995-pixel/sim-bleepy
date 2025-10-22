# 📜 Certificate System Implementation Guide

## 🎯 Overview
Complete certificate generation and management system for event attendance certificates with automated email delivery.

---

## ✅ Database Analysis Complete

### Existing Structure:
- **Events Table**: Full structure with 43 columns including booking, status, speakers
- **Event Bookings**: 17 columns with `checked_in` field for attendance tracking
- **Users Table**: 74 columns with email, name, role, university, etc.
- **Storage Buckets**: 3 existing (IMT Portfolio, profile-pictures, resources)
- **Certificates Table**: ❌ Does NOT exist (will be created)

---

## 📋 Implementation Steps

### **Step 1: Database Migration** ✅ READY
**File**: `migrations/create-certificates-system.sql`

**What it creates:**
```sql
certificates table:
  - id (UUID, primary key)
  - event_id (references events)
  - user_id (references users)
  - booking_id (references event_bookings, nullable)
  - template_id (text)
  - template_name (text)
  - certificate_data (JSONB) - stores all field values
  - certificate_url (text) - Supabase Storage URL
  - certificate_filename (text)
  - sent_via_email (boolean)
  - email_sent_at (timestamp)
  - email_error (text)
  - generated_by (UUID, references users)
  - generated_at (timestamp)
  - created_at, updated_at (timestamps)
  - UNIQUE constraint on (event_id, user_id)
```

**RLS Policies:**
- Users can view their own certificates
- Staff (admin, educator, meded_team, ctf) can view all
- Only admin, meded_team, ctf can insert
- Only admins can update/delete

**To Run:**
1. Open Supabase SQL Editor
2. Paste contents of `migrations/create-certificates-system.sql`
3. Execute
4. Verify: `SELECT * FROM certificates;` (should return empty)

---

### **Step 2: Storage Bucket Setup**
**Action Required:**
1. Go to Supabase Dashboard → Storage
2. Create new bucket: `certificates`
3. Set to **Private** (only authenticated users can access)
4. Enable RLS policies:
   ```sql
   -- Users can view their own certificates
   CREATE POLICY "Users can download own certificates"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'certificates' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   
   -- Staff can view all certificates
   CREATE POLICY "Staff can view all certificates"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'certificates' AND
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id::text = auth.uid()::text
       AND users.role IN ('admin', 'educator', 'meded_team', 'ctf')
     )
   );
   
   -- Only staff can upload
   CREATE POLICY "Staff can upload certificates"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'certificates' AND
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id::text = auth.uid()::text
       AND users.role IN ('admin', 'meded_team', 'ctf')
     )
   );
   ```

---

### **Step 3: Email Function** 🔜 TO BUILD
**File**: `lib/email.ts`

**Add new function:**
```typescript
export interface CertificateEmailData {
  recipientEmail: string;
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation?: string;
  eventDuration?: string;
  certificateUrl: string;
  certificateId: string;
}

export async function sendCertificateEmail(data: CertificateEmailData) {
  // Beautiful HTML email template
  // Uses existing sendEmailWithRetry() 
  // Sent via Microsoft Graph API (support@bleepy.co.uk)
}
```

---

### **Step 4: Generate Certificates Page** 🔜 TO BUILD
**File**: `app/certificates/generate/page.tsx`

**Features:**
- Select event from dropdown
- Select template from saved templates
- Choose recipients:
  - ☑ All attended (checked_in = true)
  - ☐ All confirmed bookings
  - ☐ Include speakers/teachers
- Preview first certificate with real data
- Generate all button with progress bar
- Send emails option (checkbox)

**Flow:**
```typescript
1. Admin selects event
2. System fetches:
   - Event details from events table
   - Attendees from event_bookings WHERE checked_in = true
   - User details from users table
3. Admin selects template
4. Preview shows first certificate
5. Click "Generate All" (42 people)
   
For each attendee:
  - Load template
  - Replace dynamic fields:
    {attendee.name} → from users.name
    {event.title} → from events.title
    {event.date} → from events.date
    {certificate.id} → generated UUID
  - Generate PNG using canvas (at original image dimensions)
  - Upload to Supabase Storage: certificates/event-id/user-id-timestamp.png
  - Save to certificates table
  - If email enabled: call sendCertificateEmail()
  
6. Show results: "Generated 42/42 certificates ✓, Sent 42 emails ✓"
```

---

### **Step 5: Manage Certificates Page** 🔜 TO BUILD
**File**: `app/certificates/manage/page.tsx`

**Features:**
- Table view of all generated certificates
- Filters:
  - By event (dropdown)
  - By date range
  - By email status (sent/not sent)
  - By user (search)
- Columns:
  - Certificate thumbnail
  - Recipient name
  - Event title
  - Generated date
  - Email status
  - Actions (view, download, resend email, delete)
- Bulk actions:
  - Download selected as ZIP
  - Resend emails to selected
  - Delete selected
- Stats cards:
  - Total certificates
  - Emails sent
  - Emails pending
  - This month

---

### **Step 6: User Dashboard Integration** 🔜 TO BUILD
**File**: `app/dashboard/page.tsx`

**Add "My Certificates" section:**
- Card showing certificate count
- List of recent certificates (max 5)
- Each certificate shows:
  - Thumbnail
  - Event title
  - Date issued
  - Download button
- "View All" link to `/dashboard/certificates`

**New Page**: `app/dashboard/certificates/page.tsx`
- Full list of user's certificates
- Grid view with thumbnails
- Download individual/all
- Share options

---

### **Step 7: API Routes** 🔜 TO BUILD

**`app/api/certificates/generate/route.ts`**
```typescript
POST /api/certificates/generate
Body: {
  eventId: string,
  templateId: string,
  userIds: string[],  // attendee IDs
  sendEmail: boolean
}
Returns: {
  success: true,
  generated: number,
  emailsSent: number,
  errors: string[]
}
```

**`app/api/certificates/send-email/route.ts`**
```typescript
POST /api/certificates/send-email
Body: {
  certificateId: string
}
Returns: {
  success: true,
  sentAt: timestamp
}
```

**`app/api/certificates/[id]/route.ts`**
```typescript
GET /api/certificates/[id]
Returns: certificate details + user can download

DELETE /api/certificates/[id]  (admin only)
```

---

## 🎨 Certificate Generation Logic

### Current Flow (Image Builder):
1. User uploads background image
2. Add text fields with data sources
3. Preview shows sample data
4. Save as template

### New Flow (Generation):
1. Select event + template
2. Fetch real data from database:
```typescript
const attendees = await supabase
  .from('event_bookings')
  .select(`
    id,
    user_id,
    users (id, name, email, university)
  `)
  .eq('event_id', eventId)
  .eq('checked_in', true);

const event = await supabase
  .from('events')
  .select('*')
  .eq('id', eventId)
  .single();
```

3. For each attendee, generate certificate:
```typescript
// Load template
const template = getTemplate(templateId);

// Create canvas at original image dimensions
const img = new Image();
img.src = template.backgroundImage;

const canvas = document.createElement('canvas');
canvas.width = img.width;  // e.g., 2480px (A4 at 300 DPI)
canvas.height = img.height; // e.g., 3508px

// Calculate scale from display to actual
const scaleX = img.width / template.canvasSize.width;
const scaleY = img.height / template.canvasSize.height;

// Draw background
ctx.drawImage(img, 0, 0, img.width, img.height);

// Draw each field with real data
template.fields.forEach(field => {
  const value = getFieldValue(field.dataSource, attendee, event);
  
  // Scale position and font
  const scaledX = field.x * scaleX;
  const scaledY = field.y * scaleY;
  const scaledFontSize = field.fontSize * scaleX;
  
  ctx.font = `${field.fontStyle} ${field.fontWeight} ${scaledFontSize}px ${field.fontFamily}`;
  ctx.fillStyle = field.color;
  ctx.textAlign = field.textAlign;
  ctx.fillText(value, scaledX, scaledY);
});

// Export as PNG
const blob = await canvas.toBlob();
const filename = `${event.title}-${attendee.name}-${Date.now()}.png`;

// Upload to Supabase Storage
const { data } = await supabase.storage
  .from('certificates')
  .upload(`${eventId}/${filename}`, blob);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('certificates')
  .getPublicUrl(data.path);

// Save to database
await supabase.from('certificates').insert({
  event_id: eventId,
  user_id: attendee.user_id,
  booking_id: attendee.id,
  template_id: templateId,
  certificate_url: publicUrl,
  certificate_filename: filename,
  certificate_data: {
    attendee_name: attendee.users.name,
    event_title: event.title,
    event_date: formatDate(event.date),
    certificate_id: generateCertId()
  },
  generated_by: currentUserId
});

// Send email
if (sendEmail) {
  await sendCertificateEmail({
    recipientEmail: attendee.users.email,
    recipientName: attendee.users.name,
    eventTitle: event.title,
    eventDate: formatDate(event.date),
    certificateUrl: publicUrl,
    certificateId: certificateData.certificate_id
  });
}
```

---

## 🔐 Security & Permissions

### Who Can Do What:

| Action | Student | Educator | MedEd Team | CTF | Admin |
|--------|---------|----------|------------|-----|-------|
| View own certificates | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all certificates | ❌ | ✅ | ✅ | ✅ | ✅ |
| Generate certificates | ❌ | ❌ | ✅ | ✅ | ✅ |
| Send certificate emails | ❌ | ❌ | ✅ | ✅ | ✅ |
| Delete certificates | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage templates | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 📧 Email Template

```html
Subject: Your Certificate for {Event Title}

Hi {Attendee Name},

Congratulations on successfully attending "{Event Title}" on {Event Date}.

We're pleased to present your certificate of attendance.

[Download Certificate Button]

Event Details:
- Title: {Event Title}
- Date: {Event Date}
- Location: {Event Location}
- Duration: {Event Duration}

You can also view your certificate anytime in your dashboard:
https://sim.bleepy.co.uk/dashboard/certificates

Certificate ID: {Certificate ID}

Best regards,
Medical Education Team
Bleepy

---
© 2025 Bleepy. All rights reserved.
```

---

## 🎯 Data Flow

```
┌─────────────────┐
│  Admin selects  │
│  event + users  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fetch data:    │
│  - Event info   │
│  - Attendees    │
│  - Template     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  For each user: │
│  - Generate PNG │
│  - Upload file  │
│  - Save to DB   │
│  - Send email   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Show results:  │
│  - 42 generated │
│  - 42 emailed   │
└─────────────────┘
```

---

## 📊 Database Relationships

```
certificates
├── event_id → events.id
├── user_id → users.id
├── booking_id → event_bookings.id
└── generated_by → users.id

Storage: certificates/{event_id}/{user_id}-{timestamp}.png
```

---

## ✅ Testing Checklist

Before going live:
- [ ] Database migration runs successfully
- [ ] Storage bucket created with correct policies
- [ ] Template system works (create, save, load)
- [ ] Certificate generation with sample data
- [ ] Coordinate matching (preview vs output)
- [ ] File upload to Supabase Storage
- [ ] Database insertion
- [ ] Email sending (test with your email first)
- [ ] User can view own certificates
- [ ] Admin can view all certificates
- [ ] Download individual certificate
- [ ] Resend email functionality
- [ ] Bulk generation (10+ certificates)
- [ ] Error handling (failed upload, email, etc.)

---

## 🚀 Next Steps

1. **Run the migration** (create certificates table)
2. **Create storage bucket** (certificates)
3. **Add email function** to lib/email.ts
4. **Build generate page** (/certificates/generate)
5. **Build manage page** (/certificates/manage)
6. **Add to dashboard** (My Certificates section)
7. **Test locally** with sample event
8. **Deploy to production**

---

## 📝 Notes

- Certificates are generated at **original image resolution** (not display size)
- Each certificate has a **unique ID** for verification
- **No duplicate certificates** per user/event (database constraint)
- Emails sent via **Microsoft Graph API** (support@bleepy.co.uk)
- Storage is **private** - only auth users can access
- All actions are **audited** (generated_by, generated_at)

---

**Ready to implement? Start with Step 1: Run the database migration!** 🎯











