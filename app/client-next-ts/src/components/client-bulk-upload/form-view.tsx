import { useEffect, useState, type Dispatch, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  fieldsOfGroup,
  groupsOf,
  hasDetailValues,
  type DetailFieldId,
  type DetailValues,
  type PartyKind,
} from '@/lib/client-bulk-upload/details';
import {
  isClientBlank,
  type ClientDraft,
  type PersonField,
} from '@/lib/client-bulk-upload/model';
import type { BuilderAction } from '@/lib/client-bulk-upload/state';
import type { Issue } from '@/lib/client-bulk-upload/validate';
import { cn } from '@/lib/utils';

import {
  DetailInput,
  fieldStateClass,
  FixedRole,
  IssueList,
  issuesFor,
  OrganizationTypeSelect,
  StatusIcon,
  worstSeverity,
  type FieldRef,
} from './shared';
import type { VisibleClient } from './spreadsheet-view';

const LIST_LIMIT = 500;

const inputClass =
  'h-9 w-full rounded-md border border-jpm-gray-300 bg-white px-3 text-sm text-jpm-gray-900 placeholder:text-jpm-gray-400 focus:border-sp-brand focus:outline-none focus:ring-2 focus:ring-sp-brand/20';

interface FormViewProps {
  items: VisibleClient[];
  selectedId: string | null;
  onSelect: (clientId: string) => void;
  onAddClient: () => void;
  showAllErrors: boolean;
  dispatch: Dispatch<BuilderAction>;
}

export function FormView({
  items,
  selectedId,
  onSelect,
  onAddClient: addClient,
  showAllErrors,
  dispatch,
}: FormViewProps) {
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.client.id === selectedId)
  );
  const selected = items[selectedIndex];

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="flex max-h-[70vh] min-h-[320px] flex-col rounded-lg border border-jpm-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-jpm-gray-200 p-3">
          <span className="text-sm font-semibold text-jpm-gray-900">
            Clients ({items.length})
          </span>
          <Button type="button" size="sm" variant="outline" onClick={addClient}>
            <Plus aria-hidden />
            Add
          </Button>
        </div>
        <ul className="min-h-0 flex-1 overflow-auto p-1" role="list">
          {items.slice(0, LIST_LIMIT).map((item) => {
            const blank = isClientBlank(item.client);
            const isSelected = item.client.id === selected?.client.id;
            return (
              <li key={item.client.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.client.id)}
                  aria-current={isSelected || undefined}
                  className={cn(
                    'flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm',
                    isSelected ? 'bg-sp-accent' : 'hover:bg-jpm-gray-50'
                  )}
                >
                  <StatusIcon
                    blank={blank}
                    validation={item.validation}
                    showErrors={item.client.touched || showAllErrors}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-jpm-gray-900">
                      {item.client.organizationName.trim() ||
                        'Untitled business'}
                    </span>
                    <span className="block truncate text-xs text-jpm-gray-500">
                      Row {item.rowNumber}
                      {item.client.externalId.trim()
                        ? ` · ${item.client.externalId.trim()}`
                        : ''}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {items.length > LIST_LIMIT ? (
            <li className="px-2 py-2 text-xs text-jpm-gray-500">
              Showing the first {LIST_LIMIT}. Use search to find others.
            </li>
          ) : null}
        </ul>
      </aside>

      {selected ? (
        <ClientForm
          key={selected.client.id}
          item={selected}
          showAllErrors={showAllErrors}
          dispatch={dispatch}
          position={{ index: selectedIndex, total: items.length }}
          onPrevious={
            selectedIndex > 0
              ? () => onSelect(items[selectedIndex - 1].client.id)
              : undefined
          }
          onNext={
            selectedIndex < items.length - 1
              ? () => onSelect(items[selectedIndex + 1].client.id)
              : undefined
          }
          onAddAnother={addClient}
        />
      ) : (
        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-jpm-gray-300 bg-white p-8 text-sm text-jpm-gray-600">
          No clients match. Clear the search or filter, or add a client.
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  issues,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  issues: Issue[];
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-jpm-gray-900"
      >
        {label}
        {required ? (
          <span className="text-red-600" aria-hidden>
            {' '}
            *
          </span>
        ) : (
          <span className="font-normal text-jpm-gray-500"> (optional)</span>
        )}
      </label>
      {children}
      {issues.length > 0 ? (
        <p
          className={cn(
            'text-xs',
            issues[0].severity === 'error' ? 'text-red-700' : 'text-amber-800'
          )}
        >
          {issues[0].message}
        </p>
      ) : hint ? (
        <p className="text-xs text-jpm-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

function refKey(ref: FieldRef): string {
  return ref.scope === 'client'
    ? ref.field
    : `p${ref.personIndex}.${ref.field}`;
}

interface FieldControl {
  issues: Issue[];
  props: {
    className: string;
    'aria-invalid': true | undefined;
    onBlur: () => void;
  };
}

function ClientForm({
  item,
  showAllErrors,
  dispatch,
  position,
  onPrevious,
  onNext,
  onAddAnother,
}: {
  item: VisibleClient;
  showAllErrors: boolean;
  dispatch: Dispatch<BuilderAction>;
  position: { index: number; total: number };
  onPrevious?: () => void;
  onNext?: () => void;
  onAddAnother: () => void;
}) {
  const { client, validation, rowNumber } = item;
  // Imported or previously edited clients show every problem straight away;
  // a fresh client shows "missing value" errors only for fields already visited.
  const [revealAll] = useState(client.touched);
  const [visited, setVisited] = useState<Set<string>>(() => new Set());
  const blank = isClientBlank(client);

  const shownIssues = blank
    ? []
    : validation.issues.filter((issue) => {
        if (!issue.required || showAllErrors || revealAll) return true;
        return visited.has(refKey(issue.target as FieldRef));
      });

  const visit = (ref: FieldRef) => () =>
    setVisited((current) => {
      const key = refKey(ref);
      if (current.has(key)) return current;
      const next = new Set(current);
      next.add(key);
      return next;
    });

  const control = (ref: FieldRef): FieldControl => {
    const fieldIssues = issuesFor(shownIssues, ref);
    const severity = worstSeverity(fieldIssues);
    return {
      issues: fieldIssues,
      props: {
        className: cn(inputClass, fieldStateClass[severity ?? 'none']),
        'aria-invalid': severity === 'error' || undefined,
        onBlur: visit(ref),
      },
    };
  };

  const setClientField = (
    key: 'externalId' | 'organizationName' | 'organizationType' | 'email',
    value: string
  ) => dispatch({ type: 'setGridValue', clientId: client.id, key, value });

  const setPersonField = (
    personIndex: number,
    field: PersonField,
    value: string
  ) =>
    dispatch({
      type: 'setPersonField',
      clientId: client.id,
      personIndex,
      field,
      value,
    });

  const idPrefix = `form-${client.id}`;
  const externalId = control({ scope: 'client', field: 'externalId' });
  const organizationName = control({
    scope: 'client',
    field: 'organizationName',
  });
  const organizationType = control({
    scope: 'client',
    field: 'organizationType',
  });
  const businessEmail = control({ scope: 'client', field: 'email' });
  const peopleIssues = issuesFor(shownIssues, {
    scope: 'client',
    field: 'people',
  });

  return (
    <section
      className="space-y-5 rounded-lg border border-jpm-gray-200 bg-white p-5"
      aria-labelledby={`${idPrefix}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-jpm-gray-500">
            Client {position.index + 1} of {position.total} · Row {rowNumber}
          </p>
          <h2
            id={`${idPrefix}-title`}
            className="text-page-h4 font-semibold text-jpm-gray-900"
          >
            {client.organizationName.trim() || 'New business'}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-jpm-gray-500 hover:text-red-600"
          onClick={() =>
            dispatch({ type: 'removeClient', clientId: client.id })
          }
        >
          <Trash2 aria-hidden />
          Delete client
        </Button>
      </div>

      {shownIssues.length > 0 ? (
        <div className="rounded-md border border-red-200 bg-red-50/60 p-3">
          <IssueList
            issues={shownIssues}
            onFix={(fix) =>
              dispatch({
                type: 'applyFixes',
                fixes: [{ clientId: client.id, fix }],
              })
            }
          />
        </div>
      ) : null}

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold text-jpm-gray-900">
          Business
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Client ID"
            required
            htmlFor={`${idPrefix}-externalId`}
            hint="Your own unique identifier for this business. 1–50 characters, unique in the file."
            issues={externalId.issues}
          >
            <input
              id={`${idPrefix}-externalId`}
              value={client.externalId}
              onChange={(event) =>
                setClientField('externalId', event.target.value)
              }
              autoComplete="off"
              spellCheck={false}
              {...externalId.props}
            />
          </Field>
          <Field
            label="Legal business name"
            required
            htmlFor={`${idPrefix}-organizationName`}
            hint="Legal name of the business."
            issues={organizationName.issues}
          >
            <input
              id={`${idPrefix}-organizationName`}
              value={client.organizationName}
              onChange={(event) =>
                setClientField('organizationName', event.target.value)
              }
              autoComplete="off"
              {...organizationName.props}
            />
          </Field>
          <Field
            label="Business type"
            required
            htmlFor={`${idPrefix}-organizationType`}
            issues={organizationType.issues}
          >
            <OrganizationTypeSelect
              id={`${idPrefix}-organizationType`}
              value={client.organizationType}
              onChange={(value) => setClientField('organizationType', value)}
              {...organizationType.props}
            />
          </Field>
          <Field
            label="Business email"
            htmlFor={`${idPrefix}-email`}
            hint="Email of the controller, used for micro-deposit notifications. Leave blank to use the controller’s email."
            issues={businessEmail.issues}
          >
            <input
              id={`${idPrefix}-email`}
              type="email"
              value={client.email}
              placeholder={client.people[0].email.trim() || undefined}
              onChange={(event) => setClientField('email', event.target.value)}
              autoComplete="off"
              spellCheck={false}
              {...businessEmail.props}
            />
          </Field>
        </div>
        <MoreDetails
          party="business"
          values={client.details}
          personIndex={null}
          control={control}
          idPrefix={`${idPrefix}-business-detail`}
          onChange={(field, value) =>
            dispatch({
              type: 'setDetail',
              clientId: client.id,
              personIndex: null,
              field,
              value,
            })
          }
        />
      </fieldset>

      <PersonFieldset
        title="Controller"
        description="Has significant responsibility and control over the business, such as an executive officer or senior manager. Also the authorized user: completes onboarding and is sent the email to set up a login. One per business."
        personIndex={0}
        client={client}
        control={control}
        onField={setPersonField}
        dispatch={dispatch}
        idPrefix={idPrefix}
      />

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-jpm-gray-900">
            Other beneficial owners{' '}
            <span className="font-normal text-jpm-gray-500">(optional)</span>
          </h3>
          <p className="text-xs text-jpm-gray-600">
            Add each other individual who owns 25% or more of the business. If
            the controller owns 25% or more, tick that above instead of adding
            them again.
          </p>
          {peopleIssues.length > 0 ? (
            <p className="mt-1 text-xs text-red-700">
              {peopleIssues[0].message}
            </p>
          ) : null}
        </div>
        {client.people.slice(1).map((person, offset) => (
          <PersonFieldset
            key={person.id}
            title={`Beneficial owner · person ${offset + 2}`}
            personIndex={offset + 1}
            client={client}
            control={control}
            onField={setPersonField}
            dispatch={dispatch}
            idPrefix={idPrefix}
            removable
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => dispatch({ type: 'addPerson', clientId: client.id })}
        >
          <UserPlus aria-hidden />
          Add beneficial owner
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-jpm-gray-200 pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!onPrevious}
        >
          <ChevronLeft aria-hidden />
          Previous
        </Button>
        {onNext ? (
          <Button type="button" size="sm" onClick={onNext}>
            Next client
            <ChevronRight aria-hidden />
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={onAddAnother}>
            <Plus aria-hidden />
            Add another client
          </Button>
        )}
      </div>
    </section>
  );
}

function PersonFieldset({
  title,
  description,
  personIndex,
  client,
  control,
  onField,
  dispatch,
  idPrefix,
  removable,
}: {
  title: string;
  description?: string;
  personIndex: number;
  client: ClientDraft;
  control: (ref: FieldRef) => FieldControl;
  onField: (personIndex: number, field: PersonField, value: string) => void;
  dispatch: Dispatch<BuilderAction>;
  idPrefix: string;
  removable?: boolean;
}) {
  const person = client.people[personIndex];
  const isController = personIndex === 0;
  const id = (field: string) => `${idPrefix}-p${personIndex}-${field}`;
  const fields = {
    firstName: control({ scope: 'person', personIndex, field: 'firstName' }),
    middleName: control({ scope: 'person', personIndex, field: 'middleName' }),
    lastName: control({ scope: 'person', personIndex, field: 'lastName' }),
    email: control({ scope: 'person', personIndex, field: 'email' }),
  };

  return (
    <fieldset
      className={cn(
        'space-y-3 rounded-md border p-4',
        isController
          ? 'border-sp-brand/30 bg-sp-accent/40'
          : 'border-jpm-gray-200'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <legend className="text-sm font-semibold text-jpm-gray-900">
            {title}
          </legend>
          {description ? (
            <p className="text-xs text-jpm-gray-600">{description}</p>
          ) : null}
        </div>
        {removable ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-jpm-gray-500 hover:text-red-600"
            onClick={() =>
              dispatch({
                type: 'removePerson',
                clientId: client.id,
                personIndex,
              })
            }
          >
            <Trash2 aria-hidden />
            Remove
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field
          label="First name"
          required
          htmlFor={id('firstName')}
          issues={fields.firstName.issues}
        >
          <input
            id={id('firstName')}
            value={person.firstName}
            onChange={(event) =>
              onField(personIndex, 'firstName', event.target.value)
            }
            autoComplete="off"
            {...fields.firstName.props}
          />
        </Field>
        <Field
          label="Middle name"
          htmlFor={id('middleName')}
          issues={fields.middleName.issues}
        >
          <input
            id={id('middleName')}
            value={person.middleName}
            onChange={(event) =>
              onField(personIndex, 'middleName', event.target.value)
            }
            autoComplete="off"
            {...fields.middleName.props}
          />
        </Field>
        <Field
          label="Last name"
          required
          htmlFor={id('lastName')}
          issues={fields.lastName.issues}
        >
          <input
            id={id('lastName')}
            value={person.lastName}
            onChange={(event) =>
              onField(personIndex, 'lastName', event.target.value)
            }
            autoComplete="off"
            {...fields.lastName.props}
          />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="Email"
          required={isController}
          htmlFor={id('email')}
          hint={
            isController
              ? 'The email to set up a login for onboarding is sent here.'
              : undefined
          }
          issues={fields.email.issues}
        >
          <input
            id={id('email')}
            type="email"
            value={person.email}
            onChange={(event) =>
              onField(personIndex, 'email', event.target.value)
            }
            autoComplete="off"
            spellCheck={false}
            {...fields.email.props}
          />
        </Field>
        {isController ? (
          <div className="space-y-1">
            <span className="block text-sm font-medium text-jpm-gray-900">
              Roles
            </span>
            <div className="flex flex-wrap gap-x-5 gap-y-2 py-1.5 text-sm">
              <FixedRole label="Controller" ariaLabel="Controller" />
              <FixedRole label="Authorized user" ariaLabel="Authorized user" />
              <label className="inline-flex items-center gap-2 text-jpm-gray-900">
                <input
                  type="checkbox"
                  checked={person.isBeneficialOwner}
                  onChange={(event) =>
                    dispatch({
                      type: 'setPersonRole',
                      clientId: client.id,
                      personIndex,
                      role: 'isBeneficialOwner',
                      value: event.target.checked,
                    })
                  }
                  className="size-4 accent-sp-brand"
                />
                Owner 25%+ (beneficial owner)
              </label>
            </div>
            <p className="text-xs text-jpm-gray-500">
              Controller and authorized user are always selected for this
              person. Tick Owner 25%+ if they also own 25% or more.
            </p>
          </div>
        ) : null}
      </div>
      <MoreDetails
        party="person"
        values={person.details}
        personIndex={personIndex}
        control={control}
        idPrefix={id('detail')}
        onChange={(field, value) =>
          dispatch({
            type: 'setDetail',
            clientId: client.id,
            personIndex,
            field,
            value,
          })
        }
      />
    </fieldset>
  );
}

/** Collapsible optional details for the business or a person. */
function MoreDetails({
  party,
  values,
  personIndex,
  control,
  idPrefix,
  onChange,
}: {
  party: PartyKind;
  values: DetailValues;
  personIndex: number | null;
  control: (ref: FieldRef) => FieldControl;
  idPrefix: string;
  onChange: (field: DetailFieldId, value: string) => void;
}) {
  const ref = (field: DetailFieldId): FieldRef =>
    personIndex === null
      ? { scope: 'client', field }
      : { scope: 'person', personIndex, field };
  const groups = groupsOf(party);
  const filled = hasDetailValues(values);
  const hasIssues = groups.some((group) =>
    fieldsOfGroup(group.id).some(
      (field) => control(ref(field.id)).issues.length > 0
    )
  );
  const [open, setOpen] = useState(filled || hasIssues);
  useEffect(() => {
    if (hasIssues) setOpen(true);
  }, [hasIssues]);

  return (
    <div className="rounded-md border border-dashed border-jpm-gray-300 bg-white/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-sp-brand hover:bg-jpm-gray-50"
      >
        {open ? (
          <ChevronDown className="size-4" aria-hidden />
        ) : (
          <ChevronRight className="size-4" aria-hidden />
        )}
        More {party === 'business' ? 'business ' : ''}details
        <span className="font-normal text-jpm-gray-500">
          (optional{filled ? ' · some filled in' : ''})
        </span>
      </button>
      {open ? (
        <div className="space-y-4 border-t border-dashed border-jpm-gray-300 p-3">
          {groups.map((group) => (
            <div key={group.id} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-jpm-gray-600">
                {group.label}
                <span className="ml-2 font-normal normal-case tracking-normal text-jpm-gray-500">
                  {group.description}
                </span>
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {fieldsOfGroup(group.id).map((field) => {
                  const fieldControl = control(ref(field.id));
                  const inputId = `${idPrefix}-${field.id}`;
                  return (
                    <Field
                      key={field.id}
                      label={field.label}
                      htmlFor={inputId}
                      hint={field.hint}
                      issues={fieldControl.issues}
                      className={
                        field.input === 'textarea' ? 'md:col-span-3' : undefined
                      }
                    >
                      <DetailInput
                        id={inputId}
                        field={field}
                        value={values[field.id] ?? ''}
                        onChange={(value) => onChange(field.id, value)}
                        {...fieldControl.props}
                      />
                    </Field>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
