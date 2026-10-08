import { createHash } from "node:crypto";
import {
    buildBabyjub,
    buildPoseidon
} from "circomlibjs";

export const PROFILE = Object.freeze({
    profileId: "votechain-zk-wp2-finalmetrics-v1",
    merkleDepth: 4,
    maxCandidates: 4,
    threshold: 3,
    trustees: 5,
    identityDomain: "VOTECHAIN_ZK_IDENTITY_V1",
    nullifierDomain: "VOTECHAIN_ZK_NULLIFIER_V1",
    dleqDomain: "VOTECHAIN_ZK_DLEQ_V1",
    pointEncoding:
        "affine-x-y-32byte-big-endian-per-coordinate"
});

export function mod(a, m) {
    const r = BigInt(a) % BigInt(m);
    return r >= 0n ? r : r + BigInt(m);
}

function egcd(a, b) {
    let r0 = BigInt(a);
    let r1 = BigInt(b);
    let s0 = 1n;
    let s1 = 0n;

    while (r1 !== 0n) {
        const q = r0 / r1;

        [r0, r1] = [
            r1,
            r0 - q * r1
        ];

        [s0, s1] = [
            s1,
            s0 - q * s1
        ];
    }

    return [r0, s0];
}

export function modInv(a, m) {
    const [g, s] = egcd(mod(a, m), BigInt(m));

    if (g !== 1n)
        throw new Error("no modular inverse");

    return mod(s, m);
}

let cachedPoseidon;
let cachedBaby;

export async function context() {
    if (!cachedPoseidon)
        cachedPoseidon = await buildPoseidon();

    if (!cachedBaby)
        cachedBaby = await buildBabyjub();

    return {
        poseidon: cachedPoseidon,
        baby: cachedBaby,
        F: cachedBaby.F,
        q: BigInt(cachedBaby.subOrder.toString()),
        G: cachedBaby.Base8
    };
}

export const identityPoint =
    c => [c.F.e(0n), c.F.e(1n)];

export const add =
    (c, a, b) => c.baby.addPoint(a, b);

export const neg =
    (c, p) => [c.F.neg(p[0]), p[1]];

export const mul =
    (c, p, s) =>
        c.baby.mulPointEscalar(
            p,
            mod(s, c.q)
        );

export const eq =
    (c, a, b) =>
        c.F.eq(a[0], b[0]) &&
        c.F.eq(a[1], b[1]);

export function pointInts(c, p) {
    return [
        BigInt(
            c.F.toObject(p[0]).toString()
        ),
        BigInt(
            c.F.toObject(p[1]).toString()
        )
    ];
}

export const serializePoint =
    (c, p) => pointInts(c, p).map(String);

async function labelField(label) {
    const c = await context();

    const digest =
        createHash("sha256")
            .update(label, "utf8")
            .digest("hex");

    const x = BigInt(`0x${digest}`);

    return BigInt(
        c.poseidon.F
            .toObject(
                c.poseidon.F.e(x)
            )
            .toString()
    );
}

export async function poseidon(values) {
    const c = await context();

    const out =
        c.poseidon(
            values.map(BigInt)
        );

    return BigInt(
        c.poseidon.F
            .toObject(out)
            .toString()
    );
}

export async function domains() {
    return {
        identity:
            await labelField(
                PROFILE.identityDomain
            ),

        nullifier:
            await labelField(
                PROFILE.nullifierDomain
            ),

        dleq:
            await labelField(
                PROFILE.dleqDomain
            )
    };
}

async function poseidonChain(domain, values) {
    let state = BigInt(domain);

    for (const v of values)
        state =
            await poseidon([
                state,
                BigInt(v)
            ]);

    return state;
}

export async function identityCommitment(secret) {
    const d = await domains();

    return poseidon([
        d.identity,
        BigInt(secret)
    ]);
}

export async function electionNullifier(
    secret,
    electionId
) {
    const d = await domains();

    return poseidon([
        d.nullifier,
        BigInt(secret),
        BigInt(electionId)
    ]);
}

export async function buildMerkleTree(
    leaves,
    depth = PROFILE.merkleDepth
) {
    const capacity = 2 ** depth;

    if (leaves.length > capacity)
        throw new Error(
            "too many Merkle leaves"
        );

    const levels = [];

    let current =
        Array.from(
            { length: capacity },
            (_, i) =>
                i < leaves.length
                    ? BigInt(leaves[i])
                    : 0n
        );

    levels.push(current);

    for (
        let level = 0;
        level < depth;
        level++
    ) {
        const next = [];

        for (
            let i = 0;
            i < current.length;
            i += 2
        ) {
            next.push(
                await poseidon([
                    current[i],
                    current[i + 1]
                ])
            );
        }

        levels.push(next);
        current = next;
    }

    return {
        depth,
        capacity,
        levels,
        root: current[0]
    };
}

export function merkleProof(tree, index) {
    const siblings = [];
    const pathBits = [];

    let i = index;

    for (
        let level = 0;
        level < tree.depth;
        level++
    ) {
        siblings.push(
            tree.levels[level][i ^ 1]
        );

        pathBits.push(
            i & 1
        );

        i >>= 1;
    }

    return {
        siblings,
        pathBits
    };
}

export async function verifyMerkle(
    leaf,
    proof,
    expectedRoot
) {
    let acc = BigInt(leaf);

    for (
        let i = 0;
        i < proof.siblings.length;
        i++
    ) {
        const sibling =
            BigInt(
                proof.siblings[i]
            );

        if (proof.pathBits[i] === 0)
            acc =
                await poseidon([
                    acc,
                    sibling
                ]);

        else if (
            proof.pathBits[i] === 1
        )
            acc =
                await poseidon([
                    sibling,
                    acc
                ]);

        else
            return false;
    }

    return (
        acc ===
        BigInt(expectedRoot)
    );
}

export function encryptBit(
    c,
    publicKey,
    bit,
    randomness
) {
    const b = BigInt(bit);
    const r = BigInt(randomness);

    if (
        b !== 0n &&
        b !== 1n
    )
        throw new Error(
            "bit must be 0 or 1"
        );

    if (
        r <= 0n ||
        r >= c.q
    )
        throw new Error(
            "invalid ElGamal randomness"
        );

    const R =
        mul(
            c,
            c.G,
            r
        );

    const M =
        b === 0n
            ? identityPoint(c)
            : c.G;

    const S =
        add(
            c,
            mul(
                c,
                publicKey,
                r
            ),
            M
        );

    return {
        R,
        S
    };
}

export function addCiphertexts(
    c,
    a,
    b
) {
    return {
        R:
            add(
                c,
                a.R,
                b.R
            ),

        S:
            add(
                c,
                a.S,
                b.S
            )
    };
}

export function aggregate(
    c,
    ciphertexts
) {
    return ciphertexts.reduce(
        (acc, item) =>
            addCiphertexts(
                c,
                acc,
                item
            ),
        {
            R: identityPoint(c),
            S: identityPoint(c)
        }
    );
}

export function zeroTally(c, K) {
    return Array.from(
        { length: K },
        () => ({
            R: identityPoint(c),
            S: identityPoint(c)
        })
    );
}

export function addEncryptedBallot(
    c,
    tally,
    ballot
) {
    if (
        tally.length !==
        ballot.length
    )
        throw new Error(
            "candidate-slot mismatch"
        );

    return tally.map(
        (slot, i) =>
            addCiphertexts(
                c,
                slot,
                ballot[i]
            )
    );
}

export function boundedDecode(
    c,
    encoded,
    maxCount
) {
    for (
        let i = 0;
        i <= maxCount;
        i++
    ) {
        const candidate =
            i === 0
                ? identityPoint(c)
                : mul(
                    c,
                    c.G,
                    BigInt(i)
                );

        if (
            eq(
                c,
                encoded,
                candidate
            )
        )
            return i;
    }

    throw new Error(
        "outside tally bound"
    );
}

function evalPolynomial(
    coefficients,
    x,
    q
) {
    let acc = 0n;
    let power = 1n;

    for (
        const coefficient
        of coefficients
    ) {
        acc =
            mod(
                acc +
                mod(
                    coefficient,
                    q
                ) *
                power,
                q
            );

        power =
            mod(
                power * x,
                q
            );
    }

    return acc;
}

function publicPolynomialAt(
    c,
    commitments,
    x
) {
    let out =
        identityPoint(c);

    let power = 1n;

    for (
        const commitment
        of commitments
    ) {
        out =
            add(
                c,
                out,
                mul(
                    c,
                    commitment,
                    power
                )
            );

        power =
            mod(
                power * x,
                c.q
            );
    }

    return out;
}

/*
 * Multi-party polynomial-contribution
 * threshold PoC.
 *
 * The combined private election key is
 * NOT calculated or returned.
 */
export function runDkgPoc(
    c,
    participantPolynomials,
    threshold,
    trusteeCount
) {
    if (
        participantPolynomials.length !==
        trusteeCount
    )
        throw new Error(
            "DKG participant mismatch"
        );

    const participants =
        participantPolynomials.map(
            (poly, index) => {
                if (
                    poly.length !==
                    threshold
                )
                    throw new Error(
                        "polynomial degree mismatch"
                    );

                const coefficients =
                    poly.map(
                        x =>
                            mod(
                                x,
                                c.q
                            )
                    );

                if (
                    coefficients[0] ===
                    0n
                )
                    throw new Error(
                        "zero DKG contribution"
                    );

                return {
                    id: index + 1,

                    coefficients,

                    commitments:
                        coefficients.map(
                            x =>
                                mul(
                                    c,
                                    c.G,
                                    x
                                )
                        )
                };
            }
        );

    let publicKey =
        identityPoint(c);

    for (
        const participant
        of participants
    ) {
        publicKey =
            add(
                c,
                publicKey,
                participant
                    .commitments[0]
            );
    }

    const shares = [];

    for (
        let recipient = 1;
        recipient <= trusteeCount;
        recipient++
    ) {
        let share = 0n;

        for (
            const participant
            of participants
        ) {
            share =
                mod(
                    share +
                    evalPolynomial(
                        participant
                            .coefficients,
                        BigInt(
                            recipient
                        ),
                        c.q
                    ),
                    c.q
                );
        }

        const publicShare =
            mul(
                c,
                c.G,
                share
            );

        let expected =
            identityPoint(c);

        for (
            const participant
            of participants
        ) {
            expected =
                add(
                    c,
                    expected,
                    publicPolynomialAt(
                        c,
                        participant
                            .commitments,
                        BigInt(
                            recipient
                        )
                    )
                );
        }

        if (
            !eq(
                c,
                publicShare,
                expected
            )
        )
            throw new Error(
                `DKG commitment verification failed for ${recipient}`
            );

        shares.push({
            id: recipient,
            share,
            publicShare
        });
    }

    return {
        mode:
            "multi-party-polynomial-contribution-dkg-poc",

        threshold,

        trusteeCount,

        publicKey,

        participantCommitments:
            participants.map(
                p => ({
                    id: p.id,
                    commitments:
                        p.commitments
                })
            ),

        shares
    };
}

export const partialDecrypt =
    (c, R, share) =>
        mul(
            c,
            R,
            BigInt(share)
        );

function lagrangeZero(
    id,
    ids,
    q
) {
    const i = BigInt(id);

    let numerator = 1n;
    let denominator = 1n;

    for (
        const other
        of ids
    ) {
        if (
            other === id
        )
            continue;

        const j =
            BigInt(other);

        numerator =
            mod(
                numerator *
                (-j),
                q
            );

        denominator =
            mod(
                denominator *
                (i - j),
                q
            );
    }

    return mod(
        numerator *
        modInv(
            denominator,
            q
        ),
        q
    );
}

export function combinePartials(
    c,
    partials,
    threshold
) {
    if (
        partials.length <
        threshold
    )
        throw new Error(
            `need at least ${threshold} shares`
        );

    const ids =
        partials.map(
            p => p.id
        );

    if (
        new Set(ids).size !==
        ids.length
    )
        throw new Error(
            "duplicate trustee"
        );

    let D =
        identityPoint(c);

    for (
        const item
        of partials
    ) {
        const lambda =
            lagrangeZero(
                item.id,
                ids,
                c.q
            );

        D =
            add(
                c,
                D,
                mul(
                    c,
                    item.partial,
                    lambda
                )
            );
    }

    return D;
}

export function thresholdDecrypt(
    c,
    ciphertext,
    partials,
    threshold
) {
    const D =
        combinePartials(
            c,
            partials,
            threshold
        );

    return add(
        c,
        ciphertext.S,
        neg(
            c,
            D
        )
    );
}

async function challenge(
    c,
    publicShare,
    R,
    partial,
    A1,
    A2
) {
    const d =
        await domains();

    const values = [
        ...pointInts(c, c.G),
        ...pointInts(c, publicShare),
        ...pointInts(c, R),
        ...pointInts(c, partial),
        ...pointInts(c, A1),
        ...pointInts(c, A2)
    ];

    return mod(
        await poseidonChain(
            d.dleq,
            values
        ),
        c.q
    );
}

export async function provePartial(
    c,
    R,
    share,
    publicShare,
    partial,
    nonce
) {
    const x =
        mod(
            share,
            c.q
        );

    const w =
        mod(
            nonce,
            c.q
        );

    if (w === 0n)
        throw new Error(
            "zero DLEQ nonce"
        );

    const A1 =
        mul(
            c,
            c.G,
            w
        );

    const A2 =
        mul(
            c,
            R,
            w
        );

    const e =
        await challenge(
            c,
            publicShare,
            R,
            partial,
            A1,
            A2
        );

    return {
        A1,
        A2,
        challenge: e,
        response:
            mod(
                w +
                e * x,
                c.q
            )
    };
}

export async function verifyPartial(
    c,
    R,
    publicShare,
    partial,
    proof
) {
    const e =
        await challenge(
            c,
            publicShare,
            R,
            partial,
            proof.A1,
            proof.A2
        );

    if (
        e !==
        mod(
            proof.challenge,
            c.q
        )
    )
        return false;

    const lhs1 =
        mul(
            c,
            c.G,
            proof.response
        );

    const rhs1 =
        add(
            c,
            proof.A1,
            mul(
                c,
                publicShare,
                e
            )
        );

    const lhs2 =
        mul(
            c,
            R,
            proof.response
        );

    const rhs2 =
        add(
            c,
            proof.A2,
            mul(
                c,
                partial,
                e
            )
        );

    return (
        eq(
            c,
            lhs1,
            rhs1
        ) &&
        eq(
            c,
            lhs2,
            rhs2
        )
    );
}
