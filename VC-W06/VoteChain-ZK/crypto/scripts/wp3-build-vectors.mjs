import fs from "node:fs";
import path from "node:path";

const pkg =
    await import("circomlibjs");

const buildBabyjub =
    pkg.buildBabyjub ??
    pkg.default?.buildBabyjub;

const buildPoseidon =
    pkg.buildPoseidon ??
    pkg.default?.buildPoseidon;

if (
    !buildBabyjub ||
    !buildPoseidon
) {
    throw new Error(
        "circomlibjs buildBabyjub/buildPoseidon unavailable"
    );
}

const [
    ,
    ,
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

const PF =
    poseidon.F;

const BF =
    babyjub.F;

const MAX =
    profile.maxCandidates;

const DEPTH =
    profile.merkleDepth;

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

const SUBORDER =
    BigInt(
        profile.babyjub.subOrder
    );

function h(values) {
    return PF.toObject(
        poseidon(
            values.map(
                v => BigInt(v)
            )
        )
    );
}

function pointBig(P) {
    return [
        BF.toObject(P[0]),
        BF.toObject(P[1])
    ];
}

function pointString(P) {
    const p =
        pointBig(P);

    return [
        p[0].toString(),
        p[1].toString()
    ];
}

function jsonWrite(
    file,
    object
) {
    fs.mkdirSync(
        path.dirname(file),
        {
            recursive: true
        }
    );

    fs.writeFileSync(
        file,
        JSON.stringify(
            object,
            (
                key,
                value
            ) =>
                typeof value ===
                "bigint"
                    ? value.toString()
                    : value,
            2
        ) + "\n"
    );
}

function clone(x) {
    return structuredClone(x);
}

function plusOne(x) {
    return (
        BigInt(x) + 1n
    ).toString();
}

const secret =
    42424242424242n;

const electionId =
    202609300001n;

const candidateCount =
    4n;

const contractDomain =
    BigInt(
        profile.testContractDomain
    );

const candidateIds = [
    101n,
    102n,
    103n,
    104n
];

const manifestHash =
    h(
        [
            D_MANIFEST,
            ...candidateIds
        ]
    );

const bits =
    Array.from(
        {
            length: MAX
        },
        (
            _,
            i
        ) =>
            i === 1
                ? 1n
                : 0n
    );

const randomness =
    Array.from(
        {
            length: MAX
        },
        (
            _,
            i
        ) =>
            1001n +
            BigInt(i)
    );

const identityCommitment =
    h(
        [
            D_ID,
            secret
        ]
    );

const siblings =
    Array.from(
        {
            length: DEPTH
        },
        (
            _,
            i
        ) =>
            3001n +
            BigInt(i)
    );

const pathBits =
    Array.from(
        {
            length: DEPTH
        },
        (
            _,
            i
        ) =>
            BigInt(i % 2)
    );

let current =
    identityCommitment;

for (
    let i = 0;
    i < DEPTH;
    i++
) {
    const bit =
        pathBits[i];

    const left =
        bit === 0n
            ? current
            : siblings[i];

    const right =
        bit === 0n
            ? siblings[i]
            : current;

    current =
        h(
            [
                left,
                right
            ]
        );
}

const eligibleRoot =
    current;

const nullifier =
    h(
        [
            D_NULL,
            secret,
            electionId
        ]
    );

const crossElectionNullifier =
    h(
        [
            D_NULL,
            secret,
            electionId + 1n
        ]
    );

if (
    nullifier ===
    crossElectionNullifier
) {
    throw new Error(
        "Cross-election nullifier separation failed"
    );
}

const electionSecretKey =
    123456789n;

const Y =
    babyjub.mulPointEscalar(
        babyjub.Base8,
        electionSecretKey
    );

const identityPoint = [
    BF.e(0),
    BF.e(1)
];

function makeCiphertexts(
    YPoint,
    ballotBits = bits,
    rValues = randomness
) {
    const out = [];

    for (
        let j = 0;
        j < MAX;
        j++
    ) {
        const r =
            BigInt(
                rValues[j]
            );

        const bit =
            BigInt(
                ballotBits[j]
            );

        const R =
            babyjub.mulPointEscalar(
                babyjub.Base8,
                r
            );

        const rY =
            babyjub.mulPointEscalar(
                YPoint,
                r
            );

        const message =
            bit === 1n
                ? babyjub.Base8
                : identityPoint;

        const S =
            babyjub.addPoint(
                rY,
                message
            );

        out.push({
            R:
                pointBig(R),

            S:
                pointBig(S)
        });
    }

    return out;
}

function bindingDigest(
    ciphertexts
) {
    let state =
        D_BIND;

    for (
        const c
        of ciphertexts
    ) {
        state =
            h(
                [
                    state,
                    c.R[0],
                    c.R[1],
                    c.S[0],
                    c.S[1]
                ]
            );
    }

    return state;
}

function buildCase(
    YPoint
) {
    const y =
        pointBig(
            YPoint
        );

    const context =
        h(
            [
                D_CTX,
                electionId,
                manifestHash,
                candidateCount,
                contractDomain,
                y[0],
                y[1]
            ]
        );

    const ciphertexts =
        makeCiphertexts(
            YPoint
        );

    const digest =
        bindingDigest(
            ciphertexts
        );

    const common = {
        secret,
        siblings,
        pathBits,
        bit:
            bits,
        randomness,

        eligibleRoot,

        electionId,
        candidateManifestHash:
            manifestHash,
        candidateCount,
        contractDomain,

        Yx:
            y[0],
        Yy:
            y[1],

        electionContextHash:
            context,

        nullifier
    };

    const direct = {
        ...common,

        Rx:
            ciphertexts.map(
                c => c.R[0]
            ),

        Ry:
            ciphertexts.map(
                c => c.R[1]
            ),

        Sx:
            ciphertexts.map(
                c => c.S[0]
            ),

        Sy:
            ciphertexts.map(
                c => c.S[1]
            )
    };

    const digestInput = {
        ...common,

        bindingDigest:
            digest
    };

    return {
        direct,
        digest:
            digestInput,
        ciphertexts,
        bindingDigestValue:
            digest
    };
}

const base =
    buildCase(
        Y
    );

if (
    typeof base.direct !== "object" ||
    base.direct === null ||
    Array.isArray(base.direct) ||
    typeof base.digest !== "object" ||
    base.digest === null ||
    Array.isArray(base.digest) ||
    base.direct.secret === undefined ||
    base.digest.secret === undefined ||
    base.digest.bindingDigest === undefined
) {
    throw new Error(
        "WP3 vector shape preflight failed"
    );
}

console.log(
    "WP3_VECTOR_SHAPE_PREFLIGHT=PASS"
);

const wrongKey =
    babyjub.mulPointEscalar(
        babyjub.Base8,
        987654321n
    );

const wrongKeyXY =
    pointString(
        wrongKey
    );

/*
 * Prefer circomlibjs' full-order Generator as a
 * self-consistent non-prime-subgroup public key.
 *
 * Fall back to the BabyJub order-2 point (0,-1).
 */
let badSubgroupY =
    babyjub.Generator;

let badSubgroupMode =
    "CIRCOMLIB_GENERATOR";

if (!badSubgroupY) {
    badSubgroupY = [
        BF.e(0),
        BF.e(
            BigInt(
                profile.fieldModulus
            ) - 1n
        )
    ];

    badSubgroupMode =
        "ORDER_2_POINT_0_MINUS1";
}

if (
    typeof babyjub.inSubgroup ===
    "function" &&
    babyjub.inSubgroup(
        badSubgroupY
    )
) {
    badSubgroupY = [
        BF.e(0),
        BF.e(
            BigInt(
                profile.fieldModulus
            ) - 1n
        )
    ];

    badSubgroupMode =
        "ORDER_2_POINT_0_MINUS1";
}

const badSubgroup =
    buildCase(
        badSubgroupY
    );

const directDir =
    path.join(
        outputRoot,
        "direct"
    );

const digestDir =
    path.join(
        outputRoot,
        "digest"
    );

fs.mkdirSync(
    directDir,
    {
        recursive: true
    }
);

fs.mkdirSync(
    digestDir,
    {
        recursive: true
    }
);

jsonWrite(
    path.join(
        directDir,
        "valid.json"
    ),
    base.direct
);

jsonWrite(
    path.join(
        digestDir,
        "valid.json"
    ),
    base.digest
);

function writeCommonNegatives(
    dir,
    valid
) {
    let x;

    x =
        clone(valid);

    x.secret =
        plusOne(
            x.secret
        );

    jsonWrite(
        path.join(
            dir,
            "wrong-secret.json"
        ),
        x
    );

    x =
        clone(valid);

    x.siblings[0] =
        plusOne(
            x.siblings[0]
        );

    jsonWrite(
        path.join(
            dir,
            "wrong-path.json"
        ),
        x
    );

    x =
        clone(valid);

    x.pathBits[0] =
        "2";

    jsonWrite(
        path.join(
            dir,
            "bad-path-bit.json"
        ),
        x
    );

    x =
        clone(valid);

    x.eligibleRoot =
        plusOne(
            x.eligibleRoot
        );

    jsonWrite(
        path.join(
            dir,
            "wrong-root.json"
        ),
        x
    );

    x =
        clone(valid);

    x.electionId =
        plusOne(
            x.electionId
        );

    jsonWrite(
        path.join(
            dir,
            "wrong-election.json"
        ),
        x
    );

    x =
        clone(valid);

    x.nullifier =
        plusOne(
            x.nullifier
        );

    jsonWrite(
        path.join(
            dir,
            "wrong-nullifier.json"
        ),
        x
    );

    x =
        clone(valid);

    x.electionContextHash =
        plusOne(
            x.electionContextHash
        );

    jsonWrite(
        path.join(
            dir,
            "wrong-context.json"
        ),
        x
    );

    x =
        clone(valid);

    x.candidateManifestHash =
        plusOne(
            x.candidateManifestHash
        );

    jsonWrite(
        path.join(
            dir,
            "wrong-manifest.json"
        ),
        x
    );

    x =
        clone(valid);

    x.contractDomain =
        plusOne(
            x.contractDomain
        );

    jsonWrite(
        path.join(
            dir,
            "wrong-contract-domain.json"
        ),
        x
    );

    x =
        clone(valid);

    x.bit[0] =
        "1";

    x.bit[1] =
        "1";

    jsonWrite(
        path.join(
            dir,
            "duplicate-selection.json"
        ),
        x
    );

    x =
        clone(valid);

    x.bit =
        x.bit.map(
            () => "0"
        );

    jsonWrite(
        path.join(
            dir,
            "zero-selection.json"
        ),
        x
    );

    x =
        clone(valid);

    x.bit =
        x.bit.map(
            () => "0"
        );

    x.bit[5] =
        "1";

    jsonWrite(
        path.join(
            dir,
            "padded-selection.json"
        ),
        x
    );

    x =
        clone(valid);

    x.randomness[0] =
        "0";

    jsonWrite(
        path.join(
            dir,
            "zero-randomness.json"
        ),
        x
    );

    x =
        clone(valid);

    x.randomness[0] =
        SUBORDER.toString();

    jsonWrite(
        path.join(
            dir,
            "out-of-range-randomness.json"
        ),
        x
    );

    x =
        clone(valid);

    x.candidateCount =
        "0";

    jsonWrite(
        path.join(
            dir,
            "candidate-count-zero.json"
        ),
        x
    );

    x =
        clone(valid);

    x.candidateCount =
        "17";

    jsonWrite(
        path.join(
            dir,
            "candidate-count-17.json"
        ),
        x
    );

    x =
        clone(valid);

    x.Yx =
        wrongKeyXY[0];

    x.Yy =
        wrongKeyXY[1];

    jsonWrite(
        path.join(
            dir,
            "wrong-public-key.json"
        ),
        x
    );
}

writeCommonNegatives(
    directDir,
    base.direct
);

writeCommonNegatives(
    digestDir,
    base.digest
);

/*
 * Self-consistent bad subgroup input:
 * only subgroup/key safety should make it unacceptable.
 */
jsonWrite(
    path.join(
        directDir,
        "bad-subgroup-y.json"
    ),
    badSubgroup.direct
);

jsonWrite(
    path.join(
        digestDir,
        "bad-subgroup-y.json"
    ),
    badSubgroup.digest
);

/*
 * Direct-specific ciphertext mismatch.
 */
{
    const x =
        clone(
            base.direct
        );

    x.Rx[0] =
        plusOne(
            x.Rx[0]
        );

    jsonWrite(
        path.join(
            directDir,
            "tampered-ciphertext.json"
        ),
        x
    );
}

/*
 * Digest-specific incorrect binding.
 */
{
    const x =
        clone(
            base.digest
        );

    x.bindingDigest =
        plusOne(
            x.bindingDigest
        );

    jsonWrite(
        path.join(
            digestDir,
            "wrong-binding.json"
        ),
        x
    );
}

/*
 * Compute the digest that a future contract would obtain
 * if submitted ciphertext coordinate Rx[0] were modified.
 */
const tamperedCiphertexts =
    base.ciphertexts.map(
        c => ({
            R:
                [
                    c.R[0],
                    c.R[1]
                ],

            S:
                [
                    c.S[0],
                    c.S[1]
                ]
        })
    );

tamperedCiphertexts[0].R[0] =
    tamperedCiphertexts[0].R[0] +
    1n;

const tamperedBindingDigest =
    bindingDigest(
        tamperedCiphertexts
    );

jsonWrite(
    path.join(
        outputRoot,
        "wp3-known-answer-vector.json"
    ),
    {
        profile:
            profile.profile,

        secret,

        identityCommitment,
        eligibleRoot,

        electionId,
        nullifier,
        crossElectionNullifier,

        candidateCount,
        candidateIds,
        candidateManifestHash:
            manifestHash,

        contractDomain,

        publicKey:
            pointBig(Y),

        bindingDigest:
            base.digest.bindingDigest,

        tamperedBindingDigest,

        ciphertexts:
            base.ciphertexts,

        badSubgroupMode,

        badSubgroupY:
            pointBig(
                badSubgroupY
            ),

        assertions: {
            crossElectionNullifierSeparation:
                true,

            maxCandidates:
                MAX,

            merkleDepth:
                DEPTH,

            syntheticOnly:
                true
        }
    }
);

console.log(
    "WP3_VECTOR_BUILD=PASS"
);
