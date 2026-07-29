$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

$secureToken = $null
$tokenPointer = [IntPtr]::Zero

try {
  Write-Host ""
  Write-Host "LungLens rich-menu installer" -ForegroundColor Cyan
  Write-Host "Paste the NEW long-lived LINE channel access token."
  Write-Host "The token is hidden, used only by this process, and cleared immediately."
  Write-Host ""

  $secureToken = Read-Host "Channel access token" -AsSecureString
  $tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
  $env:LINE_CHANNEL_ACCESS_TOKEN =
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)

  node setup-richmenu.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "The rich-menu installer exited with code $LASTEXITCODE."
  }

  Write-Host ""
  Write-Host "The updated six-button rich menu is installed." -ForegroundColor Green
} catch {
  Write-Host ""
  Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "No token was written to a file."
} finally {
  Remove-Item Env:LINE_CHANNEL_ACCESS_TOKEN -ErrorAction SilentlyContinue
  if ($tokenPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
  }
  if ($secureToken) {
    $secureToken.Dispose()
  }
  Write-Host ""
  Read-Host "Press Enter to close"
}
