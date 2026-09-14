const PRODUCT_UPGRADE_WAIT_MS = 5 * 60 * 1000;

export function isProductUpgradeGateOpen(
  initialVerificationAcceptedAt: string | undefined,
  isOriginalProductApproved: boolean,
  now = Date.now()
) {
  if (!initialVerificationAcceptedAt || !isOriginalProductApproved) {
    return false;
  }
  const acceptedAt = Date.parse(initialVerificationAcceptedAt);
  return (
    !Number.isNaN(acceptedAt) && now - acceptedAt >= PRODUCT_UPGRADE_WAIT_MS
  );
}
