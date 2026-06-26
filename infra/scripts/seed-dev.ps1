param(
    [string]$ContainerName = "osr-postgres",
    [string]$Database = "openshelfrating",
    [string]$Username = "osr_user",
    [ValidateSet("basic", "full", "clean")]
    [string]$Mode = "basic"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$sqlRelativePath = switch ($Mode) {
    "basic" { "..\sql\dev_seed.sql" }
    "full"  { "..\sql\dev_seed_full.sql" }
    "clean" { "..\sql\dev_seed_cleanup.sql" }
}

$sqlFile = Resolve-Path (Join-Path $scriptDir $sqlRelativePath)

if (-not $sqlFile) {
    throw "Could not resolve SQL seed file."
}

$engine = $null
if (Get-Command podman -ErrorAction SilentlyContinue) {
    $engine = "podman"
} elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    $engine = "docker"
} else {
    throw "Neither podman nor docker is available in PATH."
}

Write-Host "Applying dev seed using $engine on container '$ContainerName'..."
Get-Content -Raw $sqlFile | & $engine exec -i $ContainerName psql -U $Username -d $Database -v ON_ERROR_STOP=1

if ($LASTEXITCODE -ne 0) {
    throw "Seed execution failed with exit code $LASTEXITCODE (mode: $Mode)."
}

Write-Host "Dev seed mode '$Mode' completed."
