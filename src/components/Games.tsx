import { useEffect, useState } from "react";
import { ArrowRight, Check, Clock3, ExternalLink, Gift } from "lucide-react";
import { restaurant } from "../config/restaurant.config";
import {
  emptyScores,
  memoryScore,
  normaliseScores,
  offers,
  totalScore,
  type GameId,
  type Scores,
} from "../lib/rewards";
import "./Games.css";
import { PlaySteps } from "./PlayerEntry";

export const storageKey = "fress-trees:games:v1";
export const games: {
  id: GameId;
  number: string;
  title: string;
  caption: string;
  icon: string;
}[] = [
  {
    id: "catch",
    number: "01",
    title: "Garden Catch",
    caption: "Catch the glowing leaf before it moves.",
    icon: "✦",
  },
  {
    id: "memory",
    number: "02",
    title: "Memory Garden",
    caption: "Find every matching pair in fewer turns.",
    icon: "❋",
  },
  {
    id: "pour",
    number: "03",
    title: "Perfect Pour",
    caption: "Stop the meter inside the sweet spot.",
    icon: "◒",
  },
  {
    id: "quiz",
    number: "04",
    title: "Flavour Hunt",
    caption: "Five quick questions inspired by the menu.",
    icon: "✿",
  },
  {
    id: "cinema",
    number: "05",
    title: "Malayalam Cinema",
    caption: "Know your classics? Five film questions.",
    icon: "🎬",
  },
  {
    id: "swap",
    number: "06",
    title: "Sweet Swap",
    caption: "Swap treats. Match three. Make a cascade.",
    icon: "🍬",
  },
  {
    id: "coffee",
    number: "07",
    title: "Barista Rush",
    caption: "Build five coffee orders in the right order.",
    icon: "☕",
  },
  {
    id: "echo",
    number: "08",
    title: "Garden Echo",
    caption: "Watch the pattern, then play it back.",
    icon: "♫",
  },
];

export function readScores(): Scores {
  try {
    return normaliseScores(
      JSON.parse(localStorage.getItem(storageKey) || "null"),
    );
  } catch {
    return { ...emptyScores };
  }
}

export function Catch({ onFinish }: { onFinish: (score: number) => void }) {
  const [seconds, setSeconds] = useState(20);
  const [target, setTarget] = useState(4);
  const [hits, setHits] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setSeconds((time) => Math.max(0, time - 1)),
      1000,
    );
    const mover = window.setInterval(
      () => setTarget((old) => (old + 1 + Math.floor(Math.random() * 8)) % 9),
      1100,
    );
    return () => {
      window.clearInterval(timer);
      window.clearInterval(mover);
    };
  }, []);
  useEffect(() => {
    if (seconds === 0) onFinish(Math.min(50, hits * 5));
  }, [seconds]);
  const catchLeaf = (index: number) => {
    if (seconds === 0 || target !== index) return;
    const next = hits + 1;
    setHits(next);
    setTarget((old) => (old + 1 + Math.floor(Math.random() * 8)) % 9);
    if (next === 10) onFinish(50);
  };
  return (
    <div className="game-play">
      <div className="game-stat">
        <span>
          <Clock3 size={17} /> {seconds}s left
        </span>
        <span>{Math.min(50, hits * 5)} / 50 points</span>
      </div>
      <p>Tap the lit leaf. Ten catches make a perfect score.</p>
      <div className="catch-grid">
        {Array.from({ length: 9 }, (_, index) => (
          <button
            key={index}
            type="button"
            className={target === index ? "catch-cell is-target" : "catch-cell"}
            onClick={() => catchLeaf(index)}
            aria-label={
              target === index
                ? `Catch leaf in position ${index + 1}`
                : `Empty position ${index + 1}`
            }
          >
            {target === index ? "✦" : "·"}
          </button>
        ))}
      </div>
    </div>
  );
}

const memoryIcons = ["✿", "☕", "❋", "◒", "✦", "❀"];
export function Memory({ onFinish }: { onFinish: (score: number) => void }) {
  const [deck] = useState(() =>
    [...memoryIcons, ...memoryIcons]
      .map((icon, index) => ({ icon, sort: Math.random(), id: index }))
      .sort((a, b) => a.sort - b.sort),
  );
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (open.length !== 2) return;
    if (deck[open[0]].icon === deck[open[1]].icon) {
      const next = [...matched, ...open];
      setMatched(next);
      setOpen([]);
      if (next.length === deck.length) onFinish(memoryScore(moves));
    } else {
      setLocked(true);
      const timer = window.setTimeout(() => {
        setOpen([]);
        setLocked(false);
      }, 700);
      return () => window.clearTimeout(timer);
    }
  }, [open]);
  const reveal = (index: number) => {
    if (locked || open.includes(index) || matched.includes(index)) return;
    if (open.length === 1) setMoves((count) => count + 1);
    setOpen((current) => [...current, index]);
  };
  return (
    <div className="game-play">
      <div className="game-stat">
        <span>{matched.length / 2} / 6 pairs</span>
        <span>{moves} turns</span>
      </div>
      <p>Turn over two tiles at a time. Find all six pairs.</p>
      <div className="memory-grid">
        {deck.map((tile, index) => (
          <button
            type="button"
            key={tile.id}
            className={`memory-tile ${open.includes(index) || matched.includes(index) ? "is-open" : ""} ${matched.includes(index) ? "is-matched" : ""}`}
            onClick={() => reveal(index)}
            aria-label={`${open.includes(index) || matched.includes(index) ? tile.icon : "Hidden"} tile ${index + 1}`}
          >
            {open.includes(index) || matched.includes(index) ? tile.icon : "?"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Pour({ onFinish }: { onFinish: (score: number) => void }) {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("Aim for the green centre.");
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPosition((current) => {
        const next = current + direction * 3;
        return Math.max(0, Math.min(100, next));
      });
    }, 35);
    return () => window.clearInterval(timer);
  }, [direction]);
  useEffect(() => {
    if (position >= 100) setDirection(-1);
    if (position <= 0) setDirection(1);
  }, [position]);
  const stop = () => {
    const points =
      Math.abs(position - 50) <= 8 ? 10 : Math.abs(position - 50) <= 18 ? 6 : 2;
    const next = score + points;
    setScore(next);
    setMessage(
      points === 10
        ? "Perfect pour! +10"
        : points === 6
          ? "So close! +6"
          : "Keep practising! +2",
    );
    if (round === 5) onFinish(next);
    else {
      setRound(round + 1);
      setPosition(0);
      setDirection(1);
    }
  };
  return (
    <div className="game-play pour-play">
      <div className="game-stat">
        <span>Pour {round} / 5</span>
        <span>{score} / 50 points</span>
      </div>
      <p>Tap when the marker reaches the centre band.</p>
      <div className="pour-meter">
        <span className="pour-zone" />
        <span className="pour-marker" style={{ left: `${position}%` }} />
      </div>
      <p className="pour-message" role="status">
        {message}
      </p>
      <button type="button" className="game-primary" onClick={stop}>
        Stop the pour <ArrowRight size={17} />
      </button>
    </div>
  );
}

const questions = [
  {
    question: "Which drink is made with espresso, cold milk and caramel?",
    options: ["Iced Caramel Latte", "Watermelon Mocktail", "Garden Salad"],
    answer: 0,
  },
  {
    question: "Which category would you browse for a brownie?",
    options: ["Coffee", "Desserts", "Starters"],
    answer: 1,
  },
  {
    question: "Which dish sounds like a fresh garden plate?",
    options: ["Chocolate Brownie", "Garden Salad", "Creamy Pasta"],
    answer: 1,
  },
  {
    question: "Which one is a mocktail?",
    options: ["Watermelon Mocktail", "Cappuccino", "Alfredo Pasta"],
    answer: 0,
  },
  {
    question: "Which drink is served with a soft cloud of foam?",
    options: ["Classic Cappuccino", "Iced Latte", "Watermelon Mocktail"],
    answer: 0,
  },
];
export function Quiz({ onFinish }: { onFinish: (score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const question = questions[index];
  const next = () => {
    if (picked === null) return;
    if (index === questions.length - 1) onFinish(score);
    else {
      setIndex(index + 1);
      setPicked(null);
    }
  };
  return (
    <div className="game-play">
      <div className="game-stat">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span>{score} / 50 points</span>
      </div>
      <h4 className="quiz-question">{question.question}</h4>
      <div className="quiz-options">
        {question.options.map((option, optionIndex) => (
          <button
            type="button"
            key={option}
            disabled={picked !== null}
            className={
              picked !== null && optionIndex === question.answer
                ? "is-correct"
                : picked === optionIndex
                  ? "is-wrong"
                  : ""
            }
            onClick={() => {
              setPicked(optionIndex);
              if (optionIndex === question.answer)
                setScore((current) => current + 10);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="quiz-response">
          <span>
            {picked === question.answer
              ? "Nice pick! +10"
              : `The answer is ${question.options[question.answer]}.`}
          </span>
          <button type="button" className="game-primary" onClick={next}>
            {index === questions.length - 1 ? "See result" : "Next question"}{" "}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Games() {
  const [scores] = useState<Scores>(readScores);
  const [selectedOffer, setSelectedOffer] = useState<
    (typeof offers)[number] | null
  >(null);
  const [actions, setActions] = useState({
    follow: false,
    post1: false,
    post2: false,
    post3: false,
  });
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const total = totalScore(scores);
  const allActions = Object.values(actions).every(Boolean);
  const canPresent =
    selectedOffer && total >= selectedOffer.score && allActions && submitted;
  return (
    <div className="games-layout">
      <div className="games-intro">
        <span className="landing-eyebrow">THE GARDEN ARCADE</span>
        <h2>
          Play a little.
          <br />
          <em>Stay a little longer.</em>
        </h2>
        <p>
          Eight quick games. Each best score counts toward your garden total.
          Reach a reward, complete the steps, and let our team check your
          Instagram activity in person.
        </p>
        <div className="score-ticket">
          <span>YOUR GARDEN SCORE</span>
          <strong>
            {total}
            <small> / 400</small>
          </strong>
          <span>
            {Object.values(scores).filter(Boolean).length} of 8 games with
            points
          </span>
        </div>
      </div>
      <div className="game-board">
        <div className="game-picker" role="group" aria-label="Choose a game">
          {games.map((game) => (
            <a
              key={game.id}
              className="game-choice"
              href={`/?games=1&game=${game.id}`}
            >
              <span className="game-choice-icon" aria-hidden="true">
                {game.icon}
              </span>
              <span className="game-choice-copy">
                <small>
                  {game.number} · BEST {scores[game.id]} / 50
                </small>
                <strong>{game.title}</strong>
                <span>{game.caption}</span>
              </span>
              <ArrowRight size={18} />
            </a>
          ))}
        </div>
      </div>
      <div className="rewards-panel">
        <div className="rewards-heading">
          <span className="landing-eyebrow">GARDEN REWARDS · DEMO</span>
          <h3>Good things grow here.</h3>
          <p>
            These offers are examples. Café staff confirm availability and
            redemption.
          </p>
        </div>
        <div className="offer-grid">
          {offers.map((offer) => (
            <div className="offer-card" key={offer.id}>
              <Gift size={24} />
              <span>{offer.score} POINTS</span>
              <h4>{offer.title}</h4>
              <p>{offer.detail}</p>
              <button
                type="button"
                className="game-primary"
                disabled={total < offer.score}
                onClick={() => {
                  setSelectedOffer(offer);
                  setSubmitted(false);
                  setActions({
                    follow: false,
                    post1: false,
                    post2: false,
                    post3: false,
                  });
                  window.setTimeout(
                    () =>
                      document.getElementById("claim")?.scrollIntoView({
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "auto"
                          : "smooth",
                      }),
                    0,
                  );
                }}
              >
                {total >= offer.score
                  ? "Start claim steps"
                  : `${offer.score - total} more points to unlock`}{" "}
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
        <p className="rewards-note">
          Best scores are saved in this browser. Claim steps stay on this screen
          until you leave. This demo does not issue a redeemable coupon.
        </p>
      </div>
      {selectedOffer && (
        <div className="claim-panel" id="claim">
          <PlaySteps current={3}/>
          <div className="claim-heading">
            <span className="landing-eyebrow">
              CLAIM STEPS · {selectedOffer.title.toUpperCase()}
            </span>
            <h3>Ready when you are.</h3>
            <p>
              Open each link, complete the action in Instagram, then tick the
              matching box. Staff will verify your Instagram screen at the café.
            </p>
          </div>
          <div className="claim-actions">
            {(["follow", "post1", "post2", "post3"] as const).map(
              (key, index) => (
                <div className="claim-action" key={key}>
                  <div>
                    <strong>
                      {index === 0
                        ? "Follow our Instagram"
                        : `Like Instagram post ${index}`}
                    </strong>
                    <a
                      href={
                        index === 0
                          ? restaurant.instagram
                          : restaurant.instagram_reward_posts[index - 1] ||
                            restaurant.instagram
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {index === 0
                        ? "Open Instagram profile"
                        : restaurant.instagram_reward_posts[index - 1]
                          ? `Open post ${index}`
                          : "Open demo profile link"}{" "}
                      <ExternalLink size={14} />
                    </a>
                    {index > 0 &&
                      !restaurant.instagram_reward_posts[index - 1] && (
                        <small>Post URL placeholder — owner to add.</small>
                      )}
                  </div>
                  <label>
                    <input
                      type="checkbox"
                      checked={actions[key]}
                      onChange={(event) =>
                        setActions({ ...actions, [key]: event.target.checked })
                      }
                    />
                    <span>
                      <Check size={15} />
                    </span>
                    <span>I did this</span>
                  </label>
                </div>
              ),
            )}
          </div>
          <form
            className="feedback-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (feedback.trim().length < 10) {
                setFeedbackError(
                  "Please share at least 10 characters of feedback.",
                );
                return;
              }
              setFeedbackError("");
              setSubmitted(true);
            }}
          >
            <label htmlFor="garden-feedback">
              Private feedback for our team
            </label>
            <p>
              Tell us about your visit. This stays on this screen for staff to
              read; it is not posted publicly.
            </p>
            <textarea
              className="resize-none"
              id="garden-feedback"
              value={feedback}
              onChange={(event) => {
                setFeedback(event.target.value);
                setSubmitted(false);
                setFeedbackError("");
              }}
              maxLength={500}
              placeholder="What did you enjoy? What could we improve?"
              aria-invalid={!!feedbackError}
              aria-describedby={feedbackError ? "feedback-error" : undefined}
            />
            <div className="feedback-footer">
              <span>{feedback.length} / 500</span>
              <button type="submit" className="game-primary">
                Save private feedback <ArrowRight size={16} />
              </button>
            </div>
            {feedbackError && (
              <p className="form-error" id="feedback-error" role="alert">
                {feedbackError}
              </p>
            )}
          </form>
          <div className={canPresent ? "staff-card is-ready" : "staff-card"}>
            <div>
              <span className="landing-eyebrow">STAFF CHECK</span>
              <h4>
                {canPresent
                  ? "Ready to show our team"
                  : "Complete the steps above"}
              </h4>
              <p>
                {canPresent
                  ? `Show this screen, your Instagram follow and three liked posts to café staff. Ask them to confirm the ${selectedOffer.title} demo offer.`
                  : "Your score, four Instagram confirmations and private feedback are all required before the staff-check screen appears."}
              </p>
            </div>
            <strong>
              {canPresent
                ? "READY FOR STAFF REVIEW"
                : `${total} / ${selectedOffer.score} POINTS`}
            </strong>
          </div>
          <p className="optional-review">
            Want to leave a public review too? It is entirely optional and has
            no effect on rewards.{" "}
            <a
              href={restaurant.google_review_link || restaurant.maps_link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Google listing <ExternalLink size={13} />
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
