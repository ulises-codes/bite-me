type SnakePositionProps = {
  snakeSize?: number;
  canvasWidth: number;
  canvasHeight: number;
};

export default function initSnakePosition({
  snakeSize = 20,
  canvasWidth,
  canvasHeight,
}: SnakePositionProps) {
  const startX =
    Math.floor((Math.random() / 2) * (canvasWidth / snakeSize)) * snakeSize;

  const startY =
    Math.floor((Math.random() / 2) * (canvasHeight / snakeSize)) * snakeSize;

  return [
    [startX, startY],
    [startX - snakeSize, startY],
  ];
}
