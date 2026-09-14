import { z } from 'zod';

const maintenanceStatusSchema = z.enum([
  'NEW',
  'REVIEW_IN_PROGRESS',
  'INFORMATION_REQUESTED',
  'APPROVED',
  'DECLINED',
  'TERMINATED',
]);

const maintenanceUpdateRequestSchema = z
  .object({
    status: maintenanceStatusSchema.optional(),
    action: z.enum(['ADD', 'MODIFY', 'DELETE']).optional(),
    requestId: z.string().optional(),
    submittedAt: z.string().datetime().optional(),
  })
  .passthrough();

const maintenanceAddressSchema = z
  .object({
    addressType: z.string().optional(),
    addressLines: z.array(z.string()).optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  })
  .passthrough();

const maintenanceIdentitySchema = z
  .object({
    idType: z.string().optional(),
    value: z.string().optional(),
    issuer: z.string().optional(),
  })
  .passthrough();

const maintenancePhoneSchema = z
  .object({
    phoneType: z.string().optional(),
    countryCode: z.string().optional(),
    phoneNumber: z.string().optional(),
  })
  .passthrough();

const maintenanceIndividualDetailsSchema = z
  .object({
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    birthDate: z.string().optional(),
    countryOfResidence: z.string().optional(),
    natureOfOwnership: z.string().optional(),
    nameSuffix: z.string().optional(),
    jobTitle: z.string().optional(),
    jobTitleDescription: z.string().optional(),
    addresses: z.array(maintenanceAddressSchema).optional(),
    individualIds: z.array(maintenanceIdentitySchema).optional(),
    phone: maintenancePhoneSchema.optional(),
  })
  .passthrough();

const maintenanceOrganizationDetailsSchema = z
  .object({
    organizationName: z.string().optional(),
    dbaName: z.string().optional(),
    organizationType: z.string().optional(),
    countryOfFormation: z.string().optional(),
    natureOfOwnership: z.string().optional(),
    addresses: z.array(maintenanceAddressSchema).optional(),
    organizationIds: z.array(maintenanceIdentitySchema).optional(),
    organizationDescription: z.string().optional(),
    yearOfFormation: z.string().optional(),
    industryCategory: z.string().optional(),
    industryType: z.string().optional(),
    industry: z
      .object({ codeType: z.string().optional(), code: z.string().optional() })
      .passthrough()
      .optional(),
    mcc: z.string().optional(),
    associatedCountries: z.array(z.string()).optional(),
    phone: maintenancePhoneSchema.optional(),
    website: z.string().optional(),
    entitiesInOwnership: z.boolean().optional(),
  })
  .passthrough();

const maintenanceValidationResponseSchema = z
  .object({
    validationStatus: z.string().optional(),
    validationType: z.string().optional(),
    fields: z.array(z.unknown()).optional(),
    identities: z.array(z.unknown()).optional(),
    documentRequestIds: z.array(z.string()).optional(),
    roleSubType: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const maintenancePartySchema = z
  .object({
    id: z.string().optional(),
    parentPartyId: z.string().optional(),
    partyType: z.string().optional(),
    roles: z.array(z.string()).optional(),
    profileStatus: z.string().optional(),
    status: z.string().optional(),
    active: z.boolean().optional(),
    email: z.string().optional(),
    externalId: z.string().optional(),
    individualDetails: maintenanceIndividualDetailsSchema.optional(),
    organizationDetails: maintenanceOrganizationDetailsSchema.optional(),
    validationResponse: z.array(maintenanceValidationResponseSchema).optional(),
    updateRequest: maintenanceUpdateRequestSchema.optional(),
  })
  .passthrough();

export const maintenanceClientSchema = z
  .object({
    id: z.string(),
    partyId: z.string().optional(),
    status: z.string(),
    parties: z.array(maintenancePartySchema).optional(),
    products: z.array(z.unknown()).optional(),
    productDetails: z
      .array(
        z
          .object({
            product: z.string().optional(),
            subProduct: z.string().optional(),
            action: z.enum(['ADD', 'REMOVE']).optional(),
            onboardingStatus: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
    outstanding: z
      .object({
        attestationDocumentIds: z.array(z.string()).optional(),
        documentRequestIds: z.array(z.string()).optional(),
        questionIds: z.array(z.string()).optional(),
        partyIds: z.array(z.string()).optional(),
        partyRoles: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
    questionResponses: z
      .array(
        z.object({
          questionId: z.string(),
          values: z.array(z.string()),
        })
      )
      .optional(),
    updateRequest: maintenanceUpdateRequestSchema.optional(),
  })
  .passthrough();

export const maintenancePageSchema = z
  .object({
    parties: z.array(maintenancePartySchema).optional(),
    metadata: z
      .object({
        page: z.number().int().nonnegative().optional(),
        limit: z.number().int().positive().optional(),
        total: z.number().int().nonnegative().optional(),
      })
      .optional(),
  })
  .passthrough();

export const maintenanceVerificationResponseSchema = z
  .object({
    acceptedAt: z.string().datetime().optional(),
  })
  .passthrough();

const maintenanceDocumentRequestSummarySchema = z
  .object({
    id: z.string().optional(),
    partyId: z.string().optional(),
    status: z.enum(['ACTIVE', 'CLOSED', 'EXPIRED']).optional(),
  })
  .passthrough();

export const maintenanceDocumentRequestListSchema = z
  .object({
    documentRequests: z
      .array(maintenanceDocumentRequestSummarySchema)
      .default([]),
  })
  .passthrough();

export const maintenanceQuestionListSchema = z
  .object({
    questions: z
      .array(
        z
          .object({
            id: z.string().optional(),
            content: z
              .array(
                z.object({
                  label: z.string(),
                  description: z.string().optional(),
                  locale: z.string(),
                })
              )
              .optional(),
            description: z.string().optional(),
            responseSchema: z
              .object({
                items: z
                  .object({
                    type: z.string().optional(),
                    enum: z.array(z.string()).optional(),
                  })
                  .optional(),
              })
              .optional(),
          })
          .passthrough()
      )
      .default([]),
  })
  .passthrough();
