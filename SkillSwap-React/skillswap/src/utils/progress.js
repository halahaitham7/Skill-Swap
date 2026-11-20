// Derived learning statistics computed from the session history.

import { addDays, fromISODate, todayISO } from './dates.js';

export const LEARN_GOAL_SESSIONS = 20;

export function completedSessions(state) {
  return state.sessions.filter((s) => s.status === 'completed');
}

export function upcomingSessions(state) {
  const today = todayISO();
  return state.sessions
    .filter((s) => s.status === 'upcoming' && s.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

/** Sessions completed with a partner, including ones before the demo history. */
export function sessionsWithPartner(state, partnerId) {
  return (state.completedBefore[partnerId] || 0) + completedSessions(state).filter((s) => s.partnerId === partnerId).length;
}

export function learningProgress(state) {
  const done = Object.values(state.completedBefore).reduce((a, b) => a + b, 0) + completedSessions(state).length;
  return { done, goal: LEARN_GOAL_SESSIONS, percent: Math.min(100, Math.round((done / LEARN_GOAL_SESSIONS) * 100)) };
}

export function learningStats(state) {
  const completed = completedSessions(state);
  const minutes = completed.reduce((sum, s) => sum + Number(s.duration), 0);
  return {
    sessions: completed.length,
    hours: Math.round((minutes / 60) * 10) / 10,
    streak: state.profile.streakWeeks,
    reviews: completed.filter((s) => s.review).length,
  };
}

/** Hours per week for the last 8 weeks (7 stored weeks + this week from sessions). */
export function weeklyHours(state) {
  const weekAgo = addDays(new Date(), -7);
  const thisWeek = completedSessions(state)
    .filter((s) => fromISODate(s.date) >= weekAgo)
    .reduce((sum, s) => sum + Number(s.duration) / 60, 0);
  const history = state.profile.weeklyHours || [];
  return [...history.slice(-7), Math.round(thisWeek * 10) / 10];
}
