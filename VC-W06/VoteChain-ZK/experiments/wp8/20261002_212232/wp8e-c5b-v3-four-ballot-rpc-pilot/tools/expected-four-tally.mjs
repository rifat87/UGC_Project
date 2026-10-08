import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const [, , root, corpus, output] = process.argv;

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

const F =
    babyjub.F;

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

for (let n = 1; n <= 4; n++) {

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
        x.bit.map(Number).indexOf(1);

    candidateCounts[selected]++;

    for (let slot = 0; slot < 16; slot++) {

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
}

const slots =
    Array.from(
        { length: 16 },
        (_, slot) => {

            const R =
                pointBig(aggR[slot]);

            const S =
                pointBig(aggS[slot]);

            return {
                slot,
                Rx: R[0],
                Ry: R[1],
                Sx: S[0],
                Sy: S[1]
            };
        }
    );

fs.writeFileSync(
    output,
    JSON.stringify(
        {
            acceptedBallotCount: 4,
            candidatePlaintextCounts:
                candidateCounts,
            slots
        },
        null,
        2
    ) + "\n"
);

console.log(
    "EXPECTED_CANDIDATE_COUNTS=" +
    candidateCounts.join(",")
);

console.log(
    "EXPECTED_FOUR_BALLOT_TALLY_BUILD=PASS"
);
