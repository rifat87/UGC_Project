import fs from "fs";
import {
    buildPoseidon
} from "circomlibjs";


const [
    domainCandidatesPath,
    wp4GeneratorPath,
    c2InputPath,
    outProfilesPath,
] = process.argv.slice(2);


const domainRecords =
    JSON.parse(
        fs.readFileSync(
            domainCandidatesPath,
            "utf8"
        )
    );


const wp4Source =
    fs.readFileSync(
        wp4GeneratorPath,
        "utf8"
    );


const c2 =
    JSON.parse(
        fs.readFileSync(
            c2InputPath,
            "utf8"
        )
    );


const poseidon =
    await buildPoseidon();

const F =
    poseidon.F;


const P =
    BigInt(
        "21888242871839275222246405745257275088548364400416034343698204186575808495617"
    );


function H(values) {

    return BigInt(
        F.toObject(
            poseidon(
                values.map(
                    x => BigInt(x)
                )
            )
        )
    );
}


function collectCandidates(kind) {

    const set =
        new Set();

    for (const rec of domainRecords) {

        if (
            rec.kind !== kind
        ) {
            continue;
        }

        for (
            const raw
            of (
                rec.numbers
                ?? []
            )
        ) {

            try {

                const x =
                    BigInt(raw);

                if (
                    x >= 0n
                    && x < P
                ) {
                    set.add(
                        x.toString()
                    );
                }

            } catch {
                // ignore
            }
        }
    }

    return [
        ...set
    ].map(
        x => BigInt(x)
    );
}


const canonicalIds =
    [
        101n,
        102n,
        103n,
        104n,
    ];


const normalizedSource =
    wp4Source
        .replace(
            /\s+/g,
            ""
        )
        .replace(
            /n/g,
            ""
        );


const canonicalNeedle =
    "[101,102,103,104]";


if (
    !normalizedSource.includes(
        canonicalNeedle
    )
) {

    throw new Error(
        "CANONICAL_101_104_IDS_NOT_CONFIRMED_IN_WP4_SOURCE"
    );
}


console.log(
    "CANONICAL_CANDIDATE_IDS_101_104=PASS"
);


const oldManifest =
    BigInt(
        c2.candidateManifestHash
    );


const oldContext =
    BigInt(
        c2.electionContextHash
    );


const manifestCandidates =
    collectCandidates(
        "manifest"
    );


const contextCandidates =
    collectCandidates(
        "electionContext"
    );


console.log(
    "MANIFEST_DOMAIN_NUMERIC_CANDIDATES="
    + manifestCandidates.length
);


console.log(
    "ELECTION_CONTEXT_DOMAIN_NUMERIC_CANDIDATES="
    + contextCandidates.length
);


const manifestMatches =
    manifestCandidates
        .filter(
            d =>
                H([
                    d,
                    ...canonicalIds,
                ])
                ===
                oldManifest
        );


console.log(
    "MANIFEST_DOMAIN_MATCHES="
    + manifestMatches.length
);


if (
    manifestMatches.length
    !==
    1
) {

    throw new Error(
        "MANIFEST_DOMAIN_NOT_UNIQUELY_RESOLVED"
    );
}


const D_MANIFEST =
    manifestMatches[0];


console.log(
    "RESOLVED_D_MANIFEST="
    + D_MANIFEST
);


const electionId =
    BigInt(
        c2.electionId
    );


const contractDomain =
    BigInt(
        c2.contractDomain
    );


const Yx =
    BigInt(
        c2.Yx
    );


const Yy =
    BigInt(
        c2.Yy
    );


const contextMatches =
    contextCandidates
        .filter(
            d =>
                H([
                    d,
                    electionId,
                    oldManifest,
                    4n,
                    contractDomain,
                    Yx,
                    Yy,
                ])
                ===
                oldContext
        );


console.log(
    "ELECTION_CONTEXT_DOMAIN_MATCHES="
    + contextMatches.length
);


if (
    contextMatches.length
    !==
    1
) {

    throw new Error(
        "ELECTION_CONTEXT_DOMAIN_NOT_UNIQUELY_RESOLVED"
    );
}


const D_ELECTION_CONTEXT =
    contextMatches[0];


console.log(
    "RESOLVED_D_ELECTION_CONTEXT="
    + D_ELECTION_CONTEXT
);


console.log(
    "C2_MANIFEST_REPRODUCTION=PASS"
);


console.log(
    "C2_ELECTION_CONTEXT_REPRODUCTION=PASS"
);


/*
 * Supplement construction.
 *
 * Candidate IDs 101..116 are synthetic benchmark IDs.
 *
 * For runtime candidateCount K:
 *
 *   paddedIds =
 *     [101 .. 100+K, 0 ... 0]
 *     to exactly 16 slots.
 *
 *   vectorHash =
 *     Poseidon16(paddedIds)
 *
 *   candidateManifestHash =
 *     Poseidon3([
 *       D_MANIFEST,
 *       K,
 *       vectorHash
 *     ])
 *
 *   electionContextHash =
 *     existing Poseidon7 construction.
 */


const allIds =
    Array.from(
        {
            length:
                16,
        },
        (_, i) =>
            BigInt(
                101 + i
            )
    );


const levels =
    [
        2,
        4,
        8,
        16,
    ];


/*
 * Explicit arity feasibility gates.
 */

for (
    const n
    of [
        3,
        7,
        16,
    ]
) {

    const test =
        Array.from(
            {
                length:
                    n,
            },
            (_, i) =>
                BigInt(
                    i + 1
                )
        );

    try {

        H(
            test
        );

        console.log(
            `POSEIDON_ARITY_${n}=SUPPORTED`
        );

    } catch (err) {

        console.log(
            `POSEIDON_ARITY_${n}=UNSUPPORTED`
        );

        throw err;
    }
}


const profiles =
    [];


for (
    const k
    of levels
) {

    const padded =
        allIds.map(
            (
                id,
                index
            ) =>
                (
                    index < k
                    ? id
                    : 0n
                )
        );


    const vectorHash =
        H(
            padded
        );


    const manifest =
        H([
            D_MANIFEST,
            BigInt(k),
            vectorHash,
        ]);


    const context =
        H([
            D_ELECTION_CONTEXT,
            electionId,
            manifest,
            BigInt(k),
            contractDomain,
            Yx,
            Yy,
        ]);


    profiles.push({
        candidateCount:
            k,

        activeCandidateIds:
            allIds
                .slice(
                    0,
                    k
                )
                .map(
                    x =>
                        x.toString()
                ),

        paddedCandidateIds:
            padded.map(
                x =>
                    x.toString()
            ),

        candidateVectorHash:
            vectorHash.toString(),

        candidateManifestHash:
            manifest.toString(),

        electionContextHash:
            context.toString(),
    });
}


const manifestSet =
    new Set(
        profiles.map(
            x =>
                x.candidateManifestHash
        )
    );


const contextSet =
    new Set(
        profiles.map(
            x =>
                x.electionContextHash
        )
    );


if (
    manifestSet.size !== 4
) {

    throw new Error(
        "MANIFEST_HASHES_NOT_DISTINCT"
    );
}


if (
    contextSet.size !== 4
) {

    throw new Error(
        "ELECTION_CONTEXT_HASHES_NOT_DISTINCT"
    );
}


const output = {
    status:
        "PASS",

    classification:
        "PRE_EXECUTION_C8C_PROTOCOL_SUPPLEMENT",

    activeSystemChanged:
        false,

    syntheticBenchmarkOnly:
        true,

    runtimeCandidateCounts:
        levels,

    activeMaxCandidates:
        16,

    activePublicSignals:
        73,

    candidateIdsFull:
        allIds.map(
            x =>
                x.toString()
        ),

    candidateIdPolicy:
        "active prefix of synthetic IDs 101..116; inactive positions padded with field zero",

    manifestConstruction: {
        candidateVectorHash:
            "Poseidon16(paddedCandidateIds[16])",

        candidateManifestHash:
            "Poseidon3([D_MANIFEST,candidateCount,candidateVectorHash])",

        resolvedDManifest:
            D_MANIFEST.toString(),
    },

    electionContextConstruction: {
        expression:
            "Poseidon7([D_ELECTION_CONTEXT,electionId,candidateManifestHash,candidateCount,contractDomain,Yx,Yy])",

        resolvedDElectionContext:
            D_ELECTION_CONTEXT.toString(),
    },

    controlledPublicValues: {
        eligibleRoot:
            String(
                c2.eligibleRoot
            ),

        electionId:
            String(
                c2.electionId
            ),

        contractDomain:
            String(
                c2.contractDomain
            ),

        Yx:
            String(
                c2.Yx
            ),

        Yy:
            String(
                c2.Yy
            ),
    },

    ballotControl: {
        selectedCandidateIndex:
            0,

        bitVector:
            Array.from(
                {
                    length:
                        16,
                },
                (_, i) =>
                    (
                        i === 0
                        ? "1"
                        : "0"
                    )
            ),

        reuseC2VoterMembershipBasis:
            true,

        reuseC2Secret:
            true,

        reuseC2RandomnessVector:
            true,

        reuseC2ElectionId:
            true,

        expectedNullifierUnchangedAcrossLevels:
            true,

        expectedCiphertextUnchangedAcrossLevels:
            true,
    },

    profiles,
};


fs.writeFileSync(
    outProfilesPath,
    JSON.stringify(
        output,
        null,
        2
    )
    + "\n"
);


console.log(
    "SUPPLEMENT_PROFILE_COUNT="
    + profiles.length
);


for (
    const p
    of profiles
) {

    console.log(
        `K${p.candidateCount}_ACTIVE_IDS=`
        + p.activeCandidateIds.join(
            ","
        )
    );

    console.log(
        `K${p.candidateCount}_CANDIDATE_VECTOR_HASH=`
        + p.candidateVectorHash
    );

    console.log(
        `K${p.candidateCount}_CANDIDATE_MANIFEST_HASH=`
        + p.candidateManifestHash
    );

    console.log(
        `K${p.candidateCount}_ELECTION_CONTEXT_HASH=`
        + p.electionContextHash
    );
}


console.log(
    "C8C_RUNTIME_PROFILE_SUPPLEMENT_BUILD=PASS"
);
