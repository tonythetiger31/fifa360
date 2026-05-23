'use client';

import { useEffect, useState, useRef } from 'react';
import type { LiveMatchState } from '@/lib/types';

export function useLiveMatch(matchId: string | null) {
  const [state, setState] = useState<LiveMatchState | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }

    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/live?matchId=${matchId}`);
        if (!res.ok) return;
        const data = await res.json();
        setState(prev => {
          if (prev && data.keyEvents && prev.keyEvents.length < data.keyEvents.length) {
            const newEvent = data.keyEvents[data.keyEvents.length - 1];
            if (newEvent.type === 'goal') {
              window.dispatchEvent(new CustomEvent('key-moment', { detail: newEvent }));
            }
          }
          return data;
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetch_();
    intervalRef.current = setInterval(fetch_, 10_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [matchId]);

  return { state, loading };
}
