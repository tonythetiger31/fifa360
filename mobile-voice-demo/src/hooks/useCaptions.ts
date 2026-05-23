import { useMemo } from 'react';
import { CaptionLine, transcript } from '../data/transcript';

export function useCaptions(currentTimeMs: number): CaptionLine | null {
  return useMemo(() => {
    return transcript.find(
      line => currentTimeMs >= line.startMs && currentTimeMs < line.endMs
    ) ?? null;
  }, [currentTimeMs]);
}
