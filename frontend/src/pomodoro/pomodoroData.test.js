import {
  loadData,
  saveData,
  recordSession,
  sessionsPerDay,
  currentStreak,
  ACHIEVEMENTS,
  XP_PER_SESSION,
  XP_PER_LEVEL,
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
});
