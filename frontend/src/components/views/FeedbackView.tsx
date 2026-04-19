import { MessageSquare, Send } from 'lucide-react';
import type { FeedbackRequest } from '@/types/chat';
import { Footer } from '@/components/ui/footer-section';

interface FeedbackViewProps {
  form: FeedbackRequest;
  setForm: (f: FeedbackRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export default function FeedbackView({ form, setForm, onSubmit, isPending }: FeedbackViewProps) {
  return (
    <div>
      <div className="pm-view-header">
        <div>
          <div className="pm-view-title">Feedback & Support 💬</div>
          <div className="pm-view-subtitle">Help us make PostmanChat better for everyone</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div className="pm-card">
          <div className="pm-card__title"><MessageSquare size={15} /> Send Feedback</div>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="pm-field">
              <label className="pm-label">Category</label>
              <select
                className="pm-input"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value as FeedbackRequest['category'] })}
              >
                <option value="feedback">💡 Feedback / Suggestion</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="query">❓ General Query</option>
              </select>
            </div>

            <div className="pm-field">
              <label className="pm-label">Subject</label>
              <input
                className="pm-input"
                placeholder="Brief description..."
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>

            <div className="pm-field">
              <label className="pm-label">Message</label>
              <textarea
                className="pm-input"
                placeholder="Tell us more..."
                rows={5}
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="pm-field">
              <label className="pm-label">Contact Email (optional)</label>
              <input
                className="pm-input"
                type="email"
                placeholder="we'll reply here if needed"
                value={form.contactEmail ?? ''}
                onChange={e => setForm({ ...form, contactEmail: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="pm-btn pm-btn--primary pm-btn--full pm-btn--lg"
              disabled={isPending || !form.subject.trim() || !form.message.trim()}
            >
              {isPending ? <span className="pm-spinner" style={{ width: 16, height: 16 }} /> : <Send size={16} />}
              Send Feedback
            </button>
          </form>
        </div>

        {/* Info column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: '🐛', title: 'Bug Report', desc: 'Found a bug? Tell us what happened and how to reproduce it.' },
            { icon: '💡', title: 'Suggestions', desc: 'Got an idea to improve PostmanChat? We love hearing from you!' },
            { icon: '❓', title: 'Questions', desc: 'Need help with features, coins, or quests? Ask away.' },
            { icon: '⚡', title: 'Fast Response', desc: 'We typically respond within 24–48 hours.' },
          ].map(item => (
            <div key={item.title} className="pm-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: 'var(--pm-text-muted)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
