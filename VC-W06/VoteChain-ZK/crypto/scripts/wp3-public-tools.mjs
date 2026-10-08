import fs from "node:fs";

const [
    ,
    ,
    command,
    ...args
] = process.argv;

function loadJson(file) {
    return JSON.parse(
        fs.readFileSync(
            file,
            "utf8"
        )
    );
}

function saveJson(
    file,
    value
) {
    fs.writeFileSync(
        file,
        JSON.stringify(
            value,
            null,
            2
        ) + "\n"
    );
}

function publicIndex(
    symPath,
    target
) {
    const rows =
        fs
            .readFileSync(
                symPath,
                "utf8"
            )
            .trim()
            .split(/\r?\n/)
            .filter(Boolean)
            .map(line => {
                const parts =
                    line.split(",");

                return {
                    witness:
                        Number(
                            parts[1]
                        ),

                    name:
                        parts
                            .slice(3)
                            .join(",")
                };
            });

    const matches =
        rows.filter(
            row =>
                row.name ===
                    target ||
                row.name.endsWith(
                    target
                )
        );

    if (
        matches.length !==
        1
    ) {
        throw new Error(
            `Expected exactly one .sym match for ${target}; got ${matches.length}`
        );
    }

    const witness =
        matches[0].witness;

    if (
        !Number.isInteger(
            witness
        ) ||
        witness <= 0
    ) {
        throw new Error(
            `Invalid witness index for ${target}`
        );
    }

    return (
        witness - 1
    );
}

if (
    command ===
    "delta"
) {
    const [
        sym,
        publicPath,
        outputPath,
        signalName,
        deltaString
    ] = args;

    const pub =
        loadJson(
            publicPath
        );

    const index =
        publicIndex(
            sym,
            signalName
        );

    if (
        index >=
        pub.length
    ) {
        throw new Error(
            `${signalName} is not a public signal`
        );
    }

    pub[index] =
        (
            BigInt(
                pub[index]
            ) +
            BigInt(
                deltaString
            )
        ).toString();

    saveJson(
        outputPath,
        pub
    );
}
else if (
    command ===
    "set"
) {
    const [
        sym,
        publicPath,
        outputPath,
        signalName,
        value
    ] = args;

    const pub =
        loadJson(
            publicPath
        );

    const index =
        publicIndex(
            sym,
            signalName
        );

    if (
        index >=
        pub.length
    ) {
        throw new Error(
            `${signalName} is not a public signal`
        );
    }

    pub[index] =
        String(value);

    saveJson(
        outputPath,
        pub
    );
}
else if (
    command ===
    "trim"
) {
    const [
        publicPath,
        outputPath
    ] = args;

    const pub =
        loadJson(
            publicPath
        );

    pub.pop();

    saveJson(
        outputPath,
        pub
    );
}
else if (
    command ===
    "corrupt-proof"
) {
    const [
        proofPath,
        outputPath
    ] = args;

    const proof =
        loadJson(
            proofPath
        );

    proof.pi_a[0] =
        (
            BigInt(
                proof.pi_a[0]
            ) +
            1n
        ).toString();

    saveJson(
        outputPath,
        proof
    );
}
else {
    throw new Error(
        `Unknown command: ${command}`
    );
}

console.log(
    "WP3_PUBLIC_TOOL=PASS"
);
