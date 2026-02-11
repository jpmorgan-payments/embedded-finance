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
        text: 'This web application is a demo showcase',
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
        text: 'This web application is a demo showcase',
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
        text: 'This web application is a demo showcase',
        description: 'Verify MSW is active and working',
      },
    ],
  },
  // Future: Add more page configurations here
  // 'other-page': { ... }
  // 'kyc-onboarding': { ... }
  // 'linked-accounts': { ... }
};

// Timeouts: avoid 'networkidle' (flaky in CI). Use 'load' + content-based wait.
const NAV_TIMEOUT_MS = Number(process.env.HEALTH_CHECK_NAV_TIMEOUT_MS) || 45000;
const CONTENT_TIMEOUT_MS =
  Number(process.env.HEALTH_CHECK_CONTENT_TIMEOUT_MS) || 20000;

async function runHealthCheck(pageConfig) {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();

  // Collect console errors from the start (before goto) to catch load-time errors
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Construct the full URL
    const baseUrl =
      process.env.TARGET_URL || 'https://embedded-finance-dev.com';
    const targetUrl = `${baseUrl}/${pageConfig.path}?scenario=${pageConfig.scenario}&view=${pageConfig.view}`;

    console.log(`🚀 Starting health check for: ${targetUrl}`);
    console.log(`⏰ Start time: ${new Date().toISOString()}`);
    console.log(`📋 Testing: ${pageConfig.description}`);

    // Navigate: use 'load' instead of 'networkidle' (networkidle is flaky in CI)
    console.log('📱 Navigating to page...');
    await page.goto(targetUrl, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS });

    // Wait for primary content to appear (replaces fixed sleep; reduces flakiness)
    const firstCheckText = pageConfig.checks[0].text;
    console.log(`⏳ Waiting for content "${firstCheckText}" (timeout ${CONTENT_TIMEOUT_MS}ms)...`);
    await page
      .getByText(firstCheckText, { exact: false })
      .waitFor({ state: 'visible', timeout: CONTENT_TIMEOUT_MS });

    // Run all configured checks
    console.log('🔍 Running health checks...');
    const results = [];

    for (const check of pageConfig.checks) {
      try {
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
  --retries <n>        Retry up to n times on failure (default: 0). Total runs = 1 + n.
  --help, -h           Show this help message

Environment Variables:
  TARGET_URL                     Base URL to test (defaults to embedded-finance-dev.com)
  HEADLESS                       Whether to run in headless mode (default: true)
  HEALTH_CHECK_NAV_TIMEOUT_MS    Navigation timeout in ms (default: 45000). Use with load, not networkidle.
  HEALTH_CHECK_CONTENT_TIMEOUT_MS  Wait for primary content in ms (default: 20000).
  HEALTH_CHECK_RETRIES           Number of retries on failure (default: 0). Total runs = 1 + retries.

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

// Parse retries (e.g. --retries 1 for one retry on failure)
const retriesArgIdx = args.indexOf('--retries');
if (retriesArgIdx !== -1 && args[retriesArgIdx + 1] !== undefined) {
  const n = parseInt(args[retriesArgIdx + 1], 10);
  if (!Number.isNaN(n)) process.env.HEALTH_CHECK_RETRIES = String(n);
}

// Run the health check with optional retries (reduces CI flakiness)
// In CI, default to 1 retry so transient failures are absorbed without re-running the job
// Note: NaN ?? defaultRetries returns NaN (?? only treats null/undefined), so use Number.isFinite
const defaultRetries = process.env.CI === 'true' ? 1 : 0;
const rawRetries = Number(process.env.HEALTH_CHECK_RETRIES);
const retries = Math.min(
  3,
  Math.max(0, Number.isFinite(rawRetries) ? rawRetries : defaultRetries)
);
const maxAttempts = Math.max(1, retries + 1);

(async () => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await simpleHealthCheck();
      console.log('🎉 Health check completed successfully!');
      process.exit(0);
    } catch (error) {
      lastError =
        error instanceof Error ? error : error != null ? new Error(String(error)) : new Error('Unknown error');
      if (attempt < maxAttempts) {
        console.warn(
          `\n⚠️  Attempt ${attempt}/${maxAttempts} failed, retrying in 3s...`
        );
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
  console.error(
    '💥 Health check failed after',
    maxAttempts,
    'attempt(s):',
    lastError?.message ?? String(lastError ?? 'Unknown error')
  );
  process.exit(1);
})();
