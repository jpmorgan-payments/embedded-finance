import { useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  CheckCircle2Icon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  PencilLineIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { DocumentTypeSmbdo } from '@/api/generated/smbdo.schemas';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Checkbox, Input, Label } from '@/components/ui';
import { DOCUMENT_TYPE_MAPPING } from '@/core/OnboardingFlow/config';

import type {
  MaintenanceAttestation,
  MaintenanceParty,
} from '../models/maintenanceApi.types';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceFormFooter } from './MaintenanceFormFooter';
import { MaintenancePageBody } from './MaintenancePageBody';

type MaintenanceAttestationViewProps = {
  documents: Array<{ id: string; documentType?: string }>;
  /** Prefills the signer, as onboarding does. */
  controller?: MaintenanceParty;
  ipAddress?: string;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  isSubmitting: boolean;
  error?: unknown;
  onBack: () => void;
  onDownload: (documentId: string) => Promise<Blob>;
  onSubmit: (attestations: MaintenanceAttestation[]) => Promise<void>;
};

type Signer = {
  firstName: string;
  middleName: string;
  lastName: string;
  designation: string;
};

const getControllerSigner = (controller?: MaintenanceParty): Signer => {
  const details = controller?.individualDetails;
  return {
    firstName: details?.firstName ?? '',
    middleName: details?.middleName ?? '',
    lastName: details?.lastName ?? '',
    designation:
      (details?.jobTitle === 'Other'
        ? details.jobTitleDescription
        : details?.jobTitle) ?? '',
  };
};

const isSignerComplete = (signer: Signer) =>
  Boolean(
    signer.firstName.trim() &&
      signer.lastName.trim() &&
      signer.designation.trim()
  );

function AttestationDocumentRow({
  documentId,
  name,
  isOpened,
  isOpening,
  onOpen,
  onDownload,
}: {
  documentId: string;
  name: string;
  isOpened: boolean;
  isOpening: boolean;
  onOpen: () => void;
  onDownload: (fileName: string) => void;
}) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );

  return (
    <li
      data-attestation-document={documentId}
      className="eb-flex eb-flex-wrap eb-items-center eb-gap-3 eb-px-4 eb-py-3"
    >
      <span
        aria-hidden="true"
        className="eb-relative eb-flex eb-h-11 eb-w-9 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-sm eb-border eb-bg-background eb-text-muted-foreground eb-shadow-sm"
      >
        <FileTextIcon className="eb-size-4" />
        {isOpened ? (
          <CheckCircle2Icon className="eb-absolute eb--bottom-1.5 eb--right-1.5 eb-size-4 eb-rounded-full eb-bg-background eb-text-informative" />
        ) : null}
      </span>
      <span className="eb-min-w-0 eb-flex-1">
        <span className="eb-block eb-truncate eb-text-sm eb-font-medium">
          {name}
        </span>
        <span
          className={cn(
            'eb-block eb-text-xs',
            isOpened ? 'eb-text-informative' : 'eb-text-muted-foreground'
          )}
        >
          {isOpened ? t('attestation.opened') : t('attestation.notOpened')}
        </span>
      </span>
      <span className="eb-flex eb-shrink-0 eb-items-center eb-gap-2">
        <Button
          variant={isOpened ? 'outlineSurface' : 'default'}
          size="sm"
          disabled={isOpening}
          onClick={onOpen}
        >
          {isOpening ? (
            <Loader2Icon className="eb-animate-spin" />
          ) : (
            <ExternalLinkIcon />
          )}
          {t('attestation.open')}
        </Button>
        <Button
          variant="outlineSurface"
          size="sm"
          className="eb-w-9 eb-px-0"
          aria-label={tString('attestation.download', { name })}
          title={tString('attestation.download', { name })}
          disabled={isOpening}
          onClick={() =>
            onDownload(name.replace(/\s+/g, '_').replace(/[^\w-]/g, ''))
          }
        >
          <DownloadIcon />
        </Button>
      </span>
    </li>
  );
}

export function MaintenanceAttestationView({
  documents,
  controller,
  ipAddress,
  breadcrumbs,
  isSubmitting,
  error,
  onBack,
  onDownload,
  onSubmit,
}: MaintenanceAttestationViewProps) {
  const { t, tString, i18n } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [openingId, setOpeningId] = useState<string>();
  const [accepted, setAccepted] = useState(false);
  const [signer, setSigner] = useState(() => getControllerSigner(controller));
  const [isEditingSigner, setIsEditingSigner] = useState(
    () => !isSignerComplete(getControllerSigner(controller))
  );
  const [documentError, setDocumentError] = useState<unknown>();
  const [isPopupBlocked, setIsPopupBlocked] = useState(false);
  const fileUrlsRef = useRef(new Map<string, string>());

  useEffect(() => {
    headingRef.current?.focus();
    const fileUrls = fileUrlsRef.current;
    return () => fileUrls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const markOpened = (documentId: string) =>
    setOpenedIds((current) =>
      current.includes(documentId) ? current : [...current, documentId]
    );

  const getFileUrl = async (documentId: string) => {
    const cachedUrl = fileUrlsRef.current.get(documentId);
    if (cachedUrl) return cachedUrl;
    const file = await onDownload(documentId);
    // A typed PDF opens in the browser's viewer instead of downloading.
    const url = URL.createObjectURL(
      new Blob([file], { type: 'application/pdf' })
    );
    fileUrlsRef.current.set(documentId, url);
    return url;
  };

  const withFile = async (
    documentId: string,
    deliver: (url: string) => boolean
  ) => {
    setDocumentError(undefined);
    setIsPopupBlocked(false);
    setOpeningId(documentId);
    try {
      if (!deliver(await getFileUrl(documentId))) return false;
      markOpened(documentId);
      return true;
    } catch (nextError) {
      setDocumentError(nextError);
      return false;
    } finally {
      setOpeningId(undefined);
    }
  };

  const open = async (documentId: string) => {
    // Opened before the file loads, while the click still allows a new tab.
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;
    const isShown = await withFile(documentId, (url) => {
      if (!tab) {
        setIsPopupBlocked(true);
        return false;
      }
      tab.location.href = url;
      return true;
    });
    if (!isShown) tab?.close();
  };

  const download = (documentId: string, fileName: string) =>
    void withFile(documentId, (url) => {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName || documentId}.pdf`;
      link.click();
      return true;
    });

  const signerName = [signer.firstName, signer.middleName, signer.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
  const documentsOpened =
    documents.length > 0 && documents.every(({ id }) => openedIds.includes(id));
  const signingDate = new Date().toLocaleDateString(
    i18n.resolvedLanguage === 'esUS'
      ? 'es-US'
      : i18n.resolvedLanguage === 'frCA'
        ? 'fr-CA'
        : 'en-US',
    { dateStyle: 'medium' }
  );
  const isComplete =
    documentsOpened &&
    accepted &&
    isSignerComplete(signer) &&
    Boolean(ipAddress);

  const updateSigner = (field: keyof Signer) => (value: string) =>
    setSigner((current) => ({ ...current, [field]: value }));

  const submit = () =>
    onSubmit(
      documents.map(({ id: documentId }) => ({
        documentId,
        attestationTime: new Date().toISOString(),
        ipAddress: ipAddress!,
        attester: {
          firstName: signer.firstName.trim(),
          middleName: signer.middleName.trim() || undefined,
          lastName: signer.lastName.trim(),
          designation: signer.designation.trim(),
        },
      }))
    );

  const signerFields: Array<{
    field: keyof Signer;
    label: string;
    optional?: boolean;
    description?: string;
  }> = [
    { field: 'firstName', label: tString('editor.firstName') },
    {
      field: 'middleName',
      label: tString('editor.middleName'),
      optional: true,
    },
    { field: 'lastName', label: tString('editor.lastName') },
    {
      field: 'designation',
      label: tString('attestation.designation'),
      description: tString('attestation.designationDescription'),
    },
  ];

  return (
    <div
      className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background eb-@container"
      data-maintenance-page-fill=""
    >
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
      <MaintenancePageBody contentClassName="eb-space-y-6 eb-bg-muted/20 eb-px-4 eb-py-5 @[40rem]:eb-px-5">
        {error || documentError ? (
          <ServerErrorAlert error={(error ?? documentError) as never} />
        ) : null}

        <section aria-labelledby="attestation-documents-heading">
          <div className="eb-mb-2.5 eb-flex eb-items-baseline eb-justify-between eb-gap-3">
            <h3
              id="attestation-documents-heading"
              className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider"
            >
              {t('attestation.documentsTitle')}
            </h3>
            <span
              aria-live="polite"
              className="eb-text-xs eb-tabular-nums eb-text-muted-foreground"
            >
              {t('attestation.progress', {
                opened: openedIds.length,
                total: documents.length,
              })}
            </span>
          </div>
          <ul className="eb-divide-y eb-overflow-hidden eb-rounded-md eb-border eb-bg-background">
            {documents.map(({ id, documentType }, index) => {
              const name =
                DOCUMENT_TYPE_MAPPING[documentType as DocumentTypeSmbdo]
                  ?.label ??
                tString('attestation.document', { number: index + 1 });
              return (
                <AttestationDocumentRow
                  key={id}
                  documentId={id}
                  name={name}
                  isOpened={openedIds.includes(id)}
                  isOpening={openingId === id}
                  onOpen={() => void open(id)}
                  onDownload={(fileName) => download(id, fileName)}
                />
              );
            })}
          </ul>
          {isPopupBlocked ? (
            <p
              role="alert"
              className="eb-mt-2 eb-text-xs eb-text-warning-foreground"
            >
              {t('attestation.popupBlocked')}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="attestation-signature-heading">
          <h3
            id="attestation-signature-heading"
            className="eb-mb-2.5 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider"
          >
            {t('attestation.signatureTitle')}
          </h3>
          <div className="eb-overflow-hidden eb-rounded-md eb-border eb-bg-background">
            <div className="eb-flex eb-items-start eb-gap-3 eb-p-4">
              <Checkbox
                id="attestation-confirmation"
                className="eb-mt-0.5"
                disabled={!documentsOpened}
                checked={accepted}
                aria-describedby={
                  documentsOpened ? undefined : 'attestation-confirmation-hint'
                }
                onCheckedChange={(checked) => setAccepted(checked === true)}
              />
              <div className="eb-min-w-0">
                <label
                  htmlFor="attestation-confirmation"
                  className={cn(
                    'eb-block eb-text-sm eb-leading-relaxed eb-text-foreground',
                    documentsOpened
                      ? 'eb-cursor-pointer'
                      : 'eb-cursor-not-allowed eb-opacity-70'
                  )}
                >
                  {t('attestation.confirmation')}
                </label>
                {documentsOpened ? null : (
                  <p
                    id="attestation-confirmation-hint"
                    className="eb-mt-1 eb-text-xs eb-text-muted-foreground"
                  >
                    {t('attestation.confirmationLocked')}
                  </p>
                )}
              </div>
            </div>
            <div className="eb-border-t eb-bg-muted/20 eb-px-4 eb-py-4">
              {isEditingSigner ? (
                <div data-attestation-signer-form="">
                  <p className="eb-mb-3 eb-text-xs eb-text-muted-foreground">
                    {t('attestation.signerDescription')}
                  </p>
                  <div className="eb-grid eb-gap-4 @[40rem]:eb-grid-cols-2">
                    {signerFields.map(
                      ({ field, label, optional, description }) => (
                        <div key={field} className="eb-space-y-2">
                          <Label htmlFor={`attester-${field}`}>
                            {label}
                            {optional ? (
                              <span className="eb-font-normal eb-text-muted-foreground">
                                {' '}
                                ({t('common:optional')})
                              </span>
                            ) : null}
                          </Label>
                          <Input
                            id={`attester-${field}`}
                            value={signer[field]}
                            maxLength={255}
                            onChange={(event) =>
                              updateSigner(field)(event.target.value)
                            }
                          />
                          {description ? (
                            <p className="eb-text-xs eb-text-muted-foreground">
                              {description}
                            </p>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div data-attestation-signer="">
                  {/* Laid out like a paper signature block: value on the line, label beneath. */}
                  <dl className="eb-grid eb-gap-x-6 eb-gap-y-4 @[40rem]:eb-grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)]">
                    {[
                      {
                        id: 'name',
                        label: t('attestation.signerTitle'),
                        value: signerName,
                        emphasis: true,
                      },
                      {
                        id: 'designation',
                        label: t('attestation.designation'),
                        value: signer.designation,
                      },
                      {
                        id: 'date',
                        label: t('attestation.date'),
                        value: signingDate,
                      },
                    ].map(({ id, label, value, emphasis }) => (
                      <div
                        key={id}
                        className="eb-flex eb-min-w-0 eb-flex-col-reverse"
                      >
                        <dt className="eb-pt-1.5 eb-text-xs eb-text-muted-foreground">
                          {label}
                        </dt>
                        <dd
                          className={cn(
                            'eb-truncate eb-border-b eb-border-foreground/40 eb-pb-1.5',
                            emphasis
                              ? 'eb-text-base eb-font-semibold'
                              : 'eb-text-sm'
                          )}
                        >
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="eb-mt-3 eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-2">
                    <p className="eb-text-xs eb-text-muted-foreground">
                      {t('attestation.signerFromController')}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="eb-h-8"
                      onClick={() => setIsEditingSigner(true)}
                    >
                      <PencilLineIcon />
                      {t('attestation.editSigner')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </MaintenancePageBody>
      <MaintenanceFormFooter
        leading={
          <Button variant="outlineSurface" size="sm" onClick={onBack}>
            {t('attestation.cancel')}
          </Button>
        }
        trailing={
          <Button
            size="sm"
            disabled={!isComplete || isSubmitting}
            onClick={submit}
          >
            {isSubmitting ? <Loader2Icon className="eb-animate-spin" /> : null}
            {t('attestation.save')}
          </Button>
        }
      />
    </div>
  );
}
