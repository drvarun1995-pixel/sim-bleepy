# Cursor AI Chat History Backup & Restore

This automation system backs up your Cursor AI chat history to prevent data loss during updates.

## 📁 Backup Location

All backups are stored in:
```
C:\Users\Varun Tyagi\Desktop\Chat history\
```

Each backup creates a new folder with the format:
```
yyyy-MM-dd_HH-mm-ss
```
Example: `2025-01-15_14-30-45`

## 🚀 Quick Start

### Manual Backup

1. **Run the backup script:**
   ```powershell
   .\backup-cursor-chats.ps1
   ```

2. The script will:
   - Create a timestamped backup folder
   - Copy all Cursor chat history files
   - Save metadata and backup log
   - Display a summary

### Automatic Backup (Recommended)

To set up daily automatic backups at 2:00 AM:

```powershell
.\backup-cursor-chats.ps1 -CreateScheduledTask
```

This creates a Windows Scheduled Task that runs automatically every day.

### Restore from Backup

1. **Preview what will be restored:**
   ```powershell
   .\restore-cursor-chats.ps1 -BackupFolder "C:\Users\Varun Tyagi\Desktop\Chat history\2025-01-15_14-30-45" -Preview
   ```

2. **Perform the restore:**
   ```powershell
   .\restore-cursor-chats.ps1 -BackupFolder "C:\Users\Varun Tyagi\Desktop\Chat history\2025-01-15_14-30-45"
   ```

   ⚠️ **Note:** The restore script will:
   - Backup existing files before restoring (with timestamp)
   - Restore all chat history from the selected backup
   - You'll need to restart Cursor after restore

## 📂 What Gets Backed Up

- **workspaceStorage** - Workspace-specific chat history
- **globalStorage** - Global chat storage
- **History** - Chat history files
- **settings.json** - Cursor settings
- **LocalAppData** - Local application data

## 📋 Backup Folder Contents

Each backup folder contains:
- `workspaceStorage/` - Workspace chat data
- `globalStorage/` - Global chat data
- `History/` - Chat history
- `settings.json` - Settings file
- `LocalAppData/` - Local app data
- `backup-metadata.json` - Backup information and metadata
- `backup-log.txt` - Detailed backup log

## 🔄 Managing Backups

### List Available Backups

```powershell
Get-ChildItem "C:\Users\Varun Tyagi\Desktop\Chat history" -Directory | Sort-Object Name -Descending
```

### Delete Old Backups

To keep only the last 10 backups:

```powershell
$backupPath = "C:\Users\Varun Tyagi\Desktop\Chat history"
$backups = Get-ChildItem $backupPath -Directory | Sort-Object Name -Descending
$backups | Select-Object -Skip 10 | Remove-Item -Recurse -Force
```

## ⚙️ Advanced Usage

### Custom Backup Location

```powershell
.\backup-cursor-chats.ps1 -BackupLocation "D:\MyBackups\Cursor"
```

### Check Backup Status

View the metadata of any backup:

```powershell
$backupFolder = "C:\Users\Varun Tyagi\Desktop\Chat history\2025-01-15_14-30-45"
Get-Content "$backupFolder\backup-metadata.json" | ConvertFrom-Json
```

## 🛡️ Safety Features

- **Automatic backups** - Existing files are backed up before restore
- **Metadata tracking** - Each backup includes detailed information
- **Log files** - Complete backup/restore logs for troubleshooting
- **Preview mode** - Test restore without making changes

## ❓ Troubleshooting

### Script Won't Run

If you get an execution policy error:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Can't Find Chat History

The scripts look in these locations:
- `%APPDATA%\Cursor\User\`
- `%LOCALAPPDATA%\Cursor\`

If Cursor stores data elsewhere, you may need to modify the script paths.

### Restore Didn't Work

1. Make sure Cursor is closed before restoring
2. Check that the backup folder exists and contains files
3. Review the restore log in the backup folder
4. Try running as Administrator if permission errors occur

## 📝 Notes

- Backups are incremental - each backup is independent
- Old backups are not automatically deleted (you can clean them up manually)
- The scheduled task runs silently in the background
- Always verify backups before deleting old ones

## 🔐 Security

All backups are stored locally on your machine. No data is sent to external servers.

For additional security, you can:
- Encrypt the backup folder
- Sync to a secure cloud location (OneDrive, etc.)
- Set up additional scheduled tasks for multiple backup locations

