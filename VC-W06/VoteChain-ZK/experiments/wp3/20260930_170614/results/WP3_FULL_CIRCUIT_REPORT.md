# VoteChain-ZK WP3 Full Custom Circuit Report

Run ID: 20260930_170614

Status: PASS

## Scope

WP3 implements one coherent VoteChain-specific Groth16 voting statement.

The proof binds together:

- private credential secret
- Poseidon identity commitment
- depth-17 Poseidon Merkle membership
- election-scoped nullifier
- election context
- candidate-manifest hash
- runtime candidate count
- contract/verifier domain input
- election BabyJub public key
- hidden one-hot ballot
- zero padding beyond candidateCount
- fresh per-slot ElGamal randomness
- BabyJub ElGamal ciphertext correctness
- exact ciphertext binding

## Frozen circuit build profile

MAX_CANDIDATES = 16

MERKLE_DEPTH = 17

ELIGIBLE_CAPACITY = 131072

Proof system = Groth16 / snarkjs

Circuit language = Circom 2

Circuit-side point representation =
AFFINE_XY_CANONICAL_FIELD_ELEMENTS

## Domain separation

Domain labels and field constants are frozen in:

/d/University/4thYear2ndSemester/Capstone/UGC_Project/VC-W06/VoteChain-ZK/crypto/config/wp3-build-profile.json

Derivation:

SHA256(UTF8(label)) mod BN254_Fr

The generated Circom registry is:

/d/University/4thYear2ndSemester/Capstone/UGC_Project/VC-W06/VoteChain-ZK/circuits/config/VoteChainBuildProfile.circom

## Public-key safety

The circuit checks:

1. BabyJub curve equation
2. public key is not the identity
3. BabyJub subOrder * Y equals the identity

Therefore the WP3 statement explicitly checks prime-subgroup membership.

## Candidate safety

candidateCount is constrained to:

1 <= candidateCount <= 16

Every bit is Boolean.

Exactly one bit is 1.

Every slot j >= candidateCount is forced to zero.

## Randomness safety

Every ElGamal scalar r_j is:

- nonzero
- decomposed into 253 bits
- constrained below the BabyJub prime subgroup order

## Full binding variants

DIRECT

Constraints:
61206

Public signals:


Submitted ciphertext coordinates are Groth16 public inputs.

POSEIDON

Constraints:
66339

Public signals:


The circuit recomputes a Poseidon chain over all ciphertext coordinates and
binds the result to one public bindingDigest.

## Binding decision

Both complete circuits are valid WP3 implementations.

Final binding selection remains:

DEFERRED_PENDING_WP4_EVM_GAS_AND_CALLDATA

WP4 must measure:

- Groth16 verifier gas
- direct public-input/calldata cost
- Poseidon digest recomputation gas
- total encrypted-vote gas
- final calldata size
- BabyJub encrypted-tally addition gas

No circuit-only result is used to select the final EVM path.

## Registered negative tests

Witness-level rejection covers:

- changed secret
- wrong Merkle path
- non-binary path bit
- wrong eligible root
- wrong election
- wrong nullifier
- wrong election context
- wrong candidate manifest
- wrong contract domain
- duplicate selected candidates
- zero selected candidates
- padded/out-of-range candidate selected
- zero encryption randomness
- out-of-range encryption randomness
- candidateCount zero
- candidateCount above 16
- different election public key
- self-consistent non-prime-subgroup public key
- direct ciphertext mismatch
- incorrect Poseidon binding

Post-proof verification rejection covers:

- ciphertext/binding modified after proof
- different candidate manifest
- different election public key
- malformed public-signal length
- corrupted Groth16 proof

## Nullifier property

The same secret produces different nullifiers for different electionId values.

## Groth16 artifacts

Both variants have:

- compiled R1CS
- WASM witness generator
- symbol map
- DEV-only contributed zkey
- verification_key.json
- valid Groth16 proof/public signals
- generated Solidity verifier
- known-answer synthetic vectors
- SHA-256 evidence manifest

## Evidence classification

WP3 correctness / integration evidence.

Smoke timings and file sizes are recorded for engineering diagnostics only.

They are NOT the final WP8 benchmark campaign.

## Biometric boundary

Real biometric database used: NO

Real biometric data used: NO

Biometric implementation modified: NO

New biometric benchmark: NO

## Other boundaries

Semaphore modified: NO

Backend modified: NO

Frontend modified: NO

Application runtime modified: NO

Generated Solidity verifier artifacts: YES

Production voting contracts implemented: NO

Production trusted setup: NO

Production DKG implemented: NO
