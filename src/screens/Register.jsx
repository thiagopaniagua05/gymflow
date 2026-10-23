import { useEffect, useMemo, useState } from 'react';
import { LIBRARY, GROUPS, GROUP_NAME, mainGroup, matches } from '../exercises.js';
import { lastTimeOf, dayStart } from '../logic.js';
import { Icon, Confirm, toLocalInput, fmtDate } from '../components.jsx';

const blankSets = (n = 3) => Array.from({ length: n }, () => ({ reps: '', kg: '' }));
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };

export default function Register({ store, data, editing, onDone, onCancel }) {
  const e = editing;
  const [opened] = useState(Date.now());
  const [tick, setTick] = useState(Date.now());
  const [date, setDate] = useState(toLocalInput(e?.date || Date.now()));
  const [duration, setDuration] = useState(e?.duration ? String(e.duration) : '');
  const [durTouched, setDurTouched] = useState(!!e);
  const [entries, setEntries] = useState(() => (e?.entries || []).map((x, i) => ({
    ...x, key: i + '-' + (x.exId || x.name), sets: x.sets.map((s) => ({ reps: String(s.reps), kg: s.kg ? String(s.kg) : '' })),
  })));
  const [notes, setNotes] = useState(e?.notes || '');
  const [picker, setPicker] = useState(entries.length === 0 && !e);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (e) return;
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [e]);
  const elapsed = Math.floor((tick - opened) / 1000);
  const autoMin = Math.max(1, Math.round(elapsed / 60));
  const shownDuration = durTouched ? duration : String(autoMin);

  function addExercise(ex) {
    setEntries((list) => [...list, {
      key: Date.now() + ex.id, exId: ex.id, name: ex.name, muscles: ex.muscles, ...(ex.unit ? { unit: ex.unit } : {}),
      sets: blankSets(),
    }]);
    setPicker(false);
    setErr('');
  }
  const updEntry = (k, fn) => setEntries((list) => list.map((x) => (x.key === k ? fn(x) : x)));
  const setVal = (k, i, field, v) => updEntry(k, (x) => ({ ...x, sets: x.sets.map((s, j) => (j === i ? { ...s, [field]: v } : s)) }));
  const addSet = (k) => updEntry(k, (x) => ({ ...x, sets: [...x.sets, { ...(x.sets[x.sets.length - 1] || { reps: '', kg: '' }) }] }));
  const delSet = (k, i) => updEntry(k, (x) => ({ ...x, sets: x.sets.filter((_, j) => j !== i) }));
  const delEntry = (k) => setEntries((list) => list.filter((x) => x.key !== k));
  const copyLast = (k, last) => updEntry(k, (x) => ({ ...x, sets: last.sets.map((s) => ({ reps: String(s.reps), kg: s.kg ? String(s.kg) : '' })) }));

  async function save() {
    const clean = entries
      .map(({ key, ...x }) => ({ ...x, sets: x.sets.map((s) => ({ reps: Math.round(num(s.reps)), kg: num(s.kg) })).filter((s) => s.reps > 0) }))
      .filter((x) => x.sets.length);
    if (!clean.length) return setErr('Cargá al menos una serie con repeticiones.');
    const when = new Date(date).getTime() || Date.now();
    const dur = Math.max(1, Math.round(num(shownDuration)));
    setBusy(true);
    try {
      const id = e?.id || store.newId('workouts');
      const now = Date.now();
      await store.set('workouts', id, {
        date: when, duration: dur, entries: clean, notes: notes.trim(),
        createdAt: e?.createdAt || now, updatedAt: now,
      });
      // Si había un entrenamiento programado ese día, se marca como hecho
      const plan = data.plans.find((p) => !p.done && dayStart(p.date) === dayStart(when));
      if (plan) await store.update('plans', plan.id, { done: true, workoutId: id });
      onDone(!e, clean);
    } catch (ex) {
      setErr('No se pudo guardar: ' + (ex.message || ex));
      setBusy(false);
    }
  }

  if (picker) return <Picker data={data} store={store} onPick={addExercise} onClose={() => (entries.length || e ? setPicker(false) : onCancel())} />;

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div>
      {!e && (
        <div className="timer">
          <Icon.clock width="22" height="22" style={{ color: 'var(--em)' }} />
          <div className="grow"><div className="tv">{hh}:{mm}:{ss}</div><div className="muted" style={{ fontSize: 12 }}>Entrenamiento en curso</div></div>
        </div>
      )}

      {entries.map((x) => {
        const last = lastTimeOf(data.workouts, x.exId || x.name, e?.id);
        const isSec = x.unit === 'seg';
        return (
          <div key={x.key} className="ex-card">
            <div className="ex-head">
              <div className="grow">
                <div className="n">{x.name}</div>
                <div className="ex-tags">
                  {Object.entries(x.muscles).sort((a, b) => b[1] - a[1]).map(([g, k]) => (
                    <span key={g} className={'tag' + (k < 1 ? ' sec' : '')}>{GROUP_NAME[g]}</span>
                  ))}
                </div>
              </div>
              <button className="icon-btn" onClick={() => delEntry(x.key)} aria-label="Quitar ejercicio"><Icon.trash /></button>
            </div>
            {last && (
              <div className="last-time row">
                <span className="grow">Última vez ({fmtDate(last.date)}): {last.sets.map((s) => (s.kg ? `${s.reps}×${s.kg}` : `${s.reps}`)).join(' · ')}</span>
                <button className="btn small" onClick={() => copyLast(x.key, last)}>Copiar</button>
              </div>
            )}
            <div className="sets">
              <div className="set-row"><div className="set-head">#</div><div className="set-head">{isSec ? 'SEGUNDOS' : 'REPS'}</div><div className="set-head">KG</div><div /></div>
              {x.sets.map((s, i) => (
                <div key={i} className="set-row">
                  <div className="num">{i + 1}</div>
                  <input className="input" inputMode="numeric" placeholder={last?.sets[i] ? String(last.sets[i].reps) : '0'} value={s.reps}
                    aria-label={`Repeticiones serie ${i + 1}`} onChange={(ev) => setVal(x.key, i, 'reps', ev.target.value)} />
                  <input className="input" inputMode="decimal" placeholder={last?.sets[i]?.kg ? String(last.sets[i].kg) : '0'} value={s.kg}
                    aria-label={`Kilos serie ${i + 1}`} onChange={(ev) => setVal(x.key, i, 'kg', ev.target.value)} />
                  <button className="icon-btn" onClick={() => delSet(x.key, i)} aria-label="Borrar serie">✕</button>
                </div>
              ))}
            </div>
            <button className="btn small block" style={{ marginTop: 10 }} onClick={() => addSet(x.key)}>+ Serie</button>
          </div>
        );
      })}

      <button className="btn block" style={{ marginTop: 12, borderStyle: 'dashed' }} onClick={() => setPicker(true)}>+ Agregar ejercicio</button>

      <div className="grid2" style={{ marginTop: 4 }}>
        <div className="field">
          <label className="label" htmlFor="fecha">Inicio</label>
          <input id="fecha" className="input" type="datetime-local" value={date} onChange={(ev) => setDate(ev.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="dur">Duración (min)</label>
          <input id="dur" className="input" inputMode="numeric" value={shownDuration}
            onChange={(ev) => { setDurTouched(true); setDuration(ev.target.value); }} />
        </div>
      </div>
      <div className="field">
        <label className="label" htmlFor="notas">Notas</label>
        <input id="notas" className="input" placeholder="Cómo te sentiste, molestias…" value={notes} onChange={(ev) => setNotes(ev.target.value)} />
      </div>

      {err && <div className="error">{err}</div>}
      <div className="row" style={{ marginTop: 18 }}>
        {e ? <button className="btn danger" onClick={() => setConfirmDel(true)}>Borrar</button> : <button className="btn" onClick={onCancel}>Cancelar</button>}
        <button className="btn primary grow" onClick={save} disabled={busy}>{busy ? 'Guardando…' : e ? 'Guardar cambios' : 'Terminar y guardar'}</button>
      </div>
      {confirmDel && (
        <Confirm text="Se borra este entrenamiento y se recalculan tus estadísticas." okText="Borrar"
          onCancel={() => setConfirmDel(false)}
          onOk={async () => { await store.remove('workouts', e.id); onDone(false, null, true); }} />
      )}
    </div>
  );
}

function Picker({ data, store, onPick, onClose }) {
  const [q, setQ] = useState('');
  const [g, setG] = useState('all');
  const [creating, setCreating] = useState(false);
  const all = useMemo(() => {
    // Primero los que más usás
    const freq = {};
    for (const w of data.workouts) for (const x of w.entries || []) freq[x.exId || x.name] = (freq[x.exId || x.name] || 0) + 1;
    return [...LIBRARY, ...data.exercises.map((c) => ({ ...c, custom: true }))]
      .map((x) => ({ ...x, n: freq[x.id] || 0 }))
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }, [data]);
  const list = all.filter((x) => (g === 'all' || mainGroup(x) === g) && (!q || matches(x, q)));

  if (creating) return <CreateExercise store={store} initialName={q} onCreated={onPick} onBack={() => setCreating(false)} />;

  return (
    <div>
      <div className="row">
        <button className="icon-btn" onClick={onClose} aria-label="Volver"><Icon.back /></button>
        <div className="grow" style={{ position: 'relative' }}>
          <input className="input" autoFocus placeholder="Buscar ejercicio…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="chips" style={{ marginTop: 10 }}>
        <button className={'chip' + (g === 'all' ? ' on' : '')} onClick={() => setG('all')}>Todos</button>
        {GROUPS.map((x) => <button key={x} className={'chip' + (g === x ? ' on' : '')} onClick={() => setG(x)}>{GROUP_NAME[x]}</button>)}
      </div>
      <div className="picker-list">
        {list.map((x) => (
          <button key={x.id} className="picker-item" onClick={() => onPick(x)}>
            <div className="badge-ic" style={{ fontSize: 13, fontWeight: 800, color: 'var(--em)' }}>{GROUP_NAME[mainGroup(x)].slice(0, 3).toUpperCase()}</div>
            <div className="grow">
              <div style={{ fontWeight: 700 }}>{x.name}{x.custom && <span className="tag sec" style={{ marginLeft: 6 }}>propio</span>}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {Object.keys(x.muscles).map((m) => GROUP_NAME[m]).join(' · ')}{x.n ? ` · usado ${x.n} ${x.n === 1 ? 'vez' : 'veces'}` : ''}
              </div>
            </div>
            <Icon.plus width="18" height="18" style={{ color: 'var(--em)' }} />
          </button>
        ))}
        {list.length === 0 && <div className="empty">No encontré "{q}".</div>}
      </div>
      <button className="btn block" style={{ marginTop: 10 }} onClick={() => setCreating(true)}>+ Crear ejercicio nuevo</button>
    </div>
  );
}

function CreateExercise({ store, initialName, onCreated, onBack }) {
  const [name, setName] = useState(initialName || '');
  const [main, setMain] = useState(null);
  const [sec, setSec] = useState([]);
  const [err, setErr] = useState('');
  async function create() {
    if (!name.trim()) return setErr('Poné un nombre');
    if (!main) return setErr('Elegí el músculo principal');
    const muscles = { [main]: 1, ...Object.fromEntries(sec.filter((s) => s !== main).map((s) => [s, 0.5])) };
    const id = store.newId('exercises');
    const ex = { name: name.trim(), muscles, createdAt: Date.now() };
    await store.set('exercises', id, ex);
    onCreated({ id, ...ex });
  }
  return (
    <div>
      <div className="row"><button className="icon-btn" onClick={onBack} aria-label="Volver"><Icon.back /></button><b>Nuevo ejercicio</b></div>
      <div className="field"><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Remo en máquina Hammer" /></div>
      <div className="field">
        <span className="label">Músculo principal</span>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {GROUPS.map((g) => <button key={g} className={'chip' + (main === g ? ' on' : '')} onClick={() => setMain(g)}>{GROUP_NAME[g]}</button>)}
        </div>
      </div>
      <div className="field">
        <span className="label">Secundarios (opcional)</span>
        <div className="chips" style={{ flexWrap: 'wrap' }}>
          {GROUPS.filter((g) => g !== main).map((g) => (
            <button key={g} className={'chip' + (sec.includes(g) ? ' on' : '')} onClick={() => setSec(sec.includes(g) ? sec.filter((x) => x !== g) : [...sec, g])}>{GROUP_NAME[g]}</button>
          ))}
        </div>
      </div>
      {err && <div className="error">{err}</div>}
      <button className="btn primary block" style={{ marginTop: 18 }} onClick={create}>Crear y agregar</button>
    </div>
  );
}
