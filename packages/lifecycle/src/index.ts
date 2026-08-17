/**
 * @dpa/lifecycle — revocation, amendment, review routing, claim management.
 *
 * Note: x402 answers the *mechanism* of paying for register lookups but not
 * the *economics* of doing so at scale. See BACKLOG.md for the open question
 * of per-query pricing when hundreds of registries are queried per passport.
 */
export * from "./statusList.js";
export * from "./amend.js";
export * from "./review.js";
export * from "./claims.js";
