# Feature Gap Audit

## Summary

PostmanChat already has more product shape than a basic chat clone. The current codebase supports direct messages, group rooms, room discovery, join requests, attachments, typing indicators, notifications, read tracking, progression, quests, leaderboard, feedback, profile management, and the Igris AI companion. The main gaps are standard chat quality-of-life features plus a stronger layer of differentiated social mechanics.

## Existing Implemented Features

- Direct messages and friend-gated DM creation
- Group rooms with public/private visibility
- Room discovery and join-request flow
- Realtime room messaging over STOMP WebSockets
- Message edit and delete
- Attachments for images, videos, and documents
- Typing indicators
- Read tracking events and DM read state
- Notifications and unread state
- Presence updates
- Profile search and username availability checks
- Quests, XP, coins, levels, and leaderboard
- Feedback submission flow
- Igris AI chat and Igris history
- Theme, sound, onboarding, and mobile/sidebar workspace behavior

## Partially Present But Under-Realized

### Replies Exist, But Not Full Threading

- Current evidence:
  - `frontend/src/types/chat.ts` includes `replyTo`
  - `backend/src/main/java/com/postmanchat/domain/Message.java` stores `replyTo`
  - `backend/src/main/java/com/postmanchat/service/MessageService.java` validates same-room replies
- Gap:
  - the product has reply plumbing, but not a proper threaded UX, reply preview stack, or reply-focused navigation

### Search Exists, But Only As Navigation Search

- Current evidence:
  - `frontend/src/components/layout/TopBar.tsx` searches app tabs and features
  - `frontend/src/components/views/ChatView.tsx` filters room/DM lists
  - `backend/src/main/java/com/postmanchat/web/ProfileController.java` supports people search
- Gap:
  - there is no real message-search experience across rooms, conversations, or attachments

### Notifications Exist, But Not Preference Controls

- Current evidence:
  - notifications are fetched in `frontend/src/pages/ChatPage.tsx`
  - `backend/src/main/java/com/postmanchat/web/NotificationController.java` supports list and mark-read
  - `backend/src/main/java/com/postmanchat/service/NotificationService.java` and `EmailNotificationService.java` already exist
- Gap:
  - there is no per-room mute, priority, quiet hours, or notification-category preference layer

## Clearly Missing Essentials

- Reactions
- Mentions and mention-specific notifications
- Global message search
- Pinned messages
- Room mute and notification preferences
- Moderation and admin controls beyond current ownership/join approval behavior
- Attachment/media gallery per room
- Draft persistence per room
- Saved or bookmarked messages

## Unique Product Opportunities

- Igris social wingman
  - reply suggestions, conversation rescue, awkward-message coaching, and reconnection prompts
- Connection quests
  - socially meaningful quests that encourage reconnection, welcoming others, or helping inactive friends
- Mood-based room modes
  - rooms that explicitly behave as focus, support, chaos, study, or recovery spaces
- Proof-based IRL quests
  - photo/action-backed quests tied to social or self-improvement goals
- Conversation energy or momentum system
  - detect dead rooms, one-sided conversations, and room activity health
- Friend chemistry insights
  - show who you connect with most, who is drifting, and where reconnection is likely valuable
- Squad arcs and room-level progression
  - group campaigns, seasonal goals, or shared unlocks
- Opt-in memory summaries
  - help users resume important social context with friends or groups

## Recommended Strategic Reading

- Start with Phase 1 if the goal is better baseline chat quality
- Start with Phase 3 if the goal is stronger product differentiation
- Use a balanced sequence overall: finish the top of Phase 1 before expanding deeply into Phase 3
