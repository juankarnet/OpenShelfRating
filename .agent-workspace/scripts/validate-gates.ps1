param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('functional', 'technical', 'spec-sync')]
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
    [System.IO.File]::ReadAllLines($Path, [System.Text.Encoding]::UTF8)
}

function Write-FileLines {
    param(
        [string]$Path,
        [System.Collections.Generic.List[string]]$Lines
    )
    [System.IO.File]::WriteAllLines($Path, $Lines, [System.Text.Encoding]::UTF8)
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

function Get-SpecStatusText {
    param([string[]]$Lines)
    foreach ($line in $Lines) {
        if ($line -match '^\*\s+\*\*Status:\*\*\s+(.+)$') {
            return $Matches[1].Trim()
        }
    }
    return ''
}

function Convert-ToProjectStateStatus {
    param([string]$SpecStatus)
    $statusLower = $SpecStatus.ToLowerInvariant()
    if ($statusLower -match 'implemented') {
        return '✅ Implemented'
    }
    if ($statusLower -match 'in progress|pending') {
        return '🟡 In Progress'
    }
    return '🟡 In Progress'
}

function Ensure-SpecMetadataSynced {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$SyncDate
    )

    $changed = $false
    $lastUpdatedIndex = -1

    for ($i = 0; $i -lt $Lines.Count; $i++) {
        if ($Lines[$i] -match '^\*\s+\*\*Last Updated:\*\*\s+(.+)$') {
            $lastUpdatedIndex = $i
            break
        }
    }

    if ($lastUpdatedIndex -ge 0) {
        $newLine = "*   **Last Updated:** $SyncDate"
        if ($Lines[$lastUpdatedIndex] -ne $newLine) {
            $Lines[$lastUpdatedIndex] = $newLine
            $changed = $true
        }
    } else {
        $statusIndex = -1
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            if ($Lines[$i] -match '^\*\s+\*\*Status:\*\*\s+') {
                $statusIndex = $i
                break
            }
        }
        if ($statusIndex -ge 0) {
            $Lines.Insert($statusIndex + 1, "*   **Last Updated:** $SyncDate")
            $changed = $true
        }
    }

    return $changed
}

function Ensure-TechnicalPlanExecutionStatus {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [string]$SpecStatus,
        [string]$SyncDate
    )

    $changed = $false
    $syncLine = "**Spec Sync:** $SpecStatus (Last Sync: $SyncDate)"

    $executionHeaderIndex = -1
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        if ($Lines[$i] -match '^##\s+1\.1\s+Execution Status') {
            $executionHeaderIndex = $i
            break
        }
    }

    if ($executionHeaderIndex -ge 0) {
        $nextSectionIndex = $Lines.Count
        for ($j = $executionHeaderIndex + 1; $j -lt $Lines.Count; $j++) {
            if ($Lines[$j] -match '^##\s+') {
                $nextSectionIndex = $j
                break
            }
        }

        $syncLineIndex = -1
        for ($j = $executionHeaderIndex + 1; $j -lt $nextSectionIndex; $j++) {
            if ($Lines[$j] -match '^\*\*Spec Sync:\*\*\s+') {
                $syncLineIndex = $j
                break
            }
        }

        if ($syncLineIndex -ge 0) {
            if ($Lines[$syncLineIndex] -ne $syncLine) {
                $Lines[$syncLineIndex] = $syncLine
                $changed = $true
            }
        } else {
            $Lines.Insert($executionHeaderIndex + 1, $syncLine)
            $changed = $true
        }
    } else {
        $overviewIndex = -1
        for ($i = 0; $i -lt $Lines.Count; $i++) {
            if ($Lines[$i] -match '^##\s+1\.\s+(Overview|Technical Overview)') {
                $overviewIndex = $i
                break
            }
        }

        $insertAt = if ($overviewIndex -ge 0) { $overviewIndex + 1 } else { 1 }

        $Lines.Insert($insertAt, '')
        $Lines.Insert($insertAt + 1, '## 1.1 Execution Status')
        $Lines.Insert($insertAt + 2, $syncLine)
        $Lines.Insert($insertAt + 3, '')
        $changed = $true
    }

    return $changed
}

function Ensure-ProjectStateSynced {
    param(
        [System.Collections.Generic.List[string]]$Lines,
        [hashtable]$SpecStatusMap,
        [string]$SyncTimestamp
    )

    $changed = $false

    for ($i = 0; $i -lt $Lines.Count; $i++) {
        if ($Lines[$i] -match '^\*\s+\*\*Last Sync:\*\*\s+') {
            $newLine = "*   **Last Sync:** [SYNC: PROJECT_STATE.md] $SyncTimestamp"
            if ($Lines[$i] -ne $newLine) {
                $Lines[$i] = $newLine
                $changed = $true
            }
            break
        }
    }

    $sectionStart = -1
    $sectionEnd = $Lines.Count
    for ($i = 0; $i -lt $Lines.Count; $i++) {
        if ($Lines[$i] -match '^##\s+4\.\s+Specification Status') {
            $sectionStart = $i
            break
        }
    }

    if ($sectionStart -ge 0) {
        for ($i = $sectionStart + 1; $i -lt $Lines.Count; $i++) {
            if ($Lines[$i] -match '^##\s+') {
                $sectionEnd = $i
                break
            }
        }

        foreach ($specId in $SpecStatusMap.Keys) {
            $target = $SpecStatusMap[$specId]
            $foundIndex = -1

            for ($i = $sectionStart + 1; $i -lt $sectionEnd; $i++) {
                if ($Lines[$i] -match "^\*\s+\*\*${specId}:\*\*\s+(.+)$") {
                    $foundIndex = $i
                    break
                }
            }

            if ($foundIndex -ge 0) {
                $existing = $Lines[$foundIndex]
                $detail = ''
                if ($existing -match '^\*\s+\*\*SPEC-\d{4}:\*\*\s+[^\(]+(\(.*\))\s*$') {
                    $detail = $Matches[1]
                }

                $newLine = if ([string]::IsNullOrWhiteSpace($detail)) {
                    "*   **${specId}:** $target"
                } else {
                    "*   **${specId}:** $target $detail"
                }

                if ($Lines[$foundIndex] -ne $newLine) {
                    $Lines[$foundIndex] = $newLine
                    $changed = $true
                }
            } else {
                $Lines.Insert($sectionEnd, "*   **${specId}:** $target")
                $sectionEnd++
                $changed = $true
            }
        }
    }

    return $changed
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

$targetFiles = @()
if ($Mode -eq 'functional') {
    $targetFiles = $functionalFiles
} elseif ($Mode -eq 'technical') {
    $targetFiles = $technicalFiles
}

if ($Mode -eq 'spec-sync') {
    $projectStatePath = '.agent-workspace/docs/PROJECT_STATE.md'
    $specRoot = '.agent-workspace/docs/spec'
    $syncDate = (Get-Date).ToString('yyyy-MM-dd')
    $syncTimestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss zzz')
    $updatedFiles = [System.Collections.Generic.List[string]]::new()
    $specProjectStatuses = @{}

    Test-File -Path $projectStatePath
    Test-File -Path $specRoot

    $projectStateLines = [System.Collections.Generic.List[string]]::new()
    (Get-FileLines -Path $projectStatePath) | ForEach-Object { $projectStateLines.Add($_) | Out-Null }
    $specDirs = Get-ChildItem -Path $specRoot -Directory | Where-Object { $_.Name -match '^SPEC-\d{4}$' }

    if ($specDirs.Count -eq 0) {
        Add-Finding -Findings $findings -Path $specRoot -Line 1 -Reason 'no SPEC-XXXX directories found'
    }

    foreach ($dir in $specDirs) {
        $specId = $dir.Name
        $specFile = Join-Path $dir.FullName "$specId.md"
        $planFile = Join-Path $dir.FullName "${specId}_TechnicalPlan.md"

        if (-not (Test-Path -Path $specFile)) {
            Add-Finding -Findings $findings -Path $specFile -Line 1 -Reason 'missing specification file'
            continue
        }

        if (-not (Test-Path -Path $planFile)) {
            Add-Finding -Findings $findings -Path $planFile -Line 1 -Reason 'missing technical plan file'
            continue
        }

        $specLines = [System.Collections.Generic.List[string]]::new()
        (Get-FileLines -Path $specFile) | ForEach-Object { $specLines.Add($_) | Out-Null }

        $planLines = [System.Collections.Generic.List[string]]::new()
        (Get-FileLines -Path $planFile) | ForEach-Object { $planLines.Add($_) | Out-Null }

        $specStatusText = Get-SpecStatusText -Lines $specLines

        if ([string]::IsNullOrWhiteSpace($specStatusText)) {
            Add-Finding -Findings $findings -Path $specFile -Line 1 -Reason 'missing metadata status field'
            $specStatusText = 'In Progress'
        }

        $specChanged = Ensure-SpecMetadataSynced -Lines $specLines -SyncDate $syncDate
        if ($specChanged) {
            Write-FileLines -Path $specFile -Lines $specLines
            $updatedFiles.Add($specFile) | Out-Null
        }

        $planChanged = Ensure-TechnicalPlanExecutionStatus -Lines $planLines -SpecStatus $specStatusText -SyncDate $syncDate
        if ($planChanged) {
            Write-FileLines -Path $planFile -Lines $planLines
            $updatedFiles.Add($planFile) | Out-Null
        }

        $specProjectStatuses[$specId] = Convert-ToProjectStateStatus -SpecStatus $specStatusText

        if (-not ($specLines -match '^##\s+8\.\s+Traceability')) {
            Add-Finding -Findings $findings -Path $specFile -Line 1 -Reason 'missing traceability section'
        }

        $hasExecutionStatus = ($planLines -match '^##\s+1\.1\s+Execution Status')
        $hasOverview = ($planLines -match '^##\s+1\.\s+(Overview|Technical Overview)')
        if (-not $hasExecutionStatus -and -not $hasOverview) {
            Add-Finding -Findings $findings -Path $planFile -Line 1 -Reason 'missing technical overview/execution status section'
        }

        $projectStateSpecLineIndex = -1
        $projectStateSpecText = ''
        for ($i = 0; $i -lt $projectStateLines.Count; $i++) {
            if ($projectStateLines[$i] -match "^\*\s+\*\*${specId}:\*\*\s+(.+)$") {
                $projectStateSpecLineIndex = $i
                $projectStateSpecText = $Matches[1].Trim()
                break
            }
        }

        if ($projectStateSpecLineIndex -lt 0) {
            Add-Finding -Findings $findings -Path $projectStatePath -Line 1 -Reason "missing $specId entry in specification status section"
        } elseif ($specStatusText.Length -gt 0) {
            $specStatusLower = $specStatusText.ToLowerInvariant()
            $projectStatusLower = $projectStateSpecText.ToLowerInvariant()

            $specImplemented = $specStatusLower -match 'implemented'
            $specInProgress = $specStatusLower -match 'in progress|pending'
            $projectImplemented = $projectStatusLower -match 'implemented|✅'
            $projectInProgress = $projectStatusLower -match 'in progress|pending|🟡'

            if ($specImplemented -and -not $projectImplemented) {
                Add-Finding -Findings $findings -Path $projectStatePath -Line ($projectStateSpecLineIndex + 1) -Reason "$specId status mismatch: spec=Implemented, project_state=$projectStateSpecText"
            }

            if ($specInProgress -and -not $projectInProgress) {
                Add-Finding -Findings $findings -Path $projectStatePath -Line ($projectStateSpecLineIndex + 1) -Reason "$specId status mismatch: spec=In Progress/Pending, project_state=$projectStateSpecText"
            }
        }
    }

    $projectChanged = Ensure-ProjectStateSynced -Lines $projectStateLines -SpecStatusMap $specProjectStatuses -SyncTimestamp $syncTimestamp
    if ($projectChanged) {
        Write-FileLines -Path $projectStatePath -Lines $projectStateLines
        $updatedFiles.Add($projectStatePath) | Out-Null
    }

    if ($updatedFiles.Count -gt 0) {
        Write-Host "Applied spec-sync updates:" -ForegroundColor Yellow
        $updatedFiles | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
    }
} else {
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
}

if ($findings.Count -gt 0) {
    Write-Host "Gate validation failed ($Mode). Findings:" -ForegroundColor Red
    $findings | ForEach-Object { Write-Host " - $_" }
    exit 1
}

Write-Host "Gate validation passed ($Mode)." -ForegroundColor Green
exit 0
