/**
 * Exhibit scene model and the HopeOS adapter boundary.
 *
 * The premise of the exhibit is the other half of the DPA thesis. The passport
 * proves that an object with contested provenance can be *registered* without
 * exposing its holder. The exhibit proves it can be *seen* — publicly,
 * scholarly, at scale — without being moved, insured, or shipped through a
 * jurisdiction that might seize it. An object under claim can be in the light
 * and still be at rest.
 *
 * HopeOS (Hannah Zhao) supplies the immersive runtime: 3D presentation with
 * haptic feedback and a voice interface. This module does NOT depend on it.
 * It defines the contract the exhibit needs and ships a three.js renderer that
 * satisfies the same contract in a browser, so the exhibit can be built,
 * demonstrated and reviewed before any hardware exists.
 *
 * If HopeOS turns out to expose a different API surface, the adapter is the
 * only thing that changes. The scene model, the intent grammar and the tier
 * gating below stay exactly as they are — which is the point of writing it this
 * way round.
 */

import type { Role } from "./fixtures";

/** How a point of interest should feel under a fingertip. */
export type HapticProfile =
  | "edge" // a sharp discontinuity — a fracture, a cut line
  | "texture" // sustained fine grain — tool marks, abrasion, weave
  | "void" // absence — a loss, a missing element
  | "seam" // a repair join, subtly raised
  | "incision"; // deliberate carving — inscription, decoration

/**
 * A point of interest on the object.
 *
 * `tier` is the crucial field. A POI is not just a hotspot; it is a disclosure
 * decision. "The repair seam here is modern" is museum-tier condition
 * information. "This is the region the claimants identify" is source-community
 * tier. The exhibit must not become a side channel that leaks what the passport
 * withholds, so every POI declares the tier it belongs to and the renderer
 * refuses to surface POIs the visitor's role cannot see.
 */
export interface PointOfInterest {
  id: string;
  label: string;
  /** Position in normalised object space, roughly [-1, 1] on each axis. */
  position: [number, number, number];
  haptic: HapticProfile;
  /** Which passport field this POI is speaking about, if any. */
  fieldRef?: string;
  /** Disclosure tier required to surface this POI at all. */
  tier: "public" | "source-community" | "museum" | "enforcement";
  /** What the narrator says when this POI is focused. */
  narration: string;
}

/** The intents the voice layer understands. Deliberately small. */
export const VOICE_INTENTS = [
  {
    intent: "identify",
    tier: "public",
    utterances: ["what am i looking at", "tell me about this", "identify"],
    description: "Title, culture, period, material — the public tier.",
  },
  {
    intent: "locate",
    tier: "public",
    utterances: ["where is it from", "where was this found", "origin"],
    description:
      "Region of origin and acquisition mode. Never the current location, which is enforcement tier.",
  },
  {
    intent: "damage",
    tier: "museum",
    utterances: ["show me the damage", "condition", "what is broken"],
    description:
      "Condition and repair. Museum tier, because condition drives valuation.",
  },
  {
    intent: "provenance",
    tier: "enforcement",
    utterances: ["who owned this", "provenance", "history"],
    description:
      "The full event timeline. Enforcement tier — it names people and places.",
  },
  {
    intent: "claims",
    tier: "source-community",
    utterances: ["who claims this", "is it contested", "claims"],
    description: "Claim status and custodianship terms.",
  },
  {
    intent: "source-voice",
    tier: "source-community",
    utterances: ["what does the community say", "source voice"],
    description:
      "A statement contributed by the community of origin, played only where they have consented to it.",
  },
  {
    intent: "coverage",
    tier: "public",
    utterances: ["how much do we know", "coverage", "how sure are you"],
    description:
      "The coverage class, in plain language. The single most important thing a visitor can be told about a quiet result.",
  },
] as const;

export type VoiceIntent = (typeof VOICE_INTENTS)[number]["intent"];

/**
 * The renderer contract.
 *
 * Anything that can satisfy this can drive the exhibit: the three.js fallback
 * in the browser, or a HopeOS session on real hardware.
 */
export interface ExhibitRuntime {
  readonly name: string;
  readonly haptics: boolean;
  readonly voice: boolean;
  load(scene: ExhibitScene): Promise<void>;
  focus(poiId: string): void;
  /** Fire the haptic profile for a POI. No-op where haptics are unavailable. */
  pulse(profile: HapticProfile): void;
  /** Speak, or surface as text where there is no audio. */
  narrate(text: string): void;
  dispose(): void;
}

export interface ExhibitScene {
  passportId: string;
  title: string;
  /** glTF 2.0 URL, or null to use the procedural stand-in. */
  modelUrl: string | null;
  pois: PointOfInterest[];
  /** The role the visitor is presenting as; gates POIs and intents. */
  role: Role;
}

/** Tiers a role may see. Mirrors packages/schema/src/roles.ts. */
const VISIBLE_TIERS: Record<Role, string[]> = {
  public: ["public"],
  "source-community": ["public", "source-community"],
  museum: ["public", "museum"],
  enforcement: ["public", "museum", "enforcement"],
  owner: ["public", "source-community", "museum", "enforcement", "owner"],
};

export function poisForRole(pois: PointOfInterest[], role: Role): PointOfInterest[] {
  const tiers = VISIBLE_TIERS[role];
  return pois.filter((p) => tiers.includes(p.tier));
}

export function intentsForRole(role: Role) {
  const tiers = VISIBLE_TIERS[role];
  return VOICE_INTENTS.filter((i) => tiers.includes(i.tier));
}

/**
 * The Bura askos, authored as an exhibit.
 *
 * Chosen over the Benin bronze on purpose. The bronze is already visible in
 * more museums than it should be; the askos is the object nobody can see,
 * because no register can name it and no institution will show it. If the
 * exhibit works for this object it works for the hard case.
 */
export const BURA_SCENE: Omit<ExhibitScene, "role"> = {
  passportId: "bura-askos",
  title: "Bura askos (zoomorphic funerary vessel)",
  modelUrl: null,
  pois: [
    {
      id: "spout",
      label: "Spout and rim",
      position: [0, 0.95, 0],
      haptic: "edge",
      tier: "public",
      narration:
        "The spout of a funerary vessel from the Bura-Asinda-Sikka complex in the Tillabéri region of Niger, made somewhere between the third and eleventh centuries of the common era. Vessels of this form were placed with the dead.",
    },
    {
      id: "body-texture",
      label: "Burnished body",
      position: [0.55, 0.1, 0.4],
      haptic: "texture",
      tier: "public",
      narration:
        "The surface was burnished before firing. The fine directional grain under your fingertips is the polishing stroke of the person who made it.",
    },
    {
      id: "abrasion",
      label: "Extraction abrasion",
      position: [-0.5, -0.35, 0.5],
      haptic: "texture",
      fieldRef: "objectIdentity.forgeryRisk.signals",
      tier: "museum",
      narration:
        "This abrasion pattern is not burial wear. It is mechanical, consistent with the vessel having been pulled from the ground with tools rather than lifted in a controlled excavation. The forensic layer scores it as a medium signal.",
    },
    {
      id: "repair-seam",
      label: "Repair seam",
      position: [0.2, -0.15, -0.6],
      haptic: "seam",
      fieldRef: "condition",
      tier: "museum",
      narration:
        "A repair join. The vessel was broken and reassembled after it left the ground — two seams are detectable. Restoration of this kind is normal for the material and is not itself a provenance signal, but it does mean the object you are touching is a reconstruction.",
    },
    {
      id: "loss",
      label: "Loss at the shoulder",
      position: [-0.35, 0.5, -0.3],
      haptic: "void",
      fieldRef: "condition",
      tier: "museum",
      narration:
        "A loss at the shoulder. Nothing fills it. Where a museum object would carry a conservator's record of when this happened, this one carries nothing, because no conservator saw it before it reached the market.",
    },
    {
      id: "claim-region",
      label: "The claim",
      position: [0, -0.7, 0],
      haptic: "incision",
      fieldRef: "claimStatus",
      tier: "source-community",
      narration:
        "Niger ratified the 1970 UNESCO Convention in December 1997. Any Bura object removed after that date is in breach. But the Convention presumes an inventory, and Bura sites were never inventoried — so the instrument written to protect this material cannot reach it. The claim here is an informal inquiry, not a formal claim, for exactly that reason.",
    },
  ],
};

/**
 * Narration for the coverage intent, generated from the passport rather than
 * written for the exhibit — so the room and the record cannot say different
 * things about the same object.
 */
export function coverageNarration(
  coverageClass: string,
  score: number,
  identifying: number,
  total: number,
): string {
  if (coverageClass === "structurally-uncovered") {
    return `This object scores ${score} out of 100. Do not hear that as reassurance. Of ${total} registers consulted, ${identifying} could name an object like this one. The rest are silent because they were never able to speak about it — a theft register needs someone to have reported a theft, and nobody could report this vessel missing when nobody had recorded that it existed. The number measures how far the registers reach, not what happened here.`;
  }
  if (coverageClass === "well-covered") {
    return `This object scores ${score} out of 100, and ${identifying} of ${total} registers could have named it. They looked. That makes a low number here a finding rather than a gap.`;
  }
  return `This object scores ${score} out of 100. ${identifying} of ${total} registers could name it, so the number is partly informative and partly a measure of reach. Read it with care.`;
}
