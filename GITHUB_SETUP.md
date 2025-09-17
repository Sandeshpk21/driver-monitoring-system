# GitHub Setup Instructions

This guide will walk you through adding your Driver Monitoring System project to GitHub.

## Prerequisites

- Git installed on your system
- GitHub account
- All services tested and working locally

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Configure your repository:
   - **Repository name**: `driver-monitoring-system`
   - **Description**: "Offline-first driver monitoring system with real-time safety detection"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

## Step 2: Initialize Local Git Repository

Open terminal/command prompt in your project directory (`D:\final_app`) and run:

```bash
# Initialize git repository
git init

# Add all files to staging
git add .

# Create initial commit
git commit -m "Initial commit: Driver Monitoring System

- Backend API with Express/TypeScript
- Web Dashboard with Next.js
- Mobile App with React Native/Expo
- Offline-first architecture
- Real-time driver safety monitoring"
```

## Step 3: Connect to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```bash
# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/driver-monitoring-system.git

# Verify remote was added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Add Environment Variables Documentation

Create a `.env.example` file for each service to help others set up the project:

### Backend `.env.example`
```bash
cd backend
cp .env .env.example
# Edit .env.example to remove sensitive values
```

### Web Dashboard `.env.example`
```bash
cd ../web-dashboard
cp .env.local .env.example
# Edit .env.example to remove sensitive values
```

### Mobile App `.env.example`
```bash
cd ../mobile-app
cp .env .env.example
# Edit .env.example to remove sensitive values
```

Then commit these example files:
```bash
cd ..
git add */.env.example
git commit -m "Add environment variable examples"
git push
```

## Step 5: Create GitHub Secrets (Optional - for CI/CD)

If you plan to use GitHub Actions:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add the following secrets:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Your JWT secret key
   - `EXPO_TOKEN`: (If deploying to Expo)

## Step 6: Add GitHub Topics

1. Go to your repository page
2. Click the gear icon next to "About"
3. Add topics:
   - `react-native`
   - `expo`
   - `nextjs`
   - `typescript`
   - `driver-safety`
   - `offline-first`
   - `postgresql`
   - `real-time-monitoring`

## Step 7: Create README Badges

Add these badges to your README.md for a professional look:

```markdown
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![React Native](https://img.shields.io/badge/React_Native-0.81.4-blue)
![Next.js](https://img.shields.io/badge/Next.js-13.x-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue)
```

## Step 8: Set Up Branch Protection (Recommended)

1. Go to **Settings** → **Branches**
2. Click **"Add rule"**
3. Branch name pattern: `main`
4. Enable:
   - Require pull request reviews before merging
   - Dismiss stale pull request approvals
   - Require status checks to pass before merging
5. Click **"Create"**

## Common Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# Create new branch
git checkout -b feature/branch-name

# Switch branches
git checkout main

# Pull latest changes
git pull origin main

# Push changes
git push origin branch-name

# Stash changes temporarily
git stash

# Apply stashed changes
git stash pop
```

## Troubleshooting

### Authentication Issues
If you get authentication errors when pushing:

1. **For HTTPS**: Use a Personal Access Token instead of password
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with repo permissions
   - Use this token as your password when pushing

2. **For SSH**: Set up SSH keys
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   # Add the public key to GitHub Settings → SSH and GPG keys
   ```

### Large Files
If you get errors about large files:

```bash
# Remove large files from history
git filter-branch --tree-filter 'rm -f path/to/large/file' HEAD

# Or use Git LFS for large files
git lfs track "*.db"
git lfs track "*.sqlite"
```

### Permission Denied
If you get permission denied errors:

```bash
# Check your remote URL
git remote -v

# Update remote URL if needed
git remote set-url origin https://github.com/YOUR_USERNAME/driver-monitoring-system.git
```

## Next Steps

1. **Add Documentation**: Improve README with screenshots and detailed setup
2. **Create Issues**: Track bugs and features using GitHub Issues
3. **Set Up CI/CD**: Add GitHub Actions for automated testing
4. **Add License**: Choose an appropriate license (MIT, Apache, etc.)
5. **Create Releases**: Tag versions as you develop

## Resources

- [GitHub Docs](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Actions](https://github.com/features/actions)
- [Conventional Commits](https://www.conventionalcommits.org)

---

## Project Structure on GitHub

Your repository will have this structure:

```
driver-monitoring-system/
├── backend/               # Express API server
├── web-dashboard/        # Next.js admin dashboard
├── mobile-app/          # React Native/Expo driver app
├── docs/               # Documentation
├── .gitignore         # Git ignore rules
├── README.md          # Project overview
├── package.json       # Root package.json
├── docker-compose.yml # Docker configuration
└── GITHUB_SETUP.md   # This file
```

Remember to keep sensitive information like API keys, passwords, and tokens in `.env` files and never commit them to GitHub!