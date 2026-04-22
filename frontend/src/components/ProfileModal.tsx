import { useQuery } from '@tanstack/react-query';
import type { MutualFriends, Profile } from '../types/chat';
import { apiFetch } from '../lib/api';

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error((await r.text()) || `${r.status}`);
  return r.json() as Promise<T>;
}

interface ProfileModalProps {
  profile: Profile;
  onClose: () => void;
  initials: (name: string) => string;
}

export default function ProfileModal({ profile, onClose, initials }: ProfileModalProps) {
  const { data: mutual } = useQuery<MutualFriends>({
    queryKey: ['mutual', profile.id],
    queryFn: async () => json<MutualFriends>(await apiFetch(`/api/friends/${profile.id}/mutual`)),
    staleTime: 60000,
    retry: false,
  });

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
        {(profile.statusEmoji || profile.statusText) && (
          <div className="pm-profile-modal__custom-status">
            {profile.statusEmoji && <span>{profile.statusEmoji}</span>}
            {profile.statusText && <span>{profile.statusText}</span>}
          </div>
        )}
        {profile.title && <div className="pm-profile-modal__title">{profile.title}</div>}
        <div className="pm-profile-modal__stats">
          <div><span>{profile.level}</span><label>Level</label></div>
          <div><span>{profile.xp.toLocaleString()}</span><label>XP</label></div>
          <div><span>{profile.coins.toLocaleString()}</span><label>Coins</label></div>
        </div>
        <div className={`pm-profile-modal__status${profile.active ? ' online' : ''}`}>
          {profile.active ? 'Online' : 'Offline'}
        </div>
        {mutual && mutual.count > 0 && (
          <div className="pm-profile-modal__mutual">
            <div className="pm-avatar-stack">
              {mutual.samples.slice(0, 3).map(p => (
                <div key={p.id} className="pm-avatar pm-avatar--xs" title={p.displayName}>
                  {p.avatarUrl
                    ? <img src={p.avatarUrl} alt={p.displayName} />
                    : initials(p.displayName)}
                </div>
              ))}
            </div>
            <span>{mutual.count} mutual friend{mutual.count !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
