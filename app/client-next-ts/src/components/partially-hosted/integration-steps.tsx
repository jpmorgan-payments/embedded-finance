export interface IntegrationStep {
  label: string;
  title: string;
  description: string;
  details: string[];
  code: string;
  language: string;
  highlight?: number[];
}

export const integrationSteps: IntegrationStep[] = [
  {
    label: 'Overview',
    title: 'Integration overview',
    description:
      "See how your frontend, backend, and JPMorgan's hosted embedded finance components work together end‑to‑end. Works with all 6 components: Accounts, Recipients, MakePayment, TransactionsDisplay, OnboardingFlow, and LinkedAccountWidget.",
    details: [
      'User starts onboarding from your platform (for example, by clicking “Open wallet”).',
      'Your frontend calls your backend to create a session for the selected component.',
      'Your backend calls the JPMorgan Embedded Finance Service to get a short‑lived session token and URL.',
      'Your frontend embeds the hosted UI component in an iframe using the returned URL.',
      'Inside the iframe, the hosted component exchanges the short‑lived session token for a more secure token via POST /init.',
      'All subsequent banking APIs (for example, GET /clients/:id, POST /payments, GET /accounts) are called with the secure token, which is never exposed to your frontend.',
    ],
    code: `// High-level integration flow
// 1. User clicks action in your app (e.g., "Open wallet", "Make payment", "View accounts")
// 2. Frontend → Your backend: POST /sessions { clientId, experienceType }
// 3. Your backend → JPMorgan Embedded Finance Service: create session (type: "EMBEDDED_UI")
// 4. Embedded Finance Service → Backend: returns { id, type, target, url, token }
// 5. Backend → Frontend: return { url, token } (short-lived session token)
// 6. Frontend: mount <iframe src={url} />  // token is embedded in the URL
// 7. Hosted component (inside iframe) → Service: POST /init (exchange short-lived token for secure token)
// 8. Hosted component → Banking APIs: GET /clients/:id, POST /payments, GET /accounts, etc. with Authorization: Bearer {secureToken}
// 9. Component events (completion, errors, etc.) flow back via webhooks and/or postMessage to your platform`,
    language: 'typescript',
    highlight: [2, 3, 5, 6, 7],
  },
  {
    label: 'Backend API',
    title: 'Backend: POST /sessions (session transfer)',
    description:
      'A backend endpoint that calls the Embedded Finance Service to create a short‑lived session for any of the 6 embedded components (Accounts, Recipients, MakePayment, TransactionsDisplay, OnboardingFlow, LinkedAccountWidget).',
    details: [
      'Expose POST /sessions on your backend; authenticate the caller (your logged‑in user).',
      'Call the Embedded Finance Service with type "EMBEDDED_UI" and the target client identifier.',
      'Optionally specify the experienceType (e.g., "HOSTED_DOC_UPLOAD_ONBOARDING_UI" for onboarding) in the request.',
      'Handle error responses (such as 400, 404, 422, or 500) with retries or user‑friendly messages.',
      'Return the full URL and short‑lived session token to your frontend.',
    ],
    code: `// Your backend: POST /sessions
app.post('/sessions', authenticateUser, async (req, res) => {
  const { clientId, experienceType } = req.body;

  try {
    // 1. Call JPMorgan Embedded Finance Service to create a session
    const response = await fetch(JPMORGAN_EMBEDDED_FINANCE_URL + '/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${JPMORGAN_API_KEY}\`,
      },
      body: JSON.stringify({
        type: 'EMBEDDED_UI',
        target: {
          id: clientId, // your client ID
          type: 'CLIENT', // or 'PARTY'
        },
        // Optional: specify which component experience (e.g., 'HOSTED_DOC_UPLOAD_ONBOARDING_UI')
        ...(experienceType && { experienceType }),
      }),
    });

    if (!response.ok) {
      // Handle 4xx / 5xx responses and apply retry policy if appropriate
      return res.status(response.status).json({ error: 'Session creation failed' });
    }

    const data = await response.json();
    // Response includes: { id, type, target, url, token }

    // 2. Return URL + short-lived session token to your frontend
    return res.json({
      url: data.url, // used directly as iframe src
      token: data.token, // short-lived session token (~60s)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Session creation failed' });
  }
});`,
    language: 'typescript',
    highlight: [6, 13, 14, 19, 32, 33],
  },
  {
    label: 'Get token',
    title: 'Frontend: request session from your backend',
    description:
      'When a user initiates an embedded finance action, your frontend calls your backend to obtain the session URL and short‑lived session token for the selected component.',
    details: [
      'Send an authenticated POST /sessions request from your app when the user clicks an action (e.g., "Open wallet", "Make payment", "View accounts").',
      'Pass the clientId (or another stable client identifier) and optionally the experienceType in the request body.',
      'Show a loading indicator while the session is being created.',
      'Handle non‑200 responses and show a clear error state if something fails.',
    ],
    code: `// Frontend: trigger embedded component session creation
const [loading, setLoading] = useState(false);
const [session, setSession] = useState<{ url: string; token: string } | null>(
  null,
);

async function handleStartComponent(experienceType?: string) {
  setLoading(true);

  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${userAccessToken}\`,
      },
      body: JSON.stringify({
        clientId: currentUser.clientId,
        // Optional: specify which component (e.g., 'HOSTED_DOC_UPLOAD_ONBOARDING_UI')
        ...(experienceType && { experienceType }),
      }),
    });

    if (!response.ok) throw new Error('Session creation failed');

    const data = await response.json();
    // { url: 'https://embedded.jpmorgan.com/component?token=...', token: '{short_lived_session_token}' }
    setSession(data);
  } catch (error) {
    console.error('Failed to start component', error);
    // TODO: surface an error message in your UI
  } finally {
    setLoading(false);
  }
}`,
    language: 'typescript',
    highlight: [10, 17, 19, 25, 27],
  },
  {
    label: 'Embed iframe',
    title: 'Frontend: embed the hosted component iframe',
    description:
      'Use the URL from your backend response directly as the iframe src – the short‑lived session token is already embedded. Works for all 6 embedded components.',
    details: [
      'Use the exact url from your backend as the iframe src; do not modify it.',
      'Keep the iframe within a dedicated region with a descriptive title for accessibility.',
      'Add a loading indicator and an error message in case the iframe fails to load.',
      'Apply recommended sandbox and referrerpolicy attributes for security.',
    ],
    code: `// Example: embedding any hosted embedded finance component
function EmbeddedComponentFrame({ url, componentName }: { url: string; componentName: string }) {
  if (!url) return null;

  return (
    <section
      className="relative w-full max-w-4xl rounded-lg border bg-background"
      role="region"
      aria-labelledby="component-title"
    >
      <h2 id="component-title" className="sr-only">
        {componentName} application
      </h2>

      {/* Optional loading overlay controlled by component state */}
      <div
        id="component-loader"
        aria-live="polite"
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 text-xs text-muted-foreground"
      >
        Loading {componentName}…
      </div>

      <iframe
        id="component-iframe"
        title={\`JPMorgan \${componentName}\`}
        src={url} // e.g. "https://embedded.jpmorgan.com/component?token={short_lived_session_token}"
        className="h-[520px] w-full rounded-lg border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </section>
  );
}`,
    language: 'tsx',
    highlight: [26, 28],
  },
  {
    label: 'Utility library',
    title: 'Using the PartiallyHostedUIComponent utility',
    description:
      'A lightweight, framework‑agnostic JavaScript helper that mounts the iframe, builds the URL with theme/content tokens, and manages events. Works with all 6 embedded components. See the Partially Hosted UI Component guide for the full API surface and configuration options.',
    details: [
      'Zero‑dependency ES module (partially‑hosted‑ui‑component.mjs) or UMD build.',
      'Constructs the component URL with encoded theme and content tokens for any of the 6 embedded components.',
      'Mounts/unmounts the iframe into a container element.',
      'Provides a simple subscribe/unsubscribe API for lifecycle and component events (onboarding, payment, account, etc.).',
      'Supports runtime updates to theme and content tokens via updateTheme / updateContentTokens.',
      'Refer to the Partially Hosted UI Component guide for a complete reference: https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UTILITY_GUIDE.md',
    ],
    code: `import PartiallyHostedUIComponent from './partially-hosted-ui-component.mjs';

// Initialize once you have a session token from your backend
// Works with all 6 components: Accounts, Recipients, MakePayment, TransactionsDisplay, OnboardingFlow, LinkedAccountWidget
const embeddedUI = new PartiallyHostedUIComponent({
  sessionToken: 'your-short-lived-session-token', // from POST /sessions
  experienceType: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI', // or other component types
  themeTokens: {
    colorScheme: 'light',
    variables: {
      primaryColor: '#0070f3',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '8px',
    },
  },
  contentTokens: {
    locale: 'en-US',
    brandName: 'Your Platform',
    customLabels: {
      submitButton: 'Complete',
      cancelButton: 'Exit',
    },
  },
});

// Mount the hosted component into a container element
embeddedUI.mount('component-container');

// Listen for lifecycle and component events
const unsubscribe = embeddedUI.subscribe((event) => {
  console.log('Component event:', event);

  // Handle component-specific events
  if (event.namespace === 'onboarding' && event.message === 'OnboardingComplete') {
    console.log('Onboarding completed', event.payload);
  }
  if (event.namespace === 'payment' && event.message === 'PaymentComplete') {
    console.log('Payment completed', event.payload);
  }
});

// Later, to stop listening:
// unsubscribe();`,
    language: 'typescript',
    highlight: [1, 4, 5, 11, 18, 24, 33],
  },
  {
    label: 'Theme tokens',
    title: 'Customizing theme tokens',
    description:
      'Apply your brand’s visual language by configuring colors, typography, and layout tokens that get encoded into the iframe URL.',
    details: [
      'Control color scheme (light / dark) and core palette values.',
      'Configure typography: base font family, sizes, and line heights.',
      'Tune layout tokens such as spacing, radius, and shadows.',
      'Tokens are serialized as JSON and URL‑encoded into the onboarding URL.',
      'You can update theme tokens at runtime via updateTheme, which refreshes the iframe.',
    ],
    code: `// Theme token configuration
const themeTokens = {
  colorScheme: 'light', // or 'dark'
  variables: {
    // Color tokens
    primaryColor: '#0070f3',
    secondaryColor: '#1a73e8',
    backgroundColor: '#ffffff',
    surfaceColor: '#f4f5fb',
    textColor: '#111827',
    mutedTextColor: '#6b7280',

    // Typography
    fontFamily: 'system-ui, -apple-system, sans-serif',
    bodyFontSize: '16px',
    headingFontSize: '24px',
    lineHeight: 1.5,

    // Layout & elevation
    borderRadius: '10px',
    spacingUnit: '16px',
    cardShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
  },
};

// Pass into the utility when creating the UI
const onboardingUI = new PartiallyHostedUIComponent({
  sessionToken,
  themeTokens,
});

// Optionally update at runtime (triggers iframe refresh)
onboardingUI.updateTheme({
  colorScheme: 'dark',
  variables: {
    primaryColor: '#60a5fa',
    backgroundColor: '#020617',
    textColor: '#e5e7eb',
  },
});`,
    language: 'typescript',
    highlight: [1, 26, 32],
  },
  {
    label: 'Content tokens',
    title: 'Customizing content tokens',
    description:
      'Localize copy and adjust terminology by passing content tokens that are encoded into the component URL. Content tokens work across all 6 embedded components.',
    details: [
      'Specify locale (for example, en‑US, es‑ES, fr‑FR).',
      'Set your brand name once and use it across all component experiences.',
      'Override button labels, headings, and common messages for each component type.',
      'Update content tokens at runtime to switch language or tone without remounting your entire app.',
    ],
    code: `// Content token configuration (applies to all 6 embedded components)
const contentTokens = {
  // Localization
  locale: 'en-US',

  // Brand label
  brandName: 'Your Platform',

  // Custom labels and messages (component-specific labels available)
  customLabels: {
    submitButton: 'Complete',
    cancelButton: 'Exit',
    nextButton: 'Continue',
    previousButton: 'Go back',
    welcomeMessage: 'Welcome to Your Platform',
    completionMessage: 'All set',
    errorMessage: 'Something went wrong, please try again',
  },
};

// Pass into the utility for any component
const embeddedUI = new PartiallyHostedUIComponent({
  sessionToken,
  contentTokens,
});

// Switch language or tone at runtime
embeddedUI.updateContentTokens({
  locale: 'es-ES',
  brandName: 'Tu Plataforma',
  customLabels: {
    submitButton: 'Finalizar',
  },
});`,
    language: 'typescript',
    highlight: [1, 21, 27],
  },
  {
    label: 'Events & security',
    title: 'Events and security best practices',
    description:
      'Subscribe to lifecycle events from any hosted component and enforce standard security controls at the iframe boundary. Events vary by component type (onboarding, payment, account, etc.).',
    details: [
      'Use the utility’s subscribe API to listen for onboarding and session events.',
      'Validate event.origin when listening to window.postMessage directly.',
      'Keep tokens short‑lived and never log them in production.',
      'Handle component-specific events (e.g., OnboardingComplete, PaymentComplete, AccountLinked) based on the component in use.',
      'Use strict sandbox attributes and a CSP frame‑src directive for the embedded finance domain.',
    ],
    code: `// Example: listening for events via the utility (works for all 6 components)
const unsubscribe = embeddedUI.subscribe((event) => {
  console.log('Component event:', event);

  // Component-specific events
  if (event.namespace === 'onboarding' && event.message === 'OnboardingComplete') {
    handleOnboardingComplete(event.payload);
  }
  if (event.namespace === 'payment' && event.message === 'PaymentComplete') {
    handlePaymentComplete(event.payload);
  }
  if (event.namespace === 'account' && event.message === 'AccountLinked') {
    handleAccountLinked(event.payload);
  }

  // Common session events
  if (event.namespace === 'session' && event.message === 'SessionExpired') {
    // e.g. call your backend to create a new session and refresh the UI
    refreshComponentSession();
  }
});

// If you use window.postMessage directly, always validate origin
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://embedded.jpmorgan.com') {
    console.warn('Ignoring message from unexpected origin', event.origin);
    return;
  }

  // Safe to handle event.data here
  handleTrustedMessage(event.data);
});`,
    language: 'typescript',
    highlight: [2, 6, 9, 17, 25],
  },
];
