# PowerShell Script to Launch/Restart Vachana Audio Notes Platform

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Launching Vachana Audio Notes (Backend & Frontend)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Launch FastAPI Backend on Port 8000
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Launch Next.js Frontend on Port 3000
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev -- -p 3000"

Write-Host "`nServers launched in background windows:" -ForegroundColor Green
Write-Host "  - FastAPI Backend API: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  - Next.js Web Dashboard: http://localhost:3000`n" -ForegroundColor Yellow
