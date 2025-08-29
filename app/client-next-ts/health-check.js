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
    // Get target URL from environment variable or use default
    const targetUrl =
      process.env.TARGET_URL ||
      'https://embedded-finance-dev.com/sellsense-demo?scenario=Seller+with+Limited+DDA&view=wallet';

    console.log(`🚀 Starting health check for: ${targetUrl}`);
    console.log(`⏰ Start time: ${new Date().toISOString()}`);

    // Navigate to the target URL
    console.log('📱 Navigating to demo page...');
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the page to load and check for key elements
    console.log('🔍 Checking page elements...');

    // Wait for the main content to load
    await page.waitForSelector(
      '[data-testid="transactions-list"], .transactions-list, [class*="transaction"], [class*="Transaction"]',
      { timeout: 10000 },
    );

    // Look for transaction-related elements (MSW verification)
    const transactionElements = await page.$$(
      '[data-testid="transactions-list"], .transactions-list, [class*="transaction"], [class*="Transaction"], [class*="sellsense"]',
    );

    if (transactionElements.length === 0) {
      throw new Error(
        'No transaction elements found - MSW might not be working',
      );
    }

    console.log(
      `✅ Found ${transactionElements.length} transaction-related elements`,
    );

    // Check for SellSense branding
    const sellSenseElements = await page.$$(
      'text=/sell.?sense/i, [class*="sellsense"], [class*="SellSense"]',
    );
    if (sellSenseElements.length === 0) {
      console.log('⚠️  Warning: SellSense branding not clearly visible');
    } else {
      console.log(
        `✅ Found ${sellSenseElements.length} SellSense branding elements`,
      );
    }

    // Check for console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit more for any dynamic content
    await page.waitForTimeout(2000);

    // Check for critical errors
    const criticalErrors = consoleErrors.filter(
      (error) =>
        error.includes('Failed to load resource') ||
        error.includes('ERR_') ||
        error.includes('TypeError') ||
        error.includes('ReferenceError'),
    );

    if (criticalErrors.length > 0) {
      console.log(
        `⚠️  Warning: Found ${criticalErrors.length} critical console errors:`,
      );
      criticalErrors.forEach((error) => console.log(`   - ${error}`));
    }

    // Take a success screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = `health-check-success-${timestamp}.png`;
    await page.screenshot({ path: screenshotName, fullPage: true });
    console.log(`📸 Success screenshot saved: ${screenshotName}`);

    console.log('✅ Health check completed successfully!');
    console.log(`🎯 Demo is working correctly at: ${targetUrl}`);
    console.log(`📊 Found ${transactionElements.length} transaction elements`);
    console.log(`⏰ End time: ${new Date().toISOString()}`);

    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);

    // Take an error screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = `health-check-error-${timestamp}.png`;
    await page.screenshot({ path: screenshotName, fullPage: true });
    console.log(`📸 Error screenshot saved: ${screenshotName}`);

    // Log additional debugging info
    console.log('🔍 Debugging information:');
    console.log(`   - Current URL: ${page.url()}`);
    console.log(`   - Page title: ${await page.title()}`);

    // Check if page loaded at all
    try {
      const bodyText = await page.textContent('body');
      if (bodyText) {
        console.log(`   - Body content length: ${bodyText.length} characters`);
        if (bodyText.includes('error') || bodyText.includes('Error')) {
          console.log('   - Page contains error text');
        }
      }
    } catch (e) {
      console.log('   - Could not read page content');
    }

    throw error;
  } finally {
    await browser.close();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
🚀 Health Check Script for Embedded Finance Demo

Usage:
  node health-check.js [options]

Options:
  --url <url>           Custom URL to test (overrides TARGET_URL env var)
  --headless <boolean>  Show browser window (default: true)
  --help, -h           Show this help message

Environment Variables:
  TARGET_URL            URL to test (defaults to embedded-finance-dev.com)
  HEADLESS              Whether to run in headless mode (default: true)

Examples:
  npm run health-check                    # Test production
  npm run health-check:local             # Test local development
  node health-check.js --url "https://example.com"  # Test custom URL
  node health-check.js --headless false # Test with visible browser

What it checks:
  ✅ Demo page loads without errors
  ✅ MSW (Mock Service Worker) is working
  ✅ Transaction data is accessible
  ✅ No critical JavaScript errors
  ✅ Generates screenshots for debugging
`);
  process.exit(0);
}

// Parse custom URL argument
const urlIndex = args.indexOf('--url');
if (urlIndex !== -1 && args[urlIndex + 1]) {
  process.env.TARGET_URL = args[urlIndex + 1];
}

// Parse headless argument
const headlessIndex = args.indexOf('--headless');
if (headlessIndex !== -1 && args[headlessIndex + 1]) {
  process.env.HEADLESS = args[headlessIndex + 1];
}

// Run the health check
simpleHealthCheck()
  .then(() => {
    console.log('🎉 Health check completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Health check failed:', error.message);
    process.exit(1);
  });
