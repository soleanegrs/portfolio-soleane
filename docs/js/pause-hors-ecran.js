/* Animations en boucle : elles ne tournent que lorsqu'elles sont à l'écran.
   Toutes les 1,5 s, on repère les animations CSS infinies (page + zones isolées : toboggan, bonbonnière) ;
   un IntersectionObserver met en pause celles qui sortent de l'écran (classe pf-off) et les relance quand elles reviennent.
   Pour comparer : ajouter ?sanspause à l'adresse. */
(function () {
  if (/[?&]sanspause\b/.test(location.search) || !window.IntersectionObserver || !document.getAnimations) return;
  var CSS = '.pf-off,.pf-off *,.pf-off::before,.pf-off::after{animation-play-state:paused !important}';
  var styled = new WeakSet(), seen = new WeakSet();
  function addStyle(root) {
    if (styled.has(root)) return; styled.add(root);
    var st = document.createElement('style'); st.textContent = CSS;
    (root === document ? document.head : root).appendChild(st);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { e.target.classList.toggle('pf-off', !e.isIntersecting); });
  }, { rootMargin: '150px' });
  function scan() {
    addStyle(document);
    var roots = [document];
    Array.prototype.forEach.call(document.querySelectorAll('#curio-walker, #bonbon-host'), function (h) { if (h.shadowRoot) { addStyle(h.shadowRoot); roots.push(h.shadowRoot); } });
    roots.forEach(function (r) {
      (r.getAnimations ? r.getAnimations() : []).forEach(function (a) {
        var t = a.effect && a.effect.target;
        if (!t || seen.has(t) || !t.classList) return;
        var it = a.effect.getTiming ? a.effect.getTiming().iterations : 1;
        if (it !== Infinity) return;
        seen.add(t);
        // une partie d'un dessin SVG : on observe le dessin entier (Safari situe mal les morceaux de SVG)
        var host = t;
        if (t.ownerSVGElement) { host = t.ownerSVGElement; while (host.ownerSVGElement) host = host.ownerSVGElement; }
        if (seen.has(host) && host !== t) return;
        seen.add(host); io.observe(host);
      });
    });
  }
  // une animation mise en pause n'apparaît plus comme « en cours » : on ne la perd pas, elle reste observée
  setTimeout(scan, 800); setInterval(scan, 1500);
})();
