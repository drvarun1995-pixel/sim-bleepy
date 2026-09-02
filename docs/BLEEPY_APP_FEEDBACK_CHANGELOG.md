# Bleepy app change log — feedback, attendance, templates

Running list of Sim Bleepy work to copy into the multi-tenant Bleepy app. Newest first. Port the behaviour, not this Vercel project.

Deeper specs (do not skip when doing those items):

- `docs/FEEDBACK_ATTENDANCE_SAAS_HANDOFF.md` — emails, certificates, anonymous templates, multi-select + Other
- `docs/EVENT_CREATE_ANONYMOUS_HINT_FIX.md` — event-create 500

Sim Bleepy production: `sim.bleepy.co.uk`. SaaS target: `bleepy-app` / tenant hostnames.

---

## 2026-09-02 — QR empty-state must not require a booking when walk-in is on

**Where:** `app/qr-codes/[eventId]/page.tsx` (`QRCodeDisplayPage`)

The empty attendee list always said “Make sure you have a booking for this event and the QR code is active”. That is wrong when `allow_walk_in_registration` is on.

**How**

Read `allow_walk_in_registration` and `booking_enabled` from the event (already on `/api/events`; add them to the page `Event` type). Hint copy:

- Walk-in on, booking on → “Booked attendees or walk-in guests can scan. The QR code must be active.”
- Walk-in on, booking off → “Walk-in guests can scan without a booking. The QR code must be active.”
- Walk-in off, booking off → “The QR code must be active”
- Walk-in off, booking on (or unknown) → keep the booking + active QR sentence

Do not hardcode a booking requirement on QR help text.

---

## 2026-09-02 — QR fullscreen has no close, Escape leaves a stuck overlay

**Where:** `app/qr-codes/[eventId]/page.tsx` (`QRCodeDisplayPage`)

**What broke**

Fullscreen set React `isFullscreen` (black overlay) and also called `document.documentElement.requestFullscreen()`.

1. The overlay was `fixed z-50` inside the dashboard `main.isolate`. Site nav is also `z-50` **outside** that stacking context, so it covered the top-right **Exit fullscreen** control. Scroll-to-top (`z-50`) sat on the overlay too.
2. Escape exited **native** fullscreen only. There was no `fullscreenchange` listener, so `isFullscreen` stayed true. Result: nav back, black QR overlay still covering the page, still no usable Exit.

**How**

1. Render the overlay with `createPortal(..., document.body)` and `z-[200]` so it sits above nav and dashboard isolate.
2. Always show **Exit fullscreen** top-right and again next to Test Scan Link. Hint: “Press Escape to close”.
3. Listen to `fullscreenchange` / `webkitfullscreenchange` / `MSFullscreenChange`. If there is no native fullscreen element, set `isFullscreen` false.
4. If the overlay is open and native fullscreen is **not** active, Escape closes the overlay.
5. Clicking Exit / Fullscreen again calls `exitFullscreen` and clears overlay state.

Do not leave the overlay as a `z-50` child of an `isolate` layout. Portal or a z-index above the site header.

---

## 2026-09-02 — Form actions button and response stat cards

**Where**

- `app/feedback/forms/[formId]/page.tsx` (`FeedbackFormView`)
- `app/feedback/forms/[formId]/responses/page.tsx` (`FeedbackFormResponsesPage`)

### Generate advanced report — text cut off

The default `Button` uses `whitespace-nowrap` and `h-9`. In the form sidebar the column is ~185px, so “Generate advanced report” + icon clipped to “Generate advanced repor”.

**How**

Override nowrap and fixed height. Keep `w-full`. Let the label wrap.

```tsx
<Button className="h-auto min-h-9 w-full whitespace-normal bg-teal-700 px-3 py-2 leading-snug text-white hover:bg-teal-800">
  <Sparkles className="h-4 w-4 shrink-0" />
  <span className="text-left">Generate advanced report</span>
</Button>
```

Same wrap classes on the responses-page header button (`size="sm"` → `min-h-8`).

Do **not** only shorten the label. The Bleepy `Button` will still nowrap unless you override it.

### Response visibility / summary cards — text not aligned

`Card` defaults to `p-6`. `CardContent` adds another `p-6` (`pt-0`). The four-up grid stretches all cards to the tallest (Form template). Inner rows stayed top-left, so “Response visibility / Anonymous” sat high and off-centre.

**How**

1. `Card className="h-full p-0"` so only Content provides padding.
2. `CardContent` is `flex h-full min-h-[7.5rem] items-center gap-3 p-5`.
3. Icon `shrink-0`. Text column `min-w-0` so long labels wrap.
4. Same layout on all four cards (Total responses, Average rating, Response visibility, Form template).
5. Grid: `md:grid-cols-2 xl:grid-cols-4` so four skinny columns do not crush the copy.

Copy this card shell if the SaaS responses hub uses the same `Card` defaults.

---

## 2026-09-02 — Guest thank-you was a thin white column

**Where:** `app/guest-feedback/[formId]/page.tsx`

After submit, `max-w-lg` was on the **page** wrapper (`bg-slate-50`). The root body is `#060818`, so the thank-you sat in a skinny white strip.

**How:** Full-width `w-full bg-slate-50` on loading / error / thank-you. Constrain only the card (`max-w-xl`). Same for error and loading.

---

## 2026-09-02 — Event create 500 when anonymous feedback is on

**Where:** `app/api/events/create/route.ts`

`feedbackAnonymousEnabled` was posted as a form hint and then inserted into `events`. That column does not exist → PostgREST `PGRST204` / HTTP 500.

**How:** Strip `feedbackAnonymousEnabled`, `feedbackEnabled`, `feedbackFormTemplate`, `feedbackCustomQuestions` before `events.insert`. Keep them on the original body for `feedback_forms`. Map template `category` `system` → form `custom`. Full note: `docs/EVENT_CREATE_ANONYMOUS_HINT_FIX.md`.

---

## 2026-09-02 — Feedback / attendance / template behaviour

Shipped to Sim Bleepy (`16a5fcf2`, build fix `68b94291`). SQL applied on that environment.

- Feedback email after event end, not on QR scan.
- Certificate CTAs only if `auto_generate_certificate && certificate_template_id`.
- Template `anonymous_enabled`; no login; do not store `user_id` / `booking_id`.
- Multiple choice: `allowMultiple`, `allowOther`, Other text.

**How:** Follow `docs/FEEDBACK_ATTENDANCE_SAAS_HANDOFF.md` (SQL, helpers, scan/cron/job, GET/POST, editors, tenant extras).

Also: every full event-form `setFormData({...})` must include `feedbackAnonymousEnabled` or `next build` fails.

---

## Porting order for the SaaS repo

1. SQL + helpers + scan/cron/job/email + form APIs + editors (handoff).
2. Strip create-event hints (create-500 note).
3. Guest thank-you full-width background.
4. Advanced-report button wrap + response stat card shell.
5. QR fullscreen portal + Escape/`fullscreenchange` sync.
6. QR empty-state hint follows walk-in / booking flags.
7. Tenant: `organisation_id`, tenant origin on invite URLs, admin client or tenant-safe RLS for anonymous insert.
