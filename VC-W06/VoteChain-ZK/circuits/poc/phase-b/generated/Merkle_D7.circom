pragma circom 2.2.0;

include "../../../../crypto/node_modules/circomlib/circuits/poseidon.circom";

/*
 * WP2 Phase-B isolated Merkle-depth scaling circuit.
 *
 * leaf, siblings and pathBits remain private.
 * root is the public output.
 *
 * This measures depth-dependent Poseidon membership arithmetic.
 * It is not the final VoteChainVote eligibility statement.
 */

template MerkleDepth7() {
    signal input leaf;
    signal input siblings[7];
    signal input pathBits[7];

    signal output root;

    signal current[7+1];
    signal left[7];
    signal right[7];

    component hash[7];

    current[0] <== leaf;

    for (var i = 0; i < 7; i++) {
        pathBits[i] *
        (pathBits[i] - 1) === 0;

        left[i] <==
            current[i] +
            pathBits[i] *
            (siblings[i] - current[i]);

        right[i] <==
            siblings[i] +
            pathBits[i] *
            (current[i] - siblings[i]);

        hash[i] = Poseidon(2);

        hash[i].inputs[0] <==
            left[i];

        hash[i].inputs[1] <==
            right[i];

        current[i+1] <==
            hash[i].out;
    }

    root <== current[7];
}

component main = MerkleDepth7();
