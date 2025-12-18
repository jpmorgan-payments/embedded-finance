import React from 'react';
import { HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const OwnershipCalculationsTooltip: React.FC = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="eb-h-6 eb-w-6 eb-shrink-0"
          aria-label="Learn about ownership calculations"
        >
          <HelpCircle className="eb-h-4 eb-w-4 eb-text-muted-foreground hover:eb-text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="eb-max-h-[80vh] eb-max-w-2xl eb-overflow-y-auto eb-text-left"
        sideOffset={8}
      >
        <div className="eb-space-y-4">
          <div>
            <h3 className="eb-mb-2 eb-text-sm eb-font-semibold eb-text-foreground">
              How to Calculate Beneficial Ownership
            </h3>
            <p className="eb-text-xs eb-text-muted-foreground">
              A beneficial owner is any individual who owns{' '}
              <strong className="eb-text-foreground">25% or more</strong> of
              your business. Multiply ownership percentages through each level
              of the chain.
            </p>
          </div>

          <div className="eb-space-y-3">
            <div>
              <div className="eb-mb-1 eb-text-xs eb-font-medium eb-text-green-700">
                ✅ Example: Meets 25% Threshold
              </div>
              <div className="eb-space-y-1 eb-rounded eb-border eb-border-border eb-bg-muted/30 eb-p-2 eb-text-xs">
                <div className="eb-font-medium eb-text-foreground">
                  Monica Geller (Direct)
                </div>
                <div className="eb-text-muted-foreground">
                  Owns 30% of Central Perk Coffee & Cookies directly
                </div>
                <div className="eb-font-mono eb-text-xs eb-text-foreground">
                  Result: 30% ≥ 25% ✅
                </div>
              </div>
            </div>

            <div>
              <div className="eb-mb-1 eb-text-xs eb-font-medium eb-text-green-700">
                ✅ Example: One-Level Chain
              </div>
              <div className="eb-space-y-1 eb-rounded eb-border eb-border-border eb-bg-muted/30 eb-p-2 eb-text-xs">
                <div className="eb-font-medium eb-text-foreground">
                  Ross Geller → Central Perk Coffee → Target
                </div>
                <div className="eb-text-muted-foreground">
                  Ross owns 50% of Central Perk Coffee
                  <br />
                  Central Perk Coffee owns 60% of target
                </div>
                <div className="eb-font-mono eb-text-xs eb-text-foreground">
                  50% × 60% = 30% ≥ 25% ✅
                </div>
              </div>
            </div>

            <div>
              <div className="eb-mb-1 eb-text-xs eb-font-medium eb-text-green-700">
                ✅ Example: Two-Level Chain
              </div>
              <div className="eb-space-y-1 eb-rounded eb-border eb-border-border eb-bg-muted/30 eb-p-2 eb-text-xs">
                <div className="eb-font-medium eb-text-foreground">
                  Rachel Green → Cookie Co. → Central Perk Cookie → Target
                </div>
                <div className="eb-text-muted-foreground">
                  Rachel owns 80% of Cookie Co.
                  <br />
                  Cookie Co. owns 50% of Central Perk Cookie
                  <br />
                  Central Perk Cookie owns 70% of target
                </div>
                <div className="eb-font-mono eb-text-xs eb-text-foreground">
                  80% × 50% × 70% = 28% ≥ 25% ✅
                </div>
              </div>
            </div>

            <div>
              <div className="eb-mb-1 eb-text-xs eb-font-medium eb-text-red-700">
                ❌ Example: Doesn't Meet Threshold
              </div>
              <div className="eb-space-y-1 eb-rounded eb-border eb-border-border eb-bg-muted/30 eb-p-2 eb-text-xs">
                <div className="eb-font-medium eb-text-foreground">
                  Chandler Bing → Bing Enterprises → Target
                </div>
                <div className="eb-text-muted-foreground">
                  Chandler owns 100% of Bing Enterprises
                  <br />
                  Bing Enterprises owns 20% of target
                </div>
                <div className="eb-font-mono eb-text-xs eb-text-foreground">
                  100% × 20% = 20% &lt; 25% ❌
                </div>
              </div>
            </div>

            <div>
              <div className="eb-mb-1 eb-text-xs eb-font-medium eb-text-red-700">
                ❌ Example: Long Chain Dilution
              </div>
              <div className="eb-space-y-1 eb-rounded eb-border eb-border-border eb-bg-muted/30 eb-p-2 eb-text-xs">
                <div className="eb-font-medium eb-text-foreground">
                  Joey Tribbiani → Multiple Companies → Target
                </div>
                <div className="eb-text-muted-foreground">
                  90% → 60% → 50% → 40% chain
                </div>
                <div className="eb-font-mono eb-text-xs eb-text-foreground">
                  90% × 60% × 50% × 40% = 10.8% &lt; 25% ❌
                </div>
              </div>
            </div>
          </div>

          <div className="eb-space-y-2 eb-border-t eb-border-border eb-pt-3">
            <div className="eb-text-xs eb-font-medium eb-text-foreground">
              Key Tips:
            </div>
            <ul className="eb-list-disc eb-space-y-1 eb-pl-4 eb-text-xs eb-text-muted-foreground">
              <li>Multiply percentages through each level (don't add)</li>
              <li>Each additional layer can reduce the final percentage</li>
              <li>
                If someone owns through multiple paths, add those totals
                together
              </li>
              <li>Exactly 25% counts as meeting the requirement</li>
            </ul>
          </div>

          <div className="eb-border-t eb-border-border eb-pt-3">
            <div className="eb-mb-1 eb-text-xs eb-font-medium eb-text-foreground">
              Common Mistake:
            </div>
            <div className="eb-text-xs eb-text-muted-foreground">
              ❌ Don't add: 50% + 60% = 110%
              <br />✅ Multiply: 50% × 60% = 30%
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
