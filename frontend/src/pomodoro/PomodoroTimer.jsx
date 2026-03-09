import React, { useState, useEffect, useRef, useCallback } from 'react';
import { recordSession, loadData, XP_PER_LEVEL } from './pomodoroData';
import { playStart, playEnd, playTick, playLevelUp } from './sounds';
import PomodoroStats from './PomodoroStats';
import './PomodoroTimer.css';

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

  /* ── sound wrapper ──── */
  const sound = useCallback(
    (fn) => { if (soundOn) fn(); },
    [soundOn]
  );

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
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
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
                stroke={ringColor}
                strokeWidth={STROKE}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                style={{ transition: running ? 'stroke-dashoffset 1s linear, stroke 1s linear' : 'none' }}
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
