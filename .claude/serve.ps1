# Petit serveur statique local pour prévisualiser le portfolio.
param([string]$Root = "portfolio-soleane", [int]$Port = 8765)
$Root = (Resolve-Path $Root).Path
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Host "Serving $Root on http://localhost:$Port/"
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css'; '.jpg'='image/jpeg'; '.png'='image/png'; '.webp'='image/webp'; '.svg'='image/svg+xml'; '.txt'='text/plain; charset=utf-8' }
while ($l.IsListening) {
  $ctx = $l.GetContext()
  try {
    $p = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ($p -eq '') { $p = 'portfolio-soleane.html' }
    $f = [IO.Path]::GetFullPath((Join-Path $Root $p))
    if ($f.StartsWith($Root) -and (Test-Path -LiteralPath $f -PathType Leaf)) {
      $b = [IO.File]::ReadAllBytes($f)
      $ext = [IO.Path]::GetExtension($f).ToLower()
      if ($types[$ext]) { $ctx.Response.ContentType = $types[$ext] }
      $ctx.Response.OutputStream.Write($b, 0, $b.Length)
    } else { $ctx.Response.StatusCode = 404 }
  } catch { $ctx.Response.StatusCode = 500 }
  $ctx.Response.Close()
}
