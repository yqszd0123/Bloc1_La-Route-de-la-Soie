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

$site = Join-Path $output 'dist'
$hosting = Join-Path $output '.openai'
New-Item -ItemType Directory -Path $site, $hosting | Out-Null

Copy-Item -LiteralPath (Join-Path $root '.openai\hosting.json') -Destination (Join-Path $hosting 'hosting.json')
Copy-Item -Path (Join-Path $root 'apps\web\*') -Destination $site -Recurse

$publicCore = Join-Path $site 'packages\core'
New-Item -ItemType Directory -Path $publicCore | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'packages\core\src') -Destination $publicCore -Recurse

$publicIfc = Join-Path $site 'test-data\ifc'
New-Item -ItemType Directory -Path $publicIfc -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'test-data\ifc\wall-with-opening-and-window.ifc') -Destination $publicIfc

$publicData = Join-Path $site 'data'
New-Item -ItemType Directory -Path $publicData -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'data\engineering_sources.json') -Destination $publicData

$publicStep = Join-Path $site 'test-data\step'
New-Item -ItemType Directory -Path $publicStep -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'test-data\step\cube.stp') -Destination $publicStep

$publicThirdParty = Join-Path $site 'third_party\occt-import-js'
New-Item -ItemType Directory -Path $publicThirdParty -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'third_party\occt-import-js\dist') -Destination $publicThirdParty -Recurse

$indexPath = Join-Path $site 'index.html'
$index = [IO.File]::ReadAllText($indexPath)
$index = $index.Replace('../../packages/core/', 'packages/core/')
$index = $index.Replace('../../test-data/', 'test-data/')
$index = $index.Replace('../../third_party/', 'third_party/')
[IO.File]::WriteAllText($indexPath, $index, [Text.UTF8Encoding]::new($false))

Write-Output "Paquet public préparé : $site"
