import { useMemo, useState } from 'react';
import { GROUPS, GROUP_NAME } from '../exercises.js';
import * as L from '../logic.js';
import { Icon, BodyMap, groupTip, Avatar, fmtDate, fmtTime, kg } from '../components.jsx';

export default function Home({ data, now, demo, onRegister, onCalendar, onPlan }) {
  const { workouts, profile, plans, weights } = data;
  const goal = profile?.goalDays || 3;
  const week = useMemo(() => L.thisWeek(workouts, now), [workouts, now]);
  const { pct } = useMemo(() => L.muscleLoad(week), [week]);
  const att = L.attendance(workouts, now);
  const done = L.daysTrained(week);
  const streak = L.weekStreak(workouts, goal, now);
  const minutes = week.reduce((a, w) => a + (w.duration || 0), 0);
  const usual = L.usualTime(workouts, profile);
  const ws = L.weightSummary(weights, now);
  const next = L.nextWorkout({ plans, workouts, profile, now });
  const notifs = L.notifications({ workouts, profile, plans, now });
  const trainedGroups = GROUPS.filter((g) => pct[g] > 0).length;
  const [tip, setTip] = useState(null);
  const firstName = (profile?.name || '').split(' ')[0] || 'campeón';
  const rel = L.relDay(next.date, now);
  const remaining = Math.max(0, goal - done);

  return (
    <>
      <header className="top">
        <div>
          <div className="brand">GymFlow <span>· Resumen semanal</span></div>
          <div className="hello">¡Hola, {firstName}! 💪</div>
        </div>
        <div style={{ marginLeft: 'auto' }}><Avatar profile={profile} /></div>
      </header>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <div className="week-chip">📅 Esta semana · meta: {goal} días</div>
        {demo && <div className="week-chip demo">DEMO</div>}
      </div>

      <section className="card">
        <div className="card-h">
          <div className="card-t"><Icon.body />Músculos de la semana</div>
          <span className="pill">{trainedGroups} de 6 grupos</span>
        </div>
        <BodyMap pct={pct} onPick={setTip} />
        <div className="tip" style={{ color: tip && !pct[tip] ? 'var(--muted)' : undefined }}>
          {tip ? groupTip(tip, pct) : 'Tocá un músculo para ver el detalle'}
        </div>
        <div className="legend">Sin entrenar <div className="bar" /> Muy entrenado</div>
      </section>

      <section className="card">
        <div className="card-h">
          <div className="card-t"><Icon.bars />Asistencia semanal</div>
          {streak > 0 && <span className="pill">🔥 {streak} {streak === 1 ? 'semana' : 'semanas'}</span>}
        </div>
        <div className="att">
          {att.map((d) => (
            <div key={d.label} className={'day' + (d.trained ? ' on' : '') + (d.today ? ' today' : '') + (d.future ? ' future' : '')}>
              <div className="b" style={{ height: d.trained ? Math.min(80, Math.max(28, d.minutes * 0.75)) : 14 }} title={d.minutes ? `${d.minutes} min` : ''} />
              <span>{d.label}</span>
            </div>
          ))}
        </div>
        <div className="att-foot">
          <div className="big">{done}<small> / {goal} días</small></div>
          <div style={{ color: remaining ? 'var(--warn)' : 'var(--neon)', fontWeight: 700, textAlign: 'right' }}>
            {remaining ? `Te ${remaining === 1 ? 'falta 1' : `faltan ${remaining}`} para la meta` : '¡Meta cumplida! 🎯'}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-h">
          <div className="card-t"><Icon.pulse />Sectores trabajados</div>
          <span className="pill gray">% del objetivo</span>
        </div>
        {[...GROUPS].sort((a, b) => pct[b] - pct[a]).map((g) => (
          <div key={g} className={'sector' + (pct[g] < 30 ? ' low' : '')}>
            <div className="name">{GROUP_NAME[g]}</div>
            <div className="track"><div className="fill" style={{ width: `${pct[g]}%` }} /></div>
            <div className="pct">{pct[g]}%</div>
          </div>
        ))}
      </section>

      <div className="grid2">
        <section className="card mini">
          <div className="ic"><Icon.clock /></div>
          <div className="v">{L.fmtDuration(minutes)}</div>
          <div className="k">Tiempo esta semana</div>
          <div className="note">Horario habitual: {usual} hs</div>
        </section>
        <section className="card mini">
          <div className="ic"><Icon.scale /></div>
          <div className="v">{ws ? kg(ws.kg) : '—'}</div>
          <div className="k">Peso corporal</div>
          {ws?.change != null
            ? <div className={'note' + (ws.change > 0 ? ' up' : '')}>{ws.change > 0 ? '▲' : ws.change < 0 ? '▼' : '='} {kg(Math.abs(ws.change))} en el mes</div>
            : <div className="note" style={{ color: 'var(--muted)' }}>{ws ? `Registrado el ${fmtDate(ws.date)}` : 'Cargalo en Progresos'}</div>}
        </section>
      </div>

      <section className="card">
        <div className="card-h">
          <div className="card-t"><Icon.calendar />Próximo entrenamiento</div>
          {next.planned && <span className="pill">Programado</span>}
        </div>
        <div className="next">
          <div className="cal-ic">
            <div className="mo">{new Date(next.date).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '').toUpperCase()}</div>
            <div className="d">{new Date(next.date).getDate()}</div>
          </div>
          <div className="grow">
            <div className="when">{rel ? `${rel} (${L.DAY_NAMES[L.dowOf(next.date)].toUpperCase()})` : fmtDate(next.date, { weekday: 'long' })} · {fmtTime(next.date)} hs</div>
            <div className="what">{next.label}</div>
            {!next.planned && <div className="why">Sugerido: es lo que menos entrenaste esta semana</div>}
          </div>
        </div>
        <div className="btns">
          <button className="btn" onClick={next.planned ? onCalendar : () => onPlan(next)}>{next.planned ? 'Ver calendario' : 'Programarlo'}</button>
          <button className="btn primary" onClick={onRegister}>+ Registrar</button>
        </div>
      </section>

      <section className="card">
        <div className="card-h"><div className="card-t"><Icon.bell />Notificaciones</div></div>
        {notifs.map((n, i) => (
          <div key={i} className="notif">
            <div className="dot">{n.icon}</div>
            <div>{n.text}<small>{L.relDay(n.at, now) || fmtDate(n.at)}</small></div>
          </div>
        ))}
      </section>
    </>
  );
}
