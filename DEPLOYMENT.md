# Deployment Guide

This document explains how to deploy LabelMerge to GitHub Pages.

## Automatic Deployment (Recommended)

The project is configured for automatic deployment to GitHub Pages via GitHub Actions.

### Prerequisites

1. Push your code to GitHub
2. Enable GitHub Pages in repository settings

### Setup Steps

1. **Go to Repository Settings**
   - Navigate to `Settings` → `Pages`

2. **Configure Source**
   - Source: `GitHub Actions`
   - (The workflow will handle the rest)

3. **Enable Workflow**
   - Go to `Actions` tab
   - Enable workflows if prompted

4. **Push to Main Branch**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

5. **Monitor Deployment**
   - Go to `Actions` tab
   - Watch the "Deploy to GitHub Pages" workflow
   - Should complete in 1-2 minutes

6. **Access Your Site**
   - URL: `https://[username].github.io/free-mail-merge/`
   - Example: `https://briansparker.github.io/free-mail-merge/`

### Workflow Details

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:
- ✅ Triggers on every push to `main` branch
- ✅ Installs dependencies
- ✅ Builds the production bundle
- ✅ Deploys to GitHub Pages

## Manual Deployment (Alternative)

If you prefer manual deployment or need to troubleshoot:

### Using gh-pages Package

1. **Install gh-pages** (optional, only for manual deploys)
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Deploy Manually**
   ```bash
   npm run deploy
   ```

   This will:
   - Build the production bundle
   - Push `dist/` folder to `gh-pages` branch

### Using GitHub CLI

```bash
# Build the project
npm run build

# Deploy using gh CLI
gh workflow run deploy.yml
```

## Configuration

### Base Path

The base path is configured in `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/free-mail-merge/', // Must match your repo name
})
```

**Important:** If you fork this repo with a different name, update the `base` path to match your repository name.

### Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME file**
   ```bash
   echo "yourdomain.com" > public/CNAME
   ```

2. **Update vite.config.js**
   ```javascript
   base: '/', // Root path for custom domain
   ```

3. **Configure DNS**
   - Add CNAME record pointing to `[username].github.io`
   - Wait for DNS propagation (up to 24 hours)

4. **Enable in GitHub Settings**
   - Go to `Settings` → `Pages`
   - Enter custom domain
   - Enforce HTTPS

## Build Verification

### Check Bundle Size

```bash
npm run build
```

Target: < 200 KB gzipped (currently ~62 KB)

### Test Locally

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173/free-mail-merge/`

### Verify Production Build

Check that all features work:
- ✅ CSV upload and parsing
- ✅ Column mapping and auto-detection
- ✅ Label format selection
- ✅ HTML download and print preview
- ✅ LocalStorage persistence
- ✅ Offline functionality (after first load)

## Troubleshooting

### Assets Not Loading (404 Errors)

**Problem:** CSS/JS files return 404 errors

**Solution:** Verify `base` path in `vite.config.js` matches your repository name:
```javascript
base: '/your-repo-name/',  // Must have leading and trailing slashes
```

### Blank Page After Deploy

**Problem:** Page loads but shows blank screen

**Solutions:**
1. Check browser console for errors
2. Verify base path is correct
3. Clear browser cache
4. Check GitHub Actions logs for build errors

### GitHub Actions Fails

**Problem:** Workflow fails with permissions error

**Solution:** Enable workflow permissions:
1. Go to `Settings` → `Actions` → `General`
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Save and re-run workflow

### Page Not Found (404)

**Problem:** Root URL returns 404

**Solution:** GitHub Pages may take 5-10 minutes to propagate after first deployment. Wait and refresh.

## Performance

### Build Metrics

- **Build time:** < 1 second
- **Bundle size:** 62.44 KB (gzipped)
- **Total assets:** 195 KB (uncompressed)

### Optimization Tips

Current build is already optimized, but for future reference:

```bash
# Analyze bundle size
npm run build -- --mode analyze

# Check Lighthouse score
npx lighthouse https://yourdomain.com/free-mail-merge/
```

## Security

### Content Security Policy

Consider adding CSP headers for production:

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';">
```

### HTTPS

GitHub Pages enforces HTTPS by default. For custom domains:
1. Enable "Enforce HTTPS" in repository settings
2. Wait for certificate provisioning (automatic)

## Monitoring

### Check Deployment Status

```bash
# View recent deployments
gh api repos/:owner/:repo/pages/builds

# View latest deployment
gh api repos/:owner/:repo/pages/builds/latest
```

### Analytics (Optional)

To add privacy-respecting analytics:
1. Use Plausible or Umami (no cookies, GDPR-compliant)
2. Add tracking script to `index.html`
3. Update privacy policy

## Rollback

If deployment breaks production:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

## CI/CD Workflow

The deployment workflow runs:

```
Push to main
  ↓
Checkout code
  ↓
Install dependencies (npm ci)
  ↓
Build (npm run build)
  ↓
Upload artifact
  ↓
Deploy to GitHub Pages
  ↓
Live at https://username.github.io/free-mail-merge/
```

## Support

- 📖 **Documentation Issues:** [Open an issue](https://github.com/briansparker/free-mail-merge/issues)
- 🐛 **Deployment Problems:** Check [GitHub Actions logs](https://github.com/briansparker/free-mail-merge/actions)
- 💬 **Questions:** [GitHub Discussions](https://github.com/briansparker/free-mail-merge/discussions)
