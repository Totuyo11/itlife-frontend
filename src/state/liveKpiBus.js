// src/state/liveKpiBus.js
class LiveKpiBus {
  constructor() {
    this.listeners = new Set();
    this.state = {
      weightKg: null,
      weekSessions: null, // null => no sobreescribe Firestore
      streakDays: null,
      todayHasSession: false,
    };
  }

  subscribe(cb) {
    this.listeners.add(cb);
    cb(this.state); // empuja estado actual
    return () => this.listeners.delete(cb);
  }

  // === Peso ===
  setWeightKg(value) {
    const n = Number(value);
    this.state = {
      ...this.state,
      weightKg: Number.isFinite(n) && n > 0 ? n : null,
    };
    this.emit();
  }

  // === Sesiones semana ===
  setWeekSessions(value) {
    const n = Number(value);
    this.state = {
      ...this.state,
      weekSessions: Number.isFinite(n) && n >= 0 ? n : null,
    };
    this.emit();
  }
  bumpWeekSessions(delta = 1) {
    const curr = Number.isFinite(this.state.weekSessions)
      ? this.state.weekSessions
      : 0;
    this.state = { ...this.state, weekSessions: curr + delta };
    this.emit();
  }

  // === Racha ===
  setStreakDays(value) {
    const n = Number(value);
    this.state = {
      ...this.state,
      streakDays: Number.isFinite(n) && n >= 0 ? n : null,
    };
    this.emit();
  }
  bumpStreakForToday() {
    if (this.state.todayHasSession) return; // ya contada
    const curr = Number.isFinite(this.state.streakDays)
      ? this.state.streakDays
      : 0;
    this.state = {
      ...this.state,
      streakDays: Math.max(curr, 1),
      todayHasSession: true,
    };
    this.emit();
  }

  emit() {
    for (const cb of this.listeners) cb(this.state);
  }
}

export const liveKpiBus = new LiveKpiBus();
