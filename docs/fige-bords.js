/* Bords déchirés « figés » pour Safari (Mac et iPhone).
   Safari recalcule les filtres SVG (papier déchiré) à chaque image dès que quelque chose bouge
   à côté, ce qui fait ramer le site. Ici, chaque groupe déchiré est dessiné UNE fois en image,
   avec exactement le même filtre, puis c'est cette image qui s'affiche et qui bouge.
   - Actif seulement dans Safari / WebKit (tous les navigateurs d'iPhone).
   - Pour tester ailleurs : ajouter ?bake à l'adresse. Pour le couper : ?nobake. */
(function () {
  var q = location.search, ua = navigator.userAgent;
  var webkit = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\/|Android/.test(ua);
  if (/[?&]nobake\b/.test(q) || !(webkit || /[?&]bake\b/.test(q))) return;
  if (!window.Promise || !window.URL || !window.Blob || !window.XMLSerializer) return;

  var NS = 'http://www.w3.org/2000/svg', XL = 'http://www.w3.org/1999/xlink';
  // propriétés héritées des parents qu'il faut recopier sur le dessin isolé
  var INH = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
    'stroke-dasharray', 'stroke-dashoffset', 'stroke-miterlimit', 'font-family', 'font-size', 'font-weight', 'font-style',
    'letter-spacing', 'word-spacing', 'text-anchor', 'dominant-baseline', 'paint-order', 'color', 'clip-rule'];
  var ser = new XMLSerializer();
  var cache = {};          // dessin identique → même image
  var queue = [], busy = false;
  var stats = { figes: 0, echecs: 0, pixels: 0 };
  window.__pfStats = stats;

  function fixUrl(v) { return String(v || '').replace(/url\((['"]?)[^)'"]*#([^)'"]+)\1\)/g, 'url(#$2)'); }
  function byId(root, id) { return root.getElementById ? root.getElementById(id) : root.querySelector('#' + CSS.escape(id)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  /* ---------- polices : les textes SVG figés en ont besoin à l'intérieur de l'image ---------- */
  var faceBlocks = null, famCache = {};
  function fontBlocks() {
    if (faceBlocks) return faceBlocks;
    var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis"]'));
    faceBlocks = Promise.all(links.map(function (l) { return fetch(l.href).then(function (r) { return r.text(); }); }))
      .then(function (t) { return t.join('\n').match(/@font-face\s*\{[^}]*\}/g) || []; })
      .catch(function () { return []; });
    return faceBlocks;
  }
  function toDataUrl(blob) {
    return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(blob); });
  }
  function familyCss(fam) {
    if (famCache[fam]) return famCache[fam];
    famCache[fam] = fontBlocks().then(function (blocks) {
      var mine = blocks.filter(function (b) { var m = b.match(/font-family:\s*['"]?([^;'"]+)/); return m && m[1].trim().toLowerCase() === fam; });
      return Promise.all(mine.map(function (b) {
        var m = b.match(/url\(([^)]+)\)/);
        if (!m) return '';
        return fetch(m[1].replace(/['"]/g, '')).then(function (r) { return r.blob(); }).then(toDataUrl)
          .then(function (d) { return b.replace(m[0], 'url(' + d + ')'); });
      })).then(function (a) { return a.join('\n'); });
    }).catch(function () { return null; });
    return famCache[fam];
  }
  function fontsFor(g) {
    var fams = {};
    Array.prototype.forEach.call(g.querySelectorAll('text, tspan'), function (t) {
      getComputedStyle(t).fontFamily.split(',').forEach(function (f) { f = f.trim().replace(/^['"]|['"]$/g, '').toLowerCase(); if (f && !/^(serif|sans-serif|cursive|monospace|fantasy|system-ui)$/.test(f)) fams[f] = 1; });
    });
    var list = Object.keys(fams);
    if (!list.length) return Promise.resolve('');
    return Promise.all(list.map(familyCss)).then(function (a) {
      if (a.some(function (x) { return x === null; })) return null;   // police introuvable : on ne fige pas
      return a.join('\n');
    });
  }

  /* ---------- mesure : une copie invisible du groupe, dans le même document ---------- */
  var meters = new Map();
  function meter(root) {
    var m = meters.get(root);
    if (m && m.isConnected) return m;
    m = document.createElementNS(NS, 'svg');
    m.setAttribute('aria-hidden', 'true');
    m.setAttribute('style', 'position:absolute;left:-99999px;top:0;width:10px;height:10px;overflow:visible;visibility:hidden;pointer-events:none');
    (root === document ? document.body : root).appendChild(m);
    meters.set(root, m);
    return m;
  }
  function frac(v, def) {
    if (v == null || v === '') return def;
    v = String(v).trim();
    return /%$/.test(v) ? parseFloat(v) / 100 : parseFloat(v);
  }

  /* taille réelle à l'écran d'une unité du dessin : transformations SVG × réduction du site (petits écrans) */
  function screenScale(g) {
    var inner = 1, css = window.__S || 1, outer = g.ownerSVGElement;
    while (outer && outer.ownerSVGElement) outer = outer.ownerSVGElement;
    try { var m = g.getCTM(); if (m) inner = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1; } catch (e) {}
    try { var r = outer.getBoundingClientRect(), cw = outer.clientWidth; if (r.width > 0 && cw > 0) css = r.width / cw; } catch (e) {}
    return Math.max(0.05, inner * css);
  }

  /* ---------- dessin du groupe isolé → image ---------- */
  function raster(svg, w, h, wait) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      var im = new Image();
      // une police intégrée se charge un peu après l'image : on lui laisse le temps
      im.onload = function () { setTimeout(draw, wait || 0); };
      var draw = function () {
        try {
          var c = document.createElement('canvas'); c.width = w; c.height = h;
          c.getContext('2d').drawImage(im, 0, 0, w, h);
          c.toBlob(function (b) {
            c.width = c.height = 0;
            if (!b) { res(url); return; }
            URL.revokeObjectURL(url); res(URL.createObjectURL(b));
          }, 'image/png');
        } catch (e) { res(url); }        // repli : l'image SVG elle-même
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('image')); };
      im.src = url;
    });
  }

  function refsIn(str, out) {
    var re = /url\(#([^)'"]+)\)|href="#([^"]+)"/g, m;
    while ((m = re.exec(str))) out[m[1] || m[2]] = 1;
  }

  function bake(g) {
    if (g.__pf || !g.isConnected || !g.hasAttribute('filter')) return Promise.resolve();
    var fa = g.getAttribute('filter'), fm = fa.match(/#([^)'"]+)/);
    if (!fm) return Promise.resolve();
    g.__pf = 1;
    var root = g.getRootNode(), fel = byId(root, fm[1]);
    if (!fel) return Promise.resolve();
    var cs = getComputedStyle(g);
    var style = INH.map(function (p) { var v = cs.getPropertyValue(p); return v ? p + ':' + fixUrl(v) : ''; }).filter(Boolean).join(';');

    // 1. taille du dessin (sans filtre), mesurée sur une copie
    var copy = document.createElementNS(NS, 'g');
    copy.setAttribute('style', style);
    Array.prototype.forEach.call(g.childNodes, function (n) { if (n.nodeType === 1) copy.appendChild(n.cloneNode(true)); });
    var mt = meter(root); mt.appendChild(copy);
    var bb; try { bb = copy.getBBox(); } catch (e) { bb = null; }
    mt.removeChild(copy);
    if (!bb || !(bb.width > 0 || bb.height > 0)) return Promise.resolve();

    // 2. zone du filtre (comme le navigateur la calcule)
    var rx, ry, rw, rh;
    if (fel.getAttribute('filterUnits') === 'userSpaceOnUse') {
      rx = parseFloat(fel.getAttribute('x')); ry = parseFloat(fel.getAttribute('y')); rw = parseFloat(fel.getAttribute('width')); rh = parseFloat(fel.getAttribute('height'));
    } else {
      rx = bb.x + frac(fel.getAttribute('x'), -0.1) * bb.width; ry = bb.y + frac(fel.getAttribute('y'), -0.1) * bb.height;
      rw = frac(fel.getAttribute('width'), 1.2) * bb.width; rh = frac(fel.getAttribute('height'), 1.2) * bb.height;
    }
    rx = Math.floor(rx); ry = Math.floor(ry); rw = Math.ceil(rw) + 1; rh = Math.ceil(rh) + 1;

    // 3. finesse : taille réelle à l'écran × écran Retina, avec une marge pour les effets de zoom
    var k = screenScale(g);
    k = Math.min(3, Math.max(0.25, k * (window.devicePixelRatio || 1) * (window.__pfMarge || 1.25)));
    if (rw * rh * k * k > 5e6) k = Math.sqrt(5e6 / (rw * rh));
    var W = Math.max(1, Math.round(rw * k)), H = Math.max(1, Math.round(rh * k));

    // 4. document SVG autonome : le groupe + son filtre + ce qu'il référence
    copy.setAttribute('filter', 'url(#' + fm[1] + ')');
    var body = ser.serializeToString(copy);
    var ids = {}; ids[fm[1]] = 1; refsIn(body, ids);
    var defs = '', done = {}, todo = Object.keys(ids);
    while (todo.length) {
      var id = todo.shift(); if (done[id]) continue; done[id] = 1;
      var el = byId(root, id); if (!el) continue;
      var c2 = el.cloneNode(true);
      if (el === fel && !c2.hasAttribute('color-interpolation-filters')) c2.setAttribute('color-interpolation-filters', getComputedStyle(fel).getPropertyValue('color-interpolation-filters') || 'linearRGB');
      var s2 = ser.serializeToString(c2); defs += s2;
      var more = {}; refsIn(s2, more); Object.keys(more).forEach(function (x) { if (!done[x]) todo.push(x); });
    }

    return fontsFor(g).then(function (fcss) {
      if (fcss === null) { stats.echecs++; return; }
      var svg = '<svg xmlns="' + NS + '" xmlns:xlink="' + XL + '" width="' + W + '" height="' + H + '" viewBox="' + [rx, ry, rw, rh].join(' ') + '" preserveAspectRatio="none">' +
        (fcss ? '<style>' + fcss.replace(/</g, '') + '</style>' : '') + '<defs>' + defs + '</defs>' + body + '</svg>';
      var key = svg;
      var p = cache[key] || (cache[key] = raster(svg, W, H, fcss ? 400 : 0).then(function (u) { stats.pixels += W * H; return u; }));
      return p.then(function (url) {
        if (!g.isConnected || g.getAttribute('filter') !== fa) { g.__pf = 0; return; }
        // l'original reste en place (invisible) : clics et mesures fonctionnent comme avant
        var src = document.createElementNS(NS, 'g');
        src.setAttribute('data-pf-src', '');
        src.setAttribute('style', 'opacity:0');
        while (g.firstChild) src.appendChild(g.firstChild);
        g.appendChild(src);
        var im = document.createElementNS(NS, 'image');
        im.setAttribute('data-pf-img', '');
        im.setAttribute('x', rx); im.setAttribute('y', ry); im.setAttribute('width', rw); im.setAttribute('height', rh);
        im.setAttribute('preserveAspectRatio', 'none');
        im.setAttribute('pointer-events', 'none');
        im.setAttribute('href', url); im.setAttributeNS(XL, 'xlink:href', url);
        g.appendChild(im);
        g.setAttribute('data-pf-filter', fa);
        g.removeAttribute('filter');
        stats.figes++;
      });
    }).catch(function () { stats.echecs++; g.__pf = 0; });
  }

  /* ---------- boîtes HTML déchirées (ex. le grand mur jaune des curiosités) ----------
     Safari ne garde jamais en mémoire un filtre posé sur un élément HTML : la moindre animation
     au-dessus le fait recalculer en entier. Une boîte de couleur sans texte se fige facilement. */
  function bakeBox(el) {
    if (el.__pfb) return Promise.resolve();
    var cs = getComputedStyle(el), fm = /^url\((['"]?)[^)'"]*#([^)'"]+)\1\)$/.exec(cs.filter);
    if (!fm || el.children.length || el.textContent.trim() || cs.backgroundImage !== 'none') return Promise.resolve();
    el.__pfb = 1;
    var root = el.getRootNode(), fel = byId(root, fm[2]);
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!fel || !w || !h) { el.__pfb = 0; return Promise.resolve(); }
    var rx, ry, rw, rh;
    if (fel.getAttribute('filterUnits') === 'userSpaceOnUse') {
      rx = parseFloat(fel.getAttribute('x')); ry = parseFloat(fel.getAttribute('y')); rw = parseFloat(fel.getAttribute('width')); rh = parseFloat(fel.getAttribute('height'));
    } else {
      rx = frac(fel.getAttribute('x'), -0.1) * w; ry = frac(fel.getAttribute('y'), -0.1) * h; rw = frac(fel.getAttribute('width'), 1.2) * w; rh = frac(fel.getAttribute('height'), 1.2) * h;
    }
    rx = Math.floor(rx); ry = Math.floor(ry); rw = Math.ceil(rw) + 1; rh = Math.ceil(rh) + 1;
    var k = Math.min(3, Math.max(0.4, (window.__S || 1) * (window.devicePixelRatio || 1)));
    if (rw * rh * k * k > 6e6) k = Math.sqrt(6e6 / (rw * rh));
    var W = Math.round(rw * k), H = Math.round(rh * k);
    var f2 = fel.cloneNode(true);
    if (!f2.hasAttribute('color-interpolation-filters')) f2.setAttribute('color-interpolation-filters', getComputedStyle(fel).getPropertyValue('color-interpolation-filters') || 'linearRGB');
    var rad = parseFloat(cs.borderTopLeftRadius) || 0;
    var svg = '<svg xmlns="' + NS + '" width="' + W + '" height="' + H + '" viewBox="' + [rx, ry, rw, rh].join(' ') + '" preserveAspectRatio="none"><defs>' + ser.serializeToString(f2) + '</defs>' +
      '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="' + rad + '" fill="' + esc(cs.backgroundColor) + '" filter="url(#' + fm[2] + ')"/></svg>';
    return raster(svg, W, H, 0).then(function (url) {
      if (!el.isConnected) { el.__pfb = 0; return; }
      var im = document.createElement('img');
      im.src = url; im.alt = ''; im.setAttribute('aria-hidden', 'true'); im.setAttribute('data-pf-img', '');
      im.setAttribute('style', 'position:absolute;left:' + rx + 'px;top:' + ry + 'px;width:' + rw + 'px;height:' + rh + 'px;max-width:none;pointer-events:none;margin:0;padding:0;border:0');
      if (cs.position === 'static') el.style.position = 'relative';
      el.style.filter = 'none';
      el.style.backgroundColor = 'transparent';
      el.appendChild(im);
      stats.figes++; stats.pixels += W * H;
    }).catch(function () { stats.echecs++; el.__pfb = 0; });
  }
  function scanBoxes(node) {
    var list = [];
    if (node.nodeType === 1) list.push(node);
    Array.prototype.push.apply(list, node.querySelectorAll ? node.querySelectorAll('div, span, section') : []);
    list.forEach(function (el) {
      if (el.__pfb || el.namespaceURI === NS) return;
      if (/url\(/.test(getComputedStyle(el).filter)) bakeBox(el);
    });
  }

  /* ---------- file d'attente : quelques groupes à la fois, pour ne pas bloquer la page ---------- */
  function pump() {
    if (busy) return;
    busy = true;
    var batch = queue.splice(0, 4);
    if (!batch.length) { busy = false; return; }
    Promise.all(batch.map(function (g) { return bake(g).catch(function () {}); })).then(function () {
      busy = false;
      if (queue.length) setTimeout(pump, 16);
    });
  }
  /* Safari garde le résultat d'un filtre en mémoire tant que le dessin lui-même ne bouge pas :
     un cadre HTML qui se balance ne coûte rien. Le problème vient de ce qui bouge À L'INTÉRIEUR
     du dessin SVG, au-dessus du groupe déchiré (lettres qui pulsent, avatar qui se balance,
     tête qui suit la souris…). On ne fige donc que ces groupes-là, dès qu'on les voit bouger. */
  var cands = new Set();
  function chain(g) {
    var out = [], p = g.parentNode;
    while (p && p.nodeType === 1 && p.namespaceURI === NS) {
      if (p.localName === 'svg' && !(p.parentNode && p.parentNode.namespaceURI === NS)) break;   // le <svg> extérieur est une boîte HTML
      out.push(p); p = p.parentNode;
    }
    return out;
  }
  function moving(g) {
    var ch = g.__pfChain || (g.__pfChain = chain(g)), moved = false;
    var sig = ch.map(function (p) { return (p.getAttribute('transform') || '') + '|' + (p.getAttribute('class') || '') + '|' + (p.getAttribute('style') || ''); }).join('#');
    if (g.__pfSig != null && g.__pfSig !== sig) moved = true;
    g.__pfSig = sig;
    if (!moved) moved = ch.some(function (p) {
      if (p.getAnimations && p.getAnimations().length) return true;
      var cs = getComputedStyle(p);
      return cs.animationName && cs.animationName !== 'none';
    });
    return moved;
  }
  function check() {
    cands.forEach(function (g) {
      if (!g.isConnected) { cands.delete(g); return; }
      if (g.__pf || !g.hasAttribute('filter')) { cands.delete(g); return; }
      if (window.__pfTout || moving(g)) { cands.delete(g); if (queue.indexOf(g) < 0) queue.push(g); }
    });
    if (queue.length) pump();
  }
  function scan(node) {
    if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return;
    var list = node.matches && node.matches('g[filter]') ? [node] : [];
    Array.prototype.push.apply(list, node.querySelectorAll ? node.querySelectorAll('g[filter]') : []);
    list.forEach(function (g) { if (!g.__pf && /url\(/.test(g.getAttribute('filter'))) cands.add(g); });
    if (cands.size) setTimeout(check, 0);
    setTimeout(function () { scanBoxes(node); }, 0);
  }
  var watched = new Set();
  function watch(root) {
    if (watched.has(root)) return;
    watched.add(root);
    scan(root === document ? document.body : root);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, scan); });
    }).observe(root === document ? document.body : root, { childList: true, subtree: true });
  }
  function findShadows() {
    Array.prototype.forEach.call(document.querySelectorAll('*'), function (e) { if (e.shadowRoot) watch(e.shadowRoot); });
  }

  function start() {
    var go = function () { watch(document); findShadows(); setInterval(findShadows, 1000); setInterval(check, 250); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
