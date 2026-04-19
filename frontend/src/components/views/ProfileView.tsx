import { useRef } from 'react';
import { Camera, Save, Zap, Coins, Users, CheckCircle, Lock } from 'lucide-react';
import type { Profile } from '@/types/chat';
import { Footer } from '@/components/ui/footer-section';

interface ProfileViewProps {
  me: Profile | undefined;
  profileForm: { displayName: string; username: string; avatarUrl: string };
  setProfileForm: (f: { displayName: string; username: string; avatarUrl: string }) => void;
  profileImageFile: File | null;
  setProfileImageFile: (f: File | null) => void;
  onSave: () => void;
  savePending: boolean;
  friendsCount: number;
  completedQuestCount: number;
  xpProgress: { mainProgress: number };
  initials: (v: string) => string;
}

const UNLOCKS = [
  { key: 'profilePhoto', icon: '📸', name: 'Profile Photo', price: 5, field: 'profilePhotoUnlocked' as keyof Profile },
  { key: 'igris', icon: '🤖', name: 'Igris AI', price: 5, field: 'canUseIgris' as keyof Profile },
  { key: 'challenges', icon: '⚔️', name: 'Friend Challenges', price: 10, field: 'canChallengeFriends' as keyof Profile },
  { key: 'groupRoom', icon: '🏠', name: 'Group Rooms', price: 0, field: null },
];

export default function ProfileView({
  me, profileForm, setProfileForm, profileImageFile, setProfileImageFile,
  onSave, savePending, friendsCount, completedQuestCount, xpProgress, initials,
}: ProfileViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarPreview = profileImageFile ? URL.createObjectURL(profileImageFile) : (profileForm.avatarUrl || null);

  return (
    <div>
      <div className="pm-view-header">
        <div>
          <div className="pm-view-title">Profile 👤</div>
          <div className="pm-view-subtitle">Manage your identity and unlocks</div>
        </div>
      </div>

      {/* Header card */}
      <div className="pm-profile-header">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div className="pm-avatar pm-avatar--xl">
            {avatarPreview ? <img src={avatarPreview} alt="avatar" /> : initials(profileForm.displayName || me?.displayName || '?')}
          </div>
          {me?.profilePhotoUnlocked && (
            <button
              className="pm-icon-btn"
              style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26 }}
              onClick={() => fileRef.current?.click()}
              title="Change photo"
            >
              <Camera size={13} />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setProfileImageFile(e.target.files?.[0] ?? null)} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{me?.displayName}</div>
          <div style={{ fontSize: 14, color: 'var(--pm-text-muted)', marginBottom: 12 }}>
            @{me?.username} · Lv.{me?.level} · {me?.title}
          </div>
          <div className="pm-progress-wrap" style={{ maxWidth: 280 }}>
            <div className="pm-progress-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Zap size={11} color="var(--pm-xp)" /> XP</span>
              <span>{me?.xp?.toLocaleString()} total</span>
            </div>
            <div className="pm-progress"><div className="pm-progress__fill pm-progress__fill--xp" style={{ width: `${xpProgress.mainProgress}%` }} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--pm-gold)' }}>
            <Coins size={16} style={{ display: 'inline', marginRight: 4 }} />{me?.coins ?? 0}
          </div>
          <div style={{ fontSize: 11, color: 'var(--pm-text-muted)' }}>coins</div>
        </div>
      </div>

      <div className="pm-grid-2" style={{ marginBottom: 20 }}>
        {/* Identity editor */}
        <div className="pm-card">
          <div className="pm-card__title">Edit Identity</div>
          <div className="pm-field">
            <label className="pm-label">Display Name</label>
            <input className="pm-input" value={profileForm.displayName} onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })} />
          </div>
          <div className="pm-field">
            <label className="pm-label">Username</label>
            <input className="pm-input" value={profileForm.username} onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} />
          </div>
          <button className="pm-btn pm-btn--primary pm-btn--full" onClick={onSave} disabled={savePending}>
            {savePending ? <span className="pm-spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
            Save Changes
          </button>
        </div>

        {/* Stats */}
        <div className="pm-card">
          <div className="pm-card__title">Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <Users size={14} />, label: 'Social Score', value: friendsCount, sub: 'friends' },
              { icon: '🎯', label: 'Quest Completion', value: completedQuestCount, sub: 'completed' },
              { icon: <Zap size={14} />, label: 'Total XP', value: me?.xp?.toLocaleString() ?? 0, sub: 'points' },
            ].map(stat => (
              <div key={stat.label} className="pm-row pm-row--between">
                <div style={{ fontSize: 13, color: 'var(--pm-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {stat.icon} {stat.label}
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--pm-text)' }}>{stat.value}</span>
                  <span style={{ fontSize: 11, color: 'var(--pm-text-muted)', marginLeft: 4 }}>{stat.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unlocks grid */}
      <div style={{ marginBottom: 8 }} className="pm-section-title">Unlocks</div>
      <div className="pm-grid-4">
        {UNLOCKS.map(u => {
          const unlocked = u.field ? !!me?.[u.field] : true;
          return (
            <div key={u.key} className={`pm-unlock-card${unlocked ? ' unlocked' : ''}`}>
              <div className="pm-unlock-card__icon">{u.icon}</div>
              <div className="pm-unlock-card__name">{u.name}</div>
              {unlocked
                ? <span className="pm-badge pm-badge--xp"><CheckCircle size={10} /> Unlocked</span>
                : (
                  <div style={{ textAlign: 'center' }}>
                    <span className="pm-badge pm-badge--gold"><Coins size={10} />{u.price} coins</span>
                    <div style={{ fontSize: 11, color: 'var(--pm-text-muted)', marginTop: 4 }}>Earn coins to unlock</div>
                  </div>
                )}
            </div>
          );
        })}
      </div>

      <Footer />
    </div>
  );
}
