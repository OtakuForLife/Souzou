Write-Host "Running StoryTeller Tests" -ForegroundColor Yellow
Write-Host "=============================="

# Run backend tests
Write-Host "`nRunning Backend Tests..." -ForegroundColor Yellow
Write-Host "------------------------------"
docker-compose exec backend pytest -v

# Run frontend tests
Write-Host "`nRunning Frontend Tests..." -ForegroundColor Yellow
Write-Host "------------------------------"
docker-compose exec frontend npm test

Write-Host "`nTests completed!" -ForegroundColor Green
