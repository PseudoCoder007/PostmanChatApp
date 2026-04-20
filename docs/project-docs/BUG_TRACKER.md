# Bug Tracker — PostmanChat

**Format version:** 1.0  
**Last updated:** 2026-04-21  
**Total bugs logged:** 20  
**Fixed:** 20 | **Open:** 0 | **Won't Fix:** 0

---

## Index

| ID | Title | Severity | Area | Status |
|----|-------|----------|------|--------|
| [BUG-001](#bug-001) | Igris FAB overlaps send button on mobile | High | Mobile / UI | ✅ Fixed |
| [BUG-002](#bug-002) | No dismiss button on Igris AI suggestion chips | Low | UI | ✅ Fixed |
| [BUG-003](#bug-003) | Coins and XP hidden on mobile topbar | Medium | Mobile / UI | ✅ Fixed |
| [BUG-004](#bug-004) | Navbar search bar non-functional | High | UI / Navigation | ✅ Fixed |
| [BUG-005](#bug-005) | Igris FAB hidden on desktop when drawer opens | Medium | UI / Logic | ✅ Fixed |
| [BUG-006](#bug-006) | App shows plain "Loading..." text on auth check | Low | UI / UX | ✅ Fixed |
| [BUG-007](#bug-007) | Friend requests section hidden; no real-time update | High | UI / Social | ✅ Fixed |
| [BUG-008](#bug-008) | Challenge button hitting broken API endpoint | High | Backend / UI | ✅ Fixed |
| [BUG-009](#bug-009) | Invite button appears inside direct message rooms | Medium | UI / Chat | ✅ Fixed |
| [BUG-010](#bug-010) | No settings/options menu in DM conversations | Medium | UI / Chat | ✅ Fixed |
| [BUG-011](#bug-011) | No seen/sent read receipts on DM messages | High | Feature / Chat | ✅ Fixed |
| [BUG-012](#bug-012) | Room list mixes DMs and group rooms in one list | Medium | UI / Chat | ✅ Fixed |
| [BUG-013](#bug-013) | Block button in DM menu is disabled placeholder | High | Feature / Social | ✅ Fixed |
| [BUG-014](#bug-014) | "View Profile" in DM menu redirects to People tab | Medium | UI / Navigation | ✅ Fixed |
| [BUG-015](#bug-015) | Hamburger menu visible on laptop/desktop | Low | UI / Responsive | ✅ Fixed |
| [BUG-016](#bug-016) | Clicking own avatar in topbar does not open profile | High | UI / Navigation | ✅ Fixed |
| [BUG-017](#bug-017) | No Block option in People tab friends dropdown | Medium | UI / Social | ✅ Fixed |
| [BUG-018](#bug-018) | No loading skeleton when opening a chat room | Medium | UI / UX | ✅ Fixed |
| [BUG-019](#bug-019) | Block does not toggle to Unblock immediately | Medium | UI / Social | ✅ Fixed |
| [BUG-020](#bug-020) | Sidebar profile avatar not clickable | High | UI / Navigation | ✅ Fixed |

---

## Detailed Entries

---

### BUG-001

**Title:** Igris FAB overlaps send button on mobile  
**Severity:** High  
**Priority:** P1  
**Status:** ✅ Fixed  
**Category:** Mobile / UI  
**Reported:** 2026-04-15  
**Fixed:** 2026-04-15  

**Description:**  
On mobile viewports, the floating Igris AI button (FAB) rendered on top of the message send button in the chat composer, making it impossible to send messages while the Igris drawer was active.

**Steps to Reproduce:**  
1. Open app on a mobile device or narrow viewport (≤960px)  
2. Open any chat room  
3. Observe the Igris AI FAB button position relative to the send button

**Expected Behavior:** FAB should not overlap the send button on mobile.  
**Actual Behavior:** FAB sits directly over the send button, blocking taps.

**Root Cause:** The FAB had a fixed position that did not account for the composer bar height on mobile.

**Fix Applied:**  
- Added CSS class `pm-igris-fab-wrap--drawer-open` with `display: none !important` scoped inside `@media (max-width: 960px)` only, so the FAB hides on mobile when the drawer is open but remains visible on desktop.

**Files Changed:**  
- `frontend/src/index.css`  
- `frontend/src/pages/ChatPage.tsx`

---

### BUG-002

**Title:** No dismiss button on Igris AI suggestion chips  
**Severity:** Low  
**Priority:** P3  
**Status:** ✅ Fixed  
**Category:** UI  
**Reported:** 2026-04-15  
**Fixed:** 2026-04-15  

**Description:**  
The quick-prompt suggestion chips shown above the Igris chat input had no way to be dismissed, cluttering the UI permanently even after the user had seen them.

**Steps to Reproduce:**  
1. Open the Igris AI tab  
2. Observe the suggestion chips — there is no X/close button

**Expected Behavior:** User can dismiss suggestion chips with a close button.  
**Actual Behavior:** Chips are permanently visible with no dismiss option.

**Root Cause:** No dismiss state or button was implemented in `IgrisView.tsx`.

**Fix Applied:**  
- Added `showChips` boolean state to `IgrisView.tsx`  
- Added an X button (`.pm-igris-chips__dismiss`) that sets `showChips = false`  
- Added CSS for the dismiss button

**Files Changed:**  
- `frontend/src/components/views/IgrisView.tsx`  
- `frontend/src/index.css`

---

### BUG-003

**Title:** Coins and XP hidden on mobile topbar  
**Severity:** Medium  
**Priority:** P2  
**Status:** ✅ Fixed  
**Category:** Mobile / UI  
**Reported:** 2026-04-15  
**Fixed:** 2026-04-15  

**Description:**  
The coins and XP stat chips in the topbar were completely hidden on mobile, leaving users unable to see their progression stats while on a phone.

**Steps to Reproduce:**  
1. Open app on mobile (≤960px viewport)  
2. Look at the topbar — coins and XP are not visible

**Expected Behavior:** Coins and XP visible on mobile in a compact format.  
**Actual Behavior:** Stat chips hidden entirely.

**Root Cause:** CSS rule `display: none` applied to stat chips without a mobile-friendly fallback.

**Fix Applied:**  
- Modified `.pm-stat-chip` mobile styles to `display: flex; padding: 4px 8px; font-size: 11px`  
- Hid the text labels (`span { display: none }`) on mobile so only the icon + number shows

**Files Changed:**  
- `frontend/src/index.css`

---

### BUG-004

**Title:** Navbar search bar non-functional  
**Severity:** High  
**Priority:** P1  
**Status:** ✅ Fixed  
**Category:** UI / Navigation  
**Reported:** 2026-04-15  
**Fixed:** 2026-04-15  

**Description:**  
The search bar in the top navigation bar was visually present but had no functionality — typing into it produced no results and no navigation occurred.

**Steps to Reproduce:**  
1. Click the search bar in the topbar  
2. Type any keyword (e.g., "chat", "quest", "profile")  
3. Nothing happens

**Expected Behavior:** Typing shows a dropdown of matching workspace tabs; clicking one navigates to it.  
**Actual Behavior:** Input field accepts text but does nothing.

**Root Cause:** `TopBar.tsx` had no search logic, state, or dropdown implemented.

**Fix Applied:**  
- Added `NAV_ITEMS` array with all 9 destinations and their labels, descriptions, and keywords  
- Added `query` and `open` state  
- Implemented filtered dropdown (`.pm-search-drop`) using `onMouseDown` to prevent blur-before-click  
- Added `onNavigate` prop wired through `ChatPage.tsx`

**Files Changed:**  
- `frontend/src/components/layout/TopBar.tsx`  
- `frontend/src/pages/ChatPage.tsx`  
- `frontend/src/index.css`

---

### BUG-005

**Title:** Igris FAB hidden on desktop when drawer opens  
**Severity:** Medium  
**Priority:** P2  
**Status:** ✅ Fixed  
**Category:** UI / Logic  
**Reported:** 2026-04-16  
**Fixed:** 2026-04-16  

**Description:**  
After the initial FAB fix (BUG-001), the Igris button was incorrectly hidden on desktop when the Igris drawer was open. The intent was only to hide it on mobile.

**Steps to Reproduce:**  
1. Open app on desktop  
2. Open the Igris drawer  
3. The FAB button disappears from the UI

**Expected Behavior:** FAB always visible on desktop regardless of drawer state.  
**Actual Behavior:** FAB hidden on desktop when drawer is open.

**Root Cause:** The CSS class hiding logic was not scoped to the mobile media query.

**Fix Applied:**  
- Moved `pm-igris-fab-wrap--drawer-open { display: none !important }` inside `@media (max-width: 960px)` only

**Files Changed:**  
- `frontend/src/index.css`

---

### BUG-006

**Title:** App shows plain "Loading..." text on auth check  
**Severity:** Low  
**Priority:** P3  
**Status:** ✅ Fixed  
**Category:** UI / UX  
**Reported:** 2026-04-16  
**Fixed:** 2026-04-16  

**Description:**  
While the app verified the user's authentication session, the entire screen showed only a plain "Loading..." text string, creating a jarring, unpolished user experience.

**Steps to Reproduce:**  
1. Hard-refresh or open the app  
2. Observe the screen before the main workspace renders

**Expected Behavior:** A skeleton loader matching the app layout is shown during auth check.  
**Actual Behavior:** Plain "Loading..." text.

**Root Cause:** `RequireAuth.tsx` returned a simple string instead of a styled placeholder component.

**Fix Applied:**  
- Created `AppSkeleton` component in `RequireAuth.tsx` with sidebar, topbar, and content block skeletons using `pm-shimmer` animation  
- Added `.pm-skeleton-block`, `.pm-skeleton-sidebar`, `.pm-skeleton-topbar` CSS classes

**Files Changed:**  
- `frontend/src/components/RequireAuth.tsx`  
- `frontend/src/index.css`

---

### BUG-007

**Title:** Friend requests section hidden; no real-time update  
**Severity:** High  
**Priority:** P1  
**Status:** ✅ Fixed  
**Category:** UI / Social  
**Reported:** 2026-04-16  
**Fixed:** 2026-04-16  

**Description:**  
The incoming friend requests section was not always visible in the People tab, and new requests required a full page refresh to appear.

**Steps to Reproduce:**  
1. User A sends a friend request to User B  
2. User B opens the People tab  
3. The request section is not shown or shows stale data  
4. Only a page refresh makes the request appear

**Expected Behavior:** Requests section always visible; new requests appear without refresh.  
**Actual Behavior:** Requests hidden when list is empty; new requests require page refresh.

**Root Cause:**  
- The requests section was conditionally rendered only when `incoming.length > 0`  
- The friendships query had no polling interval

**Fix Applied:**  
- Changed People tab to always show the Requests section with an empty state ("📭 No pending requests")  
- Added `refetchInterval: 15000` and `refetchOnWindowFocus: true` to the `['friends']` query

**Files Changed:**  
- `frontend/src/components/views/PeopleView.tsx`  
- `frontend/src/pages/ChatPage.tsx`

---

### BUG-008

**Title:** Challenge button hitting broken API endpoint  
**Severity:** High  
**Priority:** P1  
**Status:** ✅ Fixed  
**Category:** Backend / UI  
**Reported:** 2026-04-16  
**Fixed:** 2026-04-16  

**Description:**  
The "Challenge" button in the People tab friends list was calling `POST /api/quests/friends/{id}/random`, an endpoint that did not exist or was not intended, causing a network error on every click.

**Steps to Reproduce:**  
1. Open People tab  
2. Click the button next to a friend's name  
3. Network request fails with 4xx error

**Expected Behavior:** Button should provide useful social actions (message, unfriend, block).  
**Actual Behavior:** Button fires a broken API call.

**Root Cause:** Leftover challenge feature was wired to a non-existent endpoint.

**Fix Applied:**  
- Removed `onChallenge` prop and challenge mutation entirely  
- Replaced the challenge button with a `MoreVertical` (⋮) dropdown menu containing Message and Unfriend actions  
- Added dropdown open/close state using `onBlur` + `setTimeout` pattern

**Files Changed:**  
- `frontend/src/components/views/PeopleView.tsx`  
- `frontend/src/pages/ChatPage.tsx`

---

### BUG-009

**Title:** Invite button appears inside direct message rooms  
**Severity:** Medium  
**Priority:** P2  
**Status:** ✅ Fixed  
**Category:** UI / Chat  
**Reported:** 2026-04-18  
**Fixed:** 2026-04-18  

**Description:**  
The "Invite by user ID" input and button rendered in all rooms including direct 1-on-1 chats where inviting additional members makes no sense.

**Steps to Reproduce:**  
1. Open any direct message conversation  
2. Observe the invite input/button in the header area

**Expected Behavior:** Invite controls only visible in group rooms for room owners.  
**Actual Behavior:** Invite controls visible in all room types.

**Root Cause:** The invite block in `ChatView.tsx` only checked `currentUserRole === 'owner'` but not `room.type === 'group'`.

**Fix Applied:**  
- Added `activeRoom.type === 'group'` guard to the invite block conditional

**Files Changed:**  
- `frontend/src/components/views/ChatView.tsx`

---

### BUG-010

**Title:** No settings/options menu in DM conversations  
**Severity:** Medium  
**Priority:** P2  
**Status:** ✅ Fixed  
**Category:** UI / Chat  
**Reported:** 2026-04-18  
**Fixed:** 2026-04-18  

**Description:**  
Direct message conversations had no way to perform actions on the peer (unfriend, view profile, block). No options menu existed in the DM header.

**Steps to Reproduce:**  
1. Open a direct message with any friend  
2. Look for settings/options controls in the conversation header — none exist

**Expected Behavior:** A ⋮ menu in the DM header provides View Profile, Unfriend, and Block options.  
**Actual Behavior:** No such menu exists.

**Root Cause:** Feature not yet implemented.

**Fix Applied:**  
- Added `showDmMenu` state and `dmMenuRef` for click-outside detection  
- Added ⋮ (`MoreVertical`) button that toggles a `.pm-friend-menu.pm-dm-menu` dropdown  
- Dropdown contains: 👤 View Profile, 🚫 Unfriend, 🔇 Block  
- Added `onUnfriend`, `onViewProfile`, `onBlock`, `onUnblock` props to `ChatViewProps`

**Files Changed:**  
- `frontend/src/components/views/ChatView.tsx`  
- `frontend/src/pages/ChatPage.tsx`  
- `frontend/src/index.css`

---

### BUG-011

**Title:** No seen/sent read receipts on DM messages  
**Severity:** High  
**Priority:** P1  
**Status:** ✅ Fixed  
**Category:** Feature / Chat  
**Reported:** 2026-04-18  
**Fixed:** 2026-04-18  

**Description:**  
Users had no visual feedback on whether their DM had been sent or seen by the recipient — no equivalent of WhatsApp ✓/✓✓ tick marks.

**Steps to Reproduce:**  
1. Send a direct message to a friend  
2. Observe the message — no status indicator appears

**Expected Behavior:** ✓ (gray) when sent; ✓✓ (teal) when peer has read the message.  
**Actual Behavior:** No status indicator.

**Root Cause:** Feature not implemented end-to-end. Required a new DB column, backend service, WS event, and frontend rendering.

**Fix Applied:**  
- **Backend:** Added `last_read_at TIMESTAMPTZ` column to `room_members` (V10 migration)  
- **Backend:** Added `POST /api/rooms/{id}/read` endpoint; records timestamp and broadcasts `ROOM_READ` WS event  
- **Backend:** `peerLastReadAt` added to `RoomDto` — populated from peer's `last_read_at`  
- **Frontend:** `ROOM_READ` WS handler updates `peerLastReadAt` in query cache  
- **Frontend:** `useEffect` fires `POST /api/rooms/{id}/read` when a DM is opened  
- **Frontend:** Tick marks rendered on own messages; ISO string comparison determines seen state

**Files Changed:**  
- `backend/.../db/migration/V10__room_read_tracking.sql` *(new)*  
- `backend/.../domain/RoomMember.java`  
- `backend/.../web/dto/RoomDto.java`  
- `backend/.../web/dto/WsMessagePayload.java`  
- `backend/.../web/dto/RoomReadEventDto.java` *(new)*  
- `backend/.../service/RoomService.java`  
- `backend/.../web/RoomController.java`  
- `frontend/src/types/chat.ts`  
- `frontend/src/pages/ChatPage.tsx`  
- `frontend/src/components/views/ChatView.tsx`  
- `frontend/src/index.css`

---

### BUG-012

**Title:** Room list mixes DMs and group rooms in one list  
**Severity:** Medium  
**Priority:** P2  
**Status:** ✅ Fixed  
**Category:** UI / Chat  
**Reported:** 2026-04-18  
**Fixed:** 2026-04-18  

**Description:**  
The left panel of the Chat tab showed all rooms — both direct messages and group rooms — in a single undifferentiated scrollable list, making it hard to find specific conversations.

**Steps to Reproduce:**  
1. Have several DM and group rooms  
2. Open the Chat tab  
3. All rooms appear in one list with no separation

**Expected Behavior:** Two tabs — DMs and Groups — showing the relevant rooms separately with count badges.  
**Actual Behavior:** Single mixed list.

**Root Cause:** No tab UI or filtering logic existed in `ChatView.tsx`.

**Fix Applied:**  
- Added `activeTab: 'dm' | 'group'` state  
- Added `useEffect` to auto-switch tab when `activeRoom` changes externally (e.g., from People view)  
- Replaced the room list header with a two-button tab bar (`.pm-rooms-tabs`) with count badges  
- DMs tab shows `room.type === 'direct'` rooms; Groups tab shows `room.type === 'group'` rooms + Discover  
- New room creation form only shown in Groups tab

**Files Changed:**  
- `frontend/src/components/views/ChatView.tsx`  
- `frontend/src/index.css`

---

### BUG-013

**Title:** Block button in DM menu is a disabled placeholder  
**Severity:** High  
**Priority:** P1  
**Status:** ✅ Fixed  
**Category:** Feature / Social  
**Reported:** 2026-04-19  
**Fixed:** 2026-04-19  

**Description:**  
The Block option in the DM ⋮ menu was rendered as a disabled button labeled "Block (coming soon)". Blocking had no backend implementation.

**Steps to Reproduce:**  
1. Open a DM conversation  
2. Click the ⋮ menu  
3. "Block (coming soon)" button is grayed out and unclickable

**Expected Behavior:** Blocking a user prevents them from messaging you and hides them from People search.  
**Actual Behavior:** Button is non-functional.

**Root Cause:** Block feature was intentionally deferred in initial implementation.

**Fix Applied:**  
- **Backend:** V11 migration alters `friendships` CHECK constraint to include `blocked`  
- **Backend:** Added `blocked` to `FriendshipStatus` enum  
- **Backend:** Added `blockUser()` and `isBlockedBetween()` to `FriendService`  
- **Backend:** Updated `friendshipState()` to return `blocked_by_me` / `blocked_by_them`  
- **Backend:** Added `POST /api/friends/{id}/block` endpoint  
- **Backend:** Block check in `MessageService.sendMessage()` for DMs  
- **Backend:** Blocked users excluded from `ProfileService.searchProfiles()`  
- **Frontend:** `onBlock` prop added to `ChatView`; button enabled  
- **Frontend:** `blockUser` mutation added to `ChatPage`

**Files Changed:**  
- `backend/.../db/migration/V11__friendship_block.sql` *(new)*  
- `backend/.../domain/FriendshipStatus.java`  
- `backend/.../service/FriendService.java`  
- `backend/.../web/FriendController.java`  
- `backend/.../service/MessageService.java`  
- `backend/.../service/ProfileService.java`  
- `frontend/src/types/chat.ts`  
- `frontend/src/components/views/ChatView.tsx`  
- `frontend/src/pages/ChatPage.tsx`

---

### BUG-014

**Title:** "View Profile" in DM menu redirects to People tab  
**Severity:** Medium  
**Priority:** P2  
**Status:** ✅ Fixed  
**Category:** UI / Navigation  
**Reported:** 2026-04-19  
**Fixed:** 2026-04-19  

**Description:**  
Clicking "View Profile" in the DM ⋮ menu redirected the user to the People tab instead of showing the peer's profile inline. The user expected a profile card/modal without leaving the chat.

**Steps to Reproduce:**  
1. Open a DM conversation  
2. Click ⋮ → View Profile  
3. App navigates away to the People tab

**Expected Behavior:** A modal appears showing the peer's avatar, name, username, level, XP, coins, and online status.  
**Actual Behavior:** User is taken to the People tab.

**Root Cause:** `onViewProfile` was wired to `setActiveView('people')` instead of opening a modal.

**Fix Applied:**  
- Created `ProfileModal.tsx` component with avatar, display name, username, title, level/XP/coins stats, and online status  
- Added `viewingProfile: Profile | null` state to `ChatPage`  
- `onViewProfile` now sets `viewingProfile` from `activeRoom.directPeer`  
- Modal rendered conditionally with backdrop click to close  
- Added `.pm-modal-backdrop`, `.pm-modal`, `.pm-profile-modal` CSS classes

**Files Changed:**  
- `frontend/src/components/ProfileModal.tsx` *(new)*  
- `frontend/src/pages/ChatPage.tsx`  
- `frontend/src/index.css`

---

### BUG-015

**Title:** Hamburger menu button visible on laptop/desktop  
**Severity:** Low  
**Priority:** P3  
**Status:** ✅ Fixed  
**Category:** UI / Responsive  
**Reported:** 2026-04-19  
**Fixed:** 2026-04-21  

**Description:**  
The hamburger (☰) menu button intended for mobile navigation was visible in the topbar on laptop and desktop viewports, cluttering the navigation bar unnecessarily.

**Steps to Reproduce:**  
1. Open app on a laptop or desktop browser  
2. Observe the square menu icon to the left of the search bar — it should not be there

**Expected Behavior:** Menu button only visible on mobile (≤768px).  
**Actual Behavior:** Visible at wider viewports due to CSS specificity conflict.

**Root Cause:** The button was shown inside `@media (max-width: 960px)` but many laptop viewports fall within that range. The global `display: none` lacked `!important` and could be overridden.

**Fix Applied:**  
- Changed global `.pm-topbar__menu { display: none !important }` with `!important`  
- Moved the show rule to a dedicated `@media (max-width: 768px)` block with `!important`  
- Removed the show rule from the `960px` media query

**Files Changed:**  
- `frontend/src/index.css`

---

### BUG-016

**Title:** Clicking own avatar in topbar does not open profile  
**Severity:** High  
**Priority:** P1  
**Status:** ✅ Fixed  
**Category:** UI / Navigation  
**Reported:** 2026-04-19  
**Fixed:** 2026-04-21  

**Description:**  
Clicking the user's own avatar or initials button in the top-right of the topbar did not navigate to the Profile view, even though the button existed and had a click handler.

**Steps to Reproduce:**  
1. Open the app (logged in)  
2. Click the avatar/initials button in the top-right of the topbar  
3. Nothing happens — profile view does not open

**Expected Behavior:** Clicking the topbar avatar opens the Profile tab.  
**Actual Behavior:** No response to click.

**Root Cause:** The `onAvatarClick` handler and button were correctly wired in `TopBar.tsx` and `ChatPage.tsx`. The issue was that users were clicking the **sidebar** avatar (`div`, non-interactive) rather than the small topbar button. Additionally the topbar avatar hover was too subtle to convey clickability.

**Fix Applied:**  
- See BUG-020 for the sidebar fix (primary cause)  
- Added a more visible hover ring to `.pm-topbar__avatar` (outline + border-color on hover)

**Files Changed:**  
- `frontend/src/components/layout/TopBar.tsx` *(hover style)*  
- `frontend/src/index.css`

---

### BUG-017

**Title:** No Block option in People tab friends dropdown  
**Severity:** Medium  
**Priority:** P2  
**Status:** ✅ Fixed  
**Category:** UI / Social  
**Reported:** 2026-04-21  
**Fixed:** 2026-04-21  

**Description:**  
The ⋮ dropdown next to each friend in the People tab offered only Message and Unfriend. There was no Block option, forcing users to go into a DM to block someone.

**Steps to Reproduce:**  
1. Open People tab  
2. Click ⋮ next to any friend  
3. Only "Message" and "Unfriend" options appear

**Expected Behavior:** Block option available directly from the People tab friends list.  
**Actual Behavior:** No Block option in the dropdown.

**Root Cause:** `onBlock` prop and the menu item were not added to `PeopleView.tsx`.

**Fix Applied:**  
- Added `onBlock` prop to `PeopleViewProps` interface  
- Added `🔇 Block` button to the friends dropdown menu with `.pm-friend-menu__item--danger` styling  
- Wired `onBlock` in `ChatPage.tsx` using the existing `blockUser` mutation

**Files Changed:**  
- `frontend/src/components/views/PeopleView.tsx`  
- `frontend/src/pages/ChatPage.tsx`

---

### BUG-018

**Title:** No loading skeleton when opening a chat room  
**Severity:** Medium  
**Priority:** P2  
**Status:** ✅ Fixed  
**Category:** UI / UX  
**Reported:** 2026-04-21  
**Fixed:** 2026-04-21  

**Description:**  
When clicking on a chat room for the first time, the message area showed either blank space or the "No messages yet" empty state while messages were still being fetched — no loading indicator was shown.

**Steps to Reproduce:**  
1. Click on any chat room for the first time  
2. Observe the message area during the network request

**Expected Behavior:** Shimmer skeleton rows appear while messages load.  
**Actual Behavior:** Empty area or premature empty-state shown.

**Root Cause:** `isLoading` from the messages query was not passed to `ChatView`, which had no skeleton implementation.

**Fix Applied:**  
- Destructured `isLoading: messagesLoading` from the messages `useQuery` in `ChatPage`  
- Added `messagesLoading` prop to `ChatViewProps`  
- Added `.pm-msg-skeleton` with 5 alternating shimmer rows (own/peer) in the message stream  
- "No messages" empty state only renders when `!messagesLoading && orderedMessages.length === 0`  
- Added `.pm-msg-skeleton`, `.pm-msg-skeleton__row`, `.pm-msg-skeleton__avatar`, `.pm-msg-skeleton__bubble` CSS

**Files Changed:**  
- `frontend/src/pages/ChatPage.tsx`  
- `frontend/src/components/views/ChatView.tsx`  
- `frontend/src/index.css`

---

### BUG-019

**Title:** Block does not toggle to Unblock immediately in DM menu  
**Severity:** Medium  
**Priority:** P2  
**Status:** ✅ Fixed  
**Category:** UI / Social  
**Reported:** 2026-04-21  
**Fixed:** 2026-04-21  

**Description:**  
After blocking a user from the DM ⋮ menu, the room was closed (`setActiveRoomId(undefined)`) and the user had no immediate way to undo the action from the same menu. The Block button did not toggle to Unblock.

**Steps to Reproduce:**  
1. Open a DM  
2. Click ⋮ → Block  
3. The room closes; Block button never shows as Unblock  
4. User must find the blocked user in People tab to unblock

**Expected Behavior:** After blocking, the ⋮ menu Block button immediately toggles to Unblock within the same DM.  
**Actual Behavior:** Room closes on block; no toggle.

**Root Cause:**  
- `blockUser.onSuccess` called `setActiveRoomId(undefined)`, dismissing the room  
- No conditional logic existed in the DM menu to toggle between Block and Unblock based on `directPeer.friendshipState`

**Fix Applied:**  
- Removed `setActiveRoomId(undefined)` from `blockUser.onSuccess`  
- Added toggle logic in `ChatView.tsx`: if `directPeer.friendshipState === 'blocked_by_me'`, render `✅ Unblock` button calling `onUnblock`; otherwise render `🔇 Block`  
- Added `onUnblock` prop to `ChatViewProps` and wired it in `ChatPage`

**Files Changed:**  
- `frontend/src/components/views/ChatView.tsx`  
- `frontend/src/pages/ChatPage.tsx`

---

### BUG-020

**Title:** Sidebar profile avatar not clickable — profile view unreachable  
**Severity:** High  
**Priority:** P1  
**Status:** ✅ Fixed  
**Category:** UI / Navigation  
**Reported:** 2026-04-21  
**Fixed:** 2026-04-21  

**Description:**  
The user profile section at the top of the sidebar (avatar + display name + username) was rendered as a non-interactive `<div>`. Users naturally clicked it expecting to open their profile, but nothing happened. This was the primary cause reported as "I cannot view my profile by clicking on my picture."

**Steps to Reproduce:**  
1. Look at the sidebar — the user avatar and name are at the top  
2. Click anywhere on the avatar or the name/username text  
3. Nothing happens; no navigation occurs

**Expected Behavior:** Clicking the sidebar user area opens the Profile tab.  
**Actual Behavior:** `div` is not interactive — click is silently ignored.

**Root Cause:** `pm-sidebar__user` was a `<div>` with no click handler or cursor styling.

**Fix Applied:**  
- Changed `pm-sidebar__user` from `<div>` to `<button>` in `Sidebar.tsx`  
- Added `onClick={() => handleNavigate('profile')}` and `title="View your profile"`  
- Updated `.pm-sidebar__user` CSS: added `width: 100%`, `text-align: left`, `cursor: pointer`, `border: none` resets, and a hover background (`var(--pm-bg-elevated)`)

**Files Changed:**  
- `frontend/src/components/layout/Sidebar.tsx`  
- `frontend/src/index.css`

---

## Maintenance Rules

- Add a new entry for every bug reported and tracked.
- Update `Status` field immediately when a fix is deployed.
- Update the **Index** table and the **Total / Fixed / Open** counters at the top on each change.
- Use the next sequential `BUG-NNN` ID.
- Always include **Root Cause** — it is the most important field for preventing regressions.
- Severity guide: **Critical** = data loss / security; **High** = feature broken / major UX blocked; **Medium** = degraded UX; **Low** = cosmetic / minor.
- Priority guide: **P0** = stop everything; **P1** = fix this sprint; **P2** = fix next sprint; **P3** = backlog.
