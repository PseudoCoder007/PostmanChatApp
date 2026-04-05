# Postman Quest Chat

Postman Quest Chat is a realtime social messaging app built with React, Spring Boot, and Supabase. It combines room chat, friend-gated direct messaging, quests, coins, levels, notifications, leaderboard features, and an unlockable Igris AI console in a single app.

## Highlights

- Realtime messaging over WebSockets
- Animated command-deck UI with route transitions and gaming-style panel motion
- Group rooms with unique names
- Direct messaging only after friend request acceptance
- Search for people and rooms
- Unique usernames and editable profiles
- Supabase Storage uploads for images, videos, and documents
- 50 MB upload warning and server-side validation
- In-app notifications for inactive recipients plus browser notifications
- Optional SMTP email notifications for inactive recipients
- Presence indicator based on recent activity heartbeat and periodic refresh
- Toast-based success and failure feedback across auth and chat actions
- Optional UI sounds for sends, alerts, and live activity
- XP, coins, levels, titles, random quests, friend quests, Igris unlocks, and global leaderboard

## Tech stack

- Frontend: React 18, TypeScript, Vite, TanStack Query, Motion, Sonner
- Backend: Spring Boot 3, Java 21, Spring Security, STOMP WebSocket, JavaMail
- Auth and database: Supabase Auth, Supabase Postgres
- File storage: Supabase Storage
- Migrations: Flyway

## How it works

### Authentication

The frontend uses Supabase Auth for sign up and sign in. After login, the browser sends the Supabase JWT to the Spring Boot backend on API requests.

### Messaging

- Group rooms are created through the backend and room names must be unique.
- Direct chats are only allowed between accepted friends.
- Messages are persisted in Postgres.
- Realtime updates are delivered through STOMP over WebSocket.

### Social layer

- Every user has a unique username.
- Users can send and accept friend requests.
- Presence is updated through a heartbeat endpoint while the app is open.
- Notifications are stored server-side and shown in the UI.
- Friend and profile presence are refreshed periodically on the frontend.

### Gamification

- Sending messages grants small XP and coin rewards.
- Users can generate random quests.
- Completing quests grants larger rewards.
- Coins unlock profile photo usage, Igris access, and friend quest sending.
- Global leaderboard ranks users by XP.

### Attachments

- Files are uploaded from the authenticated frontend session to Supabase Storage.
- The backend registers attachment metadata and links it to messages.
- Images and videos render inline when possible.
- Other file types are shown as downloadable links.

## Main features

### Realtime chat

- Group room chat
- Friend-only direct messages
- Message history loading
- Live updates without refresh
- Optional game-style UI sounds for sends and incoming activity
- Animated chat surfaces and room switching

### Profiles and friends

- Editable display name
- Unique username
- Optional profile photo
- Friend requests
- Accepted-friend messaging gate
- Presence state

### Quests and progression

- XP, coins, levels, titles
- Random quests
- Igris-generated quests and AI chat console
- Friend challenge quests
- Global leaderboard

### Notifications

- In-app notifications for unread activity
- Browser notifications when the tab is backgrounded and permission is granted
- Optional SMTP email notifications for inactive recipients
- Toast notifications for successful and failed actions

## Project structure

```text
PostWebAppforMessaging/
├── backend/
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── pom.xml
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Environment variables

### Backend

Set these for Spring Boot:

```env
DATABASE_URL=jdbc:postgresql://db.<your-ref>.supabase.co:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=<your_database_password>
SUPABASE_JWT_ISSUER=https://<your-ref>.supabase.co/auth/v1
CORS_ORIGINS=http://localhost:5173
SERVER_PORT=8080
IGRIS_NVIDIA_API_URL=https://integrate.api.nvidia.com/v1/chat/completions
IGRIS_NVIDIA_API_KEY=
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

Example file: [backend/env.example](C:/Users/alisa/PostWebAppforMessaging/backend/env.example)

### Frontend

Set these in `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your_anon_key>
VITE_API_BASE_URL=
VITE_SUPABASE_STORAGE_BUCKET=chat-uploads
```

Example file: [frontend/env.example](C:/Users/alisa/PostWebAppforMessaging/frontend/env.example)

## Supabase setup

### 1. Create a project

Create a Supabase project and collect:

- Project URL
- Anon key
- Database password
- Project ref

### 2. Storage bucket

Create a public Storage bucket named `chat-uploads` or change the frontend env var to match your chosen bucket.

### 3. Storage policy

You need a policy that allows authenticated users to upload files to the selected bucket. A minimal example:

```sql
create policy "authenticated uploads"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'chat-uploads');

create policy "public reads"
on storage.objects
for select
to public
using (bucket_id = 'chat-uploads');
```

Adjust policies to your security requirements before production use.

## Running locally

### Backend

From the repo root:

```powershell
cd C:\Users\alisa\PostWebAppforMessaging
$env:JAVA_HOME = "C:\Users\alisa\PostWebAppforMessaging\.tools\jdk-21\jdk-21.0.10+7"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
Get-Content .\backend\.env | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $name, $value = $_ -split '=', 2
  [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
}
& .\.tools\maven\apache-maven-3.9.9\bin\mvn.cmd -f .\backend\pom.xml spring-boot:run
```

Health check:

```text
http://localhost:8080/actuator/health
```

### Frontend

```powershell
cd C:\Users\alisa\PostWebAppforMessaging\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

## Build and test

### Backend tests

```powershell
& .\.tools\maven\apache-maven-3.9.9\bin\mvn.cmd -f .\backend\pom.xml test
```

### Frontend production build

```powershell
cd .\frontend
npm run build
```

## Current unlock rules

- 5 coins: profile photo unlock
- 5 coins: Igris AI console unlock
- 10 coins: friend quest sending unlock
- 20 coins: group room creation cost

## API summary

### Core

- `GET /api/me`
- `PATCH /api/me`
- `POST /api/me/presence`
- `GET /api/rooms`
- `POST /api/rooms`
- `GET /api/rooms/{roomId}/messages`
- `POST /api/rooms/{roomId}/messages`

### Social

- `GET /api/profiles`
- `GET /api/friends`
- `POST /api/friends/{targetUserId}/request`
- `POST /api/friends/{otherUserId}/accept`

### Quests and leaderboard

- `GET /api/quests`
- `POST /api/quests/random`
- `POST /api/quests/{questId}/complete`
- `POST /api/quests/friends/{targetUserId}/random`
- `GET /api/leaderboard`

### Attachments and notifications

- `POST /api/attachments/register`
- `GET /api/notifications`
- `POST /api/notifications/{notificationId}/read`
- `POST /api/igris/chat`

## Notes

- Browser notifications require notification permission.
- Direct chat requires accepted friendship.
- Uploads larger than 50 MB are rejected.
- The current notification system supports in-app notifications, browser background notifications, and optional SMTP email notifications for inactive recipients.
- Email delivery requires valid SMTP env vars and `EMAIL_NOTIFICATIONS_ENABLED=true`.
- Igris chat requires authentication and unlocks only after the user reaches 5 coins.

## Security notes

- Do not put the Supabase `service_role` key in the frontend.
- The frontend should only use the Supabase anon key.
- Protect storage policies appropriately before deploying publicly.

## License

MIT. See [LICENSE](C:/Users/alisa/PostWebAppforMessaging/LICENSE).
