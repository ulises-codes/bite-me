import * as t from '../types/bite-me';

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
