// Grupos musculares y biblioteca de ejercicios.
// Cada ejercicio reparte sus series entre músculos: 1 = principal, 0.5 = secundario.

export const GROUPS = ['pectorales', 'espalda', 'piernas', 'hombros', 'brazos', 'abdomen'];
export const GROUP_NAME = {
  pectorales: 'Pectorales', espalda: 'Espalda', piernas: 'Piernas',
  hombros: 'Hombros', brazos: 'Brazos', abdomen: 'Abdomen',
};
export const GROUP_EMOJI = { pectorales: '🫁', espalda: '🔙', piernas: '🦵', hombros: '🏔️', brazos: '💪', abdomen: '🧱' };

// Series semanales (ponderadas) que equivalen al 100% de cada grupo
export const WEEKLY_TARGET = { pectorales: 10, espalda: 12, piernas: 12, hombros: 8, brazos: 10, abdomen: 6 };

const ex = (id, name, muscles, opts = {}) => ({ id, name, muscles, ...opts });

export const LIBRARY = [
  // Pecho
  ex('bench', 'Press de banca', { pectorales: 1, hombros: 0.5, brazos: 0.5 }),
  ex('incline-db', 'Press inclinado con mancuernas', { pectorales: 1, hombros: 0.5, brazos: 0.3 }),
  ex('incline-bar', 'Press inclinado con barra', { pectorales: 1, hombros: 0.5, brazos: 0.3 }),
  ex('decline', 'Press declinado', { pectorales: 1, brazos: 0.4 }),
  ex('db-press', 'Press plano con mancuernas', { pectorales: 1, hombros: 0.4, brazos: 0.4 }),
  ex('flyes', 'Aperturas con mancuernas', { pectorales: 1 }),
  ex('cable-cross', 'Cruce de poleas', { pectorales: 1 }),
  ex('pec-deck', 'Pec deck (mariposa)', { pectorales: 1 }),
  ex('dips', 'Fondos en paralelas', { pectorales: 1, brazos: 0.7, hombros: 0.3 }, { bodyweight: true }),
  ex('pushups', 'Flexiones de brazos', { pectorales: 1, brazos: 0.5, hombros: 0.3 }, { bodyweight: true }),
  // Espalda
  ex('pullups', 'Dominadas', { espalda: 1, brazos: 0.5 }, { bodyweight: true }),
  ex('lat-pulldown', 'Jalón al pecho', { espalda: 1, brazos: 0.5 }),
  ex('barbell-row', 'Remo con barra', { espalda: 1, brazos: 0.4, hombros: 0.3 }),
  ex('db-row', 'Remo con mancuerna', { espalda: 1, brazos: 0.4 }),
  ex('cable-row', 'Remo en polea baja', { espalda: 1, brazos: 0.4 }),
  ex('tbar-row', 'Remo en T', { espalda: 1, brazos: 0.4 }),
  ex('deadlift', 'Peso muerto', { espalda: 1, piernas: 1, abdomen: 0.3 }),
  ex('pullover', 'Pullover', { espalda: 0.7, pectorales: 0.5 }),
  ex('hyperext', 'Hiperextensiones', { espalda: 1, piernas: 0.3 }),
  ex('shrugs', 'Encogimientos (trapecio)', { espalda: 1 }),
  // Piernas
  ex('squat', 'Sentadilla', { piernas: 1, abdomen: 0.3 }),
  ex('front-squat', 'Sentadilla frontal', { piernas: 1, abdomen: 0.4 }),
  ex('leg-press', 'Prensa', { piernas: 1 }),
  ex('hack', 'Sentadilla hack', { piernas: 1 }),
  ex('rdl', 'Peso muerto rumano', { piernas: 1, espalda: 0.5 }),
  ex('lunges', 'Estocadas', { piernas: 1 }),
  ex('bulgarian', 'Sentadilla búlgara', { piernas: 1 }),
  ex('leg-ext', 'Sillón de cuádriceps', { piernas: 1 }),
  ex('leg-curl', 'Curl femoral', { piernas: 1 }),
  ex('hip-thrust', 'Hip thrust', { piernas: 1 }),
  ex('calves', 'Gemelos de pie', { piernas: 0.7 }),
  ex('adductor', 'Aductores en máquina', { piernas: 0.7 }),
  // Hombros
  ex('ohp', 'Press militar', { hombros: 1, brazos: 0.5 }),
  ex('db-shoulder', 'Press de hombros con mancuernas', { hombros: 1, brazos: 0.4 }),
  ex('arnold', 'Press Arnold', { hombros: 1, brazos: 0.4 }),
  ex('lateral', 'Elevaciones laterales', { hombros: 1 }),
  ex('front-raise', 'Elevaciones frontales', { hombros: 1 }),
  ex('rear-delt', 'Pájaros (deltoide posterior)', { hombros: 1, espalda: 0.3 }),
  ex('face-pull', 'Face pull', { hombros: 1, espalda: 0.5 }),
  ex('upright-row', 'Remo al mentón', { hombros: 1, espalda: 0.3 }),
  // Brazos
  ex('bb-curl', 'Curl con barra', { brazos: 1 }),
  ex('db-curl', 'Curl alternado con mancuernas', { brazos: 1 }),
  ex('hammer', 'Curl martillo', { brazos: 1 }),
  ex('preacher', 'Curl predicador (Scott)', { brazos: 1 }),
  ex('cable-curl', 'Curl en polea', { brazos: 1 }),
  ex('pushdown', 'Tríceps en polea', { brazos: 1 }),
  ex('skull', 'Press francés', { brazos: 1 }),
  ex('overhead-ext', 'Extensión de tríceps tras nuca', { brazos: 1 }),
  ex('bench-dips', 'Fondos en banco', { brazos: 1 }, { bodyweight: true }),
  ex('close-grip', 'Press de banca agarre cerrado', { brazos: 1, pectorales: 0.5 }),
  ex('wrist-curl', 'Curl de muñeca (antebrazo)', { brazos: 0.6 }),
  // Abdomen
  ex('crunch', 'Crunch abdominal', { abdomen: 1 }, { bodyweight: true }),
  ex('plank', 'Plancha', { abdomen: 1 }, { bodyweight: true, unit: 'seg' }),
  ex('leg-raise', 'Elevación de piernas', { abdomen: 1 }, { bodyweight: true }),
  ex('ab-wheel', 'Rueda abdominal', { abdomen: 1 }, { bodyweight: true }),
  ex('russian', 'Russian twist', { abdomen: 1 }),
  ex('cable-crunch', 'Crunch en polea', { abdomen: 1 }),
  ex('hanging-raise', 'Elevaciones colgado', { abdomen: 1 }, { bodyweight: true }),
];

export const mainGroup = (e) => Object.entries(e.muscles).sort((a, b) => b[1] - a[1])[0]?.[0];

const strip = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const matches = (e, q) => strip(e.name).includes(strip(q.trim()));
