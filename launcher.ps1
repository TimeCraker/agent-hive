# agent-console 派发器：env 注入 + stream-json 实时落盘 + 启动 claude 无头会话
param(
  [Parameter(Mandatory=$true)][string]$Code,
  [Parameter(Mandatory=$true)][string]$Cwd,
  [Parameter(Mandatory=$true)][ValidateSet('glm53','flash')][string]$ModelProfile,
  [Parameter(Mandatory=$true)][string]$PromptFile,
  [Parameter(Mandatory=$true)][string]$LogPath
)
$ErrorActionPreference = 'Stop'

$key = (Get-Content "$env:USERPROFILE\.claude\zhipu.env" | Where-Object { $_ -match '^\s*ZHIPU_API_KEY\s*=' }) -replace '^\s*ZHIPU_API_KEY\s*=\s*',''
$key = $key.Trim().Trim('"').Trim("'")
if (-not $key) { throw 'ZHIPU_API_KEY not found in zhipu.env' }

$env:ANTHROPIC_BASE_URL = 'https://open.bigmodel.cn/api/anthropic'
$env:ANTHROPIC_AUTH_TOKEN = $key
$env:ANTHROPIC_SMALL_FAST_MODEL = 'glm-5.3-flash[1m]'
$main = if ($ModelProfile -eq 'flash') { 'glm-5.3-flash[1m]' } else { 'glm-5.3[1m]' }
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL   = 'glm-5.3-flash[1m]'
$env:ANTHROPIC_DEFAULT_SONNET_MODEL  = $main
$env:ANTHROPIC_DEFAULT_OPUS_MODEL    = $main
$env:ANTHROPIC_DEFAULT_FABLE_MODEL   = $main
$env:CLAUDE_CODE_AUTO_COMPACT_WINDOW = '1000000'
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1'
$env:API_TIMEOUT_MS = '600000'
$env:CLAUDE_CODE_EFFORT_LEVEL = 'max'
$env:CLAUDE_CODE_MAX_CONTEXT_TOKENS = '1000000'

Set-Location $Cwd
Write-Output "[$Code] start $(Get-Date -Format 'HH:mm:ss') cwd=$Cwd model=$main"
$prompt = Get-Content $PromptFile -Raw
# stream-json：每个动作实时一行落盘（面板尾读即"终端形态"）
$prompt | claude --dangerously-skip-permissions -p --model $main --output-format stream-json --verbose 2>&1 | Out-File -FilePath $LogPath -Encoding utf8
Write-Output "[$Code] end $(Get-Date -Format 'HH:mm:ss') exit=$LASTEXITCODE"
