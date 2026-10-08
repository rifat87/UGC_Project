# WP8E C7C Publication Figure Captions

## Figure 1 — Typical castVote gas by accepted-ballot scale

Median and nearest-rank p95 gas consumption for accepted `castVote` transactions
across fresh elections containing N = 25, 50, 75, 100, and 150 sequential accepted
ballots. Each scale contains five independent measured fresh-chain elections.
Median gas ranges only from 1,307,326 to 1,307,403 gas and nearest-rank p95 ranges
from 1,307,759 to 1,307,997 gas, indicating that typical accepted-vote execution
cost is nearly invariant over this accepted-ballot state-growth range for the
frozen 4-candidate, 16-slot DIRECT profile.

This figure evaluates accepted-ballot accumulation only; it does not substitute
for the separate candidate-count or eligible-set-size experimental dimensions.


## Figure 2 — Position-level gas at N=150

Mean gas consumption by sequential accepted-ballot position across the five
independent measured N=150 elections. The first accepted vote consumes
1,866,414 gas, while positions 2..150 remain near approximately 1.307 million
gas. The first vote is about 42.77% more expensive than the mean of positions
2..150 because it initializes previously empty persistent tally/nullifier state.
Consequently, the lower pooled mean gas at larger N is primarily a dilution of
this one-time first-vote initialization cost and should not be interpreted as
evidence that increasing election state intrinsically reduces per-vote gas.


## Figure 3 — Local cast-to-receipt latency by scale

Mean, median, and nearest-rank p95 wall-clock latency measured from local
`cast send` start until receipt return for accepted transactions. Latency is
non-monotonic across N = 25..150; scale-level mean latency ranges from roughly
749.9 ms to 773.7 ms. These measurements describe the local Anvil/Foundry
process and RPC environment only. They are not Groth16 proving time and are
not public Ethereum network confirmation latency.


## Figure 4 — Independent-election mean latency by scale

Distribution of mean local cast-to-receipt latency across the five independent
measured fresh-chain elections at each accepted-ballot scale. Unlike gas,
which is deterministic for the repeated frozen transaction/state sequence,
wall-clock latency varies across repetitions. The figure therefore presents
between-election timing variability without fitting or implying a monotonic
scaling model.


## Measurement notes

- Final campaign: `20261002_224441`.
- 2,000 preregistered measured transactions are used for reported statistics.
- 400 warm-up transactions are preserved but excluded from final statistics.
- No silent outlier deletion was performed.
- p95 is nearest-rank.
- Two successful receipts contained trailing local RPC diagnostic text; both
  observations remain in the dataset.
- Neither trailing-diagnostic observation is the overall maximum-latency
  observation.
- The earlier aborted instrumentation campaign is excluded from all final
  benchmark statistics.
