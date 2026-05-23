import { useRef, useState, useEffect, useCallback, MutableRefObject } from 'react';

export type CallState = 'idle' | 'playing' | 'ended';

export interface UseAudioPlayerResult {
  callState: CallState;
  isPlaying: boolean;
  currentTimeMs: MutableRefObject<number>;
  elapsedDisplay: string;
  play: () => void;
  pause: () => void;
  replay: () => void;
  endCall: () => void;
}

export function useAudioPlayer(src: string): UseAudioPlayerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTimeMs = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const [callState, setCallState] = useState<CallState>('idle');
  const [elapsedDisplay, setElapsedDisplay] = useState('0:00');

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onEnded = () => {
      setCallState('ended');
      cancelAnimationFrame(rafRef.current);
    };
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      cancelAnimationFrame(rafRef.current);
    };
  }, [src]);

  const tick = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    currentTimeMs.current = audio.currentTime * 1000;
    const secs = Math.floor(audio.currentTime);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    setElapsedDisplay(`${m}:${s.toString().padStart(2, '0')}`);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    audioRef.current
      ?.play()
      .then(() => {
        setCallState('playing');
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        console.warn(
          '[AudioPlayer] conversation.mp3 could not be played — ' +
            'replace src/assets/conversation.mp3 with the actual audio file before the demo'
        );
      });
  }, [tick]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setCallState('idle');
    cancelAnimationFrame(rafRef.current);
  }, []);

  const replay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    currentTimeMs.current = 0;
    setElapsedDisplay('0:00');
    play();
  }, [play]);

  const endCall = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    cancelAnimationFrame(rafRef.current);
    setCallState('ended');
  }, []);

  return {
    callState,
    isPlaying: callState === 'playing',
    currentTimeMs,
    elapsedDisplay,
    play,
    pause,
    replay,
    endCall,
  };
}
