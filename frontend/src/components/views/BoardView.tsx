import { Trophy, Zap } from 'lucide-react';
import type { LeaderboardEntry, Profile } from '@/types/chat';
import { Footer } from '@/components/ui/footer-section';

interface BoardViewProps {
  leaderboard: LeaderboardEntry[];
  me: Profile | undefined;
  initials: (v: string) => string;
}

function rankBadgeClass(rank: number) {
  if (rank === 1) return 'pm-rank-badge--1';
  if (rank === 2) return 'pm-rank-badge--2';
  if (rank === 3) return 'pm-rank-badge--3';
  return 'pm-rank-badge--n';
}

export default function BoardView({ leaderboard, me, initials }: BoardViewProps) {
  const myEntry = leaderboard.find(e => e.profile.id === me?.id);

  return (
    <div>
      <div className="pm-view-header">
        <div>
          <div className="pm-view-title">XP Board 🏆</div>
          <div className="pm-view-subtitle">Top {leaderboard.length} players this season</div>
        </div>
      </div>

      <div className="pm-board-layout">
        {/* Leaderboard */}
        <div className="pm-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--pm-border)' }}>
            <div className="pm-card__title" style={{ marginBottom: 0 }}>
              <Trophy size={16} /> Rankings
            </div>
          </div>
          {leaderboard.length === 0 && (
            <div className="pm-empty"><span className="pm-empty__icon">🏆</span><div className="pm-empty__title">No data yet</div></div>
          )}
          <table className="pm-leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Level</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(entry => (
                <tr key={entry.profile.id} className={entry.profile.id === me?.id ? 'current-user' : ''}>
                  <td>
                    <span className={`pm-rank-badge ${rankBadgeClass(entry.rank)}`}>{entry.rank}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="pm-avatar pm-avatar--sm">
                        {entry.profile.avatarUrl
                          ? <img src={entry.profile.avatarUrl} alt={entry.profile.displayName} />
                          : initials(entry.profile.displayName)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.profile.displayName}</div>
                        <div style={{ fontSize: 11, color: 'var(--pm-text-muted)' }}>@{entry.profile.username}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="pm-badge pm-badge--accent">Lv.{entry.profile.level}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--pm-xp)', fontWeight: 600 }}>
                      <Zap size={12} />{entry.profile.xp.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Personal rank card */}
          {myEntry && (
            <div className="pm-card pm-card--glow">
              <div className="pm-card__title">Your Rank</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--pm-accent)' }}>#{myEntry.rank}</div>
                  <div style={{ fontSize: 11, color: 'var(--pm-text-muted)' }}>Rank</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--pm-xp)' }}>{me?.xp?.toLocaleString()} XP</div>
                  <div style={{ fontSize: 12, color: 'var(--pm-text-muted)' }}>Lv.{me?.level} · {me?.title}</div>
                </div>
              </div>
              {myEntry.rank > 1 && (() => {
                const above = leaderboard[myEntry.rank - 2];
                if (!above) return null;
                const gap = above.profile.xp - (me?.xp ?? 0);
                return (
                  <div style={{ fontSize: 13, color: 'var(--pm-text-muted)' }}>
                    <strong style={{ color: 'var(--pm-gold)' }}>{gap.toLocaleString()} XP</strong> behind #{myEntry.rank - 1}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
