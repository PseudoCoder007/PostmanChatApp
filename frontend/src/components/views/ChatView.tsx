import { useEffect, useRef, useState } from 'react';
import {
  Hash, Plus, Search, Send, Paperclip, X,
  Lock, Globe, ChevronDown, ChevronUp, UserPlus, Check, MoreVertical
} from 'lucide-react';
import { resolveAttachmentUrl } from '@/lib/api';
import type {
  Message, Room, Profile, RoomJoinRequest, TypingEvent, RoomVisibility, Attachment
} from '@/types/chat';

interface ChatViewProps {
  visibleRooms: Room[];
  discoverableRooms: Room[];
  activeRoomId: string | undefined;
  setActiveRoomId: (id: string) => void;
  roomSearch: string;
  setRoomSearch: (v: string) => void;
  orderedMessages: Message[];
  me: Profile | undefined;
  activeRoom: Room | undefined;
  joinRequests: RoomJoinRequest[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  sendPending: boolean;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  uploadWarning: string | null;
  groupName: string;
  setGroupName: (v: string) => void;
  groupVisibility: RoomVisibility;
  setGroupVisibility: (v: RoomVisibility) => void;
  onCreateRoom: () => void;
  createRoomPending: boolean;
  inviteUserId: string;
  setInviteUserId: (v: string) => void;
  onInviteMember: () => void;
  invitePending: boolean;
  onJoinRoom: (roomId: string) => void;
  joinPending: boolean;
  onApproveRequest: (roomId: string, userId: string) => void;
  onRejectRequest: (roomId: string, userId: string) => void;
  roomTyping: TypingEvent | null;
  formatTime: (v: string) => string;
  initials: (v: string) => string;
  getRoomTitle: (r: Room) => string;
  fileBadge: (name: string) => string;
  messagesLoading?: boolean;
  onUnfriend?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  onUnblock?: (userId: string) => void;
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const url = resolveAttachmentUrl(attachment.publicUrl);
  if (attachment.contentType.startsWith('image/'))
    return <img src={url} alt={attachment.originalName} style={{ maxWidth: 240, maxHeight: 160, borderRadius: 8, display: 'block' }} />;
  if (attachment.contentType.startsWith('video/'))
    return <video src={url} controls style={{ maxWidth: 280 }} />;
  return (
    <a href={url} target="_blank" rel="noreferrer" download={attachment.originalName} className="pm-msg-bubble__attachment">
      <span>📄</span>
      <span>{attachment.originalName}</span>
    </a>
  );
}

export default function ChatView({
  visibleRooms, discoverableRooms, activeRoomId, setActiveRoomId,
  roomSearch, setRoomSearch, orderedMessages, me, activeRoom,
  joinRequests, draft, onDraftChange, onSend, sendPending,
  selectedFile, setSelectedFile, uploadWarning,
  groupName, setGroupName, groupVisibility, setGroupVisibility,
  onCreateRoom, createRoomPending, inviteUserId, setInviteUserId,
  onInviteMember, invitePending, onJoinRoom, joinPending,
  onApproveRequest, onRejectRequest, roomTyping,
  formatTime, initials, getRoomTitle, fileBadge,
  messagesLoading, onUnfriend, onViewProfile, onBlock, onUnblock,
}: ChatViewProps) {
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [activeTab, setActiveTab] = useState<'dm' | 'group'>('dm');
  const [showDmMenu, setShowDmMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dmMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [orderedMessages.length]);

  // Auto-switch tab when active room changes externally (e.g. from People view)
  useEffect(() => {
    if (!activeRoom) return;
    if (activeRoom.type === 'direct' && activeTab !== 'dm') setActiveTab('dm');
    if (activeRoom.type === 'group' && activeTab !== 'group') setActiveTab('group');
  }, [activeRoom?.id]);

  // Close DM menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dmMenuRef.current && !dmMenuRef.current.contains(e.target as Node)) {
        setShowDmMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const channels = visibleRooms.filter(r => r.type === 'group');
  const dms = visibleRooms.filter(r => r.type === 'direct');

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
    e.target.value = '';
  }

  return (
    <div className="pm-chat-layout">
      {/* Rooms Panel */}
      <div className="pm-rooms-panel">
        <div className="pm-rooms-panel__header">
          <span className="pm-rooms-panel__title">
            {activeTab === 'dm' ? 'Direct Messages' : 'Group Rooms'}
          </span>
        </div>

        {/* Tab switcher */}
        <div className="pm-rooms-tabs">
          <button
            className={`pm-rooms-tab${activeTab === 'dm' ? ' active' : ''}`}
            onClick={() => setActiveTab('dm')}
          >
            DMs
            {dms.length > 0 && <span className="pm-rooms-tab__badge">{dms.length}</span>}
          </button>
          <button
            className={`pm-rooms-tab${activeTab === 'group' ? ' active' : ''}`}
            onClick={() => setActiveTab('group')}
          >
            Groups
            {channels.length > 0 && <span className="pm-rooms-tab__badge">{channels.length}</span>}
          </button>
        </div>

        <div className="pm-rooms-panel__search">
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--pm-text-muted)' }} />
            <input
              className="pm-input pm-input--sm"
              style={{ paddingLeft: 30 }}
              placeholder={activeTab === 'dm' ? 'Search DMs...' : 'Search rooms...'}
              value={roomSearch}
              onChange={e => setRoomSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="pm-rooms-panel__list">
          {/* DMs tab */}
          {activeTab === 'dm' && (
            <>
              {dms.length === 0 && (
                <div className="pm-empty">
                  <span className="pm-empty__icon">💬</span>
                  <div className="pm-empty__title">No direct messages</div>
                  <div className="pm-empty__sub">Message a friend from the People tab</div>
                </div>
              )}
              {dms.map(room => (
                <div
                  key={room.id}
                  className={`pm-room-item${activeRoomId === room.id ? ' active' : ''}`}
                  onClick={() => setActiveRoomId(room.id)}
                >
                  <div className="pm-avatar pm-avatar--sm" style={{ flexShrink: 0 }}>
                    {room.directPeer?.avatarUrl
                      ? <img src={room.directPeer.avatarUrl} alt={room.directPeer.displayName} />
                      : initials(room.directPeer?.displayName ?? '?')}
                  </div>
                  <div className="pm-room-item__info">
                    <div className="pm-room-item__name">{getRoomTitle(room)}</div>
                    <div className="pm-room-item__preview">
                      {room.directPeer?.active
                        ? <span style={{ color: 'var(--pm-online)' }}>● Online</span>
                        : 'Offline'}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Groups tab */}
          {activeTab === 'group' && (
            <>
              {channels.length === 0 && discoverableRooms.length === 0 && !roomSearch && (
                <div className="pm-empty">
                  <span className="pm-empty__icon">🏠</span>
                  <div className="pm-empty__title">No group rooms yet</div>
                  <div className="pm-empty__sub">Create one below!</div>
                </div>
              )}
              {channels.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--pm-text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    My Rooms
                  </div>
                  {channels.map(room => (
                    <div
                      key={room.id}
                      className={`pm-room-item${activeRoomId === room.id ? ' active' : ''}`}
                      onClick={() => setActiveRoomId(room.id)}
                    >
                      <div className="pm-room-item__icon">
                        {room.visibility === 'private_room' ? <Lock size={12} /> : <Hash size={12} />}
                      </div>
                      <div className="pm-room-item__info">
                        <div className="pm-room-item__name">{room.name}</div>
                        <div className="pm-room-item__preview">{room.memberCount} members</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {discoverableRooms.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--pm-text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    Discover
                  </div>
                  {discoverableRooms.map(room => (
                    <div key={room.id} className="pm-room-item">
                      <div className="pm-room-item__icon"><Globe size={12} /></div>
                      <div className="pm-room-item__info">
                        <div className="pm-room-item__name">{room.name}</div>
                        <div className="pm-room-item__preview">{room.memberCount} members</div>
                      </div>
                      <button
                        className="pm-btn pm-btn--sm pm-btn--primary"
                        onClick={() => onJoinRoom(room.id)}
                        disabled={joinPending}
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* New Room button — only in Groups tab */}
        {activeTab === 'group' && (
          <>
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--pm-border)' }}>
              <button
                className="pm-btn pm-btn--ghost pm-btn--sm pm-btn--full"
                onClick={() => setShowNewRoom(v => !v)}
                style={{ justifyContent: 'space-between' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={13} /> New Room
                </span>
                {showNewRoom ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {showNewRoom && (
              <div className="pm-new-room-form">
                <input
                  className="pm-input pm-input--sm"
                  placeholder="Room name..."
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                />
                <div className="pm-row">
                  <button
                    className={`pm-btn pm-btn--sm${groupVisibility === 'public_room' ? ' pm-btn--primary' : ' pm-btn--ghost'}`}
                    onClick={() => setGroupVisibility('public_room')}
                  >
                    <Globe size={12} /> Public
                  </button>
                  <button
                    className={`pm-btn pm-btn--sm${groupVisibility === 'private_room' ? ' pm-btn--primary' : ' pm-btn--ghost'}`}
                    onClick={() => setGroupVisibility('private_room')}
                  >
                    <Lock size={12} /> Private
                  </button>
                </div>
                <button
                  className="pm-btn pm-btn--primary pm-btn--sm pm-btn--full"
                  onClick={onCreateRoom}
                  disabled={createRoomPending || !groupName.trim()}
                >
                  {createRoomPending ? <span className="pm-spinner" style={{ width: 13, height: 13 }} /> : 'Create Room'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Message Area */}
      <div className="pm-msg-area">
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="pm-msg-area__header">
              {activeRoom.type === 'direct'
                ? <div className="pm-avatar pm-avatar--sm">{initials(activeRoom.directPeer?.displayName ?? '?')}</div>
                : <Hash size={16} color="var(--pm-text-muted)" />}
              <div>
                <div className="pm-msg-area__room-name">{getRoomTitle(activeRoom)}</div>
                <div className="pm-msg-area__meta">
                  {activeRoom.type === 'group' ? `${activeRoom.memberCount} members` : (activeRoom.directPeer?.active ? 'Online' : 'Offline')}
                </div>
              </div>

              {/* DM options menu */}
              {activeRoom.type === 'direct' && (
                <div ref={dmMenuRef} style={{ marginLeft: 'auto', position: 'relative' }}>
                  <button
                    className="pm-icon-btn"
                    style={{ border: 'none' }}
                    onClick={() => setShowDmMenu(v => !v)}
                    title="Options"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {showDmMenu && (
                    <div className="pm-friend-menu pm-dm-menu">
                      <button
                        className="pm-friend-menu__item"
                        onMouseDown={() => { setShowDmMenu(false); activeRoom.directPeer && onViewProfile?.(activeRoom.directPeer.id); }}
                      >
                        👤 View Profile
                      </button>
                      <button
                        className="pm-friend-menu__item pm-friend-menu__item--danger"
                        onMouseDown={() => { setShowDmMenu(false); activeRoom.directPeer && onUnfriend?.(activeRoom.directPeer.id); }}
                      >
                        🚫 Unfriend
                      </button>
                      {activeRoom.directPeer?.friendshipState === 'blocked_by_me' ? (
                        <button
                          className="pm-friend-menu__item"
                          onMouseDown={() => {
                            setShowDmMenu(false);
                            activeRoom.directPeer && onUnblock?.(activeRoom.directPeer.id);
                          }}
                        >
                          ✅ Unblock
                        </button>
                      ) : (
                        <button
                          className="pm-friend-menu__item pm-friend-menu__item--danger"
                          onMouseDown={() => {
                            setShowDmMenu(false);
                            activeRoom.directPeer && onBlock?.(activeRoom.directPeer.id);
                          }}
                        >
                          🔇 Block
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Invite for group owners only */}
              {activeRoom.currentUserRole === 'owner' && activeRoom.type === 'group' && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    className="pm-input pm-input--sm"
                    style={{ width: 160 }}
                    placeholder="Invite by user ID..."
                    value={inviteUserId}
                    onChange={e => setInviteUserId(e.target.value)}
                  />
                  <button
                    className="pm-btn pm-btn--sm pm-btn--primary"
                    onClick={onInviteMember}
                    disabled={invitePending || !inviteUserId.trim()}
                  >
                    <UserPlus size={13} /> Invite
                  </button>
                </div>
              )}
            </div>

            {/* Join requests */}
            {joinRequests.length > 0 && (
              <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--pm-border)', background: 'var(--pm-gold-dim)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--pm-gold)', marginBottom: 4 }}>
                  Join Requests ({joinRequests.length})
                </div>
                {joinRequests.map(req => (
                  <div key={req.profile.id} className="pm-row pm-row--between">
                    <span style={{ fontSize: 13 }}>{req.profile.displayName} (@{req.profile.username})</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="pm-btn pm-btn--sm pm-btn--primary" onClick={() => onApproveRequest(activeRoom.id, req.profile.id)}>
                        <Check size={12} /> Approve
                      </button>
                      <button className="pm-btn pm-btn--sm pm-btn--ghost" onClick={() => onRejectRequest(activeRoom.id, req.profile.id)}>
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message stream */}
            <div className="pm-msg-stream">
              {messagesLoading && (
                <div className="pm-msg-skeleton">
                  {[0.55, 0.75, 0.45, 0.65, 0.5].map((w, i) => (
                    <div key={i} className={`pm-msg-skeleton__row${i % 2 === 1 ? ' pm-msg-skeleton__row--own' : ''}`}>
                      {i % 2 === 0 && <div className="pm-skeleton-block pm-msg-skeleton__avatar" />}
                      <div className="pm-skeleton-block pm-msg-skeleton__bubble" style={{ width: `${w * 100}%` }} />
                      {i % 2 === 1 && <div className="pm-skeleton-block pm-msg-skeleton__avatar" />}
                    </div>
                  ))}
                </div>
              )}
              {!messagesLoading && orderedMessages.length === 0 && (
                <div className="pm-empty">
                  <span className="pm-empty__icon">✉️</span>
                  <div className="pm-empty__title">No messages yet</div>
                  <div className="pm-empty__sub">Be the first to drop something 🔥</div>
                </div>
              )}
              {orderedMessages.map(msg => {
                const own = msg.senderId === me?.id;
                const seen = own
                  && activeRoom.type === 'direct'
                  && !!activeRoom.peerLastReadAt
                  && msg.createdAt <= activeRoom.peerLastReadAt;
                return (
                  <div key={msg.id} className={`pm-msg-bubble${own ? ' pm-msg-bubble--own' : ''}`}>
                    {!own && (
                      <div className="pm-avatar pm-avatar--sm">
                        {initials(msg.senderDisplayName)}
                      </div>
                    )}
                    <div className="pm-msg-bubble__content">
                      <div className="pm-msg-bubble__meta">
                        {!own && <span className="pm-msg-bubble__name">{msg.senderDisplayName}</span>}
                        <span>{formatTime(msg.createdAt)}</span>
                      </div>
                      {msg.content && <div className="pm-msg-bubble__text">{msg.content}</div>}
                      {msg.attachment && <AttachmentPreview attachment={msg.attachment} />}
                      {own && (
                        <div className={`pm-msg-status${seen ? ' pm-msg-status--seen' : ''}`}>
                          {seen ? '✓✓' : '✓'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Typing */}
            <div className="pm-typing">
              {roomTyping && (
                <span>
                  <strong>{roomTyping.displayName}</strong> is typing
                  <span className="pm-typing-dots" style={{ display: 'inline-flex', marginLeft: 6 }}>
                    <span /><span /><span />
                  </span>
                </span>
              )}
            </div>

            {/* Composer */}
            <div className="pm-composer">
              {selectedFile && (
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--pm-bg-elevated)', borderRadius: 'var(--pm-r-md)', fontSize: 12 }}>
                  <span>{fileBadge(selectedFile.name)}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                  <button className="pm-icon-btn" style={{ width: 22, height: 22, border: 'none', minWidth: 22 }} onClick={() => setSelectedFile(null)}>
                    <X size={12} />
                  </button>
                </div>
              )}
              {uploadWarning && (
                <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--pm-danger)' }}>{uploadWarning}</div>
              )}
              <div className="pm-composer__inner">
                <textarea
                  className="pm-composer__textarea"
                  placeholder="Drop a message 🔥"
                  value={draft}
                  onChange={e => onDraftChange(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <div className="pm-composer__actions">
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                  <button
                    className="pm-icon-btn"
                    style={{ border: 'none' }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                  >
                    <Paperclip size={15} />
                  </button>
                  <button
                    className="pm-composer__send"
                    onClick={onSend}
                    disabled={sendPending || (!draft.trim() && !selectedFile)}
                  >
                    {sendPending ? <span className="pm-spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="pm-empty" style={{ flex: 1, justifyContent: 'center' }}>
            <span className="pm-empty__icon">💬</span>
            <div className="pm-empty__title">Select a room to start chatting</div>
            <div className="pm-empty__sub">Or create one using the panel on the left</div>
          </div>
        )}
      </div>
    </div>
  );
}
