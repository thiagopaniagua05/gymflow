// Modo demo: los datos quedan en este navegador. Sirve para probar sin Firebase.
import { LIBRARY } from '../exercises.js';

const KEY = 'gymflow-demo-v1';
let mem = null;
const read = () => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : mem; } catch { return mem; } };
const write = (db) => { mem = db; try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sin storage */ } };

const lib = Object.fromEntries(LIBRARY.map((e) => [e.id, e]));
const entry = (id, sets) => ({ exId: id, name: lib[id].name, muscles: lib[id].muscles, ...(lib[id].unit ? { unit: lib[id].unit } : {}), sets: sets.map(([reps, kg]) => ({ reps, kg })) });

function demoData() {
  const DAY = 864e5;
  const at = (daysAgo, h = 20) => { const d = new Date(Date.now() - daysAgo * DAY); d.setHours(h, 5, 0, 0); return d.getTime(); };
  const push = (k) => [entry('bench', [[8, 70 + k], [8, 70 + k], [6, 75 + k]]), entry('incline-db', [[10, 26], [10, 26], [8, 28]]), entry('pushdown', [[12, 30], [12, 30], [10, 32]]), entry('lateral', [[15, 10], [15, 10], [12, 12]])];
  const pull = (k) => [entry('pullups', [[8, 0], [7, 0], [6, 0]]), entry('barbell-row', [[8, 60 + k], [8, 60 + k], [8, 60 + k]]), entry('bb-curl', [[10, 30], [10, 30], [8, 32]]), entry('face-pull', [[15, 20], [15, 20]])];
  const legs = (k) => [entry('squat', [[8, 90 + k], [8, 90 + k], [6, 95 + k]]), entry('rdl', [[10, 70], [10, 70], [10, 70]]), entry('leg-ext', [[12, 45], [12, 45]]), entry('calves', [[15, 60], [15, 60]]), entry('plank', [[60, 0], [45, 0]])];
  const w = (id, daysAgo, duration, entries, h) => ({ id, date: at(daysAgo, h), duration, entries, createdAt: at(daysAgo, h) });
  const workouts = [
    w('w1', 22, 58, push(0)), w('w2', 20, 61, pull(0)), w('w3', 18, 66, legs(0)),
    w('w4', 15, 60, push(2.5)), w('w5', 13, 63, pull(2.5)), w('w6', 11, 70, legs(5)),
    w('w7', 8, 62, push(5)), w('w8', 6, 59, pull(5)), w('w9', 4, 65, legs(5)),
    w('w10', 2, 64, push(7.5), 19), w('w11', 1, 57, pull(7.5)),
  ];
  const weights = [30, 23, 16, 9, 2].map((d, i) => ({ id: 'p' + i, date: at(d, 8), kg: [79.4, 79.1, 78.9, 78.7, 78.4][i] }));
  return {
    profile: { me: { name: 'Alex', goalDays: 3, usualTime: '20:00' } },
    workouts: Object.fromEntries(workouts.map((x) => [x.id, x])),
    weights: Object.fromEntries(weights.map((x) => [x.id, x])),
    plans: {}, photos: {}, exercises: {},
  };
}

export function createDemoStore() {
  let db = read() || demoData();
  write(db);
  const subs = new Set();
  let authCb = null;
  let user = null;
  try { user = JSON.parse(localStorage.getItem(KEY + '-user')); } catch { user = mem ? { uid: 'demo' } : null; }
  const emit = () => subs.forEach((f) => f());
  const commit = () => { write(db); setTimeout(emit, 0); };
  const list = (col) => Object.entries(db[col] || {}).map(([id, d]) => ({ ...d, id }));
  const setUser = (u) => { user = u; try { u ? localStorage.setItem(KEY + '-user', JSON.stringify(u)) : localStorage.removeItem(KEY + '-user'); } catch { /* */ } authCb && authCb(u); };

  return {
    mode: 'demo',
    onAuth(cb) { authCb = cb; setTimeout(() => cb(user), 0); return () => { authCb = null; }; },
    async login(email) { setUser({ uid: 'demo', email: email || 'demo@gymflow' }); },
    async logout() { setUser(null); },
    subscribe(col, cb) { const f = () => cb(list(col)); subs.add(f); setTimeout(f, 0); return () => subs.delete(f); },
    subscribeDoc(col, id, cb) { const f = () => cb(db[col]?.[id] ? { ...db[col][id], id } : null); subs.add(f); setTimeout(f, 0); return () => subs.delete(f); },
    newId() { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    async set(col, id, data) { db[col] = db[col] || {}; db[col][id] = data; commit(); },
    async update(col, id, data) { db[col][id] = { ...db[col][id], ...data }; commit(); },
    async remove(col, id) { delete db[col][id]; commit(); },
    async get(col, id) { return db[col]?.[id] ? { ...db[col][id], id } : null; },
    reset() { db = demoData(); commit(); },
  };
}
