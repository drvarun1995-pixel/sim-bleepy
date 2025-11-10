# Bleepy Social Features Guidance

> **⚠️ STATUS UPDATE (12 November 2025):** Phase 2 (Connections - Friends & Mentors) has been temporarily disabled in the frontend due to information governance concerns. All database structures, migrations, and backend APIs remain intact. Phase 1 (Profiles & Avatars) remains active. Features can be re-enabled once clearance is obtained.

This document captures the key implementation details for Phase 1 (Profiles & Avatars) and Phase 2 (Connections) of the Bleepy social features rollout. Use it as a reference point if you ever need to review, debug, or roll back specific parts of the work.

## Phase 1 – Profiles & Avatars

- **About / Contact page refresh**
  - Updated `app/about/page.tsx` with new stats and single-founder hero copy.
  - Simplified `app/contact/page.tsx` hero/stats sections to match the latest messaging.

- **Calendar improvements**
  - `components/Calendar.tsx` now scales the desktop view (87%) to show the `+X more` indicator fully.
  - Daily tiles cap at three events plus a rollover link; the modal lists all remaining events.
  - Event tiles enforce white text with a dark fallback background color.

- **Public profile experience**
  - `app/profile/[slug]/page.tsx` renders inside the dashboard layout when authenticated and hides owner-only CTAs (e.g., “Send message”).
  - Empty profile sections are filtered out and a visibility reminder only shows to the profile owner.
  - Unauthenticated visitors are redirected to sign in before viewing a profile.

- **Slug & avatar handling**
  - `lib/profiles.ts` generates permanent public slugs using `firstName-randomNumber` and exposes helper utilities for profile payloads.
  - `components/profile/ProfileForm.tsx` removes slug editing, defers avatar changes until “Save changes,” and adds pending avatar warnings.
  - `app/api/user/profile-picture/route.ts` and `[userId]/route.ts` support uploads, deletions, and RLS-safe delivery using Supabase storage.

- **MedEd team adjustments**
  - Added profile/onboarding role handling for `meded_team`, skipped professional detail requirements, and triggered admin notifications via `lib/email.ts`.
  - `lib/profiles.ts` avoids showing the MedEd badge unless the actual platform role is also `meded_team`.

- **Homepage and cron fixes**
  - `app/api/homepage-stats/route.ts` now queries Supabase for enrollment counts and uses a 30-day “active students” window.
  - Cron routes check both `CRON_SECRET` and `INTERNAL_CRON_SECRET` headers to restore automation.

- **Email & compliance updates**
  - Certificate, feedback, and MedEd notification templates were rebuilt with Outlook-friendly HTML.
  - Hume EVI chat history retention disabled and transcripts saved explicitly to Supabase.

## Phase 2 – Connections (Friends & Mentors)

- **Database & policies**
  - Migration `supabase/migrations/20241109_user_connections.sql` creates the `user_connections` table with RLS and `pause_connection_requests` preference.
  - Migration `20241110_update_user_connections_status_and_thumbnail.sql` adds `declined` status handling, unique pair index, and `users.avatar_thumbnail`.
  - Migration `20241111_connection_reports.sql` provisions the `connection_reports` table plus moderation policies for report flows.
  - Migration `20241111_user_notifications_and_connection_events.sql` introduces `user_notifications` + `connection_events` for analytics/audit trails.
  - Migration `20241112_enable_rls_connection_events.sql` enables RLS on `connection_events` with staff-read/service-role policies.

- **API surface**
  - `app/api/network/request/route.ts` sends friend/mentor requests, respects pauses, revives declined invites from the recipient, and avoids duplicate emails.
  - `app/api/network/respond/route.ts` accepts, declines (records status instead of deleting), snoozes, blocks, or removes connections.
  - `app/api/network/[id]/route.ts` removes existing connections.
  - `app/api/network/route.ts` returns filtered lists (pending, friends, mentors, blocked), mutual counts, analytics metrics, suggestion candidates filtered for public/message-enabled users, and the viewer’s pause/public flags for UI callouts.
  - `app/api/network/search/route.ts` backs the dashboard quick search with public, message-enabled suggestions and mutual-count scoring.
  - `app/api/profiles/[slug]/route.ts` exposes relationship context (including declined state) for profile pages.
  - `app/api/network/report/route.ts` now stores reports in `connection_reports`, mirrors them in `contact_messages`, and emails admins plus reporter acknowledgements.

- **UI/UX**
  - `components/network/ConnectionsDashboard.tsx` powers the `/connections`/`/friends`/`/mentors` pages with tabs (Suggestions default), metrics tiles, pause toggle, profile visibility banner, and centred suggestion cards.
  - Pending requests split into “Pending friend requests” vs “Sent requests,” each with pagination (`Show 10 more`).
  - `components/profile/ConnectionActions.tsx` renders context-aware CTAs (add, accept, cancel, unblock, etc.) and shows a declined notice instead of re-sending.
  - `components/network/ProfileVisibilityCallout.tsx` surfaces the public-profile requirement and inline toggle across connections, friends, and mentors pages.
  - Sidebar reorganized (`components/dashboard/DashboardSidebar.tsx`) with a Social (Beta) section linking to Connections, Friends (Beta), and Mentors (Beta).
  - Standalone routes `/friends` and `/mentors` provide dedicated dashboards with tailored hero copy and metrics.

- **Profile integration**
  - `lib/connections.ts` centralizes connection types, helpers, and profile summaries (including thumbnails).
  - `lib/profiles.ts` and `app/api/user/profile/route.ts` return `avatar_thumbnail` and support inline public-profile toggles via the callout component.

- **Emails & notifications**
  - `lib/email.ts` adds revamped connection request / acceptance templates with branded headers and a “Manage connections” CTA.
  - Reporter acknowledgements and staff alerts are sent when a connection report is filed, matching the branded header system.
  - Notifications are triggered when requests are created or accepted; staff can extend this foundation for analytics and moderation alerts.

- **Moderation & safety groundwork**
  - Declined requests are preserved to prevent re-spamming recipients while allowing them to re-initiate.
  - Block and snooze states persist in `user_connections`, ready for future rate limiting or reporting flows.
  - Connection reports are mirrored into `contact_messages` with a dedicated category for triage.

### Phase 2 Status

- ✅ Discovery search, mutual connection surfacing, reporting, and RLS hardening shipped.
- ✅ Public profile tooling, Friends/Mentors dashboards, and contact form integration live.
- ⏸️ **TEMPORARILY DISABLED (12 Nov 2025):** Frontend UI disabled due to information governance concerns. Backend remains intact.
- ▶️ Next up: Phase 3 (messaging, richer analytics, and in-app notifications dashboard enhancements) - pending governance clearance.

Keep this guide updated as we move into subsequent phases (messaging, comments, safeguards, and polish). Add new sections when major features land so we always have a high-level map of the system.
