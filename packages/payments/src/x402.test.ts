import { describe, it, expect } from "vitest";
import {
  payForCheck,
  SpendLedger,
  SignerMissingError,
  simulatedTx,
  usdToAtomic,
  atomicToUsd,
  CONCLUSIVE_THRESHOLD,
} from "./index.js";

describe("SpendLedger", () => {
  it("tracks spend against a cap", () => {
    const l = new SpendLedger(1);
    expect(l.canAfford(0.5)).toBe(true);
    l.record(0.8);
    expect(l.remainingUsd).toBeCloseTo(0.2);
    expect(l.canAfford(0.5)).toBe(false);
  });

  it("does not share a cap between runs", () => {
    const a = new SpendLedger(1);
    const b = new SpendLedger(1);
    a.record(1);
    expect(b.remainingUsd).toBe(1);
  });
});

describe("USDC conversion", () => {
  it("round-trips at six decimals", () => {
    expect(usdToAtomic(0.05)).toBe(50000n);
    expect(atomicToUsd(50000n)).toBeCloseTo(0.05);
  });
});

describe("simulated settlement", () => {
  it("is self-identifying so it cannot pass as a real hash", () => {
    expect(simulatedTx("Any Object").startsWith("0x51")).toBe(true);
  });

  it("is deterministic", () => {
    expect(simulatedTx("Bura askos")).toBe(simulatedTx("Bura askos"));
  });
});

describe("refusal 1: conclusive evidence", () => {
  it("does not buy a check that cannot change the outcome", async () => {
    const result = await payForCheck({
      title: "Well-documented Object",
      currentConfidence: CONCLUSIVE_THRESHOLD,
      ledger: new SpendLedger(10),
    });
    expect(result.mode).toBe("skipped");
    expect(result.paymentTx).toBeNull();
    expect(result.reasoning).toContain("conclusive");
  });
});

describe("refusal 2: budget", () => {
  it("refuses once the cap is reached", async () => {
    const ledger = new SpendLedger(0.05);
    ledger.record(0.05);
    const result = await payForCheck({
      title: "Object",
      currentConfidence: 40,
      priceUsd: 0.05,
      ledger,
    });
    expect(result.mode).toBe("skipped");
    expect(result.reasoning).toContain("Budget cap reached");
  });
});

describe("refusal 3: preflight", () => {
  it("refuses a quote above the remaining budget without signing", async () => {
    let signerCalled = false;
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify({ accepts: [{ maxAmountRequired: "5000000", network: "base-sepolia" }] }),
        { status: 402 },
      )) as unknown as typeof globalThis.fetch;

    const result = await payForCheck({
      title: "Object",
      currentConfidence: 40,
      priceUsd: 0.05,
      ledger: new SpendLedger(0.1),
      mode: "live",
      fetchImpl,
      signer: async () => {
        signerCalled = true;
        return "sig";
      },
    });

    expect(result.mode).toBe("skipped");
    expect(signerCalled, "the signer must never run for a quote above budget").toBe(false);
  });

  it("refuses when the endpoint quotes no price at all", async () => {
    const fetchImpl = (async () => new Response("{}", { status: 200 })) as unknown as typeof globalThis.fetch;
    const result = await payForCheck({
      title: "Object",
      currentConfidence: 40,
      ledger: new SpendLedger(10),
      mode: "live",
      fetchImpl,
      signer: async () => "sig",
    });
    expect(result.mode).toBe("skipped");
  });
});

describe("live mode without a signer", () => {
  it("throws rather than silently degrading to mock", async () => {
    await expect(
      payForCheck({
        title: "Object",
        currentConfidence: 40,
        ledger: new SpendLedger(10),
        mode: "live",
      }),
    ).rejects.toBeInstanceOf(SignerMissingError);
  });
});

describe("mock mode", () => {
  it("labels the facilitator as simulated and does not touch the ledger", async () => {
    const ledger = new SpendLedger(10);
    const result = await payForCheck({
      title: "Bura askos",
      currentConfidence: 40,
      ledger,
    });
    expect(result.mode).toBe("mock");
    expect(result.facilitator).toContain("mock");
    expect(ledger.spentUsd).toBe(0);
  });
});
