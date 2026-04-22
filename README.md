# PostmanChat

PostmanChat is a full-stack realtime messaging platform built with React, Spring Boot, and Supabase. It combines group chat, direct messaging, progression systems, attachments, notifications, and the Igris AI companion in one product-focused codebase.

## Version 2

`v2.3.0` is the current release.

### v2.3.0 - Connected, Secure & Alive

**Phase 1.5 Bridge Release - Shipped:**

- **Security hardening** - sign-out-all session control, external-link safety interstitials, and expanded request rate limiting
- **Custom user status** - emoji + text status on profiles and social surfaces
- **Mutual friends** - profile modals now show mutual-friend count and sample avatars
- **Voice messages** - microphone capture in the composer with inline audio playback
- **Message forwarding** - per-message forward action with room picker and forwarded banner
- **User reporting** - per-message reporting flow with reason picker and backend report queue
- **Activity signals** - active badges, streak indicators, and away banners

**Plus 36 tracked bug fixes** including the mobile room-switcher regression fix and the reaction rule fix that now enforces one active emoji per user per message.

Version markers:
- Frontend package: `2.3.0`
- Backend artifact: `2.3.0`
- Release notes: [`CHANGELOG.md`](CHANGELOG.md)
- Phase 1.5 release plan: [`docs/new-features/PHASE_1_5_PLAN_v2_3.md`](docs/new-features/PHASE_1_5_PLAN_v2_3.md)

### v2.2.0 — Chat Engagement & Collaboration Update

**Phase 1 Features - All 6 Implemented:**

- **Reactions** — Hover over any message to see 6 quick emoji options: 👍 ❤️ 😂 😮 😢 🔥. Tap to react, tap again to remove. Reactions update live for every person in the room — no refresh needed. You can see exactly who reacted with what.

- **@Mentions** — Type `@` followed by a name to tag someone in a group room. A dropdown shows matching members and you can pick the right person. The tagged user gets a notification immediately. Critically, **@mention notifications arrive even if the person has muted the room** — urgent pings are never missed.

- **Pinned Messages** — Room admins and owners can pin up to 5 messages to the top of the room. A collapsible banner at the top of the chat always shows what has been pinned. Tap the banner to see all pinned messages in a modal. Important information — exam dates, decisions, announcements — never gets buried.

- **Room Mute** — Mute any room to stop notification noise. Regular message notifications are silenced, but **@mention notifications still come through**. Perfect for staying in a large community room without being interrupted every few minutes. Preference is saved and persists across logouts.

- **Draft Persistence** — Start typing a message in one room, switch to another conversation, and the draft is saved automatically. A "Draft" badge appears on the room in the sidebar as a reminder. The draft restores exactly where you left off when you return. It clears after you send.

- **Message Search v1** — Search inside any room's message history. Type at least 2 characters and the app returns up to 50 matching results. Search is case-insensitive (finds "Meeting" and "meeting" equally). Results are cached for 30 seconds so repeated searches feel instant. Scoped to the current room.

**Plus 34 critical bug fixes** including the workspace black-screen/render crash fixes, Flyway V10 checksum fix, browser notifications fix, message pagination fix, and mobile sign-out accessibility

Version markers:
- Frontend package: `2.2.0`
- Backend artifact: `2.2.0-SNAPSHOT`

### v2.1.0 — Chat UX & Safety Update

- **Two-tab chat layout** — DMs and Group rooms are split into their own tabs, each showing an unread message badge. No more scrolling through one mixed list to find the right conversation.

- **DM settings menu (⋮)** — A three-dot menu inside every DM gives you three quick actions: **View Profile** (see the person's avatar, level, XP, coins, and online status without leaving chat), **Unfriend**, and **Block** — all without navigating away.

- **Read receipts (✓ / ✓✓)** — WhatsApp-style tick marks on every DM message you send. One tick (✓) means delivered. Two ticks (✓✓) means the other person has opened and read the message. Removes the guesswork of whether someone is ignoring you or just hasn't seen it yet.

- **Block system** — Block any user with one tap and they immediately cannot send you messages, cannot see you in search results, and you cannot see them either. Unblock anytime from the People tab. Safety is built into the product, not hidden in settings.

- **Peer profile modal** — Tap "View Profile" from a DM to see a clean profile card: the person's photo, current level, XP earned, coin balance, and live online status. Makes the social identity layer feel real.

- **Hamburger menu is now mobile-only** — On desktop the sidebar is always visible; the hamburger toggle appears only on small screens. Cleaner on every viewport.

- **Navbar search** — Type any word into the top bar to jump to any tab or feature instantly. Search "quests" and land on the Quests tab. Search a friend's name and see their profile. Makes the app fast and intuitive even for first-time users.

### v2.0.0 — UI Refresh

- Refined login and signup experience with a cleaner, more professional UI
- Better desktop viewport fit for auth screens without breaking mobile responsiveness
- Stronger product branding and messaging across auth and footer surfaces
- Cleaner repo metadata so the project version is visible in the README and package manifests

Version markers in this repo:

- Frontend package: `2.1.0`
- Backend artifact: `2.1.0-SNAPSHOT`

## Core Features

- Realtime room chat over STOMP WebSockets
- Public and private rooms with join requests
- Friend-gated direct messages with two-tab (DMs / Groups) layout
- Seen / Sent read receipts on DM messages (WhatsApp-style ✓ / ✓✓)
- Block / Unblock users — prevents messaging and hides blocked users from search
- Peer profile modal — view avatar, level, XP, coins, and online status from a DM
- Supabase Auth with backend JWT validation
- Username availability checks and reset-password flow
- File uploads for images, videos, and documents
- Supabase Storage with backend fallback handling
- Presence, notifications, quests, XP, coins, levels, and leaderboard systems
- Igris AI assistant chat and history
- Functional navbar search — jump to any workspace tab by name or keyword
- Theme, sound, onboarding, and feedback flows

## Real-World Use Cases

These scenarios show where Postman Quest Chat makes a difference — and why other apps cannot replace it.

### 1. The College Study Squad
Four students create a private group room for finals prep. They pin the exam schedule and key formulas at the top — permanently visible, never buried. During crunch week everyone mutes the room to avoid constant interruptions, but @mentions still come through when someone needs urgent help at midnight. Reactions (👍) replace the "thanks, got it" messages so the chat stays clean. Message search finds "the formula from Tuesday" in under 3 seconds. Completing quests together makes revision sessions unexpectedly fun.

### 2. Long-Distance Friends Staying Close
Six friends in different cities find their group chat going quiet. Read receipts remove the anxiety of not knowing if a message was seen or ignored. Draft persistence saves long heartfelt messages when life interrupts mid-type. Reactions keep conversations alive even on low-energy days. Igris generates reconnection quests — "Message a friend you haven't spoken to in 2 weeks" — nudging people to reach out. The leaderboard gives everyone a reason to open the app daily, not just for emergencies.

### 3. The Gaming Clan
A 30-player gaming group creates a public room for recruitment and a private join-request room for the core team. The leaderboard rewards the most active members with visible rank. Quests challenge members to hit engagement milestones. Pinned messages keep the next tournament date visible to everyone. @mentions replace the chaos of pinging someone in a busy room — targeted, immediate, guaranteed to land.

### 4. The Small Startup Team
A 5-person team replaces their paid Slack subscription with group rooms per project. @mentions target the right person instead of notifying the whole team. Pinned messages lock down important decisions so they are never re-litigated. File attachments handle mockups and documents inline. Room mute enables focus mode. Message search retrieves any past decision in seconds. The quest system adds a light layer of team culture and motivation.

### 5. The Mental Wellness Support Circle
Five close friends create a private room as a safe, judgment-free space. When someone is struggling at 2am, Igris is always available — listening, responding with empathy, and suggesting small actionable quests (go outside for 5 minutes, write down one good thing). Read receipts provide the comfort of knowing a message was seen. Reactions let the others acknowledge a difficult post without needing to find the right words. The quest system rewards completing wellness nudges with XP — positive reinforcement that feels rewarding, not clinical.

### 6. The University Society
An 80-member debate society creates a public room for general membership and a private room for the committee. Pinned messages always show the next event, sign-up link, and latest newsletter — no member can claim they missed the announcement. @mentions alert the right people without spamming everyone. The leaderboard rewards engagement and turns up in conversation. Quests tied to attendance and participation make showing up feel like progress. New members use Igris to get oriented without bothering committee members.

---

## Tech Stack

- Frontend: React 18, TypeScript, Vite, TanStack Query, Framer Motion
- Backend: Spring Boot 3, Spring Security, Spring Data JPA, STOMP WebSocket
- Auth: Supabase Auth
- Database: Supabase Postgres
- Storage: Supabase Storage
- Migrations: Flyway
- Infra: Docker, Docker Compose, Nginx, EC2

## Project Structure

```text
PostWebAppforMessaging/
|-- backend/
|-- docs/
|-- frontend/
|-- deploy/
|-- claude.md
|-- docker-compose.yml
|-- Dockerfile
`-- README.md
```

## Navigation

- [claude.md](claude.md): root agent entrypoint that forwards to the docs hub
- [CHANGELOG.md](CHANGELOG.md): official release history and version notes
- [docs/project-docs/README.md](docs/project-docs/README.md): canonical documentation hub and required read order
- [docs/project-docs/claude.md](docs/project-docs/claude.md): fast-entry repo map for Claude, Codex, and other agents
- [docs/project-docs/CLAUDE_DEV_PROTOCOL.md](docs/project-docs/CLAUDE_DEV_PROTOCOL.md): concise planning and implementation rules
- [docs/project-docs/ARCHITECTURE_MAP.md](docs/project-docs/ARCHITECTURE_MAP.md): deeper subsystem map with routes, API inventory, and ownership notes

## Feature Roadmap Docs

- [docs/new-features/README.md](docs/new-features/README.md): canonical roadmap hub for missing features, differentiators, and phased rollout

For upcoming product additions, start with `docs/project-docs/` to understand the current system, then use `docs/new-features/` for roadmap planning and sequencing.

Agents working in this repo should read the docs in this order before planning or executing:

1. `docs/project-docs/README.md`
2. `docs/project-docs/claude.md`
3. `docs/project-docs/CLAUDE_DEV_PROTOCOL.md`
4. `docs/project-docs/ARCHITECTURE_MAP.md`

## Quick Start

### Prerequisites

- Node.js 18+
- Java 21 installed locally
- Maven
- A Supabase project for auth, database, and storage

### 1. Configure environment files

- Create `backend/.env` from `backend/env.example`
- Create `frontend/.env` from `frontend/env.example`

### 2. Start the backend

```powershell
cd C:\Users\alisa\OneDrive\Desktop\PostWebAppforMessaging
mvn -f .\backend\pom.xml spring-boot:run
```

### 3. Start the frontend

```powershell
cd C:\Users\alisa\OneDrive\Desktop\PostWebAppforMessaging\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

### 4. Verify

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://localhost:8080/actuator/health`

## Environment Variables

### Backend

```env
DATABASE_URL=jdbc:postgresql://db.<your-ref>.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=<your_database_password>
SUPABASE_JWT_ISSUER=https://<your-ref>.supabase.co/auth/v1
CORS_ORIGINS=http://localhost:5173
SERVER_PORT=8080
STORAGE_BASE_URL=http://localhost:8080
IGRIS_NVIDIA_API_URL=https://integrate.api.nvidia.com/v1/chat/completions
IGRIS_NVIDIA_API_KEY=<your_nvidia_api_key_here>
IGRIS_MODEL=meta/llama-3.1-70b-instruct
EMAIL_NOTIFICATIONS_ENABLED=false
EMAIL_FROM=no-reply@your-app.example
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true
```

### Frontend

```env
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
VITE_PUBLIC_SITE_URL=https://postmanchat.live
VITE_API_BASE_URL=https://postmanchat.live
VITE_SUPABASE_STORAGE_BUCKET=chat-uploads
```

## Build and Test

### Frontend build

```powershell
cd .\frontend
npm run build
```

### Backend tests

```powershell
mvn -f .\backend\pom.xml test
```

### Docker

```bash
docker build -t postman-chat .
docker-compose up
```

## Deployment Notes

The repo includes an EC2 + Nginx deployment path under `deploy/`.

Recommended production auth URLs:

- `https://postmanchat.live`
- `https://postmanchat.live/login`
- `https://postmanchat.live/reset-password`

## Release Capture

The repo now captures official release state in four places:

- `frontend/package.json` for the frontend app version
- `backend/pom.xml` for the backend artifact version
- `README.md` for the current public release summary
- `CHANGELOG.md` for formal version-by-version release notes

## Security Notes

- Never expose the Supabase `service_role` key in the frontend
- Use only the Supabase anon key in the client
- Harden storage policies before public launch
- Add rate limits and moderation controls before public scaling

## License

MIT. See `LICENSE`.
