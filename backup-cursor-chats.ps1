# Cursor AI Chat History Backup Script
# This script backs up Cursor's chat history to a specified location with date/time folders

param(
    [string]$BackupLocation = "C:\Users\Varun Tyagi\Desktop\Chat history",
    [switch]$CreateScheduledTask = $false
)

# Cursor data locations
$CursorAppData = "$env:APPDATA\Cursor"
$CursorLocalData = "$env:LOCALAPPDATA\Cursor"
$CursorUserData = "$env:APPDATA\Cursor\User"

# Create timestamp for folder name
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFolder = Join-Path $BackupLocation $timestamp

# Directories/files to backup
$itemsToBackup = @(
    @{
        Path = "$CursorUserData\workspaceStorage"
        Name = "workspaceStorage"
        Description = "Workspace-specific chat history"
    },
    @{
        Path = "$CursorUserData\globalStorage"
        Name = "globalStorage"
        Description = "Global chat storage"
    },
    @{
        Path = "$CursorUserData\History"
        Name = "History"
        Description = "Chat history"
    },
    @{
        Path = "$CursorUserData\settings.json"
        Name = "settings.json"
        Description = "Cursor settings"
    },
    @{
        Path = "$CursorLocalData"
        Name = "LocalAppData"
        Description = "Local application data"
    }
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cursor AI Chat History Backup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create backup folder
try {
    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
    Write-Host "[OK] Created backup folder: $backupFolder" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create backup folder: $_" -ForegroundColor Red
    exit 1
}

$backupLog = @()
$backupLog += "Backup started at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$backupLog += "Backup location: $backupFolder"
$backupLog += ""

$totalSize = 0
$itemsBackedUp = 0
$itemsSkipped = 0

# Backup each item
foreach ($item in $itemsToBackup) {
    $sourcePath = $item.Path
    $itemName = $item.Name
    $description = $item.Description
    
    Write-Host "Processing: $description..." -ForegroundColor Yellow
    
    if (Test-Path $sourcePath) {
        try {
            $destinationPath = Join-Path $backupFolder $itemName
            
            # Get size before copy
            $size = (Get-ChildItem -Path $sourcePath -Recurse -ErrorAction SilentlyContinue | 
                Measure-Object -Property Length -Sum).Sum
            
            if ($size -gt 0) {
                # Copy directory or file
                if (Test-Path $sourcePath -PathType Container) {
                    Copy-Item -Path $sourcePath -Destination $destinationPath -Recurse -Force -ErrorAction Stop
                } else {
                    $destDir = Split-Path $destinationPath -Parent
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                    Copy-Item -Path $sourcePath -Destination $destinationPath -Force -ErrorAction Stop
                }
                
                $sizeMB = [math]::Round($size / 1MB, 2)
                $totalSize += $size
                $itemsBackedUp++
                
                Write-Host "  [OK] Backed up: $itemName ($sizeMB MB)" -ForegroundColor Green
                $backupLog += "[OK] ${itemName}: ${sizeMB} MB"
            } else {
                Write-Host "  [SKIP] Skipped (empty): $itemName" -ForegroundColor Gray
                $itemsSkipped++
                $backupLog += "[SKIP] ${itemName}: Empty or not accessible"
            }
        } catch {
            Write-Host "  [ERROR] Failed to backup $itemName : $_" -ForegroundColor Red
            $backupLog += "[ERROR] ${itemName}: Failed - $_"
            $itemsSkipped++
        }
    } else {
        Write-Host "  [SKIP] Not found: $itemName" -ForegroundColor Gray
        $backupLog += "[SKIP] ${itemName}: Not found"
        $itemsSkipped++
    }
}

# Create metadata file
$metadata = @{
    BackupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    BackupLocation = $backupFolder
    ItemsBackedUp = $itemsBackedUp
    ItemsSkipped = $itemsSkipped
    TotalSizeMB = [math]::Round($totalSize / 1MB, 2)
    CursorVersion = "Unknown"
    SystemInfo = @{
        ComputerName = $env:COMPUTERNAME
        Username = $env:USERNAME
        OS = (Get-CimInstance Win32_OperatingSystem).Caption
    }
}

$metadataPath = Join-Path $backupFolder "backup-metadata.json"
$metadata | ConvertTo-Json -Depth 10 | Set-Content -Path $metadataPath -Encoding UTF8

# Save backup log
$logPath = Join-Path $backupFolder "backup-log.txt"
$backupLog | Out-File -FilePath $logPath -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Items backed up: $itemsBackedUp" -ForegroundColor Green
Write-Host "Items skipped: $itemsSkipped" -ForegroundColor Yellow
Write-Host "Total size: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host "Backup location: $backupFolder" -ForegroundColor Cyan
Write-Host ""
Write-Host "[SUCCESS] Backup completed successfully!" -ForegroundColor Green
Write-Host ""

# Optionally create scheduled task
if ($CreateScheduledTask) {
    Write-Host "Creating scheduled task for automatic backups..." -ForegroundColor Yellow
    $scriptPath = Join-Path $PSScriptRoot "backup-cursor-chats.ps1"
    $taskName = "CursorChatHistoryBackup"
    
    try {
        # Remove existing task if it exists
        $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        if ($existingTask) {
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        }
        
        # Create new scheduled task (runs daily at 2 AM)
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
        $trigger = New-ScheduledTaskTrigger -Daily -At 2am
        $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
        
        Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Automatically backup Cursor AI chat history" | Out-Null
        
        Write-Host "[OK] Scheduled task created successfully!" -ForegroundColor Green
        Write-Host "  Task will run daily at 2:00 AM" -ForegroundColor Cyan
    } catch {
        Write-Host "[ERROR] Failed to create scheduled task: $_" -ForegroundColor Red
    }
}
