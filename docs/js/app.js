/* Moteur du portfolio : mise à l'échelle, composant principal, navigation entre les pages. Partagé par les 3 pages. */
/* Mise à l'échelle : le site est dessiné pour 1440 × 900 et se réduit
   proportionnellement pour que chaque page tienne entière dans l'écran. */
(function () {
  var DESIGN_W = 1440, DESIGN_H = 900;
  var app = document.getElementById('app');
  function fit() {
    var s = Math.min(1, window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
    var w = window.innerWidth / s, h = window.innerHeight / s;
    window.__S = s;
    app.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0;width:' + w + 'px;height:' + h + 'px;transform:scale(' + s + ')';
    app.style.setProperty('--vw', (w / 100) + 'px');
    app.style.setProperty('--vh', (h / 100) + 'px');
  }
  fit();
  window.addEventListener('resize', fit);
})();


/* Ton adresse email : le bouton « email » ouvre un nouveau message adressé ici */
const MY_EMAIL = 'soleanegros@gmail.com';

/* page affichée : 'accueil' (couverture + projets), 'curiosites' ou 'apropos' (attribut data-page du <body>) */
const PAGE = document.body.dataset.page || 'accueil';

class Component extends DCLogic {
  componentDidMount() {
    window.__openLetter = () => this.setState({ open: 'letter', menu: false, letter: null });
    // toute photo de projet s'agrandit au clic ; Échap la referme
    if (!window.__lbInit) {
      window.__lbInit = true;
      // croquis du carnet : on enlève le fond du papier (fond estimé localement, puis rendu transparent)
      const cutCache = {};
      const cutBg = (img) => {
        // désactivé à la demande de Soléane : les images du carnet restent telles quelles (le blanc du papier est gardé)
        if (!window.__cutBg) return;
        if (!img || !img.classList || !img.classList.contains('bkimg')) return;
        const src = img.getAttribute('src');
        if (!src || src === img.dataset.cut) return;
        // les perspectives et les expériences (ciels, couleurs, papier rouge) restent telles quelles
        // les croquis « -cut » sont déjà détourés (fichiers prêts) : plus aucun calcul pendant qu'on tourne les pages
        if (/persp-|exp-|affiche-|-cut\./.test(src)) return;
        if (cutCache[src]) { img.dataset.cut = cutCache[src]; img.src = cutCache[src]; return; }
        try {
          const k = Math.min(1, 1100 / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
          if (!w || !h) return;
          const c = document.createElement('canvas'); c.width = w; c.height = h;
          const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
          const d = x.getImageData(0, 0, w, h), px = d.data;
          // fond : couleur la plus claire de chaque case de 28 px, lissée
          const cs = 28, gw = Math.ceil(w / cs), gh = Math.ceil(h / cs), g = document.createElement('canvas'); g.width = gw; g.height = gh;
          const gx = g.getContext('2d'), gd = gx.createImageData(gw, gh);
          for (let cy = 0; cy < gh; cy++) for (let cx = 0; cx < gw; cx++) {
            let br = 0, bv = [255, 255, 255];
            for (let yy = cy * cs; yy < Math.min(h, cy * cs + cs); yy += 2) for (let xx = cx * cs; xx < Math.min(w, cx * cs + cs); xx += 2) {
              const i = (yy * w + xx) * 4, l = px[i] + px[i + 1] + px[i + 2];
              if (l > br) { br = l; bv = [px[i], px[i + 1], px[i + 2]]; }
            }
            const o = (cy * gw + cx) * 4; gd.data[o] = bv[0]; gd.data[o + 1] = bv[1]; gd.data[o + 2] = bv[2]; gd.data[o + 3] = 255;
          }
          gx.putImageData(gd, 0, 0);
          const b = document.createElement('canvas'); b.width = w; b.height = h;
          const bx = b.getContext('2d'); bx.imageSmoothingEnabled = true; bx.filter = 'blur(6px)'; bx.drawImage(g, 0, 0, w, h);
          const bg = bx.getImageData(0, 0, w, h).data;
          for (let i = 0; i < px.length; i += 4) {
            const r = Math.min(255, px[i] * 255 / Math.max(1, bg[i])), gg = Math.min(255, px[i + 1] * 255 / Math.max(1, bg[i + 1])), bb = Math.min(255, px[i + 2] * 255 / Math.max(1, bg[i + 2]));
            const dk = 255 - Math.min(r, gg, bb);
            const a = Math.max(0, Math.min(255, (dk - 34) * 3.6));
            // le trait garde sa couleur, un peu renforcée pour rester lisible sur le papier
            const f = dk > 34 ? Math.max(0, 1 - 26 / dk) : 1;
            px[i] = r * f; px[i + 1] = gg * f; px[i + 2] = bb * f; px[i + 3] = a;
          }
          x.putImageData(d, 0, 0);
          const url = c.toDataURL('image/png');
          cutCache[src] = url; cutCache[url] = url; img.dataset.cut = url; img.src = url;
        } catch (err) { img.dataset.cut = src; }
      };
      document.addEventListener('load', (e) => cutBg(e.target), true);
      // un clic hors du menu le referme
      document.addEventListener('click', (e) => { const t = e.target; if ((this.state || {}).menu && t && t.closest && !t.closest('nav[aria-label="Menu du site"], [aria-label="Menu"]')) this.setState({ menu: false }); }, true);
      new MutationObserver(() => document.querySelectorAll('img.bkimg').forEach((im) => { if (im.complete && im.naturalWidth && im.getAttribute('src') !== im.dataset.cut) cutBg(im); })).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
      document.addEventListener('click', (e) => {
        // (les images du carnet ne s'agrandissent pas)
        const im = e.target && e.target.closest ? e.target.closest('img.gph') : null;
        if (im) {
          e.stopPropagation();
          // dans une pellicule, on garde toute la bande pour pouvoir passer d'une photo à l'autre
          // photos regroupées (data-grp) : on passe de l'une à l'autre avec les flèches, sans sortir de la catégorie
          const grp = im.dataset.grp ? Array.prototype.slice.call(document.querySelectorAll('img.gph[data-grp="' + im.dataset.grp + '"]')) : im.classList.contains('fimg') ? Array.prototype.slice.call(document.querySelectorAll('img.fimg')) : (im.classList.contains('mimg') ? Array.prototype.slice.call(document.querySelectorAll('img.mimg')) : [im]);
          this.lbList = grp.map((g) => ({ src: g.currentSrc || g.src, alt: g.alt || '' }));
          this.lbIdx = Math.max(0, grp.indexOf(im));
          this.setState({ lb: im.currentSrc || im.src, lbAlt: im.alt || '', lbMany: this.lbList.length > 1 });
        }
      }, true);
      document.addEventListener('keydown', (e) => {
        const s0 = this.state || {};
        if (e.key === 'Escape') { if (s0.vlb) this.setState({ vlb: null }); else if (s0.lb) this.setState({ lb: null }); else if (s0.cab) this.setState({ cab: s0.cab === 'film' ? 'rolls' : null }); else if (s0.book) this.setState({ book: false, bookOpen: false }); else if (s0.open) this.setState({ open: null }); else if (s0.menu) this.setState({ menu: false }); return; }
        if (s0.lb && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && this.lbList && this.lbList.length > 1) {
          e.preventDefault(); e.stopPropagation();
          const n = this.lbList.length;
          this.lbIdx = (this.lbIdx + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
          const it = this.lbList[this.lbIdx];
          this.setState({ lb: it.src, lbAlt: it.alt });
        }
      }, true);
    }
    this.target = null;
    this.head = { hx: 0, hy: 0, hr: 0, ex: 0, ey: 0 };
    this.pts = [];
    for (let i = 0; i < 7; i++) this.pts.push({ x: -300, y: -300 });
    const cl = (v, m) => Math.max(-m, Math.min(m, v));
    const tick = () => {
      let moved = 0;
      if (this.target) {
        let prev = this.target;
        this.pts = this.pts.map((p) => {
          const np = { x: p.x + (prev.x - p.x) * 0.16, y: p.y + (prev.y - p.y) * 0.16 };
          moved += Math.abs(np.x - p.x) + Math.abs(np.y - p.y);
          prev = np;
          return np;
        });
      }
      const ph = (this.state || {}).phase;
      let goal = { hx: 0, hy: 0, hr: 0, ex: 0, ey: 0 };
      if (ph === 'look') goal = { hx: 0, hy: 8, hr: 0, ex: 0, ey: 3.5 };
      else if (this.target && this.avEl && this.rootEl) {
        const r = this.avEl.getBoundingClientRect(), rr = this.rootEl.getBoundingClientRect(), S = window.__S || 1;
        const dx = this.target.x - (r.left - rr.left + r.width * 0.5) / S;
        const dy = this.target.y - (r.top - rr.top + r.height * 0.32) / S;
        goal = { hx: cl(dx / 45, 9), hy: cl(dy / 60, 6), hr: cl(dx / 70, 9), ex: cl(dx / 80, 3.2), ey: cl(dy / 90, 2.6) };
      }
      const st0 = this.state || {};
      // yeux : ils grossissent sur place (surprise) seulement quand la souris est sur l'avatar
      const esg = 1;
      const es0 = this.es || 1, es1 = es0 + (esg - es0) * 0.22;
      moved += Math.abs(es1 - es0); this.es = es1;
      const h = this.head;
      Object.keys(goal).forEach((k) => { const n = h[k] + (goal[k] - h[k]) * 0.08; moved += Math.abs(n - h[k]); h[k] = n; });
      // souris immobile : on ne garde que l'étoile du curseur
      if (!st0.still && this.lastMoveAt && Date.now() - this.lastMoveAt > 160) this.setState({ still: true });
      // la guirlande défile doucement de droite à gauche tant qu'on n'y touche pas
      const stA = this.strip, scA = this.sc, bdA = this.bd;
      if (stA && scA && bdA && (st0.phase === 'board' || st0.phase === 'dizzy') && !st0.open && !st0.cab && !st0.book && !this.stripHover && !this.barDrag
          && Math.abs(scA.scrollTop - bdA.offsetTop) < 60 && Date.now() > (this.userUntil || 0) + 2500) {
        const maxA = stA.scrollWidth - stA.clientWidth;
        if (maxA > 0) {
          if (this.autoX == null || Math.abs(stA.scrollLeft - this.autoX) > 3) this.autoX = stA.scrollLeft;
          if (this.autoX >= maxA - 1) {
            if (!this.autoBackAt) this.autoBackAt = Date.now() + 1600;
            else if (Date.now() > this.autoBackAt) { this.autoBackAt = 0; this.autoX = 0; this.userUntil = Date.now() - 1500; stA.scrollTo({ left: 0, behavior: 'smooth' }); }
          } else { this.autoX = Math.min(maxA, this.autoX + 0.7); stA.scrollLeft = this.autoX; }
        }
      } else this.autoX = null;
      if (moved > 0.005) this.setState({ t: Date.now() });
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    if (PAGE !== 'accueil') {
      // pages Curiosités et À propos : pas d'intro, l'avatar principal reste caché (c'est le toboggan / le guide qui jouent)
      this.setState({ phase: 'board', pos: 'board', avX: 14, away: true, allSeen: true });
    } else if (location.hash === '#projets') {
      // arrivée depuis une autre page (menu « les projets ») : directement sur la guirlande
      try { sessionStorage.setItem('pf-spot', JSON.stringify({ sec: 1, sl: 0, t: Date.now() })); } catch (e) {}
      history.replaceState(null, '', location.pathname);
      this.restoreSpot();
    } else if (location.hash === '#debut') {
      // menu « revenir au début » depuis une autre page : on repart de la boule
      try { sessionStorage.removeItem('pf-spot'); } catch (e) {}
      history.replaceState(null, '', location.pathname);
    } else if ((this.props.showIntro ?? true) === false) this.startCover();
    else this.restoreSpot();
    window.addEventListener('pagehide', () => this.saveSpot());
  }
  componentWillUnmount() { cancelAnimationFrame(this.raf); this.clearT(); }
  clearT() { (this.timers || []).forEach((t) => clearTimeout(t)); this.timers = []; }
  later(fn, ms) { this.timers = this.timers || []; this.timers.push(setTimeout(fn, ms)); }
  walk(dir) {
    clearTimeout(this.wt2);
    this.wt2 = setTimeout(() => {
      const st = this.state || {};
      if (!this.strip || !this.rootEl) return;
      const S = window.__S || 1, rb = this.rootEl.getBoundingClientRect();
      const rr = { left: rb.left, width: rb.width / S };
      const half = 125;
      const cur = (st.avX ?? 14) + half;
      const cs = Array.prototype.map.call(this.strip.querySelectorAll('.swing'), (el) => { const r = el.getBoundingClientRect(); return (r.left - rr.left + r.width / 2) / S; })
        .filter((c) => c > half && c < rr.width - half && ((this.state || {}).stripFull || c > rr.width * 0.45)).sort((a, b) => a - b);
      let next = dir === 'l' ? cs.filter((c) => c < cur - 40).pop() : cs.find((c) => c > cur + 40);
      if (next === undefined) next = dir === 'l' ? half + 14 : rr.width - half - 14;
      const x = Math.max(14, Math.min(rr.width - 520, Math.round(next - half)));
      const dur = Math.max(0.5, Math.abs(x - (st.avX ?? 14)) / 320);
      this.setState({ walk: true, face: dir === 'l' ? 'l' : 'r', avX: x, avDur: dur.toFixed(2) + 's' });
      clearTimeout(this.wt);
      this.wt = setTimeout(() => this.setState({ walk: false }), dur * 1000 + 60);
    }, 380);
  }
  /* ---------- Barre de progression des projets (étoile qui roule) ---------- */
  setupBar(el) {
    if (!el || this.barEl === el) return;
    this.barEl = el;
    const seek = (clientX) => {
      if (!this.strip) return;
      const r = el.getBoundingClientRect();
      const frac = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      this.userUntil = Date.now() + 400;
      this.strip.scrollLeft = frac * (this.strip.scrollWidth - this.strip.clientWidth);
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      this.barDrag = true; el.classList.add('drag');
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
      seek(e.clientX);
    });
    el.addEventListener('pointermove', (e) => { if (this.barDrag) seek(e.clientX); });
    const stop = () => { this.barDrag = false; el.classList.remove('drag'); };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    el.addEventListener('keydown', (e) => {
      if (!this.strip) return;
      const step = e.key === 'ArrowRight' ? 330 : e.key === 'ArrowLeft' ? -330 : 0;
      if (step) { e.preventDefault(); this.userUntil = Date.now() + 900; this.strip.scrollBy({ left: step, behavior: 'smooth' }); }
    });
    this.updateBar();
  }
  updateBar() {
    const el = this.barEl, st = this.strip;
    if (!el || !st) return;
    const max = st.scrollWidth - st.clientWidth;
    const frac = max > 0 ? Math.max(0, Math.min(1, st.scrollLeft / max)) : 0;
    const w = el.clientWidth, half = 23;
    const x = half + frac * (w - 2 * half);
    const star = el.querySelector('.pbar-star'), fill = el.querySelector('.pbar-fill');
    if (star) star.style.transform = 'translateX(' + x.toFixed(1) + 'px) rotate(' + (frac * 1080).toFixed(1) + 'deg)';
    if (fill) fill.style.width = Math.max(0, x - 4).toFixed(1) + 'px';
    el.setAttribute('aria-valuenow', Math.round(frac * 100));
    // projets entierement vus dans la guirlande
    if (!(this.state || {}).allSeen) {
      const sr = st.getBoundingClientRect();
      this.seen = this.seen || {};
      // il faut amener mon avatar jusqu'au bout de la ligne ; 1 s apres, le bouton curiosites apparait
      if (frac >= .985) { if (!this.endT) this.endT = setTimeout(() => { this.endT = null; this.setState({ allSeen: true }); }, 1000); } else if (this.endT) { clearTimeout(this.endT); this.endT = null; }
    }
    // le mini-avatar marche sur la ligne, à la place de l'étoile
    const root = (this.avEl && this.avEl.offsetParent) || this.rootEl;
    if (root) {
      const S = window.__S || 1, rb = root.getBoundingClientRect(), r = el.getBoundingClientRect();
      const bx = Math.round((r.left - rb.left) / S + x - 25), pbx = (this.state || {}).bx;
      if (pbx !== bx) {
        const d = pbx == null ? 0 : bx - pbx;
        this.setState(d ? { bx: bx, walk: true, face: d < 0 ? 'l' : 'r' } : { bx: bx });
        if (d) { clearTimeout(this.wt); this.wt = setTimeout(() => this.setState({ walk: false }), 200); }
      }
    }
    // 2e guirlande : elle part dans l'autre sens (de gauche à droite)
    if (this.row2 && this.row2.parentNode) {
      const max2 = Math.max(0, this.row2.offsetWidth - this.row2.parentNode.clientWidth);
      this.row2.style.transform = 'translateX(' + (-(1 - frac) * max2).toFixed(1) + 'px)';
    }
  }
  /* ---------- Page 4 : le carnet des curiosités ---------- */
  /* ---------- Navigation entre les 3 pages ---------- */
  goPage(url) {
    this.setState({ menu: false, open: null, book: false, bookOpen: false, cab: null, lb: null, vlb: null });
    if (location.pathname.split('/').pop() === url) return;
    this.saveSpot();
    window.location.href = url;
  }
  toCarnet() { this.goPage('curiosites.html'); }
  lbStep(d) {
    const L = this.lbList || [];
    if (L.length < 2) return;
    this.lbIdx = ((this.lbIdx || 0) + d + L.length) % L.length;
    this.setState({ lb: L[this.lbIdx].src, lbAlt: L[this.lbIdx].alt });
  }
  /* ---------- Se souvenir de la page (retour depuis Instagram) ---------- */
  secTops() { return [0, this.bd ? this.bd.offsetTop : 1, this.cn ? this.cn.offsetTop : 2, this.ab ? this.ab.offsetTop : 3]; }
  saveSpot() {
    try {
      const st = this.state || {};
      if (PAGE !== 'accueil' || !this.sc || ['ball', 'opening', 'closing'].indexOf(st.phase) >= 0) return;
      const tops = this.secTops(), top = this.sc.scrollTop;
      let sec = 0; tops.forEach((t, i) => { if (top >= t - 40) sec = i; });
      sessionStorage.setItem('pf-spot', JSON.stringify({ sec: sec, sl: this.strip ? this.strip.scrollLeft : 0, t: Date.now() }));
    } catch (e) {}
  }
  restoreSpot() {
    let sv = null;
    try { sv = JSON.parse(sessionStorage.getItem('pf-spot') || 'null'); } catch (e) {}
    if (!sv || typeof sv.sec !== 'number' || Date.now() - sv.t > 2 * 3600 * 1000) return false;
    const sec = Math.max(0, Math.min(3, sv.sec));
    if (sec >= 2) this.setState({ allSeen: true });
    this.lockUntil = Date.now() + 700;
    this.setState({ phase: sec === 0 ? 'cover' : 'board', pos: sec === 0 ? 'peek' : 'board', avX: 14, waving: false });
    setTimeout(() => {
      const tops = this.secTops();
      if (this.sc) { this.sc.scrollTop = tops[sec] || 0; this.lastTop = this.sc.scrollTop; }
      if (sec === 0) this.resetProjects(); else if (this.strip && sv.sl) { this.strip.scrollLeft = sv.sl; this.updateBar(); }
      const svg = document.querySelector('.covttl'); if (svg) svg.classList.add('alive');
    }, 90);
    return true;
  }
  /* ---------- La lettre : envoi + avion en papier ---------- */
  sendLetter() {
    const f = this.letterEl || document.querySelector('.lform');
    if (!f || (this.state || {}).letter === 'fly') return;
    if (f.reportValidity && !f.reportValidity()) return;
    const v = (n) => ((f.elements[n] || {}).value || '').trim();
    const data = { nom: v('nom'), email: v('email'), sujet: v('sujet'), message: v('message'), _subject: 'Portfolio : ' + v('sujet') + ' (' + v('nom') + ')', _replyto: v('email'), _template: 'box', _captcha: 'false' };
    this.letterOk = null;
    this.setState({ letter: 'fly', letterMsg: 'envoyé ! ✈' });
    try {
      fetch('https://formsubmit.co/ajax/' + MY_EMAIL, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then((r) => r.json()).then((j) => { this.letterOk = !!j && (j.success === true || j.success === 'true'); if (!this.letterOk) console.warn('FormSubmit :', j && j.message); })
        .catch((err) => { this.letterOk = false; console.warn('FormSubmit injoignable :', err); });
    } catch (e) { this.letterOk = false; }
    this.later(() => {
      // si le service d'envoi n'a pas répondu « ok », on ouvre la messagerie avec la lettre déjà écrite
      if (this.letterOk === false) {
        const body = data.message + '\n\n— ' + data.nom + ' (' + data.email + ')';
        window.location.href = 'mailto:' + MY_EMAIL + '?subject=' + encodeURIComponent(data._subject) + '&body=' + encodeURIComponent(body);
      }
      this.setState({ open: null, letter: null });
    }, 3400);
  }
  /* ---------- Titre PORTFOLIO : le I tombe, le O roule, effet domino ---------- */
  stopDomino() {
    clearTimeout(this.domT); clearTimeout(this.domStartT);
    (this.domAnims || []).forEach((a) => { try { a.cancel(); } catch (e) {} });
    this.domAnims = [];
    const svg = document.querySelector('.covttl');
    if (svg) svg.classList.remove('alive');
  }
  startDomino() {
    this.stopDomino();
    const svg = document.querySelector('.covttl');
    if (!svg || !svg.animate) { if (svg) svg.classList.add('alive'); return; }
    // ordre dans le SVG : P O R T F O L, puis le dernier O, puis le I (dessiné au-dessus du O pour tomber VRAIMENT dessus)
    const L = Array.prototype.slice.call(svg.querySelectorAll('.dom'));
    if (L.length < 9) { svg.classList.add('alive'); return; }
    const O = 7, I = 8, out = this.domAnims, ms = 1000;
    // bords figés (Safari) : on mesure les lettres sans leur image figée, qui déborde un peu
    const PFI = Array.prototype.slice.call(svg.querySelectorAll('[data-pf-img]'));
    PFI.forEach((im) => { im.style.display = 'none'; });
    const B = L.map((el) => { try { return el.getBBox(); } catch (e) { return null; } });
    PFI.forEach((im) => { im.style.display = ''; });
    if (B.some((b) => !b || !b.width)) { svg.classList.add('alive'); return; }
    const anim = (el, frames, dur) => {
      let prev = 0; frames.forEach((f) => { if (f.offset !== undefined) { f.offset = Math.min(1, Math.max(prev, f.offset)); prev = f.offset; } });
      try { const a = el.animate(frames, { duration: dur * ms, fill: 'forwards', easing: 'linear' }); out.push(a); return a; } catch (e) { return null; }
    };
    L.forEach((el, i) => { el.style.transformOrigin = i === I ? '100% 100%' : (i === O ? '50% 50%' : '0% 100%'); });
    const bO = B[O], bI = B[I], R = bO.width / 2;
    const px = bI.x + bI.width, py = bI.y + bI.height, hI = bI.height;   // pivot du I (en bas à droite)
    // mur = le bord droit de la page (converti en unités du SVG)
    const rect = svg.getBoundingClientRect(), k = rect.width / 1223;
    const pageR = (this.rootEl ? this.rootEl.getBoundingClientRect().right : window.innerWidth);
    const wall = Math.max(60, (pageR - rect.left) / k - (bO.x + bO.width) - 6);
    const deg = (dx) => (dx / R) * 57.3;
    const tf = (x, y, r, sx, sy) => 'translate(' + x.toFixed(1) + 'px,' + (y || 0).toFixed(1) + 'px) rotate(' + r.toFixed(1) + 'deg) scale(' + (sx || 1) + ',' + (sy || 1) + ')';
    // 1. le I bascule : on calcule l'angle EXACT où son bord touche la tête (cercle) pour qu'elle parte pile au contact
    const ocx = bO.x + bO.width / 2, ocy = bO.y + bO.height / 2, orad = Math.min(bO.width, bO.height) / 2 * 0.9;
    let thC = 30;
    for (let a = 0; a <= 70; a += 0.5) {
      const r = a * Math.PI / 180; let hit = false;
      for (let s = 0.3; s <= 1.001; s += 0.05) { const qx = px + s * hI * Math.sin(r), qy = py - s * hI * Math.cos(r); if (Math.hypot(qx - ocx, qy - ocy) <= orad) { hit = true; break; } }
      if (hit) { thC = Math.max(3, a); break; }
    }
    const tC = 0.42 + thC / 140;                      // le I accélère comme s'il tombait vraiment
    // 2. au contact, la tête part d'un coup et roule jusqu'au bord droit de la page
    const dR = 0.28 + wall / 520, tWall = tC + dR, tB0 = tWall + 0.2;
    const tFlat = tC + Math.max(0.32, dR * 0.62);     // le I finit de tomber à plat, là où était la tête
    // 3. la tête rebondit, repart vers la gauche, saute par-dessus le I couché, puis renverse les lettres
    const v = 740;
    const hop0 = px - (bO.x + bO.width) + 10, hop1 = Math.min(wall - 8, px + hI - bO.x - 10), hopM = (hop0 + hop1) / 2, hopH = bI.width * 0.95 + 14;
    const back = (B[0].x + 30) - bO.x;
    const path = [{ x: wall, y: 0 }, { x: hop1, y: 0 }, { x: hopM, y: -hopH }, { x: hop0, y: 0 }, { x: back, y: 0 }];
    let t = tB0; path.forEach((p, i) => { if (i) t += Math.abs(path[i - 1].x - p.x) / v; p.t = t; });
    const tBack = t;
    const timeLeft = (x) => { for (let i = 1; i < path.length; i++) { const a = path[i - 1], b = path[i]; if (x <= a.x && x >= b.x) return a.t + (a.x - x) / (a.x - b.x) * (b.t - a.t); } return tBack; };
    // 4. retour : chaque lettre se relève d'un bond (effet ressort) dès que la tête repasse devant elle
    const tR0 = tBack + 0.3, v2 = 900, tHome = tR0 + Math.abs(back + 24) / v2;
    const timeRight = (x) => tR0 + Math.max(0, Math.min(1, (x - (back + 24)) / (0 - (back + 24)))) * (tHome - tR0);
    const stands = [];
    for (let i = 0; i < 7; i++) stands[i] = Math.max(timeLeft(B[i].x + B[i].width - 8 - bO.x) + 0.85, timeRight(B[i].x + B[i].width - bO.x + 30));
    const tStandI = Math.max(tFlat + 0.6, timeRight(px - bI.width - (bO.x + bO.width) - 40));
    let T = tHome + 0.6; stands.concat([tStandI]).forEach((s) => { T = Math.max(T, s + 1.0); });
    const o = (x) => Math.max(0, Math.min(1, x / T));
    // même liste de fonctions partout pour des interpolations bien lisses
    const tr = (y, a, sx, sy) => 'translateY(' + (y || 0).toFixed(1) + 'px) rotate(' + a.toFixed(1) + 'deg) scale(' + (sx || 1) + ',' + (sy || 1) + ')';
    // chute au sol : gravité, petit rebond, puis la lettre se pose
    const fall = (t0, down) => [
      { transform: tr(0, 0), offset: o(t0), easing: 'cubic-bezier(.55,0,1,.45)' },
      { transform: tr(0, down, 1.06, 0.94), offset: o(t0 + 0.34), easing: 'cubic-bezier(.2,.6,.4,1)' },
      { transform: tr(0, down * 0.86), offset: o(t0 + 0.47), easing: 'cubic-bezier(.6,0,.8,.4)' },
      { transform: tr(0, down, 1.03, 0.97), offset: o(t0 + 0.6), easing: 'ease-out' },
      { transform: tr(0, down * 0.96), offset: o(t0 + 0.68), easing: 'ease-in' },
      { transform: tr(0, down), offset: o(t0 + 0.76) }
    ];
    // relevé « ressort » : la lettre pousse, bondit en s'étirant, retombe en s'écrasant, puis se stabilise
    const spring = (t0, down) => [
      { transform: tr(0, down), offset: o(t0), easing: 'cubic-bezier(.4,0,.6,1)' },
      { transform: tr(0, down * 0.8, 1.1, 0.88), offset: o(t0 + 0.14), easing: 'cubic-bezier(.2,.7,.3,1)' },
      { transform: tr(-42, down > 0 ? -7 : 7, 0.9, 1.16), offset: o(t0 + 0.42), easing: 'cubic-bezier(.5,0,.8,.5)' },
      { transform: tr(0, down > 0 ? 2 : -2, 1.14, 0.84), offset: o(t0 + 0.6), easing: 'cubic-bezier(.2,.6,.4,1)' },
      { transform: tr(-6, 0, 0.96, 1.05), offset: o(t0 + 0.74), easing: 'ease-in-out' },
      { transform: tr(0, 0), offset: o(t0 + 0.88) },
      { transform: tr(0, 0), offset: 1 }
    ];
    // --- le I ---
    anim(L[I], [
      { transform: tr(0, 0), offset: 0, easing: 'cubic-bezier(.6,0,1,.6)' },
      { transform: tr(0, thC), offset: o(tC), easing: 'cubic-bezier(.3,.3,.8,.7)' },
      { transform: tr(0, 90, 1.05, 0.95), offset: o(tFlat), easing: 'cubic-bezier(.2,.6,.4,1)' },
      { transform: tr(0, 78), offset: o(tFlat + 0.13), easing: 'cubic-bezier(.6,0,.8,.4)' },
      { transform: tr(0, 90), offset: o(tFlat + 0.26), easing: 'ease-out' },
      { transform: tr(0, 86), offset: o(tFlat + 0.34), easing: 'ease-in' },
      { transform: tr(0, 90), offset: o(tFlat + 0.42) }
    ].concat(spring(tStandI, 90)), T);
    // --- la tête qui roule ---
    const fO = [
      { transform: tf(0, 0, 0), offset: 0 },
      { transform: tf(0, 0, 0), offset: o(tC), easing: 'cubic-bezier(.12,.8,.35,1)' },
      { transform: tf(wall, 0, deg(wall)), offset: o(tWall), easing: 'ease-out' },
      { transform: tf(wall + 6, 0, deg(wall), 0.82, 1.12), offset: o(tWall + 0.08), easing: 'cubic-bezier(.3,1.5,.5,1)' },
      { transform: tf(wall, 0, deg(wall)), offset: o(tB0), easing: 'linear' }
    ];
    path.forEach((p, i) => { if (i) fO.push({ transform: tf(p.x, p.y, deg(p.x)), offset: o(p.t), easing: i === 1 ? 'ease-out' : (i === 2 ? 'ease-in' : (i === 4 ? 'cubic-bezier(.3,.2,.4,1)' : 'linear')) }); });
    fO.push({ transform: tf(back + 24, 0, deg(back + 24)), offset: o(tR0), easing: 'cubic-bezier(.35,.1,.3,1)' });
    fO.push({ transform: tf(0, 0, 0), offset: o(tHome), easing: 'cubic-bezier(.3,1.6,.5,1)' });
    fO.push({ transform: tf(0, 0, 0, 1.1, 0.9), offset: o(tHome + 0.12), easing: 'ease-out' });
    fO.push({ transform: tf(0, 0, 0), offset: o(tHome + 0.3) });
    fO.push({ transform: tf(0, 0, 0), offset: 1 });
    anim(L[O], fO, T);
    // --- les autres lettres tombent comme des dominos (de droite à gauche), puis se relèvent en vague ---
    for (let i = 6; i >= 0; i--) {
      const tHit = timeLeft(B[i].x + B[i].width - 8 - bO.x);
      anim(L[i], [{ transform: tr(0, 0), offset: 0 }].concat(fall(tHit, -88), spring(stands[i], -88)), T);
    }
    // 5. le mot est reformé : on nettoie et les lettres deviennent vivantes (elles grossissent / dégrossissent)
    clearTimeout(this.domT);
    this.domT = setTimeout(() => {
      (this.domAnims || []).forEach((a) => { try { a.cancel(); } catch (e) {} });
      this.domAnims = [];
      L.forEach((el) => { el.style.transform = ''; });
      svg.classList.add('alive');
    }, T * ms + 80);
  }
  startHello() {
    this.clearT();
    this.setState({ phase: 'hello', pos: 'center', waving: true });
    this.later(() => this.setState({ waving: false }), 2900);
  }
  resetProjects() { clearTimeout(this.endT); this.endT = null; this.gN = 0; this.seen = {}; this.autoX = null; this.userUntil = 0; if (this.strip) { this.strip.scrollLeft = 0; this.updateBar(); } this.setState({ allSeen: false }); }
  startCover() { this.clearT(); this.resetProjects(); this.setState({ phase: 'cover', pos: 'peek', waving: false }); }
  toHello() {
    this.clearT();
    this.setState({ phase: 'hello', pos: 'center', waving: true });
    if (this.sc && this.he) this.sc.scrollTo({ top: this.he.offsetTop, behavior: 'smooth' });
    this.later(() => this.setState({ waving: false }), 2900);
  }
  /* « ça c'est moi » est retiré : depuis la couverture, l'avatar monte puis tombe directement dans les projets */
  coverToFall() {
    this.clearT();
    this.lockUntil = Date.now() + 2600;
    this.setState({ phase: 'hello', pos: 'center', waving: false, menu: false });
    this.later(() => this.startFall(), 700);
  }
  toCover() { this.clearT(); this.resetProjects(); this.setState({ phase: 'cover', pos: 'peek' }); if (this.sc) this.sc.scrollTo({ top: 0, behavior: 'smooth' }); }
  startFall() {
    this.clearT();
    // la page reste bloquée pendant que l'avatar bascule, puis descend AVEC lui
    this.lockUntil = Date.now() + 1900;
    this.setState({ phase: 'look', waving: false, menu: false });
    this.later(() => this.setState({ phase: 'tip' }), 260);
    this.later(() => {
      if (this.sc && this.bd) this.sc.scrollTo({ top: this.bd.offsetTop, behavior: 'smooth' });
      this.setState({ phase: 'falling', pos: 'board', avX: 14 });
    }, 680);
    this.later(() => this.setState({ phase: 'land' }), 1830);
    this.later(() => this.setState({ phase: 'dizzy' }), 2480);
    this.later(() => this.setState({ phase: 'board' }), 4800);
  }
  /* Molette / pad : une page à la fois. Tant qu'une transition n'est pas lancée,
     la page ne bouge pas toute seule ; les animations démarrent dès le premier geste. */
  wheelGuard(e) {
    if (PAGE !== 'accueil') return;                                   // Curiosités, À propos : défilement normal
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;           // défilement horizontal (projets) : on laisse faire
    const st = this.state || {}, ph = st.phase, sc = this.sc;
    if (!sc || st.open || st.book || st.cab) return;
    const now = Date.now(), dn = e.deltaY > 0;
    if (now < (this.lockUntil || 0) || ['look', 'tip', 'falling', 'land', 'hero', 'opening', 'closing', 'ball'].indexOf(ph) >= 0) { e.preventDefault(); return; }
    const heTop = this.he ? this.he.offsetTop : sc.clientHeight, bdTop = this.bd ? this.bd.offsetTop : 2 * sc.clientHeight;
    const top = sc.scrollTop;
    if (ph === 'cover' && dn) { e.preventDefault(); this.coverToFall(); return; }
    if (ph === 'hello') {
      if (dn) { e.preventDefault(); this.startFall(); return; }
    }
    if (ph === 'board' || ph === 'dizzy') {
      const cnTop = this.cn ? this.cn.offsetTop : bdTop + sc.clientHeight;
      const abTop = this.ab ? this.ab.offsetTop : 1e9;
      if (top >= abTop - 4) { if (dn) { e.preventDefault(); if (top > abTop + 4) sc.scrollTo({ top: abTop, behavior: 'smooth' }); return; } if (!dn && top <= abTop + 4) { e.preventDefault(); this.lockUntil = now + 900; sc.scrollTo({ top: cnTop, behavior: 'smooth' }); } return; }
      if (dn && st.allSeen && top >= cnTop - 4) { e.preventDefault(); this.lockUntil = now + 900; sc.scrollTo({ top: abTop, behavior: 'smooth' }); return; }
      if (dn && !st.allSeen && top < cnTop - 4) { e.preventDefault(); if (this.strip) { this.userUntil = now + 900; this.autoX = null; this.strip.scrollLeft += e.deltaY; } return; }
      if (dn && top < cnTop - 4) { e.preventDefault(); const newG = now - (this.wLast || 0) > 300; this.wLast = now; if (newG) { if (now - (this.g1 || 0) > 5000) this.gN = 0; this.gN = (this.gN || 0) + 1; if (this.gN === 1) { this.g1 = now; this.setState({ nudge: true }); setTimeout(() => this.setState({ nudge: false }), 700); } } if ((this.gN || 0) < 2) return; this.gN = 0; this.lockUntil = now + 900; this.goPage('curiosites.html'); return; }
      if (!dn && top > bdTop + 4) { e.preventDefault(); this.lockUntil = now + 900; sc.scrollTo({ top: bdTop, behavior: 'smooth' }); return; }
      if (!dn && top <= bdTop + 4) {
        // vers le haut : la guirlande repart vers la gauche (mon personnage revient au début de sa ligne) ;
        // une fois au début, il faut un nouveau geste pour remonter à la couverture
        e.preventDefault();
        const newUp = now - (this.upLast || 0) > 300; this.upLast = now;
        const stp = this.strip;
        if (stp && stp.scrollLeft > 2) { this.userUntil = now + 900; this.autoX = null; stp.scrollLeft += e.deltaY; this.upReady = false; if (stp.scrollLeft <= 2) { this.userUntil = now + 3000; } return; }
        if (!this.upReady) { this.upReady = true; this.userUntil = now + 3000; if (!newUp) return; }
        if (!newUp) return;
        this.upReady = false; this.lockUntil = now + 1700; this.startClimb(); return;
      }
      if (dn) { e.preventDefault(); return; }
    }
  }
  startClimb() {
    this.clearT();
    this.setState({ phase: 'hero', pos: 'center' });
    if (this.sc) this.sc.scrollTo({ top: 0, behavior: 'smooth' });
    this.later(() => this.startCover(), 1550);
  }
  /* carnet : toutes les pages sont chargées et décodées dès l'ouverture, pour qu'elles apparaissent sans attente */
  preloadBook() {
    if (this.bookPre) return;
    this.bookPre = (this.bookImgs || []).map((src) => { const im = new Image(); im.decoding = 'async'; im.src = src; if (im.decode) im.decode().catch(() => {}); return im; });
  }
  bookTurn(dir) {
    const s = this.state || {};
    if (s.turn) return;
    const page = s.page || 0;
    if (dir === 'next' && page >= (this.spLen || 5) - 1) return;
    if (dir === 'prev' && page <= 0) return;
    this.bookGo(page + (dir === 'next' ? 1 : -1));
  }
  /* tourner jusqu'à une double page (page suivante, précédente ou depuis le sommaire).
     La feuille qui tourne porte les vraies pages : au recto celle qu'on quitte, au verso celle qui arrive.
     Les pages fixes ne changent qu'une fois la feuille retombée : rien ne « saute » pendant l'animation. */
  bookGo(target) {
    const s = this.state || {};
    const page = s.page || 0;
    if (s.turn || target === page || target < 0 || target > (this.spLen || 5) - 1) return;
    const dir = target > page ? 'next' : 'prev';
    this.setState({ turn: dir, turnTo: target });
    this.later(() => this.setState({ page: target, turn: null, turnTo: null }), 700);
  }
  renderVals() {
    const s = this.state || {};
    const P = {
 ski: { title: 'NERV', tag: 'objet · sport', color: '#FFB92F', makeT: 'prototype carton', resT: 'maquettes finales',
   pitch: 'NERV : une poignée de bâton de slalom qui accompagne l’athlète de l’entraînement jusqu’au portillon de départ',
   ctx: 'J’ai suivi des athlètes de ski alpin à l’entraînement et en course, et j’ai interrogé 11 skieurs de compétition, âgés de 13 à 22 ans, du niveau U16 au niveau FIS.',
   intent: 'Aider l’athlète à skier en course aussi bien qu’à l’entraînement : respirer, toucher et mémoriser le tracé pour garder ses repères au départ, sans rien changer à ses habitudes.',
   sketchT: 'du galet au bâton',
   sketch: 'J’ai d’abord exploré des objets indépendants : un galet sensoriel, un objet à facettes texturées, un boîtier à écran. Puis j’ai compris que l’objet le plus pertinent était celui que l’athlète a déjà en main : son bâton.',
   make: 'Tester à l’échelle 1 : des premières maquettes en carton jusqu’à la maquette finale, j’ai testé la prise en main avec et sans gants de course, ainsi que le volume de la poignée gonflée. Objectif : ne rien changer aux habitudes de l’athlète.',
   resTxt: 'Une poignée de bâton de slalom détachable. Elle garde la forme et le poids d’un bâton de course, mais accompagne l’athlète de l’entraînement jusqu’au portillon de départ.',
   retT: 'pour aller plus loin',
   ret: 'Pour passer de la maquette au produit, il me reste à :\n• prototyper le système de gonflage (mécanisme, autonomie, bruit) ;\n• tester la batterie et l’étanchéité par grand froid ;\n• vérifier la conformité au règlement FIS en compétition ;\n• faire tester le prototype aux athlètes interrogés.' },
 kart: { title: 'Team Mass', tag: 'identité', color: '#FFB92F', resT: 'logo final',
   year: '2026', kind: 'projet perso', dur: '', team: '',
   pitch: 'Repenser l’image de l’asso',
   sketch: 'Nourrir la recherche graphique à travers l’observation de la team sur le terrain, puis explorer différentes formes et pistes autour de ses initiales.',
   ctx: 'Dans le cadre de ce projet, j’ai réalisé la refonte de l’identité visuelle d’une team de karting, en redessinant le logo associé à un pilote.\n\nL’objectif était de concevoir une identité forte et reconnaissable, capable de retranscrire les valeurs de l’équipe : la vitesse, la rigueur, la performance et la souplesse.\n\nUne palette de couleurs imposée, composée de violet et de noir, constituait le point de départ de cette réflexion graphique.',
   intent: '« Allier performance, précision et esprit d’équipe »\n\nL’idée était de créer un logo minimaliste et impactant, construit autour des deux premières lettres du nom de la team. Un signe simple et identifiable, qui traduit l’univers de la compétition tout en affirmant une identité propre.\n\nAu-delà du logo, le projet consistait à développer un univers visuel cohérent à travers ses différentes déclinaisons, le choix des typographies et son application sur des supports textiles.\n\nEnfin, un shooting photo a permis de mettre en scène cette identité et de montrer comment elle prend vie sur ses différents supports, en donnant une dimension concrète et vivante à l’ensemble du projet.' },
 canard: { title: 'Projet canard', tag: 'objet · espace', color: '#F47EB3' },
 peniche: { title: 'A même le sol', tag: 'espace · aménagement', color: '#36A96B', resT: 'maquette finale échelle 1/50e',
   year: '2026', kind: 'projet d’école', dur: 'workshop de 5 jours', team: '',
   pitch: 'HABITER UNE LIGNE',
   ctx: 'En cinq jours, aménager une péniche pour deux personnes, dans des dimensions imposées.\n\nAu-delà du plan, il fallait définir un concept directeur : une idée forte, capable de guider chaque choix d’aménagement dans un volume long et étroit.',
   intent: '« Organiser sans cloisonner »\n\nAucune séparation fermée : les zones de vie se distinguent sans couper la vue. La longueur de la péniche devient une perspective continue, ouverte et fluide, qui ménage pourtant des coins plus intimes.\n\nUne esthétique industrielle et contemporaine, de grandes ouvertures sur le paysage et un maximum de lumière naturelle font de la péniche un lieu de partage, pensé pour vivre à deux.\n\nSur une si petite surface, les rangements sont au cœur du projet : chaque recoin est exploité, sans sacrifier le confort ni la sensation d’espace.',
   makeT: 'processus', make: 'à l’atelier : découpe laser, essai de matière, assemblage', makePh: '[photo d’atelier]',
   sketchT: 'le sol comme outil de composition',
   sketch: 'De légères variations de hauteur du sol distinguent la cuisine, le salon et l’espace de repos, sans aucune cloison. Chaque zone gagne sa propre identité et sa propre échelle, tout en restant reliée aux autres.\n\nDans un volume aussi réduit, ces changements de niveau structurent l’intérieur de façon légère et ouverte : le sol devient un élément architectural à part entière, qui guide les déplacements et crée des ambiances différentes au sein d’un même espace.' },
 diesel: { title: 'RE:MAKE', tag: 'espace · aménagement', color: '#FF5B4D',
   year: '2026', kind: 'projet d’école', dur: 'solo', team: '',
   pitch: 'Création d’un concept-store Diesel avec un espace boutique et un espace personnalisé : démesure et upcycling',
   ctx: 'Diesel, marque de denim née en Italie en 1978, s’est construite sur la provocation et l’anticonformisme.\n\nDans un monde où la mode devient plus lisse et plus digitale, j’ai choisi d’y faire entrer la démesure et l’upcycling.',
   sketch: 'recherches de différentes pistes',
   intent: 'Mon intention était de rendre le passage par l’espace d’upcycling incontournable afin d’inciter les clients à participer activement à l’expérience. En les invitant à détourner, transformer et réinventer leurs vêtements, Diesel leur permet de s’approprier pleinement la démarche, tout en faisant de l’upcycling un véritable acte d’expression, de provocation et d’anticonformisme.',
   makeT: 'plans', make: '[Tes plans : l’implantation du magasin, les circulations, les différents espaces.]', makePh: '[plans]' }
};
    // carnet : double page 0 = page vide + sommaire, puis une double page par rubrique
    // carnet : double page 0 = page vide + sommaire, puis les rubriques (une photo par page)
    const SECTIONS = [
      { label: 'sketch & croquis', col: '#FF5B4D', imgs: ['assets/croquis-01.webp', 'assets/croquis-02.png', 'assets/croquis-03.png', 'assets/croquis-04.webp', 'assets/croquis-05.webp', 'assets/croquis-06.webp', 'assets/croquis-09.webp', 'assets/croquis-08.webp', 'assets/croquis-07.webp'] },
      { label: 'perspectives', col: '#3472F6', imgs: ['assets/persp-1.jpg', 'assets/persp-2.jpg', 'assets/persp-3.jpg', 'assets/persp-4.jpg', 'assets/persp-5.jpg', 'assets/persp-6.jpg'] },
      { label: 'expériences', col: '#F47EB3', imgs: ['assets/exp-1.jpg', 'assets/exp-2.jpg', 'assets/exp-3.jpg', 'assets/exp-4.jpg', 'assets/exp-5.jpg', 'assets/exp-6.jpg', 'assets/affiche-noir-rouge.jpg'] }
    ];
    const pages = [], firstPage = [];
    let lastCol = null;
    SECTIONS.forEach((sct) => {
      if (pages.length % 2) pages.push({ kind: 'blank', bgc: lastCol });   // chaque rubrique commence sur une page de gauche
      firstPage.push(pages.length);
      const list = sct.imgs.length ? sct.imgs : [null, null];
      list.forEach((im, k) => pages.push({ tag: sct.label, col: sct.col, bgc: sct.col, img: im, title: im ? '' : '[' + sct.label + ' ' + (k + 1) + ']', txt: im ? '' : '[deux lignes : où, quand, avec quoi]' }));
      lastCol = sct.col;
    });
    if (pages.length % 2) pages.push({ kind: 'blank', bgc: lastCol });
    pages.forEach((pg, i) => { if (!pg.kind) pg.num = String(i + 1); });
    const raw = [[{ kind: 'blank' }, { kind: 'toc' }]];
    for (let i = 0; i < pages.length; i += 2) raw.push([pages[i], pages[i + 1]]);
    // papier teinté de la couleur de la rubrique (un voile léger sur le crème du carnet)
    const tint = (hex, a) => { const c = parseInt(hex.slice(1), 16), base = [245, 240, 231]; return 'rgb(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v, i) => Math.round(base[i] + (v - base[i]) * a)).join(', ') + ')'; };
    const SP = raw.map((sp) => sp.map((p) => Object.assign({ tag: '', title: '', col: '#1C1B1A', num: '', txt: '' }, p, { isPage: !p.kind, isToc: p.kind === 'toc', hasImg: !!p.img, ph: p.img || p.kind ? '' : '[photo]', bg: p.bgc ? tint(p.bgc, 0.16) : '#F5F0E7' })));
    this.spLen = SP.length;
    this.bookImgs = [].concat.apply([], SECTIONS.map((x) => x.imgs));
    this.spFirst = firstPage;
    const pts = this.pts || [];
    const H = this.head || { hx: 0, hy: 0, hr: 0, ex: 0, ey: 0 };
    const word = String(this.props.word ?? 'SOLEANE').toUpperCase().slice(0, 12) || 'SOLEANE';
    const font = this.props.titleFont ?? 'Freckle Face';
    const intro = this.props.showIntro ?? true;
    const phase = s.phase || (intro ? 'ball' : 'hello');
    const pos = s.pos || 'center';
    const cols = ['#FF5B4D', '#F47EB3', '#3472F6', '#FFB92F', '#36A96B', '#FF5B4D'];
    const cls = ['s1', 's2', 's3', 's1', 's3', 's2'];
    const hiddenAv = phase === 'ball' || phase === 'opening' || phase === 'closing';
    if (!this._move) this._move = (e) => {
      this.rootEl = e.currentTarget;
      this.lastMoveAt = Date.now();
      if ((this.state || {}).still) this.setState({ still: false });
      const r0 = e.currentTarget.getBoundingClientRect(), S = window.__S || 1;
      const r = { left: r0.left, top: r0.top, width: r0.width / S, height: r0.height / S };
      this.target = { x: (e.clientX - r.left) / S, y: (e.clientY - r.top) / S };
      if (this.drag) {
        const st = this.state || {}, sp = Object.assign({}, st.sp || { a: { x: -629, y: 145 }, b: { x: 376, y: 224 }, e: { x: -419, y: 427 }, f: { x: 230, y: 493 }, nb: { x: -619, y: 580 } });
        const top = (this.sc ? this.sc.scrollTop : 0) - (this.he ? this.he.offsetTop : 0);
        const np = { x: Math.round(this.target.x - r.width / 2 - this.drag.ox), y: Math.round(this.target.y + top - this.drag.oy) };
        if (Math.abs(np.x - this.drag.x0) + Math.abs(np.y - this.drag.y0) > 4) this.drag.moved = true;
        sp[this.drag.id] = np;
        this.setState({ sp: sp });
      }
    };
    if (!this._wheel) this._wheel = (e) => {
      const st = this.state || {};
      if (this.sc && !this.sc.contains(e.target) && !st.open && !st.book && !st.cab) {
        const g = { deltaX: e.deltaX, deltaY: e.deltaY, stop: false, preventDefault() { this.stop = true; } };
        this.wheelGuard(g);
        if (!g.stop) this.sc.scrollBy({ top: e.deltaY });
      }
    };
    if (!this._up) this._up = () => { if (this.drag && this.drag.moved) { this.justDragged = true; setTimeout(() => { this.justDragged = false; }, 80); } this.drag = null; };
    if (!this._scroll) this._scroll = (e) => {
      if (PAGE !== 'accueil') return;                                 // la chute / remontée de l'avatar n'existe que sur l'accueil
      const st = this.state || {}, el = e.currentTarget;
      const top = el.scrollTop, last = this.lastTop || 0;
      this.lastTop = top;
      const heTop = this.he ? this.he.offsetTop : el.clientHeight, hh = el.clientHeight;
      const bdTop = this.bd ? this.bd.offsetTop : 2 * hh;
      if (!st.allSeen && st.phase !== 'cover' && this.bd && top > bdTop + 4) { el.scrollTop = bdTop; this.lastTop = bdTop; return; }
      const away = top > bdTop + hh * 0.45;
      if (!!st.away !== away) this.setState({ away: away });
      // déjà arrivé en bas avant que l'avatar ne commence à tomber : on oublie la chute
      if ((st.phase === 'hello' || st.phase === 'look' || st.phase === 'cover') && top >= bdTop - 12) { this.clearT(); this.setState({ phase: 'board', pos: 'board', avX: 14, waving: false }); return; }
      if (Date.now() < (this.lockUntil || 0)) return;
      if (st.phase === 'cover' && top > last && top > 30) this.coverToFall();
      else if (st.phase === 'hello' && top > last && top > heTop + hh * 0.22) this.startFall();
      else if (st.phase === 'board' && top < last && this.bd && top < this.bd.offsetTop - hh * 0.2) this.startClimb();
    };
    if (!this._refs) this._refs = { sc: (el) => { this.sc = el; if (el && !el.__wg) { el.__wg = true; el.addEventListener('wheel', (ev) => this.wheelGuard(ev), { passive: false }); } }, bd: (el) => { this.bd = el; }, av: (el) => { this.avEl = el; }, strip: (el) => { this.strip = el; if (el && !this.stripInit) { this.stripInit = true; setTimeout(() => { el.scrollLeft = 0; this.updateBar(); }, 60); } }, bar: (el) => { this.setupBar(el); }, row2: (el) => { this.row2 = el; if (el) setTimeout(() => this.updateBar(), 80); }, cn: (el) => { this.cn = el; }, ab: (el) => { this.ab = el; }, letter: (el) => { this.letterEl = el; }, film: (el) => { this.filmEl = el; if (el && !el.__fw) { el.__fw = true; el.addEventListener('wheel', (ev) => { if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) { el.scrollLeft += ev.deltaY; ev.preventDefault(); } ev.stopPropagation(); }, { passive: false }); } }, pr: (el) => { this.pr = el; }, he: (el) => { this.he = el; } };
    const go = (k) => () => this.setState({ open: k, menu: false });
    const sp = s.sp || { a: { x: -629, y: 145 }, b: { x: 376, y: 224 }, e: { x: -419, y: 427 }, f: { x: 230, y: 493 }, nb: { x: -619, y: 580 } };
    const sk = {};
    Object.keys({ a: { x: -629, y: 145 }, b: { x: 376, y: 224 }, e: { x: -419, y: 427 }, f: { x: 230, y: 493 }, nb: { x: -619, y: 580 } }).forEach((id) => {
      sk[id] = { x: sp[id].x, y: sp[id].y, z: s.top === id ? 6 : 3, down: (e) => {
        e.preventDefault();
        const rr = this.rootEl || e.currentTarget.closest('[data-root]') || e.currentTarget.parentNode;
        const r0 = rr.getBoundingClientRect(), S = window.__S || 1;
        const r = { width: r0.width / S, height: r0.height / S };
        const mx = (e.clientX - r0.left) / S, my = (e.clientY - r0.top) / S;
        const top = (this.sc ? this.sc.scrollTop : 0) - (this.he ? this.he.offsetTop : 0);
        this.drag = { id: id, ox: mx - r.width / 2 - sp[id].x, oy: my + top - sp[id].y, x0: sp[id].x, y0: sp[id].y, moved: false };
        this.setState({ top: id });
      } };
    });
    const falling = phase === 'tip' || phase === 'falling';
    const walking = !!s.walk && phase === 'board' && pos === 'board';
    const t = this.target;
    const mood = phase === 'hero' ? 'happy' : (falling || phase === 'land') ? 'scream' : phase === 'dizzy' ? 'dizzy' : (s.hAv && !hiddenAv) ? 'joy' : (s.hInsta ? 'happy' : (s.hBack && !hiddenAv ? 'cry' : 'normal'));
    const on = (b) => (b ? 'inline' : 'none');
    const brows = { normal: 'M122 120 Q134 113 146 119 M174 119 Q186 113 198 120', cry: 'M122 114 Q136 118 146 108 M174 108 Q184 118 198 114', scream: 'M120 106 Q134 96 148 104 M172 104 Q186 96 200 106', happy: 'M122 116 Q134 108 146 115 M174 115 Q186 108 198 116', dizzy: 'M122 118 Q134 112 146 120 M174 116 Q186 122 198 116', surprise: 'M120 104 Q134 94 148 102 M172 102 Q186 94 200 104', joy: 'M120 112 Q134 100 148 110 M172 110 Q186 100 200 112' };
    const poseMap = { hero: 'pose hero', look: 'pose look', tip: 'pose tip', falling: 'pose fallp', land: 'pose land', dizzy: 'pose dizzy' };
    const av = {
      pose: poseMap[phase] || 'pose sway',
      legs: (falling || phase === 'land') ? 'legs bent' : 'legs',
      armL: falling ? 'armL up' : 'armL',
      armL2: falling ? 'armR up' : 'armR',
      armR: (falling || phase === 'hero') ? 'armR up' : ((phase === 'hello' || hiddenAv) && s.waving ? 'armR wave' : 'armR'),
      hx: H.hx.toFixed(2), hy: H.hy.toFixed(2), hr: H.hr.toFixed(2), ex: H.ex.toFixed(2), ey: H.ey.toFixed(2),
      brows: brows[mood], cheek: (mood === 'happy' || mood === 'joy') ? 0.95 : (mood === 'cry' ? 0.25 : 0.55),
      eyesN: on(mood === 'normal'), eyesS: on(mood === 'joy'), eyesW: on(mood === 'scream'), eyesC: on(mood === 'happy' || mood === 'cry' || mood === 'dizzy'),
      mSmile: on(mood === 'normal' || mood === 'dizzy'), mBig: on(mood === 'happy' || mood === 'joy'), mCry: on(mood === 'cry'), mScream: on(mood === 'scream'),
      tears: on(mood === 'cry'), es: (this.es || 1).toFixed(3), sideCls: s.face === 'l' ? 'sidewrap left' : 'sidewrap',
      front: on(!walking), side: on(walking), back: 'none', cape: on(phase === 'hero')
    };
    const page = s.page || 0;
    const turn = s.turn;
    const spread = SP[Math.min(page, SP.length - 1)];
    // pendant que la feuille tourne : pages fixes et faces de la feuille
    let bkLeft = spread[0], bkRight = spread[1], leafFront = spread[1], leafBack = spread[0];
    if (turn && s.turnTo != null && SP[s.turnTo]) {
      const nx = SP[s.turnTo];
      if (turn === 'next') { bkLeft = spread[0]; bkRight = nx[1]; leafFront = spread[1]; leafBack = nx[0]; }
      else { bkLeft = nx[0]; bkRight = spread[1]; leafFront = nx[1]; leafBack = spread[0]; }
    }
    const spin = (Date.now() / 28) % 360;
    const toProjects = () => { if (PAGE !== 'accueil') { this.goPage('index.html#projets'); return; } this.setState({ menu: false, open: null, book: false, bookOpen: false, cab: null, lb: null }); if (phase === 'hello') this.startFall(); else if (phase === 'cover') this.coverToFall(); else {  if (this.sc && this.bd) this.sc.scrollTo({ top: this.bd.offsetTop, behavior: 'smooth' }); } };
    const refold = () => {
      if (PAGE !== 'accueil') { this.goPage('index.html#debut'); return; }
      this.resetProjects();
      if (hiddenAv) return;
      this.clearT(); this.stopDomino();
      try { sessionStorage.removeItem('pf-spot'); } catch (e) {}
      this.setState({ phase: 'closing', open: null, book: false, hBack: false, menu: false });
      this.later(() => { if (this.sc) this.sc.scrollTo({ top: 0 }); this.lastTop = 0; this.setState({ pos: 'peek' }); }, 200);
      this.later(() => this.setState({ phase: 'ball' }), 1800);
    };
    return {
      onMove: this._move, onUp: this._up, onScroll: this._scroll, scRef: this._refs.sc, bdRef: this._refs.bd, avRef: this._refs.av,
      font: font, word: word, av: av, sk: sk,
      fx: { falling: phase === 'falling', dizzy: phase === 'dizzy' },
      letters: word.split('').map((ch, i) => ({ ch: ch, cls: cls[i % 6], color: ch === 'N' ? '#3472F6' : (cols[i % 6] === '#3472F6' ? '#36A96B' : cols[i % 6]), delay: (-0.4 * i).toFixed(2), fly: 'f' + (i % 7), fdelay: (0.15 + 0.09 * i).toFixed(2) })),
      titleCls: hiddenAv ? 'ttl' : 'ttl on',
      trail: s.still ? [] : pts.map((p, i) => { const sz = 40 - i * 4; return { left: (p.x - sz / 2).toFixed(1), top: (p.y - sz / 2).toFixed(1), size: sz, delay: (-0.3 * i).toFixed(1), fill: i % 2 ? '#FFE9B0' : '#FFDD8A' }; }),
      showIntro: hiddenAv,
      introCls: phase === 'opening' ? 'intro3 open' : (phase === 'closing' ? 'intro3 closing' : 'intro3 idle'),
      hdrCls: hiddenAv ? 'hdr off' : 'hdr on', showCorner: !hiddenAv,
      avCls: 'av2 ' + pos + (hiddenAv ? ' hidden' : '') + (walking ? ' walking' : '') + (pos === 'board' && s.away ? ' away' : ''),
      avL: pos === 'board' ? ((s.bx ?? 112) + 'px') : '', avDur: walking ? '0s' : '',
      avClick: () => { if (phase === 'cover') this.coverToFall(); else if (PAGE !== 'apropos') this.goPage('a-propos.html'); },
      nbClick: () => { if (this.justDragged) return; this.preloadBook(); this.setState({ book: true, bookInl: false, bookFun: false, bookOpen: false, page: 0, turn: null }); this.later(() => this.setState({ bookOpen: true }), 80); },
      heRef: this._refs.he,
      scribCls: hiddenAv ? 'scrib' : 'scrib on',
      unfold: () => { if (phase !== 'ball') return; this.setState({ phase: 'opening' }); this.later(() => this.startCover(), 1400); this.stopDomino(); this.domStartT = setTimeout(() => this.startDomino(), 1400 + 1950); },
      goCarnet: () => { if (s.allSeen) this.toCarnet(); },
      abRef: this._refs.ab,
      goAboutPage: () => this.goPage('a-propos.html'),
      goUp: () => this.goPage(PAGE === 'apropos' ? 'curiosites.html' : 'index.html#projets'),
      curioBtnCls: (s.allSeen ? ' cshow' : ' chide') + (s.nudge ? ' nudge' : ''),
      // flèche ↑ de la page projets : retour à la couverture
      goTop: () => { if ((phase === 'board' || phase === 'dizzy') && Date.now() >= (this.lockUntil || 0)) { this.lockUntil = Date.now() + 1700; this.startClimb(); } },
      row2Wheel: (e) => { const d = e.deltaX || (e.shiftKey ? e.deltaY : 0); if (this.strip && Math.abs(d) > 0) { this.userUntil = Date.now() + 300; this.strip.scrollLeft += d; } },
      row2Ref: this._refs.row2, cnRef: this._refs.cn, letterRef: this._refs.letter,
      saveSpot: () => this.saveSpot(),
      openInsta: (e) => { this.saveSpot(); if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) { if (e && e.preventDefault) e.preventDefault(); const t0 = Date.now(); window.location.href = 'instagram://user?username=soleane_gros'; setTimeout(() => { if (!document.hidden && Date.now() - t0 < 2500) window.location.href = 'https://www.instagram.com/soleane_gros/'; }, 900); } },
      openLetter: () => this.setState({ open: 'letter', menu: false, letter: null }),
      isLetter: s.open === 'letter',
      letterCls: 'lett' + (s.letter === 'fly' ? ' fly' : ''),
      letterMsg: s.letterMsg || 'envoyé ! ✈',
      noSubmit: (e) => { if (e && e.preventDefault) e.preventDefault(); },
      sendLetter: () => this.sendLetter(),
      refold: refold,
      goDown: () => toProjects(),
      menuOpen: !!s.menu, menuExp: s.menu ? 'true' : 'false',
      toggleMenu: () => this.setState({ menu: !s.menu }),
      goCurio: () => { this.setState({ menu: false, open: null, book: false, bookOpen: false, cab: null, lb: null, allSeen: true }); setTimeout(() => this.toCarnet(), 60); },
      goStart: refold, goAbout: () => this.goPage('a-propos.html'), goProjects: toProjects,
      goLabo: () => { this.setState({ menu: false, open: null, book: false, bookOpen: false, cab: null, lb: null, book: true, bookInl: false, bookFun: false, page: 0, turn: null }); this.later(() => this.setState({ bookOpen: true }), 80); },
      goContact: () => this.setState({ menu: false, open: null, book: false, bookOpen: false, cab: null, lb: null, open: 'letter', letter: null }),
      hiIn: () => this.setState({ hInsta: true }), hiOut: () => this.setState({ hInsta: false }),
      hbIn: () => this.setState({ hBack: true }), hbOut: () => this.setState({ hBack: false }),
      stripRef: this._refs.strip,
      stripPrev: () => { this.setState({ stripFull: true, walk: true }); if (this.strip) { const half = this.strip.scrollWidth / 2; if (this.strip.scrollLeft < 720) { this.strip.scrollLeft += half; this.lastSL = this.strip.scrollLeft; } this.userUntil = Date.now() + 900; this.strip.scrollBy({ left: -710, behavior: 'smooth' }); } },
      stripNext: () => { this.setState({ stripFull: true, walk: true }); if (this.strip) { const half = this.strip.scrollWidth / 2; if (this.strip.scrollLeft > half) { this.strip.scrollLeft -= half; this.lastSL = this.strip.scrollLeft; } this.userUntil = Date.now() + 900; this.strip.scrollBy({ left: 710, behavior: 'smooth' }); } },
      barRef: this._refs.bar,
      projPrev: () => { if (this.strip) { this.userUntil = Date.now() + 900; this.autoX = null; this.strip.scrollBy({ left: -398, behavior: 'smooth' }); } },
      projNext: () => { if (this.strip) { this.userUntil = Date.now() + 900; this.autoX = null; this.strip.scrollBy({ left: 398, behavior: 'smooth' }); } },
      stripScroll: (e) => {
        this.updateBar();
        if (true) return;   // l'avatar suit maintenant la ligne (updateBar)
        const el = e.currentTarget, sl = el.scrollLeft, last = this.lastSL ?? sl;
        this.lastSL = sl;
        const d = sl - last;
        if (!d || Math.abs(d) > 1500 || Date.now() > (this.userUntil || 0)) return;
        const st = this.state || {};
        const Wd = (this.rootEl || el).clientWidth;
        let x = (st.avX ?? 14) + d * 0.45;
        const lo = 14, hi = Wd - 520;   // l'avatar s'arrête avant le bouton « carnet »
        const atEdge = x <= lo || x >= hi;
        x = Math.max(lo, Math.min(hi, x));
        this.setState({ avX: Math.round(x), walk: !atEdge, face: d < 0 ? 'l' : 'r', avDur: '0s' });
        clearTimeout(this.wt);
        this.wt = setTimeout(() => this.setState({ walk: false }), 180);
      },
      stripIn: () => { this.stripHover = true; }, stripOut: () => { this.stripHover = false; }, stripWheel: (e) => { const d = e.deltaX || (e.shiftKey ? e.deltaY : 0); if (Math.abs(d) > 2) { this.userUntil = Date.now() + 300; if (!(this.state || {}).stripFull) this.setState({ stripFull: true }); } },
      stripCls: 'strip full',
      onWheel: this._wheel,
      nextProject: () => { const ks = ['diesel', 'peniche', 'canard', 'ski', 'kart']; const i = ks.indexOf(s.open); this.setState({ open: ks[(i + 1) % ks.length] }); if (this.pr) this.pr.scrollTo({ top: 0, behavior: 'smooth' }); },
      projRef: this._refs.pr,
      isMag: (this.props.projectLayout ?? 'Fiche magazine') !== 'Process en bande',
      isProc: (this.props.projectLayout ?? 'Fiche magazine') === 'Process en bande',
      openSki: go('ski'), openKart: go('kart'), openCanard: go('canard'), openPeniche: go('peniche'), openDiesel: go('diesel'),
      close: go(null),
      // clic sur le fond (à côté du papier) = fermer
      bgClose: (e) => { if (e && e.target === e.currentTarget) this.setState({ open: null, menu: false }); },
      ...(() => {
        const ALB = [
          { n: '01', t: '[titre de la série 01]', d: '[deux lignes : où, quand, avec quel appareil]', col: '#F47EB3' },
          { n: '02', t: '[titre de la série 02]', d: '[deux lignes : où, quand, avec quel appareil]', col: '#36A96B' },
          { n: '03', t: '[titre de la série 03]', d: '[deux lignes : où, quand, avec quel appareil]', col: '#FFB92F' },
          { n: '04', t: '[titre de la série 04]', d: '[deux lignes : où, quand, avec quel appareil]', col: '#3472F6' }
        ];
        const ai = Math.max(0, Math.min(ALB.length - 1, s.ai || 0)), rr = [-3, 2, -1.5, 3, -2, 1.5];
        const tcs = ['rgba(244,126,179,0.65)', 'rgba(255,185,47,0.65)', 'rgba(52,114,246,0.5)'];
        const open = (k, i) => () => this.setState({ cab: k, ai: i || 0, menu: false });
        return {
          alb: Object.assign({}, ALB[ai], { ph: rr.map((r, i) => ({ i: i + 1, r: r, tc: tcs[(i + ai) % 3] })) }),
          albTabs: ALB.map((a, i) => ({ n: a.n, cls: 'plain altab' + (i === ai ? ' on' : ''), go: () => this.setState({ ai: i }) })),
          isCab: !!s.cab, cabAlb: s.cab === 'alb', cabPos: s.cab === 'pos', cabVid: s.cab === 'vid', cabMix: s.cab === 'mix',
          ...(() => {
            // les 4 pellicules (une couleur chacune) et leurs photos
            const FILMS = [
              { n: '01', col: '#FFB92F', t: 'Palais des Beaux Arts de Lyon - Lyon 1er', photos: [
                'assets/beaux-arts-01.jpg', 'assets/beaux-arts-02.jpg', 'assets/beaux-arts-03.jpg', 'assets/beaux-arts-04.jpg', 'assets/beaux-arts-05.jpg', 'assets/beaux-arts-06.jpg',
                'assets/beaux-arts-07.jpg', 'assets/beaux-arts-08.jpg', 'assets/beaux-arts-09.jpg', 'assets/beaux-arts-10.jpg', 'assets/beaux-arts-11.jpg', 'assets/beaux-arts-12.jpg',
                'assets/beaux-arts-13.jpg', 'assets/beaux-arts-14.jpg', 'assets/beaux-arts-15.jpg', 'assets/beaux-arts-16.jpg', 'assets/beaux-arts-17.jpg', 'assets/beaux-arts-18.jpg'] },
              { n: '02', col: '#3472F6', t: 'Opéra de Lyon - Lyon 1er', photos: [
                'assets/opera-01.jpg', 'assets/opera-02.jpg', 'assets/opera-03.jpg', 'assets/opera-04.jpg', 'assets/opera-05.jpg', 'assets/opera-06.jpg',
                'assets/opera-07.jpg', 'assets/opera-08.jpg', 'assets/opera-09.jpg', 'assets/opera-10.jpg', 'assets/opera-11.jpg', 'assets/opera-12.jpg',
                'assets/opera-13.jpg', 'assets/opera-14.jpg', 'assets/opera-15.jpg', 'assets/opera-16.jpg', 'assets/opera-17.jpg', 'assets/opera-18.jpg'] },
              { n: '03', col: '#FF8A3D', t: 'Hôtel-Dieu de Lyon - Lyon 2e', photos: [
                'assets/hotel-dieu-01.jpg', 'assets/hotel-dieu-02.jpg', 'assets/hotel-dieu-03.jpg', 'assets/hotel-dieu-04.jpg', 'assets/hotel-dieu-05.jpg', 'assets/hotel-dieu-06.jpg',
                'assets/hotel-dieu-07.jpg', 'assets/hotel-dieu-08.jpg', 'assets/hotel-dieu-09.jpg', 'assets/hotel-dieu-10.jpg', 'assets/hotel-dieu-11.jpg', 'assets/hotel-dieu-12.jpg',
                'assets/hotel-dieu-13.jpg', 'assets/hotel-dieu-14.jpg', 'assets/hotel-dieu-15.jpg', 'assets/hotel-dieu-16.jpg', 'assets/hotel-dieu-17.jpg', 'assets/hotel-dieu-18.jpg'] },
              { n: '04', col: '#36A96B', t: 'Le cube vert - Lyon 2e', photos: [
                'assets/cube-vert-01.jpg', 'assets/cube-vert-02.jpg', 'assets/cube-vert-03.jpg', 'assets/cube-vert-04.jpg', 'assets/cube-vert-05.jpg',
                'assets/cube-vert-06.jpg', 'assets/cube-vert-07.jpg', 'assets/cube-vert-08.jpg', 'assets/cube-vert-09.jpg', 'assets/cube-vert-10.jpg',
                'assets/cube-vert-11.jpg', 'assets/cube-vert-12.jpg', 'assets/cube-vert-13.jpg', 'assets/cube-vert-14.jpg'] }
            ];
            const fi = Math.max(0, Math.min(FILMS.length - 1, s.fi || 0)), F = FILMS[fi];
            const ph = (k) => 'data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 360 250'><rect width='360' height='250' fill='#E7DFD0'/><rect y='180' width='360' height='70' fill='" + F.col + "' opacity='.35'/><circle cx='282' cy='72' r='30' fill='" + F.col + "' opacity='.55'/><text x='180' y='134' text-anchor='middle' font-family='Gochi Hand, cursive' font-size='30' fill='#5b554d'>[photo " + k + "]</text></svg>");
            const goFilm = (i) => () => { this.setState({ cab: 'film', fi: i }); setTimeout(() => { if (this.filmEl) this.filmEl.scrollLeft = 0; }, 30); };
            const step = (d) => () => { if (this.filmEl) this.filmEl.scrollBy({ left: d * 400, behavior: 'smooth' }); };
            return {
              films: FILMS.map((f, i) => ({ n: f.n, col: f.col, t: f.t, t1: f.t.split(' - ')[0], t2: f.t.split(' - ')[1] || '', d: (0.1 * i).toFixed(2) + 's', rot: [-8, 5, -4, 9][i] + 'deg', go: goFilm(i) })),
              film: Object.assign({}, F, { frames: (F.photos || [1, 2, 3, 4, 5, 6, 7, 8]).map((p, j) => { const k = j + 1; return { k: (k < 10 ? '0' : '') + k, src: F.photos ? p : ph(k), alt: (F.photos ? F.t : 'Série ' + F.n) + ', photo ' + k }; }) }),
              cabRolls: s.cab === 'rolls', cabFilm: s.cab === 'film',
              openCam: () => this.setState({ cab: 'rolls', menu: false }),
              backRolls: () => this.setState({ cab: 'rolls' }),
              filmPrev: step(-1), filmNext: step(1), filmRef: this._refs.film
            };
          })(),
          openRoll0: open('alb', 0), openRoll1: open('alb', 1), openRoll2: open('alb', 2), openRoll3: open('alb', 3),
          openPosters: open('pos'), openVideos: open('vid'), openMix: open('mix'),
          ...(() => {
            const POS = [
              { src: 'assets/affiche-reperku.jpg', alt: 'Affiche du festival Reperku Sound, 25-26-27 avril 2026', r: -1, w: 'min(460px, 36vw)' },
              { src: 'assets/affiche-charlie.webp', alt: 'Affiche de Charlie and the Chocolate Factory', r: -1.5, w: 'min(430px, 34vw)' }
            ];
            const n = POS.length, pi = (((s.posI || 0) % n) + n) % n;
            return { poster: Object.assign({ n: (pi + 1) + ' / ' + n, w: 'min(360px, 30vw)' }, POS[pi]), posPrev: () => this.setState({ posI: pi - 1 }), posNext: () => this.setState({ posI: pi + 1 }) };
          })(),
          closeCab: () => this.setState({ cab: null }),
          bgCloseCab: (e) => { if (e && e.target === e.currentTarget) this.setState({ cab: (this.state || {}).cab === 'film' ? 'rolls' : null }); }
        };
      })(),
      // petites animations 2D : en boucle et sans le son, comme des GIF
      vidLoop: this._vidLoop || (this._vidLoop = (el) => { if (!el) return; el.muted = true; el.defaultMuted = true; const p = el.play(); if (p && p.catch) p.catch(() => {}); }),
      // vidéos de la caméra : un clic les ouvre en grand, avec le son
      vidOpen: this._vidOpen || (this._vidOpen = {
        b: () => this.setState({ vlb: 'videos/blender-3d.mp4', vlbAlt: 'Animation 3D réalisée sur Blender', vlbLoop: false }),
        a1: () => this.setState({ vlb: 'videos/anim2d-1.mp4', vlbAlt: 'Animation 2D, extrait 1', vlbLoop: true }),
        a2: () => this.setState({ vlb: 'videos/anim2d-2.mp4', vlbAlt: 'Animation 2D, extrait 2', vlbLoop: true }),
        a3: () => this.setState({ vlb: 'videos/anim2d-3.mp4', vlbAlt: 'Animation 2D, extrait 3', vlbLoop: true })
      }),
      vlbRef: this._vlbRef || (this._vlbRef = (el) => { if (!el) return; setTimeout(() => { el.loop = !!(this.state || {}).vlbLoop; const p = el.play(); if (p && p.catch) p.catch(() => {}); }, 0); }),
      isVlb: !!s.vlb, vlbSrc: s.vlb || '', vlbAlt: s.vlbAlt || '',
      closeVlb: () => this.setState({ vlb: null }),
      bgCloseVlb: (e) => { if (e && e.target === e.currentTarget) this.setState({ vlb: null }); },
      // fiche projet ouverte (fond opaque) : on met en sommeil la page dessous
      rootCls: P[s.open] ? 'ovl' : '',
      isLb: !!s.lb, lbSrc: s.lb || '', lbAlt: s.lbAlt || '', lbMany: !!s.lbMany,
      // flèches de l'agrandissement : photo précédente / suivante du même groupe
      lbPrev: this._lbPrev || (this._lbPrev = (e) => { if (e) e.stopPropagation(); this.lbStep(-1); }),
      lbNext: this._lbNext || (this._lbNext = (e) => { if (e) e.stopPropagation(); this.lbStep(1); }),
      closeLb: () => this.setState({ lb: null }),
      bgCloseLb: (e) => { if (e && e.target === e.currentTarget) this.setState({ lb: null }); },
      bookInlCls: s.bookInl ? ' inl' : '', bookInl: !!s.bookFun, bookNotInl: !s.bookFun,
      nbVars: s.nb ? ('--nbx: ' + s.nb.x.toFixed(1) + 'px; --nby: ' + s.nb.y.toFixed(1) + 'px; --nbs: ' + s.nb.s.toFixed(3) + '; --nbsh: ' + s.nb.shift.toFixed(1) + 'px') : '', bookPopCls: s.bookInl && s.bookOpen ? ' isopen' : '', bigNbCls: s.book && s.bookInl ? ' away' : '',
      bgCloseBook: (e) => { if (e && e.target === e.currentTarget) this.setState({ book: false, bookOpen: false }); },
      myEmail: MY_EMAIL,
      outlookHref: 'https://outlook.live.com/mail/0/deeplink/compose?to=' + encodeURIComponent(MY_EMAIL) + '&subject=' + encodeURIComponent('Bonjour Soléane !'),
      mailHref: 'mailto:' + MY_EMAIL + '?subject=' + encodeURIComponent('Bonjour Soléane !'),
      isProject: !!P[s.open], isContact: s.open === 'contact', isPhoto: !!{ a: { label: '[photo de toi]', cap: '[légende : moi en vrai]' }, b: { label: '[photo d’atelier]', cap: '[légende : à l’atelier]' }, e: { label: '[photo de maquette]', cap: '[légende : ma maquette préférée]' }, f: { label: '[photo souvenir]', cap: '[légende : un souvenir]' } }[s.open],
      phLabel: ({ a: { label: '[photo de toi]', cap: '[légende : moi en vrai]' }, b: { label: '[photo d’atelier]', cap: '[légende : à l’atelier]' }, e: { label: '[photo de maquette]', cap: '[légende : ma maquette préférée]' }, f: { label: '[photo souvenir]', cap: '[légende : un souvenir]' } }[s.open] || { a: { label: '[photo de toi]', cap: '[légende : moi en vrai]' }, b: { label: '[photo d’atelier]', cap: '[légende : à l’atelier]' }, e: { label: '[photo de maquette]', cap: '[légende : ma maquette préférée]' }, f: { label: '[photo souvenir]', cap: '[légende : un souvenir]' } }.a).label, phCap: ({ a: { label: '[photo de toi]', cap: '[légende : moi en vrai]' }, b: { label: '[photo d’atelier]', cap: '[légende : à l’atelier]' }, e: { label: '[photo de maquette]', cap: '[légende : ma maquette préférée]' }, f: { label: '[photo souvenir]', cap: '[légende : un souvenir]' } }[s.open] || { a: { label: '[photo de toi]', cap: '[légende : moi en vrai]' }, b: { label: '[photo d’atelier]', cap: '[légende : à l’atelier]' }, e: { label: '[photo de maquette]', cap: '[légende : ma maquette préférée]' }, f: { label: '[photo souvenir]', cap: '[légende : un souvenir]' } }.a).cap,
      phOpen: { a: () => { if (!this.justDragged) this.setState({ open: 'a' }); }, b: () => { if (!this.justDragged) this.setState({ open: 'b' }); }, e: () => { if (!this.justDragged) this.setState({ open: 'e' }); }, f: () => { if (!this.justDragged) this.setState({ open: 'f' }); } },
      goHello: () => { if (phase === 'cover') this.coverToFall(); },
      avIn: () => this.setState({ hAv: true }), avOut: () => this.setState({ hAv: false }),
      cur: Object.assign({ year: '[année]', kind: '[projet d’école / perso]', dur: '[durée]', team: '[solo / en équipe]', pitch: '[Le projet en une phrase : quoi, pour qui, où.]', ctx: '[Le point de départ : la demande, le lieu, le public, les contraintes. Ce qui t’a donné envie de t’y plonger.]', intent: '[Ce que tu voulais faire ressentir. L’ambiance, la lumière, la matière, le parcours imaginé.]', resT: 'maquette finale', resTxt: '[Le projet final : plans, rendus, photos. Les choix forts et pourquoi.]', retT: 'ce que j’en retiens', ret: '[Ce que tu en retiens, ce que tu ferais autrement, ce dont tu es fière.]', makeT: 'maquette & essais', make: '[Maquettes, prototypes, essais de matière : ce que tu as testé avec tes mains.]', makePh: '[photo maquette]', sketchT: '', sketch:'[Tes pistes, tes croquis, les idées abandonnées en route. Montre comment tu cherches.]' }, P[s.open] || P.ski, { notSki: s.open !== 'ski', showResTxt: s.open !== 'ski' && s.open !== 'peniche' && s.open !== 'kart' && s.open !== 'diesel', showRet: s.open !== 'diesel' && s.open !== 'peniche' && s.open !== 'kart', frameImg:({ '#FF5B4D': 'assets/fiche-cadre-ff5b4d.webp', '#36A96B': 'assets/fiche-cadre-36a96b.webp', '#FFB92F': 'assets/fiche-cadre-ffb92f.webp', '#F47EB3': 'assets/fiche-cadre-f47eb3.webp' })[(P[s.open] || P.ski).color] || 'assets/fiche-cadre-ff5b4d.webp', noGal: s.open !== 'peniche', noMake: s.open !== 'peniche' && s.open !== 'kart' && s.open !== 'diesel',noHero: s.open !== 'diesel' && s.open !== 'kart' && s.open !== 'peniche' && s.open !== 'ski', skCols: (s.open === 'diesel' || s.open === 'ski' || s.open === 'kart') ?'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1.25fr)', noSketch: s.open !== 'peniche' && s.open !== 'diesel' && s.open !== 'kart' && s.open !== 'ski', noRes: s.open !== 'peniche' && s.open !== 'diesel' && s.open !== 'ski' && s.open !== 'kart', noMakeImg: s.open !== 'ski', is: { ski: s.open === 'ski', kart: s.open === 'kart', canard: s.open === 'canard', peniche: s.open === 'peniche', diesel: s.open === 'diesel' } }),
      showBook: !!s.book,
      openBook: () => {
        // le carnet s'ouvre la ou il est posé : on mesure sa place sur la page
        const el = document.querySelector('.bignb'), root = (this.avEl && this.avEl.offsetParent) || this.rootEl;
        let nb = null;
        if (el && root) {
          const S = window.__S || 1, r = el.getBoundingClientRect(), rb = root.getBoundingClientRect();
          const x = (r.left - rb.left) / S, y = (r.top - rb.top) / S, w = r.width / S, hgt = r.height / S, W = rb.width / S;
          const sc = w / 500, bw = 1000 * sc, left0 = x - bw / 2, want = Math.max(20, Math.min(W - 20 - bw, x + w / 2 - bw / 2));
          nb = { x: left0, y: y + (hgt - 640 * sc) / 2, s: sc, shift: want - left0 };
        }
        this.preloadBook();
        this.setState({ book: true, bookInl: false, bookFun: true, bookOpen: false, page: 0, turn: null, nb: nb }); this.later(() => this.setState({ bookOpen: true }), 80); },
      closeBook: () => this.setState({ book: false, bookOpen: false }),
      nextPage: () => this.bookTurn('next'), prevPage: () => this.bookTurn('prev'),
      bk: {
        leftCls: s.bookOpen ? 'lpage on' : 'lpage',
        coverCls: s.bookOpen ? 'cover opened' : 'cover',
        turning: !!turn, leafCls: 'leaf ' + (turn || ''),
        prevOp: page > 0 ? 1 : 0.35, nextOp: page < SP.length - 1 ? 1 : 0.35,
        label: (page + 1) + ' / ' + SP.length
      },
      pl: bkLeft, pr: bkRight, lf: leafFront, lb2: leafBack,
      tocItems: SECTIONS.map((sct, i) => ({ label: sct.label, col: sct.col, pg: firstPage[i] + 1, go: (e) => { if (e && e.stopPropagation) e.stopPropagation(); this.bookGo(firstPage[i] / 2 + 1); } }))
    };
  }
}


window.__mountSite = (tpl) => DC.mount(Component, tpl, document.getElementById('app'),{"word": {"editor": "text", "default": "SOLEANE", "section": "Titre"}, "titleFont": {"editor": "enum", "options": ["Freckle Face", "Lacquer", "Rubik Dirt", "Sedgwick Ave Display"], "default": "Freckle Face", "section": "Titre"}, "projectLayout": {"editor": "enum", "options": ["Fiche magazine", "Process en bande"], "default": "Fiche magazine", "section": "Projets"}, "showIntro": {"editor": "boolean", "default": true, "section": "Intro"}, "$preview": {"width": 1440, "height": 900}});
