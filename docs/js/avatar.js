/* Dessin de mon avatar (le même partout) : utilisé par la bonbonnière (À propos) et le toboggan (Curiosités). */
(function () {
const PAL = ['#FF5B4D', '#F47EB3', '#3472F6', '#FFB92F', '#36A96B'];
// mon avatar : exactement le meme que celui du debut du site
const HAIRB = (() => {
  let s = '<g filter="url(#P)">';
  [[160,70,48],[118,82,40],[202,82,40],[92,118,36],[228,118,36],[86,160,34],[234,160,34],[90,200,32],[230,200,32],[100,236,28],[222,236,28],[140,62,34],[182,62,34]].forEach(c => s += `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" fill="#E3AE45"/>`);
  s += '</g>';
  ['84 150','80 192','226 150','230 190','150 58','118 78','196 74','96 230','220 232','100 112','222 110'].forEach(p => s += `<path d="M${p} a7 7 0 1 1 9 6" fill="none" stroke="#B97E24" stroke-width="3" stroke-linecap="round"/>`);
  return s;
})();
const BROWS = { normal: 'M122 120 Q134 113 146 119 M174 119 Q186 113 198 120', happy: 'M122 116 Q134 108 146 115 M174 115 Q186 108 198 116', joy: 'M120 112 Q134 100 148 110 M172 110 Q186 100 200 112', scream: 'M120 106 Q134 96 148 104 M172 104 Q186 96 200 106' };
const STAR = 'M0 -12 L3 -4 L11.4 -3.7 L4.8 1.6 L7.1 9.7 L0 5 L-7.1 9.7 L-4.8 1.6 L-11.4 -3.7 L-3 -4 Z';
function face(expr) {
  const m = ['normal', 'wink', 'happy', 'star', 'love', 'think', 'wow', 'loupe'].indexOf(expr) >= 0 ? expr : 'normal';
  let s = '<g filter="url(#P2)"><ellipse cx="160" cy="150" rx="58" ry="66" fill="#F6CFB0"/></g>';
  const ck = (m === 'happy' || m === 'love' || m === 'star') ? .95 : .55;
  s += `<circle cx="122" cy="176" r="11" fill="#FF8BA7" opacity="${ck}"/><circle cx="198" cy="176" r="11" fill="#FF8BA7" opacity="${ck}"/>`;
  const br = { happy: 'happy', love: 'happy', star: 'joy', wow: 'scream', think: 'normal' }[m] || 'normal';
  s += (m === 'think' || m === 'loupe') ? '<path d="M122 120 Q134 113 146 119 M174 112 Q186 104 198 112" fill="none" stroke="#B07A2C" stroke-width="4" stroke-linecap="round"/>' : `<path d="${BROWS[br]}" fill="none" stroke="#B07A2C" stroke-width="4" stroke-linecap="round"/>`;
  const dot = (x, ox, oy) => `<ellipse cx="${x + ox}" cy="${148 + oy}" rx="6" ry="7" fill="#241F1C"/><circle cx="${x + ox + 2}" cy="${146 + oy}" r="2" fill="#fff"/>`;
  const shut = (x) => `<path d="M${x - 8} 150 Q${x} 143 ${x + 8} 150" fill="none" stroke="#241F1C" stroke-width="3.5" stroke-linecap="round"/>`;
  if (m === 'normal') s += dot(134, 0, 0) + dot(186, 0, 0);
  if (m === 'wink') s += dot(134, 0, 0) + shut(186);
  if (m === 'happy') s += shut(134) + shut(186);
  if (m === 'think') s += dot(134, 3, -4) + dot(186, 3, -4);
  if (m === 'star') s += [134, 186].map(x => `<g transform="translate(${x} 148)"><path d="${STAR}" fill="#FFC93C" stroke="#241F1C" stroke-width="2" stroke-linejoin="round"/><circle cx="-2.5" cy="-3" r="2.2" fill="#fff"/></g>`).join('');
  if (m === 'love') s += [134, 186].map(x => `<path transform="translate(${x} 149) scale(1.15)" d="M0 8 C-12 0 -12 -10 -5 -10 C-2 -10 0 -7 0 -5 C0 -7 2 -10 5 -10 C12 -10 12 0 0 8 Z" fill="#F21BC9"/>`).join('');
  if (m === 'wow') s += '<circle cx="134" cy="147" r="10" fill="#fff" stroke="#241F1C" stroke-width="2"/><circle cx="186" cy="147" r="10" fill="#fff" stroke="#241F1C" stroke-width="2"/><circle cx="134" cy="148" r="4" fill="#241F1C"/><circle cx="186" cy="148" r="4" fill="#241F1C"/>';
  s += '<path d="M126 141 L121 136 M133 139 L132 133 M140 140 L143 135 M180 140 L177 135 M187 139 L188 133 M194 141 L199 136" stroke="#2756F5" stroke-width="3" stroke-linecap="round"/><path d="M158 160 Q154 170 161 172" fill="none" stroke="#D59A78" stroke-width="3" stroke-linecap="round"/>';
  if (m === 'normal' || m === 'wink') s += '<path d="M134 182 Q160 218 186 182 Q160 190 134 182 Z" fill="#A01E3C"/><path d="M139 184 Q160 190 181 184 Q180 190 178 192 Q160 197 142 192 Q140 189 139 184 Z" fill="#fff"/>';
  if (m === 'happy' || m === 'star' || m === 'love') s += '<path d="M122 176 Q160 238 198 176 Q160 188 122 176 Z" fill="#A01E3C"/><path d="M128 179 Q160 188 192 179 Q190 187 186 190 Q160 197 134 190 Q130 186 128 179 Z" fill="#fff"/>';
  if (m === 'think') s += '<path d="M146 190 Q158 184 174 188" fill="none" stroke="#A01E3C" stroke-width="4.5" stroke-linecap="round"/><g transform="translate(222 92)"><circle r="6" fill="#fff" stroke="#241F1C" stroke-width="2"/><circle cx="10" cy="-14" r="9" fill="#fff" stroke="#241F1C" stroke-width="2"/></g>';
  if (m === 'wow') s += '<ellipse cx="160" cy="192" rx="9" ry="11" fill="#A01E3C"/>';
  // « loupe » : l'œil gauche normal, la bouche en petit « o » curieux (la loupe est posée par-dessus les lunettes, plus bas)
  if (m === 'loupe') s += dot(134, 0, 0) + '<ellipse cx="162" cy="191" rx="7" ry="8" fill="#A01E3C"/>';
  s += '<rect x="111" y="127" width="46" height="40" rx="14" fill="#fff" fill-opacity=".18" stroke="#7A4824" stroke-width="6"/><rect x="163" y="127" width="46" height="40" rx="14" fill="#fff" fill-opacity=".18" stroke="#7A4824" stroke-width="6"/><path d="M157 140 Q160 134 163 140 M111 138 L100 134 M209 138 L220 134" fill="none" stroke="#7A4824" stroke-width="6" stroke-linecap="round"/>';
  // la loupe devant l'œil droit : verre bleuté qui grossit l'œil, manche rouge
  if (m === 'loupe') s += '<path d="M206 170 L240 212" stroke="#B8141D" stroke-width="15" stroke-linecap="round"/><path d="M206 170 L240 212" stroke="#FF5B4D" stroke-width="10" stroke-linecap="round"/>'
    + '<circle cx="186" cy="147" r="33" fill="#DDEFF8" fill-opacity=".82" stroke="#3472F6" stroke-width="9"/>'
    + '<ellipse cx="187" cy="149" rx="13" ry="15" fill="#241F1C"/><circle cx="192" cy="143" r="5" fill="#fff"/><circle cx="182" cy="156" r="2.4" fill="#fff"/>'
    + '<path d="M164 134 Q170 122 184 120" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>';
  s += '<g filter="url(#P2)">';
  [[124,92,20],[148,82,22],[174,82,22],[198,94,20],[104,116,14],[216,116,14],[100,214,20],[98,250,18],[222,214,20],[224,250,18]].forEach(c => s += `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" fill="#EDBE55"/>`);
  return s + '</g>';
}
// parachute : lx/rx = ou les cordes rejoignent les epaules, sy = hauteur
function CHUTE(lx, rx, sy) {
  return `<svg viewBox="0 0 200 ${sy}" preserveAspectRatio="none" style="width:100%;height:100%;overflow:visible"><path d="M16 118 L${lx} ${sy} M60 118 L${lx} ${sy} M140 118 L${rx} ${sy} M184 118 L${rx} ${sy}" stroke="#1C1B1A" stroke-width="2" opacity=".55"/><g filter="url(#P)"><path d="M10 118 Q10 6 100 4 Q190 6 190 118 Q167 102 145 118 Q122 102 100 118 Q78 102 55 118 Q33 102 10 118 Z" fill="#F47EB3"/></g><path d="M55 118 Q60 20 100 4 Q140 20 145 118 Q122 102 100 118 Q78 102 55 118 Z" fill="#FFE45C"/><path d="M86 112 Q88 30 100 4 Q112 30 114 112 Q107 104 100 110 Q93 104 86 112 Z" fill="#3472F6"/></svg>`;
}
// juste la tete (pour les petites icones)
function avatar(expr) { return '<svg viewBox="30 0 260 290"><g>' + HAIRB + face(expr) + '</g></svg>'; }
// mon avatar en entier
function full(expr) {
  const arm = '<g filter="url(#P)"><path d="M222 268 Q262 238 282 196 L302 208 Q284 254 240 292 Z" fill="#FF4F9B"/><circle cx="294" cy="190" r="15" fill="#F6CFB0"/></g>';
  return '<svg viewBox="30 0 260 490"><g class="fb">'
    + '<g class="hd">' + HAIRB + '</g>'
    + '<g class="leg"><g filter="url(#P)"><path d="M74 368 L246 368 L266 462 L182 462 L162 404 L158 404 L138 462 L54 462 Z" fill="#4E7FD6"/><ellipse cx="96" cy="466" rx="44" ry="13" fill="#EEF1F5"/><ellipse cx="224" cy="466" rx="44" ry="13" fill="#EEF1F5"/><path d="M160 372 L160 404" stroke="#3A64B4" stroke-width="3"/></g></g>'
    + '<g filter="url(#P)"><rect x="145" y="200" width="30" height="44" fill="#F6CFB0"/><path d="M86 262 Q96 240 140 236 Q160 246 180 236 Q224 240 234 262 L248 372 L72 372 Z" fill="#FF4F9B"/></g>'
    + '<path d="M138 238 Q160 256 182 238" fill="none" stroke="#E0357F" stroke-width="7" stroke-linecap="round"/><path d="M150 250 L148 286 M170 250 L172 286" stroke="#F5F0E7" stroke-width="3" stroke-linecap="round"/>'
    + '<g class="ar armR">' + arm + '</g><g transform="matrix(-1 0 0 1 320 0)"><g class="ar armL">' + arm + '</g></g>'
    + '<g transform="rotate(-9 160 312)"><rect x="128" y="282" width="64" height="46" rx="4" fill="#FBF8F1" stroke="#3472F6" stroke-width="2.5"/><rect x="134" y="288" width="17" height="20" rx="2" fill="#F47EB3"/><path d="M157 292 H184 M157 300 H178" stroke="#1C1B1A" stroke-width="2.5" stroke-linecap="round" opacity=".55"/></g>'
    + '<path d="M108 316 L212 316 L203 370 L117 370 Z" fill="#E0357F"/><path d="M118 322 Q160 314 202 322" fill="none" stroke="#C72A6E" stroke-width="3" stroke-linecap="round"/>'
    + '<g class="hd">' + face(expr) + '</g></g></svg>';
}
window.AVATAR = { PAL: PAL, HAIRB: HAIRB, BROWS: BROWS, STAR: STAR, face: face, CHUTE: CHUTE, avatar: avatar, full: full };
window.__avFull = full; window.__chute = CHUTE;
})();
