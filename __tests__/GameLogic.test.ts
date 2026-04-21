import { checkWinner, isDraw, type BoardCell } from '../lib/gameLogic';

const X = 'X' as BoardCell;
const O = 'O' as BoardCell;
const _ = null as BoardCell;

// ── checkWinner: all 8 winning lines for X ──────────────────

describe('checkWinner — X wins', () => {
  test('X wins row 0 (top)', () => {
    const board = [X, X, X, _, _, _, _, _, _];
    const result = checkWinner(board);
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([0, 1, 2]);
  });

  test('X wins row 1 (middle)', () => {
    const board = [_, _, _, X, X, X, _, _, _];
    const result = checkWinner(board);
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([3, 4, 5]);
  });

  test('X wins row 2 (bottom)', () => {
    const board = [_, _, _, _, _, _, X, X, X];
    const result = checkWinner(board);
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([6, 7, 8]);
  });

  test('X wins column 0 (left)', () => {
    const board = [X, _, _, X, _, _, X, _, _];
    const result = checkWinner(board);
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([0, 3, 6]);
  });

  test('X wins column 1 (middle)', () => {
    const board = [_, X, _, _, X, _, _, X, _];
    const result = checkWinner(board);
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([1, 4, 7]);
  });

  test('X wins column 2 (right)', () => {
    const board = [_, _, X, _, _, X, _, _, X];
    const result = checkWinner(board);
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([2, 5, 8]);
  });

  test('X wins diagonal top-left to bottom-right', () => {
    const board = [X, _, _, _, X, _, _, _, X];
    const result = checkWinner(board);
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([0, 4, 8]);
  });

  test('X wins diagonal top-right to bottom-left', () => {
    const board = [_, _, X, _, X, _, X, _, _];
    const result = checkWinner(board);
    expect(result.winner).toBe('X');
    expect(result.line).toEqual([2, 4, 6]);
  });
});

// ── checkWinner: all 8 winning lines for O ──────────────────

describe('checkWinner — O wins', () => {
  test('O wins row 0', () => {
    expect(checkWinner([O, O, O, _, _, _, _, _, _]).winner).toBe('O');
  });

  test('O wins row 1', () => {
    expect(checkWinner([_, _, _, O, O, O, _, _, _]).winner).toBe('O');
  });

  test('O wins row 2', () => {
    expect(checkWinner([_, _, _, _, _, _, O, O, O]).winner).toBe('O');
  });

  test('O wins column 0', () => {
    expect(checkWinner([O, _, _, O, _, _, O, _, _]).winner).toBe('O');
  });

  test('O wins column 1', () => {
    expect(checkWinner([_, O, _, _, O, _, _, O, _]).winner).toBe('O');
  });

  test('O wins column 2', () => {
    expect(checkWinner([_, _, O, _, _, O, _, _, O]).winner).toBe('O');
  });

  test('O wins diagonal top-left to bottom-right', () => {
    expect(checkWinner([O, _, _, _, O, _, _, _, O]).winner).toBe('O');
  });

  test('O wins diagonal top-right to bottom-left', () => {
    expect(checkWinner([_, _, O, _, O, _, O, _, _]).winner).toBe('O');
  });
});

// ── checkWinner: no winner cases ────────────────────────────

describe('checkWinner — no winner', () => {
  test('empty board returns null winner and empty line', () => {
    const result = checkWinner(Array(9).fill(null));
    expect(result.winner).toBeNull();
    expect(result.line).toEqual([]);
  });

  test('partial board with no winner returns null', () => {
    const board = [X, _, O, _, X, _, _, _, O];
    expect(checkWinner(board).winner).toBeNull();
  });

  test('nearly-full board with no three in a row returns null', () => {
    // X O X / O X O / O X _  — no winner
    const board = [X, O, X, O, X, O, O, X, _];
    expect(checkWinner(board).winner).toBeNull();
  });

  test('winning line is correctly returned alongside the winner', () => {
    const board = [O, _, _, _, O, _, _, _, O];
    const result = checkWinner(board);
    expect(result.winner).toBe('O');
    expect(result.line).toContain(0);
    expect(result.line).toContain(4);
    expect(result.line).toContain(8);
  });
});

// ── isDraw ───────────────────────────────────────────────────

describe('isDraw', () => {
  test('full board with no winner is a draw', () => {
    // X O X / O X O / O X O — draw
    const board = [X, O, X, O, X, O, O, X, O];
    expect(isDraw(board)).toBe(true);
  });

  test('full board where X wins is NOT a draw', () => {
    const board = [X, X, X, O, O, _, _, _, _];
    expect(isDraw(board)).toBe(false);
  });

  test('full board where O wins is NOT a draw', () => {
    const board = [O, O, O, X, X, _, _, _, _];
    expect(isDraw(board)).toBe(false);
  });

  test('empty board is not a draw', () => {
    expect(isDraw(Array(9).fill(null))).toBe(false);
  });

  test('partially filled board is not a draw', () => {
    expect(isDraw([X, O, _, _, _, _, _, _, _])).toBe(false);
  });
});
