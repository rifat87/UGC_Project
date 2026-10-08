# Runtime candidate-count scaling

Candidate-count experiment uses fixed MAX_CANDIDATES=16 with runtime candidateCount. Gas differs by only 12 gas between K2 and K4/K8/K16; this is attributable to calldata zero-byte composition and must not be presented as isolated candidate-processing opcode cost.

| profile | metric | unit | n | mean | median | min | max | sample_sd | p95 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| K=2 | CAST_VOTE_GAS | gas | 20 | 1866402.000000 | 1866402.000000 | 1866402.000000 | 1866402.000000 | 0.000000 | 1866402.000000 |
| K=2 | LOCAL_CAST_RECEIPT_LATENCY | ms | 20 | 865.021110 | 858.926450 | 844.793900 | 948.718700 | 23.340039 | 899.420000 |
| K=4 | CAST_VOTE_GAS | gas | 20 | 1866414.000000 | 1866414.000000 | 1866414.000000 | 1866414.000000 | 0.000000 | 1866414.000000 |
| K=4 | LOCAL_CAST_RECEIPT_LATENCY | ms | 20 | 874.816695 | 862.990950 | 836.827900 | 991.140000 | 43.828458 | 966.283100 |
| K=8 | CAST_VOTE_GAS | gas | 20 | 1866414.000000 | 1866414.000000 | 1866414.000000 | 1866414.000000 | 0.000000 | 1866414.000000 |
| K=8 | LOCAL_CAST_RECEIPT_LATENCY | ms | 20 | 864.572260 | 858.495800 | 844.033600 | 954.673500 | 23.813503 | 884.174800 |
| K=16 | CAST_VOTE_GAS | gas | 20 | 1866414.000000 | 1866414.000000 | 1866414.000000 | 1866414.000000 | 0.000000 | 1866414.000000 |
| K=16 | LOCAL_CAST_RECEIPT_LATENCY | ms | 20 | 863.063140 | 858.423750 | 841.805300 | 975.367900 | 28.150422 | 881.923200 |

Frozen data source: `T03_CANDIDATE_COUNT_SCALING.tsv`.
