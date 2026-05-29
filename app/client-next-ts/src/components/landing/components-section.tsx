'use client';

import { useState } from 'react';
import {
  Calendar,
  Check,
  ChevronsUpDown,
  FileText,
  Github,
  ListFilter,
  MapPin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ComponentsSection() {
  const [selectedIndustry, setSelectedIndustry] = useState('Technology');

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
    (opt) => opt.description === selectedIndustry
  );

  const components = [
    {
      id: 'date-selector',
      title: 'Important Date Selector',
      description:
        'Interactive date picker with validation and formatting options',
      icon: <Calendar className="h-5 w-5" />,
      status: 'available',
      githubUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/components/ux/ImportantDateSelector',
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/components/ux/ImportantDateSelector/ANALYSIS.md',
      preview: (
        <div className="rounded-page-md border border-jpm-gray-200 bg-jpm-gray-100 p-3">
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
                  className="w-full rounded-page-sm border border-jpm-gray-300 px-3 py-1.5 text-page-small focus:border-jpm-brown focus:ring-2 focus:ring-jpm-brown"
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
                  className="w-full rounded-page-sm border border-jpm-gray-300 px-3 py-1.5 text-page-small focus:border-jpm-brown focus:ring-2 focus:ring-jpm-brown"
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
      status: 'available',
      githubUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core/OnboardingFlow/components/IndustryTypeSelect',
      preview: (
        <div className="rounded-page-md border border-jpm-gray-200 bg-jpm-gray-100 p-3">
          <div className="w-full">
            <label className="mb-1 block text-page-small font-semibold text-jpm-gray-900">
              Select Industry
            </label>
            <div className="relative">
              <button
                type="button"
                role="combobox"
                aria-expanded={industryOpen}
                onClick={() => setIndustryOpen(!industryOpen)}
                className="flex w-full items-center justify-between rounded-page-sm border border-jpm-gray-300 bg-white px-3 py-1.5 text-page-small font-normal hover:bg-jpm-gray-50 focus:border-jpm-brown focus:ring-2 focus:ring-jpm-brown"
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
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-page-sm border border-jpm-gray-300 bg-white shadow-lg">
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Search industry type..."
                      className="w-full rounded border border-jpm-gray-300 px-2 py-1 text-page-small"
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
                      className="flex w-full items-center px-3 py-2 text-left text-xs hover:bg-jpm-gray-100"
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
        <div className="rounded-page-md border border-jpm-gray-200 bg-jpm-gray-100 p-3 opacity-50">
          <label className="mb-1 block text-page-small font-semibold text-jpm-gray-900">
            Tax ID Format
          </label>
          <div className="mb-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled
              className="cursor-not-allowed rounded-page-sm border-jpm-gray-300 bg-jpm-gray-200 text-page-small text-jpm-gray"
            >
              EIN
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled
              className="cursor-not-allowed rounded-page-sm border-jpm-gray-300 bg-jpm-gray-200 text-page-small text-jpm-gray"
            >
              SSN
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled
              className="cursor-not-allowed rounded-page-sm border-jpm-gray-300 bg-jpm-gray-200 text-page-small text-jpm-gray"
            >
              ITIN
            </Button>
          </div>
          <input
            type="text"
            placeholder="XX-XXXXXXX"
            disabled
            className="w-full cursor-not-allowed rounded-page-sm border border-jpm-gray-300 bg-jpm-gray-200 px-3 py-1.5 text-page-small"
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
        <div className="rounded-page-md border border-jpm-gray-200 bg-jpm-gray-100 p-3 opacity-50">
          <label className="mb-1 block text-page-small font-semibold text-jpm-gray-900">
            Enter Address
          </label>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Street Address"
              disabled
              className="w-full cursor-not-allowed rounded-page-sm border border-jpm-gray-300 bg-jpm-gray-200 px-3 py-1.5 text-page-small"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City"
                disabled
                className="cursor-not-allowed rounded-page-sm border border-jpm-gray-300 bg-jpm-gray-200 px-3 py-1.5 text-page-small"
              />
              <input
                type="text"
                placeholder="State"
                disabled
                className="cursor-not-allowed rounded-page-sm border border-jpm-gray-300 bg-jpm-gray-200 px-3 py-1.5 text-page-small"
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="utility-components" className="bg-sp-bg py-8">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-page-h2 text-jpm-gray-900">
            Explore Utility Components and Microinteractions
          </h2>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {components.map((comp) => (
              <Card
                key={comp.id}
                className="flex h-auto flex-col rounded-page-md border-0 bg-jpm-white shadow-page-card"
              >
                <div className="min-h-[4rem] flex-shrink-0 rounded-t-page-lg border-b border-sp-border bg-sp-accent p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start text-base font-semibold leading-tight">
                      <div className="mr-2 flex-shrink-0 rounded-page-sm border border-sp-border bg-white p-1 text-sp-brand">
                        {comp.icon}
                      </div>
                      <span className="line-clamp-2">{comp.title}</span>
                    </div>
                    <div className="ml-2 flex flex-shrink-0 items-center gap-1">
                      <span
                        className={`rounded-page-sm px-1.5 py-0.5 text-xs font-medium ${
                          comp.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {comp.status === 'available'
                          ? 'Available'
                          : 'Coming Soon'}
                      </span>
                    </div>
                  </div>
                </div>
                <CardContent className="flex flex-1 flex-col p-4">
                  <p className="mb-4 text-sm leading-relaxed text-jpm-gray">
                    {comp.description}
                  </p>

                  <div className="mb-4 flex-1">{comp.preview}</div>

                  {/* Action buttons for available components */}
                  {(comp.githubUrl || comp.recipeUrl) && (
                    <div className="mt-4 flex justify-center gap-3 border-t border-gray-100 pt-3">
                      {comp.githubUrl && (
                        <div className="group relative">
                          <button
                            className="rounded-full bg-gray-100 p-2.5 text-gray-600 transition-colors hover:bg-gray-200"
                            onClick={() =>
                              window.open(comp.githubUrl, '_blank')
                            }
                            title="View Source Code"
                          >
                            <Github className="h-5 w-5" />
                          </button>
                          <div className="absolute -top-11 left-1/2 z-10 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Source Code
                          </div>
                        </div>
                      )}

                      {comp.recipeUrl && (
                        <div className="group relative">
                          <button
                            className="rounded-full border border-sp-border bg-sp-accent p-2.5 text-sp-brand transition-colors hover:bg-white"
                            onClick={() =>
                              window.open(comp.recipeUrl, '_blank')
                            }
                            title="View Implementation Recipe"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          <div className="absolute -top-11 left-1/2 z-10 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                            Implementation Recipe
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
