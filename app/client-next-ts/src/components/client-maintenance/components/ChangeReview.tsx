import { useEffect, useRef, useState } from 'react';
import { PackagePlus, UserMinus, UserPlus } from 'lucide-react';

import type {
  FieldChange,
  MaintenanceProjection,
  PartyChange,
} from '@/components/client-maintenance/utils/build-maintenance-projection';
import { formatMaintenanceValue } from '@/components/client-maintenance/utils/format-maintenance-value';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

function actionClasses(action: PartyChange['action']): string {
  if (action === 'ADD')
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (action === 'DELETE') return 'border-red-200 bg-red-50 text-red-800';
  return 'border-cyan-200 bg-cyan-50 text-cyan-800';
}

function ComparisonRows({ changes }: { changes: FieldChange[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-md border border-gray-200 md:block">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="w-1/4 px-4 py-3 font-semibold">Field</th>
              <th className="w-[37.5%] px-4 py-3 font-semibold">Approved</th>
              <th className="w-[37.5%] px-4 py-3 font-semibold">Proposed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {changes.map((change) => (
              <tr key={change.path} className="align-top">
                <th scope="row" className="px-4 py-4 font-medium text-gray-900">
                  {change.label}
                </th>
                <td className="break-words px-4 py-4 text-gray-600">
                  {formatMaintenanceValue(
                    change.approvedValue,
                    change.path,
                    change.sensitivity
                  )}
                </td>
                <td className="break-words border-l-2 border-sp-brand bg-sp-accent/50 px-4 py-4 font-medium text-gray-950">
                  {formatMaintenanceValue(
                    change.proposedValue,
                    change.path,
                    change.sensitivity
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {changes.map((change) => (
          <div
            key={change.path}
            className="rounded-md border border-gray-200 p-4"
          >
            <h4 className="font-medium text-gray-950">{change.label}</h4>
            <dl className="mt-3 grid gap-3 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-gray-500">
                  Approved
                </dt>
                <dd className="mt-1 text-gray-700">
                  {formatMaintenanceValue(
                    change.approvedValue,
                    change.path,
                    change.sensitivity
                  )}
                </dd>
              </div>
              <div className="border-l-2 border-sp-brand bg-sp-accent/50 px-3 py-2">
                <dt className="text-xs font-semibold uppercase text-sp-brand">
                  Proposed
                </dt>
                <dd className="mt-1 font-medium text-gray-950">
                  {formatMaintenanceValue(
                    change.proposedValue,
                    change.path,
                    change.sensitivity
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </>
  );
}

export function ChangeReview({
  projection,
}: {
  projection: MaintenanceProjection;
}) {
  const itemIds = [
    ...projection.productChanges.map(
      (change) => `product-${change.product}-${change.subProduct}`
    ),
    ...projection.partyChanges.map((change) => change.partyId),
  ];
  const itemKey = itemIds.join('|');
  const [openItems, setOpenItems] = useState(itemIds);
  const openedKey = useRef(itemKey);

  // The change set can arrive after mount on a direct link, so defaultValue is not enough.
  useEffect(() => {
    if (openedKey.current === itemKey) return;
    openedKey.current = itemKey;
    setOpenItems(itemKey ? itemKey.split('|') : []);
  }, [itemKey]);

  return (
    <section aria-labelledby="change-review-heading">
      <div className="mb-4">
        <h2
          id="change-review-heading"
          className="text-xl font-semibold text-gray-950"
        >
          Approved and proposed details
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Only changed fields are shown. Proposed values do not replace the
          approved profile until review completes.
        </p>
      </div>

      <Accordion
        type="multiple"
        value={openItems}
        onValueChange={setOpenItems}
        className="overflow-hidden rounded-md border border-gray-200 bg-white"
      >
        {projection.productChanges.map((productChange) => {
          const value = `product-${productChange.product}-${productChange.subProduct}`;
          return (
            <AccordionItem
              key={value}
              value={value}
              className="px-4 last:border-b-0 sm:px-5"
            >
              <AccordionTrigger className="gap-3 text-left hover:no-underline">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="font-semibold text-gray-950">
                    Limited DDA Payments
                  </span>
                  <Badge
                    variant="outline"
                    className={actionClasses(productChange.action)}
                  >
                    {productChange.action}
                  </Badge>
                  <span className="text-xs font-normal text-gray-500">
                    Product
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="mb-3 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <PackagePlus className="mt-0.5 h-4 w-4 shrink-0" />
                  Limited DDA Payments is proposed as an additional Embedded
                  Payments sub-product for this approved client.
                </div>
                <dl className="grid gap-3 rounded-md border border-gray-200 p-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-500">
                      Approved
                    </dt>
                    <dd className="mt-1 text-gray-700">
                      Embedded Payments · Limited DDA
                    </dd>
                  </div>
                  <div className="border-l-2 border-sp-brand bg-sp-accent/50 px-3 py-2">
                    <dt className="text-xs font-semibold uppercase text-sp-brand">
                      Proposed
                    </dt>
                    <dd className="mt-1 font-medium text-gray-950">
                      Embedded Payments · Limited DDA Payments
                    </dd>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>
          );
        })}
        {projection.partyChanges.map((partyChange) => (
          <AccordionItem
            key={partyChange.partyId}
            value={partyChange.partyId}
            className="px-4 last:border-b-0 sm:px-5"
          >
            <AccordionTrigger className="gap-3 text-left hover:no-underline">
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <span className="font-semibold text-gray-950">
                  {partyChange.partyName}
                </span>
                <Badge
                  variant="outline"
                  className={actionClasses(partyChange.action)}
                >
                  {partyChange.removesParty ? 'REMOVE' : partyChange.action}
                </Badge>
                <span className="text-xs font-normal text-gray-500">
                  {partyChange.fieldChanges.length}{' '}
                  {partyChange.fieldChanges.length === 1 ? 'field' : 'fields'}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {partyChange.removesParty ? (
                <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <UserMinus className="mt-0.5 h-4 w-4 shrink-0" />
                  This approved party is proposed for removal. The party remains
                  visible until the request is approved.
                </div>
              ) : partyChange.action === 'ADD' ? (
                <div className="mb-3 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <UserPlus className="mt-0.5 h-4 w-4 shrink-0" />
                  This is a proposed new party and is not part of the approved
                  profile yet.
                </div>
              ) : null}

              {partyChange.fieldChanges.length > 0 ? (
                <ComparisonRows changes={partyChange.fieldChanges} />
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
