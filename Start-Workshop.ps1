param([switch]$Install, [switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$python = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if ($Install) {
    $env:TEMP = Join-Path $PSScriptRoot '.tmp'
    $env:TMP = $env:TEMP
    New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
    if (-not (Test-Path -LiteralPath $python)) {
        python -m venv .venv
        if ($LASTEXITCODE -ne 0) { throw 'Aanmaken Python-omgeving mislukt. Installeer Python 3.14.' }
    }
    & $python -m ensurepip --upgrade
    if ($LASTEXITCODE -ne 0) { throw 'pip initialiseren mislukt.' }
    & $python -m pip install --index-url https://pypi.org/simple -r requirements.lock.txt
    if ($LASTEXITCODE -ne 0) { throw 'Python-afhankelijkheden installeren mislukt.' }
    Push-Location frontend
    try {
        npm ci --offline=false --cache ..\.npm-cache
        if ($LASTEXITCODE -ne 0) { throw 'Frontend-afhankelijkheden installeren mislukt.' }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend bouwen mislukt.' }
    } finally { Pop-Location }
}
if (-not (Test-Path -LiteralPath $python) -or -not (Test-Path 'frontend\dist\index.html')) {
    throw 'Eenmalige installatie nodig: .\Start-Workshop.ps1 -Install (internet nodig).'
}
$health = $null
try { $health = Invoke-RestMethod 'http://127.0.0.1:8766/api/health' -TimeoutSec 3 } catch { }
if ($health -and $health.status -eq 'ok' -and $health.application -eq 'coock-machining-simulator' -and $health.model_version -eq '2.0.0') {
    Write-Host 'De workshopapp draait al op http://127.0.0.1:8766'
    if (-not $NoBrowser) { Start-Process 'http://127.0.0.1:8766' }
    return
}
$probe = [System.Net.Sockets.TcpClient]::new()
try {
    $connection = $probe.ConnectAsync('127.0.0.1', 8766)
    if ($connection.Wait(1000) -and $probe.Connected) { throw 'Poort 8766 is al in gebruik door een andere toepassing.' }
} catch [System.AggregateException] {
    # Connection refused means the port is free; no admin-only network inventory.
} finally { $probe.Dispose() }
Write-Host 'COOCK Verspaningsatelier - http://127.0.0.1:8766'
Write-Host 'Lokaal en offline. Stop met Ctrl+C in dit venster.'
$launchArguments = @('-m', 'simulator.launcher')
if ($NoBrowser) { $launchArguments += '--no-browser' }
& $python @launchArguments
if ($LASTEXITCODE -ne 0) { throw 'De lokale server is gestopt met een fout.' }
