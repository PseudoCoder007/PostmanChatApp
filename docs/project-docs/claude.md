# claude.md

## What This Repo Is

PostmanChat is a full-stack realtime messaging app built with React, Vite, Spring Boot, Supabase Auth, Supabase Postgres, and STOMP WebSockets. The main product surface is a single authenticated workspace that combines chat, people, quests, leaderboard, profile, notifications, feedback, and the Igris AI companion.

## Required Read Order

Before planning or executing work, read:

1. `docs/project-docs/README.md`
2. `docs/project-docs/claude.md`
3. `docs/project-docs/CLAUDE_DEV_PROTOCOL.md`
4. `docs/project-docs/ARCHITECTURE_MAP.md`

Before fixing a bug, check `docs/project-docs/BUG_TRACKER.md` to avoid duplicate work and to log the fix.

## Stack Snapshot

- Frontend: React 18, TypeScript, Vite, TanStack Query, Framer Motion
- Backend: Spring Boot 3, Spring Security, JPA, Flyway, STOMP WebSocket
- Auth: Supabase on the frontend, JWT validation in the backend
- Infra: Docker, Docker Compose, Nginx, EC2

## Repo Layout

- `frontend/`: React app
- `backend/`: Spring Boot API, realtime, persistence
- `deploy/`: Nginx and EC2 deployment scripts
- `docs/project-docs/`: canonical documentation hub
- `README.md`: setup and product overview

## Start Here

- App routes start in `frontend/src/App.tsx`
- Main authenticated workspace lives in `frontend/src/pages/ChatPage.tsx`
- Shared frontend API/auth helpers live in `frontend/src/lib/`
- Realtime room client lives in `frontend/src/hooks/useStompRoom.ts`
- Peer profile modal: `frontend/src/components/ProfileModal.tsx`
- All workspace tab views: `frontend/src/components/views/`
- All styles and design tokens: `frontend/src/index.css` (responsive at 960px layout, 768px hamburger menu)
- Backend HTTP entrypoints live in `backend/src/main/java/com/postmanchat/web/`
- Backend realtime wiring lives in `backend/src/main/java/com/postmanchat/ws/`
- Core business logic lives in `backend/src/main/java/com/postmanchat/service/`
- Schema changes live in `backend/src/main/resources/db/migration/` (current highest: V16, next: V17)

## Ownership Map

### Frontend

- `frontend/src/App.tsx`
  - Public routes: `/login`, `/signup`, `/reset-password`
  - Protected route: `/` -> `RequireAuth` -> `ChatPage`
- `frontend/src/pages/ChatPage.tsx`
  - Main orchestration surface
  - Fetches profile, rooms, messages, quests, leaderboard, notifications, people, join requests, and Igris history
  - Switches between `chat`, `people`, `quests`, `igris`, `board`, `notifications`, `levels`, `profile`, `feedback`, and `settings`
- `frontend/src/components/views/`
  - Split presentation for workspace tabs
  - `NotificationsView.tsx` — paginated notification list (20/page); receives `notifications`, `onMarkRead`, `formatTime` props from ChatPage
- `frontend/src/lib/api.ts`
  - Authenticated fetch wrapper and WebSocket ticket request
- `frontend/src/lib/supabase.ts`
  - Supabase client and auth redirect URLs
- `frontend/src/types/chat.ts`
  - Shared frontend types for rooms, messages, profile, quests, notifications, typing, and Igris

### Backend

- `web/`
  - Controllers for REST endpoints
- `service/`
  - Business logic per feature
- `repo/`
  - JPA repositories
- `domain/`
  - Entities and enums
- `ws/`
  - STOMP endpoint registration, handshake, subscribe auth, typing controller
- `security/`
  - WebSocket ticket issuance and principal support
- `config/`
  - Security, CORS, app properties

## Auth And Realtime

- Supabase session tokens are read in `frontend/src/lib/api.ts` and sent as `Authorization: Bearer ...`
- Backend JWT enforcement is in `backend/src/main/java/com/postmanchat/config/SecurityConfig.java`
- Frontend WebSocket flow:
  - request ticket via `POST /api/auth/ws-ticket`
  - build broker URL in `frontend/src/lib/wsUrl.ts`
  - connect and subscribe in `frontend/src/hooks/useStompRoom.ts`
- Backend WebSocket flow:
  - ticket issued by `backend/.../web/AuthController.java`
  - ticket validated by `backend/.../security/WsTicketService.java` and handshake support
  - STOMP endpoint and `/topic` + `/app` prefixes configured in `backend/.../ws/WebSocketConfig.java`

## Hot Files

- `frontend/src/pages/ChatPage.tsx`: biggest frontend orchestration file
- `frontend/src/App.tsx`: route entrypoint
- `frontend/src/hooks/useStompRoom.ts`: room subscription lifecycle
- `frontend/src/lib/api.ts`: authenticated HTTP and ws-ticket request
- `backend/src/main/java/com/postmanchat/web/RoomController.java`: room and message-facing API entrypoints
- `backend/src/main/java/com/postmanchat/service/RoomService.java`: room logic
- `backend/src/main/java/com/postmanchat/service/MessageService.java`: message lifecycle
- `backend/src/main/java/com/postmanchat/service/ProfileService.java`: profile/auth-adjacent reads and updates
- `backend/src/main/java/com/postmanchat/service/IgrisService.java`: AI companion logic
- `backend/src/main/java/com/postmanchat/ws/WebSocketConfig.java`: realtime wiring
- `backend/src/main/resources/db/migration/`: schema history

## Change Guide

- UI shell or route changes:
  - Start in `frontend/src/App.tsx`, `frontend/src/pages/ChatPage.tsx`, and `frontend/src/components/`
- Auth changes:
  - Start in `frontend/src/lib/supabase.ts`, `frontend/src/lib/authRedirect.ts`, `frontend/src/lib/api.ts`, `backend/.../config/SecurityConfig.java`, and `backend/.../web/PublicAuthController.java`
- Realtime/chat changes:
  - Start in `frontend/src/hooks/useStompRoom.ts`, `frontend/src/pages/ChatPage.tsx`, `backend/.../ws/`, `backend/.../web/AuthController.java`, `backend/.../web/RoomController.java`, and `backend/.../service/MessageService.java`
- Room/member/join-request changes:
  - Start in `frontend/src/pages/ChatPage.tsx`, `frontend/src/components/views/ChatView.tsx`, `backend/.../web/RoomController.java`, and `backend/.../service/RoomService.java`
- Profile/people/friends changes:
  - Start in `frontend/src/components/views/PeopleView.tsx`, `ProfileView.tsx`, `backend/.../web/ProfileController.java`, `FriendController.java`, and `backend/.../service/ProfileService.java` plus `FriendService.java`
- Quest/leaderboard/progression changes:
  - Start in `frontend/src/components/views/QuestsView.tsx`, `BoardView.tsx`, `LevelsView.tsx`, `backend/.../web/QuestController.java`, `LeaderboardController.java`, `backend/.../service/QuestService.java`, and `ProgressionService.java`
- Igris changes:
  - Start in `frontend/src/components/views/IgrisView.tsx`, `frontend/src/pages/ChatPage.tsx`, `backend/.../web/IgrisController.java`, and `backend/.../service/IgrisService.java`

## Phase 1 Features (Completed)

All six Phase 1 chat quality-of-life features are fully implemented:
1. **Reactions** — emoji toggle on messages, real-time broadcast, pill display
2. **Mentions** — `@username` autocomplete, highlight, mention notifications
3. **Pinned messages** — pin/unpin by owner/admin, `PinnedMessageBanner`, real-time `PIN_CHANGED` event
4. **Room mute** — per-room mute toggle in header, muted rooms skip notifications
5. **Draft persistence** — per-room drafts in `localStorage`, draft indicator in sidebar
6. **Message search v1** — ILIKE search within room via `SearchModal` (triggered by search icon in room header)

## Friendship State Machine

States returned by `FriendService.friendshipState()` and present in `Profile.friendshipState`:
- `none` — no relationship
- `outgoing` — current user sent request
- `incoming` — other user sent request
- `accepted` — friends
- `blocked_by_me` — current user blocked them (stored as `status=blocked`, `requestedBy=blocker`)
- `blocked_by_them` — they blocked current user
- `self` — same user

`friendships.status` is a TEXT column with a CHECK constraint (not a PG enum). Adding new states requires a Flyway migration to ALTER the constraint. Current highest migration: **V16** (`daily_message_digest`). Next is **V17**.

## Flyway Safety Rule

- Never edit, rename, replace, or reuse an existing Flyway migration version after it has been committed or deployed.
- New schema work must always use the next unused version number in `backend/src/main/resources/db/migration/`.
- Before deploy, scan the migration folder for duplicate version prefixes like two `V14__...` files.
- If production already ran a migration, preserve that file exactly and add a new corrective migration instead of mutating history.

## Key API Endpoints (Friends / Rooms)

```
GET    /api/friends                    — all friendships (all statuses incl. blocked)
POST   /api/friends/{id}/request       — send friend request
POST   /api/friends/{id}/accept        — accept
DELETE /api/friends/{id}               — unfriend
POST   /api/friends/{id}/block         — block
DELETE /api/friends/{id}/block         — unblock
POST   /api/rooms/{id}/read            — mark DM read (updates last_read_at in room_members)
GET    /api/rooms/{id}/messages?before=&limit=  — paginated messages
GET    /api/rooms/{id}/messages/search?q=&limit= — full-text search within room (ILIKE)
PATCH  /api/rooms/{id}/mute            — toggle mute for calling user
POST   /api/messages/{id}/reactions    — toggle emoji reaction (body: {emoji})
GET    /api/rooms/{id}/pins            — list pinned messages
POST   /api/rooms/{id}/pins            — pin a message (body: {messageId}); owner/admin only
DELETE /api/rooms/{id}/pins/{messageId} — unpin a message; owner/admin only
```

## Real-time Events (WsMessagePayload)

Types: `MESSAGE_CREATED`, `MESSAGE_UPDATED`, `MESSAGE_DELETED`, `TYPING`, `ROOM_READ`

`ROOM_READ` is broadcast when a DM is marked read; updates `peerLastReadAt` on the Room in the query cache. Handler in `onWsEvent()` in ChatPage.tsx.

## CSS Design Tokens (common `--pm-*` variables)

```
--pm-accent / --pm-accent-dim     teal primary / faded background
--pm-bg-card / --pm-bg-elevated / --pm-bg-mid   surface hierarchy
--pm-border / --pm-border-soft / --pm-border-glow  border variants
--pm-text / --pm-text-soft / --pm-text-muted    text hierarchy
--pm-online      green status dot
--pm-gold / --pm-gold-dim   quest/reward accent
--pm-r-md / --pm-r-lg / --pm-r-pill   border radii
```

Responsive breakpoints: `960px` (sidebar becomes drawer, mobile layout), `768px` (hamburger menu appears).

## Frontend Conventions

- **Dropdown menus**: Use `onMouseDown` (not `onClick`) on items to avoid blur-before-click race. Close on outside click via `useRef` + `document.addEventListener('mousedown', ...)` in `useEffect`.
- **All mutations**: Call `await refreshCore()` on success (invalidates all main query caches).
- **New modal pattern**: `.pm-modal-backdrop` (fixed overlay) + `.pm-modal` (card). Backdrop click closes, `stopPropagation` on the inner panel. See `ProfileModal.tsx`.
- **New view props**: Add to interface → destructure in function → wire in ChatPage JSX. Views never call the API directly.
- **Block enforcement**: `FriendService.isBlockedBetween()` used in `MessageService.sendMessage()`. Blocked users excluded from `ProfileService.searchProfiles()`.

## Update Checklist

Update this file when you:

- add a new top-level feature area or workspace tab
- move ownership between frontend or backend modules
- add or remove major routes or controllers
- change auth or WebSocket flow
- change deployment or runtime architecture
- add new API endpoints, WS event types, or friendship states
