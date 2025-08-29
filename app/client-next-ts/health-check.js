import { chromium } from '@playwright/test';

async function simpleHealthCheck() {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false', // Allow local testing with visible browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // Simple configuration - single environment
    const targetUrl =
      process.env.TARGET_URL ||
      'https://embedded-finance-dev.com/sellsense-demo?scenario=Seller+with+Limited+DDA&view=wallet';

    console.log(`🚀 Starting simple health check for: ${targetUrl}`);
    console.log(`⏰ Start time: ${new Date().toISOString()}`);

    // Navigate to the demo page
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Page loaded successfully');

    // Wait for the page to fully render
    await page.waitForTimeout(3000);

    // Check for critical errors in console
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Simple transaction list check
    console.log('🔍 Checking for transactions list...');

    const transactionSelectors = [
      '[data-testid*="transaction"]',
      '.transaction',
      '[class*="transaction"]',
      'text=Transaction',
      'text=transactions',
    ];

    let transactionElements = 0;
    for (const selector of transactionSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          transactionElements = count;
          console.log(
            `✅ Found ${count} transaction-related elements with selector: ${selector}`,
          );
          break;
        }
      } catch (e) {
        // Continue with next selector
      }
    }

    if (transactionElements === 0) {
      throw new Error('No transaction list found - MSW may not be working');
    }

    // Simple API call check
    console.log('🔍 Checking API calls...');
    const apiCalls = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/ef/') || url.includes('/api/')) {
        apiCalls.push({
          url: url,
          method: request.method(),
        });
      }
    });

    // Wait for API calls to complete
    await page.waitForTimeout(2000);

    console.log(`📡 Detected ${apiCalls.length} API calls`);
    if (apiCalls.length > 0) {
      apiCalls.forEach((call) => {
        console.log(`  ${call.method} ${call.url}`);
      });
    }

    // Basic page load checks
    const pageLoadChecks = await page.evaluate(() => {
      return {
        title: document.title,
        hasContent: document.body.textContent.length > 100,
        hasSellSense:
          document.body.textContent.includes('SellSense') ||
          document.body.textContent.includes('sellSense'),
      };
    });

    console.log('📊 Page load checks:', pageLoadChecks);

    // Take a screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = `health-check-${timestamp}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    // Final health assessment
    const isHealthy =
      transactionElements > 0 &&
      pageLoadChecks.hasContent &&
      pageLoadChecks.hasSellSense &&
      consoleErrors.length === 0;

    if (isHealthy) {
      console.log('✅ HEALTH CHECK PASSED - Demo is working correctly');
      console.log('✅ MSW appears to be functioning');
      console.log('✅ Transaction data is accessible');
      console.log('✅ No critical errors detected');
      process.exit(0);
    } else {
      console.log('❌ HEALTH CHECK FAILED');
      if (consoleErrors.length > 0) {
        console.log('Console errors:', consoleErrors);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Health check failed with error:', error);

    // Take error screenshot
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const errorScreenshotPath = `health-check-error-${timestamp}.png`;
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      console.log(`📸 Error screenshot saved: ${errorScreenshotPath}`);
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError);
    }

    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

// Simple CLI argument parsing
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--url':
      process.env.TARGET_URL = args[i + 1];
      i++;
      break;
    case '--headless':
      process.env.HEADLESS = args[i + 1];
      i++;
      break;
    case '--help':
      console.log(`
Simple Health Check for Embedded Finance Demo

Usage: node health-check.js [options]

Options:
  --url <url>        Target URL to test (default: embedded-finance-dev.com)
  --headless <bool>  Run browser in headless mode (default: true)
  --help            Show this help message

Examples:
  node health-check.js
  node health-check.js --url "https://localhost:3000/sellsense-demo"
  node health-check.js --headless false
      `);
      process.exit(0);
  }
}

// Run the health check
simpleHealthCheck().catch((error) => {
  console.error('Fatal error in health check:', error);
  process.exit(1);
});
