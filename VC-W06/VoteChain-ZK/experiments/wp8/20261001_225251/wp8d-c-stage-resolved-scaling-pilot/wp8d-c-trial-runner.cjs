const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createRequire } = require("module");

function makeLoader(front, cryptoRoot) {
    const reqs = [];

    for (const root of [front, cryptoRoot]) {
        try {
            reqs.push(
                createRequire(
                    path.join(root, "package.json")
                )
            );
        } catch {}
    }

    return function load(name) {
        const errors = [];

        for (const req of reqs) {
            try {
                return req(name);
            } catch (error) {
                errors.push(
                    error?.message || String(error)
                );
            }
        }

        throw new Error(
            `Cannot resolve ${name}: ${errors.join(" | ")}`
        );
    };
}

function now() {
    return process.hrtime.bigint();
}

function elapsedMs(start, end) {
    return Number(end - start) / 1e6;
}

function rss() {
    return process.memoryUsage().rss;
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
        sequenceRaw,
        phase,
        roundRaw,
        cellId,
        profileId,
        variantRaw,
        kRaw,
        depthRaw,
        capacityRaw,
        positionLabel,
        slotRaw,
        expectedPublicRaw,
    ] = process.argv.slice(2);

    const sequence = Number(sequenceRaw);
    const round = Number(roundRaw);
    const variant = String(variantRaw).toUpperCase();
    const K = Number(kRaw);
    const DEPTH = Number(depthRaw);
    const capacity = Number(capacityRaw);
    const candidateSlot = Number(slotRaw);
    const expectedPublic = Number(expectedPublicRaw);

    const load = makeLoader(front, cryptoRoot);
    const circomlib = load("circomlibjs");
    const snarkjs = load("snarkjs");

    /*
     * Library initialization is deliberately outside measured stage time.
     */
    const [poseidon, babyjub] = await Promise.all([
        circomlib.buildPoseidon(),
        circomlib.buildBabyjub(),
    ]);

    const profile = JSON.parse(
        fs.readFileSync(profileFile, "utf8")
    );

    const protocol = JSON.parse(
        fs.readFileSync(protocolFile, "utf8")
    );

    const vkey = JSON.parse(
        fs.readFileSync(vkeyFile, "utf8")
    );

    const FIELD = BigInt(profile.fieldModulus);
    const SUBORDER = BigInt(profile.babyjub.subOrder);

    const D_ID = BigInt(profile.domains.identity);
    const D_NULL = BigInt(profile.domains.nullifier);
    const D_CTX = BigInt(profile.domains.electionContext);
    const D_BIND = BigInt(profile.domains.ciphertextBinding);
    const D_MANIFEST = BigInt(profile.domains.candidateManifest);

    const contractDomain = BigInt(
        profile.testContractDomain
    );

    const seedHex =
        protocol?.randomization?.masterSyntheticSeed;

    if (
        typeof seedHex !== "string" ||
        !/^[0-9a-f]{64}$/i.test(seedHex)
    ) {
        throw new Error(
            "Frozen synthetic master seed unavailable"
        );
    }

    const masterSeed = Buffer.from(seedHex, "hex");

    function deriveBytes(label) {
        return crypto
            .createHmac("sha256", masterSeed)
            .update(
                [
                    runId,
                    "WP8D-C",
                    sequence,
                    phase,
                    round,
                    cellId,
                    profileId,
                    label,
                ].join("|"),
                "utf8",
            )
            .digest();
    }

    function deriveBigInt(label, modulus) {
        const n = BigInt(
            "0x" + deriveBytes(label).toString("hex")
        );

        return (n % (modulus - 1n)) + 1n;
    }

    function H(values) {
        return BigInt(
            poseidon.F.toObject(
                poseidon(
                    values.map(value => BigInt(value))
                )
            )
        );
    }

    function pointBig(point) {
        return [
            BigInt(babyjub.F.toObject(point[0])),
            BigInt(babyjub.F.toObject(point[1])),
        ];
    }

    fs.mkdirSync(outputDir, {
        recursive: true,
    });

    const witnessFile = path.join(
        outputDir,
        "trial.wtns",
    );

    const proofFile = path.join(
        outputDir,
        "proof.json",
    );

    const publicFile = path.join(
        outputDir,
        "public.json",
    );

    const resultFile = path.join(
        outputDir,
        "trial-result.json",
    );

    const rssStart = rss();

    let rssAfterContext = rssStart;
    let rssAfterEncryption = rssStart;
    let rssAfterBinding = rssStart;
    let rssAfterAssembly = rssStart;
    let rssAfterWitness = rssStart;
    let rssAfterProve = rssStart;
    let rssAfterVerify = rssStart;

    let contextPrepMs = 0;
    let encryptionMs = 0;
    let bindingMs = 0;
    let inputAssemblyMs = 0;
    let witnessMs = 0;
    let proveMs = 0;
    let verifyMs = 0;

    const totalStart = now();

    try {
        console.log(
            `TRIAL_BEGIN sequence=${sequence} phase=${phase} round=${round} cell=${cellId}`
        );

        /*
         * Context / Merkle / election preparation.
         */
        let t0 = now();

        const secret = deriveBigInt(
            "voter-secret",
            FIELD,
        );

        const identityCommitment = H([
            D_ID,
            secret,
        ]);

        const siblings = Array.from(
            { length: DEPTH },
            (_unused, i) =>
                deriveBigInt(
                    `sibling:${i}`,
                    FIELD,
                )
        );

        const pathSeed = deriveBytes("path-bits");

        const pathBits = Array.from(
            { length: DEPTH },
            (_unused, i) =>
                BigInt(
                    (
                        pathSeed[
                            Math.floor(i / 8)
                        ]
                        >> (i % 8)
                    ) & 1
                )
        );

        let eligibleRoot = identityCommitment;
        let syntheticLeafIndex = 0n;

        for (let i = 0; i < DEPTH; i += 1) {
            if (pathBits[i] === 0n) {
                eligibleRoot = H([
                    eligibleRoot,
                    siblings[i],
                ]);
            } else {
                eligibleRoot = H([
                    siblings[i],
                    eligibleRoot,
                ]);

                syntheticLeafIndex +=
                    1n << BigInt(i);
            }
        }

        const electionId = deriveBigInt(
            "election-id",
            FIELD,
        );

        /*
         * Synthetic benchmark manifest field. The circuit binds this
         * field but does not recompute application candidate records.
         */
        const manifestSalt = deriveBigInt(
            "candidate-manifest-salt",
            FIELD,
        );

        const candidateManifestHash = H([
            D_MANIFEST,
            BigInt(K),
            manifestSalt,
        ]);

        const electionSecretKey = deriveBigInt(
            "election-encryption-secret",
            SUBORDER,
        );

        const Y = babyjub.mulPointEscalar(
            babyjub.Base8,
            electionSecretKey,
        );

        const [Yx, Yy] = pointBig(Y);

        const candidateCount = BigInt(K);

        const electionContextHash = H([
            D_CTX,
            electionId,
            candidateManifestHash,
            candidateCount,
            contractDomain,
            Yx,
            Yy,
        ]);

        const nullifier = H([
            D_NULL,
            secret,
            electionId,
        ]);

        const bit = Array.from(
            { length: K },
            (_unused, i) =>
                i === candidateSlot ? 1n : 0n
        );

        let t1 = now();
        contextPrepMs = elapsedMs(t0, t1);
        rssAfterContext = rss();

        /*
         * ElGamal ballot encryption.
         */
        console.log("STAGE=ENCRYPTION_BEGIN");

        t0 = now();

        const identityPoint = [
            babyjub.F.e(0),
            babyjub.F.e(1),
        ];

        const randomness = [];
        const Rx = [];
        const Ry = [];
        const Sx = [];
        const Sy = [];

        for (let slot = 0; slot < K; slot += 1) {
            const r = deriveBigInt(
                `encryption-randomness:${slot}`,
                SUBORDER,
            );

            randomness.push(r);

            const R = babyjub.mulPointEscalar(
                babyjub.Base8,
                r,
            );

            const rY = babyjub.mulPointEscalar(
                Y,
                r,
            );

            const messagePoint =
                bit[slot] === 1n
                    ? babyjub.Base8
                    : identityPoint;

            const S = babyjub.addPoint(
                rY,
                messagePoint,
            );

            const [rx, ry] = pointBig(R);
            const [sx, sy] = pointBig(S);

            Rx.push(rx);
            Ry.push(ry);
            Sx.push(sx);
            Sy.push(sy);
        }

        t1 = now();
        encryptionMs = elapsedMs(t0, t1);
        rssAfterEncryption = rss();

        console.log("STAGE=ENCRYPTION_PASS");

        /*
         * Poseidon ciphertext binding is only part of the reference path.
         * DIRECT exposes coordinates directly and therefore records zero.
         */
        let bindingDigest = D_BIND;

        if (variant === "POSEIDON") {
            console.log("STAGE=BINDING_BEGIN");

            t0 = now();

            for (let slot = 0; slot < K; slot += 1) {
                bindingDigest = H([
                    bindingDigest,
                    Rx[slot],
                    Ry[slot],
                    Sx[slot],
                    Sy[slot],
                ]);
            }

            t1 = now();
            bindingMs = elapsedMs(t0, t1);

            console.log("STAGE=BINDING_PASS");
        }

        rssAfterBinding = rss();

        /*
         * Assemble witness input. No private input is written to disk.
         */
        t0 = now();

        const input = {
            secret: secret.toString(),

            siblings:
                siblings.map(x => x.toString()),

            pathBits:
                pathBits.map(x => x.toString()),

            bit:
                bit.map(x => x.toString()),

            randomness:
                randomness.map(x => x.toString()),

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

            Yx: Yx.toString(),
            Yy: Yy.toString(),

            electionContextHash:
                electionContextHash.toString(),

            nullifier:
                nullifier.toString(),
        };

        if (variant === "DIRECT") {
            Object.assign(input, {
                Rx: Rx.map(x => x.toString()),
                Ry: Ry.map(x => x.toString()),
                Sx: Sx.map(x => x.toString()),
                Sy: Sy.map(x => x.toString()),
            });
        } else if (variant === "POSEIDON") {
            input.bindingDigest =
                bindingDigest.toString();
        } else {
            throw new Error(
                `Unsupported variant ${variant}`
            );
        }

        t1 = now();
        inputAssemblyMs = elapsedMs(t0, t1);
        rssAfterAssembly = rss();

        /*
         * Witness.
         */
        console.log("STAGE=WITNESS_BEGIN");

        t0 = now();

        await snarkjs.wtns.calculate(
            input,
            wasmFile,
            witnessFile,
        );

        t1 = now();
        witnessMs = elapsedMs(t0, t1);
        rssAfterWitness = rss();

        const witnessBytes =
            fs.statSync(witnessFile).size;

        console.log("STAGE=WITNESS_PASS");

        /*
         * Groth16 proof.
         */
        console.log("STAGE=PROVE_BEGIN");

        t0 = now();

        const {
            proof,
            publicSignals,
        } = await snarkjs.groth16.prove(
            zkeyFile,
            witnessFile,
        );

        t1 = now();
        proveMs = elapsedMs(t0, t1);
        rssAfterProve = rss();

        console.log("STAGE=PROVE_PASS");

        /*
         * Local verification.
         */
        console.log("STAGE=VERIFY_BEGIN");

        t0 = now();

        const verified =
            await snarkjs.groth16.verify(
                vkey,
                publicSignals,
                proof,
            );

        t1 = now();
        verifyMs = elapsedMs(t0, t1);
        rssAfterVerify = rss();

        if (!verified) {
            throw new Error(
                "Programmatic Groth16 verification failed"
            );
        }

        if (
            publicSignals.length !== expectedPublic
        ) {
            throw new Error(
                `Expected ${expectedPublic} public signals; got ${publicSignals.length}`
            );
        }

        console.log("STAGE=VERIFY_PASS");

        const totalEnd = now();

        const totalLocalCryptoMs =
            elapsedMs(totalStart, totalEnd);

        const proofCompact =
            JSON.stringify(proof);

        const publicCompact =
            JSON.stringify(publicSignals);

        fs.writeFileSync(
            proofFile,
            JSON.stringify(proof, null, 2) + "\n",
            "utf8",
        );

        fs.writeFileSync(
            publicFile,
            JSON.stringify(publicSignals, null, 2) + "\n",
            "utf8",
        );

        const publicFingerprintSha256 =
            crypto
                .createHash("sha256")
                .update(publicCompact, "utf8")
                .digest("hex");

        const boundaryRssMaxBytes = Math.max(
            rssStart,
            rssAfterContext,
            rssAfterEncryption,
            rssAfterBinding,
            rssAfterAssembly,
            rssAfterWitness,
            rssAfterProve,
            rssAfterVerify,
        );

        const result = {
            classification:
                "WP8D_C_PILOT_ONLY_NOT_FINAL_BENCHMARK",

            runId,
            sequence,
            phase,
            round,

            cellId,
            profileId,
            variant,

            maxCandidates: K,
            merkleDepth: DEPTH,
            capacity,

            positionLabel,
            candidateSlot,

            syntheticLeafIndex:
                Number(syntheticLeafIndex),

            contextPrepMs,
            encryptionMs,
            bindingMs,
            inputAssemblyMs,
            witnessMs,
            proveMs,
            verifyMs,
            totalLocalCryptoMs,

            publicSignalCount:
                publicSignals.length,

            witnessBytes,

            proofCoordinatePayloadBytes: 256,

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

            rssStartBytes: rssStart,
            rssAfterContextBytes:
                rssAfterContext,
            rssAfterEncryptionBytes:
                rssAfterEncryption,
            rssAfterBindingBytes:
                rssAfterBinding,
            rssAfterInputAssemblyBytes:
                rssAfterAssembly,
            rssAfterWitnessBytes:
                rssAfterWitness,
            rssAfterProveBytes:
                rssAfterProve,
            rssAfterVerifyBytes:
                rssAfterVerify,

            boundaryRssMaxBytes,

            memoryClassification:
                "PROCESS_RSS_STAGE_BOUNDARIES_ONLY_NOT_OS_PEAK_M27",

            publicFingerprintSha256,

            freshSyntheticInput: true,
            freshSyntheticEncryptionRandomness: true,

            privateInputPersisted: false,
            witnessPersisted: false,

            verified: true,
            result: "PASS",
        };

        fs.writeFileSync(
            resultFile,
            JSON.stringify(result, null, 2) + "\n",
            "utf8",
        );

        console.log(
            `CONTEXT_PREP_MS=${contextPrepMs.toFixed(6)}`
        );

        console.log(
            `ENCRYPTION_MS=${encryptionMs.toFixed(6)}`
        );

        console.log(
            `BINDING_MS=${bindingMs.toFixed(6)}`
        );

        console.log(
            `INPUT_ASSEMBLY_MS=${inputAssemblyMs.toFixed(6)}`
        );

        console.log(
            `WITNESS_MS=${witnessMs.toFixed(6)}`
        );

        console.log(
            `PROVE_MS=${proveMs.toFixed(6)}`
        );

        console.log(
            `VERIFY_MS=${verifyMs.toFixed(6)}`
        );

        console.log(
            `TOTAL_LOCAL_CRYPTO_MS=${totalLocalCryptoMs.toFixed(6)}`
        );

        console.log(
            `BOUNDARY_RSS_MAX_BYTES=${boundaryRssMaxBytes}`
        );

        console.log(
            `PUBLIC_FINGERPRINT_SHA256=${publicFingerprintSha256}`
        );

        console.log("TRIAL_RESULT=PASS");
    } finally {
        if (fs.existsSync(witnessFile)) {
            fs.unlinkSync(witnessFile);
        }

        console.log(
            "WITNESS_FILE_RETAINED=NO"
        );
    }
}

main()
    .then(() => {
        setTimeout(
            () => process.exit(0),
            50,
        );
    })
    .catch(error => {
        console.error(
            "TRIAL_RUNNER_ERROR="
            + (
                error?.stack
                || error?.message
                || String(error)
            )
        );

        setTimeout(
            () => process.exit(2),
            50,
        );
    });
