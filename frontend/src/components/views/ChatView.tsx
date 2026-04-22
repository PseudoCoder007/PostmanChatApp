import { useEffect, useRef, useState } from 'react';
import {
  Hash, Plus, Search, Send, Paperclip, X,
  Lock, Globe, ChevronDown, ChevronUp, UserPlus, Check, MoreVertical, Bell, BellOff, Smile, Pin, Menu
} from 'lucide-react';
import { resolveAttachmentUrl } from '@/lib/api';
import ReactionPicker from '@/components/ReactionPicker';
import PinnedMessageBanner from '@/components/PinnedMessageBanner';
import type {
  Message, Room, Profile, RoomJoinRequest, TypingEvent, RoomVisibility, Attachment, ReactionCount, PinnedMessage
} from '@/types/chat';

function renderWithMentions(content: string, myUsername?: string): React.ReactNode {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (/^@\w+$/.test(part)) {
      const isSelf = myUsername && part.toLowerCase() === `@${myUsername.toLowerCase()}`;
      return (
        <span key={i} style={{ color: isSelf ? 'var(--pm-gold)' : 'var(--pm-accent)', fontWeight: 600 }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

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
  onToggleMute?: (roomId: string) => void;
  mutePending?: boolean;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  mentionCandidates?: Profile[];
  pins?: PinnedMessage[];
  onPinMessage?: (roomId: string, messageId: string) => void;
  onUnpinMessage?: (roomId: string, messageId: string) => void;
  onSearchOpen?: () => void;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  loadingMoreMessages?: boolean;
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
  messagesLoading, onUnfriend, onViewProfile, onBlock, onUnblock, onToggleMute, mutePending, onToggleReaction,
  mentionCandidates = [], pins = [], onPinMessage, onUnpinMessage, onSearchOpen,
  onLoadMore, hasMoreMessages, loadingMoreMessages,
}: ChatViewProps) {
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [activeTab, setActiveTab] = useState<'dm' | 'group'>('dm');
  const [showDmMenu, setShowDmMenu] = useState(false);
  const [activePickerMsgId, setActivePickerMsgId] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mobileShowRooms, setMobileShowRooms] = useState(!activeRoomId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dmMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [orderedMessages.length]);

  // Auto-switch tab when active room changes externally (e.g. from People view)
  useEffect(() => {
    if (!activeRoom) return;
    if (activeRoom.type === 'direct' && activeTab !== 'dm') setActiveTab('dm');
    if (activeRoom.type === 'group' && activeTab !== 'group') setActiveTab('group');
    setMobileShowRooms(false);
  }, [activeRoom?.id]);

  useEffect(() => {
    if (!activeRoomId) setMobileShowRooms(true);
  }, [activeRoomId]);

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
      <div className={`pm-rooms-panel${mobileShowRooms ? ' pm-rooms-panel--mobile-open' : ''}`}>
        <div className="pm-rooms-panel__header">
          <span className="pm-rooms-panel__title">
            {activeTab === 'dm' ? 'Direct Messages' : 'Group Rooms'}
          </span>
          {activeRoomId && (
            <button
              className="pm-icon-btn pm-rooms-mobile-toggle"
              style={{ marginLeft: 'auto', border: 'none', background: 'none' }}
              onClick={() => setMobileShowRooms(false)}
              title="Close"
            >
              <X size={16} />
            </button>
          )}
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
              {dms.map(room => {
                const hasDraft = room.id !== activeRoomId && !!localStorage.getItem(`postmanchat.draft.${room.id}`);
                return (
                  <div
                    key={room.id}
                    className={`pm-room-item${activeRoomId === room.id ? ' active' : ''}`}
                    onClick={() => { setActiveRoomId(room.id); setMobileShowRooms(false); }}
                  >
                    <div className="pm-avatar pm-avatar--sm" style={{ flexShrink: 0 }}>
                      {room.directPeer?.avatarUrl
                        ? <img src={room.directPeer.avatarUrl} alt={room.directPeer.displayName} />
                        : initials(room.directPeer?.displayName ?? '?')}
                    </div>
                    <div className="pm-room-item__info">
                      <div className="pm-room-item__name">{getRoomTitle(room)}</div>
                      <div className="pm-room-item__preview">
                        {hasDraft
                          ? <span style={{ color: 'var(--pm-text-muted)', fontStyle: 'italic' }}>Draft</span>
                          : room.directPeer?.active
                            ? <span style={{ color: 'var(--pm-online)' }}>● Online</span>
                            : 'Offline'}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  {channels.map(room => {
                    const hasDraft = room.id !== activeRoomId && !!localStorage.getItem(`postmanchat.draft.${room.id}`);
                    return (
                      <div
                        key={room.id}
                        className={`pm-room-item${activeRoomId === room.id ? ' active' : ''}`}
                        onClick={() => { setActiveRoomId(room.id); setMobileShowRooms(false); }}
                      >
                        <div className="pm-room-item__icon">
                          {room.visibility === 'private_room' ? <Lock size={12} /> : <Hash size={12} />}
                        </div>
                        <div className="pm-room-item__info">
                          <div className="pm-room-item__name">{room.name}</div>
                          <div className="pm-room-item__preview">
                            {hasDraft
                              ? <span style={{ color: 'var(--pm-text-muted)', fontStyle: 'italic' }}>Draft</span>
                              : `${room.memberCount} members`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
              <button
                className="pm-rooms-mobile-toggle"
                onClick={() => setMobileShowRooms(true)}
                title="Show rooms"
              >
                <Menu size={14} /> Rooms
              </button>
              {activeRoom.type === 'direct'
                ? <div className="pm-avatar pm-avatar--sm">{initials(activeRoom.directPeer?.displayName ?? '?')}</div>
                : <Hash size={16} color="var(--pm-text-muted)" />}
              <div>
                <div className="pm-msg-area__room-name">{getRoomTitle(activeRoom)}</div>
                <div className="pm-msg-area__meta">
                  {activeRoom.type === 'group' ? `${activeRoom.memberCount} members` : (activeRoom.directPeer?.active ? 'Online' : 'Offline')}
                </div>
              </div>

              {/* Right-side header controls */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* Search */}
                {onSearchOpen && (
                  <button
                    className="pm-icon-btn"
                    style={{ border: 'none' }}
                    onClick={onSearchOpen}
                    title="Search messages"
                  >
                    <Search size={16} />
                  </button>
                )}
                {/* Mute toggle */}
                {onToggleMute && (
                  <button
                    className="pm-icon-btn"
                    style={{ border: 'none' }}
                    onClick={() => onToggleMute(activeRoom.id)}
                    disabled={mutePending}
                    title={activeRoom.muted ? 'Unmute notifications' : 'Mute notifications'}
                  >
                    {activeRoom.muted ? <BellOff size={16} style={{ color: 'var(--pm-text-muted)' }} /> : <Bell size={16} />}
                  </button>
                )}

                {/* DM options menu */}
                {activeRoom.type === 'direct' && (
                  <div ref={dmMenuRef} style={{ position: 'relative' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

            {/* Pinned messages banner */}
            {pins.length > 0 && (
              <PinnedMessageBanner
                pins={pins}
                canPin={activeRoom.currentUserRole === 'owner' || activeRoom.currentUserRole === 'admin'}
                onUnpin={messageId => onUnpinMessage?.(activeRoom.id, messageId)}
              />
            )}

            {/* Message stream */}
            <div className="pm-msg-stream">
              {!messagesLoading && hasMoreMessages && orderedMessages.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
                  <button
                    className="pm-btn pm-btn--ghost pm-btn--sm"
                    onClick={onLoadMore}
                    disabled={loadingMoreMessages}
                  >
                    {loadingMoreMessages
                      ? <><span className="pm-spinner" style={{ width: 12, height: 12 }} /> Loading...</>
                      : 'Load older messages'}
                  </button>
                </div>
              )}
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
                const showPicker = activePickerMsgId === msg.id;
                const reactions: ReactionCount[] = msg.reactions ?? [];
                return (
                  <div
                    key={msg.id}
                    className={`pm-msg-bubble${own ? ' pm-msg-bubble--own' : ''}`}
                    onMouseLeave={() => { if (showPicker) setActivePickerMsgId(null); }}
                  >
                    {!own && (
                      <div className="pm-avatar pm-avatar--sm">
                        {initials(msg.senderDisplayName)}
                      </div>
                    )}
                    <div className="pm-msg-bubble__content" style={{ position: 'relative' }}>
                      <div className="pm-msg-bubble__meta">
                        {!own && <span className="pm-msg-bubble__name">{msg.senderDisplayName}</span>}
                        <span>{formatTime(msg.createdAt)}</span>
                        {onToggleReaction && (
                          <button
                            className="pm-icon-btn pm-reaction-trigger"
                            style={{ border: 'none', padding: '0 4px', width: 20, height: 20, minWidth: 20 }}
                            onClick={() => setActivePickerMsgId(showPicker ? null : msg.id)}
                            title="React"
                          >
                            <Smile size={13} />
                          </button>
                        )}
                        {(activeRoom?.currentUserRole === 'owner' || activeRoom?.currentUserRole === 'admin') && (
                          <button
                            className="pm-icon-btn pm-pin-trigger"
                            style={{ border: 'none', padding: '0 4px', width: 20, height: 20, minWidth: 20 }}
                            onClick={() => {
                              const isPinned = pins.some(p => p.messageId === msg.id);
                              if (isPinned) onUnpinMessage?.(activeRoom!.id, msg.id);
                              else onPinMessage?.(activeRoom!.id, msg.id);
                            }}
                            title={pins.some(p => p.messageId === msg.id) ? 'Unpin' : 'Pin message'}
                          >
                            <Pin size={13} style={{ color: pins.some(p => p.messageId === msg.id) ? 'var(--pm-accent)' : undefined }} />
                          </button>
                        )}
                      </div>
                      {msg.content && <div className="pm-msg-bubble__text">{renderWithMentions(msg.content, me?.username)}</div>}
                      {msg.attachment && <AttachmentPreview attachment={msg.attachment} />}
                      {reactions.length > 0 && (
                        <div className="pm-reactions">
                          {reactions.map(r => (
                            <button
                              key={r.emoji}
                              className={`pm-reaction-pill${r.reactedByMe ? ' pm-reaction-pill--mine' : ''}`}
                              onClick={() => onToggleReaction?.(msg.id, r.emoji)}
                              title={`${r.count} reaction${r.count !== 1 ? 's' : ''}`}
                            >
                              {r.emoji} <span className="pm-reaction-pill__count">{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {own && (
                        <div className={`pm-msg-status${seen ? ' pm-msg-status--seen' : ''}`}>
                          {seen ? '✓✓' : '✓'}
                        </div>
                      )}
                      {showPicker && onToggleReaction && (
                        <div style={{ position: 'absolute', bottom: '100%', right: own ? 0 : 'auto', left: own ? 'auto' : 0, zIndex: 50 }}>
                          <ReactionPicker
                            reactions={reactions}
                            onToggle={(emoji) => onToggleReaction(msg.id, emoji)}
                            onClose={() => setActivePickerMsgId(null)}
                          />
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
              {/* Mention autocomplete */}
              {mentionQuery !== null && mentionCandidates.filter(p =>
                p.username.toLowerCase().startsWith(mentionQuery) ||
                p.displayName.toLowerCase().startsWith(mentionQuery)
              ).length > 0 && (
                <div className="pm-mention-menu">
                  {mentionCandidates
                    .filter(p => p.username.toLowerCase().startsWith(mentionQuery) || p.displayName.toLowerCase().startsWith(mentionQuery))
                    .slice(0, 6)
                    .map(p => (
                      <button
                        key={p.id}
                        className="pm-mention-menu__item"
                        onMouseDown={e => {
                          e.preventDefault();
                          const ta = textareaRef.current;
                          if (!ta) return;
                          const cursor = ta.selectionStart ?? draft.length;
                          const replaced = draft.slice(0, cursor).replace(/@\w*$/, `@${p.username} `) + draft.slice(cursor);
                          onDraftChange(replaced);
                          setMentionQuery(null);
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>@{p.username}</span>
                        <span style={{ fontSize: 12, color: 'var(--pm-text-muted)', marginLeft: 6 }}>{p.displayName}</span>
                      </button>
                    ))}
                </div>
              )}
              <div className="pm-composer__inner">
                <textarea
                  ref={textareaRef}
                  className="pm-composer__textarea"
                  placeholder="Drop a message 🔥"
                  value={draft}
                  onChange={e => {
                    onDraftChange(e.target.value);
                    const cursor = e.target.selectionStart ?? e.target.value.length;
                    const before = e.target.value.slice(0, cursor);
                    const match = before.match(/@(\w*)$/);
                    setMentionQuery(match ? match[1].toLowerCase() : null);
                  }}
                  onKeyDown={e => {
                    if (mentionQuery !== null && e.key === 'Escape') { setMentionQuery(null); return; }
                    handleKey(e);
                  }}
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
