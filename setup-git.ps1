# Git Setup Script for LifeSense Project
# Run this script after installing Git

Write-Host "=== LifeSense Git Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "✓ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Initializing git repository..." -ForegroundColor Cyan
git init

Write-Host "Adding files..." -ForegroundColor Cyan
git add .

Write-Host "Creating initial commit..." -ForegroundColor Cyan
git commit -m "Initial commit: LifeSense health dashboard with Vercel deployment config"

Write-Host ""
Write-Host "✓ Git repository initialized and files committed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create a new repository on GitHub (https://github.com/new)" -ForegroundColor White
Write-Host "2. Copy the repository URL" -ForegroundColor White
Write-Host "3. Run these commands (replace YOUR_REPO_URL with your actual URL):" -ForegroundColor White
Write-Host ""
Write-Host "   git remote add origin YOUR_REPO_URL" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""

