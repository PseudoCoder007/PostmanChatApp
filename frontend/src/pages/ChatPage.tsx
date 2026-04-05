import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useStompRoom } from '@/hooks/useStompRoom';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Attachment, FriendRequest, IgrisChatResponse, LeaderboardEntry, Message, NotificationItem, Profile, Quest, Room, WsMessagePayload } from '@/types/chat';

type ViewKey = 'chat' | 'people' | 'quests' | 'igris' | 'board' | 'profile';
type IgrisMessage = { id: string; role: 'user' | 'assistant'; content: string };

const views: Array<{ key: ViewKey; label: string }> = [
  { key: 'chat', label: 'Chat' },
  { key: 'people', label: 'People' },
  { key: 'quests', label: 'Quests' },
  { key: 'igris', label: 'Igris' },
  { key: 'board', label: 'Board' },
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
  const [activeView, setActiveView] = useState<ViewKey>('chat');
  const [activeRoomId, setActiveRoomId] = useState<string>();
  const [draft, setDraft] = useState('');
  const [groupName, setGroupName] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [profileForm, setProfileForm] = useState({ displayName: '', username: '', avatarUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [igrisDraft, setIgrisDraft] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => readSoundPreference());
  const [igrisMessages, setIgrisMessages] = useState<IgrisMessage[]>([
    { id: 'intro', role: 'assistant', content: 'Igris online. I can be your funny low-key therapist friend, boredom killer, comeback coach, or chaos planner. Tell me the lore.' },
  ]);
  const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'chat-uploads';

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => json<Profile>(await apiFetch('/api/me')), refetchInterval: 30000 });
  const { data: allRooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: async () => json<Room[]>(await apiFetch('/api/rooms')), refetchInterval: 30000 });
  const { data: searchedRooms = [] } = useQuery({
    queryKey: ['rooms', roomSearch],
    queryFn: async () => json<Room[]>(await apiFetch(`/api/rooms?${new URLSearchParams({ query: roomSearch.trim() })}`)),
    enabled: roomSearch.trim().length > 0,
  });
  const { data: friendships = [] } = useQuery({ queryKey: ['friends'], queryFn: async () => json<FriendRequest[]>(await apiFetch('/api/friends')), refetchInterval: 30000 });
  const { data: quests = [] } = useQuery({ queryKey: ['quests'], queryFn: async () => json<Quest[]>(await apiFetch('/api/quests')) });
  const { data: leaderboard = [] } = useQuery({ queryKey: ['leaderboard'], queryFn: async () => json<LeaderboardEntry[]>(await apiFetch('/api/leaderboard?limit=20')) });
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => json<NotificationItem[]>(await apiFetch('/api/notifications')),
    refetchInterval: 15000,
  });
  const { data: people = [] } = useQuery({
    queryKey: ['profiles', peopleSearch],
    queryFn: async () => json<Profile[]>(await apiFetch(`/api/profiles?${new URLSearchParams({ query: peopleSearch.trim(), limit: '10' })}`)),
    enabled: peopleSearch.trim().length > 0,
  });
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeRoomId],
    queryFn: async () => json<Message[]>(await apiFetch(`/api/rooms/${activeRoomId}/messages?limit=80`)),
    enabled: !!activeRoomId,
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
    const tick = () => void apiFetch('/api/me/presence', { method: 'POST' });
    tick();
    const interval = window.setInterval(tick, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('postmanchat.sound.enabled', soundEnabled ? '1' : '0');
  }, [soundEnabled]);

  useEffect(() => {
    const latest = notifications.find((item) => !item.read);
    if (!latest || latest.id === lastNotificationRef.current || !document.hidden || !('Notification' in window)) return;
    lastNotificationRef.current = latest.id;
    if (Notification.permission === 'granted') new Notification(latest.title, { body: latest.body });
  }, [notifications]);

  const orderedMessages = useMemo(() => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages]);
  const visibleRooms = roomSearch.trim() ? searchedRooms : allRooms;
  const incoming = friendships.filter((item) => item.friendshipState === 'incoming');
  const friends = friendships.filter((item) => item.friendshipState === 'accepted');
  const onlineFriends = friends.filter((item) => item.profile.active);
  const unread = notifications.filter((item) => !item.read);
  const activeQuests = quests.filter((quest) => quest.status === 'assigned');
  const completedQuests = quests.filter((quest) => quest.status === 'completed');
  const activeRoom = allRooms.find((room) => room.id === activeRoomId);
  const igrisCoinsRemaining = Math.max(0, 5 - (me?.coins ?? 0));

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

  const invalidateCore = () => {
    qc.invalidateQueries({ queryKey: ['me'] });
    qc.invalidateQueries({ queryKey: ['rooms'] });
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['profiles'] });
    qc.invalidateQueries({ queryKey: ['quests'] });
    qc.invalidateQueries({ queryKey: ['leaderboard'] });
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const updateProfile = useMutation({
    mutationFn: async () => json<Profile>(await apiFetch('/api/me', { method: 'PATCH', body: JSON.stringify(profileForm) })),
    onSuccess: () => { toast.success('Profile updated'); invalidateCore(); },
    onError: (error: Error) => toast.error(error.message || 'Profile update failed'),
  });
  const generateQuest = useMutation({
    mutationFn: async () => json<Quest>(await apiFetch('/api/quests/random', { method: 'POST' })),
    onSuccess: () => { playUiTone('success'); toast.success('New mission generated'); invalidateCore(); setActiveView('quests'); },
    onError: (error: Error) => toast.error(error.message || 'Quest generation failed'),
  });
  const challengeFriend = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => json<Quest>(await apiFetch(`/api/quests/friends/${targetUserId}/random`, { method: 'POST' })),
    onSuccess: () => { playUiTone('success'); toast.success('Friend quest sent'); invalidateCore(); setActiveView('quests'); },
    onError: (error: Error) => toast.error(error.message || 'Friend quest failed'),
  });
  const createGroupRoom = useMutation({
    mutationFn: async ({ name }: { name: string }) => json<Room>(await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name, type: 'group', targetUserId: null }) })),
    onSuccess: (room) => { playUiTone('success'); toast.success('Room deployed'); invalidateCore(); setGroupName(''); setActiveRoomId(room.id); setActiveView('chat'); },
    onError: (error: Error) => toast.error(error.message || 'Room creation failed'),
  });
  const addFriend = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => json<FriendRequest>(await apiFetch(`/api/friends/${targetUserId}/request`, { method: 'POST' })),
    onSuccess: () => { toast.success('Friend request sent'); invalidateCore(); },
    onError: (error: Error) => toast.error(error.message || 'Friend request failed'),
  });
  const acceptFriend = useMutation({
    mutationFn: async ({ otherUserId }: { otherUserId: string }) => json<FriendRequest>(await apiFetch(`/api/friends/${otherUserId}/accept`, { method: 'POST' })),
    onSuccess: () => { toast.success('Friend request accepted'); invalidateCore(); },
    onError: (error: Error) => toast.error(error.message || 'Accept failed'),
  });
  const createDirectRoom = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => json<Room>(await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name: '', type: 'direct', targetUserId }) })),
    onSuccess: (room) => { playUiTone('success'); toast.success('Direct room opened'); invalidateCore(); setPeopleSearch(''); setActiveRoomId(room.id); setActiveView('chat'); },
    onError: (error: Error) => toast.error(error.message || 'Direct room failed'),
  });
  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
      const objectPath = `attachments/${crypto.randomUUID()}.${ext}`;
      const uploaded = await supabase.storage.from(bucket).upload(objectPath, file, { cacheControl: '3600', upsert: false, contentType: file.type || guessFileType(file.name) });
      if (uploaded.error) throw new Error(uploaded.error.message);
      const publicUrl = supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
      return json<Attachment>(await apiFetch('/api/attachments/register', { method: 'POST', body: JSON.stringify({ originalName: file.name, storedName: objectPath, contentType: file.type || guessFileType(file.name), sizeBytes: file.size, publicUrl }) }));
    },
  });
  const sendMessage = useMutation({
    mutationFn: async ({ roomId, content, attachmentId }: { roomId: string; content: string; attachmentId: string | null }) =>
      json<Message>(await apiFetch(`/api/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ content, replyTo: null, attachmentId }) })),
    onSuccess: () => { playUiTone('send'); setDraft(''); setSelectedFile(null); setUploadWarning(null); void refetchMessages(); invalidateCore(); },
    onError: (error: Error) => toast.error(error.message || 'Message send failed'),
  });
  const markNotificationRead = useMutation({
    mutationFn: async ({ notificationId }: { notificationId: string }) => json<NotificationItem>(await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (error: Error) => toast.error(error.message || 'Notification update failed'),
  });
  const askIgris = useMutation({
    mutationFn: async (message: string) => json<IgrisChatResponse>(await apiFetch('/api/igris/chat', { method: 'POST', body: JSON.stringify({ message }) })),
    onSuccess: (res, message) => { playUiTone('success'); setIgrisMessages((old) => [...old, { id: crypto.randomUUID(), role: 'user', content: message }, { id: crypto.randomUUID(), role: 'assistant', content: res.reply }]); setIgrisDraft(''); },
    onError: (error: Error, message) => { toast.error(error.message || 'Igris comms failed'); setIgrisMessages((old) => [...old, { id: crypto.randomUUID(), role: 'user', content: message }, { id: crypto.randomUUID(), role: 'assistant', content: String(error.message || 'Igris comms failed.') }]); },
  });

  async function signOut() {
    await supabase.auth.signOut();
    nav('/login');
  }

  async function handleSend() {
    if (!activeRoomId) return;
    let attachmentId: string | null = null;
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) return setUploadWarning('This file is larger than 50 MB. Choose a smaller file.');
      attachmentId = (await uploadAttachment.mutateAsync(selectedFile)).id;
    }
    if (!draft.trim() && !attachmentId) return;
    sendMessage.mutate({ roomId: activeRoomId, content: draft.trim(), attachmentId });
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
        <div className="stat-card tone-blue"><span>Wallet</span><strong>{me?.coins ?? '--'} coins</strong><small>{me?.profilePhotoUnlocked ? 'Photo unlocked' : 'Photo at 5 coins'}</small></div>
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
            <input className="chat-input" value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} placeholder="Search channels" />
            <div className="room-stack">
              {visibleRooms.map((room) => <button key={room.id} type="button" className={`room-tile ${room.id === activeRoomId ? 'active' : ''}`} onClick={() => setActiveRoomId(room.id)}><div className="room-tile-row"><strong>{getRoomTitle(room)}</strong><span className={`type-pill ${room.type}`}>{room.type === 'direct' ? 'DM' : 'Squad'}</span></div><span>{room.type === 'direct' ? `Private line with ${room.directPeer?.displayName ?? 'friend'}` : 'Shared team channel'}</span></button>)}
              {visibleRooms.length === 0 ? <div className="empty-card">No channels match your search.</div> : null}
            </div>
          </div>
          <div className="panel-group">
            <div className="section-header compact"><div><span className="eyebrow">Deploy</span><h3>New squad room</h3></div><span className="metric-badge">20 coins</span></div>
            <input className="chat-input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Create a dramatic room name" />
            <button type="button" className="btn" disabled={createGroupRoom.isPending || !groupName.trim()} onClick={() => createGroupRoom.mutate({ name: groupName.trim() })}>Create room</button>
            {createGroupRoom.error ? <div className="error">{String(createGroupRoom.error.message)}</div> : <div className="muted-line">Group room creation costs 20 coins.</div>}
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
                    <div className="composer-toolbar igris-toolbar"><input className="chat-input" value={igrisDraft} onChange={(e) => setIgrisDraft(e.target.value)} placeholder="Vent, ask for support, request a joke, get a comeback, or ask for a chaotic idea." /><button type="button" className="btn" disabled={askIgris.isPending || !igrisDraft.trim()} onClick={() => askIgris.mutate(igrisDraft.trim())}>Send</button></div>
                  </>
                ) : <div className="locked-panel"><div className="lock-orb">5</div><h3>Igris unlocks at 5 coins</h3><p>Earn {igrisCoinsRemaining} more coin{igrisCoinsRemaining === 1 ? '' : 's'} through chat and missions to unlock your funny supportive Gen Z sidekick.</p></div>}
              </section>
              <aside className="panel quick-panel"><div className="section-header compact"><div><span className="eyebrow">Quick prompts</span><h3>Support + chaos</h3></div></div><div className="quick-grid">{['I am bored. Entertain me for 5 minutes.', 'I feel low-key sad. Talk to me nicely.', 'Roast my room names gently but make it funny.', 'Give me a chaotic but harmless DM opener.'].map((prompt) => <button key={prompt} type="button" disabled={!me?.canUseIgris} onClick={() => askIgris.mutate(prompt)}>{prompt}</button>)}</div></aside>
            </section>
          ) : null}

          {activeView === 'board' ? (
            <section className="grid-stage">
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Leaderboard</span><h2>Top operators</h2></div></div><div className="list-stack">{leaderboard.map((entry) => <div key={entry.profile.id} className="leader-row"><strong>#{entry.rank}</strong><div className="leader-copy"><div>{entry.profile.displayName}</div><div className="muted-line">@{entry.profile.username}</div></div><div className="leader-score"><span>Lv {entry.profile.level}</span><span>{entry.profile.xp} XP</span></div></div>)}</div></section>
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Alerts</span><h2>Notification deck</h2></div><span className="metric-badge">{unread.length} unread</span></div><div className="list-stack">{notifications.map((item) => <button key={item.id} type="button" className={`notification-tile ${item.read ? '' : 'active'}`} onClick={() => { if (item.relatedRoomId) { setActiveRoomId(item.relatedRoomId); setActiveView('chat'); } if (!item.read) markNotificationRead.mutate({ notificationId: item.id }); }}><strong>{item.title}</strong><span>{item.body}</span></button>)}</div></section>
            </section>
          ) : null}

          {activeView === 'profile' ? (
            <section className="grid-stage">
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Identity</span><h2>Profile editor</h2></div></div><input className="chat-input" value={profileForm.displayName} onChange={(e) => setProfileForm((old) => ({ ...old, displayName: e.target.value }))} placeholder="Display name" /><input className="chat-input" value={profileForm.username} onChange={(e) => setProfileForm((old) => ({ ...old, username: e.target.value.toLowerCase() }))} placeholder="Unique username" /><input className="chat-input" value={profileForm.avatarUrl} onChange={(e) => setProfileForm((old) => ({ ...old, avatarUrl: e.target.value }))} placeholder={me?.profilePhotoUnlocked ? 'Profile photo URL' : 'Unlock photo at 5 coins'} /><button type="button" className="btn" disabled={updateProfile.isPending} onClick={() => updateProfile.mutate()}>Save loadout</button>{updateProfile.error ? <div className="error">{String(updateProfile.error.message)}</div> : null}</section>
              <section className="panel"><div className="section-header"><div><span className="eyebrow">Unlocks</span><h2>Progress systems</h2></div></div><div className="unlock-list"><div className="unlock-row"><strong>Profile photo</strong><span className={`status-pill ${me?.profilePhotoUnlocked ? 'completed' : 'assigned'}`}>{me?.profilePhotoUnlocked ? 'Unlocked' : 'Locked'}</span></div><div className="unlock-row"><strong>Igris console</strong><span className={`status-pill ${me?.canUseIgris ? 'completed' : 'assigned'}`}>{me?.canUseIgris ? 'Unlocked' : 'Locked'}</span></div><div className="unlock-row"><strong>Friend challenge quests</strong><span className={`status-pill ${me?.canChallengeFriends ? 'completed' : 'assigned'}`}>{me?.canChallengeFriends ? 'Unlocked' : 'Locked'}</span></div><div className="unlock-row"><strong>Group room deployment</strong><span className={`status-pill ${(me?.coins ?? 0) >= 20 ? 'completed' : 'assigned'}`}>{(me?.coins ?? 0) >= 20 ? 'Ready' : '20 coins required'}</span></div></div></section>
            </section>
          ) : null}
        </main>

        <aside className="intel-rail">
          <section className="panel"><div className="section-header compact"><div><span className="eyebrow">Live intel</span><h3>Overview</h3></div></div><div className="intel-grid"><button type="button" className="intel-tile" onClick={() => setActiveView('board')}><span>Unread alerts</span><strong>{unread.length}</strong><small>Review</small></button><button type="button" className="intel-tile" onClick={() => setActiveView('people')}><span>Online friends</span><strong>{onlineFriends.length}</strong><small>Open squad</small></button><button type="button" className="intel-tile" onClick={() => setActiveView('quests')}><span>Quest streak</span><strong>{completedQuests.length}</strong><small>Mission board</small></button><button type="button" className="intel-tile" onClick={() => setActiveView('igris')}><span>AI access</span><strong>{me?.canUseIgris ? 'Ready' : `${igrisCoinsRemaining} left`}</strong><small>Igris</small></button></div></section>
          <section className="panel"><div className="section-header compact"><div><span className="eyebrow">Focus tools</span><h3>Engagement controls</h3></div></div><div className="support-stack"><button type="button" className="support-button" onClick={() => setActiveView('chat')}>Return to active channel</button><button type="button" className="support-button" onClick={() => setActiveView('quests')}>Open mission board</button><button type="button" className="support-button" onClick={() => setActiveView('people')}>Find squadmates</button><button type="button" className="support-button" onClick={() => { if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission(); }}>Enable browser alerts</button></div></section>
          <section className="panel"><div className="section-header compact"><div><span className="eyebrow">Daily briefing</span><h3>What matters now</h3></div></div><div className="briefing-list"><div className="briefing-row"><strong>{activeRoom ? getRoomTitle(activeRoom) : 'No active room'}</strong><span>{activeRoom ? (activeRoom.type === 'direct' ? 'Private line active.' : 'Squad channel active.') : 'Pick a room to see live traffic.'}</span></div><div className="briefing-row"><strong>{activeQuests.length} active mission{activeQuests.length === 1 ? '' : 's'}</strong><span>{activeQuests.length ? 'Complete verified actions for XP and coins.' : 'Generate a mission to start earning.'}</span></div><div className="briefing-row"><strong>{me?.canUseIgris ? 'Igris unlocked' : 'Igris locked'}</strong><span>{me?.canUseIgris ? 'Use Igris for jokes, emotional support, chaotic prompts, and social recovery missions.' : `Earn ${igrisCoinsRemaining} more coin${igrisCoinsRemaining === 1 ? '' : 's'} to unlock it.`}</span></div></div></section>
        </aside>
      </section>
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

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.contentType.startsWith('image/')) return <img className="attachment-preview" src={attachment.publicUrl} alt={attachment.originalName} />;
  if (attachment.contentType.startsWith('video/')) return <video className="attachment-preview" src={attachment.publicUrl} controls />;
  return <a href={attachment.publicUrl} target="_blank" rel="noreferrer" download={attachment.originalName} className="attachment-card"><span className="attachment-icon">{fileBadge(attachment.originalName)}</span><span><strong>{attachment.originalName}</strong><small>{Math.ceil(attachment.sizeBytes / 1024)} KB</small></span></a>;
}

function readSoundPreference() {
  try { return window.localStorage.getItem('postmanchat.sound.enabled') !== '0'; } catch { return true; }
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

function guessFileType(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.ppt')) return 'application/vnd.ms-powerpoint';
  if (lower.endsWith('.pptx')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  if (lower.endsWith('.txt')) return 'text/plain';
  if (lower.endsWith('.zip')) return 'application/zip';
  return 'application/octet-stream';
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
