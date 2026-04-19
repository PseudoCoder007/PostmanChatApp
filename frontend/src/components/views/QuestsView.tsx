import { Zap, Coins, Check, RefreshCw, Clock } from 'lucide-react';
import type { Quest } from '@/types/chat';
import { Footer } from '@/components/ui/footer-section';

type FocusMission = { id: string; title: string; description: string; reward: string; lane: string };

interface QuestsViewProps {
  activeQuests: Quest[];
  completedQuests: Quest[];
  focusMissions: FocusMission[];
  nextRefreshLabel: string;
  onGenerateQuest: () => void;
  generatePending: boolean;
  triggerLabel: (t: Quest['triggerType']) => string;
}

const QUEST_ICONS: Record<Quest['triggerType'], string> = {
  SEND_DIRECT_MESSAGE: '💬',
  SEND_GROUP_MESSAGE: '📢',
  CREATE_GROUP_ROOM: '🏠',
  UPLOAD_IMAGE: '🖼️',
  UPLOAD_DOCUMENT: '📄',
};

export default function QuestsView({
  activeQuests, completedQuests, focusMissions, nextRefreshLabel,
  onGenerateQuest, generatePending, triggerLabel,
}: QuestsViewProps) {
  const atQuestLimit = activeQuests.length >= 3;

  return (
    <div>
      <div className="pm-view-header">
        <div>
          <div className="pm-view-title">Daily Quests 🎯</div>
          <div className="pm-view-subtitle">{activeQuests.length}/3 active · {completedQuests.length} completed</div>
        </div>
        <button
          className="pm-btn pm-btn--primary"
          onClick={onGenerateQuest}
          disabled={generatePending || atQuestLimit}
          title={atQuestLimit ? 'Complete an active quest first to unlock a new one' : 'Generate a new quest'}
        >
          {generatePending ? <span className="pm-spinner" style={{ width: 14, height: 14 }} /> : <RefreshCw size={14} />}
          {atQuestLimit ? 'Queue Full' : 'New Quest'}
        </button>
      </div>

      {atQuestLimit && (
        <div className="pm-card pm-anim-fade-in" style={{ marginBottom: 20, borderColor: 'rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24 }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--pm-gold)', marginBottom: 2 }}>Quest Slots Full</div>
              <div style={{ fontSize: 13, color: 'var(--pm-text-muted)' }}>You have 3 active quests. Complete one to generate a new mission.</div>
            </div>
          </div>
        </div>
      )}

      {activeQuests.length === 0 && completedQuests.length === 0 && (
        <div className="pm-card pm-anim-fade-in" style={{ marginBottom: 20 }}>
          <div className="pm-empty">
            <span className="pm-empty__icon">🎯</span>
            <div className="pm-empty__title">No missions yet</div>
            <div className="pm-empty__sub">Hit "New Quest" to get your first mission and start earning XP.</div>
          </div>
        </div>
      )}

      <div className="pm-quest-grid">
        {activeQuests.map(q => (
          <QuestCard key={q.id} quest={q} triggerLabel={triggerLabel} />
        ))}
        {completedQuests.map(q => (
          <QuestCard key={q.id} quest={q} triggerLabel={triggerLabel} completed />
        ))}
      </div>

      {focusMissions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div className="pm-row pm-row--between" style={{ marginBottom: 12 }}>
            <div className="pm-section-title" style={{ flex: 1 }}>Focus Missions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--pm-text-muted)' }}>
              <Clock size={12} /> Refresh in {nextRefreshLabel}
            </div>
          </div>
          {focusMissions.map(m => (
            <div key={m.id} className="pm-mission-card">
              <div style={{ fontSize: 24 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pm-text)', marginBottom: 3 }}>{m.title}</div>
                <div style={{ fontSize: 13, color: 'var(--pm-text-soft)' }}>{m.description}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  <span className="pm-badge pm-badge--accent">{m.lane}</span>
                  <span className="pm-badge pm-badge--xp">+{m.reward}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Footer />
    </div>
  );
}

function QuestCard({ quest, triggerLabel, completed = false }: { quest: Quest; triggerLabel: (t: Quest['triggerType']) => string; completed?: boolean }) {
  return (
    <div className={`pm-quest-card${completed ? ' completed' : ''}`}>
      <div className="pm-quest-card__header">
        <div className="pm-quest-card__icon">
          {QUEST_ICONS[quest.triggerType] ?? '🎯'}
        </div>
        <div>
          <div className="pm-quest-card__title">{quest.title}</div>
          <div style={{ fontSize: 12, color: 'var(--pm-text-muted)', marginTop: 3 }}>{quest.description}</div>
        </div>
      </div>
      <div className="pm-quest-card__rewards">
        <span className="pm-badge pm-badge--xp"><Zap size={10} />+{quest.rewardXp} XP</span>
        <span className="pm-badge pm-badge--gold"><Coins size={10} />+{quest.rewardCoins}</span>
        <span className="pm-badge pm-badge--muted">{triggerLabel(quest.triggerType)}</span>
      </div>
      <div className="pm-quest-card__footer">
        {completed
          ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--pm-xp)', fontWeight: 600 }}><Check size={14} /> Completed!</span>
          : <span style={{ fontSize: 12, color: 'var(--pm-text-muted)' }}>In progress…</span>}
        {quest.autoCompletes && !completed && (
          <span className="pm-badge pm-badge--accent">Auto</span>
        )}
      </div>
    </div>
  );
}
