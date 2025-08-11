import { Link } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="bg-jpm-white border-b border-sp-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-sp-brand rounded-page-sm flex items-center justify-center mr-2 sm:mr-3">
                  <span className="text-jpm-white font-semibold text-xs sm:text-page-small">
                    EF
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sp-brand text-sm sm:text-lg leading-none">
                    Embedded Finance
                  </span>
                  <span className="text-jpm-gray text-xs sm:text-page-small leading-none">
                    Solutions Showcase
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link
              to="/solutions"
              className="text-jpm-gray hover:text-sp-brand font-medium text-sm lg:text-page-small transition-colors duration-200"
            >
              DEVELOPER SOLUTIONS
            </Link>
            <Link
              to="/documentation"
              className="text-jpm-gray hover:text-sp-brand font-medium text-sm lg:text-page-small transition-colors duration-200"
            >
              DOCUMENTATION
            </Link>
            <Link
              to="/stories"
              className="text-jpm-gray hover:text-sp-brand font-medium text-sm lg:text-page-small transition-colors duration-200"
            >
              RECIPES
            </Link>
            <Link
              to="/github"
              className="text-jpm-gray hover:text-sp-brand font-medium text-sm lg:text-page-small transition-colors duration-200"
            >
              GITHUB
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <label
              htmlFor="mobile-menu-toggle"
              className="cursor-pointer p-2 -m-2 rounded-page-sm hover:bg-jpm-gray-100 transition-colors"
            >
              <input
                type="checkbox"
                id="mobile-menu-toggle"
                className="peer sr-only"
              />

              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-jpm-gray peer-checked:hidden" />
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-jpm-gray hidden peer-checked:block" />

              {/* Mobile Menu Dropdown */}
              <div className="peer-checked:block hidden absolute top-full left-0 right-0 bg-jpm-white border-b border-sp-border shadow-lg">
                <nav className="px-4 sm:px-6 py-4 space-y-4">
                  <Link
                    to="/solutions"
                    className="block text-jpm-gray hover:text-sp-brand font-medium text-base transition-colors duration-200 py-2"
                  >
                    DEVELOPER SOLUTIONS
                  </Link>
                  <Link
                    to="/documentation"
                    className="block text-jpm-gray hover:text-sp-brand font-medium text-base transition-colors duration-200 py-2"
                  >
                    DOCUMENTATION
                  </Link>
                  <Link
                    to="/stories"
                    className="block text-jpm-gray hover:text-sp-brand font-medium text-base transition-colors duration-200 py-2"
                  >
                    RECIPES
                  </Link>
                  <Link
                    to="/github"
                    className="block text-jpm-gray hover:text-sp-brand font-medium text-base transition-colors duration-200 py-2"
                  >
                    GITHUB
                  </Link>
                </nav>
              </div>
            </label>
          </div>
        </div>
      </div>
    </header>
  );
}
