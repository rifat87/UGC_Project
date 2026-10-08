pragma circom 2.2.0;

include "../../crypto/node_modules/circomlib/circuits/bitify.circom";
include "../../crypto/node_modules/circomlib/circuits/compconstant.circom";
include "../../crypto/node_modules/circomlib/circuits/gates.circom";
include "../../crypto/node_modules/circomlib/circuits/babyjub.circom";
include "../../crypto/node_modules/circomlib/circuits/escalarmulfix.circom";
include "../../crypto/node_modules/circomlib/circuits/escalarmulany.circom";

/*
 * WP2 minimal proof:
 *
 * bit ∈ {0,1}
 * 0 < r < BabyJub subgroup order
 *
 * R = rG
 * S = rY + bit*G
 *
 * Y is public and must be bound to the election's
 * configured threshold public key by the final system.
 */

template BitElGamalValidityFinal() {
    signal input Yx;
    signal input Yy;

    signal input Rx;
    signal input Ry;

    signal input Sx;
    signal input Sy;

    signal input bit;
    signal input r;

    bit * (bit - 1) === 0;

    component zeroR = IsZero();
    zeroR.in <== r;
    zeroR.out === 0;

    component rBits =
        Num2Bits(253);

    rBits.in <== r;

    component rRange =
        CompConstant(
            2736030358979909402780800718157159386076813972158567259200215660948447373040
        );

    for (
        var q = 0;
        q < 253;
        q++
    )
        rRange.in[q] <==
            rBits.out[q];

    rRange.in[253] <== 0;
    rRange.out === 0;

    var G[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    component checkY =
        BabyCheck();

    checkY.x <== Yx;
    checkY.y <== Yy;

    component zeroY =
        IsZero();

    zeroY.in <== Yx;
    zeroY.out === 0;

    component rG =
        EscalarMulFix(
            253,
            G
        );

    for (
        var i = 0;
        i < 253;
        i++
    )
        rG.e[i] <==
            rBits.out[i];

    rG.out[0] === Rx;
    rG.out[1] === Ry;

    component rY =
        EscalarMulAny(253);

    for (
        var j = 0;
        j < 253;
        j++
    )
        rY.e[j] <==
            rBits.out[j];

    rY.p[0] <== Yx;
    rY.p[1] <== Yy;

    signal Mx;
    signal My;

    Mx <==
        bit * G[0];

    My <==
        1 +
        bit *
        (
            G[1] - 1
        );

    component sum =
        BabyAdd();

    sum.x1 <==
        rY.out[0];

    sum.y1 <==
        rY.out[1];

    sum.x2 <==
        Mx;

    sum.y2 <==
        My;

    sum.xout === Sx;
    sum.yout === Sy;
}

component main {
    public [
        Yx,
        Yy,
        Rx,
        Ry,
        Sx,
        Sy
    ]
} =
    BitElGamalValidityFinal();
