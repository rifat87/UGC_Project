pragma circom 2.2.0;

include "../config/VoteChainBuildProfile.circom";

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/compconstant.circom";
include "circomlib/circuits/gates.circom";
include "circomlib/circuits/babyjub.circom";
include "circomlib/circuits/escalarmulfix.circom";
include "circomlib/circuits/escalarmulany.circom";

/*
 * VoteChain-ZK full voting statement core.
 *
 * PRIVATE:
 *   secret
 *   siblings[]
 *   pathBits[]
 *   bit[]
 *   randomness[]
 *
 * PUBLIC:
 *   supplied by wrapper:
 *   eligibleRoot
 *   electionId
 *   candidateManifestHash
 *   candidateCount
 *   contractDomain
 *   Yx/Yy
 *   electionContextHash
 *   nullifier
 *
 * Core proves:
 *   identity commitment
 *   Merkle membership
 *   election nullifier
 *   election-context binding
 *   candidate-count range
 *   binary/padded/one-hot ballot
 *   BabyJub public-key validation
 *   prime-subgroup membership
 *   nonzero in-range randomness
 *   exponential ElGamal correctness
 */

template VoteChainVoteCore(
    MAX_CANDIDATES,
    MERKLE_DEPTH
) {
    signal input secret;

    signal input siblings[MERKLE_DEPTH];
    signal input pathBits[MERKLE_DEPTH];

    signal input bit[MAX_CANDIDATES];
    signal input randomness[MAX_CANDIDATES];

    signal input eligibleRoot;

    signal input electionId;
    signal input candidateManifestHash;
    signal input candidateCount;
    signal input contractDomain;

    signal input Yx;
    signal input Yy;

    signal input electionContextHash;
    signal input nullifier;

    signal output Rx[MAX_CANDIDATES];
    signal output Ry[MAX_CANDIDATES];
    signal output Sx[MAX_CANDIDATES];
    signal output Sy[MAX_CANDIDATES];

    /*
     * Secret must not be zero.
     */
    component secretZero = IsZero();

    secretZero.in <== secret;
    secretZero.out === 0;

    /*
     * identityCommitment =
     * Poseidon(DOMAIN_IDENTITY, secret)
     */
    component identityCommitment =
        Poseidon(2);

    identityCommitment.inputs[0] <==
        VC_DOMAIN_IDENTITY();

    identityCommitment.inputs[1] <==
        secret;

    /*
     * Poseidon binary Merkle membership.
     */
    signal current[MERKLE_DEPTH + 1];
    signal left[MERKLE_DEPTH];
    signal right[MERKLE_DEPTH];

    component merkleHash[MERKLE_DEPTH];

    current[0] <==
        identityCommitment.out;

    for (
        var level = 0;
        level < MERKLE_DEPTH;
        level++
    ) {
        pathBits[level] *
        (
            pathBits[level] - 1
        ) === 0;

        left[level] <==
            current[level] +
            pathBits[level] *
            (
                siblings[level] -
                current[level]
            );

        right[level] <==
            siblings[level] +
            pathBits[level] *
            (
                current[level] -
                siblings[level]
            );

        merkleHash[level] =
            Poseidon(2);

        merkleHash[level].inputs[0] <==
            left[level];

        merkleHash[level].inputs[1] <==
            right[level];

        current[level + 1] <==
            merkleHash[level].out;
    }

    current[MERKLE_DEPTH] ===
        eligibleRoot;

    /*
     * Election-scoped nullifier =
     * Poseidon(
     *   DOMAIN_NULLIFIER,
     *   secret,
     *   electionId
     * )
     */
    component nullifierHash =
        Poseidon(3);

    nullifierHash.inputs[0] <==
        VC_DOMAIN_NULLIFIER();

    nullifierHash.inputs[1] <==
        secret;

    nullifierHash.inputs[2] <==
        electionId;

    nullifierHash.out ===
        nullifier;

    /*
     * Bind election configuration:
     *
     * Poseidon(
     *   DOMAIN_ELECTION_CONTEXT,
     *   electionId,
     *   candidateManifestHash,
     *   candidateCount,
     *   contractDomain,
     *   Yx,
     *   Yy
     * )
     */
    component electionContext =
        Poseidon(7);

    electionContext.inputs[0] <==
        VC_DOMAIN_ELECTION_CONTEXT();

    electionContext.inputs[1] <==
        electionId;

    electionContext.inputs[2] <==
        candidateManifestHash;

    electionContext.inputs[3] <==
        candidateCount;

    electionContext.inputs[4] <==
        contractDomain;

    electionContext.inputs[5] <==
        Yx;

    electionContext.inputs[6] <==
        Yy;

    electionContext.out ===
        electionContextHash;

    /*
     * candidateCount:
     *   1 <= candidateCount <= 16
     */
    component candidateCountBits =
        Num2Bits(5);

    candidateCountBits.in <==
        candidateCount;

    component candidateCountZero =
        IsZero();

    candidateCountZero.in <==
        candidateCount;

    candidateCountZero.out === 0;

    component candidateCountLt17 =
        LessThan(5);

    candidateCountLt17.in[0] <==
        candidateCount;

    candidateCountLt17.in[1] <==
        17;

    candidateCountLt17.out === 1;

    /*
     * Validate election public key:
     *
     * 1. on BabyJub curve
     * 2. not identity
     * 3. prime-subgroup member:
     *      subOrder * Y == identity
     */
    component checkY =
        BabyCheck();

    checkY.x <==
        Yx;

    checkY.y <==
        Yy;

    component zeroY =
        IsZero();

    zeroY.in <==
        Yx;

    zeroY.out === 0;

    component subgroupScalarBits =
        Num2Bits(253);

    subgroupScalarBits.in <==
        VC_BABYJUB_SUBORDER();

    component subgroupCheck =
        EscalarMulAny(253);

    for (
        var sb = 0;
        sb < 253;
        sb++
    ) {
        subgroupCheck.e[sb] <==
            subgroupScalarBits.out[sb];
    }

    subgroupCheck.p[0] <==
        Yx;

    subgroupCheck.p[1] <==
        Yy;

    /*
     * BabyJub identity = (0, 1)
     */
    subgroupCheck.out[0] === 0;
    subgroupCheck.out[1] === 1;

    var G[2] = [
        VC_BABYJUB_BASE8_X(),
        VC_BABYJUB_BASE8_Y()
    ];

    signal bitSum[MAX_CANDIDATES + 1];

    bitSum[0] <== 0;

    component active[MAX_CANDIDATES];

    component zeroR[MAX_CANDIDATES];
    component rBits[MAX_CANDIDATES];
    component rRange[MAX_CANDIDATES];

    component rG[MAX_CANDIDATES];
    component rY[MAX_CANDIDATES];
    component addPoint[MAX_CANDIDATES];

    signal messageX[MAX_CANDIDATES];
    signal messageY[MAX_CANDIDATES];

    for (
        var j = 0;
        j < MAX_CANDIDATES;
        j++
    ) {
        /*
         * bit[j] is Boolean.
         */
        bit[j] *
        (
            bit[j] - 1
        ) === 0;

        /*
         * active[j] = (j < candidateCount)
         */
        active[j] =
            LessThan(5);

        active[j].in[0] <==
            j;

        active[j].in[1] <==
            candidateCount;

        /*
         * Padding slots must be zero.
         */
        bit[j] *
        (
            1 -
            active[j].out
        ) === 0;

        bitSum[j + 1] <==
            bitSum[j] +
            bit[j];

        /*
         * 1 <= randomness[j] < BabyJub subOrder
         */
        zeroR[j] =
            IsZero();

        zeroR[j].in <==
            randomness[j];

        zeroR[j].out === 0;

        rBits[j] =
            Num2Bits(253);

        rBits[j].in <==
            randomness[j];

        rRange[j] =
            CompConstant(
                VC_BABYJUB_SUBORDER_MINUS_ONE()
            );

        for (
            var rb = 0;
            rb < 253;
            rb++
        ) {
            rRange[j].in[rb] <==
                rBits[j].out[rb];
        }

        rRange[j].in[253] <==
            0;

        rRange[j].out ===
            0;

        /*
         * R_j = r_j G
         */
        rG[j] =
            EscalarMulFix(
                253,
                G
            );

        for (
            var rg = 0;
            rg < 253;
            rg++
        ) {
            rG[j].e[rg] <==
                rBits[j].out[rg];
        }

        Rx[j] <==
            rG[j].out[0];

        Ry[j] <==
            rG[j].out[1];

        /*
         * r_j Y
         */
        rY[j] =
            EscalarMulAny(253);

        for (
            var ry = 0;
            ry < 253;
            ry++
        ) {
            rY[j].e[ry] <==
                rBits[j].out[ry];
        }

        rY[j].p[0] <==
            Yx;

        rY[j].p[1] <==
            Yy;

        /*
         * Encode bit as:
         *   0 -> identity (0,1)
         *   1 -> G
         */
        messageX[j] <==
            bit[j] *
            G[0];

        messageY[j] <==
            1 +
            bit[j] *
            (
                G[1] - 1
            );

        /*
         * S_j = r_j Y + bit_j G
         */
        addPoint[j] =
            BabyAdd();

        addPoint[j].x1 <==
            rY[j].out[0];

        addPoint[j].y1 <==
            rY[j].out[1];

        addPoint[j].x2 <==
            messageX[j];

        addPoint[j].y2 <==
            messageY[j];

        Sx[j] <==
            addPoint[j].xout;

        Sy[j] <==
            addPoint[j].yout;
    }

    /*
     * Exactly one active candidate.
     */
    bitSum[MAX_CANDIDATES] ===
        1;
}
