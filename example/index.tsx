import React from 'react';
import ReactDOM from 'react-dom';

// import OffscreenGame from '@ulises-codes/bite-me/offscreen';
// import SnakeGame from '@ulises-codes/bite-me/snake';

import SnakeGame from '../dist/snake';

import OffscreenGame from '../dist/offscreen';

import ImageURL from './assets/food.png';
import AudioURL from './assets/echo.mp3';
import DingURL from './assets/ding.mp3';
import GameOverURL from './assets/game-over.mp3';

const App = () => {
  // const [play, setPlay] = React.useState(false);
  const [color, setColor] = React.useState('#F1DD6D');

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <OffscreenGame
        style={{ backgroundColor: '#24748F' }}
        food={{ src: ImageURL }}
        audioSrc={AudioURL}
        dingSrc={DingURL}
        gameOverSrc={GameOverURL}
        text={{
          color: '#2a2a2a',
          subtitleColor: '#fafafa',
          titleColor: '#F1DD6D',
        }}
        snakeStyle={{
          color: ['#BF43A1', '#F26463', '#F1DD6D', '#2BACB3'],
          // color,
        }}
        workerPaths={{
          snakeWorker: new URL(
            '../dist/workers/snakeWorker.js',
            import.meta.url
          ),
          canvasWorker: new URL(
            '../dist/workers/canvasWorker.js',
            import.meta.url
          ),
        }}
      />
      <SnakeGame
        style={{ backgroundColor: '#24748F' }}
        food={{ src: ImageURL }}
        audioSrc={AudioURL}
        dingSrc={DingURL}
        gameOverSrc={GameOverURL}
        text={{
          color: '#2a2a2a',
          subtitleColor: '#fafafa',
          titleColor: '#F1DD6D',
        }}
        snakeStyle={{
          color: ['#BF43A1', '#F26463', '#F1DD6D', '#2BACB3'],
          // color,
        }}
        workerPaths={{
          snakeWorker: new URL(
            '../dist/workers/snakeWorker.js',
            import.meta.url
          ),
        }}
      />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
