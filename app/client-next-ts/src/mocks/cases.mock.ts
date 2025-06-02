import type { CasesPaginationResponse } from 'generated-api-models';

export const casesMock: CasesPaginationResponse = {
  metadata: {
    limit: 10,
    page: 0,
    totalItems: 3,
  },
  items: [
    {
      id: '00001154',
      type: 'CARD',
      status: 'OPEN',
      subject: 'Lost my debit card',
      createdDate: '2022-02-22T18:02:23.000+0000',
      updatedDate: '2022-02-24T19:02:23.000+0000',
      createdBy: {
        name: 'Claudio James',
        agent: false,
      },
    },
    {
      id: '00001234',
      type: 'STATEMENT',
      status: 'REOPEN',
      subject: 'Need help getting my statement',
      createdDate: '2022-02-01T13:31:13.000+0000',
      updatedDate: '2022-02-02T11:26:45.000+0000',
      createdBy: {
        name: 'Claudio James',
        agent: false,
      },
    },
    {
      id: '00001314',
      type: 'TRANSACTION',
      status: 'CLOSED',
      subject: 'Issue with a payment made on 2/23/2022',
      createdDate: '2022-02-22T18:02:23.000+0000',
      updatedDate: '2022-02-22T18:02:23.000+0000',
      createdBy: {
        name: 'Claudio James',
        agent: false,
      },
    },
  ],
} as CasesPaginationResponse;
