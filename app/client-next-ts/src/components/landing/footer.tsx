import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ApiFlowExplorer } from '../api-flow-explorer';

export function Footer() {
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  return (
    <footer className="bg-jpm-gray-900 text-jpm-white py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-jpm-white rounded-page-sm flex items-center justify-center mr-3">
                <span className="text-jpm-brown font-semibold text-page-small">
                  EF
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-jpm-white text-page-h4 leading-none">
                  Embedded Finance
                </span>
                <span className="text-jpm-gray-300 text-page-small leading-none">
                  Solutions Showcase
                </span>
              </div>
            </div>
            <p className="text-page-body text-jpm-gray-300 leading-relaxed max-w-md">
              Embedded Finance solutions that help you integrate financial
              services directly into your platform with enterprise-grade
              security and reliability.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-jpm-white mb-6 text-page-h4">
              Resources
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/documentation"
                  className="text-jpm-gray-300 hover:text-jpm-white text-page-body transition-colors duration-200"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  to="/github"
                  className="text-jpm-gray-300 hover:text-jpm-white text-page-body transition-colors duration-200"
                >
                  GitHub Repository
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setIsExplorerOpen(true)}
                  className="text-jpm-gray-300 hover:text-jpm-white text-page-body transition-colors duration-200 text-left"
                >
                  API Flow Explorer
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-jpm-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-jpm-gray-300 text-page-small">
              © {new Date().getFullYear()} Embedded Finance Solutions. All
              rights reserved.
            </p>
            <p className="text-jpm-gray-300 text-page-small mt-4 md:mt-0">
              This is a demo application for illustrative purposes only.
            </p>
          </div>
        </div>
      </div>

      {/* API Flow Explorer Modal */}
      <ApiFlowExplorer
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
      />
    </footer>
  );
}
