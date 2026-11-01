# 太木控制台 · 波次归档工具
# 用法: .\app\archive.ps1 -Wave template         （归档指定波次的日志）
#       .\app\archive.ps1 -Wave template -Retire （将已完结的整个波次打包移至 archive/ 并从 waves/ 移除）
#       .\app\archive.ps1 -All                   （对所有已完结波次归档日志）
# 守卫: 波内存在 running / queued / pending 任务时拒绝归档（活跃波不碰）
param(
  [string]$Wave = '',
  [switch]$Retire,
  [switch]$All,
  [string]$RepoRoot = (Split-Path $PSScriptRoot)   # 脚本在 app/ 下，剥一层即仓根
)
$ErrorActionPreference = 'Stop'
$WAVE_RE = '^[\w-]+$'
if (-not $All -and $Wave -eq '') { Write-Error '请指定 -Wave <name> 或 -All'; exit 1 }

$wavesRoot = Join-Path $RepoRoot 'waves'
$archRoot  = Join-Path $RepoRoot 'archive'
New-Item -ItemType Directory -Force $archRoot | Out-Null

$waves = if ($All) {
  if (Test-Path $wavesRoot) {
    Get-ChildItem $wavesRoot -Directory | Select-Object -ExpandProperty Name
  } else { @() }
} else {
  if ($Wave -notmatch $WAVE_RE) { Write-Error "非法 wave 名: $Wave"; exit 1 }
  @($Wave)
}

$processed = 0; $skipped = 0
foreach ($w in $waves) {
  $targetWaveDir = Join-Path $wavesRoot $w
  if (-not (Test-Path $targetWaveDir)) { Write-Host "跳过 $w（波次目录不存在）"; $skipped++; continue }

  $batchFile = Join-Path $targetWaveDir 'batch.json'
  if (Test-Path $batchFile) {
    try {
      $batch = Get-Content $batchFile -Raw | ConvertFrom-Json
      $active = @($batch.tasks | Where-Object { $_.status -in 'running','queued','pending' })
      if ($active.Count -gt 0) {
        Write-Host "拒绝 $w（仍有 $($active.Count) 个活跃任务: $(($active | ForEach-Object code) -join ' ')）" -ForegroundColor Yellow
        $skipped++; continue
      }
    } catch { Write-Host "拒绝 $w（batch.json 读取失败）"; $skipped++; continue }
  }

  if ($Retire) {
    # 整波归档：打包整个 waves/<wave>/ 到 archive/<wave>.zip 并移除原目录
    $zip = Join-Path $archRoot "$w.zip"
    if (Test-Path $zip) { Remove-Item $zip -Force }
    Compress-Archive -Path (Join-Path $targetWaveDir '*') -DestinationPath $zip -CompressionLevel Optimal
    Remove-Item $targetWaveDir -Recurse -Force
    Write-Host ("已整波退休归档 {0} → archive/{0}.zip" -f $w) -ForegroundColor Green
    $processed++
  } else {
    # 日志归档：仅压缩 waves/<wave>/logs/ 到 archive/<wave>-logs.zip 并清空日志文件
    $logDir = Join-Path $targetWaveDir 'logs'
    if (Test-Path $logDir) {
      $files = Get-ChildItem $logDir -File
      if ($files.Count -gt 0) {
        $zip = Join-Path $archRoot "$w-logs.zip"
        if (Test-Path $zip) { Remove-Item $zip -Force }
        $before = ($files | Measure-Object Length -Sum).Sum
        Compress-Archive -Path (Join-Path $logDir '*') -DestinationPath $zip -CompressionLevel Optimal
        Remove-Item (Join-Path $logDir '*') -Force
        $after = (Get-Item $zip).Length
        Write-Host ("已归档日志 {0}: {1:N1}MB → {2:N1}MB (zip)" -f $w, ($before/1MB), ($after/1MB)) -ForegroundColor Green
        $processed++
      } else {
        Write-Host "$w 无待压缩日志文件"
        $skipped++
      }
    } else {
      Write-Host "跳过 $w（无日志目录）"
      $skipped++
    }
  }
}
Write-Host "完成: 处理 $processed 波 · 跳过 $skipped 波"
