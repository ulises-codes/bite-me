import React, { useEffect, useState, useRef, useMemo } from 'react';
import Canvas from './util/Canvas';
import type { MutableRefObject } from 'react';

import { handleTouchEnd, initFoodPosition, initSnakePosition } from './helper';

import type {
  GameProps,
  GameStatus,
  SnakeCoordinates,
  SnakeDirection,
  SnakeWorkerProps,
} from './types';
import { proxy, releaseProxy, wrap } from 'comlink';

const SNAKE_SIZE = 20;
const FOOD_SIZE = 40;

export default function SnakeGame({
  audioSrc,
  dingSrc,
  height = 300,
  width = 300,
  food: { color: foodColor = '#fafafa', src: foodSrc },
  style: { backgroundColor = '#fafafa' },
  snakeStyle: { color: snakeFill = '#2a2a2a' },
  workerPaths,
  ...props
}: GameProps): JSX.Element {
  const [coordinates, setCoordinates] = useState(() =>
    initSnakePosition({ canvasHeight: height, canvasWidth: width })
  );
  const [direction, setDirection] = useState<SnakeDirection>('e');
  const [score, setScore] = useState(0);
  const [foodPosition, setFoodPosition] = useState(() =>
    initFoodPosition({
      snakeSize: SNAKE_SIZE,
      canvasHeight: height,
      canvasWidth: width,
      foodSize: FOOD_SIZE,
    })
  );
  const [status, setStatus] = useState<GameStatus>('title');

  const [touch, setTouch] = useState<number[] | undefined>(undefined);

  const canvas = useRef<HTMLCanvasElement>() as MutableRefObject<HTMLCanvasElement>;

  const audioRef = useRef<HTMLAudioElement>() as MutableRefObject<HTMLAudioElement>;
  const dingRef = useRef<HTMLAudioElement>() as MutableRefObject<HTMLAudioElement>;

  let keyPressed: string[] = [];

  const foodImg = useRef(foodSrc ? new Image(FOOD_SIZE, FOOD_SIZE) : undefined);

  const canvasContext = useRef() as MutableRefObject<CanvasRenderingContext2D>;

  const step = 20;

  const snakeWorker = useMemo(
    () => new Worker(workerPaths.snakeWorker, { type: 'module' }),
    []
  );
  const snakeWorkerMethods = wrap<SnakeWorkerProps>(snakeWorker);

  useEffect(() => {
    if (status === 'playing') {
      snakeWorkerMethods.startTimer(proxy(advanceSnake));
    } else {
      snakeWorkerMethods.stopTimer();
    }
  }, [status, coordinates]);

  useEffect(() => {
    if (foodImg.current && foodSrc) {
      foodImg.current.src = foodSrc;
    }

    if (!canvas.current) return;

    canvas.current.focus();

    canvasContext.current = canvas.current.getContext(
      '2d'
    ) as CanvasRenderingContext2D;

    drawTitlePage();

    return () => {
      snakeWorkerMethods.stopTimer();

      snakeWorkerMethods[releaseProxy]();

      snakeWorker.terminate();
    };
  }, []);

  const clearCanvas = () => {
    canvasContext.current.clearRect(0, 0, height, width);
  };

  const drawText = (text: string, y: number) => {
    const context = canvasContext.current;

    context.beginPath();
    const textSize = context.measureText(text).width;

    context.fillText(text, width / 2 - Math.round(textSize / 2), y);
  };

  const drawInstructionsPage = () => {
    clearCanvas();
    const context = canvasContext.current;

    context.fillStyle = props.text?.color ?? '#2a2a2a';

    context.font = '40px courier';
    drawText('HOW TO PLAY', 45);

    context.fillStyle = '#2a2a2a';

    context.font = '16px courier';

    drawText('Use the arrows on your', 95);
    drawText('keypad or swipe to move', 110);
    drawText('the snake along.', 125);

    drawText('Eat the food—a picture of my', 150);
    drawText('head that my wife hates–', 165);
    drawText('without crashing into the', 180);
    drawText('walls or yourself!', 195);

    context.fillStyle = props.text?.color ?? '#2a2a2a';

    drawText('Key combinations: ', 225);

    context.fillStyle = '#2a2a2a';
    drawText('start: SPACE', 240);
    drawText('quit: q', 255);
    drawText('mute: m', 270);
    drawText('Volume Down, Up: 2, 1', 285);
  };

  const drawTitlePage = () => {
    const context = canvasContext.current;

    context.fillStyle = props.text?.color ?? '#2a2a2a';

    const verticalCenter = height / 2;

    context.font = '40px courier';
    drawText('BITE ME', verticalCenter - 10);

    context.fillStyle = '#2a2a2a';
    context.font = '16px courier';
    drawText('A snake game', verticalCenter + 20);

    context.fillStyle = props.text?.color ?? '#2a2a2a';

    drawText('Press SPACE or Tap', verticalCenter + 60);
    drawText('to Begin', verticalCenter + 85);

    context.fillStyle = '#2a2a2a';
    drawText('Press h or tap with two', verticalCenter + 120);
    drawText('fingers for help', verticalCenter + 135);
  };

  const drawSnake = (newCoordinates: SnakeCoordinates) => {
    const context = canvas.current.getContext('2d');

    if (!context) return;

    const size = SNAKE_SIZE;

    context.strokeStyle = backgroundColor ?? 'white';
    context.lineWidth = 2;

    const color = snakeFill;

    newCoordinates.forEach(([x, y], i) => {
      if (typeof color === 'string' || !color) {
        context.fillStyle = snakeFill as string;
      } else {
        context.fillStyle = color[i % color.length];
      }

      context.fillRect(x, y, size, size);
      context.strokeRect(x, y, size, size);
    });
  };

  const advanceSnake = async () => {
    const [lastX, lastY] = coordinates[coordinates.length - 1];

    const size = SNAKE_SIZE;
    canvasContext.current.clearRect(lastX, lastY, size, size);

    const { action, payload } = await snakeWorkerMethods.advance({
      coordinates: proxy(coordinates),
      foodSize: FOOD_SIZE,
      foodPosition: proxy(foodPosition),
      canvasWidth: height,
      canvasHeight: width,
      step,
      direction: proxy(direction),
      snakeSize: SNAKE_SIZE,
    });

    if (action === 'gameover' || !payload) {
      gameOver();
      return;
    }

    if (action === 'eat') {
      setCoordinates(payload);
      eatFood();
      drawSnake(payload);
    } else if (action === 'continue') {
      setCoordinates(payload);
      drawSnake(payload);
    }
  };

  const drawFood = ([x, y]: number[]) => {
    const padding = 4;

    const context = canvasContext.current;

    if (foodImg.current) {
      context.drawImage(
        foodImg.current,
        x + padding / 2,
        y + padding / 2,
        FOOD_SIZE,
        FOOD_SIZE
      );

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }

    context.fillStyle = foodColor;
  };

  const initFood = () => drawFood(foodPosition);

  const clearFood = () => {
    const size = SNAKE_SIZE;

    const context = canvasContext.current;

    for (let i = 0; i < width; i += size) {
      for (let j = 0; j < height; j += size) {
        if (coordinates.some(([x, y]) => x === i && y === j)) {
          continue;
        }
        context.clearRect(i, j, size, size);
      }
    }
  };

  const eatFood = async () => {
    if (dingRef.current && dingSrc) {
      dingRef.current.currentTime = 0;
      dingRef.current?.play().catch(() => null);
    }

    const [newX, newY] = await snakeWorkerMethods.eat({
      snakeSize: SNAKE_SIZE,
      canvasHeight: height,
      canvasWidth: width,
      foodSize: FOOD_SIZE,
      coordinates,
    });

    clearFood();

    drawFood([newX, newY]);

    setFoodPosition([newX, newY]);

    setScore(score + 1);
  };

  const gameOver = () => {
    if (status !== 'playing') return;

    // Switch audio to game over sound
    if (audioRef.current && props.gameOverSrc) {
      audioRef.current.src = props.gameOverSrc;
      audioRef.current.play().catch(() => null);
    }

    const context = canvasContext.current;
    quit();

    clearCanvas();

    const verticalCenter = height / 2;

    context.font = '40px courier';
    context.fillStyle = props.text?.gameOverColor ?? '#F26463';
    drawText('GAME OVER', verticalCenter - 10);

    context.font = '16px courier';
    context.fillStyle = props.text?.color ?? '#2a2a2a';
    drawText(`Score: ${score}`, verticalCenter + 20);

    context.font = '16px courier';
    context.fillStyle = props.text?.color ?? '#2a2a2a';

    drawText('Press SPACE or Tap', verticalCenter + 60);
    drawText('to Begin', verticalCenter + 85);
  };

  const reset = () => {
    clearCanvas();

    start(initSnakePosition({ canvasHeight: height, canvasWidth: width }));
  };

  const start = (newCoordinates?: SnakeCoordinates) => {
    if (status === 'playing') return;

    clearCanvas();

    if (dingSrc && dingRef.current) {
      dingRef.current.src = dingSrc;
    }

    if (audioSrc && audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.play();
    }

    drawSnake(newCoordinates ?? coordinates);
    initFood();

    setCoordinates(newCoordinates ?? coordinates);
    setDirection('e');
    setScore(0);
    setStatus('playing');
  };

  const quit = () => {
    if (status !== 'playing') return;

    setStatus('title');
  };

  return (
    <Canvas
      {...{
        direction,
        status,
        height,
        width,
        backgroundColor,
        keyPressed,
        audioRef,
        audioSrc,
        dingRef,
        dingSrc,
        reset,
        quit,
      }}
      setDirection={(newDir) => setDirection(newDir)}
      setStatus={(newStatus) => setStatus(newStatus)}
      drawInstructions={drawInstructionsPage}
      setTouch={(touches) => setTouch(touches)}
      canvasRef={canvas}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();

        // Show help page on two-finger tap
        if (status !== 'playing' && e.changedTouches.length === 2) {
          setStatus('instructions');
          return drawInstructionsPage();
        }

        const res = handleTouchEnd(e, status, direction, reset, touch);

        if (res) setDirection(res);

        setTouch(undefined);
      }}
    />
  );
}
