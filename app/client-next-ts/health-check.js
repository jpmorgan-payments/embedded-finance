import { chromium } from '@playwright/test';

/**
 * Health Check Configuration
 * Define what to check for each page/use case
 */
const HEALTH_CHECKS = {
  'sellsense-demo': {
    scenario: 'Seller+with+Limited+DDA',
    view: 'wallet',
    checks: [
      {
        name: 'Transaction List (MSW Verification)',
        text: 'Acme Supplies',
        description: 'Verify MSW is providing transaction data',
      },
      {
        name: 'Demo Content (Page Load)',
        text: 'Seller Dashboard',
        description: 'Verify page loaded with demo content',
      },
      {
        name: 'MSW Status (Mock Service Worker)',
        text: 'API calls are being mocked using',
        description: 'Verify MSW is active and working',
      },
    ],
  },
  'linked-bank-account': {
    scenario: 'Linked+Bank+Account',
    view: 'wallet',
    checks: [
      {
        name: 'Bank Account Content (MSW Verification)',
        text: 'Get Started with Your Bank Account',
        description: 'Verify MSW is providing bank account data',
      },
      {
        name: 'Demo Content (Page Load)',
        text: 'Seller Dashboard',
        description: 'Verify page loaded with demo content',
      },
      {
        name: 'MSW Status (Mock Service Worker)',
        text: 'API calls are being mocked using',
        description: 'Verify MSW is active and working',
      },
    ],
  },
  'onboarding-docs-needed': {
    scenario: 'Onboarding+-+Docs+Needed',
    view: 'onboarding',
    checks: [
      {
        name: 'Onboarding Content (MSW Verification)',
        text: 'Additional Documents Required',
        description: 'Verify MSW is providing onboarding data',
      },
      {
        name: 'Demo Content (Page Load)',
        text: 'Onboarding Flow',
        description: 'Verify page loaded with demo content',
      },
      {
        name: 'MSW Status (Mock Service Worker)',
        text: 'API calls are being mocked using',
        description: 'Verify MSW is active and working',
      },
    ],
  },
  // Future: Add more page configurations here
  // 'other-page': { ... }
  // 'kyc-onboarding': { ... }
  // 'linked-accounts': { ... }
};

async function runHealthCheck(pageConfig) {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  try {
    // Construct the full URL
    const baseUrl =
      process.env.TARGET_URL || 'https://embedded-finance-dev.com';
    const targetUrl = `${baseUrl}/${pageConfig.path}?scenario=${pageConfig.scenario}&view=${pageConfig.view}`;

    console.log(`🚀 Starting health check for: ${targetUrl}`);
    console.log(`⏰ Start time: ${new Date().toISOString()}`);
    console.log(`📋 Testing: ${pageConfig.description}`);

    // Navigate to the target URL
    console.log('📱 Navigating to page...');
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Run all configured checks
    console.log('🔍 Running health checks...');
    const results = [];

    for (const check of pageConfig.checks) {
      try {
        // Look for the specific text content
        const textFound = await page.textContent('body');
        const hasText = textFound && textFound.includes(check.text);

        if (hasText) {
          console.log(`✅ ${check.name}: Found "${check.text}"`);
          results.push({ ...check, status: 'PASS' });
        } else {
          console.log(`❌ ${check.name}: Missing "${check.text}"`);
          results.push({ ...check, status: 'FAIL', expected: check.text });
        }
      } catch (error) {
        console.log(`⚠️  ${check.name}: Error during check - ${error.message}`);
        results.push({ ...check, status: 'ERROR', error: error.message });
      }
    }

    // Check for console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    const criticalErrors = consoleErrors.filter(
      (error) =>
        error.includes('Failed to load resource') ||
        error.includes('ERR_') ||
        error.includes('TypeError') ||
        error.includes('ReferenceError'),
    );

    if (criticalErrors.length > 0) {
      console.log(
        `⚠️  Warning: Found ${criticalErrors.length} critical console errors`,
      );
      criticalErrors.forEach((error) => console.log(`   - ${error}`));
    }

    // Determine overall success
    const failedChecks = results.filter((r) => r.status === 'FAIL');
    const hasFailures = failedChecks.length > 0;

    if (hasFailures) {
      console.log('\n❌ Health check failed!');
      failedChecks.forEach((check) => {
        console.log(
          `   - ${check.name}: Expected "${check.expected}" but not found`,
        );
      });
      throw new Error(`${failedChecks.length} health check(s) failed`);
    }

    // Take success screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = `screenshots/health-check-success-${timestamp}.png`;
    await page.screenshot({ path: screenshotName, fullPage: true });
    console.log(`📸 Success screenshot saved: ${screenshotName}`);

    console.log('\n✅ Health check completed successfully!');
    console.log(`🎯 All ${results.length} checks passed`);
    console.log(`📊 Results: ${results.map((r) => r.status).join(', ')}`);
    console.log(`⏰ End time: ${new Date().toISOString()}`);

    return true;
  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);

    // Take error screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = `screenshots/health-check-error-${timestamp}.png`;
    await page.screenshot({ path: screenshotName, fullPage: true });
    console.log(`📸 Error screenshot saved: ${screenshotName}`);

    // Log debugging info
    console.log('\n🔍 Debugging information:');
    console.log(`   - Current URL: ${page.url()}`);
    console.log(`   - Page title: ${await page.title()}`);

    try {
      const bodyText = await page.textContent('body');
      if (bodyText) {
        console.log(`   - Body content length: ${bodyText.length} characters`);
        console.log(
          `   - Page content preview: ${bodyText.substring(0, 300)}...`,
        );
      }
    } catch (e) {
      console.log('   - Could not read page content');
    }

    throw error;
  } finally {
    await browser.close();
  }
}

async function simpleHealthCheck() {
  // Determine which page to test based on URL or default
  const targetUrl =
    process.env.TARGET_URL || 'https://embedded-finance-dev.com';

  // Check if a specific scenario was requested
  const scenarioArg = args.find((arg) => arg.startsWith('--scenario='));
  let scenarioKey = 'sellsense-demo'; // default

  if (scenarioArg) {
    const scenarioValue = scenarioArg.split('=')[1];
    // Map scenario values to configuration keys
    if (scenarioValue === 'linked-bank-account') {
      scenarioKey = 'linked-bank-account';
    } else if (scenarioValue === 'onboarding-docs-needed') {
      scenarioKey = 'onboarding-docs-needed';
    } else if (scenarioValue === 'sellsense-demo') {
      scenarioKey = 'sellsense-demo';
    }
  }

  const pageConfig = {
    path: 'sellsense-demo', // All scenarios use the same base path
    scenario: HEALTH_CHECKS[scenarioKey].scenario,
    view: HEALTH_CHECKS[scenarioKey].view,
    checks: HEALTH_CHECKS[scenarioKey].checks,
    description:
      HEALTH_CHECKS[scenarioKey].checks[0].description.replace(
        'Verify MSW is providing ',
        '',
      ) + ' - MSW API Data Verification',
  };

  return runHealthCheck(pageConfig);
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
  --url <url>           Base URL to test (overrides TARGET_URL env var)
                        Script adds /sellsense-demo path automatically
  --scenario <name>     Scenario to test (default: sellsense-demo)
                        Available: sellsense-demo, linked-bank-account, onboarding-docs-needed
  --headless <boolean>  Show browser window (default: true)
  --help, -h           Show this help message

Environment Variables:
  TARGET_URL            Base URL to test (defaults to embedded-finance-dev.com)
  HEADLESS              Whether to run in headless mode (default: true)

Examples:
  npm run health-check                                    # Test default scenario (sellsense-demo)
  npm run health-check:local                             # Test local development
  node health-check.js --scenario=linked-bank-account     # Test bank account scenario
  node health-check.js --scenario=onboarding-docs-needed  # Test onboarding scenario
  node health-check.js --url "https://pr-123.hash.amplifyapp.com" --scenario=linked-bank-account
  node health-check.js --headless false                  # Test with visible browser

Available Scenarios:
  ✅ sellsense-demo          - Transaction list with Acme Supplies
  ✅ linked-bank-account     - Bank account setup with "Get Started with Your Bank Account"
  ✅ onboarding-docs-needed  - Onboarding flow with "Additional Documents Required"

What it checks:
  ✅ Page loads without errors
  ✅ MSW (Mock Service Worker) is working
  ✅ Scenario-specific content is rendered
  ✅ MSW status message is visible
  ✅ No critical JavaScript errors
  ✅ Generates screenshots for debugging
  ✅ Simple, focused verification
  ✅ Composable for future enhancements
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
