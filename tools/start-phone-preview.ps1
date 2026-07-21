$ErrorActionPreference = "Stop"

$port = 8787
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".svg"  = "image/svg+xml"
  ".txt"  = "text/plain; charset=utf-8"
}

function Send-Response {
  param (
    [System.Net.Sockets.NetworkStream] $Stream,
    [int] $Status,
    [string] $StatusText,
    [byte[]] $Body,
    [string] $ContentType
  )

  $header = "HTTP/1.1 $Status $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

function Get-SafePath {
  param ([string] $RequestPath)

  $cleanPath = [Uri]::UnescapeDataString(($RequestPath -split "\?")[0])
  if ($cleanPath -eq "/") {
    $cleanPath = "/index.html"
  }

  $relativePath = $cleanPath.TrimStart("/") -replace "/", [System.IO.Path]::DirectorySeparatorChar
  $candidate = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
  $rootFull = [System.IO.Path]::GetFullPath($root)

  if (-not $candidate.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $null
  }

  return $candidate
}

$listener.Start()
Write-Host "Lady & Delilah Card Maker preview is running."
Write-Host "Local: http://localhost:$port/"
Write-Host "Phone: use your computer IPv4 address with port $port, for example http://192.168.1.67:$port/"
Write-Host "Press Ctrl+C to stop."

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $buffer = New-Object byte[] 8192
    $read = $stream.Read($buffer, 0, $buffer.Length)
    if ($read -le 0) {
      continue
    }

    $request = [System.Text.Encoding]::ASCII.GetString($buffer, 0, $read)
    $firstLine = ($request -split "`r`n")[0]
    $parts = $firstLine -split " "

    if ($parts.Length -lt 2 -or $parts[0] -ne "GET") {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Method not allowed")
      Send-Response $stream 405 "Method Not Allowed" $body "text/plain; charset=utf-8"
      continue
    }

    $filePath = Get-SafePath $parts[1]
    if ($null -eq $filePath -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      Send-Response $stream 404 "Not Found" $body "text/plain; charset=utf-8"
      continue
    }

    $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
    $contentType = $mimeTypes[$extension]
    if (-not $contentType) {
      $contentType = "application/octet-stream"
    }

    $body = [System.IO.File]::ReadAllBytes($filePath)
    Send-Response $stream 200 "OK" $body $contentType
  }
  catch {
    try {
      $body = [System.Text.Encoding]::UTF8.GetBytes("Server error")
      Send-Response $stream 500 "Internal Server Error" $body "text/plain; charset=utf-8"
    }
    catch {
    }
  }
  finally {
    $client.Close()
  }
}
