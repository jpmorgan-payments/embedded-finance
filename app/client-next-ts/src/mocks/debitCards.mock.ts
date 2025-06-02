import type { DebitCardsResponse, DebitCard } from 'generated-api-models';

export const debitCardsMock: DebitCardsResponse = {
  metadata: { page: 0, limit: 25, total_items: 4 },
  items: [
    {
      id: '113872571506',
      accountId: '9he92llalh1ago16v66b5deyzyuoy8412',
      last4: '6756',
      firstName: 'Katelin',
      middleName: 'North',
      lastName: 'Raynor',
      status: 'Active' as DebitCard.status,
      expirationDate: '30-Sep-2024',
    },
    {
      id: '943515231097',
      accountId: '9he92llalh1ago16v66b5deyzyuoy8412',
      last4: '4401',
      firstName: 'Tyrese',
      middleName: 'Emerson',
      lastName: 'Wunsch',
      status: 'Inactive' as DebitCard.status,
      expirationDate: '30-Sep-2024',
    },
    {
      id: '9he92llalh1ago16v66b5deyzyuoy8412',
      accountId: '9he92llalh1ago16v66b5deyzyuoy8412',
      last4: '4072',
      firstName: 'Christian',
      middleName: 'Reese',
      lastName: 'Ortiz',
      status: 'Inactive' as DebitCard.status,
      expirationDate: '30-Sep-2024',
    },
    {
      id: '824754202720',
      accountId: '9he92llalh1ago16v66b5deyzyuoy8412',
      last4: '2368',
      firstName: 'Charley',
      middleName: 'Alex',
      lastName: 'Nolan',
      status: 'Active' as DebitCard.status,
      expirationDate: '30-Sep-2024',
    },
  ],
};
