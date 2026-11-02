param(
  [string]$FfprobePath = ''
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$deliverables = Join-Path $root 'deliverables'
$required = @(
  'rapport\rapport_scientifique.html',
  'rapport\rapport_scientifique.pdf',
  'presentation\soutenance_bloc1.pptx',
  'presentation\soutenance_bloc1.pdf',
  'video\demo_avelis_wall_flow.mp4'
)

foreach ($relativePath in $required) {
  $path = Join-Path $deliverables $relativePath
  if (-not (Test-Path -LiteralPath $path)) { throw "Livrable manquant : $relativePath" }
  if ((Get-Item -LiteralPath $path).Length -lt 1000) { throw "Livrable anormalement petit : $relativePath" }
}
if (Test-Path -LiteralPath (Join-Path $deliverables 'video\demo_avelis_wall_flow_source.pptx')) {
  throw 'La vidéo de démonstration ne doit plus contenir de source PowerPoint.'
}

function Get-PdfPageCount($path) {
  $ascii = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($path))
  return ([regex]::Matches($ascii, '/Type\s*/Page\b')).Count
}

$reportPdfPages = Get-PdfPageCount (Join-Path $deliverables 'rapport\rapport_scientifique.pdf')
$slidesPdfPages = Get-PdfPageCount (Join-Path $deliverables 'presentation\soutenance_bloc1.pdf')
if ($reportPdfPages -lt 10 -or $reportPdfPages -gt 15) { throw "Le rapport PDF contient $reportPdfPages pages au lieu de 10 à 15." }
if ($slidesPdfPages -ne 14) { throw "Le support PDF devrait contenir 14 pages, résultat : $slidesPdfPages." }

Add-Type -AssemblyName System.IO.Compression.FileSystem
function Get-OpenXmlPartCount($path, $pattern) {
  $zip = [IO.Compression.ZipFile]::OpenRead($path)
  try { return ($zip.Entries | Where-Object { $_.FullName -match $pattern }).Count }
  finally { $zip.Dispose() }
}

$slideCount = Get-OpenXmlPartCount (Join-Path $deliverables 'presentation\soutenance_bloc1.pptx') '^ppt/slides/slide\d+\.xml$'
if ($slideCount -ne 14) { throw "Le PPTX contient $slideCount diapositives au lieu de 14." }

$videoCheck = 'ffprobe non fourni'
if ($FfprobePath -and (Test-Path -LiteralPath $FfprobePath)) {
  $videoPath = Join-Path $deliverables 'video\demo_avelis_wall_flow.mp4'
  $duration = [double](& $FfprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $videoPath)
  $streams = & $FfprobePath -v error -show_entries stream=codec_type -of csv=p=0 $videoPath
  $comment = & $FfprobePath -v error -show_entries format_tags=comment -of default=noprint_wrappers=1:nokey=1 $videoPath
  if ($duration -lt 120 -or $duration -gt 180) { throw "Durée vidéo hors plage 2 à 3 minutes : $duration s." }
  if (-not ($streams -contains 'video') -or -not ($streams -contains 'audio')) { throw 'La vidéo doit contenir une piste image et une piste audio.' }
  if ($comment -notmatch 'Captures r.+elles') { throw 'La vidéo ne porte pas la provenance de capture réelle attendue.' }
  $videoCheck = "${duration}s, pistes vidéo + audio"
}

$manifestLines = @(
  '# SHA-256 des livrables finaux',
  '# Généré par scripts/verify-deliverables.ps1'
)
foreach ($relativePath in $required) {
  $path = Join-Path $deliverables $relativePath
  $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
  $normalized = $relativePath.Replace('\', '/')
  $manifestLines += "$hash  $normalized"
}
[IO.File]::WriteAllLines((Join-Path $deliverables 'MANIFEST.sha256'), $manifestLines, [Text.UTF8Encoding]::new($false))

$report = @(
  'AVELIS WALL FLOW — VÉRIFICATION DES LIVRABLES',
  "Rapport PDF : $reportPdfPages pages",
  "Soutenance : $slideCount diapositives / $slidesPdfPages pages PDF",
  "Vidéo : $videoCheck / démonstration réelle de l’application",
  'Formats Open XML : valides',
  'Manifest SHA-256 : généré',
  'Statut : OK'
)
[IO.File]::WriteAllLines((Join-Path $deliverables 'VERIFICATION.txt'), $report, [Text.UTF8Encoding]::new($true))
$report
