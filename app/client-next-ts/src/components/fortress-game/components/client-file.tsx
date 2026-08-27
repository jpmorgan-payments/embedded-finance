// =============================================================================
// ClientFile — the KYC dossier the platform already holds on the applicant.
// Round 1 asks the player to transcribe it into an API call, so the facts the
// call needs (principal place of business, entity type, tax id) must be visible
// somewhere other than the starter payload — which is deliberately wrong.
// =============================================================================

import { motion } from 'framer-motion';
import { getPersonaClient } from '../data/personas';
import type { PersonaId, ClientParty } from '../types';

function fullName(party: ClientParty): string {
  const details = party.individualDetails;
  if (details) return `${details.firstName} ${details.lastName}`;
  return party.organizationDetails?.organizationName ?? '—';
}

function formatAddress(lines: string[], city: string, state: string, postalCode: string): string {
  return `${lines.join(', ')}, ${city} ${state} ${postalCode}`;
}

interface ClientFileProps {
  persona: PersonaId;
}

export function ClientFile({ persona }: ClientFileProps) {
  const client = getPersonaClient(persona);
  const clientParty = client.parties.find((p) => p.roles.includes('CLIENT'));
  const org = clientParty?.organizationDetails;
  const principal = org?.addresses?.find((a) => a.addressType === 'BUSINESS_ADDRESS') ?? org?.addresses?.[0];
  const people = client.parties.filter((p) => !p.roles.includes('CLIENT'));

  return (
    <motion.div
      className="client-file"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
    >
      <p className="client-file-intro">
        These details were verified during the application. Use them to correct the starter
        request.
      </p>

      <dl className="client-file-grid">
        <dt>Legal name</dt>
        <dd>{org?.organizationName ?? '—'}</dd>
        <dt>Doing business as</dt>
        <dd>{org?.dbaName ?? '—'}</dd>
        <dt>Entity type</dt>
        <dd>{org?.organizationType ?? '—'}</dd>
        <dt>Formed</dt>
        <dd>
          {org?.yearOfFormation ?? '—'} · {org?.countryOfFormation ?? '—'}
        </dd>
        <dt>Tax ID</dt>
        <dd>
          {org?.organizationIds?.[0]
            ? `${org.organizationIds[0].idType} ${org.organizationIds[0].value}`
            : '—'}
        </dd>
        <dt className="highlight">Principal place of business</dt>
        <dd className="highlight">
          {principal
            ? formatAddress(principal.addressLines, principal.city, principal.state, principal.postalCode)
            : '—'}
        </dd>
        <dt>Phone</dt>
        <dd>
          {org?.phone ? `${org.phone.countryCode} ${org.phone.phoneNumber}` : '—'}
        </dd>
        <dt>Website</dt>
        <dd>{org?.website ?? '—'}</dd>
      </dl>

      <div className="client-file-people">
        <span className="client-file-label">PEOPLE ON FILE</span>
        {people.map((party) => (
          <div key={party.externalId ?? fullName(party)} className="client-file-person">
            <span className="person-role">{party.roles.join(', ')}</span>
            <span className="person-name">{fullName(party)}</span>
            <span className="person-detail">
              {party.individualDetails?.individualIds?.[0]
                ? `${party.individualDetails.individualIds[0].idType} ${party.individualDetails.individualIds[0].value}`
                : ''}
              {party.individualDetails?.birthDate ? ` · DOB ${party.individualDetails.birthDate}` : ''}
            </span>
          </div>
        ))}
      </div>

      <p className="client-file-warning">
        ⚠ DO NOT USE: CT Corporation System, 1209 Orange St, Wilmington DE 19801. This is a
        registered agent address, not the place where the business operates. Use the principal
        place of business above.
      </p>
    </motion.div>
  );
}
