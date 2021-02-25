import type { TouchEvent } from 'react';
import type { GameStatus, SnakeDirection } from '../types';

export const handleTouchStart = (
  e: TouchEvent<HTMLCanvasElement>,
  setTouch: (touches: number[]) => void
) => {
  e.preventDefault();
  e.stopPropagation();

  if (status === 'playing') {
    setTouch([e.touches[0].clientX, e.touches[0].clientY]);
  }
};

export const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
  e.preventDefault();
  e.stopPropagation();
};

export const handleTouchEnd = (
  e: TouchEvent<HTMLCanvasElement>,
  status: GameStatus,
  direction: SnakeDirection,
  reset: () => void,
  touch?: number[]
): SnakeDirection | void => {
  if (status !== 'playing') return reset();

  if (!touch) return;

  const diffX = e.changedTouches[0].clientX - touch[0];
  const diffY = e.changedTouches[0].clientY - touch[1];

  const diff =
    Math.abs(diffX) > Math.abs(diffY)
      ? diffX
      : Math.abs(diffY) > Math.abs(diffX)
      ? diffY
      : 0;

  if (diff === 0) return;

  if (diff === diffX && direction !== 'e' && direction !== 'w') {
    if (diffX < 0) return 'w';
    else return 'e';
  } else if (diff === diffY && direction !== 'n' && direction !== 's') {
    if (diffY < 0) return 'n';
    else return 's';
  }
};
