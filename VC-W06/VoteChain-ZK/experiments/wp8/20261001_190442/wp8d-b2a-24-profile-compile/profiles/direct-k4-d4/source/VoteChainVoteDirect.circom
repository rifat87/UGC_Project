pragma circom 2.2.0;

include "./lib/VoteChainVoteCore.circom";

/*
 * DIRECT ciphertext binding.
 *
 * All submitted ciphertext coordinates are Groth16 public inputs.
 */

template VoteChainVoteDirect(
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

    signal input Rx[MAX_CANDIDATES];
    signal input Ry[MAX_CANDIDATES];
    signal input Sx[MAX_CANDIDATES];
    signal input Sy[MAX_CANDIDATES];

    component core =
        VoteChainVoteCore(
            MAX_CANDIDATES,
            MERKLE_DEPTH
        );

    core.secret <==
        secret;

    core.eligibleRoot <==
        eligibleRoot;

    core.electionId <==
        electionId;

    core.candidateManifestHash <==
        candidateManifestHash;

    core.candidateCount <==
        candidateCount;

    core.contractDomain <==
        contractDomain;

    core.Yx <==
        Yx;

    core.Yy <==
        Yy;

    core.electionContextHash <==
        electionContextHash;

    core.nullifier <==
        nullifier;

    for (
        var d = 0;
        d < MERKLE_DEPTH;
        d++
    ) {
        core.siblings[d] <==
            siblings[d];

        core.pathBits[d] <==
            pathBits[d];
    }

    /*
     * Circom component rule:
     * initialize every core input before reading any core output.
     */
    for (
        var j = 0;
        j < MAX_CANDIDATES;
        j++
    ) {
        core.bit[j] <==
            bit[j];

        core.randomness[j] <==
            randomness[j];
    }

    for (
        var k = 0;
        k < MAX_CANDIDATES;
        k++
    ) {
        Rx[k] ===
            core.Rx[k];

        Ry[k] ===
            core.Ry[k];

        Sx[k] ===
            core.Sx[k];

        Sy[k] ===
            core.Sy[k];
    }
}

component main {
    public [
        eligibleRoot,
        electionId,
        candidateManifestHash,
        candidateCount,
        contractDomain,
        Yx,
        Yy,
        electionContextHash,
        nullifier,
        Rx,
        Ry,
        Sx,
        Sy
    ]
} = VoteChainVoteDirect(
    VC_MAX_CANDIDATES(),
    VC_MERKLE_DEPTH()
);
