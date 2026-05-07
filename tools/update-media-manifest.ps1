param(
  [switch] $Watch
)

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ImageExtensions = @(".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")
$VideoExtensions = @(".mp4", ".m4v", ".mov", ".webm", ".ogv")
$VideoTypes = @{
  ".mp4" = "video/mp4"
  ".m4v" = "video/mp4"
  ".mov" = "video/quicktime"
  ".webm" = "video/webm"
  ".ogv" = "video/ogg"
}
$VideoRank = @{
  ".mp4" = 0
  ".webm" = 1
  ".m4v" = 2
  ".mov" = 3
  ".ogv" = 4
}

function Convert-ToWebPath {
  param([string] $Path)
  return (Resolve-Path $Path).Path.Substring($Root.Path.Length + 1).Replace("\", "/")
}

function Convert-ToTitle {
  param([string] $Name)
  $BaseName = [System.IO.Path]::GetFileNameWithoutExtension($Name)
  $BaseName = $BaseName -replace "[-_]+", " "
  $BaseName = $BaseName -replace "([a-z])([0-9])", '$1 $2'
  $BaseName = $BaseName -replace "\s+", " "
  return $BaseName.Trim()
}

function Get-MediaFiles {
  param(
    [string] $Folder,
    [string[]] $Extensions
  )

  $AbsoluteFolder = Join-Path $Root $Folder
  if (-not (Test-Path $AbsoluteFolder)) {
    return @()
  }

  return Get-ChildItem -LiteralPath $AbsoluteFolder -File |
    Where-Object { $Extensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object @{ Expression = { Convert-ToTitle $_.Name }; Ascending = $true }, @{ Expression = "Name"; Ascending = $true }
}

function Convert-PerformanceVideos {
  $AbsoluteFolder = Join-Path $Root "video\performances"
  if (-not (Test-Path $AbsoluteFolder)) {
    return
  }

  $Ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if (-not $Ffmpeg) {
    Write-Warning "ffmpeg was not found. New .mov files will be listed only if the browser can play them."
    return
  }

  Get-ChildItem -LiteralPath $AbsoluteFolder -File |
    Where-Object { $_.Extension.ToLowerInvariant() -eq ".mov" } |
    ForEach-Object {
      $OutputPath = Join-Path $_.DirectoryName "$($_.BaseName).mp4"
      if (Test-Path $OutputPath) {
        return
      }

      Write-Host "Converting $($_.Name) to $($_.BaseName).mp4..."
      & $Ffmpeg.Source -y -i $_.FullName -vf "scale=1280:-2" -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart $OutputPath
      if ($LASTEXITCODE -ne 0) {
        throw "ffmpeg failed while converting $($_.Name)."
      }
    }
}

function Update-MediaManifest {
  Convert-PerformanceVideos

  $Gallery = @(Get-MediaFiles -Folder "gallery" -Extensions $ImageExtensions | ForEach-Object {
    [ordered]@{
      src = Convert-ToWebPath $_.FullName
      alt = "$(Convert-ToTitle $_.Name) - Alejandra Mantinan"
    }
  })

  $PerformanceFiles = Get-MediaFiles -Folder "video\performances" -Extensions $VideoExtensions |
    Group-Object BaseName |
    ForEach-Object {
      $_.Group | Sort-Object { $VideoRank[$_.Extension.ToLowerInvariant()] } | Select-Object -First 1
    } |
    Sort-Object @{ Expression = { Convert-ToTitle $_.Name }; Ascending = $true }, @{ Expression = "Name"; Ascending = $true }

  $Performances = @($PerformanceFiles | ForEach-Object {
    $Extension = $_.Extension.ToLowerInvariant()
    [ordered]@{
      src = Convert-ToWebPath $_.FullName
      title = Convert-ToTitle $_.Name
      type = $VideoTypes[$Extension]
    }
  })

  $Manifest = [ordered]@{
    gallery = $Gallery
    performances = $Performances
  }

  $Json = $Manifest | ConvertTo-Json -Depth 6
  $Output = "window.MORAKI_MEDIA = $Json;`n"
  Set-Content -LiteralPath (Join-Path $Root "media-manifest.js") -Value $Output -Encoding UTF8

  Write-Host "Wrote media-manifest.js with $($Gallery.Count) gallery item(s) and $($Performances.Count) performance item(s)."
}

function Start-MediaManifestWatcher {
  Update-MediaManifest

  $Folders = @("gallery", "video\performances")
  $Watchers = @()
  $SubscriptionIds = @()
  $EventNumber = 0

  foreach ($Folder in $Folders) {
    $AbsoluteFolder = Join-Path $Root $Folder
    if (-not (Test-Path $AbsoluteFolder)) {
      continue
    }

    $Watcher = New-Object System.IO.FileSystemWatcher
    $Watcher.Path = $AbsoluteFolder
    $Watcher.Filter = "*.*"
    $Watcher.IncludeSubdirectories = $false
    $Watcher.NotifyFilter = [System.IO.NotifyFilters]"FileName, LastWrite, Size"
    $Watcher.EnableRaisingEvents = $true
    $Watchers += $Watcher

    foreach ($EventName in @("Created", "Deleted", "Renamed", "Changed")) {
      $EventNumber += 1
      $SourceIdentifier = "MorakiMedia.$EventNumber.$EventName"
      Register-ObjectEvent -InputObject $Watcher -EventName $EventName -SourceIdentifier $SourceIdentifier | Out-Null
      $SubscriptionIds += $SourceIdentifier
    }
  }

  if ($Watchers.Count -eq 0) {
    Write-Warning "No gallery or performance folders were found to watch."
    return
  }

  Write-Host "Watching gallery and video/performances. Press Ctrl+C to stop."

  try {
    while ($true) {
      $Event = Wait-Event -Timeout 1
      if ($null -eq $Event) {
        continue
      }

      Remove-Event -EventIdentifier $Event.EventIdentifier
      do {
        $PendingEvent = Get-Event | Select-Object -First 1
        if ($null -ne $PendingEvent) {
          Remove-Event -EventIdentifier $PendingEvent.EventIdentifier
        }
      } while ($null -ne $PendingEvent)

      Start-Sleep -Milliseconds 450
      Update-MediaManifest
    }
  } finally {
    foreach ($SourceIdentifier in $SubscriptionIds) {
      Unregister-Event -SourceIdentifier $SourceIdentifier -ErrorAction SilentlyContinue
    }

    foreach ($Watcher in $Watchers) {
      $Watcher.EnableRaisingEvents = $false
      $Watcher.Dispose()
    }
  }
}

if ($Watch) {
  Start-MediaManifestWatcher
} else {
  Update-MediaManifest
}
