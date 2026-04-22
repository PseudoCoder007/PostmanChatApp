import type { ReactionCount } from '@/types/chat';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

interface ReactionPickerProps {
  reactions: ReactionCount[];
  onToggle: (emoji: string) => void;
  onClose: () => void;
}

export default function ReactionPicker({ reactions, onToggle, onClose }: ReactionPickerProps) {
  const reacted = new Set(reactions.filter(r => r.reactedByMe).map(r => r.emoji));

  return (
    <div
      className="pm-reaction-picker"
      onMouseLeave={onClose}
    >
      {QUICK_EMOJIS.map(emoji => (
        <button
          key={emoji}
          className={`pm-reaction-picker__btn${reacted.has(emoji) ? ' active' : ''}`}
          onClick={() => { onToggle(emoji); onClose(); }}
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
