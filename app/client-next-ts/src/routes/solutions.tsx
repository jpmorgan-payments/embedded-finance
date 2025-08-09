import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/solutions')({
  component: SolutionsPage,
});

function SolutionsPage() {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'buildItYourself-0': false,
    'buildItYourself-1': false,
    'buildItYourself-2': false,
    dropInUI: false,
    jpmHosted: false,
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cardsRef.current &&
        !cardsRef.current.contains(event.target as Node)
      ) {
        setExpandedCards({
          'buildItYourself-0': false,
          'buildItYourself-1': false,
          'buildItYourself-2': false,
          dropInUI: false,
          jpmHosted: false,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });

      // Handle expandable cards
      if (
        ['build-it-yourself', 'drop-in-ui', 'jpm-hosted'].includes(sectionId)
      ) {
        if (currentSection === sectionId) {
          setExpandedCards(
            Object.keys(expandedCards).reduce(
              (acc, key) => {
                acc[key] = false;
                return acc;
              },
              {} as Record<string, boolean>,
            ),
          );
          setCurrentSection(null);
        } else {
          const newExpandedState = Object.keys(expandedCards).reduce(
            (acc, key) => {
              acc[key] = false;
              return acc;
            },
            {} as Record<string, boolean>,
          );

          if (sectionId === 'build-it-yourself') {
            newExpandedState['buildItYourself-0'] = true;
            newExpandedState['buildItYourself-1'] = true;
            newExpandedState['buildItYourself-2'] = true;
          } else if (sectionId === 'drop-in-ui') {
            newExpandedState['dropInUI'] = true;
          } else if (sectionId === 'jpm-hosted') {
            newExpandedState['jpmHosted'] = true;
          }

          setExpandedCards(newExpandedState);
          setCurrentSection(sectionId);
        }
      } else if (
        ['hosted-solution', 'embeddable', 'cookbook', 'arazzo'].includes(
          sectionId,
        )
      ) {
        // Handle example cards
        setActiveCard(activeCard === sectionId ? null : sectionId);
      }
    }
    setIsMobileMenuOpen(false);
  };

  const implementationApproaches = [
    {
      title: 'Fully Hosted UI Solutions',
      description:
        'Turnkey options that handle infrastructure, security, and user interface, allowing consumers to integrate complete, production-ready components with minimal effort.',
      benefit: 'Dramatically reduced implementation time and risk.',
    },
    {
      title: 'Runtime UI Injection',
      description:
        'More flexible options including iframes for easy embedding, server-side composition for seamless integration, and client-side composition (e.g., module federation) for dynamic, performant experiences.',
      benefit: 'Balance between ease of implementation and customization.',
    },
    {
      title: 'Embedded UI Components',
      description:
        'UI components published as npm packages that allow for build-time integration. This approach offers deep customization while still providing pre-built, tested components.',
      benefit: 'Customizable UI with reduced development overhead.',
    },
    {
      title: 'UI/UX Cookbooks',
      description:
        'Detailed, human-readable guidelines for implementing web applications including flow diagrams, sequence diagrams, best practices and code samples.',
      benefit:
        'Clear roadmap for custom implementations, reducing design and architecture time.',
    },
    {
      title: 'Machine-Readable Specifications',
      description:
        'Specifications like Arazzo provide a structured way to describe complex workflows and their underlying APIs. These machine-readable formats enable automated code generation for basic implementations, integration with LLMs to quickly produce skeleton/draft versions of digital experiences, and framework-agnostic approach for any UI library or custom instruction set.',
      benefit: 'Rapid prototyping and reduced boilerplate coding.',
    },
  ];

  // Group implementation approaches into categories for our 3-column layout
  const buildItYourselfOptions = [
    implementationApproaches[2], // Embedded UI Components
    implementationApproaches[3], // UI/UX Cookbooks
    implementationApproaches[4], // Machine-Readable Specifications
  ];

  const dropInUIOption = implementationApproaches[1]; // Runtime UI Injection
  const jpmHostedOption = implementationApproaches[0]; // Fully Hosted UI Solutions

  return (
    <div className="min-h-screen py-16 bg-jpm-gray-100">
      <div className="text-xs text-jpm-gray-600 mb-4 max-w-7xl mx-auto px-6 lg:px-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a
                href="/"
                className="text-jpm-gray-600 hover:text-jpm-gray-900 inline-flex items-center"
              >
                Home
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <span className="text-jpm-gray-400 mx-2">/</span>
                <a
                  href="/solutions"
                  className="text-jpm-gray-600 hover:text-jpm-gray-900"
                >
                  Solutions
                </a>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      <hr className="border-t border-jpm-gray-200 my-4" />

      <div className="grid grid-cols-5 gap-4">
        {/* Mobile Menu Button - improved position */}
        <button
          className="lg:hidden fixed top-24 left-6 z-50 p-2 rounded-md bg-jpm-white shadow-md"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-jpm-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Left Column: Table of Contents - centered on mobile */}
        <div
          className={`${isMobileMenuOpen ? 'fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden' : 'hidden'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-jpm-gray-600 hover:text-jpm-gray-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="p-6 pt-12">
              <ul className="space-y-4 text-sm">
                <li>
                  <a
                    href="#overview"
                    className="text-jpm-gray-900 font-semibold hover:text-jpm-brown"
                  >
                    Overview
                  </a>
                </li>
                <li>
                  <a
                    href="#integration-options"
                    className="text-jpm-gray-900 font-semibold hover:text-jpm-brown"
                  >
                    Integration Options
                  </a>
                  <ul className="ml-4 mt-2 space-y-2">
                    <li>
                      <a
                        href="#build-it-yourself"
                        className="text-jpm-gray-600 hover:text-jpm-gray-900"
                        onClick={(e) => scrollToSection(e, 'build-it-yourself')}
                      >
                        Build It Yourself
                      </a>
                    </li>
                    <li>
                      <a
                        href="#drop-in-ui"
                        className="text-jpm-gray-600 hover:text-jpm-gray-900"
                        onClick={(e) => scrollToSection(e, 'drop-in-ui')}
                      >
                        Drop-in UI
                      </a>
                    </li>
                    <li>
                      <a
                        href="#jpm-hosted"
                        className="text-jpm-gray-600 hover:text-jpm-gray-900"
                        onClick={(e) => scrollToSection(e, 'jpm-hosted')}
                      >
                        JPM Hosted
                      </a>
                    </li>
                  </ul>
                </li>
                <li>
                  <a
                    href="#example"
                    className="text-jpm-gray-900 font-semibold hover:text-jpm-brown"
                  >
                    Digital Onboarding Example
                  </a>
                  <ul className="ml-4 mt-2 space-y-2">
                    <li>
                      <a
                        href="#hosted-solution"
                        className="text-jpm-gray-600 hover:text-jpm-gray-900"
                        onClick={(e) => scrollToSection(e, 'hosted-solution')}
                      >
                        Fully hosted solution
                      </a>
                    </li>
                    <li>
                      <a
                        href="#embeddable"
                        className="text-jpm-gray-600 hover:text-jpm-gray-900"
                        onClick={(e) => scrollToSection(e, 'embeddable')}
                      >
                        Embeddable components
                      </a>
                    </li>
                    <li>
                      <a
                        href="#cookbook"
                        className="text-jpm-gray-600 hover:text-jpm-gray-900"
                        onClick={(e) => scrollToSection(e, 'cookbook')}
                      >
                        Detailed cookbook
                      </a>
                    </li>
                    <li>
                      <a
                        href="#arazzo"
                        className="text-jpm-gray-600 hover:text-jpm-gray-900"
                        onClick={(e) => scrollToSection(e, 'arazzo')}
                      >
                        Arazzo specification
                      </a>
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Desktop Table of Contents */}
        <div className="hidden lg:block col-span-1 px-4">
          <div className="sticky top-16">
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href="#overview"
                  className="text-jpm-gray-900 font-semibold hover:text-jpm-brown"
                  onClick={(e) => scrollToSection(e, 'overview')}
                >
                  Overview
                </a>
              </li>
              <li>
                <a
                  href="#integration-options"
                  className="text-jpm-gray-900 font-semibold hover:text-jpm-brown"
                  onClick={(e) => scrollToSection(e, 'integration-options')}
                >
                  Integration Options
                </a>
                <ul className="ml-4 mt-2 space-y-2">
                  <li>
                    <a
                      href="#build-it-yourself"
                      className="text-jpm-gray-600 hover:text-jpm-gray-900"
                      onClick={(e) => scrollToSection(e, 'build-it-yourself')}
                    >
                      Build It Yourself
                    </a>
                  </li>
                  <li>
                    <a
                      href="#drop-in-ui"
                      className="text-jpm-gray-600 hover:text-jpm-gray-900"
                      onClick={(e) => scrollToSection(e, 'drop-in-ui')}
                    >
                      Drop-in UI
                    </a>
                  </li>
                  <li>
                    <a
                      href="#jpm-hosted"
                      className="text-jpm-gray-600 hover:text-jpm-gray-900"
                      onClick={(e) => scrollToSection(e, 'jpm-hosted')}
                    >
                      JPM Hosted
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                <a
                  href="#example"
                  className="text-jpm-gray-900 font-semibold hover:text-jpm-brown"
                >
                  Digital Onboarding Example
                </a>
                <ul className="ml-4 mt-2 space-y-2">
                  <li>
                    <a
                      href="#hosted-solution"
                      className="text-jpm-gray-600 hover:text-jpm-gray-900"
                      onClick={(e) => scrollToSection(e, 'hosted-solution')}
                    >
                      Fully hosted solution
                    </a>
                  </li>
                  <li>
                    <a
                      href="#embeddable"
                      className="text-jpm-gray-600 hover:text-jpm-gray-900"
                      onClick={(e) => scrollToSection(e, 'embeddable')}
                    >
                      Embeddable components
                    </a>
                  </li>
                  <li>
                    <a
                      href="#cookbook"
                      className="text-jpm-gray-600 hover:text-jpm-gray-900"
                      onClick={(e) => scrollToSection(e, 'cookbook')}
                    >
                      Detailed cookbook
                    </a>
                  </li>
                  <li>
                    <a
                      href="#arazzo"
                      className="text-jpm-gray-600 hover:text-jpm-gray-900"
                      onClick={(e) => scrollToSection(e, 'arazzo')}
                    >
                      Arazzo specification
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-5 lg:col-span-4">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div id="overview" className="text-center mb-16">
              <p className="text-sm font-semibold text-jpm-brown mb-2">
                IMPLEMENTATION OPTIONS
              </p>
              <h1 className="text-page-h2 font-bold text-jpm-gray-900 mb-8">
                Solutions for Every Integration Need
              </h1>
              <div className="bg-jpm-brown py-8 px-4 rounded-t-page-lg">
                <h2 className="text-page-h4 font-bold text-white mb-6">
                  Choose Your Integration Approach
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <ul className="text-left text-white space-y-3">
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Fully hosted turnkey solutions
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Drop-in UI components
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Customizable workflows
                    </li>
                  </ul>
                  <ul className="text-left text-white space-y-3">
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Detailed implementation guides
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Machine-readable specifications
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Developer-friendly tools
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div id="integration-options" className="mb-16" ref={cardsRef}>
              <h2 className="text-page-h3 font-bold text-jpm-gray-900 mb-8">
                Integration Options
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                {/* Column 1: Build It Yourself Options */}
                <div id="build-it-yourself" className="flex flex-col space-y-6">
                  {/* Summary Block with Visualization */}
                  <div className="bg-white rounded-page-lg shadow-page-card border border-jpm-gray-200 hover:shadow-lg transition-all h-[180px] flex flex-col">
                    <div className="bg-jpm-brown-50 p-3 flex items-center justify-center rounded-t-page-lg h-16">
                      <div className="w-10 h-10 flex items-center justify-center text-jpm-brown">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-7 w-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-center">
                      <h2 className="text-page-h4 font-semibold text-jpm-gray-900 mb-2 text-center">
                        Build It Yourself
                      </h2>
                      <p className="text-jpm-gray-600 text-center text-page-small">
                        Fully customizable solutions that give you complete
                        control over the user experience.
                      </p>
                    </div>
                  </div>

                  {buildItYourselfOptions.map((approach, index) => {
                    const cardId = `buildItYourself-${index}`;
                    const isExpanded = expandedCards[cardId];

                    return (
                      <Card
                        key={index}
                        className="border-0 shadow-page-card bg-jpm-white rounded-page-lg overflow-hidden"
                      >
                        <CardHeader
                          className="cursor-pointer hover:bg-jpm-gray-50 transition-colors"
                          onClick={() => toggleCard(cardId)}
                        >
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-page-h4 text-jpm-gray-900">
                              {approach.title}
                            </CardTitle>
                            <div className="text-jpm-gray-600">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </CardHeader>
                        <div
                          className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}
                        >
                          <CardContent className="p-6">
                            <p className="text-page-body text-jpm-gray leading-relaxed mb-4">
                              {approach.description}
                            </p>
                            <div className="bg-jpm-brown-100 p-4 rounded-page-md">
                              <p className="text-page-small font-semibold text-jpm-brown">
                                Key Benefit: {approach.benefit}
                              </p>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Column 2: Drop-in UI */}
                <div id="drop-in-ui" className="flex flex-col space-y-6">
                  {/* Summary Block with Visualization */}
                  <div className="bg-white rounded-page-lg shadow-page-card border border-jpm-gray-200 hover:shadow-lg transition-all h-[180px] flex flex-col">
                    <div className="bg-jpm-brown-50 p-3 flex items-center justify-center rounded-t-page-lg h-16">
                      <div className="w-10 h-10 flex items-center justify-center text-jpm-brown">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-7 w-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-center">
                      <h2 className="text-page-h4 font-semibold text-jpm-gray-900 mb-2 text-center">
                        Drop-in UI
                      </h2>
                      <p className="text-jpm-gray-600 text-center text-page-small">
                        Ready-made UI components that can be easily integrated
                        into your existing applications.
                      </p>
                    </div>
                  </div>

                  <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-jpm-gray-50 transition-colors"
                      onClick={() => toggleCard('dropInUI')}
                    >
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-page-h4 text-jpm-gray-900">
                          {dropInUIOption.title}
                        </CardTitle>
                        <div className="text-jpm-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-transform ${expandedCards['dropInUI'] ? 'transform rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </CardHeader>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${expandedCards['dropInUI'] ? 'max-h-[500px]' : 'max-h-0'}`}
                    >
                      <CardContent className="p-6">
                        <p className="text-page-body text-jpm-gray leading-relaxed mb-4">
                          {dropInUIOption.description}
                        </p>
                        <div className="bg-jpm-brown-100 p-4 rounded-page-md">
                          <p className="text-page-small font-semibold text-jpm-brown">
                            Key Benefit: {dropInUIOption.benefit}
                          </p>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </div>

                {/* Column 3: JPM Hosted */}
                <div id="jpm-hosted" className="flex flex-col space-y-6">
                  {/* Summary Block with Visualization */}
                  <div className="bg-white rounded-page-lg shadow-page-card border border-jpm-gray-200 hover:shadow-lg transition-all h-[180px] flex flex-col">
                    <div className="bg-jpm-brown-50 p-3 flex items-center justify-center rounded-t-page-lg h-16">
                      <div className="w-10 h-10 flex items-center justify-center text-jpm-brown">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-7 w-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-center">
                      <h2 className="text-page-h4 font-semibold text-jpm-gray-900 mb-2 text-center">
                        JPM Hosted
                      </h2>
                      <p className="text-jpm-gray-600 text-center text-page-small">
                        Complete turnkey solutions hosted and maintained by
                        JPMorgan Chase.
                      </p>
                    </div>
                  </div>

                  <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-jpm-gray-50 transition-colors"
                      onClick={() => toggleCard('jpmHosted')}
                    >
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-page-h4 text-jpm-gray-900">
                          {jpmHostedOption.title}
                        </CardTitle>
                        <div className="text-jpm-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-transform ${expandedCards['jpmHosted'] ? 'transform rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </CardHeader>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${expandedCards['jpmHosted'] ? 'max-h-[500px]' : 'max-h-0'}`}
                    >
                      <CardContent className="p-6">
                        <p className="text-page-body text-jpm-gray leading-relaxed mb-4">
                          {jpmHostedOption.description}
                        </p>
                        <div className="bg-jpm-brown-100 p-4 rounded-page-md">
                          <p className="text-page-small font-semibold text-jpm-brown">
                            Key Benefit: {jpmHostedOption.benefit}
                          </p>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            <div id="example" className="rounded-page-lg p-6 mb-4">
              <p className="text-sm font-semibold text-jpm-brown mb-2">
                INTEGRATION EXAMPLE
              </p>
              <h3 className="text-page-h3 font-bold text-jpm-gray-900 mb-2">
                Digital Onboarding Example
              </h3>
              <p className="text-page-body text-jpm-gray-600 mb-8 max-w-3xl mx-auto text-center">
                This multi-faceted approach allows you to choose the
                implementation method that best fits your needs, timeline, and
                resources. Consider a digital onboarding process with these
                different integration approaches:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                {/* Example cards */}
                <div
                  id="hosted-solution"
                  className={`group bg-white rounded-page-md transition-all overflow-hidden ${activeCard === 'hosted-solution' ? 'shadow-lg' : 'shadow-sm'} hover:shadow-lg h-[180px] flex flex-col`}
                >
                  <div className="bg-jpm-brown-50 p-2 flex items-center justify-center">
                    <div className="p-2 rounded-full bg-jpm-brown-100 text-jpm-brown">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-center">
                    <h4 className="font-semibold text-jpm-gray-900 text-center text-sm mb-0.5">
                      Fully hosted solution
                    </h4>
                    <p className="text-page-small text-jpm-gray-600 text-center leading-snug px-2">
                      Complete turnkey implementation for immediate deployment.
                    </p>
                  </div>
                </div>

                <div
                  id="embeddable"
                  className={`group bg-white rounded-page-md transition-all overflow-hidden ${activeCard === 'embeddable' ? 'shadow-lg' : 'shadow-sm'} hover:shadow-lg h-[180px] flex flex-col`}
                >
                  <div className="bg-jpm-brown-50 p-2 flex items-center justify-center">
                    <div className="p-2 rounded-full bg-jpm-brown-100 text-jpm-brown">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-center">
                    <h4 className="font-semibold text-jpm-gray-900 text-center text-sm mb-0.5">
                      Embeddable components
                    </h4>
                    <p className="text-page-small text-jpm-gray-600 text-center leading-snug px-2">
                      Pre-built components for key steps like ID verification.
                    </p>
                  </div>
                </div>

                <div
                  id="cookbook"
                  className={`group bg-white rounded-page-md transition-all overflow-hidden ${activeCard === 'cookbook' ? 'shadow-lg' : 'shadow-sm'} hover:shadow-lg h-[180px] flex flex-col`}
                >
                  <div className="bg-jpm-brown-50 p-2 flex items-center justify-center">
                    <div className="p-2 rounded-full bg-jpm-brown-100 text-jpm-brown">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-center">
                    <h4 className="font-semibold text-jpm-gray-900 text-center text-sm mb-0.5">
                      Detailed cookbook
                    </h4>
                    <p className="text-page-small text-jpm-gray-600 text-center leading-snug px-2">
                      Comprehensive documentation and workflow guides.
                    </p>
                  </div>
                </div>

                <div
                  id="arazzo"
                  className={`group bg-white rounded-page-md transition-all overflow-hidden ${activeCard === 'arazzo' ? 'shadow-lg' : 'shadow-sm'} hover:shadow-lg h-[180px] flex flex-col`}
                >
                  <div className="bg-jpm-brown-50 p-2 flex items-center justify-center">
                    <div className="p-2 rounded-full bg-jpm-brown-100 text-jpm-brown">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="p-2 flex-1 flex flex-col justify-center">
                    <h4 className="font-semibold text-jpm-gray-900 text-center text-sm mb-0.5">
                      Arazzo specification
                    </h4>
                    <p className="text-page-small text-jpm-gray-600 text-center leading-snug px-2">
                      Machine-readable process structure for code generation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
