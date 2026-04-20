# Phase 3: High-Impact Differentiators

Phase 3 is where PostmanChat becomes meaningfully different from mainstream chat apps. These features should build on the more stable messaging foundation from Phases 1 and 2.

## Build Order

1. Igris conversation rescue and reply coaching
2. Igris group facilitation and room momentum prompts
3. Connection quests and reconnection loops
4. Mood-based room modes with adaptive Igris behavior
5. Proof-based real-life social and self-improvement quests
6. Squad arcs and room-level progression campaigns
7. Friend chemistry and reconnect insights

## 1. Igris Conversation Rescue And Reply Coaching

### User Value

Users get help when conversations feel awkward, dead, high-stakes, or emotionally difficult.

### Why It Matters Now

This is one of the strongest opportunities to make Igris feel useful beyond generic chatbot novelty.

### Current Related Code Areas

- Igris UI in `frontend/src/components/views/IgrisView.tsx`
- Igris orchestration in `frontend/src/pages/ChatPage.tsx`
- AI logic in `backend/src/main/java/com/postmanchat/service/IgrisService.java`

### Expected Touchpoints

- Add optional “help me reply” and “unstick this chat” flows
- Keep suggestions opt-in and user-controlled
- Reuse existing Igris chat infrastructure instead of building a second AI subsystem

### Dependency Notes

- Works better after message search, richer room context, and stronger social signals exist

## 2. Igris Group Facilitation And Room Momentum Prompts

### User Value

Rooms get nudges that revive dead chats, welcome new members, and maintain energy without relying entirely on human moderators.

### Why It Matters Now

This builds on the room model and can create a more alive community product.

### Current Related Code Areas

- Room activity lives mostly in `frontend/src/pages/ChatPage.tsx`
- Group-room backend logic lives in room and message services
- Igris prompt strategy lives in `IgrisService.java`

### Expected Touchpoints

- Detect stale rooms or low-response situations
- Offer suggested prompts, questions, mini-challenges, or welcome nudges
- Keep the first version assistive, not auto-posting by default

### Dependency Notes

- Depends on decent room metadata and possibly room-level analytics signals

## 3. Connection Quests And Reconnection Loops

### User Value

The product actively encourages healthier and more frequent human connection.

### Why It Matters Now

Quests already exist; the next step is making them socially meaningful rather than only mechanically rewarding.

### Current Related Code Areas

- Quest generation and completion in `backend/src/main/java/com/postmanchat/service/QuestService.java`
- Progression and rewards in `ProgressionService.java`
- Friend graph in `FriendService.java`

### Expected Touchpoints

- Introduce quests around reconnecting, welcoming, replying, helping, or sustaining streaks
- Use friend and room context to generate more relevant missions
- Preserve the existing reward loop of XP and coins

### Dependency Notes

- Stronger once mentions, reactions, and search exist

## 4. Mood-Based Room Modes With Adaptive Igris Behavior

### User Value

Rooms feel intentionally different depending on whether they are for support, focus, chaos, study, or recovery.

### Why It Matters Now

This gives rooms identity beyond just privacy and member count.

### Current Related Code Areas

- Room model and room settings in backend room domain/service layers
- Chat and room display logic in `ChatView.tsx`
- Igris behavior control in `IgrisService.java`

### Expected Touchpoints

- Add a room-mode concept to room settings
- Adjust UI copy, prompts, and Igris behavior by room mode
- Keep the first set of modes small and opinionated

### Dependency Notes

- Pairs naturally with facilitation prompts and moderation improvements

## 5. Proof-Based Real-Life Social And Self-Improvement Quests

### User Value

The app becomes more than a chat tool by helping users take small real-world actions and return with proof.

### Why It Matters Now

The product already has attachments, quests, and Igris language that points in this direction.

### Current Related Code Areas

- Attachment system
- Quest triggers and completion logic
- Igris quest idea generation

### Expected Touchpoints

- Add quest types that accept photo or file proof
- Allow Igris to suggest optional real-world challenges
- Keep proof lightweight and user-friendly in v1

### Dependency Notes

- Needs careful UX so it feels motivating, not gimmicky

## 6. Squad Arcs And Room-Level Progression Campaigns

### User Value

Groups work toward a shared arc, making rooms feel like teams with momentum and identity.

### Why It Matters Now

This leverages your existing progression systems better than a purely individual XP model.

### Current Related Code Areas

- Group rooms
- Quest and progression systems
- Leaderboard surfaces

### Expected Touchpoints

- Add room-level goals, seasonal campaigns, or collective unlocks
- Expose progress in group-room UI and leaderboard-adjacent surfaces
- Keep the first version campaign-based rather than endlessly configurable

### Dependency Notes

- Best after foundational room-management and social mechanics are stronger

## 7. Friend Chemistry And Reconnect Insights

### User Value

Users can see which relationships are active, fading, or promising, and get a reason to reconnect.

### Why It Matters Now

This is a strong retention feature if done carefully and respectfully.

### Current Related Code Areas

- Friend relationships in `FriendService.java`
- Presence and message activity in room/message flows
- Igris and quest systems for prompting action

### Expected Touchpoints

- Build lightweight relationship insights from message frequency, recency, and interaction signals
- Present suggestions as supportive prompts, not invasive scoring
- Feed the insights into quests and Igris recommendations

### Dependency Notes

- Should come after enough social metadata exists to avoid weak or misleading insights
