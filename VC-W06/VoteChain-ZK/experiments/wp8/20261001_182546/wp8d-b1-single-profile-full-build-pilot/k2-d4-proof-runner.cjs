const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createRequire } = require("module");

async function main() {
    const [
        front,
        appProfileFile,
        protocolFile,
        baseInputFile,
        wasmFile,
        zkeyFile,
        vkeyFile,
        outputDir,
        runId,
    ] = process.argv.slice(2);

    const req = createRequire(
        path.join(
            front,
            "package.json",
        )
    );

    const circomlib = req(
        "circomlibjs"
    );

    const snarkjs = req(
        "snarkjs"
    );

    const profile = JSON.parse(
        fs.readFileSync(
            appProfileFile,
            "utf8",
        )
    );

    const protocol = JSON.parse(
        fs.readFileSync(
            protocolFile,
            "utf8",
        )
    );

    const base = JSON.parse(
        fs.readFileSync(
            baseInputFile,
            "utf8",
        )
    );

    const vkey = JSON.parse(
        fs.readFileSync(
            vkeyFile,
            "utf8",
        )
    );

    const MAX = 2;
    const DEPTH = 4;

    const FIELD = BigInt(
        profile.fieldModulus
    );

    const SUBORDER = BigInt(
        profile.babyjub.subOrder
    );

    const D_ID = BigInt(
        profile.domains.identity
    );

    const D_NULL = BigInt(
        profile.domains.nullifier
    );

    const D_CTX = BigInt(
        profile.domains.electionContext
    );

    const seedHex =
        protocol
            .randomization
            .masterSyntheticSeed;

    if (
        typeof seedHex !== "string"
        || !/^[0-9a-f]{64}$/i.test(
            seedHex
        )
    ) {
        throw new Error(
            "Frozen public synthetic seed missing"
        );
    }

    const seed = Buffer.from(
        seedHex,
        "hex",
    );

    function deriveBytes(label) {
        return crypto
            .createHmac(
                "sha256",
                seed,
            )
            .update(
                `${runId}|WP8D-B1|${label}`,
                "utf8",
            )
            .digest();
    }

    function deriveBigInt(
        label,
        modulus,
    ) {
        const n = BigInt(
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

    console.log(
        "STAGE=CRYPTO_LIBRARY_INIT_BEGIN"
    );

    const [
        poseidon,
        babyjub,
    ] = await Promise.all([
        circomlib.buildPoseidon(),
        circomlib.buildBabyjub(),
    ]);

    console.log(
        "STAGE=CRYPTO_LIBRARY_INIT_PASS"
    );

    function H(values) {
        return BigInt(
            poseidon.F.toObject(
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

    const secret =
        deriveBigInt(
            "secret",
            FIELD,
        );

    const commitment =
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
            "path"
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
        commitment;

    let leafIndex = 0n;

    for (
        let i = 0;
        i < DEPTH;
        i += 1
    ) {
        if (
            pathBits[i] ===
            0n
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

            leafIndex +=
                1n << BigInt(i);
        }
    }

    const electionId =
        BigInt(
            base.electionId
        );

    const contractDomain =
        BigInt(
            base.contractDomain
        );

    const Yx =
        BigInt(
            base.Yx
        );

    const Yy =
        BigInt(
            base.Yy
        );

    const manifest =
        deriveBigInt(
            "candidate-manifest",
            FIELD,
        );

    const candidateCount =
        2;

    const context =
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

    const nullifier =
        H([
            D_NULL,
            secret,
            electionId,
        ]);

    const Y = [
        babyjub.F.e(
            Yx
        ),
        babyjub.F.e(
            Yy
        ),
    ];

    if (
        typeof babyjub.inCurve ===
            "function"
        && !babyjub.inCurve(
            Y
        )
    ) {
        throw new Error(
            "Election public key is not on BabyJub"
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

    const candidateSlot = 0;

    const bits =
        Array.from(
            {
                length: MAX,
            },
            (
                _unused,
                i,
            ) =>
                i === candidateSlot
                    ? 1n
                    : 0n,
        );

    const randomness = [];
    const Rx = [];
    const Ry = [];
    const Sx = [];
    const Sy = [];

    console.log(
        "STAGE=ENCRYPTION_BEGIN"
    );

    for (
        let slot = 0;
        slot < MAX;
        slot += 1
    ) {
        const r =
            deriveBigInt(
                `randomness:${slot}`,
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
            bits[slot] === 1n
                ? babyjub.Base8
                : identityPoint;

        const S =
            babyjub.addPoint(
                rY,
                message,
            );

        const rp =
            pointBig(
                R
            );

        const sp =
            pointBig(
                S
            );

        Rx.push(
            rp[0]
        );

        Ry.push(
            rp[1]
        );

        Sx.push(
            sp[0]
        );

        Sy.push(
            sp[1]
        );
    }

    console.log(
        "STAGE=ENCRYPTION_PASS"
    );

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
            bits.map(
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
            manifest.toString(),

        candidateCount:
            String(
                candidateCount
            ),

        contractDomain:
            contractDomain.toString(),

        Yx:
            Yx.toString(),

        Yy:
            Yy.toString(),

        electionContextHash:
            context.toString(),

        nullifier:
            nullifier.toString(),

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
    };

    fs.mkdirSync(
        outputDir,
        {
            recursive: true,
        }
    );

    const witness =
        path.join(
            outputDir,
            "compatibility.wtns",
        );

    console.log(
        "STAGE=WITNESS_BEGIN"
    );

    await snarkjs
        .wtns
        .calculate(
            input,
            wasmFile,
            witness,
        );

    console.log(
        "STAGE=WITNESS_PASS"
    );

    const witnessBytes =
        fs.statSync(
            witness
        ).size;

    const witnessHash =
        crypto
            .createHash(
                "sha256"
            )
            .update(
                fs.readFileSync(
                    witness
                )
            )
            .digest(
                "hex"
            );

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
                witness,
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

    console.log(
        `STAGE=VERIFY_${verified ? "PASS" : "FAIL"}`
    );

    if (!verified) {
        throw new Error(
            "K2/D4 compatibility proof failed verification"
        );
    }

    if (
        publicSignals.length !==
        17
    ) {
        throw new Error(
            `Expected 17 public signals; got ${publicSignals.length}`
        );
    }

    fs.writeFileSync(
        path.join(
            outputDir,
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
            outputDir,
            "public.json",
        ),
        JSON.stringify(
            publicSignals,
            null,
            2,
        ) + "\n",
    );

    /*
     * Do not preserve secret/randomness/input or witness.
     * Preserve only witness size/hash and public artifacts.
     */
    fs.unlinkSync(
        witness
    );

    const result = {
        classification:
            "WP8D_B1_COMPATIBILITY_PILOT_ONLY",

        maxCandidates:
            MAX,

        merkleDepth:
            DEPTH,

        capacity:
            2 ** DEPTH,

        candidateCount,
        candidateSlot,

        syntheticLeafIndex:
            Number(
                leafIndex
            ),

        eligibleRoot:
            eligibleRoot.toString(),

        nullifier:
            nullifier.toString(),

        witnessBytes,
        witnessSha256:
            witnessHash,

        publicSignalCount:
            publicSignals.length,

        proofCoordinateCount:
            8,

        proofCoordinatePayloadBytes:
            256,

        verified,

        privateInputPersisted:
            false,

        witnessPersisted:
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
    );

    console.log(
        `PUBLIC_SIGNAL_COUNT=${publicSignals.length}`
    );

    console.log(
        `WITNESS_BYTES=${witnessBytes}`
    );

    console.log(
        "PRIVATE_INPUT_PERSISTED=NO"
    );

    console.log(
        "WITNESS_FILE_RETAINED=NO"
    );

    console.log(
        "COMPATIBILITY_PROOF=PASS"
    );

    /*
     * Avoid the Windows SnarkJS worker-handle hang
     * observed in WP8C.
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
