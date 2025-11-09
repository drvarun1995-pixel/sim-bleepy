# Bleepy Social Features Guidance

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

- **API surface**
  - `app/api/network/request/route.ts` sends friend/mentor requests, respects pauses, revives declined invites from the recipient, and avoids duplicate emails.
  - `app/api/network/respond/route.ts` accepts, declines (records status instead of deleting), snoozes, blocks, or removes connections.
  - `app/api/network/[id]/route.ts` removes existing connections.
  - `app/api/network/route.ts` returns filtered lists (pending, friends, mentors, blocked), mutual counts, analytics metrics, and suggestion candidates filtered for public, message-enabled users.
  - `app/api/profiles/[slug]/route.ts` exposes relationship context (including declined state) for profile pages.

- **UI/UX**
  - `components/network/ConnectionsDashboard.tsx` powers the `/connections` page with tabs, metrics tiles, pause toggle, and suggestion cards (3-up layout).
  - Pending requests split into “Pending friend requests” vs “Sent requests,” each with pagination (`Show 10 more`).
  - `components/profile/ConnectionActions.tsx` renders context-aware CTAs (add, accept, cancel, unblock, etc.) and shows a declined notice instead of re-sending.
  - Sidebar reorganized (`components/dashboard/DashboardSidebar.tsx`) with a Social section hosting the Connections link.

- **Profile integration**
  - `lib/connections.ts` centralizes connection types, helpers, and profile summaries (including thumbnails).
  - `lib/profiles.ts` and `app/api/user/profile/route.ts` now return `avatar_thumbnail`, enabling lightweight images in suggestion cards.

- **Emails & notifications**
  - `lib/email.ts` adds revamped connection request / acceptance templates with branded headers and a “Manage connections” CTA.
  - Notifications are triggered when requests are created or accepted; staff can extend this foundation for analytics and moderation alerts.

- **Moderation & safety groundwork**
  - Declined requests are preserved to prevent re-spamming recipients while allowing them to re-initiate.
  - Block and snooze states persist in `user_connections`, ready for future rate limiting or reporting flows.

### Remaining Scope for Phase 2

The following items are next on the roadmap before we consider Phase 2 complete:

1. **Discovery & Search** – Provide a dedicated search/autocomplete service for finding users by name, specialty, or university from the connections dashboard.
2. **Mutual Connections Surfacing** – The dashboard shows shared contacts for pending/accepted connections and suggestions.
3. **Safety & Moderation** – UI now exposes block and report actions, connection requests are rate-limited, and reports feed the new `connection_reports` table.
4. **Notifications & Analytics** – Persist in-app notifications for request/accept events and capture metrics suitable for an admin dashboard snapshot.

Keep this guide updated as we move into subsequent phases (messaging, comments, safeguards, and polish). Add new sections when major features land so we always have a high-level map of the system.
