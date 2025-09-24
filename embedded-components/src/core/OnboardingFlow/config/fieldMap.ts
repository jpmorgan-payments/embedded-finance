import { i18n } from '@/i18n/config';
import {
  formatPhoneNumberIntl,
  parsePhoneNumber,
} from 'react-phone-number-input';

import {
  AddressDto,
  IndividualIdentity,
  OrganizationIdentityDto,
  OrganizationType,
  PhoneSmbdo,
} from '@/api/generated/smbdo.schemas';
import naicsCodes from '@/core/OnboardingFlow/components/IndustryTypeSelect/naics-codes.json';
import { PartyFieldMap } from '@/core/OnboardingFlow/types/form.types';

// Source of truth for mapping form fields to API fields
// path is used for handling server errors and mapping values from/to the API
// rules are used for configuring field display, required, etc.
export const partyFieldMap: PartyFieldMap = {
  // #region Gateway
  organizationName: {
    path: 'organizationDetails.organizationName',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
    fromResponseFn: (val) => (val === 'PLACEHOLDER_ORG_NAME' ? '' : val),
    conditionalRules: [
      {
        condition: {
          entityType: ['SOLE_PROPRIETORSHIP'],
        },
        rule: {
          interaction: 'readonly',
          required: false,
          defaultValue: i18n.t('common:na'),
          contentTokenOverrideKey: 'soleProp',
        },
      },
    ],
  },
  organizationTypeHierarchy: {
    path: 'organizationDetails.organizationType',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: {
        generalOrganizationType: '',
        specificOrganizationType: '',
      },
    },
    fromResponseFn: (val: OrganizationType) => {
      if (val === 'SOLE_PROPRIETORSHIP') {
        return {
          generalOrganizationType: 'SOLE_PROPRIETORSHIP',
          specificOrganizationType: 'SOLE_PROPRIETORSHIP',
        };
      }
      if (
        [
          'LIMITED_LIABILITY_COMPANY',
          'LIMITED_LIABILITY_PARTNERSHIP',
          'C_CORPORATION',
          'S_COPORATION',
          'GENERAL_PARTNERSHIP',
          'LIMITED_PARTNERSHIP',
          'PARTNERSHIP',
        ].includes(val)
      ) {
        return {
          generalOrganizationType: 'REGISTERED_BUSINESS',
          specificOrganizationType: val,
        };
      }
      if (
        [
          'NON_PROFIT_COPORATION',
          'GOVERNMENT_ENTITY',
          'UNINCORPORATED ASSOCIATION',
        ].includes(val)
      ) {
        return {
          generalOrganizationType: 'OTHER',
          specificOrganizationType: val,
        };
      }
      return {
        generalOrganizationType: 'OTHER',
        specificOrganizationType: val,
      };
    },
    toRequestFn: (val): OrganizationType => {
      return val.specificOrganizationType;
    },
  },
  // #endregion
  countryOfFormation: {
    path: 'organizationDetails.countryOfFormation',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: 'US',
    },
    conditionalRules: [
      {
        condition: {
          product: ['EMBEDDED_PAYMENTS'],
          jurisdiction: ['US'],
        },
        rule: {
          interaction: 'disabled',
        },
      },
    ],
  },
  organizationEmail: {
    path: 'email',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
    conditionalRules: [
      {
        condition: {
          entityType: ['SOLE_PROPRIETORSHIP'],
        },
        rule: {
          contentTokenOverrideKey: 'soleProp',
        },
      },
    ],
  },
  controllerEmail: {
    path: 'email',
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: '',
    },
  },
  // ownerEmail: {
  //   path: 'email',
  //   baseRule: {
  //     display: 'visible',
  //     required: false,
  //     defaultValue: '',
  //   },
  // },
  natureOfOwnership: {
    path: 'individualDetails.natureOfOwnership',
    baseRule: {
      display: 'hidden',
      required: false,
      defaultValue: '',
    },
    conditionalRules: [
      {
        condition: {
          screenId: ['owner-stepper'],
        },
        rule: {
          display: 'visible',
          required: true,
        },
      },
    ],
  },
  solePropSsn: {
    path: 'individualDetails.individualIds',
    baseRule: {
      display: 'hidden',
      required: false,
      defaultValue: '',
    },
    conditionalRules: [
      {
        condition: {
          entityType: ['SOLE_PROPRIETORSHIP'],
          screenId: ['personal-section'],
        },
        rule: {
          display: 'visible',
          required: true,
        },
      },
    ],
    toStringFn: (val) => {
      if (val === undefined) {
        return undefined;
      }
      return val.replace(/(\d{3})(\d{2})(\d{4})/, '$1 - $2 - $3');
    },
    fromResponseFn: (val: IndividualIdentity[]) => {
      return val.find((id) => id.idType === 'SSN')?.value ?? '';
    },
    toRequestFn: (val): IndividualIdentity[] => {
      return [
        {
          issuer: 'US',
          idType: 'SSN',
          value: val,
        },
      ];
    },
  },
  yearOfFormation: {
    path: 'organizationDetails.yearOfFormation',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  dbaName: {
    path: 'organizationDetails.dbaName',
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: '',
    },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { display: 'hidden' },
      },
    ],
    toStringFn: (val, formValues) => {
      if (formValues.dbaNameNotAvailable) {
        return formValues.organizationName === 'PLACEHOLDER_ORG_NAME'
          ? i18n.t('common:na')
          : formValues.organizationName;
      }
      return val;
    },
  },
  organizationDescription: {
    path: 'organizationDetails.organizationDescription',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
  },
  industry: {
    path: 'organizationDetails.industry',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
    toStringFn: (val) => {
      if (val === undefined) {
        return undefined;
      }
      const industry = naicsCodes.find((code) => code.id === val);
      return `[${val}]  ${industry?.sectorDescription} - ${industry?.description}`;
    },
    fromResponseFn: (val) => val.code,
    toRequestFn: (val) => {
      return {
        codeType: 'NAICS',
        code: val,
      };
    },
  },
  // mcc: {
  //   path: 'organizationDetails.mcc',
  //   baseRule: {
  //     display: 'hidden',
  //     required: false,
  //     defaultValue: '',
  //   },
  // },
  // associatedCountries: {
  //   path: 'organizationDetails.associatedCountries',
  //   baseRule: {
  //     display: 'hidden',
  //     minItems: 0,
  //     maxItems: 100,
  //     defaultValue: [],
  //     defaultAppendValue: {
  //       country: '',
  //     },
  //   },
  //   subFields: {
  //     country: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //   },
  // },
  solePropHasEin: {
    excludeFromMapping: true,
    saveResponseInContext: true,
    path: 'organizationDetails.organizationIds',
    isHiddenInReviewFn: () => true,
    baseRule: {
      display: 'hidden',
      required: false,
      defaultValue: '',
    },
    conditionalRules: [
      {
        condition: {
          entityType: ['SOLE_PROPRIETORSHIP'],
        },
        rule: {
          display: 'visible',
        },
      },
    ],
    fromResponseFn: (val: OrganizationIdentityDto[]) => {
      return val.some((id) => id.idType === 'EIN') ? 'yes' : 'no';
    },
  },
  organizationIdEin: {
    path: 'organizationDetails.organizationIds',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
    conditionalRules: [
      {
        condition: {
          entityType: ['SOLE_PROPRIETORSHIP'],
        },
        rule: {
          required: false,
          contentTokenOverrideKey: 'soleProp',
        },
      },
    ],
    toStringFn: (val) => {
      if (val === undefined) {
        return undefined;
      }
      return val.replace(/(\d{2})(\d{7})/, '$1 - $2');
    },
    fromResponseFn: (val: OrganizationIdentityDto[]) => {
      return val.find((id) => id.idType === 'EIN')?.value ?? '';
    },
    toRequestFn: (val): OrganizationIdentityDto[] => {
      return [
        {
          issuer: 'US',
          idType: 'EIN',
          value: val,
        },
      ];
    },
  },
  // organizationIds: {
  //   path: 'organizationDetails.organizationIds',
  //   baseRule: {
  //     display: 'visible',
  //     minItems: 1,
  //     maxItems: 1,
  //     defaultValue: [
  //       {
  //         idType: 'EIN',
  //         issuer: 'US',
  //         value: '',
  //       },
  //     ],
  //     defaultAppendValue: {
  //       idType: 'EIN',
  //       issuer: 'US',
  //       value: '',
  //     },
  //   },
  //   conditionalRules: [
  //     {
  //       condition: {
  //         entityType: ['SOLE_PROPRIETORSHIP'],
  //       },
  //       rule: {
  //         minItems: 0,
  //         defaultValue: [],
  //         display: 'hidden',
  //       },
  //     },
  //   ],
  //   generateLabelStringFn: (val) => {
  //     const primaryId = val?.[0];
  //     if (!primaryId) {
  //       return undefined;
  //     }
  //     return `${i18n.t(`onboarding-overview:idValueLabels.${primaryId.idType}`)} (${primaryId.issuer})`;
  //   },
  //   toStringFn: (val) => {
  //     if (val === undefined) {
  //       return undefined;
  //     }
  //     const primaryId = val[0];
  //     return primaryId.value.replace(/(\d{2})(\d{7})/, '$1 - $2');
  //   },
  //   subFields: {
  //     idType: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     issuer: {
  //       baseRule: { display: 'visible', required: true },
  //       conditionalRules: [
  //         {
  //           condition: {
  //             product: ['EMBEDDED_PAYMENTS'],
  //           },
  //           rule: { interaction: 'disabled', defaultValue: 'US' },
  //         },
  //       ],
  //     },
  //     value: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     description: {
  //       baseRule: { display: 'visible', required: false },
  //       conditionalRules: [
  //         {
  //           condition: {
  //             product: ['EMBEDDED_PAYMENTS'],
  //           },
  //           rule: { display: 'hidden' },
  //         },
  //       ],
  //     },
  //     expiryDate: {
  //       baseRule: { display: 'visible', required: false },
  //       conditionalRules: [
  //         {
  //           condition: {
  //             product: ['EMBEDDED_PAYMENTS'],
  //           },
  //           rule: { display: 'hidden' },
  //         },
  //       ],
  //     },
  //   },
  // },
  organizationPhone: {
    path: 'organizationDetails.phone',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: { phoneType: 'BUSINESS_PHONE', phoneNumber: '' },
    },
    toStringFn: (val) =>
      val ? formatPhoneNumberIntl(val.phoneNumber) : undefined,
    fromResponseFn: (val: PhoneSmbdo) => ({
      phoneType: val.phoneType!,
      phoneNumber: `${val.countryCode}${val.phoneNumber}`,
    }),
    toRequestFn: (val): PhoneSmbdo => {
      const phone = parsePhoneNumber(val.phoneNumber);
      return {
        phoneType: val.phoneType,
        countryCode: phone?.countryCallingCode
          ? `+${phone.countryCallingCode}`
          : '',
        phoneNumber: phone?.nationalNumber ?? '',
      };
    },
  },
  website: {
    path: 'organizationDetails.website',
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: '',
    },
    toStringFn: (val, formValues) =>
      !formValues.websiteNotAvailable ? val : undefined,
  },
  // websiteAvailable: {
  //   path: 'organizationDetails.websiteAvailable',
  //   baseRule: {
  //     display: 'visible',
  //     required: false,
  //     defaultValue: false,
  //   },
  //   fromResponseFn: (val: boolean) => !val,
  //   toRequestFn: (val): boolean => !val,
  // },
  websiteNotAvailable: {
    path: 'organizationDetails.websiteAvailable',
    isHiddenInReviewFn: () => true,
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: false,
    },
    fromResponseFn: (val: boolean) => val === false,
    toRequestFn: (val): boolean => !val,
  },
  dbaNameNotAvailable: {
    excludeFromMapping: true,
    saveResponseInContext: true,
    isHiddenInReviewFn: () => true,
    baseRule: {
      display: 'visible',
      required: false,
      defaultValue: false,
    },
  },
  // secondaryMccList: {
  //   path: 'organizationDetails.secondaryMccList',
  //   baseRule: {
  //     display: 'hidden',
  //     minItems: 0,
  //     maxItems: 50,
  //     defaultValue: [],
  //     defaultAppendValue: {
  //       mcc: '',
  //     },
  //   },
  //   subFields: {
  //     mcc: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //   },
  // },
  birthDate: {
    path: 'individualDetails.birthDate',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: '',
    },
    toStringFn: (val) => {
      if (val === undefined) {
        return undefined;
      }
      return new Date(val).toLocaleDateString('default', {
        month: 'long',
        day: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      });
    },
  },
  countryOfResidence: {
    path: 'individualDetails.countryOfResidence',
    baseRule: { display: 'visible', required: true, defaultValue: 'US' },
    toStringFn: (val) => `${i18n.t(`common:countries.${val}`)} (${val})`,
  },
  controllerFirstName: {
    path: 'individualDetails.firstName',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
  },
  controllerMiddleName: {
    path: 'individualDetails.middleName',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
  },
  controllerLastName: {
    path: 'individualDetails.lastName',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
  },
  controllerNameSuffix: {
    path: 'individualDetails.nameSuffix',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { display: 'hidden' },
      },
    ],
  },
  // ownerFirstName: {
  //   path: 'individualDetails.firstName',
  //   baseRule: { display: 'visible', required: true, defaultValue: '' },
  // },
  // ownerMiddleName: {
  //   path: 'individualDetails.middleName',
  //   baseRule: { display: 'visible', required: false, defaultValue: '' },
  // },
  // ownerLastName: {
  //   path: 'individualDetails.lastName',
  //   baseRule: { display: 'visible', required: true, defaultValue: '' },
  // },
  // ownerNameSuffix: {
  //   path: 'individualDetails.nameSuffix',
  //   baseRule: { display: 'visible', required: false, defaultValue: '' },
  //   conditionalRules: [
  //     {
  //       condition: {
  //         product: ['MERCHANT_SERVICES'],
  //         jurisdiction: ['CA'],
  //       },
  //       rule: { display: 'hidden' },
  //     },
  //   ],
  // },
  controllerIds: {
    path: 'individualDetails.individualIds',
    baseRule: {
      display: 'visible',
      minItems: 1,
      maxItems: 1,
      defaultValue: [
        {
          idType: 'SSN',
          issuer: 'US',
          value: '',
        },
      ],
      defaultAppendValue: {
        idType: 'SSN',
        issuer: 'US',
        value: '',
      },
    },
    conditionalRules: [
      {
        condition: {
          entityType: ['SOLE_PROPRIETORSHIP'],
        },
        rule: {
          minItems: 0,
          defaultValue: [],
          display: 'hidden',
        },
      },
    ],
    generateLabelStringFn: (val) => {
      const primaryId = val?.[0];
      if (!primaryId) {
        return undefined;
      }
      return `${i18n.t(`onboarding-overview:idValueLabels.${primaryId.idType}`)} (${primaryId.issuer})`;
    },
    toStringFn: (val) => {
      if (val === undefined) {
        return undefined;
      }
      const primaryId = val[0];
      return primaryId.value.replace(/(\d{3})(\d{2})(\d{4})/, 'XXX-XX-$3');
    },
    subFields: {
      idType: {
        baseRule: { display: 'visible', required: true },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { interaction: 'disabled' },
          },
        ],
      },
      issuer: {
        baseRule: { display: 'visible', required: true },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { interaction: 'enabled', defaultValue: 'US' },
          },
        ],
      },
      value: {
        baseRule: { display: 'visible', required: true },
        conditionalRules: [
          {
            condition: {
              entityType: ['SOLE_PROPRIETORSHIP'],
            },
            rule: {
              display: 'hidden',
              required: false,
            },
          },
        ],
      },
      description: {
        baseRule: { display: 'visible', required: false },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { display: 'hidden' },
          },
        ],
      },
      expiryDate: {
        baseRule: { display: 'visible', required: false },
        conditionalRules: [
          {
            condition: {
              product: ['EMBEDDED_PAYMENTS'],
            },
            rule: { display: 'hidden' },
          },
        ],
      },
    },
  },
  // ownerIds: {
  //   path: 'individualDetails.individualIds',
  //   baseRule: {
  //     display: 'visible',
  //     minItems: 1,
  //     maxItems: 1,
  //     defaultValue: [
  //       {
  //         idType: 'SSN',
  //         issuer: 'US',
  //         value: '',
  //       },
  //     ],
  //     defaultAppendValue: {
  //       idType: 'SSN',
  //       issuer: 'US',
  //       value: '',
  //     },
  //   },
  //   subFields: {
  //     idType: {
  //       baseRule: { display: 'visible', required: true },
  //       conditionalRules: [
  //         {
  //           condition: {
  //             product: ['EMBEDDED_PAYMENTS'],
  //           },
  //           rule: { interaction: 'disabled' },
  //         },
  //       ],
  //     },
  //     issuer: {
  //       baseRule: { display: 'visible', required: true },
  //       conditionalRules: [
  //         {
  //           condition: {
  //             product: ['EMBEDDED_PAYMENTS'],
  //           },
  //           rule: { interaction: 'disabled', defaultValue: 'US' },
  //         },
  //       ],
  //     },
  //     value: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     description: {
  //       baseRule: { display: 'visible', required: false },
  //       conditionalRules: [
  //         {
  //           condition: {
  //             product: ['EMBEDDED_PAYMENTS'],
  //           },
  //           rule: { display: 'hidden' },
  //         },
  //       ],
  //     },
  //     expiryDate: {
  //       baseRule: { display: 'visible', required: false },
  //       conditionalRules: [
  //         {
  //           condition: {
  //             product: ['EMBEDDED_PAYMENTS'],
  //           },
  //           rule: { display: 'hidden' },
  //         },
  //       ],
  //     },
  //   },
  // },
  controllerJobTitle: {
    path: 'individualDetails.jobTitle',
    baseRule: { display: 'visible', required: true, defaultValue: '' },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { display: 'hidden' },
      },
    ],
  },
  controllerJobTitleDescription: {
    path: 'individualDetails.jobTitleDescription',
    baseRule: { display: 'visible', required: false, defaultValue: '' },
    conditionalRules: [
      {
        condition: {
          product: ['MERCHANT_SERVICES'],
          jurisdiction: ['CA'],
        },
        rule: { display: 'hidden' },
      },
    ],
  },
  individualAddress: {
    path: 'individualDetails.addresses',
    toStringFn: (address) => {
      if (!address) {
        return undefined;
      }
      return [
        address.primaryAddressLine,
        address.secondaryAddressLine,
        address.tertiaryAddressLine,
        `${address.city}, ${address.state} ${address.postalCode}`,
        i18n.t(`common:countries.${address.country}`),
      ].filter((line) => line && line.trim() !== '');
    },
    modifyErrorField: (field) => {
      const parts = field.split('.');
      const lastPart = parts[parts.length - 1];
      const secondToLastPart = parts[parts.length - 2];
      if (secondToLastPart === 'addressLines' && /^\d+$/.test(lastPart)) {
        if (lastPart === '0') {
          return [
            ...parts.slice(0, parts.length - 2),
            'primaryAddressLine',
          ].join('.');
        }
        if (lastPart === '1') {
          return [
            ...parts.slice(0, parts.length - 2),
            'secondaryAddressLine',
          ].join('.');
        }
        if (lastPart === '2') {
          return [
            ...parts.slice(0, parts.length - 2),
            'tertiaryAddressLine',
          ].join('.');
        }
      }

      return field;
    },
    baseRule: {
      display: 'visible',
      defaultValue: {
        addressType: 'RESIDENTIAL_ADDRESS',
        primaryAddressLine: '',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
    },
    conditionalRules: [
      {
        condition: {
          screenId: ['owner-stepper'],
        },
        rule: {
          contentTokenOverrideKey: 'owner',
        },
      },
    ],
    fromResponseFn: (val: AddressDto[]) => {
      const residentialAddress = val.find(
        (address) => address.addressType === 'RESIDENTIAL_ADDRESS'
      );
      return {
        addressType: 'RESIDENTIAL_ADDRESS',
        city: residentialAddress?.city ?? '',
        state: residentialAddress?.state ?? '',
        postalCode: residentialAddress?.postalCode ?? '',
        country: residentialAddress?.country ?? '',
        primaryAddressLine: residentialAddress?.addressLines?.[0] ?? '',
        secondaryAddressLine: residentialAddress?.addressLines?.[1] ?? '',
        tertiaryAddressLine: residentialAddress?.addressLines?.[2] ?? '',
      };
    },
    toRequestFn: (address): AddressDto[] => {
      return [
        {
          ...address,
          addressLines: [
            address.primaryAddressLine,
            address.secondaryAddressLine,
            address.tertiaryAddressLine,
          ].filter((line) => line !== undefined && line !== ''),
        },
      ];
    },
  },
  organizationAddress: {
    path: 'organizationDetails.addresses',
    toStringFn: (address) => {
      if (!address) {
        return undefined;
      }
      return [
        address.primaryAddressLine,
        address.secondaryAddressLine,
        address.tertiaryAddressLine,
        `${address.city}, ${address.state} ${address.postalCode}`,
        i18n.t(`common:countries.${address.country}`),
      ].filter((line) => line && line.trim() !== '');
    },
    modifyErrorField: (field) => {
      const parts = field.split('.');
      const lastPart = parts[parts.length - 1];
      const secondToLastPart = parts[parts.length - 2];
      if (secondToLastPart === 'addressLines' && /^\d+$/.test(lastPart)) {
        if (lastPart === '0') {
          return [
            ...parts.slice(0, parts.length - 2),
            'primaryAddressLine',
          ].join('.');
        }
        if (lastPart === '1') {
          return [
            ...parts.slice(0, parts.length - 2),
            'secondaryAddressLine',
          ].join('.');
        }
        if (lastPart === '2') {
          return [
            ...parts.slice(0, parts.length - 2),
            'tertiaryAddressLine',
          ].join('.');
        }
      }

      return field;
    },
    baseRule: {
      display: 'visible',
      defaultValue: {
        addressType: 'BUSINESS_ADDRESS',
        primaryAddressLine: '',
        secondaryAddressLine: '',
        tertiaryAddressLine: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
      },
    },
    fromResponseFn: (val: AddressDto[]) => {
      const businessAddress = val.find(
        (address) => address.addressType === 'BUSINESS_ADDRESS'
      );
      return {
        addressType: 'BUSINESS_ADDRESS',
        city: businessAddress?.city ?? '',
        state: businessAddress?.state ?? '',
        postalCode: businessAddress?.postalCode ?? '',
        country: businessAddress?.country ?? '',
        primaryAddressLine: businessAddress?.addressLines?.[0] ?? '',
        secondaryAddressLine: businessAddress?.addressLines?.[1] ?? '',
        tertiaryAddressLine: businessAddress?.addressLines?.[2] ?? '',
      };
    },
    toRequestFn: (address): AddressDto[] => {
      return [
        {
          ...address,
          addressLines: [
            address.primaryAddressLine,
            address.secondaryAddressLine,
            address.tertiaryAddressLine,
          ].filter((line) => line !== undefined && line !== ''),
        },
      ];
    },
  },
  // controllerAddresses: {
  //   path: 'individualDetails.addresses',
  //   toStringFn: (addresses) => {
  //     if (!addresses || addresses.length === 0) {
  //       return undefined;
  //     }
  //     const primaryAddress = addresses[0];
  //     return [
  //       primaryAddress.primaryAddressLine,
  //       ...primaryAddress.additionalAddressLines.map((line) => line.value),
  //       `${primaryAddress.city}, ${primaryAddress.state} ${primaryAddress.postalCode}`,
  //       i18n.t(`common:countries.${primaryAddress.country}`),
  //     ];
  //   },
  //   modifyErrorField: (field) => {
  //     const parts = field.split('.');
  //     const lastPart = parts[parts.length - 1];
  //     const secondToLastPart = parts[parts.length - 2];
  //     if (secondToLastPart === 'addressLines' && /^\d+$/.test(lastPart)) {
  //       if (lastPart === '0') {
  //         return [
  //           ...parts.slice(0, parts.length - 2),
  //           'primaryAddressLine',
  //         ].join('.');
  //       }

  //       return [
  //         ...parts.slice(0, parts.length - 2),
  //         'additionalAddressLines',
  //         Number(lastPart) - 1,
  //         'value',
  //       ].join('.');
  //     }

  //     return field;
  //   },
  //   baseRule: {
  //     display: 'visible',
  //     minItems: 1,
  //     maxItems: 1,
  //     defaultValue: [
  //       {
  //         addressType: 'RESIDENTIAL_ADDRESS',
  //         primaryAddressLine: '',
  //         additionalAddressLines: [{ value: '' }],
  //         city: '',
  //         state: '',
  //         postalCode: '',
  //         country: 'US',
  //       },
  //     ],
  //     defaultAppendValue: {
  //       addressType: 'RESIDENTIAL_ADDRESS',
  //       primaryAddressLine: '',
  //       additionalAddressLines: [{ value: '' }],
  //       city: '',
  //       state: '',
  //       postalCode: '',
  //       country: '',
  //     },
  //   },
  //   subFields: {
  //     addressType: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     primaryAddressLine: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     additionalAddressLines: {
  //       baseRule: {
  //         display: 'visible',
  //         minItems: 1,
  //         maxItems: 2,
  //       },
  //       subFields: {
  //         value: {
  //           baseRule: { display: 'visible', required: false },
  //         },
  //       },
  //     },
  //     city: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     state: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     postalCode: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     country: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //   },
  //   fromResponseFn: (addressesFromApi: AddressDto[]) => {
  //     return addressesFromApi.map((address) => ({
  //       ...address,
  //       primaryAddressLine: address?.addressLines?.[0] ?? '',
  //       additionalAddressLines:
  //         address?.addressLines?.length > 1
  //           ? address.addressLines?.slice(1).map((line: any) => ({
  //               value: line.value,
  //             }))
  //           : [{ value: '' }],
  //       state: address.state ?? '',
  //       addressType: address.addressType ?? 'LEGAL_ADDRESS',
  //     }));
  //   },
  //   toRequestFn: (addresses): AddressDto[] => {
  //     return addresses.map((address) => ({
  //       ...address,
  //       addressLines: [
  //         address.primaryAddressLine,
  //         ...address.additionalAddressLines
  //           .filter((line) => line.value)
  //           .map((line) => line.value),
  //       ],
  //     }));
  //   },
  // },
  // ownerAddresses: {
  //   path: 'individualDetails.addresses',
  //   modifyErrorField: (field) => {
  //     const parts = field.split('.');
  //     const lastPart = parts[parts.length - 1];
  //     const secondToLastPart = parts[parts.length - 2];
  //     if (secondToLastPart === 'addressLines' && /^\d+$/.test(lastPart)) {
  //       if (lastPart === '0') {
  //         return [
  //           ...parts.slice(0, parts.length - 2),
  //           'primaryAddressLine',
  //         ].join('.');
  //       }

  //       return [
  //         ...parts.slice(0, parts.length - 2),
  //         'additionalAddressLines',
  //         Number(lastPart) - 1,
  //         'value',
  //       ].join('.');
  //     }

  //     return field;
  //   },
  //   baseRule: {
  //     display: 'visible',
  //     minItems: 1,
  //     maxItems: 1,
  //     defaultValue: [
  //       {
  //         addressType: 'RESIDENTIAL_ADDRESS',
  //         primaryAddressLine: '',
  //         additionalAddressLines: [{ value: '' }],
  //         city: '',
  //         state: '',
  //         postalCode: '',
  //         country: '',
  //       },
  //     ],
  //     defaultAppendValue: {
  //       addressType: 'RESIDENTIAL_ADDRESS',
  //       primaryAddressLine: '',
  //       additionalAddressLines: [{ value: '' }],
  //       city: '',
  //       state: '',
  //       postalCode: '',
  //       country: '',
  //     },
  //   },
  //   subFields: {
  //     addressType: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     primaryAddressLine: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     additionalAddressLines: {
  //       baseRule: {
  //         display: 'visible',
  //         minItems: 1,
  //         requiredItems: 0,
  //         maxItems: 2,
  //       },
  //       subFields: {
  //         value: {
  //           baseRule: { display: 'visible', required: false },
  //         },
  //       },
  //     },
  //     city: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     state: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     postalCode: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //     country: {
  //       baseRule: { display: 'visible', required: true },
  //     },
  //   },
  //   fromResponseFn: (addressesFromApi: AddressDto[]) => {
  //     return addressesFromApi.map((address) => ({
  //       ...address,
  //       primaryAddressLine: address?.addressLines?.[0] ?? '',
  //       additionalAddressLines:
  //         address?.addressLines?.length > 1
  //           ? address.addressLines?.slice(1).map((line: any) => ({
  //               value: line.value,
  //             }))
  //           : [{ value: '' }],
  //       state: address.state ?? '',
  //       addressType: address.addressType ?? 'LEGAL_ADDRESS',
  //     }));
  //   },
  //   toRequestFn: (addresses): AddressDto[] => {
  //     return addresses.map((address) => ({
  //       ...address,
  //       addressLines: [
  //         address.primaryAddressLine,
  //         ...address.additionalAddressLines
  //           .filter((line) => line.value)
  //           .map((line) => line.value),
  //       ],
  //     }));
  //   },
  // },
  controllerPhone: {
    path: 'individualDetails.phone',
    baseRule: {
      display: 'visible',
      required: true,
      defaultValue: { phoneType: 'MOBILE_PHONE', phoneNumber: '' },
    },
    toStringFn: (val) =>
      val ? formatPhoneNumberIntl(val.phoneNumber) : undefined,
    fromResponseFn: (val: PhoneSmbdo) => ({
      phoneType: val.phoneType!,
      phoneNumber: `${val.countryCode}${val.phoneNumber}`,
    }),
    toRequestFn: (val): PhoneSmbdo => {
      const phone = parsePhoneNumber(val.phoneNumber);
      return {
        phoneType: val.phoneType,
        countryCode: phone?.countryCallingCode
          ? `+${phone.countryCallingCode}`
          : '',
        phoneNumber: phone?.nationalNumber ?? '',
      };
    },
  },
  // ownerPhone: {
  //   path: 'individualDetails.phone',
  //   baseRule: {
  //     display: 'visible',
  //     required: true,
  //     defaultValue: { phoneType: 'MOBILE_PHONE', phoneNumber: '' },
  //   },
  //   fromResponseFn: (val: PhoneSmbdo) => ({
  //     phoneType: val.phoneType!,
  //     phoneNumber: `${val.countryCode}${val.phoneNumber}`,
  //   }),
  //   toRequestFn: (val): PhoneSmbdo => {
  //     const phone = parsePhoneNumber(val.phoneNumber);
  //     return {
  //       phoneType: val.phoneType,
  //       countryCode: phone?.countryCallingCode
  //         ? `+${phone.countryCallingCode}`
  //         : '',
  //       phoneNumber: phone?.nationalNumber ?? '',
  //     };
  //   },
  // },
};
