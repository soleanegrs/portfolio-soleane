# Regroupe index.html + runtime.js + assets/ en un seul fichier portfolio-soleane.html
param([string]$Src = "portfolio-soleane", [string]$Out = "portfolio-soleane\portfolio-soleane.html")
$Src = (Resolve-Path $Src).Path
$html = [IO.File]::ReadAllText((Join-Path $Src 'index.html'), [Text.Encoding]::UTF8)
$rt = [IO.File]::ReadAllText((Join-Path $Src 'runtime.js'), [Text.Encoding]::UTF8)
$html = $html.Replace('<script src="runtime.js"></script>', "<script>`n" + $rt + "`n</script>")
$mimes = @{ '.jpg'='image/jpeg'; '.png'='image/png'; '.webp'='image/webp'; '.svg'='image/svg+xml' }
Get-ChildItem (Join-Path $Src 'assets') | ForEach-Object {
  $b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($_.FullName))
  $html = $html.Replace("assets/" + $_.Name, "data:" + $mimes[$_.Extension.ToLower()] + ";base64," + $b64)
}
$OutFull = [IO.Path]::GetFullPath($Out)
[IO.File]::WriteAllText($OutFull, $html, (New-Object Text.UTF8Encoding($false)))
if ($html -match 'assets/') { 'WARN: assets/ reference remains' } else { 'OK' }
(Get-Item $OutFull).Length
