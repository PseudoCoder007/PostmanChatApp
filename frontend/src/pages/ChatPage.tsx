import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useStompRoom } from '@/hooks/useStompRoom';
import { apiFetch, apiFetchForm } from '@/lib/api';
import { getUserFriendlyErrorMessage } from '@/lib/errorMessages';
import { supabase } from '@/lib/supabase';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { LevelUpCelebration } from '@/components/LevelUpCelebration';
import type { Attachment, FriendRequest, IgrisChatResponse, IgrisChatTurn, LeaderboardEntry, Message, NotificationItem, Profile, Quest, Room, RoomJoinRequest, RoomVisibility, WsMessagePayload } from '@/types/chat';

type ViewKey = 'chat' | 'people' | 'quests' | 'igris' | 'board' | 'levels' | 'profile';
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
];

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error((await r.text()) || `${r.status}`);
  return r.json() as Promise<T>;
}

export default function ChatPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const lastNotificationRef = useRef<string | null>(null);
  const previousMessageCountRef = useRef(0);
  const previousUnreadCountRef = useRef(0);
  const [levelUpCelebration, setLevelUpCelebration] = useState<{ oldLevel: number; newLevel: number; title: string } | null>(null);
  const [activeView, setActiveView] = useState<ViewKey>('chat');
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
  const [igrisDraft, setIgrisDraft] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => readSoundPreference());
  const [focusRefreshTick, setFocusRefreshTick] = useState(() => Math.floor(Date.now() / (10 * 60 * 1000)));
  const [igrisMessages, setIgrisMessages] = useState<IgrisMessage[]>([
    { id: 'intro', role: 'assistant', content: 'Igris online. I can be your funny low-key therapist friend, boredom killer, comeback coach, or chaos planner. Tell me the lore.' },
  ]);
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => json<Profile>(await apiFetch('/api/me')), staleTime: 60000, refetchOnWindowFocus: false, retry: false });
  const { data: allRooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: async () => json<Room[]>(await apiFetch('/api/rooms')), enabled: !!me, staleTime: 60000, refetchOnWindowFocus: false, retry: false });
  const { data: discoverRooms = [] } = useQuery({
    queryKey: ['rooms', 'discover', roomSearch],
    queryFn: async () => json<Room[]>(await apiFetch(`/api/rooms/discover?${new URLSearchParams({ query: roomSearch.trim() })}`)),
    enabled: !!me && roomSearch.trim().length > 0,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const { data: friendships = [] } = useQuery({ queryKey: ['friends'], queryFn: async () => json<FriendRequest[]>(await apiFetch('/api/friends')), enabled: !!me, staleTime: 60000, refetchOnWindowFocus: false, retry: false });
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
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeRoomId],
    queryFn: async () => json<Message[]>(await apiFetch(`/api/rooms/${activeRoomId}/messages?limit=80`)),
    enabled: !!me && !!activeRoomId,
    staleTime: 15000,
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
    if (!me) return;
    const tick = () => void apiFetch('/api/me/presence', { method: 'POST' });
    tick();
    const interval = window.setInterval(tick, 60000);
    return () => window.clearInterval(interval);
  }, [me]);

  useEffect(() => {
    window.localStorage.setItem('postmanchat.sound.enabled', soundEnabled ? '1' : '0');
  }, [soundEnabled]);

  useEffect(() => {
    const refresh = () => setFocusRefreshTick(Math.floor(Date.now() / (10 * 60 * 1000)));
    refresh();
    const interval = window.setInterval(refresh, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const latest = notifications.find((item) => !item.read);
    if (!latest || latest.id === lastNotificationRef.current || !document.hidden || !('Notification' in window)) return;
    lastNotificationRef.current = latest.id;
    if (Notification.permission === 'granted') new Notification(latest.title, { body: latest.body });
  }, [notifications]);

  const orderedMessages = useMemo(() => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages]);
  const visibleRooms = allRooms;
  const discoverableRooms = roomSearch.trim()
    ? discoverRooms.filter((room) => !allRooms.some((ownRoom) => ownRoom.id === room.id))
    : [];
  const incoming = friendships.filter((item) => item.friendshipState === 'incoming');
  const friends = friendships.filter((item) => item.friendshipState === 'accepted');
  const onlineFriends = friends.filter((item) => item.profile.active);
  const unread = notifications.filter((item) => !item.read);
  const activeQuests = quests.filter((quest) => quest.status === 'assigned');
  const completedQuests = quests.filter((quest) => quest.status === 'completed');
  const activeRoom = allRooms.find((room) => room.id === activeRoomId);
  const igrisCoinsRemaining = Math.max(0, 5 - (me?.coins ?? 0));
  const focusMissions = useMemo(
    () => buildFocusMissions({ tick: focusRefreshTick, canUseIgris: !!me?.canUseIgris, canChallengeFriends: !!me?.canChallengeFriends, activeQuestCount: activeQuests.length }),
    [activeQuests.length, focusRefreshTick, me?.canChallengeFriends, me?.canUseIgris],
  );
  const nextFocusRefreshLabel = useMemo(() => formatCountdown(((focusRefreshTick + 1) * 10 * 60 * 1000) - Date.now()), [focusRefreshTick]);

  useEffect(() => {
    const count = unread.length;
    if (previousUnreadCountRef.current > 0 && count > previousUnreadCountRef.current && soundEnabled) playUiTone('alert');
    previousUnreadCountRef.current = count;
  }, [soundEnabled, unread.length]);

  useEffect(() => {
    const latest = orderedMessages[orderedMessages.length - 1];
    if (previousMessageCountRef.current > 0 && orderedMessages.length > previousMessageCountRef.current && latest?.senderId !== me?.id && soundEnabled) {
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

  function onWsEvent(payload: WsMessagePayload) {
    if (!activeRoomId || payload.message.roomId !== activeRoomId) return;
    qc.setQueryData<Message[]>(['messages', activeRoomId], (old) => {
      const list = old ?? [];
      if (payload.type === 'MESSAGE_DELETED') return list.filter((message) => message.id !== payload.message.id);
      if (payload.type === 'MESSAGE_UPDATED') return list.map((message) => (message.id === payload.message.id ? payload.message : message));
      if (list.some((message) => message.id === payload.message.id)) return list;
      return [...list, payload.message];
    });
  }

  useStompRoom(activeRoomId, onWsEvent);

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
  const generateQuest = useMutation({
    mutationFn: async () => json<Quest>(await apiFetch('/api/quests/random', { method: 'POST' })),
    onSuccess: async () => { playUiTone('success'); toast.success('New mission generated'); await refreshCore(); setActiveView('quests'); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const challengeFriend = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => json<Quest>(await apiFetch(`/api/quests/friends/${targetUserId}/random`, { method: 'POST' })),
    onSuccess: async () => { playUiTone('success'); toast.success('Friend quest sent'); await refreshCore(); setActiveView('quests'); },
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
    onSuccess: async () => { playUiTone('send'); setDraft(''); setSelectedFile(null); setUploadWarning(null); void refetchMessages(); await refreshCore(); },
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const markNotificationRead = useMutation({
    mutationFn: async ({ notificationId }: { notificationId: string }) => json<NotificationItem>(await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (error: Error) => toast.error(getUserFriendlyErrorMessage(error)),
  });
  const askIgris = useMutation({
    mutationFn: async (message: string) => {
      const history: IgrisChatTurn[] = igrisMessages.slice(-6).map((item) => ({ role: item.role, content: item.content }));
      return json<IgrisChatResponse>(await apiFetch('/api/igris/chat', { method: 'POST', body: JSON.stringify({ message, history }) }));
    },
    onSuccess: (res, message) => {
      const reply = typeof res.reply === 'string'
        ? res.reply
        : JSON.stringify(res.reply ?? 'Igris replied, but the response format was unexpected.');
      playUiTone('success');
      setIgrisMessages((old) => [...old, { id: createClientId(), role: 'user', content: message }, { id: createClientId(), role: 'assistant', content: reply || 'Igris had a blank reply this time. Try again.' }]);
      setIgrisDraft('');
    },
    onError: (error: Error, message) => { toast.error(getUserFriendlyErrorMessage(error)); setIgrisMessages((old) => [...old, { id: createClientId(), role: 'user', content: message }, { id: createClientId(), role: 'assistant', content: String(getUserFriendlyErrorMessage(error)) }]); },
  });

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
    nav('/login');
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
      await sendMessage.mutateAsync({ roomId: activeRoomId, content: draft.trim(), attachmentId });
    } catch (error) {
      toast.error(getUserFriendlyErrorMessage(error instanceof Error ? error : String(error)));
    }
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

  return (
    <div className="command-shell">
      <div className="command-backdrop" />
      <header className="topbar-panel panel">
        <div>
          <span className="hero-kicker">Squad comms / live ops / quest hub</span>
          <h1>Postman Quest Command Deck</h1>
          <p>Built as a cleaner gaming chat layout with live channels, progression, mission surfaces, notifications, and an unlockable AI console.</p>
        </div>
        <div className="topbar-actions">
          <button type="button" className="utility-chip" onClick={() => setSoundEnabled((value) => !value)}>{soundEnabled ? 'Sound On' : 'Sound Off'}</button>
          <button type="button" className="utility-chip" onClick={() => setActiveView('igris')}>{me?.canUseIgris ? 'Open Igris' : `Unlock Igris: ${igrisCoinsRemaining}`}</button>
          <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>Sign out</button>
        </div>
      </header>

      <section className="status-grid">
        <div className="stat-card tone-gold"><span>Rank</span><strong>Lv {me?.level ?? '--'}</strong><small>{me?.title ?? 'Loading'}</small></div>
        <div className="stat-card tone-blue"><span>Wallet</span><strong>{me?.coins ?? 0} coins</strong><small>{me?.profilePhotoUnlocked ? 'Photo unlocked' : 'Photo at 5 coins'}</small></div>
        <div className="stat-card tone-green"><span>Squad Online</span><strong>{onlineFriends.length}</strong><small>{friends.length} total allies</small></div>
        <div className="stat-card tone-orange"><span>Live Missions</span><strong>{activeQuests.length}</strong><small>{completedQuests.length} completed</small></div>
      </section>

      <nav className="view-switcher panel">
        {views.map((view) => <button key={view.key} type="button" className={view.key === activeView ? 'active' : ''} onClick={() => setActiveView(view.key)}>{view.label}</button>)}
      </nav>

      <section className="dashboard-layout">
        <aside className="mission-sidebar panel">
          <div className="section-header"><div><span className="eyebrow">Pilot</span><h2>{me?.displayName ?? 'Loading'}</h2></div><span className={`mini-state ${me?.active ? 'online' : 'idle'}`}>{me?.active ? 'Online' : 'Idle'}</span></div>
          <div className="player-card"><div className="avatar-plate">{initials(me?.displayName ?? 'User')}</div><div><strong>{me?.displayName ?? 'Loading...'}</strong><div className="muted-line">@{me?.username ?? 'username'}</div><div className="muted-line">{me?.xp ?? 0} XP - {me?.title ?? 'Newbie'}</div></div></div>
          <div className="panel-group">
            <div className="section-header compact"><div><span className="eyebrow">Channels</span><h3>Rooms and DMs</h3></div><span className="metric-badge">{visibleRooms.length}</span></div>
            <input className="chat-input" value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} placeholder="Search your rooms or discover public/private groups" />
            <div className="room-stack">
              {visibleRooms.map((room) => <button key={room.id} type="button" className={`room-tile ${room.id === activeRoomId ? 'active' : ''}`} onClick={() => setActiveRoomId(room.id)}><div className="room-tile-row"><strong>{getRoomTitle(room)}</strong><span className={`type-pill ${room.type}`}>{room.type === 'direct' ? 'DM' : room.visibility === 'public_room' ? 'Public' : 'Private'}</span></div><span>{room.type === 'direct' ? `Private line with ${room.directPeer?.displayName ?? 'friend'}` : `${room.memberCount} member${room.memberCount === 1 ? '' : 's'} in this room`}</span></button>)}
              {visibleRooms.length === 0 ? <div className="empty-card">No rooms yet. Create one or search to discover community spaces.</div> : null}
            </div>
            {roomSearch.trim() ? (
              <div className="panel-group">
                <div className="section-header compact"><div><span className="eyebrow">Discover</span><h3>Search results</h3></div><span className="metric-badge">{discoverableRooms.length}</span></div>
                <div className="room-stack">
                  {discoverableRooms.map((room) => <div key={room.id} className="room-tile"><div className="room-tile-row"><strong>{getRoomTitle(room)}</strong><span className={`type-pill ${room.type}`}>{room.visibility === 'public_room' ? 'Public' : 'Private'}</span></div><span>{room.visibility === 'public_room' ? 'Join instantly' : 'Request owner approval'} · {room.memberCount} member{room.memberCount === 1 ? '' : 's'}</span><div className="inline-actions"><button type="button" className="btn" disabled={joinRoom.isPending} onClick={() => joinRoom.mutate({ roomId: room.id })}>{room.visibility === 'public_room' ? 'Join room' : 'Request access'}</button></div></div>)}
                  {discoverableRooms.length === 0 ? <div className="empty-card">No discoverable rooms matched that search.</div> : null}
                </div>
              </div>
            ) : null}
            {activeRoom?.type === 'group' && activeRoom.currentUserRole === 'owner' ? (
              <div className="panel-group">
                <div className="section-header compact"><div><span className="eyebrow">Access</span><h3>Owner controls</h3></div><span className="metric-badge">{joinRequests.length} pending</span></div>
                <select className="chat-input" value={inviteUserId} onChange={(e) => setInviteUserId(e.target.value)}>
                  <option value="">Invite a friend to this room</option>
                  {friends.map((item) => <option key={item.profile.id} value={item.profile.id}>{item.profile.displayName} (@{item.profile.username})</option>)}
                </select>
                <button type="button" className="btn" disabled={!inviteUserId || addRoomMember.isPending} onClick={() => activeRoomId && addRoomMember.mutate({ roomId: activeRoomId, targetUserId: inviteUserId })}>Add friend to room</button>
                <div className="list-stack">
                  {joinRequests.map((request) => <div key={request.profile.id} className="entity-row"><div><strong>{request.profile.displayName}</strong><div className="muted-line">@{request.profile.username}</div></div><div className="inline-actions"><button type="button" className="btn" disabled={approveJoinRequest.isPending} onClick={() => activeRoomId && approveJoinRequest.mutate({ roomId: activeRoomId, userId: request.profile.id })}>Approve</button><button type="button" className="btn btn-secondary" disabled={rejectJoinRequest.isPending} onClick={() => activeRoomId && rejectJoinRequest.mutate({ roomId: activeRoomId, userId: request.profile.id })}>Reject</button></div></div>)}
                  {joinRequests.length === 0 ? <div className="empty-card">No pending room access requests.</div> : null}
                </div>
              </div>
            ) : null}
          </div>
          <div className="panel-group">
            <div className="section-header compact"><div><span className="eyebrow">Deploy</span><h3>New squad room</h3></div><span className="metric-badge">20 coins</span></div>
            <input className="chat-input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Create a dramatic room name" />
            <select className="chat-input" value={groupVisibility} onChange={(e) => setGroupVisibility(e.target.value as RoomVisibility)}>
              <option value="public_room">Public room: anyone can join from search</option>
              <option value="private_room">Private room: users request access or owner adds them</option>
            </select>
            <button type="button" className="btn" disabled={createGroupRoom.isPending || !groupName.trim()} onClick={() => createGroupRoom.mutate({ name: groupName.trim(), visibility: groupVisibility })}>Create room</button>
            {createGroupRoom.error ? <div className="error">{getUserFriendlyErrorMessage(createGroupRoom.error)}</div> : <div className="muted-line">Group room creation costs 20 coins. Public rooms are discoverable; private rooms support owner approval.</div>}
          </div>
        </aside>

        <main className="content-stage">
          {activeView === 'chat' ? (
            <section className="chat-stage">
              <section className="panel room-banner">
                <div>
                  <span className="eyebrow">Active channel</span>
                  <h2>{activeRoom ? getRoomTitle(activeRoom) : 'Select a room'}</h2>
                  <p>{activeRoom ? (activeRoom.type === 'direct' ? `Private line with @${activeRoom.directPeer?.username ?? 'friend'}` : `${orderedMessages.length} transmissions logged`) : 'Choose a room to enter the comms stream.'}</p>
                </div>
                <div className="banner-metrics">
                  <span className="metric-tag"><small>Unread</small><strong>{unread.length}</strong></span>
                  <span className="metric-tag"><small>Attachments</small><strong>{orderedMessages.filter((message) => message.attachment).length}</strong></span>
                  <span className="metric-tag"><small>Igris</small><strong>{me?.canUseIgris ? 'Ready' : `${igrisCoinsRemaining} left`}</strong></span>
                </div>
              </section>
              {activeRoom ? (
                <>
                  <section className="panel message-panel">
                    <div className="message-stream">
                      {orderedMessages.map((message) => <article key={message.id} className={`message-bubble ${message.senderId === me?.id ? 'own' : ''}`}><div className="message-avatar">{initials(message.senderDisplayName)}</div><div className="message-body"><div className="message-meta"><strong>{message.senderId === me?.id ? 'You' : message.senderDisplayName}</strong><span>@{message.senderUsername}</span><time>{formatTime(message.createdAt)}</time></div>{message.content ? <p>{message.content}</p> : null}{message.attachment ? <AttachmentPreview attachment={message.attachment} /> : null}</div></article>)}
                      {orderedMessages.length === 0 ? <div className="empty-card">No transmissions yet. Break the silence.</div> : null}
                    </div>
                  </section>
                  <section className="panel composer-panel">
                    <div className="section-header compact"><div><span className="eyebrow">Transmit</span><h3>Send message</h3></div><span className="metric-badge">8,000 max</span></div>
                    <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Send a message, quest hint, or a mildly chaotic one-liner." maxLength={8000} />
                    <div className="composer-toolbar">
                      <label className="file-picker"><span>{selectedFile ? 'Swap file' : 'Attach file'}</span><input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.zip" onChange={(e) => { const file = e.target.files?.[0] ?? null; setSelectedFile(file); setUploadWarning(file && file.size > 50 * 1024 * 1024 ? 'This file is larger than 50 MB.' : null); }} /></label>
                      <button type="button" className="btn" disabled={sendMessage.isPending || uploadAttachment.isPending || (!draft.trim() && !selectedFile)} onClick={() => void handleSend()}>Send transmission</button>
                    </div>
                    {selectedFile ? <div className="support-line">Attached: {selectedFile.name}</div> : null}
                    {uploadWarning ? <div className="error">{uploadWarning}</div> : null}
                  </section>
                </>
              ) : <section className="panel empty-state-panel"><h2>No room selected</h2><p>Pick a room on the left rail or create one.</p></section>}
            </section>
          ) : null}

          {activeView === 'people' ? (
            <section className="grid-stage">
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Requests</span><h2>Incoming allies</h2></div><span className="metric-badge">{incoming.length}</span></div><div className="list-stack">{incoming.map((item) => <div key={item.profile.id} className="entity-row"><div><strong>{item.profile.displayName}</strong><div className="muted-line">@{item.profile.username}</div></div><button type="button" className="btn" onClick={() => acceptFriend.mutate({ otherUserId: item.profile.id })}>Accept</button></div>)}{incoming.length === 0 ? <div className="empty-card">No pending requests.</div> : null}</div></section>
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Squad</span><h2>Friends list</h2></div><span className="metric-badge">{friends.length}</span></div><div className="list-stack">{friends.map((item) => <div key={item.profile.id} className="entity-row"><div><strong>{item.profile.displayName}</strong><div className="muted-line">@{item.profile.username} - {item.profile.active ? 'Online' : 'Away'}</div></div><div className="inline-actions"><button type="button" className="btn" onClick={() => createDirectRoom.mutate({ targetUserId: item.profile.id })}>Message</button><button type="button" className="btn btn-secondary" disabled={!me?.canChallengeFriends} onClick={() => challengeFriend.mutate({ targetUserId: item.profile.id })}>Quest</button></div></div>)}</div></section>
              <section className="panel full-span"><div className="section-header"><div><span className="eyebrow">Scan</span><h2>Find new players</h2></div></div><input className="chat-input" value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} placeholder="Search usernames" /><div className="list-stack">{people.map((person) => <div key={person.id} className="entity-row"><div><strong>{person.displayName}</strong><div className="muted-line">@{person.username} - {person.active ? 'Online' : 'Offline'}</div></div>{renderPeopleAction(person, { onAddFriend: () => addFriend.mutate({ targetUserId: person.id }), onAcceptFriend: () => acceptFriend.mutate({ otherUserId: person.id }), onMessage: () => createDirectRoom.mutate({ targetUserId: person.id }), busy: addFriend.isPending || acceptFriend.isPending || createDirectRoom.isPending })}</div>)}{peopleSearch.trim() && people.length === 0 ? <div className="empty-card">No players found.</div> : null}</div></section>
            </section>
          ) : null}

          {activeView === 'quests' ? (
            <section className="grid-stage">
              <section className="panel spotlight-panel full-span"><div className="section-header"><div><span className="eyebrow">Mission Control</span><h2>Auto-verified quest board</h2></div><span className="metric-badge">{activeQuests.length} active</span></div><p>Igris quests stay funny, but rewards only unlock when the app sees the matching DM, group post, room creation, proof image, or document upload.</p><div className="inline-actions"><button type="button" className="btn" disabled={generateQuest.isPending} onClick={() => generateQuest.mutate()}>Generate quest</button><button type="button" className="btn btn-secondary" onClick={() => setActiveView('igris')}>Open Igris</button></div></section>
              <section className="panel full-span"><div className="section-header"><div><span className="eyebrow">Focus Refresh</span><h2>Rotating side quests</h2></div><span className="metric-badge">Refresh {nextFocusRefreshLabel}</span></div><p>These rotate every 10 minutes to keep the app feeling alive. They are guidance prompts for Igris and your own gameplay loop; the auto-verified board above still controls guaranteed XP and coin rewards.</p><div className="list-stack">{focusMissions.map((mission) => <div key={mission.id} className="entity-row"><div><strong>{mission.title}</strong><div className="muted-line">{mission.lane} - {mission.reward}</div><div className="muted-line">{mission.description}</div></div><button type="button" className="btn btn-secondary" onClick={() => { setActiveView('igris'); setIgrisDraft(`Turn this into a fun side quest with clear steps: ${mission.title}. ${mission.description}`); }}>{me?.canUseIgris ? 'Remix with Igris' : 'Queue prompt'}</button></div>)}</div></section>
              {quests.map((quest) => <section key={quest.id} className={`panel quest-panel ${quest.status === 'completed' ? 'completed' : ''}`}><div className="section-header compact"><div><span className="eyebrow">{quest.source === 'igris' ? 'Igris mission' : 'Quest'}</span><h3>{quest.title}</h3></div><span className={`status-pill ${quest.status}`}>{quest.status}</span></div><p>{quest.description}</p><div className="banner-metrics"><span className="metric-tag"><small>XP</small><strong>{quest.rewardXp}</strong></span><span className="metric-tag"><small>Coins</small><strong>{quest.rewardCoins}</strong></span><span className="metric-tag"><small>Trigger</small><strong>{triggerLabel(quest.triggerType)}</strong></span></div><div className="support-line">{quest.status === 'assigned' ? 'Complete the matching in-app action to auto-finish this mission.' : `Completed ${new Date(quest.completedAt ?? quest.assignedAt).toLocaleString()}`}</div></section>)}
            </section>
          ) : null}

          {activeView === 'igris' ? (
            <section className="igris-stage">
              <section className="panel igris-panel">
                <div className="section-header"><div><span className="eyebrow">AI Companion</span><h2>Igris Console</h2></div><span className={`status-pill ${me?.canUseIgris ? 'completed' : 'assigned'}`}>{me?.canUseIgris ? 'online' : 'locked'}</span></div>
                {me?.canUseIgris ? (
                  <>
                    <div className="igris-stream">{igrisMessages.map((message) => <div key={message.id} className={`igris-card ${message.role}`}><strong>{message.role === 'assistant' ? 'Igris' : 'You'}</strong><p>{message.content}</p></div>)}</div>
                    <div className="composer-toolbar igris-toolbar"><input className="chat-input" value={igrisDraft} onChange={(e) => setIgrisDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && igrisDraft.trim() && !askIgris.isPending) { e.preventDefault(); askIgris.mutate(igrisDraft.trim()); } }} placeholder="Vent, ask for support, request a joke, get a comeback, or ask for a chaotic idea. Press Enter to send." /><button type="button" className="btn" disabled={askIgris.isPending || !igrisDraft.trim()} onClick={() => askIgris.mutate(igrisDraft.trim())}>Send</button></div>
                  </>
                ) : <div className="locked-panel"><div className="lock-orb">5</div><h3>Igris unlocks at 5 coins</h3><p>Earn {igrisCoinsRemaining} more coin{igrisCoinsRemaining === 1 ? '' : 's'} through chat and missions to unlock your funny supportive Gen Z sidekick.</p></div>}
              </section>
              <aside className="panel quick-panel"><div className="section-header compact"><div><span className="eyebrow">Quick prompts</span><h3>Support + chaos</h3></div></div><div className="quick-grid">{['I am bored. Entertain me for 5 minutes.', 'I feel low-key sad. Talk to me nicely.', 'Roast my room names gently but make it funny.', 'Give me a chaotic but harmless DM opener.', 'Build me a workout side quest for the next 10 minutes.', 'Give me 3 rotating daily missions for this app.'].map((prompt) => <button key={prompt} type="button" disabled={!me?.canUseIgris} onClick={() => askIgris.mutate(prompt)}>{prompt}</button>)}</div></aside>
            </section>
          ) : null}

          {activeView === 'board' ? (
            <section className="grid-stage">
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Leaderboard</span><h2>Top operators</h2></div></div><div className="list-stack">{leaderboard.map((entry) => <div key={entry.profile.id} className="leader-row"><strong>#{entry.rank}</strong><div className="leader-copy"><div>{entry.profile.displayName}</div><div className="muted-line">@{entry.profile.username}</div></div><div className="leader-score"><span>Lv {entry.profile.level}</span><span>{entry.profile.xp} XP</span></div></div>)}</div></section>
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Alerts</span><h2>Notification deck</h2></div><span className="metric-badge">{unread.length} unread</span></div><div className="list-stack">{notifications.map((item) => <button key={item.id} type="button" className={`notification-tile ${item.read ? '' : 'active'}`} onClick={() => { if (item.relatedRoomId) { setActiveRoomId(item.relatedRoomId); setActiveView('chat'); } if (!item.read) markNotificationRead.mutate({ notificationId: item.id }); }}><strong>{item.title}</strong><span>{item.body}</span></button>)}</div></section>
            </section>
          ) : null}

          {activeView === 'levels' ? (
            <section className="grid-stage">
              <section className="panel">
                <div className="section-header">
                  <div><span className="eyebrow">Progression</span><h2>Level roadmap</h2></div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>Current level</span>
                    <strong style={{ fontSize: '14px' }}>Lv {me?.level ?? 1}</strong>
                  </div>
                  <div style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', height: '8px' }}>
                    <div style={{ backgroundColor: '#4f46e5', height: '100%', width: `${getXpProgressToNextLevel(me?.xp ?? 0).mainProgress}%`, transition: 'width 0.3s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', marginTop: '6px' }}>
                    <span>{getXpProgressToNextLevel(me?.xp ?? 0).current} XP</span>
                    <span>{getXpProgressToNextLevel(me?.xp ?? 0).required} needed</span>
                  </div>
                </div>
                <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', padding: '12px', marginBottom: '16px', borderLeft: '3px solid #4f46e5' }}>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Current rank</div>
                  <strong style={{ fontSize: '18px', display: 'block' }}>{getLevelInfo(me?.level ?? 1).title}</strong>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{getLevelInfo(me?.level ?? 1).description}</div>
                </div>
              </section>
              <section className="panel">
                <div className="section-header compact"><span className="eyebrow">All levels</span><h3>Growth curve</h3></div>
                <div className="list-stack">
                  {Array.from({ length: 10 }, (_, i) => {
                    const level = i + 1;
                    const info = getLevelInfo(level);
                    const currentLevel = me?.level ?? 1;
                    const isCurrentLevel = level === currentLevel;
                    const isCompleted = level < currentLevel;
                    
                    return (
                      <div key={level} style={{ padding: '12px', backgroundColor: isCurrentLevel ? '#1a1a1a' : isCompleted ? '#0a5f0a' : '#0a0a0a', borderRadius: '6px', borderLeft: `3px solid ${isCurrentLevel ? '#4f46e5' : isCompleted ? '#22c55e' : '#444'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong>Lv {level} {info.title}</strong>
                          <span style={{ fontSize: '12px', color: isCompleted ? '#22c55e' : '#888' }}>{info.xpRequired} XP {isCompleted ? '✓' : ''}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{info.description}</div>
                        <div style={{ marginTop: '8px', backgroundColor: '#0a0a0a', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                          <div style={{ backgroundColor: isCompleted ? '#22c55e' : isCurrentLevel ? '#4f46e5' : '#333', height: '100%', width: isCompleted ? '100%' : isCurrentLevel ? `${getXpProgressToNextLevel(me?.xp ?? 0).mainProgress}%` : '0%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </section>
          ) : null}

          {activeView === 'profile' ? (
            <section className="grid-stage">
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Identity</span><h2>Profile editor</h2></div></div><input className="chat-input" value={profileForm.displayName} onChange={(e) => setProfileForm((old) => ({ ...old, displayName: e.target.value }))} placeholder="Display name" /><input className="chat-input" value={profileForm.username} onChange={(e) => setProfileForm((old) => ({ ...old, username: e.target.value.toLowerCase() }))} placeholder="Unique username" /><div style={{ position: 'relative', marginY: '16px' }}>{profileImageFile ? <div style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}><img src={URL.createObjectURL(profileImageFile)} alt="Selected preview" style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'cover' }} /><div style={{ padding: '8px', backgroundColor: '#0a0a0a', fontSize: '12px', color: '#888' }}>📷 {profileImageFile.name}</div></div> : profileForm.avatarUrl ? <div style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}><img className="attachment-preview" src={profileForm.avatarUrl} alt="Profile preview" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} /></div> : <div style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', padding: '32px', textAlign: 'center', marginBottom: '12px', color: '#666', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No photo yet</div>}</div><label className="file-picker" style={{ cursor: me?.profilePhotoUnlocked ? 'pointer' : 'not-allowed', opacity: me?.profilePhotoUnlocked ? 1 : 0.6 }}><span style={{ fontSize: '14px', fontWeight: 500 }}>{me?.profilePhotoUnlocked ? (profileImageFile || profileForm.avatarUrl ? '🔄 Swap photo' : '📸 Choose photo') : '🔒 Unlock at 5 coins'}</span><input type="file" accept="image/*" disabled={!me?.profilePhotoUnlocked} onChange={(e) => setProfileImageFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} /></label><div className="inline-actions">{profileImageFile ? <><button type="button" className="btn" disabled={updateProfile.isPending} onClick={() => void handleProfileSave()} style={{ flex: 1 }}>✓ Confirm & Save</button><button type="button" className="btn btn-secondary" disabled={updateProfile.isPending} onClick={() => setProfileImageFile(null)} style={{ flex: 1 }}>✕ Cancel</button></> : <><button type="button" className="btn" disabled={updateProfile.isPending || !profileForm.displayName.trim() || !profileForm.username.trim()} onClick={() => void handleProfileSave()}>Save loadout</button>{profileForm.avatarUrl && <button type="button" className="btn btn-secondary" disabled={updateProfile.isPending} onClick={() => { setProfileImageFile(null); void updateProfile.mutate({ ...profileForm, avatarUrl: '' }); }}>Remove photo</button>}</> }</div>{updateProfile.error ? <div className="error">{getUserFriendlyErrorMessage(updateProfile.error)}</div> : null}</section>
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Unlocks</span><h2>Progress systems</h2></div></div><div className="unlock-list"><div className="unlock-row"><strong>Profile photo</strong><span className={`status-pill ${me?.profilePhotoUnlocked ? 'completed' : 'assigned'}`}>{me?.profilePhotoUnlocked ? 'Unlocked' : 'Locked'}</span></div><div className="unlock-row"><strong>Igris console</strong><span className={`status-pill ${me?.canUseIgris ? 'completed' : 'assigned'}`}>{me?.canUseIgris ? 'Unlocked' : 'Locked'}</span></div><div className="unlock-row"><strong>Friend challenge quests</strong><span className={`status-pill ${me?.canChallengeFriends ? 'completed' : 'assigned'}`}>{me?.canChallengeFriends ? 'Unlocked' : 'Locked'}</span></div><div className="unlock-row"><strong>Group room deployment</strong><span className={`status-pill ${(me?.coins ?? 0) >= 20 ? 'completed' : 'assigned'}`}>{(me?.coins ?? 0) >= 20 ? 'Ready' : '20 coins required'}</span></div></div></section>
            </section>
          ) : null}
        </main>

        <aside className="intel-rail">
          <section className="panel"><div className="section-header compact"><div><span className="eyebrow">Live intel</span><h3>Overview</h3></div></div><div className="intel-grid"><button type="button" className="intel-tile" onClick={() => setActiveView('board')}><span>Unread alerts</span><strong>{unread.length}</strong><small>Review</small></button><button type="button" className="intel-tile" onClick={() => setActiveView('people')}><span>Online friends</span><strong>{onlineFriends.length}</strong><small>Open squad</small></button><button type="button" className="intel-tile" onClick={() => setActiveView('quests')}><span>Quest streak</span><strong>{completedQuests.length}</strong><small>Mission board</small></button><button type="button" className="intel-tile" onClick={() => setActiveView('igris')}><span>AI access</span><strong>{me?.canUseIgris ? 'Ready' : `${igrisCoinsRemaining} left`}</strong><small>Igris</small></button></div></section>
          <section className="panel"><div className="section-header compact"><div><span className="eyebrow">Focus tools</span><h3>Engagement controls</h3></div><span className="metric-badge">{nextFocusRefreshLabel}</span></div><div className="support-stack"><button type="button" className="support-button" onClick={() => setActiveView('chat')}>Return to active channel</button><button type="button" className="support-button" onClick={() => setActiveView('quests')}>Open mission board</button><button type="button" className="support-button" onClick={() => generateQuest.mutate()}>Generate AI mission</button><button type="button" className="support-button" disabled={!me?.canUseIgris} onClick={() => { setActiveView('igris'); askIgris.mutate('Give me a random funny quest that matches this app.'); }}>Ask Igris for quest ideas</button><button type="button" className="support-button" disabled={!me?.canUseIgris} onClick={() => { setActiveView('igris'); askIgris.mutate('Make me a workout planner side quest with a proof upload idea.'); }}>Workout planner</button><button type="button" className="support-button" onClick={() => setActiveView('people')}>Find squadmates</button><button type="button" className="support-button" onClick={() => { if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission(); }}>Enable browser alerts</button></div></section>
          <section className="panel"><div className="section-header compact"><div><span className="eyebrow">Daily briefing</span><h3>What matters now</h3></div></div><div className="briefing-list"><div className="briefing-row"><strong>{activeRoom ? getRoomTitle(activeRoom) : 'No active room'}</strong><span>{activeRoom ? (activeRoom.type === 'direct' ? 'Private line active.' : 'Squad channel active.') : 'Pick a room to see live traffic.'}</span></div><div className="briefing-row"><strong>{activeQuests.length} active mission{activeQuests.length === 1 ? '' : 's'}</strong><span>{activeQuests.length ? 'Complete verified actions for XP and coins.' : 'Generate a mission to start earning.'}</span></div><div className="briefing-row"><strong>{focusMissions[0]?.title ?? 'No focus card'}</strong><span>{focusMissions[0]?.description ?? 'Side quests rotate every 10 minutes.'}</span></div><div className="briefing-row"><strong>{me?.canUseIgris ? 'Igris unlocked' : 'Igris locked'}</strong><span>{me?.canUseIgris ? 'Use Igris for jokes, emotional support, chaotic prompts, workout dares, and social recovery missions.' : `Earn ${igrisCoinsRemaining} more coin${igrisCoinsRemaining === 1 ? '' : 's'} to unlock it.`}</span></div></div></section>
        </aside>
      </section>
      <TutorialOverlay />
      {levelUpCelebration && (
        <LevelUpCelebration
          oldLevel={levelUpCelebration.oldLevel}
          newLevel={levelUpCelebration.newLevel}
          newTitle={levelUpCelebration.title}
          onComplete={() => setLevelUpCelebration(null)}
        />
      )}
    </div>
  );
}

function renderPeopleAction(person: Profile, actions: { onAddFriend: () => void; onAcceptFriend: () => void; onMessage: () => void; busy: boolean }) {
  if (person.friendshipState === 'accepted') return <button type="button" className="btn" disabled={actions.busy} onClick={actions.onMessage}>Message</button>;
  if (person.friendshipState === 'incoming') return <button type="button" className="btn" disabled={actions.busy} onClick={actions.onAcceptFriend}>Accept</button>;
  if (person.friendshipState === 'outgoing') return <button type="button" className="btn btn-secondary" disabled>Pending</button>;
  return <button type="button" className="btn" disabled={actions.busy} onClick={actions.onAddFriend}>Add friend</button>;
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
  if (attachment.contentType.startsWith('image/')) return <img className="attachment-preview" src={attachment.publicUrl} alt={attachment.originalName} />;
  if (attachment.contentType.startsWith('video/')) return <video className="attachment-preview" src={attachment.publicUrl} controls />;
  return <a href={attachment.publicUrl} target="_blank" rel="noreferrer" download={attachment.originalName} className="attachment-card"><span className="attachment-icon">{fileBadge(attachment.originalName)}</span><span><strong>{attachment.originalName}</strong><small>{Math.ceil(attachment.sizeBytes / 1024)} KB</small></span></a>;
}

function readSoundPreference() {
  try { return window.localStorage.getItem('postmanchat.sound.enabled') !== '0'; } catch { return true; }
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
  const audioContext = new window.AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const settings = { send: { frequency: 680, duration: 0.08, type: 'triangle' as OscillatorType }, message: { frequency: 520, duration: 0.12, type: 'sine' as OscillatorType }, alert: { frequency: 300, duration: 0.18, type: 'square' as OscillatorType }, success: { frequency: 840, duration: 0.15, type: 'triangle' as OscillatorType } }[kind];
  oscillator.type = settings.type;
  oscillator.frequency.value = settings.frequency;
  gain.gain.value = 0.0001;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  const now = audioContext.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + settings.duration);
  oscillator.start(now);
  oscillator.stop(now + settings.duration);
  oscillator.onended = () => { void audioContext.close(); };
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
