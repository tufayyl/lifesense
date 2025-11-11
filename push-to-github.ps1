# Push to GitHub Script
# Run this after creating a repository on GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

Write-Host "=== Pushing LifeSense to GitHub ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is available
try {
    git --version | Out-Null
} catch {
    Write-Host "✗ Git is not installed!" -ForegroundColor Red
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "✗ Not a git repository. Run setup-git.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "Adding remote repository: $RepoUrl" -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin $RepoUrl

Write-Host "Renaming branch to main..." -ForegroundColor Cyan
git branch -M main

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Your repository is now available at: $RepoUrl" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✗ Push failed. Make sure:" -ForegroundColor Red
    Write-Host "  1. The repository URL is correct" -ForegroundColor Yellow
    Write-Host "  2. You're authenticated with GitHub" -ForegroundColor Yellow
    Write-Host "  3. The repository exists on GitHub" -ForegroundColor Yellow
}

