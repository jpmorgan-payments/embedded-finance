export default function PartiallyHostedOnboardingArticle() {
  return (
    <div>
      <p className="mb-6 leading-relaxed text-jpm-gray">
        An onboarded client is an organization or individual on your platform
        who has been given a limited access bank account as part of Embedded
        Payments. Before you and your client can benefit from an Embedded
        Payments account, they must complete the onboarding process. To onboard
        a client, you need to collect basic personal and business information, a
        form of identification (such as an IRS number), and answers to due
        diligence questions served by the API. This partially hosted integration
        pattern enables you to embed a hosted Onboarding UI within your platform
        using an iframe, allowing you to maintain control over the user
        experience while the hosted UI handles regulated KYC verification steps.
        The integration involves session transfer from your backend to obtain a
        short-lived JWT token, which is then used to load the Onboarding UI in a
        secure iframe on your frontend.
      </p>

      <h2 className="text-page-h3 text-jpm-gray-900 mt-8 mb-3">
        Integration Overview
      </h2>
      <p className="mb-6 leading-relaxed text-jpm-gray">
        The integration follows these key steps:
      </p>
      <ol className="mb-6 ml-6 list-decimal space-y-2 leading-relaxed text-jpm-gray">
        <li>
          <strong>Session Initiation:</strong> Your frontend calls your backend
          endpoint (e.g.,{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">
            POST /sessions
          </code>
          ) with a client ID.
        </li>
        <li>
          <strong>Backend Session Transfer:</strong> Your backend authenticates
          the request and calls the Onboarding Service API to create a session,
          receiving a short-lived JWT token (valid for ~60 seconds).
        </li>
        <li>
          <strong>Iframe Embedding:</strong> Your frontend receives the session
          token and URL, then loads the Onboarding UI within a secure iframe
          using the provided URL.
        </li>
        <li>
          <strong>Optional Communication:</strong> The iframe can communicate
          events (completion, errors, status changes) back to your platform via{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">
            window.postMessage
          </code>
          .
        </li>
      </ol>

      <h2 className="text-page-h3 text-jpm-gray-900 mt-8 mb-3">
        Documentation & Resources
      </h2>
      <ul className="mb-6 ml-6 list-disc space-y-3 leading-relaxed text-jpm-gray">
        <li>
          <strong>Integration Guide:</strong>{' '}
          <a
            href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/app/client/src/docs/PARTIALLY_HOSTED_ONBOARDING_INTEGRATION_GUIDE.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sp-brand underline break-words"
          >
            Partially Hosted Onboarding Integration Guide
          </a>{' '}
          — Comprehensive guide with sequence diagrams, API reference, security
          considerations, and implementation patterns for both backend and
          frontend.
        </li>
        <li>
          <strong>Utility Library:</strong>{' '}
          <a
            href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/app/client/src/docs/PARTIALLY_HOSTED_UI_COMPONENT_README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sp-brand underline break-words"
          >
            Partially Hosted UI Component README
          </a>{' '}
          — Optional lightweight JavaScript utility library that simplifies
          iframe mounting, URL construction, theme configuration, and event
          communication. Works with React, Vue, Angular, or vanilla JavaScript.
        </li>
        <li>
          <strong>Sample Implementation:</strong>{' '}
          <a
            href="https://github.com/jpmorgan-payments/embedded-banking/blob/b15e7e3f4b1f2d217fe046aadfbff0efbe29169a/app/server-session-transfer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sp-brand underline break-words"
          >
            server-session-transfer
          </a>{' '}
          — Reference implementation demonstrating Node.js backend with HTML
          frontend, including both direct iframe integration and usage of the
          utility library.
        </li>
      </ul>
    </div>
  );
}
