param([int]$Port = 8766, [switch]$Fixtures)
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "I EAT BUSAN: http://localhost:$Port/ (Ctrl+C to stop)"
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.jpg'='image/jpeg'; '.png'='image/png'; '.svg'='image/svg+xml'; '.md'='text/plain; charset=utf-8' }
try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
      if (-not $relative) { $relative = 'index.html' }
      if ($Fixtures -and $relative -eq 'index.html') { $relative = 'tests/browser.html' }
      $file = [IO.Path]::GetFullPath((Join-Path $root $relative))
      if (-not $file.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or $relative -match '(^|[\\/])\.git([\\/]|$)' -or -not [IO.File]::Exists($file)) {
        $context.Response.StatusCode = 404
      } else {
        $context.Response.ContentType = $types[[IO.Path]::GetExtension($file)]
        if (-not $context.Response.ContentType) { $context.Response.ContentType = 'application/octet-stream' }
        $bytes = [IO.File]::ReadAllBytes($file)
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.Headers['Cache-Control'] = 'no-store'
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } catch { $context.Response.StatusCode = 500 }
    finally { $context.Response.Close() }
  }
} finally { $listener.Close() }
