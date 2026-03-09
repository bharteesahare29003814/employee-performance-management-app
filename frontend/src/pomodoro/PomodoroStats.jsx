import React from 'react';
import { ACHIEVEMENTS, sessionsPerDay, currentStreak, XP_PER_LEVEL } from './pomodoroData';

const WEEK_BAR_MAX_HEIGHT  = 80; // px – tallest bar in the 7-day chart
const MONTH_BAR_MAX_HEIGHT = 60; // px – tallest bar in the 30-day chart
const BAR_MIN_EXTRA_HEIGHT = 4;  // px – minimum extra height for non-zero bars

export default function PomodoroStats({ data, theme }) {
  const { sessions = [], xp = 0, level = 1, achievements = {} } = data;

  const weekData   = sessionsPerDay(sessions, 7);
  const monthData  = sessionsPerDay(sessions, 30);
  const maxWeek    = Math.max(...weekData.map((d) => d.count), 1);
  const maxMonth   = Math.max(...monthData.map((d) => d.count), 1);
  const streak     = currentStreak(sessions);
  const totalDone  = sessions.length;
  const xpInLevel  = xp % XP_PER_LEVEL;
  const xpPct      = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  function shortDate(iso) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <div className="pom-stats">
      {/* ── Summary row ── */}
      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-num">{totalDone}</span>
          <span className="stat-lbl">Total Sessions</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{streak}</span>
          <span className="stat-lbl">Day Streak 🔥</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">Lv {level}</span>
          <span className="stat-lbl">{xp} XP total</span>
        </div>
      </div>

      {/* ── XP bar ── */}
      <div className="stats-xp">
        <span className="xp-level-label">Level {level}</span>
        <div className="xp-bar-track">
          <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
        </div>
        <span className="xp-level-label">Level {level + 1}</span>
      </div>

      {/* ── 7-day chart ── */}
      <h3 className="chart-title">Last 7 Days</h3>
      <div className="bar-chart">
        {weekData.map((d) => (
          <div className="bar-col" key={d.date}>
            <span className="bar-value">{d.count > 0 ? d.count : ''}</span>
            <div
              className="bar"
              style={{ height: `${(d.count / maxWeek) * WEEK_BAR_MAX_HEIGHT + (d.count > 0 ? BAR_MIN_EXTRA_HEIGHT : 0)}px` }}
              title={`${d.date}: ${d.count} session(s)`}
            />
            <span className="bar-label">{shortDate(d.date)}</span>
          </div>
        ))}
      </div>

      {/* ── 30-day chart ── */}
      <h3 className="chart-title">Last 30 Days</h3>
      <div className="bar-chart bar-chart-month">
        {monthData.map((d) => (
          <div className="bar-col bar-col-sm" key={d.date}>
            <div
              className="bar"
              style={{ height: `${(d.count / maxMonth) * MONTH_BAR_MAX_HEIGHT + (d.count > 0 ? BAR_MIN_EXTRA_HEIGHT : 0)}px` }}
              title={`${d.date}: ${d.count}`}
            />
          </div>
        ))}
      </div>

      {/* ── Achievements ── */}
      <h3 className="chart-title">Achievements</h3>
      <div className="achievements-grid">
        {ACHIEVEMENTS.map((ach) => {
          const unlocked = !!achievements[ach.id];
          return (
            <div
              key={ach.id}
              className={`badge ${unlocked ? 'badge-unlocked' : 'badge-locked'}`}
              title={ach.description}
            >
              <span className="badge-label">{ach.label}</span>
              {!unlocked && <span className="badge-desc">{ach.description}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
