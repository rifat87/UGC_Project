// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20 <0.9.0;

import "../src/VoteChainWP4.sol";

contract WP6BMockVerifier is
    IVerifierDirect
{
    function verifyProof(
        uint256[2] calldata,
        uint256[2][2] calldata,
        uint256[2] calldata,
        uint256[73] calldata
    )
        external
        pure
        returns (bool)
    {
        return true;
    }
}

contract VoteChainWP6BTest {
    bytes32 internal constant
        TRUSTEE_HASH =
            bytes32(
                uint256(
                    0x1234
                )
            );

    bytes32 internal constant
        FINAL_HASH =
            bytes32(
                uint256(
                    0x5678
                )
            );

    function _newDirect(
        bool pinTranscript
    )
        internal
        returns (
            VoteChainDirect d
        )
    {
        WP6BMockVerifier verifier =
            new WP6BMockVerifier();

        d =
            new VoteChainDirect(
                address(
                    verifier
                )
            );

        VoteChainBase
            .ElectionConfig
            memory cfg;

        cfg.eligibleRoot =
            111;

        cfg.electionId =
            202610010006;

        cfg.candidateManifestHash =
            222;

        cfg.candidateCount =
            4;

        cfg.contractDomain =
            333;

        /*
         * Contract configuration only checks canonical/non-identity
         * here; actual WP6B research runtime uses the DKG-derived
         * BabyJub public key.
         */
        cfg.Yx =
            1;

        cfg.Yy =
            2;

        cfg.electionContextHash =
            444;

        d.configure(
            cfg
        );

        if (
            pinTranscript
        ) {
            d.setTrusteeTranscriptHash(
                TRUSTEE_HASH
            );
        }

        d.activate();
    }

    function _castIdentityBallot(
        VoteChainDirect d,
        uint256 nullifier
    )
        internal
    {
        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;

        uint256[16] memory rx;
        uint256[16] memory ry;
        uint256[16] memory sx;
        uint256[16] memory sy;

        for (
            uint256 i = 0;
            i < 16;
            i++
        ) {
            /*
             * BabyJub neutral element = (0,1).
             * The research runtime uses actual encrypted points.
             */
            ry[i] =
                1;

            sy[i] =
                1;
        }

        d.castVote(
            a,
            b,
            c,
            nullifier,
            rx,
            ry,
            sx,
            sy
        );
    }

    function _twoVotesEnded()
        internal
        returns (
            VoteChainDirect d
        )
    {
        d =
            _newDirect(
                true
            );

        _castIdentityBallot(
            d,
            1001
        );

        _castIdentityBallot(
            d,
            1002
        );

        require(
            d.acceptedBallotCount() ==
                2,
            "PRECONDITION_COUNT"
        );

        d.endElection();
    }

    function testValidFinalization()
        public
    {
        VoteChainDirect d =
            _twoVotesEnded();

        uint256[16] memory totals;

        totals[0] =
            1;

        totals[1] =
            1;

        d.finalizeTally(
            totals,
            FINAL_HASH
        );

        require(
            d.phase() ==
                VoteChainBase
                    .Phase
                    .Finalized,
            "NOT_FINALIZED"
        );

        require(
            d.finalizationTranscriptHash() ==
                FINAL_HASH,
            "FINAL_HASH"
        );

        require(
            d.getFinalResult(
                0
            ) ==
                1,
            "RESULT_0"
        );

        require(
            d.getFinalResult(
                1
            ) ==
                1,
            "RESULT_1"
        );
    }

    function testFinalizeBeforeEndedRejected()
        public
    {
        VoteChainDirect d =
            _newDirect(
                true
            );

        uint256[16] memory totals;

        (
            bool ok,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainBase
                        .finalizeTally,
                    (
                        totals,
                        FINAL_HASH
                    )
                )
            );

        require(
            !ok,
            "FINALIZED_BEFORE_END"
        );
    }

    function testFinalizeWithoutPinnedTranscriptRejected()
        public
    {
        VoteChainDirect d =
            _newDirect(
                false
            );

        d.endElection();

        uint256[16] memory totals;

        (
            bool ok,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainBase
                        .finalizeTally,
                    (
                        totals,
                        FINAL_HASH
                    )
                )
            );

        require(
            !ok,
            "FINALIZED_WITHOUT_DKG_PIN"
        );
    }

    function testBadSumRejected()
        public
    {
        VoteChainDirect d =
            _twoVotesEnded();

        uint256[16] memory totals;

        totals[0] =
            1;

        (
            bool ok,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainBase
                        .finalizeTally,
                    (
                        totals,
                        FINAL_HASH
                    )
                )
            );

        require(
            !ok,
            "BAD_RESULT_SUM_ACCEPTED"
        );

        require(
            d.phase() ==
                VoteChainBase
                    .Phase
                    .Ended,
            "PHASE_CHANGED_BAD_SUM"
        );
    }

    function testPaddedResultRejected()
        public
    {
        VoteChainDirect d =
            _twoVotesEnded();

        uint256[16] memory totals;

        totals[0] =
            1;

        totals[1] =
            1;

        totals[15] =
            1;

        (
            bool ok,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainBase
                        .finalizeTally,
                    (
                        totals,
                        FINAL_HASH
                    )
                )
            );

        require(
            !ok,
            "PADDED_RESULT_ACCEPTED"
        );
    }

    function testDuplicateFinalizationRejected()
        public
    {
        VoteChainDirect d =
            _twoVotesEnded();

        uint256[16] memory totals;

        totals[0] =
            2;

        d.finalizeTally(
            totals,
            FINAL_HASH
        );

        (
            bool ok,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainBase
                        .finalizeTally,
                    (
                        totals,
                        FINAL_HASH
                    )
                )
            );

        require(
            !ok,
            "DOUBLE_FINALIZATION"
        );
    }

    function testTranscriptPinFrozenAfterFirstSet()
        public
    {
        WP6BMockVerifier verifier =
            new WP6BMockVerifier();

        VoteChainDirect d =
            new VoteChainDirect(
                address(
                    verifier
                )
            );

        VoteChainBase
            .ElectionConfig
            memory cfg;

        cfg.eligibleRoot =
            1;

        cfg.electionId =
            2;

        cfg.candidateManifestHash =
            3;

        cfg.candidateCount =
            4;

        cfg.contractDomain =
            4;

        cfg.Yx =
            5;

        cfg.Yy =
            6;

        cfg.electionContextHash =
            7;

        d.configure(
            cfg
        );

        d.setTrusteeTranscriptHash(
            TRUSTEE_HASH
        );

        (
            bool secondPin,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainBase
                        .setTrusteeTranscriptHash,
                    (
                        bytes32(
                            uint256(
                                0x9999
                            )
                        )
                    )
                )
            );

        require(
            !secondPin,
            "SECOND_DKG_PIN_ACCEPTED"
        );

        d.activate();

        (
            bool afterActive,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainBase
                        .setTrusteeTranscriptHash,
                    (
                        bytes32(
                            uint256(
                                0xAAAA
                            )
                        )
                    )
                )
            );

        require(
            !afterActive,
            "DKG_PIN_CHANGED_AFTER_ACTIVE"
        );
    }
}
