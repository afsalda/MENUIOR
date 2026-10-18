export type GameId =
  "catch" | "memory" | "pour" | "quiz" | "cinema" | "swap" | "coffee" | "echo";
export type Scores = Record<GameId, number>;

export const emptyScores: Scores = {
  catch: 0,
  memory: 0,
  pour: 0,
  quiz: 0,
  cinema: 0,
  swap: 0,
  coffee: 0,
  echo: 0,
};
export const offers = [
  {
    id: "drink",
    score: 100,
    title: "Free drink",
    detail: "A demo reward to confirm with café staff.",
  },
  {
    id: "bogo",
    score: 160,
    title: "Buy one, get one",
    detail: "A demo reward to confirm with café staff.",
  },
] as const;

export function clampScore(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(50, Math.floor(value)))
    : 0;
}

export function normaliseScores(value: unknown): Scores {
  if (!value || typeof value !== "object") return { ...emptyScores };
  const saved = value as Record<string, unknown>;
  return {
    catch: clampScore(saved.catch),
    memory: clampScore(saved.memory),
    pour: clampScore(saved.pour),
    quiz: clampScore(saved.quiz),
    cinema: clampScore(saved.cinema),
    swap: clampScore(saved.swap),
    coffee: clampScore(saved.coffee),
    echo: clampScore(saved.echo),
  };
}

export function totalScore(scores: Scores): number {
  return Object.values(scores).reduce(
    (total, score) => total + clampScore(score),
    0,
  );
}

export function memoryScore(moves: number): number {
  return Math.max(10, Math.min(50, 50 - Math.max(0, moves - 6) * 5));
}
