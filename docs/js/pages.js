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
  // chaque page téléphone ne va chercher que ce qu'elle affiche (allège le chargement)
  const tplPage = document.getElementById('tpl-page');
  const veutCartes = !!(tplPage && tplPage.content.querySelector('#m-cards'));
  const veutObjets = !!(tplPage && tplPage.content.querySelector('#m-objs'));
  const veutMachine = !!(tplPage && tplPage.content.querySelector('#m-machine'));
  Promise.all([get('partials/commun.html'), veutCartes ? get('index.html') : '', veutObjets ? get('curiosites.html') : '', veutMachine ? get('a-propos.html') : '']).then(([commun, idx, cur, apr]) => {
    const accueil = partOf(idx), curio = partOf(cur);
    build(commun, (frag) => {
      // machine à boules de la page à propos (dessin + ses couleurs), reprise telle quelle
      const mz = frag.querySelector('#m-machine');
      if (mz && apr) {
        const d = new DOMParser().parseFromString(apr, 'text/html'), bt = d.getElementById('bonbon-tpl');
        const src = bt ? bt.content : d;
        const pink = src.querySelector('#pink'), defs = pink && pink.closest('svg'), mach = src.querySelector('svg.machine');
        if (defs) {
          const dc = document.importNode(defs, true);
          dc.querySelectorAll('#P, #P2, #T').forEach((f) => f.remove());   // déjà définis par le gabarit commun
          mz.appendChild(dc);
        }
        if (mach) mz.appendChild(document.importNode(mach, true));
      }
      // cartes de projets (dans l'ordre de la guirlande), réduites pour la largeur du téléphone,
      // chacune avec sa pince rose, accrochées à la guirlande de l'ordinateur tournée à la verticale
      const cards = frag.querySelector('#m-cards');
      if (cards) {
        const garl = accueil.querySelector('.grow1 > div > svg');
        if (garl) {
          const g = document.importNode(garl, true);
          g.removeAttribute('style'); g.setAttribute('viewBox', '0 0 3550 120'); g.setAttribute('preserveAspectRatio', 'xMinYMid meet');
          const gw = document.createElement('div'); gw.className = 'mgarl'; gw.setAttribute('aria-hidden', 'true');
          gw.appendChild(g); cards.appendChild(gw);   // taille et rotation réglées par js/mobile.js selon la hauteur des cartes
        }
        const swings = accueil.querySelectorAll('.swing');
        const blocs = swings.length ? [...swings] : [...accueil.querySelectorAll('button.hcard')];
        blocs.forEach((sw) => {
          const b = sw.matches('button') ? sw : sw.querySelector('button.hcard');
          if (!b) return;
          const c = document.importNode(b, true);
          c.style.position = 'relative'; c.style.left = '0'; c.style.top = '0';
          const box = document.createElement('div'); box.className = 'mcard';
          const inner = document.createElement('div'); inner.className = 'mcardin';
          inner.appendChild(c);
          const pin = sw.querySelector && sw.querySelector('svg.pin');
          if (pin) {   // la pince, au milieu du haut de la carte (là où passe la guirlande)
            const p = document.importNode(pin.parentElement, true);
            p.classList.add('mpin'); p.style.left = '264px'; p.style.top = '-88px';
            inner.appendChild(p);
          }
          box.appendChild(inner); cards.appendChild(box);
        });
      }
      // objets de l'étagère des curiosités, en tuiles avec leur nom en dessous
      const objs = frag.querySelector('#m-objs');
      if (objs) curio.querySelectorAll('button[class*="cobj"]').forEach((b) => {
        const o = document.importNode(b, true);
        const w = parseFloat(o.style.width) || 160, h = parseFloat(o.style.height) || 160;
        o.style.position = 'relative'; o.style.left = '0'; o.style.top = '0';
        o.classList.remove('bignb');
        const tile = document.createElement('div'); tile.className = 'mtile';
        const stage = document.createElement('div'); stage.className = 'mstage';
        stage.style.setProperty('--k', Math.min(200 / w, 170 / h, 1.4).toFixed(3));
        stage.style.width = w + 'px'; stage.style.height = h + 'px';
        stage.appendChild(o); tile.appendChild(stage);
        const n = b.nextElementSibling;
        const lab = document.createElement('span'); lab.className = 'mlab';
        lab.innerHTML = (n && n.classList.contains('cname') ? n.innerHTML : (b.getAttribute('aria-label') || '')).replace(/<br\s*\/?>/gi, ' ');
        // le scotch prend la couleur du nom (vert, rouge, rose, bleu…), en version claire
        if (n && n.style.color) tile.style.setProperty('--tc', 'color-mix(in srgb, ' + n.style.color + ' 45%, #FBF8F1)');
        tile.appendChild(lab); objs.appendChild(tile);
      });
    });
  });
})();
