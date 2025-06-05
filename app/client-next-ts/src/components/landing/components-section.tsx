'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  ListFilter,
  FileText,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useResponsiveCarousel } from '@/hooks/use-responsive-carousel';

export function ComponentsSection() {
  const [selectedIndustry, setSelectedIndustry] = useState('Technology');
  const carouselRef = useRef<HTMLDivElement>(null);

  // Date selector state
  const [day, setDay] = useState('15');
  const [month, setMonth] = useState('05');
  const [year, setYear] = useState('2023');

  // Industry selector state
  const [industryOpen, setIndustryOpen] = useState(false);

  const monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const industryOptions = [
    {
      code: '541511',
      description: 'Custom Computer Programming Services',
      sector: 'Professional, Scientific, and Technical Services',
    },
    {
      code: '522110',
      description: 'Commercial Banking',
      sector: 'Finance and Insurance',
    },
    {
      code: '621111',
      description: 'Offices of Physicians (except Mental Health Specialists)',
      sector: 'Health Care and Social Assistance',
    },
    {
      code: '445110',
      description: 'Supermarkets and Other Grocery (except Convenience) Stores',
      sector: 'Retail Trade',
    },
    {
      code: '311111',
      description: 'Dog and Cat Food Manufacturing',
      sector: 'Manufacturing',
    },
  ];

  const selectedIndustryData = industryOptions.find(
    (opt) => opt.description === selectedIndustry,
  );

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
          <div className="space-y-1">
            <div
              className="flex flex-nowrap items-end gap-1"
              role="group"
              aria-label="Date input"
            >
              {/* Month Field */}
              <div className="flex w-28 shrink-0 flex-col gap-1">
                <label htmlFor="birth-month" className="text-xs">
                  Month
                </label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger id="birth-month" className="w-full">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent className="z-50 max-h-60">
                    {monthOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Day Field */}
              <div className="flex w-12 shrink-0 flex-col gap-1">
                <label htmlFor="birth-day" className="text-xs">
                  Day
                </label>
                <input
                  id="birth-day"
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="DD"
                  value={day}
                  onChange={(e) => setDay(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-1.5 text-page-small border border-jpm-gray-300 rounded-page-sm focus:ring-2 focus:ring-jpm-brown focus:border-jpm-brown"
                />
              </div>

              {/* Year Field */}
              <div className="flex w-16 shrink-0 flex-col gap-1">
                <label htmlFor="birth-year" className="text-xs">
                  Year
                </label>
                <input
                  id="birth-year"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="YYYY"
                  value={year}
                  onChange={(e) => setYear(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-1.5 text-page-small border border-jpm-gray-300 rounded-page-sm focus:ring-2 focus:ring-jpm-brown focus:border-jpm-brown"
                />
              </div>
            </div>
          </div>
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
          <div className="w-full">
            <label className="block text-page-small font-semibold mb-1 text-jpm-gray-900">
              Select Industry
            </label>
            <div className="relative">
              <button
                type="button"
                role="combobox"
                aria-expanded={industryOpen}
                onClick={() => setIndustryOpen(!industryOpen)}
                className="w-full justify-between font-normal px-3 py-1.5 text-page-small border border-jpm-gray-300 rounded-page-sm focus:ring-2 focus:ring-jpm-brown focus:border-jpm-brown bg-white hover:bg-jpm-gray-50 flex items-center"
              >
                {selectedIndustryData ? (
                  <div className="flex w-[calc(100%-2rem)] text-left">
                    <span className="font-medium">
                      [{selectedIndustryData.code}]
                    </span>
                    <span className="overflow-hidden text-ellipsis pl-1 text-jpm-gray-600">
                      {selectedIndustryData.sector}
                    </span>
                    <span className="overflow-hidden text-ellipsis pl-2">
                      {selectedIndustryData.description}
                    </span>
                  </div>
                ) : (
                  'Select industry type'
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>

              {industryOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-jpm-gray-300 rounded-page-sm shadow-lg max-h-60 overflow-auto">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search industry type..."
                      className="w-full px-2 py-1 text-page-small border border-jpm-gray-300 rounded"
                    />
                  </div>
                  {industryOptions.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      onClick={() => {
                        setSelectedIndustry(option.description);
                        setIndustryOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-jpm-gray-100 flex items-center"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedIndustry === option.description
                            ? 'opacity-100'
                            : 'opacity-0'
                        }`}
                      />
                      <span className="flex w-full items-center justify-between">
                        [{option.sector}] {option.description}
                        <span className="pl-2 text-jpm-gray-600">
                          {option.code}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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

  const {
    currentIndex,
    nextSlide,
    prevSlide,
    goToSlide,
    transformPercent,
    containerWidthPercent,
    itemWidthPercent,
    canNavigate,
    canGoNext,
    canGoPrev,
    totalSlides,
  } = useResponsiveCarousel({
    totalItems: components.length,
  });

  return (
    <section className="py-8 bg-jpm-gray-100">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 mb-4 text-center text-jpm-gray-900">
            Explore Utility Components and Microinteractions
          </h2>

          <div className="relative">
            <div
              className="overflow-x-hidden overflow-y-visible"
              style={{ isolation: 'isolate' }}
            >
              <div
                ref={carouselRef}
                className="flex transition-transform duration-300 ease-in-out"
                style={{
                  transform: `translateX(-${transformPercent}%)`,
                  width: `${containerWidthPercent}%`,
                }}
              >
                {components.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex-shrink-0 px-2 sm:px-3 md:px-3 pb-4"
                    style={{ width: `${itemWidthPercent}%` }}
                  >
                    <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="flex items-center text-lg sm:text-xl md:text-page-h4">
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
                      <CardContent className="p-4 sm:p-5 md:p-6">
                        <p className="text-sm sm:text-base md:text-page-body text-jpm-gray mb-4">
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
            {canNavigate && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-3 md:-translate-x-4 bg-jpm-white rounded-full h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 shadow-page-card border-jpm-gray-200 hover:bg-jpm-gray-100 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  onClick={prevSlide}
                  disabled={!canGoPrev}
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-jpm-gray" />
                  <span className="sr-only">Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-3 md:translate-x-4 bg-jpm-white rounded-full h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 shadow-page-card border-jpm-gray-200 hover:bg-jpm-gray-100 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  onClick={nextSlide}
                  disabled={!canGoNext}
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-jpm-gray" />
                  <span className="sr-only">Next</span>
                </Button>
              </>
            )}
          </div>

          {/* Position indicators - only show if we can navigate */}
          {canNavigate && (
            <div className="flex justify-center mt-6 md:mt-8 gap-2 md:gap-3">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    currentIndex === index ? 'bg-jpm-brown' : 'bg-jpm-gray-300'
                  }`}
                  onClick={() => goToSlide(index)}
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
