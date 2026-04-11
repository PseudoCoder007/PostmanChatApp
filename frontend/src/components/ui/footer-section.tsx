import { Code2, Globe, Mail, MessageCircle } from 'lucide-react';

const featureLinks = [
  { title: 'Direct Messages', href: '/' },
  { title: 'Group Rooms', href: '/' },
  { title: 'Igris AI Buddy', href: '/' },
  { title: 'Live App', href: 'https://postmanchat.live/', external: true },
];

const contactLinks = [
  { title: 'Dev Portfolio', href: 'https://pseudocoder007.github.io/my-portfolio/', external: true, icon: Globe, blurb: 'Know the builder behind the stack' },
  { title: 'GitHub', href: 'https://github.com/PseudoCoder007', external: true, icon: Code2 },
  { title: 'Contact Email', href: 'mailto:alisaif006123@gmail.com', external: true, icon: Mail },
  { title: 'WhatsApp', href: 'https://wa.me/919336419699', external: true, icon: MessageCircle },
];

export function Footer() {
  return (
    <footer className="app-footer">
      <div className="app-footer__grid">
        <section className="app-footer__brand">
          <span className="app-footer__eyebrow">Postman Chat App</span>
          <h2 className="app-footer__title">Postman Chat App</h2>
          <p className="app-footer__tagline">
            Real-time chat with playful energy, AI backup, and social features that keep the app feeling alive.
          </p>

          <div className="app-footer__group">
            <h3 className="app-footer__heading">Features</h3>
            <ul className="app-footer__list">
              {featureLinks.map((link) => (
                <li key={link.title} className="app-footer__item">
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noreferrer' : undefined}
                    className="app-footer__link"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="app-footer__contact">
          <div className="app-footer__group">
            <h3 className="app-footer__heading">Contact Us</h3>
            <ul className="app-footer__list app-footer__list--contact">
              {contactLinks.map((link) => (
                <li key={link.title} className="app-footer__item">
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noreferrer' : undefined}
                    className="app-footer__contact-link"
                  >
                    <span className="app-footer__icon-wrap">
                      <link.icon className="app-footer__icon" />
                    </span>
                    <span className="app-footer__contact-copy">
                      <strong>{link.title}</strong>
                      {'blurb' in link ? <small>{link.blurb}</small> : null}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </footer>
  );
}
