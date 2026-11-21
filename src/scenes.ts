// Paisajes de la pantalla Hoy. Cada día toca uno distinto (ver sceneForDay).
// Todos se dibujan en un lienzo de 340×178 y usan los colores del tema (--green, --accent, etc.)
// más algunos propios de cada paisaje (agua, arena, roca, nieve).

export interface Scene {
  id: string;
  name: string;
  sky: string;
  svg: string;
}

const SKY = '#a9d8ee';
const SKY_SOFT = '#c3e6f4';
const WATER = '#5fb0cf';
const WATER_DEEP = '#3f93b8';
const SAND = '#ecd29a';
const WOOD = '#7a4a2a';

const sun = (x: number, y: number, r = 22) => `<circle cx="${x}" cy="${y}" r="${r}" fill="var(--accent)"/>`;

const cloud = (x: number, y: number, s = 1, o = 0.9) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0h44a10 10 0 0 0-6-17a15 15 0 0 0-28-3a10 10 0 0 0-10 20z" fill="#fff" opacity="${o}"/>`;

const birds = (x: number, y: number) =>
  `<path d="M${x} ${y}q5-6 10 0q5-6 10 0" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>`;

const pine = (x: number, y: number, s: number, fill: string) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M-3 0v-7h-9l8-11h-5l7-10h-4l6-10l6 10h-4l7 10h-5l8 11h-9v7z" fill="${fill}"/>`;

const tree = (x: number, y: number, s: number, fill: string) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-2 0v-14h4v14z" fill="${WOOD}"/><circle cy="-22" r="13" fill="${fill}"/></g>`;

const cactus = (x: number, y: number, s: number) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="var(--green-dark)"><path d="M-8 0v-52a8 8 0 0 1 16 0v52z"/><path d="M-8-26h-10a6 6 0 0 1-6-6v-12a5 5 0 0 1 10 0v8h6z"/><path d="M8-18h10a6 6 0 0 0 6-6v-16a5 5 0 0 0-10 0v12h-6z"/></g>`;

const agave = (x: number, y: number, s: number) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0l-5-28 5 9 5-9zM0 0l-17-21 13 11zM0 0l17-21-13 11zM0 0l-25-9 20 1zM0 0l25-9-20 1z" fill="#3f8a80" stroke="#3f8a80" stroke-width="2" stroke-linejoin="round"/>`;

const leaf = (x: number, y: number, rot: number, s: number, fill: string) =>
  `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0 0q30-34 84-18q-32 36-84 18z" fill="${fill}"/>`;

const palm = (x: number, y: number, s: number) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q4-40 22-62" fill="none" stroke="${WOOD}" stroke-width="6" stroke-linecap="round"/><g fill="var(--green-dark)"><path d="M22-62q-24-16-46-2q26-6 46 2z"/><path d="M22-62q-10-26-36-26q24 8 36 26z"/><path d="M22-62q8-28 34-26q-24 8-34 26z"/><path d="M22-62q26-12 44 6q-24-8-44-6z"/><path d="M22-62q16 4 22 26q-12-18-22-26z"/></g></g>`;

export const SCENES: Scene[] = [
  {
    id: 'montanas',
    name: 'Montañas',
    sky: SKY,
    svg: `${sun(238, 60, 24)}${cloud(40, 46)}${cloud(286, 34, 0.7, 0.8)}${birds(96, 60)}
      <path d="M0 178V104q26-34 54-52q22 6 40 34q20-34 44-46q30 18 58 56q24-26 46-30q50 26 98 70v42z" fill="var(--green-light)"/>
      <path d="M0 178v-44q36-36 70-40q30 10 58 38q26-22 52-28q36 14 70 42q46-30 90-36v108z" fill="var(--green)"/>
      <path d="M0 178v-22q60-26 120-16t100 10q60-4 120-30v58z" fill="var(--green-dark)"/>
      ${pine(290, 158, 1.15, '#1f3f25')}${pine(314, 162, 0.9, '#1f3f25')}`,
  },
  {
    id: 'playa',
    name: 'Playa',
    sky: SKY,
    svg: `${sun(250, 50, 22)}${cloud(120, 44, 0.9)}${birds(196, 66)}
      <rect y="92" width="340" height="86" fill="${WATER}"/>
      <path d="M0 104q30-6 60 0t60 0t60 0t60 0t60 0t40 0v10H0z" fill="${WATER_DEEP}" opacity=".5"/>
      <path d="M206 88l14-22v22zM200 90h26l-4 6h-18z" fill="#fff"/>
      <path d="M0 178v-38q80-24 170-14t170-22v74z" fill="${SAND}"/>
      <path d="M0 140q80-24 170-14t170-22v8q-80 30-170 22T0 148z" fill="#fff" opacity=".6"/>
      ${palm(58, 156, 1)}${palm(98, 162, 0.7)}
      <path d="M262 150l24-26 24 26z" fill="var(--accent)"/><path d="M286 124v34" stroke="${WOOD}" stroke-width="3"/>`,
  },
  {
    id: 'desierto',
    name: 'Desierto',
    sky: SKY_SOFT,
    svg: `${sun(96, 54, 26)}${cloud(230, 40, 0.8, 0.8)}
      <path d="M176 130V84h20V72h46v12h24v46z" fill="#cf9460"/>
      <path d="M270 130V96h30v-8h40v42z" fill="#d9a473"/>
      <path d="M0 178v-54q70-28 150-8t190-20v82z" fill="#ecc98a"/>
      <path d="M0 178v-28q90-24 180-8t160-12v48z" fill="#dcae66"/>
      ${cactus(74, 152, 1)}${cactus(292, 158, 0.6)}${cactus(214, 150, 0.4)}`,
  },
  {
    id: 'lago',
    name: 'Lago',
    sky: SKY,
    svg: `${sun(76, 48, 20)}${cloud(206, 40)}
      <path d="M0 120V84q40-30 80-34q30 12 50 34q30-36 60-40q40 16 70 50q30-20 80-26v52z" fill="var(--green-light)"/>
      <path d="M0 122v-14q170-14 340 0v14z" fill="var(--green)"/>
      ${pine(30, 112, 0.7, 'var(--green-dark)')}${pine(52, 112, 0.9, 'var(--green-dark)')}${pine(250, 112, 0.8, 'var(--green-dark)')}${pine(272, 112, 1, 'var(--green-dark)')}${pine(296, 112, 0.7, 'var(--green-dark)')}
      <rect y="116" width="340" height="62" fill="${WATER}"/>
      <path d="M30 128h70M210 124h90M120 140h60M240 146h50" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <path d="M146 136q22 9 46 0l-5 8h-36z" fill="${WOOD}"/><path d="M168 122v16" stroke="${WOOD}" stroke-width="2.5"/>
      <path d="M0 178v-22q30-12 70-6q20 8 30 28z" fill="var(--green-dark)"/>${pine(26, 160, 1.3, '#1f3f25')}`,
  },
  {
    id: 'bosque',
    name: 'Bosque',
    sky: SKY_SOFT,
    svg: `${sun(170, 52, 24)}
      <path d="M0 178V88q20-16 40-4q20-20 44-6q22-18 46-2q24-18 48 0q22-16 46 2q24-16 46 4q22-14 40 0q16-8 30 4v92z" fill="var(--green-light)"/>
      ${[20, 62, 104, 146, 190, 232, 276, 318].map((x, i) => pine(x, 150, 1.5 + (i % 3) * 0.2, 'var(--green)')).join('')}
      <path d="M0 178v-26q170-14 340 0v26z" fill="var(--green-dark)"/>
      ${pine(34, 170, 2.6, 'var(--green-dark)')}${pine(300, 172, 2.9, 'var(--green-dark)')}${pine(88, 168, 1.6, '#1f3f25')}${pine(246, 168, 1.4, '#1f3f25')}`,
  },
  {
    id: 'canon',
    name: 'Cañón',
    sky: SKY,
    svg: `${sun(262, 46, 20)}${cloud(60, 38, 0.9)}
      <path d="M0 178V86h40V76h50v14h44V68h60v18h50V74h60v14h36v90z" fill="#e0b083"/>
      <path d="M0 178V98h64v18h32v22h26v40z" fill="#bb7340"/>
      <path d="M340 178V94h-52v18h-38v22h-30v44z" fill="#bb7340"/>
      <path d="M0 116h96M0 136h110M340 112h-52M340 132h-88" stroke="#9c5a2c" stroke-width="3" opacity=".5"/>
      <path d="M122 178q6-22 34-30q22-6 20-18q-2-10 14-12q-4 12 8 20q20 14 8 40z" fill="${WATER}"/>
      ${cactus(40, 98, 0.35)}${cactus(308, 94, 0.3)}`,
  },
  {
    id: 'pradera',
    name: 'Pradera',
    sky: SKY,
    svg: `${sun(64, 50, 22)}${cloud(150, 36)}${cloud(258, 58, 0.7, 0.8)}
      <path d="M0 178v-62q60-30 130-14t210-20v96z" fill="var(--green-light)"/>
      <path d="M0 178v-36q90-28 190-10t150-18v64z" fill="var(--green)"/>
      ${tree(236, 112, 1.5, 'var(--green-dark)')}${tree(266, 118, 1, 'var(--green-dark)')}
      <path d="M150 178q-10-22 30-36q24-8 16-22h8q14 14-8 26q-24 12-10 32z" fill="${SAND}"/>
      <path d="M0 178v-18q60-16 120-6v24zM230 178v-20q60-12 110 2v18z" fill="var(--green-dark)"/>
      <g fill="var(--accent)"><circle cx="40" cy="150" r="3"/><circle cx="72" cy="142" r="3"/><circle cx="100" cy="154" r="3"/><circle cx="286" cy="150" r="3"/></g>
      <g fill="#fff"><circle cx="56" cy="158" r="2.6"/><circle cx="262" cy="156" r="2.6"/><circle cx="312" cy="154" r="2.6"/><circle cx="24" cy="138" r="2.6"/></g>`,
  },
  {
    id: 'nevado',
    name: 'Nevado',
    sky: SKY_SOFT,
    svg: `${sun(292, 44, 18)}${cloud(20, 40, 0.9)}
      <path d="M-10 178L70 56l42 56 46-74 62 88 38-46 96 98z" fill="#7ea4ba"/>
      <path d="M70 56l-18 28 11-5 7 9 8-9 9 6zM158 38l-20 32 11-5 9 11 9-11 12 9zM258 80l-13 16 8-3 5 7 6-7 7 4z" fill="#fff"/>
      <path d="M0 178v-42q80-22 170-10t170-18v70z" fill="#f3f8fa"/>
      <path d="M0 178v-18q90-14 180-4t160-8v30z" fill="#dfeef4"/>
      ${pine(48, 150, 1.2, 'var(--green-dark)')}${pine(76, 156, 0.9, 'var(--green-dark)')}${pine(268, 146, 1.3, 'var(--green-dark)')}${pine(300, 152, 1, 'var(--green-dark)')}`,
  },
  {
    id: 'cascada',
    name: 'Cascada',
    sky: SKY,
    svg: `${sun(60, 44, 20)}${cloud(240, 36, 0.9)}
      <path d="M0 178V92q50-24 110-26h120q60 2 110 26v86z" fill="var(--green)"/>
      <path d="M112 178V66h116v112z" fill="#8f9c86"/>
      <path d="M112 96h30M196 110h32M112 128h22M204 140h24" stroke="#77846f" stroke-width="3"/>
      <path d="M148 64h44v96h-44z" fill="#e3f4fa"/>
      <path d="M158 70v80M170 70v86M182 70v80" stroke="${WATER}" stroke-width="3" stroke-linecap="round" opacity=".6"/>
      <ellipse cx="170" cy="160" rx="92" ry="16" fill="${WATER}"/>
      <ellipse cx="170" cy="156" rx="30" ry="7" fill="#fff" opacity=".85"/>
      ${pine(84, 72, 1, 'var(--green-dark)')}${pine(258, 72, 1.1, 'var(--green-dark)')}${pine(284, 80, 0.8, 'var(--green-dark)')}
      <path d="M0 178v-30q40-10 70 30zM340 178v-30q-40-10-70 30z" fill="var(--green-dark)"/>`,
  },
  {
    id: 'selva',
    name: 'Selva',
    sky: SKY,
    svg: `${sun(176, 50, 24)}${birds(230, 40)}
      <path d="M0 178V96q16-14 32-2q14-18 34-4q16-16 36 0q18-16 38 0q16-14 34 2q18-16 38-2q16-14 34 2q18-14 36 0q16-10 30 2q14-8 28 4v80z" fill="var(--green-light)"/>
      ${palm(120, 150, 0.9)}${palm(214, 152, 1.1)}
      <path d="M0 178v-40q170-18 340 0v40z" fill="var(--green)"/>
      ${leaf(-6, 150, -52, 1.5, 'var(--green-dark)')}${leaf(-10, 172, -22, 1.4, '#1f3f25')}${leaf(20, 178, -70, 1, 'var(--green-dark)')}
      ${leaf(346, 150, -128, 1.5, 'var(--green-dark)')}${leaf(350, 174, -160, 1.4, '#1f3f25')}${leaf(318, 178, -108, 1, 'var(--green-dark)')}
      <g fill="var(--accent)"><circle cx="64" cy="146" r="5"/><circle cx="280" cy="142" r="5"/></g>`,
  },
  {
    id: 'volcan',
    name: 'Volcán',
    sky: SKY,
    svg: `${sun(60, 50, 20)}${cloud(264, 60, 0.8, 0.8)}
      <g fill="#fff" opacity=".9"><circle cx="174" cy="46" r="10"/><circle cx="188" cy="32" r="13"/><circle cx="208" cy="22" r="11"/><circle cx="226" cy="16" r="8"/></g>
      <path d="M52 178L148 62q22-10 44 0l98 116z" fill="#8c6a54"/>
      <path d="M148 62q22-10 44 0l14 17q-10-5-17 3q-9-9-17 1q-9-9-19-1q-9-7-19-3z" fill="#fff"/>
      <path d="M0 178v-44q70-22 140-6t200-12v62z" fill="var(--green)"/>
      <path d="M0 178v-22q90-18 180-6t160-10v38z" fill="var(--green-dark)"/>
      ${agave(50, 162, 0.8)}${agave(96, 168, 0.6)}${agave(284, 162, 0.8)}`,
  },
  {
    id: 'velero',
    name: 'Mar abierto',
    sky: SKY_SOFT,
    svg: `${sun(84, 56, 24)}${cloud(220, 42)}${birds(150, 40)}
      <rect y="98" width="340" height="80" fill="${WATER}"/>
      <path d="M250 98q24-22 60 0z" fill="var(--green)"/>${palm(276, 92, 0.45)}
      <path d="M0 116q20-7 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t20 0v62H0z" fill="${WATER_DEEP}" opacity=".45"/>
      <path d="M134 132h64l-10 14h-44z" fill="${WOOD}"/>
      <path d="M168 128V76l34 52z" fill="#fff"/><path d="M162 128V90l-24 38z" fill="var(--accent)"/>
      <path d="M0 150q20-7 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0t20 0v28H0z" fill="${WATER_DEEP}" opacity=".6"/>`,
  },
  {
    id: 'rio',
    name: 'Río en el valle',
    sky: SKY,
    svg: `${sun(170, 48, 22)}${cloud(40, 40, 0.8)}${cloud(264, 34, 0.9)}
      <path d="M0 178V70q60 10 120 44h100q60-34 120-44v108z" fill="var(--green-light)"/>
      <path d="M0 178V100q70 4 130 36h80q60-32 130-36v78z" fill="var(--green)"/>
      <path d="M158 114q-10 14 14 24t-56 40h112q34-28-14-42t-22-22z" fill="${WATER}"/>
      ${tree(60, 138, 1, 'var(--green-dark)')}${tree(88, 148, 0.8, 'var(--green-dark)')}${tree(262, 136, 1, 'var(--green-dark)')}${tree(292, 146, 0.8, 'var(--green-dark)')}
      <path d="M0 178v-20q40-10 80 20zM340 178v-20q-40-10-80 20z" fill="var(--green-dark)"/>`,
  },
  {
    id: 'agaves',
    name: 'Campo de agaves',
    sky: SKY,
    svg: `${sun(270, 50, 22)}${cloud(60, 40)}
      <path d="M0 178v-74q50-26 110-10t110-14t120 6v92z" fill="var(--green-light)"/>
      <path d="M0 178v-52q170-22 340 0v52z" fill="#c9955c"/>
      <path d="M0 140q170-20 340 0M0 156q170-18 340 0" fill="none" stroke="#a87440" stroke-width="3" opacity=".6"/>
      ${[40, 100, 160, 220, 280].map((x) => agave(x, 134, 0.55)).join('')}
      ${[20, 90, 170, 250, 320].map((x) => agave(x, 152, 0.8)).join('')}
      ${[56, 150, 240].map((x) => agave(x, 174, 1.15)).join('')}`,
  },
  {
    id: 'noche',
    name: 'Noche de campamento',
    sky: '#24455c',
    svg: `<circle cx="262" cy="46" r="20" fill="var(--cream)"/><circle cx="252" cy="40" r="17" fill="#24455c"/>
      <g fill="#fff"><circle cx="40" cy="30" r="1.8"/><circle cx="92" cy="54" r="1.5"/><circle cx="140" cy="24" r="1.8"/><circle cx="196" cy="60" r="1.4"/><circle cx="310" cy="84" r="1.6"/><circle cx="20" cy="76" r="1.4"/><circle cx="218" cy="22" r="1.5"/></g>
      <path d="M0 178V110q50-34 100-30q40 10 70 40q40-36 80-34q50 10 90 44v48z" fill="#2f5a4a"/>
      <path d="M0 178v-40q80-24 170-10t170-14v64z" fill="var(--green-dark)"/>
      ${pine(36, 144, 1.3, '#17321d')}${pine(64, 150, 1, '#17321d')}${pine(304, 140, 1.4, '#17321d')}
      <circle cx="214" cy="150" r="26" fill="var(--accent)" opacity=".22"/>
      <path d="M110 158l34-44 34 44z" fill="var(--tan)"/><path d="M144 114l-10 44h20z" fill="${WOOD}"/>
      <path d="M214 136q2 8 8 12a9 9 0 0 1-17 4q-1-5 3-8q3 2 3 4q2-5 3-12z" fill="var(--accent)"/>
      <path d="M202 160l24-5M202 155l24 5" stroke="${WOOD}" stroke-width="3.5" stroke-linecap="round"/>`,
  },
];

/** Paisaje del día: avanza uno cada día y vuelve a empezar después del último. */
export function sceneForDay(d: Date = new Date()): Scene {
  const dayNumber = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
  return SCENES[((dayNumber % SCENES.length) + SCENES.length) % SCENES.length];
}

/** SVG completo de un paisaje, con el borde ondulado de abajo que lo une al fondo. */
export function sceneMarkup(scene: Scene): string {
  return `<svg viewBox="0 0 340 178" role="img" aria-label="${scene.name}"><rect width="340" height="178" fill="${scene.sky}"/>${scene.svg}<path d="M0 179v-13q44 10 86 2t84-2t86 4t84-6v15z" fill="var(--bg)"/></svg>`;
}
