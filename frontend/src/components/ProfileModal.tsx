import type { Profile } from '../types/chat';

interface ProfileModalProps {
  profile: Profile;
  onClose: () => void;
  initials: (name: string) => string;
}

export default function ProfileModal({ profile, onClose, initials }: ProfileModalProps) {
  return (
    <div className="pm-modal-backdrop" onClick={onClose}>
      <div className="pm-modal pm-profile-modal" onClick={e => e.stopPropagation()}>
        <button className="pm-icon-btn pm-modal__close" onClick={onClose} title="Close">✕</button>
        <div className="pm-profile-modal__avatar">
          {profile.avatarUrl
            ? <img src={profile.avatarUrl} alt={profile.displayName} />
            : <span className="pm-profile-modal__initials">{initials(profile.displayName)}</span>}
        </div>
        <div className="pm-profile-modal__name">{profile.displayName}</div>
        <div className="pm-profile-modal__username">@{profile.username}</div>
        {profile.title && <div className="pm-profile-modal__title">{profile.title}</div>}
        <div className="pm-profile-modal__stats">
          <div><span>{profile.level}</span><label>Level</label></div>
          <div><span>{profile.xp.toLocaleString()}</span><label>XP</label></div>
          <div><span>{profile.coins.toLocaleString()}</span><label>Coins</label></div>
        </div>
        <div className={`pm-profile-modal__status${profile.active ? ' online' : ''}`}>
          {profile.active ? 'Online' : 'Offline'}
        </div>
      </div>
    </div>
  );
}
