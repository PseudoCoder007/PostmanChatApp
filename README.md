# PostmanChat

PostmanChat is a full-stack realtime messaging platform built with React, Spring Boot, and Supabase. It combines group chat, direct messaging, progression systems, attachments, notifications, and the Igris AI companion in one product-focused codebase.

## Version 2

`v2.0.0` is the current UI release.

Version 2 adds:

- Refined login and signup experience with a cleaner, more professional UI
- Better desktop viewport fit for auth screens without breaking mobile responsiveness
- Stronger product branding and messaging across auth and footer surfaces
- Cleaner repo metadata so the project version is visible in the README and package manifests

Version markers in this repo:

- Frontend package: `2.0.0`
- Backend artifact: `2.0.0-SNAPSHOT`

## Core Features

- Realtime room chat over STOMP WebSockets
- Public and private rooms with join requests
- Friend-gated direct messages
- Supabase Auth with backend JWT validation
- Username availability checks and reset-password flow
- File uploads for images, videos, and documents
- Supabase Storage with backend fallback handling
- Presence, notifications, quests, XP, coins, levels, and leaderboard systems
- Igris AI assistant chat and history
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
|-- frontend/
|-- deploy/
|-- docker-compose.yml
|-- Dockerfile
`-- README.md
```

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
