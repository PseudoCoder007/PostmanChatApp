# Phase 1.5: Connectivity, Engagement, and Security

Release note: this strategy phase was productized as the shipped `v2.3.0` bridge release, with implementation captured in `PHASE_1_5_PLAN_v2_3.md`.

Phase 1.5 is a bridge phase. Phase 1 chat quality-of-life is complete. Phase 2 involves heavier coordination across multiple backend services. This phase fills the gap with features that are moderate-to-low complexity, high user visibility, and address the three most important growth levers for PostmanChat right now: making the app feel more connected, more engaging per session, and more trustworthy.

These features are ordered by strategic priority, not implementation order. Teams can pick any of the first four immediately after Phase 1 ships.

---

## Why Phase 1.5 Exists

Phase 2 features like threaded replies and room moderation are architecturally non-trivial. Phase 1.5 lets the product keep shipping visible improvements while Phase 2 foundations are being designed carefully. Every item here can be completed without introducing breaking schema changes beyond standard Flyway migrations or without touching the core WebSocket event loop.

---

## Build Order

1. Security hardening layer (rate limiting, spam signals, session protection)
2. Voice messages
3. Custom user status and rich presence
4. Link preview cards
5. Message forwarding
6. Global cross-room search
7. User report and flag system
8. Mutual friends and social graph signals
9. Ephemeral messages
10. Activity and engagement signals

---

## 1. Security Hardening Layer

### User Value

Users feel safer knowing the app actively protects their conversations and accounts from abuse, spam, and hijacking. This directly increases trust, which research shows drives 75% of user purchase and engagement decisions in social apps.

### Why It Matters Now

PostmanChat has JWT auth and WebSocket ticket validation in place. What is missing is a second tier of runtime abuse prevention. As the app grows, this gap becomes exploitable fast. Shipping this before growth makes remediation much cheaper.

### Current Related Code Areas

- JWT enforcement in `backend/src/main/java/com/postmanchat/config/SecurityConfig.java`
- WebSocket ticket flow in `backend/src/main/java/com/postmanchat/security/WsTicketService.java`
- Message sending in `backend/src/main/java/com/postmanchat/service/MessageService.java`
- Auth endpoints in `backend/src/main/java/com/postmanchat/web/AuthController.java`

### Expected Touchpoints

**Rate limiting on message send:**
- Cap message sends per user per second/minute at the backend level (e.g., 5 messages per 5 seconds per user per room)
- Return HTTP 429 or STOMP error frame on violation
- Frontend shows a cooldown indicator instead of silently dropping the send

**Spam signal detection:**
- Flag messages that contain repeated identical content from the same user within a short window
- Flag messages containing multiple external URLs from users with no established history
- These are soft flags: do not auto-delete, but route to the report queue (see item 7 below)

**Session audit:**
- Add a `last_active_ip` and `last_active_at` column to user session tracking
- Surface a simple "active sessions" summary in Settings so users can see where they are logged in
- Add a "sign out everywhere" action in `SettingsView.tsx`

**Link safety warning:**
- When a message contains an external URL, show a lightweight interstitial ("This link goes outside PostmanChat. Continue?") on click rather than opening it directly
- This is a frontend-only change in `ChatView.tsx`

### Dependency Notes

- Can be shipped independently of all other Phase 1.5 items
- Rate limiting on message send should be the very first sub-item because it is foundational to spam resistance
- Session audit requires a Flyway migration (V17 or next available)

---

## 2. Voice Messages

### User Value

Voice messages are the highest-engagement feature in WhatsApp, Telegram, and Discord. They feel more personal than text and reduce the friction of long replies. Research shows voice messages significantly increase daily time-in-app and message response rates.

### Why It Matters Now

PostmanChat already has an attachment upload flow and the `AttachmentService` backend. Voice messages are a specialized attachment type and can reuse nearly all of that infrastructure. The main new work is the browser MediaRecorder API on the frontend and a playback UI component.

### Current Related Code Areas

- Attachment handling in `backend/src/main/java/com/postmanchat/service/AttachmentService.java`
- Upload and send flow in `frontend/src/pages/ChatPage.tsx`
- Message rendering in `frontend/src/components/views/ChatView.tsx`
- Shared types in `frontend/src/types/chat.ts`

### Expected Touchpoints

- Add a microphone button to the message input bar in `ChatView.tsx`
- Use browser `MediaRecorder` API to capture audio as WebM or OGG
- Upload the audio file via the existing attachment upload endpoint
- Tag the message with `contentType: "voice"` so the renderer knows to show an audio player instead of a generic file download
- Add a minimal audio player component: play/pause button, waveform or duration bar, timestamp
- Show a voice note duration badge in the message list (e.g., "0:23")

### Dependency Notes

- Reuses existing attachment upload flow; no new backend service required
- Consider adding auto-transcription (pass audio to a lightweight speech-to-text API) as a Phase 2 enhancement, not a v1 requirement

---

## 3. Custom User Status and Rich Presence

### User Value

A user status line ("On a quest", "DND", "Building something") makes the people list feel alive and gives users a low-friction way to express context without sending a message. This directly increases the social pull that brings users back.

### Why It Matters Now

Presence already exists in the codebase. This feature extends it from a binary online/offline signal to something expressive. Top apps (Discord, Slack, WhatsApp) all have this. It is a social signal with very low implementation complexity.

### Current Related Code Areas

- Presence and profile data in `backend/src/main/java/com/postmanchat/service/ProfileService.java`
- Profile view in `frontend/src/components/views/ProfileView.tsx`
- People view in `frontend/src/components/views/PeopleView.tsx`
- Profile modal in `frontend/src/components/ProfileModal.tsx`
- Online dot rendering (uses `--pm-online` token in CSS)

### Expected Touchpoints

- Add `statusText` (VARCHAR 80) and `statusEmoji` (VARCHAR 8) columns to the user profile table via Flyway migration
- Add a status picker in `ProfileView.tsx` and `SettingsView.tsx`: a short text input plus an emoji picker with preset suggestions ("Working", "Gaming", "Reading", "Busy", "Available")
- Render the status text as a soft line beneath the username in `ProfileModal.tsx` and `PeopleView.tsx`
- Expose a `PATCH /api/profile/status` endpoint to update status independently of the full profile edit

### Dependency Notes

- Requires one Flyway migration
- The emoji picker can be a minimal inline set of 20-30 options rather than a full Unicode picker
- Status text should never be sent over WebSocket; poll or refetch on profile loads

---

## 4. Link Preview Cards

### User Value

When users share a URL, a preview card (title, image, description) dramatically increases click rates and makes conversations feel richer without requiring any extra effort from the sender.

### Why It Matters Now

PostmanChat already renders attachments with metadata. Link previews follow the same mental model. This is a high-visibility engagement driver that takes a single backend utility and a frontend card component.

### Current Related Code Areas

- Message sending and rendering in `frontend/src/components/views/ChatView.tsx`
- Message creation in `backend/src/main/java/com/postmanchat/service/MessageService.java`
- Shared message type in `frontend/src/types/chat.ts`

### Expected Touchpoints

- On message send, detect if the message body contains a URL
- Backend service fetches OG metadata (title, description, image, favicon) from the URL server-side to avoid CORS and to protect user IPs
- Store the metadata as a JSON blob in the message record or as a linked `link_previews` table row
- Frontend renders a preview card below the message text using the metadata
- Include a close/dismiss button so users can collapse a preview they find noisy
- Apply a hard timeout (2 seconds) on OG fetch; silently skip the preview if the fetch fails

### Dependency Notes

- Backend must fetch OG tags server-side, not from the browser, to prevent CORS issues and protect user privacy
- Safe-link warning from item 1 applies here too: clicking a link preview still triggers the external link interstitial

---

## 5. Message Forwarding

### User Value

Forwarding a message to another room or DM keeps users in the app instead of copy-pasting to a different thread. It also increases the daily cross-room session behavior, which is a key retention signal.

### Why It Matters Now

The message model is already stable. Forwarding is a read-then-write operation that creates a new message record with a `forwardedFrom` reference. This is a moderate frontend change and a small backend change.

### Current Related Code Areas

- Message actions in `frontend/src/components/views/ChatView.tsx`
- Message creation in `backend/src/main/java/com/postmanchat/service/MessageService.java`
- Room list already fetched in `frontend/src/pages/ChatPage.tsx`

### Expected Touchpoints

- Add "Forward" to the message context menu in `ChatView.tsx` (alongside existing Edit, Delete, React)
- Show a room/DM picker modal filtered to rooms the user is a member of
- Post the original message content to the selected destination room with a `forwardedFrom: { messageId, roomName, senderName }` payload
- Render forwarded messages with a small "Forwarded from #room-name" header above the message body
- Add `forwardedFromId` column to the messages table via Flyway migration

### Dependency Notes

- Blocked users must not be forwardable to (apply `isBlockedBetween` check in `MessageService`)
- Keep v1 to single-hop forwarding; no cascaded forwards

---

## 6. Global Cross-Room Message Search

### User Value

Users can find anything they said or were told across all their rooms and DMs without opening each one individually. This is a power-user retention feature that is currently missing entirely.

### Why It Matters Now

The Feature Gap Audit identifies this explicitly as a clearly missing essential. Per-room search via `SearchModal` exists. Cross-room search requires only extending the backend query and adding a unified search results view.

### Current Related Code Areas

- Per-room search at `GET /api/rooms/{id}/messages/search?q=&limit=`
- `SearchModal` in `frontend/src/components/` (room-scoped)
- Backend search query in `MessageService.java`

### Expected Touchpoints

- Add `GET /api/messages/search?q=&limit=` endpoint that searches across all rooms the calling user belongs to
- Return results grouped by room with room name, message snippet, sender, and timestamp
- Add a global search trigger in the TopBar (already has search UI per `TopBar.tsx`)
- Show results in a unified panel with jump-to-room-and-message navigation
- Scope results strictly to rooms the user is a member of (use existing membership checks)

### Dependency Notes

- Per-room search already has the ILIKE pattern; this extends it with a JOIN across room_members to scope by user membership
- Keep v1 to text search only; attachment search can follow in Phase 2

---

## 7. User Report and Flag System

### User Value

Users can report abusive messages or profiles, which signals to PostmanChat that moderation is taken seriously. This is table stakes for any social platform that expects organic growth or app store longevity.

### Why It Matters Now

Blocking exists. A formal report flow is the next expected layer. Without it, PostmanChat has no channel for users to escalate harm beyond self-service blocking.

### Current Related Code Areas

- Block system in `backend/src/main/java/com/postmanchat/service/FriendService.java`
- Message context in `ChatView.tsx`
- Feedback submission in `FeedbackView.tsx` (closest existing analog)

### Expected Touchpoints

- Add "Report" to the message context menu (alongside Forward, React, Pin)
- Show a brief reason picker: Spam, Harassment, Inappropriate content, Impersonation, Other
- POST to `POST /api/reports` with `{ targetType: "message"|"user", targetId, reason, notes }`
- Store in a `reports` table with submitter, target, reason, timestamp, and status (open/reviewed/dismissed)
- Reports do not auto-remove content; they go to an admin review queue
- Add a `GET /api/admin/reports` endpoint behind an admin role check for future moderation tooling
- Acknowledge submission to the user with a short toast: "Report submitted. Thank you."

### Dependency Notes

- Requires Flyway migration for the `reports` table
- Admin review UI is out of scope for this phase; the endpoint just needs to write cleanly

---

## 8. Mutual Friends and Social Graph Signals

### User Value

Showing mutual friends on a profile ("3 mutual friends") is one of the most proven social trust signals in the industry. It reduces hesitation around friend requests and helps users discover people worth connecting with.

### Why It Matters Now

The friend graph already exists in `FriendService`. Computing mutual friends is a two-hop set intersection. Surfacing this requires no new data model, only a new query and a few UI additions.

### Current Related Code Areas

- Friend graph in `backend/src/main/java/com/postmanchat/service/FriendService.java`
- Profile modal in `frontend/src/components/ProfileModal.tsx`
- People view in `frontend/src/components/views/PeopleView.tsx`

### Expected Touchpoints

- Add `GET /api/friends/{userId}/mutual` endpoint that returns the count and up to 5 mutual friend avatars
- Render the mutual count below the username in `ProfileModal.tsx` (e.g., "4 mutual friends")
- Show up to 3 stacked avatars of mutual friends as a visual trust signal
- On `PeopleView.tsx`, sort suggested/discovered users by mutual friend count descending so warmer connections surface first
- Exclude blocked users from mutual friend calculations

### Dependency Notes

- No migration required; this is purely a new query on existing friendship data
- Mutual friend data must be scoped so blocked users are never surfaced in the count or avatar list

---

## 9. Ephemeral Messages (Disappearing Messages)

### User Value

Ephemeral messages let users share something personal or time-sensitive with confidence that it will not persist permanently. This is a strong trust and intimacy feature, and increasingly expected in DM-focused apps.

### Why It Matters Now

PostmanChat already has the message deletion backend. Ephemeral messages are scheduled deletion with a user-set timer. This is a privacy differentiator that competes directly with WhatsApp's disappearing messages and Signal's expiry timers.

### Current Related Code Areas

- Message deletion in `backend/src/main/java/com/postmanchat/service/MessageService.java`
- Message rendering in `frontend/src/components/views/ChatView.tsx`
- Message types in `frontend/src/types/chat.ts`

### Expected Touchpoints

- Add an optional `expiresAfterSeconds` field to the message send payload
- Backend stores `expires_at` timestamp on the message row (Flyway migration)
- A scheduled job (Spring `@Scheduled` or a lightweight cleanup task) deletes expired messages on a periodic sweep (every 60 seconds is fine)
- Frontend renders a small clock icon and countdown on ephemeral messages
- When a message expires, broadcast a `MESSAGE_DELETED` WebSocket event so all connected clients remove it from the view in real time
- Support timer options: 1 hour, 24 hours, 7 days, off
- Keep v1 to DMs only; group ephemeral messages can follow in Phase 2

### Dependency Notes

- Requires Flyway migration to add `expires_at` column
- Reuses existing `MESSAGE_DELETED` event type on the WebSocket broadcast; no new event type needed
- Forwarding an ephemeral message should be blocked at the frontend level

---

## 10. Activity and Engagement Signals

### User Value

Lightweight activity badges ("Room active today", "5 new messages while you were away") give users a reason to open rooms they might otherwise skip. These are retention nudges that work passively.

### Why It Matters Now

All the raw data already exists: message timestamps, read tracking, room membership. This is a display and aggregation feature, not a new data model. Research shows that social apps with visible activity signals see 20-40% higher daily return rates.

### Current Related Code Areas

- Unread state and notifications in `frontend/src/pages/ChatPage.tsx`
- Room list and sidebar in `frontend/src/components/views/ChatView.tsx`
- Room read tracking in `backend/src/main/java/com/postmanchat/service/`

### Expected Touchpoints

**Room activity badge:**
- If a room had more than 5 messages in the last 24 hours, show a small "Active" badge next to the room name in the sidebar
- Use a warm accent color distinct from the unread count dot

**Away summary:**
- When the user returns after more than 2 hours of inactivity and opens a room, show a one-line banner: "You were away — 12 messages since you left"
- Dismiss on scroll or on clicking the message list

**Streak indicators:**
- Show a flame icon next to a DM contact if the user and that contact have exchanged messages every day for 3+ consecutive days
- Connects to the existing quest and progression system without requiring new backend logic in v1 (streak can be computed client-side from message timestamps already returned)

### Dependency Notes

- Room activity badge requires a backend aggregation query but no new schema
- The streak indicator can be purely client-side in v1 using cached message data

---

## Phase 1.5 Schema Migrations Required

| Feature | Migration | Approximate Scope |
|---|---|---|
| Security hardening (session audit) | V17 | `last_active_ip`, `last_active_at` on sessions |
| Custom user status | V18 | `status_text`, `status_emoji` on profiles |
| Message forwarding | V19 | `forwarded_from_id` on messages |
| Ephemeral messages | V20 | `expires_at` on messages |
| User report system | V21 | `reports` table |

All migrations must follow the Flyway safety rule: never edit, rename, or reuse an existing version. Confirm the current highest migration before numbering any of these.

---

## Phase 1.5 vs Phase 2 Sequencing

Items 1 through 4 (security hardening, voice messages, user status, link previews) can begin immediately and deliver visible value before Phase 2 foundations are in place. Items 5 through 10 are best started after at least the first two are shipped, to keep scope manageable. None of these items block Phase 2 or Phase 3 work; they can run in parallel with early Phase 2 design.

---

## Suggested Enhancements to Phase 2

The following changes to `PHASE_2_MEDIUM_COMPLEXITY.md` are recommended based on the current codebase state and the features introduced in Phase 1.5:

### 2.1 Threaded Replies — Add Notification Threading

The current plan does not mention what happens to notifications when someone replies to a thread. Phase 1.5 adds more notification surfaces (mentions, activity badges). Phase 2 threaded replies should specify that thread replies generate a `THREAD_REPLY` notification type that surfaces in `NotificationsView.tsx` with a "Jump to thread" action, not just a generic mention.

### 2.2 Media Gallery — Add AI Tagging via Igris

The media gallery plan focuses on browsing. An enhancement: allow Igris to auto-tag shared images with descriptive labels ("screenshot", "meme", "photo", "document scan") using a lightweight image classification call when attachments are uploaded. This makes the gallery filterable by content type without manual tagging.

### 2.3 Room Management — Add Room Audit Log

The moderation plan focuses on actions. Add a lightweight `room_events` log that records member joins, leaves, kicks, role changes, and pin actions with actor and timestamp. Surface it as a "Room history" panel visible to room owners. This is essential for accountability as rooms grow and is a natural companion to the report system introduced in Phase 1.5.

### 2.4 Onboarding — Personalization Quiz for Igris

The current onboarding plan references quests and Igris as activation tools. Strengthen it: add a 3-question personalization quiz on first login ("What brings you here?", "How do you prefer to communicate?", "What kind of rooms do you want?"). Store answers as profile metadata and use them to seed Igris's initial context and pre-populate room discovery results. This makes the app feel intelligent from day one.

### 2.5 Advanced Presence — Add "Last Seen" Relative Timestamp

The presence plan mentions improving group unread and last-seen presentation but does not specify the format. Recommend showing "last seen 2 hours ago" or "last seen yesterday" (never exact timestamps) on DM contact headers when the user is offline. Match WhatsApp's approach: helpful without being surveillance-heavy.

---

## Suggested Enhancements to Phase 3

The following changes to `PHASE_3_HIGH_IMPACT_DIFFERENTIATORS.md` are recommended:

### 3.1 Igris Conversation Rescue — Add Voice Mode

The current plan is text-only. With voice messages (Phase 1.5, item 2) in place, Igris coaching can operate on voice message transcripts. If auto-transcription is added in Phase 2, Igris can offer reply coaching on voice messages too ("That came across sharp — want a softer phrasing?"). Add this to the expected touchpoints.

### 3.2 Connection Quests — Add Time-Limited Friendship Challenges

The current connection quests plan is open-ended. Add a structured variant: a 7-day friendship challenge between two accepted friends, generated by Igris or opted into by both parties ("Challenge: exchange 10 messages and share one photo with [friend] this week"). Both users see progress. Completion unlocks a shared badge visible on both profiles. This creates a two-sided social commitment that dramatically improves follow-through.

### 3.3 Mood-Based Room Modes — Add Member Vibe Voting

The current plan gives room owners control over room mode. Add a lightweight collaborative version: any room member can cast a "vibe vote" once per day (a single emoji or mode tag like "chill", "focus", "hype"). The aggregate vibe updates the room's ambient mode if 3 or more members agree. This turns room modes from an owner configuration into a living social signal.

### 3.4 Squad Arcs — Add Cross-Room Leaderboard

The squad arcs plan keeps progression room-local. Consider a cross-room seasonal leaderboard where squads (rooms that opt into arcs) compete on a collective XP total during a 4-week campaign. The top 3 squads at the end of the campaign get a cosmetic room badge. This creates competitive motivation that spills outside any single room and drives app-wide activity.

### 3.5 Friend Chemistry Insights — Ground in Phase 1.5 Activity Signals

The current plan builds insights from message frequency and recency. Phase 1.5 introduces streak indicators (item 10) and mutual friends (item 8). Feed both of these signals into the friend chemistry model. A streak breaking is a clear reconnection trigger. A new mutual friend is a conversation starter. The insights will feel more timely and actionable if they are wired to these already-computed signals.

---

## Research Sources

The feature decisions in this document are informed by:

- Messaging app security and encryption practices from [CloudSEK](https://www.cloudsek.com/knowledge-base/best-secure-messaging-apps), [Kaspersky](https://www.kaspersky.com/blog/messengers-privacy-rating-2025/54665/), and [Vonage](https://www.vonage.com/resources/articles/secure-messaging/)
- Engagement and retention data from [Infobip Messaging Trends 2025](https://www.infobip.com/messaging-trends-report/highlights) and [RST Software](https://www.rst.software/blog/chat-app-development-trends-that-will-shape-the-industry-in-2025)
- AI companion retention benchmarks from [ElectroIQ](https://electroiq.com/stats/ai-companions-statistics/) and [CyberLink](https://www.cyberlink.com/blog/trending-topics/3932/ai-companion-app)
- Social graph and discovery signals from [Meta Engineering](https://engineering.fb.com/2026/03/18/ml-applications/friend-bubbles-enhancing-social-discovery-on-facebook-reels/) and [GetStream](https://getstream.io/blog/social-media-app-features/)
- Content moderation and trust safety from [Sendbird](https://sendbird.com/learn/what-is-content-moderation) and [GetStream moderation guide](https://getstream.io/blog/content-moderation/)
- Authentication hardening from [FIDO2/Passkeys guide](https://rokibulroni.com/blog/fido2-passkeys-modern-authentication-2025/) and [Sucuri 2FA analysis](https://blog.sucuri.net/2026/04/why-2fa-sms-is-a-bad-idea.html)
