/* Version téléphone (mobile.html, mobile-curiosites.html, mobile-a-propos.html) :
   avatar de la couverture, étiquettes « à propos » (textes : js/etiquettes.js), et arrivée sur la bonne partie (#ancre). */
(function () {
  var t = setInterval(function () {
    var sc = document.querySelector('.scroller');
    if (!sc || !document.querySelector('.mpage')) return;
    var av = document.getElementById('m-av'), notes = document.getElementById('m-notes');
    if ((av && !window.__avFull) || (notes && (!window.AVATAR || !window.PF_ETIQUETTES))) return;
    clearInterval(t);
    if (av) av.innerHTML = window.__avFull('wink');
    if (notes) {
      var COL = ['#FF5B4D', '#3472F6', '#36A96B', '#F21BC9', '#FFB92F'];
      notes.innerHTML = window.PF_ETIQUETTES.map(function (o, i) {
        return '<div class="mnote" style="--i: ' + i + '; --c: ' + COL[i % 5] + '; --r: ' + (i % 2 ? 1.5 : -1.5) + 'deg"><span class="mtape"></span>'
          + '<span class="mic">' + window.AVATAR.avatar(o.e) + '</span><h3>' + o.t + '</h3><p>' + o.x + '</p></div>';
      }).join('');
    }
    var cible = location.hash && document.getElementById(location.hash.slice(1));
    // à propos : la machine à boules de l'ordinateur ; UN toucher et toutes les étiquettes sortent
    var mz = document.getElementById('m-machine');
    if (mz && notes) {
      var balls = mz.querySelector('#balls'), PAL = (window.AVATAR && window.AVATAR.PAL) || ['#FF5B4D', '#F47EB3', '#3472F6', '#FFB92F', '#36A96B'];
      if (balls && !balls.childNodes.length) {
        var html = '', k = 0;
        for (var y = 412; y > 150; y -= 33) for (var x = 36 + ((Math.round((412 - y) / 33)) % 2) * 19; x < 390; x += 38) {
          if (Math.hypot(x - 210, y - 270) > 150) continue;
          var jx = x + (Math.random() * 6 - 3), jy = y + (Math.random() * 6 - 3);
          html += '<g transform="translate(' + jx.toFixed(1) + ' ' + jy.toFixed(1) + ')"><circle r="19" fill="' + PAL[k++ % PAL.length] + '"/><circle r="19" fill="url(#shade)"/><ellipse cx="-7" cy="-8" rx="6" ry="4" fill="#fff" opacity=".8" transform="rotate(-35 -7 -8)"/></g>';
        }
        balls.innerHTML = html;
      }
      var bul = document.getElementById('m-bul'), ouvert = false;
      var ouvrir = function () {
        if (!ouvert) {
          ouvert = true;
          mz.classList.remove('shake'); void mz.offsetWidth; mz.classList.add('shake');
          if (bul) { bul.textContent = 'tadaaa ! tout est là ↓'; bul.classList.remove('bp'); void bul.offsetWidth; bul.classList.add('bp'); }
          notes.classList.remove('mcache'); notes.classList.add('mopen');
        }
        setTimeout(function () { sc.scrollTo({ top: Math.max(0, notes.offsetTop - 80), behavior: 'smooth' }); }, ouvert ? 650 : 0);
      };
      mz.addEventListener('click', ouvrir);
      mz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(); } });
    }
    // curiosités en collage : même écart entre chaque objet, d'après la taille réelle de leur dessin
    var objs = document.getElementById('m-objs');
    if (objs) {
      var ECART = 26;   // espace voulu entre deux objets (et sous le texte d'intro), en px de la page téléphone
      var bornes = function (el) {
        var top = 1e9, bot = -1e9;
        el.querySelectorAll('svg, img, .mlab').forEach(function (e) { var r = e.getBoundingClientRect(); if (r.width > 4 && r.height > 4) { top = Math.min(top, r.top); bot = Math.max(bot, r.bottom); } });
        return [top, bot];
      };
      var espacer = function () {
        var S = window.__S || 1, tiles = objs.querySelectorAll('.mtile');
        tiles.forEach(function (t) { t.style.marginTop = '0px'; });
        var prev = objs.getBoundingClientRect().top;   // haut de la zone des objets
        tiles.forEach(function (t, i) {
          var b = bornes(t), voulu = i ? ECART : 6;
          var decal = (prev + voulu * S - b[0]) / S;
          t.style.marginTop = decal.toFixed(1) + 'px';
          prev = b[1] + decal * S;
        });
      };
      setTimeout(espacer, 300); window.addEventListener('load', espacer); setTimeout(espacer, 1500);
      window.addEventListener('resize', function () { setTimeout(espacer, 100); });
    }
    // on ne saute que si la partie est plus bas dans la page (sinon on resterait sous les flèches du haut)
    if (cible && cible.offsetTop > 400) setTimeout(function () { sc.scrollTop = Math.max(0, cible.offsetTop - 70); }, 400);
  }, 150);
})();
