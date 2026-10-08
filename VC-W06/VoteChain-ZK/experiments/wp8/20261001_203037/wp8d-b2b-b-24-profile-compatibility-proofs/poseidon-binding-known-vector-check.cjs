const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

function loaders(front, cryptoRoot) {
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
            // Try next package root.
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

function pair(value) {
    if (
        Array.isArray(value)
        && value.length >= 2
    ) {
        return [
            BigInt(value[0]),
            BigInt(value[1]),
        ];
    }

    if (
        value
        && typeof value === "object"
    ) {
        if (
            value.x !== undefined
            && value.y !== undefined
        ) {
            return [
                BigInt(value.x),
                BigInt(value.y),
            ];
        }

        if (
            value.X !== undefined
            && value.Y !== undefined
        ) {
            return [
                BigInt(value.X),
                BigInt(value.Y),
            ];
        }

        if (
            value[0] !== undefined
            && value[1] !== undefined
        ) {
            return [
                BigInt(value[0]),
                BigInt(value[1]),
            ];
        }
    }

    throw new Error(
        "Unsupported point encoding in known vector"
    );
}

function ciphertextCoords(c) {
    if (
        Array.isArray(c)
        && c.length === 4
        && !Array.isArray(c[0])
    ) {
        return c.map(
            x => BigInt(x)
        );
    }

    if (
        Array.isArray(c)
        && c.length >= 2
    ) {
        const R = pair(c[0]);
        const S = pair(c[1]);

        return [
            R[0],
            R[1],
            S[0],
            S[1],
        ];
    }

    if (
        c
        && typeof c === "object"
    ) {
        if (
            c.Rx !== undefined
            && c.Ry !== undefined
            && c.Sx !== undefined
            && c.Sy !== undefined
        ) {
            return [
                BigInt(c.Rx),
                BigInt(c.Ry),
                BigInt(c.Sx),
                BigInt(c.Sy),
            ];
        }

        if (
            c.R !== undefined
            && c.S !== undefined
        ) {
            const R = pair(c.R);
            const S = pair(c.S);

            return [
                R[0],
                R[1],
                S[0],
                S[1],
            ];
        }

        if (
            c.r !== undefined
            && c.s !== undefined
        ) {
            const R = pair(c.r);
            const S = pair(c.s);

            return [
                R[0],
                R[1],
                S[0],
                S[1],
            ];
        }
    }

    throw new Error(
        "Unsupported ciphertext encoding in known vector"
    );
}

async function main() {
    const [
        front,
        cryptoRoot,
        profileFile,
        vectorFile,
    ] = process.argv.slice(2);

    const load = loaders(
        front,
        cryptoRoot,
    );

    const circomlib = load(
        "circomlibjs"
    );

    const poseidon =
        await circomlib.buildPoseidon();

    const profile = JSON.parse(
        fs.readFileSync(
            profileFile,
            "utf8",
        )
    );

    const vector = JSON.parse(
        fs.readFileSync(
            vectorFile,
            "utf8",
        )
    );

    const D_BIND = BigInt(
        profile.domains.ciphertextBinding
    );

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

    if (
        !Array.isArray(
            vector.ciphertexts
        )
        || vector.ciphertexts.length === 0
    ) {
        throw new Error(
            "Known vector ciphertexts missing"
        );
    }

    let state = D_BIND;

    for (
        const ciphertext
        of vector.ciphertexts
    ) {
        const [
            Rx,
            Ry,
            Sx,
            Sy,
        ] =
            ciphertextCoords(
                ciphertext
            );

        state = H([
            state,
            Rx,
            Ry,
            Sx,
            Sy,
        ]);
    }

    const expected =
        BigInt(
            vector.bindingDigest
        );

    console.log(
        `KNOWN_VECTOR_CIPHERTEXT_COUNT=${vector.ciphertexts.length}`
    );

    console.log(
        `KNOWN_VECTOR_EXPECTED_BINDING_DIGEST=${expected}`
    );

    console.log(
        `KNOWN_VECTOR_RECOMPUTED_BINDING_DIGEST=${state}`
    );

    if (state !== expected) {
        throw new Error(
            "Poseidon ciphertext-binding chain does not match accepted WP3 known vector"
        );
    }

    console.log(
        "POSEIDON_BINDING_KNOWN_VECTOR_SELF_CHECK=PASS"
    );
}

main().then(
    () => {
        setTimeout(
            () => process.exit(0),
            50,
        );
    }
).catch(
    error => {
        console.error(
            "BINDING_CHECK_ERROR="
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
    }
);
