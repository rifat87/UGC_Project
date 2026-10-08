import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const [
    ,,
    root,
    profilePath,
    outputRoot
] = process.argv;

if (!root || !profilePath || !outputRoot) {
    throw new Error(
        "Usage: node wp8e-build-150-corpus.mjs <root> <profile.json> <outputRoot>"
    );
}

const requireFromCrypto =
    createRequire(
        path.join(
            path.resolve(root),
            "crypto",
            "package.json"
        )
    );

const circomlibEntry =
    requireFromCrypto.resolve(
        "circomlibjs"
    );

const pkg =
    await import(
        pathToFileURL(
            circomlibEntry
        ).href
    );

const buildBabyjub =
    pkg.buildBabyjub ??
    pkg.default?.buildBabyjub;

const buildPoseidon =
    pkg.buildPoseidon ??
    pkg.default?.buildPoseidon;

if (!buildBabyjub || !buildPoseidon) {
    throw new Error(
        "circomlibjs buildBabyjub/buildPoseidon unavailable"
    );
}

const profile =
    JSON.parse(
        fs.readFileSync(
            profilePath,
            "utf8"
        )
    );

const babyjub =
    await buildBabyjub();

const poseidon =
    await buildPoseidon();

const BF = babyjub.F;
const PF = poseidon.F;

const MAX =
    profile.maxCandidates;

const DEPTH =
    profile.merkleDepth;

if (MAX !== 16 || DEPTH !== 17) {
    throw new Error(
        "WP8E C2 expects frozen profile K=16/depth=17"
    );
}

const N = 150;

const SCALES =
    [25, 50, 75, 100, 150];

const D_ID =
    BigInt(
        profile.domains.identity
    );

const D_NULL =
    BigInt(
        profile.domains.nullifier
    );

const D_CTX =
    BigInt(
        profile.domains.electionContext
    );

const D_BIND =
    BigInt(
        profile.domains.ciphertextBinding
    );

const D_MANIFEST =
    BigInt(
        profile.domains.candidateManifest
    );

function H(values) {
    return PF.toObject(
        poseidon(
            values.map(BigInt)
        )
    );
}

function pointBig(P) {
    return [
        BF.toObject(P[0]),
        BF.toObject(P[1])
    ];
}

function writeJson(file, value) {
    fs.mkdirSync(
        path.dirname(file),
        { recursive: true }
    );

    fs.writeFileSync(
        file,
        JSON.stringify(
            value,
            (_, x) =>
                typeof x === "bigint"
                    ? x.toString()
                    : x,
            2
        ) + "\n"
    );
}

function pad3(n) {
    return String(n).padStart(3, "0");
}

/*
 * Deterministic synthetic identities.
 *
 * These are benchmark-only witness secrets, never production voter
 * credentials. The same deterministic corpus is intentionally reused
 * on fresh isolated chains so scale repetitions differ only in runtime
 * behavior, not ballot contents.
 */
const SECRET_BASE =
    42424242424242n;

const SECRET_STEP =
    1000003n;

const secrets =
    Array.from(
        { length: N },
        (_, i) =>
            SECRET_BASE +
            BigInt(i) *
            SECRET_STEP
    );

const identities =
    secrets.map(
        secret =>
            H([
                D_ID,
                secret
            ])
    );

/*
 * zero[level] is the root of an empty subtree containing 2^level
 * leaves, exactly matching the canonical WP4 sparse-tree convention.
 */
const zero = [0n];

for (
    let level = 0;
    level < DEPTH;
    level++
) {
    zero.push(
        H([
            zero[level],
            zero[level]
        ])
    );
}

/*
 * Sparse tree containing voters at leaf indexes 0..149.
 * Missing nodes at each level are represented by zero[level].
 */
const layers = [
    identities.slice()
];

for (
    let level = 0;
    level < DEPTH;
    level++
) {
    const current =
        layers[level];

    const nextLength =
        Math.ceil(
            current.length / 2
        );

    const next =
        new Array(nextLength);

    for (
        let pair = 0;
        pair < nextLength;
        pair++
    ) {
        const left =
            current[2 * pair] ??
            zero[level];

        const right =
            current[2 * pair + 1] ??
            zero[level];

        next[pair] =
            H([
                left,
                right
            ]);
    }

    layers.push(next);
}

const sharedRoot =
    layers[DEPTH][0] ??
    zero[DEPTH];

function merklePath(index) {
    let idx = index;

    const siblings = [];
    const pathBits = [];

    for (
        let level = 0;
        level < DEPTH;
        level++
    ) {
        const siblingIndex =
            idx ^ 1;

        siblings.push(
            layers[level][siblingIndex] ??
            zero[level]
        );

        pathBits.push(
            BigInt(
                idx & 1
            )
        );

        idx =
            Math.floor(
                idx / 2
            );
    }

    return {
        siblings,
        pathBits
    };
}

function recomputeRoot(
    leaf,
    siblings,
    pathBits
) {
    let x = leaf;

    for (
        let level = 0;
        level < DEPTH;
        level++
    ) {
        x =
            pathBits[level] === 0n
                ? H([
                    x,
                    siblings[level]
                ])
                : H([
                    siblings[level],
                    x
                ]);
    }

    return x;
}

for (
    let i = 0;
    i < N;
    i++
) {
    const p =
        merklePath(i);

    const check =
        recomputeRoot(
            identities[i],
            p.siblings,
            p.pathBits
        );

    if (check !== sharedRoot) {
        throw new Error(
            `Merkle path mismatch at voter ${i + 1}`
        );
    }
}

/*
 * Keep the canonical WP4 election configuration unchanged except
 * eligibleRoot, which necessarily becomes the 150-member root.
 */
const electionId =
    202609300001n;

const candidateCount =
    4n;

const candidateIds =
    [101n, 102n, 103n, 104n];

const candidateManifestHash =
    H([
        D_MANIFEST,
        ...candidateIds
    ]);

const contractDomain =
    BigInt(
        profile.testContractDomain
    );

const electionSecretKey =
    123456789n;

const Y =
    babyjub.mulPointEscalar(
        babyjub.Base8,
        electionSecretKey
    );

const Yxy =
    pointBig(Y);

const electionContextHash =
    H([
        D_CTX,
        electionId,
        candidateManifestHash,
        candidateCount,
        contractDomain,
        Yxy[0],
        Yxy[1]
    ]);

const identityPoint = [
    BF.e(0),
    BF.e(1)
];

function makeCiphertexts(
    selectedIndex,
    randomnessBase
) {
    const bits =
        Array(MAX).fill(0n);

    bits[selectedIndex] = 1n;

    const randomness =
        Array.from(
            { length: MAX },
            (_, i) =>
                randomnessBase +
                BigInt(i)
        );

    const ciphertexts = [];

    for (
        let i = 0;
        i < MAX;
        i++
    ) {
        const r =
            randomness[i];

        const R =
            babyjub.mulPointEscalar(
                babyjub.Base8,
                r
            );

        const rY =
            babyjub.mulPointEscalar(
                Y,
                r
            );

        const M =
            bits[i] === 1n
                ? babyjub.Base8
                : identityPoint;

        const S =
            babyjub.addPoint(
                rY,
                M
            );

        ciphertexts.push({
            R: pointBig(R),
            S: pointBig(S)
        });
    }

    return {
        bits,
        randomness,
        ciphertexts
    };
}

function bindCiphertexts(
    ciphertexts
) {
    let state =
        D_BIND;

    const states = [];

    for (
        const c
        of ciphertexts
    ) {
        state =
            H([
                state,
                c.R[0],
                c.R[1],
                c.S[0],
                c.S[1]
            ]);

        states.push(state);
    }

    return {
        digest: state,
        states
    };
}

function makeVoter(
    voterIndex
) {
    const secret =
        secrets[voterIndex];

    const {
        siblings,
        pathBits
    } =
        merklePath(
            voterIndex
        );

    /*
     * Balanced deterministic round-robin:
     * 0,1,2,3,0,1,2,3,...
     */
    const selectedIndex =
        voterIndex %
        Number(candidateCount);

    /*
     * Give every voter a disjoint block of 16 deterministic
     * ElGamal randomness scalars.
     */
    const randomnessBase =
        5001n +
        BigInt(voterIndex) *
        1000n;

    const nullifier =
        H([
            D_NULL,
            secret,
            electionId
        ]);

    const ballot =
        makeCiphertexts(
            selectedIndex,
            randomnessBase
        );

    const binding =
        bindCiphertexts(
            ballot.ciphertexts
        );

    const direct = {
        secret,
        siblings,
        pathBits,

        bit:
            ballot.bits,

        randomness:
            ballot.randomness,

        eligibleRoot:
            sharedRoot,

        electionId,
        candidateManifestHash,
        candidateCount,
        contractDomain,

        Yx:
            Yxy[0],

        Yy:
            Yxy[1],

        electionContextHash,
        nullifier,

        Rx:
            ballot.ciphertexts.map(
                c => c.R[0]
            ),

        Ry:
            ballot.ciphertexts.map(
                c => c.R[1]
            ),

        Sx:
            ballot.ciphertexts.map(
                c => c.S[0]
            ),

        Sy:
            ballot.ciphertexts.map(
                c => c.S[1]
            )
    };

    return {
        voterNumber:
            voterIndex + 1,

        selectedIndex,
        nullifier,
        direct,

        ciphertexts:
            ballot.ciphertexts,

        binding
    };
}

const voters =
    Array.from(
        { length: N },
        (_, i) =>
            makeVoter(i)
    );

const nullifierSet =
    new Set(
        voters.map(
            v =>
                v.nullifier.toString()
        )
    );

if (
    nullifierSet.size !== N
) {
    throw new Error(
        "150-voter nullifier uniqueness failed"
    );
}

/*
 * Homomorphic reference tally checkpoints.
 */
const aggregateR =
    Array.from(
        { length: MAX },
        () => [
            BF.e(0),
            BF.e(1)
        ]
    );

const aggregateS =
    Array.from(
        { length: MAX },
        () => [
            BF.e(0),
            BF.e(1)
        ]
    );

const checkpointSet =
    new Set(SCALES);

const checkpoints = {};

const candidateCounts =
    [0, 0, 0, 0];

for (
    let voterIndex = 0;
    voterIndex < N;
    voterIndex++
) {
    const voter =
        voters[voterIndex];

    candidateCounts[
        voter.selectedIndex
    ]++;

    for (
        let slot = 0;
        slot < MAX;
        slot++
    ) {
        aggregateR[slot] =
            babyjub.addPoint(
                aggregateR[slot],
                [
                    BF.e(
                        voter.ciphertexts[slot].R[0]
                    ),
                    BF.e(
                        voter.ciphertexts[slot].R[1]
                    )
                ]
            );

        aggregateS[slot] =
            babyjub.addPoint(
                aggregateS[slot],
                [
                    BF.e(
                        voter.ciphertexts[slot].S[0]
                    ),
                    BF.e(
                        voter.ciphertexts[slot].S[1]
                    )
                ]
            );
    }

    const acceptedCount =
        voterIndex + 1;

    if (
        checkpointSet.has(
            acceptedCount
        )
    ) {
        checkpoints[
            String(acceptedCount)
        ] = {
            acceptedBallotCount:
                acceptedCount,

            candidatePlaintextCounts:
                candidateCounts.slice(),

            Rx:
                aggregateR.map(
                    pointBig
                ).map(
                    p => p[0]
                ),

            Ry:
                aggregateR.map(
                    pointBig
                ).map(
                    p => p[1]
                ),

            Sx:
                aggregateS.map(
                    pointBig
                ).map(
                    p => p[0]
                ),

            Sy:
                aggregateS.map(
                    pointBig
                ).map(
                    p => p[1]
                )
        };
    }
}

fs.mkdirSync(
    path.join(
        outputRoot,
        "inputs"
    ),
    { recursive: true }
);

for (
    const voter
    of voters
) {
    const file =
        path.join(
            outputRoot,
            "inputs",
            `direct-${pad3(voter.voterNumber)}.json`
        );

    writeJson(
        file,
        voter.direct
    );
}

for (
    const scale
    of SCALES
) {
    const files =
        Array.from(
            { length: scale },
            (_, i) =>
                `inputs/direct-${pad3(i + 1)}.json`
        );

    fs.writeFileSync(
        path.join(
            outputRoot,
            `scale-${pad3(scale)}.txt`
        ),
        files.join("\n") + "\n"
    );
}

writeJson(
    path.join(
        outputRoot,
        "corpus-config.json"
    ),
    {
        profile:
            profile.profile,

        maxCandidates:
            MAX,

        merkleDepth:
            DEPTH,

        eligibleCapacity:
            2 ** DEPTH,

        corpusSize:
            N,

        scales:
            SCALES,

        config: {
            eligibleRoot:
                sharedRoot,

            electionId,
            candidateManifestHash,
            candidateCount,
            contractDomain,

            Yx:
                Yxy[0],

            Yy:
                Yxy[1],

            electionContextHash
        },

        generationPolicy: {
            syntheticOnly:
                true,

            deterministic:
                true,

            secretBase:
                SECRET_BASE,

            secretStep:
                SECRET_STEP,

            candidateSchedule:
                "BALANCED_ROUND_ROBIN_0_1_2_3",

            randomnessPolicy:
                "BASE_5001_PLUS_VOTER_INDEX_TIMES_1000_THEN_16_CONSECUTIVE_SCALARS"
        }
    }
);

writeJson(
    path.join(
        outputRoot,
        "corpus-voters-public.json"
    ),
    voters.map(
        voter => ({
            voterNumber:
                voter.voterNumber,

            candidateIndex:
                voter.selectedIndex,

            nullifier:
                voter.nullifier,

            bindingDigest:
                voter.binding.digest,

            inputFile:
                `inputs/direct-${pad3(voter.voterNumber)}.json`
        })
    )
);

writeJson(
    path.join(
        outputRoot,
        "expected-tally-checkpoints.json"
    ),
    checkpoints
);

writeJson(
    path.join(
        outputRoot,
        "build-assertions.json"
    ),
    {
        corpusSize:
            N,

        allMerklePathsRecomputed:
            true,

        sharedMerkleRoot:
            true,

        distinctNullifiers:
            nullifierSet.size === N,

        oneCommonElection:
            true,

        deterministicBalancedCandidateSchedule:
            true,

        syntheticOnly:
            true,

        proofGenerated:
            false,

        transactionSubmitted:
            false
    }
);

console.log(
    `CORPUS_SIZE=${N}`
);

console.log(
    `SHARED_ELIGIBLE_ROOT=${sharedRoot}`
);

console.log(
    `DISTINCT_NULLIFIERS=${nullifierSet.size}`
);

console.log(
    `SCALE_MATRIX=${SCALES.join(",")}`
);

console.log(
    "WP8E_C2_150_INPUT_CORPUS_BUILD=PASS"
);
