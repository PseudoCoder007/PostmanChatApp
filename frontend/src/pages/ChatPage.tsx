import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Brain, MessageCircle, Users, Target, Trophy, User, Settings2, Bell, RefreshCcw, TriangleAlert } from 'lucide-react';
import { useStompRoom } from '@/hooks/useStompRoom';
import { apiFetch, apiFetchForm, resolveAttachmentUrl } from '@/lib/api';
import { getUserFriendlyErrorMessage } from '@/lib/errorMessages';
import { supabase } from '@/lib/supabase';
import { useTutorial } from '@/hooks/useTutorial';
import { useThemeMode } from '@/hooks/useThemeMode';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { LevelUpCelebration } from '@/components/LevelUpCelebration';
import type { Attachment, FeedbackRequest, FeedbackResponse, FriendRequest, IgrisChatResponse, IgrisChatTurn, IgrisHistoryItem, LeaderboardEntry, Message, NotificationItem, PinnedMessage, Profile, Quest, Room, RoomJoinRequest, RoomReadEvent, RoomVisibility, TypingEvent, WsMessagePayload } from '@/types/chat';
import SearchModal from '@/components/SearchModal';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import ChatView from '@/components/views/ChatView';
import PeopleView from '@/components/views/PeopleView';
import QuestsView from '@/components/views/QuestsView';
import IgrisView from '@/components/views/IgrisView';
import BoardView from '@/components/views/BoardView';
import LevelsView from '@/components/views/LevelsView';
import ProfileView from '@/components/views/ProfileView';
import FeedbackView from '@/components/views/FeedbackView';
import SettingsView from '@/components/views/SettingsView';
import NotificationsView from '@/components/views/NotificationsView';
import ProfileModal from '@/components/ProfileModal';

type ViewKey = 'chat' | 'people' | 'quests' | 'igris' | 'board' | 'levels' | 'profile' | 'feedback' | 'settings' | 'notifications';
type IgrisMessage = { id: string; role: 'user' | 'assistant'; content: string };
type FocusMission = { id: string; title: string; description: string; reward: string; lane: string };

const views: Array<{ key: ViewKey; label: string }> = [
  { key: 'chat', label: 'Chat' },
  { key: 'people', label: 'People' },
  { key: 'quests', label: 'Quests' },
  { key: 'igris', label: 'Igris' },
  { key: 'board', label: 'Board' },
  { key: 'levels', label: 'Levels' },
  { key: 'profile', label: 'Profile' },
  { key: 'feedback', label: 'Feedback' },
];

const IGRIS_PROMPTS = [
  'How do I create a group chat here?',
  'Where do I change my username and settings?',
  'Explain quests, coins, and unlocks in a simple way.',
  'Where can I submit a bug report or feedback?',
];

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error((await r.text()) || `${r.status}`);
  return r.json() as Promise<T>;
}

export default function ChatPage() {
  const nav = useNavigate();
  const { isDark, toggleTheme } = useThemeMode();
  const qc = useQueryClient();
  const lastNotificationRef = useRef<string | null>(null);
  const previousMessageCountRef = useRef(0);
  const previousUnreadCountRef = useRef(0);
  const [levelUpCelebration, setLevelUpCelebration] = useState<{ oldLevel: number; newLevel: number; title: string } | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>('chat');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string>();
  const [draft, setDraft] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupVisibility, setGroupVisibility] = useState<RoomVisibility>('public_room');
  const [roomSearch, setRoomSearch] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [inviteUserId, setInviteUserId] = useState('');
  const [profileForm, setProfileForm] = useState({ displayName: '', username: '', avatarUrl: '' });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [roomTyping, setRoomTyping] = useState<TypingEvent | null>(null);
  const [igrisDraft, setIgrisDraft] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => readSoundPreference());
  const [igrisDrawerOpen, setIgrisDrawerOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackRequest>({ category: 'feedback', subject: '', message: '', contactEmail: '' });
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [focusRefreshTick, setFocusRefreshTick] = useState(() => Math.floor(Date.now() / (10 * 60 * 1000)));
  const [igrisMessages, setIgrisMessages] = useState<IgrisMessage[]>([
    { id: 'intro', role: 'assistant', content: 'Igris online. I can be your funny low-key therapist friend, boredom killer, comeback coach, or chaos planner. Tell me the lore.' },
  ]);
  const igrisMessagesRef = useRef<IgrisMessage[]>(igrisMessages);
  const igrisCooldownRef = useRef<{ message: string; sentAt: number } | null>(null);
  const typingIdleTimeoutRef = useRef<number | null>(null);
  const typingClearTimeoutRef = useRef<number | null>(null);
  const {
    data: me,
    isLoading: meLoading,
    isError: meIsError,
    error: meError,
    refetch: refetchMe,
  } = useQuery({ queryKey: ['me'], queryFn: async () => json<Profile>(await apiFetch('/api/me')), staleTime: 60000, refetchOnWindowFocus: false, retry: false });
  const { data: igrisHistory = [] } = useQuery({
    queryKey: ['igris-history'],
    queryFn: async () => json<IgrisHistoryItem[]>(await apiFetch('/api/igris/history?limit=24')),
    enabled: !!me,
    staleTime: 15000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const { data: allRooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: async () => json<Room[]>(await apiFetch('/api/rooms')), enabled: !!me, staleTime: 60000, refetchOnWindowFocus: false, retry: false });
  const { data: discoverRooms = [] } = useQuery({
    queryKey: ['rooms', 'discover', roomSearch],
    queryFn: async () => json<Room[]>(await apiFetch(`/api/rooms/discover?${new URLSearchParams({ query: roomSearch.trim() })}`)),
    enabled: !!me && roomSearch.trim().length > 0,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const { data: friendships = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => json<FriendRequest[]>(await apiFetch('/api/friends')),
    enabled: !!me,
    staleTime: 10000,
    refetchOnWindowFocus: true,
    refetchInterval: () => document.visibilityState === 'visible' ? 15000 : false,
    refetchIntervalInBackground: false,
    retry: false,
  });
  const { data: quests = [] } = useQuery({ queryKey: ['quests'], queryFn: async () => json<Quest[]>(await apiFetch('/api/quests')), enabled: !!me, staleTime: 60000, refetchOnWindowFocus: false, retry: false });
  const { data: leaderboard = [] } = useQuery({ queryKey: ['leaderboard'], queryFn: async () => json<LeaderboardEntry[]>(await apiFetch('/api/leaderboard?limit=20')), enabled: !!me, staleTime: 60000, refetchOnWindowFocus: false, retry: false });
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => json<NotificationItem[]>(await apiFetch('/api/notifications')),
    enabled: !!me,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    refetchInterval: () => document.visibilityState === 'visible' ? 60000 : false,
    refetchIntervalInBackground: false,
    retry: false,
  });
  const { data: people = [] } = useQuery({
    queryKey: ['profiles', peopleSearch],
    queryFn: async () => json<Profile[]>(await apiFetch(`/api/profiles?${new URLSearchParams({ query: peopleSearch.trim(), limit: '10' })}`)),
    enabled: !!me && peopleSearch.trim().length > 0,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeRoomId],
    queryFn: async () => {
      const msgs = await json<Message[]>(await apiFetch(`/api/rooms/${activeRoomId}/messages?limit=20`));
      setHasMoreMessages(msgs.length === 20);
      return msgs;
    },
    enabled: !!me && !!activeRoomId,
    staleTime: 15000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const { data: streak } = useQuery({
    queryKey: ['streak', activeRoomId],
    queryFn: async () => json<{ days: number }>(await apiFetch(`/api/rooms/${activeRoomId}/streak`)),
    enabled: !!me && !!activeRoomId && activeRoom?.type === 'direct',
    staleTime: 300000,
    retry: false,
  });
  const { data: pins = [] } = useQuery({
    queryKey: ['pins', activeRoomId],
    queryFn: async () => json<PinnedMessage[]>(await apiFetch(`/api/rooms/${activeRoomId}/pins`)),
    enabled: !!me && !!activeRoomId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const { data: joinRequests = [] } = useQuery({
    queryKey: ['room-requests', activeRoomId],
    queryFn: async () => json<RoomJoinRequest[]>(await apiFetch(`/api/rooms/${activeRoomId}/requests`)),
    enabled: !!me && !!activeRoomId && !!allRooms.find((room) => room.id === activeRoomId && room.currentUserRole === 'owner'),
    staleTime: 15000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (!me) return;
    setProfileForm({ displayName: me.displayName ?? '', username: me.username ?? '', avatarUrl: me.avatarUrl ?? '' });
  }, [me]);

  useEffect(() => {
    if (activeRoomId && allRooms.some((room) => room.id === activeRoomId)) return;
    setActiveRoomId(allRooms[0]?.id);
  }, [activeRoomId, allRooms]);

  useEffect(() => {
    setHasMoreMessages(true);
  }, [activeRoomId]);

  useEffect(() => {
    if (!me) return;
    const tick = () => void apiFetch('/api/me/presence', { method: 'POST' });
    tick();
    const interval = window.setInterval(tick, 60000);
    return () => window.clearInterval(interval);
  }, [me]);

  useEffect(() => {
    try {
      window.localStorage.setItem('postmanchat.sound.enabled', soundEnabled ? '1' : '0');
    } catch {
      // Ignore storage failures and keep the preference in memory.
    }
  }, [soundEnabled]);

  useEffect(() => {
    const refresh = () => setFocusRefreshTick(Math.floor(Date.now() / (10 * 60 * 1000)));
    refresh();
    const interval = window.setInterval(refresh, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setRoomTyping(null);
    if (typingIdleTimeoutRef.current) window.clearTimeout(typingIdleTimeoutRef.current);
    if (typingClearTimeoutRef.current) window.clearTimeout(typingClearTimeoutRef.current);
  }, [activeRoomId]);

  useEffect(() => {
    if (!activeRoomId) { setDraft(''); return; }
    try {
      const saved = localStorage.getItem(`postmanchat.draft.${activeRoomId}`) ?? '';
      setDraft(saved);
    } catch {
      setDraft('');
    }
  }, [activeRoomId]);

  // Mark DM room as read when user opens it
  useEffect(() => {
    if (!activeRoomId || !me) return;
    const room = allRooms.find(r => r.id === activeRoomId);
    if (room?.type !== 'direct') return;
    void apiFetch(`/api/rooms/${activeRoomId}/read`, { method: 'POST' }).catch(() => {});
  }, [activeRoomId, me]);

  useEffect(() => {
    igrisMessagesRef.current = igrisMessages;
  }, [igrisMessages]);

  useEffect(() => {
    if (igrisHistory.length === 0) {
      return;
    }
    setIgrisMessages(igrisHistory.map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content,
    })));
  }, [igrisHistory]);

  useEffect(() => {
    const latest = notifications.find((item) => !item.read);
    if (!latest || latest.id === lastNotificationRef.current || !document.hidden || !('Notification' in window)) return;
    lastNotificationRef.current = latest.id;
    if (Notification.permission === 'granted') new Notification(latest.title, { body: latest.body });
  }, [notifications]);

  // Auto-request browser notification permission after user settles in
  useEffect(() => {
    if (!me || !('Notification' in window) || Notification.permission !== 'default') return;
    const t = window.setTimeout(() => { void Notification.requestPermission(); }, 4000);
    return () => window.clearTimeout(t);
  }, [me]);

  const orderedMessages = useMemo(() => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages]);
  const awayMessageCount = useMemo(() => {
    if (!me?.lastActiveAt) return 0;
    const awayThreshold = new Date(me.lastActiveAt).getTime();
    if (Date.now() - awayThreshold < 2 * 60 * 60 * 1000) return 0;
    return orderedMessages.filter(m => new Date(m.createdAt).getTime() > awayThreshold && m.senderId !== me.id).length;
  }, [me?.lastActiveAt, me?.id, orderedMessages]);

  async function loadMoreMessages() {
    if (!activeRoomId || loadingMoreMessages || !orderedMessages.length) return;
    setLoadingMoreMessages(true);
    try {
      const oldest = orderedMessages[0].createdAt;
      const older = await json<Message[]>(await apiFetch(
        `/api/rooms/${activeRoomId}/messages?limit=20&before=${encodeURIComponent(oldest)}`
      ));
      qc.setQueryData<Message[]>(['messages', activeRoomId], old => [...older, ...(old ?? [])]);
      setHasMoreMessages(older.length === 20);
    } finally {
      setLoadingMoreMessages(false);
    }
  }
  const incoming = friendships.filter((item) => item.friendshipState === 'incoming');
  const friends = friendships.filter((item) => item.friendshipState === 'accepted');
  const blocked = friendships.filter((item) => item.friendshipState === 'blocked_by_me');
  const onlineFriends = friends.filter((item) => item.profile.active);
  const unread = notifications.filter((item) => !item.read);
  const activeQuests = quests.filter((quest) => quest.status === 'assigned');
  const completedQuests = quests.filter((quest) => quest.status === 'completed');
  const activeRoom = allRooms.find((room) => room.id === activeRoomId);
  const mentionCandidates = useMemo(() => {
    if (!activeRoom) return [];
    if (activeRoom.type === 'direct' && activeRoom.directPeer) return [activeRoom.directPeer];
    return friends.map(f => f.profile);
  }, [activeRoom, friends]);
  const visibleRooms = useMemo(() => {
    const q = roomSearch.trim().toLowerCase();
    if (!q) return allRooms;
    return allRooms.filter(r => {
      const name = r.name?.toLowerCase() ?? '';
      const peer = r.directPeer?.displayName?.toLowerCase() ?? '';
      const username = r.directPeer?.username?.toLowerCase() ?? '';
      return name.includes(q) || peer.includes(q) || username.includes(q);
    });
  }, [allRooms, roomSearch]);
  const discoverableRooms = roomSearch.trim()
    ? discoverRooms.filter((room) => !allRooms.some((ownRoom) => ownRoom.id === room.id))
    : [];
  const igrisCoinsRemaining = Math.max(0, 5 - (me?.coins ?? 0));
  const focusMissions = useMemo(
    () => buildFocusMissions({ tick: focusRefreshTick, canUseIgris: !!me?.canUseIgris, canChallengeFriends: !!me?.canChallengeFriends, activeQuestCount: activeQuests.length }),
    [activeQuests.length, focusRefreshTick, me?.canChallengeFriends, me?.canUseIgris],
  );
  const nextFocusRefreshLabel = useMemo(() => formatCountdown(((focusRefreshTick + 1) * 10 * 60 * 1000) - Date.now()), [focusRefreshTick]);

  useEffect(() => {
    const count = unread.length;
    if (count > previousUnreadCountRef.current && soundEnabled) playUiTone('alert');
    previousUnreadCountRef.current = count;
  }, [soundEnabled, unread.length]);

  useEffect(() => {
    const latest = orderedMessages[orderedMessages.length - 1];
    if (orderedMessages.length > previousMessageCountRef.current && latest?.senderId !== me?.id && soundEnabled) {
      playUiTone('message');
    }
    previousMessageCountRef.current = orderedMessages.length;
  }, [orderedMessages, me?.id, soundEnabled]);

  // Tutorial management
  const tutorial = useTutorial();
  useEffect(() => {
    if (tutorial.currentStep && tutorial.currentStep.targetViewOrAction) {
      // Map tutorial target to a view
      const viewMap: Record<string, ViewKey> = {
        'chat': 'chat',
        'quests': 'quests',
        'igris': 'igris',
        'profile': 'profile',
        'levels': 'levels',
        'feedback': 'feedback',
      };
      const targetView = viewMap[tutorial.currentStep.targetViewOrAction] as ViewKey;
      if (targetView) {
        setActiveView(targetView);
      }
    }
  }, [tutorial.currentStep?.id]);

  useEffect(() => {
    if (!me?.id || !me.level) return;
    const storageKey = `postmanchat.level.seen.${me.id}`;
    try {
      const storedValue = window.localStorage.getItem(storageKey);
      const seenLevel = storedValue ? Number.parseInt(storedValue, 10) : me.level;

      if (Number.isFinite(seenLevel) && me.level > seenLevel) {
        setLevelUpCelebration({ oldLevel: seenLevel, newLevel: me.level, title: me.title || 'Player' });
        if (soundEnabled) playUiTone('success');
      }

      window.localStorage.setItem(storageKey, String(me.level));
    } catch {
      // Ignore storage failures; the celebration simply won't persist across refreshes.
    }
  }, [me?.id, me?.level, me?.title, soundEnabled]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [activeView]);

  function onWsEvent(payload: WsMessagePayload) {
    if (!activeRoomId) return;
    if (payload.type === 'TYPING' && payload.typing?.roomId === activeRoomId) {
      if (!payload.typing.typing || payload.typing.userId === me?.id) {
        setRoomTyping(null);
        return;
      }
      setRoomTyping(payload.typing);
      if (typingClearTimeoutRef.current) window.clearTimeout(typingClearTimeoutRef.current);
      typingClearTimeoutRef.current = window.setTimeout(() => setRoomTyping(null), 1800);
      return;
    }
    if (payload.type === 'ROOM_READ' && payload.roomRead) {
      const { roomId, readAt } = payload.roomRead as RoomReadEvent;
      qc.setQueryData<Room[]>(['rooms'], (old) =>
        old ? old.map(r => r.id === roomId ? { ...r, peerLastReadAt: readAt } : r) : old
      );
      return;
    }
    if (payload.type === 'PIN_CHANGED') {
      void qc.invalidateQueries({ queryKey: ['pins', activeRoomId] });
      return;
    }
    // Real-time browser notification for new messages when page is hidden
    if (payload.type === 'MESSAGE_CREATED' && payload.message && payload.message.senderId !== me?.id && document.hidden) {
      const msgRoom = allRooms.find(r => r.id === payload.message!.roomId);
      if (!msgRoom?.muted && 'Notification' in window && Notification.permission === 'granted') {
        const sender = msgRoom?.directPeer?.displayName ?? msgRoom?.name ?? 'Someone';
        new Notification(`${sender} sent a message`, {
          body: payload.message.content?.slice(0, 100) || 'Sent an attachment',
        });
      }
    }

    if (!payload.message || payload.message.roomId !== activeRoomId) return;
    if (roomTyping && payload.message.senderId === roomTyping.userId) {
      setRoomTyping(null);
    }
    qc.setQueryData<Message[]>(['messages', activeRoomId], (old) => {
      const list = old ?? [];
      if (payload.type === 'MESSAGE_DELETED') return list.filter((message) => message.id !== payload.message!.id);
      if (payload.type === 'MESSAGE_UPDATED' || payload.type === 'REACTION_UPDATE') return list.map((message) => (message.id === payload.message!.id ? payload.message! : message));
      if (list.some((message) => message.id === payload.message!.id)) return list;
      return [...list, payload.message!];
    });
  }

  const { sendTyping } = useStompRoom(activeRoomId, onWsEvent);

  const refreshCore = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['me'], refetchType: 'active' }),
      qc.invalidateQueries({ queryKey: ['rooms'], refetchType: 'active' }),
      qc.invalidateQueries({ queryKey: ['friends'], refetchType: 'active' }),
      qc.invalidateQueries({ queryKey: ['profiles'], refetchType: 'active' }),
      qc.invalidateQueries({ queryKey: ['quests'], refetchType: 'active' }),
      qc.invalidateQueries({ queryKey: ['leaderboard'], refetchType: 'active' }),
      qc.invalidateQueries({ queryKey: ['notifications'], refetchType: 'active' }),
    ]);
  };

  const updateProfile = useMutation({
    mutationFn: async (nextProfileForm: typeof profileForm) => json<Profile>(await apiFetch('/api/me', { method: 'PATCH', body: JSON.stringify(nextProfileForm) })),
    onSuccess: async () => { toast.success('Profile updated'); await refreshCore(); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const updateStatus = useMutation({
    mutationFn: async ({ statusText, statusEmoji }: { statusText: string; statusEmoji: string }) =>
      json<Profile>(await apiFetch('/api/me/status', { method: 'PATCH', body: JSON.stringify({ statusText: statusText || null, statusEmoji: statusEmoji || null }) })),
    onSuccess: async () => { toast.success('Status updated'); await refreshCore(); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const forwardMessage = useMutation({
    mutationFn: async ({ messageId, targetRoomId }: { messageId: string; targetRoomId: string }) =>
      json<Message>(await apiFetch(`/api/messages/${messageId}/forward`, { method: 'POST', body: JSON.stringify({ targetRoomId }) })),
    onSuccess: () => toast.success('Message forwarded'),
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const submitReport = useMutation({
    mutationFn: async ({ messageId, reason, notes }: { messageId: string; reason: string; notes: string }) =>
      apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ targetType: 'message', targetId: messageId, reason, notes: notes || null }) }),
    onSuccess: () => toast.success('Report submitted. Thank you.'),
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const generateQuest = useMutation({
    mutationFn: async () => json<Quest>(await apiFetch('/api/quests/random', { method: 'POST' })),
    onSuccess: async () => { playUiTone('success'); toast.success('New mission generated'); await refreshCore(); setActiveView('quests'); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const unfriend = useMutation({
    mutationFn: async ({ otherUserId }: { otherUserId: string }) => apiFetch(`/api/friends/${otherUserId}`, { method: 'DELETE' }),
    onSuccess: async () => { toast.success('Friend removed'); await refreshCore(); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const blockUser = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => apiFetch(`/api/friends/${targetUserId}/block`, { method: 'POST' }),
    onSuccess: async () => { toast.success('User blocked'); await refreshCore(); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const unblockUser = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => apiFetch(`/api/friends/${targetUserId}/block`, { method: 'DELETE' }),
    onSuccess: async () => { toast.success('User unblocked'); await refreshCore(); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const createGroupRoom = useMutation({
    mutationFn: async ({ name, visibility }: { name: string; visibility: RoomVisibility }) => json<Room>(await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name, type: 'group', targetUserId: null, visibility }) })),
    onSuccess: async (room) => { playUiTone('success'); toast.success('Room deployed'); await refreshCore(); setGroupName(''); setGroupVisibility('public_room'); setActiveRoomId(room.id); setActiveView('chat'); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const addFriend = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => json<FriendRequest>(await apiFetch(`/api/friends/${targetUserId}/request`, { method: 'POST' })),
    onSuccess: async () => { toast.success('Friend request sent'); await refreshCore(); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const acceptFriend = useMutation({
    mutationFn: async ({ otherUserId }: { otherUserId: string }) => json<FriendRequest>(await apiFetch(`/api/friends/${otherUserId}/accept`, { method: 'POST' })),
    onSuccess: async () => { toast.success('Friend request accepted'); await refreshCore(); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const createDirectRoom = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => json<Room>(await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name: '', type: 'direct', targetUserId }) })),
    onSuccess: async (room) => { playUiTone('success'); toast.success('Direct room opened'); await refreshCore(); setPeopleSearch(''); setActiveRoomId(room.id); setActiveView('chat'); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const joinRoom = useMutation({
    mutationFn: async ({ roomId }: { roomId: string }) => json<Room>(await apiFetch(`/api/rooms/${roomId}/join`, { method: 'POST' })),
    onSuccess: async (room) => {
      await refreshCore();
      if (room.member) {
        toast.success(`Joined ${getRoomTitle(room)}`);
        setActiveRoomId(room.id);
        setActiveView('chat');
      } else {
        toast.success('Access request sent');
      }
    },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const addRoomMember = useMutation({
    mutationFn: async ({ roomId, targetUserId }: { roomId: string; targetUserId: string }) => json<Room>(await apiFetch(`/api/rooms/${roomId}/members?${new URLSearchParams({ targetUserId })}`, { method: 'POST' })),
    onSuccess: async () => { await refreshCore(); setInviteUserId(''); toast.success('Member added'); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const approveJoinRequest = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => json<Room>(await apiFetch(`/api/rooms/${roomId}/requests/${userId}/approve`, { method: 'POST' })),
    onSuccess: async () => { await refreshCore(); qc.invalidateQueries({ queryKey: ['room-requests'], refetchType: 'active' }); toast.success('Request approved'); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const rejectJoinRequest = useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => apiFetch(`/api/rooms/${roomId}/requests/${userId}/reject`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['room-requests'] }); toast.success('Request rejected'); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const toggleReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      json<Message>(await apiFetch(`/api/messages/${messageId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) })),
    onSuccess: (_data, variables) => {
      qc.setQueryData<Message[]>(['messages', activeRoomId], old =>
        old ? old.map(m => m.id === variables.messageId ? _data : m) : old
      );
    },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const toggleMuteRoom = useMutation({
    mutationFn: async ({ roomId }: { roomId: string }) => json<Room>(await apiFetch(`/api/rooms/${roomId}/mute`, { method: 'PATCH' })),
    onSuccess: async (_data, variables) => {
      qc.setQueryData<Room[]>(['rooms'], old => old ? old.map(r => r.id === variables.roomId ? { ...r, muted: _data.muted } : r) : old);
      toast.success(_data.muted ? 'Room muted' : 'Room unmuted');
    },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });

  const pinMessage = useMutation({
    mutationFn: async ({ roomId, messageId }: { roomId: string; messageId: string }) =>
      json<PinnedMessage>(await apiFetch(`/api/rooms/${roomId}/pins`, { method: 'POST', body: JSON.stringify({ messageId }) })),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pins', activeRoomId] }); toast.success('Message pinned'); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const unpinMessage = useMutation({
    mutationFn: async ({ roomId, messageId }: { roomId: string; messageId: string }) =>
      apiFetch(`/api/rooms/${roomId}/pins/${messageId}`, { method: 'DELETE' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['pins', activeRoomId] }); toast.success('Message unpinned'); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });

  async function uploadAttachmentToBackend(file: File): Promise<Attachment> {
    const form = new FormData();
    form.append('file', file, file.name);
    return json<Attachment>(await apiFetchForm('/api/attachments', form, { method: 'POST' }));
  }

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => uploadAttachmentToBackend(file),
  });
  const sendMessage = useMutation({
    mutationFn: async ({ roomId, content, attachmentId }: { roomId: string; content: string; attachmentId: string | null }) =>
      json<Message>(await apiFetch(`/api/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ content, replyTo: null, attachmentId }) })),
    onSuccess: async (_data, variables) => {
      clearStoredValue(`postmanchat.draft.${variables.roomId}`);
      playUiTone('send'); setDraft(''); setSelectedFile(null); setUploadWarning(null); void refetchMessages(); await refreshCore();
    },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const markNotificationRead = useMutation({
    mutationFn: async ({ notificationId }: { notificationId: string }) => json<NotificationItem>(await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const askIgris = useMutation({
    mutationFn: async ({ message }: { message: string; pendingMessageId: string }) => {
      const history: IgrisChatTurn[] = igrisMessagesRef.current
        .filter((item) => item.content !== 'Igris is typing...')
        .slice(-6)
        .map((item) => ({ role: item.role, content: item.content }));
      return json<IgrisChatResponse>(await apiFetch('/api/igris/chat', { method: 'POST', body: JSON.stringify({ message, history }) }));
    },
    onSuccess: (res, variables) => {
      const reply = typeof res.reply === 'string'
        ? res.reply
        : JSON.stringify(res.reply ?? 'Igris replied, but the response format was unexpected.');
      playUiTone('success');
      setIgrisMessages((old) => old.flatMap((item) => (
        item.id === variables.pendingMessageId
          ? [{ id: createClientId(), role: 'assistant' as const, content: reply || 'Igris had a blank reply this time. Try again.' }]
          : [item]
      )));
      setIgrisDraft('');
      void qc.invalidateQueries({ queryKey: ['igris-history'] });
    },
    onError: (error: Error, variables) => {
      const friendly = String(getUserFriendlyErrorMessage(error));
      toast.error(friendly);
      setIgrisMessages((old) => old.flatMap((item) => (
        item.id === variables.pendingMessageId
          ? [{ id: createClientId(), role: 'assistant' as const, content: friendly }]
          : [item]
      )));
    },
  });
  const submitFeedback = useMutation({
    mutationFn: async (payload: FeedbackRequest) => json<FeedbackResponse>(await apiFetch('/api/feedback', { method: 'POST', body: JSON.stringify(payload) })),
    onSuccess: (response) => {
      toast.success(response.message);
      setFeedbackForm({ category: 'feedback', subject: '', message: '', contactEmail: '' });
    },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });

  function submitIgrisMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || askIgris.isPending) return;

    const now = Date.now();
    const last = igrisCooldownRef.current;
    if (last && last.message === message && now - last.sentAt < 1500) {
      toast.message('Igris is already working on that prompt.');
      return;
    }

    const pendingMessageId = createClientId();
    igrisCooldownRef.current = { message, sentAt: now };
    setIgrisMessages((old) => [
      ...old,
      { id: createClientId(), role: 'user', content: message },
      { id: pendingMessageId, role: 'assistant', content: 'Igris is typing...' },
    ]);
    void askIgris.mutateAsync({ message, pendingMessageId });
  }

  async function uploadProfilePhoto(file: File) {
    if (!me?.profilePhotoUnlocked) {
      throw new Error('Profile photo unlock requires 5 coins');
    }
    if (!file.type.startsWith('image/')) {
      throw new Error('Profile photo must be an image');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Profile photo must be smaller than 10 MB');
    }
    const form = new FormData();
    form.append('file', file, file.name);
    const profile = await json<Profile>(await apiFetchForm('/api/me/avatar', form, { method: 'POST' }));
    return profile.avatarUrl ?? '';
  }

  async function signOut() {
    await supabase.auth.signOut();
    setIgrisDrawerOpen(false);
    nav('/login');
  }

  async function signOutAll() {
    await supabase.auth.signOut({ scope: 'global' });
    setIgrisDrawerOpen(false);
    nav('/login');
  }

  if (meLoading) {
    return (
      <div className="pm-app">
        <Sidebar
          me={undefined}
          activeView={activeView}
          onNavigate={setActiveView}
          onSignOut={() => void signOut()}
          onLaunchMission={() => {}}
          launchPending={false}
          unreadCount={0}
          unreadNotifCount={0}
          isDark={isDark}
          toggleTheme={toggleTheme}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />
        <div className="pm-main">
          <TopBar
            me={undefined}
            coins={0}
            xp={0}
            unreadCount={0}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onNotificationsClick={() => setActiveView('notifications')}
            onSettingsClick={() => setActiveView('settings')}
            onAvatarClick={() => setActiveView('profile')}
            onMenuClick={() => setSidebarOpen(true)}
            onNavigate={setActiveView}
          />
          <main className="pm-content">
            <div className="pm-card pm-card--glow" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>Connecting your account...</div>
              <div style={{ color: 'var(--pm-text-muted)' }}>
                PostmanChat is loading your profile and rooms.
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (meIsError || !me) {
    return (
      <div className="pm-app">
        <Sidebar
          me={undefined}
          activeView={activeView}
          onNavigate={setActiveView}
          onSignOut={() => void signOut()}
          onLaunchMission={() => {}}
          launchPending={false}
          unreadCount={0}
          unreadNotifCount={0}
          isDark={isDark}
          toggleTheme={toggleTheme}
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />
        <div className="pm-main">
          <TopBar
            me={undefined}
            coins={0}
            xp={0}
            unreadCount={0}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onNotificationsClick={() => setActiveView('notifications')}
            onSettingsClick={() => setActiveView('settings')}
            onAvatarClick={() => setActiveView('profile')}
            onMenuClick={() => setSidebarOpen(true)}
            onNavigate={setActiveView}
          />
          <main className="pm-content">
            <div className="pm-card pm-card--glow" style={{ maxWidth: 560, margin: '0 auto', display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 20, fontWeight: 700 }}>
                <TriangleAlert size={22} color="var(--pm-warn)" />
                We signed you in, but your chat profile did not load.
              </div>
              <div style={{ color: 'var(--pm-text-muted)', lineHeight: 1.6 }}>
                This usually means the first authenticated request to <code>/api/me</code> failed or timed out after login.
                Retry from here instead of getting stuck on a black screen.
              </div>
              {meError instanceof Error && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--pm-bg-elevated)', border: '1px solid var(--pm-border)', color: 'var(--pm-text-soft)' }}>
                  {getUserFriendlyErrorMessage(meError)}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="pm-btn pm-btn--primary" onClick={() => void refetchMe()}>
                  <RefreshCcw size={15} />
                  Retry Loading Profile
                </button>
                <button className="pm-btn pm-btn--ghost" onClick={() => void signOut()}>
                  Sign Out
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  function openIgrisDrawer() {
    if (!me?.canUseIgris) return;
    setIgrisDrawerOpen(true);
  }

  function closeIgrisDrawer() {
    setIgrisDrawerOpen(false);
  }

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitFeedback.mutateAsync({
      category: feedbackForm.category,
      subject: feedbackForm.subject.trim(),
      message: feedbackForm.message.trim(),
      contactEmail: feedbackForm.contactEmail?.trim() || undefined,
    });
  }

  async function handleSend() {
    if (!activeRoomId) return;
    let attachmentId: string | null = null;
    try {
      if (selectedFile) {
        if (selectedFile.size > 50 * 1024 * 1024) return setUploadWarning('This file is larger than 50 MB. Choose a smaller file.');
        attachmentId = (await uploadAttachment.mutateAsync(selectedFile)).id;
      }
      if (!draft.trim() && !attachmentId) return;
      sendTyping(false);
      if (typingIdleTimeoutRef.current) window.clearTimeout(typingIdleTimeoutRef.current);
      await sendMessage.mutateAsync({ roomId: activeRoomId, content: draft.trim(), attachmentId });
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error instanceof Error ? error : String(error)));
    }
  }

  async function handleVoiceSend(file: File) {
    if (!activeRoomId) return;
    try {
      const attachment = await uploadAttachment.mutateAsync(file);
      await sendMessage.mutateAsync({ roomId: activeRoomId, content: '', attachmentId: attachment.id });
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error instanceof Error ? error : String(error)));
    }
  }

  function handleDraftChange(nextDraft: string) {
    setDraft(nextDraft);
    if (activeRoomId) {
      if (nextDraft) setStoredValue(`postmanchat.draft.${activeRoomId}`, nextDraft);
      else clearStoredValue(`postmanchat.draft.${activeRoomId}`);
    }
    if (!activeRoomId || activeRoom?.type !== 'direct') return;

    if (typingIdleTimeoutRef.current) window.clearTimeout(typingIdleTimeoutRef.current);

    if (nextDraft.trim()) {
      sendTyping(true);
      typingIdleTimeoutRef.current = window.setTimeout(() => sendTyping(false), 1200);
      return;
    }

    sendTyping(false);
  }

  async function handleProfileSave() {
    try {
      let avatarUrl = profileForm.avatarUrl;
      if (profileImageFile) {
        avatarUrl = await uploadProfilePhoto(profileImageFile);
      }
      await updateProfile.mutateAsync({ ...profileForm, avatarUrl });
      setProfileImageFile(null);
      if (avatarUrl !== profileForm.avatarUrl) {
        setProfileForm((old) => ({ ...old, avatarUrl }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Profile update failed');
    }
  }

  const xpProgress = getXpProgressToNextLevel(me?.xp ?? 0);

  return (
    <div className="pm-app">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <Sidebar
        me={me}
        activeView={activeView}
        onNavigate={setActiveView}
        onSignOut={() => void signOut()}
        onLaunchMission={() => generateQuest.mutate()}
        launchPending={generateQuest.isPending}
        unreadCount={unread.length}
        unreadNotifCount={notifications.filter(n => !n.read).length}
        isDark={isDark}
        toggleTheme={toggleTheme}
        mobileOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {sidebarOpen && <button className="pm-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}

      {/* ── Main area ────────────────────────────────────── */}
      <div className="pm-main">
        <TopBar
          me={me}
          coins={me?.coins ?? 0}
          xp={me?.xp ?? 0}
          unreadCount={unread.length}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onNotificationsClick={() => setActiveView('notifications')}
          onSettingsClick={() => setActiveView('settings')}
          onAvatarClick={() => setActiveView('profile')}
          onMenuClick={() => setSidebarOpen(true)}
          onNavigate={setActiveView}
        />

        <main className={`pm-content${activeView === 'chat' ? ' pm-content--chat' : ''}`}>
          {activeView === 'chat' && (
            <ChatView
              visibleRooms={visibleRooms}
              discoverableRooms={discoverableRooms}
              activeRoomId={activeRoomId}
              setActiveRoomId={setActiveRoomId}
              roomSearch={roomSearch}
              setRoomSearch={setRoomSearch}
              orderedMessages={orderedMessages}
              me={me}
              activeRoom={activeRoom}
              joinRequests={joinRequests}
              draft={draft}
              onDraftChange={handleDraftChange}
              onSend={() => void handleSend()}
              sendPending={sendMessage.isPending || uploadAttachment.isPending}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              uploadWarning={uploadWarning}
              groupName={groupName}
              setGroupName={setGroupName}
              groupVisibility={groupVisibility}
              setGroupVisibility={setGroupVisibility}
              onCreateRoom={() => createGroupRoom.mutate({ name: groupName, visibility: groupVisibility })}
              createRoomPending={createGroupRoom.isPending}
              inviteUserId={inviteUserId}
              setInviteUserId={setInviteUserId}
              onInviteMember={() => activeRoomId && addRoomMember.mutate({ roomId: activeRoomId, targetUserId: inviteUserId })}
              invitePending={addRoomMember.isPending}
              onJoinRoom={(roomId) => joinRoom.mutate({ roomId })}
              joinPending={joinRoom.isPending}
              onApproveRequest={(roomId, userId) => approveJoinRequest.mutate({ roomId, userId })}
              onRejectRequest={(roomId, userId) => rejectJoinRequest.mutate({ roomId, userId })}
              roomTyping={roomTyping}
              formatTime={formatTime}
              initials={initials}
              getRoomTitle={getRoomTitle}
              fileBadge={fileBadge}
              messagesLoading={messagesLoading}
              onUnfriend={(userId) => unfriend.mutate({ otherUserId: userId })}
              onViewProfile={(userId) => {
                const peer = activeRoom?.directPeer?.id === userId ? activeRoom.directPeer : null;
                if (peer) setViewingProfile(peer);
              }}
              onBlock={(userId) => blockUser.mutate({ targetUserId: userId })}
              onUnblock={(userId) => unblockUser.mutate({ targetUserId: userId })}
              onToggleMute={(roomId) => toggleMuteRoom.mutate({ roomId })}
              mutePending={toggleMuteRoom.isPending}
              onToggleReaction={(messageId, emoji) => toggleReaction.mutate({ messageId, emoji })}
              mentionCandidates={mentionCandidates}
              pins={pins}
              onPinMessage={(roomId, messageId) => pinMessage.mutate({ roomId, messageId })}
              onUnpinMessage={(roomId, messageId) => unpinMessage.mutate({ roomId, messageId })}
              onSearchOpen={() => setSearchOpen(true)}
              onLoadMore={() => void loadMoreMessages()}
              hasMoreMessages={hasMoreMessages}
              loadingMoreMessages={loadingMoreMessages}
              onSendVoice={(file) => void handleVoiceSend(file)}
              voicePending={uploadAttachment.isPending && sendMessage.isPending}
              onForwardMessage={(messageId, targetRoomId) => void forwardMessage.mutateAsync({ messageId, targetRoomId })}
              onReportMessage={(messageId, reason, notes) => void submitReport.mutateAsync({ messageId, reason, notes })}
              streakDays={streak?.days}
              awayMessageCount={awayMessageCount}
            />
          )}

          {activeView === 'people' && (
            <PeopleView
              me={me}
              friends={friends}
              incoming={incoming}
              blocked={blocked}
              people={people}
              peopleSearch={peopleSearch}
              setPeopleSearch={setPeopleSearch}
              onAddFriend={(userId) => addFriend.mutate({ targetUserId: userId })}
              onAcceptFriend={(userId) => acceptFriend.mutate({ otherUserId: userId })}
              onMessage={(userId) => createDirectRoom.mutate({ targetUserId: userId })}
              onUnfriend={(userId) => unfriend.mutate({ otherUserId: userId })}
              onBlock={(userId) => blockUser.mutate({ targetUserId: userId })}
              onUnblock={(userId) => unblockUser.mutate({ targetUserId: userId })}
              addPending={addFriend.isPending}
              acceptPending={acceptFriend.isPending}
              messagePending={createDirectRoom.isPending}
              initials={initials}
            />
          )}

          {activeView === 'quests' && (
            <QuestsView
              activeQuests={activeQuests}
              completedQuests={completedQuests}
              focusMissions={focusMissions}
              nextRefreshLabel={nextFocusRefreshLabel}
              onGenerateQuest={() => generateQuest.mutate()}
              generatePending={generateQuest.isPending}
              triggerLabel={triggerLabel}
            />
          )}

          {activeView === 'igris' && (
            <IgrisView
              me={me}
              messages={igrisMessages}
              draft={igrisDraft}
              setDraft={setIgrisDraft}
              onSend={submitIgrisMessage}
              isPending={askIgris.isPending}
              igrisCoinsRemaining={igrisCoinsRemaining}
              initials={initials}
            />
          )}

          {activeView === 'board' && (
            <BoardView
              leaderboard={leaderboard}
              me={me}
              initials={initials}
            />
          )}

          {activeView === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkRead={(id) => markNotificationRead.mutate({ notificationId: id })}
              formatTime={formatTime}
            />
          )}

          {activeView === 'levels' && (
            <LevelsView
              me={me}
              xpProgress={xpProgress}
              getLevelInfo={getLevelInfo}
              activeQuestCount={activeQuests.length}
              onlineFriendsCount={onlineFriends.length}
            />
          )}

          {activeView === 'profile' && (
            <ProfileView
              me={me}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              profileImageFile={profileImageFile}
              setProfileImageFile={setProfileImageFile}
              onSave={() => void handleProfileSave()}
              savePending={updateProfile.isPending}
              onSaveStatus={(text, emoji) => void updateStatus.mutateAsync({ statusText: text, statusEmoji: emoji })}
              statusPending={updateStatus.isPending}
              friendsCount={friends.length}
              completedQuestCount={completedQuests.length}
              xpProgress={xpProgress}
              initials={initials}
            />
          )}

          {activeView === 'feedback' && (
            <FeedbackView
              form={feedbackForm}
              setForm={setFeedbackForm}
              onSubmit={handleFeedbackSubmit}
              isPending={submitFeedback.isPending}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              isDark={isDark}
              toggleTheme={toggleTheme}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              onRequestNotifications={() => {
                if ('Notification' in window) Notification.requestPermission();
              }}
              onReplayTutorial={() => tutorial.resetTutorial()}
              onSignOut={() => void signOut()}
              onSignOutAll={() => void signOutAll()}
            />
          )}
        </main>
      </div>

      {/* ── Igris FAB + Drawer ───────────────────────────── */}
      <div className={`pm-igris-fab-wrap${igrisDrawerOpen ? ' pm-igris-fab-wrap--drawer-open' : ''}`} style={{ display: activeView === 'chat' ? 'none' : undefined }}>
        <button
          className="pm-igris-fab"
          onClick={me?.canUseIgris ? (igrisDrawerOpen ? closeIgrisDrawer : openIgrisDrawer) : () => setActiveView('igris')}
        >
          <Brain size={16} /> Igris AI
        </button>
      </div>

      {igrisDrawerOpen && <button className="pm-igris-backdrop" onClick={closeIgrisDrawer} />}

      <aside
        className="pm-igris-drawer"
        style={{ transform: igrisDrawerOpen ? 'translateX(0)' : 'translateX(calc(100% + 32px))' }}
      >
        <div className="pm-igris-drawer__header">
          <div className="pm-avatar pm-avatar--sm" style={{ background: 'rgba(74,244,255,0.15)', color: 'var(--pm-accent)' }}>
            <Brain size={14} />
          </div>
          <span className="pm-igris-drawer__title">Igris AI</span>
          <button className="pm-icon-btn" style={{ border: 'none' }} onClick={closeIgrisDrawer}>✕</button>
        </div>
        <div className="pm-igris-drawer__body">
          {igrisMessages.map(msg => (
            <div key={msg.id} className={`pm-igris-msg pm-igris-msg--${msg.role === 'assistant' ? 'ai' : 'user'}`}>
              <div className="pm-igris-msg__bubble">
                {msg.content === 'Igris is typing...'
                  ? <div className="pm-typing-dots"><span /><span /><span /></div>
                  : msg.content}
              </div>
            </div>
          ))}
        </div>
        <div className="pm-igris-drawer__footer">
          <textarea
            className="pm-input pm-input--sm"
            placeholder="Ask Igris anything..."
            style={{ flex: 1, resize: 'none', height: 36 }}
            value={igrisDraft}
            onChange={e => setIgrisDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitIgrisMessage(igrisDraft); } }}
          />
          <button
            className="pm-composer__send"
            onClick={() => submitIgrisMessage(igrisDraft)}
            disabled={askIgris.isPending || !igrisDraft.trim()}
          >
            {askIgris.isPending ? <span className="pm-spinner" style={{ width: 14, height: 14 }} /> : '⚡'}
          </button>
        </div>
      </aside>

      <TutorialOverlay />
      {searchOpen && activeRoom && (
        <SearchModal
          roomId={activeRoom.id}
          roomName={activeRoom.type === 'direct' && activeRoom.directPeer ? activeRoom.directPeer.displayName : activeRoom.name}
          onClose={() => setSearchOpen(false)}
          formatTime={formatTime}
        />
      )}
      {viewingProfile && (
        <ProfileModal
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
          initials={initials}
        />
      )}
      {levelUpCelebration && (
        <LevelUpCelebration
          oldLevel={levelUpCelebration.oldLevel}
          newLevel={levelUpCelebration.newLevel}
          newTitle={levelUpCelebration.title}
          onComplete={() => setLevelUpCelebration(null)}
        />
      )}

      <nav className="pm-mobile-nav" aria-label="Mobile navigation">
        {[
          { key: 'chat' as ViewKey, label: 'Chat', icon: <MessageCircle size={20} /> },
          { key: 'people' as ViewKey, label: 'People', icon: <Users size={20} /> },
          { key: 'quests' as ViewKey, label: 'Quests', icon: <Target size={20} /> },
          { key: 'notifications' as ViewKey, label: 'Alerts', icon: <Bell size={20} /> },
          { key: 'profile' as ViewKey, label: 'Profile', icon: <User size={20} /> },
          { key: 'settings' as ViewKey, label: 'Settings', icon: <Settings2 size={20} /> },
        ].map(item => (
          <button
            key={item.key}
            className={`pm-mobile-nav__btn${activeView === item.key ? ' active' : ''}${item.key === 'notifications' && unread.length > 0 ? ' pm-mobile-nav__btn--badge' : ''}`}
            onClick={() => setActiveView(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function renderPeopleAction(person: Profile, actions: { onAddFriend: () => void; onAcceptFriend: () => void; onMessage: () => void; busy: boolean }) {
  if (person.friendshipState === 'accepted') return <button type="button" className="btn" disabled={actions.busy} onClick={actions.onMessage}>Message</button>;
  if (person.friendshipState === 'incoming') return <button type="button" className="btn" disabled={actions.busy} onClick={actions.onAcceptFriend}>Accept</button>;
  if (person.friendshipState === 'outgoing') return <button type="button" className="btn btn-secondary" disabled>Pending</button>;
  return <button type="button" className="btn" disabled={actions.busy} onClick={actions.onAddFriend}>Add friend</button>;
}

function viewIcon(view: ViewKey) {
  switch (view) {
    case 'chat': return MessageCircle;
    case 'people': return Users;
    case 'quests': return Trophy;
    case 'igris': return Brain;
    case 'board': return LayoutDashboard;
    case 'levels': return Trophy;
    case 'profile': return User;
    case 'feedback': return MessageCircle;
    default: return MessageCircle;
  }
}

function getRoomTitle(room: Room) {
  return room.type === 'direct' && room.directPeer?.displayName ? room.directPeer.displayName : room.name || '(untitled)';
}

function triggerLabel(triggerType: Quest['triggerType']) {
  switch (triggerType) {
    case 'SEND_DIRECT_MESSAGE': return 'Direct message';
    case 'SEND_GROUP_MESSAGE': return 'Group post';
    case 'CREATE_GROUP_ROOM': return 'Room creation';
    case 'UPLOAD_IMAGE': return 'Proof image';
    case 'UPLOAD_DOCUMENT': return 'Document upload';
    default: return 'In-app action';
  }
}

// Level progression helpers
interface LevelInfo {
  level: number;
  xpRequired: number;
  title: string;
  description: string;
}

function getLevelInfo(level: number): LevelInfo {
  const titles = ['Newbie', 'Explorer', 'Social Ninja', 'Quest Master', 'Legend'];
  const descriptions = [
    'Just getting started',
    'Finding your way',
    'Mastering the game',
    'Legendary presence',
    'Unstoppable force',
  ];
  const title = titles[Math.min(level - 1, titles.length - 1)] || 'Legend';
  const description = descriptions[Math.min(level - 1, descriptions.length - 1)] || 'Unstoppable force';
  
  // XP requirement per level: 10, 50, 120, 300, 750, 1875...
  // Roughly: 10 * (2.5 ^ (level - 1))
  const xpRequired = Math.ceil(10 * Math.pow(2.5, level - 1));
  
  return { level, xpRequired, title, description };
}

function getCurrentLevel(totalXp: number): number {
  let level = 1;
  let xpAccumulated = 0;
  while (true) {
    const nextLangInfo = getLevelInfo(level + 1);
    if (xpAccumulated + nextLangInfo.xpRequired > totalXp) break;
    xpAccumulated += nextLangInfo.xpRequired;
    level++;
  }
  return level;
}

function getXpProgressToNextLevel(totalXp: number): { current: number; required: number; mainProgress: number } {
  const currentLevel = getCurrentLevel(totalXp);
  let xpAccumulated = 0;
  for (let i = 1; i < currentLevel; i++) {
    xpAccumulated += getLevelInfo(i).xpRequired;
  }
  const xpInCurrentLevel = totalXp - xpAccumulated;
  const xpRequired = getLevelInfo(currentLevel).xpRequired;
  const progress = Math.min(100, (xpInCurrentLevel / xpRequired) * 100);
  return { current: xpInCurrentLevel, required: xpRequired, mainProgress: progress };
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const resolvedUrl = resolveAttachmentUrl(attachment.publicUrl);
  if (attachment.contentType.startsWith('image/')) return <img className="attachment-preview" src={resolvedUrl} alt={attachment.originalName} />;
  if (attachment.contentType.startsWith('video/')) return <video className="attachment-preview" src={resolvedUrl} controls />;
  return <a href={resolvedUrl} target="_blank" rel="noreferrer" download={attachment.originalName} className="attachment-card"><span className="attachment-icon">{fileBadge(attachment.originalName)}</span><span><strong>{attachment.originalName}</strong><small>{Math.ceil(attachment.sizeBytes / 1024)} KB</small></span></a>;
}

function readSoundPreference() {
  try { return window.localStorage.getItem('postmanchat.sound.enabled') !== '0'; } catch { return true; }
}

function setStoredValue(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures and keep state in memory.
  }
}

function clearStoredValue(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures and keep state in memory.
  }
}

function createClientId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildFocusMissions(input: { tick: number; canUseIgris: boolean; canChallengeFriends: boolean; activeQuestCount: number }): FocusMission[] {
  const library: FocusMission[] = [
    { id: 'dm-icebreaker', title: 'Soft Launch The Chaos', description: 'Send one friend a dramatic opener that sounds like you just returned from battle.', reward: 'Social XP', lane: 'DM quest' },
    { id: 'room-rebrand', title: 'Rename Energy', description: 'Write down three better room names with more aura than the current roster.', reward: 'Creative unlock energy', lane: 'Naming' },
    { id: 'pushup-proof', title: '10 Push In 10', description: 'Do 10 push-ups in the next 10 minutes and record a quick proof clip or photo for the plot.', reward: 'Max side-quest XP vibes', lane: 'Workout' },
    { id: 'water-reset', title: 'Hydration Buff', description: 'Drink water, stand up, and stretch for 90 seconds before your next message spiral.', reward: 'Focus reset', lane: 'Recovery' },
    { id: 'group-starter', title: 'Wake The Group Chat', description: 'Drop one funny line in a squad room that could actually start a thread.', reward: 'Group momentum', lane: 'Room quest' },
    { id: 'sticker-hunt', title: 'Sticker Unlock Hunt', description: 'Send or plan one reaction image that deserves to become a future sticker pack slot.', reward: 'Sticker concept credit', lane: 'Collectible' },
    { id: 'comeback-lab', title: 'Comeback Lab', description: 'Draft two harmless comeback lines that are funny, not mean, and keep your dignity intact.', reward: 'Aura repair', lane: 'Social' },
    { id: 'proof-post', title: 'Proof Or Cap', description: 'Do one tiny real-life task and upload proof so the app feels less like pure talk.', reward: 'Upload momentum', lane: 'Proof quest' },
  ];
  const offset = Math.abs(input.tick) % library.length;
  const rotated = [...library.slice(offset), ...library.slice(0, offset)];
  const picks = rotated.slice(0, 3).map((mission) => ({ ...mission }));
  if (!input.canUseIgris) {
    picks[0] = { id: 'unlock-igris', title: 'Unlock Igris', description: 'Earn coins from chat and verified quests so the full Igris console can start giving custom side quests.', reward: 'AI unlock', lane: 'Unlock' };
  }
  if (input.canChallengeFriends) {
    picks[1] = { id: 'friend-sidequest', title: 'Send A Side Quest', description: 'Pick one friend and send them a quest so the app feels like a live game, not a static inbox.', reward: 'Friend challenge XP', lane: 'Squad' };
  }
  if (input.activeQuestCount >= 3) {
    picks[2] = { id: 'quest-cleanup', title: 'Finish Your Stack', description: 'You are capped on active quests. Clear one verified mission before spawning more chaos.', reward: 'Inventory space', lane: 'Cleanup' };
  }
  return picks;
}

function formatCountdown(ms: number) {
  const safe = Math.max(0, ms);
  const minutes = Math.floor(safe / 60000);
  const seconds = Math.floor((safe % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function playUiTone(kind: 'send' | 'message' | 'alert' | 'success') {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return;
  try {
    const ctx = new window.AudioContext();
    const now = ctx.currentTime;
    const configs = {
      send:    { freq: 700,  freq2: 900,  dur: 0.10, type: 'triangle' as OscillatorType, peak: 0.18 },
      message: { freq: 523,  freq2: 784,  dur: 0.18, type: 'sine'     as OscillatorType, peak: 0.22 },
      alert:   { freq: 440,  freq2: 587,  dur: 0.22, type: 'triangle' as OscillatorType, peak: 0.20 },
      success: { freq: 880,  freq2: 1047, dur: 0.20, type: 'triangle' as OscillatorType, peak: 0.20 },
    }[kind];

    function makeOscillator(frequency: number, peakGain: number) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = configs.type;
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + configs.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + configs.dur + 0.05);
      return osc;
    }

    const osc1 = makeOscillator(configs.freq, configs.peak);
    const osc2 = makeOscillator(configs.freq2, configs.peak * 0.4);
    osc1.onended = () => { void ctx.close(); };
    void osc2;
  } catch { /* ignore AudioContext errors */ }
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'U';
}

function formatTime(value: string) {
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function fileBadge(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'PDF';
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'DOC';
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return 'XLS';
  if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return 'PPT';
  if (lower.endsWith('.zip')) return 'ZIP';
  return 'FILE';
}
