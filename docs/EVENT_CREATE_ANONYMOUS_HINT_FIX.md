# Event create 500: do not insert feedback hints into `events`

Port this Sim Bleepy fix into the multi-tenant Bleepy app. Related feature handoff: `docs/FEEDBACK_ATTENDANCE_SAAS_HANDOFF.md`.

Shipped on Sim Bleepy (`sim.bleepy.co.uk`) on 2026-09-02 (`2f368614`).

## What broke

Creating an event with:

- feedback enabled
- anonymous feedback on
- a named template (for example Career Crisis Event Feedback)
- QR attendance + walk-in

failed with:

`Failed to create event. Please check console for details.`

`POST /api/events/create` returned **500**. Browser CSP, long-referrer, and GoTrue lock messages were unrelated.

## Cause

The add-event form now sends **non-column hints** so the API can create the feedback form:

| Payload key | Belongs on |
|-------------|------------|
| `feedback_enabled` | `events.feedback_enabled` |
| `feedbackFormTemplate` | form creation only |
| `feedbackCustomQuestions` | form creation only |
| `feedbackAnonymousEnabled` | `feedback_forms.anonymous_enabled` |
| `feedbackEnabled` (camelCase, if present) | same as `feedback_enabled`; not a column |

`feedbackFormTemplate` and `feedbackCustomQuestions` were already stripped before `events.insert`. **`feedbackAnonymousEnabled` was not.**

PostgREST then rejected the insert (`PGRST204`: column not in `events` schema). The request died before the event or form was created.

There is no `events.feedback_anonymous_enabled` column. Anonymous is stored on the **form**.

## Fix (copy this)

In `app/api/events/create/route.ts`, strip every feedback hint **before** `events.insert`. Keep the original `eventData` for form creation.

```ts
const cleanEventData = { ...eventData };
delete cleanEventData.speaker_ids;
delete cleanEventData.category_ids;
delete cleanEventData.location_ids;
delete cleanEventData.organizer_ids;
delete (cleanEventData as any).feedbackFormTemplate;
delete (cleanEventData as any).feedbackCustomQuestions;
delete (cleanEventData as any).feedbackAnonymousEnabled;
delete (cleanEventData as any).feedbackEnabled;

const { data: newEvent, error: eventError } = await supabaseAdmin
  .from('events')
  .insert([cleanEventData])
  .select()
  .single();
```

Then, when inserting `feedback_forms`, still read the hint from `eventData`:

```ts
anonymous_enabled: eventData.feedbackAnonymousEnabled !== undefined
  ? Boolean(eventData.feedbackAnonymousEnabled)
  : anonymousEnabled,
```

Also map template `category` onto the form check constraint. `feedback_templates.category` allows `system`; `feedback_forms.form_template` only allows `workshop | seminar | clinical_skills | custom`. If the template category is anything else, insert `custom`.

Do the same category coerce in `lib/bulkEventModuleSideEffects.ts` if that helper exists.

Do **not** add `feedbackAnonymousEnabled` (or `feedback_anonymous_enabled`) as an `events` column.

## Also check in Bleepy app

1. Event **update** (`PATCH /api/events/[id]` or equivalent): strip the same hint keys before `events.update`. Sim Bleepy update does not currently send them; do not start sending them as event columns.
2. Any other create path (bulk upload, duplicate, API) that copies the request body into `events` must strip the same keys.
3. Tenant code: hints stay request-only. Persist anonymous on `feedback_forms` scoped by `organisation_id`.

## Smoke test

1. Add event: feedback on, anonymous on, Career Crisis (or any saved) template, QR + walk-in.
2. Create succeeds (200). Event exists.
3. Event has an active form with `anonymous_enabled = true` and the template questions.
4. Repeat with anonymous off: form has `anonymous_enabled = false`.
5. Repeat with feedback off: event creates and no form is inserted.
