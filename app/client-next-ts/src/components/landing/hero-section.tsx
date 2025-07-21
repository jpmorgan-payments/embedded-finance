import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

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
        className="bg-jpm-brown-50 border-2 border-jpm-brown-200 rounded-lg px-8 py-6 cursor-pointer hover:bg-jpm-brown-100 transition-colors w-full max-w-lg"
        onClick={() => scrollToSection('demo-applications')}
      >
        <div className="flex justify-center mb-4">
          <span className="text-sm font-medium text-jpm-brown-800 px-3 py-1 bg-jpm-brown-100 rounded-full">
            Demo Applications and Recipes
          </span>
        </div>

        {/* Middle layer - Embedded Components */}
        <div
          className="bg-jpm-brown-100 border-2 border-jpm-brown-300 rounded-lg px-7 py-5 cursor-pointer hover:bg-jpm-brown-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            scrollToSection('embedded-components');
          }}
        >
          <div className="flex justify-center mb-4">
            <span className="text-sm font-medium text-jpm-brown-900 px-3 py-1 bg-jpm-brown-200 rounded-full">
              Embedded Components
            </span>
          </div>

          {/* Innermost layer - Utility Components */}
          <div
            className="bg-jpm-brown-200 border-2 border-jpm-brown-400 rounded-lg px-6 py-4 cursor-pointer hover:bg-jpm-brown-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              scrollToSection('utility-components');
            }}
          >
            <div className="flex justify-center">
              <span className="text-sm font-medium text-jpm-brown-900 px-3 py-1 bg-jpm-brown-300 rounded-full">
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
    <section className="bg-jpm-brown-50 py-6 sm:py-8 md:py-10 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-center">
          {/* Left side - Text content */}
          <div className="max-w-4xl lg:col-span-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-page-hero text-jpm-brown-900 leading-tight mb-4 sm:mb-5 md:mb-6">
              Embedded Finance and Solutions
              <span className="block font-bold text-jpm-brown-800">
                Showcases and Components
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-page-body text-jpm-brown-700 leading-relaxed mb-6 sm:mb-7 md:mb-8 max-w-3xl">
              Discover live demos, engineering recipes, and ready-to-use
              components that unlock the full power of our APIs for embedded
              finance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/demos">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-jpm-brown hover:bg-jpm-brown-700 !text-jpm-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-page-body rounded-page-md shadow-page-card border-0"
                >
                  Explore Demos
                </Button>
              </Link>
              <Link to="/documentation">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-2 border-jpm-brown-600 text-jpm-brown-800 hover:bg-jpm-brown-600 hover:text-jpm-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-page-body rounded-page-md transition-all duration-200"
                >
                  View Documentation
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
