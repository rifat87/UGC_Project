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

    
    uint256 constant IC0x = 15367359437776880114670731936937077388354310641307944125317582281000538085126;
    uint256 constant IC0y = 13635406022960887087708621512416995689100928003879389622748985092045234702912;
    
    uint256 constant IC1x = 5603519223282682064580838499340804509558243779490110139673942938458231310253;
    uint256 constant IC1y = 5445990242109655375961819393992524942229042680725328448413836455141937512166;
    
    uint256 constant IC2x = 9384284986879613390220892034603404907742775504454920004492165276966331734321;
    uint256 constant IC2y = 83733908903055104032929270178500157942990188795003884118319992010589726124;
    
    uint256 constant IC3x = 15848200038031895872859060709790397289461635967114124945398108039305651087783;
    uint256 constant IC3y = 20000471382597540915387989542869278849120616997047055000119415747339427019443;
    
    uint256 constant IC4x = 4873531286319478505864850212029349730233770515242776792933227177946415004919;
    uint256 constant IC4y = 10485536666183819720387011588559426852982627032848312436514870876557559012928;
    
    uint256 constant IC5x = 4094489130380478127575512911181274560840689091946988604652276722585570913537;
    uint256 constant IC5y = 847104918045397986874371570864278112460182265668946991326563951802373323051;
    
    uint256 constant IC6x = 7205106273804770960341084220773503680593130306071011325459754481929514626919;
    uint256 constant IC6y = 19511992034120405981192848341261373817293248578733769418032629109069037246978;
    
    uint256 constant IC7x = 918982386105211682064775723672824396914415660313703778675559014199075666539;
    uint256 constant IC7y = 15861261656030225764797273480985003558628153864786382623348688953392015547298;
    
    uint256 constant IC8x = 10219102677039156556500131361477187848200421258869117039337330445894768979422;
    uint256 constant IC8y = 7912385052471061532067427122314757890825820175630856695870793815399140519485;
    
    uint256 constant IC9x = 21620976064305219081282293784693633774718490331214783311883812230348405106672;
    uint256 constant IC9y = 21676836950251529890525938682087752386607740458480997132669491863873671693333;
    
    uint256 constant IC10x = 20616973271295311278283816450736723240367882486864143076980736896606854967273;
    uint256 constant IC10y = 14943278634028174498688222588182777398082899557689675335840184736337404719141;
    
    uint256 constant IC11x = 19009082241203559852612343071923266286658154962880326658578856266664123602310;
    uint256 constant IC11y = 12554538185847451233638186768224314506014230610689290633655353027180364668206;
    
    uint256 constant IC12x = 4578705436539362499391188846259034395241201779104511834021680955991752262936;
    uint256 constant IC12y = 15308984489905487467602260001301948978751090448971622485179361189468975927361;
    
    uint256 constant IC13x = 6038459645366783656193900603466673249990968369658180778301729016196051794989;
    uint256 constant IC13y = 4509913075766318013966461561693701147977103902851960482191158963395537987376;
    
    uint256 constant IC14x = 6776165476402904325888618002761460842489682754224508163870325298410820340370;
    uint256 constant IC14y = 17954409935161646783377754563243465120755931939806894035041919284387120669204;
    
    uint256 constant IC15x = 1271850920423775686353200138428567231677813815966341815462994228428130399185;
    uint256 constant IC15y = 21366596880036988311732686889518075748316140916034834580475206671593851561523;
    
    uint256 constant IC16x = 10794222998083100118249543671552935687964303944185075393729513605864744112194;
    uint256 constant IC16y = 14207768466894324061314776490871517326514540890281609909478410778463999889461;
    
    uint256 constant IC17x = 2736158848404862081827017101374056477934929716713825138512089700003950180508;
    uint256 constant IC17y = 10662508857444316235517573886767049629173461429172256481986871555939626789693;
    
    uint256 constant IC18x = 19099620215795473578697858421309213795874812626753085788309688048665609271292;
    uint256 constant IC18y = 11403733136864336240324111926128276694339719766198374281086061739567065823464;
    
    uint256 constant IC19x = 9807650190292808754621640243852582705463410133499225211260727852782905315791;
    uint256 constant IC19y = 14244661885009883823133327537160113156522850748246199526947411028625393254836;
    
    uint256 constant IC20x = 12874315460867818651790061646953702370213296984162882315010969588639777954020;
    uint256 constant IC20y = 10824524864806306767843164060375028334070777488718099136161913285977789440677;
    
    uint256 constant IC21x = 234710607649888894488811309232444110864067241958111340869176823800349602063;
    uint256 constant IC21y = 7087835319059433091620771551458099304238443875144437687777238241520758047253;
    
    uint256 constant IC22x = 1955185048635378314254360866652269414519721978631840452368542305098980584582;
    uint256 constant IC22y = 19288591718460028968664474466349066492860112128662784253681593784842863942953;
    
    uint256 constant IC23x = 8043130363741596273638151511634492477756705656124515546877313077124395551021;
    uint256 constant IC23y = 18154145464358829866427897771044055800185428005931329276435219621133879774209;
    
    uint256 constant IC24x = 11179458780218494619893059530663672501045971585215665825839101381798072952830;
    uint256 constant IC24y = 14265466574279283756866484248073319591042022795337452424663285423866629353227;
    
    uint256 constant IC25x = 3395692209824788090645629566988653060547136126828715052838479461873550335835;
    uint256 constant IC25y = 13593233382634140895273867809914969102001754929603681975664530664898152489708;
    
    uint256 constant IC26x = 19200572810676826581716040200648574611522987621450684361533640804143923152490;
    uint256 constant IC26y = 12137158838014906178465361968846542894980879907004277484194223173333705566453;
    
    uint256 constant IC27x = 4052997272381158314151270978505951442698036709909603980071147394542259831645;
    uint256 constant IC27y = 8355703597985938412643995768940082727832170941094812340121212603329448926784;
    
    uint256 constant IC28x = 19893172289572268675174023682222598204025925311416512552078493009593630552274;
    uint256 constant IC28y = 12263574907273807035907572931711777855029354382675245810275630106987930706261;
    
    uint256 constant IC29x = 18011298029603370777711559062431501993957040719892044020851825909981078993505;
    uint256 constant IC29y = 9435437941415875059803354391833711804408803574056940112867746721361077482909;
    
    uint256 constant IC30x = 14907166293567039842736479620453187467474775583296951508563745915487451700416;
    uint256 constant IC30y = 15066727220546645730864116231605999960357865003390061709553798220916048245546;
    
    uint256 constant IC31x = 21837895120895758522873713244627675525230064765595400170301879278230981092263;
    uint256 constant IC31y = 7622942900080714553082934347088959493951860061634496392971656198679157331372;
    
    uint256 constant IC32x = 8176404877153981185138134758088225123435058064135477042178703531458056223385;
    uint256 constant IC32y = 3630936893011348665572291788118919556178658807550762755929365153320861907472;
    
    uint256 constant IC33x = 8811096267186699361969554601597044123869079507608157524995631437540759363773;
    uint256 constant IC33y = 1664874963327029556915755742725596908241396983471282956082350743327366246913;
    
    uint256 constant IC34x = 18705153072670831654647900331597720187889359503801829602645715438000894104538;
    uint256 constant IC34y = 10136052495314282960285870715714223362911955931693563316758357188262849181421;
    
    uint256 constant IC35x = 17190453327275204258960263049782422442158195413360995545539293379924509972436;
    uint256 constant IC35y = 16766245953082609761145311829466668160461608447618190459069915396602972299440;
    
    uint256 constant IC36x = 16864452466090939680130893604684909859243573836634066334337638200131741501638;
    uint256 constant IC36y = 12281548502007959180086767017884168724299173263653611851188321242174698281147;
    
    uint256 constant IC37x = 21657239907672729365142888510837602077816291430199168657104628057021541253926;
    uint256 constant IC37y = 18749114656571175203627744340133499765854435588573412108904321587009805869731;
    
    uint256 constant IC38x = 16644151402856790304759012051569868586847878926932508648728297325041566249661;
    uint256 constant IC38y = 8172051771670165189459968434098267808144172538744851188708111535214967716292;
    
    uint256 constant IC39x = 11254890326153306289933497147503355114184133035820209840956597133811840170503;
    uint256 constant IC39y = 7852326788008054536225373195161455131451621860922326794472305039148397192461;
    
    uint256 constant IC40x = 8654693034828544142009006223662477848925071240568953109708171077746353913528;
    uint256 constant IC40y = 15319025428377821166619435980636906265664539713567597867486684058341578879306;
    
    uint256 constant IC41x = 15171204503493601093351615549032819794771069887297077809364760344560465267767;
    uint256 constant IC41y = 18399189546235623927670329623821955331606962540011650037606307614071326298183;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[41] calldata _pubSignals) public view returns (bool) {
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
                
                g1_mulAccC(_pVk, IC18x, IC18y, calldataload(add(pubSignals, 544)))
                
                g1_mulAccC(_pVk, IC19x, IC19y, calldataload(add(pubSignals, 576)))
                
                g1_mulAccC(_pVk, IC20x, IC20y, calldataload(add(pubSignals, 608)))
                
                g1_mulAccC(_pVk, IC21x, IC21y, calldataload(add(pubSignals, 640)))
                
                g1_mulAccC(_pVk, IC22x, IC22y, calldataload(add(pubSignals, 672)))
                
                g1_mulAccC(_pVk, IC23x, IC23y, calldataload(add(pubSignals, 704)))
                
                g1_mulAccC(_pVk, IC24x, IC24y, calldataload(add(pubSignals, 736)))
                
                g1_mulAccC(_pVk, IC25x, IC25y, calldataload(add(pubSignals, 768)))
                
                g1_mulAccC(_pVk, IC26x, IC26y, calldataload(add(pubSignals, 800)))
                
                g1_mulAccC(_pVk, IC27x, IC27y, calldataload(add(pubSignals, 832)))
                
                g1_mulAccC(_pVk, IC28x, IC28y, calldataload(add(pubSignals, 864)))
                
                g1_mulAccC(_pVk, IC29x, IC29y, calldataload(add(pubSignals, 896)))
                
                g1_mulAccC(_pVk, IC30x, IC30y, calldataload(add(pubSignals, 928)))
                
                g1_mulAccC(_pVk, IC31x, IC31y, calldataload(add(pubSignals, 960)))
                
                g1_mulAccC(_pVk, IC32x, IC32y, calldataload(add(pubSignals, 992)))
                
                g1_mulAccC(_pVk, IC33x, IC33y, calldataload(add(pubSignals, 1024)))
                
                g1_mulAccC(_pVk, IC34x, IC34y, calldataload(add(pubSignals, 1056)))
                
                g1_mulAccC(_pVk, IC35x, IC35y, calldataload(add(pubSignals, 1088)))
                
                g1_mulAccC(_pVk, IC36x, IC36y, calldataload(add(pubSignals, 1120)))
                
                g1_mulAccC(_pVk, IC37x, IC37y, calldataload(add(pubSignals, 1152)))
                
                g1_mulAccC(_pVk, IC38x, IC38y, calldataload(add(pubSignals, 1184)))
                
                g1_mulAccC(_pVk, IC39x, IC39y, calldataload(add(pubSignals, 1216)))
                
                g1_mulAccC(_pVk, IC40x, IC40y, calldataload(add(pubSignals, 1248)))
                
                g1_mulAccC(_pVk, IC41x, IC41y, calldataload(add(pubSignals, 1280)))
                

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
            
            checkField(calldataload(add(_pubSignals, 544)))
            
            checkField(calldataload(add(_pubSignals, 576)))
            
            checkField(calldataload(add(_pubSignals, 608)))
            
            checkField(calldataload(add(_pubSignals, 640)))
            
            checkField(calldataload(add(_pubSignals, 672)))
            
            checkField(calldataload(add(_pubSignals, 704)))
            
            checkField(calldataload(add(_pubSignals, 736)))
            
            checkField(calldataload(add(_pubSignals, 768)))
            
            checkField(calldataload(add(_pubSignals, 800)))
            
            checkField(calldataload(add(_pubSignals, 832)))
            
            checkField(calldataload(add(_pubSignals, 864)))
            
            checkField(calldataload(add(_pubSignals, 896)))
            
            checkField(calldataload(add(_pubSignals, 928)))
            
            checkField(calldataload(add(_pubSignals, 960)))
            
            checkField(calldataload(add(_pubSignals, 992)))
            
            checkField(calldataload(add(_pubSignals, 1024)))
            
            checkField(calldataload(add(_pubSignals, 1056)))
            
            checkField(calldataload(add(_pubSignals, 1088)))
            
            checkField(calldataload(add(_pubSignals, 1120)))
            
            checkField(calldataload(add(_pubSignals, 1152)))
            
            checkField(calldataload(add(_pubSignals, 1184)))
            
            checkField(calldataload(add(_pubSignals, 1216)))
            
            checkField(calldataload(add(_pubSignals, 1248)))
            
            checkField(calldataload(add(_pubSignals, 1280)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
