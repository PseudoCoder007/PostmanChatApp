import { motion } from 'framer-motion';
import { Code2, Globe, Mail, MessageCircle, Zap, Trophy, MessageSquare, Target } from 'lucide-react';

const features = [
  { icon: MessageSquare, label: 'Rooms & DMs', desc: 'Structured spaces for team chat and direct follow-up' },
  { icon: Zap, label: 'Momentum Layer', desc: 'Engagement systems that reward active participation' },
  { icon: Target, label: 'Daily Missions', desc: 'Recurring prompts that keep communities moving' },
  { icon: Trophy, label: 'Visible Progress', desc: 'Ranks and boards that make contribution obvious' },
];

const links = [
  { icon: Globe, label: 'Portfolio', sub: 'Meet the builder', href: 'https://pseudocoder007.github.io/my-portfolio/' },
  { icon: Code2, label: 'GitHub', sub: 'Source and experiments', href: 'https://github.com/PseudoCoder007' },
  { icon: Mail, label: 'Email', sub: 'Product, bugs, partnerships', href: 'mailto:alisaif006123@gmail.com' },
  { icon: MessageCircle, label: 'WhatsApp', sub: 'Fastest contact line', href: 'https://wa.me/919336419699' },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const row = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

export function Footer({ onOpenFeedback }: { onOpenFeedback?: () => void }) {
  return (
    <motion.footer
      className="ft-root"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
    >
      <div className="ft-accent-line" />

      <div className="ft-inner">
        <motion.div
          className="ft-brand"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="ft-brand__logo">
            <span className="ft-brand__icon">P</span>
            <span className="ft-brand__name">Postman<span>Chat</span></span>
          </div>
          <div className="ft-brand__eyebrow">Conversations with momentum</div>
          <h3 className="ft-brand__headline">Where communities talk, engage, and keep moving forward.</h3>
          <p className="ft-brand__tagline">
            PostmanChat blends messaging, progress systems, and community energy into one focused workspace for modern chat-driven products.
          </p>
          <p className="ft-brand__catch">Clear chat. Stronger habits. Better follow-through.</p>
          {onOpenFeedback && (
            <button className="ft-feedback-btn" onClick={onOpenFeedback} type="button">
              Share product feedback {'->'}
            </button>
          )}
        </motion.div>

        <div className="ft-section">
          <div className="ft-section__heading">What You Get</div>
          <motion.div className="ft-features" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {features.map(f => (
              <motion.div key={f.label} className="ft-feature" variants={row}>
                <div className="ft-feature__icon">
                  <f.icon size={15} />
                </div>
                <div>
                  <div className="ft-feature__label">{f.label}</div>
                  <div className="ft-feature__desc">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="ft-section">
          <div className="ft-section__heading">Find The Builder</div>
          <motion.div className="ft-links" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {links.map(l => (
              <motion.a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="ft-link"
                variants={row}
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="ft-link__icon-wrap">
                  <l.icon size={14} />
                </div>
                <div>
                  <div className="ft-link__label">{l.label}</div>
                  <div className="ft-link__sub">{l.sub}</div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="ft-bottom">
        <span>(c) {new Date().getFullYear()} PostmanChat</span>
        <span className="ft-bottom__dot" />
        <span>
          Designed &amp; built by{' '}
          <a
            href="https://pseudocoder007.github.io/my-portfolio/"
            target="_blank"
            rel="noreferrer"
            className="ft-bottom__author"
          >
            Mohd Saif
          </a>
        </span>
        <span className="ft-bottom__dot" />
        <span>Purpose-built chat for engagement, accountability, and momentum.</span>
      </div>
    </motion.footer>
  );
}
