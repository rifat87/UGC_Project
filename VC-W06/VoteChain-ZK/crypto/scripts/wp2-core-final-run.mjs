import assert from "node:assert/strict";
import os from "node:os";
import { performance } from "node:perf_hooks";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
    PROFILE,
    context,
    identityPoint,
    mul,
    eq,
    serializePoint,
    pointInts,
    poseidon,
    identityCommitment,
    electionNullifier,
    buildMerkleTree,
    merkleProof,
    verifyMerkle,
    encryptBit,
    aggregate,
    zeroTally,
    addEncryptedBallot,
    boundedDecode,
    runDkgPoc,
    partialDecrypt,
    combinePartials,
    thresholdDecrypt,
    provePartial,
    verifyPartial
} from "../src/wp2-core-final.mjs";

const WARMUPS = 5;
const MEASURED = 20;

const c = await context();

const POLYS = [
    [11n, 2n, 3n],
    [13n, 5n, 7n],
    [17n, 11n, 13n],
    [19n, 17n, 23n],
    [29n, 31n, 37n]
];

const securityResults = [];

async function check(name, fn) {
    try {
        await fn();

        securityResults.push({
            test: name,
            status: "PASS"
        });

        console.log(
            `[PASS] ${name}`
        );
    } catch (error) {
        securityResults.push({
            test: name,
            status: "FAIL",
            error:
                String(
                    error?.message ??
                    error
                )
        });

        await writeFile(
            resolve(
                "..",
                "experiments",
                "wp2",
                "raw",
                "wp2-security-tests.json"
            ),
            JSON.stringify(
                securityResults,
                null,
                2
            ) + "\n"
        );

        throw error;
    }
}

function stats(samples) {
    const sorted =
        [...samples]
            .sort(
                (a, b) =>
                    a - b
            );

    const mean =
        samples.reduce(
            (a, b) =>
                a + b,
            0
        ) /
        samples.length;

    const variance =
        samples.length > 1
            ? samples.reduce(
                (sum, x) =>
                    sum +
                    (x - mean) ** 2,
                0
            ) /
            (samples.length - 1)
            : 0;

    return {
        n: samples.length,
        meanMs: mean,

        medianMs:
            sorted[
                Math.floor(
                    sorted.length / 2
                )
            ],

        minMs:
            sorted[0],

        maxMs:
            sorted[
                sorted.length - 1
            ],

        sampleStdDevMs:
            Math.sqrt(
                variance
            ),

        p95Ms:
            sorted[
                Math.max(
                    0,
                    Math.ceil(
                        0.95 *
                        sorted.length
                    ) - 1
                )
            ]
    };
}

async function benchmark(
    metricId,
    name,
    fn
) {
    for (
        let i = 0;
        i < WARMUPS;
        i++
    )
        await fn(i);

    const samples = [];

    for (
        let i = 0;
        i < MEASURED;
        i++
    ) {
        const start =
            performance.now();

        await fn(i);

        samples.push(
            performance.now() -
            start
        );
    }

    return {
        metricId,
        name,
        warmups: WARMUPS,
        samplesMs: samples,
        stats:
            stats(samples)
    };
}

/* ------------------------------------------------------ */
/* CRYPTO TESTS                                           */
/* ------------------------------------------------------ */

await check(
    "Poseidon bootstrap reference",
    async () => {
        assert.equal(
            (
                await poseidon(
                    [1n, 0n, 0n]
                )
            ).toString(),

            "16319005924338521988144249782199320915969277491928916027259324394544057385749"
        );
    }
);

await check(
    "identity commitment determinism",
    async () => {
        const a =
            await identityCommitment(
                123456789n
            );

        assert.equal(
            a,
            await identityCommitment(
                123456789n
            )
        );

        assert.notEqual(
            a,
            await identityCommitment(
                123456790n
            )
        );
    }
);

await check(
    "election nullifier separation",
    async () => {
        const a =
            await electionNullifier(
                777n,
                1n
            );

        assert.equal(
            a,
            await electionNullifier(
                777n,
                1n
            )
        );

        assert.notEqual(
            a,
            await electionNullifier(
                777n,
                2n
            )
        );
    }
);

const leaves = [];

for (
    const s
    of [
        111n,
        123456789n,
        333n,
        444n
    ]
)
    leaves.push(
        await identityCommitment(
            s
        )
    );

const tree =
    await buildMerkleTree(
        leaves,
        4
    );

const merkle =
    merkleProof(
        tree,
        1
    );

await check(
    "Merkle valid membership",
    async () => {
        assert.equal(
            await verifyMerkle(
                leaves[1],
                merkle,
                tree.root
            ),
            true
        );
    }
);

await check(
    "Merkle wrong leaf rejected",
    async () => {
        assert.equal(
            await verifyMerkle(
                leaves[0],
                merkle,
                tree.root
            ),
            false
        );
    }
);

await check(
    "Merkle wrong root rejected",
    async () => {
        assert.equal(
            await verifyMerkle(
                leaves[1],
                merkle,
                tree.root + 1n
            ),
            false
        );
    }
);

const dkg =
    runDkgPoc(
        c,
        POLYS,
        3,
        5
    );

await check(
    "DKG commitments and no combined private key",
    async () => {
        assert.equal(
            dkg.threshold,
            3
        );

        assert.equal(
            dkg.trusteeCount,
            5
        );

        assert.equal(
            Object.hasOwn(
                dkg,
                "secret"
            ),
            false
        );

        for (
            const share
            of dkg.shares
        )
            assert.equal(
                eq(
                    c,
                    mul(
                        c,
                        c.G,
                        share.share
                    ),
                    share.publicShare
                ),
                true
            );
    }
);

await check(
    "ElGamal Enc(0)/Enc(1)",
    async () => {
        for (
            const [
                bit,
                randomness
            ]
            of [
                [0, 7n],
                [1, 8n]
            ]
        ) {
            const C =
                encryptBit(
                    c,
                    dkg.publicKey,
                    bit,
                    randomness
                );

            const partials =
                dkg.shares
                    .slice(0, 3)
                    .map(
                        s => ({
                            id: s.id,

                            partial:
                                partialDecrypt(
                                    c,
                                    C.R,
                                    s.share
                                )
                        })
                    );

            const M =
                thresholdDecrypt(
                    c,
                    C,
                    partials,
                    3
                );

            assert.equal(
                boundedDecode(
                    c,
                    M,
                    1
                ),
                bit
            );
        }
    }
);

await check(
    "fresh randomness separation",
    async () => {
        const a =
            encryptBit(
                c,
                dkg.publicKey,
                1,
                7n
            );

        const b =
            encryptBit(
                c,
                dkg.publicKey,
                1,
                8n
            );

        assert.notDeepEqual(
            serializePoint(
                c,
                a.R
            ),
            serializePoint(
                c,
                b.R
            )
        );

        assert.notDeepEqual(
            serializePoint(
                c,
                a.S
            ),
            serializePoint(
                c,
                b.S
            )
        );
    }
);

const tallyCipher =
    aggregate(
        c,
        [
            encryptBit(
                c,
                dkg.publicKey,
                1,
                21n
            ),

            encryptBit(
                c,
                dkg.publicKey,
                0,
                22n
            ),

            encryptBit(
                c,
                dkg.publicKey,
                1,
                23n
            ),

            encryptBit(
                c,
                dkg.publicKey,
                1,
                24n
            )
        ]
    );

const tallyPartials =
    dkg.shares
        .slice(0, 3)
        .map(
            s => ({
                id: s.id,

                partial:
                    partialDecrypt(
                        c,
                        tallyCipher.R,
                        s.share
                    )
            })
        );

await check(
    "homomorphic tally",
    async () => {
        const M =
            thresholdDecrypt(
                c,
                tallyCipher,
                tallyPartials,
                3
            );

        assert.equal(
            boundedDecode(
                c,
                M,
                4
            ),
            3
        );
    }
);

await check(
    "insufficient threshold rejected",
    async () => {
        assert.throws(
            () =>
                combinePartials(
                    c,
                    tallyPartials
                        .slice(0, 2),
                    3
                ),
            /at least 3/
        );
    }
);

const trustee =
    dkg.shares[0];

const partial =
    partialDecrypt(
        c,
        tallyCipher.R,
        trustee.share
    );

const shareProof =
    await provePartial(
        c,
        tallyCipher.R,
        trustee.share,
        trustee.publicShare,
        partial,
        101n
    );

await check(
    "valid partial decryption proof",
    async () => {
        assert.equal(
            await verifyPartial(
                c,
                tallyCipher.R,
                trustee.publicShare,
                partial,
                shareProof
            ),
            true
        );
    }
);

await check(
    "tampered partial proof rejected",
    async () => {
        assert.equal(
            await verifyPartial(
                c,
                tallyCipher.R,
                trustee.publicShare,
                partial,
                {
                    ...shareProof,

                    response:
                        (
                            shareProof
                                .response +
                            1n
                        ) %
                        c.q
                }
            ),
            false
        );
    }
);

await writeFile(
    resolve(
        "..",
        "experiments",
        "wp2",
        "raw",
        "wp2-security-tests.json"
    ),

    JSON.stringify(
        securityResults,
        null,
        2
    ) + "\n"
);

/* ------------------------------------------------------ */
/* VECTOR                                                 */
/* ------------------------------------------------------ */

const sampleCipher =
    encryptBit(
        c,
        dkg.publicKey,
        1,
        7n
    );

const [Yx, Yy] =
    pointInts(
        c,
        dkg.publicKey
    );

const [Rx, Ry] =
    pointInts(
        c,
        sampleCipher.R
    );

const [Sx, Sy] =
    pointInts(
        c,
        sampleCipher.S
    );

const vector = {
    schema:
        "votechain-zk-wp2-known-answer-final-v1",

    syntheticOnly: true,

    profile: PROFILE,

    identity: {
        secret:
            "123456789",

        electionId:
            "2026001",

        commitment:
            (
                await identityCommitment(
                    123456789n
                )
            ).toString(),

        nullifier:
            (
                await electionNullifier(
                    123456789n,
                    2026001n
                )
            ).toString()
    },

    merkle: {
        depth:
            tree.depth,

        root:
            tree.root.toString(),

        targetIndex:
            1,

        siblings:
            merkle.siblings
                .map(String),

        pathBits:
            merkle.pathBits
    },

    threshold: {
        mode:
            dkg.mode,

        threshold:
            3,

        trustees:
            5,

        combinedPrivateKeyMaterialized:
            false,

        publicKey:
            serializePoint(
                c,
                dkg.publicKey
            ),

        shares:
            dkg.shares
                .map(
                    s => ({
                        id: s.id,

                        syntheticShare:
                            s.share
                                .toString(),

                        publicShare:
                            serializePoint(
                                c,
                                s.publicShare
                            )
                    })
                )
    },

    elgamal: {
        bit: 1,

        randomness:
            "7",

        publicKey:
            serializePoint(
                c,
                dkg.publicKey
            ),

        R:
            serializePoint(
                c,
                sampleCipher.R
            ),

        S:
            serializePoint(
                c,
                sampleCipher.S
            ),

        canonicalCiphertextBytes:
            128
    }
};

await writeFile(
    resolve(
        "vectors",
        "wp2-known-answer-final.json"
    ),

    JSON.stringify(
        vector,
        null,
        2
    ) + "\n"
);

const validInput = {
    Yx: Yx.toString(),
    Yy: Yy.toString(),

    Rx: Rx.toString(),
    Ry: Ry.toString(),

    Sx: Sx.toString(),
    Sy: Sy.toString(),

    bit: "1",
    r: "7"
};

for (
    const [
        filename,
        object
    ]
    of [
        [
            "input_elgamal_valid_final.json",
            validInput
        ],

        [
            "input_elgamal_invalid_bit_final.json",
            {
                ...validInput,
                bit: "2"
            }
        ],

        [
            "input_elgamal_tampered_final.json",
            {
                ...validInput,

                Sx:
                    (
                        BigInt(
                            validInput.Sx
                        ) +
                        1n
                    ).toString()
            }
        ],

        [
            "input_elgamal_zero_r_final.json",
            {
                ...validInput,
                r: "0"
            }
        ],

        [
            "input_elgamal_bad_r_final.json",
            {
                ...validInput,
                r: c.q.toString()
            }
        ],

        [
            "input_elgamal_identity_key_final.json",
            {
                ...validInput,
                Yx: "0",
                Yy: "1"
            }
        ]
    ]
) {
    await writeFile(
        resolve(
            "..",
            "circuits",
            "poc",
            filename
        ),

        JSON.stringify(
            object,
            null,
            2
        ) + "\n"
    );
}

/* ------------------------------------------------------ */
/* BENCHMARKS                                             */
/* ------------------------------------------------------ */

const metrics = [];

metrics.push(
    await benchmark(
        "M09",
        "elgamal_encrypt_per_slot",
        i =>
            encryptBit(
                c,
                dkg.publicKey,
                i % 2,
                BigInt(
                    2000 + i
                )
            )
    )
);

metrics.push(
    await benchmark(
        "M10",
        "elgamal_encrypt_ballot_K4",
        i => {
            const selected =
                i % 4;

            for (
                let candidate = 0;
                candidate < 4;
                candidate++
            )
                encryptBit(
                    c,
                    dkg.publicKey,

                    candidate ===
                    selected
                        ? 1
                        : 0,

                    BigInt(
                        3000 +
                        i * 10 +
                        candidate
                    )
                );
        }
    )
);

const ballot = [
    encryptBit(
        c,
        dkg.publicKey,
        0,
        4001n
    ),

    encryptBit(
        c,
        dkg.publicKey,
        1,
        4002n
    ),

    encryptBit(
        c,
        dkg.publicKey,
        0,
        4003n
    ),

    encryptBit(
        c,
        dkg.publicKey,
        0,
        4004n
    )
];

const emptyTally =
    zeroTally(
        c,
        4
    );

metrics.push(
    await benchmark(
        "M17",
        "homomorphic_tally_update_K4",
        () =>
            addEncryptedBallot(
                c,
                emptyTally,
                ballot
            )
    )
);

metrics.push(
    await benchmark(
        "M19-PoC",
        "dkg_poc_3_of_5",
        () =>
            runDkgPoc(
                c,
                POLYS,
                3,
                5
            )
    )
);

metrics.push(
    await benchmark(
        "M20",
        "partial_decryption",
        () =>
            partialDecrypt(
                c,
                tallyCipher.R,
                trustee.share
            )
    )
);

metrics.push(
    await benchmark(
        "M21",
        "share_proof_generation",
        i =>
            provePartial(
                c,
                tallyCipher.R,
                trustee.share,
                trustee.publicShare,
                partial,
                BigInt(
                    5000 + i
                )
            )
    )
);

metrics.push(
    await benchmark(
        "M22",
        "share_proof_verification",
        async () => {
            if (
                !await verifyPartial(
                    c,
                    tallyCipher.R,
                    trustee.publicShare,
                    partial,
                    shareProof
                )
            )
                throw new Error(
                    "share proof verify failed"
                );
        }
    )
);

metrics.push(
    await benchmark(
        "M23",
        "threshold_combine_3_shares",
        () =>
            combinePartials(
                c,
                tallyPartials,
                3
            )
    )
);

const tallyPoint =
    thresholdDecrypt(
        c,
        tallyCipher,
        tallyPartials,
        3
    );

metrics.push(
    await benchmark(
        "M24",
        "bounded_decode_bound4",
        () =>
            boundedDecode(
                c,
                tallyPoint,
                4
            )
    )
);

const environment = {
    timestampUtc:
        new Date().toISOString(),

    platform:
        process.platform,

    arch:
        process.arch,

    node:
        process.version,

    cpuModel:
        os.cpus()?.[0]?.model ??
        "UNKNOWN",

    logicalCpuCount:
        os.cpus()?.length ??
        null,

    totalMemoryBytes:
        os.totalmem(),

    warmups:
        WARMUPS,

    measuredIterations:
        MEASURED,

    resourceUsage:
        process.resourceUsage(),

    memoryUsage:
        process.memoryUsage()
};

await writeFile(
    resolve(
        "..",
        "experiments",
        "wp2",
        "raw",
        "wp2-core-operation-metrics.json"
    ),

    JSON.stringify(
        {
            environment,
            metrics
        },
        null,
        2
    ) + "\n"
);

const rawRows = [
    "metric_id,metric,run,ms"
];

for (
    const metric
    of metrics
)
    metric.samplesMs
        .forEach(
            (sample, i) =>
                rawRows.push(
                    [
                        metric.metricId,
                        metric.name,
                        i + 1,
                        sample
                    ].join(",")
                )
        );

await writeFile(
    resolve(
        "..",
        "experiments",
        "wp2",
        "raw",
        "wp2-core-operation-samples.csv"
    ),

    rawRows.join("\n") +
    "\n"
);

const summaryRows = [
    "metric_id,metric,n,mean_ms,median_ms,min_ms,max_ms,sample_stddev_ms,p95_ms"
];

for (
    const metric
    of metrics
) {
    const s =
        metric.stats;

    summaryRows.push(
        [
            metric.metricId,
            metric.name,
            s.n,
            s.meanMs,
            s.medianMs,
            s.minMs,
            s.maxMs,
            s.sampleStdDevMs,
            s.p95Ms
        ].join(",")
    );
}

await writeFile(
    resolve(
        "..",
        "experiments",
        "wp2",
        "raw",
        "wp2-core-operation-summary.csv"
    ),

    summaryRows.join("\n") +
    "\n"
);

console.log(
    "WP2_CORE_JS_TESTS_AND_METRICS=PASS"
);
