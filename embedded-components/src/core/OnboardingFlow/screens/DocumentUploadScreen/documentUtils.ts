import {
  ClientResponse,
  DocumentRequestResponse,
} from '@/api/generated/smbdo.schemas';

/**
 * Groups document requests by party type (business or individuals)
 */
export interface GroupedDocumentRequests {
  businessDocumentRequests: DocumentRequestResponse[];
  individualDocumentRequests: DocumentRequestResponse[];
}

/**
 * Groups document requests into business and individual categories
 * @param documentRequests - List of document requests to group
 * @param clientData - Client data with party information
 * @returns Grouped document requests
 */
export const groupDocumentRequests = (
  documentRequests: DocumentRequestResponse[] | undefined,
  clientData: ClientResponse | undefined
): GroupedDocumentRequests => {
  if (!documentRequests?.length || !clientData?.parties) {
    return {
      businessDocumentRequests: [],
      individualDocumentRequests: [],
    };
  }

  const clientPartyId = clientData.parties.find((p) =>
    p.roles?.includes('CLIENT')
  )?.id;

  const businessDocumentRequests = documentRequests.filter(
    (docRequest) =>
      (!docRequest.partyId && docRequest.clientId === clientData.id) ||
      (docRequest.partyId && docRequest.partyId === clientPartyId)
  );

  const individualDocumentRequests = documentRequests.filter(
    (docRequest) => docRequest.partyId && docRequest.partyId !== clientPartyId
  );

  return {
    businessDocumentRequests,
    individualDocumentRequests,
  };
};

/**
 * Filters document requests for a specific party
 * @param documentRequests - List of document requests to filter
 * @param partyId - Party ID to filter by
 * @returns Filtered document requests
 */
export const filterDocumentRequestsByPartyId = (
  documentRequests: DocumentRequestResponse[] | undefined,
  partyId: string | undefined
): DocumentRequestResponse[] => {
  if (!documentRequests?.length || !partyId) {
    return [];
  }

  return documentRequests
    .filter(
      (docRequest) =>
        // Include documents for this specific party
        (docRequest.partyId && docRequest.partyId === partyId) ||
        // For organizations, include documents without a party ID (client-level docs)
        (!docRequest.partyId && docRequest.status === 'ACTIVE')
    )
    .filter(
      // Only return active documents
      (docRequest) => docRequest.status === 'ACTIVE'
    );
};
