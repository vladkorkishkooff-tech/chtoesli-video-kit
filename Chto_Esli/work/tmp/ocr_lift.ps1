[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Windows.Media.Ocr.OcrEngine, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null
[Windows.Globalization.Language, Windows.Foundation.UniversalApiContract, ContentType = WindowsRuntime] | Out-Null

$lang = [Windows.Globalization.Language]::CreateLanguage('ru')
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
if (-not $engine) { $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages() }

$files = Get-ChildItem 'D:\Chanels\Chto_Esli\work\tmp\lift_panels\*_sub.jpg' | Sort-Object Name
foreach ($f in $files) {
    $asyncOp = [Windows.Storage.StorageFile]::GetFileFromPathAsync($f.FullName)
    while ($asyncOp.Status -eq 'Started') { Start-Sleep -Milliseconds 10 }
    $file = $asyncOp.GetResults()
    
    $streamOp = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read)
    while ($streamOp.Status -eq 'Started') { Start-Sleep -Milliseconds 10 }
    $stream = $streamOp.GetResults()
    
    $decoderOp = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)
    while ($decoderOp.Status -eq 'Started') { Start-Sleep -Milliseconds 10 }
    $decoder = $decoderOp.GetResults()
    
    $bitmapOp = $decoder.GetSoftwareBitmapAsync()
    while ($bitmapOp.Status -eq 'Started') { Start-Sleep -Milliseconds 10 }
    $bitmap = $bitmapOp.GetResults()
    
    $ocrOp = $engine.RecognizeAsync($bitmap)
    while ($ocrOp.Status -eq 'Started') { Start-Sleep -Milliseconds 10 }
    $res = $ocrOp.GetResults()
    
    $lines = ($res.Lines | ForEach-Object { $_.Text }) -join ' | '
    Write-Output "[$($f.Name)] $lines"
}
