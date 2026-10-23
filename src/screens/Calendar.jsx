import { useMemo, useState } from 'react';
import { GROUP_NAME, GROUPS } from '../exercises.js';
import * as L from '../logic.js';
import { Icon, Sheet, Confirm, fmtDate, fmtTime, toDateInput } from '../components.jsx';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function downloadIcs(plans) {
  const blob = new Blob([L.icsFor(plans)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gymflow.ics';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export function CalendarButtons({ plan }) {
  return (
    <div className="btns" style={{ marginTop: 10 }}>
      <a className="btn small" href={L.googleCalUrl(plan)} target="_blank" rel="noreferrer">📅 Google Calendar</a>
      <button className="btn small" onClick={() => downloadIcs([plan])}>🍎 Calendario (.ics)</button>
    </div>
  );
}

export default function Calendar({ store, data, now, onOpenWorkout, planDraft, onPlanDraftUsed, toast }) {
  const [month, setMonth] = useState(() => { const d = new Date(now); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); });
  const [sel, setSel] = useState(L.dayStart(now));
  const [planning, setPlanning] = useState(planDraft || null);
  const [delPlan, setDelPlan] = useState(null);

  const m = new Date(month);
  const gridStart = L.weekStart(month);
  const days = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(d.getDate() + i); return d.getTime(); });
  const byDay = useMemo(() => {
    const map = {};
    for (const w of data.workouts) (map[L.dayStart(w.date)] = map[L.dayStart(w.date)] || { w: [], p: [] }).w.push(w);
    for (const p of data.plans) (map[L.dayStart(p.date)] = map[L.dayStart(p.date)] || { w: [], p: [] }).p.push(p);
    return map;
  }, [data]);
  const monthCount = data.workouts.filter((w) => new Date(w.date).getMonth() === m.getMonth() && new Date(w.date).getFullYear() === m.getFullYear()).length;
  const selInfo = byDay[sel] || { w: [], p: [] };
  const upcoming = data.plans.filter((p) => p.date >= now && !p.done).sort((a, b) => a.date - b.date);
  const shift = (n) => setMonth(new Date(m.getFullYear(), m.getMonth() + n, 1).getTime());

  return (
    <>
      <div className="row">
        <div className="grow"><div className="page-title">Calendario</div><div className="page-sub">{monthCount} entrenamientos este mes</div></div>
        <button className="btn primary small" onClick={() => setPlanning({ date: sel >= L.dayStart(now) ? sel : L.dayStart(now) })}>+ Programar</button>
      </div>

      <section className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Mes anterior"><Icon.back /></button>
          <div className="grow center" style={{ fontWeight: 800, textTransform: 'capitalize' }}>{MONTHS[m.getMonth()]} {m.getFullYear()}</div>
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Mes siguiente"><Icon.chevron /></button>
        </div>
        <div className="cal-grid">
          {L.DAY_LABELS.map((d) => <div key={d} className="dh">{d}</div>)}
          {days.map((d) => {
            const info = byDay[d];
            const cls = ['cal-day', new Date(d).getMonth() !== m.getMonth() && 'other', info?.w.length && 'trained',
              info?.p.some((p) => !p.done) && 'planned', d === L.dayStart(now) && 'today', d === sel && 'sel'].filter(Boolean).join(' ');
            return <button key={d} className={cls} onClick={() => setSel(d)}>{new Date(d).getDate()}</button>;
          })}
        </div>
        <div className="row muted" style={{ fontSize: 11, marginTop: 10, gap: 14, justifyContent: 'center' }}>
          <span><span style={{ color: 'var(--em)' }}>■</span> Entrenaste</span>
          <span><span style={{ color: 'var(--em)' }}>□</span> Programado</span>
          <span><span style={{ color: 'var(--lime)' }}>○</span> Hoy</span>
        </div>
      </section>

      <section className="card">
        <div className="card-h"><div className="card-t" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 15, color: 'var(--text)' }}>{fmtDate(sel, { weekday: 'long' })}</div></div>
        {!selInfo.w.length && !selInfo.p.length && <div className="empty" style={{ padding: 10 }}>Nada este día.</div>}
        {selInfo.w.map((w) => {
          const { pct } = L.muscleLoad([w]);
          const groups = GROUPS.filter((g) => pct[g] > 0).sort((a, b) => pct[b] - pct[a]).slice(0, 3).map((g) => GROUP_NAME[g]);
          return (
            <button key={w.id} className="list-row" onClick={() => onOpenWorkout(w)}>
              <div className="badge-ic">🏋️</div>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="t ellipsis">{groups.join(' · ') || 'Entrenamiento'}</div>
                <div className="s">{fmtTime(w.date)} · {w.duration} min · {(w.entries || []).length} ejercicios · {L.setsCount(w)} series</div>
              </div>
              <Icon.chevron width="18" height="18" style={{ color: 'var(--muted)' }} />
            </button>
          );
        })}
        {selInfo.p.map((p) => (
          <div key={p.id} className="list-row">
            <div className="badge-ic">{p.done ? '✅' : '🗓️'}</div>
            <div className="grow"><div className="t">{p.focus}</div><div className="s">{p.done ? 'Hecho' : `Programado · ${fmtTime(p.date)} hs`}</div></div>
            <button className="icon-btn" onClick={() => setDelPlan(p)} aria-label="Borrar"><Icon.trash /></button>
          </div>
        ))}
      </section>

      {upcoming.length > 0 && (
        <section className="card">
          <div className="card-h"><div className="card-t"><Icon.calendar />Próximos programados</div>
            {upcoming.length > 1 && <button className="btn small" onClick={() => downloadIcs(upcoming)}>Exportar todos</button>}
          </div>
          {upcoming.map((p) => (
            <div key={p.id} style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
              <div className="row"><div className="grow"><b>{p.focus}</b><div className="muted" style={{ fontSize: 12 }}>{fmtDate(p.date, { weekday: 'long' })} · {fmtTime(p.date)} hs</div></div></div>
              <CalendarButtons plan={p} />
            </div>
          ))}
        </section>
      )}

      {planning && (
        <PlanSheet store={store} data={data} now={now} draft={planning} toast={toast}
          onClose={() => { setPlanning(null); onPlanDraftUsed && onPlanDraftUsed(); }} />
      )}
      {delPlan && <Confirm text="Se borra el entrenamiento programado." okText="Borrar" onCancel={() => setDelPlan(null)} onOk={async () => { await store.remove('plans', delPlan.id); setDelPlan(null); }} />}
    </>
  );
}

export function PlanSheet({ store, data, now, draft, onClose, toast }) {
  const usual = L.usualTime(data.workouts, data.profile);
  const { pct } = L.muscleLoad(L.thisWeek(data.workouts, now));
  const sug = L.suggestFocus(pct).label;
  const [date, setDate] = useState(toDateInput(draft.date || now));
  const [time, setTime] = useState(draft.date && new Date(draft.date).getHours() ? fmtTime(draft.date) : usual);
  const [focus, setFocus] = useState(draft.label || sug);
  const [dur, setDur] = useState('60');
  const [saved, setSaved] = useState(null);
  const options = [...new Set([sug, 'Pierna completa', 'Pecho y tríceps', 'Espalda y bíceps', 'Hombros y abdomen', 'Tren superior', 'Full body'])];

  async function save() {
    const ts = new Date(`${date}T${time || '20:00'}`).getTime();
    const id = store.newId('plans');
    const plan = { date: ts, focus: focus.trim() || sug, duration: parseInt(dur, 10) || 60, done: false, createdAt: Date.now() };
    await store.set('plans', id, plan);
    setSaved({ id, ...plan });
    toast('🗓️ Entrenamiento programado');
  }

  return (
    <Sheet title={saved ? '¡Listo!' : 'Programar entrenamiento'} onClose={onClose}>
      {saved ? (
        <>
          <p><b>{saved.focus}</b><br /><span className="muted">{fmtDate(saved.date, { weekday: 'long' })} · {fmtTime(saved.date)} hs</span></p>
          <p className="muted" style={{ fontSize: 13 }}>Agregalo al calendario de tu celular y te avisa 30 minutos antes, aunque GymFlow esté cerrada:</p>
          <CalendarButtons plan={saved} />
          <button className="btn block" style={{ marginTop: 14 }} onClick={onClose}>Cerrar</button>
        </>
      ) : (
        <>
          <div className="grid2">
            <div className="field"><label className="label">Día</label><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="field"><label className="label">Hora</label><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div className="field">
            <span className="label">¿Qué vas a entrenar?</span>
            <div className="chips" style={{ flexWrap: 'wrap' }}>
              {options.map((o) => <button key={o} className={'chip' + (focus === o ? ' on' : '')} onClick={() => setFocus(o)}>{o === sug ? `✨ ${o}` : o}</button>)}
            </div>
            <input className="input" style={{ marginTop: 8 }} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="O escribilo" />
          </div>
          <div className="field"><label className="label">Duración estimada (min)</label><input className="input" inputMode="numeric" value={dur} onChange={(e) => setDur(e.target.value)} /></div>
          <button className="btn primary block" style={{ marginTop: 18 }} onClick={save}>Programar</button>
        </>
      )}
    </Sheet>
  );
}
