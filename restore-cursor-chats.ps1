# Cursor AI Chat History Restore Script
# This script restores Cursor's chat history from a backup folder

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFolder,
    [switch]$Preview = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cursor AI Chat History Restore" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate backup folder
if (-not (Test-Path $BackupFolder)) {
    Write-Host "[ERROR] Error: Backup folder not found: $BackupFolder" -ForegroundColor Red
    exit 1
}

# Check for metadata file
$metadataPath = Join-Path $BackupFolder "backup-metadata.json"
if (Test-Path $metadataPath) {
    try {
        $metadata = Get-Content $metadataPath | ConvertFrom-Json
        Write-Host "Backup Information:" -ForegroundColor Yellow
        Write-Host "  Date: $($metadata.BackupDate)" -ForegroundColor White
        Write-Host "  Items: $($metadata.ItemsBackedUp)" -ForegroundColor White
        Write-Host "  Size: $($metadata.TotalSizeMB) MB" -ForegroundColor White
        Write-Host ""
    } catch {
        Write-Host "  Warning: Could not read metadata file" -ForegroundColor Yellow
    }
}

# Cursor data locations
$CursorUserData = "$env:APPDATA\Cursor\User"
$CursorLocalData = "$env:LOCALAPPDATA\Cursor"

# Restore mapping
$restoreItems = @(
    @{
        BackupName = "workspaceStorage"
        TargetPath = "$CursorUserData\workspaceStorage"
        Description = "Workspace storage"
    },
    @{
        BackupName = "globalStorage"
        TargetPath = "$CursorUserData\globalStorage"
        Description = "Global storage"
    },
    @{
        BackupName = "History"
        TargetPath = "$CursorUserData\History"
        Description = "Chat history"
    },
    @{
        BackupName = "settings.json"
        TargetPath = "$CursorUserData\settings.json"
        Description = "Settings"
    },
    @{
        BackupName = "LocalAppData"
        TargetPath = "$CursorLocalData"
        Description = "Local app data"
    }
)

Write-Host "Restore Preview:" -ForegroundColor Yellow
Write-Host "  Source: $BackupFolder" -ForegroundColor White
Write-Host ""

$restoreSummary = @()

foreach ($item in $restoreItems) {
    $backupPath = Join-Path $BackupFolder $item.BackupName
    $targetPath = $item.TargetPath
    $description = $item.Description
    
    if (Test-Path $backupPath) {
        # Check if target exists and create backup
        $targetExists = Test-Path $targetPath
        
        if ($Preview) {
            Write-Host "  [PREVIEW] Would restore: $description" -ForegroundColor Cyan
            if ($targetExists) {
                Write-Host "    ⚠ Target exists - would backup first to: $targetPath.backup" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Restoring: $description..." -ForegroundColor Yellow
            
            # Backup existing target if it exists
            if ($targetExists) {
                $backupTarget = "$targetPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
                try {
                    if (Test-Path $targetPath -PathType Container) {
                        Copy-Item -Path $targetPath -Destination $backupTarget -Recurse -Force
                    } else {
                        $backupDir = Split-Path $backupTarget -Parent
                        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
                        Copy-Item -Path $targetPath -Destination $backupTarget -Force
                    }
                    Write-Host "  [OK] Backed up existing to: $backupTarget" -ForegroundColor Green
                } catch {
                    Write-Host "  ⚠ Warning: Could not backup existing: $_" -ForegroundColor Yellow
                }
            }
            
            # Restore
            try {
                $targetDir = Split-Path $targetPath -Parent
                if (-not (Test-Path $targetDir)) {
                    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                }
                
                if (Test-Path $backupPath -PathType Container) {
                    # Remove existing target if it's a directory
                    if (Test-Path $targetPath -PathType Container) {
                        Remove-Item -Path $targetPath -Recurse -Force
                    }
                    Copy-Item -Path $backupPath -Destination $targetPath -Recurse -Force
                } else {
                    Copy-Item -Path $backupPath -Destination $targetPath -Force
                }
                
                Write-Host "  [OK] Restored successfully" -ForegroundColor Green
                $restoreSummary += "[OK] $description"
            } catch {
                Write-Host "  [ERROR] Failed to restore: $_" -ForegroundColor Red
                $restoreSummary += "[ERROR] $description : $_"
            }
        }
    } else {
        Write-Host "  [SKIP] Not found in backup: $description" -ForegroundColor Gray
        $restoreSummary += "[SKIP] $description : Not in backup"
    }
}

if ($Preview) {
    Write-Host ""
    Write-Host "This is a preview. Run without -Preview to perform actual restore." -ForegroundColor Yellow
    Write-Host "Example: .\restore-cursor-chats.ps1 -BackupFolder `"$BackupFolder`"" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Restore Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    $restoreSummary | ForEach-Object { Write-Host $_ }
    Write-Host ""
    Write-Host "[OK] Restore completed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠ IMPORTANT: You may need to restart Cursor for changes to take effect." -ForegroundColor Yellow
}

