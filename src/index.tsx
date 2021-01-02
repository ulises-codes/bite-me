import * as React from 'react';

type GameProps = {
  audioSrc?: string;
  dingSrc?: string;
  gameOverSrc?: string;
  style?: { backgroundColor?: string };
  height: number;
  width: number;
  snakeStyle?: {
    color: string;
  };
  foodColor?: string;
  foodImage: string;
  text: {
    gameOverColor?: string;
    color: string;
  };
};

type GameState = {
  coordinates: number[][];
  direction: 'n' | 'e' | 's' | 'w';
  score: number;
  playing: boolean;
  foodPosition: number[];
  muted: boolean;
  snakeSize: number;
  step: number;
  volume: number;
};
const DEFAULT_HEIGHT = 300;
const DEFAULT_WIDTH = 300;

export default class SnakeGame extends React.Component<GameProps, GameState> {
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

    const startX = Math.floor(Math.random() * (this.props.width / size)) * size;

    const startY =
      Math.floor(Math.random() * (this.props.height / size)) * size;

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
          (this.props.width / size - this.FOOD_SIZE / (this.FOOD_SIZE - size))
      ) * size;

    const startY =
      Math.floor(
        Math.random() *
          (this.props.height / size - this.FOOD_SIZE / (this.FOOD_SIZE - size))
      ) * size;

    return [startX, startY];
  }

  SNAKE_SIZE = 20;
  FOOD_SIZE = 40;
  SNAKE_FILL = this.props.snakeStyle?.color ?? '#2a2a2a';

  timerId?: NodeJS.Timer;
  keyPressed: string[] = [];
  foodImg: HTMLImageElement;

  constructor(props: GameProps) {
    super(props);
    this.foodImg = new Image();

    this.state = {
      coordinates: this.initPosition(),
      direction: 'e',
      score: 0,
      foodPosition: this.initFoodPosition(),
      muted: false,
      playing: false,
      snakeSize: this.SNAKE_SIZE * 2,
      step: this.SNAKE_SIZE,
      volume: 0.5,
    };
    this.handleKeys = this.handleKeys.bind(this);
  }

  private canvas = React.createRef<HTMLCanvasElement>();

  private audioRef = React.createRef<HTMLAudioElement>();
  private dingRef = React.createRef<HTMLAudioElement>();
  private gameOverRef = React.createRef<HTMLAudioElement>();

  private clearCanvas() {
    const { height: canvasHeight, width: canvasWidth } = this.props;
    this.canvasContext().clearRect(0, 0, canvasHeight, canvasWidth);
  }

  private canvasContext() {
    return this.canvas.current?.getContext('2d') as CanvasRenderingContext2D;
  }

  drawText = (text: string, y: number) => {
    const context = this.canvasContext();

    context.beginPath();
    const textSize = context.measureText(text).width;

    context.fillText(text, this.props.width / 2 - Math.round(textSize / 2), y);
  };

  drawTitlePage() {
    const context = this.canvasContext();

    const title = 'BITE ME';

    context.fillStyle = this.props.text?.color ?? '#2a2a2a';

    context.font = '40px courier';
    this.drawText(title, 50);

    context.fillStyle = '#2a2a2a';
    context.font = '16px courier';
    this.drawText('A snake game', 75);

    context.fillStyle = this.props.text?.color ?? '#2a2a2a';

    this.drawText('Press S to Begin', this.props.height / 2);
  }

  drawSnake(newCoordinates?: GameState['coordinates']) {
    const context = this.canvas.current?.getContext('2d');

    let coordinates;

    if (newCoordinates) {
      coordinates = newCoordinates;
    } else {
      coordinates = this.state.coordinates;
    }

    if (!context) return;

    const size = this.SNAKE_SIZE;

    context.fillStyle = this.SNAKE_FILL;
    context.strokeStyle = this.props.style?.backgroundColor ?? 'white';
    context.lineWidth = 2;

    coordinates.forEach(([x, y]) => {
      context.fillRect(x, y, size, size);
      context.strokeRect(x, y, size, size);
    });
  }

  advanceSnake() {
    // if (!this.state.playing) return;

    const { coordinates, direction, step } = this.state;

    const canvasHeight = this.props.height;
    const canvasWidth = this.props.width;

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

    context.drawImage(
      this.foodImg,
      x + padding / 2,
      y + padding / 2,
      width,
      height
    );

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    context.fillStyle = this.props.foodColor ?? 'red';
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

    for (let i = 0; i < this.props.width; i += size) {
      for (let j = 0; j < this.props.height; j += size) {
        if (coordinates.some(([x, y]) => x === i && y === j)) {
          continue;
        }
        context.clearRect(i, j, size, size);
      }
    }
  }

  eatFood() {
    let [newX, newY] = this.initFoodPosition();
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

    this.dingRef.current?.play();
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
    if (!this.state.playing) return;

    const context = this.canvasContext();

    this.gameOverRef.current?.play();

    this.quit();

    this.clearCanvas();

    context.font = '40px courier';
    context.fillStyle = this.props.text?.gameOverColor ?? '#F26463';
    this.drawText('GAME OVER', 50);

    context.font = '16px courier';
    context.fillStyle = this.props.text?.color ?? '#2a2a2a';
    this.drawText(`Score: ${this.state.score}`, 80);

    context.font = '16px courier';
    context.fillStyle = this.props.text?.color ?? '#2a2a2a';
    this.drawText('Press R to Restart', this.props.height / 2);
  }

  startTimer(reset?: boolean) {
    this.timerId = setInterval(
      () => this.advanceSnake(),
      reset ? 200 : Math.max(20, 200 - this.state.score * 5)
    );
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

  start(newCoordinates?: GameState['coordinates']) {
    if (this.timerId) return;

    this.clearCanvas();

    this.setState({
      coordinates: newCoordinates ?? this.state.coordinates,
      direction: 'e',
      playing: true,
      score: 0,
    });

    if (this.props.audioSrc && this.audioRef.current) {
      this.audioRef.current.currentTime = 0;
      this.audioRef.current.play();
    }

    this.drawSnake(newCoordinates);
    this.initFood();

    this.startTimer(!!newCoordinates);
  }

  quit() {
    if (!this.state.playing) return;

    this.setState({
      playing: false,
    });

    this.audioRef.current?.pause();

    this.stopTimer();
  }

  handleVolumeChange(direction: 1 | -1 | 0, newVol?: number) {
    if (
      !this.audioRef.current ||
      !this.dingRef.current ||
      !this.gameOverRef.current
    ) {
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
    this.gameOverRef.current.volume = newVolume;
  }

  handleKeys(e: React.KeyboardEvent<HTMLCanvasElement>): void {
    const { direction } = this.state;

    this.keyPressed.push(e.key);

    switch (this.keyPressed[0]) {
      case 'ArrowDown':
        if (this.state.playing && direction !== 'n' && direction !== 's') {
          this.setState({ direction: 's' });
        }

        break;
      case 'ArrowRight':
        if (this.state.playing && direction !== 'w' && direction !== 'e') {
          this.setState({ direction: 'e' });
        }

        break;

      case 'ArrowLeft':
        if (this.state.playing && direction !== 'e' && direction !== 'w') {
          this.setState({ direction: 'w' });
        }

        break;
      case 'ArrowUp':
        if (this.state.playing && direction !== 's' && direction !== 'n') {
          this.setState({ direction: 'n' });
        }

        break;
      case 'q':
        this.quit();
        break;
      case 'r':
        this.reset();
        break;
      case 's':
        this.reset();
        break;
      case ' ' /* Space */:
        if (this.timerId) {
          this.stopTimer();
          this.setState({ playing: false });
          this.audioRef.current?.pause();
        } else {
          this.startTimer();
          this.setState({ playing: true });
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

    this.foodImg.src = this.props.foodImage;
  }

  componentWillUnmount() {
    this.stopTimer();
  }

  render() {
    const { audioSrc, dingSrc, gameOverSrc, style } = this.props;
    const { muted } = this.state;

    return (
      <div>
        <canvas
          height={this.props.height}
          width={this.props.width}
          ref={this.canvas}
          style={{ backgroundColor: style?.backgroundColor, outline: 'none' }}
          tabIndex={1}
          onKeyDown={this.handleKeys}
          onKeyUp={e => {
            this.keyPressed = this.keyPressed.filter(key => key !== e.key);
          }}
        />
        {audioSrc && (
          <audio src={audioSrc} loop muted={muted} ref={this.audioRef} />
        )}
        {dingSrc && <audio src={dingSrc} muted={muted} ref={this.dingRef} />}
        {gameOverSrc && (
          <audio src={gameOverSrc} muted={muted} ref={this.gameOverRef} />
        )}
      </div>
    );
  }
}
