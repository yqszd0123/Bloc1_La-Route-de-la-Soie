$ErrorActionPreference = 'Stop'
$port = 8765
$url = "http://127.0.0.1:$port/apps/web/index.html"
$running = $false

try {
  $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1
  $running = $response.StatusCode -eq 200
}
catch {
  $running = $false
}

if (-not $running) {
  $server = Join-Path $PSScriptRoot 'scripts\serve-local.ps1'
  Start-Process powershell -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $server, '-Port', $port) -WindowStyle Hidden
  Start-Sleep -Milliseconds 800
}

Start-Process $url
