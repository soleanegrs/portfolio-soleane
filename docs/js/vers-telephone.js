/* Sur un téléphone, on affiche la version téléphone (mobile.html) à la place du site ordinateur.
   - « ?ordi » dans l'adresse (lien « voir la version ordinateur ») : on reste sur la version ordinateur pendant la visite.
   - pas de redirection pour la version hors-ligne (fichiers ouverts directement, sans serveur). */
(function () {
  try {
    if (!/^https?:$/.test(location.protocol)) return;
    if (/[?&]ordi\b/.test(location.search)) { sessionStorage.setItem('pf-ordi', '1'); return; }
    if (sessionStorage.getItem('pf-ordi') === '1') return;
    var mq = function (q) { return window.matchMedia && window.matchMedia(q).matches; };
    var petit = Math.min(screen.width, screen.height) < 600;
    var telephone = mq('(max-width: 760px)') || (mq('(pointer: coarse)') && petit);
    if (!telephone) return;
    var page = document.body ? document.body.dataset.page : '';
    var p = location.pathname.split('/').pop();
    // chaque page ordinateur a sa page téléphone
    var cible = /curiosites/.test(p) ? 'mobile-curiosites.html' : /a-propos/.test(p) ? 'mobile-a-propos.html' : ('mobile.html' + (/#projets/.test(location.hash) ? '#m-projets' : ''));
    if (page !== 'mobile') location.replace(cible);
  } catch (e) {}
})();
