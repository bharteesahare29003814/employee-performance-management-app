/**
 * Pomodoro data helpers – persisted to localStorage.
 *
 * Storage key: "pomodoro_data"
 * Schema:
 * {
 *   sessions: [{ date: 'YYYY-MM-DD', duration: number, completedAt: ISO-string }],
 *   xp: number,
 *   level: number,
 *   achievements: { [id]: true }
 * }
 */

const STORAGE_KEY = 'pomodoro_data';

export const XP_PER_SESSION = 50;
export const XP_PER_LEVEL  = 200;

/** XP awarded per completed session, scaled by duration in minutes. */
export const XP_BY_DURATION = { 15: 30, 25: 50, 35: 70, 45: 90 };

/** Returns the XP earned for a session of the given duration. */
export function xpForDuration(duration) {
  return XP_BY_DURATION[duration] ?? XP_PER_SESSION;
}

export const ACHIEVEMENTS = [
  {
    id: 'first_session',
    label: '🎯 First Pomodoro',
    description: 'Complete your first Pomodoro session',
    check: (sessions) => sessions.length >= 1,
    progress: (sessions) => ({ current: Math.min(sessions.length, 1), target: 1 }),
  },
  {
    id: 'five_sessions',
    label: '🔥 On Fire',
    description: 'Complete 5 Pomodoro sessions',
    check: (sessions) => sessions.length >= 5,
    progress: (sessions) => ({ current: Math.min(sessions.length, 5), target: 5 }),
  },
  {
    id: 'ten_sessions',
    label: '💪 Dedicated',
    description: 'Complete 10 Pomodoro sessions',
    check: (sessions) => sessions.length >= 10,
    progress: (sessions) => ({ current: Math.min(sessions.length, 10), target: 10 }),
  },
  {
    id: 'twenty_five_sessions',
    label: '⭐ Quarter Century',
    description: 'Complete 25 Pomodoro sessions',
    check: (sessions) => sessions.length >= 25,
    progress: (sessions) => ({ current: Math.min(sessions.length, 25), target: 25 }),
  },
  {
    id: 'ten_this_week',
    label: '📅 Weekly Warrior',
    description: 'Complete 10 sessions in one week',
    check: (sessions) => sessionsThisWeek(sessions) >= 10,
    progress: (sessions) => ({ current: Math.min(sessionsThisWeek(sessions), 10), target: 10 }),
  },
  {
    id: 'five_in_a_day',
    label: '🚀 Hyperfocus',
    description: 'Complete 5 sessions in a single day',
    check: (sessions) => {
      const counts = {};
      sessions.forEach((s) => { counts[s.date] = (counts[s.date] || 0) + 1; });
      return Object.values(counts).some((c) => c >= 5);
    },
    progress: (sessions) => {
      const counts = {};
      sessions.forEach((s) => { counts[s.date] = (counts[s.date] || 0) + 1; });
      const best = Object.values(counts).length ? Math.max(...Object.values(counts)) : 0;
      return { current: Math.min(best, 5), target: 5 };
    },
  },
  {
    id: 'three_consecutive_days',
    label: '🗓️ 3-Day Streak',
    description: 'Complete at least one session on 3 consecutive days',
    check: (sessions) => longestStreak(sessions) >= 3,
    progress: (sessions) => ({ current: Math.min(longestStreak(sessions), 3), target: 3 }),
  },
  {
    id: 'seven_consecutive_days',
    label: '🏆 Week Streak',
    description: 'Complete at least one session on 7 consecutive days',
    check: (sessions) => longestStreak(sessions) >= 7,
    progress: (sessions) => ({ current: Math.min(longestStreak(sessions), 7), target: 7 }),
  },
  {
    id: 'thirty_this_month',
    label: '📆 Monthly Hero',
    description: 'Complete 30 sessions in a month',
    check: (sessions) => sessionsInPeriod(sessions, 30) >= 30,
    progress: (sessions) => ({ current: Math.min(sessionsInPeriod(sessions, 30), 30), target: 30 }),
  },
];

function toDateStr(iso) {
  return iso.slice(0, 10);
}

function sessionsInPeriod(sessions, days) {
  const cutoff = new Date(Date.now() - days * 86400000);
  return sessions.filter((s) => new Date(s.completedAt) >= cutoff).length;
}

export function sessionsThisWeek(sessions) {
  return sessionsInPeriod(sessions, 7);
}

/** Total focus time in minutes across all sessions. */
export function totalFocusMinutes(sessions) {
  return sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
}

/** Highest number of sessions completed within any rolling 7-day window. */
export function bestWeekCount(sessions) {
  if (!sessions.length) return 0;
  let best = 0;
  for (const s of sessions) {
    const anchor = new Date(s.completedAt);
    const end = new Date(anchor.getTime() + 7 * 86400000);
    const count = sessions.filter((t) => {
      const d = new Date(t.completedAt);
      return d >= anchor && d < end;
    }).length;
    if (count > best) best = count;
  }
  return best;
}

function longestStreak(sessions) {
  if (!sessions.length) return 0;
  const dates = [...new Set(sessions.map((s) => toDateStr(s.completedAt)))].sort();
  let maxStreak = 1;
  let cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) {
      cur++;
      maxStreak = Math.max(maxStreak, cur);
    } else if (diff > 1) {
      cur = 1;
    }
  }
  return maxStreak;
}

export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: [], xp: 0, level: 1, achievements: {} };
    return JSON.parse(raw);
  } catch {
    return { sessions: [], xp: 0, level: 1, achievements: {} };
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Record a completed session, award XP, check achievements. */
export function recordSession(duration) {
  const data = loadData();
  const now = new Date().toISOString();
  data.sessions = [...data.sessions, { date: toDateStr(now), duration, completedAt: now }];

  const xpGained = xpForDuration(duration);
  const newXp = data.xp + xpGained;
  const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
  const leveledUp = newLevel > data.level;

  data.xp = newXp;
  data.level = newLevel;

  const newlyUnlocked = [];
  for (const ach of ACHIEVEMENTS) {
    if (!data.achievements[ach.id] && ach.check(data.sessions)) {
      data.achievements[ach.id] = true;
      newlyUnlocked.push(ach);
    }
  }

  saveData(data);
  return { data, leveledUp, newlyUnlocked, xpGained };
}

/** Returns sessions grouped by date for the last N days. */
export function sessionsPerDay(sessions, days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateStr(d.toISOString());
    const count = sessions.filter((s) => s.date === key).length;
    result.push({ date: key, count });
  }
  return result;
}

export function currentStreak(sessions) {
  if (!sessions.length) return 0;
  const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  const today = toDateStr(new Date().toISOString());
  const yesterday = toDateStr(
    new Date(Date.now() - 86400000).toISOString()
  );
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    if ((prev - curr) / 86400000 === 1) streak++;
    else break;
  }
  return streak;
}
