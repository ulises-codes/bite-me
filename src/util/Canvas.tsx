import React, { useState } from 'react';
import type { KeyboardEvent, MutableRefObject, TouchEvent } from 'react';
import { handleTouchMove, handleTouchStart } from '../helper/touch';
import { GameStatus, SnakeDirection } from 'src/types';
import { keyHandler } from 'src/helper';
import { useVolume } from '../hooks';

interface CanvasProps {
  height: number;
  width: number;
  canvasRef: MutableRefObject<HTMLCanvasElement>;
  backgroundColor: string;
  keyPressed: string[];
  setTouch: (touches: number[]) => void;
  onTouchEnd: (e: TouchEvent<HTMLCanvasElement>) => void;
  audioSrc?: string;
  dingSrc?: string;
  audioRef: MutableRefObject<HTMLAudioElement>;
  dingRef: MutableRefObject<HTMLAudioElement>;
  direction: SnakeDirection;
  status: GameStatus;
  setDirection: (newDirection: SnakeDirection) => void;
  setStatus: (status: GameStatus) => void;
  reset: () => void;
  quit: () => void;
  drawInstructions: () => void;
}

export default function Canvas({
  height,
  width,
  canvasRef,
  backgroundColor,
  keyPressed,
  setTouch,
  onTouchEnd,
  audioSrc,
  audioRef,
  dingRef,
  dingSrc,
  direction,
  status,
  setDirection,
  setStatus,
  reset,
  quit,
  drawInstructions,
}: CanvasProps): JSX.Element {
  const [muted, setMuted] = useState(false);
  const { handleVolumeChange, pause } = useVolume(
    status,
    audioRef,
    dingRef,
    setStatus
  );

  return (
    <div
      style={{
        height: height,
        width: width,
      }}
    >
      <canvas
        height={height}
        width={width}
        ref={canvasRef}
        style={{
          backgroundColor,
          outline: 'none',
          touchAction: 'none',
        }}
        tabIndex={1}
        onKeyDown={async (e: KeyboardEvent<HTMLCanvasElement>) => {
          const res = keyHandler(e, direction, status);

          if (!res) return;

          const { action, payload } = res;

          switch (action) {
            case 'direction':
              return setDirection(payload as SnakeDirection);

            case 'mute':
              return setMuted(!muted);

            case 'volume':
              return handleVolumeChange(payload as 0 | -1 | 1);

            case 'page':
              if (payload === 'instructions') {
                drawInstructions();
                return setStatus('instructions');
              }

              break;
            case 'gameplay':
              if (payload === 'start') {
                if (status !== 'playing' && status !== 'paused') {
                  return reset();
                }
              }
              if (payload === 'pause') return pause();
              if (payload === 'quit') quit();
          }
        }}
        onKeyUp={(e) => {
          keyPressed = keyPressed.filter((key) => key !== e.key);
        }}
        onTouchStart={(e) => handleTouchStart(e, setTouch)}
        onTouchMove={handleTouchMove}
        onTouchEnd={onTouchEnd}
      />
      {audioSrc && (
        <audio
          src={audioSrc}
          loop={status === 'playing'}
          muted={muted}
          ref={audioRef}
        />
      )}
      {dingSrc && <audio muted={muted} ref={dingRef} />}
    </div>
  );
}
