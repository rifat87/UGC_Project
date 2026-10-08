import fs from "node:fs";
import path from "node:path";

const pkg = await import("circomlibjs");

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

const [
    ,,
    profilePath,
    outputRoot
] = process.argv;

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
        "WP4 expects frozen WP3 profile K=16/depth=17"
    );
}

const D_ID =
    BigInt(profile.domains.identity);

const D_NULL =
    BigInt(profile.domains.nullifier);

const D_CTX =
    BigInt(profile.domains.electionContext);

const D_BIND =
    BigInt(profile.domains.ciphertextBinding);

const D_MANIFEST =
    BigInt(profile.domains.candidateManifest);

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

const secretA =
    42424242424242n;

const secretB =
    98765432123456n;

const idA =
    H([D_ID, secretA]);

const idB =
    H([D_ID, secretB]);

/*
 * Sparse binary tree with voters at leaf index 0 and 1.
 *
 * zero[level] is root of an empty subtree of 2^level leaves.
 */
const zero = [0n];

for (let level = 0; level < DEPTH; level++) {
    zero.push(
        H([
            zero[level],
            zero[level]
        ])
    );
}

const pairRoot =
    H([idA, idB]);

let sharedRoot =
    pairRoot;

for (let level = 1; level < DEPTH; level++) {
    sharedRoot =
        H([
            sharedRoot,
            zero[level]
        ]);
}

const siblingsA = [
    idB,
    ...Array.from(
        { length: DEPTH - 1 },
        (_, i) => zero[i + 1]
    )
];

const siblingsB = [
    idA,
    ...Array.from(
        { length: DEPTH - 1 },
        (_, i) => zero[i + 1]
    )
];

const pathA =
    Array(DEPTH).fill(0n);

const pathB =
    Array(DEPTH).fill(0n);

pathB[0] = 1n;

function recomputeRoot(
    leaf,
    siblings,
    pathBits
) {
    let x = leaf;

    for (let i = 0; i < DEPTH; i++) {
        x =
            pathBits[i] === 0n
                ? H([x, siblings[i]])
                : H([siblings[i], x]);
    }

    return x;
}

if (
    recomputeRoot(
        idA,
        siblingsA,
        pathA
    ) !== sharedRoot
) {
    throw new Error(
        "voter A Merkle path mismatch"
    );
}

if (
    recomputeRoot(
        idB,
        siblingsB,
        pathB
    ) !== sharedRoot
) {
    throw new Error(
        "voter B Merkle path mismatch"
    );
}

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

    for (let i = 0; i < MAX; i++) {
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

function bindCiphertexts(ciphertexts) {
    let state =
        D_BIND;

    const states = [];

    for (const c of ciphertexts) {
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
    secret,
    siblings,
    pathBits,
    selectedIndex,
    randomnessBase
) {
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

    const common = {
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
        nullifier
    };

    return {
        direct: {
            ...common,

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
        },

        digest: {
            ...common,
            bindingDigest:
                binding.digest
        },

        nullifier,
        ciphertexts:
            ballot.ciphertexts,
        binding
    };
}

const voterA =
    makeVoter(
        secretA,
        siblingsA,
        pathA,
        1,
        5001n
    );

const voterB =
    makeVoter(
        secretB,
        siblingsB,
        pathB,
        2,
        7001n
    );

if (
    voterA.nullifier ===
    voterB.nullifier
) {
    throw new Error(
        "voter nullifiers unexpectedly equal"
    );
}

const aggregate = [];

for (let i = 0; i < MAX; i++) {
    const r =
        babyjub.addPoint(
            [
                BF.e(
                    voterA.ciphertexts[i].R[0]
                ),
                BF.e(
                    voterA.ciphertexts[i].R[1]
                )
            ],
            [
                BF.e(
                    voterB.ciphertexts[i].R[0]
                ),
                BF.e(
                    voterB.ciphertexts[i].R[1]
                )
            ]
        );

    const s =
        babyjub.addPoint(
            [
                BF.e(
                    voterA.ciphertexts[i].S[0]
                ),
                BF.e(
                    voterA.ciphertexts[i].S[1]
                )
            ],
            [
                BF.e(
                    voterB.ciphertexts[i].S[0]
                ),
                BF.e(
                    voterB.ciphertexts[i].S[1]
                )
            ]
        );

    aggregate.push({
        R: pointBig(r),
        S: pointBig(s)
    });
}

writeJson(
    path.join(
        outputRoot,
        "direct-A.json"
    ),
    voterA.direct
);

writeJson(
    path.join(
        outputRoot,
        "direct-B.json"
    ),
    voterB.direct
);

writeJson(
    path.join(
        outputRoot,
        "digest-A.json"
    ),
    voterA.digest
);

writeJson(
    path.join(
        outputRoot,
        "digest-B.json"
    ),
    voterB.digest
);

writeJson(
    path.join(
        outputRoot,
        "wp4-vector-meta.json"
    ),
    {
        profile:
            profile.profile,

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

        bindingDomain:
            D_BIND,

        voterA: {
            nullifier:
                voterA.nullifier,

            Rx:
                voterA.ciphertexts.map(
                    c => c.R[0]
                ),

            Ry:
                voterA.ciphertexts.map(
                    c => c.R[1]
                ),

            Sx:
                voterA.ciphertexts.map(
                    c => c.S[0]
                ),

            Sy:
                voterA.ciphertexts.map(
                    c => c.S[1]
                ),

            bindingDigest:
                voterA.binding.digest
        },

        voterB: {
            nullifier:
                voterB.nullifier,

            Rx:
                voterB.ciphertexts.map(
                    c => c.R[0]
                ),

            Ry:
                voterB.ciphertexts.map(
                    c => c.R[1]
                ),

            Sx:
                voterB.ciphertexts.map(
                    c => c.S[0]
                ),

            Sy:
                voterB.ciphertexts.map(
                    c => c.S[1]
                ),

            bindingDigest:
                voterB.binding.digest
        },

        expectedAggregate: {
            Rx:
                aggregate.map(
                    c => c.R[0]
                ),

            Ry:
                aggregate.map(
                    c => c.R[1]
                ),

            Sx:
                aggregate.map(
                    c => c.S[0]
                ),

            Sy:
                aggregate.map(
                    c => c.S[1]
                )
        },

        poseidonFirstInput: [
            D_BIND,
            voterA.ciphertexts[0].R[0],
            voterA.ciphertexts[0].R[1],
            voterA.ciphertexts[0].S[0],
            voterA.ciphertexts[0].S[1]
        ],

        poseidonFirstOutput:
            voterA.binding.states[0],

        assertions: {
            sharedMerkleRoot:
                true,

            twoDistinctNullifiers:
                true,

            sameElection:
                true,

            syntheticOnly:
                true
        }
    }
);

console.log(
    "WP4_TWO_VOTER_VECTOR_BUILD=PASS"
);
