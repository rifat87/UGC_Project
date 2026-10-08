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

    
    uint256 constant IC0x = 3062389359191601896188622650068238379997715380691081905725535413187492183117;
    uint256 constant IC0y = 11025138851969003367054469624944932665047131159240378803043332702725479487292;
    
    uint256 constant IC1x = 14132138613656248797957246117351275299391263484231382377044543850971037993482;
    uint256 constant IC1y = 13320556396186880408561155332208938164649948308805759136071405877642568581257;
    
    uint256 constant IC2x = 3277697482368537303619194114354889193992050814487783121041696737661308833882;
    uint256 constant IC2y = 20198141054559549473626919902020225980558949863681591392241055299558898944234;
    
    uint256 constant IC3x = 13693155988558936401390903640585480351816337241013560396615832837634287245976;
    uint256 constant IC3y = 1930923772196607129395496220193120298079847090047142498960675152819978827096;
    
    uint256 constant IC4x = 6291016753280815947007495228970534678834141079194437252282504541879450439737;
    uint256 constant IC4y = 16902147945592330587634811963297220406219709510816980426257641030551299892475;
    
    uint256 constant IC5x = 12612000313106672252796638366100661245267453142867286483860551980158247150992;
    uint256 constant IC5y = 20870814698574321444386464352291044415424162355911984787922382290525308425202;
    
    uint256 constant IC6x = 16420320537273106652358121886937961105150354186113318840678760810455641762030;
    uint256 constant IC6y = 7153546922625601775750390724230095484000717880533861458567638685026859666736;
    
    uint256 constant IC7x = 5089353810408217826940697044289800728697679000674413615711189705104158530475;
    uint256 constant IC7y = 13220798556746187794181922816548581508083317999717023675786762340106962832158;
    
    uint256 constant IC8x = 16521528357054353706632205668478780380578537638043043655228839699248595461363;
    uint256 constant IC8y = 6981757652791914318289500333381497163668729112717599242884556528657809541839;
    
    uint256 constant IC9x = 10686666722791376862626835060654950123360838188032587189532639813379539621590;
    uint256 constant IC9y = 7495369445081289929498621092232882176465150396503978505632839268753377353020;
    
    uint256 constant IC10x = 6571982274085371445260438058650721502471580457698641072072957311496392457551;
    uint256 constant IC10y = 3721359922910338727726636660386662295759939838561492308883835075134593631544;
    
    uint256 constant IC11x = 931824149970358089834278306380588437262017003683754165148065556378702845503;
    uint256 constant IC11y = 13095148721328319394011685940663965309236539840742580687049556568176795165791;
    
    uint256 constant IC12x = 12060191436220550212570413919627573419954154081758431485958526494390591782596;
    uint256 constant IC12y = 15908459379193208809682998182724045924856891899583733307911113562586761095730;
    
    uint256 constant IC13x = 3880463314621606050896027931482084492770806837999926867328182673552501609142;
    uint256 constant IC13y = 19840374542100267171355470228182378420345011020004769925201972005295128684260;
    
    uint256 constant IC14x = 8297937496519115649587374509756353486245444541648294040527594742400525147537;
    uint256 constant IC14y = 4157857208695874202782317287525047816583667736412819586927345254594760314820;
    
    uint256 constant IC15x = 17492315893865759476171878724380793636210770551578288857852271124093663434265;
    uint256 constant IC15y = 5798725532076319225216288218641746227557590108788603685308010336626677214848;
    
    uint256 constant IC16x = 20813257339585405116877777776969642282495141914010605033214829641575606291508;
    uint256 constant IC16y = 4060496188171753649436843411852633077083702377804513476315099737412583148396;
    
    uint256 constant IC17x = 13075734410853576785785486245357092027991411216090362744642254600736079378771;
    uint256 constant IC17y = 4043773184091946426970376894943041502200391625513325113133219418643356455863;
    
 
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
