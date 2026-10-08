pragma circom 2.2.0;

include "./lib/VoteChainVoteCore.circom";

/*
 * POSEIDON ciphertext binding.
 *
 * Contract will later recompute the same digest from submitted ciphertexts.
 *
 * The ciphertext coordinates themselves do not become Groth16 public inputs.
 */

template VoteChainVoteDigest(
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

    signal input bindingDigest;

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

    signal bindingState[MAX_CANDIDATES + 1];

    component bindingHash[MAX_CANDIDATES];

    bindingState[0] <==
        VC_DOMAIN_CIPHERTEXT_BINDING();

    for (
        var k = 0;
        k < MAX_CANDIDATES;
        k++
    ) {
        bindingHash[k] =
            Poseidon(5);

        bindingHash[k].inputs[0] <==
            bindingState[k];

        bindingHash[k].inputs[1] <==
            core.Rx[k];

        bindingHash[k].inputs[2] <==
            core.Ry[k];

        bindingHash[k].inputs[3] <==
            core.Sx[k];

        bindingHash[k].inputs[4] <==
            core.Sy[k];

        bindingState[k + 1] <==
            bindingHash[k].out;
    }

    bindingState[MAX_CANDIDATES] ===
        bindingDigest;
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
        bindingDigest
    ]
} = VoteChainVoteDigest(
    VC_MAX_CANDIDATES(),
    VC_MERKLE_DEPTH()
);
