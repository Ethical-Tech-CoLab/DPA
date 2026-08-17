/**
 * Object identification — two modes: fixtures (offline) and live (Gemini Vision).
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/provenance-search
 *   (server.js — /api/identify handler, callGemini, extractJson).
 *   The Gemini prompt, model name, retry delays, and token ceiling are
 *   preserved verbatim. See docs/DECISIONS.md#adr-008.
 */
import type { ObjectIdentity } from "@dpa/schema";
import { sha256Hex, dHash, angleCount, type RasterImage } from "./fingerprint.js";
import { compare } from "./similarity.js";
import {
  computeForensics,
  detectProvenanceMarkers,
} from "./forensics.js";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface IdentifyCandidate {
  title: string | null;
  artist: string | null;
  culture: string | null;
  period: string | null;
  confidence: number;
  rationale: string;
}

export interface IdentifyOptions {
  mode?: "fixtures" | "live";
  /** Catalogue for fixtures mode — array of known objects. */
  catalogue?: CatalogueEntry[];
  /** Override the Gemini API key (defaults to process.env.GEMINI_API_KEY). */
  geminiApiKey?: string;
}

/** A known object in the local catalogue (fixtures mode). */
export interface CatalogueEntry {
  id: string;
  title: string;
  artist: string | null;
  culture: string | null;
  period: string | null;
  dHash?: string;
  description?: string;
}

export interface IdentifyResult {
  candidates: IdentifyCandidate[];
  mode: "fixtures" | "live";
}

/* -------------------------------------------------------------------------- */
/* Typed error                                                                 */
/* -------------------------------------------------------------------------- */

export class GeminiKeyMissingError extends Error {
  constructor() {
    super(
      "GEMINI_API_KEY is not set in process.env. " +
        "Either set the environment variable or call identifyObject with " +
        '{ mode: "fixtures", catalogue: [...] } for offline operation.',
    );
    this.name = "GeminiKeyMissingError";
  }
}

/* -------------------------------------------------------------------------- */
/* Gemini helpers (ported from upstream callGemini + extractJson)             */
/* -------------------------------------------------------------------------- */

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_RETRY_DELAYS_MS = [1000, 2000, 4000] as const;

function extractJson(text: string): Record<string, unknown> | null {
  // Strip markdown fences if present
  const stripped = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  // Try full string, then find the first { … } block
  for (const candidate of [stripped, text]) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as Record<
          string,
          unknown
        >;
      } catch {
        /* try next */
      }
    }
  }
  return null;
}

async function callGemini(
  parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>,
  apiKey: string,
  maxOutputTokens = 3000,
  attempt = 0,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let r: Response;
  try {
    r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { maxOutputTokens },
        }),
        signal: controller.signal,
      },
    );
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === "AbortError") {
      throw new Error("Gemini request timed out after 30 seconds.");
    }
    throw e;
  }
  clearTimeout(timer);

  if (r.status === 429 || r.status === 503) {
    if (attempt < GEMINI_RETRY_DELAYS_MS.length) {
      await new Promise((res) =>
        setTimeout(res, GEMINI_RETRY_DELAYS_MS[attempt] ?? 1000),
      );
      return callGemini(parts, apiKey, maxOutputTokens, attempt + 1);
    }
    throw new Error(
      r.status === 429
        ? "Gemini rate limit reached after 3 retries. Please try again in a moment."
        : "Gemini is temporarily busy after 3 retries. Please try again in a moment.",
    );
  }

  if (!r.ok) {
    throw new Error(`Gemini returned a non-JSON response (HTTP ${r.status}).`);
  }

  const data = (await r.json()) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  if (data.error) {
    throw new Error(data.error.message ?? "Gemini API error");
  }
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  ).trim();
}

/* -------------------------------------------------------------------------- */
/* Fixtures mode                                                               */
/* -------------------------------------------------------------------------- */

const IDENTIFY_PROMPT = `You are an art and artifact identification assistant. Look at this image and identify the artwork or object if you recognize it, or describe your best guess of its title, artist, period, and medium based on visual style if you do not recognize it exactly.

Return ONLY raw JSON (no markdown, no backticks) with this exact shape:
{"title": string|null, "artist": string|null, "period": string|null, "medium": string|null, "confidence": number, "notes": string}

confidence is a number from 0 to 1 reflecting how sure you are of the identification. If you cannot identify anything meaningful, set the fields to null and explain briefly in "notes".`;

function fixturesIdentify(
  catalogue: CatalogueEntry[],
  imageHash: string,
  imgDHash: string,
): IdentifyResult {
  // Find catalogue entries by dHash similarity
  const ranked = catalogue
    .filter((e) => e.dHash !== undefined)
    .map((e) => ({
      entry: e,
      similarity: compare(imgDHash, e.dHash!).similarityScore,
    }))
    .sort((a, b) => b.similarity - a.similarity);

  if (ranked.length > 0 && (ranked[0]?.similarity ?? 0) >= 0.5) {
    const top = ranked.slice(0, 3);
    return {
      candidates: top.map(({ entry, similarity }) => ({
        title: entry.title,
        artist: entry.artist,
        culture: entry.culture,
        period: entry.period,
        confidence: similarity,
        rationale: `Fixtures mode: dHash similarity ${(similarity * 100).toFixed(1)}% against catalogue entry "${entry.id}". ${entry.description ?? ""}`,
      })),
      mode: "fixtures",
    };
  }

  // No dHash match — return the full catalogue as low-confidence candidates
  void imageHash; // suppress unused warning
  return {
    candidates: catalogue.slice(0, 3).map((entry) => ({
      title: entry.title,
      artist: entry.artist,
      culture: entry.culture,
      period: entry.period,
      confidence: 0.1,
      rationale: `Fixtures mode: no hash match. Returning catalogue entry "${entry.id}" as low-confidence candidate.`,
    })),
    mode: "fixtures",
  };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

export interface IdentifyInput {
  /** Raw image bytes — used for SHA-256. */
  bytes: Uint8Array;
  /** Decoded RGBA pixels — used for dHash, forensics, live Gemini. */
  image: RasterImage;
  /** MIME type for Gemini (e.g. "image/jpeg"). Defaults to "image/jpeg". */
  mimeType?: string;
}

/**
 * Identify an artwork or object from its image.
 *
 * In **fixtures** mode (the default, or when `DPA_MODE=fixtures`) the
 * function is a pure function: it matches the image hash against the caller-
 * supplied `catalogue` and returns ranked candidates. No network I/O.
 *
 * In **live** mode (`DPA_MODE=live`) it calls Gemini Vision with the upstream
 * prompt and token ceiling. The API key is read from `process.env.GEMINI_API_KEY`
 * unless overridden in `opts`. If the key is absent a `GeminiKeyMissingError`
 * is thrown — the caller should catch it and fall back to fixtures mode.
 *
 * **Never hardcode an API key.** Pass it only through environment variables
 * or the `opts.geminiApiKey` parameter from a secrets manager.
 */
export async function identifyObject(
  input: IdentifyInput,
  opts: IdentifyOptions = {},
): Promise<IdentifyResult> {
  const mode =
    opts.mode ??
    (typeof process !== "undefined" && process.env["DPA_MODE"] === "live"
      ? "live"
      : "fixtures");

  const imgDHash = dHash(input.image);
  const imageHash = sha256Hex(input.bytes);

  if (mode === "fixtures") {
    return fixturesIdentify(opts.catalogue ?? [], imageHash, imgDHash);
  }

  // Live mode — Gemini Vision
  const apiKey =
    opts.geminiApiKey ??
    (typeof process !== "undefined" ? process.env["GEMINI_API_KEY"] : undefined);
  if (!apiKey) throw new GeminiKeyMissingError();

  const base64 = btoa(String.fromCharCode(...input.bytes));
  const mimeType = input.mimeType ?? "image/jpeg";

  const text = await callGemini(
    [
      { text: IDENTIFY_PROMPT },
      { inline_data: { mime_type: mimeType, data: base64 } },
    ],
    apiKey,
    3000,
  );

  const parsed = extractJson(text);
  if (!parsed) {
    throw new Error(
      `Could not parse an identification from Gemini. Raw: ${text.slice(0, 200)}`,
    );
  }

  const candidate: IdentifyCandidate = {
    title: (parsed["title"] as string | null) ?? null,
    artist: (parsed["artist"] as string | null) ?? null,
    culture: null,
    period: (parsed["period"] as string | null) ?? null,
    confidence: typeof parsed["confidence"] === "number" ? parsed["confidence"] : 0,
    rationale:
      (parsed["notes"] as string | null) ??
      `Gemini Vision identification (${GEMINI_MODEL}).`,
  };

  return { candidates: [candidate], mode: "live" };
}

/* -------------------------------------------------------------------------- */
/* ObjectIdentity builder                                                      */
/* -------------------------------------------------------------------------- */

export interface BuildObjectIdentityInput {
  bytes: Uint8Array;
  image: RasterImage;
  /** Existing dHash of the same image to compare against (duplicate check). */
  compareAgainst?: { dHash: string; passportId: string };
}

/**
 * Compute and return a schema-conformant `ObjectIdentity` object for an image.
 * Runs all fingerprinting, similarity comparison, and forensics in one call.
 */
export function buildObjectIdentity(
  input: BuildObjectIdentityInput,
): ObjectIdentity {
  const imgHash = sha256Hex(input.bytes);
  const imgDHash = dHash(input.image);
  const angles = angleCount(input.image);

  let duplicateOf: string | null = null;
  let similarityScore: number | null = null;

  if (input.compareAgainst) {
    const cmp = compare(imgDHash, input.compareAgainst.dHash);
    similarityScore = cmp.similarityScore;
    if (cmp.verdict === "duplicate" || cmp.verdict === "possible-duplicate") {
      duplicateOf = input.compareAgainst.passportId;
    }
  }

  const { hasExif, hasC2pa } = detectProvenanceMarkers(input.bytes);
  const forensics = computeForensics(input.image, hasExif, hasC2pa);

  return {
    sha256: imgHash,
    dHash: imgDHash,
    angleCount: angles,
    embeddingRef: null,
    duplicateOf,
    similarityScore,
    forgeryRisk: {
      score: forensics.forgeryRisk,
      signals: forensics.signals,
    },
  };
}
