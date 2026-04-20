# Phase 2: Medium Complexity

Phase 2 focuses on features that improve message depth, room management, and overall social product quality. These changes usually touch multiple backend services and require more careful UI/UX design than Phase 1.

## Build Order

1. Threaded replies from existing `replyTo`
2. Media and attachment gallery per room
3. Richer room management and moderation
4. Advanced presence and read receipts UX
5. Saved and bookmarked messages
6. Better onboarding and social discovery prompts

## 1. Threaded Replies

### User Value

Threads keep rooms readable while still supporting deeper sub-conversations.

### Why It Matters Now

The data model already contains `replyTo`, so this feature can build on an existing concept rather than inventing a new messaging primitive.

### Current Related Code Areas

- Message model in `frontend/src/types/chat.ts`
- Chat rendering in `frontend/src/components/views/ChatView.tsx`
- Message validation in `backend/src/main/java/com/postmanchat/service/MessageService.java`

### Expected Touchpoints

- Add reply preview cards in the main stream
- Add focused thread view or side panel
- Expose parent-child message relationships cleanly in DTOs
- Keep initial implementation room-scoped, not cross-room

### Dependency Notes

- Strongly benefits from Phase 1 search and reactions, but is not blocked by them

## 2. Media And Attachment Gallery Per Room

### User Value

Users can browse shared media and documents without scrolling the entire message stream.

### Why It Matters Now

Attachments already exist, but discovery and reuse of them is weak.

### Current Related Code Areas

- Attachment rendering in `frontend/src/components/views/ChatView.tsx`
- Upload flow in `frontend/src/pages/ChatPage.tsx`
- Attachment handling in `backend/src/main/java/com/postmanchat/service/AttachmentService.java`

### Expected Touchpoints

- Add room-scoped media and file queries
- Separate image/video/document tabs or filters
- Reuse attachment metadata already returned by messages where possible

### Dependency Notes

- Pairs well with pinned messages and message search

## 3. Richer Room Management And Moderation

### User Value

Room owners and future admins need clearer tools to keep group spaces healthy and usable.

### Why It Matters Now

The app already has room ownership and join-request approval, but not a full admin-quality room management surface.

### Current Related Code Areas

- Room management in `frontend/src/components/views/ChatView.tsx`
- Room APIs in `backend/src/main/java/com/postmanchat/web/RoomController.java`
- Room membership and role logic in `backend/src/main/java/com/postmanchat/service/RoomService.java`

### Expected Touchpoints

- Add role-aware actions such as remove member, change room settings, and stronger room visibility controls
- Add moderation actions in group-room UI
- Keep the first pass focused on room governance, not trust-and-safety automation

### Dependency Notes

- Pinned messages should align with the same authorization model

## 4. Advanced Presence And Read Receipts UX

### User Value

Users get clearer signals about whether conversations are being seen and whether friends are currently around.

### Why It Matters Now

Presence and read tracking already exist in the codebase, but the UX can become much more informative.

### Current Related Code Areas

- Presence updates and unread state in `frontend/src/pages/ChatPage.tsx`
- Existing read and typing payloads in shared message/websocket types
- Backend room read and notification flows

### Expected Touchpoints

- Improve DM read receipts
- Improve group unread and “last seen” presentation
- Avoid building surveillance-heavy UX; keep signals lightweight and socially safe

### Dependency Notes

- Depends more on UX decisions than on deep new backend foundations

## 5. Saved And Bookmarked Messages

### User Value

Users can keep important messages for later without pinning them for the whole room.

### Why It Matters Now

This complements pins, media browsing, and search, and is useful in both DMs and groups.

### Current Related Code Areas

- Message interaction surfaces in `frontend/src/components/views/ChatView.tsx`
- Message identity and room membership flows in backend message/room services

### Expected Touchpoints

- Add user-specific saved-message storage
- Add save/unsave message actions
- Add a saved-items view or filter

### Dependency Notes

- Best introduced after message actions feel more complete from Phase 1

## 6. Better Onboarding And Social Discovery Prompts

### User Value

New users understand what to do next and are more likely to form useful connections early.

### Why It Matters Now

The app already has onboarding, people search, quests, and Igris, but they are not yet unified into a stronger activation loop.

### Current Related Code Areas

- Tutorial flow in `frontend/src/hooks/useTutorial.tsx`
- People discovery in `frontend/src/components/views/PeopleView.tsx`
- Quest surfaces in `QuestsView.tsx`
- Igris experience in `IgrisView.tsx`

### Expected Touchpoints

- Add first-week prompts for finding friends, joining rooms, and claiming simple quests
- Use Igris and quests as activation tools, not isolated features
- Keep onboarding adaptive rather than purely linear

### Dependency Notes

- Works best once some of the baseline chat gaps in Phase 1 are closed
