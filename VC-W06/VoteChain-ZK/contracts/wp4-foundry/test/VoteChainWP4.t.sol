// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20 <0.9.0;

import "../src/VoteChainWP4.sol";
import "../src/verifiers/VoteChainVoteDirectVerifier.sol";
import "../src/verifiers/VoteChainVoteDigestVerifier.sol";

import "./WP4Fixture.sol";

interface Vm {
    function readFileBinary(
        string calldata path
    )
        external
        view
        returns (bytes memory);

    function writeFile(
        string calldata path,
        string calldata data
    )
        external;

    function writeLine(
        string calldata path,
        string calldata data
    )
        external;

    function toString(
        uint256 value
    )
        external
        pure
        returns (string memory);

    function prank(
        address sender
    )
        external;
}

contract VoteChainWP4Test {
    Vm internal constant vm =
        Vm(
            address(
                uint160(
                    uint256(
                        keccak256(
                            "hevm cheat code"
                        )
                    )
                )
            )
        );

    function _deployRaw(
        bytes memory code
    )
        internal
        returns (address deployed)
    {
        assembly ("memory-safe") {
            deployed :=
                create(
                    0,
                    add(code, 32),
                    mload(code)
                )
        }

        require(
            deployed != address(0),
            "RAW_DEPLOY_FAILED"
        );
    }

    function _deployPoseidon()
        internal
        returns (address)
    {
        bytes memory code =
            vm.readFileBinary(
                "testdata/poseidon5.creation.bin"
            );

        return
            _deployRaw(
                code
            );
    }

    function _config()
        internal
        pure
        returns (
            VoteChainBase.ElectionConfig
                memory cfg
        )
    {
        (
            cfg.eligibleRoot,
            cfg.electionId,
            cfg.candidateManifestHash,
            cfg.candidateCount,
            cfg.contractDomain,
            cfg.Yx,
            cfg.Yy,
            cfg.electionContextHash
        ) =
            WP4Fixture.config();
    }

    function _newDirect(
        bool activateNow
    )
        internal
        returns (
            VoteChainDirect d,
            VoteChainVoteDirectVerifier v
        )
    {
        v =
            new VoteChainVoteDirectVerifier();

        d =
            new VoteChainDirect(
                address(v)
            );

        VoteChainBase
            .ElectionConfig
            memory cfg =
                _config();

        d.configure(
            cfg
        );

        if (activateNow) {
            d.activate();
        }
    }

    function _newPoseidon(
        bool activateNow
    )
        internal
        returns (
            VoteChainPoseidon p,
            VoteChainVoteDigestVerifier v,
            address poseidon
        )
    {
        v =
            new VoteChainVoteDigestVerifier();

        poseidon =
            _deployPoseidon();

        p =
            new VoteChainPoseidon(
                address(v),
                poseidon
            );

        VoteChainBase
            .ElectionConfig
            memory cfg =
                _config();

        p.configure(
            cfg
        );

        if (activateNow) {
            p.activate();
        }
    }

    function _castDirectA(
        VoteChainDirect d
    )
        internal
    {
        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        uint256[73] memory ignored;

        (
            a,
            b,
            c,
            ignored
        ) =
            WP4Fixture.directA();

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotA();

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

    function _castDirectB(
        VoteChainDirect d
    )
        internal
    {
        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        uint256[73] memory ignored;

        (
            a,
            b,
            c,
            ignored
        ) =
            WP4Fixture.directB();

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotB();

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

    function _castPoseidonA(
        VoteChainPoseidon p
    )
        internal
    {
        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        uint256[10] memory ignored;

        (
            a,
            b,
            c,
            ignored
        ) =
            WP4Fixture.digestA();

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotA();

        p.castVote(
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

    function _castPoseidonB(
        VoteChainPoseidon p
    )
        internal
    {
        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        uint256[10] memory ignored;

        (
            a,
            b,
            c,
            ignored
        ) =
            WP4Fixture.digestB();

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotB();

        p.castVote(
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

    function _assertAggregate(
        VoteChainBase contractRef
    )
        internal
        view
    {
        (
            uint256[16] memory erx,
            uint256[16] memory ery,
            uint256[16] memory esx,
            uint256[16] memory esy
        ) =
            WP4Fixture
                .expectedAggregate();

        for (
            uint256 i = 0;
            i < 16;
            i++
        ) {
            (
                uint256 rx,
                uint256 ry,
                uint256 sx,
                uint256 sy
            ) =
                contractRef.getTally(
                    i
                );

            require(
                rx == erx[i],
                "BAD_TALLY_RX"
            );

            require(
                ry == ery[i],
                "BAD_TALLY_RY"
            );

            require(
                sx == esx[i],
                "BAD_TALLY_SX"
            );

            require(
                sy == esy[i],
                "BAD_TALLY_SY"
            );
        }
    }

    /*
     * Critical compatibility gate:
     * generated Poseidon-5 EVM bytecode must match
     * the exact WP3/Circom hash vector.
     */
    function testPoseidonEvmMatchesCircuitVector()
        public
    {
        address p =
            _deployPoseidon();

        (
            uint256[5] memory input,
            uint256 expected
        ) =
            WP4Fixture
                .poseidonFirstVector();

        (
            bool ok,
            bytes memory data
        ) =
            p.staticcall(
                abi.encodeWithSignature(
                    "poseidon(uint256[5])",
                    input
                )
            );

        require(
            ok &&
            data.length >= 32,
            "POSEIDON_STATICCALL_FAILED"
        );

        uint256 got =
            abi.decode(
                data,
                (uint256)
            );

        require(
            got == expected,
            "POSEIDON_EVM_CIRCUIT_MISMATCH"
        );
    }

    function testDirectTwoVotersSameWalletAndTally()
        public
    {
        (
            VoteChainDirect d,
        ) =
            _newDirect(
                true
            );

        _castDirectA(d);
        _castDirectB(d);

        require(
            d.acceptedBallotCount() ==
                2,
            "DIRECT_COUNT"
        );

        _assertAggregate(
            d
        );
    }

    function testPoseidonTwoVotersSameWalletAndTally()
        public
    {
        (
            VoteChainPoseidon p,
            ,
        ) =
            _newPoseidon(
                true
            );

        _castPoseidonA(p);
        _castPoseidonB(p);

        require(
            p.acceptedBallotCount() ==
                2,
            "POSEIDON_COUNT"
        );

        _assertAggregate(
            p
        );
    }

    function testPoseidonFullBindingDigest()
        public
    {
        (
            VoteChainPoseidon p,
            ,
        ) =
            _newPoseidon(
                true
            );

        (
            ,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotA();

        uint256 got =
            p.previewBindingDigest(
                rx,
                ry,
                sx,
                sy
            );

        require(
            got ==
                WP4Fixture.bindingA(),
            "FULL_BINDING_MISMATCH"
        );
    }

    function testDuplicateNullifierRejected()
        public
    {
        (
            VoteChainDirect d,
        ) =
            _newDirect(
                true
            );

        _castDirectA(d);

        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        uint256[73] memory ignored;

        (
            a,
            b,
            c,
            ignored
        ) =
            WP4Fixture.directA();

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotA();

        (
            bool ok,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainDirect.castVote,
                    (
                        a,
                        b,
                        c,
                        nullifier,
                        rx,
                        ry,
                        sx,
                        sy
                    )
                )
            );

        require(
            !ok,
            "DUPLICATE_NULLIFIER_ACCEPTED"
        );

        require(
            d.acceptedBallotCount() ==
                1,
            "COUNT_CHANGED_AFTER_DUPLICATE"
        );
    }

    function testInvalidProofCausesNoStateChange()
        public
    {
        (
            VoteChainDirect d,
        ) =
            _newDirect(
                true
            );

        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        uint256[73] memory ignored;

        (
            a,
            b,
            c,
            ignored
        ) =
            WP4Fixture.directA();

        a[0] += 1;

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotA();

        (
            bool ok,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainDirect.castVote,
                    (
                        a,
                        b,
                        c,
                        nullifier,
                        rx,
                        ry,
                        sx,
                        sy
                    )
                )
            );

        require(
            !ok,
            "BAD_PROOF_ACCEPTED"
        );

        require(
            d.acceptedBallotCount() ==
                0,
            "STATE_CHANGED_AFTER_BAD_PROOF"
        );

        require(
            !d.usedNullifier(
                nullifier
            ),
            "NULLIFIER_BURNED_BY_BAD_PROOF"
        );
    }

    function testTamperedCiphertextRejectedBothBindings()
        public
    {
        (
            VoteChainDirect d,
        ) =
            _newDirect(
                true
            );

        (
            VoteChainPoseidon p,
            ,
        ) =
            _newPoseidon(
                true
            );

        uint256[2] memory da;
        uint256[2][2] memory db;
        uint256[2] memory dc;
        uint256[73] memory di;

        (
            da,
            db,
            dc,
            di
        ) =
            WP4Fixture.directA();

        uint256[2] memory pa;
        uint256[2][2] memory pb;
        uint256[2] memory pc;
        uint256[10] memory pi;

        (
            pa,
            pb,
            pc,
            pi
        ) =
            WP4Fixture.digestA();

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotA();

        rx[0] += 1;

        (
            bool directOk,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainDirect.castVote,
                    (
                        da,
                        db,
                        dc,
                        nullifier,
                        rx,
                        ry,
                        sx,
                        sy
                    )
                )
            );

        (
            bool poseidonOk,
        ) =
            address(p).call(
                abi.encodeCall(
                    VoteChainPoseidon.castVote,
                    (
                        pa,
                        pb,
                        pc,
                        nullifier,
                        rx,
                        ry,
                        sx,
                        sy
                    )
                )
            );

        require(
            !directOk,
            "DIRECT_TAMPER_ACCEPTED"
        );

        require(
            !poseidonOk,
            "POSEIDON_TAMPER_ACCEPTED"
        );
    }

    function testLifecycleAndConfigFreeze()
        public
    {
        (
            VoteChainDirect d,
        ) =
            _newDirect(
                false
            );

        /*
         * Vote before Active.
         */
        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        uint256[73] memory ignored;

        (
            a,
            b,
            c,
            ignored
        ) =
            WP4Fixture.directA();

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotA();

        (
            bool beforeActive,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainDirect.castVote,
                    (
                        a,
                        b,
                        c,
                        nullifier,
                        rx,
                        ry,
                        sx,
                        sy
                    )
                )
            );

        require(
            !beforeActive,
            "VOTE_BEFORE_ACTIVE"
        );

        /*
         * Unauthorized activation.
         */
        vm.prank(
            address(0xBEEF)
        );

        (
            bool unauthorized,
        ) =
            address(d).call(
                abi.encodeWithSignature(
                    "activate()"
                )
            );

        require(
            !unauthorized,
            "UNAUTHORIZED_ACTIVATE"
        );

        d.activate();

        /*
         * Config is frozen.
         */
        VoteChainBase
            .ElectionConfig
            memory cfg =
                _config();

        (
            bool reconfigured,
        ) =
            address(d).call(
                abi.encodeWithSelector(
                    bytes4(
                        keccak256(
                            "configure((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256))"
                        )
                    ),
                    cfg
                )
            );

        require(
            !reconfigured,
            "CONFIG_CHANGED_AFTER_ACTIVE"
        );

        d.endElection();

        (
            bool afterEnded,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainDirect.castVote,
                    (
                        a,
                        b,
                        c,
                        nullifier,
                        rx,
                        ry,
                        sx,
                        sy
                    )
                )
            );

        require(
            !afterEnded,
            "VOTE_AFTER_END"
        );
    }

    function testElectionConfigBindingRejected()
        public
    {
        VoteChainVoteDirectVerifier v =
            new VoteChainVoteDirectVerifier();

        VoteChainDirect d =
            new VoteChainDirect(
                address(v)
            );

        VoteChainBase
            .ElectionConfig
            memory cfg =
                _config();

        cfg.electionId += 1;

        d.configure(
            cfg
        );

        d.activate();

        uint256[2] memory a;
        uint256[2][2] memory b;
        uint256[2] memory c;
        uint256[73] memory ignored;

        (
            a,
            b,
            c,
            ignored
        ) =
            WP4Fixture.directA();

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotA();

        (
            bool ok,
        ) =
            address(d).call(
                abi.encodeCall(
                    VoteChainDirect.castVote,
                    (
                        a,
                        b,
                        c,
                        nullifier,
                        rx,
                        ry,
                        sx,
                        sy
                    )
                )
            );

        require(
            !ok,
            "WRONG_ELECTION_CONFIG_ACCEPTED"
        );
    }

    function _calldataIntrinsicGas(
        bytes memory data
    )
        internal
        pure
        returns (uint256 total)
    {
        for (
            uint256 i = 0;
            i < data.length;
            i++
        ) {
            total +=
                data[i] == 0
                    ? 4
                    : 16;
        }
    }

    function _gasLine(
        string memory metric,
        string memory variant,
        uint256 value,
        string memory unit
    )
        internal
    {
        vm.writeLine(
            "gas/wp4-gas.csv",
            string.concat(
                metric,
                ",",
                variant,
                ",",
                vm.toString(
                    value
                ),
                ",",
                unit
            )
        );
    }

    function testZZGasGate()
        public
    {
        vm.writeFile(
            "gas/wp4-gas.csv",
            "metric,variant,value,unit\n"
        );

        /*
         * Verifier deployments.
         */
        uint256 g0 =
            gasleft();

        VoteChainVoteDirectVerifier dv =
            new VoteChainVoteDirectVerifier();

        uint256 directVerifierDeploy =
            g0 -
            gasleft();

        g0 =
            gasleft();

        VoteChainVoteDigestVerifier pv =
            new VoteChainVoteDigestVerifier();

        uint256 poseidonVerifierDeploy =
            g0 -
            gasleft();

        /*
         * Poseidon raw creation-code deployment.
         */
        bytes memory poseidonCode =
            vm.readFileBinary(
                "testdata/poseidon5.creation.bin"
            );

        g0 =
            gasleft();

        address poseidon5 =
            _deployRaw(
                poseidonCode
            );

        uint256 poseidonDeploy =
            g0 -
            gasleft();

        /*
         * Voting contracts.
         */
        g0 =
            gasleft();

        VoteChainDirect d =
            new VoteChainDirect(
                address(dv)
            );

        uint256 directContractDeploy =
            g0 -
            gasleft();

        g0 =
            gasleft();

        VoteChainPoseidon p =
            new VoteChainPoseidon(
                address(pv),
                poseidon5
            );

        uint256 poseidonContractDeploy =
            g0 -
            gasleft();

        VoteChainBase
            .ElectionConfig
            memory cfg =
                _config();

        d.configure(
            cfg
        );

        p.configure(
            cfg
        );

        d.activate();
        p.activate();

        uint256[2] memory da;
        uint256[2][2] memory db;
        uint256[2] memory dc;
        uint256[73] memory directPublic;

        (
            da,
            db,
            dc,
            directPublic
        ) =
            WP4Fixture.directA();

        uint256[2] memory pa;
        uint256[2][2] memory pb;
        uint256[2] memory pc;
        uint256[10] memory poseidonPublic;

        (
            pa,
            pb,
            pc,
            poseidonPublic
        ) =
            WP4Fixture.digestA();

        (
            uint256 nullifier,
            uint256[16] memory rx,
            uint256[16] memory ry,
            uint256[16] memory sx,
            uint256[16] memory sy
        ) =
            WP4Fixture.ballotA();

        /*
         * M12 engineering proxy: verifier execution.
         */
        g0 =
            gasleft();

        bool directVerified =
            dv.verifyProof(
                da,
                db,
                dc,
                directPublic
            );

        uint256 directVerifierGas =
            g0 -
            gasleft();

        require(
            directVerified,
            "DIRECT_GAS_PROOF"
        );

        g0 =
            gasleft();

        bool poseidonVerified =
            pv.verifyProof(
                pa,
                pb,
                pc,
                poseidonPublic
            );

        uint256 poseidonVerifierGas =
            g0 -
            gasleft();

        require(
            poseidonVerified,
            "POSEIDON_GAS_PROOF"
        );

        /*
         * M13 engineering proxy:
         * Poseidon ciphertext-binding recomputation.
         *
         * DIRECT has no separate hash stage; its binding
         * cost is represented by the larger verifier input.
         */
        g0 =
            gasleft();

        uint256 digest =
            p.previewBindingDigest(
                rx,
                ry,
                sx,
                sy
            );

        uint256 poseidonBindingGas =
            g0 -
            gasleft();

        require(
            digest ==
                WP4Fixture.bindingA(),
            "BINDING_GAS_DIGEST"
        );

        /*
         * M14 execution proxy: complete accepted vote call.
         */
        g0 =
            gasleft();

        d.castVote(
            da,
            db,
            dc,
            nullifier,
            rx,
            ry,
            sx,
            sy
        );

        uint256 directCastGas =
            g0 -
            gasleft();

        g0 =
            gasleft();

        p.castVote(
            pa,
            pb,
            pc,
            nullifier,
            rx,
            ry,
            sx,
            sy
        );

        uint256 poseidonCastGas =
            g0 -
            gasleft();

        /*
         * M15 deterministic ABI calldata sizes.
         */
        bytes memory directCalldata =
            abi.encodeCall(
                VoteChainDirect.castVote,
                (
                    da,
                    db,
                    dc,
                    nullifier,
                    rx,
                    ry,
                    sx,
                    sy
                )
            );

        bytes memory poseidonCalldata =
            abi.encodeCall(
                VoteChainPoseidon.castVote,
                (
                    pa,
                    pb,
                    pc,
                    nullifier,
                    rx,
                    ry,
                    sx,
                    sy
                )
            );

        /*
         * M18 tally update engineering proxy.
         */
        BabyJubTallyHarness th =
            new BabyJubTallyHarness();

        g0 =
            gasleft();

        th.applyBallot(
            rx,
            ry,
            sx,
            sy
        );

        uint256 tallyGas =
            g0 -
            gasleft();

        _gasLine(
            "M12_VERIFIER_EXECUTION_GAS_PROXY",
            "DIRECT",
            directVerifierGas,
            "gas"
        );

        _gasLine(
            "M12_VERIFIER_EXECUTION_GAS_PROXY",
            "POSEIDON",
            poseidonVerifierGas,
            "gas"
        );

        _gasLine(
            "M13_BINDING_HASH_GAS_PROXY",
            "DIRECT",
            0,
            "gas_no_separate_hash_stage"
        );

        _gasLine(
            "M13_BINDING_HASH_GAS_PROXY",
            "POSEIDON",
            poseidonBindingGas,
            "gas"
        );

        _gasLine(
            "M14_CAST_EXECUTION_GAS_PROXY",
            "DIRECT",
            directCastGas,
            "gas"
        );

        _gasLine(
            "M14_CAST_EXECUTION_GAS_PROXY",
            "POSEIDON",
            poseidonCastGas,
            "gas"
        );

        _gasLine(
            "M15_CALLDATA_BYTES",
            "DIRECT",
            directCalldata.length,
            "bytes"
        );

        _gasLine(
            "M15_CALLDATA_BYTES",
            "POSEIDON",
            poseidonCalldata.length,
            "bytes"
        );

        _gasLine(
            "M15_CALLDATA_INTRINSIC_GAS",
            "DIRECT",
            _calldataIntrinsicGas(
                directCalldata
            ),
            "gas"
        );

        _gasLine(
            "M15_CALLDATA_INTRINSIC_GAS",
            "POSEIDON",
            _calldataIntrinsicGas(
                poseidonCalldata
            ),
            "gas"
        );

        _gasLine(
            "M16_VERIFIER_DEPLOY_GAS_PROXY",
            "DIRECT",
            directVerifierDeploy,
            "gas"
        );

        _gasLine(
            "M16_VERIFIER_DEPLOY_GAS_PROXY",
            "POSEIDON",
            poseidonVerifierDeploy,
            "gas"
        );

        _gasLine(
            "M16_VOTING_CONTRACT_DEPLOY_GAS_PROXY",
            "DIRECT",
            directContractDeploy,
            "gas"
        );

        _gasLine(
            "M16_VOTING_CONTRACT_DEPLOY_GAS_PROXY",
            "POSEIDON",
            poseidonContractDeploy,
            "gas"
        );

        _gasLine(
            "POSEIDON5_DEPLOY_GAS_PROXY",
            "POSEIDON",
            poseidonDeploy,
            "gas"
        );

        _gasLine(
            "M18_TALLY_UPDATE_GAS_PROXY",
            "COMMON_BABYJUB",
            tallyGas,
            "gas"
        );
    }
}
