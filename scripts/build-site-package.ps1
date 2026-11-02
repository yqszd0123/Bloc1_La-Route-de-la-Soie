param(
  [Parameter(Mandatory = $true)]
  [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$output = [IO.Path]::GetFullPath($OutputDirectory)

if (Test-Path -LiteralPath $output) {
  throw "Le répertoire de sortie existe déjà : $output"
}

$site = Join-Path $output 'site'
$hosting = Join-Path $output '.openai'
New-Item -ItemType Directory -Path $site, $hosting | Out-Null

Copy-Item -LiteralPath (Join-Path $root '.openai\hosting.json') -Destination (Join-Path $hosting 'hosting.json')
Copy-Item -Path (Join-Path $root 'apps\web\*') -Destination $site -Recurse

$publicCore = Join-Path $site 'packages\core'
New-Item -ItemType Directory -Path $publicCore | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'packages\core\src') -Destination $publicCore -Recurse

$indexPath = Join-Path $site 'index.html'
$index = [IO.File]::ReadAllText($indexPath)
$index = $index.Replace('../../packages/core/', 'packages/core/')
[IO.File]::WriteAllText($indexPath, $index, [Text.UTF8Encoding]::new($false))

Write-Output "Paquet public préparé : $site"
