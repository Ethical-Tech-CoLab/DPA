/**
 * The shape of a committed case fixture.
 *
 * A `CaseInput` is a RAW SUBMISSION plus the evidence a retrieval run would
 * have returned. It is deliberately NOT a passport: every derived field —
 * confidence score, coverage, forgery risk, disclosure envelope, content hash,
 * signature, notarisation — is computed by the pipeline at build time. If a
 * number appears in a fixture file, it is an input, never a result.
 *
 * That distinction is the point of this package. The demo site cannot show a
 * hand-tuned score, because there is nowhere to write one down.
 */
import type {
  AcquisitionMode,
  ClaimStatus,
  ForensicSignal,
  IssuerClass,
  PremiumCheck,
  RegistryCheckRecord,
  TimelineEvent,
} from "@dpa/schema";

export interface CaseInput {
  /** Stable slug; becomes the passport id and the URL segment. */
  id: string;

  /** One line explaining why this object is in the fixture set at all. */
  teachingPoint: string;

  artwork: {
    title: string;
    artist: string | null;
    period: string | null;
    culture: string | null;
    material: string | null;
    dimensions: string | null;
    currentLocation: string | null;
    imageUrl: string | null;
  };

  /** IDENTIFY stage inputs. Hashes are precomputed so the build is offline. */
  identity: {
    sha256: string;
    dHash: string;
    angleCount: number | null;
    forensicSignals: ForensicSignal[];
  };

  /** INVESTIGATE stage output, frozen. Every event carries a source (ADR-008). */
  evidence: TimelineEvent[];

  /** Register checks as recorded. Note there is no `clear` verdict (ADR-009). */
  registryChecks: RegistryCheckRecord[];

  /** x402-metered checks. `mode: "mock"` throughout — no keys in this build. */
  premiumChecks: PremiumCheck[];

  /** Coverage inputs. These describe the OBJECT, not the evidence about it. */
  coverage: {
    acquisitionMode: AcquisitionMode;
    region: string | null;
    corpus?: string;
  };

  /** Optional market signal for the valuation-anomaly flag. */
  valuation?: { price: number; comparableMedian: number } | null;

  /** Tiered narrative fields. Which role sees each is set by the envelope. */
  claimStatus: ClaimStatus;
  custodianship: string | null;
  sourceCommunityStatement: string | null;
  condition: string | null;
  loanEligibility: string | null;
  holderPseudonym: string | null;
  contactEscrow: string | null;
  holderIdentity: string | null;

  /** Which issuer class signs this passport (ADR-004). */
  issuerClass: IssuerClass;
  issuerName: string;
}
