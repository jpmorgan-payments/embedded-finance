import { Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';

function ConceptVisualization() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Outermost layer - Demo Applications */}
      <div
        className="w-full max-w-lg cursor-pointer rounded-md border-2 border-sp-border bg-sp-bg px-8 py-6 transition-colors hover:bg-sp-accent"
        onClick={() => scrollToSection('demo-applications')}
      >
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-sp-accent px-3 py-1 text-sm font-medium text-sp-brand">
            Demo Applications and Recipes
          </span>
        </div>

        {/* Middle layer - Embedded Components */}
        <div
          className="cursor-pointer rounded-md border-2 border-sp-border bg-sp-accent px-7 py-5 transition-colors hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            scrollToSection('embedded-components');
          }}
        >
          <div className="mb-4 flex justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-sp-brand">
              Embedded Components
            </span>
          </div>

          {/* Innermost layer - Utility Components */}
          <div
            className="cursor-pointer rounded-md border-2 border-sp-border bg-white px-6 py-4 transition-colors hover:bg-sp-accent"
            onClick={(e) => {
              e.stopPropagation();
              scrollToSection('utility-components');
            }}
          >
            <div className="flex justify-center">
              <span className="rounded-full bg-sp-accent px-3 py-1 text-sm font-medium text-sp-brand">
                Utility Components
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="bg-sp-bg py-6 sm:py-8 md:py-10 lg:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Left side - Text content */}
          <div className="max-w-4xl lg:col-span-2">
            <h1 className="mb-4 text-3xl leading-tight text-sp-brand sm:mb-5 sm:text-4xl md:mb-6 md:text-5xl lg:text-page-hero">
              Embedded Finance and Solutions
              <span className="block font-bold text-sp-brand">
                Showcases and Components
              </span>
            </h1>

            <p className="mb-6 max-w-3xl text-base leading-relaxed text-jpm-blue sm:mb-7 sm:text-lg md:mb-8 md:text-xl lg:text-page-body">
              Live demos, engineering recipes, and components that unlock the
              full power of Embedded Finance APIs.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/demos">
                <Button
                  size="lg"
                  className="w-full rounded-page-md border-0 bg-sp-brand px-6 py-3 text-sm font-semibold !text-jpm-white shadow-page-card hover:bg-sp-brand-700 sm:w-auto sm:px-8 sm:py-4 sm:text-base lg:text-page-body"
                >
                  EXPLORE DEMOS
                </Button>
              </Link>
              <Link to="/documentation">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full rounded-page-md border-2 border-sp-brand px-6 py-3 text-sm font-semibold text-sp-brand transition-all duration-200 hover:bg-sp-brand hover:text-jpm-white sm:w-auto sm:px-8 sm:py-4 sm:text-base lg:text-page-body"
                >
                  VIEW DOCUMENTATION
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side - Architecture visualization */}
          <div className="flex flex-col items-center lg:col-span-1">
            <ConceptVisualization />
          </div>
        </div>
      </div>
    </section>
  );
}
