# PostmanChat v2.3 — "Connected, Secure & Alive"
## Phase 1.5 Implementation Plan

Release status: shipped in `v2.3.0` on `2026-04-23`

---

## Context

Phase 1 (reactions, mentions, pins, mute, draft persistence, room search) is complete. Phase 2 features like threaded replies require heavy multi-service coordination. This plan ships v2.3 — a focused bridge release of seven features that make PostmanChat feel more social (voice messages, user status, mutual friends), more connected (message forwarding), safer (security hardening + user reporting), and more alive (activity signals). Every feature reuses existing patterns and infrastructure with minimal schema risk.

Version name: **v2.3 "Connected, Secure & Alive"**

---

## Scope — 7 Features

| # | Feature | Schema | Risk |
|---|---------|--------|------|
| 0 | **Security Hardening** — sign-out-all, link interstitial, rate limits | None | Low |
| 1 | **Custom User Status** — emoji + text on profiles | V17 (2 cols on profiles) | Low |
| 2 | **Mutual Friends Display** — stacked avatars + count in ProfileModal | None | Low |
| 3 | **Voice Messages** — mic → MediaRecorder → audio player | None (reuses attachments) | Medium |
| 4 | **Message Forwarding** — `…` hover menu → room picker → forwarded banner | V18 (1 col on messages) | Medium |
| 5 | **User Report & Flag System** — reason picker → reports table queue | V19 (new reports table) | Low |
| 6 | **Activity & Engagement Signals** — Active badge, streak flame, away banner | None (+ `lastMessageAt` on RoomDto) | Low |

**E2E Encryption decision:** True E2E (Signal Protocol / libsodium) would break Igris, server-side search, and notification previews. Deferred to v3.0 as a dedicated architectural milestone. v2.3 ships lightweight hardening in Feature 0 instead.

**Explicitly deferred from v2.3:** full E2E encryption, admin moderation panel, voice transcription, real-time status WS push events, room-name in forwarded banner, streak for all sidebar DMs simultaneously, push notification differentiation for forwards.

---

## Build Order

0. **Security Hardening** — no schema change, no risk, ships immediately.
1. **Custom User Status** — warms up the migration pipeline; confirms `ProfileDto` record extension pattern compiles at all 6 `DtoMapper` call sites before Features 4/5 touch `MessageDto`.
2. **Mutual Friends** — pure read query, no migration, zero risk, delivers visible social value quickly.
3. **Voice Messages** — reuses existing `AttachmentService` upload pipeline; no backend changes at all.
4. **Message Forwarding** — scaffolds the per-message `…` hover menu that Feature 5 also needs.
5. **User Report & Flag** — shares the per-message menu built in Feature 4.
6. **Activity Signals** — entirely client-side except `lastMessageAt` on `RoomDto`; safe to add last.

---

## Flyway Migrations

Current highest: **V16**. V14 was intentionally skipped — do not fill it.

```
V17__user_status.sql
V18__message_forwarding.sql
V19__reports.sql
```

Never edit, rename, or reuse an existing migration. Run `check_flyway_migrations.sh` before every deploy.

---

## Feature 0 — Security Hardening

### Goal
Three targeted security improvements with no schema change: "Sign out everywhere" in Settings, an external link safety interstitial in the chat, and extended Resilience4j rate limiting on friend and report endpoints.

### 0a — "Sign out everywhere" Session Control

**Backend — new endpoint in `web/AuthController.java` (or `web/PublicAuthController.java`):**
```
POST /api/auth/sign-out-all  →  204 No Content
```
Implementation: call Supabase Admin API `DELETE /auth/v1/users/{userId}/sessions` (or `signOut` with `scope: global`) using the existing Supabase service-role key already stored in `application.yml`. Returns 204.

**Frontend — `components/views/SettingsView.tsx`:**
- Add a "Security" section.
- Button: `pm-btn pm-btn--ghost` with `color: var(--pm-danger)` — "Sign out of all devices".
- On click: show confirmation modal ("This will sign you out on all devices. Continue?").
- On confirm: `POST /api/auth/sign-out-all` → then call Supabase client `supabase.auth.signOut()` locally → redirect to `/login`.

### 0b — External Link Safety Interstitial

**Frontend only — `components/views/ChatView.tsx`:**
- Detect external URLs in message content via regex `https?://[^\s]+` — intercept clicks via event delegation on the message bubble element.
- For attachment links (`attachment.publicUrl`) that do NOT match `window.location.hostname`.
- On click: show a `.pm-modal-backdrop` + `.pm-modal` with:
  - Heading: "Leaving PostmanChat"
  - Truncated URL (60 chars) in `.pm-link-interstitial-url`
  - "Open link" → `window.open(url, '_blank', 'noopener,noreferrer')`
  - "Cancel" ghost button

**New CSS:**
```css
.pm-link-interstitial-url {
  font-size: 12px;
  word-break: break-all;
  color: var(--pm-text-muted);
  background: var(--pm-bg-mid);
  border-radius: var(--pm-r-md);
  padding: 8px 12px;
  margin: 8px 0;
}
```

### 0c — Extended Rate Limiting

**Backend — `application.yml`:** Add two new Resilience4j instances:
```yaml
resilience4j:
  ratelimiter:
    instances:
      friendRequest:
        limit-for-period: 10
        limit-refresh-period: 1m
        timeout-duration: 0s
      submitReport:
        limit-for-period: 5
        limit-refresh-period: 1m
        timeout-duration: 0s
```

- Add `@RateLimiter(name = "friendRequest")` to `FriendController.sendRequest()`.
- Add `@RateLimiter(name = "submitReport")` to `ReportController.submit()` (used in Feature 5).

---

## Feature 1 — Custom User Status

### Goal
Users set a short status line + emoji visible on their profile card and in the people list.

### Flyway V17
```sql
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS status_text  VARCHAR(80),
    ADD COLUMN IF NOT EXISTS status_emoji VARCHAR(8);
```

### Backend Changes
| File | Change |
|------|--------|
| `domain/Profile.java` | Add `statusText` (VARCHAR 80) and `statusEmoji` (VARCHAR 8) fields + getters/setters |
| `web/dto/ProfileDto.java` | Add `String statusText`, `String statusEmoji` as new record components |
| `service/DtoMapper.java` | Update all **6** `toProfileDto()` call sites — compiler catches any miss |
| `service/ProfileService.java` | Add `updateCurrentStatus(UpdateStatusRequest r)` — validate emoji ≤ 2 code points, save, return DTO |
| `web/MeController.java` | `PATCH /api/me/status` with body `{ statusText, statusEmoji }` |
| **New** `web/dto/UpdateStatusRequest.java` | `record UpdateStatusRequest(@Size(max=80) String statusText, @Size(max=8) String statusEmoji)` |

### Frontend Changes
| File | Change |
|------|--------|
| `types/chat.ts` | Add `statusText?: string \| null`, `statusEmoji?: string \| null` to `Profile` |
| `components/views/ProfileView.tsx` | "Your Status" card: text input + 12 preset emoji buttons + Clear + Save |
| `components/ProfileModal.tsx` | `{statusEmoji} {statusText}` in `.pm-profile-modal__custom-status` below username |
| `components/views/PeopleView.tsx` | Status line beneath friend username in list items |
| `index.css` | `.pm-profile-modal__custom-status`, `.pm-status-emoji-grid`, `.pm-status-emoji-btn`, `.pm-status-emoji-btn--active` |

**Preset emoji:** 🎯 🔥 💤 🎮 📚 🎵 ✈️ 🏋️ 🍕 😴 💻 🤝

**Key gotcha:** `ProfileDto` is a Java record. Missing any constructor arg causes a compile error. All 6 DtoMapper call sites in `ProfileService`, `FriendService`, and `RoomService` must be updated together.

---

## Feature 2 — Mutual Friends Display

### Goal
ProfileModal shows "4 mutual friends" with stacked mini-avatars.

### No migration needed.

### Backend Changes
| File | Change |
|------|--------|
| `repo/FriendshipRepository.java` | Add `findAcceptedFriendPairsByUser(@Param("userId") UUID userId)` JPQL query — accepted friendships only, LIMIT 100 |
| `service/FriendService.java` | Add `getMutualFriends(UUID targetUserId)` — intersect caller's friends ∩ target's friends, exclude blocked, return `MutualFriendsDto` |
| `web/FriendController.java` | `GET /api/friends/{userId}/mutual` → `MutualFriendsDto` |
| **New** `web/dto/MutualFriendsDto.java` | `record MutualFriendsDto(int count, List<ProfileDto> samples)` |

### Frontend Changes
| File | Change |
|------|--------|
| `types/chat.ts` | Add `interface MutualFriends { count: number; samples: Profile[] }` |
| `components/ProfileModal.tsx` | `useQuery(['mutual', profile.id], ...)` fires on modal open. Stacked `.pm-avatar--xs` + "N mutual friends" text |
| `index.css` | `.pm-avatar--xs` (20px), `.pm-avatar-stack` (negative-margin overlap), `.pm-profile-modal__mutual` |

**Scope limit:** Only shown in `ProfileModal` (on-demand). Not batch-fetched for every friend in the sidebar.

---

## Feature 3 — Voice Messages

### Goal
Mic button in composer → records audio → uploads via existing attachment flow → renders as audio player.

### No schema changes — reuses `AttachmentService` (accepts any MIME type).

**Voice vs. file distinction:** `contentType.startsWith('audio/')` in the renderer — zero schema change. Chrome: `audio/webm`, Firefox: `audio/ogg`, Safari: `audio/mp4` — all match.

### New File: `frontend/src/hooks/useVoiceRecorder.ts`
- `startRecording()` — `getUserMedia({ audio: true })`, `MediaRecorder` with `isTypeSupported()` probe, collects chunks, auto-stop at 120s, tracks elapsed via `setInterval`
- `stopRecording()` → returns `File` with browser-chosen MIME type
- `cancelRecording()` — discards chunks, releases stream
- Returns `{ isRecording, elapsedSeconds, startRecording, stopRecording, cancelRecording }`

### Frontend Changes
| File | Change |
|------|--------|
| `components/views/ChatView.tsx` | `Mic` button in `.pm-composer__actions`. During recording: red stop button + elapsed timer + cancel X. `AttachmentPreview` gains `audio/` branch: `<audio controls className="pm-voice-msg__player" />`. New props: `onSendVoice`, `voicePending` |
| `pages/ChatPage.tsx` | `handleVoiceSend(file)`: `uploadAttachment.mutateAsync` → `sendMessage.mutateAsync`. Pass `onSendVoice`, `voicePending` to ChatView |
| `index.css` | `.pm-voice-msg__player` (`accent-color: var(--pm-accent)`, `height: 36px`), `.pm-composer__record-btn` |

**Key gotcha:** `getUserMedia` requires HTTPS. Verify Nginx passes `X-Forwarded-Proto: https`. Block new recording while `sendPending` is true.

---

## Feature 4 — Message Forwarding

### Goal
`…` hover button → Forward → room picker → message copied to target room with "Forwarded" banner.

### Flyway V18
```sql
ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS forwarded_from_id UUID REFERENCES messages(id) ON DELETE SET NULL;
```

### Backend Changes
| File | Change |
|------|--------|
| `domain/Message.java` | Add `forwardedFromId` (UUID, nullable) + getter/setter |
| `web/dto/MessageDto.java` | Add `UUID forwardedFromId` record component |
| `service/DtoMapper.java` | Pass `m.getForwardedFromId()` in `toAttachmentMessageDto()` (2 call sites) |
| `service/MessageService.java` | Add `forwardMessage(UUID messageId, UUID targetRoomId)`: check membership in both rooms, `isBlockedBetween` on DM target, create new Message with same content + `forwardedFromId`, broadcast `MESSAGE_CREATED` |
| `web/MessageController.java` | `POST /api/messages/{id}/forward` body `{ targetRoomId }` |
| **New** `web/dto/ForwardMessageRequest.java` | `record ForwardMessageRequest(UUID targetRoomId)` |

### Frontend Changes
| File | Change |
|------|--------|
| `types/chat.ts` | Add `forwardedFromId?: string \| null` to `Message` |
| `components/views/ChatView.tsx` | `MoreHorizontal` hover button in `.pm-msg-bubble__meta` — same hover-reveal pattern as Pin/Reaction. State: `activeMenuMsgId`. Dropdown: `.pm-friend-menu` + `.pm-friend-menu__item`. Forward opens room-picker modal. Forwarded banner: `<div className="pm-forwarded-banner">⤷ Forwarded</div>` when `msg.forwardedFromId` is set |
| `pages/ChatPage.tsx` | `forwardMessage` mutation → `POST /api/messages/{id}/forward`. Pass `onForwardMessage`, `allRooms` to ChatView |
| `index.css` | `.pm-forwarded-banner` (muted teal accent `⤷`), `.pm-msg-menu` (`position: absolute; right: 0; bottom: calc(100% + 4px); z-index: 60`) |

**Key gotcha:** Forward copies `content` only — not binary attachments. State this in the picker modal UI.

---

## Feature 5 — User Report & Flag System

### Goal
`…` menu → Report → reason picker → `POST /api/reports` → toast. Reports queue in DB; no auto-action in v2.3.

### Flyway V19
```sql
CREATE TABLE reports (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_type   TEXT NOT NULL CHECK (target_type IN ('message', 'user')),
    target_id     UUID NOT NULL,
    reason        TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'impersonation', 'other')),
    notes         TEXT,
    status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_status    ON reports(status, created_at DESC);
CREATE INDEX idx_reports_submitter ON reports(submitter_id, created_at DESC);
```

### Backend Changes
| File | Change |
|------|--------|
| **New** `domain/Report.java` | `@Entity` — id, submitterId, targetType, targetId, reason, notes, status ("open"), createdAt |
| **New** `repo/ReportRepository.java` | `JpaRepository` + `existsBySubmitterIdAndTargetId()` for deduplication |
| **New** `service/ReportService.java` | `submitReport(r)` — validate enums, prevent self-report, deduplicate, save, return confirmation |
| **New** `web/ReportController.java` | `POST /api/reports` `@ResponseStatus(CREATED)` + `@RateLimiter(name = "submitReport")` |
| **New** `web/dto/CreateReportRequest.java` | `record CreateReportRequest(@NotBlank String targetType, @NotNull UUID targetId, @NotBlank String reason, @Size(max=500) String notes)` |

### Frontend Changes
| File | Change |
|------|--------|
| `types/chat.ts` | Add `interface ReportRequest { targetType: 'message'\|'user'; targetId: string; reason: string; notes?: string }` |
| `components/views/ChatView.tsx` | "Report" item in the `…` dropdown (built in F4). Opens report modal: 5 reason cards + optional notes textarea + Submit + Cancel |
| `pages/ChatPage.tsx` | `submitReport` mutation. `onSuccess: toast.success('Report submitted. Thank you.')`. Pass `onReportMessage` to ChatView |
| `index.css` | `.pm-report-reason-list`, `.pm-report-reason-item`, `.pm-report-reason-item--selected` (accent border) |

---

## Feature 6 — Activity & Engagement Signals

### Goal
Room "Active" badge in sidebar, DM streak flame icon, away-return banner.

### No migration needed.

### 6a — Room Active Badge

**Backend:** Add `lastMessageAt` (nullable `Instant`) to `RoomDto`. Populate via a **single batch query** in `RoomService.listMyRooms()`:
```sql
SELECT room_id, MAX(created_at) FROM messages WHERE room_id IN (:ids) GROUP BY room_id
```

Files: `web/dto/RoomDto.java`, `service/RoomService.java`, `service/DtoMapper.java`, `repo/MessageRepository.java`.

**Frontend (`ChatView.tsx`):**
```typescript
const isActive = room.lastMessageAt &&
  Date.now() - new Date(room.lastMessageAt).getTime() < 86_400_000;
```
Renders `<span className="pm-active-badge">Active</span>` next to room name.

**CSS:** `.pm-active-badge` — green (`--pm-xp`), pill shape, 9px font, subtle border.

### 6b — DM Day-Streak Flame

**Backend:** `GET /api/rooms/{roomId}/streak` → `StreakDto(int days)`. Native query gets distinct message dates for last 7 days, counts consecutive days from today backwards.

New files: `web/dto/StreakDto.java`. Changes: `web/RoomController.java`, `service/RoomService.java`.

**Frontend (`ChatPage.tsx`):** `useQuery(['streak', activeRoomId])` — only when active room is a DM. If `streak.days >= 3`, render 🔥 icon next to contact name in room header. Scoped to active room only (not all sidebar DMs).

### 6c — Away Return Banner

**Frontend only.** Uses `me.lastActiveAt` (already in Profile response):
```typescript
const awayThreshold = new Date(me.lastActiveAt).getTime();
const wasAway = Date.now() - awayThreshold > 2 * 60 * 60 * 1000;
const awayMessages = wasAway
  ? orderedMessages.filter(m =>
      new Date(m.createdAt).getTime() > awayThreshold && m.senderId !== me.id)
  : [];
```
Banner: "You were away — 12 messages since you left `[✕]`" — dismissible, resets on room change.

**CSS:** `.pm-away-banner` — `background: var(--pm-accent-dim)`, `border-bottom: 1px solid var(--pm-border-soft)`.

---

## New Files — Complete List

### Backend
```
domain/Report.java
repo/ReportRepository.java
service/ReportService.java
web/ReportController.java
web/dto/UpdateStatusRequest.java
web/dto/ForwardMessageRequest.java
web/dto/CreateReportRequest.java
web/dto/MutualFriendsDto.java
web/dto/StreakDto.java
db/migration/V17__user_status.sql
db/migration/V18__message_forwarding.sql
db/migration/V19__reports.sql
```

### Frontend
```
hooks/useVoiceRecorder.ts
```

---

## Existing Files Modified

### Backend
| File | What Changes |
|------|-------------|
| `domain/Profile.java` | + statusText, statusEmoji |
| `domain/Message.java` | + forwardedFromId |
| `web/dto/ProfileDto.java` | + statusText, statusEmoji record components |
| `web/dto/MessageDto.java` | + forwardedFromId record component |
| `web/dto/RoomDto.java` | + lastMessageAt record component |
| `service/DtoMapper.java` | Update toProfileDto (6 sites) + toAttachmentMessageDto (2 sites) |
| `service/ProfileService.java` | + updateCurrentStatus() |
| `service/FriendService.java` | + getMutualFriends() |
| `service/MessageService.java` | + forwardMessage() |
| `service/RoomService.java` | + getStreak() + lastMessageAt batch query in listMyRooms() |
| `web/MeController.java` | + PATCH /api/me/status |
| `web/FriendController.java` | + GET /api/friends/{userId}/mutual |
| `web/MessageController.java` | + POST /api/messages/{id}/forward |
| `web/RoomController.java` | + GET /api/rooms/{id}/streak |
| `web/AuthController.java` | + POST /api/auth/sign-out-all |
| `web/FriendController.java` | + @RateLimiter(name = "friendRequest") on sendRequest |
| `repo/FriendshipRepository.java` | + findAcceptedFriendPairsByUser() |
| `repo/MessageRepository.java` | + batch lastMessageAt query |
| `src/main/resources/application.yml` | + friendRequest + submitReport rate limiter instances |

### Frontend
| File | What Changes |
|------|-------------|
| `types/chat.ts` | + statusText/statusEmoji on Profile; + forwardedFromId on Message; + lastMessageAt on Room; + MutualFriends; + ReportRequest |
| `pages/ChatPage.tsx` | + handleVoiceSend, forwardMessage mutation, submitReport mutation, streak query, sign-out-all, new props |
| `components/views/ChatView.tsx` | + Mic button + recording UI; + audio/ renderer; + `…` message menu; + forward modal; + report trigger; + forwarded banner; + away banner; + active badge; + streak flame |
| `components/views/ProfileView.tsx` | + status picker card |
| `components/views/SettingsView.tsx` | + Security section with sign-out-all button |
| `components/ProfileModal.tsx` | + custom status display; + mutual friends section |
| `components/views/PeopleView.tsx` | + status text under friend username |
| `index.css` | All new `.pm-*` classes per feature |

---

## UI Consistency Rules

- **Buttons:** `pm-btn`. Primary = `pm-btn--primary`. Danger = ghost + `color: var(--pm-danger)`. Small = `pm-btn--sm`.
- **Modals:** `pm-modal-backdrop` + `pm-modal`. Backdrop click closes. `stopPropagation` on inner panel.
- **Dropdown menus:** `pm-friend-menu` + `pm-friend-menu__item`. Use `onMouseDown` (not `onClick`). Blur with 150ms delay.
- **Hover reveals:** `opacity: 0 → 1` — same as `pm-reaction-trigger` / `pm-pin-trigger`.
- **Toast:** `toast.success()` for confirms, `toast.error()` for failures. Never `alert()`.
- **Loading:** `pm-spinner` inline in button text during `isPending`.
- **Badges:** Activity signals use `--pm-xp` (green). Streak uses `--pm-gold`.
- **Empty states:** `pm-empty` + `pm-empty__icon` + `pm-empty__title` + `pm-empty__sub`.

---

## Verification Checklist

0. **Security:** External link in chat → interstitial appears → "Open link" opens in new tab. "Sign out everywhere" in Settings → confirmation → signs out + redirects to /login. Rapid friend requests > 10/min → 429. Rapid reports > 5/min → 429.
1. **Status:** Set status in ProfileView → appears in own ProfileModal. Clear → disappears. Peer's status visible in their ProfileModal and PeopleView list.
2. **Mutual friends:** Open ProfileModal on a friend-of-friend → count + avatars appear. Open on a stranger → section hidden.
3. **Voice:** Mic button → grant permission → record → stop → audio player appears in chat. Test Chrome + Firefox. Cancel flow works. Blocked recording when send is pending.
4. **Forwarding:** `…` on any message → Forward → pick a room → message appears with "Forwarded" banner. Blocked DM excluded from picker.
5. **Report:** `…` on any message → Report → select reason → Submit → toast appears. `reports` row in DB. Duplicate report handled gracefully (200, not 500).
6. **Activity signals:** Room with recent messages shows "Active" badge in sidebar. DM with 3+ day streak shows 🔥 in header. Open a room after 2+ hours away → away banner → dismiss on ✕.
7. **Flyway:** `check_flyway_migrations.sh` passes — no duplicates, no modified existing migrations. V17, V18, V19 apply cleanly.
8. **TypeScript:** `tsc --noEmit` zero errors.
9. **Rate limits:** Resilience4j limiters on friend request and report endpoints behave correctly under load.
