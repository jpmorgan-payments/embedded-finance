import { useState, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ArrowRightIcon, Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Label, RadioGroup, RadioGroupItem } from '@/components/ui';

import { usePendingAction } from '../hooks/usePendingAction';
import type { MaintenanceParty } from '../models/maintenanceApi.types';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceEntityMedallion } from './MaintenanceEntityMedallion';
import {
  MaintenanceOwnershipPicker,
  MaintenanceOwnershipPickerOption,
} from './MaintenanceOwnershipPicker';
import { MaintenancePageBody } from './MaintenancePageBody';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';

const NEW_BUSINESS = 'new-business';
// Medallions are 28px tall on a 32px row pitch and indent 20px per level.
const ROW_PITCH = 32;
const MEDALLION_SIZE = 28;
const INDENT = 20;

type DiagramNode = {
  kind: 'business' | 'person';
  label: string;
  row: number;
  indent: number;
  parent?: number;
};

/**
 * A miniature ownership structure. Both versions are three rows tall with the
 * owner on the last row, so a direct owner's line spans the empty middle row.
 */
function ConnectionDiagram({
  throughBusiness,
  labels,
}: {
  throughBusiness: boolean;
  labels: { client: string; intermediary: string; owner: string };
}) {
  const nodes: DiagramNode[] = throughBusiness
    ? [
        { kind: 'business', label: labels.client, row: 0, indent: 0 },
        {
          kind: 'business',
          label: labels.intermediary,
          row: 1,
          indent: 1,
          parent: 0,
        },
        { kind: 'person', label: labels.owner, row: 2, indent: 2, parent: 1 },
      ]
    : [
        { kind: 'business', label: labels.client, row: 0, indent: 0 },
        { kind: 'person', label: labels.owner, row: 2, indent: 1, parent: 0 },
      ];

  return (
    <div
      aria-hidden="true"
      className="eb-relative eb-w-full"
      style={{ height: ROW_PITCH * 2 + MEDALLION_SIZE }}
    >
      {nodes.map((node, index) => {
        const isOwner = index === nodes.length - 1;
        const parent =
          node.parent === undefined ? undefined : nodes[node.parent];
        return (
          <div key={`${node.kind}-${node.row}`}>
            {parent ? (
              <span
                className={cn(
                  'eb-absolute eb-rounded-bl-lg eb-border-b-2 eb-border-l-2',
                  isOwner ? 'eb-border-primary' : 'eb-border-border'
                )}
                style={{
                  left: parent.indent * INDENT + MEDALLION_SIZE / 2 - 1,
                  top: parent.row * ROW_PITCH + MEDALLION_SIZE,
                  height:
                    (node.row - parent.row) * ROW_PITCH -
                    MEDALLION_SIZE / 2 +
                    1,
                  width:
                    (node.indent - parent.indent) * INDENT -
                    MEDALLION_SIZE / 2 +
                    1,
                }}
              />
            ) : null}
            <div
              className="eb-absolute eb-right-0 eb-flex eb-items-center eb-gap-2"
              style={{
                top: node.row * ROW_PITCH,
                left: node.indent * INDENT,
                height: MEDALLION_SIZE,
              }}
            >
              <MaintenanceEntityMedallion
                kind={node.kind}
                size="sm"
                className={cn(
                  isOwner && 'eb-bg-primary eb-text-primary-foreground'
                )}
              />
              <span
                className={cn(
                  'eb-min-w-0 eb-truncate eb-text-xs eb-leading-4',
                  isOwner
                    ? 'eb-font-medium eb-text-foreground'
                    : 'eb-text-muted-foreground'
                )}
              >
                {node.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConnectionCard({
  value,
  title,
  description,
  diagram,
}: {
  value: 'direct' | 'indirect';
  title: string;
  description: string;
  diagram: ReactNode;
}) {
  const id = `owner-connection-${value}`;
  return (
    <Label
      htmlFor={id}
      data-owner-connection={value}
      className="eb-flex eb-cursor-pointer eb-flex-col eb-gap-4 eb-rounded-lg eb-border eb-bg-background eb-p-4 eb-transition-colors hover:eb-border-primary/50 has-[:disabled]:eb-cursor-not-allowed has-[[data-state=checked]]:eb-border-primary has-[[data-state=checked]]:eb-bg-accent/30 has-[:disabled]:eb-opacity-60"
    >
      <div className="eb-rounded-md eb-bg-muted/20 eb-p-3">{diagram}</div>
      <span className="eb-flex eb-items-start eb-gap-3">
        <RadioGroupItem id={id} value={value} className="eb-mt-0.5" />
        <span>
          <span className="eb-block eb-text-sm eb-font-semibold">{title}</span>
          <span className="eb-mt-1 eb-block eb-text-sm eb-font-normal eb-leading-5 eb-text-muted-foreground">
            {description}
          </span>
        </span>
      </span>
    </Label>
  );
}

export function MaintenanceOwnerRelationshipView({
  mode,
  allowsIndirectOwnership,
  ownerName,
  clientPartyId,
  clientName,
  intermediaries,
  breadcrumbs,
  onChooseDirect,
  onChooseIntermediary,
  onAddIntermediary,
  onBack,
}: {
  mode: 'add-owner' | 'controller-owner' | 'change-owner-path';
  /** Hides ownership through a business when the eligibility matrix doesn't allow it. */
  allowsIndirectOwnership: boolean;
  ownerName?: string;
  clientPartyId: string;
  clientName: string;
  intermediaries: MaintenanceParty[];
  breadcrumbs: MaintenanceBreadcrumbItem[];
  onChooseDirect: () => void | Promise<void>;
  onChooseIntermediary: (partyId: string) => void | Promise<void>;
  onAddIntermediary: () => void;
  onBack: () => void;
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const isChangingPath = mode === 'change-owner-path';
  const showsConnectionChoice = !isChangingPath && allowsIndirectOwnership;
  const hasIntermediaries = intermediaries.length > 0;
  const [connection, setConnection] = useState<'direct' | 'indirect' | ''>(
    isChangingPath ? 'indirect' : allowsIndirectOwnership ? '' : 'direct'
  );
  const [businessId, setBusinessId] = useState(
    hasIntermediaries ? '' : NEW_BUSINESS
  );
  const choice = usePendingAction();
  const name = ownerName ?? tString('ownerRelationship.newOwner');
  const titleKey = isChangingPath
    ? 'ownerRelationship.changeTitle'
    : mode === 'controller-owner'
      ? 'ownerRelationship.controllerTitle'
      : 'ownerRelationship.addTitle';
  const descriptionKey = isChangingPath
    ? hasIntermediaries
      ? 'ownerRelationship.changeDescription'
      : 'ownerRelationship.changeFirstBusinessDescription'
    : mode === 'controller-owner'
      ? 'ownerRelationship.controllerDescription'
      : 'ownerRelationship.addDescription';
  const diagramLabels = {
    client: tString('ownership.clientRoot'),
    intermediary: tString('ownership.intermediaryOwner'),
    owner: ownerName ?? tString('ownerRelationship.newOwnerNode'),
  };
  const isAddingBusiness =
    connection === 'indirect' && businessId === NEW_BUSINESS;
  const canContinue =
    connection === 'direct' || (connection === 'indirect' && businessId !== '');
  const submitLabel =
    isAddingBusiness || mode === 'add-owner'
      ? t('ownerRelationship.continue')
      : isChangingPath
        ? t('ownershipEditor.moveConfirm')
        : t('ownerRelationship.controllerTitle');

  const submit = () => {
    if (connection === 'direct') {
      void choice.run('direct', onChooseDirect);
    } else if (isAddingBusiness) {
      onAddIntermediary();
    } else if (businessId) {
      void choice.run(businessId, () => onChooseIntermediary(businessId));
    }
  };

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background eb-@container">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2 className="eb-text-lg eb-font-semibold">{t(titleKey, { name })}</h2>
        <p className="eb-mt-1 eb-max-w-2xl eb-text-sm eb-leading-6 eb-text-muted-foreground">
          {t(descriptionKey, { name })}
        </p>
      </header>

      <MaintenancePageBody>
        <div
          className="eb-mx-auto eb-max-w-3xl eb-space-y-8 eb-px-4 eb-py-6"
          aria-busy={choice.isPending}
        >
          {choice.error ? (
            <ServerErrorAlert error={choice.error as never} />
          ) : null}

          {showsConnectionChoice ? (
            <fieldset>
              <legend className="eb-text-base eb-font-semibold">
                {t('ownerRelationship.connectionQuestion', { name })}
              </legend>
              <RadioGroup
                value={connection}
                disabled={choice.isPending}
                onValueChange={(value) =>
                  setConnection(value as 'direct' | 'indirect')
                }
                className="eb-mt-3 eb-grid eb-gap-3 @[36rem]:eb-grid-cols-2"
              >
                <ConnectionCard
                  value="direct"
                  title={tString('ownerRelationship.directTitle')}
                  description={tString('ownerRelationship.directDescription')}
                  diagram={
                    <ConnectionDiagram
                      throughBusiness={false}
                      labels={diagramLabels}
                    />
                  }
                />
                <ConnectionCard
                  value="indirect"
                  title={tString('ownerRelationship.indirectTitle')}
                  description={tString('ownerRelationship.indirectDescription')}
                  diagram={
                    <ConnectionDiagram throughBusiness labels={diagramLabels} />
                  }
                />
              </RadioGroup>
            </fieldset>
          ) : null}

          {connection === 'indirect' ? (
            <section
              aria-label={tString('ownerRelationship.businessQuestion', {
                name,
              })}
              className={cn(
                showsConnectionChoice &&
                  'eb-duration-200 eb-animate-in eb-fade-in-0 eb-slide-in-from-top-2 motion-reduce:eb-animate-none'
              )}
            >
              {showsConnectionChoice ? (
                <h3
                  id="owner-connection-business-heading"
                  className="eb-mb-1 eb-text-base eb-font-semibold"
                >
                  {t('ownerRelationship.businessQuestion', { name })}
                </h3>
              ) : null}
              {hasIntermediaries ? (
                <p className="eb-text-sm eb-text-muted-foreground">
                  {t('ownership.unifiedDescription')}
                </p>
              ) : null}
              <MaintenanceOwnershipPicker
                label={tString('ownerRelationship.businessQuestion', { name })}
                rootPartyId={clientPartyId}
                nodes={[
                  {
                    partyId: clientPartyId,
                    name: clientName,
                    caption: tString('ownership.clientRoot'),
                    disabled: true,
                  },
                  ...intermediaries.flatMap((intermediary) =>
                    intermediary.id
                      ? [
                          {
                            partyId: intermediary.id,
                            parentPartyId: intermediary.parentPartyId,
                            name:
                              intermediary.organizationDetails
                                ?.organizationName ?? tString('notProvided'),
                          },
                        ]
                      : []
                  ),
                ]}
                value={businessId}
                disabled={choice.isPending}
                onValueChange={setBusinessId}
                className="eb-mt-3"
                rootFooter={
                  <MaintenanceOwnershipPickerOption
                    value={NEW_BUSINESS}
                    name={t('ownerRelationship.addBusiness')}
                    caption={t('ownerRelationship.addBusinessDescription')}
                  />
                }
              />
            </section>
          ) : null}

          {!showsConnectionChoice && connection === 'direct' ? (
            <div className="eb-flex eb-items-center eb-gap-3 eb-rounded-lg eb-border eb-bg-muted/20 eb-p-4">
              <MaintenanceEntityMedallion kind="person" />
              <span>
                <span className="eb-block eb-text-sm eb-font-semibold">
                  {t('ownerRelationship.directTitle')}
                </span>
                <span className="eb-block eb-text-sm eb-text-muted-foreground">
                  {t('ownerRelationship.directDescription')}
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </MaintenancePageBody>

      <MaintenanceViewNavigation
        backLabel={tString('form.back')}
        onBack={onBack}
        disabled={choice.isPending}
        action={
          <Button
            size="sm"
            disabled={!canContinue || choice.isPending}
            onClick={submit}
          >
            {choice.isPending ? (
              <Loader2Icon aria-hidden className="eb-animate-spin" />
            ) : null}
            {submitLabel}
            {isAddingBusiness || mode === 'add-owner' ? (
              <ArrowRightIcon aria-hidden />
            ) : null}
          </Button>
        }
      />
    </div>
  );
}
