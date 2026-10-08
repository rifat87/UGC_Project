# Kill any running Anvil instances
Get-Process anvil -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove state file if it exists
$stateFile = ".\anvil-state.json"
if (Test-Path $stateFile) {
    Remove-Item $stateFile
    Write-Host "Removed existing Anvil state file"
}

Write-Host "Local chain state has been cleaned up" 