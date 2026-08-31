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

const maintenanceIndividualDetailsSchema = z
  .object({
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    birthDate: z.string().optional(),
    countryOfResidence: z.string().optional(),
  })
  .passthrough();

const maintenanceOrganizationDetailsSchema = z
  .object({
    organizationName: z.string().optional(),
    dbaName: z.string().optional(),
    organizationType: z.string().optional(),
    countryOfFormation: z.string().optional(),
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
    productDetails: z.array(z.unknown()).optional(),
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
