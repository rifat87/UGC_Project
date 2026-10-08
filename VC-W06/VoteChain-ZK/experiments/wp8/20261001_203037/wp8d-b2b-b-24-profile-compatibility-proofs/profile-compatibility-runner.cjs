const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createRequire } = require("module");

function createLoaders(
    front,
    cryptoRoot,
) {
    const reqs = [];

    for (const root of [
        front,
        cryptoRoot,
    ]) {
        try {
            reqs.push(
                createRequire(
                    path.join(
                        root,
                        "package.json",
                    )
                )
            );
        } catch {
            // Ignore and try the next root.
        }
    }

    return function load(name) {
        const failures = [];

        for (const req of reqs) {
            try {
                return req(name);
            } catch (error) {
                failures.push(
                    error?.message
                    || String(error)
                );
            }
        }

        throw new Error(
            `Cannot resolve ${name}: ${failures.join(" | ")}`
        );
    };
}

async function main() {
    const [
        front,
        cryptoRoot,
        profileFile,
        protocolFile,
        wasmFile,
        zkeyFile,
        vkeyFile,
        outputDir,
        runId,
        profileId,
        variantRaw,
        kRaw,
        depthRaw,
        slotRaw,
        expectedPublicRaw,
    ] = process.argv.slice(2);

    const variant =
        String(
            variantRaw
        ).toUpperCase();

    const K =
        Number(
            kRaw
        );

    const DEPTH =
        Number(
            depthRaw
        );

    const candidateSlot =
        Number(
            slotRaw
        );

    const expectedPublic =
        Number(
            expectedPublicRaw
        );

    if (
        !Number.isInteger(K)
        || K < 1
        || K > 16
    ) {
        throw new Error(
            `Invalid K=${K}`
        );
    }

    if (
        !Number.isInteger(DEPTH)
        || DEPTH < 1
    ) {
        throw new Error(
            `Invalid depth=${DEPTH}`
        );
    }

    if (
        !Number.isInteger(candidateSlot)
        || candidateSlot < 0
        || candidateSlot >= K
    ) {
        throw new Error(
            `Invalid candidate slot=${candidateSlot}`
        );
    }

    if (
        variant !== "DIRECT"
        && variant !== "POSEIDON"
    ) {
        throw new Error(
            `Unsupported variant=${variant}`
        );
    }

    const load =
        createLoaders(
            front,
            cryptoRoot,
        );

    const circomlib =
        load(
            "circomlibjs"
        );

    const snarkjs =
        load(
            "snarkjs"
        );

    const [
        poseidon,
        babyjub,
    ] = await Promise.all([
        circomlib.buildPoseidon(),
        circomlib.buildBabyjub(),
    ]);

    const profile = JSON.parse(
        fs.readFileSync(
            profileFile,
            "utf8",
        )
    );

    const protocol = JSON.parse(
        fs.readFileSync(
            protocolFile,
            "utf8",
        )
    );

    const vkey = JSON.parse(
        fs.readFileSync(
            vkeyFile,
            "utf8",
        )
    );

    const FIELD =
        BigInt(
            profile.fieldModulus
        );

    const SUBORDER =
        BigInt(
            profile.babyjub.subOrder
        );

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

    const contractDomain =
        BigInt(
            profile.testContractDomain
        );

    const seedHex =
        protocol
            ?.randomization
            ?.masterSyntheticSeed;

    if (
        typeof seedHex !== "string"
        || !/^[0-9a-f]{64}$/i.test(
            seedHex
        )
    ) {
        throw new Error(
            "Frozen public synthetic master seed unavailable"
        );
    }

    const masterSeed =
        Buffer.from(
            seedHex,
            "hex",
        );

    function deriveBytes(label) {
        return crypto
            .createHmac(
                "sha256",
                masterSeed,
            )
            .update(
                [
                    runId,
                    "WP8D-B2B-B",
                    profileId,
                    label,
                ].join("|"),
                "utf8",
            )
            .digest();
    }

    function deriveBigInt(
        label,
        modulus,
    ) {
        const n =
            BigInt(
                "0x"
                + deriveBytes(
                    label
                ).toString(
                    "hex"
                )
            );

        return (
            n
            % (
                modulus
                - 1n
            )
        ) + 1n;
    }

    function H(values) {
        return BigInt(
            poseidon.F.toObject(
                poseidon(
                    values.map(
                        value =>
                            BigInt(value)
                    )
                )
            )
        );
    }

    function pointBig(point) {
        return [
            BigInt(
                babyjub.F.toObject(
                    point[0]
                )
            ),
            BigInt(
                babyjub.F.toObject(
                    point[1]
                )
            ),
        ];
    }

    fs.mkdirSync(
        outputDir,
        {
            recursive: true,
        }
    );

    const witnessFile =
        path.join(
            outputDir,
            "compatibility.wtns",
        );

    let witnessBytes = 0;

    try {
        console.log(
            "STAGE=FRESH_SYNTHETIC_INPUT_BEGIN"
        );

        const secret =
            deriveBigInt(
                "voter-secret",
                FIELD,
            );

        const identityCommitment =
            H([
                D_ID,
                secret,
            ]);

        const siblings =
            Array.from(
                {
                    length: DEPTH,
                },
                (
                    _unused,
                    i,
                ) =>
                    deriveBigInt(
                        `sibling:${i}`,
                        FIELD,
                    )
            );

        const pathSeed =
            deriveBytes(
                "path-bits"
            );

        const pathBits =
            Array.from(
                {
                    length: DEPTH,
                },
                (
                    _unused,
                    i,
                ) =>
                    BigInt(
                        (
                            pathSeed[
                                Math.floor(
                                    i / 8
                                )
                            ]
                            >> (
                                i % 8
                            )
                        ) & 1
                    )
            );

        let eligibleRoot =
            identityCommitment;

        let syntheticLeafIndex =
            0n;

        for (
            let i = 0;
            i < DEPTH;
            i += 1
        ) {
            if (
                pathBits[i]
                === 0n
            ) {
                eligibleRoot =
                    H([
                        eligibleRoot,
                        siblings[i],
                    ]);
            } else {
                eligibleRoot =
                    H([
                        siblings[i],
                        eligibleRoot,
                    ]);

                syntheticLeafIndex +=
                    1n
                    << BigInt(i);
            }
        }

        const electionId =
            deriveBigInt(
                "election-id",
                FIELD,
            );

        /*
         * The circuit binds candidateManifestHash but does not
         * recompute candidate identifiers. For synthetic compatibility
         * evidence, derive an election-specific field manifest value.
         */
        const manifestSalt =
            deriveBigInt(
                "candidate-manifest-salt",
                FIELD,
            );

        const candidateManifestHash =
            H([
                D_MANIFEST,
                BigInt(K),
                manifestSalt,
            ]);

        const electionSecretKey =
            deriveBigInt(
                "election-encryption-secret",
                SUBORDER,
            );

        const Y =
            babyjub
                .mulPointEscalar(
                    babyjub.Base8,
                    electionSecretKey,
                );

        if (
            typeof babyjub.inCurve
                === "function"
            && !babyjub.inCurve(
                Y
            )
        ) {
            throw new Error(
                "Derived election public key is not on BabyJub"
            );
        }

        const [
            Yx,
            Yy,
        ] =
            pointBig(
                Y
            );

        const candidateCount =
            BigInt(K);

        const electionContextHash =
            H([
                D_CTX,
                electionId,
                candidateManifestHash,
                candidateCount,
                contractDomain,
                Yx,
                Yy,
            ]);

        const nullifier =
            H([
                D_NULL,
                secret,
                electionId,
            ]);

        const bit =
            Array.from(
                {
                    length: K,
                },
                (
                    _unused,
                    i,
                ) =>
                    i === candidateSlot
                        ? 1n
                        : 0n
            );

        const identityPoint = [
            babyjub.F.e(
                0
            ),
            babyjub.F.e(
                1
            ),
        ];

        const randomness = [];
        const Rx = [];
        const Ry = [];
        const Sx = [];
        const Sy = [];

        console.log(
            "STAGE=FRESH_ENCRYPTION_BEGIN"
        );

        for (
            let slot = 0;
            slot < K;
            slot += 1
        ) {
            const r =
                deriveBigInt(
                    `encryption-randomness:${slot}`,
                    SUBORDER,
                );

            randomness.push(
                r
            );

            const R =
                babyjub
                    .mulPointEscalar(
                        babyjub.Base8,
                        r,
                    );

            const rY =
                babyjub
                    .mulPointEscalar(
                        Y,
                        r,
                    );

            const messagePoint =
                bit[slot] === 1n
                    ? babyjub.Base8
                    : identityPoint;

            const S =
                babyjub.addPoint(
                    rY,
                    messagePoint,
                );

            const Rxy =
                pointBig(
                    R
                );

            const Sxy =
                pointBig(
                    S
                );

            Rx.push(
                Rxy[0]
            );

            Ry.push(
                Rxy[1]
            );

            Sx.push(
                Sxy[0]
            );

            Sy.push(
                Sxy[1]
            );
        }

        console.log(
            "STAGE=FRESH_ENCRYPTION_PASS"
        );

        let bindingDigest =
            D_BIND;

        for (
            let slot = 0;
            slot < K;
            slot += 1
        ) {
            bindingDigest =
                H([
                    bindingDigest,
                    Rx[slot],
                    Ry[slot],
                    Sx[slot],
                    Sy[slot],
                ]);
        }

        const input = {
            secret:
                secret.toString(),

            siblings:
                siblings.map(
                    x =>
                        x.toString()
                ),

            pathBits:
                pathBits.map(
                    x =>
                        x.toString()
                ),

            bit:
                bit.map(
                    x =>
                        x.toString()
                ),

            randomness:
                randomness.map(
                    x =>
                        x.toString()
                ),

            eligibleRoot:
                eligibleRoot.toString(),

            electionId:
                electionId.toString(),

            candidateManifestHash:
                candidateManifestHash.toString(),

            candidateCount:
                candidateCount.toString(),

            contractDomain:
                contractDomain.toString(),

            Yx:
                Yx.toString(),

            Yy:
                Yy.toString(),

            electionContextHash:
                electionContextHash.toString(),

            nullifier:
                nullifier.toString(),
        };

        if (
            variant === "DIRECT"
        ) {
            Object.assign(
                input,
                {
                    Rx:
                        Rx.map(
                            x =>
                                x.toString()
                        ),

                    Ry:
                        Ry.map(
                            x =>
                                x.toString()
                        ),

                    Sx:
                        Sx.map(
                            x =>
                                x.toString()
                        ),

                    Sy:
                        Sy.map(
                            x =>
                                x.toString()
                        ),
                }
            );
        } else {
            input.bindingDigest =
                bindingDigest.toString();
        }

        console.log(
            "STAGE=FRESH_SYNTHETIC_INPUT_PASS"
        );

        console.log(
            "STAGE=WITNESS_BEGIN"
        );

        await snarkjs
            .wtns
            .calculate(
                input,
                wasmFile,
                witnessFile,
            );

        console.log(
            "STAGE=WITNESS_PASS"
        );

        witnessBytes =
            fs.statSync(
                witnessFile
            ).size;

        console.log(
            "STAGE=PROVE_BEGIN"
        );

        const {
            proof,
            publicSignals,
        } =
            await snarkjs
                .groth16
                .prove(
                    zkeyFile,
                    witnessFile,
                );

        console.log(
            "STAGE=PROVE_PASS"
        );

        console.log(
            "STAGE=VERIFY_BEGIN"
        );

        const verified =
            await snarkjs
                .groth16
                .verify(
                    vkey,
                    publicSignals,
                    proof,
                );

        if (!verified) {
            console.log(
                "STAGE=VERIFY_FAIL"
            );

            throw new Error(
                "Programmatic Groth16 verification failed"
            );
        }

        console.log(
            "STAGE=VERIFY_PASS"
        );

        if (
            publicSignals.length
            !== expectedPublic
        ) {
            throw new Error(
                `Expected ${expectedPublic} public signals; got ${publicSignals.length}`
            );
        }

        const proofCompact =
            JSON.stringify(
                proof
            );

        const publicCompact =
            JSON.stringify(
                publicSignals
            );

        const proofFile =
            path.join(
                outputDir,
                "proof.json",
            );

        const publicFile =
            path.join(
                outputDir,
                "public.json",
            );

        fs.writeFileSync(
            proofFile,
            JSON.stringify(
                proof,
                null,
                2,
            ) + "\n",
            "utf8",
        );

        fs.writeFileSync(
            publicFile,
            JSON.stringify(
                publicSignals,
                null,
                2,
            ) + "\n",
            "utf8",
        );

        const result = {
            classification:
                "WP8D_B2B_B_FUNCTIONAL_COMPATIBILITY_ONLY",

            profileId,
            variant,

            maxCandidates:
                K,

            merkleDepth:
                DEPTH,

            capacity:
                2 ** DEPTH,

            candidateCount:
                K,

            syntheticCandidateSlot:
                candidateSlot,

            syntheticLeafIndex:
                Number(
                    syntheticLeafIndex
                ),

            publicSignalCount:
                publicSignals.length,

            proofCoordinateCount:
                8,

            proofCoordinatePayloadBytes:
                256,

            proofCompactJsonBytes:
                Buffer.byteLength(
                    proofCompact,
                    "utf8",
                ),

            publicCompactJsonBytes:
                Buffer.byteLength(
                    publicCompact,
                    "utf8",
                ),

            witnessBytes,

            verified:
                true,

            freshSyntheticInput:
                true,

            freshSyntheticEncryptionRandomness:
                true,

            privateInputPersisted:
                false,

            witnessPersisted:
                false,

            timingResult:
                false,

            result:
                "PASS",
        };

        fs.writeFileSync(
            path.join(
                outputDir,
                "compatibility-result.json",
            ),
            JSON.stringify(
                result,
                null,
                2,
            ) + "\n",
            "utf8",
        );

        console.log(
            `PUBLIC_SIGNAL_COUNT=${publicSignals.length}`
        );

        console.log(
            `WITNESS_BYTES=${witnessBytes}`
        );

        console.log(
            `PROOF_COMPACT_JSON_BYTES=${result.proofCompactJsonBytes}`
        );

        console.log(
            `PUBLIC_COMPACT_JSON_BYTES=${result.publicCompactJsonBytes}`
        );

        console.log(
            "PROOF_COORDINATE_PAYLOAD_BYTES=256"
        );

        console.log(
            "PRIVATE_INPUT_PERSISTED=NO"
        );

        console.log(
            "COMPATIBILITY_PROOF=PASS"
        );
    } finally {
        if (
            fs.existsSync(
                witnessFile
            )
        ) {
            fs.unlinkSync(
                witnessFile
            );
        }

        console.log(
            "WITNESS_FILE_RETAINED=NO"
        );
    }
}

main().then(
    () => {
        setTimeout(
            () => process.exit(0),
            100,
        );
    }
).catch(
    error => {
        console.error(
            "RUNNER_ERROR="
            + (
                error?.stack
                || error?.message
                || String(error)
            )
        );

        setTimeout(
            () => process.exit(2),
            100,
        );
    }
);
