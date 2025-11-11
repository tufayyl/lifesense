# Git Setup and Upload Instructions

## Step 1: Install Git (if not already installed)

1. Download Git for Windows from: https://git-scm.com/download/win
2. Run the installer with default settings
3. Restart your terminal/PowerShell after installation

## Step 2: Initialize Git Repository

Open PowerShell in this project directory and run:

```powershell
# Initialize git repository
git init

# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: LifeSense health dashboard"
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., "lifesense")
3. **DO NOT** initialize with README, .gitignore, or license
4. Copy the repository URL (e.g., `https://github.com/yourusername/lifesense.git`)

## Step 4: Connect and Push to GitHub

```powershell
# Add remote repository (replace with your actual repository URL)
git remote add origin https://github.com/yourusername/lifesense.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## Alternative: Using GitHub Desktop

If you prefer a GUI:
1. Download GitHub Desktop: https://desktop.github.com/
2. Install and sign in
3. File > Add Local Repository
4. Select this folder
5. Publish repository to GitHub

## Quick Commands Reference

```powershell
# Check status
git status

# Add files
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push

# Pull latest changes
git pull
```

