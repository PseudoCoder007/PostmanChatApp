import { Bell, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import type { NotificationItem } from '@/types/chat';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  formatTime: (v: string) => string;
}

const PAGE_SIZE = 20;

export default function NotificationsView({ notifications, onMarkRead, formatTime }: NotificationsViewProps) {
  const [page, setPage] = useState(0);
  const unreadCount = notifications.filter(n => !n.read).length;
  const start = page * PAGE_SIZE;
  const visible = notifications.slice(start, start + PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE));

  return (
    <div>
      <div className="pm-view-header">
        <div>
          <div className="pm-view-title">Notifications</div>
          <div className="pm-view-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </div>
        </div>
      </div>

      <div className="pm-card" style={{ padding: 0, overflow: 'hidden', maxWidth: 640 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--pm-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={14} />
          <span style={{ fontWeight: 700, fontSize: 14 }}>All Notifications</span>
          {unreadCount > 0 && <span className="pm-badge pm-badge--danger">{unreadCount}</span>}
        </div>

        {notifications.length === 0 && (
          <div className="pm-empty">
            <span className="pm-empty__icon"><CheckCheck size={32} /></span>
            <div className="pm-empty__title">Nothing here</div>
            <div className="pm-empty__sub">You have no notifications yet.</div>
          </div>
        )}

        {visible.map(n => (
          <div
            key={n.id}
            className={`pm-notif-item${!n.read ? ' unread' : ''}`}
            onClick={() => !n.read && onMarkRead(n.id)}
            style={{ cursor: n.read ? 'default' : 'pointer' }}
          >
            {!n.read && <div className="pm-notif-item__dot" />}
            <div className="pm-notif-item__text">
              <strong>{n.title}</strong>
              <div style={{ marginTop: 2 }}>{n.body}</div>
            </div>
            <div className="pm-notif-item__time">{formatTime(n.createdAt)}</div>
          </div>
        ))}

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 16px', borderTop: '1px solid var(--pm-border)' }}>
            <button
              className="pm-btn pm-btn--ghost"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ fontSize: 13 }}
            >
              Prev
            </button>
            <span style={{ fontSize: 13, color: 'var(--pm-text-muted)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              className="pm-btn pm-btn--ghost"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ fontSize: 13 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
