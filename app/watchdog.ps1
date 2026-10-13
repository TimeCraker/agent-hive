# 太木控制台看门狗：确保 127.0.0.1:17878 始终有太木服务在岗（多会话共享同一服务实例）
# 用法（分离运行，随系统常驻）：
#   Start-Process pwsh -ArgumentList '-NoProfile','-File',(Join-Path $PSScriptRoot 'watchdog.ps1') -WindowStyle Hidden
param([string]$RepoRoot = (Split-Path (Split-Path $PSScriptRoot)))
while ($true) {
  try {
    $listen = Get-NetTCPConnection -LocalPort 17878 -State Listen -ErrorAction SilentlyContinue
    if (-not $listen) {
      $env:PORT = '17878'
      Start-Process -FilePath 'node' -ArgumentList 'app/server.mjs' -WorkingDirectory $RepoRoot -WindowStyle Hidden
    }
  } catch { /* 静默重试 */ }
  Start-Sleep -Seconds 10
}
