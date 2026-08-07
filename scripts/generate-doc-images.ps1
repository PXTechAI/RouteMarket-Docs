param(
  [string]$OutputRoot = (Join-Path $PSScriptRoot "..\public\images\docs")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing.Common

$width = 1440
$height = 900
$fontFamily = "Microsoft YaHei UI"
$monoFamily = "Consolas"

function New-Color([string]$hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function New-Brush([string]$hex) {
  return [System.Drawing.SolidBrush]::new((New-Color $hex))
}

function New-Font(
  [float]$size,
  [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular,
  [string]$family = $fontFamily
) {
  return [System.Drawing.Font]::new(
    $family,
    $size,
    $style,
    [System.Drawing.GraphicsUnit]::Pixel
  )
}

function Add-RoundedRectangle(
  [System.Drawing.Graphics]$graphics,
  [System.Drawing.Brush]$brush,
  [float]$x,
  [float]$y,
  [float]$w,
  [float]$h,
  [float]$radius = 8
) {
  $diameter = $radius * 2
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
  $path.AddArc($x + $w - $diameter, $y, $diameter, $diameter, 270, 90)
  $path.AddArc($x + $w - $diameter, $y + $h - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($x, $y + $h - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $graphics.FillPath($brush, $path)
  $path.Dispose()
}

function Add-Text(
  [System.Drawing.Graphics]$graphics,
  [string]$text,
  [System.Drawing.Font]$font,
  [System.Drawing.Brush]$brush,
  [float]$x,
  [float]$y,
  [float]$w,
  [float]$h
) {
  $format = [System.Drawing.StringFormat]::new()
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
  $format.FormatFlags = [System.Drawing.StringFormatFlags]::LineLimit
  $graphics.DrawString(
    $text,
    $font,
    $brush,
    [System.Drawing.RectangleF]::new($x, $y, $w, $h),
    $format
  )
  $format.Dispose()
}

function New-RouteMarketGuideImage([hashtable]$spec) {
  $target = Join-Path $OutputRoot $spec.Path
  $directory = Split-Path $target -Parent
  New-Item -ItemType Directory -Force -Path $directory | Out-Null

  $bitmap = [System.Drawing.Bitmap]::new($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $graphics.Clear((New-Color "#EEF2F5"))

  $white = New-Brush "#FFFFFF"
  $ink = New-Brush "#17202A"
  $muted = New-Brush "#637083"
  $soft = New-Brush "#F6F8FA"
  $line = New-Brush "#DDE3E8"
  $accent = New-Brush $spec.Accent
  $accentSoft = New-Brush $spec.AccentSoft
  $success = New-Brush "#147D64"
  $terminalBrush = New-Brush "#17202A"
  $terminalTextBrush = New-Brush "#D7F5EA"

  $titleFont = New-Font 34 ([System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Font 17
  $labelFont = New-Font 15 ([System.Drawing.FontStyle]::Bold)
  $bodyFont = New-Font 17
  $smallFont = New-Font 14
  $monoFont = New-Font 15 ([System.Drawing.FontStyle]::Regular) $monoFamily

  Add-RoundedRectangle $graphics $white 42 36 1356 828 10
  $graphics.FillRectangle($accent, 42, 36, 1356, 8)

  Add-Text $graphics "RouteMarket" $labelFont $accent 80 68 260 30
  Add-Text $graphics $spec.Title $titleFont $ink 80 112 1080 52
  Add-Text $graphics $spec.Subtitle $subtitleFont $muted 80 169 1120 38

  $graphics.FillRectangle($soft, 80, 228, 260, 584)
  Add-Text $graphics "操作步骤" $labelFont $ink 108 258 180 28

  $stepY = 312
  for ($index = 0; $index -lt $spec.Steps.Count; $index++) {
    Add-RoundedRectangle $graphics $accentSoft 108 $stepY 34 34 8
    Add-Text $graphics ([string]($index + 1)) $labelFont $accent 119 ($stepY + 5) 20 22
    Add-Text $graphics $spec.Steps[$index] $smallFont $ink 158 ($stepY + 2) 150 58
    $stepY += 92
  }

  Add-RoundedRectangle $graphics $soft 374 228 972 584 8
  Add-RoundedRectangle $graphics $white 404 258 912 524 8
  $graphics.FillRectangle($line, 404, 310, 912, 1)

  Add-Text $graphics $spec.PanelTitle $labelFont $ink 436 272 500 28
  Add-RoundedRectangle $graphics $success 1174 270 110 28 8
  Add-Text $graphics $spec.Badge $smallFont $white 1190 274 86 22

  if ($spec.Mode -eq "terminal") {
    Add-RoundedRectangle $graphics $terminalBrush 436 344 848 328 8
    $terminalText = ($spec.Fields | ForEach-Object { $_.Value }) -join "`n"
    Add-Text $graphics $terminalText $monoFont $terminalTextBrush 466 376 788 258
  } else {
    $fieldY = 350
    foreach ($field in $spec.Fields) {
      Add-Text $graphics $field.Label $smallFont $muted 436 $fieldY 180 24
      Add-RoundedRectangle $graphics $soft 436 ($fieldY + 28) 848 54 6
      Add-Text $graphics $field.Value $bodyFont $ink 458 ($fieldY + 42) 802 28
      $fieldY += 104
    }
  }

  if ($spec.Note) {
    Add-RoundedRectangle $graphics $accentSoft 436 696 848 54 6
    Add-Text $graphics $spec.Note $smallFont $accent 458 712 802 28
  }

  Add-Text $graphics "操作示意，实际控制台或客户端界面可能随版本调整" $smallFont $muted 80 826 1000 24
  $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)

  foreach ($resource in @(
    $graphics,
    $bitmap,
    $white,
    $ink,
    $muted,
    $soft,
    $line,
    $accent,
    $accentSoft,
    $success,
    $terminalBrush,
    $terminalTextBrush,
    $titleFont,
    $subtitleFont,
    $labelFont,
    $bodyFont,
    $smallFont,
    $monoFont
  )) {
    $resource.Dispose()
  }

  Write-Host "generated $target"
}

$images = @(
  @{
    Path = "guide/registration/account.png"
    Title = "创建 RouteMarket 账户"
    Subtitle = "使用团队长期可访问的邮箱完成注册与验证"
    Accent = "#126E82"
    AccentSoft = "#DDF1F3"
    PanelTitle = "注册账户"
    Badge = "第一步"
    Steps = @("打开控制台", "填写账户信息", "完成安全验证")
    Fields = @(
      @{ Label = "工作邮箱"; Value = "team@example.com" },
      @{ Label = "账户名称"; Value = "RouteMarket Team" },
      @{ Label = "验证状态"; Value = "邮箱已验证" }
    )
    Note = "请使用组织可持续访问的邮箱，不要使用临时邮箱。"
  },
  @{
    Path = "guide/registration/billing-project.png"
    Title = "完成计费并创建项目"
    Subtitle = "将开发、测试和生产环境分开管理"
    Accent = "#B85C38"
    AccentSoft = "#F8E7DF"
    PanelTitle = "新建项目"
    Badge = "第二步"
    Steps = @("确认账户余额", "创建独立项目", "设置项目用途")
    Fields = @(
      @{ Label = "项目名称"; Value = "production-api" },
      @{ Label = "环境"; Value = "Production" },
      @{ Label = "预算提醒"; Value = "达到 80% 时通知管理员" }
    )
    Note = "项目隔离有助于分别管理密钥、用量和权限。"
  },
  @{
    Path = "guide/registration/api-key.png"
    Title = "创建并保存 API Key"
    Subtitle = "密钥只展示一次，请立即保存到 Secret 管理工具"
    Accent = "#3567A8"
    AccentSoft = "#E3ECF8"
    PanelTitle = "项目密钥"
    Badge = "第三步"
    Steps = @("填写密钥名称", "创建项目密钥", "立即安全保存")
    Fields = @(
      @{ Label = "密钥名称"; Value = "production-server" },
      @{ Label = "API Key"; Value = "rm_live_••••••••••••••••7Q2K" },
      @{ Label = "权限"; Value = "模型调用 · 只读用量" }
    )
    Note = "不要把完整密钥放进截图、公开仓库或客户端前端代码。"
  },
  @{
    Path = "guide/image-workbench/model.png"
    Title = "选择图片模型"
    Subtitle = "按质量、速度和任务类型选择账户可用模型"
    Accent = "#7A5B2E"
    AccentSoft = "#F3EBDD"
    PanelTitle = "图片工作台"
    Badge = "模型"
    Steps = @("打开图片工作台", "选择生成模型", "确认可用额度")
    Fields = @(
      @{ Label = "模型"; Value = "gemini-3.1-flash-image-preview" },
      @{ Label = "任务类型"; Value = "图片生成与编辑" },
      @{ Label = "输出质量"; Value = "平衡" }
    )
    Note = "批量任务建议先用较小尺寸验证提示词。"
  },
  @{
    Path = "guide/image-workbench/prompt.png"
    Title = "填写提示词与输出设置"
    Subtitle = "明确主体、环境、光线、构图以及需要保留的内容"
    Accent = "#8A3D62"
    AccentSoft = "#F6E3EC"
    PanelTitle = "生成设置"
    Badge = "参数"
    Steps = @("填写提示词", "上传参考素材", "设置尺寸与数量")
    Fields = @(
      @{ Label = "提示词"; Value = "现代产品摄影，柔和自然光，干净背景" },
      @{ Label = "图片尺寸"; Value = "2048 × 2048" },
      @{ Label = "生成数量"; Value = "2 张" }
    )
    Note = "编辑任务请说明哪些元素必须保留、哪些元素可以修改。"
  },
  @{
    Path = "guide/image-workbench/history.png"
    Title = "查看结果与任务记录"
    Subtitle = "保留任务 ID，便于追踪消耗、状态和输出链接"
    Accent = "#147D64"
    AccentSoft = "#DDF2EC"
    PanelTitle = "任务历史"
    Badge = "完成"
    Steps = @("提交生成任务", "等待任务完成", "查看并下载结果")
    Fields = @(
      @{ Label = "任务 ID"; Value = "img_task_01JZ8K4Q" },
      @{ Label = "状态"; Value = "Succeeded" },
      @{ Label = "消耗"; Value = "2 images · 2048px" }
    )
    Note = "异步接口应为轮询设置超时与退避策略。"
  },
  @{
    Path = "guide/clients/provider.png"
    Title = "新增自定义模型服务"
    Subtitle = "桌面端、iOS 和 Android 客户端的核心字段保持一致"
    Accent = "#3567A8"
    AccentSoft = "#E3ECF8"
    PanelTitle = "自定义 Provider"
    Badge = "通用"
    Steps = @("新增服务商", "选择兼容协议", "填写连接信息")
    Fields = @(
      @{ Label = "Provider 类型"; Value = "OpenAI Compatible" },
      @{ Label = "Base URL"; Value = "https://api.routemarket.ai/v1" },
      @{ Label = "API Key"; Value = "rm_live_••••••••••••" }
    )
    Note = "部分客户端会自动追加 /v1，请避免路径重复。"
  },
  @{
    Path = "guide/clients/desktop.png"
    Title = "桌面客户端配置"
    Subtitle = "适用于 Cherry Studio、Chatbox 和其他自定义 Provider 客户端"
    Accent = "#126E82"
    AccentSoft = "#DDF1F3"
    PanelTitle = "桌面端设置"
    Badge = "Desktop"
    Steps = @("打开模型设置", "添加自定义服务", "保存并测试")
    Fields = @(
      @{ Label = "服务名称"; Value = "RouteMarket" },
      @{ Label = "模型名称"; Value = "账户模型列表中的逻辑名称" },
      @{ Label = "连接测试"; Value = "已连接 · 200 OK" }
    )
    Note = "不要直接使用客户端内置的官方 Provider 预设。"
  },
  @{
    Path = "guide/clients/ios.png"
    Title = "iPhone 与 iPad 配置"
    Subtitle = "在支持自定义 OpenAI 服务的客户端中填写 RouteMarket"
    Accent = "#8A3D62"
    AccentSoft = "#F6E3EC"
    PanelTitle = "iOS 模型服务"
    Badge = "iOS"
    Steps = @("进入模型设置", "新增自定义服务", "发送短消息测试")
    Fields = @(
      @{ Label = "API 地址"; Value = "https://api.routemarket.ai/v1" },
      @{ Label = "模型"; Value = "从 /v1/models 中选择" },
      @{ Label = "流式输出"; Value = "开启" }
    )
    Note = "移动网络连接失败时，请同时检查代理和私有 DNS。"
  },
  @{
    Path = "guide/clients/android.png"
    Title = "Android 客户端配置"
    Subtitle = "使用自定义 Provider 接入 RouteMarket 兼容接口"
    Accent = "#147D64"
    AccentSoft = "#DDF2EC"
    PanelTitle = "Android 模型服务"
    Badge = "Android"
    Steps = @("新增 Provider", "填写 API 信息", "保存并验证")
    Fields = @(
      @{ Label = "接口协议"; Value = "OpenAI Compatible" },
      @{ Label = "Base URL"; Value = "https://api.routemarket.ai/v1" },
      @{ Label = "模型"; Value = "从账户可用模型中选择" }
    )
    Note = "密钥复制后请检查首尾是否带有空格或换行。"
  },
  @{
    Path = "guide/clients/test.png"
    Title = "验证客户端连接"
    Subtitle = "先请求模型列表，再发送一条短消息"
    Accent = "#B85C38"
    AccentSoft = "#F8E7DF"
    PanelTitle = "连接状态"
    Badge = "200 OK"
    Steps = @("检查模型列表", "创建新会话", "发送测试消息")
    Fields = @(
      @{ Label = "请求"; Value = "GET /v1/models" },
      @{ Label = "选择模型"; Value = "your-model-name" },
      @{ Label = "测试消息"; Value = "请回复：连接成功" }
    )
    Note = "失败时记录状态码、请求时间和模型名，不要发送完整密钥。"
  },
  @{
    Path = "guide/clients/openclaw-config.png"
    Title = "配置 OpenClaw"
    Subtitle = "通过环境变量注入密钥，避免把 Secret 写入配置文件"
    Accent = "#3567A8"
    AccentSoft = "#E3ECF8"
    PanelTitle = "配置文件"
    Badge = "JSON"
    Steps = @("设置环境变量", "填写兼容地址", "选择逻辑模型")
    Mode = "terminal"
    Fields = @(
      @{ Value = '{' },
      @{ Value = '  "baseURL": "https://api.routemarket.ai/v1",' },
      @{ Value = '  "apiKey": "${ROUTEMARKET_API_KEY}",' },
      @{ Value = '  "model": "your-model-name"' },
      @{ Value = '}' }
    )
    Note = "配置字段可能随 OpenClaw 版本调整，请同时对照当前版本说明。"
  },
  @{
    Path = "guide/clients/openclaw-verify.png"
    Title = "验证 OpenClaw 接入"
    Subtitle = "将接口测试与应用启动分开，便于快速定位问题"
    Accent = "#147D64"
    AccentSoft = "#DDF2EC"
    PanelTitle = "终端检查"
    Badge = "通过"
    Steps = @("验证环境变量", "请求模型列表", "启动 OpenClaw")
    Mode = "terminal"
    Fields = @(
      @{ Value = '$ curl https://api.routemarket.ai/v1/models \' },
      @{ Value = '    -H "Authorization: Bearer $ROUTEMARKET_API_KEY"' },
      @{ Value = '' },
      @{ Value = 'HTTP/2 200' },
      @{ Value = '{ "object": "list", "data": [...] }' }
    )
    Note = "接口成功但应用失败时，检查配置路径、环境变量加载和模型名。"
  }
)

foreach ($image in $images) {
  if (-not $image.ContainsKey("Mode")) {
    $image.Mode = "form"
  }

  New-RouteMarketGuideImage $image
}
