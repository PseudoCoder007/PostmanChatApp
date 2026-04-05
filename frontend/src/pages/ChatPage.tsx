import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useStompRoom } from '@/hooks/useStompRoom';
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
  const [igrisMessages, setIgrisMessages] = useState<IgrisMessage[]>([{ id: 'intro', role: 'assistant', content: 'Igris online. Ask for jokes, funny quests, or dramatic advice.' }]);
  const bucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'chat-uploads';

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: async () => json<Profile>(await apiFetch('/api/me')) });
  const { data: allRooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: async () => json<Room[]>(await apiFetch('/api/rooms')) });
  const { data: searchedRooms = [] } = useQuery({
    queryKey: ['rooms', roomSearch],
    queryFn: async () => json<Room[]>(await apiFetch(`/api/rooms?${new URLSearchParams({ query: roomSearch.trim() })}`)),
    enabled: roomSearch.trim().length > 0,
  });
  const { data: friendships = [] } = useQuery({ queryKey: ['friends'], queryFn: async () => json<FriendRequest[]>(await apiFetch('/api/friends')) });
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
    const i = window.setInterval(tick, 60000);
    return () => window.clearInterval(i);
  }, []);
  useEffect(() => {
    const latest = notifications.find((item) => !item.read);
    if (!latest || latest.id === lastNotificationRef.current || !document.hidden || !('Notification' in window)) return;
    lastNotificationRef.current = latest.id;
    if (Notification.permission === 'granted') new Notification(latest.title, { body: latest.body });
  }, [notifications]);

  const onWsEvent = useCallback((payload: WsMessagePayload) => {
    if (!activeRoomId || payload.message.roomId !== activeRoomId) return;
    qc.setQueryData<Message[]>(['messages', activeRoomId], (old) => {
      const list = old ?? [];
      if (payload.type === 'MESSAGE_DELETED') return list.filter((message) => message.id !== payload.message.id);
      if (payload.type === 'MESSAGE_UPDATED') return list.map((message) => (message.id === payload.message.id ? payload.message : message));
      if (list.some((message) => message.id === payload.message.id)) return list;
      return [...list, payload.message];
    });
  }, [activeRoomId, qc]);
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

  const updateProfile = useMutation({ mutationFn: async () => json<Profile>(await apiFetch('/api/me', { method: 'PATCH', body: JSON.stringify(profileForm) })), onSuccess: invalidateCore });
  const generateQuest = useMutation({ mutationFn: async () => json<Quest>(await apiFetch('/api/quests/random', { method: 'POST' })), onSuccess: () => { invalidateCore(); setActiveView('quests'); } });
  const challengeFriend = useMutation({ mutationFn: async ({ targetUserId }: { targetUserId: string }) => json<Quest>(await apiFetch(`/api/quests/friends/${targetUserId}/random`, { method: 'POST' })), onSuccess: () => { invalidateCore(); setActiveView('quests'); } });
  const createGroupRoom = useMutation({
    mutationFn: async ({ name }: { name: string }) => json<Room>(await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name, type: 'group', targetUserId: null }) })),
    onSuccess: (room) => { invalidateCore(); setGroupName(''); setActiveRoomId(room.id); setActiveView('chat'); },
  });
  const addFriend = useMutation({ mutationFn: async ({ targetUserId }: { targetUserId: string }) => json<FriendRequest>(await apiFetch(`/api/friends/${targetUserId}/request`, { method: 'POST' })), onSuccess: invalidateCore });
  const acceptFriend = useMutation({ mutationFn: async ({ otherUserId }: { otherUserId: string }) => json<FriendRequest>(await apiFetch(`/api/friends/${otherUserId}/accept`, { method: 'POST' })), onSuccess: invalidateCore });
  const createDirectRoom = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) => json<Room>(await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name: '', type: 'direct', targetUserId }) })),
    onSuccess: (room) => { invalidateCore(); setPeopleSearch(''); setActiveRoomId(room.id); setActiveView('chat'); },
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
    onSuccess: () => { setDraft(''); setSelectedFile(null); setUploadWarning(null); void refetchMessages(); invalidateCore(); },
  });
  const markNotificationRead = useMutation({ mutationFn: async ({ notificationId }: { notificationId: string }) => json<NotificationItem>(await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const askIgris = useMutation({
    mutationFn: async (message: string) => json<IgrisChatResponse>(await apiFetch('/api/igris/chat', { method: 'POST', body: JSON.stringify({ message }) })),
    onSuccess: (res, message) => {
      setIgrisMessages((old) => [...old, { id: crypto.randomUUID(), role: 'user', content: message }, { id: crypto.randomUUID(), role: 'assistant', content: res.reply }]);
      setIgrisDraft('');
    },
  });

  const activeRoom = useMemo(() => allRooms.find((room) => room.id === activeRoomId), [activeRoomId, allRooms]);
  const orderedMessages = useMemo(() => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages]);
  const visibleRooms = roomSearch.trim() ? searchedRooms : allRooms;
  const incoming = friendships.filter((item) => item.friendshipState === 'incoming');
  const friends = friendships.filter((item) => item.friendshipState === 'accepted');
  const unread = notifications.filter((item) => !item.read);

  async function signOut() { await supabase.auth.signOut(); nav('/login'); }
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
    <div className="quest-shell">
      <header className="app-hero">
        <div><span className="hero-eyebrow">Realtime social messaging game</span><h1>Postman Quest Chat</h1><p>{me ? `${me.displayName} (@${me.username}) • ${me.title} • Level ${me.level}` : 'Loading profile...'}</p></div>
        <div className="hero-stats"><Chip label="XP" value={String(me?.xp ?? '--')} /><Chip label="Coins" value={String(me?.coins ?? '--')} /><Chip label="Unread" value={String(unread.length)} accent /><button type="button" className="btn btn-secondary" onClick={() => void signOut()}>Sign out</button></div>
      </header>

      <nav className="view-tabs">{views.map((view) => <button key={view.key} type="button" className={view.key === activeView ? 'active' : ''} onClick={() => setActiveView(view.key)}>{view.label}</button>)}</nav>

      {activeView === 'chat' && (
        <section className="main-layout">
          <aside className="left-rail">
            <section className="card feature-card">
              <div className="card-heading"><div><span className="eyebrow">Live rooms</span><h2>Rooms and DMs</h2></div><span className="muted-pill">{visibleRooms.length}</span></div>
              <input className="chat-input" value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} placeholder="Search rooms" />
              <div className="room-menu">{visibleRooms.map((room) => <button key={room.id} type="button" className={room.id === activeRoomId ? 'active' : ''} onClick={() => setActiveRoomId(room.id)}><strong>{getRoomTitle(room)}</strong><span>{room.type === 'direct' ? 'Friend-only DM' : 'Group room'}</span></button>)}</div>
            </section>
            <section className="card feature-card">
              <div className="card-heading"><div><span className="eyebrow">New group</span><h2>Create room</h2></div><span className="muted-pill">20 coins</span></div>
              <input className="chat-input" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Unique room name" />
              <button type="button" className="btn" disabled={createGroupRoom.isPending || !groupName.trim()} onClick={() => createGroupRoom.mutate({ name: groupName.trim() })}>Create group room</button>
              <div className="empty-note">Group creation costs 20 coins to reduce spam.</div>
              {createGroupRoom.error ? <div className="error">{String(createGroupRoom.error.message)}</div> : null}
            </section>
          </aside>
          <div className="content-panel">
            {activeRoom ? (
              <>
                <section className="card room-header-card"><div className="card-heading"><div><span className="eyebrow">{activeRoom.type === 'direct' ? 'Private line' : 'Group arena'}</span><h2>{getRoomTitle(activeRoom)}</h2></div><span className="muted-pill">{activeRoom.type === 'direct' ? `@${activeRoom.directPeer?.username ?? 'friend'}` : `${orderedMessages.length} messages`}</span></div></section>
                <section className="card message-board">{orderedMessages.map((message) => <article key={message.id} className={`message-card ${message.senderId === me?.id ? 'own' : ''}`}><div className="message-topline"><strong>{message.senderId === me?.id ? 'You' : `${message.senderDisplayName} (@${message.senderUsername})`}</strong><span>{new Date(message.createdAt).toLocaleString()}</span></div>{message.content ? <p>{message.content}</p> : null}{message.attachment ? <AttachmentPreview attachment={message.attachment} /> : null}</article>)}</section>
                <section className="card composer-card"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message your friend or room." maxLength={8000} /><div className="composer-actions"><label className="file-picker"><span>Attach file</span><input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.zip" onChange={(e) => { const file = e.target.files?.[0] ?? null; setSelectedFile(file); setUploadWarning(file && file.size > 50 * 1024 * 1024 ? 'This file is larger than 50 MB.' : null); }} /></label><button type="button" className="btn" disabled={sendMessage.isPending || uploadAttachment.isPending || (!draft.trim() && !selectedFile)} onClick={() => void handleSend()}>Send</button></div>{selectedFile ? <div className="empty-note">{selectedFile.name}</div> : null}{uploadWarning ? <div className="error">{uploadWarning}</div> : null}</section>
              </>
            ) : <section className="card feature-card"><h2>Select a room</h2><p className="empty-note">Choose a room or create a new one.</p></section>}
          </div>
        </section>
      )}

      {activeView === 'people' && (
        <section className="grid-two">
          <section className="card feature-card"><div className="card-heading"><div><span className="eyebrow">Incoming</span><h2>Friend requests</h2></div><span className="muted-pill">{incoming.length}</span></div><div className="card-list">{incoming.map((item) => <div key={item.profile.id} className="entity-card"><div><strong>{item.profile.displayName}</strong><div className="subtle-line">@{item.profile.username}</div></div><button type="button" className="btn" onClick={() => acceptFriend.mutate({ otherUserId: item.profile.id })}>Accept</button></div>)}</div></section>
          <section className="card feature-card"><div className="card-heading"><div><span className="eyebrow">Crew</span><h2>Friends</h2></div><span className="muted-pill">{friends.length}</span></div><div className="card-list">{friends.map((item) => <div key={item.profile.id} className="entity-card"><div><strong>{item.profile.displayName}</strong><div className="subtle-line">@{item.profile.username} • {item.profile.active ? 'Active' : 'Away'}</div></div><div className="entity-actions"><button type="button" className="btn" onClick={() => createDirectRoom.mutate({ targetUserId: item.profile.id })}>Message</button><button type="button" className="btn btn-secondary" disabled={!me?.canChallengeFriends} onClick={() => challengeFriend.mutate({ targetUserId: item.profile.id })}>Quest</button></div></div>)}</div></section>
          <section className="card feature-card full-span"><div className="card-heading"><div><span className="eyebrow">Search</span><h2>Find people</h2></div></div><input className="chat-input" value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} placeholder="Search usernames" /><div className="card-list">{people.map((person) => <div key={person.id} className="entity-card"><div><strong>{person.displayName}</strong><div className="subtle-line">@{person.username} • {person.active ? 'Active' : 'Away'}</div></div>{renderPeopleAction(person, { onAddFriend: () => addFriend.mutate({ targetUserId: person.id }), onAcceptFriend: () => acceptFriend.mutate({ otherUserId: person.id }), onMessage: () => createDirectRoom.mutate({ targetUserId: person.id }), busy: addFriend.isPending || acceptFriend.isPending || createDirectRoom.isPending })}</div>)}</div></section>
        </section>
      )}

      {activeView === 'quests' && (
        <section className="grid-two">
          <section className="card spotlight-card full-span"><div className="card-heading"><div><span className="eyebrow">Quest board</span><h2>Auto-verified funny missions</h2></div><span className="muted-pill">{quests.filter((quest) => quest.status === 'assigned').length} active</span></div><p className="spotlight-copy">Igris can generate funny quests, but rewards only unlock when the app sees the matching action: DM, group post, room creation, proof photo, or document upload.</p><div className="hero-actions"><button type="button" className="btn" disabled={generateQuest.isPending} onClick={() => generateQuest.mutate()}>Generate AI quest</button><button type="button" className="btn btn-secondary" onClick={() => setActiveView('igris')}>Ask Igris</button></div></section>
          {quests.map((quest) => <section key={quest.id} className={`card feature-card quest-card ${quest.status === 'completed' ? 'completed' : ''}`}><div className="card-heading"><div><span className="eyebrow">{quest.source === 'igris' ? 'Igris quest' : 'Quest'}</span><h2>{quest.title}</h2></div><span className={`status-pill ${quest.status}`}>{quest.status}</span></div><p>{quest.description}</p><div className="quest-meta"><span>{quest.rewardXp} XP</span><span>{quest.rewardCoins} coins</span><span>{triggerLabel(quest.triggerType)}</span></div><div className="empty-note">{quest.status === 'assigned' ? 'Do the matching action in the app to complete this automatically.' : `Completed ${new Date(quest.completedAt ?? quest.assignedAt).toLocaleString()}`}</div></section>)}
        </section>
      )}

      {activeView === 'igris' && (
        <section className="main-layout igris-layout">
          <div className="content-panel"><section className="card feature-card"><div className="card-heading"><div><span className="eyebrow">AI companion</span><h2>Igris</h2></div><span className="muted-pill">Funny + useful</span></div><div className="igris-feed">{igrisMessages.map((message) => <div key={message.id} className={`igris-bubble ${message.role}`}><strong>{message.role === 'assistant' ? 'Igris' : 'You'}</strong><p>{message.content}</p></div>)}</div><div className="composer-actions"><input className="chat-input" value={igrisDraft} onChange={(e) => setIgrisDraft(e.target.value)} placeholder="Ask for a joke, quest, or roast." /><button type="button" className="btn" disabled={askIgris.isPending || !igrisDraft.trim()} onClick={() => askIgris.mutate(igrisDraft.trim())}>Send</button></div></section></div>
          <aside className="left-rail"><section className="card feature-card"><div className="card-heading"><div><span className="eyebrow">Quick prompts</span><h2>Try these</h2></div></div><div className="quick-actions"><button type="button" onClick={() => askIgris.mutate('Tell me a funny joke.')}>Crack a joke</button><button type="button" onClick={() => askIgris.mutate('Give me a funny quest.')}>Funny quest</button><button type="button" onClick={() => askIgris.mutate('Roast my room names gently.')}>Roast rooms</button><button type="button" onClick={() => askIgris.mutate('Give me a weird DM opener.')}>DM opener</button></div></section></aside>
        </section>
      )}

      {activeView === 'board' && (
        <section className="grid-two">
          <section className="card feature-card"><div className="card-heading"><div><span className="eyebrow">Global ranking</span><h2>Leaderboard</h2></div></div><div className="leaderboard-list">{leaderboard.map((entry) => <div key={entry.profile.id} className="leaderboard-row"><strong>#{entry.rank}</strong><div><div>{entry.profile.displayName}</div><div className="subtle-line">@{entry.profile.username}</div></div><div className="leaderboard-score"><span>Lvl {entry.profile.level}</span><span>{entry.profile.xp} XP</span></div></div>)}</div></section>
          <section className="card feature-card"><div className="card-heading"><div><span className="eyebrow">Alerts</span><h2>Notifications</h2></div><span className="muted-pill">{unread.length} unread</span></div><div className="card-list">{notifications.map((item) => <button key={item.id} type="button" className={`notification-card ${item.read ? '' : 'active'}`} onClick={() => { if (item.relatedRoomId) { setActiveRoomId(item.relatedRoomId); setActiveView('chat'); } if (!item.read) markNotificationRead.mutate({ notificationId: item.id }); }}><strong>{item.title}</strong><span>{item.body}</span></button>)}</div></section>
        </section>
      )}

      {activeView === 'profile' && (
        <section className="grid-two">
          <section className="card feature-card"><div className="card-heading"><div><span className="eyebrow">Identity</span><h2>Profile editor</h2></div></div><input className="chat-input" value={profileForm.displayName} onChange={(e) => setProfileForm((old) => ({ ...old, displayName: e.target.value }))} placeholder="Display name" /><input className="chat-input" value={profileForm.username} onChange={(e) => setProfileForm((old) => ({ ...old, username: e.target.value.toLowerCase() }))} placeholder="Unique username" /><input className="chat-input" value={profileForm.avatarUrl} onChange={(e) => setProfileForm((old) => ({ ...old, avatarUrl: e.target.value }))} placeholder={me?.profilePhotoUnlocked ? 'Profile photo URL' : 'Unlock photo at 5 coins'} /><button type="button" className="btn" disabled={updateProfile.isPending} onClick={() => updateProfile.mutate()}>Save profile</button>{updateProfile.error ? <div className="error">{String(updateProfile.error.message)}</div> : null}</section>
          <section className="card feature-card"><div className="card-heading"><div><span className="eyebrow">Perks</span><h2>Progress summary</h2></div></div><div className="stat-grid"><Chip label="Title" value={me?.title ?? '--'} /><Chip label="Photo" value={me?.profilePhotoUnlocked ? 'Unlocked' : '5 coins'} /><Chip label="Friend quests" value={me?.canChallengeFriends ? 'Unlocked' : '10 coins'} /><Chip label="Group rooms" value="20 coins" /></div><p className="empty-note">Profile photos unlock at 5 coins. Sending friend quests unlocks at 10 coins. Group room creation costs 20 coins.</p></section>
        </section>
      )}
    </div>
  );
}

function Chip({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <div className={`stat-chip ${accent ? 'accent' : ''}`}><small>{label}</small><strong>{value}</strong></div>;
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

function triggerLabel(triggerType: Quest['triggerType']) {
  switch (triggerType) {
    case 'SEND_DIRECT_MESSAGE': return 'Verified by DM';
    case 'SEND_GROUP_MESSAGE': return 'Verified by group post';
    case 'CREATE_GROUP_ROOM': return 'Verified by room creation';
    case 'UPLOAD_IMAGE': return 'Verified by proof photo';
    case 'UPLOAD_DOCUMENT': return 'Verified by document upload';
    default: return 'Verified in app';
  }
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.contentType.startsWith('image/')) return <img className="attachment-preview" src={attachment.publicUrl} alt={attachment.originalName} />;
  if (attachment.contentType.startsWith('video/')) return <video className="attachment-preview" src={attachment.publicUrl} controls />;
  return <a href={attachment.publicUrl} target="_blank" rel="noreferrer" download={attachment.originalName} className="attachment-card"><span className="attachment-icon">{fileBadge(attachment.originalName)}</span><span><strong>{attachment.originalName}</strong><small>{Math.ceil(attachment.sizeBytes / 1024)} KB</small></span></a>;
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
