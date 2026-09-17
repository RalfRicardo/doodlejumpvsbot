$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
function Assert-Exit([string]$step) {
    if ($LASTEXITCODE -ne 0) { throw "$step failed. Read the error above before continuing." }
}
$nodeMajor = [int]((node --version).TrimStart('v').Split('.')[0])
if ($nodeMajor -ne 24) { throw 'Install Node.js 24 LTS, then open a new terminal.' }
if (-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')) {
    py -3.12 -m venv .venv
    Assert-Exit 'Create Python 3.12 environment'
}
& .venv/Scripts/python.exe -m pip install -r backend/requirements.txt
Assert-Exit 'Install backend dependencies'
npm.cmd --prefix frontend ci
Assert-Exit 'Install frontend dependencies'
& .venv/Scripts/python.exe -m flask --app backend.app init-db
Assert-Exit 'Initialize database'
Write-Host 'Setup complete. Run: npm.cmd run dev' -ForegroundColor Green
