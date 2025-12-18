'use client';

import {
  ArrowRight,
  Building2,
  CheckCircle,
  Circle,
  Info,
  Link,
  Receipt,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  AVAILABLE_COMPONENTS,
  getScenarioByKey,
  getVisibleComponentsForScenario,
  SCENARIO_ORDER,
} from './scenarios-config';
import { useThemeStyles } from './theme-utils';
import type { ThemeOption } from './use-sellsense-themes';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeOption;
}

export function InfoModal({ isOpen, onClose, theme }: InfoModalProps) {
  const themeStyles = useThemeStyles(theme);

  if (!isOpen) return null;

  const getComponentIcon = (componentName: string) => {
    switch (componentName) {
      case 'OnboardingFlow':
        return <Users className="h-4 w-4" />;
      case 'Accounts':
        return <Building2 className="h-4 w-4" />;
      case 'LinkedAccountWidget':
        return <Link className="h-4 w-4" />;
      case 'TransactionsDisplay':
        return <Receipt className="h-4 w-4" />;
      case 'Recipients':
        return <UserCheck className="h-4 w-4" />;
      case 'MakePayment':
        return <Zap className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getScenarioCategoryColor = (category: string) => {
    switch (category) {
      case 'onboarding':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`h-[80vh] w-full max-w-6xl overflow-hidden rounded-lg shadow-2xl ${themeStyles.getModalStyles()}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold">SellSense Demo Showcase</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div
          className="space-y-4 overflow-y-auto p-4 pb-8"
          style={{ height: 'calc(100% - 45px)' }}
        >
          {/* Overview Section */}
          <section>
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Demo Overview
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    What is this demo?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600">
                    This showcase demonstrates the complete client journey
                    through Embedded Finance & Services (EF&S) using our
                    embedded UI components. Each scenario represents a different
                    stage in a client's progress through their financial
                    journey.
                  </p>
                  <p className="text-sm text-gray-600">
                    The demo shows how various embedded components can be
                    integrated into existing applications to provide seamless
                    financial capabilities without requiring users to leave your
                    platform.
                  </p>
                  <p className="text-sm text-gray-600">
                    Everything is fully based on the existing documentation and
                    API specifications from J.P. Morgan Payments.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Key Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Multiple client journey scenarios
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      Real-time component integration
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Theme customization</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">API-driven functionality</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="text-sm">
                      All API operations fully mocked using MSW client-side
                      library - no actual backend calls
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Scenario Visualization */}
          <section>
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Client Journey Visualization
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="w-full">
                  <img
                    src="/diagram.png"
                    alt="SellSense Client Journey Diagram"
                    className="h-auto w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Architecture Diagram */}
          <section>
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Component Architecture
            </h3>
            <Card>
              <CardContent className="p-3">
                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  {/* Development Time */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-blue-600">
                      Development Time
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                        <span>OpenAPI Specification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span>TypeScript Types</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span>React Query Hooks</span>
                      </div>
                    </div>
                  </div>

                  {/* Embedded Components */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-green-600">
                      Embedded UI Components
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>Enhanced Validations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>Smart Payload Formation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>Error Mapping & Recovery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <span>UX Optimizations</span>
                      </div>
                    </div>
                  </div>

                  {/* Runtime */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-purple-600">
                      Runtime
                    </h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                        <span>API Calls</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span>Platform Service Layer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                        <span>Backend APIs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Scenario Progression */}
          <section>
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Client Journey Scenarios
            </h3>
            <div className="space-y-2">
              {SCENARIO_ORDER.map((scenarioKey, index) => {
                const scenario = getScenarioByKey(scenarioKey);
                const visibleComponents = getVisibleComponentsForScenario(
                  scenario.displayName
                );

                return (
                  <Card
                    key={scenarioKey}
                    className="border-l-4 border-l-blue-500"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {scenario.displayName}
                            </CardTitle>
                            <p className="mt-1 text-xs text-gray-600">
                              {scenario.description}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={getScenarioCategoryColor(
                            scenario.category
                          )}
                        >
                          {scenario.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <h5 className="mb-1 text-sm font-medium text-gray-700">
                            Header Information:
                          </h5>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <strong>Title:</strong> {scenario.headerTitle}
                            </p>
                            <p>
                              <strong>Description:</strong>{' '}
                              {scenario.headerDescription}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h5 className="mb-1 text-sm font-medium text-gray-700">
                            Components:
                          </h5>
                          <div className="flex flex-wrap gap-1">
                            {visibleComponents.map((config, compIndex) => (
                              <Badge
                                key={compIndex}
                                variant="outline"
                                className="flex items-center gap-1 text-sm"
                              >
                                <span>
                                  {getComponentIcon(config.component)}
                                </span>
                                {config.component}
                              </Badge>
                            ))}
                            {scenario.category === 'onboarding' && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 text-sm"
                              >
                                <span>
                                  {getComponentIcon('OnboardingFlow')}
                                </span>
                                OnboardingFlow
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Available Components */}
          <section>
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Available Embedded Components
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(AVAILABLE_COMPONENTS).map(
                ([key, componentName]) => (
                  <Card key={key} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getComponentIcon(componentName)}
                        </span>
                        <CardTitle className="text-sm">
                          {componentName}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {componentName === 'OnboardingFlow' &&
                          'Complete client onboarding process with document upload and verification'}
                        {componentName === 'Accounts' &&
                          'Display client accounts with balances and routing information'}
                        {componentName === 'LinkedAccountWidget' &&
                          'Add and manage external bank account connections'}
                        {componentName === 'TransactionsDisplay' &&
                          'View transaction history with filtering and search'}
                        {componentName === 'Recipients' &&
                          'Manage payment recipients and beneficiary information'}
                        {componentName === 'MakePayment' &&
                          'Initiate payments between accounts with multiple methods'}
                      </p>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </section>

          {/* Integration Notes */}
          <section>
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Integration Notes
            </h3>
            <Card>
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-gray-700">
                      Theme Integration
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• All components support comprehensive theming</li>
                      <li>• Design tokens can be customized per brand</li>
                      <li>• Responsive design with mobile optimization</li>
                      <li>• Accessibility compliance built-in</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-gray-700">
                      API Integration
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• Type-safe API calls using generated hooks</li>
                      <li>• Automatic error handling and recovery</li>
                      <li>• Real-time data synchronization</li>
                      <li>• MSW mocking for development</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
