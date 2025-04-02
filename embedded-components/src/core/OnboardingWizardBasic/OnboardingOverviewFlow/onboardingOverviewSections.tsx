// org type condition
// disabled.locked condition state

import { BuildingIcon, UserIcon } from 'lucide-react';

export const onboardingOverviewSections = [
  {
    id: 'personal-details',
    title: 'Personal details',
    icon: UserIcon,
    steps: [
      {
        title: 'Personal details',
        description:
          'We collect your personal information as the primary person controlling business operations for the company.',
        form: <div></div>,
      },
      {
        title: 'Identity document',
        description: 'We need some additional details to confirm your identity',
        form: <div></div>,
      },
    ],
  },
  {
    id: 'business-details',
    title: 'Business details',
    icon: BuildingIcon,
    steps: [
      {
        title: 'Personal details',
        description:
          'We collect your personal information as the primary person controlling business operations for the company.',
        form: <div></div>,
      },
      {
        title: 'Identity document',
        description: 'We need some additional details to confirm your identity',
        form: <div></div>,
      },
    ],
  },
];
