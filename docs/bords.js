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
  function tilesOf(e) {
    var need = (window.__S || 1) * (window.devicePixelRatio || 1);
    return (need <= 1.1 && e.t1) ? e.t1 : (e.t2 || e.t1);
  }
  function swap(g) {
    if (g.__bd || !g.hasAttribute('filter')) return;
    g.__bd = 1;
    var fel = filterOf(g);
    if (!fel) return;
    var e = D.g[cle(g, fel)];
    if (!e) { stats.sansImage++; return; }
    // l'original reste dessous, invisible : les clics et les mesures marchent comme avant
    var src = document.createElementNS(NS, 'g');
    src.setAttribute('data-pf-src', '');
    src.setAttribute('style', 'opacity:0');
    while (g.firstChild) src.appendChild(g.firstChild);
    g.appendChild(src);
    tilesOf(e).forEach(function (t) {
      var im = document.createElementNS(NS, 'image');
      im.setAttribute('data-pf-img', '');
      im.setAttribute('x', t[1]); im.setAttribute('y', t[2]); im.setAttribute('width', t[3]); im.setAttribute('height', t[4]);
      im.setAttribute('preserveAspectRatio', 'none');
      im.setAttribute('pointer-events', 'none');
      im.setAttribute('href', t[0]); im.setAttributeNS(XL, 'xlink:href', t[0]);
      g.appendChild(im);
    });
    g.setAttribute('data-pf-filter', g.getAttribute('filter'));
    g.removeAttribute('filter');
    stats.images++;
  }
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
