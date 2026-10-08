import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const [, , root, corpus, output] =
    process.argv;

const req =
    createRequire(
        path.join(
            root,
            "crypto",
            "package.json"
        )
    );

const entry =
    req.resolve("circomlibjs");

const pkg =
    await import(
        pathToFileURL(entry).href
    );

const buildBabyjub =
    pkg.buildBabyjub ??
    pkg.default?.buildBabyjub;

const babyjub =
    await buildBabyjub();

const F = babyjub.F;

function point(x, y) {
    return [
        F.e(BigInt(x)),
        F.e(BigInt(y))
    ];
}

function pointBig(P) {
    return [
        F.toObject(P[0]).toString(),
        F.toObject(P[1]).toString()
    ];
}

const scales =
    new Set([25, 50, 75, 100, 150]);

const expectedCounts = {
    "25":  [7, 6, 6, 6],
    "50":  [13, 13, 12, 12],
    "75":  [19, 19, 19, 18],
    "100": [25, 25, 25, 25],
    "150": [38, 38, 37, 37],
};

const aggR =
    Array.from(
        { length: 16 },
        () => point(0, 1)
    );

const aggS =
    Array.from(
        { length: 16 },
        () => point(0, 1)
    );

const candidateCounts =
    [0, 0, 0, 0];

const checkpoints = {};

for (let n = 1; n <= 150; n++) {

    const id =
        String(n).padStart(3, "0");

    const x =
        JSON.parse(
            fs.readFileSync(
                path.join(
                    corpus,
                    "inputs",
                    `direct-${id}.json`
                ),
                "utf8"
            )
        );

    const selected =
        x.bit
            .map(Number)
            .indexOf(1);

    if (
        selected < 0 ||
        selected >= 4
    ) {
        throw new Error(
            `invalid selected index ${selected}`
        );
    }

    candidateCounts[selected]++;

    for (
        let slot = 0;
        slot < 16;
        slot++
    ) {

        aggR[slot] =
            babyjub.addPoint(
                aggR[slot],
                point(
                    x.Rx[slot],
                    x.Ry[slot]
                )
            );

        aggS[slot] =
            babyjub.addPoint(
                aggS[slot],
                point(
                    x.Sx[slot],
                    x.Sy[slot]
                )
            );
    }

    if (scales.has(n)) {

        const key = String(n);

        if (
            JSON.stringify(candidateCounts)
            !==
            JSON.stringify(
                expectedCounts[key]
            )
        ) {
            throw new Error(
                `candidate distribution mismatch at ${n}`
            );
        }

        checkpoints[key] = {
            acceptedBallotCount: n,
            candidatePlaintextCounts:
                [...candidateCounts],
            slots:
                Array.from(
                    { length: 16 },
                    (_, slot) => {
                        const R =
                            pointBig(
                                aggR[slot]
                            );

                        const S =
                            pointBig(
                                aggS[slot]
                            );

                        return {
                            slot,
                            Rx: R[0],
                            Ry: R[1],
                            Sx: S[0],
                            Sy: S[1],
                        };
                    }
                ),
        };
    }
}

fs.writeFileSync(
    output,
    JSON.stringify(
        {
            scales:
                [25, 50, 75, 100, 150],
            checkpoints,
        },
        null,
        2
    ) + "\n"
);

console.log(
    "PREFIX_TALLY_SCALES=25,50,75,100,150"
);

console.log(
    "PREFIX_TALLY_SLOT_COUNT_PER_SCALE=16"
);

console.log(
    "PREFIX_TALLY_BUILD=PASS"
);
