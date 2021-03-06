# @ulises-codes/bite-me

## A Snake Game

A React Component that uses Web Workers to play a simple snake game.

<br />

### Basic Example

```js
import SnakeGame from '@ulises-codes/bite-me/snake';
import FoodURL from './assets/food.png';
import AudioURL from './assets/echo.mp3';
import DingURL from './assets/ding.mp3';
import GameOverURL from './assets/game-over.mp3';

export default function MyComponent() {
  return (
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
      workerPaths={{
        snakeWorker: newURL(
          '@ulises-codes/bite-me/dist/workers/snakeWorker',
          import.meta.url
        ),
      }}
    />
  );
}
```

<br />

### Web Workers!

This project includes two [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

- snakeWorker.js (SnakeGame and OffscreenGame components) handles most of the computations behind the snake's position and the game's timer
- canvasWorker.js (OffscreenSnake component only) is handles the [Offscreen Canvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas) for browsers that support it

If a browser supports OffscreenCanvas, you can import the OffscreenSnake component, which offloads the canvas rendering logic to a web worker for a slight increase in performance and most of all, reliability.

The OffscreenSnake component accepts the same props as the regular Snake component.

```js
import SnakeGame from '@ulises-codes/bite-me/offscreen';

export default function MyComponent() {
  return (
    <OffscreenSnake
      // Takes same props as SnakeGame, plus the
      // public path to the web worker

      workerPaths={{
        snakeWorker: newURL(
          '@ulises-codes/bite-me/dist/workers/snakeWorker',
          import.meta.url
        ),
        canvasWorker: new URL(
          '@ulises-codes/bite-me/dist/workers/canvasWorker',
          import.meta.url
        ),
      }}
    />
  );
}
```

<br />

### Gameplay

<table>
  <tbody>
    <tr>
      <td>Start game</td>
      <td>SPACE or one finger tap</td>
    </tr>
    <tr>
      <td>Help page</td>
      <td>h or two finger tap</td>
    </tr>
    <tr>
      <td>Quit</td>
      <td>q</td>
    </tr>
    <tr>
      <td>p</td>
      <td>Pause</td>
    </tr>
    <tr>
      <td>Mute</td>
      <td>m</td>
    </tr>
    <tr>
      <td>Volume Up / Volume Down</td>
      <td>1 / 2</td>
    </tr>
    <tr>
      <td>Move Snake</td>
      <td>Arrow or Swipe</td>
    </tr>
  </tbody>
</table>

<br />

### API

<table>
    <thead>
        <tr>
            <th colspan="3">Both Components Accept the Same Props</th>
        </tr>
        <tr>
            <th colspan="1">Prop Name</th>
            <th colspan="1">Type</th>
            <th colspan="1">Details</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>style</td>
            <td>{ backgroundColor?: string }</td>
            <td>Optional. Passed to Canvas Element. Currently only accepts a backgroundColor.<br />
            ex: <code>style = {{ backgroundColor: '#000000' }}</code>
            </td>
        </tr>
 <tbody>
        <tr>
            <td>food</td>
            <td>{  src?: string  }</td>
            <td>Optional. The path to the image that will represent the 'food' that the snake eats.            
            </td>
        </tr>
        <tr>
            <td>audioSrc</td>
            <td>string?</td>
            <td>Optional. The path to the track that while play while the game is active.</td>
        </tr>
        <tr>
            <td>dingSrc</td>
            <td>string?</td>
            <td>Optional. The path to a sound that will play when the snake eats some food.</td>
        </tr>
        <tr>
            <td>gameOverSrc</td>
            <td>string?</td>
            <td>Optional. The path to a sound that will play when the user loses a game.</td>
        </tr>
        <tr>
            <td>text</td>
            <td>{ color: string, subtitleColor?: string, titleColor?: string }</td>
            <td>Colors that will be used for the title, instructions, and gameOver screens.</td>
        </tr>
        <tr>
            <td>snakeStyle</td>
            <td>string | string[]</td>
            <td>This is where it gets fun. The color of the snake itself. If passed an array, each block of the snake will correspond to each color in the array.</td>
        </tr>
    </tbody>
</table>
