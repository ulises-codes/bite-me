import { expose } from 'comlink';

import type {
  CanvasWorkerConstructor,
  CanvasWorkerInterface,
  CanvasWorkerProps,
  FoodPosition,
  SnakeCoordinates,
} from '../types';

export const SnakeWorker: CanvasWorkerConstructor = class SnakeWorker
  implements CanvasWorkerInterface {
  advanceSnake: () => Promise<void>;
  canvasHeight: number;
  canvasWidth: number;
  ctx: OffscreenCanvasRenderingContext2D | null;
  foodColor: string;
  foodImg?: ImageBitmap;
  foodImgSrc?: string;
  foodPadding: number;
  foodSize: number;
  gameOverColor: string;
  keyPressed: string[];
  snakeColor: string | string[];
  snakeSize: number;
  textColor: string;
  titleColor: string;
  subtitleColor: string;

  timerId?: number;
  timeoutId?: number;

  constructor(
    canvas: OffscreenCanvas,
    advanceSnake: () => Promise<void>,
    props: CanvasWorkerProps
  ) {
    this.advanceSnake = advanceSnake;

    this.canvasHeight = props.canvas.height;
    this.canvasWidth = props.canvas.width;
    this.ctx = canvas.getContext('2d');
    this.gameOverColor = props.text.gameOverColor ?? '#F26463';
    this.foodColor = props.food.color ?? '#2a2a2a';
    this.foodImgSrc = props.food.imgSrc;
    this.foodPadding = 4;
    this.foodSize = props.food.size;
    this.keyPressed = [];
    this.snakeColor = props.snake.color ?? '#2a2a2a';
    this.snakeSize = props.snake.snakeSize;
    this.textColor = props.text.color ?? '#2a2a2a';
    this.titleColor = props.text.titleColor ?? '#2a2a2a';
    this.subtitleColor = props.text.subtitleColor ?? '#2a2a2a';
  }

  clearCanvas() {
    this.ctx?.clearRect(0, 0, this.canvasHeight, this.canvasWidth);
  }

  drawText(
    text: string,
    y: number,
    color: string = this.textColor,
    font: string = '12px courier'
  ) {
    const context = this.ctx;

    if (!context) return;

    context.beginPath();

    context.fillStyle = color;

    context.font = font;

    const textSize = context.measureText(text).width;

    context.fillText(text, this.canvasWidth / 2 - Math.round(textSize / 2), y);
  }

  drawTitlePage(coordinates: SnakeCoordinates) {
    const context = this.ctx;
    if (!context) return;

    this.clearCanvas();

    const verticalCenter = this.canvasHeight / 2;

    this.initFood([10, 20]);
    this.initFood([this.canvasWidth - this.foodSize - 10, 20]);

    this.drawSnake(coordinates);

    // Draw title
    this.drawText('BITE ME', 55, this.titleColor, '40px courier');

    // Draw subtitle
    this.drawText('A snake game', 95, this.subtitleColor, '16px courier');

    this.drawText(
      'Press SPACE or Tap to Begin',
      verticalCenter,
      this.titleColor,
      '14px courier'
    );

    this.drawText(
      'Press h or tap with two',
      verticalCenter + 30,
      this.subtitleColor,
      '12px courier'
    );

    this.drawText(
      'fingers for help',
      verticalCenter + 45,
      this.subtitleColor,
      '12px courier'
    );
  }

  drawInstructionsPage() {
    this.clearCanvas();

    const context = this.ctx;

    if (!context) return;

    this.drawText('HOW TO PLAY', 45, undefined, '40px courier');

    this.drawText('Use the arrows on your', 75);
    this.drawText('keypad or swipe to move', 90);
    this.drawText('the snake along.', 105);

    this.drawText('Eat the food—a picture of my', 130);
    this.drawText('head that my wife hates–', 145);
    this.drawText('without crashing into the', 160);
    this.drawText('walls or yourself!', 175);

    this.drawText(
      'Key Combinations: ',
      225,
      this.subtitleColor,
      '14px courier'
    );

    this.drawText('start: SPACE', 240);
    this.drawText('quit: q', 255);
    this.drawText('mute: m', 270);
    this.drawText('Volume Down, Up: 2, 1', 285);
  }

  drawSnake(coordinates: SnakeCoordinates) {
    const context = this.ctx;

    if (!context) return;

    const color = this.snakeColor;

    coordinates.forEach(([x, y], i) => {
      if (typeof color === 'string') {
        context.fillStyle = color;
      } else {
        context.fillStyle = color[i % color.length];
      }

      context.fillRect(x, y, this.snakeSize, this.snakeSize);
      context.strokeStyle = 'transparent';

      context.lineWidth = 0.01;
      context.strokeRect(x, y, 0, 0);
    });
  }

  drawFood([x, y]: FoodPosition) {
    const padding = this.foodPadding;

    const context = this.ctx;

    if (!context) return;

    if (!this.foodImg) {
      const radius = this.foodSize / 2;
      context.beginPath();
      context.ellipse(
        x + radius,
        y + radius,
        radius - padding * 2,
        radius - padding * 2,
        0,
        0,
        2 * Math.PI
      );
      context.fill();
    } else {
      const foodSize = this.foodSize - padding;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      context.drawImage(
        this.foodImg,
        x + padding / 2,
        y + padding / 2,
        foodSize,
        foodSize
      );
    }
  }

  drawGameOver(score: number, cb: () => void) {
    const context = this.ctx;
    if (!context) return;

    this.clearCanvas();

    const verticalCenter = this.canvasHeight / 2;

    context.fillStyle = this.gameOverColor;
    this.drawText(
      'GAME OVER',
      verticalCenter - 10,
      this.gameOverColor,
      '40px courier'
    );

    this.drawText(
      `Score: ${score}`,
      verticalCenter + 20,
      this.subtitleColor,
      '14px courier'
    );

    this.drawText(
      'Press SPACE or Tap to Begin',
      verticalCenter + 60,
      this.titleColor,
      '14px courier'
    );

    cb();
  }

  clearPrevPosition(x: number, y: number) {
    if (!this.ctx) return;

    this.ctx.clearRect(x, y, this.snakeSize, this.snakeSize);
  }

  clearFood(coordinates: SnakeCoordinates) {
    const context = this.ctx;

    if (!context) return;

    const size = this.snakeSize;

    for (let i = 0; i < this.canvasWidth; i += size) {
      for (let j = 0; j < this.canvasHeight; j += size) {
        if (coordinates.some(([x, y]) => x === i && y === j)) {
          continue;
        }

        context.clearRect(i, j, size, size);
      }
    }
  }

  async initGame(snakeCoordinates: SnakeCoordinates) {
    if (this.foodImgSrc) {
      const blob = await fetch(this.foodImgSrc).then((res) => res.blob());
      this.foodImg = await createImageBitmap(blob);
    }

    this.drawTitlePage(snakeCoordinates);
  }

  initFood(foodPosition: FoodPosition) {
    // If new game, get position from state; otherwise, create new position
    const [x, y] = foodPosition;
    this.drawFood([x, y]);
  }
};

expose(SnakeWorker);
