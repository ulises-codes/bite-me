import * as React from 'react';
import * as ReactDOM from 'react-dom';

// import SnakeGame from '@ulises-codes/bite-me/offscreen';

import SnakeGame from '../dist/offscreen';

import ImageURL from './assets/food.png';
import AudioURL from './assets/echo.mp3';
import DingURL from './assets/ding.mp3';
import GameOverURL from './assets/game-over.mp3';

const App = () => {
  const [play, setPlay] = React.useState(false);

  return (
    <div>
      <button onClick={() => setPlay(!play)}>{play ? 'Stop' : 'Play'}</button>
      {play && (
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
          }}
          publicPath={
            new URL('@ulises-codes/bite-me/dist/worker', import.meta.url)
          }
        />
      )}
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
