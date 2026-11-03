param(
  [int]$Port = 8765
)

$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg' = 'image/svg+xml'
  '.png' = 'image/png'
  '.csv' = 'text/csv; charset=utf-8'
  '.stl' = 'model/stl'
  '.step' = 'model/step'
  '.stp' = 'model/step'
  '.dxf' = 'application/dxf'
  '.zip' = 'application/zip'
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relative)) {
        $context.Response.StatusCode = 302
        $context.Response.RedirectLocation = '/apps/web/index.html'
        continue
      }
      $candidate = [IO.Path]::GetFullPath((Join-Path $root $relative.Replace('/', [IO.Path]::DirectorySeparatorChar)))
      if (-not $candidate.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) {
        $context.Response.StatusCode = 403
      }
      elseif (Test-Path -LiteralPath $candidate -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($candidate)
        $extension = [IO.Path]::GetExtension($candidate).ToLowerInvariant()
        $context.Response.ContentType = if ($mime.ContainsKey($extension)) { $mime[$extension] } else { 'application/octet-stream' }
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
      else {
        $context.Response.StatusCode = 404
      }
    }
    finally {
      $context.Response.OutputStream.Close()
    }
  }
}
finally {
  $listener.Stop()
  $listener.Close()
}
