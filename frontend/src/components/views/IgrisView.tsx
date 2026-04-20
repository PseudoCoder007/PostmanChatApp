import { useRef, useEffect, useState } from 'react';
import { Send, Cpu, X } from 'lucide-react';
import type { Profile } from '@/types/chat';

type IgrisMessage = { id: string; role: 'user' | 'assistant'; content: string };

interface IgrisViewProps {
  me: Profile | undefined;
  messages: IgrisMessage[];
  draft: string;
  setDraft: (v: string) => void;
  onSend: (msg: string) => void;
  isPending: boolean;
  igrisCoinsRemaining: number;
  initials: (v: string) => string;
}

const QUICK_CHIPS = [
  'Give me a quest 🎯',
  'Roast my day 😭',
  'Hype me up ✨',
  'Therapy mode 💙',
  "What's my vibe today?",
];

export default function IgrisView({
  me, messages, draft, setDraft, onSend, isPending, igrisCoinsRemaining, initials,
}: IgrisViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const isLocked = !me?.canUseIgris;
  const [showChips, setShowChips] = useState(true);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.scrollTop = stream.scrollHeight;
  }, [messages.length]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(draft); }
  }

  return (
    <div>
      <div className="pm-view-header">
        <div>
          <div className="pm-view-title">Igris AI 🤖</div>
          <div className="pm-view-subtitle">Your Gen Z AI homie — mood lifter, quest giver, chaos planner</div>
        </div>
      </div>

      <div className="pm-igris-layout" style={isLocked ? { gridTemplateColumns: '1fr', height: 'auto' } : undefined}>
        {/* Chat panel */}
        <div className="pm-igris-chat">
          {isLocked ? (
            <div className="pm-igris-locked">
              <div className="pm-igris-locked__icon">🔒</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--pm-text)' }}>Igris is locked</div>
              <div style={{ fontSize: 14, color: 'var(--pm-text-muted)', maxWidth: 320, textAlign: 'center' }}>
                Earn <strong style={{ color: 'var(--pm-gold)' }}>5 coins</strong> to unlock your AI companion.
                Chat, complete quests, and level up to earn coins!
              </div>
              <div className="pm-progress-wrap" style={{ width: '100%', maxWidth: 300 }}>
                <div className="pm-progress-label">
                  <span>Progress</span>
                  <span>{Math.max(0, 5 - igrisCoinsRemaining)}/5 coins</span>
                </div>
                <div className="pm-progress">
                  <div
                    className="pm-progress__fill pm-progress__fill--gold"
                    style={{ width: `${Math.min(100, ((5 - igrisCoinsRemaining) / 5) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Quick chips */}
              {showChips && (
                <div className="pm-igris-chips">
                  <button className="pm-igris-chips__dismiss" onClick={() => setShowChips(false)} title="Hide suggestions">
                    <X size={13} />
                  </button>
                  {QUICK_CHIPS.map(chip => (
                    <button key={chip} className="pm-igris-chip" onClick={() => onSend(chip)} disabled={isPending}>
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Message stream */}
              <div className="pm-igris-chat__stream" ref={streamRef}>
                {messages.map(msg => (
                  <div key={msg.id} className={`pm-igris-msg pm-igris-msg--${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                    {msg.role === 'assistant' && (
                      <div className="pm-avatar pm-avatar--sm" style={{ background: 'rgba(74,244,255,0.15)', color: 'var(--pm-accent)' }}>
                        <Cpu size={14} />
                      </div>
                    )}
                    <div className="pm-igris-msg__bubble">
                      {msg.content === 'Igris is typing...'
                        ? <div className="pm-typing-dots"><span /><span /><span /></div>
                        : msg.content}
                    </div>
                    {msg.role === 'user' && me && (
                      <div className="pm-avatar pm-avatar--sm">{initials(me.displayName)}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className="pm-composer">
                <div className="pm-composer__inner">
                  <textarea
                    className="pm-composer__textarea"
                    placeholder="Chat with Igris..."
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                    disabled={isPending}
                  />
                  <button
                    className="pm-composer__send"
                    onClick={() => onSend(draft)}
                    disabled={isPending || !draft.trim()}
                  >
                    {isPending ? <span className="pm-spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right info panel (only shown when unlocked) */}
        {!isLocked && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="pm-card pm-card--glow">
              <div className="pm-card__title"><Cpu size={15} /> About Igris</div>
              <p style={{ fontSize: 13, color: 'var(--pm-text-soft)', lineHeight: 1.6, marginBottom: 12 }}>
                Igris speaks Gen Z, listens like a therapist, and roasts like a friend. Ask anything.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Mood lifter 🌟', 'Quest giver 🎯', 'Chaos planner 🗓️', 'Comeback coach 💪', 'Therapy mode 💙'].map(tag => (
                  <div key={tag} style={{ fontSize: 13, color: 'var(--pm-text-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pm-accent)', flexShrink: 0 }} />
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            <div className="pm-card">
              <div className="pm-card__title">Your Stats</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="pm-row pm-row--between">
                  <span style={{ fontSize: 13, color: 'var(--pm-text-muted)' }}>Coins</span>
                  <span style={{ fontWeight: 700, color: 'var(--pm-gold)' }}>{me?.coins ?? 0} 🪙</span>
                </div>
                <div className="pm-row pm-row--between">
                  <span style={{ fontSize: 13, color: 'var(--pm-text-muted)' }}>XP</span>
                  <span style={{ fontWeight: 700, color: 'var(--pm-xp)' }}>{me?.xp ?? 0} ⚡</span>
                </div>
                <div className="pm-row pm-row--between">
                  <span style={{ fontSize: 13, color: 'var(--pm-text-muted)' }}>Level</span>
                  <span style={{ fontWeight: 700, color: 'var(--pm-accent)' }}>Lv.{me?.level ?? 1}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
