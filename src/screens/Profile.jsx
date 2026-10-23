import { useState } from 'react';
import { GROUP_NAME } from '../exercises.js';
import { weekStreak, fmtDuration, setsCount } from '../logic.js';
import { Avatar, Icon, Confirm, compressImage, fmtDate } from '../components.jsx';

export default function Profile({ store, data, now, user, toast }) {
  const p = data.profile || {};
  const [name, setName] = useState(p.name || '');
  const [goal, setGoal] = useState(p.goalDays || 3);
  const [time, setTime] = useState(p.usualTime || '20:00');
  const [delEx, setDelEx] = useState(null);
  const [logout, setLogout] = useState(false);
  const dirty = name !== (p.name || '') || goal !== (p.goalDays || 3) || time !== (p.usualTime || '20:00');

  const save = async (extra = {}) => {
    await store.set('profile', 'me', { ...p, name: name.trim(), goalDays: goal, usualTime: time, ...extra });
    toast('✅ Perfil guardado');
  };
  async function onPhoto(ev) {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f) return;
    try { await save({ photo: await compressImage(f, 256, 0.75) }); } catch { toast('No se pudo leer la foto'); }
  }

  const ws = data.workouts;
  const first = ws.length ? Math.min(...ws.map((w) => w.date)) : null;
  const totalMin = ws.reduce((a, w) => a + (w.duration || 0), 0);
  const totalSets = ws.reduce((a, w) => a + setsCount(w), 0);

  return (
    <>
      <div className="page-title">Perfil</div>
      <section className="card" style={{ textAlign: 'center' }}>
        <label style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}>
          <Avatar profile={{ ...p, name: name || p.name }} size={92} />
          <span style={{ position: 'absolute', right: -4, bottom: -4, background: 'var(--em)', color: '#042f1e', borderRadius: 12, width: 32, height: 32, display: 'grid', placeItems: 'center' }}>
            <Icon.camera width="17" height="17" />
          </span>
          <input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
        </label>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 12 }}>{p.name || 'Tu nombre'}</div>
        <div className="muted" style={{ fontSize: 13 }}>{user?.email}{first ? ` · entrenando desde ${fmtDate(first, { month: 'long' })}` : ''}</div>
        <div className="stat-grid" style={{ marginTop: 14 }}>
          <div className="stat"><div className="v">{ws.length}</div><div className="k">Entrenamientos</div></div>
          <div className="stat"><div className="v">{fmtDuration(totalMin)}</div><div className="k">En el gym</div></div>
          <div className="stat"><div className="v">🔥 {weekStreak(ws, goal, now)}</div><div className="k">Semanas en racha</div></div>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{totalSets} series en total</div>
      </section>

      <section className="card">
        <div className="card-h"><div className="card-t"><Icon.user />Mis datos</div></div>
        <div className="field" style={{ marginTop: 0 }}><label className="label">Nombre</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="field">
          <span className="label">Meta semanal</span>
          <div className="seg">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => <button key={n} className={goal === n ? 'on' : ''} onClick={() => setGoal(n)}>{n}</button>)}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{goal} {goal === 1 ? 'día' : 'días'} de gym por semana</div>
        </div>
        <div className="field"><label className="label">Horario habitual</label><input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        <button className="btn primary block" style={{ marginTop: 16 }} disabled={!dirty} onClick={() => save()}>Guardar</button>
      </section>

      {data.exercises.length > 0 && (
        <section className="card">
          <div className="card-h"><div className="card-t">Mis ejercicios</div></div>
          {data.exercises.map((x) => (
            <div key={x.id} className="list-row">
              <div className="grow"><div className="t">{x.name}</div><div className="s">{Object.keys(x.muscles).map((g) => GROUP_NAME[g]).join(' · ')}</div></div>
              <button className="icon-btn" onClick={() => setDelEx(x)} aria-label="Borrar"><Icon.trash /></button>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <div className="card-h"><div className="card-t"><Icon.bell />Recordatorios</div></div>
        <p className="muted" style={{ fontSize: 13, margin: 0 }}>
          Cuando programás un entrenamiento en <b>Calendario</b>, podés mandarlo al calendario de tu celular y te avisa 30 minutos antes,
          aunque la app esté cerrada.
        </p>
      </section>

      <div className="row" style={{ marginTop: 16 }}>
        {store.mode === 'demo' && <button className="btn grow" onClick={() => store.reset()}>Reiniciar demo</button>}
        <button className="btn danger grow" onClick={() => setLogout(true)}>Cerrar sesión</button>
      </div>

      {delEx && <Confirm text={`Se borra "${delEx.name}" de tu lista. Los entrenamientos donde lo usaste no se tocan.`} okText="Borrar"
        onCancel={() => setDelEx(null)} onOk={async () => { await store.remove('exercises', delEx.id); setDelEx(null); }} />}
      {logout && <Confirm text="Vas a tener que volver a poner tu email y contraseña." okText="Cerrar sesión"
        onCancel={() => setLogout(false)} onOk={() => store.logout()} />}
    </>
  );
}
