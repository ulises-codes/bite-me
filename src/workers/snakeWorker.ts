import { expose } from 'comlink';
import { initFoodPosition } from '../helper';
import type { SnakeCoordinates, SnakeWorkerProps } from '../types';

const snakeWorker: SnakeWorkerProps = {
  startTimer(advanceSnake, props) {
    if ('requestAnimationFrame' in self) {
      if (this.timeoutId) clearTimeout(this.timeoutId);

      const cb = () => {
        const res = this.advance(props);

        this.timeoutId = (setTimeout(async () => {
          requestAnimationFrame(cb);
          await advanceSnake(res);
        }, 75) as unknown) as number;
      };

      this.timerId = requestAnimationFrame(cb);
    } else {
      const newTimer = setTimeout(async () => {
        const res = this.advance(props);
        await advanceSnake(res);
      }, 75) as unknown;

      this.timeoutId = newTimer as number;
    }
  },
  stopTimer() {
    if (this.timerId) {
      cancelAnimationFrame(this.timerId);
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  },
  advance({
    coordinates,
    step,
    foodSize,
    foodPosition,
    canvasHeight,
    canvasWidth,
    direction,
    snakeSize,
  }) {
    const [firstX, firstY] = coordinates[0];

    const [foodX, foodY] = foodPosition;

    let res: {
      action: 'eat' | 'gameover' | 'continue';
      payload?: SnakeCoordinates;
    } = { action: 'gameover' };

    const setRes = (
      action: 'eat' | 'gameover' | 'continue',
      payload?: SnakeCoordinates
    ) => {
      res = { action, payload };
    };

    // Game ends if snake touches canvas edges
    if (
      firstX + step > canvasWidth ||
      firstX < 0 ||
      firstY + step > canvasHeight ||
      firstY < 0
    ) {
      return res;
    }

    // Game ends if snake crashes into self
    if (coordinates.slice(1).some(([x, y]) => x === firstX && y === firstY)) {
      return res;
    }

    const snakeDirection = direction.toString();

    const secondSet = coordinates.slice(0, coordinates.length - 1);

    switch (snakeDirection) {
      case 'w':
      case 'e': {
        const vector = snakeDirection === 'e' ? 1 : -1;

        const firstSet = [firstX + snakeSize * vector, firstY];

        if (
          (firstX + step >= canvasWidth && snakeDirection === 'e') ||
          (firstX <= 0 && snakeDirection === 'w')
        ) {
          break;
        }

        if (
          firstX + step > foodX &&
          firstX < foodX + foodSize &&
          firstY + step > foodY &&
          firstY < foodY + foodSize
        ) {
          setRes('eat', [firstSet, ...coordinates]);

          break;
        }

        setRes('continue', [firstSet, ...secondSet]);

        break;
      }
      case 'n':
      case 's': {
        const vector = snakeDirection === 's' ? 1 : -1;

        const firstSet = [firstX, firstY + snakeSize * vector];

        if (
          (firstY + step >= canvasHeight && snakeDirection === 's') ||
          (firstY <= 0 && snakeDirection === 'n')
        ) {
          break;
        }

        if (
          firstX + step > foodX &&
          firstX < foodX + foodSize &&
          firstY + step > foodY &&
          firstY < foodY + foodSize
        ) {
          setRes('eat', [firstSet, ...coordinates]);

          break;
        }

        setRes('continue', [firstSet, ...secondSet]);

        break;
      }
    }

    return res;
  },
  eat({ snakeSize, canvasHeight, canvasWidth, foodSize, coordinates }) {
    let [newX, newY] = initFoodPosition({
      snakeSize,
      canvasHeight,
      canvasWidth,
      foodSize,
    });

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
          ([x, y]) => !coordinates.some(([a, b]) => x === a && y === b)
        )
      ) {
        return true;
      }

      return false;
    };

    while (checkPosition()) {
      [newX, newY] = initFoodPosition({
        snakeSize,
        canvasHeight,
        canvasWidth,
        foodSize,
      });
    }

    return [newX, newY];
  },
};

expose(snakeWorker);
