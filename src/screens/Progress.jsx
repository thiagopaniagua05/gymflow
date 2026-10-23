import { useMemo, useState } from 'react';
import { GROUP_NAME } from '../exercises.js';
import { exerciseHistory, setsCount, fmtDuration } from '../logic.js';
import { LineChart, Sheet, Confirm, Icon, fmtDate, kg, compressImage, toDateInput } from '../components.jsx';

export default function Progress({ store, data, now, toast }) {
  const [tab, setTab] = useState('ej');
  return (
    <>
      <div className="page-title">Progresos</div>
      <div className="page-sub">Tu evolución en el tiempo</div>
      <div className="seg" style={{ marginTop: 14 }}>
        {[['ej', 'Ejercicios'], ['peso', 'Peso'], ['fotos', 'Fotos'], ['pr', 'Récords']].map(([v, l]) => (
          <button key={v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}>{l}</button>
        ))}
      </div>
      {tab === 'ej' && <Exercises data={data} now={now} />}
      {tab === 'peso' && <Weight store={store} data={data} toast={toast} />}
      {tab === 'fotos' && <Photos store={store} data={data} toast={toast} />}
      {tab === 'pr' && <Records data={data} />}
    </>
  );
}

function Exercises({ data, now }) {
  const { byExercise } = useMemo(() => exerciseHistory(data.workouts), [data.workouts]);
  const list = Object.values(byExercise).sort((a, b) => b.sessions.length - a.sessions.length);
  const [sel, setSel] = useState(list[0]?.key);
  const h = byExercise[sel] || list[0];
  const month = data.workouts.filter((w) => w.date >= now - 30 * 864e5);
  const totalSets = data.workouts.reduce((a, w) => a + setsCount(w), 0);
  const totalMin = data.workouts.reduce((a, w) => a + (w.duration || 0), 0);

  if (!list.length) return <div className="card empty">Cuando registres entrenamientos vas a ver acá tu progreso por ejercicio.</div>;
  const byWeight = h.bestKg > 0;
  const points = h.sessions.map((s) => ({ x: s.date, y: byWeight ? s.topKg : s.maxReps }));
  const first = h.sessions[0], last = h.sessions[h.sessions.length - 1];
  const gain = byWeight ? last.topKg - first.topKg : last.maxReps - first.maxReps;

  return (
    <>
      <div className="stat-grid" style={{ marginTop: 14 }}>
        <div className="stat"><div className="v">{data.workouts.length}</div><div className="k">Entrenamientos</div></div>
        <div className="stat"><div className="v">{month.length}</div><div className="k">Últimos 30 días</div></div>
        <div className="stat"><div className="v">{fmtDuration(totalMin)}</div><div className="k">{totalSets} series</div></div>
      </div>

      <section className="card">
        <div className="card-h"><div className="card-t"><Icon.progress />Por ejercicio</div></div>
        <select className="input" value={h.key} onChange={(e) => setSel(e.target.value)} aria-label="Ejercicio">
          {list.map((x) => <option key={x.key} value={x.key}>{x.name} ({x.sessions.length})</option>)}
        </select>
        <div style={{ marginTop: 12 }}>
          <LineChart points={points} unit={byWeight ? ' kg' : ''} />
        </div>
        <div className="muted center" style={{ fontSize: 12 }}>{byWeight ? 'Peso de la serie más pesada' : `Máximo de ${h.unit === 'seg' ? 'segundos' : 'repeticiones'}`} en cada sesión</div>
        <div className="stat-grid" style={{ marginTop: 12 }}>
          <div className="stat"><div className="v" style={{ color: 'var(--lime)' }}>{byWeight ? kg(h.bestKg) : h.bestReps}</div><div className="k">Récord</div></div>
          <div className="stat"><div className="v">{byWeight ? kg(Math.round(h.best1rm)) : h.sessions.length}</div><div className="k">{byWeight ? '1RM estimado' : 'Sesiones'}</div></div>
          <div className="stat"><div className="v" style={{ color: gain > 0 ? 'var(--neon)' : gain < 0 ? 'var(--red)' : undefined }}>{gain > 0 ? '+' : ''}{byWeight ? kg(gain) : gain}</div><div className="k">Desde el inicio</div></div>
        </div>
      </section>

      <section className="card">
        <div className="card-h"><div className="card-t">Historial de {h.name}</div></div>
        {[...h.sessions].reverse().slice(0, 12).map((s, i) => (
          <div key={i} className="list-row">
            <div className="grow">
              <div className="t">{fmtDate(s.date, { weekday: 'short' })}</div>
              <div className="s">{s.sets} series{byWeight ? ` · volumen ${Math.round(s.volume)} kg` : ''}</div>
            </div>
            <div className="big-num">{byWeight ? `${s.topReps} × ${String(s.topKg).replace('.', ',')}` : s.maxReps}</div>
          </div>
        ))}
      </section>
    </>
  );
}

function Weight({ store, data, toast }) {
  const ws = [...data.weights].sort((a, b) => a.date - b.date);
  const [val, setVal] = useState('');
  const [date, setDate] = useState(toDateInput(Date.now()));
  const [del, setDel] = useState(null);
  async function add() {
    const v = parseFloat(val.replace(',', '.'));
    if (!(v > 20 && v < 400)) return toast('Poné un peso válido');
    const d = new Date(date + 'T09:00').getTime();
    await store.set('weights', store.newId('weights'), { date: d, kg: v });
    setVal('');
    toast('⚖️ Peso guardado');
  }
  const last = ws[ws.length - 1], first = ws[0];
  return (
    <>
      <section className="card">
        <div className="card-h"><div className="card-t"><Icon.scale />Peso corporal</div>{last && <span className="pill">{kg(last.kg)}</span>}</div>
        <LineChart points={ws.map((w) => ({ x: w.date, y: w.kg }))} unit=" kg" />
        {ws.length > 1 && (
          <div className="muted center" style={{ fontSize: 13, marginTop: 6 }}>
            {last.kg - first.kg > 0 ? '▲' : '▼'} {kg(Math.abs(last.kg - first.kg))} desde el {fmtDate(first.date)}
          </div>
        )}
        <div className="row" style={{ marginTop: 14 }}>
          <input className="input" inputMode="decimal" placeholder="Peso (kg)" value={val} onChange={(e) => setVal(e.target.value)} style={{ flex: 1.2 }} />
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: 1.4 }} />
          <button className="btn primary" onClick={add}>Guardar</button>
        </div>
      </section>
      {ws.length > 0 && (
        <section className="card">
          {[...ws].reverse().map((w) => (
            <div key={w.id} className="list-row">
              <div className="grow"><div className="t">{kg(w.kg)}</div><div className="s">{fmtDate(w.date, { weekday: 'short' })}</div></div>
              <button className="icon-btn" onClick={() => setDel(w)} aria-label="Borrar"><Icon.trash /></button>
            </div>
          ))}
        </section>
      )}
      {del && <Confirm text={`Borrar el registro de ${kg(del.kg)}.`} okText="Borrar" onCancel={() => setDel(null)} onOk={async () => { await store.remove('weights', del.id); setDel(null); }} />}
    </>
  );
}

function Photos({ store, data, toast }) {
  const photos = [...data.photos].sort((a, b) => b.date - a.date);
  const [date, setDate] = useState(toDateInput(Date.now()));
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState(null);
  const [compare, setCompare] = useState([]);
  const [comparing, setComparing] = useState(null);
  const [selecting, setSelecting] = useState(false);

  async function onFile(ev) {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f) return;
    setBusy(true);
    try {
      const full = await compressImage(f, 1100, 0.72);
      const thumb = await compressImage(f, 320, 0.6);
      const id = store.newId('photos');
      const d = new Date(date + 'T12:00').getTime();
      await store.set('photoFull', id, { data: full });
      await store.set('photos', id, { date: d, thumb });
      toast('📸 Foto guardada');
    } catch { toast('No se pudo leer la foto'); }
    setBusy(false);
  }
  const full = async (p) => (await store.get('photoFull', p.id))?.data || p.thumb;

  async function tap(p) {
    if (!selecting) return setView({ ...p, src: p.thumb, loading: true }) || full(p).then((src) => setView({ ...p, src }));
    const next = compare.includes(p.id) ? compare.filter((x) => x !== p.id) : [...compare, p.id].slice(-2);
    setCompare(next);
    if (next.length === 2) {
      const [a, b] = next.map((id) => photos.find((x) => x.id === id)).sort((x, y) => x.date - y.date);
      setComparing({ a: { ...a, src: a.thumb }, b: { ...b, src: b.thumb } });
      const [sa, sb] = await Promise.all([full(a), full(b)]);
      setComparing({ a: { ...a, src: sa }, b: { ...b, src: sb } });
    }
  }

  return (
    <>
      <section className="card">
        <div className="card-h"><div className="card-t"><Icon.camera />Fotos de progreso</div><span className="pill gray">{photos.length}</span></div>
        <div className="row">
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ flex: 1 }} />
          <label className="btn primary" style={{ cursor: 'pointer' }}>
            {busy ? 'Subiendo…' : '+ Foto'}
            <input type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} disabled={busy} />
          </label>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>Tip: sacalas siempre con la misma luz y la misma pose para comparar mejor.</p>
      </section>

      {photos.length > 1 && (
        <button className={'btn block' + (selecting ? ' primary' : '')} style={{ marginTop: 12 }}
          onClick={() => { setSelecting(!selecting); setCompare([]); }}>
          {selecting ? `Elegí 2 fotos (${compare.length}/2) · Cancelar` : '↔ Comparar antes / después'}
        </button>
      )}

      {photos.length ? (
        <div className="photos" style={{ marginTop: 12 }}>
          {photos.map((p) => (
            <button key={p.id} className={'photo-tile' + (compare.includes(p.id) ? ' sel' : '')} onClick={() => tap(p)}>
              <img src={p.thumb} alt={`Foto del ${fmtDate(p.date)}`} loading="lazy" />
              <span>{fmtDate(p.date)}</span>
            </button>
          ))}
        </div>
      ) : <div className="card empty">Todavía no subiste fotos.</div>}

      {view && <PhotoView p={view} onClose={() => setView(null)} onDelete={async () => { await store.remove('photos', view.id); await store.remove('photoFull', view.id); setView(null); }} />}
      {comparing && (
        <Sheet title="Antes / Después" onClose={() => { setComparing(null); setCompare([]); setSelecting(false); }}>
          <div className="compare">
            {[comparing.a, comparing.b].map((p, i) => (
              <div key={i}><img src={p.src} alt="" /><div className="center" style={{ fontWeight: 800, marginTop: 6 }}>{i ? 'Después' : 'Antes'}</div><div className="center muted" style={{ fontSize: 12 }}>{fmtDate(p.date)}</div></div>
            ))}
          </div>
          <p className="center" style={{ color: 'var(--neon)', fontWeight: 700 }}>{Math.round((comparing.b.date - comparing.a.date) / 864e5)} días de diferencia</p>
        </Sheet>
      )}
    </>
  );
}

function PhotoView({ p, onClose, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Sheet title={fmtDate(p.date, { weekday: 'long' })} onClose={onClose}>
      <img src={p.src} alt="" style={{ width: '100%', borderRadius: 16, display: 'block' }} />
      <button className="btn danger block" style={{ marginTop: 12 }} onClick={() => setConfirm(true)}>Borrar foto</button>
      {confirm && <Confirm text="La foto se borra para siempre." okText="Borrar" onCancel={() => setConfirm(false)} onOk={onDelete} />}
    </Sheet>
  );
}

function Records({ data }) {
  const { byExercise, prEvents } = useMemo(() => exerciseHistory(data.workouts), [data.workouts]);
  const list = Object.values(byExercise).sort((a, b) => b.best1rm - a.best1rm || b.bestReps - a.bestReps);
  if (!list.length) return <div className="card empty">Tus récords personales aparecen acá.</div>;
  return (
    <>
      <section className="card">
        <div className="card-h"><div className="card-t"><Icon.trophy />Récords personales</div></div>
        {list.map((h) => (
          <div key={h.key} className="list-row">
            <div className="badge-ic">🏆</div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="t ellipsis">{h.name}</div>
              <div className="s">{Object.keys(h.muscles || {}).slice(0, 2).map((g) => GROUP_NAME[g]).join(' · ')}{h.bestAt ? ` · ${fmtDate(h.bestAt)}` : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="big-num">{h.bestKg > 0 ? kg(h.bestKg) : `${h.bestReps} ${h.unit || 'reps'}`}</div>
              {h.bestKg > 0 && <div className="muted" style={{ fontSize: 11 }}>1RM ≈ {Math.round(h.best1rm)} kg</div>}
            </div>
          </div>
        ))}
      </section>
      {prEvents.length > 0 && (
        <section className="card">
          <div className="card-h"><div className="card-t">Últimas mejoras</div></div>
          {prEvents.slice(0, 10).map((p, i) => (
            <div key={i} className="list-row">
              <div className="badge-ic">📈</div>
              <div className="grow"><div className="t">{p.name}</div><div className="s">{fmtDate(p.date, { weekday: 'short' })}</div></div>
              <div className="big-num" style={{ fontSize: 16 }}>{p.kg > 0 ? `${p.kg} kg × ${p.reps}` : `${p.reps} ${p.unit || 'reps'}`}</div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
