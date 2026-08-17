/**
 * General-knowledge connector — model-based background context.
 *
 * PROVENANCE: generalised from Ethical-Tech-CoLab/provenance-search
 *   (server.js — the Gemini general-knowledge answer path).
 *   Policy enforcement via generalKnowledge.ts. Every claim from this
 *   connector carries isGeneralKnowledge:true, tier:"inferred", and
 *   triggers an unsourcedAssertion risk flag. See docs/DECISIONS.md#adr-008.
 */
import type {
  EvidenceConnector,
  EvidenceQuery,
  EvidenceResult,
  EvidenceClaim,
  ConnectorContext,
} from "../types.js";

const FIXTURES: EvidenceClaim[] = [
  {
    text: "Fixture: General-knowledge connector unavailable in fixtures mode.",
    sourceUrl: "https://example.com/general-knowledge",
    sourceTitle: "General knowledge (fixtures fallback)",
    tier: "inferred",
    date: null,
    location: null,
    isGeneralKnowledge: true,
    verifiedBy: "Model general knowledge",
    sourceType: "general-knowledge",
  },
];

export class GeneralKnowledgeConnector implements EvidenceConnector {
  readonly id = "general-knowledge";
  readonly name = "General knowledge (model-based)";
  readonly access = "grounded-search" as const;
  readonly kind = "scholarly" as const;

  async search(
    q: EvidenceQuery,
    ctx: ConnectorContext,
  ): Promise<EvidenceResult> {
    if (ctx.mode === "fixtures") {
      return { connectorId: this.id, claims: FIXTURES, rawHitCount: 0 };
    }

    const apiKey = ctx.env?.["GEMINI_API_KEY"];
    if (!apiKey) {
      return {
        connectorId: this.id,
        claims: [],
        rawHitCount: 0,
        error: "GEMINI_API_KEY not set; general-knowledge connector skipped",
      };
    }

    const fetchImpl = ctx.fetchImpl ?? globalThis.fetch;
    const prompt = `You are a provenance research assistant. Provide a brief, factual summary of the known provenance history for: "${q.title}"${q.artist ? ` by ${q.artist}` : ""}. Include key ownership dates, any theft/looting/restitution events, and current location if known. Be concise (2-4 sentences). If you are not sure, say so.`;

    try {
      const res = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 300 },
          }),
        },
      );
      if (!res.ok) {
        return {
          connectorId: this.id,
          claims: [],
          rawHitCount: 0,
          error: `Gemini HTTP ${res.status}`,
        };
      }
      const data = (await res.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text.trim()) {
        return { connectorId: this.id, claims: [], rawHitCount: 0 };
      }

      const claim: EvidenceClaim = {
        text: text.trim(),
        sourceUrl: "https://ai.google.dev/gemini-api",
        sourceTitle: "Gemini general knowledge",
        tier: "inferred",
        date: null,
        location: null,
        isGeneralKnowledge: true,
        verifiedBy: "Model general knowledge — Gemini",
        sourceType: "general-knowledge",
      };

      return { connectorId: this.id, claims: [claim], rawHitCount: 1 };
    } catch (e) {
      return {
        connectorId: this.id,
        claims: [],
        rawHitCount: 0,
        error: String(e),
      };
    }
  }
}
