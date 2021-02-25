import { GameStatus, SnakeDirection } from 'src/types';

interface SnakeDirectionChange {
  action: 'direction';
  payload: SnakeDirection;
}

export default function keyHandler(
  e: React.KeyboardEvent<HTMLCanvasElement>,
  direction: SnakeDirection,
  status: GameStatus
):
  | SnakeDirectionChange
  | { action: 'gameplay'; payload: 'start' | 'quit' | 'pause' }
  | { action: 'volume'; payload: -1 | 1 }
  | { action: 'page'; payload: GameStatus }
  | { action: 'mute'; payload: 'mute' }
  | void {
  e.preventDefault();

  //   if (!canvasMethods) return;

  //   keyPressed.push(e.key);

  const directionChange = (key: string): SnakeDirectionChange => {
    let res: SnakeDirectionChange = {
      action: 'direction',
      payload: direction,
    };

    switch (key) {
      case 'ArrowDown':
        if (status === 'playing' && direction !== 'n' && direction !== 's') {
          res.payload = 's';
        }
        return res;
      case 'ArrowRight':
        if (status === 'playing' && direction !== 'w' && direction !== 'e') {
          res.payload = 'e';
        }
        return res;

      case 'ArrowLeft':
        if (status === 'playing' && direction !== 'e' && direction !== 'w') {
          res.payload = 'w';
        }
        return res;

      case 'ArrowUp':
        if (status === 'playing' && direction !== 's' && direction !== 'n') {
          res.payload = 'n';
        }
        return res;
    }

    return res;
  };

  switch (e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
    case 'ArrowLeft':
    case 'ArrowUp':
      return directionChange(e.key);

    case 'h':
      if (['title', 'gameover', 'instructions'].includes(status)) {
        return { action: 'page', payload: 'instructions' };
      }
      break;
    case 'q':
      return { action: 'gameplay', payload: 'quit' };

    case ' ' /* SPACE */:
      return { action: 'gameplay', payload: 'start' };

    case 'p':
      return { action: 'gameplay', payload: 'pause' };

    case 'm':
      return { action: 'mute', payload: 'mute' };

    case '1':
      return { action: 'volume', payload: -1 };
    //   handleVolumeChange(-1);

    case '2':
      return { action: 'volume', payload: 1 };
    //   handleVolumeChange(1);
  }

  return;
}
