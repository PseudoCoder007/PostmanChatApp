# PostmanChat

PostmanChat is a full-stack realtime messaging platform built with React, Spring Boot, and Supabase. It combines group chat, direct messaging, progression systems, attachments, notifications, and the Igris AI companion in one product-focused codebase.

## Version 2

`v2.2.0` is the current release.

### v2.2.0 — Chat Engagement & Collaboration Update

**Phase 1 Features - All 6 Implemented:**
- Reactions: Users can react to messages with 6 quick emoji reactions (👍 ❤️ 😂 😮 😢 🔥); reactions are togglable and update in real-time across all users
- Mentions & Notifications: Tag users with @mention syntax for autocomplete; mentioned users receive notifications; @mentions bypass room mute
- Pinned Messages: Admin/owner can pin up to 5 important messages to room header; collapsible pinned banner with modal to view all pins
- Room Mute: Users can mute rooms to stop notifications (except @mentions which bypass mute); preference persists across sessions
- Draft Persistence: Auto-save message drafts per room in browser localStorage; drafts restore when switching back to room; cleared after send
- Message Search v1: Search within room messages (2+ character minimum, capped at 50 results); uses ILIKE for case-insensitive search with 30-second result caching

**Plus 34 critical bug fixes** including the workspace black-screen/render crash fixes, Flyway V10 checksum fix, browser notifications fix, message pagination fix, and mobile sign-out accessibility

Version markers:
- Frontend package: `2.2.0`
- Backend artifact: `2.2.0-SNAPSHOT`

### v2.1.0 — Chat UX & Safety Update

- Two-tab chat layout: DMs and Groups are separated into distinct tabs with room-count badges
- DM ⋮ settings menu: View Profile modal, Unfriend, and Block directly from a conversation
- Seen / Sent read receipts: WhatsApp-style ✓ / ✓✓ tick marks on own DM messages
- Block system: blocked users cannot message each other; they are hidden from People search; unblock available from the People tab
- Peer profile modal: click "View Profile" in the DM menu to see avatar, level, XP, coins, and online status without leaving the chat
- Hamburger menu is now mobile-only (hidden at ≥769px)
- Navbar search now functional — type to filter and jump to any workspace tab

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

## What Makes This v2 Release Clear

To make this release read as Version 2, the repo now includes the pieces that matter most:

- Visible semantic version in the frontend package
- Visible backend artifact version
- README section that describes what changed in v2

If you want to make the release even more explicit later, the next useful additions would be:

- A GitHub release tagged `v2.0.0`
- A changelog file such as `CHANGELOG.md`
- An in-app footer/version label like `PostmanChat v2`

## Security Notes

- Never expose the Supabase `service_role` key in the frontend
- Use only the Supabase anon key in the client
- Harden storage policies before public launch
- Add rate limits and moderation controls before public scaling

## License

MIT. See `LICENSE`.
