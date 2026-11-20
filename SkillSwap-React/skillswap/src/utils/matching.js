// Complementary-skill matching.
// A "perfect" match teaches something you want AND wants something you teach.

import { categoryOf, DAYS, TIMES } from '../data/skills.js';

const norm = (s) => s.trim().toLowerCase();

export function profileSlots(profile) {
  const slots = [];
  profile.days.forEach((day) => profile.times.forEach((time) => slots.push(`${day}-${time}`)));
  return slots;
}

export function userSlots(user) {
  return Object.entries(user.availability).flatMap(([day, times]) => times.map((t) => `${day}-${t}`));
}

function methodsCompatible(a, b) {
  return a === 'Both' || b === 'Both' || a === b;
}

function cityOf(location = '') {
  return norm(location.split(',')[0] || '');
}

export function computeMatch(profile, user) {
  const myTeach = profile.teach.map((s) => norm(s.name));
  const myLearn = profile.learn.map((s) => norm(s.name));

  const theyTeachForMe = user.teaches.filter((s) => myLearn.includes(norm(s.name)));
  const theyWantFromMe = user.wants.filter((s) => myTeach.includes(norm(s.name)));
  const sharedGoals = user.wants.filter((s) => myLearn.includes(norm(s.name)));

  let type = 'other';
  if (theyTeachForMe.length && theyWantFromMe.length) type = 'perfect';
  else if (theyWantFromMe.length) type = 'wants';
  else if (theyTeachForMe.length) type = 'teaches';
  else if (sharedGoals.length) type = 'buddy';

  const mine = profileSlots(profile);
  const overlap = userSlots(user).filter((slot) => mine.includes(slot));
  const methodOk = methodsCompatible(profile.method, user.method);
  const sameCity = profile.location && cityOf(profile.location) === cityOf(user.location);

  const base = { perfect: 70, wants: 40, teaches: 40, buddy: 25, other: 5 }[type];
  let score = base + Math.min(20, overlap.length * 7) + (methodOk ? 10 : 0) + (sameCity ? 5 : 0);
  if (type !== 'perfect') score = Math.min(score, 85);
  score = Math.min(100, score);

  const reasons = [];
  if (theyTeachForMe.length) reasons.push(`Teaches ${theyTeachForMe.map((s) => s.name).join(', ')}`);
  if (theyWantFromMe.length) reasons.push(`wants ${theyWantFromMe.map((s) => s.name).join(', ')}`);
  if (type === 'buddy') reasons.push(`Also learning ${sharedGoals.map((s) => s.name).join(', ')} · study buddy`);
  if (sameCity) reasons.push('same city');
  if (!reasons.length) reasons.push('No direct swap yet');

  const reason = reasons.join(' · ');

  return {
    type,
    score,
    perfect: type === 'perfect',
    reason: reason.charAt(0).toUpperCase() + reason.slice(1),
    theyTeachForMe: theyTeachForMe.map((s) => s.name),
    theyWantFromMe: theyWantFromMe.map((s) => s.name),
    overlap,
    methodOk,
    sameCity,
  };
}

export const MATCH_LABELS = {
  perfect: 'Match Found!',
  wants: 'Wants your skill',
  teaches: 'Teaches what you want',
  buddy: 'Study buddy',
  other: 'Explore',
};

export function userCategories(user) {
  return [...new Set(user.teaches.map((s) => categoryOf(s.name)))];
}

export function rankUsers(profile, users) {
  return users
    .map((user) => ({ user, match: computeMatch(profile, user) }))
    .sort((a, b) => b.match.score - a.match.score || b.user.rating - a.user.rating);
}

export function availabilityGrid(profile, user) {
  const mine = profileSlots(profile);
  const theirs = userSlots(user);
  return TIMES.map((time) => ({
    time,
    cells: DAYS.map((day) => {
      const key = `${day}-${time}`;
      const a = mine.includes(key);
      const b = theirs.includes(key);
      return { day, state: a && b ? 'both' : b ? 'them' : a ? 'you' : 'none' };
    }),
  }));
}

export function describeAvailability(availability) {
  const entries = DAYS.filter((d) => availability[d]?.length).map((d) => `${d} ${availability[d].map((t) => t.toLowerCase()).join('/')}`);
  return entries.length ? entries.join(', ') : 'Flexible';
}
