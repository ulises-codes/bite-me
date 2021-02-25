import React, { useState, useEffect, useRef, useMemo } from 'react';

import type { MutableRefObject } from 'react';

import { wrap, proxy, transfer, releaseProxy } from 'comlink';

import type { Remote } from 'comlink';

import { initFoodPosition, initSnakePosition, handleTouchEnd } from './helper';

import {
  OffscreenGameProps,
  GameState,
  CanvasWorkerConstructor,
  SnakeWorkerProps,
  CanvasWorkerInterface,
  SnakeCoordinates,
  SnakeDirection,
  FoodPosition,
  GameStatus,
  NewPositionReturn,
} from './types';

import Canvas from './util/Canvas';

const SNAKE_SIZE = 20;
const STEP = 20;
const FOOD_SIZE = 40;

export default function SnakeGame({
  style: { backgroundColor = '#fafafa' },
  food: { color: foodColor = '#fafafa', src: foodSrc },
  height = 300,
  width = 300,
  audioSrc,
  dingSrc,
  workerPaths,
  ...props
}: OffscreenGameProps): JSX.Element {
  const [coordinates, setCoordinates] = useState<SnakeCoordinates>(
    initSnakePosition({ canvasHeight: height, canvasWidth: width })
  );
  const [direction, setDirection] = useState<SnakeDirection>('e');
  const [score, setScore] = useState<GameState['score']>(0);
  const [foodPosition, setFoodPosition] = useState<FoodPosition>(
    initFoodPosition({
      snakeSize: SNAKE_SIZE,
      canvasHeight: height,
      canvasWidth: width,
      foodSize: FOOD_SIZE,
    })
  );
  const [status, setStatus] = useState<GameStatus>('title');

  const [touch, setTouch] = useState<GameState['touch']>(undefined);

  const canvas = useRef() as MutableRefObject<HTMLCanvasElement>;
  const audioRef = useRef() as MutableRefObject<HTMLAudioElement>;
  const dingRef = useRef() as MutableRefObject<HTMLAudioElement>;

  let keyPressed: string[] = [];

  const offscreen = useRef() as MutableRefObject<OffscreenCanvas>;

  const snakeWorker: Worker = useMemo(
    () => new Worker(workerPaths.snakeWorker, { type: 'module' }),
    []
  );

  const snakeMethods = wrap<SnakeWorkerProps>(snakeWorker);

  const canvasWorker: Worker = useMemo(
    () => new Worker(workerPaths.canvasWorker, { type: 'module' }),
    []
  );

  const CanvasWorkerClass = wrap<CanvasWorkerConstructor>(canvasWorker);
  const canvasMethods = useRef() as MutableRefObject<
    Remote<CanvasWorkerInterface>
  >;

  useEffect(() => {
    const startTimer = async () => {
      await snakeMethods.startTimer(proxy(advanceSnake), {
        direction,
        step: STEP,
        coordinates: [...coordinates],
        foodSize: FOOD_SIZE,
        foodPosition: [...foodPosition],
        canvasWidth: height,
        canvasHeight: width,
        snakeSize: SNAKE_SIZE,
      });
    };

    const stopTimer = async () => await snakeMethods.stopTimer();

    if (status === 'playing') startTimer();
    else stopTimer();
  }, [status, coordinates]);

  useEffect(() => {
    async function initGame() {
      canvas.current.focus();

      if (!canvas.current) return;

      offscreen.current = canvas.current.transferControlToOffscreen();

      canvasMethods.current = await new CanvasWorkerClass(
        transfer(offscreen.current, [offscreen.current]),
        {
          snake: {
            color: props.snakeStyle?.color,
            snakeSize: SNAKE_SIZE,
          },
          canvas: {
            height,
            width,
            backgroundColor,
          },
          text: { ...props.text },
          food: {
            color: foodColor,
            imgSrc: foodSrc,
            size: FOOD_SIZE,
          },
        }
      );

      await canvasMethods.current.initGame(coordinates);
    }

    initGame();

    return () => {
      snakeMethods.stopTimer();

      CanvasWorkerClass[releaseProxy]();
      canvasMethods.current[releaseProxy]();

      snakeMethods[releaseProxy]();

      canvasWorker.terminate();
      snakeWorker.terminate();
    };
  }, []);

  useEffect(() => {
    if (!canvasMethods.current) return;
    canvasMethods.current.drawSnake(coordinates);
  }, [props.snakeStyle.color]);

  const advanceSnake = async ({ action, payload }: NewPositionReturn) => {
    const prevPosition = coordinates[coordinates.length - 1];

    if (action === 'gameover' || !payload) {
      gameOver();

      return;
    }

    if (action === 'eat') await eatFood();

    await canvasMethods.current.drawSnake(payload, prevPosition);

    setCoordinates(payload);
  };

  const eatFood = async () => {
    if (dingRef.current && dingSrc) {
      dingRef.current.currentTime = 0;
      dingRef.current?.play().catch(() => null);
    }

    const newFoodPosition = await snakeMethods.eat({
      coordinates,
      snakeSize: SNAKE_SIZE,
      canvasHeight: height,
      canvasWidth: width,
      foodSize: FOOD_SIZE,
    });

    setFoodPosition(newFoodPosition);
    setScore(score + 1);

    await canvasMethods.current.clearFood([...coordinates]);
    await canvasMethods.current.drawFood(newFoodPosition);
  };

  const gameOver = async () => {
    if (status !== 'playing') return;

    // Switch audio to game over sound
    if (audioRef.current && props.gameOverSrc) {
      audioRef.current.src = props.gameOverSrc;
      audioRef.current.play().catch(() => null);
    }

    await canvasMethods.current.drawGameOver(
      score,
      proxy(() => setStatus('gameover'))
    );
  };

  const quit = async (newCoordinates: SnakeCoordinates) => {
    if (status !== 'playing' && status !== 'gameover') {
      return;
    }

    if (status !== 'playing') return;

    setStatus('title');
    setCoordinates(newCoordinates);

    audioRef.current?.pause();

    await canvasMethods.current.drawTitlePage(newCoordinates);
  };

  const reset = () => {
    const newCoordinates = initSnakePosition({
      canvasHeight: height,
      canvasWidth: width,
    });

    start(newCoordinates);
  };

  const start = async (newCoordinates: SnakeCoordinates) => {
    if (status === 'playing') return;

    if (dingSrc && dingRef.current) {
      dingRef.current.src = dingSrc;
    }

    if (audioSrc && audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.play();
    }

    await canvasMethods.current.clearCanvas();

    await canvasMethods.current.drawSnake([...newCoordinates]);
    await canvasMethods.current.initFood([...foodPosition]);

    setCoordinates(newCoordinates);
    setDirection('e');
    setScore(0);
    setStatus('playing');
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
      }}
      drawInstructions={async () => {
        await canvasMethods.current.drawInstructionsPage();
      }}
      quit={() =>
        quit(
          initSnakePosition({
            snakeSize: SNAKE_SIZE,
            canvasHeight: height,
            canvasWidth: width,
          })
        )
      }
      setDirection={(newDir) => setDirection(newDir)}
      setTouch={(touches) => setTouch(touches)}
      setStatus={(newStatus) => setStatus(newStatus)}
      reset={reset}
      canvasRef={canvas}
      onTouchEnd={async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Show help page on two-finger tap
        if (status === 'playing' && e.changedTouches.length === 2) {
          if (canvasMethods) {
            return await canvasMethods.current.drawInstructionsPage();
          }
        }

        const res = handleTouchEnd(e, status, direction, reset, touch);

        if (res) setDirection(res);

        setTouch(undefined);
      }}
    />
  );
}
