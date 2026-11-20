/* Bords déchirés en images.
   Les bords « papier déchiré » sont normalement calculés en direct par le navigateur (filtres SVG),
   ce qui fait ramer Safari (Mac et iPhone). Ici, chaque élément déchiré est remplacé par son image
   déjà dessinée (fichiers bord-….webp du dossier des images, liste dans bords-data.js), au moment où il apparaît et avant
   le premier affichage. Le navigateur n'a plus aucun filtre à calculer.
   - Un élément qui n'a pas (encore) son image garde son filtre en direct : rien ne casse.
   - Après une modification d'un dessin déchiré, régénérer les images (voir CONTEXTE-SITE.md).
   - Pour comparer avec les filtres en direct : ajouter ?vivant à l'adresse. */
(function () {
  var NS = 'http://www.w3.org/2000/svg', XL = 'http://www.w3.org/1999/xlink';
  var D = window.__BORDS || { g: {}, box: {} };
  var stats = { images: 0, sansImage: 0 };
  window.__bordsStats = stats;

  /* ---------- clé d'un dessin : son contenu exact + la définition de son filtre ---------- */
  function canon(n) {
    if (n.nodeType === 3) { var t = n.nodeValue.replace(/\s+/g, ' ').trim(); return t ? JSON.stringify(t) : ''; }
    if (n.nodeType !== 1) return '';
    var at = [];
    for (var i = 0; i < n.attributes.length; i++) {
      var a = n.attributes[i];
      if (/^(hint-|on[a-z]|ref$|data-pf)/i.test(a.name)) continue;
      at.push(a.name + '=' + a.value.replace(/\s+/g, ' ').trim());
    }
    at.sort();
    var s = '<' + n.localName + ' ' + at.join(' ') + '>';
    for (var c = n.firstChild; c; c = c.nextSibling) s += canon(c);
    return s + '</>';
  }
  function fnv(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }
  function filterOf(g) {
    var m = /#([^)'"]+)/.exec(g.getAttribute('filter') || '');
    if (!m) return null;
    var r = g.getRootNode();
    return r.getElementById ? r.getElementById(m[1]) : document.getElementById(m[1]);
  }
  function cle(g, fel) {
    var s = canon(fel || filterOf(g) || document.createElement('i')) + '|';
    for (var c = g.firstChild; c; c = c.nextSibling) s += canon(c);
    return fnv(s) + fnv(s.split('').reverse().join(''));
  }
  window.__bordsCle = cle;
  window.__bordsCanon = canon;

  if (/[?&](vivant|brut)\b/.test(location.search)) return;

  /* ---------- remplacement ---------- */
  // finesse ×2 pour les écrans Retina, ×1 quand le site est affiché en petit (téléphones)
  // on prend la plus petite finesse qui reste nette ; si aucune ne suffit, on garde le bord calculé en direct
  function tilesOf(e, need) {
    if (need == null) need = (window.__S || 1) * (window.devicePixelRatio || 1);
    var v = e.v || [];
    for (var i = 0; i < v.length; i++) if (v[i][0] * 1.15 >= need) return v[i][1];
    return (v.length && v[v.length - 1][0] * 1.25 >= need) ? v[v.length - 1][1] : null;
  }
  // taille réelle à l'écran d'une unité du dessin. Certains fonds (fiche projet, cartes, boutons) sont
  // dessinés dans un carré de 100 × 100 étiré à la taille de leur boîte : une image unique y serait floue.
  // (seuls ces dessins étirés sont concernés ; pour les autres, la finesse dépend juste de l'écran)
  function needOf(g) {
    var base = (window.__S || 1) * (window.devicePixelRatio || 1), svg = g.ownerSVGElement;
    if (!svg || svg.getAttribute('preserveAspectRatio') !== 'none') return base;
    var vb = (svg.getAttribute('viewBox') || '').split(/[\s,]+/).map(parseFloat);
    var r = svg.getBoundingClientRect();                     // taille vraiment affichée (réductions comprises)
    if (!(vb[2] > 0 && vb[3] > 0) || !r.width || !r.height) return 4;   // pas encore connue : revérifiée juste après
    return Math.max(r.width / vb[2], r.height / vb[3]) * (window.devicePixelRatio || 1);
  }
  function swap(g) {
    if (g.__bd || !g.hasAttribute('filter')) return;
    g.__bd = 1;
    var fel = filterOf(g);
    if (!fel) return;
    var e = D.g[cle(g, fel)];
    if (!e) { stats.sansImage++; return; }
    var v = e.v || [];
    if (!v.length) return;
    var tl = tilesOf(e, needOf(g)) || v[v.length - 1][1];
    // l'original reste dessous, invisible : les clics et les mesures marchent comme avant
    var src = document.createElementNS(NS, 'g');
    src.setAttribute('data-pf-src', '');
    src.setAttribute('style', 'opacity:0');
    while (g.firstChild) src.appendChild(g.firstChild);
    g.appendChild(src);
    putTiles(g, tl);
    g.setAttribute('data-pf-filter', g.getAttribute('filter'));
    g.removeAttribute('filter');
    g.__bdE = e; g.__bdT = tl;
    stats.images++;
    if (g.ownerSVGElement && g.ownerSVGElement.getAttribute('preserveAspectRatio') === 'none') { stretched.add(g); later(); }
  }
  function putTiles(g, tl) {
    Array.prototype.slice.call(g.querySelectorAll(':scope > [data-pf-img]')).forEach(function (im) { g.removeChild(im); });
    tl.forEach(function (t) {
      var im = document.createElementNS(NS, 'image');
      im.setAttribute('data-pf-img', '');
      im.setAttribute('x', t[1]); im.setAttribute('y', t[2]); im.setAttribute('width', t[3]); im.setAttribute('height', t[4]);
      im.setAttribute('preserveAspectRatio', 'none');
      im.setAttribute('pointer-events', 'none');
      im.setAttribute('href', t[0]); im.setAttributeNS(XL, 'xlink:href', t[0]);
      g.appendChild(im);
    });
  }
  // remet le bord calculé en direct (fond étiré trop grand pour une image nette, ex. la page des fiches projet)
  function unswap(g) {
    var src = g.querySelector(':scope > [data-pf-src]');
    Array.prototype.slice.call(g.querySelectorAll(':scope > [data-pf-img]')).forEach(function (im) { g.removeChild(im); });
    if (src) { while (src.firstChild) g.insertBefore(src.firstChild, src); g.removeChild(src); }
    g.setAttribute('filter', g.getAttribute('data-pf-filter'));
    g.removeAttribute('data-pf-filter');
    stats.images--; stats.direct = (stats.direct || 0) + 1;
  }
  // une fois la mise en page faite, on revérifie la taille réelle des fonds étirés
  var stretched = new Set(), pending = false;
  function later() { if (!pending) { pending = true; requestAnimationFrame(function () { setTimeout(recheck, 0); }); } }
  function recheck() {
    pending = false;
    stretched.forEach(function (g) {
      if (!g.isConnected) { stretched.delete(g); return; }
      var svg = g.ownerSVGElement;
      if (!svg) return;
      var r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;                               // pas encore affiché : on revérifiera
      var e = g.__bdE, need = needOf(g), tl = tilesOf(e, need);
      if (!tl) { stretched.delete(g); unswap(g); return; }
      if (tl !== g.__bdT) { g.__bdT = tl; putTiles(g, tl); }
    });
  }
  window.addEventListener('resize', later);
  setInterval(function () { if (stretched.size) later(); }, 1500);
  // boîtes HTML déchirées sans texte (ex. le grand mur jaune des curiosités)
  function swapBox(el, e) {
    if (el.__bd) return;
    el.__bd = 1;
    tilesOf(e).forEach(function (t) {
      var im = document.createElement('img');
      im.src = t[0]; im.alt = ''; im.setAttribute('aria-hidden', 'true'); im.setAttribute('data-pf-img', '');
      im.setAttribute('style', 'position:absolute;left:' + t[1] + 'px;top:' + t[2] + 'px;width:' + t[3] + 'px;height:' + t[4] + 'px;max-width:none;pointer-events:none;margin:0;padding:0;border:0');
      el.appendChild(im);
    });
    el.style.filter = 'none';
    el.style.backgroundColor = 'transparent';
    stats.images++;
  }
  var boxSel = Object.keys(D.box || {});
  function scan(node) {
    if (!node || (node.nodeType !== 1 && node.nodeType !== 11)) return;
    if (node.nodeType === 1 && node.localName === 'g' && node.hasAttribute('filter')) swap(node);
    if (!node.querySelectorAll) return;
    var gs = node.querySelectorAll('g[filter]');
    for (var i = 0; i < gs.length; i++) swap(gs[i]);
    boxSel.forEach(function (sel) {
      if (node.nodeType === 1 && node.matches(sel)) swapBox(node, D.box[sel]);
      var bs = node.querySelectorAll(sel);
      for (var j = 0; j < bs.length; j++) swapBox(bs[j], D.box[sel]);
    });
  }
  // les observateurs passent avant que la page ne soit dessinée : aucun filtre n'est jamais calculé
  function observe(root) {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var a = muts[i].addedNodes;
        for (var j = 0; j < a.length; j++) scan(a[j]);
      }
    }).observe(root, { childList: true, subtree: true });
    scan(root);
  }
  // zones isolées (toboggan, bonbonnière) : on les surveille dès leur création
  var attach = Element.prototype.attachShadow;
  if (attach) Element.prototype.attachShadow = function (o) { var r = attach.call(this, o); observe(r); return r; };
  observe(document.documentElement);
})();
