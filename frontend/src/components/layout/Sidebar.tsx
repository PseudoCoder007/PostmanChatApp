import {
  MessageCircle, Users, Target, Cpu, Trophy,
  TrendingUp, User, MessageSquare, Settings2,
  LogOut, Mail, Bell
} from 'lucide-react';
import type { Profile } from '../../types/chat';

type ViewKey = 'chat' | 'people' | 'quests' | 'igris' | 'board' | 'levels' | 'profile' | 'feedback' | 'settings' | 'notifications';

interface SidebarProps {
  me: Profile | undefined;
  activeView: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onSignOut: () => void;
  onLaunchMission: () => void;
  launchPending: boolean;
  unreadCount: number;
  unreadNotifCount: number;
  isDark: boolean;
  toggleTheme: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: { key: ViewKey; label: string; icon: React.ReactNode }[] = [
  { key: 'chat',          label: 'Chat',          icon: <MessageCircle size={18} /> },
  { key: 'people',        label: 'People',        icon: <Users size={18} /> },
  { key: 'quests',        label: 'Quests',        icon: <Target size={18} /> },
  { key: 'igris',         label: 'Igris AI',      icon: <Cpu size={18} /> },
  { key: 'board',         label: 'Board',         icon: <Trophy size={18} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { key: 'levels',        label: 'Levels',        icon: <TrendingUp size={18} /> },
  { key: 'profile',       label: 'Profile',       icon: <User size={18} /> },
  { key: 'feedback',      label: 'Feedback',      icon: <MessageSquare size={18} /> },
];

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function Sidebar({
  me, activeView, onNavigate, onSignOut,
  onLaunchMission, launchPending, unreadCount, unreadNotifCount,
  mobileOpen = false, onCloseMobile,
}: SidebarProps) {
  function handleNavigate(view: ViewKey) {
    onNavigate(view);
    onCloseMobile?.();
  }

  function handleSignOut() {
    onCloseMobile?.();
    onSignOut();
  }

  return (
    <aside className={`pm-sidebar${mobileOpen ? ' open' : ''}`}>
      {/* Brand */}
      <div className="pm-sidebar__brand">
        <div className="pm-sidebar__brand-icon">
          <Mail size={18} />
        </div>
        <span className="pm-sidebar__brand-name">
          Postman<span>Chat</span>
        </span>
      </div>

      {/* User Identity */}
      {me && (
        <button className="pm-sidebar__user" onClick={() => handleNavigate('profile')} title="View your profile">
          <div className="pm-avatar pm-avatar--md">
            {me.avatarUrl
              ? <img src={me.avatarUrl} alt={me.displayName} />
              : initials(me.displayName)}
          </div>
          <div className="pm-sidebar__user-info">
            <div className="pm-sidebar__user-name">{me.displayName}</div>
            <div className="pm-sidebar__user-meta">
              @{me.username} · Lv.{me.level} · {me.title}
            </div>
          </div>
        </button>
      )}

      {/* Navigation */}
      <nav className="pm-sidebar__nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`pm-nav-item${activeView === item.key ? ' active' : ''}`}
            onClick={() => handleNavigate(item.key)}
          >
            <span className="pm-nav-icon">{item.icon}</span>
            {item.label}
            {item.key === 'chat' && unreadCount > 0 && (
              <span className="pm-nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
            {item.key === 'notifications' && unreadNotifCount > 0 && (
              <span className="pm-nav-badge">{unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
            )}
          </button>
        ))}

        <div className="pm-nav-divider" />

        <button
          className={`pm-nav-item${activeView === 'settings' ? ' active' : ''}`}
          onClick={() => handleNavigate('settings')}
        >
          <span className="pm-nav-icon"><Settings2 size={18} /></span>
          Settings
        </button>
      </nav>

      {/* Footer */}
      <div className="pm-sidebar__footer">
        <button className="pm-sidebar__signout" onClick={handleSignOut}>
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
