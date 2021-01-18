interface SnakeClass {
  backgroundColor: string;
  canvasHeight: number;
  canvasWidth: number;
  ctx: OffscreenCanvasRenderingContext2D | null;
  foodSize: number;
  foodColor: string;
  foodImg: HTMLImageElement;
  gameOverColor: string;
  snakeFill: string;
  snakeSize: number;
  snakeColor: string | string[];
  textColor: string;
  timerId?: NodeJS.Timer;
}

type GameProps = {
  audioSrc?: string;
  dingSrc?: string;
  gameOverSrc?: string;
  style?: { backgroundColor?: string };
  height?: number;
  width?: number;
  snakeStyle?: {
    color: string | string[];
  };
  foodColor?: string;
  foodImage: string;
  text: {
    color: string;
    gameOverColor?: string;
    subtitleColor?: string;
    titleColor?: string;
  };
};

type GameState = {
  coordinates: number[][];
  direction: 'n' | 'e' | 's' | 'w';
  foodPosition: number[];
  muted: boolean;
  score: number;
  snakeSize: number;
  status: 'title' | 'playing' | 'gameover' | 'instructions' | 'paused';
  step: number;
  touch?: number[];
  volume: number;
};

interface SnakeProps {
  text: {
    color?: string;
    gameOverColor?: string;
    subtitleColor?: string;
    titleColor?: string;
  };
  canvas: {
    height: number;
    width: number;
    backgroundColor: string;
  };
  snake: {
    color?: string | string[];
    snakeFill: string;
    snakeSize: number;
  };
  food: {
    imgSrc: string;
    color: string;
    size: number;
  };
}

interface DrawSnake {
  currentCoordinates: GameState['coordinates'];
  newCoordinates?: GameState['coordinates'];
}

interface DrawFood {
  x: number;
  y: number;
}

interface StartTimerProps {
  cb: (props: AdvanceSnakeProps) => Promise<void>;
  interval: number;
}

interface ClearPrevPosition {
  lastX: number;
  lastY: number;
  width: number;
  height: number;
}

interface InitFoodPositionProps {
  snakeSize: number;
  canvasWidth: number;
  canvasHeight: number;
  foodSize: number;
}

interface AdvanceSnakeProps
  extends Pick<
    GameState,
    'coordinates' | 'direction' | 'step' | 'foodPosition'
  > {}
