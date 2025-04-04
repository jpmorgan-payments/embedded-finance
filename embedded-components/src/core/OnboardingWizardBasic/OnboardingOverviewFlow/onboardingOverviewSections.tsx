// org type condition
// disabled.locked condition state

import { BuildingIcon, UserIcon } from 'lucide-react';

export const onboardingOverviewSections = [
  {
    id: 'personal',
    title: 'Personal details',
    icon: UserIcon,
    steps: [
      {
        id: 'personal-details',
        title: 'Personal details',
        description:
          'We collect your personal information as the primary person controlling business operations for the company.',
        form: <div></div>,
      },
      {
        id: 'identity-document',
        title: 'Identity document',
        description: 'We need some additional details to confirm your identity',
        form: <div></div>,
      },
    ],
  },
  {
    id: 'business',
    title: 'Business details',
    icon: BuildingIcon,
    steps: [
      {
        id: 'company-details',
        title: 'Company details',
        description: '',
        form: <div></div>,
      },
      {
        id: 'company-identification',
        title: 'Company identification',
        description: '',
        form: <div></div>,
      },
    ],
  },
];
