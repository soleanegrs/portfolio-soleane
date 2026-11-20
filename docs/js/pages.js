/* ---------- Assemblage d'une page du portfolio ----------
   Chaque page (index.html, curiosites.html, a-propos.html) ne contient que SA partie, dans <template id="tpl-page">.
   Tout le reste (en-tête, menu, avatar, fenêtres : fiches projets, carnet, vidéos, lettre…) est dans
   partials/commun.html, partagé par les 3 pages. On insère la partie de la page à la place de <page-sections>,
   puis on lance le site (window.__mountSite, défini dans js/app.js). */
(function () {
  const build = (communHtml) => {
    const tpl = document.createElement('template');
    tpl.innerHTML = '<x-dc>' + communHtml + '</x-dc>';
    const slot = tpl.content.querySelector('page-sections');
    const page = document.getElementById('tpl-page');
    if (slot && page) slot.replaceWith(document.importNode(page.content, true));
    window.__mountSite(tpl);
  };
  const inline = document.getElementById('tpl-commun');   // version hors-ligne : gabarit commun déjà dans la page
  if (inline) build(inline.innerHTML);
  else fetch('partials/commun.html').then((r) => r.text()).then(build);
})();
