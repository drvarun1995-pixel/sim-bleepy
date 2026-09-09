# Walk-in guest claim — Sim Bleepy → Bleepy App

Port this into the multi-tenant Bleepy app (`bleepy-app` / tenant hostnames). Do not deploy this Vercel project onto HQ.

Sim Bleepy production: `sim.bleepy.co.uk`. Dated running list: `docs/BLEEPY_APP_FEEDBACK_CHANGELOG.md`.

Guest QR check-in must create a **shadow** `users` row so attendance can store `user_id`. That is **not** a website registration. If the same person later signs up or uses Forgot password, **keep the same `users.id`** and clear the walk-in tag so they appear as a normal user everywhere (verified or not).

---

## Two records, two meanings

| Concept | Column | Meaning |
|---|---|---|
| **User identity** | `users.account_origin` | `walk_in_guest` = still a door shadow. `null` = registered on the website (signup, claimed walk-in, admin-created). |
| **How they attended that event** | `event_bookings.registration_source` | Historical: `self` / `walk_in_scan` / `walk_in_guest` / `admin`. **Never rewrite this when they claim.** |

Do not treat `registration_source = walk_in_guest` as “this person is not a user”. They walked in that day. After they register, they are a user.

---

## What a door shadow looks like

Created by `findOrCreateWalkInGuestUser()` (`lib/walk-in.ts`):

- `account_origin = walk_in_guest`
- `email_verified = false`
- random password, `must_change_password = true`
- `profile_completed = false`
- no verification email
- they may still get the event-end **feedback** invite (booking source, not user identity)

**Do not** Approve a shadow. **Do not** delete the row without a migration (attendance / feedback / certificates point at it). **Do not** invent a second `users` row for the same email.

---

## When they become a real user (claim)

Keep **the same `users.id`**. Set:

- `account_origin = null`
- `must_change_password = false` (unless staff just created a temp password)
- password / name / consent from the claim path
- `email_verified`:
  - Sign up → `false`, then send the normal verification email
  - Forgot password used → `true` (they proved inbox control)
  - Admin add over a shadow → keep existing verified flag; temp password + `must_change_password = true`

Helpers (copy these, do not re-derive ad hoc):

- `lib/walk-in-shared.ts` — `WALK_IN_ACCOUNT_ORIGIN`, `isWalkInGuestUser`, `isRegisteredPlatformUser`, `walkInGuestLooksClaimed`, `canConvertWalkInGuestOnRegister`, `claimedWalkInAccountFields`
- `lib/walk-in.ts` — `claimWalkInGuestUser()`

### Claim paths that must exist

1. **Sign up** (`app/api/auth/register/route.ts`)  
   If the email is a still-unclaimed shadow (`canConvertWalkInGuestOnRegister`), convert the row. Do **not** return 409 “An account with this email already exists”.  
   If they already claimed (verified or chose a password) and are still tagged, return 409 — they should sign in or reset, not overwrite the password.

2. **Forgot password used** (`app/api/auth/reset-password/route.ts`)  
   Setting a new password **is** registration. Always set `account_origin = null` on a successful reset.

3. **Change password while signed in** (`app/api/user/change-password/route.ts`)  
   Same: `account_origin = null`.

4. **Staff Add user** (`app/api/admin/users/add/route.ts`)  
   If the email is a shadow, convert it (temp password, `admin_created`). Do not 409.

5. **Backfill** (`scripts/claim-registered-walk-in-guests.ts`)  
   Anyone still tagged `walk_in_guest` who `walkInGuestLooksClaimed` (`email_verified` **or** `must_change_password === false`). Dry-run default; `APPLY=1` writes.

---

## Where shadows stay hidden

Hide `account_origin = walk_in_guest` from **platform user** lists. Show registered users even if `email_verified` is still false.

| Surface | File | Rule |
|---|---|---|
| User Management + Analytics | `app/api/admin/users/route.ts` | Hide unless `includeWalkIn=1`. Analytics (`/analytics`) uses this API. |
| Student Cohorts | `app/api/cohorts/route.ts` | Skip shadows. Claimed FY1s appear in FY. |
| Homepage counts | `app/api/homepage-stats/route.ts` | `totalUsers` and student/FY buckets skip shadows. |
| Login CSV | `app/api/admin/export-login-data/route.ts` | Skip shadows. |
| Verification reminders | `lib/email-verification-reminders.ts` | Skip shadows (they never signed up). After claim-via-signup they are no longer shadows, so they **do** get reminders. |
| Approve | `app/api/admin/users/approve/route.ts` | Reject shadows. After claim, Approve is allowed like any pending user. |
| Emails / newsletter | `app/api/admin/emails/send/route.ts` + `shouldReceiveStudentTargeting` | Skip shadows. |
| Push cohorts | `lib/push/cohortFiltering.ts` | Skip shadows. |
| Year progression leftover / search / apply | `app/api/admin/year-progression/*`, `lib/year-progression-apply.ts` | Skip shadows. |
| Network search | `app/api/network/search/route.ts` | Skip shadows. |

Attendance analytics (`by_source.walk_in_guest`) stay on **booking** source. That is door audit, not user identity.

---

## Certificates

`isWalkInGuestAccount()` in `lib/certificate-guest-token.ts`:

- Guest email link **only** while `account_origin === walk_in_guest`.
- After claim (`account_origin` is `null`), send `/mycertificates` even if that event’s booking is still `registration_source = walk_in_guest`.
- Old guest tokens already in inboxes keep working.

---

## What not to do

- Do not create a second user for the same email.
- Do not delete the shadow to “let them sign up”.
- Do not Approve a shadow to “make them a user”.
- Do not rewrite `event_bookings.registration_source` on claim.
- Do not send “confirm your Bleepy email” to unclaimed shadows.
- Do not treat “Wilson” the user as the Simulation Team organiser. Event-people alias: **Wilson = Simulation Team** (organiser only). A learner named Wilson is a normal user row.

---

## Sim Bleepy backfill (2026-09-09)

Four live rows had claimed via Forgot password but were still tagged `walk_in_guest` (hidden from User Management / Analytics / Cohorts):

- Nawal Jaskani
- Ope Siwoku
- Manas Kubal
- Wilson (`wi***@nhs.net` — a user, not an organiser)

Thirteen other walk-in rows were still true shadows (including Sarah Fatima) and were left tagged.

After claim they appear as registered users, verified or not, on Analytics and the other surfaces above.

---

## Files to copy

| File | Role |
|---|---|
| `lib/walk-in-shared.ts` | Origin helpers + claim detection |
| `lib/walk-in.ts` | Create shadow + `claimWalkInGuestUser` |
| `lib/certificate-guest-token.ts` | Guest cert link uses **user** origin |
| `lib/learner-targeting.ts` | Emails skip shadows |
| `app/api/auth/register/route.ts` | Convert shadow instead of 409 |
| `app/api/auth/reset-password/route.ts` | Clear origin |
| `app/api/user/change-password/route.ts` | Clear origin |
| `app/api/admin/users/add/route.ts` | Convert shadow instead of 409 |
| `app/api/admin/users/route.ts` | Hide shadows by default |
| `app/api/admin/users/approve/route.ts` | Reject shadows |
| `app/api/cohorts/route.ts` | Skip shadows |
| `app/api/homepage-stats/route.ts` | Counts skip shadows |
| `app/api/admin/export-login-data/route.ts` | Export skips shadows |
| `app/api/admin/emails/send/route.ts` | Recipients skip shadows |
| `lib/email-verification-reminders.ts` | Skip shadows |
| `lib/push/cohortFiltering.ts` | Skip shadows |
| `app/api/admin/year-progression/*` + `lib/year-progression-apply.ts` | Skip shadows |
| `app/api/network/search/route.ts` | Skip shadows |
| `scripts/claim-registered-walk-in-guests.ts` | One-off / env backfill |
| `lib/walk-in-shared.test.ts` | Claim rules |

SaaS extras: add `organisation_id` on `users` / bookings if you isolate tenants. The claim rule is per email **inside a tenant**.
