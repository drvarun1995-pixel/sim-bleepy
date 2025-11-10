# Changelog – 10 November 2024

> Covers work completed on 9–10 November 2024 across Phase 1 polish and Phase 2 (Connections) delivery.

## Highlights
- Delivered the Connections beta experience with standalone `/connections`, `/friends`, and `/mentors` hubs.
- Added inline profile visibility reminders and toggles across social pages.
- Hardened moderation/reporting flows and tightened Supabase RLS.

## 10 November 2024
### Features
- Introduced `ProfileVisibilityCallout` so users can make their profile public directly from the social pages.
- Broke out dedicated friends and mentors dashboards at `/friends` and `/mentors`, each with tailored hero copy and metrics.
- Set suggestions as the default view inside `ConnectionsDashboard` and centred the suggestion cards/action buttons.
- Added “Friends (Beta)” and “Mentors (Beta)” links to the dashboard sidebar Social section.

### Improvements
- Auto-preselect the “Connections Report” category on the contact form when deep-linking from social feedback buttons.
- Refined responsive styling for connection tabs, buttons, and the shared Switch component (smaller footprint on mobile).
- Reordered tab navigation to prioritise Suggestions and clarified placeholder metrics on friends/mentors cards.

### Fixes
- Resolved `callback is not a function` during pause-toggle transitions by replacing `useTransition` with local loading state.
- Centred suggestion card content and ensured report buttons, modals, and hover states use the new design system.

## 9 November 2024
### Features
- Completed connection report workflow: mirrored reports into `connection_reports` + `contact_messages`, and sent admin + reporter emails.
- Added `/api/network/search` endpoint, powering the connections quick search.
- Implemented connection report outlook-friendly email templates and acknowledgement flows.

### Improvements
- Secured `connection_events` with RLS (`20241112_enable_rls_connection_events.sql`) and added staff/service-role policies.
- Updated docs (`docs/phase1-phase2-guidance.md`) to reflect completed Phase 2 scope and next steps.
- Added Friends/Mentors metrics tiles, defaulted Plus/More layout, and polished the Connections dashboard UX (pause toggle, suggestion cards).

### Fixes
- Addressed multiple UI regressions reported during Phase 2 QA (hover states, button colours, mobile spacing, pending badge text).
- Ensured contact suggestions only surface public + message-enabled profiles and removed duplicate network nav entries.

---
Need something not captured here? Ping the engineering channel and we’ll append it.
