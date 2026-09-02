# Feedback, attendance, and form-template changes (Sim Bleepy → multi-tenant Bleepy)

Port this work into the multi-tenant Bleepy app the same way. Do not send feedback on QR scan. Do not mention certificates when certificates are off. Templates can be anonymous, multi-select, and include Other.

Dated running list (UI follow-ups included): `docs/BLEEPY_APP_FEEDBACK_CHANGELOG.md`.

Shipped on Sim Bleepy production (`sim.bleepy.co.uk`) on 2026-09-02. SQL applied there. Copy the behaviour into the SaaS repo (`bleepy-app` / tenant hostnames), not by deploying this Sim Bleepy Vercel project onto the multi-tenant app.

## Behaviour after this change

1. **Feedback invite email** is sent **after the event ends**, for every feedback-enabled event (booking on or off, signed-in or walk-in guest). Scan only records attendance.
2. **Certificates UI/email** only appear when `auto_generate_certificate && certificate_template_id`.
3. **Anonymous** is a template default, copied onto the event form. Submit needs no login. `user_id` and `booking_id` are stored as null. Reports already show “Anonymous”.
4. **Multiple choice** can allow several options (`allowMultiple`) and an **Other** text field (`allowOther` + `otherPlaceholder`).

No extra spam caps on anonymous forms.

## Database (run this on each environment)

File: `supabase/migrations/20260902_feedback_anonymous_templates.sql`

`anonymous_enabled` already exists on **`feedback_forms`** (per-event). This migration adds it on **`feedback_templates`** and allows anonymous rows on **`feedback_responses`**.

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

Apply in the Supabase SQL editor if the CLI is not logged in.

Existing events with feedback already enabled only get the new end-of-event invite task when the event is saved again (`updateCronTasksForEvent`). Events that already ended will not be backfilled.

Postgres `UNIQUE (feedback_form_id, user_id)` treats `user_id` NULL as distinct, so many anonymous rows can exist for one form. Do **not** change this to `UNIQUE NULLS NOT DISTINCT` or the second anonymous submit will fail with 23505.

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

Other is stored as the typed string (inside a `string[]` when multi-select). Sentinel while editing: `__other__`. Submit strips `${questionId}__other` after `finalizeMcAnswer`.

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
- Sim Bleepy builds `{origin}` from `NEXTAUTH_URL`. In SaaS this **must be the tenant hostname** (for example `https://basildon.bleepy.co.uk`), not a hardcoded `sim.bleepy.co.uk` and not a single global app URL for every org.

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

`/feedback/*` still uses the signed-in dashboard layout (`app/feedback/layout.tsx` redirects to sign-in). Anonymous and walk-in links **must** use `/guest-feedback/{formId}`. Do not put anonymous submit on `/feedback/{formId}`.

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

Thank-you / error / loading on that page must be **full-width** (`w-full` + page `bg-slate-50`). Putting `max-w-lg` on the same wrapper as the background leaves a skinny white column on the site’s dark `#060818` body. Constrain only the card (`max-w-xl`).

**Service role:** Sim Bleepy GET/POST uses `supabaseAdmin`. Anonymous insert cannot go through a user-scoped client: existing RLS is `WITH CHECK (auth.uid()::text = user_id::text)`, which rejects `user_id` null. Keep the admin client (or add an explicit anonymous insert policy, still tenant-scoped).

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

## Event create 500 (Sim Bleepy, 2026-09-02)

`feedbackAnonymousEnabled` is a **form hint**, not an `events` column. If the create API inserts the raw request body, PostgREST returns 500 (`PGRST204`) as soon as anonymous is ticked.

Strip `feedbackAnonymousEnabled`, `feedbackEnabled`, `feedbackFormTemplate`, and `feedbackCustomQuestions` before `events.insert`. Keep them on the original body for form creation. Full note: `docs/EVENT_CREATE_ANONYMOUS_HINT_FIX.md`.

## Production build gotcha (Sim Bleepy)

`feedbackAnonymousEnabled` is required on the event form state. Every **full** `setFormData({ ... })` replacement must include it, not only the initial/reset object. Missing it on duplicate and edit blocked `next build` on Vercel:

- `app/event-data/page.tsx` duplicate-from-URL handler
- `app/event-data/page.tsx` edit-event handler

Fix: `feedbackAnonymousEnabled: Boolean(eventData.feedbackAnonymousEnabled)` (and the same from the event being edited).

## Multi-tenant extras (do not skip)

These are not in the Sim Bleepy diff but will break isolation or links if ignored:

1. Scope `feedback_templates`, `feedback_forms`, and `feedback_responses` by `organisation_id` (and RLS). Anonymous submit still must not leak forms across tenants: load the form by id **and** tenant.
2. Invite and guest URLs must use the **current organisation origin**, not `NEXTAUTH_URL` if that is a single global value.
3. Template lists and “copy anonymous from template” must only see that organisation’s templates.
4. Walk-in guest tokens should be tenant-safe (form id + event id already checked; also confirm the event belongs to the hostname’s org).

## Porting checklist for the SaaS repo

1. Run the SQL migration on the SaaS Supabase project.
2. Copy the four helper files.
3. Apply the scan / cron / job / email changes. Make invite URLs tenant-aware.
4. Apply form GET/POST and template API changes. Keep admin client for anonymous insert, or add tenant-safe RLS.
5. Apply the UI editors and the three attendee pages. Keep anonymous on `/guest-feedback`.
6. Include `feedbackAnonymousEnabled` on every full event-form state object so production `next build` passes.
7. Re-save any live event that already has feedback on so cron tasks are created.
8. Smoke test: QR walk-in with feedback on, certificates off → no email on scan, no “Sign in for certificates”, invite after `end_time` on the tenant host, anonymous form opens without login, multi-select + Other save as expected, a second anonymous submit on the same form succeeds.
