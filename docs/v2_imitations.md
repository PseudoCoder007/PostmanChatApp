# V2 Limitations

This document lists the main limitations in the current PostmanChat architecture and the practical fixes needed for a stronger V2.

## 1. Single backend instance

### Limitation

The app currently runs as a single Spring Boot instance behind one containerized service. This makes the system vulnerable to:

- one-node downtime
- limited vertical scaling
- no safe horizontal scale for realtime sessions

### Current evidence

- `docker-compose.yml` defines one `postman-chat` service.
- WebSocket state and ticket handling are local to the running JVM.

### Solution

- Run multiple backend instances behind Nginx or a cloud load balancer.
- Add health-based rolling deployment.
- Move node-local realtime/session state out of process.

## 2. In-memory WebSocket ticket storage

### Limitation

WebSocket tickets are stored in memory in `WsTicketService`. That means:

- tickets only work on the node that created them
- restarting the app invalidates all pending tickets
- multiple backend instances will break handshake flow unless requests stay sticky

### Current evidence

- `backend/src/main/java/com/postmanchat/security/WsTicketService.java`

### Solution

- Store WS tickets in Redis or another shared fast store with TTL.
- Alternatively sign tickets statelessly and validate them without local memory.
- If scaling temporarily, use sticky sessions only as a short-term workaround.

## 3. Spring simple broker for realtime

### Limitation

Realtime messaging uses Spring's simple in-memory broker. This is acceptable for small deployments, but it becomes a bottleneck when concurrent rooms, subscriptions, and fanout increase.

### Risks

- broker memory grows inside one JVM
- no broker sharing across nodes
- limited observability and backpressure handling
- large group rooms can amplify message fanout cost

### Current evidence

- `backend/src/main/java/com/postmanchat/ws/WebSocketConfig.java` uses `enableSimpleBroker("/topic")`

### Solution

- Move to a broker-backed architecture such as RabbitMQ, Redis pub/sub, or Kafka-backed fanout depending on scale goals.
- Keep STOMP only if needed; otherwise consider a leaner websocket event model.
- Add metrics for active connections, subscriptions, dropped sessions, and broadcast latency.

## 4. Small database connection pool

### Limitation

The backend uses a Hikari maximum pool size of 10. That is a hard throughput bottleneck once active users are performing concurrent room loads, message loads, reactions, notifications, and presence updates.

### Current evidence

- `backend/src/main/resources/application.yml` sets `maximum-pool-size: 10`

### Solution

- Increase the DB pool only after checking Supabase/Postgres connection limits.
- Add PgBouncer or another pooling layer if needed.
- Load test to find the safe pool size for your deployment.
- Reduce unnecessary query volume before just increasing pool count.

## 5. High query volume from the frontend

### Limitation

The frontend performs multiple background fetches and refreshes:

- profile load
- rooms load
- messages load
- friendship polling
- notification polling
- presence heartbeat
- room request fetches for owners

This creates steady database and API pressure even when users are mostly idle.

### Current evidence

- `frontend/src/pages/ChatPage.tsx`

### Solution

- Replace polling-heavy flows with websocket-driven cache updates where possible.
- Add query deduplication and more selective invalidation.
- Reduce refetch frequency for non-critical data.
- Add pagination and lazy loading for any lists that can grow large.

## 6. Message send path is too expensive

### Limitation

A single message send currently triggers several operations:

- membership check
- block check
- message insert
- optional attachment link
- progression update
- quest update
- inactive-member notification generation
- mention detection
- websocket broadcast

This increases latency and reduces throughput under load.

### Current evidence

- `backend/src/main/java/com/postmanchat/service/MessageService.java`

### Solution

- Keep message persistence and authorization in the synchronous path.
- Move secondary work to async jobs:
  - notifications
  - email
  - mention fanout
  - progression side effects
  - quest side effects
- Add queue-based background processing for non-blocking tasks.

## 7. Notification fanout can become N-per-message work

### Limitation

When a message is sent, the code loops through room members and creates notifications for inactive users. For larger rooms this becomes expensive quickly.

### Risks

- more DB reads per message
- more writes per message
- slower send latency in group rooms

### Current evidence

- `createNotificationsForInactiveMembers(...)` in `MessageService.java`
- `NotificationService.java`

### Solution

- Move notification fanout to async processing.
- Batch notification creation where possible.
- Add room-size-aware policies so very large rooms use digest or mention-only notifications.

## 8. Search is not ready for large message volumes

### Limitation

Message search uses case-insensitive `LIKE` matching within a room. This works for low volume but degrades as message history grows.

### Current evidence

- `backend/src/main/java/com/postmanchat/repo/MessageRepository.java`

### Solution

- Add PostgreSQL full-text search or trigram indexes.
- Consider a dedicated search service if search becomes a primary feature.
- Index the fields used for room and timeline queries.

## 9. Global message rate limiting may throttle the whole app

### Limitation

The send-message endpoint is protected with one named rate limiter. Depending on configuration behavior at runtime, this can act like a shared app-level limiter rather than a per-user limiter.

### Current evidence

- `backend/src/main/resources/application.yml`
- `backend/src/main/java/com/postmanchat/web/RoomController.java`

### Solution

- Confirm whether the limiter is effectively global or per caller.
- Replace it with user-aware rate limiting keyed by user ID and optionally IP.
- Use separate rules for DMs, groups, typing, and burst handling.

## 10. Presence updates create background write traffic

### Limitation

The frontend posts presence updates every 60 seconds while active. As user count grows, this becomes continuous write traffic even when users are not chatting.

### Current evidence

- `frontend/src/pages/ChatPage.tsx`

### Solution

- Update presence on meaningful events instead of constant heartbeat-only writes.
- Use websocket connect/disconnect plus coarse refresh windows.
- Consider in-memory presence with periodic reconciliation to the database.

## 11. ChatPage is a large orchestration hotspot

### Limitation

`ChatPage.tsx` owns many unrelated responsibilities: queries, mutations, UI state, realtime handlers, notifications, profile state, Igris state, uploads, drafts, and room behavior.

This makes scaling the product harder at the code level even if infrastructure improves.

### Risks

- slower feature delivery
- harder debugging
- higher regression risk
- more accidental re-render and state coupling problems

### Solution

- Split `ChatPage` into feature-focused hooks and state modules.
- Separate data orchestration from rendering.
- Move websocket cache handling into dedicated hooks or service adapters.

## 12. Limited production observability

### Limitation

The app exposes health/info/prometheus, but the repo does not show a full production monitoring and alerting setup for realtime scale.

### Missing areas

- websocket connection metrics
- DB saturation alerts
- per-endpoint latency
- queue depth
- fanout latency
- error-rate dashboards

### Solution

- Add dashboards for CPU, memory, DB pool usage, query latency, websocket sessions, and send-message latency.
- Add alerts for pool exhaustion, elevated error rate, and reconnect spikes.
- Run regular load tests and record performance baselines.

## 13. No evidence of load-testing baseline

### Limitation

The repo does not currently show a validated concurrency benchmark or a repeatable load test for HTTP plus realtime behavior.

### Solution

- Add k6, Gatling, or JMeter scenarios for:
  - login/session bootstrap
  - room list fetch
  - message pagination
  - websocket connect and subscribe
  - send message under fanout
  - presence heartbeat
- Define target profiles such as:
  - 100 idle connected users
  - 50 active chatters
  - 10 busy group rooms
- Record p50, p95, p99 latency and error rates.

## Recommended V2 Priority Order

1. Add real load testing and measure current limits.
2. Reduce frontend polling and unnecessary DB traffic.
3. Move notification and side effects off the synchronous message path.
4. Replace in-memory WS ticketing with shared or stateless validation.
5. Replace the simple broker for multi-instance realtime scaling.
6. Introduce proper observability and alerting.
7. Revisit DB pooling, indexing, and search strategy.

## Bottom line

The current version is appropriate for a small single-server deployment, but it is not yet designed for high-scale realtime concurrency. The main V2 work is not cosmetic UI work; it is architecture work around realtime, background jobs, database pressure, and operational visibility.
