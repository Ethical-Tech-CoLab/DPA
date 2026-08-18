import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildCaptureRecord,
  defaultTier,
  evaluateChain,
  LEGITIMACY_DISCLAIMER,
  type BuildCaptureInput,
} from "./record.js";
import { assessCapture } from "./assess.js";

const QUALITY = assessCapture(
  {
    "angular-coverage": 0.97,
    "surface-completeness": 0.97,
    "image-overlap": 0.8,
    sharpness: 420,
    exposure: 0.002,
    "ground-sample-distance": 0.15,
    "scale-reference": 1,
    "colour-reference": 1,
    "lighting-consistency": 0.93,
    "device-metadata": 1,
  },
  { method: "photogrammetry-dslr" },
);

const BASE: BuildCaptureInput = {
  captureId: "cap-001",
  method: "photogrammetry-dslr",
  operatorRole: "custodian-institution",
  operatorVerification: "institution-attested",
  operatorPseudonym: "anon-registrar-01",
  observedAt: "2026-02-11",
  observedLocation: "Musée National Boubou Hama, Niamey",
  custodyStatement: "Held in the museum's permanent collection store.",
  device: "Sony A7RIV / 90mm macro",
  assets: [
    { kind: "mesh", sha256: "0xaa", byteLength: 1024, mimeType: "model/gltf-binary" },
  ],
  reconstruction: {
    sourceImageCount: 240,
    sourceImageSetHash: "0xbb",
    sealedImageCount: 240,
    pipeline: "Metashape 2.1",
    parameters: "high accuracy, generic preselection",
    outputHash: "0xcc",
    outputPerceptualHash: "0xdd",
    ...evaluateChain({
      sourceImageCount: 240,
      sealedImageCount: 240,
      pipeline: "Metashape 2.1",
    }),
  },
  quality: QUALITY,
  sensitivity: "ordinary",
  signature: "0xsig",
};

describe("buildCaptureRecord", () => {
  it("always states what it does not attest", () => {
    const r = buildCaptureRecord(BASE);
    expect(r.doesNotAttest).toContain(LEGITIMACY_DISCLAIMER);
    expect(r.doesNotAttest.length).toBeGreaterThan(100);
  });

  it("carries the disclaimer even for a flawless, fully sealed capture", () => {
    /* The temptation is to drop it when everything is perfect. That is exactly
     * the record most likely to be mistaken for proof of ownership. */
    const r = buildCaptureRecord(BASE);
    expect(r.quality.qualityClass).toBe("reference");
    expect(r.reconstruction!.chainComplete).toBe(true);
    expect(r.doesNotAttest).toContain("does not attest that the object was lawfully");
  });

  it("says the operator is unverified when they are", () => {
    const r = buildCaptureRecord({
      ...BASE,
      operatorRole: "contributor",
      operatorVerification: "self-asserted",
    });
    expect(r.doesNotAttest).toContain("self-asserted and unverified");
    expect(r.attests).toContain("has not been verified");
  });

  it("computes a content hash that excludes the signature", () => {
    const a = buildCaptureRecord(BASE);
    const b = buildCaptureRecord({ ...BASE, signature: "0xdifferent" });
    expect(a.contentHash).toBe(b.contentHash);
  });

  it("changes the content hash when the observation changes", () => {
    const a = buildCaptureRecord(BASE);
    const b = buildCaptureRecord({ ...BASE, observedAt: "2026-02-12" });
    expect(a.contentHash).not.toBe(b.contentHash);
  });

  it("does not publish meshes by default", () => {
    const r = buildCaptureRecord(BASE);
    expect(r.assets[0]!.disclosureTier).toBe("museum");
    expect(r.assets[0]!.tierRationale).toContain("forge");
  });

  it("holds funerary material at source-community tier", () => {
    const r = buildCaptureRecord({ ...BASE, sensitivity: "funerary" });
    expect(r.assets[0]!.disclosureTier).toBe("source-community");
    expect(r.assets[0]!.tierRationale).toContain("consent");
  });

  it("records a rationale when a tier is overridden upward", () => {
    const r = buildCaptureRecord({
      ...BASE,
      assets: [{ ...BASE.assets[0]!, disclosureTier: "public" }],
    });
    expect(r.assets[0]!.disclosureTier).toBe("public");
    expect(r.assets[0]!.tierRationale).toContain("explicit decision");
  });

  it("warns when the capture is not fit to identify the object", () => {
    const weak = assessCapture(
      { "angular-coverage": 0.6, "image-overlap": 0.6, sharpness: 120 },
      { method: "photogrammetry-mobile" },
    );
    const r = buildCaptureRecord({ ...BASE, quality: weak });
    expect(r.doesNotAttest).toContain("not sufficient to serve as the identifying record");
  });
});

describe("evaluateChain", () => {
  it("is complete only when every source image was sealed", () => {
    expect(
      evaluateChain({ sourceImageCount: 200, sealedImageCount: 200, pipeline: "x" })
        .chainComplete,
    ).toBe(true);
  });

  it("treats a partly sealed set as unsealed, not as mostly sealed", () => {
    const c = evaluateChain({
      sourceImageCount: 200,
      sealedImageCount: 199,
      pipeline: "x",
    });
    expect(c.chainComplete).toBe(false);
    expect(c.chainNote).toContain("1 of 200");
  });

  it("refuses a chain with no recorded pipeline", () => {
    const c = evaluateChain({
      sourceImageCount: 200,
      sealedImageCount: 200,
      pipeline: "  ",
    });
    expect(c.chainComplete).toBe(false);
  });

  it("refuses a chain with no source images", () => {
    expect(
      evaluateChain({ sourceImageCount: 0, sealedImageCount: 0, pipeline: "x" })
        .chainComplete,
    ).toBe(false);
  });

  it("does not claim reconstruction is reproducible", () => {
    const c = evaluateChain({
      sourceImageCount: 10,
      sealedImageCount: 10,
      pipeline: "x",
    });
    expect(c.chainNote).toContain("not bit-deterministic");
  });
});

describe("defaultTier", () => {
  it("never defaults any capture asset to public", () => {
    const kinds = ["mesh", "texture", "point-cloud", "image-set", "depth-map"] as const;
    for (const k of kinds) {
      for (const s of ["ordinary", "funerary", "sacred"] as const) {
        expect(defaultTier(k, s)).not.toBe("public");
      }
    }
  });
});

describe("ADR-010 structural enforcement", () => {
  it("does not import the provenance scorer", () => {
    /* A museum must not be able to raise an object's provenance confidence by
     * buying a better camera. Enforced at the module boundary so that it
     * cannot be undone by a well-meaning refactor.
     *
     * Matches import/require FORMS rather than the bare string, because the
     * source comments discuss @dpa/assess at length and should keep doing so —
     * explaining the separation is not the same as violating it. */
    const IMPORT_FORMS =
      /(?:from|import|require)\s*\(?\s*["']@dpa\/assess["']/;

    for (const file of ["assess.ts", "guidance.ts", "record.ts", "rubric.ts", "index.ts"]) {
      const src = readFileSync(join(__dirname, file), "utf8");
      expect(
        IMPORT_FORMS.test(src),
        `${file} must not import @dpa/assess`,
      ).toBe(false);
    }
  });

  it("keeps capture quality out of the passport's confidence score", () => {
    /* The two numbers are allowed to point in opposite directions, and that is
     * the entire point: an excellently captured object with no provenance
     * record, and a poorly captured object with a thick archive, are both
     * ordinary situations the system must represent without averaging them. */
    const r = buildCaptureRecord(BASE);
    expect(Object.keys(r)).not.toContain("confidenceScore");
    expect(Object.keys(r.quality)).not.toContain("confidenceScore");
  });
});
