import { useState } from 'react';
import { UserPlus, MessageCircle, Check, Search, MoreVertical, UserMinus } from 'lucide-react';
import type { Profile, FriendRequest } from '@/types/chat';
import { Footer } from '@/components/ui/footer-section';

interface PeopleViewProps {
  me: Profile | undefined;
  friends: FriendRequest[];
  incoming: FriendRequest[];
  blocked: FriendRequest[];
  people: Profile[];
  peopleSearch: string;
  setPeopleSearch: (v: string) => void;
  onAddFriend: (userId: string) => void;
  onAcceptFriend: (userId: string) => void;
  onMessage: (userId: string) => void;
  onUnfriend: (userId: string) => void;
  onBlock: (userId: string) => void;
  onUnblock: (userId: string) => void;
  addPending: boolean;
  acceptPending: boolean;
  messagePending: boolean;
  initials: (v: string) => string;
}

export default function PeopleView({
  me, friends, incoming, blocked, people, peopleSearch, setPeopleSearch,
  onAddFriend, onAcceptFriend, onMessage, onUnfriend, onBlock, onUnblock,
  addPending, acceptPending, messagePending, initials,
}: PeopleViewProps) {
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  function toggleMenu(id: string) {
    setOpenMenuFor(prev => prev === id ? null : id);
  }

  return (
    <div>
      <div className="pm-view-header">
        <div>
          <div className="pm-view-title">Your Squad 👥</div>
          <div className="pm-view-subtitle">{friends.length} friends · {incoming.length} pending</div>
        </div>
      </div>

      <div className="pm-people-layout">
        {/* Left: Friends */}
        <div className="pm-card">
          <div className="pm-card__title">Friends ({friends.length})</div>
          {friends.length === 0 && (
            <div className="pm-empty">
              <span className="pm-empty__icon">🤝</span>
              <div className="pm-empty__title">No friends yet</div>
              <div className="pm-empty__sub">Search for people to add</div>
            </div>
          )}
          {friends.map(f => (
            <div key={f.profile.id} className="pm-friend-item">
              <div className="pm-avatar pm-avatar--sm">{initials(f.profile.displayName)}</div>
              <div className={`pm-friend-item__status pm-friend-item__status--${f.profile.active ? 'online' : 'offline'}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="pm-friend-item__name">{f.profile.displayName}</div>
                {(f.profile.statusEmoji || f.profile.statusText) && (
                  <div className="pm-friend-item__custom-status">
                    {f.profile.statusEmoji} {f.profile.statusText}
                  </div>
                )}
              </div>
              <div className="pm-friend-item__actions">
                <button
                  className="pm-btn pm-btn--sm pm-btn--ghost"
                  onClick={() => onMessage(f.profile.id)}
                  disabled={messagePending}
                  title="Message"
                >
                  <MessageCircle size={13} />
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    className="pm-btn pm-btn--sm pm-btn--ghost"
                    title="More options"
                    onClick={() => toggleMenu(f.profile.id)}
                    onBlur={() => setTimeout(() => setOpenMenuFor(null), 150)}
                  >
                    <MoreVertical size={13} />
                  </button>
                  {openMenuFor === f.profile.id && (
                    <div className="pm-friend-menu">
                      <button
                        className="pm-friend-menu__item"
                        onMouseDown={() => { onMessage(f.profile.id); setOpenMenuFor(null); }}
                      >
                        <MessageCircle size={13} /> Message
                      </button>
                      <button
                        className="pm-friend-menu__item pm-friend-menu__item--danger"
                        onMouseDown={() => { onUnfriend(f.profile.id); setOpenMenuFor(null); }}
                      >
                        <UserMinus size={13} /> Unfriend
                      </button>
                      <button
                        className="pm-friend-menu__item pm-friend-menu__item--danger"
                        onMouseDown={() => { onBlock(f.profile.id); setOpenMenuFor(null); }}
                      >
                        🔇 Block
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Requests + Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="pm-card">
            <div className="pm-card__title">Requests ({incoming.length})</div>
            {incoming.length === 0 ? (
              <div className="pm-empty">
                <span className="pm-empty__icon">📭</span>
                <div className="pm-empty__sub">No pending requests</div>
              </div>
            ) : incoming.map(f => (
              <div key={f.profile.id} className="pm-friend-item">
                <div className="pm-avatar pm-avatar--sm">{initials(f.profile.displayName)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.profile.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--pm-text-muted)' }}>@{f.profile.username}</div>
                </div>
                <button
                  className="pm-btn pm-btn--sm pm-btn--primary"
                  onClick={() => onAcceptFriend(f.profile.id)}
                  disabled={acceptPending}
                >
                  <Check size={13} /> Accept
                </button>
              </div>
            ))}
          </div>

          <div className="pm-card">
            <div className="pm-card__title">Find Allies 🔍</div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--pm-text-muted)' }} />
              <input
                className="pm-input pm-input--sm"
                style={{ paddingLeft: 30 }}
                placeholder="Search by username..."
                value={peopleSearch}
                onChange={e => setPeopleSearch(e.target.value)}
              />
            </div>
            {people.filter(p => p.id !== me?.id).map(p => (
              <div key={p.id} className="pm-friend-item">
                <div className="pm-avatar pm-avatar--sm">{initials(p.displayName)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--pm-text-muted)' }}>@{p.username} · Lv.{p.level}</div>
                  {(p.statusEmoji || p.statusText) && (
                    <div className="pm-friend-item__custom-status">{p.statusEmoji} {p.statusText}</div>
                  )}
                </div>
                {p.friendshipState === 'accepted' && (
                  <button className="pm-btn pm-btn--sm pm-btn--ghost" onClick={() => onMessage(p.id)} disabled={messagePending}>
                    <MessageCircle size={13} /> Chat
                  </button>
                )}
                {p.friendshipState === 'none' && (
                  <button className="pm-btn pm-btn--sm pm-btn--primary" onClick={() => onAddFriend(p.id)} disabled={addPending}>
                    <UserPlus size={13} /> Add
                  </button>
                )}
                {p.friendshipState === 'outgoing' && (
                  <span className="pm-badge pm-badge--muted">Pending</span>
                )}
                {p.friendshipState === 'incoming' && (
                  <button className="pm-btn pm-btn--sm pm-btn--primary" onClick={() => onAcceptFriend(p.id)} disabled={acceptPending}>
                    <Check size={13} /> Accept
                  </button>
                )}
              </div>
            ))}
            {peopleSearch.trim().length > 0 && people.length === 0 && (
              <div className="pm-empty"><div className="pm-empty__sub">No users found</div></div>
            )}
          </div>
        </div>
      </div>

      {blocked.length > 0 && (
        <div style={{ maxWidth: 560, margin: '16px auto 0', padding: '0 16px' }}>
          <div className="pm-card">
            <div className="pm-card__title">Blocked Users ({blocked.length})</div>
            {blocked.map(f => (
              <div key={f.profile.id} className="pm-friend-item">
                <div className="pm-avatar pm-avatar--sm" style={{ opacity: 0.5 }}>{initials(f.profile.displayName)}</div>
                <span className="pm-friend-item__name" style={{ opacity: 0.6 }}>{f.profile.displayName}</span>
                <button
                  className="pm-btn pm-btn--sm pm-btn--ghost"
                  onClick={() => onUnblock(f.profile.id)}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
