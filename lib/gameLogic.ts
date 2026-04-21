export type BoardCell = "X" | "O" | null;

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],             // diagonals
] as const;

export function checkWinner(board: BoardCell[]): { winner: "X" | "O" | null; line: number[] } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as "X" | "O", line: [...line] };
    }
  }
  return { winner: null, line: [] };
}

export function isDraw(board: BoardCell[]): boolean {
  return board.every(cell => cell !== null) && checkWinner(board).winner === null;
}
