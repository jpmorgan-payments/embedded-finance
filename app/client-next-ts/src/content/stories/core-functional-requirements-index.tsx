import { ExternalLink } from 'lucide-react';

import { CORE_COMPONENT_FUNCTIONAL_REQUIREMENTS } from '@/lib/core-functional-requirements-data';
import {
  embeddedComponentsCoreBlob,
  embeddedComponentsCoreTree,
} from '@/lib/embedded-docs-github';

export default function CoreFunctionalRequirementsIndexArticle() {
  return (
    <div className="not-prose max-w-none space-y-10 text-page-body leading-relaxed text-jpm-gray">
      <div className="space-y-3 border-b border-jpm-gray-200 pb-8">
        <p>
          This page cross-references every functional requirements markdown file
          under{' '}
          <code className="rounded bg-jpm-gray-100 px-1.5 py-0.5 font-mono text-page-small text-jpm-gray-900">
            embedded-components/src/core
          </code>{' '}
          for each active core component (primary business components under{' '}
          <code className="rounded bg-jpm-gray-100 px-1.5 py-0.5 font-mono text-page-small text-jpm-gray-900">
            src/core
          </code>
          , excluding legacy-only folders such as OnboardingWizardBasic).
        </p>
        <p>
          Use the links to open the canonical documents on GitHub (default
          branch).
        </p>
      </div>

      <ul className="space-y-8">
        {CORE_COMPONENT_FUNCTIONAL_REQUIREMENTS.map((entry) => {
          const folderTreeUrl = embeddedComponentsCoreTree(entry.folder);
          return (
            <li key={entry.folder} className="list-none">
              <div className="rounded-page-md border border-jpm-gray-200 bg-jpm-gray-50/60 p-5">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <h2 className="text-page-h3 font-semibold text-jpm-gray-900">
                    {entry.title}
                  </h2>
                  <a
                    href={folderTreeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-page-small font-medium text-sp-brand hover:underline"
                  >
                    <span>View folder on GitHub</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                </div>
                <p className="mb-4 text-page-body text-jpm-gray">
                  {entry.description}
                </p>
                <p className="mb-2 text-page-small font-medium uppercase tracking-wide text-jpm-gray-700">
                  Requirement documents
                </p>
                <ul className="list-inside list-disc space-y-2 pl-1 text-page-body marker:text-jpm-gray-400">
                  {entry.docs.map((doc) => {
                    const rel = `${entry.folder}/${doc.file}`;
                    const href = embeddedComponentsCoreBlob(rel);
                    const label = doc.label ?? doc.file;
                    return (
                      <li key={rel}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-sp-brand hover:underline"
                        >
                          {label}
                        </a>
                        <span className="text-jpm-gray-500">
                          {' '}
                          <span className="font-mono text-page-small">
                            ({rel})
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
