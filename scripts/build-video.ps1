param(
  [Parameter(Mandatory = $true)]
  [string]$FfmpegPath,
  [string]$CaptureDir = ''
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$videoDir = Join-Path $projectRoot 'deliverables\video'
if ([string]::IsNullOrWhiteSpace($CaptureDir)) { $CaptureDir = Join-Path $projectRoot 'experiments\live-demo\captures' }
$outputMp4 = Join-Path $videoDir 'demo_avelis_wall_flow.mp4'
$audioPath = Join-Path $videoDir '_live_narration.wav'
$concatPath = Join-Path $videoDir '_live_sequence.txt'

if (-not (Test-Path -LiteralPath $CaptureDir -PathType Container)) { throw "Captures réelles absentes : $CaptureDir" }
if (-not (Test-Path -LiteralPath $FfmpegPath -PathType Leaf)) { throw "FFmpeg absent : $FfmpegPath" }
$ffprobePath = Join-Path (Split-Path -Parent $FfmpegPath) 'ffprobe.exe'

$requiredFrames = @(
  '01_start.png', '02_variant_b.png', '03_variant_d.png', '04_alternative.png', '05_priority_manufacturing.png',
  '06_invalid_blocked.png', '07_variant_c_restored.png', '08_package_ready.png', '09_final_variant_a.png',
  'scroll_01.png', 'scroll_02.png', 'scroll_03.png', 'scroll_04.png', 'scroll_05.png',
  'quality_scroll_01.png', 'quality_scroll_02.png', 'quality_scroll_03.png', 'quality_scroll_04.png', 'quality_scroll_05.png'
)
foreach ($name in $requiredFrames) {
  if (-not (Test-Path -LiteralPath (Join-Path $CaptureDir $name))) { throw "Capture manquante : $name" }
}
for ($index = 0; $index -le 40; $index += 1) {
  $name = 'rot_{0:00}.png' -f $index
  if (-not (Test-Path -LiteralPath (Join-Path $CaptureDir $name))) { throw "Capture de rotation manquante : $name" }
}

if (Test-Path -LiteralPath $audioPath) { Remove-Item -LiteralPath $audioPath -Force }
if (Test-Path -LiteralPath $concatPath) { Remove-Item -LiteralPath $concatPath -Force }
if (Test-Path -LiteralPath $outputMp4) { Remove-Item -LiteralPath $outputMp4 -Force }

# Narration correspondant aux actions réellement exécutées dans le navigateur.
$narration = @"
Voici Avelis Wall Flow en fonctionnement réel. L'application est exécutée localement dans le navigateur, sans serveur externe, sans compte et sans dépendance en ligne. Dès l'ouverture, le cas standard est calculé automatiquement. La solution CAND zéro neuf est recommandée parmi seize candidats valides, avec le volume de bois, le nombre de pièces, la complexité, le coût estimé et dix contrôles visibles.

Nous chargeons maintenant la variante B, un mur de quatre mètres vingt avec une baie de un mètre vingt. Le moteur reconstruit immédiatement toute l'ossature et recommande CAND treize. Les dimensions du formulaire, la vue, les métriques et la nomenclature changent ensemble, sans ressaisie.

La variante D active ensuite une porte paramétrique en plus de la fenêtre. Elle ne lance pas une deuxième chaîne : le même modèle d'ouvertures produit les deux encadrements, interrompt la lisse basse, contrôle les collisions et transmet vingt-cinq pièces aux mêmes sorties.

Le curseur fait réellement tourner le modèle. L'option d'affichage ajoute les identifiants des composants. Ces mêmes identifiants sont réutilisés dans la BOM et dans les données de production : la vue n'est pas une image indépendante.

En descendant dans la page, nous retrouvons les seize solutions classées. Chaque ligne montre l'entraxe, le décalage de trame, le linteau, le volume, le nombre de pièces, la complexité, le coût et le score. Une autre ligne peut être sélectionnée ; le titre et la géométrie active sont alors mis à jour.

Nous changeons ensuite la priorité pour simplifier la fabrication. Le calcul est relancé avec de nouveaux poids, tout en conservant les valeurs brutes afin que la recommandation reste explicable.

Voici maintenant un contrôle négatif réel. La baie est placée à seulement cinquante millimètres de la rive, alors que le profil exige cent quatre-vingts millimètres. L'application affiche l'erreur, supprime le modèle de résultat et désactive le paquet de fabrication. Une donnée incohérente ne peut donc pas produire de fichiers aval.

La variante C restaure une configuration valide. Le mur compact est recalculé, le paquet ZIP redevient disponible et le candidat CAND zéro un est recommandé. Le bouton de paquet complet utilise le modèle courant pour produire la géométrie, le STL, le DXF, la BOM, les données machine, la qualité et les interfaces JSON.

Enfin, la partie basse montre la nomenclature traçable et le rapport de validation. Les contrôles d'ouverture, d'enveloppe, d'encadrement et de fabrication ont été exécutés. L'avertissement structurel reste affiché : ce prototype démontre la continuité numérique et la DfMA, mais ne remplace pas la validation d'Avelis, du fabricant et d'un ingénieur qualifié.

Nous terminons sur le cas standard. Avelis Wall Flow permet donc de configurer une fenêtre et une porte optionnelle, générer, vérifier, comparer et transmettre un mur à ossature bois dans un flux réellement exécutable.
"@

$voice = New-Object -ComObject SAPI.SpVoice
$fileStream = New-Object -ComObject SAPI.SpFileStream
try {
  foreach ($token in $voice.GetVoices()) {
    if ($token.GetDescription() -match 'French|Français|Hortense|Denise|Henri') {
      $voice.Voice = $token
      break
    }
  }
  $voice.Rate = -1
  $voice.Volume = 100
  $fileStream.Open($audioPath, 3, $false)
  $voice.AudioOutputStream = $fileStream
  [void]$voice.Speak($narration)
  $fileStream.Close()
}
finally {
  try { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($fileStream) | Out-Null } catch { }
  try { [Runtime.InteropServices.Marshal]::FinalReleaseComObject($voice) | Out-Null } catch { }
}

function Add-Frame([Collections.Generic.List[string]]$lines, [string]$name, [double]$duration) {
  $path = (Join-Path $CaptureDir $name).Replace('\', '/').Replace("'", "'\''")
  $lines.Add("file '$path'")
  $lines.Add(('duration {0:0.00}' -f $duration).Replace(',', '.'))
}

$sequence = [Collections.Generic.List[string]]::new()
Add-Frame $sequence '01_start.png' 17
Add-Frame $sequence '02_variant_b.png' 12
Add-Frame $sequence '03_variant_d.png' 14
for ($index = 0; $index -le 40; $index += 1) { Add-Frame $sequence ('rot_{0:00}.png' -f $index) 0.10 }
for ($index = 40; $index -ge 0; $index -= 1) { Add-Frame $sequence ('rot_{0:00}.png' -f $index) 0.10 }
Add-Frame $sequence 'rot_20.png' 5
for ($index = 1; $index -le 5; $index += 1) { Add-Frame $sequence ('scroll_{0:00}.png' -f $index) 0.70 }
Add-Frame $sequence 'scroll_03.png' 8
Add-Frame $sequence '04_alternative.png' 12
Add-Frame $sequence '05_priority_manufacturing.png' 10
Add-Frame $sequence '06_invalid_blocked.png' 15
Add-Frame $sequence '07_variant_c_restored.png' 12
Add-Frame $sequence '08_package_ready.png' 10
for ($index = 1; $index -le 5; $index += 1) { Add-Frame $sequence ('quality_scroll_{0:00}.png' -f $index) 0.70 }
Add-Frame $sequence 'quality_scroll_05.png' 10
Add-Frame $sequence '09_final_variant_a.png' 9.80
$finalPath = (Join-Path $CaptureDir '09_final_variant_a.png').Replace('\', '/').Replace("'", "'\''")
$sequence.Add("file '$finalPath'")
[IO.File]::WriteAllLines($concatPath, $sequence, [Text.UTF8Encoding]::new($false))

$filter = '[0:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x0b2c2f,format=yuv420p[v];[1:a]apad=pad_dur=150[a]'
$arguments = @(
  '-hide_banner', '-loglevel', 'warning', '-y',
  '-f', 'concat', '-safe', '0', '-i', $concatPath,
  '-i', $audioPath,
  '-filter_complex', $filter,
  '-map', '[v]', '-map', '[a]', '-t', '150', '-r', '25',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
  '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart',
  '-metadata', 'title=Avelis Wall Flow - démonstration réelle',
  '-metadata', 'comment=Captures réelles de l application locale, sans diapositives PowerPoint',
  $outputMp4
)
& $FfmpegPath @arguments
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $outputMp4)) { throw 'FFmpeg nʼa pas produit la démonstration réelle attendue.' }

$duration = [double](& $ffprobePath -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 $outputMp4)
$streams = & $ffprobePath -v error -show_entries stream=codec_type -of csv=p=0 $outputMp4
if ($duration -lt 149.5 -or $duration -gt 150.5) { throw "Durée vidéo inattendue : $duration secondes." }
if (-not ($streams -contains 'video') -or -not ($streams -contains 'audio')) { throw 'Pistes vidéo ou audio absentes.' }

Remove-Item -LiteralPath $audioPath, $concatPath -Force
Write-Output "Démonstration réelle générée : $outputMp4"
Write-Output "Durée vérifiée : $duration secondes ; pistes vidéo et audio présentes."
