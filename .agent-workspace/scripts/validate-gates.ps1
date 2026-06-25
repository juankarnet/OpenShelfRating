param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('functional', 'technical')]
    [string]$Mode
)

$ErrorActionPreference = 'Stop'

function Test-File {
    param([string]$Path)
    if (-not (Test-Path -Path $Path)) {
        throw "Missing required file: $Path"
    }
}

function Get-FileLines {
    param([string]$Path)
    Get-Content -Path $Path
}

function Add-Finding {
    param(
        [System.Collections.Generic.List[string]]$Findings,
        [string]$Path,
        [int]$Line,
        [string]$Reason
    )
    $Findings.Add("${Path}:$Line - $Reason") | Out-Null
}

$root = (Get-Location).Path
$findings = [System.Collections.Generic.List[string]]::new()

$commonPlaceholders = @(
    '\[UNSET\]',
    '\[SYNC_REQUIRED\]',
    '<[^>]+>'
)

$functionalFiles = @(
    '.agent-workspace/docs/APPLICATION_CONTEXT.md',
    '.agent-workspace/docs/PROJECT_STATE.md'
)

$technicalFiles = @(
    '.agent-workspace/docs/TECHNICAL_MANIFEST.md',
    '.agent-workspace/docs/PROJECT_STATE.md',
    '.agent-workspace/agents/architect_agent.md',
    '.agent-workspace/agents/dev_agent.md',
    '.agent-workspace/agents/qa_agent.md'
)

$targetFiles = if ($Mode -eq 'functional') { $functionalFiles } else { $technicalFiles }

foreach ($file in $targetFiles) {
    Test-File -Path $file
    $lines = Get-FileLines -Path $file

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $lineNumber = $i + 1

        foreach ($pattern in $commonPlaceholders) {
            if ($line -match $pattern) {
                Add-Finding -Findings $findings -Path $file -Line $lineNumber -Reason "placeholder token detected"
            }
        }

        if ($Mode -eq 'technical' -and $line -match 'Generic Software Engineer|Generic Architecture|Generic QA|Polyglot') {
            Add-Finding -Findings $findings -Path $file -Line $lineNumber -Reason "generic baseline not removed"
        }

        if ($Mode -eq 'functional' -and $file -eq '.agent-workspace/docs/APPLICATION_CONTEXT.md') {
            if ($line -match '^\*\s+\*\*[^*]+:\*\*\s*$') {
                Add-Finding -Findings $findings -Path $file -Line $lineNumber -Reason "empty required field"
            }
        }
    }
}

if ($findings.Count -gt 0) {
    Write-Host "Gate validation failed ($Mode). Findings:" -ForegroundColor Red
    $findings | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Gate validation passed ($Mode)." -ForegroundColor Green
exit 0
