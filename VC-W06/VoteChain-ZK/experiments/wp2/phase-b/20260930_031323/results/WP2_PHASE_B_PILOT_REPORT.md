# VoteChain-ZK WP2 Phase B Pilot Scaling Report

Run ID: 20260930_031323

Status: PASS

## Experimental classification

This is a WP2 component-level parameter-feasibility pilot.

It is NOT the final unified VoteChainVote circuit benchmark.
It is NOT the final WP8 controlled experimental campaign.
It is NOT an external literature-comparison result.

## Candidate-count pilot

K = {2, 4, 8, 16}

Two proof-to-ciphertext binding shapes were measured:

1. DIRECT
   - ciphertext coordinates are Groth16 public signals.

2. POSEIDON_CHAIN
   - ciphertext coordinates are bound into a chained Poseidon digest.
   - on-chain Poseidon recomputation gas is NOT measured in WP2.

Measured per configuration:

- R1CS constraints
- public/private inputs
- public outputs/signals
- R1CS/WASM/zkey/vkey/proof/public-signal artifact sizes
- compile time
- witness generation time
- Groth16 proving time
- Groth16 verification time

Timing policy:

- 5 warmups
- 20 measured runs
- mean
- median
- min
- max
- sample standard deviation
- nearest-rank p95

## Merkle-depth pilot

N / depth configurations:

- N=10, depth=4
- N=100, depth=7
- N=1,000, depth=10
- N=10,000, depth=14
- N=100,000, depth=17

N and depth are reported separately.

## Negative tests

K=4 DIRECT and POSEIDON_CHAIN component circuits reject:

- more than one selected candidate
- zero selected candidates

## Curve / representation status

BabyJubJub circuit-side feasibility is exercised through K=16.

This does NOT freeze EVM feasibility.

Actual BabyJubJub Solidity/gas evidence remains deferred to WP4.

## Ciphertext-binding status

Circuit evidence for DIRECT vs POSEIDON_CHAIN is recorded.

The final binding decision is NOT made automatically here because:

- final WP3 unified-circuit integration is not yet measured;
- WP4 EVM recomputation/verifier/calldata gas is not yet measured.

Final decision:
DEFERRED_PENDING_WP3_INTEGRATION_AND_WP4_EVM_GAS

## Build-profile freeze

The script deliberately does not select MAX_CANDIDATES or Merkle depth merely
because a configuration completed.

The next review must examine measured feasibility and then freeze the WP3
build profile before the full circuit implementation.

## Privacy / biometric boundary

Real biometric DB used: NO.
Real biometric data used: NO.
Biometric algorithms changed: NO.
Biometric benchmark rerun: NO.

Semaphore changed: NO.
Solidity changed: NO.
Application runtime changed: NO.

## DEV setup

The existing WP2 DEV Powers-of-Tau file was reused.

PTAU SHA-256:
6ec2a30415f1461e6797fd8d41a90f042fa28d74e28e4b687647358e4674773f

This is not a production trusted setup.
