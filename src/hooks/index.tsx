import { MutableRefObject } from 'react';
import { GameStatus } from '../types';

export const useVolume = (
  status: GameStatus,
  audioRef: MutableRefObject<HTMLAudioElement>,
  dingRef: MutableRefObject<HTMLAudioElement>,
  setGameStatus: (newStatus: GameStatus) => void
) => {
  const handleVolumeChange = (direction: 1 | -1 | 0, newVol?: number) => {
    if (!audioRef.current || !dingRef.current) {
      return;
    }

    const currentVolume = audioRef.current.volume;

    const increment = currentVolume + 0.125 * direction;

    const newVolume = newVol
      ? newVol
      : direction === -1
      ? Math.max(0, increment)
      : Math.min(1, increment);

    audioRef.current.volume = newVolume;
    dingRef.current.volume = newVolume;
  };

  const pause = () => {
    if (status === 'playing') {
      setGameStatus('paused');
      audioRef.current?.pause();
    } else {
      setGameStatus('playing');
      audioRef.current?.play();
    }
  };

  return { handleVolumeChange, pause };
};
