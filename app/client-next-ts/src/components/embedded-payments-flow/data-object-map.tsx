import { ArrowRight, Link2 } from 'lucide-react';

import { EntityGraphFlow } from '@/components/embedded-payments-flow/entity-graph-flow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  API_BASE_URLS,
  API_SURFACE_META,
  DATA_OBJECT_ENTITIES,
  DATA_OBJECT_RELATIONSHIPS,
  type ApiSurfaceKey,
  type DataObjectId,
} from '@/lib/embedded-payments-flow/scenarios';

function entitiesForSurface(surface: ApiSurfaceKey) {
  return DATA_OBJECT_ENTITIES.filter((e) => e.apiSurface === surface);
}

function SurfaceCard({
  surface,
  activeObjectIds,
  isScenarioMode,
}: {
  surface: ApiSurfaceKey;
  activeObjectIds: ReadonlySet<DataObjectId>;
  isScenarioMode: boolean;
}) {
  const entities = entitiesForSurface(surface);
  const meta = API_SURFACE_META[surface];
  const baseUrl =
    surface === 'digitalOnboarding'
      ? API_BASE_URLS.digitalOnboarding
      : surface === 'embeddedV1'
        ? API_BASE_URLS.embeddedV1
        : surface === 'embeddedV2'
          ? API_BASE_URLS.embeddedV2
          : API_BASE_URLS.embeddedBankingEf;

  return (
    <Card className="overflow-hidden border-sp-border shadow-sm">
      <CardHeader className="border-b border-sp-border bg-gray-50/90 py-3">
        <CardTitle className="text-base text-gray-900">{meta.label}</CardTitle>
        <p className="truncate font-mono text-xs text-gray-600" title={baseUrl}>
          {baseUrl}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 p-4">
        {entities.map((entity) => {
          const active = activeObjectIds.has(entity.id);
          return (
            <div
              key={entity.id}
              className={cn(
                'min-w-[8rem] flex-1 rounded-lg border px-3 py-2 transition-opacity',
                meta.chipClass,
                isScenarioMode && !active && 'opacity-35',
                isScenarioMode &&
                  active &&
                  'ring-2 ring-sp-brand ring-offset-1'
              )}
            >
              <p className="text-sm font-semibold">{entity.label}</p>
              <p className="mt-0.5 font-mono text-[10px] text-gray-700">
                PK: {entity.idField}
              </p>
              <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-gray-600">
                {entity.keyFields.slice(0, 4).join(' · ')}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function DataObjectMap({
  activeObjectIds,
}: {
  activeObjectIds: ReadonlySet<DataObjectId>;
}) {
  const allIds = new Set(
    DATA_OBJECT_ENTITIES.map((e) => e.id) as DataObjectId[]
  );
  const isScenarioMode =
    activeObjectIds.size > 0 && activeObjectIds.size < allIds.size;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-sp-border bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-900">API surfaces</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Resources are grouped by published base path. Your integration may call
          several surfaces (onboarding, embedded money movement, webhook
          registration).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              'digitalOnboarding',
              'embeddedV1',
              'embeddedV2',
              'efV1',
            ] as const
          ).map((key) => {
            const meta = API_SURFACE_META[key];
            return (
              <span
                key={key}
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium',
                  meta.chipClass
                )}
              >
                {meta.label}
                <span className="ml-1.5 font-mono text-[10px] opacity-80">
                  {meta.pathSuffix}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-sp-border bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-900">Interactive entity graph</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Nodes list key fields; edges follow typical IDs and references between
          resources (same scenario highlighting as below).
        </p>
        <div className="mt-3">
          <EntityGraphFlow activeObjectIds={activeObjectIds} />
        </div>
      </div>

      <div className="space-y-4">
        <SurfaceCard
          surface="digitalOnboarding"
          activeObjectIds={activeObjectIds}
          isScenarioMode={isScenarioMode}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <SurfaceCard
            surface="embeddedV1"
            activeObjectIds={activeObjectIds}
            isScenarioMode={isScenarioMode}
          />
          <SurfaceCard
            surface="embeddedV2"
            activeObjectIds={activeObjectIds}
            isScenarioMode={isScenarioMode}
          />
        </div>
        <SurfaceCard
          surface="efV1"
          activeObjectIds={activeObjectIds}
          isScenarioMode={isScenarioMode}
        />
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Link2 className="h-4 w-4 text-sp-brand" aria-hidden />
          How objects connect
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          {DATA_OBJECT_RELATIONSHIPS.map((r) => (
            <li
              key={`${r.from}-${r.to}-${r.via}`}
              className="flex flex-wrap items-center gap-1.5"
            >
              <span className="rounded bg-white px-1.5 py-0.5 font-medium text-gray-900 shadow-sm">
                {labelFor(r.from)}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="rounded bg-white px-1.5 py-0.5 font-medium text-gray-900 shadow-sm">
                {labelFor(r.to)}
              </span>
              <span className="text-xs text-gray-500">({r.via})</span>
            </li>
          ))}
        </ul>
        {isScenarioMode && (
          <p className="mt-3 text-xs text-gray-600">
            Highlighted cards match the selected scenario; faded cards are out of
            scope for that path.
          </p>
        )}
      </div>
    </div>
  );
}

function labelFor(id: DataObjectId): string {
  return DATA_OBJECT_ENTITIES.find((e) => e.id === id)?.label ?? id;
}

/** Compact row of object chips for the Scenarios view. */
export function ScenarioObjectChips({
  objectIds,
}: {
  objectIds: readonly DataObjectId[];
}) {
  return (
    <div className="mb-4 rounded-lg border border-sp-border bg-white/90 p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        Data objects in this scenario
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {objectIds.map((id) => {
          const entity = DATA_OBJECT_ENTITIES.find((e) => e.id === id)!;
          const meta = API_SURFACE_META[entity.apiSurface];
          return (
            <span
              key={id}
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                meta.chipClass
              )}
            >
              {entity.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
