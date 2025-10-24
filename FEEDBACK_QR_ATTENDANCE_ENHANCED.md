# Enhanced Feedback and QR Code Attendance System

## Overview
Build a complete attendance tracking and feedback system that integrates with the existing booking and certificate systems, with **auto-certificate generation** capabilities.

## User Flow
1. User registers for an event (existing booking system)
2. User attends the session
3. User scans QR code to mark attendance
4. Booking status updated to "attended" and `checked_in` field set to true
5. User receives feedback form link via email (also available in My Bookings)
6. User completes feedback form
7. **NEW**: If auto-certificate is enabled, certificate is automatically generated and sent
8. **NEW**: If manual approval, MedEd team manually approves and generates certificate
9. User receives email notification that certificate has been released

## New Features Added

### Auto-Certificate Generation
- **Event Configuration**: Add checkbox on event creation/edit page for auto-generate certificate
- **Template Selection**: Dropdown with search to select certificate template
- **Template Management**: Link to create new templates if none exist
- **Automatic Processing**: Certificates generated and emailed automatically after feedback completion

## Implementation Plan

### Phase 1: Database Schema (New Tables)

**File**: `migrations/add-feedback-and-qr-system.sql`

Create the following tables:

#### 1. `event_qr_codes` table
- `id` (UUID, primary key)
- `event_id` (UUID, references events)
- `qr_code_data` (TEXT, encrypted unique identifier)
- `qr_code_image_url` (TEXT, Supabase Storage URL)
- `active` (BOOLEAN, default true)
- `scan_window_start` (TIMESTAMP, default: event start - 30 min)
- `scan_window_end` (TIMESTAMP, default: event end + 1 hour)
- `created_at`, `updated_at`
- UNIQUE constraint on `event_id`

#### 2. `qr_code_scans` table (audit log)
- `id` (UUID, primary key)
- `qr_code_id` (UUID, references event_qr_codes)
- `user_id` (UUID, references users)
- `booking_id` (UUID, references event_bookings)
- `scanned_at` (TIMESTAMP)
- `scan_success` (BOOLEAN)
- `failure_reason` (TEXT, nullable)
- `created_at`

#### 3. `feedback_forms` table
- `id` (UUID, primary key)
- `event_id` (UUID, references events)
- `form_name` (TEXT)
- `form_template` (TEXT, enum: 'workshop', 'seminar', 'clinical_skills', 'custom')
- `questions` (JSONB, array of question objects)
- `active` (BOOLEAN, default true)
- `created_by` (UUID, references users)
- `created_at`, `updated_at`
- Example questions structure:
  ```json
  [
    {
      "id": "q1",
      "type": "rating",
      "question": "How would you rate this session?",
      "required": true,
      "scale": 5
    },
    {
      "id": "q2", 
      "type": "text",
      "question": "What did you learn?",
      "required": false
    }
  ]
  ```

#### 4. `feedback_responses` table
- `id` (UUID, primary key)
- `feedback_form_id` (UUID, references feedback_forms)
- `event_id` (UUID, references events)
- `booking_id` (UUID, references event_bookings)
- `user_id` (UUID, references users)
- `responses` (JSONB, key-value pairs of question_id: answer)
- `completed_at` (TIMESTAMP)
- `created_at`, `updated_at`
- UNIQUE constraint on (`feedback_form_id`, `user_id`)

### Phase 2: Database Updates

**File**: `migrations/update-event-bookings-for-feedback.sql`

Add columns to `event_bookings` table:
- `feedback_completed` (BOOLEAN, default false)
- `feedback_completed_at` (TIMESTAMP, nullable)

**File**: `migrations/update-events-for-qr-codes.sql`

Add columns to `events` table:
- `qr_attendance_enabled` (BOOLEAN, default false)
- `feedback_required_for_certificate` (BOOLEAN, default true)
- `feedback_deadline_days` (INTEGER, nullable, default null for no deadline)
- **NEW**: `auto_generate_certificate` (BOOLEAN, default false)
- **NEW**: `certificate_template_id` (TEXT, nullable, references certificate templates)
- **NEW**: `certificate_auto_send_email` (BOOLEAN, default true)

### Phase 3: API Routes

#### 1. QR Code Management APIs

**File**: `app/api/qr-codes/generate/route.ts`
- POST: Generate QR code for an event (MedEd team only)
- Input: `eventId`, `scanWindowStart` (optional), `scanWindowEnd` (optional)
- Output: QR code image URL, encrypted identifier

**File**: `app/api/qr-codes/scan/route.ts`
- POST: Scan QR code to mark attendance
- Input: `qrCodeData` (encrypted token from QR scan)
- Output: Success/failure message, booking updated
- **NEW**: If auto-certificate enabled, trigger certificate generation after feedback

**File**: `app/api/qr-codes/[eventId]/route.ts`
- GET: Get QR code for an event (MedEd team only)
- DELETE: Deactivate QR code for an event (admin only)

#### 2. Feedback Form APIs

**File**: `app/api/feedback/forms/route.ts`
- GET: List all feedback form templates
- POST: Create feedback form for an event (MedEd team only)

**File**: `app/api/feedback/forms/[formId]/route.ts`
- GET: Get specific feedback form with questions
- PUT: Update feedback form (MedEd team only)
- DELETE: Delete feedback form (admin only)

**File**: `app/api/feedback/submit/route.ts`
- POST: Submit feedback response
- Input: `feedbackFormId`, `eventId`, `responses` (JSONB)
- Output: Success message
- **NEW**: If auto-certificate enabled, automatically generate and send certificate
- Logic:
  - Validate user has attended (checked_in = true)
  - Validate all required questions answered
  - Save to `feedback_responses` table
  - Update booking with feedback completion flag
  - **NEW**: Check if event has auto-certificate enabled
  - **NEW**: If yes, call certificate generation API automatically
  - **NEW**: Send certificate via email if enabled
  - Return success

**File**: `app/api/feedback/responses/[eventId]/route.ts`
- GET: Get all feedback responses for an event (MedEd team only)
- Export as CSV/Excel option

#### 3. **NEW**: Auto-Certificate APIs

**File**: `app/api/certificates/auto-generate/route.ts`
- POST: Auto-generate certificate after feedback completion
- Input: `eventId`, `userId`, `bookingId`
- Logic:
  - Get event certificate template
  - Generate certificate using existing certificate system
  - Send email if `certificate_auto_send_email` is true
  - Update booking with certificate generated flag
- Called automatically from feedback submission API

**File**: `app/api/certificates/templates/search/route.ts`
- GET: Search certificate templates for dropdown
- Input: `searchQuery` (optional), `limit` (optional)
- Output: Array of templates with id, name, description
- Used by event creation form

### Phase 4: Frontend Pages

#### 1. **ENHANCED**: Event Creation/Edit Page

**File**: `app/event-data/page.tsx` (existing, needs updates)

**New Section**: Certificate Generation Settings
- **Checkbox**: "Auto-generate certificates after feedback completion"
- **Template Dropdown**: Searchable dropdown of certificate templates
  - Search functionality
  - Show template name and description
  - "No templates found" state with link to create
- **Email Settings**: "Automatically send certificates via email" (checkbox)
- **Template Management**: 
  - "Create New Template" button → links to `/certificates/image-builder`
  - "Manage Templates" button → links to `/certificates/templates`

**Implementation Details**:
```tsx
// New form fields in event creation
const [autoGenerateCertificate, setAutoGenerateCertificate] = useState(false);
const [selectedTemplateId, setSelectedTemplateId] = useState('');
const [autoSendEmail, setAutoSendEmail] = useState(true);

// Template search functionality
const [templateSearchQuery, setTemplateSearchQuery] = useState('');
const [availableTemplates, setAvailableTemplates] = useState([]);
const [loadingTemplates, setLoadingTemplates] = useState(false);

// Search templates API call
const searchTemplates = async (query) => {
  const response = await fetch(`/api/certificates/templates/search?q=${query}`);
  const templates = await response.json();
  setAvailableTemplates(templates);
};
```

#### 2. QR Code Management Page

**File**: `app/qr-codes/page.tsx`
- MedEd team only access
- List all events with booking enabled
- Show QR code status for each event
- Show auto-certificate status
- Actions:
  - Generate QR code button
  - View/Download QR code
  - Configure scan window
  - Deactivate QR code
  - View scan statistics

**File**: `app/qr-codes/[eventId]/page.tsx`
- Display large QR code for event
- Show scan window times
- Show auto-certificate settings
- Live scan count
- Download QR code as PNG/PDF

#### 3. QR Code Scanner Page

**File**: `app/scan-attendance/page.tsx`
- Public access (authenticated users)
- Use device camera to scan QR code
- Show scan success/failure message
- Redirect to feedback form on success
- Show auto-certificate status if enabled

#### 4. Feedback Form Pages

**File**: `app/feedback/create/page.tsx`
- MedEd team only
- Create feedback form for event
- Show auto-certificate settings for the event
- Link to configure certificate template

**File**: `app/feedback/[formId]/page.tsx`
- Public access (authenticated, attended users only)
- Display feedback form questions
- Show auto-certificate status
- Submit responses
- **NEW**: If auto-certificate enabled, show "Certificate will be generated automatically"
- **NEW**: If manual, show "Certificate will be available after approval"
- Redirect to My Bookings page

**File**: `app/feedback/responses/[eventId]/page.tsx`
- MedEd team only
- View all feedback responses for an event
- Show auto-certificate status
- Show which attendees have certificates generated
- Export to CSV/Excel

#### 5. **ENHANCED**: My Bookings Page

**File**: `app/my-bookings/page.tsx` (existing, needs updates)

**New Status Indicators**:
- "Booked" (confirmed)
- "Attended" (checked_in)
- "Feedback Pending" (attended, no feedback)
- "Certificate Auto-Generated" (feedback done, auto-certificate enabled)
- "Certificate Ready" (feedback done, certificate generated)
- "Certificate Pending Approval" (feedback done, manual approval)

**New Actions**:
- "Scan QR Code" button (if event is today and within scan window)
- "Complete Feedback" button (if checked_in and feedback not completed)
- "View Certificate" button (if certificate available)
- "Certificate Processing" indicator (if auto-certificate enabled)

#### 6. **ENHANCED**: Certificate Generation Page

**File**: `app/certificates/generate/page.tsx` (existing, needs updates)

**New Features**:
- Filter: "Show only feedback-completed attendees"
- Filter: "Show only auto-certificate events"
- Badge: "Auto-Generated" next to attendees with auto-certificates
- Badge: "Manual Approval Required" for manual events
- Bulk actions: "Generate certificates for all eligible attendees"
- Settings: "Configure auto-certificate for this event"

### Phase 5: Email Templates

**File**: `lib/email.ts` (add new functions)

#### 1. `sendFeedbackFormEmail()`
- Triggered after QR scan
- Subject: "Please complete feedback for [Event Title]"
- Body:
  - Thank you for attending
  - Link to feedback form
  - **NEW**: If auto-certificate enabled, mention "Certificate will be generated automatically"
  - **NEW**: If manual, mention "Certificate will be available after approval"

#### 2. `sendCertificateAutoGeneratedEmail()`
- **NEW**: Triggered when auto-certificate is generated
- Subject: "Your certificate for [Event Title] has been generated!"
- Body:
  - Congratulations message
  - Link to download certificate
  - Link to view in My Bookings
  - Thank you for participation

#### 3. `sendCertificateReadyEmail()`
- Triggered when manual certificate is approved
- Subject: "Your certificate for [Event Title] is ready!"
- Body:
  - Congratulations message
  - Link to download certificate
  - Link to view in My Bookings
  - Thank you for participation

### Phase 6: Components

**File**: `components/qr/QRCodeGenerator.tsx`
- Generate QR code component
- Props: eventId, size, downloadButton

**File**: `components/qr/QRScanner.tsx`
- QR scanner component using device camera
- Props: onScanSuccess, onScanFailure

**File**: `components/feedback/FeedbackFormBuilder.tsx`
- Drag-and-drop form builder
- Add/remove questions
- Configure question types
- Preview mode

**File**: `components/feedback/FeedbackFormDisplay.tsx`
- Display feedback form for users
- Validate responses
- Submit form

**File**: `components/feedback/FeedbackAnalytics.tsx`
- Display feedback analytics
- Charts and graphs
- Export options

**File**: `components/certificates/AutoCertificateSettings.tsx`
- **NEW**: Certificate auto-generation settings component
- Props: eventId, onSettingsChange
- Features:
  - Enable/disable auto-certificate checkbox
  - Template selection dropdown with search
  - Email settings
  - Template management links

**File**: `components/certificates/TemplateSearchDropdown.tsx`
- **NEW**: Searchable template dropdown component
- Props: onTemplateSelect, selectedTemplateId, placeholder
- Features:
  - Search functionality
  - Template preview
  - "Create new template" option
  - Loading states

### Phase 7: NPM Packages to Install

```bash
npm install qrcode @types/qrcode
npm install html5-qrcode
npm install crypto-js @types/crypto-js
npm install recharts  # for analytics charts
```

### Phase 8: Supabase Storage Buckets

Create new storage buckets:
1. `qr-codes` - Private, stores QR code images
2. `feedback-attachments` - Private (future: allow file uploads in feedback)

## Implementation Order

#### Week 1: Database & Core APIs
1. Create database migration files
2. Run migrations in Supabase
3. Build QR code generation API
4. Build QR code scan API
5. Build feedback form creation API
6. Build feedback submission API
7. **NEW**: Build auto-certificate generation API

#### Week 2: QR Code Features
1. Build QR code management page (MedEd)
2. Build QR code scanner page (students)
3. Build QR code display/download page
4. Test QR code generation and scanning flow

#### Week 3: Feedback System
1. Build feedback form builder (MedEd)
2. Build feedback form display (students)
3. Build feedback responses page (MedEd)
4. Build feedback analytics dashboard

#### Week 4: **NEW**: Auto-Certificate Features
1. **NEW**: Update event creation page with certificate settings
2. **NEW**: Build template search dropdown component
3. **NEW**: Build auto-certificate settings component
4. **NEW**: Integrate auto-certificate with feedback submission
5. **NEW**: Update My Bookings with auto-certificate status

#### Week 5: Integration & Testing
1. Update My Bookings page
2. Update certificate generation page
3. Add email notifications
4. End-to-end testing
5. Documentation

## Key Files to Modify

### Database Migrations
- `migrations/add-feedback-and-qr-system.sql` (new)
- `migrations/update-event-bookings-for-feedback.sql` (new)
- `migrations/update-events-for-qr-codes.sql` (new)

### API Routes (New)
- `app/api/qr-codes/generate/route.ts`
- `app/api/qr-codes/scan/route.ts`
- `app/api/qr-codes/[eventId]/route.ts`
- `app/api/feedback/forms/route.ts`
- `app/api/feedback/forms/[formId]/route.ts`
- `app/api/feedback/submit/route.ts`
- `app/api/feedback/responses/[eventId]/route.ts`
- `app/api/bookings/attendance-ready/[eventId]/route.ts`
- **NEW**: `app/api/certificates/auto-generate/route.ts`
- **NEW**: `app/api/certificates/templates/search/route.ts`

### Frontend Pages (New)
- `app/qr-codes/page.tsx`
- `app/qr-codes/[eventId]/page.tsx`
- `app/scan-attendance/page.tsx`
- `app/feedback/create/page.tsx`
- `app/feedback/[formId]/page.tsx`
- `app/feedback/responses/[eventId]/page.tsx`

### Frontend Pages (Modify)
- **ENHANCED**: `app/event-data/page.tsx` (add certificate settings)
- **ENHANCED**: `app/my-bookings/page.tsx` (add auto-certificate status)
- **ENHANCED**: `app/certificates/generate/page.tsx` (add auto-certificate features)
- `app/dashboard/meded_team/page.tsx` (add quick links)

### Email Functions
- `lib/email.ts` (add `sendFeedbackFormEmail`, `sendCertificateAutoGeneratedEmail`, `sendCertificateReadyEmail`)

### Components (New)
- `components/qr/QRCodeGenerator.tsx`
- `components/qr/QRScanner.tsx`
- `components/feedback/FeedbackFormBuilder.tsx`
- `components/feedback/FeedbackFormDisplay.tsx`
- `components/feedback/FeedbackAnalytics.tsx`
- **NEW**: `components/certificates/AutoCertificateSettings.tsx`
- **NEW**: `components/certificates/TemplateSearchDropdown.tsx`

## Success Metrics

- QR codes generated for events
- Attendance marked via QR scan
- Feedback forms completed
- **NEW**: Auto-certificates generated automatically
- **NEW**: Manual certificates generated after approval
- Email notifications sent successfully
- **NEW**: Template usage statistics

## Security Considerations

1. QR code data encrypted with secret key
2. QR codes time-limited (scan window)
3. Only authenticated users can scan
4. Only MedEd team can generate QR codes
5. RLS policies on all new tables
6. Feedback responses are private (user can see own, MedEd sees all)
7. **NEW**: Auto-certificate generation requires proper permissions
8. **NEW**: Template access controlled by role

## Notes

- Integrates with existing booking system (uses `checked_in` field)
- Integrates with existing certificate system (both auto and manual flows)
- QR scan window configurable per event (default: 30 min before to 1 hour after)
- Feedback forms are template-based but customizable
- No deadline for feedback completion (always available)
- **NEW**: Certificate generation can be automatic or manual per event
- **NEW**: Template selection with search functionality
- **NEW**: Seamless integration with existing certificate templates system


