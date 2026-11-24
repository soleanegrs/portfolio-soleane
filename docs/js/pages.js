/* ---------- Assemblage d'une page du portfolio ----------
   Chaque page (index.html, curiosites.html, a-propos.html) ne contient que SA partie, dans <template id="tpl-page">.
   Tout le reste (en-tête, menu, avatar, fenêtres : fiches projets, carnet, vidéos, lettre…) est dans
   partials/commun.html, partagé par les 3 pages. On insère la partie de la page à la place de <page-sections>,
   puis on lance le site (window.__mountSite, défini dans js/app.js).

   Version téléphone (mobile.html) : même gabarit commun (donc mêmes fiches, carnet, vidéos, affiches, lettre),
   et les cartes de projets + les objets de l'étagère sont repris tels quels dans index.html et curiosites.html :
   une modification faite sur le site ordinateur apparaît aussi sur téléphone. */
(function () {
  const build = (communHtml, prep) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = '<x-dc>' + communHtml + '</x-dc>';
    const slot = tpl.content.querySelector('page-sections');
    const page = document.getElementById('tpl-page');
    if (slot && page) {
      const frag = document.importNode(page.content, true);
      if (prep) prep(frag);
      slot.replaceWith(frag);
    }
    window.__mountSite(tpl);
  };

  const MOBILE = document.body.dataset.page === 'mobile';
  if (!MOBILE) {
    const inline = document.getElementById('tpl-commun');   // version hors-ligne : gabarit commun déjà dans la page
    if (inline) build(inline.innerHTML);
    else fetch('partials/commun.html').then((r) => r.text()).then(build);
    return;
  }

  // ---- téléphone : on va chercher les cartes de projets et les objets de l'étagère sur les pages ordinateur ----
  const get = (u) => fetch(u).then((r) => r.text());
  const partOf = (html) => {
    const d = new DOMParser().parseFromString(html, 'text/html');
    const t = d.getElementById('tpl-page');
    return t ? t.content : d.createDocumentFragment();
  };
  Promise.all([get('partials/commun.html'), get('index.html'), get('curiosites.html')]).then(([commun, idx, cur]) => {
    const accueil = partOf(idx), curio = partOf(cur);
    build(commun, (frag) => {
      // cartes de projets (dans l'ordre de la guirlande), réduites pour la largeur du téléphone
      const cards = frag.querySelector('#m-cards');
      if (cards) accueil.querySelectorAll('button.hcard').forEach((b) => {
        const c = document.importNode(b, true);
        c.style.position = 'relative'; c.style.left = '0'; c.style.top = '0';
        const box = document.createElement('div'); box.className = 'mcard';
        const inner = document.createElement('div'); inner.className = 'mcardin';
        inner.appendChild(c); box.appendChild(inner); cards.appendChild(box);
      });
      // objets de l'étagère des curiosités, en tuiles avec leur nom en dessous
      const objs = frag.querySelector('#m-objs');
      if (objs) curio.querySelectorAll('button[class*="cobj"]').forEach((b) => {
        const o = document.importNode(b, true);
        const w = parseFloat(o.style.width) || 160, h = parseFloat(o.style.height) || 160;
        o.style.position = 'relative'; o.style.left = '0'; o.style.top = '0';
        o.classList.remove('bignb');
        const tile = document.createElement('div'); tile.className = 'mtile';
        const stage = document.createElement('div'); stage.className = 'mstage';
        stage.style.setProperty('--k', Math.min(130 / w, 120 / h, 1.2).toFixed(3));
        stage.style.width = w + 'px'; stage.style.height = h + 'px';
        stage.appendChild(o); tile.appendChild(stage);
        const n = b.nextElementSibling;
        const lab = document.createElement('span'); lab.className = 'mlab';
        lab.innerHTML = (n && n.classList.contains('cname') ? n.innerHTML : (b.getAttribute('aria-label') || '')).replace(/<br\s*\/?>/gi, ' ');
        if (n && n.style.color) lab.style.color = n.style.color;
        tile.appendChild(lab); objs.appendChild(tile);
      });
    });
  });
})();
