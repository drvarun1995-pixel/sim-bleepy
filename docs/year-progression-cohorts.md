# Academic cohorts and year progression — status (13 Aug 2026)

Internal handover for Student Cohorts, Year Progression, targeting, and related emails. Production: https://sim.bleepy.co.uk

**Do not send automatic progression or graduate emails to the 25-26 cohort.** That rule is coded (`suppress_emails` / `isExistingNoEmailCohort`).

---

## Locked product rules

- **ARU:** years 1–5. **UCL:** years 5–6 only. **FY:** FY1 → FY2.
- **Exit paths:** graduated, move to FY1, or intercalated.
- **Intercalated:** pause targeting, hide from student targeting, keep login.
- **Reminders:** 14 days after a finish date only (no “before” reminders).
- **Existing learners** were placed in cohort **25-26**. That cohort must **not** receive automatic progression emails.
- History is stored in `user_stage_history`.
- Exceptions: skip year or repeat year (manual override).
- Daily cron: `15 3 * * *` → `/api/jobs/year-progression` (in `vercel.json`).
- **25-26 stays `is_current` in the database** until a timeline actually applies and moves people. Admin UI (Overview, Timelines, Emails) **defaults to 26-27** (upcoming).

---

## What has been done

### 1. Data model (Phase 1) — live in Supabase

Migrations:

- `supabase/migrations/20260813_year_progression.sql`
- `supabase/migrations/20260813_graduate_25_26_except_keepers.sql`
- `supabase/migrations/20260813_cohort_closed.sql` (optional / closed-cohort flag)

Cohorts in DB: **25-26** (`is_current`), **26-27**, **27-28** (empty next-year shell from timelines).

Most 25-26 learners were marked **graduated**. Test keeper accounts stay **active**.

### 2. Student Cohorts (`/cohorts`)

- Header: **Viewing cohort** + **Switch cohort**.
- University / year chips scoped to the selected cohort.
- **Other** table after FY, full width; Other chip after FY when that group is non-empty.
- Other is hidden on ARU / UCL / FY Unassigned filters.
- ARU inferred from `@student.aru.ac.uk` where needed.
- Unmatched learners → Other.
- Viewing **25-26** shows graduated learners for that cohort (historical view).
- Test accounts and Shantanu Chopde are hidden via `isExcludedFromLearnerLists`.

Access: **Admin**, **MedEd**, and **CTF**.

### 3. Year Progression (`/year-progression`)

Timelines tab:

- Pick **cohort** and **next cohort**.
- Table: ARU 1–5, UCL 5–6, FY1, FY2 with start / finish dates.
- **Save timelines** is enough. Apply-now was removed; Preview remains.
- A cohort is **closed** when **all** year-group finish dates have passed. Closed cohorts are locked unless **Manual override** + confirm.
- New cohorts inherit the previous timeline **+1 year**.
- 25-26 and 26-27 timelines auto-persist via `ensureDefaultCohortTimelines`.
- Overview labelled / active stats use **upcoming / latest (26-27)**, not the `is_current` row (25-26).
- Timelines dropdown defaults to **26-27**.
- Test accounts are hidden from the leftover-active list.

Access: **Admin** and **MedEd** only (not CTF).

#### ARU 25-26 teaching windows

| Group | Start | Finish |
| --- | --- | --- |
| Year 1 | 24 Nov 2025 | 8 May 2026 |
| Year 2 | 9 Feb 2026 | 20 Mar 2026 |
| Year 3 | 1 Apr 2026 | 31 Jul 2026 (April–July TBC) |
| Year 4 | 1 Sep 2025 | 10 Jul 2026 |
| Year 5 | 15 Sep 2025 | 24 May 2026 |
| FY | 5 Aug → 5 Aug matching the cohort; 26-27 is +1 year | |

### 4. Test keeper accounts

Emails in `TEST_ACCOUNT_EMAILS` (`lib/year-progression.ts`):

| Email | Display | Stage |
| --- | --- | --- |
| `drvarun1995@gmail.com` | Varun Tyagi | ARU Year 5 |
| `varun.tyagi@nhs.net` | VT NHS | FY1 |

Behaviour:

- Live on the **upcoming** cohort (26-27 while 25-26 is current).
- Adding a new cohort **moves them** onto that cohort; profile (year / FY / university / role) is unchanged.
- Auto-progression **keeps their profile** but **still sends test emails** (they bypass 25-26 suppress so we can check templates).
- Hidden from Student Cohorts, Emails send, and Overview leftover lists.

**Shantanu Chopde** is also excluded from those lists (name `shantanu` + `chopde`, or email containing `chopde`). He is registrar, not a test-account auto-mover.

### 5. Emails send (`/emails/send`)

- Cohort dropdown defaults to **26-27**.
- Can switch to 25-26 / 27-28 / All.
- Filters and send API respect cohort.
- Excludes keepers, Shantanu, and non-active learners (`shouldReceiveStudentTargeting`).

Graduate / progression templates exist (`lib/email-templates/graduate-alumni.ts`, `progression-confirm.ts`) plus preference / unsubscribe links. **They must not be bulk-sent to 25-26.**

### 6. Targeting sweep (Phase 4)

Central helpers:

- `isLearnerTargetable` / `isStudentTargetable` — `lib/year-progression.ts`
- `shouldReceiveStudentTargeting`, `matchesAnnouncementAudience` — `lib/learner-targeting.ts`
- PostgREST filter: `academic_status` is null or `active`

Wired into:

- Push (`lib/push/cohortFiltering.ts`)
- Events (`lib/event-filtering.ts`) — graduated users see **universal** events only
- Announcements dashboard
- Week files
- Bookings (no student / FY categories if not targetable)
- Calendar auto-select
- Homepage counts (active-only)
- Profile GET returns `academic_status` and `academic_cohort`
- Admin users API returns those fields

Site-wide announcement `type: 'all'` still shows to graduates.

### 7. Daily job (Phase 3) — coded; goes live with this deploy

- Path: `/api/jobs/year-progression`
- Schedule: daily **03:15 UTC**
- 25-26 finish dates are already past, so the first run may try to progress remaining **active** matching learners. Graduates are skipped. Testers keep year / FY but can receive **test** emails.

### 8. Tests (Phase 6)

`npm test` (vitest) — **20 passing** locally.

- `lib/year-progression.test.ts`
- `lib/learner-targeting.test.ts`

Covers ARU / UCL / FY progression, graduate vs FY1, intercalated skip, targeting exclusions, event filter, announcement matching, cohort parse.

Live cron / API end-to-end still needs a production smoke after deploy.

---

## Access matrix

| Area | Admin | MedEd | CTF |
| --- | --- | --- | --- |
| Student Cohorts | Yes | Yes | Yes |
| Year Progression | Yes | Yes | No |
| User Management | Yes | Yes | No |
| Emails | Yes | Yes | No |

---

## Key files

- `lib/year-progression.ts`, `lib/year-progression-apply.ts`, `lib/year-group-timelines.ts`, `lib/copy-cohort-timelines.ts`
- `lib/learner-targeting.ts`, `lib/event-filtering.ts`, `lib/push/cohortFiltering.ts`
- `app/year-progression/page.tsx`, `app/cohorts/page.tsx`, `app/emails/send/page.tsx`
- APIs under `app/api/admin/year-progression/` and `app/api/jobs/year-progression/route.ts`
- SQL as listed above
- Cron in `vercel.json`

---

## What is pending / not done

1. **Production smoke after deploy** — pages load, cron registers, no 25-26 bulk emails.
2. **Confirm first cron run** (03:15 UTC) — who it would move, and that 25-26 emails stay suppressed.
3. **ARU Year 3 dates** still TBC (April–July placeholder).
4. **Manual exception workflow** (skip / repeat) — override exists; needs a real-user walkthrough.
5. **Intercalated end-to-end** — mark someone intercalated, confirm they keep login, drop from targeting, then return.
6. **UCL 5–6 and FY1→FY2** on a non-25-26 cohort when those finish dates arrive.
7. **27-28** is an empty shell until people are added / progressed.
8. **Email preference / unsubscribe / site-feedback / public share** shipped alongside this work; they are supporting, not the core timeline engine.
9. No full staging E2E of the Vercel cron against production data yet.

---

## What to test after deploy

### Must check tonight / tomorrow

1. Open https://sim.bleepy.co.uk/year-progression — Overview defaults to **26-27**, not 25-26.
2. Open Timelines — dropdown defaults to **26-27**; 25-26 dates match the table above.
3. Open https://sim.bleepy.co.uk/cohorts — switch 25-26 vs 26-27; 25-26 should still show graduates; keepers hidden.
4. Open https://sim.bleepy.co.uk/emails/send — default cohort **26-27**; switching to 25-26 must not be used for a live send.
5. Confirm **no** graduate / progression blast went to 25-26.
6. Log in as `drvarun1995@gmail.com` — still ARU Year 5, on 26-27, site works.
7. Log in as `varun.tyagi@nhs.net` — still FY1, on 26-27.
8. Vercel → Cron Jobs → `year-progression` listed at `15 3 * * *`.

### Next working day

9. Preview a timeline apply (do not apply 25-26 with emails).
10. Save a 26-27 date change and confirm it persists after reload.
11. Send a **tiny** test email to a keeper only (not 25-26).
12. Create / view an event as a graduated 25-26 user — universal events only.
13. Homepage / bookings / calendar as an intercalated or graduated user vs an active 26-27 student.
14. After the first cron: check Vercel logs for `/api/jobs/year-progression` and `user_stage_history`.

### Do not do

- Do not bulk-send graduate or progression emails to 25-26.
- Do not force-push.
- Do not mark 26-27 as `is_current` by hand unless a timeline has actually applied.

---

## Suggested next build (when you are back)

1. Watch the first production cron and confirm counts.
2. Walk through one skip-year and one intercalated case on a throwaway account.
3. Lock ARU Year 3 dates when the school confirms them.
4. When 26-27 teaching actually starts, use Save timelines + let cron apply — then `is_current` can move.
