import { describe, expect, it } from 'vitest';

import {
  buildCsvFiles,
  buildCsvRows,
  buildSpreadsheetTemplate,
  importFromText,
  serializeCsv,
} from './csv';
import { createClient, createPerson, type ClientDraft } from './model';
import {
  cleanCell,
  normalizeOrganizationType,
  parseYesNo,
  transliterateName,
} from './normalize';
import { CSV_HEADERS } from './schema';
import { BASE_COLUMN_IDS } from './sheet-columns';
import { builderReducer, createInitialState } from './state';
import { getEmailProblem, validateClients } from './validate';

/** Header row of the template shared with platforms (Sep 2026). */
const TEMPLATE_HEADER =
  'partyType,roles.0,roles.1,roles.2,externalId,parentExternalId,email,organizationDetails.organizationName,organizationDetails.organizationType,organizationDetails.countryOfFormation,products.0,individualDetails.firstName,individualDetails.middleName,individualDetails.lastName,individualDetails.countryOfResidence';

function validClient(overrides: Partial<ClientDraft> = {}): ClientDraft {
  return createClient({
    externalId: '55747723',
    organizationName: 'Acme Kitchen Supply LLC',
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

describe('CSV output', () => {
  it('uses exactly the template header', () => {
    expect(CSV_HEADERS.join(',')).toBe(TEMPLATE_HEADER);
    const csv = serializeCsv(buildCsvRows([validClient()]));
    expect(csv.split('\r\n')[0]).toBe(TEMPLATE_HEADER);
  });

  it('writes a business row and a controller row (controller first, with the authorized user role)', () => {
    const [business, person] = buildCsvRows([validClient()]);
    expect(business).toMatchObject({
      partyType: 'ORGANIZATION',
      'roles.0': 'CLIENT',
      externalId: '55747723',
      parentExternalId: '',
      email: 'jane@acme.com',
      'organizationDetails.organizationName': 'Acme Kitchen Supply LLC',
      'organizationDetails.organizationType': 'LIMITED_LIABILITY_COMPANY',
      'organizationDetails.countryOfFormation': 'US',
      'products.0': 'EMBEDDED_PAYMENTS',
    });
    expect(person).toMatchObject({
      partyType: 'INDIVIDUAL',
      'roles.0': 'CONTROLLER',
      'roles.1': 'AUTHORIZED_USER',
      'roles.2': '',
      externalId: '55747723_1',
      parentExternalId: '55747723',
      email: 'jane@acme.com',
      'products.0': '',
      'individualDetails.firstName': 'Jane',
      'individualDetails.lastName': 'Doe',
      'individualDetails.countryOfResidence': 'US',
    });
  });

  it('adds the owner role to the controller and writes other people as beneficial owners', () => {
    const client = validClient({
      email: 'ops@acme.com',
      people: [
        createPerson({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@acme.com',
          isBeneficialOwner: true,
        }),
        createPerson(),
        createPerson({ firstName: 'Bob', lastName: 'Ray' }),
      ],
    });
    const rows = buildCsvRows([client]);
    expect(rows).toHaveLength(3);
    expect(rows[0].email).toBe('ops@acme.com');
    expect(rows[1]).toMatchObject({
      'roles.0': 'CONTROLLER',
      'roles.1': 'AUTHORIZED_USER',
      'roles.2': 'BENEFICIAL_OWNER',
    });
    expect(rows[2]).toMatchObject({
      'roles.0': 'BENEFICIAL_OWNER',
      'roles.1': '',
      externalId: '55747723_2',
      email: '',
      'products.0': '',
    });
  });

  it('trims values, quotes commas, and never writes a BOM', () => {
    const client = validClient({
      organizationName: '  Smith, Jones & Co  ',
    });
    const csv = serializeCsv(buildCsvRows([client]));
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    expect(csv).toContain(',"Smith, Jones & Co",');
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(csv.split('\r\n').filter(Boolean)).toHaveLength(3);
  });

  it('skips completely blank rows', () => {
    expect(buildCsvRows([createClient(), validClient()])).toHaveLength(2);
  });

  it('splits large lists without separating a business from its people', () => {
    const clients = Array.from({ length: 5 }, (_, i) =>
      validClient({ externalId: `C${i}` })
    );
    const files = buildCsvFiles(clients, {
      date: new Date(2026, 10, 5),
      maxRows: 5,
    });
    expect(files).toHaveLength(3);
    expect(files.map((f) => f.rowCount)).toEqual([4, 4, 2]);
    expect(files[0].fileName).toBe(
      'client-bulk-upload-2026-11-05-2-clients-part-1-of-3.csv'
    );
    files.forEach((file) =>
      expect(file.content.startsWith(TEMPLATE_HEADER)).toBe(true)
    );
  });

  it('names a single file without a part suffix', () => {
    const [file] = buildCsvFiles([validClient()], {
      date: new Date(2026, 0, 9),
    });
    expect(file.fileName).toBe('client-bulk-upload-2026-01-09-1-client.csv');
  });
});

describe('validation', () => {
  it('ignores blank rows and accepts a complete client', () => {
    const summary = validateClients([createClient(), validClient()]);
    expect(summary.activeClientCount).toBe(1);
    expect(summary.errorCount).toBe(0);
    expect(summary.dataRowCount).toBe(2);
  });

  it('flags every required field on a started row', () => {
    const client = createClient({ externalId: 'X1' });
    const { issues } = validateClients([client]).byClientId.get(client.id)!;
    const fields = issues.map((issue) => issue.target.field);
    expect(fields).toEqual(
      expect.arrayContaining([
        'organizationName',
        'organizationType',
        'firstName',
        'lastName',
        'email',
      ])
    );
  });

  it('offers a fix for accented names', () => {
    const client = validClient({
      people: [
        createPerson({
          firstName: 'José',
          lastName: 'O’Brien',
          email: 'jose@acme.com',
        }),
      ],
    });
    const { issues } = validateClients([client]).byClientId.get(client.id)!;
    expect(issues.map((issue) => issue.fix?.value)).toEqual([
      'Jose',
      "O'Brien",
    ]);
  });

  it('rejects duplicate client IDs and clashes with generated person IDs', () => {
    const a = validClient({ externalId: 'A' });
    const b = validClient({ externalId: 'A', organizationName: 'Other' });
    const c = validClient({ externalId: 'A_1', organizationName: 'Third' });
    const summary = validateClients([a, b, c]);
    expect(summary.byClientId.get(b.id)!.issues[0].message).toContain(
      'also used in row 1'
    );
    expect(
      summary.byClientId
        .get(c.id)!
        .issues.some((i) => i.message.includes('clash'))
    ).toBe(true);
  });

  it('limits the client ID so person IDs fit in 50 characters', () => {
    const client = validClient({ externalId: 'x'.repeat(49) });
    const { issues } = validateClients([client]).byClientId.get(client.id)!;
    expect(issues[0].message).toContain('Use at most 48 characters');
  });

  it("requires the controller's email but not the other owners'", () => {
    const client = validClient({
      people: [
        createPerson({ firstName: 'Jane', lastName: 'Doe' }),
        createPerson({ firstName: 'Bob', lastName: 'Ray' }),
      ],
    });
    const { issues } = validateClients([client]).byClientId.get(client.id)!;
    expect(issues.map((i) => i.message)).toEqual([
      'Controller: enter an email — the email to set up a login for onboarding is sent here',
    ]);
  });

  it('warns when the controller is also added as an owner', () => {
    const client = validClient({
      people: [
        validClient().people[0],
        createPerson({
          firstName: 'jane',
          lastName: 'DOE',
          email: 'x@acme.com',
        }),
      ],
    });
    const result = validateClients([client]).byClientId.get(client.id)!;
    expect(result.errorCount).toBe(0);
    expect(result.issues[0].message).toMatch(
      /looks like the controller.*tick Owner 25%\+ on their row/
    );
  });

  it('allows at most four beneficial owners, counting the controller only when ticked', () => {
    const owners = (controllerOwns: boolean) =>
      validClient({
        people: [
          createPerson({
            firstName: 'Ctrl',
            lastName: 'Test',
            email: 'c@acme.com',
            isBeneficialOwner: controllerOwns,
          }),
          ...Array.from({ length: 4 }, (_, i) =>
            createPerson({ firstName: `Owner${i}`, lastName: 'Test' })
          ),
        ],
      });
    const hasLimitError = (client: ClientDraft) =>
      validateClients([client])
        .byClientId.get(client.id)!
        .issues.some((i) => i.target.field === 'people');
    expect(hasLimitError(owners(false))).toBe(false);
    expect(hasLimitError(owners(true))).toBe(true);
  });

  it('checks email shape and limits', () => {
    expect(getEmailProblem('name@company.com')).toBeUndefined();
    expect(getEmailProblem("o'brien+ops@sub.company.co")).toBeUndefined();
    expect(getEmailProblem('name@company')).toBeDefined();
    expect(getEmailProblem('name company@x.com')).toBeDefined();
    expect(getEmailProblem('a@b.com;')).toBeDefined();
    expect(getEmailProblem(`${'a'.repeat(65)}@x.com`)).toContain('64');
  });
});

describe('normalization', () => {
  it('maps friendly business types to API values', () => {
    expect(normalizeOrganizationType('llc')).toBe('LIMITED_LIABILITY_COMPANY');
    expect(normalizeOrganizationType('S Corp')).toBe('S_CORPORATION');
    expect(normalizeOrganizationType('Sole proprietorship')).toBe(
      'SOLE_PROPRIETORSHIP'
    );
    expect(normalizeOrganizationType('c_corporation')).toBe('C_CORPORATION');
    expect(normalizeOrganizationType('Trust')).toBe('Trust');
  });

  it('reads yes/no answers', () => {
    expect(parseYesNo('Yes')).toBe(true);
    expect(parseYesNo('x')).toBe(true);
    expect(parseYesNo('')).toBe(false);
    expect(parseYesNo('N')).toBe(false);
    expect(parseYesNo('maybe')).toBeUndefined();
  });

  it('removes line breaks and invisible characters', () => {
    expect(cleanCell('a\r\nb\tc\u200B\u00A0d')).toBe('a b c d');
  });

  it('transliterates accented names', () => {
    expect(transliterateName('Zoë Łukasz Núñez–Smith')).toBe(
      'Zoe Lukasz Nunez-Smith'
    );
  });
});

describe('import', () => {
  it('round-trips a generated bulk upload file', () => {
    const original = validClient({
      people: [
        createPerson({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@acme.com',
          isBeneficialOwner: true,
        }),
        createPerson({
          firstName: 'Bob',
          lastName: 'Ray',
          email: 'bob@acme.com',
        }),
      ],
    });
    const csv = '\uFEFF' + serializeCsv(buildCsvRows([original]));
    const result = importFromText(csv);
    expect(result.format).toBe('bulk-upload');
    expect(result.notes).toEqual([]);
    expect(buildCsvRows(result.clients)).toEqual(buildCsvRows([original]));
  });

  it('repairs common mistakes in an existing file and explains them', () => {
    const csv = [
      TEMPLATE_HEADER,
      'ORGANIZATION,CLIENT,,,A1,,biz@a.com,Alpha LLC,llc,US,EMBEDDED_PAYMENTS,,,,',
      'INDIVIDUAL,CONTROLLER,AUTHORIZED_USER,,A1-1,A1,ann@a.com,,,,EMBEDDED_PAYMENTS,Ann,,Lee,US',
      'INDIVIDUAL,BENEFICIAL_OWNER,,,Z9_1,Z9,,,,,,Zed,,Ng,US',
    ].join('\n');
    const result = importFromText(csv);
    expect(result.clients).toHaveLength(2);
    expect(result.clients[0].organizationType).toBe(
      'LIMITED_LIABILITY_COMPANY'
    );
    expect(result.clients[0].people[0]).toMatchObject({ firstName: 'Ann' });
    expect(result.notes.join('\n')).toMatch(
      /product removed from a person row/
    );
    expect(result.notes.join('\n')).toMatch(
      /no business row for client ID "Z9"/
    );
    expect(result.notes.join('\n')).toMatch(/Client "Z9" has no controller/);
    expect(result.notes.join('\n')).toMatch(/renumbered/);
  });

  it('makes the authorized user the controller and keeps one controller per business', () => {
    const csv = [
      TEMPLATE_HEADER,
      'ORGANIZATION,CLIENT,,,B1,,b@b.com,Beta LLC,LLC,US,EMBEDDED_PAYMENTS,,,,',
      'INDIVIDUAL,BENEFICIAL_OWNER,CONTROLLER,,B1_1,B1,cy@b.com,,,,,Cy,,Ott,US',
      'INDIVIDUAL,AUTHORIZED_USER,,,B1_2,B1,al@b.com,,,,,Al,,Fox,US',
      'INDIVIDUAL,CONTROLLER,,,B1_3,B1,di@b.com,,,,,Di,,Ray,US',
      'ORGANIZATION,CLIENT,,,C1,,c@c.com,Gamma LLC,LLC,US,EMBEDDED_PAYMENTS,,,,',
      'INDIVIDUAL,CONTROLLER,BENEFICIAL_OWNER,,C1_1,C1,ed@c.com,,,,,Ed,,Lu,US',
    ].join('\n');
    const result = importFromText(csv);
    const notes = result.notes.join('\n');
    const [beta, gamma] = result.clients;

    expect(beta.people.map((p) => p.firstName)).toEqual(['Al', 'Cy']);
    expect(notes).toMatch(/Row 4: CONTROLLER role added/);
    expect(notes).toMatch(/Row 3: CONTROLLER removed from Cy Ott/);
    expect(notes).toMatch(/Row 5: Di Ray left out/);
    expect(buildCsvRows([beta])[1]).toMatchObject({
      'roles.0': 'CONTROLLER',
      'roles.1': 'AUTHORIZED_USER',
    });

    expect(gamma.people[0]).toMatchObject({
      firstName: 'Ed',
      isBeneficialOwner: true,
    });
    expect(notes).toMatch(
      /Row 7: AUTHORIZED_USER role added to the controller/
    );
  });

  it('imports the blank spreadsheet template layout', () => {
    const template = buildSpreadsheetTemplate().trim();
    expect(template).not.toMatch(/controller \(Y\/N\)/i);
    const text = `${template}\r\nB-2,Beta Inc,S corp,,Sam,,Ito,sam@beta.com,yes`;
    const { format, clients } = importFromText(text);
    expect(format).toBe('spreadsheet');
    expect(clients[0]).toMatchObject({
      externalId: 'B-2',
      organizationType: 'S_CORPORATION',
    });
    expect(clients[0].people[0]).toMatchObject({
      firstName: 'Sam',
      email: 'sam@beta.com',
      isBeneficialOwner: true,
    });
  });

  it('still reads the earlier template headers without warnings', () => {
    const text = [
      'Client ID,Legal business name,Business type,Business email (optional),Authorized user first name,Authorized user middle name (optional),Authorized user last name,Authorized user email,Authorized user owns 25% or more (Y/N),Authorized user is controller (Y/N)',
      'B-3,Delta Co,LLC,,Ann,,Lee,ann@d.com,N,Y',
    ].join('\r\n');
    const { clients, notes } = importFromText(text);
    expect(notes).toEqual([]);
    expect(clients[0].people[0]).toMatchObject({
      firstName: 'Ann',
      email: 'ann@d.com',
      isBeneficialOwner: false,
    });
  });

  it('imports headerless rows copied from Excel in on-screen order', () => {
    const { format, clients } = importFromText(
      'C-1\tGamma LP\tLP\t\tAl\t\tBo\tal@g.com\nC-2\tDelta\tLLC'
    );
    expect(format).toBe('positional');
    expect(clients).toHaveLength(2);
    expect(clients[1].organizationType).toBe('LIMITED_LIABILITY_COMPANY');
  });
});

describe('builder reducer', () => {
  it('pastes a block into existing rows and appends the rest', () => {
    const state = createInitialState();
    const firstId = state.clients[0].id;
    const next = builderReducer(state, {
      type: 'paste',
      targetClientIds: [firstId],
      columns: BASE_COLUMN_IDS.slice(1),
      rows: [
        ['Alpha LLC', 'LLC'],
        ['Beta Inc', 'C corp'],
      ],
    });
    expect(next.clients).toHaveLength(2);
    expect(next.clients[0]).toMatchObject({
      id: firstId,
      organizationName: 'Alpha LLC',
      organizationType: 'LIMITED_LIABILITY_COMPANY',
      touched: true,
    });
    expect(next.clients[1].organizationType).toBe('C_CORPORATION');
    expect(next.dirty).toBe(true);
  });

  it('appends imports after dropping trailing blank rows', () => {
    const state = builderReducer(createInitialState(), {
      type: 'addClients',
      count: 2,
    });
    const next = builderReducer(state, {
      type: 'import',
      clients: [validClient()],
      mode: 'append',
    });
    expect(next.clients).toHaveLength(1);
  });

  it('applies suggested fixes', () => {
    const client = validClient({
      people: [createPerson({ firstName: 'Zoë', lastName: 'Doe' })],
    });
    const next = builderReducer(
      { clients: [client], showAllErrors: false, dirty: false },
      {
        type: 'applyFixes',
        fixes: [
          {
            clientId: client.id,
            fix: { personIndex: 0, field: 'firstName', value: 'Zoe' },
          },
        ],
      }
    );
    expect(next.clients[0].people[0].firstName).toBe('Zoe');
  });

  it('never removes the controller', () => {
    const state = createInitialState();
    const next = builderReducer(state, {
      type: 'removePerson',
      clientId: state.clients[0].id,
      personIndex: 0,
    });
    expect(next).toBe(state);
  });
});
