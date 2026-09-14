import { useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  CheckCircle2Icon,
  DownloadIcon,
  Loader2Icon,
  LockIcon,
} from 'lucide-react';

import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Checkbox, Input, Label } from '@/components/ui';

import type { MaintenanceAttestation } from '../models/maintenanceApi.types';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceSection } from './MaintenanceSection';

type MaintenanceAttestationViewProps = {
  documentIds: string[];
  ipAddress?: string;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  isSubmitting: boolean;
  error?: unknown;
  onBack: () => void;
  onDownload: (documentId: string) => Promise<Blob>;
  onSubmit: (attestations: MaintenanceAttestation[]) => Promise<void>;
};

export function MaintenanceAttestationView({
  documentIds,
  ipAddress,
  breadcrumbs,
  isSubmitting,
  error,
  onBack,
  onDownload,
  onSubmit,
}: MaintenanceAttestationViewProps) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [designation, setDesignation] = useState('');
  const [downloadError, setDownloadError] = useState<unknown>();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const download = async (documentId: string) => {
    setDownloadError(undefined);
    try {
      const blob = await onDownload(documentId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setOpenedIds((current) =>
        current.includes(documentId) ? current : [...current, documentId]
      );
    } catch (nextError) {
      setDownloadError(nextError);
    }
  };

  const isComplete =
    documentIds.length > 0 &&
    documentIds.every((documentId) => openedIds.includes(documentId)) &&
    accepted &&
    Boolean(
      firstName.trim() && lastName.trim() && designation.trim() && ipAddress
    );
  const documentsReviewed =
    documentIds.length > 0 &&
    documentIds.every((documentId) => openedIds.includes(documentId));

  const submit = () =>
    onSubmit(
      documentIds.map((documentId) => ({
        documentId,
        attestationTime: new Date().toISOString(),
        ipAddress: ipAddress!,
        attester: {
          firstName: firstName.trim(),
          middleName: middleName.trim() || undefined,
          lastName: lastName.trim(),
          designation: designation.trim(),
        },
      }))
    );

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="eb-text-lg eb-font-semibold focus:eb-outline-none"
        >
          {t('attestation.title')}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t('attestation.description')}
        </p>
      </header>
      <MaintenanceSection
        id="maintenance-attestation-heading"
        title={t('attestation.sectionTitle')}
        caption={t('sectionCaption.requirements')}
        tone="warning"
        footer={
          <div className="eb-flex eb-flex-wrap eb-justify-between eb-gap-2">
            <Button variant="outlineSurface" size="sm" onClick={onBack}>
              {t('attestation.cancel')}
            </Button>
            <Button
              size="sm"
              disabled={!isComplete || isSubmitting}
              onClick={submit}
            >
              {isSubmitting ? (
                <Loader2Icon className="eb-animate-spin" />
              ) : null}
              {t('attestation.save')}
            </Button>
          </div>
        }
      >
        <div className="eb-p-4">
          {error || downloadError ? (
            <div className="eb-mb-5">
              <ServerErrorAlert error={(error ?? downloadError) as never} />
            </div>
          ) : null}
          <section aria-labelledby="attestation-documents-heading">
            <div className="eb-flex eb-flex-wrap eb-items-start eb-justify-between eb-gap-3">
              <div>
                <h4
                  id="attestation-documents-heading"
                  className="eb-text-sm eb-font-semibold"
                >
                  {t('attestation.documentsTitle')}
                </h4>
                <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                  {t('attestation.documentsDescription')}
                </p>
              </div>
              <span className="eb-rounded-full eb-bg-muted eb-px-2.5 eb-py-1 eb-text-xs eb-font-medium">
                {t('attestation.progress', {
                  reviewed: openedIds.length,
                  total: documentIds.length,
                })}
              </span>
            </div>
            <div className="eb-mt-4 eb-space-y-2">
              {documentIds.map((documentId, index) => (
                <div
                  key={documentId}
                  className="eb-flex eb-items-center eb-justify-between eb-gap-3 eb-rounded-md eb-border eb-p-3"
                >
                  <span className="eb-flex eb-min-w-0 eb-items-center eb-gap-2 eb-text-sm eb-font-medium">
                    {openedIds.includes(documentId) ? (
                      <CheckCircle2Icon className="eb-size-4 eb-shrink-0 eb-text-success" />
                    ) : (
                      <span className="eb-flex eb-size-5 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-border eb-text-xs eb-text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                    {t('attestation.document', { number: index + 1 })}
                  </span>
                  <Button
                    variant="outlineSurface"
                    size="sm"
                    onClick={() => download(documentId)}
                  >
                    <DownloadIcon />
                    {openedIds.includes(documentId)
                      ? t('attestation.opened')
                      : t('attestation.review')}
                  </Button>
                </div>
              ))}
            </div>
          </section>
          <section
            aria-labelledby="attestation-signer-heading"
            className="eb-mt-6 eb-border-t eb-pt-6"
          >
            <div className="eb-flex eb-items-start eb-gap-2">
              {!documentsReviewed ? (
                <LockIcon className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-text-muted-foreground" />
              ) : null}
              <div>
                <h4
                  id="attestation-signer-heading"
                  className="eb-text-sm eb-font-semibold"
                >
                  {t('attestation.signerTitle')}
                </h4>
                <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                  {documentsReviewed
                    ? t('attestation.signerDescription')
                    : t('attestation.signerLocked')}
                </p>
              </div>
            </div>
            <div className="eb-mt-4 eb-grid eb-gap-4 @[40rem]:eb-grid-cols-2">
              <div className="eb-space-y-2">
                <Label htmlFor="attester-first-name">
                  {t('editor.firstName')}
                </Label>
                <Input
                  id="attester-first-name"
                  value={firstName}
                  disabled={!documentsReviewed}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </div>
              <div className="eb-space-y-2">
                <Label htmlFor="attester-middle-name">
                  {t('editor.middleName')}{' '}
                  <span className="eb-font-normal eb-text-muted-foreground">
                    ({t('common:optional')})
                  </span>
                </Label>
                <Input
                  id="attester-middle-name"
                  value={middleName}
                  disabled={!documentsReviewed}
                  onChange={(event) => setMiddleName(event.target.value)}
                />
              </div>
              <div className="eb-space-y-2">
                <Label htmlFor="attester-last-name">
                  {t('editor.lastName')}
                </Label>
                <Input
                  id="attester-last-name"
                  value={lastName}
                  disabled={!documentsReviewed}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>
              <div className="eb-space-y-2">
                <Label htmlFor="attester-designation">
                  {t('attestation.designation')}
                </Label>
                <Input
                  id="attester-designation"
                  value={designation}
                  placeholder={tString('attestation.designationPlaceholder')}
                  disabled={!documentsReviewed}
                  onChange={(event) => setDesignation(event.target.value)}
                />
                <p className="eb-text-xs eb-text-muted-foreground">
                  {t('attestation.designationDescription')}
                </p>
              </div>
            </div>
            <label className="eb-mt-5 eb-flex eb-items-start eb-gap-3 eb-rounded-md eb-border eb-bg-muted/20 eb-p-4 eb-text-sm">
              <Checkbox
                disabled={!documentsReviewed}
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
              />
              <span>{t('attestation.confirmation')}</span>
            </label>
          </section>
        </div>
      </MaintenanceSection>
    </div>
  );
}
