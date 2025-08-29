# Wait and Verify Deployment Workflow

A CI/CD pipeline that waits for Amplify to auto-deploy changes and then verifies the deployment with health checks, with PR status gating.

## 🎯 What It Does

This workflow provides a complete deployment verification pipeline:

1. **⏳ Wait for Deployment**: Waits for Amplify to auto-deploy from your `amplify.yml`
2. **🔍 Health Check**: Verifies the deployed demo is working correctly
3. **✅ PR Status Update**: Updates PR status based on health check results
4. **🚫 PR Blocking**: Prevents merging if health check fails

## 🚀 How It Works

### **Complete Pipeline Flow**
```
Code Push/PR → Amplify auto-deploys (from amplify.yml) → Wait for completion → Health Check → PR Status Updated
                                    ↓
                              If Health Check Fails → PR Fails ❌
                              If Health Check Passes → PR Passes ✅
```

### **Key Points**
- **Amplify handles deployment** automatically from your `amplify.yml`
- **This workflow only waits and verifies** - it doesn't control deployment
- **Health checks run after deployment** to ensure everything works
- **PR status is updated** based on verification results

## 🚀 How to Use

### **Automatic Trigger**
The workflow automatically runs when:
- You push changes to the `main` branch
- You create or update a pull request

### **Manual Trigger**
1. Go to **Actions** tab in your GitHub repository
2. Select **Wait and Verify Deployment**
3. Click **Run workflow**
4. Click **Run workflow**

## 📋 What Gets Verified

✅ **Page Load** - Demo loads without errors  
✅ **MSW Functionality** - Mock Service Worker is working  
✅ **Transaction Data** - Transactions list is accessible  
✅ **No Critical Errors** - Console and network errors are minimal  
✅ **Screenshot Capture** - Visual verification for debugging  

## 🔧 Configuration

### **Environment Variables**
- `TARGET_URL`: The URL to test (defaults to your dev environment)

### **Timing**
- **Deployment Wait**: 4 minutes (adjust in workflow if needed)
- **Total Timeout**: 15 minutes for the entire job

## 📊 Results

### **Success Case**
- ✅ Health check passes
- ✅ PR status shows "ready to merge"
- ✅ Screenshots uploaded as artifacts
- ✅ Summary shows all checks passed

### **Failure Case**
- ❌ Health check fails
- ❌ PR status shows "needs attention"
- ❌ PR is blocked from merging
- ❌ Screenshots and error logs available for debugging

## 🛠️ Troubleshooting

### **Common Issues**
1. **Health check times out**: Increase the deployment wait time
2. **MSW not working**: Check if mock data is properly configured
3. **Page not loading**: Verify the target URL is accessible

### **Debugging**
- Check the workflow logs for detailed error information
- Review uploaded screenshots for visual verification
- Test the health check locally with `npm run health-check`

## 🔗 Related Files

- **Workflow**: `.github/workflows/wait-and-verify-deployment.yml`
- **Health Check Script**: `app/client-next-ts/health-check.js`
- **Amplify Config**: `amplify.yml` (handles actual deployment)
