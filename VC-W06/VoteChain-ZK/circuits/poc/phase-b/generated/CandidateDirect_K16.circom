pragma circom 2.2.0;

include "../../../../crypto/node_modules/circomlib/circuits/bitify.circom";
include "../../../../crypto/node_modules/circomlib/circuits/compconstant.circom";
include "../../../../crypto/node_modules/circomlib/circuits/gates.circom";
include "../../../../crypto/node_modules/circomlib/circuits/babyjub.circom";
include "../../../../crypto/node_modules/circomlib/circuits/escalarmulfix.circom";
include "../../../../crypto/node_modules/circomlib/circuits/escalarmulany.circom";

/*
 * WP2 Phase-B candidate scaling circuit.
 *
 * DIRECT binding:
 * ciphertext coordinates are circuit outputs and therefore
 * Groth16 public signals.
 *
 * This is a component pilot, not VoteChainVote.circom.
 */

template CandidateDirectK16() {
    signal input Yx;
    signal input Yy;

    signal input bit[16];
    signal input r[16];

    signal output Rx[16];
    signal output Ry[16];
    signal output Sx[16];
    signal output Sy[16];

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

    signal bitSum[16+1];
    bitSum[0] <== 0;

    component zeroR[16];
    component rBits[16];
    component rRange[16];
    component rG[16];
    component rY[16];
    component addPoint[16];

    signal Mx[16];
    signal My[16];

    for (var j = 0; j < 16; j++) {
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
    }

    bitSum[16] === 1;
}

component main {
    public [Yx, Yy]
} = CandidateDirectK16();
