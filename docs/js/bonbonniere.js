/* page a propos : la bonbonniere, isolee dans un shadow DOM pour que le rendu du site n'y touche pas */
(function () {
  function mount(host) {
    if (host.shadowRoot) return;
    var root = host.attachShadow({ mode: 'open' });
    root.appendChild(document.getElementById('bonbon-tpl').content.cloneNode(true));
    (function (root) {

const { PAL, HAIRB, BROWS, STAR, face, CHUTE, avatar, full } = window.AVATAR;   // dessin de l'avatar : js/avatar.js
const OBJ = {
  loupe: '<svg viewBox="0 0 120 120"><circle cx="50" cy="50" r="32" fill="#DDEFF8" stroke="#3472F6" stroke-width="10"/><path d="M38 40 Q46 30 58 32" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="74" y="70" width="16" height="42" rx="8" fill="#FF5B4D" transform="rotate(-45 82 91)"/></svg>',
  palette: '<svg viewBox="0 0 120 120"><path d="M60 12 C28 12 10 36 12 62 C14 92 38 108 58 104 C70 102 66 90 74 86 C84 82 100 92 106 74 C114 46 92 12 60 12 Z" fill="#F2D6A8"/><circle cx="40" cy="40" r="10" fill="#FF5B4D"/><circle cx="66" cy="32" r="10" fill="#FFB92F"/><circle cx="88" cy="50" r="10" fill="#36A96B"/><circle cx="34" cy="70" r="10" fill="#3472F6"/><circle cx="56" cy="84" r="9" fill="#F47EB3"/></svg>'
};
const INFO = [
  { t: 'qui suis-je', x: 'Je suis un peu comme un citron caviar : <b><i>« Pétillante, surprenante et pleine de pépins créatifs ! »</i></b>. J’aime expérimenter et sortir des sentiers battus. On me découvre petit à petit, au fil de mes idées et de mes <b>multiples facettes</b>.', ic: () => avatar('wink') },
  { t: 'ce que je cherche', x: 'Je recherche un <b>stage en design d’espace, scénographie</b> ou <b>design immersif</b>, au sein d’une agence ou d’un studio qui laisse place à la créativité, à l’expérimentation et aux idées audacieuses.', ic: () => avatar('think') },
  { t: 'ma vision', x: 'Créer des univers qui ne se regardent pas seulement, mais qui se ressentent. Jouer avec les <b>contrastes</b>, la <b>couleur</b> et <b>l’étrangeté</b> pour surprendre, intriguer et éveiller <b>l’imagination</b>.', ic: () => avatar('star') },
  { t: 'ce qui me nourrit', x: '• les couleurs, les matières et les textures<br>• les contrastes et les associations inattendues<br>• les univers étranges, immersifs et imaginaires<br>• la curiosité, la recherche et la découverte<br>• tout ce qui sort de l’ordinaire et <b>bouscule les perceptions</b>', ic: () => avatar('love') },
  { t: 'ce qui me tient à cœur', x: 'Créer des espaces qui racontent des histoires sans imposer leur interprétation. Laisser place à la curiosité, à <b>l’émotion</b> et à l’imagination de chacun, tout en gardant cette <b>spontanéité créative propre à l’enfance</b>.', ic: () => avatar('happy') }
];
// emplacements des etiquettes sur le tableau
const SLOTS = [{ x: 10, y: -20, r: -3 }, { x: 285, y: 0, r: 2.5 }, { x: 560, y: -34, r: -2 }, { x: 60, y: 262, r: 2 }, { x: 340, y: 276, r: -3 }];
const board = root.getElementById('board');
SLOTS.forEach((s, i) => { const d = document.createElement('div'); d.className = 'slot'; d.style.left = s.x + 'px'; d.style.top = s.y + 'px'; d.style.setProperty('--r', s.r + 'deg'); d.textContent = '?'; board.appendChild(d); });

// ---- dome : vraies boules qui se melangent ----
const NS = 'http://www.w3.org/2000/svg', R = 19, B = [], gB = root.getElementById('balls');
for (let i = 0; i < 52; i++) {
  const c = PAL[i % 5], el = document.createElementNS(NS, 'g');
  el.innerHTML = `<circle r="${R}" fill="${c}"/><circle r="${R}" fill="url(#shade)"/><ellipse cx="-7" cy="-8" rx="6" ry="4" fill="#fff" opacity=".8" transform="rotate(-35 -7 -8)"/>`;
  gB.appendChild(el); B.push({ x: 90 + Math.random() * 240, y: 200 + Math.random() * 200, vx: 0, vy: 0, el, c });
}
const CX = 210, CY = 270, RR = 160 - R;
let shake = 0;
const tick = () => {
  for (let k = 0; k < 3; k++) {
    for (const b of B) {
      b.vy += .3;
      if (shake > 0) { b.vx += (Math.random() - .5) * 3; b.vy -= Math.random() * 2.2; }
      b.vx *= .98; b.vy *= .98; b.x += b.vx * .4; b.y += b.vy * .4;
      const dx = b.x - CX, dy = b.y - CY, d = Math.hypot(dx, dy);
      if (d > RR) { const nx = dx / d, ny = dy / d; b.x = CX + nx * RR; b.y = CY + ny * RR; const vn = b.vx * nx + b.vy * ny; if (vn > 0) { b.vx -= 1.4 * vn * nx; b.vy -= 1.4 * vn * ny; } }
    }
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
      const a = B[i], b = B[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), m = 2 * R;
      if (d > 0 && d < m) { const o = (m - d) / 2, nx = dx / d, ny = dy / d; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o; const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv < 0) { a.vx += rv * nx * .5; a.vy += rv * ny * .5; b.vx -= rv * nx * .5; b.vy -= rv * ny * .5; } }
    }
  }
  if (shake > 0) shake--;
  for (const b of B) b.el.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`);
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);

// ---- jeu ----
const page = root.getElementById('page'), mach = root.getElementById('mach'), body = root.getElementById('body'), lever = root.getElementById('lever');
const neckBeads = root.getElementById('beads'), lbl = root.getElementById('lbl'), string = root.getElementById('string');
let next = 0, busy = false, got = 0, skipped = false; const added = new Set(), gone = [];
const gav = root.getElementById('gav'), gbub = root.getElementById('gbub');
const say = (txt, expr) => { gbub.textContent = txt; gbub.classList.remove('bp'); void gbub.offsetWidth; gbub.classList.add('bp'); gav.innerHTML = full(expr || 'normal'); gav.classList.remove('hop'); void gav.offsetWidth; gav.classList.add('hop'); };
say('psst… tire la manette !', 'normal');
window.__avFull = full; window.__chute = CHUTE;
// j'arrive en parachute quand on descend sur la page
root.getElementById('gchute').innerHTML = CHUTE(61, 139, 322);
const guide = root.getElementById('guide'); let landed = false;
new IntersectionObserver((es) => es.forEach((e) => {
  if (e.intersectionRatio >= .55 && !landed) {
    landed = true; guide.classList.remove('land'); void guide.offsetWidth; guide.classList.add('land');
    setTimeout(() => { guide.classList.remove('land'); say(gbub.textContent || 'psst… tire la manette !', 'wink'); }, 2450);
  } else if (e.intersectionRatio < .1 && landed) { landed = false; resetGame(); }
}), { threshold: [0, .1, .55, .8] }).observe(host);
root.getElementById('skip').onclick = () => {
  root.getElementById('skip').classList.add('gone'); say('pas de souci, voilà tout !', 'wink');
  skipped = true; root.querySelectorAll('.ball').forEach((b) => b.remove()); busy = false; next = INFO.length;
  let k = 0; INFO.forEach((_, i) => { if (!added.has(i)) setTimeout(() => addNote(i), 260 * k++); });
};
const give = () => {
  if (busy || skipped) return;
  if (next >= INFO.length) { shake = 60; return; }
  const n = next === 0 ? 3 : INFO.length - next, ids = [];
  for (let j = 0; j < n; j++) ids.push(next++);
  busy = true; let left = n;
  // une boule ouverte ouvre aussi ses voisines (toutes celles tombées en même temps)
  const batch = [];
  const openBall = (b, i) => {
    if (b.classList.contains('open')) return; b.classList.add('open');
    setTimeout(() => addNote(i), 900);
    setTimeout(() => { b.remove(); if (--left === 0) busy = false; }, 1400);
  };
  shake = 75; body.classList.remove('shake'); void body.getBoundingClientRect(); body.classList.add('shake');
  lever.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(96px)', offset: .35 }, { transform: 'translateY(0)' }], { duration: 750, easing: 'cubic-bezier(.3,1.4,.5,1)' });
  const xs = n === 3 ? [1066, 1130, 1194] : [1098, 1162];
  ids.forEach((i, j) => setTimeout(() => {
    if (skipped) return;
    const c = PAL[i], k = B.findIndex(b => b.c === c); if (k >= 0) { B[k].el.remove(); gone.push(B.splice(k, 1)[0]); }
    const ball = document.createElement('div'); ball.className = 'ball'; ball.style.setProperty('--c', c);
    ball.innerHTML = `<div class="pop">${INFO[i].ic()}</div><span class="h h1"></span><span class="h h2"></span>`;
    batch.push({ b: ball, i: i });
    ball.style.left = xs[j] + 'px'; ball.style.top = (100 + 556) + 'px'; page.appendChild(ball);
    ball.animate([{ opacity: 1, transform: 'translate(0,-70px) scale(.5)' }, { opacity: 1, transform: 'translate(-6px,0) rotate(250deg)', offset: .65 }, { opacity: 1, transform: 'translate(0,-12px) rotate(320deg)', offset: .82 }, { opacity: 1, transform: 'translate(0,0) rotate(360deg)' }], { duration: 900, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' });
    if (j === 0) say(n === 3 ? 'ouvre-les vite !' : 'encore 2 !', 'star');
    ball.onclick = () => {
      if (ball.classList.contains('open')) return;
      batch.opened = true;
      openBall(ball, i);
      batch.filter((x) => x.b !== ball).forEach((x, k) => setTimeout(() => openBall(x.b, x.i), 160 * (k + 1)));
    };
    // si on a déjà ouvert une boule avant que celle-ci ne tombe, elle s'ouvre dès qu'elle est posée
    if (batch.opened) setTimeout(() => openBall(ball, i), 950);
  }, 650 + 260 * j));
};
const addNote = (i) => {
  if (added.has(i)) return; added.add(i);
  const s = SLOTS[i], c = PAL[i], n = document.createElement('div');
  n.className = 'note'; n.style.left = s.x + 'px'; n.style.top = s.y + 'px'; n.style.setProperty('--r', s.r + 'deg'); n.style.setProperty('--c', c);
  n.innerHTML = `<span class="tape"></span><p class="lil">${INFO[i].t}</p><p>${INFO[i].x}</p>`;
  board.appendChild(n); requestAnimationFrame(() => n.classList.add('in'));
  board.children[i].style.opacity = '0';
  // perle sur le collier
  const t = (i + .5) / 5, x = 10 + 700 * t, y = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 170 + t * t * 20;
  const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'bead');
  g.innerHTML = `<g transform="translate(${x} ${y})"><circle r="24" fill="${c}"/><circle r="24" fill="url(#shade)"/><ellipse cx="-8" cy="-9" rx="7" ry="4.5" fill="#fff" opacity=".8" transform="rotate(-35 -8 -9)"/><circle r="5" fill="#fff" opacity=".5"/></g>`;
  neckBeads.appendChild(g);
  g.animate([{ transform: 'translateY(-90px) scale(.3)', opacity: 0 }, { transform: 'translateY(0) scale(1.25)', opacity: 1, offset: .7 }, { transform: 'scale(1)' }], { duration: 650, easing: 'cubic-bezier(.3,1.5,.5,1)' });
  string.classList.remove('boing'); void string.getBoundingClientRect(); string.classList.add('boing');
  got++; lbl.textContent = 'ma collection : ' + got + ' / 5';
  if (got < INFO.length) say(['', 'encore 4 !', 'plus que 3 !', 'encore 2 !', 'la dernière !'][got], got % 2 ? 'star' : 'wink');
  if (got === INFO.length) setTimeout(win, 1100);
};
const win = () => {
  say('bravo !! tu sais tout', 'love'); gav.classList.add('dance'); root.getElementById('skip').classList.add('gone');
  root.getElementById('gold').classList.add('show');
  for (let k = 0; k < 26; k++) {
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'conf');
    s.innerHTML = `<path d="M12 1.5 L14.9 8.6 L22.5 9.2 L16.7 14.1 L18.5 21.6 L12 17.6 L5.5 21.6 L7.3 14.1 L1.5 9.2 L9.1 8.6 Z" fill="${PAL[k % 5]}"/>`;
    const a = k / 26 * Math.PI * 2; s.style.left = '450px'; s.style.top = '400px';
    s.style.setProperty('--x', Math.cos(a) * (220 + Math.random() * 160) + 'px'); s.style.setProperty('--y', Math.sin(a) * (160 + Math.random() * 120) + 'px');
    page.appendChild(s); setTimeout(() => s.remove(), 1500);
  }
};
const resetGame = () => {
  next = 0; got = 0; busy = false; skipped = false; added.clear();
  root.querySelectorAll('.ball, .note, .conf').forEach((el) => el.remove());
  Array.prototype.forEach.call(board.children, (d) => { d.style.opacity = ''; });
  neckBeads.innerHTML = ''; lbl.textContent = 'ma collection : 0 / 5';
  gone.splice(0).forEach((b) => { b.x = 120 + Math.random() * 180; b.y = 140; gB.appendChild(b.el); B.push(b); });
  root.getElementById('gold').classList.remove('show'); root.getElementById('skip').classList.remove('gone');
  gav.classList.remove('dance'); hinted = false; say('psst… tire la manette !', 'normal');
};
const toast = (t) => { const e = root.getElementById('toast'); e.textContent = t; e.classList.add('on'); setTimeout(() => e.classList.remove('on'), 3200); };
// le bouton « mon CV » du ticket d'or ouvre le CV (cv/CV-Soleane-Gros.pdf) dans un nouvel onglet
root.getElementById('mail').onclick = (e) => { e.preventDefault(); if (window.__openLetter) window.__openLetter(); };
root.querySelector('.tk .x').onclick = () => root.getElementById('gold').classList.remove('show');

// tirer la manette (ou simplement cliquer sur la machine)
let y0 = null, pulled = 0;
lever.addEventListener('pointerdown', (e) => { e.stopPropagation(); lever.setPointerCapture(e.pointerId); y0 = e.clientY; pulled = 0; });
lever.addEventListener('pointermove', (e) => { if (y0 === null) return; pulled = Math.max(0, Math.min(96, e.clientY - y0)); lever.style.transform = `translateY(${pulled}px)`; });
lever.addEventListener('pointerup', (e) => { e.stopPropagation(); lever.style.transform = ''; y0 = null; give(); });
mach.addEventListener('click', (e) => { if (!e.target.closest('#lever')) give(); });

    })(root);
  }
  setInterval(function () { var h = document.getElementById('bonbon-host'); if (h && !h.shadowRoot) mount(h); }, 300);
})();
