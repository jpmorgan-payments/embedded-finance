# Health Check CI/CD Pipeline Summary

A CI/CD pipeline that automatically detects PR deployments and runs health checks against PR-specific URLs, with PR status gating.

## 🎯 What We Built

1. **Enhanced Health Check Script** (`health-check.js`)

   - **Dynamic URL support** - Can test any URL including PR deployments (pass base URL only; script adds `/sellsense-demo`)
   - **Improved MSW verification** - Better transaction element detection
   - **Enhanced error reporting** - More detailed debugging information
   - **CLI-friendly** - Multiple options for different testing scenarios
   - **CI flakiness mitigations** - Uses `load` instead of `networkidle`; waits for primary content with configurable timeouts; optional retries (default 1 retry when `CI=true`). Env: `HEALTH_CHECK_NAV_TIMEOUT_MS`, `HEALTH_CHECK_CONTENT_TIMEOUT_MS`, `HEALTH_CHECK_RETRIES`; CLI: `--retries 1`.

2. **Smart PR Detection Workflow** (`.github/workflows/wait-and-verify-deployment.yml`)

   - **Automatic PR URL detection** - Constructs PR-specific URLs like `https://pr-527.d2hwh33w4gkjqk.amplifyapp.com/`
   - **Environment-aware testing** - Different wait times for PR vs main deployments
   - **PR status updates** - Blocks PRs if health checks fail
   - **Main deployment verification** - Also tests main branch deployments

3. **NPM Scripts** (in `package.json`)
   - `npm run health-check` - Test production
   - `npm run health-check:local` - Test local development

## 🚀 How It Works

### **Complete Pipeline Flow**

```
Code Push/PR → Amplify auto-deploys → GitHub Action detects environment → Health Check → PR Status Updated
                                    ↓
                              If Health Check Fails → PR Fails ❌
                              If Health Check Passes → PR Passes ✅
```

### **Smart Environment Detection**

- **PR Events**: Automatically constructs PR URLs like `https://pr-{NUMBER}.d2hwh33w4gkjqk.amplifyapp.com/`
- **Main Branch**: Tests against main deployment URL `https://embedded-finance-dev.com`
- **Different Wait Times**: PR deployments (1 min) vs main deployments (4 min)

### **Key Benefits**

- **Test before merge** - Catch issues in PR preview environments
- **No manual URL configuration** - Automatically detects the right environment
- **Faster PR feedback** - Test immediately when PR is created
- **Isolated testing** - Each PR gets its own isolated environment

## 🎯 Benefits

### **For Developers**

- ✅ **PR preview testing** - Test changes before they reach main
- ✅ **Automatic verification** - Every PR deployment is automatically tested
- ✅ **PR safety** - Can't merge broken deployments
- ✅ **Clear feedback** - Know immediately if changes break anything
- ✅ **Screenshots** - Visual debugging when things go wrong

### **For Quality Assurance**

- ✅ **Early issue detection** - Problems caught in PR previews
- ✅ **Deployment verification** - Every change is automatically tested
- ✅ **Regression prevention** - Broken deployments block PRs
- ✅ **Audit trail** - Complete history of all deployments and health checks
- ✅ **Fast feedback** - Issues caught before they reach production

## 🔧 Setup Required

### **1. Branch Protection Rules**

Set up branch protection in GitHub to require the health check:

1. Go to Settings → Branches → Add rule
2. Select `main` branch
3. Check "Require status checks to pass before merging"
4. Add "Wait and Verify Deployment" as required status check

### **2. Workflow Configuration**

- **PR Deployment Wait**: 1 minute (faster PR builds)
- **Main Deployment Wait**: 4 minutes (longer main builds)
- **Target URL**: Automatically detected based on event type
- **Timeout**: 15 minutes total

## 🧪 Testing During PR Development

### **Local Testing**

```bash
# Test against production
npm run health-check

# Test against local development
npm run dev  # Terminal 1
npm run health-check:local  # Terminal 2

# Test against custom URL (like PR deployment). Use base URL only; script adds /sellsense-demo.
node health-check.js --url "https://pr-527.d2hwh33w4gkjqk.amplifyapp.com"
```

### **PR Testing**

1. **Create PR** - Workflow automatically starts
2. **Watch pipeline** - Check Actions tab for progress
3. **Monitor PR deployment** - See when Amplify creates PR preview
4. **Health check runs** - Tests against PR-specific URL
5. **PR status updated** - Shows success/failure immediately

### **PR-Specific Benefits**

- **Immediate testing** - No waiting for main deployment
- **Isolated environment** - Test changes without affecting main
- **Faster feedback** - Know if changes break anything
- **Safe testing** - Can test risky changes safely

## 📁 Files

- **`.github/workflows/wait-and-verify-deployment.yml`** - Smart PR detection workflow
- **`app/client-next-ts/health-check.js`** - Enhanced health check script
- **`app/client-next-ts/package.json`** - NPM scripts
- **`amplify.yml`** - Amplify deployment configuration

## 🎉 Result

**This setup gives you a production-ready CI/CD pipeline with intelligent PR detection and automatic health checks!**

- **No manual deployment control needed** - Amplify handles everything
- **Automatic PR URL detection** - Tests PR previews automatically
- **Environment-aware testing** - Different strategies for PR vs main
- **PR safety** - Broken deployments can't be merged
- **Clear feedback** - Immediate visibility into deployment health
- **Faster development cycle** - Test changes in PR previews before merge

## 🔍 Example PR URL Detection

When you create PR #527:

1. **Amplify automatically deploys** to `https://pr-527.d2hwh33w4gkjqk.amplifyapp.com/`
2. **GitHub Action detects PR event** and constructs the URL
3. **Health check runs** against the PR-specific URL
4. **PR status updated** based on health check results
5. **PR blocked** if health check fails, **ready to merge** if it passes

This gives you the best of both worlds: **fast PR testing** and **safe main deployments**! 🚀
