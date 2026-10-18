import { useEffect, useState } from "react";
import {
  adjacent,
  collapse,
  legalMove,
  matches,
  newBoard,
  swap,
} from "../lib/sweet-swap";
type Props = { onFinish: (score: number) => void };

// Facts checked against Apple TV film credits, DFF's 2014 Indian Panorama
// catalogue (Drishyam), and dulquer.com/bangalore-days/.
const filmQuestions = [
  {
    q: "Who directed Manichitrathazhu?",
    options: ["Priyadarshan", "Fazil", "Sathyan Anthikad"],
    answer: 1,
  },
  {
    q: "Who directed the classic Chemmeen?",
    options: ["Ramu Kariat", "Adoor Gopalakrishnan", "Bharathan"],
    answer: 0,
  },
  {
    q: "What business does Georgekutty run in Drishyam?",
    options: ["A restaurant", "A travel agency", "A cable TV network"],
    answer: 2,
  },
  {
    q: "Who plays the lead character George in Premam?",
    options: ["Dulquer Salmaan", "Nivin Pauly", "Fahadh Faasil"],
    answer: 1,
  },
  {
    q: "Who directed Bangalore Days?",
    options: ["Anjali Menon", "Geetu Mohandas", "Anwar Rasheed"],
    answer: 0,
  },
];
export function Cinema({ onFinish }: Props) {
  const [index, setIndex] = useState(0),
    [score, setScore] = useState(0),
    [picked, setPicked] = useState<number | null>(null);
  const q = filmQuestions[index];
  return (
    <div className="game-play">
      <div className="game-stat">
        <span>Scene {index + 1} / 5</span>
        <span>{score} / 50 points</span>
      </div>
      <div className="cinema-mark" aria-hidden="true">
        🎬
      </div>
      <h2 className="quiz-question">{q.q}</h2>
      <div className="quiz-options">
        {q.options.map((option, i) => (
          <button
            key={option}
            disabled={picked !== null}
            className={
              picked !== null && i === q.answer
                ? "is-correct"
                : picked === i
                  ? "is-wrong"
                  : ""
            }
            onClick={() => {
              setPicked(i);
              if (i === q.answer) setScore(score + 10);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="quiz-response">
          <span role="status">
            {picked === q.answer
              ? "Correct! +10 points"
              : `The answer is ${q.options[q.answer]}.`}
          </span>
          <button
            className="game-primary"
            onClick={() => {
              if (index === 4) onFinish(score);
              else {
                setIndex(index + 1);
                setPicked(null);
              }
            }}
          >
            {index === 4 ? "See result" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}
const treats = ["🍓", "🍋", "🍬", "🍇", "🍊"];
const names = ["strawberry", "lemon", "candy", "grapes", "orange"];
export function SweetSwap({ onFinish }: Props) {
  const [board, setBoard] = useState(newBoard),
    [selected, setSelected] = useState<number | null>(null),
    [moves, setMoves] = useState(15),
    [score, setScore] = useState(0),
    [hint, setHint] = useState("Tap two neighbouring treats to swap them."),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => {
      const found = matches(board);
      if (found.length) {
        setScore((s) => Math.min(50, s + found.length));
        setBoard(collapse(board, found));
      } else {
        setBusy(false);
        if (score >= 50 || moves === 0) onFinish(score);
        else if (!legalMove(board)) {
          setBoard(newBoard());
          setHint("Fresh board! No moves were available.");
        }
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [busy, board, moves, score, onFinish]);
  function choose(i: number) {
    if (busy) return;
    if (selected === null || !adjacent(selected, i)) {
      setSelected(i === selected ? null : i);
      return;
    }
    const next = swap(board, selected, i);
    setSelected(null);
    if (!matches(next).length) {
      setHint("That swap makes no match. Try another — no move lost.");
      return;
    }
    setBoard(next);
    setMoves(moves - 1);
    setBusy(true);
    setHint("Sweet match! Each cleared treat earns a point.");
  }
  const lit = busy ? matches(board) : [];
  return (
    <div className="game-play">
      <div className="game-stat">
        <span>{moves} moves left</span>
        <span>{score} / 50 points</span>
      </div>
      <p role="status">{hint}</p>
      <div className="sweet-grid">
        {board.map((v, i) => (
          <button
            key={i}
            disabled={busy}
            aria-label={`${names[v]}, row ${Math.floor(i / 6) + 1}, column ${(i % 6) + 1}`}
            aria-pressed={selected === i}
            className={`${selected === i ? "selected" : ""} ${lit.includes(i) ? "matched" : ""}`}
            onClick={() => choose(i)}
          >
            {treats[v]}
          </button>
        ))}
      </div>
      <button
        className="game-restart hint-button"
        disabled={busy}
        onClick={() => {
          const move = legalMove(board);
          if (move) {
            setSelected(move[0]);
            setHint(
              `Try row ${Math.floor(move[1] / 6) + 1}, column ${(move[1] % 6) + 1} next.`,
            );
          }
        }}
      >
        Show a hint
      </button>
    </div>
  );
}
const recipes = [
  { name: "Latte", steps: ["Espresso", "Milk"] },
  { name: "Mocha", steps: ["Espresso", "Chocolate", "Milk"] },
  { name: "Cappuccino", steps: ["Espresso", "Milk", "Foam"] },
  { name: "Iced latte", steps: ["Ice", "Espresso", "Milk"] },
  { name: "Caramel latte", steps: ["Caramel", "Espresso", "Milk", "Foam"] },
];
export function Coffee({ onFinish }: Props) {
  const [round, setRound] = useState(0),
    [cup, setCup] = useState<string[]>([]),
    [score, setScore] = useState(0),
    [mistakes, setMistakes] = useState(0),
    [message, setMessage] = useState("Follow the recipe from left to right.");
  const order = recipes[round];
  function add(ingredient: string) {
    if (cup.length === order.steps.length) return;
    if (ingredient !== order.steps[cup.length]) {
      setMistakes(mistakes + 1);
      setMessage(
        "Wrong ingredient — try the next one on the recipe. −2 points for this order.",
      );
      return;
    }
    setCup([...cup, ingredient]);
    setMessage("Nice! Keep building your coffee.");
  }
  return (
    <div className="game-play">
      <div className="game-stat">
        <span>Order {round + 1} / 5</span>
        <span>{score} / 50 points</span>
      </div>
      <h2 className="quiz-question">One {order.name.toLowerCase()}, please.</h2>
      <p className="recipe">{order.steps.join(" → ")}</p>
      <div
        className="coffee-cup"
        aria-label={`Cup: ${cup.join(", ") || "empty"}`}
      >
        {cup.map((item, i) => (
          <span key={i} className={`ingredient-${item.toLowerCase()}`}>
            {item}
          </span>
        ))}
        {!cup.length && <span className="empty-cup">Your cup</span>}
      </div>
      <p role="status">{message}</p>
      <div className="ingredient-grid">
        {["Espresso", "Milk", "Foam", "Chocolate", "Ice", "Caramel"].map(
          (item) => (
            <button
              key={item}
              disabled={cup.length === order.steps.length}
              onClick={() => add(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>
      <button
        className="game-primary serve-button"
        disabled={cup.length !== order.steps.length}
        onClick={() => {
          const next = score + Math.max(0, 10 - mistakes * 2);
          if (round === 4) onFinish(next);
          else {
            setScore(next);
            setRound(round + 1);
            setCup([]);
            setMistakes(0);
            setMessage("Order served. Next coffee!");
          }
        }}
      >
        Serve coffee · {Math.max(0, 10 - mistakes * 2)} points
      </button>
    </div>
  );
}
const pads = ["Leaf", "Sun", "Flower", "Moon"],
  symbols = ["❧", "☀", "✿", "☾"];
export function Echo({ onFinish }: Props) {
  const [sequence, setSequence] = useState(() => [
      Math.floor(Math.random() * 4),
    ]),
    [phase, setPhase] = useState<"watch" | "repeat">("watch"),
    [lit, setLit] = useState<number | null>(null),
    [position, setPosition] = useState(0);
  useEffect(() => {
    if (phase !== "watch") return;
    const timers: number[] = [];
    sequence.forEach((pad, i) => {
      timers.push(window.setTimeout(() => setLit(pad), 600 + i * 850));
      timers.push(window.setTimeout(() => setLit(null), 1150 + i * 850));
    });
    timers.push(
      window.setTimeout(
        () => {
          setPhase("repeat");
          setPosition(0);
        },
        600 + sequence.length * 850,
      ),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [phase, sequence]);
  function press(i: number) {
    if (phase !== "repeat") return;
    if (i !== sequence[position]) {
      onFinish((sequence.length - 1) * 10);
      return;
    }
    if (position === sequence.length - 1) {
      if (sequence.length === 5) onFinish(50);
      else {
        setPhase("watch");
        setSequence([...sequence, Math.floor(Math.random() * 4)]);
      }
    } else setPosition(position + 1);
  }
  return (
    <div className="game-play">
      <div className="game-stat">
        <span>Round {sequence.length} / 5</span>
        <span>{(sequence.length - 1) * 10} / 50 points</span>
      </div>
      <h2 className="quiz-question" role="status">
        {phase === "watch"
          ? "Watch the pattern…"
          : `Your turn · ${position + 1} of ${sequence.length}`}
      </h2>
      <p>Repeat the sequence in order. One wrong tap ends your run.</p>
      <div className="echo-grid">
        {pads.map((label, i) => (
          <button
            key={label}
            disabled={phase === "watch"}
            className={`echo-pad pad-${i} ${lit === i ? "is-lit" : ""}`}
            onClick={() => press(i)}
          >
            <span aria-hidden="true">{symbols[i]}</span>
            {label}
            {lit === i && <small>NOW</small>}
          </button>
        ))}
      </div>
    </div>
  );
}
