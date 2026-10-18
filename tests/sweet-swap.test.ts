import test from "node:test";
import assert from "node:assert/strict";
import { adjacent, matches, newBoard, legalMove, swap, collapse } from "../src/lib/sweet-swap";
test("new boards have no existing matches and always offer a move",()=>{
  for(let n=0;n<200;n++) {
    const board=newBoard(); assert.equal(board.length,36); assert.deepEqual(matches(board),[]);
    const move=legalMove(board); assert.ok(move); assert.ok(adjacent(...move as [number,number]));
    assert.ok(matches(swap(board,move[0],move[1])).length>=3);
  }
});
test("adjacency cannot wrap across rows",()=>{assert.equal(adjacent(5,6),false);assert.equal(adjacent(0,6),true);assert.equal(adjacent(0,7),false);});
test("matches cross correctly and collapse preserves remaining column order",()=>{
  const board=Array.from({length:36},(_,i)=>i);board[0]=board[1]=board[2]=board[6]=board[12]=99;
  const found=matches(board);assert.deepEqual(new Set(found),new Set([0,1,2,6,12]));
  const next=collapse(board,found);assert.equal(next.length,36);assert.deepEqual([next[18],next[24],next[30]],[18,24,30]);
});
