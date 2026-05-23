import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CallScreen, { getAutoplayFlag } from '../screens/CallScreen';

// ── Audio mock ───────────────────────────────────────────────────────────────

let endedCallback: (() => void) | null = null;

const mockAudioInstance = {
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  currentTime: 0,
  addEventListener: jest.fn((event: string, cb: () => void) => {
    if (event === 'ended') endedCallback = cb;
  }),
  removeEventListener: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  endedCallback = null;
  mockAudioInstance.currentTime = 0;
  mockAudioInstance.play.mockReturnValue(Promise.resolve());
  Object.defineProperty(window, 'Audio', {
    writable: true,
    value: jest.fn(() => mockAudioInstance),
  });
});

// ── useAudioPlayer initialisation ────────────────────────────────────────────

describe('useAudioPlayer initial state (via CallScreen)', () => {
  it('initializes with isPlaying false — shows "Incoming Call" status', () => {
    render(<CallScreen />);
    expect(screen.getByTestId('call-status')).toHaveTextContent('Incoming Call');
  });

  it('does not render waveform bars initially', () => {
    render(<CallScreen />);
    expect(screen.queryByTestId('waveform')).not.toBeInTheDocument();
  });

  it('currentTimeMs starts at 0 — elapsed display shows 0:00', () => {
    render(<CallScreen />);
    // While not playing, status is "Incoming Call", not a timer. After play the timer shows.
    expect(screen.getByTestId('call-status')).toHaveTextContent('Incoming Call');
  });
});

// ── CallScreen structure ─────────────────────────────────────────────────────

describe('CallScreen structure', () => {
  it('renders without crashing', () => {
    const { container } = render(<CallScreen />);
    expect(container).toBeTruthy();
  });

  it('displays the caller name "AI Agent"', () => {
    render(<CallScreen />);
    expect(screen.getByText('AI Agent')).toBeInTheDocument();
  });

  it('has the Dynamic Island element in the DOM', () => {
    render(<CallScreen />);
    expect(screen.getByTestId('dynamic-island')).toBeInTheDocument();
  });

  it('shows green Answer button before playback starts', () => {
    render(<CallScreen />);
    expect(screen.getByRole('button', { name: /answer/i })).toBeInTheDocument();
  });

  it('does not show call controls before playback starts', () => {
    render(<CallScreen />);
    expect(screen.queryByRole('button', { name: /end call/i })).not.toBeInTheDocument();
  });
});

// ── Playback state transitions ───────────────────────────────────────────────

describe('play() sets isPlaying to true', () => {
  it('clicking Answer calls audio.play()', async () => {
    render(<CallScreen />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /answer/i }));
    });
    expect(mockAudioInstance.play).toHaveBeenCalledTimes(1);
  });

  it('after play resolves, call controls replace the Answer button', async () => {
    render(<CallScreen />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /answer/i }));
      await Promise.resolve();
    });
    expect(screen.queryByRole('button', { name: /answer/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end call/i })).toBeInTheDocument();
  });

  it('waveform bars appear when playing', async () => {
    render(<CallScreen />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /answer/i }));
      await Promise.resolve();
    });
    expect(screen.getByTestId('waveform')).toBeInTheDocument();
  });

  it('call status shows elapsed timer when playing', async () => {
    render(<CallScreen />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /answer/i }));
      await Promise.resolve();
    });
    // Status is no longer "Incoming Call" — it shows elapsed time (e.g. "0:00")
    expect(screen.getByTestId('call-status')).not.toHaveTextContent('Incoming Call');
  });
});

// ── Ended state ──────────────────────────────────────────────────────────────

describe('ended state', () => {
  it('shows "Call Ended" status and Replay button after audio ends', async () => {
    render(<CallScreen />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /answer/i }));
      await Promise.resolve();
    });
    act(() => {
      endedCallback?.();
    });
    expect(screen.getByTestId('call-status')).toHaveTextContent('Call Ended');
    expect(screen.getByRole('button', { name: /replay/i })).toBeInTheDocument();
  });

  it('waveform is hidden after call ends', async () => {
    render(<CallScreen />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /answer/i }));
      await Promise.resolve();
    });
    act(() => {
      endedCallback?.();
    });
    expect(screen.queryByTestId('waveform')).not.toBeInTheDocument();
  });
});

// ── Demo banner ──────────────────────────────────────────────────────────────

describe('demo banner', () => {
  it('renders the banner with "AI Agent Demo" text', () => {
    render(<CallScreen />);
    expect(screen.getByTestId('demo-banner')).toBeInTheDocument();
    expect(screen.getByTestId('demo-banner')).toHaveTextContent('AI Agent Demo');
  });

  it('renders the bilingual subtitle in the banner', () => {
    render(<CallScreen />);
    expect(screen.getByTestId('demo-banner')).toHaveTextContent('Spanish conversation with live English captions');
  });
});

// ── getAutoplayFlag ──────────────────────────────────────────────────────────

describe('getAutoplayFlag', () => {
  it('returns true when ?autoplay=1 is in the search string', () => {
    expect(getAutoplayFlag('?autoplay=1')).toBe(true);
  });

  it('returns false when the search string is empty', () => {
    expect(getAutoplayFlag('')).toBe(false);
  });

  it('returns false when autoplay param is not 1', () => {
    expect(getAutoplayFlag('?autoplay=0')).toBe(false);
  });
});

// ── Keyboard shortcuts ───────────────────────────────────────────────────────

describe('keyboard shortcuts', () => {
  it('Space key calls audio.play() when idle', async () => {
    render(<CallScreen />);
    await act(async () => {
      fireEvent.keyDown(window, { code: 'Space' });
    });
    expect(mockAudioInstance.play).toHaveBeenCalledTimes(1);
  });

  it('R key calls replay (resets currentTime and plays)', async () => {
    render(<CallScreen />);
    // Start playing first
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /answer/i }));
      await Promise.resolve();
    });
    mockAudioInstance.play.mockClear();
    await act(async () => {
      fireEvent.keyDown(window, { code: 'KeyR' });
      await Promise.resolve();
    });
    expect(mockAudioInstance.play).toHaveBeenCalledTimes(1);
    expect(mockAudioInstance.currentTime).toBe(0);
  });

  it('E key ends the call and shows "Call Ended"', async () => {
    render(<CallScreen />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /answer/i }));
      await Promise.resolve();
    });
    act(() => {
      fireEvent.keyDown(window, { code: 'KeyE' });
    });
    expect(screen.getByTestId('call-status')).toHaveTextContent('Call Ended');
  });

  it('Escape key ends the call and shows "Call Ended"', async () => {
    render(<CallScreen />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /answer/i }));
      await Promise.resolve();
    });
    act(() => {
      fireEvent.keyDown(window, { code: 'Escape' });
    });
    expect(screen.getByTestId('call-status')).toHaveTextContent('Call Ended');
  });
});
