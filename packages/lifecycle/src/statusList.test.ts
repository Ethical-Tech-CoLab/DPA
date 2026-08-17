import { describe, it, expect } from "vitest";
import { StatusList } from "./statusList.js";

describe("StatusList", () => {
  it("allocate → not revoked", () => {
    const sl = new StatusList();
    const idx = sl.allocateIndex();
    expect(sl.isRevoked(idx)).toBe(false);
  });

  it("revoke → revoked", () => {
    const sl = new StatusList();
    const idx = sl.allocateIndex();
    sl.revoke(idx);
    expect(sl.isRevoked(idx)).toBe(true);
  });

  it("reinstate → not revoked", () => {
    const sl = new StatusList();
    const idx = sl.allocateIndex();
    sl.revoke(idx);
    sl.reinstate(idx);
    expect(sl.isRevoked(idx)).toBe(false);
  });

  it("multiple indices are independent", () => {
    const sl = new StatusList();
    const i0 = sl.allocateIndex();
    const i1 = sl.allocateIndex();
    const i2 = sl.allocateIndex();
    sl.revoke(i1);
    expect(sl.isRevoked(i0)).toBe(false);
    expect(sl.isRevoked(i1)).toBe(true);
    expect(sl.isRevoked(i2)).toBe(false);
  });

  it("round-trips through encode/decode", () => {
    const sl = new StatusList();
    const indices: number[] = [];
    for (let i = 0; i < 20; i++) indices.push(sl.allocateIndex());
    // Revoke every other entry
    for (let i = 0; i < indices.length; i += 2) sl.revoke(indices[i]!);

    const encoded = sl.encode();
    const decoded = StatusList.decode(encoded, sl.size);

    for (let i = 0; i < indices.length; i++) {
      expect(decoded.isRevoked(indices[i]!)).toBe(i % 2 === 0);
    }
  });

  it("buildStatusListCredential returns CredentialStatus shape", () => {
    const sl = new StatusList();
    const idx = sl.allocateIndex();
    const cred = sl.buildStatusListCredential(idx, "https://example.com/list-1");
    expect(cred.type).toBe("StatusList2021Entry");
    expect(cred.statusPurpose).toBe("revocation");
    expect(cred.statusListIndex).toBe(idx);
    expect(cred.statusListCredential).toBe("https://example.com/list-1");
  });
});
