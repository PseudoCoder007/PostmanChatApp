import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useStompRoom } from '@/hooks/useStompRoom';
import type {
  Attachment,
  FriendRequest,
  LeaderboardEntry,
  Message,
  NotificationItem,
  Profile,
  Quest,
  Room,
  WsMessagePayload,
} from '@/types/chat';

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const text = await r.text();
    throw new Error(text || `${r.status}`);
  }
  return r.json() as Promise<T>;
}

export default function ChatPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const lastNotificationRef = useRef<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>();
  const [draft, setDraft] = useState('');
  const [groupName, setGroupName] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [profileForm, setProfileForm] = useState({ displayName: '', username: '', avatarUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const storageBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'chat-uploads';

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: async () => json<Profile>(await apiFetch('/api/me')),
  });

  useEffect(() => {
    if (!me) return;
    setProfileForm({
      displayName: me.displayName ?? '',
      username: me.username ?? '',
      avatarUrl: me.avatarUrl ?? '',
    });
  }, [me]);

  const { data: allRooms = [] } = useQuery({
    queryKey: ['rooms', 'all'],
    queryFn: async () => json<Room[]>(await apiFetch('/api/rooms')),
  });

  const { data: searchedRooms = [] } = useQuery({
    queryKey: ['rooms', 'search', roomSearch],
    queryFn: async () => json<Room[]>(await apiFetch(`/api/rooms?${new URLSearchParams({ query: roomSearch.trim() })}`)),
    enabled: roomSearch.trim().length > 0,
  });

  const visibleRooms = roomSearch.trim() ? searchedRooms : allRooms;

  const { data: friendships = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => json<FriendRequest[]>(await apiFetch('/api/friends')),
  });

  const { data: quests = [] } = useQuery({
    queryKey: ['quests'],
    queryFn: async () => json<Quest[]>(await apiFetch('/api/quests')),
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => json<LeaderboardEntry[]>(await apiFetch('/api/leaderboard?limit=10')),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => json<NotificationItem[]>(await apiFetch('/api/notifications')),
    refetchInterval: 15000,
  });

  const { data: people = [] } = useQuery({
    queryKey: ['profiles', peopleSearch],
    queryFn: async () =>
      json<Profile[]>(await apiFetch(`/api/profiles?${new URLSearchParams({ query: peopleSearch.trim(), limit: '10' })}`)),
    enabled: peopleSearch.trim().length >= 1,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', activeRoomId],
    queryFn: async () => json<Message[]>(await apiFetch(`/api/rooms/${activeRoomId}/messages?limit=80`)),
    enabled: !!activeRoomId,
  });

  useEffect(() => {
    if (activeRoomId && allRooms.some((room) => room.id === activeRoomId)) return;
    setActiveRoomId(allRooms[0]?.id);
  }, [activeRoomId, allRooms]);

  useEffect(() => {
    const tick = () => void apiFetch('/api/me/presence', { method: 'POST' });
    tick();
    const interval = window.setInterval(tick, 60000);
    const onVisible = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    if (!notifications.length) return;
    const latestUnread = notifications.find((item) => !item.read);
    if (!latestUnread || latestUnread.id === lastNotificationRef.current) return;
    lastNotificationRef.current = latestUnread.id;
    if (document.hidden && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(latestUnread.title, { body: latestUnread.body });
      } else if (Notification.permission === 'default') {
        void Notification.requestPermission();
      }
    }
  }, [notifications]);

  const onWsEvent = useCallback(
    (payload: WsMessagePayload) => {
      if (!activeRoomId || payload.message.roomId !== activeRoomId) return;
      qc.setQueryData<Message[]>(['messages', activeRoomId], (old) => {
        const list = old ?? [];
        if (payload.type === 'MESSAGE_DELETED') return list.filter((message) => message.id !== payload.message.id);
        if (payload.type === 'MESSAGE_UPDATED') {
          return list.map((message) => (message.id === payload.message.id ? payload.message : message));
        }
        if (list.some((message) => message.id === payload.message.id)) return list;
        return [...list, payload.message];
      });
    },
    [activeRoomId, qc],
  );

  useStompRoom(activeRoomId, onWsEvent);

  const updateProfile = useMutation({
    mutationFn: async () => json<Profile>(await apiFetch('/api/me', { method: 'PATCH', body: JSON.stringify(profileForm) })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const generateQuest = useMutation({
    mutationFn: async () => json<Quest>(await apiFetch('/api/quests/random', { method: 'POST' })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const completeQuest = useMutation({
    mutationFn: async ({ questId }: { questId: string }) => json<Quest>(await apiFetch(`/api/quests/${questId}/complete`, { method: 'POST' })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests'] });
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const challengeFriend = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) =>
      json<Quest>(await apiFetch(`/api/quests/friends/${targetUserId}/random`, { method: 'POST' })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['quests'] });
    },
  });

  const createGroupRoom = useMutation({
    mutationFn: async ({ name }: { name: string }) =>
      json<Room>(await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name, type: 'group', targetUserId: null }) })),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      setActiveRoomId(room.id);
      setGroupName('');
    },
  });

  const addFriend = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) =>
      json<FriendRequest>(await apiFetch(`/api/friends/${targetUserId}/request`, { method: 'POST' })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const acceptFriend = useMutation({
    mutationFn: async ({ otherUserId }: { otherUserId: string }) =>
      json<FriendRequest>(await apiFetch(`/api/friends/${otherUserId}/accept`, { method: 'POST' })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const createDirectRoom = useMutation({
    mutationFn: async ({ targetUserId }: { targetUserId: string }) =>
      json<Room>(await apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify({ name: '', type: 'direct', targetUserId }) })),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      setActiveRoomId(room.id);
      setPeopleSearch('');
    },
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
      const objectPath = `attachments/${crypto.randomUUID()}.${extension}`;
      const uploaded = await supabase.storage.from(storageBucket).upload(objectPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });
      if (uploaded.error) {
        throw new Error(uploaded.error.message);
      }
      const publicUrl = supabase.storage.from(storageBucket).getPublicUrl(objectPath).data.publicUrl;
      const response = await apiFetch('/api/attachments/register', {
        method: 'POST',
        body: JSON.stringify({
          originalName: file.name,
          storedName: objectPath,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          publicUrl,
        }),
      });
      return json<Attachment>(response);
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ roomId, content, attachmentId }: { roomId: string; content: string; attachmentId: string | null }) =>
      json<Message>(
        await apiFetch(`/api/rooms/${roomId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ content, replyTo: null, attachmentId }),
        }),
      ),
    onSuccess: () => {
      setDraft('');
      setSelectedFile(null);
      setUploadWarning(null);
      void refetchMessages();
      qc.invalidateQueries({ queryKey: ['me'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markNotificationRead = useMutation({
    mutationFn: async ({ notificationId }: { notificationId: string }) =>
      json<NotificationItem>(await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const orderedMessages = useMemo(() => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [messages]);
  const activeRoom = useMemo(() => allRooms.find((room) => room.id === activeRoomId), [activeRoomId, allRooms]);
  const incomingRequests = friendships.filter((item) => item.friendshipState === 'incoming');
  const acceptedFriends = friendships.filter((item) => item.friendshipState === 'accepted');
  const unreadNotifications = notifications.filter((item) => !item.read);

  async function signOut() {
    await supabase.auth.signOut();
    nav('/login');
  }

  async function handleSend() {
    if (!activeRoomId) return;
    let attachmentId: string | null = null;
    if (selectedFile) {
      if (selectedFile.size > 50 * 1024 * 1024) {
        setUploadWarning('This file is larger than 50 MB. Choose a smaller file.');
        return;
      }
      const attachment = await uploadAttachment.mutateAsync(selectedFile);
      attachmentId = attachment.id;
    }
    if (!draft.trim() && !attachmentId) return;
    sendMessage.mutate({ roomId: activeRoomId, content: draft.trim(), attachmentId });
  }

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    if (file && file.size > 50 * 1024 * 1024) {
      setUploadWarning('This file is larger than 50 MB. It cannot be uploaded.');
    } else {
      setUploadWarning(null);
    }
  }

  return (
    <div className="stack game-shell">
      <header className="row hero-bar">
        <div>
          <h1 style={{ margin: 0 }}>Postman Quest Chat</h1>
          <p className="hero-subtitle">
            {me ? `Signed in as ${me.displayName} (@${me.username}) | ${me.title} | Level ${me.level}` : 'Loading profile...'}
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      <div className="chat-layout">
        <aside className="stack sidebar-panels">
          <div className="card stack glossy-card">
            <h2 className="panel-title">Profile</h2>
            {me ? (
              <div className="gamify-strip">
                <span>Lvl {me.level}</span>
                <span>{me.xp} XP</span>
                <span>{me.coins} coins</span>
                <span>{me.title}</span>
              </div>
            ) : null}
            <input className="chat-input" value={profileForm.displayName} onChange={(e) => setProfileForm((old) => ({ ...old, displayName: e.target.value }))} placeholder="Display name" />
            <input className="chat-input" value={profileForm.username} onChange={(e) => setProfileForm((old) => ({ ...old, username: e.target.value.toLowerCase() }))} placeholder="Unique username" />
            <input className="chat-input" value={profileForm.avatarUrl} onChange={(e) => setProfileForm((old) => ({ ...old, avatarUrl: e.target.value }))} placeholder={me?.profilePhotoUnlocked ? 'Profile photo URL' : 'Unlock photo at 5 coins'} />
            <button type="button" className="btn" disabled={updateProfile.isPending} onClick={() => updateProfile.mutate()}>
              Save profile
            </button>
            {me ? (
              <div className="room-caption">
                {me.profilePhotoUnlocked ? 'Photo unlocked' : 'Photo locked until 5 coins'} |{' '}
                {me.canChallengeFriends ? 'Friend quests unlocked' : 'Friend quests unlock at 10 coins'}
              </div>
            ) : null}
            {updateProfile.error ? <div className="error">{String(updateProfile.error.message)}</div> : null}
          </div>

          <div className="card stack glossy-card">
            <h2 className="panel-title">Notifications</h2>
            {unreadNotifications.length === 0 ? <div className="room-caption">No unread notifications.</div> : null}
            <ul className="room-list">
              {notifications.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={item.read ? '' : 'active'}
                    onClick={() => {
                      if (item.relatedRoomId) setActiveRoomId(item.relatedRoomId);
                      if (!item.read) markNotificationRead.mutate({ notificationId: item.id });
                    }}
                  >
                    <span>{item.title}</span>
                    <span className="room-caption">{item.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card stack glossy-card">
            <h2 className="panel-title">Quests</h2>
            <button type="button" className="btn" disabled={generateQuest.isPending} onClick={() => generateQuest.mutate()}>
              Generate random quest
            </button>
            {generateQuest.error ? <div className="error">{String(generateQuest.error.message)}</div> : null}
            <ul className="room-list">
              {quests.map((quest) => (
                <li key={quest.id}>
                  <div className="search-result">
                    <div>
                      <div>{quest.title}</div>
                      <div className="room-caption">{quest.description}</div>
                      <div className="room-caption">Reward: {quest.rewardXp} XP / {quest.rewardCoins} coins</div>
                    </div>
                    {quest.status === 'assigned' ? (
                      <button type="button" className="btn" disabled={completeQuest.isPending} onClick={() => completeQuest.mutate({ questId: quest.id })}>
                        Complete
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary" disabled>Done</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card stack glossy-card">
            <h2 className="panel-title">Global leaderboard</h2>
            <ul className="room-list">
              {leaderboard.map((entry) => (
                <li key={entry.profile.id}>
                  <button type="button">
                    <span>#{entry.rank} {entry.profile.displayName}</span>
                    <span className="room-caption">@{entry.profile.username} - Level {entry.profile.level} - {entry.profile.xp} XP</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card stack glossy-card">
            <h2 className="panel-title">Friend requests</h2>
            {incomingRequests.length === 0 ? <div className="room-caption">No pending requests.</div> : null}
            <ul className="room-list">
              {incomingRequests.map((item) => (
                <li key={item.profile.id}>
                  <button type="button" onClick={() => acceptFriend.mutate({ otherUserId: item.profile.id })}>
                    <span>{item.profile.displayName}</span>
                    <span className="room-caption">@{item.profile.username}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card stack glossy-card">
            <h2 className="panel-title">Friends</h2>
            {acceptedFriends.length === 0 ? <div className="room-caption">Add friends to unlock direct messages.</div> : null}
            <ul className="room-list">
              {acceptedFriends.map((item) => (
                <li key={item.profile.id}>
                  <div className="search-result">
                    <div>
                      <div>{item.profile.displayName}</div>
                      <div className="room-caption">@{item.profile.username} - {item.profile.active ? 'Active' : 'Away'}</div>
                    </div>
                    <div className="row">
                      <button type="button" className="btn" onClick={() => createDirectRoom.mutate({ targetUserId: item.profile.id })}>Message</button>
                      {me?.canChallengeFriends ? (
                        <button type="button" className="btn btn-secondary" onClick={() => challengeFriend.mutate({ targetUserId: item.profile.id })}>Quest</button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card stack glossy-card">
            <h2 className="panel-title">Find people</h2>
            <input type="text" placeholder="Search people" value={peopleSearch} onChange={(e) => setPeopleSearch(e.target.value)} className="chat-input" />
            <ul className="room-list">
              {people.map((person) => (
                <li key={person.id}>
                  <div className="search-result">
                    <div>
                      <div>{person.displayName}</div>
                      <div className="room-caption">@{person.username} - {person.active ? 'Active' : 'Away'}</div>
                    </div>
                    {renderPeopleAction(person, {
                      onAddFriend: () => addFriend.mutate({ targetUserId: person.id }),
                      onAcceptFriend: () => acceptFriend.mutate({ otherUserId: person.id }),
                      onMessage: () => createDirectRoom.mutate({ targetUserId: person.id }),
                      busy: addFriend.isPending || acceptFriend.isPending || createDirectRoom.isPending,
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card stack glossy-card">
            <h2 className="panel-title">Create room</h2>
            <div className="row">
              <input type="text" placeholder="Unique room name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="chat-input" />
              <button type="button" className="btn" disabled={createGroupRoom.isPending || !groupName.trim()} onClick={() => createGroupRoom.mutate({ name: groupName.trim() })}>
                Create
              </button>
            </div>
            {createGroupRoom.error ? <div className="error">{String(createGroupRoom.error.message)}</div> : null}
          </div>

          <div className="card stack glossy-card">
            <h2 className="panel-title">Rooms</h2>
            <input type="text" placeholder="Search rooms" value={roomSearch} onChange={(e) => setRoomSearch(e.target.value)} className="chat-input" />
            {visibleRooms.length === 0 ? <div className="room-caption">No rooms match this search.</div> : null}
            <ul className="room-list">
              {visibleRooms.map((room) => (
                <li key={room.id}>
                  <button type="button" className={room.id === activeRoomId ? 'active' : ''} onClick={() => setActiveRoomId(room.id)}>
                    <span>{getRoomTitle(room)}</span>
                    <span className="room-caption">{room.type === 'direct' ? 'Direct' : 'Group room'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="stack">
          {activeRoomId && activeRoom ? (
            <>
              <div className="card stack glossy-card" style={{ gap: '0.25rem' }}>
                <h2 style={{ margin: 0 }}>{getRoomTitle(activeRoom)}</h2>
                <div className="message-meta">
                  {activeRoom.type === 'direct'
                    ? `Direct conversation with @${activeRoom.directPeer?.username ?? 'unknown'}`
                    : 'Group room'}
                </div>
              </div>

              <div className="messages glossy-card">
                {orderedMessages.map((message) => (
                  <div key={message.id} className="message">
                    <div className="message-meta">
                      {message.senderId === me?.id ? 'You' : `${message.senderDisplayName} (@${message.senderUsername})`} -{' '}
                      {new Date(message.createdAt).toLocaleString()}
                      {message.editedAt ? ' (edited)' : ''}
                    </div>
                    {message.content ? <div>{message.content}</div> : null}
                    {message.attachment ? <AttachmentPreview attachment={message.attachment} /> : null}
                  </div>
                ))}
              </div>

              <div className="composer stack card glossy-card">
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message (no < or > characters)" maxLength={8000} />
                <div className="row">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                  />
                  {selectedFile ? <span className="room-caption">{selectedFile.name}</span> : null}
                </div>
                {uploadWarning ? <div className="error">{uploadWarning}</div> : null}
                <button
                  type="button"
                  className="btn"
                  disabled={sendMessage.isPending || uploadAttachment.isPending || (!draft.trim() && !selectedFile) || !activeRoomId}
                  onClick={() => void handleSend()}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p>Select a room, search for a friend, or create a new room.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function renderPeopleAction(
  person: Profile,
  actions: { onAddFriend: () => void; onAcceptFriend: () => void; onMessage: () => void; busy: boolean },
) {
  if (person.friendshipState === 'accepted') {
    return <button type="button" className="btn" disabled={actions.busy} onClick={actions.onMessage}>Message</button>;
  }
  if (person.friendshipState === 'incoming') {
    return <button type="button" className="btn" disabled={actions.busy} onClick={actions.onAcceptFriend}>Accept</button>;
  }
  if (person.friendshipState === 'outgoing') {
    return <button type="button" className="btn btn-secondary" disabled>Pending</button>;
  }
  return <button type="button" className="btn" disabled={actions.busy} onClick={actions.onAddFriend}>Add friend</button>;
}

function getRoomTitle(room: Room): string {
  if (room.type === 'direct' && room.directPeer?.displayName) return room.directPeer.displayName;
  return room.name || '(untitled)';
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  if (attachment.contentType.startsWith('image/')) {
    return <img className="attachment-preview" src={attachment.publicUrl} alt={attachment.originalName} />;
  }
  if (attachment.contentType.startsWith('video/')) {
    return <video className="attachment-preview" src={attachment.publicUrl} controls />;
  }
  return (
    <a href={attachment.publicUrl} target="_blank" rel="noreferrer" className="attachment-link">
      {attachment.originalName} ({Math.ceil(attachment.sizeBytes / 1024)} KB)
    </a>
  );
}
