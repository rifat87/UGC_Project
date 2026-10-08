// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20 <0.9.0;

import "./WP4Profile.sol";

interface IVerifierDirect {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[73] calldata input
    )
        external
        view
        returns (bool);
}

interface IVerifierDigest {
    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[10] calldata input
    )
        external
        view
        returns (bool);
}

/*
 * BabyJub affine twisted-Edwards addition.
 *
 * a*x^2 + y^2 = 1 + d*x^2*y^2
 * a = 168700
 * d = 168696
 *
 * This is intentionally instrumented in WP4 because its EVM
 * cost is one of the authorized architecture review gates.
 */
library BabyJubAffine {
    uint256 internal constant P =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    uint256 internal constant A =
        168700;

    uint256 internal constant D =
        168696;

    struct Point {
        uint256 x;
        uint256 y;
    }

    function _submod(
        uint256 x,
        uint256 y
    )
        private
        pure
        returns (uint256)
    {
        return
            x >= y
                ? x - y
                : P - (y - x);
    }

    /*
     * EIP-198 modular exponentiation precompile.
     *
     * inverse(a) = a^(P-2) mod P
     */
    function _inverse(
        uint256 x
    )
        private
        view
        returns (uint256 out)
    {
        require(
            x != 0,
            "BABYJUB_ZERO_DENOMINATOR"
        );

        bytes memory input =
            abi.encode(
                uint256(32),
                uint256(32),
                uint256(32),
                x,
                P - 2,
                P
            );

        bytes memory output =
            new bytes(32);

        bool ok;

        assembly ("memory-safe") {
            ok := staticcall(
                gas(),
                5,
                add(input, 32),
                mload(input),
                add(output, 32),
                32
            )
        }

        require(
            ok,
            "MODEXP_FAILED"
        );

        out =
            abi.decode(
                output,
                (uint256)
            );

        require(
            out != 0,
            "BAD_INVERSE"
        );
    }

    function add(
        Point memory p1,
        Point memory p2
    )
        internal
        view
        returns (Point memory r)
    {
        require(
            p1.x < P &&
            p1.y < P &&
            p2.x < P &&
            p2.y < P,
            "NON_CANONICAL_POINT"
        );

        uint256 x1x2 =
            mulmod(
                p1.x,
                p2.x,
                P
            );

        uint256 y1y2 =
            mulmod(
                p1.y,
                p2.y,
                P
            );

        uint256 x1y2 =
            mulmod(
                p1.x,
                p2.y,
                P
            );

        uint256 y1x2 =
            mulmod(
                p1.y,
                p2.x,
                P
            );

        uint256 t =
            mulmod(
                x1x2,
                y1y2,
                P
            );

        uint256 dt =
            mulmod(
                D,
                t,
                P
            );

        uint256 numeratorX =
            addmod(
                x1y2,
                y1x2,
                P
            );

        uint256 numeratorY =
            _submod(
                y1y2,
                mulmod(
                    A,
                    x1x2,
                    P
                )
            );

        uint256 denominatorX =
            addmod(
                1,
                dt,
                P
            );

        uint256 denominatorY =
            _submod(
                1,
                dt
            );

        r.x =
            mulmod(
                numeratorX,
                _inverse(
                    denominatorX
                ),
                P
            );

        r.y =
            mulmod(
                numeratorY,
                _inverse(
                    denominatorY
                ),
                P
            );
    }
}

abstract contract VoteChainBase {
    uint256 internal constant MAX =
        WP4Profile.MAX_CANDIDATES;

    uint256 internal constant P =
        WP4Profile.FIELD_MODULUS;

    enum Phase {
        Registration,
        Active,
        Ended,
        Finalized
    }

    struct ElectionConfig {
        uint256 eligibleRoot;

        uint256 electionId;

        uint256 candidateManifestHash;

        uint256 candidateCount;

        uint256 contractDomain;

        uint256 Yx;
        uint256 Yy;

        uint256 electionContextHash;
    }

    address public immutable admin;

    Phase public phase;

    bool public configured;

    uint256 public eligibleRoot;

    uint256 public electionId;

    uint256 public candidateManifestHash;

    uint256 public candidateCount;

    uint256 public contractDomain;

    uint256 public Yx;
    uint256 public Yy;

    uint256 public electionContextHash;

    uint256 public acceptedBallotCount;

    /*
     * WP6 threshold-finalization evidence.
     *
     * trusteeTranscriptHash is pinned during Registration.
     * finalizationTranscriptHash is written only after Ended.
     *
     * The full threshold transcript remains public/off-chain;
     * Solidity anchors its canonical SHA-256 hash and the
     * independently verified plaintext aggregate totals.
     */
    bytes32 public trusteeTranscriptHash;

    bytes32 public finalizationTranscriptHash;

    uint256[16] internal finalResults;

    mapping(uint256 => bool)
        public usedNullifier;

    uint256[16] internal tallyRx;
    uint256[16] internal tallyRy;
    uint256[16] internal tallySx;
    uint256[16] internal tallySy;

    event ElectionConfigured(
        uint256 indexed electionId,
        uint256 eligibleRoot,
        uint256 candidateManifestHash,
        uint256 candidateCount
    );

    event ElectionActivated(
        uint256 indexed electionId
    );

    event ElectionEnded(
        uint256 indexed electionId
    );

    event TrusteeTranscriptPinned(
        bytes32 indexed transcriptHash
    );

    event TallyFinalized(
        bytes32 indexed transcriptHash,
        uint256 acceptedBallotCount
    );

    event EncryptedVoteAccepted(
        uint256 indexed nullifier,
        bytes32 ciphertextHash,
        uint256 acceptedBallotCount
    );

    constructor() {
        admin =
            msg.sender;

        phase =
            Phase.Registration;

        /*
         * BabyJub identity = (0,1)
         */
        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            tallyRy[i] = 1;
            tallySy[i] = 1;
        }
    }

    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "ONLY_ADMIN"
        );

        _;
    }

    modifier inPhase(
        Phase expected
    ) {
        require(
            phase == expected,
            "WRONG_PHASE"
        );

        _;
    }

    function configure(
        ElectionConfig calldata cfg
    )
        external
        onlyAdmin
        inPhase(
            Phase.Registration
        )
    {
        require(
            !configured,
            "ALREADY_CONFIGURED"
        );

        require(
            cfg.candidateCount >= 1 &&
            cfg.candidateCount <= MAX,
            "BAD_CANDIDATE_COUNT"
        );

        require(
            cfg.eligibleRoot < P &&
            cfg.candidateManifestHash < P &&
            cfg.contractDomain < P &&
            cfg.Yx < P &&
            cfg.Yy < P &&
            cfg.electionContextHash < P,
            "NON_CANONICAL_CONFIG"
        );

        require(
            cfg.Yx != 0,
            "IDENTITY_PUBLIC_KEY"
        );

        eligibleRoot =
            cfg.eligibleRoot;

        electionId =
            cfg.electionId;

        candidateManifestHash =
            cfg.candidateManifestHash;

        candidateCount =
            cfg.candidateCount;

        contractDomain =
            cfg.contractDomain;

        Yx =
            cfg.Yx;

        Yy =
            cfg.Yy;

        electionContextHash =
            cfg.electionContextHash;

        configured =
            true;

        emit ElectionConfigured(
            electionId,
            eligibleRoot,
            candidateManifestHash,
            candidateCount
        );
    }

    /*
     * Pin the public DKG ceremony transcript before Active.
     *
     * The transcript verifier independently checks that the
     * committed trustee public shares derive the configured Y.
     * Existing WP4/WP5 deployment flows remain ABI-compatible:
     * this is an additional registration-stage call.
     */
    function setTrusteeTranscriptHash(
        bytes32 transcriptHash
    )
        external
        onlyAdmin
        inPhase(
            Phase.Registration
        )
    {
        require(
            configured,
            "NOT_CONFIGURED"
        );

        require(
            transcriptHash !=
                bytes32(0),
            "ZERO_TRUSTEE_TRANSCRIPT"
        );

        require(
            trusteeTranscriptHash ==
                bytes32(0),
            "TRUSTEE_TRANSCRIPT_ALREADY_SET"
        );

        trusteeTranscriptHash =
            transcriptHash;

        emit TrusteeTranscriptPinned(
            transcriptHash
        );
    }

    function activate()
        external
        onlyAdmin
        inPhase(
            Phase.Registration
        )
    {
        require(
            configured,
            "NOT_CONFIGURED"
        );

        phase =
            Phase.Active;

        emit ElectionActivated(
            electionId
        );
    }

    function endElection()
        external
        onlyAdmin
        inPhase(
            Phase.Active
        )
    {
        phase =
            Phase.Ended;

        emit ElectionEnded(
            electionId
        );
    }

    /*
     * WP6 prototype finalization boundary.
     *
     * Threshold/DLEQ verification is performed by the public
     * transcript verifier before this transaction is submitted.
     * This contract:
     *
     *   - requires Ended,
     *   - requires a registration-stage trustee transcript pin,
     *   - enforces candidate padding,
     *   - enforces sum(totals) == acceptedBallotCount,
     *   - anchors the independently verified transcript hash,
     *   - exposes plaintext totals only in Finalized.
     *
     * The transcript and proofs stay independently re-verifiable.
     */
    function finalizeTally(
        uint256[16] calldata totals,
        bytes32 transcriptHash
    )
        external
        onlyAdmin
        inPhase(
            Phase.Ended
        )
    {
        require(
            trusteeTranscriptHash !=
                bytes32(0),
            "TRUSTEE_TRANSCRIPT_NOT_PINNED"
        );

        require(
            transcriptHash !=
                bytes32(0),
            "ZERO_FINALIZATION_TRANSCRIPT"
        );

        uint256 activeSum;

        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            if (
                i <
                candidateCount
            ) {
                require(
                    totals[i] <=
                        acceptedBallotCount,
                    "RESULT_EXCEEDS_BALLOTS"
                );

                activeSum +=
                    totals[i];
            } else {
                require(
                    totals[i] == 0,
                    "NONZERO_PADDED_RESULT"
                );
            }

            finalResults[i] =
                totals[i];
        }

        require(
            activeSum ==
                acceptedBallotCount,
            "RESULT_SUM_MISMATCH"
        );

        finalizationTranscriptHash =
            transcriptHash;

        phase =
            Phase.Finalized;

        emit TallyFinalized(
            transcriptHash,
            acceptedBallotCount
        );
    }

    function getFinalResult(
        uint256 slot
    )
        external
        view
        returns (uint256)
    {
        require(
            phase ==
                Phase.Finalized,
            "NOT_FINALIZED"
        );

        require(
            slot <
                candidateCount,
            "BAD_FINAL_RESULT_SLOT"
        );

        return
            finalResults[slot];
    }

    function getTally(
        uint256 slot
    )
        external
        view
        returns (
            uint256 rx,
            uint256 ry,
            uint256 sx,
            uint256 sy
        )
    {
        require(
            slot < MAX,
            "BAD_SLOT"
        );

        return (
            tallyRx[slot],
            tallyRy[slot],
            tallySx[slot],
            tallySy[slot]
        );
    }

    function _requireCanonicalCiphertext(
        uint256[16] calldata rx,
        uint256[16] calldata ry,
        uint256[16] calldata sx,
        uint256[16] calldata sy
    )
        internal
        pure
    {
        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            require(
                rx[i] < P &&
                ry[i] < P &&
                sx[i] < P &&
                sy[i] < P,
                "NON_CANONICAL_CIPHERTEXT"
            );
        }
    }

    function _applyTally(
        uint256[16] calldata rx,
        uint256[16] calldata ry,
        uint256[16] calldata sx,
        uint256[16] calldata sy
    )
        internal
    {
        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            BabyJubAffine.Point memory oldR =
                BabyJubAffine.Point(
                    tallyRx[i],
                    tallyRy[i]
                );

            BabyJubAffine.Point memory newR =
                BabyJubAffine.Point(
                    rx[i],
                    ry[i]
                );

            BabyJubAffine.Point memory oldS =
                BabyJubAffine.Point(
                    tallySx[i],
                    tallySy[i]
                );

            BabyJubAffine.Point memory newS =
                BabyJubAffine.Point(
                    sx[i],
                    sy[i]
                );

            BabyJubAffine.Point memory sumR =
                BabyJubAffine.add(
                    oldR,
                    newR
                );

            BabyJubAffine.Point memory sumS =
                BabyJubAffine.add(
                    oldS,
                    newS
                );

            tallyRx[i] =
                sumR.x;

            tallyRy[i] =
                sumR.y;

            tallySx[i] =
                sumS.x;

            tallySy[i] =
                sumS.y;
        }
    }

    function _accept(
        uint256 nullifier,
        uint256[16] calldata rx,
        uint256[16] calldata ry,
        uint256[16] calldata sx,
        uint256[16] calldata sy
    )
        internal
    {
        require(
            phase == Phase.Active,
            "NOT_ACTIVE"
        );

        require(
            !usedNullifier[
                nullifier
            ],
            "NULLIFIER_USED"
        );

        usedNullifier[
            nullifier
        ] =
            true;

        _applyTally(
            rx,
            ry,
            sx,
            sy
        );

        acceptedBallotCount +=
            1;

        emit EncryptedVoteAccepted(
            nullifier,
            keccak256(
                abi.encode(
                    rx,
                    ry,
                    sx,
                    sy
                )
            ),
            acceptedBallotCount
        );
    }
}

contract VoteChainDirect is
    VoteChainBase
{
    IVerifierDirect
        public immutable verifier;

    constructor(
        address verifierAddress
    ) {
        require(
            verifierAddress !=
                address(0),
            "ZERO_VERIFIER"
        );

        verifier =
            IVerifierDirect(
                verifierAddress
            );
    }

    function _buildInputs(
        uint256 nullifier,
        uint256[16] calldata rx,
        uint256[16] calldata ry,
        uint256[16] calldata sx,
        uint256[16] calldata sy
    )
        private
        view
        returns (
            uint256[73] memory input
        )
    {
        input[0] =
            eligibleRoot;

        input[1] =
            electionId;

        input[2] =
            candidateManifestHash;

        input[3] =
            candidateCount;

        input[4] =
            contractDomain;

        input[5] =
            Yx;

        input[6] =
            Yy;

        input[7] =
            electionContextHash;

        input[8] =
            nullifier;

        uint256 offset =
            9;

        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            input[
                offset + i
            ] =
                rx[i];
        }

        offset += MAX;

        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            input[
                offset + i
            ] =
                ry[i];
        }

        offset += MAX;

        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            input[
                offset + i
            ] =
                sx[i];
        }

        offset += MAX;

        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            input[
                offset + i
            ] =
                sy[i];
        }
    }

    function castVote(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256 nullifier,
        uint256[16] calldata rx,
        uint256[16] calldata ry,
        uint256[16] calldata sx,
        uint256[16] calldata sy
    )
        external
    {
        require(
            phase == Phase.Active,
            "NOT_ACTIVE"
        );

        require(
            !usedNullifier[
                nullifier
            ],
            "NULLIFIER_USED"
        );

        _requireCanonicalCiphertext(
            rx,
            ry,
            sx,
            sy
        );

        uint256[73] memory input =
            _buildInputs(
                nullifier,
                rx,
                ry,
                sx,
                sy
            );

        require(
            verifier.verifyProof(
                a,
                b,
                c,
                input
            ),
            "INVALID_PROOF"
        );

        _accept(
            nullifier,
            rx,
            ry,
            sx,
            sy
        );
    }
}

contract VoteChainPoseidon is
    VoteChainBase
{
    IVerifierDigest
        public immutable verifier;

    address
        public immutable poseidon5;

    constructor(
        address verifierAddress,
        address poseidonAddress
    ) {
        require(
            verifierAddress !=
                address(0),
            "ZERO_VERIFIER"
        );

        require(
            poseidonAddress !=
                address(0),
            "ZERO_POSEIDON"
        );

        verifier =
            IVerifierDigest(
                verifierAddress
            );

        poseidon5 =
            poseidonAddress;
    }

    function _poseidon(
        uint256[5] memory values
    )
        private
        view
        returns (uint256)
    {
        (
            bool ok,
            bytes memory data
        ) =
            poseidon5.staticcall(
                abi.encodeWithSignature(
                    "poseidon(uint256[5])",
                    values
                )
            );

        require(
            ok &&
            data.length >= 32,
            "POSEIDON_CALL_FAILED"
        );

        return
            abi.decode(
                data,
                (uint256)
            );
    }

    function _binding(
        uint256[16] calldata rx,
        uint256[16] calldata ry,
        uint256[16] calldata sx,
        uint256[16] calldata sy
    )
        private
        view
        returns (uint256 state)
    {
        state =
            WP4Profile
                .CIPHERTEXT_BINDING_DOMAIN;

        for (
            uint256 i = 0;
            i < MAX;
            i++
        ) {
            uint256[5] memory values;

            values[0] =
                state;

            values[1] =
                rx[i];

            values[2] =
                ry[i];

            values[3] =
                sx[i];

            values[4] =
                sy[i];

            state =
                _poseidon(
                    values
                );
        }
    }

    function previewBindingDigest(
        uint256[16] calldata rx,
        uint256[16] calldata ry,
        uint256[16] calldata sx,
        uint256[16] calldata sy
    )
        external
        view
        returns (uint256)
    {
        _requireCanonicalCiphertext(
            rx,
            ry,
            sx,
            sy
        );

        return
            _binding(
                rx,
                ry,
                sx,
                sy
            );
    }

    function castVote(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256 nullifier,
        uint256[16] calldata rx,
        uint256[16] calldata ry,
        uint256[16] calldata sx,
        uint256[16] calldata sy
    )
        external
    {
        require(
            phase == Phase.Active,
            "NOT_ACTIVE"
        );

        require(
            !usedNullifier[
                nullifier
            ],
            "NULLIFIER_USED"
        );

        _requireCanonicalCiphertext(
            rx,
            ry,
            sx,
            sy
        );

        uint256 digest =
            _binding(
                rx,
                ry,
                sx,
                sy
            );

        uint256[10] memory input;

        input[0] =
            eligibleRoot;

        input[1] =
            electionId;

        input[2] =
            candidateManifestHash;

        input[3] =
            candidateCount;

        input[4] =
            contractDomain;

        input[5] =
            Yx;

        input[6] =
            Yy;

        input[7] =
            electionContextHash;

        input[8] =
            nullifier;

        input[9] =
            digest;

        require(
            verifier.verifyProof(
                a,
                b,
                c,
                input
            ),
            "INVALID_PROOF"
        );

        _accept(
            nullifier,
            rx,
            ry,
            sx,
            sy
        );
    }
}

contract BabyJubTallyHarness {
    uint256[16] internal tallyRx;
    uint256[16] internal tallyRy;
    uint256[16] internal tallySx;
    uint256[16] internal tallySy;

    constructor() {
        for (
            uint256 i = 0;
            i < 16;
            i++
        ) {
            tallyRy[i] = 1;
            tallySy[i] = 1;
        }
    }

    function applyBallot(
        uint256[16] calldata rx,
        uint256[16] calldata ry,
        uint256[16] calldata sx,
        uint256[16] calldata sy
    )
        external
    {
        for (
            uint256 i = 0;
            i < 16;
            i++
        ) {
            BabyJubAffine.Point memory sumR =
                BabyJubAffine.add(
                    BabyJubAffine.Point(
                        tallyRx[i],
                        tallyRy[i]
                    ),
                    BabyJubAffine.Point(
                        rx[i],
                        ry[i]
                    )
                );

            BabyJubAffine.Point memory sumS =
                BabyJubAffine.add(
                    BabyJubAffine.Point(
                        tallySx[i],
                        tallySy[i]
                    ),
                    BabyJubAffine.Point(
                        sx[i],
                        sy[i]
                    )
                );

            tallyRx[i] =
                sumR.x;

            tallyRy[i] =
                sumR.y;

            tallySx[i] =
                sumS.x;

            tallySy[i] =
                sumS.y;
        }
    }
}
