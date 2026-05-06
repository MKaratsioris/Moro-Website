@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\update-media-manifest.ps1" %*
pause
