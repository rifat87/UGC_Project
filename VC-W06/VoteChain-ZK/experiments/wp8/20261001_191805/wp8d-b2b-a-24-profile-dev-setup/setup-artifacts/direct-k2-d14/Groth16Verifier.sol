// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 3276588131376954711018985783206380915185374830543389229739120455363509123708;
    uint256 constant alphay  = 10876920078701985759753540011653370828583604690189438520952714592784998765358;
    uint256 constant betax1  = 12886918795052538051195878795365564796754749566417155271886591230140949402779;
    uint256 constant betax2  = 4653911053990191035360736558180472058000909448240994088078887140296080747839;
    uint256 constant betay1  = 3116840996616139066436074109895739643572527610299936856154825236692608047940;
    uint256 constant betay2  = 20237524035299007731289299366653036497221071699915534846054267726357688050369;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant deltax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant deltay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant deltay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;

    
    uint256 constant IC0x = 8473055015061764103865329114712892959839855198611239210598620069182502180839;
    uint256 constant IC0y = 2070029900333650726992972676186970582189965088877473059522423459104970351652;
    
    uint256 constant IC1x = 1538096979986134184480785534406557546655930519060746280318475066996027377552;
    uint256 constant IC1y = 1887797871779685898829039904035189858528323636762591348128326938845444484354;
    
    uint256 constant IC2x = 6730807162244573593724791080589246781563591177998321813699691850932042089789;
    uint256 constant IC2y = 7453889944933048602211842185313618575039422114410401569267777225714104205424;
    
    uint256 constant IC3x = 2945042715870348018831504869930384059862734670595947020309773300858548776012;
    uint256 constant IC3y = 4633956441635589963463526736463211927289214851778285181023140045709628095990;
    
    uint256 constant IC4x = 7312086339055224821429532972230012077516660989982899545412670085530858501214;
    uint256 constant IC4y = 5272663578489310189034960193140983635998655400232797745822459179249122780013;
    
    uint256 constant IC5x = 75796502315048052950800758235076759964670331081416685350669998696620283947;
    uint256 constant IC5y = 2035769589357365148117012766313206374203217135461819511740030082778874433599;
    
    uint256 constant IC6x = 1539200138171519793071128373764328055387866420091841969537418693717201738613;
    uint256 constant IC6y = 5987725636583496648188136603419713102372055759055390988179985035550273214373;
    
    uint256 constant IC7x = 18208791345760626313078233495191342033472853755800707171223172800577178491742;
    uint256 constant IC7y = 13836336222357125048613740400291228661445649805999970437580119551219352385324;
    
    uint256 constant IC8x = 7228484394222362268491455431679864263759713811104983407519936491870062051275;
    uint256 constant IC8y = 8483707902336719525978035144233560988263516034390897368725788545869885539926;
    
    uint256 constant IC9x = 7836988875174787153060460990688005773905432981253088882675013090999632072549;
    uint256 constant IC9y = 21100180218199320486834671071034633154391815832833830047003080998286466889355;
    
    uint256 constant IC10x = 1825296933475667862430061118576870898440280116440283361792162948863043415954;
    uint256 constant IC10y = 12062926239705263801532067536545368175708999592547143980837722454252612152189;
    
    uint256 constant IC11x = 9409339803955286961630598869252714971598653048752609861094786517094418798027;
    uint256 constant IC11y = 8020155402196373224176185192715533550933005435193253521287168881659340689931;
    
    uint256 constant IC12x = 1357420182425113874432324339016809496308790821206594662576845649905693741488;
    uint256 constant IC12y = 3341814900990695997082975294234590807712705701677395942224687195720217636541;
    
    uint256 constant IC13x = 14213769165783452026420425889460015653092489473921712056416260382376216511253;
    uint256 constant IC13y = 4839776258356575791777104873929800195711955063946036450818573299118782275437;
    
    uint256 constant IC14x = 7500404703402373744460794949814367494691390039041462546894167278233226311950;
    uint256 constant IC14y = 20501967661628742029542096060180934615948338696486213202523677524600795928031;
    
    uint256 constant IC15x = 17379484047903423054457900285822531111681009878397980944119720423596441132799;
    uint256 constant IC15y = 13442930538984147541683861940575345552214797475162836934670951854490463475281;
    
    uint256 constant IC16x = 16394909766306236075489154089003481768335815669285433238253323012320376632753;
    uint256 constant IC16y = 20513259828629779352334231577995027610520078526299262840644408112388767402275;
    
    uint256 constant IC17x = 2339043351596474254262788758440696050468755704726716205503737128247479201459;
    uint256 constant IC17y = 5238550546118886897555516476859248648533883953800121765542405884059939608883;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[17] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, r)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                
                g1_mulAccC(_pVk, IC13x, IC13y, calldataload(add(pubSignals, 384)))
                
                g1_mulAccC(_pVk, IC14x, IC14y, calldataload(add(pubSignals, 416)))
                
                g1_mulAccC(_pVk, IC15x, IC15y, calldataload(add(pubSignals, 448)))
                
                g1_mulAccC(_pVk, IC16x, IC16y, calldataload(add(pubSignals, 480)))
                
                g1_mulAccC(_pVk, IC17x, IC17y, calldataload(add(pubSignals, 512)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            
            checkField(calldataload(add(_pubSignals, 416)))
            
            checkField(calldataload(add(_pubSignals, 448)))
            
            checkField(calldataload(add(_pubSignals, 480)))
            
            checkField(calldataload(add(_pubSignals, 512)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
