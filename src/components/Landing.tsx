import { ArrowUpRight, Gamepad2, Menu as MenuIcon, Star } from "lucide-react";
import "./Landing.css";

const choices = [
  {
    number: "01 / EXPLORE",
    title: "Menu",
    description: "Find something delicious for right now.",
    href: "/?menu=1",
    className: "entry-menu",
    icon: MenuIcon,
    external: false,
  },
  {
    number: "02 / PLAY",
    title: "Games",
    description: "Eight quick games and the same demo offers.",
    href: "/?games=1",
    className: "entry-games",
    icon: Gamepad2,
    external: false,
  },
  {
    number: "03 / SHARE",
    title: "Review",
    description: "Tell others about your visit on Google.",
    href: "/?review=1",
    className: "entry-review",
    icon: Star,
    external: false,
  },
] as const;

export default function Landing() {
  return (
    <main className="entry-page">
      <div className="entry-panel">
        <header className="entry-header">
          <div className="entry-brand" aria-label="Menuoir">
            menuoir<span className="entry-brand-dot">.</span>
          </div>
          <p>Choose where to begin</p>
        </header>
        <h1 className="sr-only">Menuoir: Menu, Games and Review</h1>
        <nav className="entry-choices" aria-label="Choose a section">
          {choices.map((choice) => {
            const Icon = choice.icon;
            return (
              <a
                className={`entry-card ${choice.className}`}
                href={choice.href}
                target={choice.external ? "_blank" : undefined}
                rel={choice.external ? "noopener noreferrer" : undefined}
                key={choice.title}
              >
                <span className="entry-number">{choice.number}</span>
                <span className="entry-icon" aria-hidden="true">
                  <Icon size={23} strokeWidth={1.8} />
                </span>
                <span className="entry-card-bottom">
                  <span>
                    <strong>{choice.title}</strong>
                    <small>{choice.description}</small>
                  </span>
                  <ArrowUpRight size={21} aria-hidden="true" />
                </span>
              </a>
            );
          })}
        </nav>
        <p className="entry-note">Menu and rewards are currently a demo.</p>
      </div>
    </main>
  );
}
