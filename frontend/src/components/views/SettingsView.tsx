import { useEffect, useState } from 'react';
import { Moon, Sun, Volume2, VolumeX, Bell, BellOff, BellRing, PlayCircle, LogOut } from 'lucide-react';
import { Footer } from '@/components/ui/footer-section';

type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported';

interface SettingsViewProps {
  isDark: boolean;
  toggleTheme: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  onRequestNotifications: () => void;
  onReplayTutorial: () => void;
  onSignOut: () => void;
}

export default function SettingsView({
  isDark, toggleTheme, soundEnabled, setSoundEnabled,
  onReplayTutorial, onSignOut,
}: SettingsViewProps) {
  const [notifPerm, setNotifPerm] = useState<NotifPermission>(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission as NotifPermission;
  });
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    setNotifPerm(Notification.permission as NotifPermission);
  }, []);

  async function handleEnableNotifications() {
    if (!('Notification' in window)) return;
    if (notifPerm === 'granted') return;
    setRequesting(true);
    const result = await Notification.requestPermission();
    setNotifPerm(result as NotifPermission);
    setRequesting(false);
  }

  const notifLabel = notifPerm === 'granted'
    ? 'Notifications active'
    : notifPerm === 'denied'
    ? 'Blocked by browser — check site settings'
    : notifPerm === 'unsupported'
    ? 'Not supported in this browser'
    : 'Get notified even when PostmanChat is in the background';

  const notifBtnLabel = requesting ? 'Requesting...'
    : notifPerm === 'granted' ? 'Enabled ✓'
    : notifPerm === 'denied'  ? 'Blocked'
    : notifPerm === 'unsupported' ? 'N/A'
    : 'Enable';

  const NotifIcon = notifPerm === 'granted' ? BellRing : notifPerm === 'denied' ? BellOff : Bell;

  return (
    <div>
      <div className="pm-view-header">
        <div>
          <div className="pm-view-title">Settings ⚙️</div>
          <div className="pm-view-subtitle">Customize your PostmanChat experience</div>
        </div>
      </div>

      {/* Visual */}
      <div className="pm-settings-section">
        <div className="pm-settings-section__title">Visual</div>
        <div className="pm-settings-row">
          <div>
            <div className="pm-settings-row__label">{isDark ? <><Moon size={14} style={{ display: 'inline', marginRight: 6 }} />Dark Mode</> : <><Sun size={14} style={{ display: 'inline', marginRight: 6 }} />Light Mode</>}</div>
            <div className="pm-settings-row__desc">Switch between dark and light theme</div>
          </div>
          <label className="pm-toggle">
            <input type="checkbox" checked={isDark} onChange={toggleTheme} />
            <span className="pm-toggle__track" />
          </label>
        </div>
      </div>

      {/* Audio */}
      <div className="pm-settings-section">
        <div className="pm-settings-section__title">Audio</div>
        <div className="pm-settings-row">
          <div>
            <div className="pm-settings-row__label">
              {soundEnabled
                ? <><Volume2 size={14} style={{ display: 'inline', marginRight: 6 }} />Sound Effects</>
                : <><VolumeX size={14} style={{ display: 'inline', marginRight: 6 }} />Sound Effects</>}
            </div>
            <div className="pm-settings-row__desc">Message pings, quest alerts, and level-up sounds</div>
          </div>
          <label className="pm-toggle">
            <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} />
            <span className="pm-toggle__track" />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="pm-settings-section">
        <div className="pm-settings-section__title">Notifications</div>
        <div className="pm-settings-row">
          <div>
            <div className="pm-settings-row__label">
              <NotifIcon size={14} style={{ display: 'inline', marginRight: 6, color: notifPerm === 'granted' ? 'var(--pm-accent)' : notifPerm === 'denied' ? 'var(--pm-danger)' : undefined }} />
              Browser Notifications
            </div>
            <div className="pm-settings-row__desc" style={{ color: notifPerm === 'granted' ? 'var(--pm-accent)' : notifPerm === 'denied' ? 'var(--pm-danger)' : undefined }}>
              {notifLabel}
            </div>
          </div>
          <button
            className={`pm-btn pm-btn--sm ${notifPerm === 'granted' ? 'pm-btn--primary' : notifPerm === 'denied' ? 'pm-btn--danger' : 'pm-btn--ghost'}`}
            onClick={() => void handleEnableNotifications()}
            disabled={requesting || notifPerm === 'granted' || notifPerm === 'denied' || notifPerm === 'unsupported'}
          >
            {notifBtnLabel}
          </button>
        </div>
      </div>

      {/* Tutorial */}
      <div className="pm-settings-section">
        <div className="pm-settings-section__title">Help</div>
        <div className="pm-settings-row">
          <div>
            <div className="pm-settings-row__label"><PlayCircle size={14} style={{ display: 'inline', marginRight: 6 }} />Replay Tutorial</div>
            <div className="pm-settings-row__desc">Walk through the PostmanChat onboarding again</div>
          </div>
          <button className="pm-btn pm-btn--ghost pm-btn--sm" onClick={onReplayTutorial}>
            Replay
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pm-settings-section">
        <div className="pm-settings-section__title" style={{ color: 'var(--pm-danger)' }}>Danger Zone</div>
        <div className="pm-settings-row">
          <div>
            <div className="pm-settings-row__label"><LogOut size={14} style={{ display: 'inline', marginRight: 6 }} />Sign Out</div>
            <div className="pm-settings-row__desc">Log out of your PostmanChat account</div>
          </div>
          <button className="pm-btn pm-btn--danger pm-btn--sm" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
