/// <reference path="../types/SnakeTypes.d.ts" />
import * as t from 'bite-me';

export default function initFoodPosition({
  snakeSize,
  canvasHeight,
  canvasWidth,
  foodSize,
}: t.InitFoodPositionProps) {
  const size = snakeSize;

  const startX =
    Math.floor(
      Math.random() * (canvasWidth / size - foodSize / (foodSize - size))
    ) * size;

  const startY =
    Math.floor(
      Math.random() * (canvasHeight / size - foodSize / (foodSize - size))
    ) * size;

  return [startX, startY];
}
