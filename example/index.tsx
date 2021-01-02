/// <reference path="./index.d.ts" />

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import SnakeGame from '../src/index';
import ImageURL from './assets/food.png';
import AudioURL from './assets/echo.mp3';
import DingURL from './assets/ding.mp3';
import GameOverURL from './assets/game-over.mp3';

const App = () => {
  return (
    <div>
      <SnakeGame
        style={{ backgroundColor: '#24748F' }}
        foodImage={ImageURL}
        audioSrc={AudioURL}
        dingSrc={DingURL}
        gameOverSrc={GameOverURL}
        text={{ color: '#F1DD6D' }}
        snakeStyle={{
          color: ['#BF43A1', '#F26463', '#F1DD6D', '#2BACB3'],
        }}
      />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
