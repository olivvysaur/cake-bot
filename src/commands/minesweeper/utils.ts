import { WIDTH, HEIGHT } from './constants';

export const randomSquare = () => {
  const x = Math.floor(Math.random() * WIDTH);
  const y = Math.floor(Math.random() * HEIGHT);

  return [x, y];
};

export const range = (from: number, to: number) => {
  const result = [];
  if (from < to) {
    for (let i = from; i < to; i++) {
      result.push(i);
    }
  } else {
    for (let i = from; i > to; i--) {
      result.push(i);
    }
  }
  return result;
};

export const neighbours = (x: number, y: number) => {
  const neighbours: number[][] = [];

  for (let i = x - 1; i <= x + 1; i++) {
    for (let j = y - 1; j <= y + 1; j++) {
      if (i >= 0 && i < WIDTH && j >= 0 && j < HEIGHT) {
        if (i !== x || j !== y) {
          neighbours.push([i, j]);
        }
      }
    }
  }

  return neighbours;
};
