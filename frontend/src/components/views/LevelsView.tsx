import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Award, Star, Target, Users2 } from 'lucide-react';
import type { Profile } from '@/types/chat';
import { Footer } from '@/components/ui/footer-section';

interface LevelInfo { level: number; xpRequired: number; title: string; description: string }
interface XpProgress { current: number; required: number; mainProgress: number }

interface LevelsViewProps {
  me: Profile | undefined;
  xpProgress: XpProgress;
  getLevelInfo: (level: number) => LevelInfo;
  activeQuestCount: number;
  onlineFriendsCount: number;
}

const RANK_COLORS: Record<number, string> = {
  1: '#5a7070', 2: '#4af4ff', 3: '#22c55e',
  4: '#f59e0b', 5: '#f97316', 6: '#ec4899', 7: '#a855f7',
};

function getRankColor(level: number) {
  return RANK_COLORS[Math.min(level, 7)] ?? '#4af4ff';
}

function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export default function LevelsView({
  me, xpProgress, getLevelInfo, activeQuestCount, onlineFriendsCount,
}: LevelsViewProps) {
  const currentLevel = me?.level ?? 1;
  const nextInfo = getLevelInfo(currentLevel + 1);
  const currentInfo = getLevelInfo(currentLevel);
  const rankColor = getRankColor(currentLevel);

  const animXP = useAnimatedNumber(me?.xp ?? 0);
  const animCoins = useAnimatedNumber(me?.coins ?? 0);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(xpProgress.mainProgress), 300);
    return () => clearTimeout(t);
  }, [xpProgress.mainProgress]);

  const levelNodes = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* ── Hero ─────────────────────────────────── */}
      <motion.div variants={item} className="lv-hero">
        <div className="lv-hero__accent-bar" style={{ background: `linear-gradient(90deg, ${rankColor}, transparent)` }} />
        <div className="lv-hero__top">
          <div>
            <div className="lv-hero__level-label" style={{ color: rankColor }}>LEVEL {currentLevel}</div>
            <div className="lv-hero__rank">{currentInfo.title}</div>
            <div className="lv-hero__sub">{currentInfo.description}</div>
          </div>
          <motion.div
            className="lv-rank-badge"
            style={{ borderColor: rankColor, color: rankColor }}
            animate={{ boxShadow: [`0 0 0px ${rankColor}40`, `0 0 18px ${rankColor}60`, `0 0 0px ${rankColor}40`] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            <Award size={16} />
            {me?.title ?? 'Newbie'}
          </motion.div>
        </div>

        {/* Stats grid */}
        <div className="lv-stats-grid">
          {[
            { icon: <TrendingUp size={18} />, val: currentLevel, label: 'Level', color: rankColor },
            { icon: <Zap size={18} />, val: animXP, label: 'Total XP', color: 'var(--pm-xp)' },
            { icon: <Star size={18} />, val: animCoins, label: 'Coins', color: 'var(--pm-gold)' },
          ].map(s => (
            <div key={s.label} className="lv-stat">
              <div className="lv-stat__icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="lv-stat__val" style={{ color: s.color }}>{s.val}</div>
              <div className="lv-stat__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* XP bar */}
        <div className="lv-xp-wrap">
          <div className="lv-xp-labels">
            <span>To Level {currentLevel + 1} — <strong style={{ color: 'var(--pm-text)' }}>{nextInfo.title}</strong></span>
            <span style={{ color: rankColor, fontWeight: 700 }}>{Math.round(xpProgress.mainProgress)}%</span>
          </div>
          <div className="lv-xp-track">
            <div
              className="lv-xp-fill"
              style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${rankColor}, ${rankColor}99)` }}
            />
          </div>
          <div className="lv-xp-sub">
            <span style={{ color: 'var(--pm-xp)', fontWeight: 600 }}>{xpProgress.current}</span>
            <span style={{ color: 'var(--pm-text-muted)' }}> / {xpProgress.required} XP</span>
            <span style={{ color: 'var(--pm-text-muted)', marginLeft: 8 }}>
              · {xpProgress.required - xpProgress.current} XP to go
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Main 2-col layout ───────────────────── */}
      <div className="pm-levels-layout">

        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Timeline */}
          <motion.div variants={item} className="pm-card" style={{ overflow: 'hidden' }}>
            <div className="pm-card__title"><TrendingUp size={15} /> Rank Roadmap</div>
            <div className="lv-timeline">
              {levelNodes.map(n => {
                const done = n < currentLevel;
                const current = n === currentLevel;
                const color = getRankColor(n);
                const info = getLevelInfo(n);
                return (
                  <motion.div
                    key={n}
                    className="lv-tl-node"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: n * 0.04, type: 'spring', stiffness: 300 }}
                  >
                    <div className="lv-tl-line" style={{ background: done ? color : 'var(--pm-border)' }} />
                    <motion.div
                      className="lv-tl-circle"
                      style={done
                        ? { background: color, borderColor: color, color: '#000' }
                        : current
                          ? { borderColor: color, color, boxShadow: `0 0 0 4px ${color}22` }
                          : {}
                      }
                      animate={current ? { scale: [1, 1.08, 1] } : {}}
                      transition={current ? { repeat: Infinity, duration: 2 } : {}}
                    >
                      {done ? '✓' : n}
                    </motion.div>
                    <div
                      className="lv-tl-label"
                      style={current ? { color, fontWeight: 700 } : done ? { color } : {}}
                    >
                      {info.title}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Current / Next rank cards */}
          <div className="pm-grid-2">
            {[currentLevel, currentLevel + 1].map((n, idx) => {
              const info = getLevelInfo(n);
              const isCurrent = idx === 0;
              const cardColor = getRankColor(n);
              return (
                <motion.div
                  key={n}
                  variants={item}
                  className="pm-card"
                  style={{ position: 'relative', overflow: 'hidden', borderColor: isCurrent ? `${cardColor}50` : undefined }}
                  whileHover={{ y: -3, boxShadow: `0 8px 32px ${cardColor}20` }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${cardColor}, transparent)` }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ fontSize: 36, fontWeight: 900, color: cardColor, lineHeight: 1, letterSpacing: -2, fontVariantNumeric: 'tabular-nums' }}>
                      {String(n).padStart(2, '0')}
                    </div>
                    <span className={`pm-badge ${isCurrent ? 'pm-badge--accent' : 'pm-badge--muted'}`}>
                      {isCurrent ? 'Active' : 'Next'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: 'var(--pm-text)' }}>{info.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--pm-text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{info.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <Zap size={12} style={{ color: 'var(--pm-xp)' }} />
                    <span style={{ color: 'var(--pm-xp)', fontWeight: 700 }}>{info.xpRequired} XP</span>
                    <span style={{ color: 'var(--pm-text-muted)' }}>to reach</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right col — Live Intel */}
        <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="pm-card pm-card--glow">
            <div className="pm-card__title" style={{ marginBottom: 16 }}>
              <span style={{ color: 'var(--pm-accent)' }}>◉</span> Live Intel
            </div>
            <div className="lv-intel-grid">
              {[
                { icon: <Target size={20} />, val: activeQuestCount, max: 3, label: 'Active Quests', color: 'var(--pm-accent)' },
                { icon: <Users2 size={20} />, val: onlineFriendsCount, max: null, label: 'Online Friends', color: 'var(--pm-xp)' },
                { icon: <Zap size={20} />, val: animXP, max: null, label: 'Total XP', color: 'var(--pm-xp)' },
                { icon: <Star size={20} />, val: animCoins, max: null, label: 'Coins', color: 'var(--pm-gold)' },
              ].map(s => (
                <motion.div
                  key={s.label}
                  className="lv-intel-cell"
                  whileHover={{ scale: 1.04 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="lv-intel-cell__icon" style={{ color: s.color }}>{s.icon}</div>
                  <div className="lv-intel-cell__val" style={{ color: s.color }}>{s.val}{s.max ? `/${s.max}` : ''}</div>
                  <div className="lv-intel-cell__label">{s.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Rank unlock guide */}
          <div className="pm-card">
            <div className="pm-card__title">How ranks work</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { emoji: '💬', tip: 'Send messages to earn XP passively' },
                { emoji: '🎯', tip: 'Complete daily quests for bonus XP bursts' },
                { emoji: '🤝', tip: 'Challenge friends for squad XP multipliers' },
                { emoji: '📸', tip: 'Upload proof images to auto-complete quests' },
              ].map(t => (
                <div key={t.emoji} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{t.emoji}</span>
                  <span style={{ fontSize: 13, color: 'var(--pm-text-soft)', lineHeight: 1.5 }}>{t.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </motion.div>
  );
}
