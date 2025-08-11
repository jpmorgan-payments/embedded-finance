'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  ListFilter,
  FileText,
  MapPin,
  ChevronsUpDown,
  Check,
  Github,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    (opt) => opt.description === selectedIndustry,
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
      status: 'available',
      githubUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core/OnboardingFlow/components/IndustryTypeSelect',
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

  return (
    <section id="utility-components" className="py-8 bg-sp-bg">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 mb-4 text-center text-jpm-gray-900">
            Explore Utility Components and Microinteractions
          </h2>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.map((comp) => (
              <Card
                key={comp.id}
                className="border-0 shadow-page-card bg-jpm-white rounded-page-lg h-auto flex flex-col"
              >
                <div className="bg-sp-accent p-4 min-h-[4rem] flex-shrink-0 rounded-t-page-lg border-b border-sp-border">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start text-base font-semibold leading-tight">
                      <div className="bg-white p-1 rounded-page-sm mr-2 text-sp-brand flex-shrink-0 border border-sp-border">
                        {comp.icon}
                      </div>
                      <span className="line-clamp-2">{comp.title}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded-page-sm ${
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
                <CardContent className="p-4 flex-1 flex flex-col">
                  <p className="text-sm text-jpm-gray leading-relaxed mb-4">
                    {comp.description}
                  </p>

                  <div className="flex-1 mb-4">{comp.preview}</div>

                  {/* Action buttons for available components */}
                  {(comp.githubUrl || comp.recipeUrl) && (
                    <div className="flex justify-center gap-3 mt-4 pt-3 border-t border-gray-100">
                      {comp.githubUrl && (
                        <div className="relative group">
                          <button
                            className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                            onClick={() =>
                              window.open(comp.githubUrl, '_blank')
                            }
                            title="View Source Code"
                          >
                            <Github className="h-5 w-5" />
                          </button>
                          <div className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            Source Code
                          </div>
                        </div>
                      )}

                      {comp.recipeUrl && (
                        <div className="relative group">
                          <button
                            className="p-2.5 rounded-full bg-sp-accent hover:bg-white text-sp-brand transition-colors border border-sp-border"
                            onClick={() =>
                              window.open(comp.recipeUrl, '_blank')
                            }
                            title="View Implementation Recipe"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                          <div className="absolute -top-11 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
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
