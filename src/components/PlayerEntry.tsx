import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Gift, Gamepad2 } from "lucide-react";
import { playerKey, validatePlayer, type Player } from "../lib/player";
import "./PlayerEntry.css";

export function PlaySteps({ current }: { current: number }) {
  return (
    <ol className="play-steps" aria-label="Your reward journey">
      {["Your details", "Play games", "Claim reward"].map((label, index) => (
        <li
          key={label}
          aria-current={current === index + 1 ? "step" : undefined}
          className={current >= index + 1 ? "is-current" : ""}
        >
          <span>{index + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}

export default function PlayerEntry({
  initial,
  onContinue,
  onCancel,
}: {
  initial: Player | null;
  onContinue: (player: Player) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [errors, setErrors] = useState({
    nameError: "",
    phoneError: "",
    storage: "",
  });
  const nameRef = useRef<HTMLInputElement>(null),
    phoneRef = useRef<HTMLInputElement>(null);
  return (
    <main className="player-entry">
      <div className="player-panel">
        <header className="player-header">
          <a href="/" aria-label="Menuoir home">
            menuoir.
          </a>
          {onCancel ? (
            <button onClick={onCancel}>
              <ArrowLeft size={16} /> Back to games
            </button>
          ) : (
            <a href="/">
              <ArrowLeft size={16} /> Back
            </a>
          )}
        </header>
        <PlaySteps current={1} />
        <section className="player-card">
          <span className="player-symbol" aria-hidden="true">
            ✿
          </span>
          <h1>{initial ? "Your player details" : "Make yourself at home."}</h1>
          <p>Enter your name and phone number, then play while you wait.</p>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const result = validatePlayer(name, phone);
              setErrors({
                nameError: result.nameError,
                phoneError: result.phoneError,
                storage: "",
              });
              if (result.nameError) {
                nameRef.current?.focus();
                return;
              }
              if (result.phoneError) {
                phoneRef.current?.focus();
                return;
              }
              try {
                sessionStorage.setItem(
                  playerKey,
                  JSON.stringify(result.player),
                );
                onContinue(result.player);
              } catch {
                setErrors({
                  nameError: "",
                  phoneError: "",
                  storage:
                    "Your browser blocked session storage. Allow site storage to continue between game screens.",
                });
              }
            }}
          >
            <label htmlFor="player-name">First name</label>
            <input
              ref={nameRef}
              id="player-name"
              autoComplete="given-name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.nameError}
              aria-describedby={
                errors.nameError ? "player-name-error" : undefined
              }
            />
            {errors.nameError && (
              <p className="player-error" id="player-name-error">
                {errors.nameError}
              </p>
            )}
            <label htmlFor="player-phone">Phone number</label>
            <input
              ref={phoneRef}
              id="player-phone"
              type="tel"
              autoComplete="tel"
              maxLength={22}
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              aria-invalid={!!errors.phoneError}
              aria-describedby={
                errors.phoneError
                  ? "player-phone-error player-privacy"
                  : "player-privacy"
              }
            />
            {errors.phoneError && (
              <p className="player-error" id="player-phone-error">
                {errors.phoneError}
              </p>
            )}
            <p className="player-privacy" id="player-privacy">
              Demo: details stay in this tab’s session. No SMS is sent, and your
              number is not verified or shared with the café.
            </p>
            {errors.storage && (
              <p role="alert" className="player-error">
                {errors.storage}
              </p>
            )}
            <button className="game-primary" type="submit">
              {initial ? "Save and continue" : "Start playing"}
              <ArrowRight size={18} />
            </button>
          </form>
        </section>
        <div className="player-benefits">
          <div>
            <Gamepad2 size={22} />
            <strong>Eight little challenges</strong>
            <p>Pick a game and make the wait more fun.</p>
          </div>
          <div>
            <Gift size={22} />
            <strong>Points toward treats</strong>
            <p>Unlock the same free-drink and buy-one-get-one demo offers.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
