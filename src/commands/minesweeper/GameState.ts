import { WIDTH, HEIGHT, MINES, MINE, NUMBERS } from './constants';
import { range, randomSquare, neighbours } from './utils';
import { max } from 'lodash';

export interface GameState {
  board: string[][];
  revealed: boolean[][];
  flagged: boolean[][];
  cursorX: number;
  cursorY: number;
  gameOver: boolean;
  completed: boolean;
  firstTileRevealed: boolean;
}

export enum Direction {
  Up,
  Down,
  Left,
  Right,
}

export const createGameState = (): GameState => {
  const board: string[][] = [];
  const revealed: boolean[][] = [];
  const flagged: boolean[][] = [];

  range(0, WIDTH).forEach((x) => {
    board.push([]);
    revealed.push([]);
    flagged.push([]);
    range(0, HEIGHT).forEach((y) => {
      board[x][y] = '';
      revealed[x][y] = false;
    });
  });

  let mineCount = 0;
  while (mineCount < MINES) {
    const [x, y] = randomSquare();
    if (board[x][y] === '') {
      board[x][y] = MINE;
      mineCount += 1;
    }
  }

  range(0, WIDTH).forEach((x) => {
    range(0, HEIGHT).forEach((y) => {
      if (board[x][y] === MINE) {
        return;
      }

      const adjacentSquares = neighbours(x, y);
      const adjacentMines = adjacentSquares.filter(
        ([x, y]) => board[x][y] === MINE
      ).length;
      board[x][y] = NUMBERS[adjacentMines];
    });
  });

  return {
    board,
    revealed,
    flagged,
    cursorX: 0,
    cursorY: 0,
    gameOver: false,
    completed: false,
    firstTileRevealed: false,
  };
};

const placeNumbers = (state: GameState): GameState => {
  const newState = { ...state };

  range(0, WIDTH).forEach((x) => {
    range(0, HEIGHT).forEach((y) => {
      if (state.board[x][y] === MINE) {
        return;
      }

      const adjacentSquares = neighbours(x, y);
      const adjacentMines = adjacentSquares.filter(
        ([x, y]) => state.board[x][y] === MINE
      ).length;
      newState.board[x][y] = NUMBERS[adjacentMines];
    });
  });

  return newState;
};

export const move = (state: GameState, direction: Direction): GameState => {
  const newState = { ...state };

  if (direction === Direction.Up) {
    const nextPos = range(state.cursorY, -1).find(
      (j) => j !== state.cursorY && !state.revealed[state.cursorX][j]
    );
    newState.cursorY = nextPos !== undefined ? nextPos : state.cursorY - 1;
  }
  if (direction === Direction.Down) {
    const nextPos = range(state.cursorY, HEIGHT).find(
      (j) => j !== state.cursorY && !state.revealed[state.cursorX][j]
    );
    newState.cursorY = nextPos !== undefined ? nextPos : state.cursorY + 1;
  }
  if (direction === Direction.Left) {
    const nextPos = range(state.cursorX, 0).find(
      (i) => i !== state.cursorX && !state.revealed[i][state.cursorY]
    );
    newState.cursorX = nextPos !== undefined ? nextPos : state.cursorX - 1;
  }
  if (direction === Direction.Right) {
    const nextPos = range(state.cursorX, WIDTH).find(
      (i) => i !== state.cursorX && !state.revealed[i][state.cursorY]
    );
    newState.cursorX = nextPos !== undefined ? nextPos : state.cursorX + 1;
  }

  if (newState.cursorX < 0) {
    newState.cursorX = WIDTH - 1;
  }
  if (newState.cursorX >= WIDTH) {
    newState.cursorX = 0;
  }
  if (newState.cursorY < 0) {
    newState.cursorY = HEIGHT - 1;
  }
  if (newState.cursorY >= HEIGHT) {
    newState.cursorY = 0;
  }

  return newState;
};

export const revealSquare = (
  state: GameState,
  x: number,
  y: number
): GameState => {
  let newState = { ...state };

  const value = state.board[x][y];
  newState.revealed[x][y] = true;
  newState.firstTileRevealed = true;

  if (value === MINE) {
    if (!state.firstTileRevealed) {
      let minePlaced = false;
      let newX = 0;
      let newY = 0;
      while (!minePlaced) {
        if (state.board[newX][newY] !== MINE) {
          newState.board[newX][newY] = MINE;
          minePlaced = true;
        }
        newX += 1;
        if (newX >= WIDTH) {
          newX = 0;
          newY += 1;
        }
      }

      newState.board[x][y] = NUMBERS[0];

      return placeNumbers(newState);
    }

    range(0, WIDTH).forEach((x) => {
      range(0, HEIGHT).forEach((y) => {
        if (state.board[x][y] === MINE) {
          newState.revealed[x][y] = true;
        }
      });
    });
    newState.cursorX = -1;
    newState.cursorY = -1;
    newState.gameOver = true;
  }

  if (value === NUMBERS[0]) {
    newState = neighbours(x, y)
      .filter(([i, j]) => !state.revealed[i][j])
      .reduce(
        (updatedState, [i, j]) => revealSquare(updatedState, i, j),
        newState
      );
  }

  return newState;
};

export const flagSquare = (
  state: GameState,
  x: number,
  y: number
): GameState => {
  const newState = { ...state };

  const isFlagged = state.flagged[x][y];

  if (isFlagged) {
    newState.flagged[x][y] = false;
    return newState;
  }

  newState.flagged[x][y] = true;

  let allFlagged = true;
  range(0, WIDTH).forEach((i) => {
    range(0, HEIGHT).forEach((j) => {
      if (state.board[i][j] === MINE && !state.flagged[i][j]) {
        allFlagged = false;
      }
      if (state.board[i][j] !== MINE && state.flagged[i][j]) {
        allFlagged = false;
      }
    });
  });

  if (allFlagged) {
    newState.completed = true;
  }

  return newState;
};
