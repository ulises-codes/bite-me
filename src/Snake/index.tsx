import * as t from '../types/bite-me';

import * as React from 'react';

const DEFAULT_HEIGHT = 300;
const DEFAULT_WIDTH = 300;

export class SnakeGame extends React.Component<t.GameProps, t.GameState> {
  static defaultProps = {
    style: {
      backgroundColor: '#fafafa',
      foodColor: '#fafafa',
    },
    height: DEFAULT_HEIGHT,
    width: DEFAULT_WIDTH,
  };

  private initPosition() {
    const size = this.SNAKE_SIZE;

    const startX =
      Math.floor(Math.random() * (this.CANVAS_WIDTH / size)) * size;

    const startY =
      Math.floor(Math.random() * (this.CANVAS_HEIGHT / size)) * size;

    return [
      [startX, startY],
      [startX - size, startY],
    ];
  }

  private initFoodPosition() {
    const size = this.SNAKE_SIZE;

    const startX =
      Math.floor(
        Math.random() *
          (this.CANVAS_WIDTH / size - this.FOOD_SIZE / (this.FOOD_SIZE - size))
      ) * size;

    const startY =
      Math.floor(
        Math.random() *
          (this.CANVAS_HEIGHT / size - this.FOOD_SIZE / (this.FOOD_SIZE - size))
      ) * size;

    return [startX, startY];
  }

  SNAKE_SIZE = 20;
  FOOD_SIZE = 40;
  SNAKE_FILL =
    typeof this.props.snakeStyle?.color === 'string'
      ? this.props.snakeStyle.color
      : '#2a2a2a';

  CANVAS_WIDTH = this.props.width ?? DEFAULT_WIDTH;
  CANVAS_HEIGHT = this.props.height ?? DEFAULT_HEIGHT;

  timerId?: NodeJS.Timeout;
  keyPressed: string[] = [];
  foodImg?: HTMLImageElement;

  constructor(props: t.GameProps) {
    super(props);
    this.foodImg = this.props.food.src ? new Image() : undefined;

    this.state = {
      coordinates: this.initPosition(),
      direction: 'e',
      score: 0,
      foodPosition: this.initFoodPosition(),
      muted: false,
      status: 'title',
      step: this.SNAKE_SIZE,
      touch: undefined,
      volume: 0.5,
    };
    this.handleKeys = this.handleKeys.bind(this);
  }

  private canvas = React.createRef<HTMLCanvasElement>();

  private audioRef = React.createRef<HTMLAudioElement>();
  private dingRef = React.createRef<HTMLAudioElement>();

  private clearCanvas() {
    this.canvasContext().clearRect(0, 0, this.CANVAS_HEIGHT, this.CANVAS_WIDTH);
  }

  private canvasContext() {
    return this.canvas.current?.getContext('2d') as CanvasRenderingContext2D;
  }

  drawText = (text: string, y: number) => {
    const context = this.canvasContext();

    context.beginPath();
    const textSize = context.measureText(text).width;

    context.fillText(text, this.CANVAS_WIDTH / 2 - Math.round(textSize / 2), y);
  };

  drawInstructionsPage() {
    this.clearCanvas();
    const context = this.canvasContext();

    context.fillStyle = this.props.text?.color ?? '#2a2a2a';

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

    context.fillStyle = this.props.text?.color ?? '#2a2a2a';

    this.drawText('Key combinations: ', 225);

    context.fillStyle = '#2a2a2a';
    this.drawText('start: SPACE', 240);
    this.drawText('quit: q', 255);
    this.drawText('mute: m', 270);
    this.drawText('Volume Down, Up: 2, 1', 285);
  }

  drawTitlePage() {
    const context = this.canvasContext();

    context.fillStyle = this.props.text?.color ?? '#2a2a2a';

    const verticalCenter = this.CANVAS_HEIGHT / 2;

    context.font = '40px courier';
    this.drawText('BITE ME', verticalCenter - 10);

    context.fillStyle = '#2a2a2a';
    context.font = '16px courier';
    this.drawText('A snake game', verticalCenter + 20);

    context.fillStyle = this.props.text?.color ?? '#2a2a2a';

    this.drawText('Press SPACE or Tap', verticalCenter + 60);
    this.drawText('to Begin', verticalCenter + 85);

    context.fillStyle = '#2a2a2a';
    this.drawText('Press h or tap with two', verticalCenter + 120);
    this.drawText('fingers for help', verticalCenter + 135);
  }

  drawSnake(newCoordinates?: t.GameState['coordinates']) {
    const context = this.canvas.current?.getContext('2d');

    let coordinates;

    if (newCoordinates) {
      coordinates = newCoordinates;
    } else {
      coordinates = this.state.coordinates;
    }

    if (!context) return;

    const size = this.SNAKE_SIZE;

    context.strokeStyle = this.props.style?.backgroundColor ?? 'white';
    context.lineWidth = 2;

    const color = this.props.snakeStyle?.color;

    coordinates.forEach(([x, y], i) => {
      if (typeof color === 'string' || !color) {
        context.fillStyle = this.SNAKE_FILL;
      } else {
        context.fillStyle = color[i % color.length];
      }

      context.fillRect(x, y, size, size);
      context.strokeRect(x, y, size, size);
    });
  }

  advanceSnake() {
    const { coordinates, direction, step } = this.state;

    const canvasHeight = this.CANVAS_HEIGHT;
    const canvasWidth = this.CANVAS_WIDTH;

    const [lastX, lastY] = coordinates[coordinates.length - 1];
    const [firstX, firstY] = coordinates[0];

    const size = this.SNAKE_SIZE;

    this.canvasContext().clearRect(lastX, lastY, size, size);

    const [foodX, foodY] = this.state.foodPosition;

    // Game ends if user touches canvas edges
    if (
      firstX + step > canvasWidth ||
      firstX < 0 ||
      firstY + step > canvasHeight ||
      firstY < 0
    ) {
      return this.gameOver();
    }

    if (coordinates.slice(1).some(([x, y]) => x === firstX && y === firstY)) {
      return this.gameOver();
    }

    switch (direction) {
      case 'w':
      case 'e': {
        const vector = direction === 'e' ? 1 : -1;

        if (
          (firstX + step >= canvasWidth && direction === 'e') ||
          (firstX <= 0 && direction === 'w')
        ) {
          return this.gameOver();
        }

        if (
          firstX + step > foodX &&
          firstX < foodX + this.FOOD_SIZE &&
          firstY + step > foodY &&
          firstY < foodY + this.FOOD_SIZE
        ) {
          this.setState({
            coordinates: [
              [coordinates[0][0] + step * vector, coordinates[0][1]],
              ...coordinates,
            ],
          });
          this.drawSnake();

          return this.eatFood();
        }

        this.setState({
          coordinates: [
            [coordinates[0][0] + step * vector, coordinates[0][1]],
            ...coordinates.slice(0, coordinates.length - 1),
          ],
        });

        this.drawSnake();

        break;
      }
      case 'n':
      case 's': {
        const vector = direction === 's' ? 1 : -1;

        if (
          (firstY + step >= canvasHeight && direction === 's') ||
          (firstY - step < 0 && direction === 'n')
        )
          return this.gameOver();

        if (
          firstX + step > foodX &&
          firstX < foodX + this.FOOD_SIZE &&
          firstY + step > foodY &&
          firstY < foodY + this.FOOD_SIZE
        ) {
          this.setState({
            coordinates: [
              [coordinates[0][0], coordinates[0][1] + step * vector],
              ...coordinates,
            ],
          });
          this.drawSnake();

          return this.eatFood();
        }

        this.setState({
          coordinates: [
            [coordinates[0][0], coordinates[0][1] + step * vector],
            ...coordinates.slice(0, coordinates.length - 1),
          ],
        });

        this.drawSnake();

        break;
      }
    }
  }

  drawFood(x: number, y: number) {
    const padding = 4;

    const width = this.FOOD_SIZE - padding;
    const height = this.FOOD_SIZE - padding;

    const context = this.canvasContext();

    if (this.foodImg) {
      context.drawImage(
        this.foodImg,
        x + padding / 2,
        y + padding / 2,
        width,
        height
      );

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }
    context.fillStyle = this.props.food.color ?? 'red';
  }

  initFood() {
    // If new game, get position from state; otherwise, create new position
    const [x, y] = this.state.foodPosition;
    this.drawFood(x, y);
  }

  clearFood() {
    const size = this.SNAKE_SIZE;
    const { coordinates } = this.state;
    const context = this.canvasContext();

    for (let i = 0; i < this.CANVAS_WIDTH; i += size) {
      for (let j = 0; j < this.CANVAS_HEIGHT; j += size) {
        if (coordinates.some(([x, y]) => x === i && y === j)) {
          continue;
        }
        context.clearRect(i, j, size, size);
      }
    }
  }

  eatFood() {
    let [newX, newY] = this.initFoodPosition();

    if (this.dingRef.current && this.props.dingSrc) {
      this.dingRef.current.currentTime = 0;
      this.dingRef.current?.play().catch(() => null);
    }

    const foodSize = this.FOOD_SIZE;
    const snakeSize = this.SNAKE_SIZE;

    const columns = Math.floor(foodSize / snakeSize);

    // Ensure new food position does not overlap with snake
    const checkPosition = () => {
      const newCoordinates = [];

      for (let x = 0; x < columns; x++) {
        for (let y = 0; y < columns; y++) {
          if (x === 0 && y === 0) {
            newCoordinates.push([newX, newY]);
            continue;
          }
          newCoordinates.push([
            newX + x * (foodSize / columns),
            newY + y * (foodSize / columns),
          ]);
        }
      }

      if (
        !newCoordinates.every(
          ([x, y]) =>
            !this.state.coordinates.some(([a, b]) => x === a && y === b)
        )
      ) {
        return true;
      }

      return false;
    };

    while (checkPosition()) {
      [newX, newY] = this.initFoodPosition();
    }

    this.clearFood();

    this.drawFood(newX, newY);

    this.setState({
      foodPosition: [newX, newY],
      score: this.state.score + 1,
    });

    this.stopTimer();
    this.startTimer();
  }

  gameOver() {
    if (this.state.status !== 'playing') return;

    // Switch audio to game over sound
    if (this.audioRef.current && this.props.gameOverSrc) {
      this.audioRef.current.src = this.props.gameOverSrc;
      this.audioRef.current.play().catch(() => null);
    }

    const context = this.canvasContext();
    this.quit();

    this.clearCanvas();

    const verticalCenter = this.CANVAS_HEIGHT / 2;

    context.font = '40px courier';
    context.fillStyle = this.props.text?.gameOverColor ?? '#F26463';
    this.drawText('GAME OVER', verticalCenter - 10);

    context.font = '16px courier';
    context.fillStyle = this.props.text?.color ?? '#2a2a2a';
    this.drawText(`Score: ${this.state.score}`, verticalCenter + 20);

    context.font = '16px courier';
    context.fillStyle = this.props.text?.color ?? '#2a2a2a';

    this.drawText('Press SPACE or Tap', verticalCenter + 60);
    this.drawText('to Begin', verticalCenter + 85);
  }

  startTimer(reset?: boolean) {
    const newTimer = setInterval(
      () => this.advanceSnake(),
      reset ? 150 : Math.max(20, 150 - this.state.score * 5)
    ) as unknown;

    this.timerId = newTimer as NodeJS.Timeout;
  }

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  reset() {
    this.stopTimer();

    this.clearCanvas();

    this.start(this.initPosition());
  }

  start(newCoordinates?: t.GameState['coordinates']) {
    if (this.timerId) return;

    this.clearCanvas();

    this.setState({
      coordinates: newCoordinates ?? this.state.coordinates,
      direction: 'e',
      status: 'playing',
      score: 0,
    });

    if (this.props.dingSrc && this.dingRef.current) {
      this.dingRef.current.src = this.props.dingSrc;
    }

    if (this.props.audioSrc && this.audioRef.current) {
      this.audioRef.current.src = this.props.audioSrc;
      this.audioRef.current.play();
    }

    this.drawSnake(newCoordinates);
    this.initFood();

    this.startTimer(!!newCoordinates);
  }

  quit() {
    if (this.state.status !== 'playing') return;

    this.setState({
      status: 'title',
    });

    this.stopTimer();
  }

  handleVolumeChange(direction: 1 | -1 | 0, newVol?: number) {
    if (!this.audioRef.current || !this.dingRef.current) {
      return;
    }

    const currentVolume = this.audioRef.current.volume;

    const increment = currentVolume + 0.125 * direction;

    const newVolume = newVol
      ? newVol
      : direction === -1
      ? Math.max(0, increment)
      : Math.min(1, increment);

    this.audioRef.current.volume = newVolume;
    this.dingRef.current.volume = newVolume;
  }

  handleKeys(e: React.KeyboardEvent<HTMLCanvasElement>): void {
    e.preventDefault();

    const { direction } = this.state;

    this.keyPressed.push(e.key);

    switch (this.keyPressed[0]) {
      case 'ArrowDown':
        if (
          this.state.status === 'playing' &&
          direction !== 'n' &&
          direction !== 's'
        ) {
          this.setState({ direction: 's' });
        }

        break;
      case 'ArrowRight':
        if (
          this.state.status === 'playing' &&
          direction !== 'w' &&
          direction !== 'e'
        ) {
          this.setState({ direction: 'e' });
        }

        break;

      case 'ArrowLeft':
        if (
          this.state.status === 'playing' &&
          direction !== 'e' &&
          direction !== 'w'
        ) {
          this.setState({ direction: 'w' });
        }

        break;
      case 'ArrowUp':
        if (
          this.state.status === 'playing' &&
          direction !== 's' &&
          direction !== 'n'
        ) {
          this.setState({ direction: 'n' });
        }

        break;

      case 'h':
        if (this.state.status !== 'playing') {
          this.drawInstructionsPage();
        }
        break;
      case 'q':
        this.quit();
        break;
      case ' ' /* Space */:
        this.reset();
        break;

      case 'p':
        if (this.timerId) {
          this.stopTimer();
          this.setState({ status: 'paused' });
          this.audioRef.current?.pause();
        } else {
          this.startTimer();
          this.setState({ status: 'playing' });
          this.audioRef.current?.play();
        }
        break;

      case 'm':
        this.setState({ muted: !this.state.muted });
        break;

      case '1':
        this.handleVolumeChange(-1);
        break;
      case '2':
        this.handleVolumeChange(1);
        break;
    }
  }

  componentDidMount() {
    this.canvas.current?.focus();

    const canvasContext = this.canvas.current?.getContext('2d');

    if (!canvasContext) return;

    this.drawTitlePage();

    this.handleVolumeChange(0, 0.5);

    if (this.foodImg && this.props.food.src) {
      this.foodImg.src = this.props.food.src;
    }
  }

  componentWillUnmount() {
    this.stopTimer();
  }

  render() {
    const { audioSrc, dingSrc, style } = this.props;
    const { muted, status } = this.state;

    return (
      <div
        style={{
          height: this.CANVAS_HEIGHT,
          width: this.CANVAS_WIDTH,
        }}
      >
        <canvas
          height={this.CANVAS_HEIGHT}
          width={this.CANVAS_WIDTH}
          ref={this.canvas}
          style={{
            backgroundColor: style?.backgroundColor,
            outline: 'none',
            touchAction: 'none',
          }}
          tabIndex={1}
          onKeyDown={this.handleKeys}
          onKeyUp={(e) => {
            this.keyPressed = this.keyPressed.filter((key) => key !== e.key);
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.state.status === 'playing') {
              this.setState({
                touch: [e.touches[0].clientX, e.touches[0].clientY],
              });
            }
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();

            // Show help page on two-finger tap
            if (
              this.state.status !== 'playing' &&
              e.changedTouches.length === 2
            ) {
              this.setState({ status: 'instructions' });
              return this.drawInstructionsPage();
            }

            if (this.state.status !== 'playing') return this.reset();

            if (!this.state.touch) return;
            const { direction } = this.state;

            const diffX = e.changedTouches[0].clientX - this.state.touch[0];
            const diffY = e.changedTouches[0].clientY - this.state.touch[1];

            const diff =
              Math.abs(diffX) > Math.abs(diffY)
                ? diffX
                : Math.abs(diffY) > Math.abs(diffX)
                ? diffY
                : 0;

            if (diff === 0) return;

            if (diff === diffX && direction !== 'e' && direction !== 'w') {
              if (diffX < 0) {
                return this.setState({ direction: 'w', touch: undefined });
              } else {
                return this.setState({ direction: 'e', touch: undefined });
              }
            } else if (
              diff === diffY &&
              direction !== 'n' &&
              direction !== 's'
            ) {
              if (diffY < 0) {
                return this.setState({ direction: 'n', touch: undefined });
              } else {
                return this.setState({ direction: 's', touch: undefined });
              }
            }
          }}
        />
        {audioSrc && (
          <audio
            src={audioSrc}
            loop={status === 'playing'}
            muted={muted}
            ref={this.audioRef}
          />
        )}
        {dingSrc && <audio muted={muted} ref={this.dingRef} />}
      </div>
    );
  }
}
