/**
 * x402 metered register checks — the agentic-commerce hook.
 *
 * PROVENANCE: ported from Ethical-Tech-CoLab/arts-provenance-agent
 *   (src/agent/payForCheck.ts, src/lib/spend.ts). Upstream depended on
 *   `x402-fetch` and a live signer; this port expresses the same protocol
 *   through injected `fetch` and `signer` so the module has no network or
 *   key dependency at import time and runs unchanged in the browser.
 *
 * ---------------------------------------------------------------------------
 * THE GUARDRAILS ARE THE POINT
 *
 * An agent holding a spending key is only safe if it refuses to spend. Three
 * refusals are implemented here, and each is enforced BEFORE a signature is
 * produced rather than after:
 *
 *   1  conclusive   evidence is already dense enough that a paid check cannot
 *                   change the outcome
 *   2  budget       the run has a hard lifetime cap
 *   3  preflight    the vendor's quoted price is read from the 402 and refused
 *                   if it exceeds the remaining budget — no key touches a
 *                   request until the price is known and accepted
 *
 * Without (3) an agent signs whatever it is asked for, which is the failure
 * mode that makes autonomous payment unacceptable to a compliance officer.
 * ---------------------------------------------------------------------------
 *
 * NOTE (BACKLOG): x402 answers the MECHANISM of paying per lookup. It does not
 * answer the ECONOMICS at scale — a passport touching hundreds of registers at
 * per-query prices has no viable unit cost. That is unresolved.
 */

import type { PremiumCheck } from "@dpa/schema";

/** Above this confidence, more evidence cannot change the outcome. */
export const CONCLUSIVE_THRESHOLD = 90;

/** USDC has six decimals. */
const USDC_DECIMALS = 6;

export function usdToAtomic(usd: number): bigint {
  return BigInt(Math.round(usd * 10 ** USDC_DECIMALS));
}

export function atomicToUsd(atomic: bigint): number {
  return Number(atomic) / 10 ** USDC_DECIMALS;
}

/* -------------------------------------------------------------------------- */
/* Spend ledger                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A per-run spending ledger. Explicitly NOT module-global state: an agent that
 * shares one cap across unrelated runs will either block work it should do or
 * permit spend it should not, depending on ordering.
 */
export class SpendLedger {
  #spentUsd = 0;

  constructor(readonly maxSpendUsd: number) {}

  get spentUsd(): number {
    return this.#spentUsd;
  }

  get remainingUsd(): number {
    return Math.max(0, this.maxSpendUsd - this.#spentUsd);
  }

  canAfford(usd: number): boolean {
    return this.#spentUsd + usd <= this.maxSpendUsd + 1e-9;
  }

  record(usd: number): void {
    this.#spentUsd += usd;
  }
}

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface PaymentQuote {
  requiredUsd: number;
  network: string;
  payTo: string;
  asset: string;
}

/**
 * Signs an x402 payment authorisation. Supplying one of these is what puts the
 * module in live mode; there is no default and no fallback that invents one.
 */
export type PaymentSigner = (quote: PaymentQuote) => Promise<string>;

export interface PayOptions {
  title: string;
  artist?: string;
  /** 0–100 confidence from the accumulation scorer. */
  currentConfidence: number;
  vendorUrl?: string;
  vendorName?: string;
  priceUsd?: number;
  ledger: SpendLedger;
  mode?: "mock" | "live";
  fetchImpl?: typeof globalThis.fetch;
  signer?: PaymentSigner;
  /** Canned vendor payload returned in mock mode. */
  mockResult?: unknown;
}

export class SignerMissingError extends Error {
  constructor() {
    super(
      "Live x402 mode requires a PaymentSigner. None was supplied, and this module will not invent one — an unsigned live run would silently become a mock run and report a payment that never happened.",
    );
    this.name = "SignerMissingError";
  }
}

/* -------------------------------------------------------------------------- */
/* Simulated settlement                                                        */
/* -------------------------------------------------------------------------- */

/**
 * A deterministic, self-identifying simulated transaction hash.
 *
 * Begins `0x51...` ("SI") and repeats, so it cannot be mistaken for a real
 * settlement by anyone reading a log or a passport. A random-looking hash here
 * would be indistinguishable from a live one, which is exactly the confusion a
 * demo must not create.
 */
export function simulatedTx(title: string): string {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const hex = h.toString(16).padStart(8, "0");
  return ("0x" + ("51" + hex).repeat(8)).slice(0, 66);
}

/* -------------------------------------------------------------------------- */
/* Preflight                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Read the vendor's price from its 402 response WITHOUT signing anything.
 *
 * Returns null when the endpoint does not speak x402, in which case the caller
 * must not proceed to payment.
 */
export async function preflight402(
  url: string,
  fetchImpl: typeof globalThis.fetch,
): Promise<PaymentQuote | null> {
  const res = await fetchImpl(url, { method: "GET" });
  if (res.status !== 402) return null;

  const body = (await res.json().catch(() => null)) as
    | { accepts?: Array<Record<string, unknown>> }
    | null;
  const accept = body?.accepts?.[0];
  if (!accept) return null;

  const maxAmount = String(accept["maxAmountRequired"] ?? "0");
  return {
    requiredUsd: atomicToUsd(BigInt(maxAmount)),
    network: String(accept["network"] ?? "base-sepolia"),
    payTo: String(accept["payTo"] ?? ""),
    asset: String(accept["asset"] ?? ""),
  };
}

/* -------------------------------------------------------------------------- */
/* The check                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Decide whether a metered check is worth buying, and buy it only if so.
 *
 * The returned `PremiumCheck` records the decision either way — a skip is as
 * much a part of the audit trail as a purchase, because "we chose not to look
 * here, and why" is exactly what a later reviewer needs to know.
 */
export async function payForCheck(opts: PayOptions): Promise<PremiumCheck> {
  const price = opts.priceUsd ?? 0.05;
  const vendor = opts.vendorName ?? "Art Loss Register — Premium Search";
  const mode = opts.mode ?? "mock";
  const ledger = opts.ledger;

  const base = {
    vendor,
    amountUsd: price,
    network: "base-sepolia",
  };

  // ── Refusal 1: the answer cannot change ──────────────────────────────────
  if (opts.currentConfidence >= CONCLUSIVE_THRESHOLD) {
    return {
      ...base,
      result: null,
      paymentTx: null,
      facilitator: "none (no payment attempted)",
      mode: "skipped",
      reasoning: `Confidence is already ${opts.currentConfidence}/100, at or above the conclusive threshold of ${CONCLUSIVE_THRESHOLD}. A $${price.toFixed(2)} check cannot change the outcome, so it was not bought.`,
    };
  }

  // ── Refusal 2: the run is out of budget ──────────────────────────────────
  if (!ledger.canAfford(price)) {
    return {
      ...base,
      result: null,
      paymentTx: null,
      facilitator: "none (no payment attempted)",
      mode: "skipped",
      reasoning: `Budget cap reached: $${ledger.spentUsd.toFixed(2)} already spent against a $${ledger.maxSpendUsd.toFixed(2)} cap, and this check costs $${price.toFixed(2)}. Refusing to exceed the cap.`,
    };
  }

  const rationale = `Confidence ${opts.currentConfidence}/100 is inconclusive and this check can resolve an open question, at $${price.toFixed(2)} against $${ledger.remainingUsd.toFixed(2)} remaining.`;

  // ── Mock mode ────────────────────────────────────────────────────────────
  if (mode === "mock") {
    return {
      ...base,
      result: opts.mockResult ?? { status: "no-evidence-found", _mock: true },
      paymentTx: simulatedTx(opts.title),
      facilitator: "mock (simulated settlement — no chain, no payment)",
      mode: "mock",
      reasoning: `${rationale} Settlement simulated: this run is in mock mode, so no payment occurred and the vendor payload is canned.`,
    };
  }

  // ── Live mode ────────────────────────────────────────────────────────────
  if (!opts.signer) throw new SignerMissingError();
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const url = `${opts.vendorUrl ?? ""}/alr/premium-search?title=${encodeURIComponent(opts.title)}`;

  // ── Refusal 3: read the price before a key touches the request ───────────
  const quote = await preflight402(url, fetchImpl);
  if (!quote) {
    return {
      ...base,
      result: null,
      paymentTx: null,
      facilitator: "none (endpoint did not quote a price)",
      mode: "skipped",
      reasoning:
        "The vendor did not respond with an x402 quote, so there was no price to agree to. Refusing to sign a payment against an unknown amount.",
    };
  }

  if (quote.requiredUsd > ledger.remainingUsd + 1e-9) {
    return {
      ...base,
      amountUsd: quote.requiredUsd,
      result: null,
      paymentTx: null,
      facilitator: "none (quote exceeded budget)",
      mode: "skipped",
      reasoning: `Vendor quoted $${quote.requiredUsd.toFixed(6)} but only $${ledger.remainingUsd.toFixed(2)} of the $${ledger.maxSpendUsd.toFixed(2)} budget remains. Refusing to sign an authorisation above the cap.`,
    };
  }

  const authorisation = await opts.signer(quote);
  const res = await fetchImpl(url, {
    method: "GET",
    headers: { "X-PAYMENT": authorisation },
  });
  if (!res.ok) {
    throw new Error(`Vendor returned HTTP ${res.status} after payment was authorised.`);
  }

  const data: unknown = await res.json();
  ledger.record(quote.requiredUsd);

  let paymentTx: string | null = null;
  const header = res.headers.get("x-payment-response");
  if (header) {
    try {
      const decoded = JSON.parse(atob(header)) as { transaction?: string; txHash?: string };
      paymentTx = decoded.transaction ?? decoded.txHash ?? null;
    } catch {
      paymentTx = null;
    }
  }

  return {
    ...base,
    amountUsd: quote.requiredUsd,
    result: data,
    paymentTx,
    facilitator: `x402 on ${quote.network}`,
    mode: "live",
    reasoning: rationale,
  };
}
