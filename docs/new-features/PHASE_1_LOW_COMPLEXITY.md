# Phase 1: Low Complexity

Phase 1 focuses on essential chat features that fit the current message, room, notification, and workspace model with low architectural risk.

## Build Order

1. Reactions
2. Mentions and mention notifications
3. Pinned messages
4. Room mute and notification preferences
5. Draft persistence per room
6. Message search v1

## 1. Reactions

### User Value

Reactions improve lightweight engagement, reduce message clutter, and make rooms feel more alive without forcing full replies.

### Why It Matters Now

This is a baseline expectation in modern chat products and a low-friction engagement multiplier.

### Current Related Code Areas

- Frontend message rendering in `frontend/src/components/views/ChatView.tsx`
- Message state orchestration in `frontend/src/pages/ChatPage.tsx`
- Shared message contracts in `frontend/src/types/chat.ts`
- Backend message lifecycle in `backend/src/main/java/com/postmanchat/service/MessageService.java`

### Expected Touchpoints

- Add reaction data to message-facing DTOs and frontend message types
- Add REST endpoints or message actions for add/remove reaction
- Optionally broadcast reaction updates over the existing room topic
- Render compact reaction chips below messages

### Dependency Notes

- Best implemented before pinned messages and search so message metadata can evolve early

## 2. Mentions And Mention Notifications

### User Value

Mentions make group rooms actionable and help users pull specific people into active conversations.

### Why It Matters Now

Group rooms become more useful only when people can target attention cleanly.

### Current Related Code Areas

- Composer and message submit flow in `frontend/src/components/views/ChatView.tsx`
- Message send path in `frontend/src/pages/ChatPage.tsx`
- Notification fetch/read flow in `frontend/src/pages/ChatPage.tsx`
- Notification creation in `backend/src/main/java/com/postmanchat/service/NotificationService.java`

### Expected Touchpoints

- Parse `@username` or stable user references at send time
- Create mention-targeted notifications when a mentioned user is in the room
- Add visual mention highlighting in message rendering
- Extend notification types rather than building a separate notification subsystem

### Dependency Notes

- Can share notification plumbing with room mute preferences

## 3. Pinned Messages

### User Value

Pinned messages give rooms a way to keep important context visible without repeating instructions.

### Why It Matters Now

Group rooms already exist; they need a lightweight memory surface for rules, links, and key updates.

### Current Related Code Areas

- Room-level UI in `frontend/src/components/views/ChatView.tsx`
- Room data and room actions in `frontend/src/pages/ChatPage.tsx`
- Room APIs in `backend/src/main/java/com/postmanchat/web/RoomController.java`
- Room logic in `backend/src/main/java/com/postmanchat/service/RoomService.java`

### Expected Touchpoints

- Add room-level pinned message relationship or a small pin table
- Expose list, pin, and unpin operations in room APIs
- Show a compact pinned strip or pinned panel in the chat view

### Dependency Notes

- Should respect future moderation roles, so keep authorization owner/admin-aware

## 4. Room Mute And Notification Preferences

### User Value

Users can stay in rooms without being overloaded by noise.

### Why It Matters Now

Notifications already exist; the missing piece is control, not transport.

### Current Related Code Areas

- Settings and notification UI in `frontend/src/components/views/SettingsView.tsx` and `BoardView.tsx`
- Notification reads in `frontend/src/pages/ChatPage.tsx`
- Notification creation in backend notification services

### Expected Touchpoints

- Add per-room preference storage
- Skip non-critical notifications for muted rooms
- Add simple room-level mute toggles first, not a full notification rules engine

### Dependency Notes

- Mention notifications should define whether they bypass mute or not; default to bypassing only if later required

## 5. Draft Persistence Per Room

### User Value

Users do not lose half-written thoughts when switching rooms or tabs.

### Why It Matters Now

The app already encourages multi-room activity and side navigation.

### Current Related Code Areas

- Draft state in `frontend/src/pages/ChatPage.tsx`
- Composer UI in `frontend/src/components/views/ChatView.tsx`

### Expected Touchpoints

- Store draft state keyed by room id in local storage
- Restore draft automatically when switching rooms
- Keep this frontend-only in v1

### Dependency Notes

- No backend work required for v1

## 6. Message Search V1

### User Value

Users can find prior messages instead of treating rooms as ephemeral streams.

### Why It Matters Now

The app already supports enough messaging volume that retrieval matters.

### Current Related Code Areas

- Top-bar search patterns in `frontend/src/components/layout/TopBar.tsx`
- Chat room selection/search in `frontend/src/components/views/ChatView.tsx`
- Message listing in `backend/src/main/java/com/postmanchat/service/MessageService.java`
- Message repository access patterns in `backend/src/main/java/com/postmanchat/repo/MessageRepository.java`

### Expected Touchpoints

- Add a backend message search endpoint with room-aware filtering
- Start with text search and recent-result UX, not advanced indexing
- Add a simple search surface inside the chat workspace rather than overloading the top-bar navigation search

### Dependency Notes

- Do this after message metadata work for reactions and pins settles
