import type { CreateDebitCardResponse } from 'generated-api-models';

export const debitCardCreateResponseMock: CreateDebitCardResponse = {
  accountId: '501012502503',
  message:
    'XXXX-XXXX-XXXX-9196 card successfully created. A Physical card will be mailed to the address on file.',
  link: 'https://prepaid-dev.jpmchase.net:8801/chp-logon/index.html#/iframecard?id=ZcJ/Vk8ZPKhrE0QZOI35yzL71vB62rvV9yAgUhWqAH/9NL1kjhkfjjhkmerjgVcNLtK1oLnKy6YYv%2BIkhokaSM1b4SLeTl%2B2sqg5kDSYOeA==',
  id: '100000161175',
};
