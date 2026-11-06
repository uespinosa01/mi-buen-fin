# Verifica el proyecto con un solo comando. Uso: .\scripts\verify.ps1
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$falla = $false

node tools/prueba_logica.js
if ($LASTEXITCODE -ne 0) { Write-Output "FALLA  pruebas"; $falla = $true } else { Write-Output "OK     pruebas" }

$antes = (Get-FileHash docs/index.html -ErrorAction SilentlyContinue).Hash
python tools/construir_app.py | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Output "FALLA  build"; $falla = $true } else { Write-Output "OK     build" }
$despues = (Get-FileHash docs/index.html).Hash
if ($antes -and $antes -ne $despues) { Write-Output "FALLA  docs/index.html estaba desactualizado (ya se reconstruyo; haz commit)"; $falla = $true } else { Write-Output "OK     docs al dia" }

if ($falla) { Write-Output "verify: hay fallas"; exit 1 }
Write-Output "verify: todo en verde"
