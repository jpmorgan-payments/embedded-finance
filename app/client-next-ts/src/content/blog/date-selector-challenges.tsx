export default function DateSelectorChallenges() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      

      <p className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed">
        Date input components seem straightforward, but our team learned the
        hard way that they're deceptively complex. After implementing several
        date selectors across our embedded finance platform, we discovered
        critical UX issues that were silently hurting our conversion rates.
      </p>

      <h2 className="text-page-h2 font-semibold text-jpm-blue-800 mt-12 mb-6">
        The Problem We Faced
      </h2>

      <p className="text-page-body text-jpm-gray-700 mb-4 leading-relaxed">
        When building our client onboarding flows, we initially chose what
        seemed like the obvious solution: standard date picker components.
        However, user testing revealed serious friction points that we hadn't
        anticipated.
      </p>

      <p className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed">
        Our support team started receiving complaints about "broken" date
        inputs, particularly from users entering birthdates or document expiry
        dates. What we thought was a simple interface was actually creating
        barriers to completion.
      </p>

      <h2 className="text-page-h2 font-semibold text-jpm-blue-800 mt-12 mb-6">
        The Most Damaging User Errors
      </h2>

      <p className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed">
        Through extensive user research and support ticket analysis, we
        identified the critical patterns outlined in the{' '}
        <a
          href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/components/ux/ImportantDateSelector/ANALYSIS.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-jpm-brown-600 hover:text-jpm-brown-700 underline"
        >
          ImportantDateSelector analysis
        </a>
        . Here are the issues that hurt us most:
      </p>

      <h3 className="text-page-h3 font-semibold text-jpm-blue-700 mt-8 mb-4">
        1. The Year Selection Trap
      </h3>

      <p className="text-page-body text-jpm-gray-700 mb-4 leading-relaxed">
        <strong className="text-jpm-blue-800">The Issue:</strong> Users
        frequently selected incorrect years due to format mismatches between the
        picker interface and display format.
      </p>

      <p className="text-page-body text-jpm-gray-700 mb-4 leading-relaxed">
        <strong className="text-jpm-blue-800">Real Impact:</strong> A user
        selecting "February 10, 2025" would sometimes have the system record
        "2025-10-02" – a completely different date.
      </p>

      <p className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed">
        <strong className="text-jpm-blue-800">Our Learning:</strong> Never
        assume date format consistency across components. Always validate the
        round-trip conversion.
      </p>

      <h3 className="text-page-h3 font-semibold text-jpm-blue-700 mt-8 mb-4">
        2. Calendar Navigation Nightmares
      </h3>

      <p className="text-page-body text-jpm-gray-700 mb-4 leading-relaxed">
        <strong className="text-jpm-blue-800">The Issue:</strong> Calendar-based
        pickers were incredibly inefficient for dates far in the past or future.
      </p>

      <p className="text-page-body text-jpm-gray-700 mb-4 leading-relaxed">
        <strong className="text-jpm-blue-800">User Feedback:</strong> "I had to
        click the back arrow dozens of times to reach my birth year" – this was
        real feedback from a user born in 1990.
      </p>

      <p className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed">
        <strong className="text-jpm-blue-800">The Reality:</strong> Calendar
        views work for scheduling appointments, but they're terrible for
        entering known dates like birthdates or passport expiries.
      </p>

      <h3 className="text-page-h3 font-semibold text-jpm-blue-700 mt-8 mb-4">
        3. Mobile Device Frustrations
      </h3>

      <p className="text-page-body text-jpm-gray-700 mb-4 leading-relaxed">
        <strong className="text-jpm-blue-800">The Issue:</strong> Small touch
        targets and forced calendar navigation created accessibility barriers.
      </p>

      <p className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed">
        <strong className="text-jpm-blue-800">Impact:</strong> Older users and
        those with motor difficulties frequently abandoned the form at the date
        input step.
      </p>

      <h3 className="text-page-h3 font-semibold text-jpm-blue-700 mt-8 mb-4">
        4. Silent Validation Failures
      </h3>

      <p className="text-page-body text-jpm-gray-700 mb-4 leading-relaxed">
        <strong className="text-jpm-blue-800">The Issue:</strong> Users entered
        impossible dates (like February 30) but only discovered errors after
        form submission.
      </p>

      <p className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed">
        <strong className="text-jpm-blue-800">The Result:</strong> Lost user
        sessions and damaged trust in our platform reliability.
      </p>

      <h2 className="text-page-h2 font-semibold text-jpm-blue-800 mt-12 mb-6">
        What This Cost Us
      </h2>

      <p className="text-page-body text-jpm-gray-700 mb-4 leading-relaxed">
        These seemingly minor UX issues had measurable business impact:
      </p>

      <ul className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
        <li>
          <strong className="text-jpm-blue-800">
            High form abandonment rates
          </strong>{' '}
          at date input steps
        </li>
        <li>
          <strong className="text-jpm-blue-800">
            Increased support volume
          </strong>{' '}
          with date-related inquiries
        </li>
        <li>
          <strong className="text-jpm-blue-800">
            Delayed onboarding completions
          </strong>{' '}
          affecting time-to-revenue
        </li>
        <li>
          <strong className="text-jpm-blue-800">
            Accessibility compliance gaps
          </strong>{' '}
          requiring urgent remediation
        </li>
      </ul>

      <h2 className="text-page-h2 font-semibold text-jpm-blue-800 mt-12 mb-6">
        Key Takeaways for Product Teams
      </h2>

      <ol className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed list-decimal pl-6 space-y-2">
        <li>
          <strong className="text-jpm-blue-800">
            Test with Real Users Early:
          </strong>{' '}
          What works for your team doesn't reflect your user base
        </li>
        <li>
          <strong className="text-jpm-blue-800">Consider Context:</strong>{' '}
          Birthday entry needs different UX than appointment scheduling
        </li>
        <li>
          <strong className="text-jpm-blue-800">
            Mobile-First Validation:
          </strong>{' '}
          Touch interfaces expose hidden usability flaws
        </li>
        <li>
          <strong className="text-jpm-blue-800">
            Accessibility Isn't Optional:
          </strong>{' '}
          Screen reader compatibility should be built-in, not retrofitted
        </li>
      </ol>

      <h2 className="text-page-h2 font-semibold text-jpm-blue-800 mt-12 mb-6">
        Our Path Forward
      </h2>

      <p className="text-page-body text-jpm-gray-700 mb-4 leading-relaxed">
        The user research findings led us to completely rethink our approach.
        Instead of patching existing date pickers, we decided to build a
        specialized component designed specifically for "important dates" –
        birthdates, document expiries, and other memorable dates that users know
        by heart.
      </p>

      <p className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed">
        This research directly informed our{' '}
        <a
          href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/components/ux/ImportantDateSelector/ImportantDateSelector.tsx"
          target="_blank"
          rel="noopener noreferrer"
          className="text-jpm-brown-600 hover:text-jpm-brown-700 underline"
        >
          ImportantDateSelector component design
        </a>
        , which prioritizes manual entry over calendar navigation and implements
        robust validation patterns.
      </p>

      <h2 className="text-page-h2 font-semibold text-jpm-blue-800 mt-12 mb-6">
        Questions for Your Team
      </h2>

      <ul className="text-page-body text-jpm-gray-700 mb-6 leading-relaxed list-disc pl-6 space-y-2">
        <li>How often do users abandon forms at your date input steps?</li>
        <li>Have you tested date entry on mobile devices with real users?</li>
        <li>Are your date components accessible to screen reader users?</li>
        <li>
          Do you validate impossible date combinations before form submission?
        </li>
      </ul>

      <p className="text-page-body text-jpm-gray-700 mb-8 leading-relaxed">
        The answers might surprise you – they certainly surprised us.
      </p>

      <hr className="border-jpm-gray-200 my-8" />

      
    </div>
  );
}
