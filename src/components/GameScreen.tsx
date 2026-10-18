import { useCallback, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Catch, Memory, Pour, Quiz, readScores, storageKey } from "./Games";
import { Cinema, Coffee, Echo, SweetSwap } from "./NewGames";
import { clampScore, type GameId } from "../lib/rewards";
import "./GameScreen.css";

const components = {
  catch: Catch,
  memory: Memory,
  pour: Pour,
  quiz: Quiz,
  cinema: Cinema,
  swap: SweetSwap,
  coffee: Coffee,
  echo: Echo,
};
const rules: Record<GameId, string> = {
  catch: "Catch ten glowing leaves in 20 seconds. Each catch earns 5 points.",
  memory: "Find six matching pairs. Fewer turns earn more points.",
  pour: "Stop five pours in the centre band. Perfect timing earns 10 points per pour.",
  quiz: "Answer five menu questions. Each correct answer earns 10 points.",
  cinema:
    "Five questions from Malayalam cinema. Each correct answer earns 10 points. Take your time.",
  swap: "Tap neighbouring treats to swap. Match three or more in a row or column. Clear 50 treats in 15 moves for a perfect score. Invalid swaps cost nothing.",
  coffee:
    "Build five coffees using the recipe shown. Add ingredients in order, then serve. Each order starts at 10 points; wrong ingredients cost 2 points.",
  echo: "Watch the glowing symbols, then repeat their sequence. Each round adds one symbol. Complete five rounds for 50 points.",
};
export default function GameScreen({
  game,
}: {
  game: { id: GameId; title: string; icon: string };
}) {
  const [started, setStarted] = useState(false),
    [attempt, setAttempt] = useState(0),
    [result, setResult] = useState<number | null>(null),
    [best, setBest] = useState(() => readScores()[game.id]),
    [saved, setSaved] = useState(true);
  const finish = useCallback(
    (points: number) => {
      const score = clampScore(points),
        scores = readScores();
      scores[game.id] = Math.max(scores[game.id], score);
      setBest(scores[game.id]);
      setResult(score);
      try {
        localStorage.setItem(storageKey, JSON.stringify(scores));
      } catch {
        setSaved(false);
      }
    },
    [game.id],
  );
  const reset = () => {
    setStarted(false);
    setResult(null);
    setAttempt((a) => a + 1);
  };
  const Active = components[game.id];
  return (
    <main className={`game-screen game-${game.id}`}>
      <header className="play-header">
        <a href="/?games=1">
          <ArrowLeft size={18} /> Arcade
        </a>
        <span>menuoir.</span>
        <button onClick={reset}>
          <RotateCcw size={17} /> Restart
        </button>
      </header>
      <div className="play-shell">
        <div className="play-title">
          <span>BEST {best} / 50</span>
          <h1>{game.title}</h1>
        </div>
        {!started ? (
          <div className="play-welcome">
            <span className="play-emblem" aria-hidden="true">
              {game.icon}
            </span>
            <h2>Ready to play?</h2>
            <p>{rules[game.id]}</p>
            <button className="game-primary" onClick={() => setStarted(true)}>
              Start game
            </button>
          </div>
        ) : result !== null ? (
          <div className="game-result" role="status">
            <span className="result-points">
              {result}
              <small> / 50</small>
            </span>
            <h2>{result >= 40 ? "Lovely run!" : "Well played!"}</h2>
            <p>
              Your best score is {best}.{" "}
              {saved
                ? "Saved to your garden total."
                : "Browser storage is unavailable; this score could not be saved."}
            </p>
            <button className="game-primary" onClick={reset}>
              Play again
            </button>
            <a className="return-arcade" href="/?games=1">
              Back to games & rewards →
            </a>
          </div>
        ) : (
          <Active key={attempt} onFinish={finish} />
        )}
      </div>
    </main>
  );
}
