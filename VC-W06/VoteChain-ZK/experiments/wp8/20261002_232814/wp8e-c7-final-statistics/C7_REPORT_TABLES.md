# WP8E C7 Final Statistical Tables

Final campaign: `20261002_224441`

Only the 2,000 preregistered measured transactions are included in benchmark statistics. The 400 warm-up transactions are preserved but excluded. No outlier observations were deleted.

p95 uses the preregistered nearest-rank definition.

## Transaction-level statistics by accepted-ballot scale

| N | Measured tx | Gas mean | Gas median | Gas SD | Gas p95 | Latency mean (ms) | Latency median (ms) | Latency SD (ms) | Latency p95 (ms) |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 25 | 125 | 1329671.680 | 1307326.000 | 110003.209 | 1307783 | 758.558 | 753.912 | 56.481 | 851.258 |
| 50 | 250 | 1318524.940 | 1307403.000 | 78427.338 | 1307997 | 749.866 | 740.171 | 54.869 | 841.332 |
| 75 | 375 | 1314766.013 | 1307350.000 | 64214.058 | 1307783 | 759.730 | 750.885 | 53.405 | 846.840 |
| 100 | 500 | 1312904.370 | 1307361.000 | 55686.227 | 1307759 | 773.656 | 768.473 | 57.196 | 859.314 |
| 150 | 750 | 1311046.147 | 1307352.500 | 45528.680 | 1307759 | 756.355 | 749.100 | 52.263 | 838.877 |

## Independent-election mean statistics by scale

Each scale has five independent measured fresh-chain elections.

| N | Elections | Mean of election-mean gas | SD of election-mean gas | p95 election-mean gas | Mean of election-mean latency (ms) | SD of election-mean latency (ms) | p95 election-mean latency (ms) |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 25 | 5 | 1329671.680 | 0.000 | 1329671.680 | 758.558 | 53.181 | 807.226 |
| 50 | 5 | 1318524.940 | 0.000 | 1318524.940 | 749.866 | 48.698 | 792.897 |
| 75 | 5 | 1314766.013 | 0.000 | 1314766.013 | 759.730 | 46.265 | 798.649 |
| 100 | 5 | 1312904.370 | 0.000 | 1312904.370 | 773.656 | 36.809 | 799.161 |
| 150 | 5 | 1311046.147 | 0.000 | 1311046.147 | 756.355 | 44.046 | 789.641 |

## Overall measured observations

- Measured transactions: 2000
- Independent measured elections: 25
- Overall gas mean: 1314307.123
- Overall gas median: 1307355.000
- Overall gas sample SD: 62133.009
- Overall gas nearest-rank p95: 1307783
- Overall latency mean: 760.640 ms
- Overall latency median: 755.111 ms
- Overall latency sample SD: 54.870 ms
- Overall latency nearest-rank p95: 845.693 ms
