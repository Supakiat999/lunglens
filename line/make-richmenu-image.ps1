# Generates rich-menu.png (2500x1686, 3x2 grid) for the LungLens LINE OA.
# ASCII-only script; Thai labels come from richmenu-labels.json (UTF-8).
# Run:  powershell -ExecutionPolicy Bypass -File make-richmenu-image.ps1

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$json = [System.IO.File]::ReadAllText((Join-Path $here "richmenu-labels.json"), [System.Text.Encoding]::UTF8) | ConvertFrom-Json

$W = 2500; $H = 1686
$cols = 3; $rows = 2
$tileW = [int]($W / $cols); $tileH = [int]($H / $rows)

$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "AntiAlias"
$g.TextRenderingHint = "AntiAliasGridFit"

# calm teal palette (trustworthy, high contrast)
$colA = [System.Drawing.ColorTranslator]::FromHtml("#155e75")
$colB = [System.Drawing.ColorTranslator]::FromHtml("#0e7490")
$line = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 6
$white = [System.Drawing.Brushes]::White
$soft  = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#a5f3fc"))

$fEmoji = New-Object System.Drawing.Font("Segoe UI Emoji", 110, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fLabel = New-Object System.Drawing.Font("Leelawadee UI", 92, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fSub   = New-Object System.Drawing.Font("Leelawadee UI", 56, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$center = New-Object System.Drawing.StringFormat
$center.Alignment = "Center"; $center.LineAlignment = "Center"

for ($i = 0; $i -lt 6; $i++) {
  $c = $i % $cols; $r = [int][math]::Floor($i / $cols)
  $x = $c * $tileW; $y = $r * $tileH
  $bg = if ((($c + $r) % 2) -eq 0) { $colA } else { $colB }
  $brush = New-Object System.Drawing.SolidBrush($bg)
  $g.FillRectangle($brush, $x, $y, $tileW, $tileH)

  $t = $json.tiles[$i]
  $emojiRect = New-Object System.Drawing.RectangleF($x, ($y + $tileH*0.08), $tileW, ($tileH*0.34))
  $labelRect = New-Object System.Drawing.RectangleF($x, ($y + $tileH*0.40), $tileW, ($tileH*0.34))
  $subRect   = New-Object System.Drawing.RectangleF($x, ($y + $tileH*0.72), $tileW, ($tileH*0.22))
  $g.DrawString($t.emoji, $fEmoji, $white, $emojiRect, $center)
  $g.DrawString($t.label, $fLabel, $white, $labelRect, $center)
  $g.DrawString($t.sub,   $fSub,   $soft,  $subRect,   $center)
}

# grid lines
$g.DrawLine($line, $tileW, 0, $tileW, $H)
$g.DrawLine($line, ($tileW*2), 0, ($tileW*2), $H)
$g.DrawLine($line, 0, $tileH, $W, $tileH)

$out = Join-Path $here "rich-menu.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output ("Saved " + $out)
