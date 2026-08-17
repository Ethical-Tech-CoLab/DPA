/**
 * The four demo objects, expressed as pipeline INPUTS.
 *
 * Each case pairs raw submission data with the evidence a retrieval run would
 * have returned. No score, coverage class, hash or signature appears here —
 * those are computed by `runPipeline` at build time. There is deliberately
 * nowhere in this file to write down an answer.
 *
 * The four are chosen to span the coverage model rather than to flatter it:
 *
 *   bura-askos     archaeological / structurally-uncovered — the hero case.
 *                  No register could ever have named this object, so a quiet
 *                  result means nothing at all.
 *   benin-bronze   colonial — documented removal, contested title, an active
 *                  restitution process. Tests the source-community tier.
 *   getty-bronze   market-theft / well-covered — registers could see it and
 *                  the record is still thin. The informative low score.
 *   schiele-wally  nazi-era — the case where the registers work as intended,
 *                  and the resolution took twelve years anyway.
 */
import type { CaseInput } from "./types.js";
import {
  BURA_ASKOS_TIMELINE,
  BURA_ASKOS_REGISTRY_CHECKS,
  BENIN_BRONZE_TIMELINE,
  BENIN_BRONZE_REGISTRY_CHECKS,
  GETTY_BRONZE_TIMELINE,
  GETTY_BRONZE_REGISTRY_CHECKS,
  SCHIELE_WALLY_TIMELINE,
  SCHIELE_WALLY_REGISTRY_CHECKS,
} from "../fixtures/index.js";

export const CASES: CaseInput[] = [
  /* ------------------------------------------------------------------ */
  {
    id: "bura-askos",
    teachingPoint:
      "No register has ever been able to name this object. A quiet result here is a measure of the reach of the registers, not of the object's innocence — which is why the coverage class must be read before the score.",
    artwork: {
      title: "Bura askos (zoomorphic funerary vessel)",
      artist: null,
      period: "c. 3rd–11th century CE",
      culture: "Bura (Bura-Asinda-Sikka complex)",
      material: "Terracotta",
      dimensions: "H 41 cm × W 22 cm",
      currentLocation: "Private collection, Geneva",
      imageUrl: null,
    },
    identity: {
      sha256: "0x9c1f4a7b2e8d3f60a5c9b8e7d6f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6",
      dHash: "0xf0e1d2c3b4a59687",
      angleCount: 3,
      forensicSignals: [
        {
          name: "surface-abrasion-consistency",
          value: 0.31,
          interpretation:
            "Abrasion pattern is consistent with burial and mechanical extraction rather than controlled excavation.",
          severity: "medium",
        },
        {
          name: "repair-seam-detection",
          value: 0.18,
          interpretation:
            "Two repair seams detected, consistent with post-excavation reassembly of a broken vessel.",
          severity: "low",
        },
      ],
    },
    evidence: BURA_ASKOS_TIMELINE,
    registryChecks: BURA_ASKOS_REGISTRY_CHECKS,
    premiumChecks: [],
    coverage: {
      acquisitionMode: "archaeological",
      region: "Niger",
      // Bura sites were never systematically excavated or inventoried by any
      // authority. Nobody could report this object stolen, because nobody
      // recorded that it existed.
      everInventoried: false,
    },
    claimStatus: "informal-inquiry",
    custodianship:
      "No custodianship agreement exists. The Republic of Niger has made no formal claim, in part because no inventory records this object as having been taken.",
    sourceCommunityStatement:
      "Communities in the Tillabéri region regard the Bura burial sites as ancestral ground. Extraction was not authorised by any local authority.",
    condition: "Stable. Two historic repair seams; no active deterioration.",
    loanEligibility:
      "Not eligible for loan. Title cannot be established and export legality cannot be demonstrated.",
    holderPseudonym: "0xHolder-7c4e",
    contactEscrow: "escrow://dpa/v0.4/contact/7c4e",
    holderIdentity: "Private collector, Geneva (identity held in escrow)",
    issuerClass: "pseudonymous-wallet",
    issuerName: "DPA demo issuer — pseudonymous wallet",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "benin-bronze",
    teachingPoint:
      "Removal is documented in detail, by the people who carried it out. The evidence is strong and the title is contested anyway — which is why a provenance score is not a legitimacy score.",
    artwork: {
      title: "Benin Bronze commemorative head",
      artist: null,
      period: "16th–17th century CE",
      culture: "Edo (Kingdom of Benin)",
      material: "Leaded brass",
      dimensions: "H 23 cm",
      currentLocation: "European museum collection",
      imageUrl: null,
    },
    identity: {
      sha256: "0x3a8f2c1d9e7b6a5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c",
      dHash: "0xa1b2c3d4e5f60718",
      angleCount: 5,
      forensicSignals: [
        {
          name: "casting-seam-analysis",
          value: 0.09,
          interpretation:
            "Casting seams consistent with lost-wax technique of the period; no indication of modern manufacture.",
          severity: "low",
        },
      ],
    },
    evidence: BENIN_BRONZE_TIMELINE,
    registryChecks: BENIN_BRONZE_REGISTRY_CHECKS,
    premiumChecks: [],
    coverage: {
      acquisitionMode: "colonial",
      region: "Nigeria",
      // The British catalogued these objects in detail in 1897. The removal is
      // exceptionally well documented — by the people who carried it out.
      everInventoried: true,
    },
    claimStatus: "under-negotiation",
    custodianship:
      "Subject to an active restitution dialogue. The Oba of Benin and the Nigerian National Commission for Museums and Monuments are recognised parties.",
    sourceCommunityStatement:
      "The Court of Benin regards commemorative heads as belonging to the Oba in perpetuity. Their removal in 1897 is not accepted as a transfer of title.",
    condition: "Excellent. Stable patina, no active corrosion.",
    loanEligibility:
      "Loans suspended pending the outcome of restitution negotiations.",
    holderPseudonym: "0xHolder-2b91",
    contactEscrow: "escrow://dpa/v0.4/contact/2b91",
    holderIdentity: "European museum collection (identity held in escrow)",
    issuerClass: "accredited-institution",
    issuerName: "DPA demo issuer — accredited institution",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "getty-bronze",
    teachingPoint:
      "Every relevant register could see this object, and searched. The record is still thin. That is the most informative low score the system can produce, and it is lower than the Bura askos.",
    artwork: {
      title: "Victorious Youth (Athlete of Fano)",
      artist: "Unknown Greek sculptor, circle of Lysippos",
      period: "c. 300–100 BCE",
      culture: "Greek (late Classical / Hellenistic)",
      material: "Bronze",
      dimensions: "H 151.5 cm",
      currentLocation: "J. Paul Getty Museum, Malibu, California",
      imageUrl: null,
    },
    identity: {
      sha256: "0x7e2b9d4f1a6c8e3b5d7f9a2c4e6b8d1f3a5c7e9b2d4f6a8c1e3b5d7f9a2c4e6b",
      dHash: "0x1f2e3d4c5b6a7988",
      angleCount: 8,
      forensicSignals: [
        {
          name: "marine-encrustation-residue",
          value: 0.44,
          interpretation:
            "Residual marine encrustation consistent with prolonged submersion, supporting the reported recovery from the Adriatic.",
          severity: "low",
        },
      ],
    },
    evidence: GETTY_BRONZE_TIMELINE,
    registryChecks: GETTY_BRONZE_REGISTRY_CHECKS,
    premiumChecks: [],
    coverage: {
      acquisitionMode: "market-theft",
      region: "Italy",
    },
    claimStatus: "formal-claim",
    custodianship:
      "Held by the J. Paul Getty Trust. The Italian Republic asserts title and has pursued forfeiture through Italian courts.",
    sourceCommunityStatement: null,
    condition: "Stable. Conserved and continuously monitored.",
    loanEligibility:
      "Not loaned outside the holding institution while forfeiture proceedings remain open.",
    holderPseudonym: "0xHolder-5d33",
    contactEscrow: "escrow://dpa/v0.4/contact/5d33",
    holderIdentity: "J. Paul Getty Trust (identity held in escrow)",
    issuerClass: "accredited-institution",
    issuerName: "DPA demo issuer — accredited institution",
  },

  /* ------------------------------------------------------------------ */
  {
    id: "schiele-wally",
    teachingPoint:
      "The registers worked exactly as designed here: the object was listed, the claim was substantiated, and the case still took twelve years and a seizure to resolve. A high-coverage, high-confidence passport is a starting point for a legal process, not a substitute for one.",
    artwork: {
      title: "Portrait of Wally Neuzil",
      artist: "Egon Schiele",
      period: "1912",
      culture: "Austrian",
      material: "Oil on panel",
      dimensions: "32 cm × 39.8 cm",
      currentLocation: "Leopold Museum, Vienna",
      imageUrl: null,
    },
    identity: {
      sha256: "0x5c9e1b7d3f8a2c6e4b0d9f7a3c5e1b8d6f4a2c0e9b7d5f3a1c8e6b4d2f0a9c7e",
      dHash: "0x8877665544332211",
      angleCount: 2,
      forensicSignals: [
        {
          name: "pigment-period-consistency",
          value: 0.07,
          interpretation:
            "Pigment composition consistent with the artist's documented palette for the period.",
          severity: "low",
        },
      ],
    },
    evidence: SCHIELE_WALLY_TIMELINE,
    registryChecks: SCHIELE_WALLY_REGISTRY_CHECKS,
    premiumChecks: [],
    coverage: {
      acquisitionMode: "nazi-era",
      region: "Austria",
    },
    claimStatus: "resolved-returned",
    custodianship:
      "Settled in 2010. The Leopold Museum paid USD 19 million to the estate of Lea Bondi Jaray and retained the work, with the forced sale acknowledged on permanent display.",
    sourceCommunityStatement: null,
    condition: "Excellent. Conserved to museum standard.",
    loanEligibility:
      "Eligible for loan. Title is settled and the settlement terms are public.",
    holderPseudonym: "0xHolder-9a02",
    contactEscrow: "escrow://dpa/v0.4/contact/9a02",
    holderIdentity: "Leopold Museum, Vienna (identity held in escrow)",
    issuerClass: "accredited-institution",
    issuerName: "DPA demo issuer — accredited institution",
  },
];

export const CASE_IDS = CASES.map((c) => c.id);
