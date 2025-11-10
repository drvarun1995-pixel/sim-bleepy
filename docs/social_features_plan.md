# Social Features & Event Safeguards Specification

> **⚠️ STATUS UPDATE (12 November 2025):** Social features (Phase 2: Friends & Mentors Network) have been temporarily disabled in the frontend due to information governance concerns. All database structures and backend APIs remain intact. Features can be re-enabled once clearance is obtained. See implementation status below.

## 1. Purpose & Scope
This document defines the functional and technical requirements for the next wave of community features within the Bleepy Medical Education Platform. It covers:
- Public/private learner profiles
- Avatar assignment and management
- Peer-to-peer messaging with role-based guardrails
- Friends & mentors network, including real-time chat
- Commenting on events and placement pages with moderation and mentions
- Safeguards that protect booked events from destructive edits

The goal is to provide a cohesive plan the team can use for design, implementation, QA, and future iterations.

---

## 2. User Roles & Definitions
| Role | Capabilities |
| --- | --- |
| `admin` | Full read/write access to all profiles, messages, relationships, comments, and moderation tools. |
| `meded_team` | Same as admin for social features, except no access to platform-level configuration. |
| `ctf` | Treated as staff: can view all profiles (even private), send messages to anyone, moderate comments. |
| `educator` | Can opt-in to public profile, manage own avatar, send/receive messages based on privacy rules, manage friends/mentors, post comments. |
| `student` | Same as educator. |
| (future) `guest` | Read-only access to public profiles and comments (if required). |

---

## 3. Feature 1 — Profiles (Public vs Private)

### 3.1 Functional Requirements
1. Every authenticated user has a profile page with core fields (name, headline, bio, specialty, current placement, skills, achievements).
2. Users can toggle their profile visibility:
   - **Public**: Discoverable via search, messages allowed (with user’s messaging preferences), comments show clickable name.
   - **Private**: Only admins/meded/ctf and direct connections (friends/mentors) can view. Name rendered as plain text in comments; profile links disabled for non-authorized viewers.
3. Users can control the fields shown on their public profile (e.g., hide email, show only first name).
4. Privacy toggle should be surfaced in profile settings with clear explanation of impacts.
5. Activity log entry whenever a user changes visibility (for potential audit trail).

### 3.2 Data Model Changes
```sql
-- users table (or user_profiles if separate)
ALTER TABLE user_profiles
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN public_display_name TEXT,
  ADD COLUMN pronouns TEXT,
  ADD COLUMN location TEXT,
  ADD COLUMN biography TEXT,
  ADD COLUMN specialties TEXT[],
  ADD COLUMN allow_messages BOOLEAN NOT NULL DEFAULT TRUE;

CREATE UNIQUE INDEX idx_user_profiles_public_name ON user_profiles(public_display_name) WHERE is_public = TRUE;
```

### 3.3 API Surface
- `GET /api/profiles/:username?viewerRole=` → returns redactable profile payload based on viewer permissions.
- `PATCH /api/profiles/:id` → updates profile fields and visibility. Requires authenticated user or staff role.
- `GET /api/profiles?query=` → search listing only public profiles unless staff token.

### 3.4 UI / UX
- Profile settings page with live preview and privacy toggle.
- Public profile route: `app/profile/[username]/page.tsx`.
- Private profile redirect: show friendly message and contact admin link.

### 3.5 Access Control Logic
```
canViewProfile(viewer, owner):
  if viewer.role in [admin, meded_team, ctf]: return true
  if owner.is_public: return true
  if viewer.id == owner.id: return true
  if viewer.id in owner.friend_ids ∪ owner.mentor_ids: return true
  return false
```

---

## 4. Feature 2 — Avatar Assignment

### 4.1 Functional Requirements
1. Avatar library of ~12 curated illustrations (accessible and inclusive). Store metadata in Supabase storage or static assets.
2. When a user lacks an uploaded avatar, assign a random default from the library at account creation or next login.
3. Users can pick another avatar from the library or upload their own image (subject to size/type validation).
4. Avatar selection UI integrated into profile settings; show preview and accessibility alt text.
5. Provide deterministic assignment based on user-id hash if we want consistent avatars before database write (optional).

### 4.2 Data Model
```sql
ALTER TABLE user_profiles
  ADD COLUMN avatar_type TEXT DEFAULT 'library', -- 'library' | 'upload'
  ADD COLUMN avatar_asset TEXT; -- path or URL
```

### 4.3 API
- `POST /api/profile/avatar` — handles upload or library selection, performs validation, deletes old uploaded asset.

### 4.4 Implementation Notes
- Use Supabase Storage bucket `avatars/` for uploads.
- For library avatars, store relative paths inside `public/avatars/*.svg` and reference in DB.
- Ensure caching headers for static delivery but allow invalidation on change.
- Provide fallback to generated initials if assets fail to load.

---

## 5. Feature 3 — Messaging Center

### 5.1 Functional Requirements
1. Dedicated “Messages” area (`/messages`) with inbox list + conversation pane (responsive).
2. Role-based messaging rules:
   - Staff (`admin`, `meded_team`, `ctf`): can message anyone.
   - Students/Educators: can message users who are public **and** allow messages, or friends/mentors even if private.
   - If either participant blocks messages or sets profile private (no direct connection), conversation cannot be initiated but existing threads remain visible as read-only.
3. Support read receipts, typing indicators (optional stretch), and last-seen.
4. Notification badge (header nav + mobile).
5. Rate limiting to prevent spam.

### 5.2 Data Model
```sql
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_group BOOLEAN DEFAULT FALSE,
  topic TEXT,
  UNIQUE (is_group, topic) WHERE is_group = TRUE -- optional for future channels
);

CREATE TABLE message_thread_participants (
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner','member','mentor','friend')),
  last_read_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY(thread_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT,
  attachments JSONB, -- store file metadata paths
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_messages_thread_created ON messages(thread_id, created_at);
```

### 5.3 APIs
- `POST /api/messages/threads` — initiate conversation; validates privacy rules.
- `GET /api/messages/threads` — list threads for current user with unread counts.
- `GET /api/messages/threads/:id` — fetch paginated messages.
- `POST /api/messages/threads/:id` — send message (text + attachments).
- `PATCH /api/messages/:id` — edit/delete (soft delete to maintain context).

### 5.4 Realtime Transport
- Use Supabase Realtime or Pusher (decide based on existing stack). Needs:
  - Channel per thread (e.g., `messages:thread_id`).
  - Auth gating on join (check membership).
  - Broadcast new messages, read receipts, typing events.

### 5.5 UI
- Inbox list: name, last message preview, timestamp, unread indicator.
- Conversation: message bubbles, avatar, sender name. Provide emoji reactions (future).
- Mobile: top-level list, sliding conversation sheet.

### 5.6 Security & Compliance
- Encrypt attachments in transit (HTTPS) and at rest (Supabase storage).
- Add “Report conversation” button for moderation workflow (future sprint).

---

## 6. Feature 4 — Friends & Mentors Network

### 6.1 Functional Requirements
1. Users can send connection requests as either “Friend” or “Mentor”.
2. Pending requests require acceptance (two-way handshake). Record initiator role.
3. Separate pages `/connections/friends` and `/connections/mentors` listing connections with quick actions (message, remove, view profile).
4. Connection roles feed into messaging access control (private profiles allow messages from accepted connections).
5. Provide search/autocomplete to find users based on name, specialty, or placement.
6. Option to annotate mentor relationship (e.g., mentor label or notes).

### 6.2 Data Model
```sql
CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_type TEXT CHECK (connection_type IN ('friend','mentor')),
  status TEXT CHECK (status IN ('pending','accepted','blocked')) DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX idx_user_connections_pair_type ON user_connections(requester_id, addressee_id, connection_type);
```

### 6.3 APIs
- `POST /api/network/request` — create friend/mentor request.
- `POST /api/network/respond` — accept/decline.
- `DELETE /api/network/:id` — remove connection.
- `GET /api/network?type=friends|mentors` — list accepted connections with profile summary.

### 6.4 UI
- Tabs for pending, friends, mentors.
- CTA on profile pages: “Add Friend” / “Request Mentor”.
- Use badges to signal “Mentor” status beside name in comments/messages.

### 6.5 Realtime Considerations
- Push notifications (toast + email) when requests arrive or are accepted.
- Optionally integrate with messaging to auto-create thread upon acceptance.

---

## 7. Feature 5 — Comments on Events & Placements

### 7.1 Functional Requirements
1. Comment threads on `event` and `placement` pages.
2. Users can post text, attach up to 3 images, and @mention other users (public profiles or direct connections).
3. Display comment author avatar + display name. If public profile and viewer allowed, name is a link to profile.
4. Admin/meded/ctf can delete any comment. Comment author can delete their own.
5. Comments should support soft deletion (show “This comment was removed” placeholder for context).
6. Rate limit to prevent spam. Optionally require membership to event (for event-specific comment).
7. Provide notifications to mentioned users and page owners.

### 7.2 Data Model
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT CHECK (entity_type IN ('event','placement')),
  entity_id UUID NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  attachments JSONB,
  mentions UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id, created_at);
```

### 7.3 APIs
- `GET /api/comments?entityType=event&entityId=` — paginated fetch.
- `POST /api/comments` — create comment (validates mentions + privacy).
- `PATCH /api/comments/:id` — edit by author (within time window) or staff.
- `DELETE /api/comments/:id` — soft delete; staff can optionally purge.

### 7.4 Mention Logic
1. Autocomplete triggers on “@”.
2. Suggest algorithm:
   - Public profiles (limit by search query).
   - Direct friends/mentors (even if private).
   - Staff (always available).
3. Validate on submit to ensure mention list matches permission rules.
4. On render, convert mention tokens to inline tags with clickable links if allowed.

### 7.5 Moderation Tools
- Moderation dashboard with filters by entity, author, reported flag (future).
- Flagging mechanism for community members to report a comment (future extension).

---

## 8. Feature 6 — Safeguards for Booked Events

### 8.1 Goals
Prevent accidental data loss when events already have bookings, attendance, or QR scans. Guarantee integrity of past sessions while still allowing legitimate edits through a controlled workflow.

### 8.2 Recommended Approach
1. **Event State Machine**
   - `draft` → `published` → `archived`
   - Only `draft` events allow major edits (date/time, location, capacity, linked placement).
   - `published` events with bookings:
     - Allow only non-destructive edits (e.g., description, resources).
     - Changing date/time requires “create revision” flow: duplicate event with new schedule, notify attendees, keep old event archived but locked.
   - `archived` used after event has concluded or cancellations processed. No edits allowed except by staff.

2. **Lock Flags**
```sql
ALTER TABLE events
  ADD COLUMN is_locked BOOLEAN GENERATED ALWAYS AS (
    (bookings_count > 0) OR (qr_scan_count > 0)
  ) STORED;
```
   - Database-level check to block destructive updates via triggers.

3. **Protected Mutations**
   - Custom API layer that validates before applying changes:
     - If `is_locked`, reject updates to `start_time`, `end_time`, `location`, `capacity`, `certificate_settings`, `feedback_settings`.
     - Provide helpful error message instructing staff to clone event or contact admin.

4. **Publish/Unpublish Workflow**
   - Publish button transitions from `draft` to `published`. Only on `draft` with all required fields validated.
   - Unpublish allowed only if no bookings/QR scans. Instead, use “Cancel Event” action that contacts booked users and marks event `cancelled` but retains data.

5. **Audit Trail**
   - Track change history with `event_audits` table storing actor, timestamp, field changes.
   - Display summary in admin UI for traceability (GDPR consideration).

6. **Admin Overrides**
   - Provide override path (with reason field) for `admin` role when changes are mandatory. Log overrides explicitly.

### 8.3 UI Recommendations
- Add badge “Locked” on event edit screen when bookings exist.
- Disable form fields with tooltip explaining lock.
- Provide CTA: “Duplicate event with new date” to speed up rescheduling.

---

## 9. Cross-Cutting Concerns

### 9.1 Notifications
- Add dedicated notifications and messages icons to `BleepyNav`, immediately to the right of `Dashboard` link on desktop and inside the collapsed mobile tray. Badges use purple (`#8F6AF2`) for unread messages, pink (`#F25D76`) for system notifications, white numerals, and subtle drop shadow as per reference.
- Clicking the envelope icon reveals the **Messages dropdown**:
  - Width roughly 280 px with soft corner radius, light surface (`#FAF3EE`) matching current nav background, separated list rows.
  - Header row: “Messages” title (left), `Clear All` link (right, inline, underlined). Bottom link `View All` navigates to `/messages`.
  - Each row shows avatar (circle 36 px), sender name (bold), preview text (two-line ellipsis), and relative timestamp (e.g., “1 day ago”).
  - Dropdown anchored to icon with subtle elevation (`shadow-lg`) and uses `z-index` higher than nav.
- Clicking the bell icon reveals the **Notifications dropdown** with identical layout and CTA but different icon glyphs per notification type (info, user, heart, comment etc.) using colored circular backgrounds from the reference (blue, gold, rose).
- Provide keyboard support (Enter to open, Esc to close, arrow keys navigate).
- New notification types:
  - Message received
  - Connection request / acceptance
  - Comment reply or mention
  - Event changes impacting attendees
  - Admin broadcasts (distinct from Announcements page)
- Integrate with reminder email pipeline (optional toggle).

### 9.2 Search & Discovery
- Index public profiles and placements for quick mention search (Supabase full-text search).
- Respect privacy at the query level (SQL filter `WHERE is_public = TRUE` unless viewer has rights).

### 9.3 Accessibility
- Ensure avatars have alt text.
- Messaging UI keyboard navigable.
- Comment attachments provide captions.
- Modal overlays trap focus and include close buttons (handled in custom lightbox).

### 9.4 Auditing & Logging
- Record CRUD actions for profiles, messages, comments, and event safeguards in `audit_logs` with actor, action, entity, payload snapshot.
- Logs help with incident response and compliance.

### 9.5 Performance
- Use pagination/infinite scroll for messages and comments.
- Add background jobs to clean up soft-deleted data (after retention period).
- Cache frequently accessed public profiles using ISR or edge caching.

### 9.6 Security
- Sanitize rich-text inputs (bio, comments) with existing HTML sanitizer.
- Validate file uploads (MIME sniffing, size limits).
- CSRF protection remains via existing NextAuth JWT + anti-CSRF measures.
- Rate-limit messaging and comments using Redis or Supabase edge functions.

---

## 10. Implementation Roadmap (Suggested)
1. **Phase 1** — Profile privacy + avatar library (backend + UI).
2. **Phase 2** — Friend/Mentor relationships & messaging permissions foundation.
3. **Phase 3** — Messaging center with realtime infrastructure.
4. **Phase 4** — Comments with mentions + moderation tools.
5. **Phase 5** — Event safeguard workflow (state machine, locks, admin override).
6. **Phase 6** — Polish: notifications, analytics, audit dashboards.

Each phase should include unit tests, integration tests (Supabase), and manual QA scripts. Coordinate with design for user flows and component prototypes before engineering sprints.

---

## 11. Open Questions
1. Do we need group chats or broadcast channels (e.g., cohort announcements) in v1?
2. Should mentor requests require approval from admins?
3. Will comments need threading (replies) or reactions?
4. Messaging retention policy (GDPR) — auto-delete after 1 year similar to Hume transcripts?
5. Should we integrate push notifications (OneSignal/Web Push) for realtime alerts, or rely on email?

Document owner: _GPT-5 Codex (assistant)_ • Draft date: 2025-11-08


