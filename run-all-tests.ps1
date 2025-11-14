Write-Host "Running Souzou Tests" -ForegroundColor Yellow
Write-Host "=============================="

# Check if containers are running
Write-Host "`nChecking Docker containers..." -ForegroundColor Cyan
$containers = docker-compose ps --services --filter "status=running"
if ($containers -notcontains "backend" -or $containers -notcontains "frontend") {
    Write-Host "Starting Docker containers..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 5
}

# Run backend tests
Write-Host "`nRunning Backend Tests..." -ForegroundColor Yellow
Write-Host "------------------------------"
docker-compose exec backend pytest -v --tb=short

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests FAILED!" -ForegroundColor Red
    exit 1
}

# Run frontend tests
Write-Host "`nRunning Frontend Tests..." -ForegroundColor Yellow
Write-Host "------------------------------"
docker-compose exec frontend npm test -- --run

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend tests FAILED!" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll tests passed!" -ForegroundColor Green
Write-Host "`nTest Summary:" -ForegroundColor Cyan
Write-Host "- Backend: Sync push/pull, entity management, file upload"
Write-Host "- Frontend: Sync orchestration, entity service, IndexedDB driver"
