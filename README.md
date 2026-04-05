# Postman Quest Chat

Postman Quest Chat is a realtime social messaging app built with React, Spring Boot, and Supabase. It combines room chat, friend-gated direct messaging, quests, coins, levels, notifications, and leaderboard features in a single app.

## Highlights

- Realtime messaging over WebSockets
- Group rooms with unique names
- Direct messaging only after friend request acceptance
- Search for people and rooms
- Unique usernames and editable profiles
- Supabase Storage uploads for images, videos, and documents
- 50 MB upload warning and server-side validation
- In-app notifications for inactive recipients
- Presence indicator based on recent activity heartbeat
- XP, coins, levels, titles, random quests, friend quests, and global leaderboard

## Tech stack

- Frontend: React 18, TypeScript, Vite, TanStack Query
- Backend: Spring Boot 3, Java 21, Spring Security, STOMP WebSocket
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

### Gamification

- Sending messages grants small XP and coin rewards.
- Users can generate random quests.
- Completing quests grants larger rewards.
- Coins unlock profile photo usage and friend quest sending.
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
- Friend challenge quests
- Global leaderboard

### Notifications

- In-app notifications for unread activity
- Browser notifications when the tab is backgrounded and permission is granted

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
- 10 coins: friend quest sending unlock

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

## Notes

- Browser notifications require notification permission.
- Direct chat requires accepted friendship.
- Uploads larger than 50 MB are rejected.
- The current notification system is in-app plus browser background notifications, not full push delivery to fully offline devices.

## Security notes

- Do not put the Supabase `service_role` key in the frontend.
- The frontend should only use the Supabase anon key.
- Protect storage policies appropriately before deploying publicly.

## License

MIT. See [LICENSE](C:/Users/alisa/PostWebAppforMessaging/LICENSE).
