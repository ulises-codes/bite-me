import * as t from '../types/bite-me';

import * as React from 'react';
import * as Comlink from 'comlink';

import { initFoodPosition } from '../helper';

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

  keyPressed: string[];
  foodImg: HTMLImageElement;
  snakeInstance?: Comlink.Remote<t.SnakeWorkerInterface>;
  worker: Worker;

  SNAKE_FILL: string;
  SNAKE_SIZE: number;
  FOOD_SIZE: number;
  CANVAS_WIDTH: number;
  CANVAS_HEIGHT: number;

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

  constructor(props: t.GameProps) {
    super(props);
    this.foodImg = new Image();
    this.keyPressed = [];
    this.worker = new Worker(new URL('../worker.ts', import.meta.url));

    this.CANVAS_WIDTH = this.props.width ?? DEFAULT_WIDTH;
    this.CANVAS_HEIGHT = this.props.height ?? DEFAULT_HEIGHT;
    this.SNAKE_SIZE = 20;
    this.FOOD_SIZE = 40;
    this.SNAKE_FILL =
      typeof this.props.snakeStyle?.color === 'string'
        ? this.props.snakeStyle.color
        : '#2a2a2a';

    this.state = {
      coordinates: this.initPosition(),
      direction: 'e',
      score: 0,
      foodPosition: initFoodPosition({
        snakeSize: this.SNAKE_SIZE,
        canvasHeight: this.CANVAS_HEIGHT,
        canvasWidth: this.CANVAS_WIDTH,
        foodSize: this.FOOD_SIZE,
      }),
      muted: false,
      status: 'title',
      step: 20,
      touch: undefined,
      volume: 0.5,
    };
    this.handleKeys = this.handleKeys.bind(this);
  }

  private canvas = React.createRef<HTMLCanvasElement>();

  private audioRef = React.createRef<HTMLAudioElement>();
  private dingRef = React.createRef<HTMLAudioElement>();

  async advanceSnake() {
    if (!this.snakeInstance) return;

    const { coordinates, direction, step, foodPosition } = this.state;

    const canvasHeight = this.CANVAS_HEIGHT;
    const canvasWidth = this.CANVAS_WIDTH;

    const [lastX, lastY] = coordinates[coordinates.length - 1];
    const [firstX, firstY] = coordinates[0];

    await this.snakeInstance.clearPrevPosition(lastX, lastY);

    const [foodX, foodY] = foodPosition;

    // Game ends if user touches canvas edges
    if (
      firstX + step > canvasWidth ||
      firstX < 0 ||
      firstY + step > canvasHeight ||
      firstY < 0
    ) {
      return await this.gameOver();
    }

    if (coordinates.slice(1).some(([x, y]) => x === firstX && y === firstY)) {
      return await this.gameOver();
    }

    switch (direction) {
      case 'w':
      case 'e': {
        const vector = direction === 'e' ? 1 : -1;

        if (
          (firstX + step >= canvasWidth && direction === 'e') ||
          (firstX <= 0 && direction === 'w')
        ) {
          return await this.gameOver();
        }

        if (
          firstX + step > foodX &&
          firstX < foodX + this.FOOD_SIZE &&
          firstY + step > foodY &&
          firstY < foodY + this.FOOD_SIZE
        ) {
          const newCoordinates = [
            [coordinates[0][0] + step * vector, coordinates[0][1]],
            ...coordinates,
          ];

          this.setState({
            coordinates: newCoordinates,
          });

          await this.eatFood();

          return await this.snakeInstance.drawSnake({
            currentCoordinates: newCoordinates,
          });
        }

        this.setState({
          coordinates: [
            [coordinates[0][0] + step * vector, coordinates[0][1]],
            ...coordinates.slice(0, coordinates.length - 1),
          ],
        });

        await this.snakeInstance.drawSnake({
          currentCoordinates: this.state.coordinates,
        });

        break;
      }
      case 'n':
      case 's': {
        const vector = direction === 's' ? 1 : -1;

        if (
          (firstY + step >= canvasHeight && direction === 's') ||
          (firstY - step < 0 && direction === 'n')
        )
          return await this.gameOver();

        if (
          firstX + step > foodX &&
          firstX < foodX + this.FOOD_SIZE &&
          firstY + step > foodY &&
          firstY < foodY + this.FOOD_SIZE
        ) {
          const newCoordinates = [
            [coordinates[0][0], coordinates[0][1] + step * vector],
            ...coordinates,
          ];

          this.setState({
            coordinates: newCoordinates,
          });

          await this.eatFood();

          return await this.snakeInstance.drawSnake({
            currentCoordinates: newCoordinates,
          });
        }

        this.setState({
          coordinates: [
            [coordinates[0][0], coordinates[0][1] + step * vector],
            ...coordinates.slice(0, coordinates.length - 1),
          ],
        });

        await this.snakeInstance.drawSnake({
          currentCoordinates: this.state.coordinates,
        });

        break;
      }
    }
  }

  async eatFood() {
    if (!this.snakeInstance) return;

    if (this.dingRef.current && this.props.dingSrc) {
      this.dingRef.current.currentTime = 0;
      this.dingRef.current?.play().catch(() => null);
    }
    const newXY = await this.snakeInstance.eatFood(this.state.coordinates);

    this.setState({
      foodPosition: newXY,
      score: this.state.score + 1,
    });
  }

  async gameOver() {
    if (this.state.status !== 'playing' || !this.snakeInstance) return;

    // Switch audio to game over sound
    if (this.audioRef.current && this.props.gameOverSrc) {
      this.audioRef.current.src = this.props.gameOverSrc;
      this.audioRef.current.play().catch(() => null);
    }

    await this.snakeInstance.drawGameOver(
      this.state.score,
      Comlink.proxy(() => this.setState({ status: 'gameover' }))
    );
  }

  async quit(newCoordinates: t.GameState['coordinates']) {
    if (this.state.status !== 'playing' && this.state.status !== 'gameover') {
      return;
    }

    if (this.state.status !== 'playing' || !this.snakeInstance) return;

    this.setState({
      status: 'title',
      coordinates: newCoordinates,
    });

    this.audioRef.current?.pause();

    await this.snakeInstance.stopTimer();
    await this.snakeInstance.drawTitlePage(newCoordinates);
  }

  async reset() {
    const newCoordinates = this.initPosition();

    await this.snakeInstance?.stopTimer();

    this.start(this.state.status === 'gameover' ? newCoordinates : undefined);
  }

  async start(newCoordinates?: t.GameState['coordinates']) {
    if (this.state.status === 'playing' || !this.snakeInstance) return;

    await this.snakeInstance.clearCanvas();

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

    await await this.snakeInstance.drawSnake({
      currentCoordinates: this.state.coordinates,
      newCoordinates,
    });
    await this.snakeInstance.initFood(this.state.foodPosition);

    await this.snakeInstance.startTimer();
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

  directionChange(key: string) {
    const { direction } = this.state;
    switch (key) {
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
    }
  }

  async pause() {
    if (this.state.status === 'playing') {
      await this.snakeInstance?.stopTimer();
      this.setState({ status: 'paused' });
      this.audioRef.current?.pause();
    } else {
      await this.snakeInstance?.startTimer();
      this.setState({ status: 'playing' });
      this.audioRef.current?.play();
    }
  }

  async handleKeys(e: React.KeyboardEvent<HTMLCanvasElement>): Promise<void> {
    e.preventDefault();

    if (!this.snakeInstance) return;

    this.keyPressed.push(e.key);

    switch (this.keyPressed[0]) {
      case 'ArrowDown':
      case 'ArrowRight':
      case 'ArrowLeft':
      case 'ArrowUp':
        this.directionChange(e.key);
        break;

      case 'h':
        if (['title', 'gameover', 'instructions'].includes(this.state.status)) {
          await this.snakeInstance.drawInstructionsPage();
          this.setState({ status: 'instructions' });
        }
        break;
      case 'q':
        await this.quit(this.initPosition());
        break;
      case ' ' /* Space */:
        if (this.state.status !== 'playing' && this.state.status !== 'paused') {
          this.reset();
        }
        break;

      case 'p':
        this.pause();
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
    this.handleVolumeChange(0, 0.5);
    this.canvas.current?.focus();

    const init = async () => {
      if (!this.canvas.current) return;

      const offscreen = this.canvas.current.transferControlToOffscreen();

      const SnakeClass = Comlink.wrap<t.SnakeWorkerConstructor>(this.worker);

      this.snakeInstance = await new SnakeClass(
        Comlink.transfer(offscreen, [offscreen]),
        Comlink.proxy(() => this.advanceSnake()),
        {
          snake: {
            color: this.props.snakeStyle?.color,
            snakeFill: this.SNAKE_FILL,
            snakeSize: this.SNAKE_SIZE,
          },
          canvas: {
            height: this.CANVAS_HEIGHT,
            width: this.CANVAS_WIDTH,
            backgroundColor: this.props.style?.backgroundColor ?? '#fafafa',
          },
          text: { ...this.props.text },
          food: {
            color: this.props.food.color,
            imgSrc: this.props.food.src,
            size: this.FOOD_SIZE,
          },
        }
      );

      await this.snakeInstance.initGame(this.state.coordinates);
    };

    init();
  }

  componentWillUnmount() {
    this.snakeInstance?.stopTimer();
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
            backgroundColor: style?.backgroundColor ?? '#fafafa',
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

            if (status === 'playing') {
              this.setState({
                touch: [e.touches[0].clientX, e.touches[0].clientY],
              });
            }
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Show help page on two-finger tap
            if (status === 'playing' && e.changedTouches.length === 2) {
              if (this.snakeInstance) {
                return await this.snakeInstance.drawInstructionsPage();
              }
            }

            if (status !== 'playing') return this.reset();

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
                return this.setState({
                  direction: 'w',
                  touch: undefined,
                });
              } else {
                return this.setState({
                  direction: 'e',
                  touch: undefined,
                });
              }
            } else if (
              diff === diffY &&
              direction !== 'n' &&
              direction !== 's'
            ) {
              if (diffY < 0) {
                return this.setState({
                  direction: 'n',
                  touch: undefined,
                });
              } else {
                return this.setState({
                  direction: 's',
                  touch: undefined,
                });
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
