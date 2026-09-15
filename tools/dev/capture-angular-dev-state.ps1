<#
.SYNOPSIS
Captures read-only diagnostic evidence for an intermittent Angular/Vite cache incident.

.DESCRIPTION
This is a one-shot snapshot. It does not terminate processes, close handles,
write files, modify cache content, rename paths, restart the dev server, or
change environment/configuration state. Redirect standard output externally if
an incident log file is required.
#>
[CmdletBinding()]
param(
	[switch]$IncludeHandleReport
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

function Protect-SensitiveText {
	param(
		[AllowNull()]
		[string]$Text
	)

	if ([string]::IsNullOrWhiteSpace($Text)) {
		return $Text
	}

	$redactedText = $Text
	$redactedText = $redactedText -replace '(?i)(--?(?:token|password|passwd|secret|api[-_]?key|access[-_]?token|authorization)\s*(?:=|:|\s+))("[^"]*"|\S+)', '$1<redacted>'
	return $redactedText -replace '(?i)((?:bearer|basic)\s+)\S+', '$1<redacted>'
}

function Write-SnapshotSection {
	param(
		[Parameter(Mandatory)]
		[string]$Title
	)

	Write-Output "`n=== $Title ==="
}

function Get-ProcessRecord {
	param(
		[Parameter(Mandatory)]
		[object]$Process
	)

	[pscustomobject]@{
		ProcessId       = $Process.ProcessId
		ParentProcessId = $Process.ParentProcessId
		Name            = $Process.Name
		CreationDate    = $Process.CreationDate
		CommandLine     = Protect-SensitiveText -Text $Process.CommandLine
	}
}

function Get-RelatedProcessIds {
	param(
		[Parameter(Mandatory)]
		[object[]]$Processes,
		[Parameter(Mandatory)]
		[int[]]$WorkspaceProcessIds
	)

	$processesById = @{}
	foreach ($process in $Processes) {
		$processesById[[int]$process.ProcessId] = $process
	}

	$relatedProcessIds = [System.Collections.Generic.HashSet[int]]::new()
	$childProcessIds = [System.Collections.Generic.Queue[int]]::new()
	$launchProcessNames = @('node.exe', 'npm.exe', 'npm.cmd', 'npx.exe', 'npx.cmd', 'ng.exe', 'nx.exe', 'vite.exe', 'esbuild.exe', 'cmd.exe', 'pwsh.exe', 'powershell.exe', 'conhost.exe')
	foreach ($processId in $WorkspaceProcessIds) {
		if ($relatedProcessIds.Add($processId)) {
			$childProcessIds.Enqueue($processId)
		}
	}

	foreach ($workspaceProcessId in $WorkspaceProcessIds) {
		$currentProcessId = $workspaceProcessId
		while ($processesById.ContainsKey($currentProcessId)) {
			$parentProcessId = [int]$processesById[$currentProcessId].ParentProcessId
			if (-not $processesById.ContainsKey($parentProcessId) -or $launchProcessNames -notcontains $processesById[$parentProcessId].Name) {
				break
			}

			if (-not $relatedProcessIds.Add($parentProcessId)) {
				break
			}

			$currentProcessId = $parentProcessId
		}
	}

	while ($childProcessIds.Count -gt 0) {
		$currentProcessId = $childProcessIds.Dequeue()
		$currentProcess = $processesById[$currentProcessId]

		foreach ($childProcess in $Processes) {
			if ([int]$childProcess.ParentProcessId -eq $currentProcessId -and $relatedProcessIds.Add([int]$childProcess.ProcessId)) {
				$childProcessIds.Enqueue([int]$childProcess.ProcessId)
			}
		}
	}

	return ,$relatedProcessIds
}

function Get-DiagnosticToolPath {
	param(
		[Parameter(Mandatory)]
		[string]$ToolName
	)

	$command = Get-Command $ToolName -ErrorAction SilentlyContinue | Select-Object -First 1
	if ($null -ne $command) {
		return $command.Source
	}

	$searchRoots = @(
		'C:\Sysinternals',
		'C:\Tools',
		(Join-Path $env:ProgramFiles 'Sysinternals')
	)

	foreach ($searchRoot in $searchRoots) {
		$candidatePath = Join-Path $searchRoot $ToolName
		if (Test-Path -LiteralPath $candidatePath -PathType Leaf) {
			return $candidatePath
		}
	}

	return $null
}

function Get-DirectoryFileCount {
	param(
		[Parameter(Mandatory)]
		[string]$Path
	)

	if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
		return 0
	}

	return @(Get-ChildItem -LiteralPath $Path -File -Recurse -Force -ErrorAction SilentlyContinue).Count
}

function Write-ViteCacheState {
	param(
		[Parameter(Mandatory)]
		[string]$CacheRoot
	)

	if (-not (Test-Path -LiteralPath $CacheRoot -PathType Container)) {
		Write-Output "Angular cache directory is absent: $CacheRoot"
		return
	}

	Write-Output "Angular cache directory: $CacheRoot"
	$viteDirectories = @(Get-ChildItem -LiteralPath $CacheRoot -Directory -Recurse -Force -ErrorAction SilentlyContinue |
		Where-Object { $_.Name -eq 'vite' })

	if ($viteDirectories.Count -eq 0) {
		Write-Output 'No Vite cache directory was found beneath the Angular cache directory.'
		return
	}

	foreach ($viteDirectory in $viteDirectories) {
		$cacheDirectories = @(Get-ChildItem -LiteralPath $viteDirectory.FullName -Directory -Force -ErrorAction SilentlyContinue |
			Where-Object { $_.Name -eq 'deps' -or $_.Name -like 'deps_temp_*' } |
			Sort-Object Name)

		[pscustomobject]@{
			ViteCachePath  = $viteDirectory.FullName
			Directory      = $viteDirectory.Name
			Exists         = $true
			CreationTime   = $viteDirectory.CreationTime
			LastWriteTime  = $viteDirectory.LastWriteTime
			SelectedCounts = $cacheDirectories.Count
		} | Format-List

		if ($cacheDirectories.Count -eq 0) {
			Write-Output 'No deps or deps_temp_* directory is currently present.'
			continue
		}

		$cacheDirectories |
			ForEach-Object {
				[pscustomobject]@{
					Path          = $_.FullName
					Name          = $_.Name
					CreationTime  = $_.CreationTime
					LastWriteTime = $_.LastWriteTime
					FileCount     = Get-DirectoryFileCount -Path $_.FullName
				}
			} |
			Format-List
	}
}

$workspacePath = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$angularCachePath = Join-Path $workspacePath '.angular\cache'
$processes = @(Get-CimInstance Win32_Process)
$workspaceProcesses = @($processes | Where-Object { $_.CommandLine -like "*$workspacePath*" })
$relatedProcessIds = Get-RelatedProcessIds -Processes $processes -WorkspaceProcessIds @($workspaceProcesses.ProcessId)
$relatedProcesses = @($processes | Where-Object { $relatedProcessIds.Contains([int]$_.ProcessId) })

Write-SnapshotSection -Title 'Snapshot metadata'
[pscustomobject]@{
	TimestampUtc = (Get-Date).ToUniversalTime().ToString('o')
	Workspace    = $workspacePath
	Script       = $PSCommandPath
} | Format-List

Write-SnapshotSection -Title 'Git and worktree identity'
[pscustomobject]@{
	RepositoryRoot = (& git -C $workspacePath rev-parse --show-toplevel 2>$null).Trim()
	Branch         = (& git -C $workspacePath branch --show-current 2>$null).Trim()
	Commit          = (& git -C $workspacePath rev-parse HEAD 2>$null).Trim()
	WorktreePath    = $workspacePath
} | Format-List

Write-SnapshotSection -Title 'Workspace process tree'
if ($relatedProcesses.Count -eq 0) {
	Write-Output 'No process command line currently references this workspace.'
}
else {
	$relatedProcesses |
		Sort-Object ProcessId |
		ForEach-Object { Get-ProcessRecord -Process $_ } |
		Format-List
}

Write-SnapshotSection -Title 'Angular dev-server port ownership'
$listeningConnections = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue)
$portRecords = @($listeningConnections | Where-Object {
	$_.LocalPort -eq 4200 -or $relatedProcessIds.Contains([int]$_.OwningProcess)
} | ForEach-Object {
	$connection = $_
	$owningProcessId = [int]$connection.OwningProcess
	$owner = $processes | Where-Object { [int]$_.ProcessId -eq $owningProcessId } | Select-Object -First 1
	[pscustomobject]@{
		LocalAddress = $connection.LocalAddress
		LocalPort    = $connection.LocalPort
		OwningProcess = $owningProcessId
		ProcessName  = $owner.Name
		ParentProcessId = $owner.ParentProcessId
		CommandLine  = Protect-SensitiveText -Text $owner.CommandLine
	}
})

if ($portRecords.Count -eq 0) {
	Write-Output 'No listener on port 4200 or a workspace-related process was detected.'
}
else {
	$portRecords | Sort-Object LocalPort, OwningProcess | Format-Table -AutoSize
}

Write-SnapshotSection -Title 'Angular Vite cache metadata'
Write-ViteCacheState -CacheRoot $angularCachePath

Write-SnapshotSection -Title 'Diagnostic tool availability'
$toolNames = @('Get-Process', 'Get-CimInstance', 'Get-NetTCPConnection', 'netstat.exe', 'tasklist.exe', 'openfiles.exe', 'resmon.exe', 'procexp.exe', 'handle.exe', 'procmon.exe')
$toolNames |
	ForEach-Object {
		$toolName = $_
		$toolPath = Get-DiagnosticToolPath -ToolName $toolName
		[pscustomobject]@{
			Tool      = $toolName
			Available = $null -ne $toolPath
			Source    = $toolPath
		}
	} |
	Format-Table -AutoSize

$handlePath = Get-DiagnosticToolPath -ToolName 'handle.exe'
if ($null -eq $handlePath) {
	Write-Output 'handle.exe unavailable; continuing without handle data.'
}

if ($IncludeHandleReport) {
	Write-SnapshotSection -Title 'Optional Sysinternals handle report'
	if ($null -eq $handlePath) {
		Write-Output 'No handle query was run because handle.exe is unavailable.'
	}
	else {
		foreach ($path in @(Get-ChildItem -LiteralPath $angularCachePath -Directory -Recurse -Force -ErrorAction SilentlyContinue |
			Where-Object { $_.Name -eq 'vite' } |
			ForEach-Object { @((Join-Path $_.FullName 'deps'), $_.FullName) })) {
			if (Test-Path -LiteralPath $path) {
				Write-Output "Querying handles for: $path"
				& $handlePath -nobanner $path
			}
		}
	}
}
else {
	Write-Output "`nOptional handle capture was not requested. Run with -IncludeHandleReport only when handle.exe is already installed."
}
