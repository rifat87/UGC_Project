# Kill any running Anvil instances
Get-Process anvil -ErrorAction SilentlyContinue | Stop-Process -Force

# Check if state file exists
$stateFile = ".\anvil-state.json"
if (Test-Path $stateFile) {
    Write-Host "Loading existing Anvil state..."
    Start-Process -FilePath "anvil" -ArgumentList "--load-state $stateFile" -NoNewWindow
} else {
    Write-Host "Starting fresh Anvil instance..."
    Start-Process -FilePath "anvil" -ArgumentList "--dump-state $stateFile" -NoNewWindow
}

# Wait for Anvil to start
Start-Sleep -Seconds 2

# Set environment variables for deployment
$env:DEPLOYER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Deploy the contract only if we're starting fresh
if (-not (Test-Path $stateFile)) {
    Write-Host "Deploying contract..."
    forge script script/LocalDeployVoting.s.sol:LocalDeployVoting --rpc-url http://localhost:8545 --broadcast
}

# Keep the script running
Wait-Process -Name "anvil" 