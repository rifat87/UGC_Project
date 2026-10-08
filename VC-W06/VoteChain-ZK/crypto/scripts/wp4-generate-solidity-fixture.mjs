import fs from "node:fs";

const [
    ,,
    metaPath,
    directAPath,
    directBPath,
    digestAPath,
    digestBPath,
    outputPath
] = process.argv;

const meta =
    JSON.parse(
        fs.readFileSync(
            metaPath,
            "utf8"
        )
    );

function parseCalldata(file) {
    const text =
        fs.readFileSync(
            file,
            "utf8"
        ).trim();

    const parsed =
        JSON.parse(
            `[${text}]`
        );

    if (
        !Array.isArray(parsed) ||
        parsed.length !== 4
    ) {
        throw new Error(
            `Unexpected soliditycalldata shape: ${file}`
        );
    }

    return parsed;
}

const directA =
    parseCalldata(
        directAPath
    );

const directB =
    parseCalldata(
        directBPath
    );

const digestA =
    parseCalldata(
        digestAPath
    );

const digestB =
    parseCalldata(
        digestBPath
    );

if (directA[3].length !== 73) {
    throw new Error(
        `DIRECT public length ${directA[3].length}, expected 73`
    );
}

if (digestA[3].length !== 10) {
    throw new Error(
        `POSEIDON public length ${digestA[3].length}, expected 10`
    );
}

function d(x) {
    return BigInt(x).toString();
}

function proofFunction(
    name,
    calldata,
    publicLength
) {
    const [
        a,
        b,
        c,
        pub
    ] = calldata;

    let s = `
    function ${name}()
        internal
        pure
        returns (
            uint256[2] memory a,
            uint256[2][2] memory b,
            uint256[2] memory c,
            uint256[${publicLength}] memory pubSignals
        )
    {
`;

    for (let i = 0; i < 2; i++) {
        s +=
`        a[${i}] = ${d(a[i])};
`;
    }

    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            s +=
`        b[${i}][${j}] = ${d(b[i][j])};
`;
        }
    }

    for (let i = 0; i < 2; i++) {
        s +=
`        c[${i}] = ${d(c[i])};
`;
    }

    for (let i = 0; i < pub.length; i++) {
        s +=
`        pubSignals[${i}] = ${d(pub[i])};
`;
    }

    s +=
`    }
`;

    return s;
}

function assignArray(
    variable,
    values
) {
    return values
        .map(
            (x, i) =>
`        ${variable}[${i}] = ${d(x)};
`
        )
        .join("");
}

function ballotFunction(
    name,
    ballot
) {
    return `
    function ${name}()
        internal
        pure
        returns (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        )
    {
        nullifier = ${d(ballot.nullifier)};
${assignArray("rx", ballot.Rx)}${assignArray("ry", ballot.Ry)}${assignArray("sx", ballot.Sx)}${assignArray("sy", ballot.Sy)}    }
`;
}

const cfg =
    meta.config;

const ag =
    meta.expectedAggregate;

let out =
`// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20 <0.9.0;

/*
 * AUTO-GENERATED WP4 SYNTHETIC FIXTURE.
 *
 * Contains Groth16 proof data and encrypted synthetic ballots only.
 * No biometric data.
 */
library WP4Fixture {
    function config()
        internal
        pure
        returns (
            uint256 eligibleRoot,
            uint256 electionId,
            uint256 candidateManifestHash,
            uint256 candidateCount,
            uint256 contractDomain,
            uint256 Yx,
            uint256 Yy,
            uint256 electionContextHash
        )
    {
        eligibleRoot = ${d(cfg.eligibleRoot)};
        electionId = ${d(cfg.electionId)};
        candidateManifestHash = ${d(cfg.candidateManifestHash)};
        candidateCount = ${d(cfg.candidateCount)};
        contractDomain = ${d(cfg.contractDomain)};
        Yx = ${d(cfg.Yx)};
        Yy = ${d(cfg.Yy)};
        electionContextHash = ${d(cfg.electionContextHash)};
    }

    function bindingA()
        internal
        pure
        returns (uint256)
    {
        return ${d(meta.voterA.bindingDigest)};
    }

    function bindingB()
        internal
        pure
        returns (uint256)
    {
        return ${d(meta.voterB.bindingDigest)};
    }

    function poseidonFirstVector()
        internal
        pure
        returns (
            uint256[5] memory input,
            uint256 expected
        )
    {
${assignArray("input", meta.poseidonFirstInput)}
        expected = ${d(meta.poseidonFirstOutput)};
    }
`;

out +=
    proofFunction(
        "directA",
        directA,
        73
    );

out +=
    proofFunction(
        "directB",
        directB,
        73
    );

out +=
    proofFunction(
        "digestA",
        digestA,
        10
    );

out +=
    proofFunction(
        "digestB",
        digestB,
        10
    );

out +=
    ballotFunction(
        "ballotA",
        meta.voterA
    );

out +=
    ballotFunction(
        "ballotB",
        meta.voterB
    );

out +=
`
    function expectedAggregate()
        internal
        pure
        returns (
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        )
    {
${assignArray("rx", ag.Rx)}${assignArray("ry", ag.Ry)}${assignArray("sx", ag.Sx)}${assignArray("sy", ag.Sy)}    }
}
`;

fs.writeFileSync(
    outputPath,
    out
);

console.log(
    "WP4_SOLIDITY_FIXTURE_GENERATION=PASS"
);
