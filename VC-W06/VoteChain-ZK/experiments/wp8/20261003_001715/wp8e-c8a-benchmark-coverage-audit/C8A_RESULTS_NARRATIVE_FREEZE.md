# WP8E C8A Results Narrative Freeze

## Scope of the completed final result

The completed final benchmark establishes the accepted-ballot accumulation
dimension for the frozen DIRECT profile with `candidateCount = 4` and 16
ciphertext slots.

The final campaign contains 30 fresh-chain elections:

- 5 warm-up elections,
- 25 independent measured elections,
- 400 warm-up accepted transactions,
- 2,000 measured accepted transactions,
- 2,400 total accepted transactions.

The accepted-ballot scales are:

`N = {25, 50, 75, 100, 150}`

Each scale contains five independent measured fresh-chain elections.

The 400 warm-up observations are preserved but excluded from final statistics.
No silent outlier deletion was performed.

## Gas result

Typical accepted-vote gas is nearly invariant over the tested accepted-ballot
accumulation range.

Across `N = 25..150`:

- median gas ranges from 1,307,326 to 1,307,403,
- nearest-rank p95 ranges from 1,307,759 to 1,307,997.

The pooled mean gas decreases by approximately 1.40% from N=25 to N=150.
This must not be interpreted as evidence that larger accumulated election
state intrinsically reduces `castVote` execution cost.

The position-level audit shows that every fresh election begins with the same
1,866,414-gas first accepted vote. The first vote is approximately 42.77%
more expensive than the mean of positions 2..N because previously empty
persistent vote/tally/nullifier state is initialized.

As N increases, this one-time first-vote cost is spread across more accepted
transactions, causing the pooled mean to decrease.

Therefore median and nearest-rank p95 are the preferred descriptors for
typical per-vote gas in the accepted-ballot scaling discussion.

## Local transaction latency result

The measured latency is local process/RPC wall-clock time from immediately
before invoking `cast send` until receipt return.

It is:

- not Groth16 proving time,
- not witness-generation time,
- not public Ethereum confirmation latency,
- not biometric authentication time,
- not end-to-end voter interaction time.

Scale-level mean latency is non-monotonic across N=25..150 and ranges from
approximately 749.9 ms to 773.7 ms.

No monotonic scaling model or regression is claimed.

## Parser diagnostic observations

Two successful final-campaign receipts contained trailing local RPC diagnostic
text after valid receipt JSON.

Runner V2 preserved those receipt artifacts and successfully retained their
measurements.

Both observations remain included in the final dataset.

Neither is the overall maximum-latency observation.

No latency was reconstructed or imputed.

## Historical pre-ZKP comparison boundary

The published pre-ZKP LocalVoting contract is a historical reference point,
not a controlled A/B estimate of cryptographic overhead.

Its vote function, state representation, privacy guarantees, proof workload,
ballot representation, and tally mechanism differ materially from the final
DIRECT design.

Therefore:

- published pre-ZKP gas may be reported as a historical baseline,
- the final DIRECT gas may be reported as the final ZKP-system result,
- their raw numerical difference must not be described as an isolated
  'ZKP overhead' unless a controlled cleaned non-ZKP comparator is measured
  under a matched protocol.

Similarly, the published end-to-end voting-time measurement includes biometric,
IoT, liveness, and blockchain components and must not be directly compared with
the current local cast-to-receipt metric.

## Benchmark-suite coverage boundary

The accepted-ballot accumulation dimension is COMPLETE.

The following preregistered dimensions remain PENDING FINAL measurement:

1. fresh-chain vote microbenchmark:
   5 warm-ups + 20 measured fresh-chain runs;

2. candidate-count matrix:
   `candidateCount = {2, 4, 8, 16}`;

3. eligible-set-size matrix:
   `eligibleSet = {10, 100, 1000, 10000}`.

Earlier pilot/development measurements must not be promoted into those final
dimensions.

Consequently, the accepted-ballot scaling result is publication-ready as its
own experiment, but the entire WP8 benchmark suite must not yet be described
as complete.

## Publication wording guardrail

Safe wording:

> Under the frozen 4-candidate, 16-slot DIRECT configuration, typical
> accepted-vote gas remained nearly invariant as accepted ballots accumulated
> from 25 to 150, while local cast-to-receipt latency showed no monotonic
> increase over the tested range.

Unsafe wording:

> VoteChain has been proven scalable for all election sizes.

The experiment does not establish that broader claim.
