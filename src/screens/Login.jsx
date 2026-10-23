import { useState } from 'react';
import { Icon } from '../components.jsx';
import { authErrorText } from '../store/firebase.js';

export default function Login({ store }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const demo = store.mode === 'demo';
  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (!demo && (!email || !pass)) return setErr('Completá email y contraseña.');
    setBusy(true);
    try { await store.login(email, pass); } catch (ex) { setErr(authErrorText(ex)); setBusy(false); }
  }
  return (
    <form className="login" onSubmit={submit}>
      <div className="logo-big"><Icon.pulse strokeWidth="2.6" /></div>
      <h1>GymFlow</h1>
      <p>Tu progreso, semana a semana</p>
      <div style={{ display: 'grid', gap: 10 }}>
        <input className="input" type="email" placeholder="Email" aria-label="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Contraseña" aria-label="Contraseña" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
        {err && <div className="error" style={{ marginTop: 0 }}>{err}</div>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </div>
      {demo && <p style={{ fontSize: 12, marginTop: 14 }}><b style={{ color: 'var(--warn)' }}>Modo demo</b>: tocá Entrar, con datos de ejemplo.</p>}
    </form>
  );
}
