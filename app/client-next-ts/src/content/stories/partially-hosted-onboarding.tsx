export default function PartiallyHostedOnboardingArticle() {
  return (
    <div>
      <p className="mb-6 leading-relaxed text-jpm-gray">
        This recipe outlines a hybrid onboarding pattern where your application
        owns discovery, account setup, and UX orchestration, while regulated
        KYC/KYB verification steps are delegated to embedded components. The
        approach accelerates delivery, keeps sensitive flows compliant, and
        preserves full-brand UX for everything else.
      </p>

      <h2 className="text-page-h3 text-jpm-gray-900 mt-8 mb-3">
        Guide & reference
      </h2>
      <p className="mb-6 leading-relaxed text-jpm-gray">
        See the comprehensive integration guide for sequence diagrams, API
        shapes, and edge cases in the official documentation:{' '}
        <a
          href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/app/client/src/docs/PARTIALLY_HOSTED_ONBOARDING_INTEGRATION_GUIDE.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sp-brand underline break-words"
        >
          Partially Hosted Onboarding Integration Guide
        </a>
        .
      </p>
    </div>
  );
}
