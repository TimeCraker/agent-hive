# 太木控制台 · 波次日志归档
# 用法: .\app\archive.ps1 -Wave wave5        （归档单波）
#       .\app\archive.ps1 -All              （归档所有已终态且无活跃任务的波）
# 行为: runs/logs/<wave>/ → runs/archive/<wave>-logs.zip（无损，可解压回看），原目录删除
# 守卫: 波内存在 running / queued / pending 任务时拒绝归档（活跃波不碰）
param(
  [string]$Wave = '',
  [switch]$All,
  [string]$RepoRoot = (Split-Path (Split-Path $PSScriptRoot) )
)
$ErrorActionPreference = 'Stop'
$WAVE_RE = '^[\w-]+$'
if (-not $All -and $Wave -eq '') { Write-Error '指定 -Wave <name> 或 -All'; exit 1 }

$logsRoot = Join-Path $RepoRoot 'runs\logs'
$archRoot = Join-Path $RepoRoot 'runs\archive'
New-Item -ItemType Directory -Force $archRoot | Out-Null

$waves = if ($All) {
  Get-ChildItem $logsRoot -Directory | Select-Object -ExpandProperty Name
} else {
  if ($Wave -notmatch $WAVE_RE) { Write-Error "非法 wave 名: $Wave"; exit 1 }
  @($Wave)
}

$archived = 0; $skipped = 0
foreach ($w in $waves) {
  $logDir = Join-Path $logsRoot $w
  if (-not (Test-Path $logDir)) { Write-Host "跳过 $w（无日志目录）"; $skipped++; continue }
  $batchFile = Join-Path $RepoRoot "batches\$w\batch.json"
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
  $zip = Join-Path $archRoot "$w-logs.zip"
  if (Test-Path $zip) { Remove-Item $zip -Force }
  $before = (Get-ChildItem $logDir -Recurse -File | Measure-Object Length -Sum).Sum
  Compress-Archive -Path (Join-Path $logDir '*') -DestinationPath $zip -CompressionLevel Optimal
  Remove-Item $logDir -Recurse -Force
  $after = (Get-Item $zip).Length
  Write-Host ("已归档 {0}: {1:N1}MB → {2:N1}MB (zip)" -f $w, ($before/1MB), ($after/1MB)) -ForegroundColor Green
  $archived++
}
Write-Host "完成: 归档 $archived 波 · 跳过 $skipped 波"
