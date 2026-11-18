# Genere assets/mat.svg : un tapis de d&#233;coupe vert (grille, règles, angles, rapporteur)
param([string]$Out = "portfolio-soleane\assets\mat.svg")
$W = 1600; $H = 1000; $u = 20; $m = 34   # u = 1 cm, m = marge (bord)
$inv = [Globalization.CultureInfo]::InvariantCulture
function F($v) { ([double]$v).ToString("0.##", $inv) }
$sb = New-Object Text.StringBuilder
[void]$sb.Append("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 $W $H' width='$W' height='$H'>")
[void]$sb.Append("<defs><radialGradient id='v' cx='50%' cy='48%' r='70%'><stop offset='0' stop-color='#1B7A61'/><stop offset='.65' stop-color='#14684F'/><stop offset='1' stop-color='#0C4D3B'/></radialGradient></defs>")
[void]$sb.Append("<rect width='$W' height='$H' fill='#0F5A45'/>")
[void]$sb.Append("<rect x='$m' y='$m' width='$($W-2*$m)' height='$($H-2*$m)' fill='url(#v)'/>")
$x0 = $m; $y0 = $m; $x1 = $W - $m; $y1 = $H - $m
# grille
$minor = New-Object Text.StringBuilder; $major = New-Object Text.StringBuilder; $half = New-Object Text.StringBuilder
for ($x = $x0; $x -le $x1; $x += $u) { $k = [int](($x - $x0) / $u); $d = "M$x $y0 V$y1 "; if ($k % 10 -eq 0) { [void]$major.Append($d) } elseif ($k % 5 -eq 0) { [void]$half.Append($d) } else { [void]$minor.Append($d) } }
for ($y = $y0; $y -le $y1; $y += $u) { $k = [int](($y - $y0) / $u); $d = "M$x0 $y H$x1 "; if ($k % 10 -eq 0) { [void]$major.Append($d) } elseif ($k % 5 -eq 0) { [void]$half.Append($d) } else { [void]$minor.Append($d) } }
[void]$sb.Append("<path d='$minor' stroke='#E9F5EF' stroke-opacity='.22' stroke-width='1' fill='none'/>")
[void]$sb.Append("<path d='$half' stroke='#E9F5EF' stroke-opacity='.42' stroke-width='1.4' fill='none'/>")
[void]$sb.Append("<path d='$major' stroke='#F2FAF6' stroke-opacity='.72' stroke-width='2.2' fill='none'/>")
# graduations + chiffres sur les bords
$t = New-Object Text.StringBuilder; $txt = New-Object Text.StringBuilder
for ($x = $x0; $x -le $x1; $x += $u / 2) { $k = ($x - $x0) / $u; $len = if ($k % 5 -eq 0) { 12 } elseif ($k % 1 -eq 0) { 8 } else { 4 }; [void]$t.Append("M$(F $x) $y0 v-$len M$(F $x) $y1 v$len ") }
for ($y = $y0; $y -le $y1; $y += $u / 2) { $k = ($y - $y0) / $u; $len = if ($k % 5 -eq 0) { 12 } elseif ($k % 1 -eq 0) { 8 } else { 4 }; [void]$t.Append("M$x0 $(F $y) h-$len M$x1 $(F $y) h$len ") }
[void]$sb.Append("<path d='$t' stroke='#F2FAF6' stroke-opacity='.85' stroke-width='1.2' fill='none'/>")
$n = 0; for ($x = $x0 + $u; $x -lt $x1; $x += $u) { $n++; $fs = if ($n % 5 -eq 0) { 13 } else { 9 }; [void]$txt.Append("<text x='$x' y='$($y0-15)' font-size='$fs'>$n</text><text x='$x' y='$($y1+24)' font-size='$fs'>$n</text>") }
$n = 0; for ($y = $y1 - $u; $y -gt $y0; $y -= $u) { $n++; $fs = if ($n % 5 -eq 0) { 13 } else { 9 }; [void]$txt.Append("<text x='$($x0-17)' y='$($y+4)' font-size='$fs'>$n</text><text x='$($x1+17)' y='$($y+4)' font-size='$fs'>$n</text>") }
[void]$sb.Append("<g fill='#F2FAF6' fill-opacity='.85' font-family='Arial, Helvetica, sans-serif' text-anchor='middle'>$txt</g>")
# lignes d'angle depuis le coin bas-gauche
$ang = @(@{a=15;d=''}, @{a=30;d='6 6'}, @{a=45;d=''}, @{a=60;d='6 6'}, @{a=75;d=''})
$lines = ""; $lab = ""
foreach ($g in $ang) {
  $r = $g.a * [Math]::PI / 180; $L = 2400
  $ex = $x0 + $L * [Math]::Cos($r); $ey = $y1 - $L * [Math]::Sin($r)
  $dash = if ($g.d) { " stroke-dasharray='$($g.d)'" } else { "" }
  $lines += "<line x1='$x0' y1='$y1' x2='$(F $ex)' y2='$(F $ey)' stroke='#F2FAF6' stroke-opacity='.5' stroke-width='1.3'$dash/>"
  $lx = $x0 + 520 * [Math]::Cos($r); $ly = $y1 - 520 * [Math]::Sin($r)
  $lab += "<text x='$(F ($lx+8))' y='$(F ($ly-6))'>$($g.a)&#176;</text>"
}
# diagonales 45&#176; depuis le haut
$lines += "<line x1='$($x0+400)' y1='$y0' x2='$($x0+400+($y1-$y0))' y2='$y1' stroke='#F2FAF6' stroke-opacity='.45' stroke-width='1.3'/>"
$lines += "<line x1='$($x0+440)' y1='$y0' x2='$($x0+440+($y1-$y0))' y2='$y1' stroke='#F2FAF6' stroke-opacity='.35' stroke-width='1.1' stroke-dasharray='6 6'/>"
[void]$sb.Append("<svg x='$x0' y='$y0' width='$($x1-$x0)' height='$($y1-$y0)' viewBox='$x0 $y0 $($x1-$x0) $($y1-$y0)'>$lines</svg>")
[void]$sb.Append("<g fill='#F2FAF6' fill-opacity='.8' font-family='Arial, Helvetica, sans-serif' font-size='13'>$lab</g>")
# rapporteur en bas a gauche
$cx = $x0; $cy = $y1; $R1 = 230; $prot = ""; $pl = ""
for ($d = 0; $d -le 90; $d += 2) {
  $r = $d * [Math]::PI / 180; $len = if ($d % 10 -eq 0) { 16 } else { 7 }
  $ax = $cx + $R1 * [Math]::Cos($r); $ay = $cy - $R1 * [Math]::Sin($r)
  $bx = $cx + ($R1 - $len) * [Math]::Cos($r); $by = $cy - ($R1 - $len) * [Math]::Sin($r)
  $prot += "M$(F $ax) $(F $ay) L$(F $bx) $(F $by) "
  if ($d % 10 -eq 0 -and $d -gt 0 -and $d -lt 90) { $tx = $cx + ($R1 - 30) * [Math]::Cos($r); $ty = $cy - ($R1 - 30) * [Math]::Sin($r); $pl += "<text x='$(F $tx)' y='$(F ($ty+4))'>$d</text>" }
}
[void]$sb.Append("<path d='M$($cx+$R1) $cy A$R1 $R1 0 0 0 $cx $($cy-$R1)' fill='none' stroke='#F2FAF6' stroke-opacity='.7' stroke-width='1.4'/>")
[void]$sb.Append("<path d='$prot' stroke='#F2FAF6' stroke-opacity='.8' stroke-width='1.2'/>")
[void]$sb.Append("<g fill='#F2FAF6' fill-opacity='.75' font-family='Arial, Helvetica, sans-serif' font-size='10' text-anchor='middle'>$pl</g>")
# petites étiquettes de format
foreach ($p in @(@{x=600;y=520;t='A4'}, @{x=1060;y=300;t='A3'}, @{x=380;y=700;t='A5'})) {
  [void]$sb.Append("<g transform='translate($($p.x) $($p.y))'><path d='M0 0 h22 v16 h-16 z' fill='#F2FAF6' fill-opacity='.85'/><text x='9' y='12' font-family='Arial, Helvetica, sans-serif' font-size='10' font-weight='700' fill='#0F5A45' text-anchor='middle'>$($p.t)</text></g>")
}
[void]$sb.Append("<text x='$($x1-14)' y='$($y0+24)' text-anchor='end' font-family='Arial, Helvetica, sans-serif' font-size='12' font-weight='700' letter-spacing='2' fill='#F2FAF6' fill-opacity='.85'>CENTIM&#200;TRES</text>")
[void]$sb.Append("</svg>")
[IO.File]::WriteAllText([IO.Path]::GetFullPath($Out), $sb.ToString(), (New-Object Text.UTF8Encoding($false)))
"OK " + (Get-Item $Out).Length
