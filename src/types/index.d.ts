export interface CanvasWorkerConstructor {
  new (
    canvas: OffscreenCanvas,
    advanceSnake: AdvanceSnake,
    props: CanvasWorkerProps
  ): CanvasWorkerInterface;
}

export interface CanvasWorkerInterface {
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

  advanceSnake: () => Promise<void>;
  clearCanvas: () => void;
  drawText: (text: string, y: number, color: string, font: string) => void;
  drawTitlePage: (coordinates: SnakeCoordinates) => void;
  drawInstructionsPage: () => void;
  drawSnake: (coordinates: SnakeCoordinates) => void;
  drawFood: ([x, y]: FoodPosition) => void;
  drawGameOver: (score: number, cb: () => void) => void;
  clearPrevPosition: (x: number, y: number) => void;
  clearFood: (coordinates: SnakeCoordinates) => void;
  initGame: (snakeCoordinates: SnakeCoordinates) => void;
  initFood: (foodPosition: FoodPosition) => void;
}

export interface CanvasWorkerProps {
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
    snakeSize: number;
  };
  text: {
    color?: string;
    gameOverColor?: string;
    subtitleColor?: string;
    titleColor?: string;
  };
}

export type SnakeCoordinates = number[][];
export type FoodPosition = number[];
export type SnakeDirection = 'n' | 'e' | 's' | 'w';

export type GameStatus =
  | 'title'
  | 'playing'
  | 'gameover'
  | 'instructions'
  | 'paused';

export interface GameState {
  coordinates: SnakeCoordinates;
  direction: SnakeDirection;
  foodPosition: FoodPosition;
  muted: boolean;
  score: number;
  status: GameStatus;
  step: number;
  touch?: number[];
  volume: number;
}

export interface GameProps {
  audioSrc?: string;
  dingSrc?: string;
  gameOverSrc?: string;
  style: { backgroundColor?: string };
  height?: number;
  width?: number;
  snakeStyle: {
    color?: string | string[];
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
  publicPath?: URL | string;
  workerPaths: WorkerPaths;
}

export interface OffscreenGameProps extends GameProps {
  workerPaths: WorkerPaths & {
    canvasWorker: URL | string;
  };
}

export interface DrawSnake {
  currentCoordinates: SnakeCoordinates;
  newCoordinates?: SnakeCoordinates;
}

export interface InitFoodPositionProps {
  snakeSize: number;
  canvasWidth: number;
  canvasHeight: number;
  foodSize: number;
}

export type InitFoodPosition = (props: InitFoodPositionProps) => FoodPosition;

type AdvanceSnake = () => Promise<void>;
type WorkerPaths = {
  snakeWorker: URL | string;
};

export interface SnakeWorkerProps {
  timerId?: number;
  timeoutId?: number;
  startTimer: (advanceSnake: () => void) => void;
  stopTimer: () => void;
  advance(props: {
    coordinates: SnakeCoordinates;
    canvasWidth: number;
    canvasHeight: number;
    direction: SnakeDirection;
    foodPosition: FoodPosition;
    foodSize: number;
    snakeSize: number;
    step: number;
  }): { action: 'gameover' | 'eat' | 'continue'; payload?: SnakeCoordinates };
  eat(props: {
    snakeSize: number;
    canvasHeight: number;
    canvasWidth: number;
    foodSize: number;
    coordinates: SnakeCoordinates;
  }): FoodPosition;
}
