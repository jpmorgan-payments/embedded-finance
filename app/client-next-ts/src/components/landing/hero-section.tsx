import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export function HeroSection() {
  return (
    <section className="bg-jpm-gray-100 py-6 sm:py-8 md:py-10 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-page-hero text-jpm-gray-900 leading-tight mb-4 sm:mb-5 md:mb-6">
            Embedded Finance and Solutions
            <span className="block font-bold text-jpm-brown">Showcase</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-page-body text-jpm-gray leading-relaxed mb-6 sm:mb-7 md:mb-8 max-w-3xl">
            In the world of APIs, individual calls rarely stand alone. This
            Showcase is a collection of API workflow recipes and demo platforms
            that demonstrate how our APIs can be used to create powerful and
            efficient experiences.
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
                className="w-full sm:w-auto border-2 border-jpm-brown text-jpm-brown hover:bg-jpm-brown hover:text-jpm-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-page-body rounded-page-md transition-all duration-200"
              >
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
