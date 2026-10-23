import { useEffect } from 'react';
import { GROUP_NAME } from './exercises.js';

const I = (d, sw = 2) => (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
);
export const Icon = {
  home: I(<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />),
  progress: I(<path d="M3 12h18M7 7v10M17 7v10M4 9v6M20 9v6" />),
  plus: I(<path d="M12 5v14M5 12h14" />, 3),
  calendar: I(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  user: I(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>),
  body: I(<path d="M12 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 22l2-8-3-4 3-2h8l3 2-3 4 2 8" />),
  bars: I(<path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  pulse: I(<path d="M3 12h4l3-8 4 16 3-8h4" />),
  clock: I(<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>),
  scale: I(<><path d="M6 3h12l3 18H3zM12 7v4" /><circle cx="12" cy="13" r="2" /></>),
  bell: I(<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4" />),
  trophy: I(<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4c0 3 2 5 4 5M16 6h4c0 3-2 5-4 5M12 13v4M8 21h8M9 17h6v4H9z" />),
  camera: I(<><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>),
  trash: I(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />),
  search: I(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>),
  chevron: I(<path d="M9 6l6 6-6 6" />),
  back: I(<path d="M15 6l-6 6 6 6" />),
};

// ---------- Mapa de calor ----------
export function heat(v) {
  if (!v) return '#1e2a36';
  const stops = [[0, [6, 95, 70]], [0.5, [16, 185, 129]], [1, [190, 242, 100]]];
  const t = Math.min(1, v / 100);
  let a = stops[0], b = stops[2];
  for (let i = 0; i < 2; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; }
  const k = (t - a[0]) / (b[0] - a[0] || 1);
  return `rgb(${a[1].map((x, i) => Math.round(x + (b[1][i] - x) * k)).join(',')})`;
}

const NEUTRAL_FRONT = (
  <>
    <ellipse className="base" cx="60" cy="17" rx="10" ry="12" />
    <path className="base" d="M54 28h12v8H54z" />
    <path className="base" d="M48 118 L72 118 L74 128 L60 134 L46 128 Z" />
    <ellipse className="base" cx="24" cy="139" rx="4" ry="6" /><ellipse className="base" cx="96" cy="139" rx="4" ry="6" />
    <path className="base" d="M44 238h10l1 6H42zM66 238h10l2 6H65z" />
    <path className="base" d="M46 182 C48 187 54 188 57 184 L55 192 H45 Z" /><path className="base" d="M74 182 C72 187 66 188 63 184 L65 192 H75 Z" />
  </>
);
const NEUTRAL_BACK = (
  <>
    <ellipse className="base" cx="60" cy="17" rx="10" ry="12" />
    <path className="base" d="M54 28h12v8H54z" />
    <ellipse className="base" cx="24" cy="139" rx="4" ry="6" /><ellipse className="base" cx="96" cy="139" rx="4" ry="6" />
    <path className="base" d="M44 234h10l1 8H42zM66 234h10l2 8H65z" />
  </>
);
const FRONT = [
  ['hombros', 'M46 38 C35 38 28 45 27 55 C27 61 29 65 32 66 C35 58 40 51 48 47 Z'],
  ['pectorales', 'M59 42 L49 42 C42 44 38 51 38 58 C40 66 48 70 59 68 Z'],
  ['brazos', 'M32 69 C28 77 27 88 29 96 C33 97 36 92 37 85 C38 77 36 71 32 69 Z'],
  ['brazos', 'M28 99 C24 110 22 122 22 132 L27 133 C30 123 34 112 36 100 Z'],
  ['abdomen', 'M47 72 C42 84 42 102 46 116 L49 116 L49 72 Z'],
  ['piernas', 'M58 132 L46 128 C40 145 40 165 44 180 C48 185 54 185 57 179 C59 162 59 146 58 132 Z'],
  ['piernas', 'M45 194 C42 207 42 222 44 236 L52 236 C55 222 56 207 55 194 Z'],
];
const ABS = [[51, 72], [61, 72], [51, 87], [61, 87], [51, 102], [61, 102]];
const BACK = [
  ['espalda', 'M60 34 L52 37 C45 39 41 43 39 47 L60 62 Z'],
  ['hombros', 'M44 41 C34 41 28 47 27 56 C27 61 29 65 32 66 C34 58 38 52 44 49 Z'],
  ['espalda', 'M59 64 L42 52 C38 62 40 80 46 100 L59 106 Z'],
  ['espalda', 'M52 104 L59 108 L59 120 L50 120 Z'],
  ['brazos', 'M32 69 C28 77 27 88 29 96 C33 97 36 92 37 85 C38 77 36 71 32 69 Z'],
  ['brazos', 'M28 99 C24 110 22 122 22 132 L27 133 C30 123 34 112 36 100 Z'],
  ['piernas', 'M59 122 L46 122 C41 130 42 142 48 148 C54 150 59 146 59 140 Z'],
  ['piernas', 'M58 152 L45 152 C42 166 43 178 46 188 L56 188 C58 174 59 162 58 152 Z'],
  ['piernas', 'M45 192 C41 202 41 214 45 226 C48 232 53 232 55 224 C56 212 56 200 54 192 Z'],
];

function Figure({ parts, neutral, pct, onPick, abs }) {
  const shape = (g, d, k) => {
    const v = pct[g] || 0;
    const props = { className: 'm' + (v >= 70 ? ' hot' : ''), fill: heat(v), d, onClick: () => onPick(g) };
    return (
      <g key={k}>
        <path {...props} />
        <g transform="translate(120,0) scale(-1,1)"><path {...props} /></g>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 120 250">
      {neutral}
      {parts.map(([g, d], i) => shape(g, d, i))}
      {abs && ABS.map(([x, y], i) => (
        <rect key={'a' + i} className={'m' + (pct.abdomen >= 70 ? ' hot' : '')} fill={heat(pct.abdomen)} x={x} y={y} width="8.5" height="13" rx="3" onClick={() => onPick('abdomen')} />
      ))}
    </svg>
  );
}

export function BodyMap({ pct, onPick }) {
  return (
    <div className="bodies">
      <div className="body-wrap"><Figure parts={FRONT} neutral={NEUTRAL_FRONT} pct={pct} onPick={onPick} abs /><div className="body-label">FRENTE</div></div>
      <div className="body-wrap"><Figure parts={BACK} neutral={NEUTRAL_BACK} pct={pct} onPick={onPick} /><div className="body-label">ESPALDA</div></div>
    </div>
  );
}

export const groupTip = (g, pct) =>
  pct[g] ? `${GROUP_NAME[g]}: ${pct[g]}% del objetivo semanal` : `${GROUP_NAME[g]}: sin entrenar esta semana`;

// ---------- Gráfico de línea simple ----------
export function LineChart({ points, unit = '', height = 150, color = '#10b981' }) {
  if (points.length < 2) return <div className="empty">Hacen falta al menos 2 registros para ver el gráfico.</div>;
  const W = 320, H = height, P = { l: 34, r: 10, t: 12, b: 22 };
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (y0 === y1) { y0 -= 1; y1 += 1; }
  const pad = (y1 - y0) * 0.15; y0 -= pad; y1 += pad;
  const X = (x) => P.l + ((x - x0) / (x1 - x0 || 1)) * (W - P.l - P.r);
  const Y = (y) => P.t + (1 - (y - y0) / (y1 - y0)) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const area = `${path} L${X(x1)} ${H - P.b} L${X(x0)} ${H - P.b} Z`;
  const ticks = [y0 + pad, (y0 + y1) / 2, y1 - pad];
  const fmt = (v) => String(Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(1)).replace('.', ',');
  const dfmt = (t) => new Date(t).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  const last = points[points.length - 1];
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`}>
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke="rgba(255,255,255,.06)" />
          <text x={P.l - 6} y={Y(t) + 3} textAnchor="end" className="axis">{fmt(t)}</text>
        </g>
      ))}
      <path d={area} fill="url(#ga)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={i === points.length - 1 ? 4.5 : 2.5} fill={i === points.length - 1 ? '#bef264' : color} />)}
      <text x={P.l} y={H - 6} className="axis">{dfmt(x0)}</text>
      <text x={W - P.r} y={H - 6} textAnchor="end" className="axis">{dfmt(x1)}</text>
      <text x={Math.min(X(last.x), W - 40)} y={Math.max(Y(last.y) - 10, 10)} textAnchor="middle" className="axis strong">{fmt(last.y)}{unit}</text>
    </svg>
  );
}

// ---------- Hoja inferior / confirmación ----------
export function Sheet({ title, onClose, children, full }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={'sheet' + (full ? ' full' : '')} role="dialog" aria-label={title}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Confirm({ text, okText = 'Sí', onOk, onCancel }) {
  return (
    <Sheet title="¿Seguro?" onClose={onCancel}>
      <p className="muted">{text}</p>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn grow" onClick={onCancel}>Cancelar</button>
        <button className="btn grow danger" onClick={onOk}>{okText}</button>
      </div>
    </Sheet>
  );
}

// ---------- Utilidades ----------
export function fmtDate(ts, opts = {}) {
  const d = new Date(ts);
  const o = { day: 'numeric', month: 'short', ...opts };
  if (d.getFullYear() !== new Date().getFullYear()) o.year = 'numeric';
  return d.toLocaleDateString('es-AR', o);
}
export const fmtTime = (ts) => new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
export const toLocalInput = (ts) => {
  const d = new Date(ts), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const toDateInput = (ts) => toLocalInput(ts).slice(0, 10);
export const kg = (v) => (v == null ? '—' : `${String(+(+v).toFixed(1)).replace('.', ',')} kg`);

export async function compressImage(file, maxSide = 1000, quality = 0.7) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    let q = quality, side = maxSide, out;
    do {
      const k = Math.min(1, side / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      out = c.toDataURL('image/jpeg', q);
      q -= 0.1; side -= 120;
    } while (out.length > 650000 && q > 0.2);
    return out;
  } finally { URL.revokeObjectURL(url); }
}

export function Avatar({ profile, size = 46 }) {
  const name = profile?.name || '?';
  return profile?.photo
    ? <img className="avatar" src={profile.photo} alt={name} style={{ width: size, height: size }} />
    : <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>{name.slice(0, 1).toUpperCase()}</div>;
}
