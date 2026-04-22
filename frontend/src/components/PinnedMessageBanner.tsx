import { useState } from 'react';
import { Pin, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { PinnedMessage } from '@/types/chat';

interface PinnedMessageBannerProps {
  pins: PinnedMessage[];
  onUnpin?: (messageId: string) => void;
  canPin?: boolean;
}

export default function PinnedMessageBanner({ pins, onUnpin, canPin }: PinnedMessageBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (pins.length === 0) return null;

  const latest = pins[0];

  return (
    <div className="pm-pin-banner">
      <div className="pm-pin-banner__row" onClick={() => pins.length > 1 && setExpanded(v => !v)}>
        <Pin size={13} style={{ color: 'var(--pm-accent)', flexShrink: 0 }} />
        <span className="pm-pin-banner__preview">
          <strong>{latest.senderDisplayName}:</strong> {latest.messageContent.slice(0, 80)}{latest.messageContent.length > 80 ? '…' : ''}
        </span>
        {pins.length > 1 && (
          <button className="pm-icon-btn" style={{ border: 'none', marginLeft: 'auto', padding: 2 }}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
        {canPin && (
          <button
            className="pm-icon-btn"
            style={{ border: 'none', padding: 2 }}
            onClick={e => { e.stopPropagation(); onUnpin?.(latest.messageId); }}
            title="Unpin"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {expanded && (
        <div className="pm-pin-banner__list">
          {pins.map(pin => (
            <div key={pin.id} className="pm-pin-banner__item">
              <span className="pm-pin-banner__preview">
                <strong>{pin.senderDisplayName}:</strong> {pin.messageContent.slice(0, 120)}{pin.messageContent.length > 120 ? '…' : ''}
              </span>
              {canPin && (
                <button
                  className="pm-icon-btn"
                  style={{ border: 'none', padding: 2, marginLeft: 'auto', flexShrink: 0 }}
                  onClick={() => onUnpin?.(pin.messageId)}
                  title="Unpin"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
