pragma circom 2.2.0;

include "../../../../crypto/node_modules/circomlib/circuits/bitify.circom";
include "../../../../crypto/node_modules/circomlib/circuits/compconstant.circom";
include "../../../../crypto/node_modules/circomlib/circuits/gates.circom";
include "../../../../crypto/node_modules/circomlib/circuits/babyjub.circom";
include "../../../../crypto/node_modules/circomlib/circuits/escalarmulfix.circom";
include "../../../../crypto/node_modules/circomlib/circuits/escalarmulany.circom";
include "../../../../crypto/node_modules/circomlib/circuits/poseidon.circom";

/*
 * WP2 Phase-B candidate scaling circuit.
 *
 * POSEIDON_CHAIN binding:
 * ciphertext coordinates are hashed inside the circuit.
 * Only bindingDigest is exposed as the ciphertext binding.
 *
 * Solidity recomputation gas is NOT measured here.
 *
 * This is a component pilot, not VoteChainVote.circom.
 */

template CandidateDigestK2() {
    signal input Yx;
    signal input Yy;

    signal input bit[2];
    signal input r[2];

    signal output bindingDigest;

    component checkY = BabyCheck();
    checkY.x <== Yx;
    checkY.y <== Yy;

    component zeroY = IsZero();
    zeroY.in <== Yx;
    zeroY.out === 0;

    var G[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    signal bitSum[2+1];
    bitSum[0] <== 0;

    component zeroR[2];
    component rBits[2];
    component rRange[2];
    component rG[2];
    component rY[2];
    component addPoint[2];
    component bindingHash[2];

    signal Mx[2];
    signal My[2];

    signal Rx[2];
    signal Ry[2];
    signal Sx[2];
    signal Sy[2];

    signal bindingState[2+1];

     // WP2 pilot-only ciphertext-binding domain tag.
     // Final WP3 domain registry remains authoritative.
    bindingState[0] <== 2026093001;

    for (var j = 0; j < 2; j++) {
        bit[j] * (bit[j] - 1) === 0;

        bitSum[j+1] <==
            bitSum[j] + bit[j];

        zeroR[j] = IsZero();
        zeroR[j].in <== r[j];
        zeroR[j].out === 0;

        rBits[j] = Num2Bits(253);
        rBits[j].in <== r[j];

        rRange[j] = CompConstant(
            2736030358979909402780800718157159386076813972158567259200215660948447373040
        );

        for (var q = 0; q < 253; q++) {
            rRange[j].in[q] <==
                rBits[j].out[q];
        }

        rRange[j].in[253] <== 0;
        rRange[j].out === 0;

        rG[j] = EscalarMulFix(253, G);

        for (var a = 0; a < 253; a++) {
            rG[j].e[a] <==
                rBits[j].out[a];
        }

        Rx[j] <== rG[j].out[0];
        Ry[j] <== rG[j].out[1];

        rY[j] = EscalarMulAny(253);

        for (var b = 0; b < 253; b++) {
            rY[j].e[b] <==
                rBits[j].out[b];
        }

        rY[j].p[0] <== Yx;
        rY[j].p[1] <== Yy;

        Mx[j] <==
            bit[j] * G[0];

        My[j] <==
            1 +
            bit[j] * (G[1] - 1);

        addPoint[j] = BabyAdd();

        addPoint[j].x1 <==
            rY[j].out[0];

        addPoint[j].y1 <==
            rY[j].out[1];

        addPoint[j].x2 <==
            Mx[j];

        addPoint[j].y2 <==
            My[j];

        Sx[j] <==
            addPoint[j].xout;

        Sy[j] <==
            addPoint[j].yout;

        /*
         * Chained Poseidon commitment:
         *
         * H_j =
         * Poseidon(
         *   H_(j-1),
         *   Rx,
         *   Ry,
         *   Sx,
         *   Sy
         * )
         */
        bindingHash[j] = Poseidon(5);

        bindingHash[j].inputs[0] <==
            bindingState[j];

        bindingHash[j].inputs[1] <==
            Rx[j];

        bindingHash[j].inputs[2] <==
            Ry[j];

        bindingHash[j].inputs[3] <==
            Sx[j];

        bindingHash[j].inputs[4] <==
            Sy[j];

        bindingState[j+1] <==
            bindingHash[j].out;
    }

    bitSum[2] === 1;

    bindingDigest <==
        bindingState[2];
}

component main {
    public [Yx, Yy]
} = CandidateDigestK2();
