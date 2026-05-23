import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useCaptions } from '../hooks/useCaptions';
import conversationSrc from '../assets/conversation.mp3';

// ── Icons (inline SVG, no external deps) ────────────────────────────────────

function MicIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

function PhoneOffIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" />
      <path d="M14.69 14.69A16 16 0 0 0 6.07 6.07" />
      <path d="M22 22 2 2" />
      <path d="M3.28 3.28A19.7 19.7 0 0 0 2.01 8.98a2 2 0 0 0 1.72 2c.97.13 1.93.35 2.81.7a2 2 0 0 1 .45 3.38L5.72 16.33" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

function ReplayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" />
    </svg>
  );
}

// ── Status bar icons ────────────────────────────────────────────────────────

function SignalIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
      <rect x="0" y="8" width="3" height="4" rx="0.5" />
      <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
      <rect x="9" y="2" width="3" height="10" rx="0.5" />
      <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 24 18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M2 7a15 15 0 0 1 20 0" />
      <path d="M5.5 11a10 10 0 0 1 13 0" />
      <path d="M9 15a5 5 0 0 1 6 0" />
      <circle cx="12" cy="18" r="1" fill="white" stroke="none" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
      <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" strokeOpacity="0.35" />
      <rect x="2" y="2" width="16" height="8" rx="2" fill="white" />
      <path d="M23 4v4a2 2 0 0 0 0-4Z" fill="white" fillOpacity="0.4" />
    </svg>
  );
}

// ── Waveform bars ───────────────────────────────────────────────────────────

const WAVEFORM_KEYFRAMES = `
@keyframes waveBar0 { 0%,100%{height:4px} 50%{height:24px} }
@keyframes waveBar1 { 0%,100%{height:8px} 50%{height:20px} }
@keyframes waveBar2 { 0%,100%{height:6px} 50%{height:26px} }
@keyframes waveBar3 { 0%,100%{height:10px} 50%{height:18px} }
@keyframes waveBar4 { 0%,100%{height:5px} 50%{height:22px} }
`;

const BAR_DELAYS = ['0s', '0.15s', '0.3s', '0.45s', '0.6s'];

function WaveformBars({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      <style>{WAVEFORM_KEYFRAMES}</style>
      <div data-testid="waveform" style={styles.waveform}>
        {BAR_DELAYS.map((delay, i) => (
          <div
            key={i}
            style={{
              ...styles.waveBar,
              animation: `waveBar${i} 0.8s ease-in-out ${delay} infinite`,
            }}
          />
        ))}
      </div>
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getAutoplayFlag(search = window.location.search): boolean {
  try {
    return new URLSearchParams(search).get('autoplay') === '1';
  } catch {
    return false;
  }
}

// ── Main component ──────────────────────────────────────────────────────────

export default function CallScreen() {
  const { callState, isPlaying, elapsedDisplay, currentTimeMs, play, pause, replay, endCall } =
    useAudioPlayer(conversationSrc);

  const [captionTimeMs, setCaptionTimeMs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCaptionTimeMs(currentTimeMs.current), 100);
    return () => clearInterval(id);
  }, [currentTimeMs]);

  const activeLine = useCaptions(captionTimeMs);

  // Responsive scaling for narrow viewports
  const [scale, setScale] = useState(() => window.innerWidth < 900 ? 0.85 : 1);
  useEffect(() => {
    const onResize = () => setScale(window.innerWidth < 900 ? 0.85 : 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-play from URL param ?autoplay=1
  useEffect(() => {
    if (!getAutoplayFlag()) return;
    const timer = setTimeout(() => play(), 1500);
    return () => clearTimeout(timer);
  }, [play]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (callState === 'playing') pause();
        else if (callState === 'idle') play();
      } else if (e.code === 'KeyR') {
        replay();
      } else if (e.code === 'KeyE' || e.code === 'Escape') {
        endCall();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [callState, play, pause, replay, endCall]);

  const statusLabel =
    callState === 'idle'
      ? 'Incoming Call'
      : callState === 'playing'
        ? elapsedDisplay
        : 'Call Ended';

  return (
    <div style={styles.root}>
      {/* iPhone 15 Pro outer frame */}
      <div
        style={{
          ...styles.phoneOuter,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Titanium rim highlight */}
        <div style={styles.phoneInner}>

          {/* Dynamic Island */}
          <div
            data-testid="dynamic-island"
            aria-label="Dynamic Island"
            style={styles.dynamicIsland}
          />

          {/* Status bar */}
          <div style={styles.statusBar}>
            <span style={styles.statusTime}>9:41</span>
            <div style={styles.statusIcons}>
              <SignalIcon />
              <WifiIcon />
              <BatteryIcon />
            </div>
          </div>

          {/* Screen content */}
          <div style={styles.screenContent}>

            {/* Dark gradient background */}
            <div style={styles.frostedOverlay} />

            {/* Top section — avatar + caller info + waveform */}
            <div style={styles.callerSection}>
              <div style={styles.avatar}>
                <span style={styles.avatarText}>AI</span>
              </div>
              <p style={styles.callerName}>AI Agent</p>
              <p data-testid="call-status" style={styles.callStatus}>{statusLabel}</p>
              <WaveformBars visible={isPlaying} />
            </div>

            {/* Caption overlay — always mounted for CSS opacity transition */}
            <div
              data-testid="caption-box"
              style={{
                ...styles.captionBox,
                opacity: activeLine ? 1 : 0,
                pointerEvents: 'none',
              }}
            >
              {activeLine && (
                <>
                  <div
                    style={{
                      ...styles.speakerPill,
                      backgroundColor: activeLine.speaker === 'agent' ? '#3B82F6' : '#F97316',
                    }}
                  >
                    {activeLine.speaker === 'agent' ? 'AI Agent' : 'Restaurant'}
                  </div>
                  <p style={styles.captionSpanish}>{activeLine.spanish}</p>
                  <p style={styles.captionEnglish}>{activeLine.english}</p>
                </>
              )}
            </div>

            {/* Bottom section — switches between idle / playing / ended */}
            <div style={styles.bottomSection}>
              {callState === 'idle' && (
                <div style={styles.answerRow}>
                  <button
                    style={styles.answerBtn}
                    aria-label="Answer"
                    onClick={play}
                  >
                    <PhoneIcon />
                  </button>
                  <span style={styles.answerLabel}>Answer</span>
                </div>
              )}

              {callState === 'playing' && (
                <div style={styles.controls}>
                  <button style={styles.controlBtn} aria-label="Mute" onClick={pause}>
                    <MicIcon />
                    <span style={styles.controlLabel}>Mute</span>
                  </button>
                  <button
                    style={{ ...styles.controlBtn, ...styles.endCallBtn }}
                    aria-label="End call"
                    onClick={endCall}
                  >
                    <PhoneOffIcon />
                    <span style={styles.controlLabel}>End</span>
                  </button>
                  <button style={styles.controlBtn} aria-label="Speaker">
                    <SpeakerIcon />
                    <span style={styles.controlLabel}>Speaker</span>
                  </button>
                </div>
              )}

              {callState === 'ended' && (
                <div style={styles.endedRow}>
                  <button style={styles.replayBtn} aria-label="Replay" onClick={replay}>
                    <ReplayIcon />
                    <span style={styles.controlLabel}>Replay</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Hackathon demo banner */}
      <div data-testid="demo-banner" style={styles.demoBanner}>
        <p style={styles.demoBannerTitle}>🤖 AI Agent Demo — FIFA Reservation Call</p>
        <p style={styles.demoBannerSub}>Spanish conversation with live English captions</p>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    background: 'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #0d0d0d 100%)',
  },

  // Outer titanium/silver rim
  phoneOuter: {
    width: 390,
    height: 844,
    borderRadius: 55,
    padding: 3,
    background: 'linear-gradient(145deg, #8a8a8a 0%, #c8c8c8 30%, #6e6e6e 60%, #b0b0b0 80%, #7a7a7a 100%)',
    boxShadow: [
      '0 0 0 1px rgba(255,255,255,0.08)',
      '0 0 60px rgba(255,255,255,0.08)',
      '0 0 120px rgba(100,120,255,0.06)',
      '0 40px 80px rgba(0,0,0,0.8)',
      '0 20px 40px rgba(0,0,0,0.6)',
      'inset 0 1px 0 rgba(255,255,255,0.15)',
    ].join(', '),
    flexShrink: 0,
  },

  // Inner screen container with rounded screen bezel
  phoneInner: {
    width: '100%',
    height: '100%',
    borderRadius: 53,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },

  dynamicIsland: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 120,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#000',
    zIndex: 10,
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
  },

  statusBar: {
    position: 'relative',
    zIndex: 5,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingLeft: 24,
    paddingRight: 20,
    paddingBottom: 6,
    height: 54,
  },

  statusTime: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  },

  statusIcons: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  screenContent: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: 48,
  },

  frostedOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, #1c1c1e 0%, #0a0a0f 100%)',
  },

  callerSection: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
    border: '2px solid rgba(255,255,255,0.2)',
  },

  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    letterSpacing: 1,
  },

  callerName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    margin: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
    letterSpacing: -0.3,
  },

  callStatus: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '400',
    margin: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },

  waveform: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },

  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  bottomSection: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 12,
  },

  answerRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },

  answerBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#34c759',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    boxShadow: '0 4px 20px rgba(52, 199, 89, 0.5)',
    transition: 'background-color 0.15s ease',
  },

  answerLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },

  controls: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },

  controlBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.12)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    color: 'white',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'background-color 0.15s ease',
  },

  endCallBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e53935',
    boxShadow: '0 4px 20px rgba(229, 57, 53, 0.5)',
  },

  controlLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },

  endedRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },

  replayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    color: 'white',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'background-color 0.15s ease',
  },

  captionBox: {
    position: 'absolute',
    bottom: 140,
    left: '5%',
    width: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: 12,
    padding: '12px 16px',
    zIndex: 3,
    transition: 'opacity 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  speakerPill: {
    alignSelf: 'flex-start',
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: 10,
    marginBottom: 4,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    letterSpacing: 0.3,
  },

  captionSpanish: {
    color: 'white',
    fontSize: 14,
    fontStyle: 'italic',
    margin: 0,
    lineHeight: '1.4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },

  captionEnglish: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '400',
    margin: 0,
    lineHeight: '1.4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },

  demoBanner: {
    marginTop: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },

  demoBannerTitle: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
    margin: 0,
    textAlign: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },

  demoBannerSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '400',
    margin: 0,
    textAlign: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
  },
};
