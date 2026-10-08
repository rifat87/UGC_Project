VoteChain WP8 Final Reproducibility Package
===========================================

This archive contains the final WP8 publication outputs, the exact nine
authoritative result-source artifacts selected by the frozen F1/F1A1
provenance chain, and the principal closeout/schema-selection records.

Directory layout
----------------
pub/   Final publication tables, structured results, synthesis, claim
       boundaries, and independent validation.
src/   Exact nine authoritative publication-source artifacts. The mapping
       to original project-relative paths is in meta/source-index.tsv.
prov/  Selection, schema-recovery, closeout, and receipt provenance.
meta/  Source/provenance indexes and package metadata.

The complete historical raw experiment corpus is NOT duplicated here.
It remains preserved in the VoteChain-ZK experiments/wp8 project tree.

Verification
------------
Run:

    python VERIFY_PACKAGE.py

Success prints:

    PACKAGE_VERIFICATION=PASS

Publication guardrails
----------------------
This package does not authorize:
- an isolated ZKP-overhead claim from raw pre-ZKP vs DIRECT gas;
- an isolated candidateCount opcode-cost claim;
- isolated Merkle path-extraction timing;
- on-chain eligible-set scaling;
- a single causal scaling curve across the four experiment families;
- direct equivalence between local benchmark latency and biometric/IoT
  end-to-end voting latency.
