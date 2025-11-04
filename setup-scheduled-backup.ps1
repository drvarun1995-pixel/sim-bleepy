# Setup Scheduled Backup for Cursor Chat History
# This script must be run as Administrator
# Right-click and select "Run with PowerShell" as Administrator

#Requires -RunAsAdministrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cursor Chat History - Scheduled Backup Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$taskName = "CursorChatHistoryBackup"
$scriptPath = Join-Path $PSScriptRoot "backup-cursor-chats.ps1"

# Check if script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "[ERROR] Backup script not found at: $scriptPath" -ForegroundColor Red
    Write-Host "Please make sure backup-cursor-chats.ps1 is in the same folder." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Script location: $scriptPath" -ForegroundColor White
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "[INFO] Scheduled task already exists. Updating..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

try {
    # Create the scheduled task action
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
    
    # Create daily trigger at 2:00 AM
    $trigger = New-ScheduledTaskTrigger -Daily -At 2am
    
    # Set up principal (run as current user with highest privileges)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Highest
    
    # Configure settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun
    
    # Register the scheduled task
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Automatically backup Cursor AI chat history daily at 2:00 AM" | Out-Null
    
    Write-Host "[SUCCESS] Scheduled task created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  Name: $taskName" -ForegroundColor White
    Write-Host "  Schedule: Daily at 2:00 AM" -ForegroundColor White
    Write-Host "  Script: $scriptPath" -ForegroundColor White
    Write-Host ""
    
    # Display next run time
    $task = Get-ScheduledTask -TaskName $taskName
    $info = $task | Get-ScheduledTaskInfo
    if ($info.NextRunTime) {
        Write-Host "Next scheduled run: $($info.NextRunTime)" -ForegroundColor Green
    } else {
        Write-Host "Task is ready to run at 2:00 AM daily" -ForegroundColor Green
    }
    Write-Host ""
    Write-Host "You can view or modify this task in:" -ForegroundColor Cyan
    Write-Host "  Task Scheduler > Task Scheduler Library > $taskName" -ForegroundColor White
    Write-Host ""
    Write-Host "To test the backup immediately, run:" -ForegroundColor Cyan
    Write-Host "  .\backup-cursor-chats.ps1" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Failed to create scheduled task: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure you are running this script as Administrator:" -ForegroundColor Yellow
    Write-Host "  1. Right-click on this script file" -ForegroundColor White
    Write-Host "  2. Select 'Run with PowerShell'" -ForegroundColor White
    Write-Host "  3. Or open PowerShell as Administrator and run this script" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"

