import { Link } from '@tanstack/react-router';

import { ArazzoFlowDialogContent } from '@/components/api-flow-explorer/arazzo-flow-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function Footer() {
  return (
    <footer className="bg-jpm-gray-900 py-8 text-jpm-white sm:py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-page-sm bg-jpm-white">
                <span className="text-page-small font-semibold text-sp-brand">
                  EF
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-page-h4 font-semibold leading-none text-jpm-white">
                  Embedded Finance
                </span>
                <span className="text-page-small leading-none text-jpm-gray-300">
                  Solutions Showcase
                </span>
              </div>
            </div>
            <p className="max-w-md text-page-body leading-relaxed text-jpm-gray-300">
              Embedded Finance solutions that help you integrate financial
              services directly into your platform with enterprise-grade
              security and reliability.
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-page-h4 font-semibold text-jpm-white">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/documentation"
                  className="text-page-body text-jpm-gray-300 transition-colors duration-200 hover:text-jpm-white"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  to="/github"
                  className="text-page-body text-jpm-gray-300 transition-colors duration-200 hover:text-jpm-white"
                >
                  GitHub Repository
                </Link>
              </li>
              <li>
                <Dialog>
                  <DialogTrigger asChild>
                    <a
                      href="#"
                      className="text-page-body text-jpm-gray-300 transition-colors duration-200 hover:text-jpm-white"
                      aria-label="Open API Flow Explorer"
                    >
                      API Workflows Explorer (BETA)
                    </a>
                  </DialogTrigger>
                  <DialogContent className="h-[85vh] w-[96vw] max-w-[1600px]">
                    <DialogHeader>
                      <DialogTitle>API Flow Explorer</DialogTitle>
                    </DialogHeader>
                    <ArazzoFlowDialogContent />
                  </DialogContent>
                </Dialog>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-jpm-gray-700 pt-6">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="text-page-small text-jpm-gray-300">
              © {new Date().getFullYear()} Embedded Finance Solutions. All
              rights reserved.
            </p>
            <p className="mt-3 text-page-small text-jpm-gray-300 md:mt-0">
              This is a demo application for illustrative purposes only.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
