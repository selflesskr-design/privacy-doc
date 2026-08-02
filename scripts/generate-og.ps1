# Generates public/og.png (1200x630) for Open Graph / Twitter / KakaoTalk cards.
#
# Unlike the icon generator this one needs real text rendering, so it uses
# System.Drawing and is therefore Windows-only. The OG image changes rarely, so
# the generated PNG is committed; re-run this only when the brand changes.
#
#   npm run gen:og
#
# The symbol comes from public/pwa-512.png (produced by generate-brand-assets.mjs),
# and the type is set in the bundled Pretendard so the card matches the app.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'public\og.png'
$logoOut = Join-Path $root 'brand\logo-source.png'
$badgePath = Join-Path $root 'public\pwa-512.png'
$fontPath = Join-Path $root 'public\fonts\Pretendard-Regular.ttf'

$W = 1200
$H = 630

$cream = [System.Drawing.ColorTranslator]::FromHtml('#F7E7D3')
$ink = [System.Drawing.ColorTranslator]::FromHtml('#4A342A')
$accent = [System.Drawing.ColorTranslator]::FromHtml('#EE8130')
$subtle = [System.Drawing.ColorTranslator]::FromHtml('#8A6E58')

# Load Pretendard as a private font so the card uses the same face as the app.
$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile($fontPath)
$family = $fonts.Families[0]

$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear($cream)

# Symbol, vertically centred on the left.
$badge = [System.Drawing.Image]::FromFile($badgePath)
$badgeSize = 372
$g.DrawImage($badge, 96, [int](($H - $badgeSize) / 2), $badgeSize, $badgeSize)

$textX = 536.0
$titleFont = New-Object System.Drawing.Font($family, 74, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$leadFont = New-Object System.Drawing.Font($family, 37, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font($family, 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$inkBrush = New-Object System.Drawing.SolidBrush($ink)
$accentBrush = New-Object System.Drawing.SolidBrush($accent)
$subtleBrush = New-Object System.Drawing.SolidBrush($subtle)
$fmt = [System.Drawing.StringFormat]::GenericTypographic

# Current service name.
$titleY = 178.0
$g.DrawString('Privacy', $titleFont, $inkBrush, $textX, $titleY, $fmt)

$g.DrawString('브라우저에서 끝내는', $leadFont, $inkBrush, $textX, 296.0, $fmt)
$g.DrawString('개인정보 안전 문서 도구', $leadFont, $inkBrush, $textX, 348.0, $fmt)

# Accent rule, then the trust line.
$rule = New-Object System.Drawing.SolidBrush($accent)
$g.FillRectangle($rule, $textX, 420.0, 64.0, 5.0)
$g.DrawString('파일이 서버로 전송되지 않습니다', $subFont, $subtleBrush, $textX, 448.0, $fmt)

$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

# Square brand reference using the same generated mark and current name.
$logoSize = 1254
$logoBmp = New-Object System.Drawing.Bitmap($logoSize, $logoSize)
$logoG = [System.Drawing.Graphics]::FromImage($logoBmp)
$logoG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$logoG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$logoG.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$logoG.Clear($cream)
$logoG.DrawImage($badge, 327, 110, 600, 600)
$logoTitleFont = New-Object System.Drawing.Font($family, 150, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$logoTitleWidth = $logoG.MeasureString('Privacy', $logoTitleFont, 2000, $fmt).Width
$logoG.DrawString('Privacy', $logoTitleFont, $inkBrush, ($logoSize - $logoTitleWidth) / 2, 790, $fmt)
$logoLeadFont = New-Object System.Drawing.Font($family, 42, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$logoLead = '개인정보 안전 문서 도구'
$logoLeadWidth = $logoG.MeasureString($logoLead, $logoLeadFont, 2000, $fmt).Width
$logoG.DrawString($logoLead, $logoLeadFont, $subtleBrush, ($logoSize - $logoLeadWidth) / 2, 985, $fmt)
$logoBmp.Save($logoOut, [System.Drawing.Imaging.ImageFormat]::Png)

$logoLeadFont.Dispose(); $logoTitleFont.Dispose(); $logoG.Dispose(); $logoBmp.Dispose()
$g.Dispose(); $bmp.Dispose(); $badge.Dispose(); $fonts.Dispose()
Write-Output "public/og.png ($W x $H), brand/logo-source.png ($logoSize x $logoSize)"
