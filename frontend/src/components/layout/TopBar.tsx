import { useRef, useState } from 'react';
import { Search, Coins, Zap, Bell, Settings2, Sun, Moon, Menu } from 'lucide-react';
import type { Profile } from '../../types/chat';

type ViewKey = 'chat' | 'people' | 'quests' | 'igris' | 'board' | 'levels' | 'profile' | 'feedback' | 'settings' | 'notifications';

const NAV_ITEMS: Array<{ key: ViewKey; label: string; description: string; keywords: string[] }> = [
  { key: 'chat',          label: 'Chat',          description: 'Send messages, join rooms',       keywords: ['message', 'room', 'chat', 'talk'] },
  { key: 'people',        label: 'People',        description: 'Find friends and connections',    keywords: ['friends', 'users', 'people', 'add'] },
  { key: 'quests',        label: 'Quests',        description: 'Complete quests, earn coins',     keywords: ['quest', 'mission', 'task', 'earn'] },
  { key: 'igris',         label: 'Igris AI',      description: 'Talk to your AI companion',      keywords: ['ai', 'igris', 'bot', 'assistant'] },
  { key: 'board',         label: 'Leaderboard',   description: 'Rankings and achievements',       keywords: ['board', 'rank', 'leaderboard', 'top'] },
  { key: 'notifications', label: 'Notifications', description: 'Your alerts and updates',         keywords: ['notif', 'alert', 'bell', 'alerts'] },
  { key: 'levels',        label: 'Levels',        description: 'Level up and earn XP',            keywords: ['level', 'xp', 'exp', 'progress'] },
  { key: 'profile',       label: 'Profile',       description: 'Edit your profile',               keywords: ['profile', 'avatar', 'name', 'edit'] },
  { key: 'settings',      label: 'Settings',      description: 'App settings and preferences',    keywords: ['settings', 'theme', 'dark', 'sound'] },
  { key: 'feedback',      label: 'Feedback',      description: 'Submit feedback or bug report',   keywords: ['feedback', 'bug', 'report', 'contact'] },
];

interface TopBarProps {
  me: Profile | undefined;
  coins: number;
  xp: number;
  unreadCount: number;
  isDark: boolean;
  toggleTheme: () => void;
  onNotificationsClick: () => void;
  onSettingsClick: () => void;
  onAvatarClick: () => void;
  onMenuClick: () => void;
  onNavigate: (view: ViewKey) => void;
}

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function TopBar({
  me, coins, xp, unreadCount, isDark, toggleTheme,
  onNotificationsClick, onSettingsClick, onAvatarClick,
  onMenuClick, onNavigate,
}: TopBarProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length > 0
    ? NAV_ITEMS.filter(item => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.keywords.some(k => k.includes(q))
        );
      })
    : [];

  function handleSelect(key: ViewKey) {
    setQuery('');
    setOpen(false);
    onNavigate(key);
  }

  function handleBlur() {
    setTimeout(() => setOpen(false), 150);
  }

  return (
    <header className="pm-topbar">
      <button className="pm-icon-btn pm-topbar__menu" onClick={onMenuClick} title="Open menu">
        <Menu size={18} />
      </button>

      <div className="pm-topbar__search">
        <Search className="pm-topbar__search-icon" />
        <input
          ref={inputRef}
          placeholder="Search tabs, features..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
        />
        {open && results.length > 0 && (
          <div className="pm-search-drop">
            {results.map(item => (
              <button
                key={item.key}
                className="pm-search-drop__item"
                onMouseDown={() => handleSelect(item.key)}
              >
                <span className="pm-search-drop__label">{item.label}</span>
                <span className="pm-search-drop__desc">{item.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pm-topbar__spacer" />

      <div className="pm-stat-chip pm-stat-chip--coins">
        <Coins size={14} />
        {coins.toLocaleString()}
        <span style={{ opacity: 0.7, fontSize: 11 }}>coins</span>
      </div>

      <div className="pm-stat-chip pm-stat-chip--xp">
        <Zap size={14} />
        {xp.toLocaleString()}
        <span style={{ opacity: 0.7, fontSize: 11 }}>XP</span>
      </div>

      <button
        className="pm-icon-btn pm-theme-toggle"
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <button className="pm-icon-btn" onClick={onNotificationsClick} title="Notifications">
        <Bell size={16} />
        {unreadCount > 0 && <span className="pm-notif-dot" />}
      </button>

      <button className="pm-icon-btn" onClick={onSettingsClick} title="Settings">
        <Settings2 size={16} />
      </button>

      <button className="pm-topbar__avatar" onClick={onAvatarClick} title="Profile">
        {me?.avatarUrl
          ? <img src={me.avatarUrl} alt={me.displayName} />
          : initials(me?.displayName)}
      </button>
    </header>
  );
}
