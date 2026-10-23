import { GROUPS, GROUP_NAME, WEEKLY_TARGET } from './exercises.js';

const DAY = 864e5;
export const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
export const DAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/** Lunes 00:00 de la semana de `ts` (hora local). */
export function weekStart(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dow);
  return d.getTime();
}
export const dayStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const dowOf = (ts) => (new Date(ts).getDay() + 6) % 7;
const addDays = (ts, n) => { const d = new Date(ts); d.setDate(d.getDate() + n); return d.getTime(); };

export const inRange = (ws, from, to) => ws.filter((w) => w.date >= from && w.date < to);
export const thisWeek = (ws, now) => { const s = weekStart(now); return inRange(ws, s, addDays(s, 7)); };
const sorted = (ws) => [...ws].sort((a, b) => a.date - b.date);

export const setsCount = (w) => (w.entries || []).reduce((a, e) => a + (e.sets || []).length, 0);
export const e1rm = (kg, reps) => (kg > 0 && reps > 0 ? kg * (1 + Math.min(reps, 12) / 30) : 0);

/** Carga semanal por grupo: series ponderadas y % del objetivo. */
export function muscleLoad(ws) {
  const sets = Object.fromEntries(GROUPS.map((g) => [g, 0]));
  for (const w of ws) for (const e of w.entries || []) {
    const n = (e.sets || []).length;
    for (const [g, k] of Object.entries(e.muscles || {})) if (g in sets) sets[g] += n * k;
  }
  const pct = Object.fromEntries(GROUPS.map((g) => [g, Math.min(100, Math.round((sets[g] / WEEKLY_TARGET[g]) * 100))]));
  return { sets, pct };
}

/** Asistencia de la semana: un elemento por día. */
export function attendance(ws, now) {
  const s = weekStart(now);
  const today = dowOf(now);
  return DAY_LABELS.map((label, i) => {
    const from = addDays(s, i), to = addDays(s, i + 1);
    const day = inRange(ws, from, to);
    return { label, i, trained: day.length > 0, minutes: day.reduce((a, w) => a + (w.duration || 0), 0), today: i === today, future: i > today };
  });
}
export const daysTrained = (ws) => new Set(ws.map((w) => dayStart(w.date))).size;

/** Semanas seguidas cumpliendo la meta (la actual cuenta si ya se cumplió). */
export function weekStreak(ws, goal, now) {
  let s = weekStart(now), n = 0;
  if (daysTrained(inRange(ws, s, addDays(s, 7))) >= goal) n++;
  for (let i = 0; i < 520; i++) {
    s = addDays(s, -7);
    if (daysTrained(inRange(ws, s, addDays(s, 7))) >= goal) n++; else break;
  }
  return n;
}

/** Horario habitual: el del perfil, o la hora de inicio más frecuente. */
export function usualTime(ws, profile) {
  if (profile?.usualTime) return profile.usualTime;
  if (!ws.length) return '20:00';
  const count = {};
  for (const w of ws.slice(-20)) { const h = new Date(w.date).getHours(); count[h] = (count[h] || 0) + 1; }
  const h = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
  return `${String(h).padStart(2, '0')}:00`;
}

export const fmtDuration = (min) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}'` : `${min}'`);

/** Historial por ejercicio y récords personales. */
export function exerciseHistory(ws) {
  const map = {};
  const prEvents = [];
  for (const w of sorted(ws)) for (const e of w.entries || []) {
    const key = e.exId || e.name;
    const valid = (e.sets || []).filter((s) => s.reps > 0);
    if (!valid.length) continue;
    const top = valid.reduce((b, s) => ((s.kg || 0) > (b.kg || 0) || ((s.kg || 0) === (b.kg || 0) && s.reps > b.reps) ? s : b), valid[0]);
    const best1 = Math.max(...valid.map((s) => e1rm(s.kg || 0, s.reps)));
    const volume = valid.reduce((a, s) => a + (s.kg || 0) * s.reps, 0);
    const maxReps = Math.max(...valid.map((s) => s.reps));
    const h = (map[key] = map[key] || { key, name: e.name, muscles: e.muscles, unit: e.unit, sessions: [], bestKg: 0, bestReps: 0, best1rm: 0, bestAt: null });
    h.sessions.push({ date: w.date, workoutId: w.id, topKg: top.kg || 0, topReps: top.reps, e1rm: best1, volume, sets: valid.length, maxReps });
    const isPR = (top.kg || 0) > 0 ? (top.kg || 0) > h.bestKg : maxReps > h.bestReps;
    if (isPR && h.sessions.length > 1) prEvents.push({ date: w.date, name: e.name, kg: top.kg || 0, reps: (top.kg || 0) > 0 ? top.reps : maxReps, unit: e.unit });
    if ((top.kg || 0) > h.bestKg) { h.bestKg = top.kg; h.bestAt = w.date; }
    h.bestReps = Math.max(h.bestReps, maxReps);
    h.best1rm = Math.max(h.best1rm, best1);
  }
  return { byExercise: map, prEvents: prEvents.reverse() };
}

/** Lo último que hiciste en un ejercicio (para mostrarlo al registrar). */
export function lastTimeOf(ws, key, exceptId) {
  for (const w of sorted(ws).reverse()) {
    if (w.id === exceptId) continue;
    const e = (w.entries || []).find((x) => (x.exId || x.name) === key);
    if (e) return { date: w.date, sets: e.sets };
  }
  return null;
}

/** Grupos menos trabajados en la semana → sugerencia de entrenamiento. */
export function suggestFocus(pct) {
  // Empates: primero los grupos grandes (abdomen casi nunca es un entrenamiento entero)
  const PRIORITY = ['piernas', 'espalda', 'pectorales', 'hombros', 'brazos', 'abdomen'];
  const order = [...PRIORITY].sort((a, b) => pct[a] - pct[b] || PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
  const [a, b] = order;
  if (a === 'piernas') return { groups: ['piernas'], label: 'Pierna completa' };
  if (pct[b] < 40 && b !== 'piernas' && b !== 'abdomen') return { groups: [a, b], label: `${GROUP_NAME[a]} y ${GROUP_NAME[b]}` };
  return { groups: [a], label: GROUP_NAME[a] };
}

/** Próximo entrenamiento: el programado, o una sugerencia. */
export function nextWorkout({ plans = [], workouts, profile, now }) {
  const upcoming = plans.filter((p) => p.date >= now - 2 * 3600e3 && !p.done).sort((a, b) => a.date - b.date)[0];
  const { pct } = muscleLoad(thisWeek(workouts, now));
  if (upcoming) return { date: upcoming.date, label: upcoming.focus || suggestFocus(pct).label, planned: true, plan: upcoming };
  const [hh, mm] = usualTime(workouts, profile).split(':').map(Number);
  const trainedToday = workouts.some((w) => dayStart(w.date) === dayStart(now));
  let d = new Date(now); d.setHours(hh, mm || 0, 0, 0);
  if (trainedToday || d.getTime() < now - 3600e3) d = new Date(addDays(d.getTime(), 1));
  return { date: d.getTime(), label: suggestFocus(pct).label, planned: false };
}

export function relDay(ts, now) {
  const diff = Math.round((dayStart(ts) - dayStart(now)) / DAY);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff === -1) return 'Ayer';
  return null;
}

/** Peso actual y variación en ~30 días. */
export function weightSummary(weights, now) {
  const ws = [...weights].sort((a, b) => a.date - b.date);
  if (!ws.length) return null;
  const last = ws[ws.length - 1];
  const ref = [...ws].reverse().find((w) => w.date <= now - 28 * DAY) || ws[0];
  return { kg: last.kg, date: last.date, change: ref === last ? null : +(last.kg - ref.kg).toFixed(1) };
}

/** Notificaciones motivadoras calculadas a partir de los datos. */
export function notifications({ workouts, profile, plans, now }) {
  const out = [];
  const ws = sorted(workouts);
  const goal = profile?.goalDays || 3;
  const week = thisWeek(ws, now);
  const done = daysTrained(week);
  const last = ws[ws.length - 1];
  const { prEvents } = exerciseHistory(ws);
  const next = nextWorkout({ plans, workouts: ws, profile, now });

  if (last) {
    const days = Math.floor((dayStart(now) - dayStart(last.date)) / DAY);
    if (days >= 2) out.push({ icon: '⏰', text: `¡Llevás ${days} días sin ir al gym! Hoy toca ${next.label.toLowerCase()}.`, at: now });
  } else {
    out.push({ icon: '👋', text: 'Registrá tu primer entrenamiento con el botón verde de abajo.', at: now });
  }
  const remainingDays = 7 - dowOf(now);
  if (done >= goal) out.push({ icon: '🎯', text: `¡Meta cumplida! ${done} de ${goal} días esta semana.`, at: now });
  else if (goal - done >= remainingDays && remainingDays > 0) out.push({ icon: '⚠️', text: `Para cumplir la meta tenés que ir ${goal - done === 1 ? '1 día más' : `${goal - done} días más`} esta semana.`, at: now });

  for (const p of prEvents.filter((p) => p.date >= now - 4 * DAY).slice(0, 2)) {
    out.push({ icon: '🏆', text: `Nuevo récord personal: ${p.name} ${p.kg > 0 ? `${p.kg} kg × ${p.reps}` : `${p.reps} ${p.unit || 'reps'}`}`, at: p.date, bold: true });
  }
  if (last && last.date >= now - 2 * DAY) {
    const sets = setsCount(last);
    const { pct } = muscleLoad([last]);
    const top = Object.entries(pct).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => GROUP_NAME[g].toLowerCase());
    out.push({ icon: '🎉', text: `¡Gran entrenamiento! ${sets} series${top.length ? ` de ${top.join(' y ')}` : ''}${last.duration ? ` en ${last.duration} minutos` : ''}.`, at: last.date });
  }
  return out;
}

/** Calendario: archivo .ics y enlace de Google Calendar para un entrenamiento. */
const icsDate = (ts) => new Date(ts).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export function icsFor(plans) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GymFlow//ES', 'CALSCALE:GREGORIAN'];
  for (const p of plans) {
    lines.push('BEGIN:VEVENT', `UID:${p.id || p.date}@gymflow`, `DTSTAMP:${icsDate(Date.now())}`,
      `DTSTART:${icsDate(p.date)}`, `DTEND:${icsDate(p.date + (p.duration || 60) * 60000)}`,
      `SUMMARY:🏋️ GymFlow: ${p.focus || 'Entrenamiento'}`, 'DESCRIPTION:Entrenamiento programado en GymFlow',
      'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Entrenamiento en 30 minutos', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
export function googleCalUrl(p) {
  const q = new URLSearchParams({
    action: 'TEMPLATE', text: `🏋️ GymFlow: ${p.focus || 'Entrenamiento'}`,
    dates: `${icsDate(p.date)}/${icsDate(p.date + (p.duration || 60) * 60000)}`, details: 'Entrenamiento programado en GymFlow',
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}
