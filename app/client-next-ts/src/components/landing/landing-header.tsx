import { Menu, X } from 'lucide-react';

import { Link } from '@tanstack/react-router';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 bg-jpm-white shadow-sm relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="flex h-14 items-center justify-between sm:h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex items-center">
                <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-page-sm bg-sp-brand sm:mr-3 sm:h-8 sm:w-8">
                  <span className="text-xs font-semibold text-jpm-white sm:text-page-small">
                    EF
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold leading-none text-sp-brand sm:text-lg">
                    Embedded Finance
                  </span>
                  <span className="text-xs leading-none text-jpm-gray sm:text-page-small">
                    Solutions Showcase
                  </span>
                </div>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center space-x-6 md:flex lg:space-x-8">
            <Link
              to="/solutions"
              className="text-sm font-medium text-jpm-gray transition-colors duration-200 hover:text-sp-brand lg:text-page-small"
            >
              DEVELOPER SOLUTIONS
            </Link>
            <Link
              to="/documentation"
              className="text-sm font-medium text-jpm-gray transition-colors duration-200 hover:text-sp-brand lg:text-page-small"
            >
              DOCUMENTATION
            </Link>
            <Link
              to="/stories"
              className="text-sm font-medium text-jpm-gray transition-colors duration-200 hover:text-sp-brand lg:text-page-small"
            >
              RECIPES
            </Link>
            <Link
              to="/github"
              className="text-sm font-medium text-jpm-gray transition-colors duration-200 hover:text-sp-brand lg:text-page-small"
            >
              GITHUB
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <label
              htmlFor="mobile-menu-toggle"
              className="-m-2 cursor-pointer rounded-page-sm p-2 transition-colors hover:bg-jpm-gray-100"
            >
              <input
                type="checkbox"
                id="mobile-menu-toggle"
                className="peer sr-only"
              />

              <Menu className="h-5 w-5 text-jpm-gray peer-checked:hidden sm:h-6 sm:w-6" />
              <X className="hidden h-5 w-5 text-jpm-gray peer-checked:block sm:h-6 sm:w-6" />

              {/* Mobile Menu Dropdown */}
              <div className="absolute left-0 right-0 top-full hidden border-b border-sp-border bg-jpm-white shadow-lg peer-checked:block">
                <nav className="space-y-4 px-4 py-4 sm:px-6">
                  <Link
                    to="/solutions"
                    className="block py-2 text-base font-medium text-jpm-gray transition-colors duration-200 hover:text-sp-brand"
                  >
                    DEVELOPER SOLUTIONS
                  </Link>
                  <Link
                    to="/documentation"
                    className="block py-2 text-base font-medium text-jpm-gray transition-colors duration-200 hover:text-sp-brand"
                  >
                    DOCUMENTATION
                  </Link>
                  <Link
                    to="/stories"
                    className="block py-2 text-base font-medium text-jpm-gray transition-colors duration-200 hover:text-sp-brand"
                  >
                    RECIPES
                  </Link>
                  <Link
                    to="/github"
                    className="block py-2 text-base font-medium text-jpm-gray transition-colors duration-200 hover:text-sp-brand"
                  >
                    GITHUB
                  </Link>
                </nav>
              </div>
            </label>
          </div>
        </div>
      </div>
      {/* Vibrant gradient accent line at bottom of header */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[rgb(226,110,0)] via-[rgb(177,121,207)] to-[rgb(26,123,153)] z-10" />
    </header>
  );
}
