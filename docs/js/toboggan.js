/* page des curiosites : mon avatar arrive en marchant par la gauche, et repart en parachute quand on descend */
(function () {
  var CSS = '.w{position:absolute;left:150px;top:452px;width:200px;height:380px;opacity:0;transform:translateX(-480px)}'
    + '.w.in{animation:wzip 1.6s cubic-bezier(.45,0,.7,1) forwards}@keyframes wzip{0%{opacity:1;transform:translate(310px,-719px)}86%{opacity:1;transform:translate(0,8px)}100%{opacity:1;transform:translate(0,0)}}'
    + '.w.in .sway{transform-origin:50% 60%;animation:zsw .45s ease-in-out infinite}@keyframes zsw{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(4deg)}}'
    + '.zl{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;opacity:0;transition:opacity .4s}.zl.on{opacity:1}#tb{z-index:10}#zl{z-index:12}#tt{z-index:30}#tbf{z-index:40}.w{z-index:45}'
    + '.w.tobo{opacity:1;transform-origin:100px 366px}.w.tobo .ar{transform:rotate(-10deg);animation:none}.wiii{position:absolute;left:470px;top:300px;font:30px \'Freckle Face\',cursive;color:#F21BC9;transform:rotate(-12deg);opacity:0;transition:opacity .3s}.zl.on .wiii{opacity:1}'
    + '.w.arr{opacity:1;transform:none}'
    + '.av{position:absolute;left:40px;top:140px;width:120px;height:226px;filter:drop-shadow(3px 8px 6px rgba(0,0,0,.25))}.av svg{width:100%;height:100%;overflow:visible}'
    + '@keyframes step{50%{transform:translateY(-10px) rotate(3deg)}}'
    + '.av .fb{transform-box:view-box;transform-origin:160px 480px}'
    + '.av .hd{transform-box:view-box;transform-origin:160px 230px;animation:gnod 2.4s ease-in-out infinite}@keyframes gnod{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(4deg)}}'
    + '.av .ar{transform-box:view-box;transform-origin:232px 270px;transform:rotate(126deg)}'
    + '.w.in .ar{transform:rotate(-10deg);animation:none}@keyframes aswing{0%,100%{transform:rotate(108deg)}50%{transform:rotate(142deg)}}'
    + '.w.arr .ar{animation:none}.w.arr .armR{animation:gwave .9s ease-in-out 3}@keyframes gwave{0%,100%{transform:rotate(126deg)}50%{transform:rotate(-10deg)}}'
    + '.cb{position:absolute;left:0;top:0;width:200px;height:264px;opacity:0;transform:scaleY(.1);transform-origin:50% 100%}'
    + '.w.fall{opacity:1;transform:none;animation:wfall 2.6s ease-in forwards}@keyframes wfall{0%{transform:translate(0,0)}100%{transform:translate(40px,780px)}}'
    + '.w.fall .cb{animation:copen .5s cubic-bezier(.3,1.6,.5,1) forwards}@keyframes copen{to{opacity:1;transform:scaleY(1)}}'
    + '.w.fall .sway{transform-origin:50% 0;animation:sway 1.2s ease-in-out infinite}@keyframes sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}'
    + '.w.fall .ar{transform:rotate(-10deg);animation:none}'
    + '.tour{position:absolute;inset:0;transform-origin:100px 366px}'
    + '.w.walk .av{animation:step .35s ease-in-out infinite}.w.walk .ar{animation:aswing .7s ease-in-out infinite}'
    + '.w.climb .av{animation:climb .45s ease-in-out infinite}@keyframes climb{50%{transform:translateY(-6px) rotate(-4deg)}}'
    + '.w.climb .ar{animation:reach .45s ease-in-out infinite alternate}@keyframes reach{from{transform:rotate(-20deg)}to{transform:rotate(10deg)}}'
    // bulle rose (même style que sur la page à propos) : c'est l'avatar qui dit le nom des objets survolés
    + '.bub{position:absolute;left:178px;top:128px;padding:22px 32px 24px;background-color:#F7A8C7;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'140\' height=\'140\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.85\' numOctaves=\'3\'/%3E%3CfeColorMatrix values=\'0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .45 -.08\'/%3E%3C/filter%3E%3Crect width=\'140\' height=\'140\' filter=\'url(%23n)\'/%3E%3C/svg%3E");border-radius:44px;font:23px/1.15 \'Gochi Hand\',cursive;color:#9C2F62;white-space:nowrap;box-shadow:inset 0 -3px 0 rgba(214,110,156,.35),2px 7px 12px rgba(0,0,0,.2);transform:rotate(-3deg);opacity:0;transition:opacity .25s;pointer-events:none;z-index:50}'
    + '.bub::before{content:\'\';position:absolute;inset:8px;border:2.5px dashed rgba(255,244,249,.95);border-radius:36px;pointer-events:none}'
    // la pointe de la bulle part vers la gauche, vers le visage de l'avatar
    + '.bub::after{content:\'\';position:absolute;left:-22px;top:50%;width:28px;height:30px;margin-top:-12px;background:inherit;clip-path:path(\'M28 4 L28 26 Q14 22 0 30 Q12 18 28 4 Z\')}'
    + '.w.arr .bub.on{opacity:1}.bub.bp{animation:bpop .45s cubic-bezier(.3,1.8,.5,1)}@keyframes bpop{from{transform:scale(.4) rotate(-12deg)}}';
  // toboggan de fete foraine : une tour, et une piste rose qui tourne autour
  var CX = 250, RX = 95, RY = 24, Y0 = 470, Y1 = 794, T0 = Math.PI, T1 = 4 * Math.PI;
  function hp(th) { var f = (th - T0) / (T1 - T0); return [CX + RX * Math.sin(th), Y0 + (Y1 - Y0) * f + RY * Math.cos(th), Math.cos(th)]; }
  var RUNS = { b: [], f: [] };
  (function () { var cur = null, side = null; for (var th = T0; th <= T1 + 1e-6; th += .05) { var p = hp(th), s = p[2] > 0 ? 'f' : 'b'; if (s !== side) { if (cur) cur.push(p); cur = []; RUNS[s].push(cur); side = s; } cur.push(p); } })();
  function pd(run, dy) { return run.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + (p[1] + dy).toFixed(1); }).join(' '); }
  function piste(list) { return list.map(function (run) { var d = pd(run, 10); return '<g filter="url(#P)"><path d="' + d + '" stroke="#D9578F" stroke-width="32" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g><path d="' + d + '" stroke="#F7A8C7" stroke-width="19" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" stroke="#E57FAE" stroke-width="19" stroke-dasharray="3 38" fill="none"/><path d="' + pd(run, 4) + '" stroke="#FFDCEA" stroke-width="3.5" fill="none" stroke-linecap="round"/>'; }).join(''); }
  // derriere : le tube qui arrive d'en haut + la piste a l'arriere de la tour
  var tube = '<g filter="url(#P)"><rect x="242" y="-90" width="16" height="470" rx="8" fill="#F47EB3"/></g><rect x="245" y="-90" width="4" height="470" fill="#FFDCEA"/>';
  for (var ty = -40; ty < 360; ty += 70) tube += '<rect x="240" y="' + ty + '" width="20" height="6" rx="3" fill="#D9578F"/>';
  var SLIDE = '<svg class="zl" id="tb">' + tube + piste(RUNS.b) + '</svg>';
  // la tour a rayures, son toit pointu et son petit drapeau
  var tour = '<g filter="url(#P)"><rect x="' + (CX - 50) + '" y="430" width="100" height="404" fill="#FBF8F1"/></g>';
  for (var sx = 0; sx < 4; sx++) tour += '<rect x="' + (CX - 44 + sx * 25) + '" y="434" width="12" height="398" fill="#F7A8C7"/>';
  tour += '<path d="M' + (CX - 18) + ' 834 V806 Q' + CX + ' 788 ' + (CX + 18) + ' 806 V834 Z" fill="#3472F6"/>';
  tour += '<g filter="url(#P)"><path d="M' + (CX - 72) + ' 444 L' + CX + ' 366 L' + (CX + 72) + ' 444 Z" fill="#F47EB3"/></g><path d="M' + CX + ' 366 L' + (CX - 38) + ' 444 L' + (CX - 14) + ' 444 Z M' + CX + ' 366 L' + (CX + 14) + ' 444 L' + (CX + 38) + ' 444 Z" fill="#FFE45C"/>';
  tour += '<path d="M' + CX + ' 368 V340" stroke="#1C1B1A" stroke-width="3"/><path d="M' + CX + ' 340 L' + (CX + 24) + ' 347 L' + CX + ' 354 Z" fill="#36A96B"/>';
  tour += '<text x="330" y="470" font-size="30" fill="#F21BC9" transform="rotate(-10 330 470)" style="font-family: Freckle Face, cursive">wiii !</text>';
  var TT = '<svg class="zl" id="tt">' + tour + '</svg>';
  // devant : la piste a l'avant de la tour
  var TBF = '<svg class="zl" id="tbf">' + piste(RUNS.f) + '</svg>';
  // la glissade : chute dans le tube (cachee), puis la spirale ; derriere la tour l'avatar passe dessous
  var KS = (function () {
    var k = [{ offset: 0, transform: 'translate(0px,-938px) scale(.55)', opacity: 1, zIndex: 45 }, { offset: .13, transform: 'translate(0px,-462px) scale(.55)', opacity: 1, zIndex: 45 }, { offset: .135, transform: 'translate(0px,-462px) scale(.55)', opacity: 1, zIndex: 20 }, { offset: .145, transform: 'translate(0px,-372px) scale(.55)', opacity: 1, zIndex: 20 }];
    var pts = []; for (var th = T0; th < T1 - 1e-6; th += .08) pts.push(hp(th)); pts.push(hp(T1));
    var L = [0]; for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var T = L[L.length - 1], n = pts.length;
    pts.forEach(function (p, i) { var dx = pts[Math.min(i + 1, n - 1)][0] - pts[Math.max(i - 1, 0)][0], a = Math.max(-10, Math.min(10, dx * 1.2)); k.push({ offset: .15 + .75 * L[i] / T, transform: 'translate(' + (p[0] - 250).toFixed(1) + 'px,' + (p[1] - 818).toFixed(1) + 'px) rotate(' + a.toFixed(1) + 'deg) scale(.55)', opacity: 1, zIndex: p[2] > 0 ? 45 : 20 }); });
    k.push({ offset: .95, transform: 'translate(0px,-34px) scale(.85)', opacity: 1, zIndex: 45 }, { offset: 1, transform: 'translate(0px,0px) scale(1)', opacity: 1, zIndex: 45 });
    return k;
  })();

  function mountW(host) {
    if (host.shadowRoot || !window.__avFull || !window.__chute) return;
    var r = host.attachShadow({ mode: 'open' });
    var P = document.getElementById('P'), P2 = document.getElementById('P2');
    r.innerHTML = '<style>' + CSS + '</style><svg width="0" height="0" style="position:absolute"><defs>' + (P ? P.outerHTML : '') + (P2 ? P2.outerHTML : '') + '</defs></svg>'
      + SLIDE + TT + '<svg class="zl" id="zl"><line x1="560" y1="-40" x2="250" y2="679" stroke="#1C1B1A" stroke-width="3" stroke-linecap="round" stroke-dasharray="12 9" opacity=".75"/><circle cx="560" cy="-40" r="9" fill="#F47EB3" stroke="#1C1B1A" stroke-width="2"/><circle cx="250" cy="679" r="6" fill="#F47EB3" stroke="#1C1B1A" stroke-width="2"/></svg><div class="w" id="w"><div class="tour" id="tour"><div class="sway"><div class="cb">' + window.__chute(69, 131, 264) + '</div><div class="av" id="av"></div></div></div><div class="bub" id="bub"></div></div>' + TBF;
    var MODE = /tyrolienne/.test(location.search) ? 'zip' : 'tobo', zls = MODE === 'tobo' ? [r.getElementById('tb'), r.getElementById('tt'), r.getElementById('tbf')] : [r.getElementById('zl')], zl = { classList: { add: function (c) { zls.forEach(function (e) { e.classList.add(c); }); }, remove: function (c) { zls.forEach(function (e) { e.classList.remove(c); }); } } }, w = r.getElementById('w'), av = r.getElementById('av'), tour = r.getElementById('tour'), st = 'out', t = null, run = 0;
    // la balade : [deplacement x, y (en px de page), taille, duree, mode]
    // échelle de gauche, puis échelle de droite, et on s'arrête à droite de l'étagère du haut
    var PATH = [[200, 2, .6, 1600, 'walk'], [272, -248, .6, 2200, 'climb'], [940, -248, .6, 3400, 'walk'], [902, -498, .6, 2400, 'climb'], [948, -498, .6, 700, 'walk']];
    // la bulle : un message d'accueil, puis le nom de l'objet survolé sur l'étagère
    var bub = r.getElementById('bub'), HELLO = 'psst… survole mes trucs !', cur = '';
    function say(txt) { if (!txt || txt === cur) return; cur = txt; bub.textContent = txt; bub.classList.add('on'); bub.classList.remove('bp'); void bub.offsetWidth; bub.classList.add('bp'); }
    function nameOf(o) { var n = o && o.nextElementSibling; return n && n.classList.contains('cname') ? n.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() : ''; }
    function onOver(e) { var o = e.target && e.target.closest && e.target.closest('.curio .cobj'); if (st !== 'arr') return; if (o) { var tx = document.createElement('textarea'); tx.innerHTML = nameOf(o); say(tx.value); } }
    function onOut(e) { var o = e.target && e.target.closest && e.target.closest('.curio .cobj'); if (!o || st !== 'arr') return; var to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.curio .cobj'); if (to !== o) say(HELLO); }
    document.addEventListener('mouseover', onOver); document.addEventListener('focusin', onOver); document.addEventListener('mouseout', onOut); document.addEventListener('focusout', onOut);
    function stopTour() { run++; tour.getAnimations().forEach(function (a) { a.cancel(); }); tour.style.transform = ''; w.classList.remove('walk', 'climb'); }
    function startTour() {
      var id = ++run, from = 'translate(0px,0px) scale(1)', i = 0;
      (function nextSeg() {
        if (id !== run || st !== 'arr') return;
        if (i >= PATH.length) { w.classList.remove('walk', 'climb'); av.innerHTML = window.__avFull('star'); return; }
        var p = PATH[i++], to = 'translate(' + p[0] + 'px,' + p[1] + 'px) scale(' + p[2] + ')';
        w.classList.remove('walk', 'climb'); w.classList.add(p[4]);
        var a = tour.animate([{ transform: from }, { transform: to }], { duration: p[3], easing: 'ease-in-out', fill: 'forwards' });
        from = to; a.onfinish = nextSeg;
      })();
    }
    function go(c) { clearTimeout(t); if (c !== 'tobo') host.style.zIndex = ''; w.getAnimations().forEach(function (a) { a.cancel(); }); if (c !== 'in' && c !== 'tobo') zl.classList.remove('on'); if (c !== 'fall') stopTour(); else { run++; w.classList.remove('walk', 'climb'); } w.className = 'w'; void w.offsetWidth; if (c) w.className = 'w ' + c; st = c || 'out'; }
    function enter() {
      av.innerHTML = window.__avFull('normal');
      if (MODE === 'tobo') {
        // on glisse le long de la courbe du toboggan (les pieds suivent la piste)
        go('tobo'); zl.classList.add('on'); host.style.zIndex = '6';
        var an = w.animate(KS, { duration: 2800, delay: 300, easing: 'linear', fill: 'both' });
        // arrivée en bas du toboggan : plus de montée par les échelles, elle reste là et parle dans sa bulle
        an.onfinish = function () { host.style.zIndex = ''; if (st !== 'tobo') return; an.cancel(); av.innerHTML = window.__avFull('wink'); w.className = 'w arr'; st = 'arr'; setTimeout(function () { zl.classList.remove('on'); }, 900); say(HELLO); t = setTimeout(function () { if (st === 'arr') av.innerHTML = window.__avFull('normal'); }, 1700); };
        return;
      }
      go('in'); zl.classList.add('on');
      t = setTimeout(function () { if (st === 'in') { av.innerHTML = window.__avFull('wink'); w.className = 'w arr'; st = 'arr'; setTimeout(function () { zl.classList.remove('on'); }, 500); t = setTimeout(startTour, 1600); } }, 1650);
    }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var q = e.intersectionRatio, top = e.boundingClientRect.top, here = st === 'in' || st === 'arr' || st === 'tobo';
        if (q >= .8 && !here) enter();
        else if (here && q < .97 && top < -5) go('fall');
        else if (q < .5 && top > 0) go();
        else if (st === 'fall' && q < .05) go();
      });
    }, { threshold: [0, .05, .1, .2, .3, .4, .5, .6, .7, .8, .85, .9, .95, .97, 1] }).observe(host);
  }
  setInterval(function () { var h = document.getElementById('curio-walker'); if (h && !h.shadowRoot) mountW(h); }, 300);
})();
