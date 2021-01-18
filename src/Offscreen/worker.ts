/// <reference path="./index.d.ts" />

import * as Comlink from 'comlink';
import { initFoodPosition } from './helper';

export class Snake {
  backgroundColor: string;
  canvasHeight: number;
  canvasWidth: number;
  ctx: OffscreenCanvasRenderingContext2D | null;
  foodColor: string;
  foodImg?: ImageBitmap;
  foodImgSrc: string;
  foodSize: number;
  gameOverColor: string;
  keyPressed: string[];
  snakeFill: string;
  snakeColor: string | string[];
  snakeSize: number;
  textColor: string;
  titleColor: string;
  subtitleColor: string;
  timerId?: number;

  constructor(canvas: OffscreenCanvas, props: SnakeProps) {
    this.backgroundColor = props.canvas.backgroundColor;
    this.canvasHeight = props.canvas.height;
    this.canvasWidth = props.canvas.width;
    this.ctx = canvas.getContext('2d');
    this.gameOverColor = props.text.gameOverColor ?? '#F26463';
    this.foodColor = props.food.color;
    this.foodImgSrc = props.food.imgSrc;
    this.foodSize = props.food.size;
    this.keyPressed = [];
    this.snakeColor = props.snake.color ?? '#2a2a2a';
    this.snakeFill = props.snake.snakeFill;
    this.snakeSize = props.snake.snakeSize;
    this.textColor = props.text.color ?? '#2a2a2a';
    this.titleColor = props.text.titleColor ?? '#2a2a2a';
    this.subtitleColor = props.text.subtitleColor ?? '#2a2a2a';
  }

  clearCanvas() {
    this.ctx?.clearRect(0, 0, this.canvasHeight, this.canvasWidth);
  }

  drawText = (text: string, y: number, color?: string, font?: string) => {
    const context = this.ctx;

    if (!context) return;

    context.beginPath();

    if (color) context.fillStyle = color;
    if (font) context.font = font;

    const textSize = context.measureText(text).width;

    context.fillText(text, this.canvasWidth / 2 - Math.round(textSize / 2), y);
  };

  drawTitlePage(coordinates: GameState['coordinates']) {
    const context = this.ctx;
    if (!context) return;

    this.clearCanvas();

    const verticalCenter = this.canvasHeight / 2;

    this.initFood([10, 20]);
    this.initFood([this.canvasWidth - this.foodSize - 10, 20]);

    this.drawSnake({ currentCoordinates: coordinates });

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

    context.fillStyle = this.textColor;

    context.font = '40px courier';
    this.drawText('HOW TO PLAY', 45);

    context.fillStyle = '#2a2a2a';

    context.font = '16px courier';

    this.drawText('Use the arrows on your', 95);
    this.drawText('keypad or swipe to move', 110);
    this.drawText('the snake along.', 125);

    this.drawText('Eat the food—a picture of my', 150);
    this.drawText('head that my wife hates–', 165);
    this.drawText('without crashing into the', 180);
    this.drawText('walls or yourself!', 195);

    context.fillStyle = this.textColor;

    this.drawText('Key combinations: ', 225);

    context.fillStyle = '#2a2a2a';
    this.drawText('start: SPACE', 240);
    this.drawText('quit: q', 255);
    this.drawText('mute: m', 270);
    this.drawText('Volume Down, Up: 2, 1', 285);
  }

  drawSnake({ currentCoordinates, newCoordinates }: DrawSnake) {
    const context = this.ctx;

    let coordinates;

    if (newCoordinates) {
      coordinates = newCoordinates;
    } else {
      coordinates = currentCoordinates;
    }

    if (!context) return;

    const size = this.snakeSize;

    context.strokeStyle = this.backgroundColor;
    context.lineWidth = 2;

    const color = this.snakeColor;

    coordinates.forEach(([x, y], i) => {
      if (typeof color === 'string') {
        context.fillStyle = this.snakeFill;
      } else {
        context.fillStyle = color[i % color.length];
      }

      context.fillRect(x, y, size, size);
      context.strokeRect(x, y, size, size);
    });
  }

  drawFood([x, y]: GameState['foodPosition']) {
    const padding = 4;

    const width = this.foodSize - padding;
    const height = this.foodSize - padding;

    const context = this.ctx;

    if (!context || !this.foodImg) return;

    context.drawImage(
      this.foodImg,
      x + padding / 2,
      y + padding / 2,
      width,
      height
    );

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.fillStyle = this.foodColor;
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

    this.stopTimer();
  }

  clearPrevPosition(x: number, y: number) {
    if (!this.ctx) return;

    this.ctx.clearRect(x, y, this.snakeSize, this.snakeSize);
  }

  clearFood(coordinates: GameState['coordinates']) {
    const size = this.snakeSize;
    const context = this.ctx;

    if (!context) return;

    for (let i = 0; i < this.canvasWidth; i += size) {
      for (let j = 0; j < this.canvasHeight; j += size) {
        if (coordinates.some(([x, y]) => x === i && y === j)) {
          continue;
        }
        context.clearRect(i, j, size, size);
      }
    }
  }

  eatFood(coordinates: GameState['coordinates']) {
    this.clearFood(coordinates);

    const getNewFoodPosition = () =>
      initFoodPosition({
        foodSize: this.foodSize,
        snakeSize: this.snakeSize,
        canvasWidth: this.canvasHeight,
        canvasHeight: this.canvasHeight,
      });

    let [newX, newY] = getNewFoodPosition();

    const checkPosition = () => {
      const columns = Math.floor(this.foodSize / this.snakeSize);
      const newCoordinates = [];

      for (let x = 0; x < columns; x++) {
        for (let y = 0; y < columns; y++) {
          if (x === 0 && y === 0) {
            newCoordinates.push([newX, newY]);
            continue;
          }
          newCoordinates.push([
            newX + x * (this.foodSize / columns),
            newY + y * (this.foodSize / columns),
          ]);
        }
      }

      if (
        !newCoordinates.every(
          ([x, y]) => !coordinates.some(([a, b]) => x === a && y === b)
        )
      ) {
        return true;
      }

      return false;
    };

    while (checkPosition()) {
      [newX, newY] = getNewFoodPosition();
    }

    this.drawFood([newX, newY]);

    return [newX, newY];
  }

  async initGame(snakeCoordinates: GameState['coordinates']) {
    const blob = await fetch(this.foodImgSrc).then(res => res.blob());
    this.foodImg = await createImageBitmap(blob);

    this.drawTitlePage(snakeCoordinates);
  }

  async initFood(foodPosition: GameState['foodPosition']) {
    // If new game, get position from state; otherwise, create new position
    const [x, y] = foodPosition;
    this.drawFood([x, y]);
  }

  startTimer(cb: StartTimerProps['cb'], interval: number) {
    this.timerId = setInterval(cb, interval);
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }
}

Comlink.expose(Snake);
