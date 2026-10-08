export const PROFILE = Object.freeze({
  name: "votechain-zk-wp2-poc-v1",

  // PoC dimensions only; final benchmark/freeze happens later in WP2.
  pocMerkleDepth: 4,
  pocMaxCandidates: 4,

  // Master architecture prototype default.
  trusteeThreshold: 3,
  trusteeCount: 5,

  // Stable domain labels. Their final field constants will be emitted during
  // the deterministic-vector phase.
  domainIdentity: "VOTECHAIN_ZK_IDENTITY_V1",
  domainNullifier: "VOTECHAIN_ZK_NULLIFIER_V1",
  domainDleq: "VOTECHAIN_ZK_DLEQ_V1",

  // Proposed canonical PoC representation.
  pointSerialization: "decimal-string-coordinate-pair-v1"
});
