import {
  loadData,
  saveData,
  recordSession,
  sessionsPerDay,
  currentStreak,
  ACHIEVEMENTS,
  XP_PER_SESSION,
  XP_PER_LEVEL,
  XP_BY_DURATION,
  xpForDuration,
  totalFocusMinutes,
  bestWeekCount,
  sessionsThisWeek,
} from '../pomodoro/pomodoroData';

// localStorage mock
const store = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => delete store[k],
    clear:      () => Object.keys(store).forEach((k) => delete store[k]),
  },
});

beforeEach(() => window.localStorage.clear());

describe('loadData', () => {
  test('returns defaults when nothing is stored', () => {
    const d = loadData();
    expect(d.sessions).toEqual([]);
    expect(d.xp).toBe(0);
    expect(d.level).toBe(1);
    expect(d.achievements).toEqual({});
  });

  test('returns stored data', () => {
    const data = { sessions: [], xp: 100, level: 1, achievements: {} };
    saveData(data);
    expect(loadData()).toEqual(data);
  });
});

describe('recordSession', () => {
  test('awards XP_PER_SESSION xp per session', () => {
    const { data } = recordSession(25);
    expect(data.xp).toBe(XP_PER_SESSION);
  });

  test('accumulates xp across multiple sessions', () => {
    recordSession(25);
    const { data } = recordSession(25);
    expect(data.xp).toBe(XP_PER_SESSION * 2);
  });

  test('levels up when xp crosses XP_PER_LEVEL', () => {
    const sessionsNeeded = Math.ceil(XP_PER_LEVEL / XP_PER_SESSION);
    let result;
    for (let i = 0; i < sessionsNeeded; i++) {
      result = recordSession(25);
    }
    expect(result.leveledUp).toBe(true);
    expect(result.data.level).toBeGreaterThan(1);
  });

  test('records session with today date and duration', () => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = recordSession(35);
    const last = data.sessions[data.sessions.length - 1];
    expect(last.date).toBe(today);
    expect(last.duration).toBe(35);
  });

  test('unlocks first_session achievement on first complete', () => {
    const { newlyUnlocked } = recordSession(25);
    expect(newlyUnlocked.some((a) => a.id === 'first_session')).toBe(true);
  });

  test('does not re-unlock an already-unlocked achievement', () => {
    recordSession(25); // unlocks first_session
    const { newlyUnlocked } = recordSession(25);
    expect(newlyUnlocked.some((a) => a.id === 'first_session')).toBe(false);
  });

  test('returns xpGained equal to xpForDuration of the session', () => {
    const { xpGained } = recordSession(35);
    expect(xpGained).toBe(xpForDuration(35));
  });

  test('awards more XP for a longer session (45m vs 15m)', () => {
    expect(xpForDuration(45)).toBeGreaterThan(xpForDuration(15));
  });
});

describe('sessionsPerDay', () => {
  test('returns an array of length equal to requested days', () => {
    const result = sessionsPerDay([], 7);
    expect(result).toHaveLength(7);
  });

  test('counts sessions correctly for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const sessions = [{ date: today, completedAt: new Date().toISOString(), duration: 25 }];
    const result = sessionsPerDay(sessions, 7);
    const todayEntry = result[result.length - 1];
    expect(todayEntry.count).toBe(1);
  });
});

describe('currentStreak', () => {
  test('returns 0 for no sessions', () => {
    expect(currentStreak([])).toBe(0);
  });

  test('returns 1 for a single session today', () => {
    const today = new Date().toISOString();
    expect(currentStreak([{ date: today.slice(0, 10), completedAt: today, duration: 25 }])).toBe(1);
  });
});

describe('ACHIEVEMENTS', () => {
  test('all achievements have id, label, description, check', () => {
    for (const ach of ACHIEVEMENTS) {
      expect(ach.id).toBeTruthy();
      expect(ach.label).toBeTruthy();
      expect(ach.description).toBeTruthy();
      expect(typeof ach.check).toBe('function');
    }
  });

  test('all achievements have a progress function', () => {
    for (const ach of ACHIEVEMENTS) {
      expect(typeof ach.progress).toBe('function');
    }
  });

  test('five_sessions achievement requires 5 sessions', () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === 'five_sessions');
    const makeSessions = (n) =>
      Array.from({ length: n }, (_, i) => ({
        date: `2024-01-0${i + 1}`,
        completedAt: `2024-01-0${i + 1}T10:00:00Z`,
        duration: 25,
      }));
    expect(ach.check(makeSessions(4))).toBe(false);
    expect(ach.check(makeSessions(5))).toBe(true);
  });

  test('twenty_five_sessions achievement requires 25 sessions', () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === 'twenty_five_sessions');
    const make = (n) => Array.from({ length: n }, (_, i) => ({
      date: `2024-01-01`,
      completedAt: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`,
      duration: 25,
    }));
    expect(ach.check(make(24))).toBe(false);
    expect(ach.check(make(25))).toBe(true);
  });

  test('five_in_a_day achievement requires 5 sessions on the same day', () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === 'five_in_a_day');
    const make = (n) => Array.from({ length: n }, (_, i) => ({
      date: '2024-01-01',
      completedAt: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`,
      duration: 25,
    }));
    expect(ach.check(make(4))).toBe(false);
    expect(ach.check(make(5))).toBe(true);
  });

  test('progress function returns current and target', () => {
    const ach = ACHIEVEMENTS.find((a) => a.id === 'five_sessions');
    const sessions = Array.from({ length: 3 }, (_, i) => ({
      date: `2024-01-0${i + 1}`,
      completedAt: `2024-01-0${i + 1}T10:00:00Z`,
      duration: 25,
    }));
    const { current, target } = ach.progress(sessions);
    expect(current).toBe(3);
    expect(target).toBe(5);
  });
});

describe('xpForDuration', () => {
  test('returns 30 XP for 15-min session', () => {
    expect(xpForDuration(15)).toBe(30);
  });

  test('returns 50 XP for 25-min session', () => {
    expect(xpForDuration(25)).toBe(50);
  });

  test('returns 70 XP for 35-min session', () => {
    expect(xpForDuration(35)).toBe(70);
  });

  test('returns 90 XP for 45-min session', () => {
    expect(xpForDuration(45)).toBe(90);
  });

  test('falls back to XP_PER_SESSION for unknown duration', () => {
    expect(xpForDuration(20)).toBe(XP_PER_SESSION);
  });

  test('XP_BY_DURATION covers all standard durations', () => {
    expect(Object.keys(XP_BY_DURATION).map(Number)).toEqual(expect.arrayContaining([15, 25, 35, 45]));
  });
});

describe('totalFocusMinutes', () => {
  test('returns 0 for no sessions', () => {
    expect(totalFocusMinutes([])).toBe(0);
  });

  test('sums up duration across sessions', () => {
    const sessions = [
      { date: '2024-01-01', completedAt: '2024-01-01T10:00:00Z', duration: 25 },
      { date: '2024-01-02', completedAt: '2024-01-02T10:00:00Z', duration: 35 },
      { date: '2024-01-03', completedAt: '2024-01-03T10:00:00Z', duration: 15 },
    ];
    expect(totalFocusMinutes(sessions)).toBe(75);
  });
});

describe('bestWeekCount', () => {
  test('returns 0 for no sessions', () => {
    expect(bestWeekCount([])).toBe(0);
  });

  test('returns the correct best-week count', () => {
    const sessions = [
      { completedAt: '2024-01-01T10:00:00Z', date: '2024-01-01', duration: 25 },
      { completedAt: '2024-01-02T10:00:00Z', date: '2024-01-02', duration: 25 },
      { completedAt: '2024-01-03T10:00:00Z', date: '2024-01-03', duration: 25 },
      // gap
      { completedAt: '2024-02-01T10:00:00Z', date: '2024-02-01', duration: 25 },
    ];
    expect(bestWeekCount(sessions)).toBe(3);
  });
});

describe('sessionsThisWeek', () => {
  test('returns 0 for no sessions', () => {
    expect(sessionsThisWeek([])).toBe(0);
  });

  test('counts sessions within the last 7 days', () => {
    const now = new Date().toISOString();
    const sessions = [
      { date: now.slice(0, 10), completedAt: now, duration: 25 },
    ];
    expect(sessionsThisWeek(sessions)).toBe(1);
  });

  test('excludes sessions older than 7 days', () => {
    const old = new Date(Date.now() - 8 * 86400000).toISOString();
    const sessions = [
      { date: old.slice(0, 10), completedAt: old, duration: 25 },
    ];
    expect(sessionsThisWeek(sessions)).toBe(0);
  });
});
