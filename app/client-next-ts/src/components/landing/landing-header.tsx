import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export function LandingHeader() {
  return (
    <header className="bg-jpm-white border-b border-jpm-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-jpm-brown rounded-page-sm flex items-center justify-center mr-3">
                  <span className="text-jpm-white font-semibold text-page-small">
                    EF
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-jpm-brown text-lg leading-none">
                    Embedded Finance
                  </span>
                  <span className="text-jpm-gray text-page-small leading-none">
                    Solutions Showcase
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/solutions"
              className="text-jpm-gray hover:text-jpm-brown font-medium text-page-small transition-colors duration-200"
            >
              Solutions
            </Link>
            <Link
              to="/documentation"
              className="text-jpm-gray hover:text-jpm-brown font-medium text-page-small transition-colors duration-200"
            >
              Documentation
            </Link>
            <Link
              to="/github"
              className="text-jpm-gray hover:text-jpm-brown font-medium text-page-small transition-colors duration-200"
            >
              GitHub
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
