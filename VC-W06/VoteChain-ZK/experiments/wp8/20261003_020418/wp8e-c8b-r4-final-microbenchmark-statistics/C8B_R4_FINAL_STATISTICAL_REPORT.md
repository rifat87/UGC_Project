# WP8E C8B-R4 Final Fresh-Chain Microbenchmark Statistics

## Final analysis population

The final campaign contains 25 fresh-chain iterations:

- 5 warm-up iterations;
- 20 measured iterations.

Only the 20 measured iterations are used for final reported statistics.

The 5 warm-ups are preserved separately and excluded from final statistics.

The earlier pilot observations and the aborted 20261003_012934 campaign are
excluded from final statistics.

No silent outlier deletion was performed.

No missing latency was reconstructed or imputed.

## Metric definition

Each measured iteration starts from a completely fresh Anvil chain and uses
the same frozen ballot-001 fixture.

Deployment, configure, activate, fixture loading, and post-receipt correctness
checks are outside the timed interval.

Latency is measured from immediately before local `cast send` invocation until
the process returns with receipt output.

This is a local Foundry/Anvil process-and-RPC metric. It is not Groth16 proving
time, public Ethereum confirmation latency, biometric latency, or end-to-end
voter interaction time.

## Final measured gas statistics

n = 20

mean = 1866414.000 gas

median = 1866414.000 gas

min = 1866414 gas

max = 1866414 gas

sample SD = 0.000 gas

nearest-rank p95 = 1866414 gas

All 20 measured fresh-chain votes consume exactly 1,866,414 gas.

The zero sample standard deviation reflects deterministic execution of the
same frozen first-vote transaction/state transition on independent fresh local
chains. It must not be generalized to claim zero deployment, network, or
production-environment variability.

## Final measured local cast-to-receipt latency statistics

n = 20

mean = 724.030 ms

median = 723.301 ms

min = 707.327 ms

max = 741.584 ms

sample SD = 10.001 ms

nearest-rank p95 = 741.169 ms

## Relationship to accepted-ballot scaling experiment

This fresh-chain microbenchmark isolates repeatability of the first accepted
vote under the frozen 4-candidate, 16-slot DIRECT profile.

Its 1,866,414-gas result corresponds to the first-position cost observed in the
accepted-ballot accumulation experiment.

It does not replace the accepted-ballot scaling experiment, candidate-count
matrix, or eligible-set-size matrix.

## Diagnostic handling

The final campaign postvalidation recorded:

- verifier deployment trailing diagnostics:
  1;

- DIRECT deployment trailing diagnostics:
  0;

- receipt trailing diagnostics:
  0.

These diagnostics were preserved and handled by the versioned parser. No
observation was deleted because of them.
