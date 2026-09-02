# Feedback, attendance, and form-template changes (Sim Bleepy → multi-tenant Bleepy)

Port this work into the multi-tenant Bleepy app the same way. Do not send feedback on QR scan. Do not mention certificates when certificates are off. Templates can be anonymous, multi-select, and include Other.

## Behaviour after this change

1. **Feedback invite email** is sent **after the event ends**, for every feedback-enabled event (booking on or off, signed-in or walk-in guest). Scan only records attendance.
2. **Certificates UI/email** only appear when `auto_generate_certificate && certificate_template_id`.
3. **Anonymous** is a template default, copied onto the event form. Submit needs no login. `user_id` and `booking_id` are stored as null. Reports already show “Anonymous”.
4. **Multiple choice** can allow several options (`allowMultiple`) and an **Other** text field (`allowOther` + `otherPlaceholder`).

No extra spam caps on anonymous forms.

## Database (run this on each environment)

File: `supabase/migrations/20260902_feedback_anonymous_templates.sql`

```sql
ALTER TABLE public.feedback_templates
ADD COLUMN IF NOT EXISTS anonymous_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.feedback_templates.anonymous_enabled IS
  'Default for event forms created from this template: submit without login and do not store who answered.';

UPDATE public.feedback_templates
SET anonymous_enabled = false
WHERE anonymous_enabled IS NULL;

ALTER TABLE public.feedback_responses
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.feedback_responses
ALTER COLUMN booking_id DROP NOT NULL;
```

Apply in the Supabase SQL editor if the CLI is not logged in. Existing events with feedback already enabled only get the new end-of-event invite task when the event is saved again (`updateCronTasksForEvent`).

## Shared helpers (copy as-is)

| File | Role |
|------|------|
| `lib/event-certificates.ts` | `eventCertificatesEnabled(event)` |
| `lib/feedback/questions.ts` | `FEEDBACK_OTHER_VALUE`, `finalizeMcAnswer`, `validateQuestionAnswer` |
| `components/feedback/MultipleChoiceInput.tsx` | Attendee radios/checkboxes + Other text |
| `components/feedback/MultipleChoiceQuestionFields.tsx` | Admin option list + allow multiple / Other |

Question JSON (no new tables):

```ts
{
  id, type: 'multiple_choice', question, required, options: string[],
  allowMultiple?: boolean,
  allowOther?: boolean,
  otherPlaceholder?: string
}
```

Other is stored as the typed string (inside a `string[]` when multi-select). Sentinel while editing: `__other__`.

## 1. Defer feedback email until event end

**Stop sending on scan** — `lib/qr-scan-attendance.ts`

- Remove `sendFeedbackFormEmail` from `runAttendanceSideEffects`.
- Keep certificate cron enqueue and the thank-you email when booking, feedback, and certificates are all off.
- Return `{ feedbackEmailSent: false }`.

**Queue invites whenever feedback is on** — `lib/cron-tasks.ts`

- Change `if (booking_enabled && feedback_enabled)` to `if (feedback_enabled)`.
- Still create `feedback_invites` at event end and `feedback_invites_next_day` +24h.

**Job** — `app/api/jobs/feedback-invites/route.ts`

- Skip only when `!feedback_enabled` (do not skip no-booking events).
- Recipients: successful QR scans if QR is on, else confirmed bookings.
- Load `feedback_forms.anonymous_enabled` and event certificate flags.
- URL:
  - anonymous → `{origin}/guest-feedback/{formId}` (no token)
  - walk-in guest (`event_bookings.registration_source = 'walk_in_guest'`) → signed guest-feedback token URL
  - everyone else → `/feedback/{formId}`
- Pass `certificatesEnabled` and `isGuestAccess` into `sendFeedbackFormEmail`.

**Copy** that said the form arrives immediately:

- `app/qr-codes/[eventId]/page.tsx`
- `app/scan-attendance/page.tsx` (use `feedbackEnabled`, not `feedbackEmailSent`)
- `app/scan-attendance-smart/page.tsx`

Scan APIs (`app/api/qr-codes/scan/route.ts`, `.../guest/route.ts`) should return `feedbackEnabled` and `certificatesEnabled`.

## 2. Hide certificate CTAs when certificates are off

Canonical: `eventCertificatesEnabled` = both flags set.

| Surface | Change |
|---------|--------|
| `app/scan-attendance-smart/page.tsx` | “Sign in for certificates” only if `certificatesEnabled`; otherwise Done |
| `app/feedback/[formId]/page.tsx` | Thank-you, toasts, instruction bullet |
| `app/feedback/event/[eventId]/page.tsx` | Certificate toasts |
| `app/guest-feedback/[formId]/page.tsx` | Already only toasts if auto-generated |
| `app/api/feedback/submit/route.ts` | Return `certificatesEnabled`; `certificateStatus` is null when certs are off |
| `app/api/feedback/forms/[formId]/route.ts` | Include event cert flags; `certificatesEnabled` on the form payload |
| `lib/email-templates/system.ts` | Certificate banner/subject only if `certificatesEnabled && feedbackRequiredForCertificate` |
| `lib/email.ts` | Pass `certificatesEnabled` through `sendFeedbackFormEmail` |

`/feedback/*` still uses the signed-in dashboard layout. Anonymous links must use `/guest-feedback/{formId}` (see job URLs above).

## 3A. Anonymous templates

- Add `anonymous_enabled` to `feedback_templates` selects/inserts/updates:
  - `app/api/feedback/templates/route.ts`
  - `app/api/feedback/templates/[templateId]/route.ts`
- Toggle on `app/feedback/templates/create/page.tsx` and `.../[templateId]/edit/page.tsx`.
- When instantiating a form from a template, copy the flag (do not hardcode `false`):
  - `app/api/events/create/route.ts`
  - `lib/bulkEventModuleSideEffects.ts`
  - `app/event-data/page.tsx` (checkbox + POST `anonymous_enabled`)
- Per-event override stays on `app/feedback/page.tsx`.
- GET form: fetch the form first; if `anonymous_enabled`, allow with no session/token. Skip already-submitted checks (no stored identity).
- POST submit: if anonymous, set `userId = null` even when a session or guest token is present. Do not attach `booking_id`. Skip duplicate-by-user_id.

Guest page `app/guest-feedback/[formId]/page.tsx`: if there is no token, still load when the form is anonymous.

## 3B / 3C. Multi-select and Other

Admin editors (use `MultipleChoiceQuestionFields`):

- `app/feedback/templates/create/page.tsx`
- `app/feedback/templates/[templateId]/edit/page.tsx`
- `app/feedback/page.tsx`
- `app/feedback/create/page.tsx`

Attendee renderers (use `MultipleChoiceInput`):

- `app/feedback/[formId]/page.tsx`
- `app/feedback/event/[eventId]/page.tsx`
- `app/guest-feedback/[formId]/page.tsx`

Submit (`app/api/feedback/submit/route.ts`): `validateQuestionAnswer` + `finalizeMcAnswer`. Analytics already counts arrays in `lib/feedback/formResponseData.ts`.

## Porting checklist for the SaaS repo

1. Run the SQL migration.
2. Copy the four helper files.
3. Apply the scan / cron / job / email changes.
4. Apply form GET/POST and template API changes.
5. Apply the UI editors and the three attendee pages.
6. Re-save any live event that already has feedback on so cron tasks are created.
7. Smoke test: QR walk-in with feedback on, certificates off → no email on scan, no “Sign in for certificates”, invite after `end_time`, anonymous form opens without login, multi-select + Other save as expected.
