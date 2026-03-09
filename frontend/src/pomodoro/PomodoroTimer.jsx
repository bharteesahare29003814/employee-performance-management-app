import React, { useState, useEffect, useRef, useCallback } from 'react';
import { recordSession, loadData, XP_PER_LEVEL } from './pomodoroData';
import { playStart, playEnd, playTick, playLevelUp } from './sounds';
import PomodoroStats from './PomodoroStats';
import './PomodoroTimer.css';

// SVG gradient IDs
const GRADIENT_ID = 'ring-progress-gradient';

// Gradient trail — how far behind the leading colour the trailing stop lags (0–1 ratio units)
const GRADIENT_TRAIL_OFFSET = 0.15;

// Particle system settings
const PARTICLE_COUNT      = 40;
const PARTICLE_MAX_RADIUS = 2.5;
const PARTICLE_MIN_RADIUS = 0.5;
const PARTICLE_MAX_VX     = 0.4;   // horizontal drift magnitude
const PARTICLE_MAX_VY     = 0.7;   // upward speed range
const PARTICLE_MIN_VY     = 0.15;  // minimum upward speed
const PARTICLE_MAX_ALPHA  = 0.6;   // initial alpha range high
const PARTICLE_MIN_ALPHA  = 0.2;   // initial alpha range low
const PARTICLE_FADE_RATE  = 0.0018; // alpha decrease per frame

/* ── constants ─────────────────────────────────────────────── */
const DURATION_OPTIONS = [15, 25, 35, 45]; // minutes

// SVG ring geometry
const RADIUS = 90;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* ── helpers ────────────────────────────────────────────────── */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Returns a CSS color string transitioning blue→yellow→red based on ratio (0=start, 1=done). */
function progressColor(ratio) {
  if (ratio < 0.5) {
    // blue (#2980b9) → yellow (#f1c40f)
    const t = ratio * 2;
    const r = Math.round(41 + t * (241 - 41));
    const g = Math.round(128 + t * (196 - 128));
    const b = Math.round(185 + t * (15 - 185));
    return `rgb(${r},${g},${b})`;
  } else {
    // yellow (#f1c40f) → red (#e74c3c)
    const t = (ratio - 0.5) * 2;
    const r = Math.round(241 + t * (231 - 241));
    const g = Math.round(196 + t * (76 - 196));
    const b = Math.round(15 + t * (60 - 15));
    return `rgb(${r},${g},${b})`;
  }
}

/* ── component ──────────────────────────────────────────────── */
export default function PomodoroTimer() {
  const [durationMin, setDurationMin] = useState(25);
  const [secondsLeft, setSecondsLeft]   = useState(25 * 60);
  const [running, setRunning]           = useState(false);
  const [hasStarted, setHasStarted]     = useState(false); // true once started, false after reset
  const [theme, setTheme]               = useState('light'); // light | dark | focus
  const [soundOn, setSoundOn]           = useState(true);
  const [showStats, setShowStats]       = useState(false);
  const [toast, setToast]               = useState(null); // { message, type }
  const [ripple, setRipple]             = useState(false);
  const [pomData, setPomData]           = useState(() => loadData());

  const totalSeconds = durationMin * 60;
  const elapsed = totalSeconds - secondsLeft;
  const ratio    = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const dashOffset = CIRCUMFERENCE * (1 - ratio);
  const ringColor = progressColor(ratio);

  const tickRef = useRef(0);
  const intervalRef = useRef(null);

  // Particle effect refs (canvas-based, focus theme only)
  const canvasRef     = useRef(null);
  const particlesRef  = useRef([]);
  const animFrameRef  = useRef(null);

  /* ── sound wrapper ──── */
  const sound = useCallback(
    (fn) => { if (soundOn) fn(); },
    [soundOn]
  );

  /* ── particle animation (focus theme) ── */
  useEffect(() => {
    if (!running || theme !== 'focus') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      particlesRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    canvas.width  = parent ? parent.offsetWidth  : 480;
    canvas.height = parent ? parent.offsetHeight : 560;

    const W = canvas.width;
    const H = canvas.height;

    // Initialise particles distributed around the canvas
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlesRef.current.push({
          x:     Math.random() * W,
          y:     Math.random() * H,
          r:     Math.random() * PARTICLE_MAX_RADIUS + PARTICLE_MIN_RADIUS,
          vx:    (Math.random() - 0.5) * PARTICLE_MAX_VX * 2,
          vy:    -(Math.random() * PARTICLE_MAX_VY + PARTICLE_MIN_VY),
          alpha: Math.random() * PARTICLE_MAX_ALPHA + PARTICLE_MIN_ALPHA,
        });
      }
    }

    function draw() {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      for (const p of particlesRef.current) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(88,166,255,${p.alpha})`;
        ctx.fill();

        p.x     += p.vx;
        p.y     += p.vy;
        p.alpha -= PARTICLE_FADE_RATE;

        // Reset particle when it drifts offscreen or fades out
        if (p.y < -5 || p.alpha <= 0) {
          p.x     = Math.random() * W;
          p.y     = H + 5;
          p.alpha = Math.random() * PARTICLE_MAX_ALPHA + PARTICLE_MIN_ALPHA;
          p.vy    = -(Math.random() * PARTICLE_MAX_VY + PARTICLE_MIN_VY);
          p.vx    = (Math.random() - 0.5) * PARTICLE_MAX_VX * 2;
        }
        if (p.x < 0)  p.x = W;
        if (p.x > W)  p.x = 0;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      particlesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, theme]);

  /* ── tick ────────────── */
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setHasStarted(false);
          setRipple(false);
          handleSessionComplete();
          return 0;
        }
        tickRef.current++;
        if (tickRef.current % 60 === 0) sound(playTick); // tick once per minute
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, sound]);

  /* ── session complete ─── */
  function handleSessionComplete() {
    sound(playEnd);
    const { data, leveledUp, newlyUnlocked } = recordSession(durationMin);
    setPomData(data);

    if (leveledUp) {
      sound(playLevelUp);
      showToast(`🎉 Level Up! You're now Level ${data.level}!`, 'success');
    } else if (newlyUnlocked.length > 0) {
      showToast(`🏅 Achievement unlocked: ${newlyUnlocked[0].label}`, 'achievement');
    } else {
      showToast('✅ Pomodoro complete! Great work!', 'success');
    }
  }

  /* ── toast ────────────── */
  function showToast(message, type = 'info') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  /* ── controls ─────────── */
  function handleStart() {
    sound(playStart);
    setRunning(true);
    setHasStarted(true);
    setRipple(true);
  }

  function handlePause() {
    setRunning(false);
    setRipple(false);
  }

  function handleReset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setHasStarted(false);
    setRipple(false);
    setSecondsLeft(durationMin * 60);
  }

  function handleDurationChange(min) {
    if (running) return; // ignore while running
    setDurationMin(min);
    setSecondsLeft(min * 60);
    setHasStarted(false);
  }

  /* ── XP bar ────────────── */
  const xpInLevel   = pomData.xp % XP_PER_LEVEL;
  const xpPercent   = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  const rootClasses = [
    'pomodoro-root',
    `theme-${theme}`,
    ripple && theme !== 'focus' ? 'ripple-bg' : '',
    ripple && theme === 'focus'  ? 'focus-pulse-bg' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {/* ── Particle canvas (focus theme only) ── */}
      {theme === 'focus' && (
        <canvas
          ref={canvasRef}
          className="particles-canvas"
          aria-hidden="true"
        />
      )}
      {/* ── Theme / sound bar ── */}
      <div className="pom-toolbar">
        <div className="theme-btns" role="group" aria-label="Theme">
          {['light', 'dark', 'focus'].map((t) => (
            <button
              key={t}
              className={`theme-btn ${theme === t ? 'active' : ''}`}
              onClick={() => setTheme(t)}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '🎯'}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <button
            className={`sound-btn ${soundOn ? 'on' : 'off'}`}
            onClick={() => setSoundOn((s) => !s)}
            title={soundOn ? 'Sound on' : 'Sound off'}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
          <button className="stats-btn" onClick={() => setShowStats((v) => !v)}>
            {showStats ? '⏱ Timer' : '📊 Stats'}
          </button>
        </div>
      </div>

      {showStats ? (
        <PomodoroStats data={pomData} theme={theme} />
      ) : (
        <>
          {/* ── Duration picker ── */}
          <div className="duration-picker" role="group" aria-label="Session duration">
            {DURATION_OPTIONS.map((m) => (
              <button
                key={m}
                className={`dur-btn${durationMin === m ? ' active' : ''}${running ? ' disabled' : ''}`}
                onClick={() => handleDurationChange(m)}
                disabled={running}
              >
                {m}m
              </button>
            ))}
          </div>

          {/* ── Circular ring ── */}
          <div className={`ring-wrapper${ripple ? ' pulsing' : ''}`}>
            <svg
              width={220}
              height={220}
              viewBox="0 0 220 220"
              aria-label={`Timer: ${formatTime(secondsLeft)} remaining`}
              role="img"
            >
              {/* Gradient definition – colours track the progress ratio */}
              <defs>
                <linearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor={progressColor(Math.max(0, ratio - GRADIENT_TRAIL_OFFSET))} />
                  <stop offset="100%" stopColor={ringColor} />
                </linearGradient>
              </defs>
              {/* Background ring */}
              <circle
                cx={110}
                cy={110}
                r={RADIUS}
                fill="none"
                stroke="currentColor"
                strokeWidth={STROKE}
                className="ring-track"
              />
              {/* Progress ring */}
              <circle
                cx={110}
                cy={110}
                r={RADIUS}
                fill="none"
                stroke={`url(#${GRADIENT_ID})`}
                strokeWidth={STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                className={theme === 'focus' && running ? 'ring-glow' : ''}
                style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
              />
              {/* Time text */}
              <text
                x={110}
                y={105}
                textAnchor="middle"
                dominantBaseline="middle"
                className="ring-time"
              >
                {formatTime(secondsLeft)}
              </text>
              <text
                x={110}
                y={135}
                textAnchor="middle"
                dominantBaseline="middle"
                className="ring-label"
              >
                {running ? 'Focus' : hasStarted ? 'Paused' : 'Ready'}
              </text>
            </svg>
          </div>

          {/* ── Controls ── */}
          <div className="pom-controls">
            {!running ? (
              <button className="ctrl-btn start-btn" onClick={handleStart} disabled={secondsLeft === 0}>
                {hasStarted ? '▶ Resume' : '▶ Start'}
              </button>
            ) : (
              <button className="ctrl-btn pause-btn" onClick={handlePause}>
                ⏸ Pause
              </button>
            )}
            <button className="ctrl-btn reset-btn" onClick={handleReset}>
              ↺ Reset
            </button>
          </div>

          {/* ── XP / Level bar ── */}
          <div className="xp-bar-section">
            <span className="xp-level">Level {pomData.level}</span>
            <div className="xp-bar-track" title={`${xpInLevel} / ${XP_PER_LEVEL} XP`}>
              <div
                className="xp-bar-fill"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="xp-text">{xpInLevel} / {XP_PER_LEVEL} XP</span>
          </div>
        </>
      )}

      {/* ── Toast notifications ── */}
      {toast && (
        <div className={`pom-toast toast-${toast.type}`} role="alert">
          {toast.message}
        </div>
      )}
    </div>
  );
}
