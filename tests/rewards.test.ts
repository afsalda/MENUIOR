import assert from "node:assert/strict";
import test from "node:test";
import { memoryScore, normaliseScores, totalScore } from "../src/lib/rewards";

test("reward scores are bounded to eight game bests", () => {
  const scores = normaliseScores({
    catch: 80,
    memory: -5,
    pour: 22.9,
    quiz: "50",
  });
  assert.deepEqual(scores, {
    catch: 50,
    memory: 0,
    pour: 22,
    quiz: 0,
    cinema: 0,
    swap: 0,
    coffee: 0,
    echo: 0,
  });
  assert.equal(totalScore(scores), 72);
});

test("memory rewards accurate matches without exceeding 50", () => {
  assert.equal(memoryScore(6), 50);
  assert.equal(memoryScore(20), 10);
});
