import { renderHook } from '@testing-library/react';
import { useCaptions } from '../hooks/useCaptions';

describe('useCaptions', () => {
  it('returns first line (startMs 1000, endMs 5500) at 3000ms', () => {
    const { result } = renderHook(() => useCaptions(3000));
    expect(result.current).not.toBeNull();
    expect(result.current?.startMs).toBe(1000);
    expect(result.current?.endMs).toBe(5500);
  });

  it('returns null at 5500ms (endMs boundary is exclusive)', () => {
    const { result } = renderHook(() => useCaptions(5500));
    expect(result.current).toBeNull();
  });

  it('returns null at 99999ms (past all lines)', () => {
    const { result } = renderHook(() => useCaptions(99999));
    expect(result.current).toBeNull();
  });

  it('returns null at 0ms (before any line starts)', () => {
    const { result } = renderHook(() => useCaptions(0));
    expect(result.current).toBeNull();
  });
});
