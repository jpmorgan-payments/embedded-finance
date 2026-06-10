'use client';

import { Plus, Trash2 } from 'lucide-react';

import type { TestScenarioLoginCaseConfig } from '@/components/test-scenario/test-scenario-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TestDemoScenarioMode } from '@/msw/db';

const ALL_LOGIN_SCENARIOS: TestDemoScenarioMode[] = [
  'happy-path',
  'happy-path-ptc',
  'happy-path-approved',
  'doc-request',
  'linked-account-approved',
  'linked-account-active',
  'multi-linked-start-3',
  'naics-codes-onboarding',
  'naics-codes-doc-request',
  'naics-codes-dashboard',
];

type TestScenarioLoginCasesEditorProps = {
  loginCases: TestScenarioLoginCaseConfig[];
  onChange: (next: TestScenarioLoginCaseConfig[]) => void;
};

function createEmptyLoginCase(index: number): TestScenarioLoginCaseConfig {
  return {
    id: `login-${index}`,
    email: `user-${index}@demo.test`,
    label: 'Custom login case',
    scenario: 'happy-path',
    layout: 'auto',
  };
}

export function TestScenarioLoginCasesEditor({
  loginCases,
  onChange,
}: TestScenarioLoginCasesEditorProps) {
  const updateCase = (
    index: number,
    patch: Partial<TestScenarioLoginCaseConfig>
  ) => {
    onChange(
      loginCases.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const removeCase = (index: number) => {
    onChange(loginCases.filter((_, i) => i !== index));
  };

  const addCase = () => {
    onChange([...loginCases, createEmptyLoginCase(loginCases.length + 1)]);
  };

  return (
    <div className="space-y-4">
      {loginCases.map((loginCase, index) => (
        <div
          key={loginCase.id}
          className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-neutral-900">
              Login case {index + 1}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-red-600 hover:text-red-700"
              onClick={() => removeCase(index)}
              disabled={loginCases.length <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Id</label>
              <Input
                value={loginCase.id}
                onChange={(e) => updateCase(index, { id: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Email</label>
              <Input
                value={loginCase.email}
                onChange={(e) => updateCase(index, { email: e.target.value })}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs text-neutral-500">Label</label>
              <Input
                value={loginCase.label}
                onChange={(e) => updateCase(index, { label: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">
                MSW scenario mode
              </label>
              <Select
                value={loginCase.scenario}
                onValueChange={(value) =>
                  updateCase(index, {
                    scenario: value as TestDemoScenarioMode,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_LOGIN_SCENARIOS.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-neutral-500">Layout</label>
              <Select
                value={loginCase.layout ?? 'auto'}
                onValueChange={(value) =>
                  updateCase(index, {
                    layout: value as TestScenarioLoginCaseConfig['layout'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (from scenario)</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={addCase}
      >
        <Plus className="h-4 w-4" />
        Add login case
      </Button>
    </div>
  );
}
