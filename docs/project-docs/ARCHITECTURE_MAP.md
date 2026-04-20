# Architecture Map

## Summary

This repo is organized around one core user experience: an authenticated chat workspace. The frontend loads into a single route-driven shell, then `ChatPage.tsx` orchestrates most product features through TanStack Query, local UI state, and a WebSocket room connection. The backend follows a conventional Spring split of `web -> service -> repo/domain`, with a separate `ws` package for STOMP setup and room typing flow.

## Documentation Workflow

This file is part of the canonical docs hub. Before planning or executing work, read:

1. `docs/project-docs/README.md`
2. `docs/project-docs/AGENTS.md`
3. `docs/project-docs/CLAUDE_DEV_PROTOCOL.md`
4. `docs/project-docs/ARCHITECTURE_MAP.md`

## Frontend App Shell And Routes

- Entry point: `frontend/src/main.tsx`
  - Boots React, router, query client, and global CSS.
- Route shell: `frontend/src/App.tsx`
  - Public routes: `/login`, `/signup`, `/reset-password`
  - Protected route: `/` guarded by `RequireAuth`
  - Redirect parsing uses `frontend/src/lib/authRedirect.ts`
- Auth gate: `frontend/src/components/RequireAuth.tsx`
  - Keeps the workspace behind an authenticated session.

### Route Inventory

- `/login` -> `frontend/src/pages/LoginPage.tsx`
- `/signup` -> `frontend/src/pages/SignupPage.tsx`
- `/reset-password` -> `frontend/src/pages/ResetPasswordPage.tsx`
- `/` -> `frontend/src/pages/ChatPage.tsx`

## Chat Workspace And Views

- Main orchestration surface: `frontend/src/pages/ChatPage.tsx`
  - Owns active workspace tab, active room, message draft, profile form, Igris drawer, feedback form, uploads, typing state, notifications, and mobile/sidebar behavior.
  - Fetches most app data with query keys such as `me`, `rooms`, `messages`, `friends`, `quests`, `leaderboard`, `notifications`, `profiles`, and `igris-history`.
  - Connects realtime room updates through `useStompRoom`.
- Tab rendering is split into `frontend/src/components/views/`
  - `ChatView.tsx`: two-tab (DMs / Groups) room list, messages, composer, DM ⋮ settings menu, join request surfaces, seen/sent tick marks
  - `PeopleView.tsx`: user discovery, friend actions, blocked-users section with unblock
  - `QuestsView.tsx`: quest list and progression prompts
  - `IgrisView.tsx`: AI companion conversation UI
  - `BoardView.tsx`: leaderboard display
  - `LevelsView.tsx`: level/progression view
  - `ProfileView.tsx`: profile editing and account-facing details
  - `FeedbackView.tsx`: feedback submission UI
  - `SettingsView.tsx`: theme/sound and related settings
- Shared layout components live in `frontend/src/components/layout/`
  - `Sidebar.tsx` and `TopBar.tsx` frame the workspace. Hamburger menu is mobile-only (≤768px).
- Shared modal components live in `frontend/src/components/`
  - `ProfileModal.tsx`: peer profile popup (avatar, display name, level, XP, coins, online status); opened from DM ⋮ menu "View Profile"

## Shared Frontend Hooks, Libs, And Types

- `frontend/src/hooks/useStompRoom.ts`
  - Requests a temporary ws ticket, connects to the broker URL, subscribes to `/topic/rooms.{roomId}`, and publishes typing events to `/app/rooms/{roomId}/typing`.
- `frontend/src/hooks/useThemeMode.ts`
  - Theme preference state.
- `frontend/src/hooks/useTutorial.tsx`
  - Onboarding/tutorial state.
- `frontend/src/lib/api.ts`
  - Reads the Supabase session token and attaches it to REST requests.
  - Handles JSON requests, form uploads, API base URL resolution, and `POST /api/auth/ws-ticket`.
- `frontend/src/lib/supabase.ts`
  - Creates the Supabase client and auth redirect URLs.
- `frontend/src/lib/wsUrl.ts`
  - Builds the browser WebSocket URL used by `useStompRoom`.
- `frontend/src/types/chat.ts`
  - Frontend contract types for rooms, messages, notifications, profile, typing, quests, leaderboard, feedback, attachments, and Igris.

## Backend Request Flow

The backend follows a standard request path:

1. Controller in `backend/src/main/java/com/postmanchat/web/`
2. Service in `backend/src/main/java/com/postmanchat/service/`
3. Repository/entity in `repo/` and `domain/`
4. DTO mapping through `DtoMapper` where needed

### Controller To Service Map

- `AuthController` -> `WsTicketService`
- `RoomController` -> `RoomService`, `MessageService`
- `MessageController` -> `MessageService`
- `FriendController` -> `FriendService`
- `ProfileController` -> `ProfileService`
- `PublicProfileController` -> `ProfileService`
- `PublicAuthController` -> `ProfileService`
- `MeController` -> `ProfileService`
- `QuestController` -> `QuestService`
- `LeaderboardController` -> `LeaderboardService`
- `NotificationController` -> `NotificationService`
- `AttachmentController` -> `AttachmentService`
- `FeedbackController` -> `FeedbackService`, `ProfileService`
- `IgrisController` -> `IgrisService`, `ProfileService`

### API Inventory

- `/api/auth`
  - `POST /ws-ticket`
- `/api/rooms`
  - `GET /`
  - `GET /discover`
  - `POST /`
  - `POST /{roomId}/join`
  - `GET /{roomId}/requests`
  - `POST /{roomId}/requests/{userId}/approve`
  - `POST /{roomId}/requests/{userId}/reject`
  - `POST /{roomId}/members`
  - `POST /{roomId}/read`
  - `GET /{roomId}/messages`
  - `POST /{roomId}/messages`
- `/api/messages`
  - `PATCH /{id}`
  - `DELETE /{id}`
- `/api/friends`
  - `GET /`  — returns all friendship records including `blocked` status
  - `POST /{targetUserId}/request`
  - `POST /{otherUserId}/accept`
  - `DELETE /{otherUserId}`  — unfriend
  - `POST /{targetUserId}/block`  — block; sets status=blocked, requestedBy=blocker
  - `DELETE /{targetUserId}/block`  — unblock; deletes the block record
- `/api/me`
  - `GET /`
  - `PATCH /`
  - `POST /presence`
  - `POST /avatar`
- `/api/profiles`
  - `GET /`
  - `GET /availability`
- `/api/public/usernames`
  - `GET /availability`
- `/api/public/auth`
  - `GET /login-identifier`
- `/api/quests`
  - `GET /`
  - `POST /random`
  - `POST /{questId}/complete`
  - `POST /friends/{targetUserId}/random`
- `/api/leaderboard`
  - `GET /`
- `/api/notifications`
  - `GET /`
  - `POST /{notificationId}/read`
- `/api/attachments`
  - `POST /`
  - `POST /register`
- `/api/feedback`
  - `POST /`
- `/api/igris`
  - `POST /chat`
  - `GET /history`

## Realtime WebSocket Event Types

Events broadcast on `/topic/rooms.{roomId}` (type field on `WsMessagePayload`):

| Type | Trigger | Frontend handler |
|------|---------|-----------------|
| `MESSAGE_CREATED` | New message sent | Append to `['messages', roomId]` cache |
| `MESSAGE_UPDATED` | Message edited | Replace in `['messages', roomId]` cache |
| `MESSAGE_DELETED` | Message deleted | Remove from `['messages', roomId]` cache |
| `TYPING` | User typing | Set `roomTyping` state, auto-clear after 1.8 s |
| `ROOM_READ` | Peer opened a DM | Update `peerLastReadAt` on `['rooms']` cache |

## Realtime / STOMP Flow

- Frontend trigger:
  - `ChatPage.tsx` calls `useStompRoom(activeRoomId, onWsEvent)`
- Frontend connection:
  - `useStompRoom.ts` requests a temporary ticket from `POST /api/auth/ws-ticket`
  - `frontend/src/lib/wsUrl.ts` builds the `/ws` broker URL with that ticket
  - The STOMP client subscribes to `/topic/rooms.{roomId}`
  - Typing events publish to `/app/rooms/{roomId}/typing`
- Backend handshake and broker:
  - `web/AuthController.java` issues tickets
  - `security/WsTicketService.java` stores short-lived ticket state
  - `security/TicketHandshakeInterceptor.java` consumes tickets during handshake
  - `ws/ChatHandshakeHandler.java` establishes the authenticated principal
  - `ws/WebSocketConfig.java` exposes `/ws`, enables the simple broker on `/topic`, and sets application destinations to `/app`
  - `ws/StompSubscribeAuthorizationInterceptor.java` guards room subscriptions
  - `ws/RoomTypingController.java` handles typing signals

## Domain, Persistence, And Migrations

- `backend/src/main/java/com/postmanchat/domain/`
  - Core entities: `Profile`, `Room`, `RoomMember` (has `last_read_at`), `RoomJoinRequest`, `Message`, `Attachment`, `Friendship`, `AppNotification`, `QuestTemplate`, `UserQuest`, `IgrisChatHistory`
  - `FriendshipStatus` enum: `pending`, `accepted`, `rejected`, `blocked`
  - `Friendship.requestedBy` is reused to track who initiated a block
- `backend/src/main/java/com/postmanchat/repo/`
  - JPA repositories for the domain model
- `backend/src/main/resources/db/migration/`
  - Flyway history — next number is `V12`
  - Migration themes so far:
    - V1: initial schema
    - V2: social foundation (friendships, CHECK constraint on status)
    - V3: gamification (XP, coins, levels, quests)
    - V4: attachments, notifications, presence
    - V5: Igris chat history and quest automation
    - V6: profile email for notifications
    - V7: persistent unlocks
    - V8: Igris chat history table
    - V9: room visibility and join requests
    - V10: room read tracking (`last_read_at` on `room_members`)
    - V11: friendship blocking (expands CHECK constraint to include `blocked`)

## Config And Deployment

- Runtime config: `backend/src/main/resources/application.yml`
  - Database, JWT issuer, CORS, storage base URL, Igris provider settings, mail settings, actuator, and rate limiting
- Security: `backend/src/main/java/com/postmanchat/config/SecurityConfig.java`
  - `/api/**` requires authentication except `/api/public/**`
  - `/ws/**` is allowed because handshake auth is handled separately
- Frontend environment config:
  - `frontend/.env`
  - `frontend/env.example`
- Backend environment config:
  - `backend/.env`
  - `backend/env.example`
- Deployment assets:
  - `deploy/nginx/postmanchat.live.conf.template`
  - `deploy/ec2/setup-nginx-certbot.sh`
  - root `Dockerfile`
  - root `docker-compose.yml`

## Repo-Specific Realities

- `frontend/src/pages/ChatPage.tsx` is the main orchestration surface and primary hotspot for feature work.
- The backend is intentionally split into `web`, `service`, `repo`, `domain`, `ws`, `security`, and `config`.
- Auth starts in Supabase on the frontend, while backend API authorization relies on JWT resource-server validation.
- The codebase is feature-rich, but much of the authenticated product flow is still centralized in one frontend page.

## Update Checklist

Update this file when you:

- add a new top-level feature area or major workspace tab
- add or remove frontend routes or backend controllers
- move feature ownership between `web`, `service`, `repo`, `domain`, or `ws`
- change auth, JWT, or WebSocket handshake behavior
- change schema ownership or deployment/runtime architecture
