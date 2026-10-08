import fs from "node:fs";
import crypto from "node:crypto";

const [
    ,
    ,
    jsonPath,
    circomPath
] = process.argv;

if (!jsonPath || !circomPath) {
    throw new Error(
        "Usage: node wp3-generate-profile.mjs profile.json profile.circom"
    );
}

const FIELD =
    21888242871839275222246405745257275088548364400416034343698204186575808495617n;

function domain(label) {
    const digest =
        crypto
            .createHash("sha256")
            .update(label, "utf8")
            .digest("hex");

    return (
        BigInt("0x" + digest) %
        FIELD
    );
}

const labels = {
    identity:
        "VoteChain-ZK/identity/v1",

    nullifier:
        "VoteChain-ZK/nullifier/v1",

    electionContext:
        "VoteChain-ZK/election-context/v1",

    ciphertextBinding:
        "VoteChain-ZK/ciphertext-binding/v1",

    candidateManifest:
        "VoteChain-ZK/candidate-manifest/v1",

    devContractDomain:
        "VoteChain-ZK/dev-contract-domain/v1"
};

const profile = {
    profile:
        "VoteChain-ZK-WP3-v1",

    proofSystem:
        "Groth16/snarkjs",

    circuitLanguage:
        "Circom-2",

    maxCandidates:
        16,

    merkleDepth:
        17,

    eligibleCapacity:
        131072,

    fieldModulus:
        FIELD.toString(),

    domainDerivation:
        "SHA256(UTF8(label)) mod BN254_Fr",

    labels,

    domains: {
        identity:
            domain(labels.identity).toString(),

        nullifier:
            domain(labels.nullifier).toString(),

        electionContext:
            domain(labels.electionContext).toString(),

        ciphertextBinding:
            domain(labels.ciphertextBinding).toString(),

        candidateManifest:
            domain(labels.candidateManifest).toString()
    },

    testContractDomain:
        domain(
            labels.devContractDomain
        ).toString(),

    babyjub: {
        base8X:
            "5299619240641551281634865583518297030282874472190772894086521144482721001553",

        base8Y:
            "16950150798460657717958625567821834550301663161624707787222815936182638968203",

        subOrder:
            "2736030358979909402780800718157159386076813972158567259200215660948447373041",

        subOrderMinusOne:
            "2736030358979909402780800718157159386076813972158567259200215660948447373040",

        scalarBits:
            253,

        circuitPointRepresentation:
            "AFFINE_XY_CANONICAL_FIELD_ELEMENTS",

        evmSerialization:
            "DEFERRED_WP4_GAS_GATE"
    },

    ciphertextBinding: {
        direct:
            "PUBLIC_AFFINE_XY_COORDINATES",

        poseidon:
            "POSEIDON_CHAIN_OVER_AFFINE_COORDINATES",

        finalDecision:
            "DEFERRED_PENDING_WP4_EVM_GAS_AND_CALLDATA"
    },

    threshold: {
        architecture:
            "CONFIGURABLE_T_OF_N",

        prototypeDefault:
            "3_OF_5",

        productionDkg:
            "DEFERRED_WP6"
    }
};

fs.writeFileSync(
    jsonPath,
    JSON.stringify(
        profile,
        null,
        2
    ) + "\n"
);

const d =
    profile.domains;

const b =
    profile.babyjub;

const circom = `pragma circom 2.2.0;

/*
 * AUTO-GENERATED FROM:
 *   crypto/config/wp3-build-profile.json
 *
 * VoteChain-ZK WP3 authoritative compile-time registry.
 *
 * Domain constants are:
 *   SHA256(UTF8(label)) mod BN254_Fr
 */

function VC_MAX_CANDIDATES() {
    return ${profile.maxCandidates};
}

function VC_MERKLE_DEPTH() {
    return ${profile.merkleDepth};
}

function VC_DOMAIN_IDENTITY() {
    return ${d.identity};
}

function VC_DOMAIN_NULLIFIER() {
    return ${d.nullifier};
}

function VC_DOMAIN_ELECTION_CONTEXT() {
    return ${d.electionContext};
}

function VC_DOMAIN_CIPHERTEXT_BINDING() {
    return ${d.ciphertextBinding};
}

function VC_DOMAIN_CANDIDATE_MANIFEST() {
    return ${d.candidateManifest};
}

function VC_BABYJUB_BASE8_X() {
    return ${b.base8X};
}

function VC_BABYJUB_BASE8_Y() {
    return ${b.base8Y};
}

function VC_BABYJUB_SUBORDER() {
    return ${b.subOrder};
}

function VC_BABYJUB_SUBORDER_MINUS_ONE() {
    return ${b.subOrderMinusOne};
}
`;

fs.writeFileSync(
    circomPath,
    circom
);

console.log(
    "WP3_BUILD_PROFILE_GENERATION=PASS"
);
