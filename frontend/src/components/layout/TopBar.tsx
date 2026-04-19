import { Search, Coins, Zap, Bell, Settings2, Sun, Moon, Menu } from 'lucide-react';
import type { Profile } from '../../types/chat';

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
}

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function TopBar({
  me, coins, xp, unreadCount, isDark, toggleTheme,
  onNotificationsClick, onSettingsClick, onAvatarClick,
  onMenuClick,
}: TopBarProps) {
  return (
    <header className="pm-topbar">
      <button className="pm-icon-btn pm-topbar__menu" onClick={onMenuClick} title="Open menu">
        <Menu size={18} />
      </button>

      <div className="pm-topbar__search">
        <Search className="pm-topbar__search-icon" />
        <input placeholder="Search chats, rooms, people..." />
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
