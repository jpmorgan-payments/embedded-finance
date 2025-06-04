'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  ListFilter,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ComponentsSection() {
  const [selectedDate, setSelectedDate] = useState('2023-05-15');
  const [selectedIndustry, setSelectedIndustry] = useState('Technology');
  const [taxIdFormat, setTaxIdFormat] = useState('EIN');
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const components = [
    {
      id: 'date-selector',
      title: 'Important Date Selector',
      description:
        'Interactive date picker with validation and formatting options',
      icon: <Calendar className="h-5 w-5" />,
      status: 'live',
      preview: (
        <div className="border border-jpm-gray-200 rounded-page-md p-3 bg-jpm-gray-100">
          <label className="block text-page-small font-semibold mb-1 text-jpm-gray-900">
            Select Important Date
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-jpm-gray-300 rounded-page-sm px-3 py-1.5 text-page-small w-full focus:ring-2 focus:ring-jpm-brown focus:border-jpm-brown"
            />
            <Button
              size="sm"
              variant="outline"
              className="border-jpm-gray-300 text-jpm-gray hover:bg-jpm-gray-100 rounded-page-sm"
            >
              Today
            </Button>
          </div>
          <p className="text-page-small text-jpm-gray mt-2">
            Selected: {selectedDate}
          </p>
        </div>
      ),
    },
    {
      id: 'industry-selector',
      title: 'Industry Classification',
      description:
        'Hierarchical selector for industry categories and subcategories',
      icon: <ListFilter className="h-5 w-5" />,
      status: 'live',
      preview: (
        <div className="border border-jpm-gray-200 rounded-page-md p-3 bg-jpm-gray-100">
          <label className="block text-page-small font-semibold mb-1 text-jpm-gray-900">
            Select Industry
          </label>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="border border-jpm-gray-300 rounded-page-sm px-3 py-1.5 text-page-small w-full focus:ring-2 focus:ring-jpm-brown focus:border-jpm-brown"
          >
            <option value="Technology">Technology</option>
            <option value="Finance">Finance</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Retail">Retail</option>
            <option value="Manufacturing">Manufacturing</option>
          </select>
          <p className="text-page-small text-jpm-gray mt-2">
            Selected: {selectedIndustry}
          </p>
        </div>
      ),
    },
    {
      id: 'tax-id',
      title: 'Tax ID Selector',
      description:
        'Configurable input for different tax ID formats with validation',
      icon: <FileText className="h-5 w-5" />,
      status: 'coming-soon',
      preview: (
        <div className="border border-jpm-gray-200 rounded-page-md p-3 bg-jpm-gray-100 opacity-50">
          <label className="block text-page-small font-semibold mb-1 text-jpm-gray-900">
            Tax ID Format
          </label>
          <div className="flex gap-2 mb-2">
            <Button
              size="sm"
              variant="outline"
              disabled
              className="text-page-small rounded-page-sm border-jpm-gray-300 text-jpm-gray bg-jpm-gray-200 cursor-not-allowed"
            >
              EIN
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled
              className="text-page-small rounded-page-sm border-jpm-gray-300 text-jpm-gray bg-jpm-gray-200 cursor-not-allowed"
            >
              SSN
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled
              className="text-page-small rounded-page-sm border-jpm-gray-300 text-jpm-gray bg-jpm-gray-200 cursor-not-allowed"
            >
              ITIN
            </Button>
          </div>
          <input
            type="text"
            placeholder="XX-XXXXXXX"
            disabled
            className="border border-jpm-gray-300 rounded-page-sm px-3 py-1.5 text-page-small w-full bg-jpm-gray-200 cursor-not-allowed"
          />
        </div>
      ),
    },
    {
      id: 'address-selector',
      title: 'Address Validation',
      description:
        'Smart address input with autocomplete and validation capabilities',
      icon: <MapPin className="h-5 w-5" />,
      status: 'coming-soon',
      preview: (
        <div className="border border-jpm-gray-200 rounded-page-md p-3 bg-jpm-gray-100 opacity-50">
          <label className="block text-page-small font-semibold mb-1 text-jpm-gray-900">
            Enter Address
          </label>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Street Address"
              disabled
              className="border border-jpm-gray-300 rounded-page-sm px-3 py-1.5 text-page-small w-full bg-jpm-gray-200 cursor-not-allowed"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City"
                disabled
                className="border border-jpm-gray-300 rounded-page-sm px-3 py-1.5 text-page-small bg-jpm-gray-200 cursor-not-allowed"
              />
              <input
                type="text"
                placeholder="State"
                disabled
                className="border border-jpm-gray-300 rounded-page-sm px-3 py-1.5 text-page-small bg-jpm-gray-200 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  const VISIBLE_COMPONENTS = 3;
  const maxIndex = Math.max(0, components.length - VISIBLE_COMPONENTS);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const getVisibleComponents = () => {
    return components.slice(currentIndex, currentIndex + VISIBLE_COMPONENTS);
  };

  return (
    <section className="py-16 bg-jpm-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 mb-8 text-center text-jpm-gray-900">
            Explore Embedded Components and Microinteractions
          </h2>

          <div className="relative">
            <div className="overflow-hidden">
              <div
                ref={carouselRef}
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${(currentIndex * 100) / VISIBLE_COMPONENTS}%)`,
                  width: `${(components.length * 100) / VISIBLE_COMPONENTS}%`,
                }}
              >
                {components.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex-shrink-0 px-3"
                    style={{ width: `${100 / components.length}%` }}
                  >
                    <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="flex items-center text-page-h4">
                            <div className="bg-jpm-brown-100 p-1.5 rounded-page-md mr-3 text-jpm-brown">
                              {comp.icon}
                            </div>
                            {comp.title}
                          </CardTitle>
                          <span
                            className={`px-2 py-1 text-page-small font-medium rounded-page-sm ${
                              comp.status === 'live'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {comp.status === 'live' ? 'Live' : 'Coming Soon'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <p className="text-page-body text-jpm-gray mb-4">
                          {comp.description}
                        </p>

                        <div className="mb-4">{comp.preview}</div>

                        {comp.status === 'live' ? (
                          <Tabs defaultValue="react" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-jpm-gray-100">
                              <TabsTrigger
                                value="react"
                                className="text-jpm-gray-900 text-page-small"
                              >
                                React
                              </TabsTrigger>
                              <TabsTrigger
                                value="api"
                                className="text-jpm-gray-900 text-page-small"
                              >
                                API
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="react" className="mt-2">
                              <div className="bg-jpm-gray-900 text-jpm-gray-300 p-2 rounded-page-md text-page-small overflow-x-auto">
                                <pre>{`import { ${comp.title.replace(/\s/g, '')} } from '@embedded-finance/ui';

export function MyComponent() {
  return <${comp.title.replace(/\s/g, '')} />;
}`}</pre>
                              </div>
                            </TabsContent>
                            <TabsContent value="api" className="mt-2">
                              <div className="bg-jpm-gray-900 text-jpm-gray-300 p-2 rounded-page-md text-page-small overflow-x-auto">
                                <pre>{`// API Integration
fetch('https://api.embedded-finance.com/v1/${comp.id}', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer $TOKEN' },
  body: JSON.stringify({ /* params */ })
})`}</pre>
                              </div>
                            </TabsContent>
                          </Tabs>
                        ) : (
                          <div className="bg-jpm-gray-100 p-4 rounded-page-md text-center">
                            <p className="text-page-small text-jpm-gray">
                              Code examples will be available when this
                              component is released.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons - only show if we can navigate */}
            {components.length > VISIBLE_COMPONENTS && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-jpm-white rounded-full h-12 w-12 shadow-page-card border-jpm-gray-200 hover:bg-jpm-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={prevSlide}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6 text-jpm-gray" />
                  <span className="sr-only">Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-jpm-white rounded-full h-12 w-12 shadow-page-card border-jpm-gray-200 hover:bg-jpm-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={nextSlide}
                  disabled={currentIndex === maxIndex}
                >
                  <ChevronRight className="h-6 w-6 text-jpm-gray" />
                  <span className="sr-only">Next</span>
                </Button>
              </>
            )}
          </div>

          {/* Position indicators - only show if we can navigate */}
          {components.length > VISIBLE_COMPONENTS && (
            <div className="flex justify-center mt-8 gap-3">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    currentIndex === index ? 'bg-jpm-brown' : 'bg-jpm-gray-300'
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to position ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
