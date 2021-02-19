export interface SnakeWorkerConstructor {
  new (
    canvas: OffscreenCanvas,
    advanceSnake: AdvanceSnake,
    props: SnakeWorkerProps
  ): SnakeWorkerInterface;
}

export interface SnakeWorkerInterface {
  backgroundColor: string;
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
  snakeFill: string;
  snakeColor: string | string[];
  snakeSize: number;
  textColor: string;
  titleColor: string;
  subtitleColor: string;
  timerId?: number;
  timeoutId?: number;

  advanceSnake: () => Promise<void>;
  clearCanvas: () => void;
  drawText: (text: string, y: number, color: string, font: string) => void;
  drawTitlePage: (coordinates: GameState['coordinates']) => void;
  drawInstructionsPage: () => void;
  drawSnake: (props: DrawSnake) => void;
  drawFood: ([x, y]: GameState['foodPosition']) => void;
  drawGameOver: (score: number, cb: () => void) => void;
  clearPrevPosition: (x: number, y: number) => void;
  clearFood: (coordinates: GameState['coordinates']) => void;
  eatFood: (coordinates: GameState['coordinates']) => GameState['foodPosition'];
  initGame: (snakeCoordinates: GameState['coordinates']) => void;
  initFood: (foodPosition: GameState['foodPosition']) => void;
  startTimer: () => void;
  stopTimer: () => void;
}

export interface SnakeWorkerProps {
  canvas: {
    height: number;
    width: number;
    backgroundColor: string;
  };
  food: {
    imgSrc?: string;
    color?: string;
    size: number;
  };
  snake: {
    color?: string | string[];
    snakeFill: string;
    snakeSize: number;
  };
  text: {
    color?: string;
    gameOverColor?: string;
    subtitleColor?: string;
    titleColor?: string;
  };
}

export interface GameState {
  coordinates: number[][];
  direction: 'n' | 'e' | 's' | 'w';
  foodPosition: number[];
  muted: boolean;
  score: number;
  status: 'title' | 'playing' | 'gameover' | 'instructions' | 'paused';
  step: number;
  touch?: number[];
  volume: number;
}

export interface GameProps {
  audioSrc?: string;
  dingSrc?: string;
  gameOverSrc?: string;
  style?: { backgroundColor?: string };
  height?: number;
  width?: number;
  snakeStyle?: {
    color: string | string[];
  };
  food: {
    color?: string;
    src?: string;
  };
  text: {
    color: string;
    gameOverColor?: string;
    subtitleColor?: string;
    titleColor?: string;
  };
}

export interface OffscreenGameProps extends GameProps {
  publicPath: URL | string;
}

export interface DrawSnake {
  currentCoordinates: GameState['coordinates'];
  newCoordinates?: GameState['coordinates'];
}

export interface InitFoodPositionProps {
  snakeSize: number;
  canvasWidth: number;
  canvasHeight: number;
  foodSize: number;
}

export type InitFoodPosition = (
  props: InitFoodPositionProps
) => GameState['foodPosition'];

type AdvanceSnake = () => Promise<void>;
