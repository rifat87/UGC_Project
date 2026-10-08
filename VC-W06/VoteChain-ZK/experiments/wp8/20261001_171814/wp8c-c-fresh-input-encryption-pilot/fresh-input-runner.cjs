const fs =
    require("fs");

const path =
    require("path");

const crypto =
    require("crypto");

const {
    createRequire,
} = require("module");

function stageMs(
    start,
    end,
) {
    return Number(
        end - start
    ) / 1e6;
}

function compactBytes(
    value,
) {
    return Buffer.byteLength(
        JSON.stringify(
            value
        ),
        "utf8",
    );
}

function sha256Json(
    value,
) {
    return crypto
        .createHash("sha256")
        .update(
            JSON.stringify(
                value
            )
        )
        .digest("hex");
}

function rssBytes() {
    return process
        .memoryUsage()
        .rss;
}

async function main() {
    const [
        front,
        profileFile,
        protocolFile,
        baseInputFile,
        wasmFile,
        zkeyFile,
        vkeyFile,
        outputRoot,
        campaignId,
    ] =
        process.argv.slice(2);

    const req =
        createRequire(
            path.join(
                front,
                "package.json",
            )
        );

    const circomlib =
        req(
            "circomlibjs"
        );

    const snarkjs =
        req(
            "snarkjs"
        );

    const profile =
        JSON.parse(
            fs.readFileSync(
                profileFile,
                "utf8",
            )
        );

    const protocol =
        JSON.parse(
            fs.readFileSync(
                protocolFile,
                "utf8",
            )
        );

    const baseInput =
        JSON.parse(
            fs.readFileSync(
                baseInputFile,
                "utf8",
            )
        );

    const vkey =
        JSON.parse(
            fs.readFileSync(
                vkeyFile,
                "utf8",
            )
        );

    const MAX =
        Number(
            profile.maxCandidates
        );

    const DEPTH =
        Number(
            profile.merkleDepth
        );

    const FIELD =
        BigInt(
            profile.fieldModulus
        );

    const SUBORDER =
        BigInt(
            profile
                .babyjub
                .subOrder
        );

    const D_ID =
        BigInt(
            profile
                .domains
                .identity
        );

    const D_NULL =
        BigInt(
            profile
                .domains
                .nullifier
        );

    const D_CTX =
        BigInt(
            profile
                .domains
                .electionContext
        );

    const masterSeedHex =
        protocol
            .randomization
            .masterSyntheticSeed;

    if (
        typeof masterSeedHex !==
            "string"
        || !/^[0-9a-f]{64}$/i
            .test(
                masterSeedHex
            )
    ) {
        throw new Error(
            "Frozen synthetic master seed is missing or invalid"
        );
    }

    const masterSeed =
        Buffer.from(
            masterSeedHex,
            "hex",
        );

    function deriveBytes(
        label,
    ) {
        return crypto
            .createHmac(
                "sha256",
                masterSeed,
            )
            .update(
                `${campaignId}|${label}`,
                "utf8",
            )
            .digest();
    }

    function deriveBigInt(
        label,
        modulus,
    ) {
        const bytes =
            deriveBytes(
                label
            );

        const n =
            BigInt(
                "0x"
                + bytes.toString(
                    "hex"
                )
            );

        return (
            n %
            (
                modulus -
                1n
            )
        ) + 1n;
    }

    function derivePathBits(
        trialIndex,
    ) {
        const bits = [];

        let block = 0;

        while (
            bits.length <
            DEPTH
        ) {
            const bytes =
                deriveBytes(
                    `trial:${trialIndex}:path:${block}`
                );

            for (
                const byte
                of bytes
            ) {
                for (
                    let bit = 0;
                    bit < 8;
                    bit += 1
                ) {
                    bits.push(
                        BigInt(
                            (
                                byte
                                >> bit
                            ) & 1
                        )
                    );

                    if (
                        bits.length >=
                        DEPTH
                    ) {
                        return bits;
                    }
                }
            }

            block += 1;
        }

        return bits;
    }

    function leafIndexFromBits(
        bits,
    ) {
        let index = 0n;

        for (
            let i = 0;
            i < bits.length;
            i += 1
        ) {
            index +=
                bits[i]
                << BigInt(i);
        }

        return index;
    }

    console.log(
        "STAGE=LIBRARY_INIT_BEGIN"
    );

    const initStart =
        process.hrtime.bigint();

    const [
        poseidon,
        babyjub,
    ] =
        await Promise.all([
            circomlib
                .buildPoseidon(),
            circomlib
                .buildBabyjub(),
        ]);

    const initEnd =
        process.hrtime.bigint();

    const libraryInitMs =
        stageMs(
            initStart,
            initEnd,
        );

    console.log(
        `STAGE=LIBRARY_INIT_PASS MS=${libraryInitMs.toFixed(3)}`
    );

    function H(
        values,
    ) {
        return BigInt(
            poseidon
                .F
                .toObject(
                    poseidon(
                        values.map(
                            value =>
                                BigInt(
                                    value
                                )
                        )
                    )
                )
        );
    }

    function pointBig(
        point,
    ) {
        return [
            BigInt(
                babyjub
                    .F
                    .toObject(
                        point[0]
                    )
            ),
            BigInt(
                babyjub
                    .F
                    .toObject(
                        point[1]
                    )
            ),
        ];
    }

    function reconstructRoot(
        commitment,
        siblings,
        pathBits,
    ) {
        let current =
            commitment;

        for (
            let i = 0;
            i < DEPTH;
            i += 1
        ) {
            const sibling =
                BigInt(
                    siblings[i]
                );

            const bit =
                BigInt(
                    pathBits[i]
                );

            current =
                bit === 0n
                    ? H([
                        current,
                        sibling,
                    ])
                    : H([
                        sibling,
                        current,
                    ]);
        }

        return current;
    }

    const electionId =
        BigInt(
            baseInput.electionId
        );

    const manifest =
        BigInt(
            baseInput
                .candidateManifestHash
        );

    const candidateCount =
        Number(
            baseInput
                .candidateCount
        );

    const contractDomain =
        BigInt(
            baseInput
                .contractDomain
        );

    const Yx =
        BigInt(
            baseInput.Yx
        );

    const Yy =
        BigInt(
            baseInput.Yy
        );

    const expectedContext =
        BigInt(
            baseInput
                .electionContextHash
        );

    const computedContext =
        H([
            D_CTX,
            electionId,
            manifest,
            BigInt(
                candidateCount
            ),
            contractDomain,
            Yx,
            Yy,
        ]);

    if (
        computedContext !==
        expectedContext
    ) {
        throw new Error(
            "Frozen fixture election context mismatch"
        );
    }

    const Y = [
        babyjub.F.e(
            Yx
        ),
        babyjub.F.e(
            Yy
        ),
    ];

    if (
        typeof babyjub
            .inCurve ===
            "function"
        && !babyjub
            .inCurve(
                Y
            )
    ) {
        throw new Error(
            "Election BabyJub public key is not on curve"
        );
    }

    const identityPoint = [
        babyjub.F.e(
            0
        ),
        babyjub.F.e(
            1
        ),
    ];

    const schedule = [
        {
            trialIndex: 1,
            warmup: true,
            candidateSlotRole:
                "warmup",
            candidateSlot: 1,
        },
        {
            trialIndex: 2,
            warmup: false,
            candidateSlotRole:
                "first",
            candidateSlot: 0,
        },
        {
            trialIndex: 3,
            warmup: false,
            candidateSlotRole:
                "middle",
            candidateSlot:
                Math.floor(
                    candidateCount /
                    2
                ),
        },
        {
            trialIndex: 4,
            warmup: false,
            candidateSlotRole:
                "last",
            candidateSlot:
                candidateCount -
                1,
        },
    ];

    const rows = [];

    const seenRoots =
        new Set();

    const seenNullifiers =
        new Set();

    const seenCiphertexts =
        new Set();

    const seenLeafIndexes =
        new Set();

    fs.mkdirSync(
        outputRoot,
        {
            recursive: true,
        }
    );

    for (
        const trial
        of schedule
    ) {
        console.log("");
        console.log(
            "------------------------------------------------------------"
        );

        console.log(
            `TRIAL=${trial.trialIndex}`
        );

        console.log(
            `WARMUP=${trial.warmup ? "YES" : "NO"}`
        );

        console.log(
            `CANDIDATE_SLOT_ROLE=${trial.candidateSlotRole}`
        );

        console.log(
            `CANDIDATE_SLOT=${trial.candidateSlot}`
        );

        if (global.gc) {
            global.gc();
        }

        const rssStart =
            rssBytes();

        /*
         * Synthetic voter / Merkle input preparation.
         *
         * No real credential is involved.
         * The secret is deterministic from the frozen
         * PUBLIC benchmark seed and is never persisted.
         */
        console.log(
            "STAGE=INPUT_PREPARATION_BEGIN"
        );

        const prepStart =
            process.hrtime.bigint();

        const secret =
            deriveBigInt(
                `trial:${trial.trialIndex}:secret`,
                FIELD,
            );

        const commitment =
            H([
                D_ID,
                secret,
            ]);

        let pathBits =
            derivePathBits(
                trial.trialIndex
            );

        let leafIndex =
            leafIndexFromBits(
                pathBits
            );

        /*
         * Extremely unlikely deterministic collision
         * guard for the tiny pilot.
         */
        let collisionRound = 0;

        while (
            seenLeafIndexes.has(
                leafIndex.toString()
            )
        ) {
            collisionRound += 1;

            pathBits =
                derivePathBits(
                    trial.trialIndex
                    + collisionRound
                    * 1000
                );

            leafIndex =
                leafIndexFromBits(
                    pathBits
                );
        }

        const siblings =
            baseInput
                .siblings;

        const eligibleRoot =
            reconstructRoot(
                commitment,
                siblings,
                pathBits,
            );

        const nullifier =
            H([
                D_NULL,
                secret,
                electionId,
            ]);

        const bits =
            Array.from(
                {
                    length: MAX,
                },
                (
                    _unused,
                    index,
                ) =>
                    index ===
                    trial.candidateSlot
                        ? 1n
                        : 0n,
            );

        const prepEnd =
            process.hrtime.bigint();

        const inputPreparationMs =
            stageMs(
                prepStart,
                prepEnd,
            );

        console.log(
            `STAGE=INPUT_PREPARATION_PASS MS=${inputPreparationMs.toFixed(3)}`
        );

        /*
         * BabyJub exponential ElGamal encryption.
         * Every slot receives fresh seed-derived r.
         */
        console.log(
            "STAGE=ENCRYPTION_BEGIN"
        );

        const encryptionStart =
            process.hrtime.bigint();

        const randomness = [];

        const Rx = [];
        const Ry = [];
        const Sx = [];
        const Sy = [];

        for (
            let slot = 0;
            slot < MAX;
            slot += 1
        ) {
            const r =
                deriveBigInt(
                    `trial:${trial.trialIndex}:encryption:${slot}`,
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

            const message =
                bits[slot] ===
                    1n
                    ? babyjub.Base8
                    : identityPoint;

            const S =
                babyjub
                    .addPoint(
                        rY,
                        message,
                    );

            const rPoint =
                pointBig(
                    R
                );

            const sPoint =
                pointBig(
                    S
                );

            Rx.push(
                rPoint[0]
            );

            Ry.push(
                rPoint[1]
            );

            Sx.push(
                sPoint[0]
            );

            Sy.push(
                sPoint[1]
            );
        }

        const encryptionEnd =
            process.hrtime.bigint();

        const ballotEncryptionMs =
            stageMs(
                encryptionStart,
                encryptionEnd,
            );

        const encryptionPerSlotMs =
            ballotEncryptionMs /
            MAX;

        console.log(
            `STAGE=ENCRYPTION_PASS MS=${ballotEncryptionMs.toFixed(3)}`
        );

        console.log(
            `ENCRYPTION_PER_SLOT_MS=${encryptionPerSlotMs.toFixed(6)}`
        );

        const input = {
            secret:
                secret.toString(),

            siblings:
                siblings,

            pathBits:
                pathBits.map(
                    value =>
                        value.toString()
                ),

            bit:
                bits.map(
                    value =>
                        value.toString()
                ),

            randomness:
                randomness.map(
                    value =>
                        value.toString()
                ),

            eligibleRoot:
                eligibleRoot
                    .toString(),

            electionId:
                electionId
                    .toString(),

            candidateManifestHash:
                manifest
                    .toString(),

            candidateCount:
                String(
                    candidateCount
                ),

            contractDomain:
                contractDomain
                    .toString(),

            Yx:
                Yx.toString(),

            Yy:
                Yy.toString(),

            electionContextHash:
                computedContext
                    .toString(),

            nullifier:
                nullifier
                    .toString(),

            Rx:
                Rx.map(
                    value =>
                        value.toString()
                ),

            Ry:
                Ry.map(
                    value =>
                        value.toString()
                ),

            Sx:
                Sx.map(
                    value =>
                        value.toString()
                ),

            Sy:
                Sy.map(
                    value =>
                        value.toString()
                ),
        };

        const ciphertextPublic = {
            Rx: input.Rx,
            Ry: input.Ry,
            Sx: input.Sx,
            Sy: input.Sy,
        };

        const ciphertextHash =
            sha256Json(
                ciphertextPublic
            );

        const trialDir =
            path.join(
                outputRoot,
                `trial-${String(
                    trial.trialIndex
                ).padStart(
                    2,
                    "0",
                )}`,
            );

        fs.mkdirSync(
            trialDir,
            {
                recursive: true,
            }
        );

        const witnessFile =
            path.join(
                trialDir,
                "witness.wtns",
            );

        console.log(
            "STAGE=WITNESS_BEGIN"
        );

        const witnessStart =
            process.hrtime.bigint();

        await snarkjs
            .wtns
            .calculate(
                input,
                wasmFile,
                witnessFile,
            );

        const witnessEnd =
            process.hrtime.bigint();

        const witnessMs =
            stageMs(
                witnessStart,
                witnessEnd,
            );

        const witnessBytes =
            fs.statSync(
                witnessFile
            ).size;

        const witnessHash =
            crypto
                .createHash(
                    "sha256"
                )
                .update(
                    fs.readFileSync(
                        witnessFile
                    )
                )
                .digest(
                    "hex"
                );

        console.log(
            `STAGE=WITNESS_PASS MS=${witnessMs.toFixed(3)}`
        );

        console.log(
            "STAGE=PROVE_BEGIN"
        );

        const proveStart =
            process.hrtime.bigint();

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

        const proveEnd =
            process.hrtime.bigint();

        const proveMs =
            stageMs(
                proveStart,
                proveEnd,
            );

        console.log(
            `STAGE=PROVE_PASS MS=${proveMs.toFixed(3)}`
        );

        console.log(
            "STAGE=VERIFY_BEGIN"
        );

        const verifyStart =
            process.hrtime.bigint();

        const verified =
            await snarkjs
                .groth16
                .verify(
                    vkey,
                    publicSignals,
                    proof,
                );

        const verifyEnd =
            process.hrtime.bigint();

        const verifyMs =
            stageMs(
                verifyStart,
                verifyEnd,
            );

        console.log(
            `STAGE=VERIFY_${verified ? "PASS" : "FAIL"} MS=${verifyMs.toFixed(3)}`
        );

        if (!verified) {
            throw new Error(
                `Groth16 verification failed for trial ${trial.trialIndex}`
            );
        }

        if (
            publicSignals.length !==
            73
        ) {
            throw new Error(
                `Expected 73 public signals; got ${publicSignals.length}`
            );
        }

        const proofCoordinateCount =
            8;

        const proofCoordinatePayloadBytes =
            proofCoordinateCount *
            32;

        const ciphertextCoordinateCount =
            MAX *
            4;

        const ciphertextCoordinatePayloadBytes =
            ciphertextCoordinateCount *
            32;

        const proofCompactJsonBytes =
            compactBytes(
                proof
            );

        const publicCompactJsonBytes =
            compactBytes(
                publicSignals
            );

        const ciphertextCompactJsonBytes =
            compactBytes(
                ciphertextPublic
            );

        const proofHash =
            sha256Json(
                proof
            );

        const publicSignalsHash =
            sha256Json(
                publicSignals
            );

        /*
         * No witness/private input is retained.
         * Preserve only its size/hash.
         */
        fs.unlinkSync(
            witnessFile
        );

        const localCryptoTotalMs =
            inputPreparationMs
            + ballotEncryptionMs
            + witnessMs
            + proveMs
            + verifyMs;

        const rssAfter =
            rssBytes();

        const rssSampleHighWaterBytes =
            Math.max(
                rssStart,
                rssAfter,
            );

        const syntheticVoterId =
            crypto
                .createHash(
                    "sha256"
                )
                .update(
                    commitment
                        .toString()
                )
                .digest(
                    "hex"
                )
                .slice(
                    0,
                    24,
                );

        const row = {
            campaignId,
            trialIndex:
                trial.trialIndex,
            warmup:
                trial.warmup,

            classification:
                "WP8C_C_FRESH_INPUT_ENCRYPTION_PILOT",

            generationPolicy:
                "FROZEN_PUBLIC_SEED_DETERMINISTIC",

            syntheticVoterId,

            candidateCount,
            depth: DEPTH,

            candidateSlotRole:
                trial.candidateSlotRole,

            candidateSlot:
                trial.candidateSlot,

            merkleLeafIndex:
                Number(
                    leafIndex
                ),

            eligibleRoot:
                eligibleRoot
                    .toString(),

            nullifier:
                nullifier
                    .toString(),

            inputPreparationMs,
            ballotEncryptionMs,
            encryptionPerSlotMs,

            witnessMs,
            proveMs,
            verifyMs,

            localCryptoTotalMs,

            witnessBytes,
            witnessSha256:
                witnessHash,

            publicSignalCount:
                publicSignals
                    .length,

            proofCoordinateCount,
            proofCoordinatePayloadBytes,

            ciphertextCoordinateCount,
            ciphertextCoordinatePayloadBytes,

            proofCompactJsonBytes,
            publicCompactJsonBytes,
            ciphertextCompactJsonBytes,

            ciphertextSha256:
                ciphertextHash,

            proofSha256:
                proofHash,

            publicSignalsSha256:
                publicSignalsHash,

            rssSampleHighWaterBytes,

            verified,
            result: "PASS",
        };

        /*
         * Trial JSON deliberately excludes:
         * secret
         * randomness
         * private witness input
         */
        fs.writeFileSync(
            path.join(
                trialDir,
                "trial.json",
            ),
            JSON.stringify(
                row,
                null,
                2,
            ) + "\n",
        );

        /*
         * Proof and public signals are public artifacts
         * and are safe to preserve for pilot verification.
         */
        fs.writeFileSync(
            path.join(
                trialDir,
                "proof.json",
            ),
            JSON.stringify(
                proof,
                null,
                2,
            ) + "\n",
        );

        fs.writeFileSync(
            path.join(
                trialDir,
                "public.json",
            ),
            JSON.stringify(
                publicSignals,
                null,
                2,
            ) + "\n",
        );

        rows.push(
            row
        );

        seenRoots.add(
            row.eligibleRoot
        );

        seenNullifiers.add(
            row.nullifier
        );

        seenCiphertexts.add(
            row.ciphertextSha256
        );

        seenLeafIndexes.add(
            String(
                row.merkleLeafIndex
            )
        );

        console.log(
            `MERKLE_LEAF_INDEX=${row.merkleLeafIndex}`
        );

        console.log(
            `SYNTHETIC_VOTER_ID=${row.syntheticVoterId}`
        );

        console.log(
            `CIPHERTEXT_COORDINATE_PAYLOAD_BYTES=${row.ciphertextCoordinatePayloadBytes}`
        );

        console.log(
            `PROOF_COORDINATE_PAYLOAD_BYTES=${row.proofCoordinatePayloadBytes}`
        );

        console.log(
            `LOCAL_CRYPTO_TOTAL_MS=${row.localCryptoTotalMs.toFixed(3)}`
        );
    }

    if (
        seenRoots.size !==
        schedule.length
    ) {
        throw new Error(
            "Eligible roots were not unique across pilot trials"
        );
    }

    if (
        seenNullifiers.size !==
        schedule.length
    ) {
        throw new Error(
            "Nullifiers were not unique across pilot trials"
        );
    }

    if (
        seenCiphertexts.size !==
        schedule.length
    ) {
        throw new Error(
            "Ciphertexts were not unique across pilot trials"
        );
    }

    if (
        seenLeafIndexes.size !==
        schedule.length
    ) {
        throw new Error(
            "Merkle leaf positions were not unique across pilot trials"
        );
    }

    fs.writeFileSync(
        path.join(
            outputRoot,
            "all-trials.json",
        ),
        JSON.stringify(
            rows,
            null,
            2,
        ) + "\n",
    );

    console.log("");
    console.log(
        `LIBRARY_INIT_MS=${libraryInitMs.toFixed(3)}`
    );

    console.log(
        "FRESH_SYNTHETIC_VOTERS_UNIQUE=PASS"
    );

    console.log(
        "MERKLE_LEAF_POSITIONS_UNIQUE=PASS"
    );

    console.log(
        "NULLIFIERS_UNIQUE=PASS"
    );

    console.log(
        "CIPHERTEXTS_UNIQUE=PASS"
    );

    console.log(
        "PRIVATE_INPUT_PERSISTED=NO"
    );

    console.log(
        "WITNESS_FILES_RETAINED=NO"
    );

    console.log(
        "FRESH_INPUT_RUNNER=PASS"
    );

    console.log(
        `TOTAL_TRIALS=${rows.length}`
    );

    console.log(
        `MEASURED_TRIALS=${
            rows.filter(
                row =>
                    !row.warmup
            ).length
        }`
    );

    /*
     * SnarkJS/ffjavascript can leave worker handles
     * alive on Windows even after all cryptographic
     * stages and files have completed.
     *
     * Flush the evidence first, then explicitly terminate.
     */
    setTimeout(
        () => {
            process.exit(0);
        },
        100,
    );
}

main().catch(
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
            () => {
                process.exit(2);
            },
            100,
        );
    }
);
