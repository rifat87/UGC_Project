# VC-W06 VoteChain-ZK Publication Assets

This bundle was generated from the frozen PUB-P1 result/specification basis.

## Contents

- `frozen-source/` — the six hash-frozen WP8 publication source files.
- `data/` — exact frozen table backing data. No benchmark statistic is recomputed.
- `tables/` — five publication tables in Markdown and LaTeX.
- `figures/` — six benchmark figures in vector SVG format.
- `diagrams/` — five VoteChain-ZK architecture/protocol diagrams in vector SVG format.
- `metadata/captions.tsv` — publication captions and claim boundaries.
- `metadata/provenance.tsv` — source-to-output provenance.
- `metadata/guardrails.json` — frozen interpretation restrictions.
- `MANIFEST.tsv` — SHA-256 and byte-size manifest for the bundle.

## Frozen result basis

Canonical publication rows: 32.

Accepted-ballot observations: 2,000 measured observations across 25 independent elections.

Fresh-chain microbenchmark: 20 measured observations.

Candidate-count profiles: K=2, K=4, K=8, K=16.

Eligible-set profiles: N=10, 100, 1,000, 10,000 with fixed Merkle depth 17.

## Important interpretation boundaries

- The pre-ZKP versus DIRECT gas difference is not an isolated ZKP-overhead measurement.
- Local receipt latency is not the published biometric/IoT end-to-end latency.
- The 12-gas candidate-count difference is not isolated candidate-processing opcode cost.
- Candidate-count latency is non-monotonic.
- Eligible-set N is occupied leaves, not Merkle depth.
- M2 integrates snapshot/root/path preparation.
- M3-M5 are descriptive fixed-depth measurements with child-process overhead.
- The Groth16 vote circuit does not prove biometric matching.

## Submission relationship

The already-completed final submission ZIP is unchanged.

Final submission SHA-256:

`afd8484c2ec70c2b01198cd6431e0ec328b7c45e7d6cc702312ea2dbfd802db2`

This publication-assets bundle is a separate, versioned artifact.
