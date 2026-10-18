export const side = 6;
export function adjacent(a: number, b: number) {
  return (
    Math.abs(Math.floor(a / side) - Math.floor(b / side)) +
      Math.abs((a % side) - (b % side)) ===
    1
  );
}
export function matches(board: number[]): number[] {
  const found = new Set<number>();
  for (let i = 0; i < 36; i++)
    for (const step of [1, side]) {
      const run = [i];
      for (
        let j = i + step;
        j < 36 &&
        (step === side || Math.floor(j / side) === Math.floor(i / side)) &&
        board[j] === board[i];
        j += step
      )
        run.push(j);
      if (run.length >= 3) run.forEach((n) => found.add(n));
    }
  return [...found];
}
export function swap(board: number[], a: number, b: number) {
  const next = [...board];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
export function legalMove(board: number[]) {
  for (let a = 0; a < 36; a++)
    for (const b of [a + 1, a + side])
      if (b < 36 && adjacent(a, b) && matches(swap(board, a, b)).length)
        return [a, b];
  return null;
}
export function newBoard(): number[] {
  const board: number[] = [];
  for (let i = 0; i < 36; i++) {
    const allowed = [0, 1, 2, 3, 4].filter(
      (v) =>
        !(i % 6 >= 2 && board[i - 1] === v && board[i - 2] === v) &&
        !(i >= 12 && board[i - 6] === v && board[i - 12] === v),
    );
    board.push(allowed[Math.floor(Math.random() * allowed.length)]);
  }
  // This corner guarantees a legal swap without creating an initial match.
  if (!legalMove(board))
    return Array.from(
      { length: 36 },
      (_, i) =>
        [
          0, 1, 0, 2, 3, 4, 2, 0, 3, 4, 1, 2, 1, 2, 4, 0, 2, 3, 3, 4, 1, 2, 3,
          0, 4, 0, 2, 3, 4, 1, 0, 1, 3, 4, 0, 2,
        ][i],
    );
  return board;
}
export function collapse(board: number[], removed: number[]) {
  const next = [...board];
  for (let col = 0; col < side; col++) {
    const kept = board.filter(
      (_, i) => i % side === col && !removed.includes(i),
    );
    while (kept.length < side) kept.unshift(Math.floor(Math.random() * 5));
    kept.forEach((v, row) => {
      next[row * side + col] = v;
    });
  }
  return next;
}
