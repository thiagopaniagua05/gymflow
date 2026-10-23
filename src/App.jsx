import { useEffect, useState } from 'react';
import { Icon, Sheet } from './components.jsx';
import { setsCount } from './logic.js';
import Login from './screens/Login.jsx';
import Home from './screens/Home.jsx';
import Register from './screens/Register.jsx';
import Progress from './screens/Progress.jsx';
import Calendar, { PlanSheet } from './screens/Calendar.jsx';
import Profile from './screens/Profile.jsx';

const COLS = ['workouts', 'weights', 'plans', 'photos', 'exercises'];

export default function App({ store }) {
  const [user, setUser] = useState(undefined);
  const [data, setData] = useState({ workouts: [], weights: [], plans: [], photos: [], exercises: [], profile: null, loaded: {} });
  const [tab, setTab] = useState('home');
  const [sheet, setSheet] = useState(null); // {type:'register', workout?} | {type:'plan', draft}
  const [toastMsg, setToastMsg] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => store.onAuth(setUser), [store]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!user) return;
    const unsubs = COLS.map((c) => store.subscribe(c, (rows) => setData((d) => ({ ...d, [c]: rows, loaded: { ...d.loaded, [c]: true } }))));
    unsubs.push(store.subscribeDoc('profile', 'me', (p) => setData((d) => ({ ...d, profile: p, loaded: { ...d.loaded, profile: true } }))));
    return () => unsubs.forEach((u) => u && u());
  }, [user, store]);

  const toast = (m) => { setToastMsg(m); clearTimeout(toast.t); toast.t = setTimeout(() => setToastMsg(null), 3000); };

  if (user === undefined) return <div className="splash"><div className="spinner" /></div>;
  if (!user) return <Login store={store} />;
  const ready = data.loaded.workouts && data.loaded.profile;
  const go = (t) => { setTab(t); window.scrollTo(0, 0); };
  const openRegister = (workout) => setSheet({ type: 'register', workout });

  // Primera vez: pedir el nombre
  if (ready && !data.profile) return <Welcome store={store} />;

  return (
    <div className="app">
      {!ready ? <div className="splash" style={{ minHeight: '70dvh' }}><div className="spinner" /></div>
        : tab === 'home' ? <Home data={data} now={now} demo={store.mode === 'demo'} onRegister={() => openRegister()} onCalendar={() => go('cal')} onPlan={(next) => setSheet({ type: 'plan', draft: { date: next.date, label: next.label } })} />
        : tab === 'prog' ? <Progress store={store} data={data} now={now} toast={toast} />
        : tab === 'cal' ? <Calendar store={store} data={data} now={now} toast={toast} onOpenWorkout={(w) => openRegister(w)} />
        : <Profile store={store} data={data} now={now} user={user} toast={toast} />}

      <nav className="tabs">
        <button className={'tab' + (tab === 'home' ? ' on' : '')} onClick={() => go('home')}><Icon.home />Inicio</button>
        <button className={'tab' + (tab === 'prog' ? ' on' : '')} onClick={() => go('prog')}><Icon.progress />Progresos</button>
        <button className="tab" onClick={() => openRegister()} aria-label="Registrar entrenamiento"><div className="reg"><Icon.plus /></div>Registrar</button>
        <button className={'tab' + (tab === 'cal' ? ' on' : '')} onClick={() => go('cal')}><Icon.calendar />Calendario</button>
        <button className={'tab' + (tab === 'me' ? ' on' : '')} onClick={() => go('me')}><Icon.user />Perfil</button>
      </nav>

      {sheet?.type === 'register' && (
        <Sheet full title={sheet.workout ? 'Editar entrenamiento' : 'Registrar entrenamiento'} onClose={() => setSheet(null)}>
          <Register store={store} data={data} editing={sheet.workout} onCancel={() => setSheet(null)}
            onDone={(isNew, entries, deleted) => {
              setSheet(null);
              if (deleted) return toast('🗑 Entrenamiento borrado');
              toast(isNew ? `💪 ¡Entrenamiento guardado! ${setsCount({ entries })} series` : '✅ Cambios guardados');
              if (isNew) go('home');
            }} />
        </Sheet>
      )}
      {sheet?.type === 'plan' && <PlanSheet store={store} data={data} now={now} draft={sheet.draft} toast={toast} onClose={() => setSheet(null)} />}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </div>
  );
}

function Welcome({ store }) {
  const [name, setName] = useState('');
  return (
    <div className="login">
      <div className="logo-big"><Icon.user /></div>
      <h1>¡Bienvenido!</h1>
      <p>¿Cómo te llamás?</p>
      <input className="input" autoFocus placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
      <button className="btn primary block" style={{ marginTop: 12 }} disabled={!name.trim()}
        onClick={() => store.set('profile', 'me', { name: name.trim(), goalDays: 3, usualTime: '20:00', createdAt: Date.now() })}>Empezar</button>
    </div>
  );
}
