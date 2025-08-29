# Simple Health Check Workflow

A focused GitHub Action that runs post-deployment health checks for the embedded finance demo.

## 🎯 What It Does

This workflow verifies that your deployed demo is working correctly by:

- ✅ Loading the demo page without errors
- ✅ Checking that MSW (Mock Service Worker) is functioning
- ✅ Verifying transaction data is accessible
- ✅ Capturing screenshots for debugging
- ✅ Providing clear pass/fail results

## 🚀 How to Use

### Manual Trigger

1. Go to **Actions** tab in your GitHub repository
2. Select **Simple Post-Deployment Health Check**
3. Click **Run workflow**
4. Optionally provide a custom URL to test
5. Click **Run workflow**

### Automatic Trigger

The workflow automatically runs when:

- You push changes to the `main` branch
- You modify the workflow file or health check script

## 🧪 Testing During PR Development

### 1. Test Locally First

Before pushing your changes, test the health check script locally:

```bash
# Navigate to the client directory
cd app/client-next-ts

# Test against production
npm run health-check

# Test against local development server
npm run dev  # In one terminal
npm run health-check:local  # In another terminal
```

### 2. Verify the Script Works

The local test should:

- ✅ Load the page successfully
- ✅ Find transaction elements
- ✅ Generate screenshots
- ✅ Exit with code 0 (success)

### 3. Push and Test

After your local tests pass:

1. Commit and push your changes
2. The workflow will automatically run
3. Check the **Actions** tab for results
4. Review screenshots and logs if there are failures

## 🔧 Troubleshooting

### Common Issues

1. **Playwright not installed locally:**

   ```bash
   npm install --save-dev @playwright/test
   npx playwright install --with-deps chromium
   ```

2. **Local development server not running:**

   ```bash
   npm run dev  # Start the dev server first
   ```

3. **Health check fails in GitHub Actions:**
   - Check the workflow logs for specific errors
   - Verify the target URL is accessible
   - Ensure MSW is properly configured

### Debug Mode

Run with visible browser to see what's happening:

```bash
node health-check.js --headless false
```

## 📁 Files

- **`.github/workflows/simple-health-check.yml`** - The workflow definition
- **`app/client-next-ts/health-check.js`** - The health check script
- **`app/client-next-ts/package.json`** - NPM scripts for easy execution

## 🎯 Next Steps

1. **Test locally** before pushing changes
2. **Monitor workflow results** in the Actions tab
3. **Use screenshots** to debug any failures
4. **Re-run manually** if needed after fixes

This simple setup gives you reliable post-deployment verification without complexity!
