/**
 * @dpa/payments — x402-metered register checks.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/arts-provenance-agent.
 */
export {
  payForCheck,
  preflight402,
  simulatedTx,
  usdToAtomic,
  atomicToUsd,
  SpendLedger,
  SignerMissingError,
  CONCLUSIVE_THRESHOLD,
} from "./x402.js";
export type { PayOptions, PaymentQuote, PaymentSigner } from "./x402.js";
