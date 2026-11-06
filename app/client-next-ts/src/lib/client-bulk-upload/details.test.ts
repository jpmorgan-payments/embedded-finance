import { describe, expect, it } from 'vitest';

import {
  buildCsvFiles,
  buildCsvRows,
  buildSpreadsheetTemplate,
  getCsvHeaders,
  importFromText,
  serializeCsv,
} from './csv';
import {
  businessDetailsToCsv,
  maskSensitive,
  normalizeDetailValue,
  parseDate,
  personDetailsToCsv,
  validateBusinessDetails,
  validatePersonDetails,
  type DetailValues,
} from './details';
import { createClient, createPerson, type ClientDraft } from './model';
import { CSV_HEADERS } from './schema';
import { buildSheetColumns } from './sheet-columns';
import { builderReducer } from './state';
import { validateClients } from './validate';

const TODAY = new Date(Date.UTC(2026, 10, 5));

function client(overrides: Partial<ClientDraft> = {}): ClientDraft {
  return createClient({
    externalId: 'S-1',
    organizationName: 'Acme LLC',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    people: [
      createPerson({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@acme.com',
      }),
    ],
    touched: true,
    ...overrides,
  });
}

const messages = (issues: { message: string }[]) =>
  issues.map((i) => i.message);

describe('optional details: CSV output', () => {
  it('writes business details with fixed companion values', () => {
    const out = businessDetailsToCsv({
      'business.dbaName': 'Acme Kitchen',
      'business.naics': '722511',
      'business.phone': '(212) 555-0100',
      'business.addressLine1': '102 Main St',
      'business.city': 'New York',
      'business.state': 'NY',
      'business.postalCode': '10001',
      'business.taxId': '12-3456789',
    });
    expect(out).toEqual({
      'organizationDetails.dbaName': 'Acme Kitchen',
      'organizationDetails.industry.codeType': 'NAICS',
      'organizationDetails.industry.code': '722511',
      'organizationDetails.phone.phoneType': 'BUSINESS_PHONE',
      'organizationDetails.phone.countryCode': '+1',
      'organizationDetails.phone.phoneNumber': '2125550100',
      'organizationDetails.addresses.0.addressType': 'BUSINESS_ADDRESS',
      'organizationDetails.addresses.0.addressLines.0': '102 Main St',
      'organizationDetails.addresses.0.city': 'New York',
      'organizationDetails.addresses.0.state': 'NY',
      'organizationDetails.addresses.0.postalCode': '10001',
      'organizationDetails.addresses.0.country': 'US',
      'organizationDetails.organizationIds.0.idType': 'EIN',
      'organizationDetails.organizationIds.0.value': '123456789',
      'organizationDetails.organizationIds.0.issuer': 'US',
    });
  });

  it('writes individual details, normalizing dates, phones and SSNs', () => {
    const out = personDetailsToCsv({
      'person.birthDate': '3/7/1985',
      'person.jobTitle': 'CEO',
      'person.language': 'en-US',
      'person.phone': '+1 646-555-0199',
      'person.addressLine1': '5 Oak Ave',
      'person.addressLine2': 'Apt 2',
      'person.city': 'Boston',
      'person.state': 'MA',
      'person.postalCode': '02134',
      'person.idValue': '123-45-6780',
    });
    expect(out).toMatchObject({
      'individualDetails.birthDate': '1985-03-07',
      'individualDetails.jobTitle': 'CEO',
      'preferences.defaultLanguage': 'en-US',
      'individualDetails.phone.phoneType': 'MOBILE_PHONE',
      'individualDetails.phone.phoneNumber': '6465550199',
      'individualDetails.addresses.0.addressType': 'RESIDENTIAL_ADDRESS',
      'individualDetails.addresses.0.addressLines.1': 'Apt 2',
      'individualDetails.individualIds.0.idType': 'SSN',
      'individualDetails.individualIds.0.value': '123456780',
      'individualDetails.individualIds.0.issuer': 'US',
    });
  });

  it('keeps the template unchanged when no details are used', () => {
    const rows = buildCsvRows([client()]);
    expect(getCsvHeaders(rows)).toEqual([...CSV_HEADERS]);
  });

  it('adds only the optional columns that hold data, after the template columns', () => {
    const rows = buildCsvRows([
      client({ details: { 'business.website': 'www.acme.com' } }),
    ]);
    const headers = getCsvHeaders(rows);
    expect(headers.slice(0, CSV_HEADERS.length)).toEqual([...CSV_HEADERS]);
    expect(headers.slice(CSV_HEADERS.length)).toEqual([
      'organizationDetails.website',
    ]);
    expect(rows[1]['organizationDetails.website']).toBeUndefined();
  });

  it('uses the same columns in every split file', () => {
    const clients = [
      client({ externalId: 'A', details: { 'business.naics': '722511' } }),
      client({ externalId: 'B' }),
    ];
    const files = buildCsvFiles(clients, { maxRows: 2 });
    expect(files).toHaveLength(2);
    expect(files[1].content.split('\r\n')[0]).toContain(
      'organizationDetails.industry.code'
    );
  });
});

describe('optional details: validation', () => {
  const business = (
    values: DetailValues,
    organizationType = 'LIMITED_LIABILITY_COMPANY'
  ) =>
    messages(
      validateBusinessDetails(values, {
        who: '',
        organizationType,
        today: TODAY,
      })
    );
  const person = (values: DetailValues) =>
    messages(
      validatePersonDetails(values, { who: 'Controller', today: TODAY })
    );

  it('accepts a complete, valid set of details', () => {
    expect(
      business({
        'business.dbaName': 'Acme Kitchen',
        'business.description': 'Kitchen supplies for restaurants',
        'business.naics': '722511',
        'business.yearOfFormation': '2015',
        'business.website': 'https://www.acme.com',
        'business.phone': '212 555 0100',
        'business.addressLine1': '102 Main St',
        'business.city': 'New York',
        'business.state': 'NY',
        'business.postalCode': '10001-1234',
        'business.taxId': '12-3456780',
      })
    ).toEqual([]);
    expect(
      person({
        'person.nameSuffix': 'Jr.',
        'person.birthDate': '1985-03-07',
        'person.jobTitle': 'Other',
        'person.jobTitleDescription': 'Head of operations',
        'person.natureOfOwnership': 'Direct',
        'person.idType': 'ITIN',
        'person.idValue': '912-70-1234',
      })
    ).toEqual([]);
  });

  it('requires the rest of an address once any part is entered', () => {
    const issues = validateBusinessDetails(
      { 'business.city': 'New York' },
      { who: '', today: TODAY }
    );
    expect(issues.filter((i) => i.required).map((i) => i.field)).toEqual([
      'business.addressLine1',
      'business.state',
      'business.postalCode',
    ]);
  });

  it('rejects PO boxes, private mailboxes and all-digit street lines', () => {
    expect(
      business({
        'business.addressLine1': 'PO Box 123',
        'business.city': 'X',
        'business.state': 'NY',
        'business.postalCode': '10001',
      }).join()
    ).toMatch(/PO boxes/);
    expect(
      person({
        'person.addressLine1': '12 Main St',
        'person.addressLine2': 'PMB 44',
        'person.city': 'X',
        'person.state': 'NY',
        'person.postalCode': '10001',
      }).join()
    ).toMatch(/private mailboxes/);
    expect(
      person({
        'person.addressLine1': '12345',
        'person.city': 'X',
        'person.state': 'NY',
        'person.postalCode': '10001',
      }).join()
    ).toMatch(/only numbers/);
  });

  it('suggests restoring a ZIP code’s dropped leading zero', () => {
    const issues = validatePersonDetails(
      {
        'person.addressLine1': '5 Oak Ave',
        'person.city': 'Boston',
        'person.state': 'MA',
        'person.postalCode': '2134',
      },
      { who: 'Controller', today: TODAY }
    );
    expect(issues[0].fix).toBe('02134');
  });

  it('checks phone numbers, NAICS codes, year formed and websites', () => {
    const result = business({
      'business.phone': '555-0100',
      'business.naics': '7225',
      'business.yearOfFormation': '2030',
      'business.website': 'acme',
    }).join('\n');
    expect(result).toMatch(/10-digit US phone/);
    expect(result).toMatch(/NAICS code must be 6 digits/);
    expect(result).toMatch(/not in the future/);
    expect(result).toMatch(/website address/);
  });

  it('applies the tax ID rules', () => {
    expect(business({ 'business.taxId': '123456789' }).join()).toMatch(
      /valid EIN/
    );
    expect(business({ 'business.taxId': '12345678' }).join()).toMatch(
      /leading zero/
    );
    expect(
      business(
        { 'business.taxIdType': 'SSN', 'business.taxId': '123-45-6780' },
        'C_CORPORATION'
      ).join()
    ).toMatch(/only accepted for sole proprietorships and LLCs/);
    expect(
      business(
        { 'business.taxIdType': 'SSN', 'business.taxId': '123-45-6780' },
        'SOLE_PROPRIETORSHIP'
      )
    ).toEqual([]);
    expect(business({ 'business.taxIdType': 'EIN' }).join()).toMatch(
      /enter the tax ID number/
    );
  });

  it('applies the personal ID and age rules', () => {
    expect(
      person({ 'person.idType': 'ITIN', 'person.idValue': '812701234' }).join()
    ).toMatch(/valid ITIN/);
    expect(
      person({ 'person.idType': 'PASSPORT', 'person.idValue': 'X1234567' })
    ).toEqual([]);
    expect(
      person({ 'person.idType': 'PASSPORT', 'person.idValue': '---' }).join()
    ).toMatch(/up to 20/);
    expect(person({ 'person.birthDate': '2010-01-01' }).join()).toMatch(
      /18 or older/
    );
    expect(person({ 'person.birthDate': '1985-02-30' }).join()).toMatch(
      /YYYY-MM-DD/
    );
    expect(person({ 'person.jobTitle': 'Other' }).join()).toMatch(
      /describe the job title/
    );
  });

  it('flags values that aren’t in a list', () => {
    expect(person({ 'person.jobTitle': 'Boss' }).join()).toMatch(
      /isn't an accepted job title/
    );
  });

  it('is part of the overall client validation, with fixes', () => {
    const c = client({
      details: { 'business.dbaName': 'Café Acme' },
      people: [
        createPerson({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@acme.com',
          details: { 'person.birthDate': 'soon' },
        }),
      ],
    });
    const { issues } = validateClients([c]).byClientId.get(c.id)!;
    expect(issues.map((i) => i.target)).toEqual([
      { scope: 'client', field: 'business.dbaName' },
      { scope: 'person', personIndex: 0, field: 'person.birthDate' },
    ]);
    expect(issues[0].fix).toEqual({
      personIndex: null,
      field: 'business.dbaName',
      value: 'Cafe Acme',
    });

    const fixed = builderReducer(
      { clients: [c], showAllErrors: false, dirty: false },
      { type: 'applyFixes', fixes: [{ clientId: c.id, fix: issues[0].fix! }] }
    );
    expect(fixed.clients[0].details['business.dbaName']).toBe('Cafe Acme');
  });

  it('rejects disallowed email domains', () => {
    const c = client({
      people: [
        createPerson({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@acme.ir',
        }),
      ],
    });
    expect(
      messages(validateClients([c]).byClientId.get(c.id)!.issues).join()
    ).toMatch(/domain that isn't accepted/);
  });
});

describe('optional details: normalization and import', () => {
  it('maps friendly spellings to codes', () => {
    expect(normalizeDetailValue('business.state', 'california')).toBe('CA');
    expect(normalizeDetailValue('person.idType', "Driver's license")).toBe(
      'DRIVERS_LICENSE'
    );
    expect(
      normalizeDetailValue('person.jobTitle', 'chief executive officer')
    ).toBe('CEO');
    expect(normalizeDetailValue('person.language', 'French')).toBe('fr-CA');
  });

  it('parses US and ISO dates', () => {
    expect(parseDate('12/31/1990')?.iso).toBe('1990-12-31');
    expect(parseDate('1990-12-31')?.iso).toBe('1990-12-31');
    expect(parseDate('31/12/1990')).toBeUndefined();
  });

  it('masks sensitive values', () => {
    expect(maskSensitive('person.idValue', '123-45-6789')).toBe('•••••6789');
    expect(maskSensitive('person.birthDate', '1985-03-07')).toBe('••••-••-••');
  });

  it('round-trips a file with optional details', () => {
    const original = client({
      details: {
        'business.dbaName': 'Acme Kitchen',
        'business.addressType': 'LEGAL_ADDRESS',
        'business.addressLine1': '102 Main St',
        'business.city': 'New York',
        'business.state': 'NY',
        'business.postalCode': '10001',
        'business.taxIdType': 'SSN',
        'business.taxId': '123456780',
      },
      people: [
        createPerson({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@acme.com',
          details: {
            'person.birthDate': '1985-03-07',
            'person.phone': '6465550199',
            'person.idType': 'PASSPORT',
            'person.idValue': 'X1234567',
          },
        }),
      ],
    });
    const csv = serializeCsv(buildCsvRows([original]));
    const result = importFromText(csv);
    expect(result.notes).toEqual([]);
    expect(buildCsvRows(result.clients)).toEqual(buildCsvRows([original]));
  });

  it('keeps the first of several addresses or IDs and explains what was left out', () => {
    const header = [
      ...CSV_HEADERS,
      'organizationDetails.mcc',
      'individualDetails.individualIds.0.idType',
      'individualDetails.individualIds.0.value',
      'individualDetails.individualIds.1.idType',
      'individualDetails.individualIds.1.value',
    ].join(',');
    const csv = [
      header,
      'ORGANIZATION,CLIENT,,,A1,,a@a.com,Alpha LLC,LLC,US,EMBEDDED_PAYMENTS,,,,,5812,,,,',
      'INDIVIDUAL,AUTHORIZED_USER,,,A1_1,A1,ann@a.com,,,,,Ann,,Lee,US,,SSN,123456780,PASSPORT,X1',
    ].join('\n');
    const result = importFromText(csv);
    expect(result.clients[0].people[0].details['person.idValue']).toBe(
      '123456780'
    );
    expect(result.notes.join('\n')).toMatch(
      /Ignored columns this tool doesn't support: organizationDetails.mcc/
    );
    expect(result.notes.join('\n')).toMatch(/only one ID per person/);
  });
});

describe('spreadsheet columns', () => {
  it('inserts optional groups after the core business and person columns', () => {
    const ids = buildSheetColumns(new Set(['businessPhone', 'personId'])).map(
      (c) => c.id
    );
    expect(ids).toEqual([
      'externalId',
      'organizationName',
      'organizationType',
      'email',
      'business.phone',
      'firstName',
      'middleName',
      'lastName',
      'personEmail',
      'isBeneficialOwner',
      'person.idType',
      'person.idValue',
    ]);
  });

  it('round-trips the spreadsheet template with optional columns', () => {
    const columns = buildSheetColumns(
      new Set(['businessPhone', 'personProfile'])
    );
    const template = buildSpreadsheetTemplate(columns).trim();
    expect(template).toContain('Business phone');
    expect(template).toContain('Controller birth date');
    const row =
      'S-9,Beta Inc,S corp,,212-555-0100,Sam,,Ito,sam@beta.com,Y,,1990-01-02,CEO,,Direct,English';
    const { clients } = importFromText(`${template}\r\n${row}`);
    expect(clients[0].details['business.phone']).toBe('212-555-0100');
    expect(clients[0].people[0].details).toMatchObject({
      'person.birthDate': '1990-01-02',
      'person.jobTitle': 'CEO',
      'person.natureOfOwnership': 'Direct',
      'person.language': 'en-US',
    });
  });

  it('pastes into optional columns', () => {
    const state = {
      clients: [createClient()],
      showAllErrors: false,
      dirty: false,
    };
    const next = builderReducer(state, {
      type: 'paste',
      targetClientIds: [state.clients[0].id],
      columns: ['business.state', 'business.postalCode'],
      rows: [['New York', '10001']],
    });
    expect(next.clients[0].details).toEqual({
      'business.state': 'NY',
      'business.postalCode': '10001',
    });
  });
});
