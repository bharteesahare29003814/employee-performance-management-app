import { render, screen, fireEvent, act } from '@testing-library/react';

// ── localStorage mock ───────────────────────────────────────────
const store = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k) => delete store[k],
    clear:      () => Object.keys(store).forEach((k) => delete store[k]),
  },
});

// ── AudioContext mock ───────────────────────────────────────────
window.AudioContext = class {
  createOscillator() {
    return { connect: jest.fn(), start: jest.fn(), stop: jest.fn(),
             frequency: { setValueAtTime: jest.fn() }, type: 'sine' };
  }
  createGain() {
    return { connect: jest.fn(), gain: { setValueAtTime: jest.fn(),
             exponentialRampToValueAtTime: jest.fn() } };
  }
  get currentTime() { return 0; }
  get destination() { return {}; }
};

import PomodoroTimer from '../pomodoro/PomodoroTimer';

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('PomodoroTimer', () => {
  test('renders the timer display with default 25-minute countdown', () => {
    render(<PomodoroTimer />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  test('shows Ready label initially', () => {
    render(<PomodoroTimer />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  test('renders all duration options', () => {
    render(<PomodoroTimer />);
    expect(screen.getByText('15m')).toBeInTheDocument();
    expect(screen.getByText('25m')).toBeInTheDocument();
    expect(screen.getByText('35m')).toBeInTheDocument();
    expect(screen.getByText('45m')).toBeInTheDocument();
  });

  test('changing duration updates the timer display', () => {
    render(<PomodoroTimer />);
    fireEvent.click(screen.getByText('15m'));
    expect(screen.getByText('15:00')).toBeInTheDocument();
    fireEvent.click(screen.getByText('45m'));
    expect(screen.getByText('45:00')).toBeInTheDocument();
  });

  test('Start button appears and changes to Pause when clicked', () => {
    render(<PomodoroTimer />);
    const startBtn = screen.getByText(/▶ Start/i);
    expect(startBtn).toBeInTheDocument();
    act(() => fireEvent.click(startBtn));
    expect(screen.getByText(/⏸ Pause/i)).toBeInTheDocument();
  });

  test('shows Focus label while running', () => {
    render(<PomodoroTimer />);
    act(() => fireEvent.click(screen.getByText(/▶ Start/i)));
    expect(screen.getByText('Focus')).toBeInTheDocument();
  });

  test('Pause stops the timer and restores Start/Resume', () => {
    render(<PomodoroTimer />);
    act(() => fireEvent.click(screen.getByText(/▶ Start/i)));
    act(() => fireEvent.click(screen.getByText(/⏸ Pause/i)));
    expect(screen.getByText(/▶ Resume/i)).toBeInTheDocument();
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  test('Reset restores the full duration', () => {
    render(<PomodoroTimer />);
    act(() => fireEvent.click(screen.getByText(/▶ Start/i)));
    // advance 10 seconds
    act(() => jest.advanceTimersByTime(10000));
    act(() => fireEvent.click(screen.getByText(/↺ Reset/i)));
    expect(screen.getByText('25:00')).toBeInTheDocument();
  });

  test('cannot change duration while timer is running', () => {
    render(<PomodoroTimer />);
    act(() => fireEvent.click(screen.getByText(/▶ Start/i)));
    const btn15 = screen.getByText('15m');
    expect(btn15).toBeDisabled();
  });

  test('duration buttons are enabled after pausing', () => {
    render(<PomodoroTimer />);
    act(() => fireEvent.click(screen.getByText(/▶ Start/i)));
    act(() => fireEvent.click(screen.getByText(/⏸ Pause/i)));
    const btn15 = screen.getByText('15m');
    expect(btn15).not.toBeDisabled();
  });

  test('theme buttons switch between light/dark/focus', () => {
    const { container } = render(<PomodoroTimer />);
    const root = container.querySelector('.pomodoro-root');
    expect(root.classList).toContain('theme-light');
    fireEvent.click(screen.getByTitle('Dark'));
    expect(root.classList).toContain('theme-dark');
    fireEvent.click(screen.getByTitle('Focus'));
    expect(root.classList).toContain('theme-focus');
  });

  test('sound toggle button is present', () => {
    render(<PomodoroTimer />);
    expect(screen.getByTitle('Sound on')).toBeInTheDocument();
  });

  test('Stats button toggles the stats view', () => {
    render(<PomodoroTimer />);
    expect(screen.queryByText(/Last 7 Days/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('📊 Stats'));
    expect(screen.getByText(/Last 7 Days/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('⏱ Timer'));
    expect(screen.queryByText(/Last 7 Days/)).not.toBeInTheDocument();
  });

  test('shows XP bar with Level 1 initially', () => {
    render(<PomodoroTimer />);
    expect(screen.getByText('Level 1')).toBeInTheDocument();
  });

  test('timer counts down by 1 second per tick', () => {
    render(<PomodoroTimer />);
    act(() => fireEvent.click(screen.getByText(/▶ Start/i)));
    act(() => jest.advanceTimersByTime(3000));
    expect(screen.getByText('24:57')).toBeInTheDocument();
  });
});
