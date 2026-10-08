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

    
    uint256 constant IC0x = 823097430335265669315658173135261809049414571798979133831488253637967073714;
    uint256 constant IC0y = 12313864418559233747631692759311930546054234981468585173560076095289384928;
    
    uint256 constant IC1x = 11908224825382016832968430314482385800978725836533295594703152257452259188758;
    uint256 constant IC1y = 2303001176443394357039088693822051668480881423497293768582557732310491835410;
    
    uint256 constant IC2x = 14978413629373202796498177118565111182122744315817957467267753549550696627694;
    uint256 constant IC2y = 18500809153410364636208369445091397092455445999179669424574390342772490813845;
    
    uint256 constant IC3x = 2436733476945679223170749595694877148366656671609222212796293224480014249860;
    uint256 constant IC3y = 14876724765587300105372708474969415195611543369965676578570984442307799398138;
    
    uint256 constant IC4x = 19227767848199655299232856932870749716049389263648690255930201259751056921157;
    uint256 constant IC4y = 2997888490647298424406250485242756835106755965492747187795472153398106125959;
    
    uint256 constant IC5x = 17495602204769635573567786153456654505895572377434752109853548134708867436951;
    uint256 constant IC5y = 16568721672708347716190598080040491759154585044425412658633125827630577979918;
    
    uint256 constant IC6x = 3180310143569704030680621697982260209605264342307321757599803584184758885850;
    uint256 constant IC6y = 8163646383342378398068801293041773816451792188423859008122869412799559359680;
    
    uint256 constant IC7x = 12491455121715490447794074282158470671503283908521192674488462679402292513895;
    uint256 constant IC7y = 5525941149407433592548855475885624177618319897242623495686017936486989367964;
    
    uint256 constant IC8x = 1595005906942125487486986451841149317999512292191031054807267652416652397716;
    uint256 constant IC8y = 217326289789791686727817128370167674539690645629661475992239015454915038704;
    
    uint256 constant IC9x = 14022110031731344112078412435138963025421978956348451218502025607486640593161;
    uint256 constant IC9y = 3515302481984899190769555043203391882837189019873801215748652165421767452087;
    
    uint256 constant IC10x = 20572474289288076468057466882609053120112862279442266749332102040625010792046;
    uint256 constant IC10y = 9854542859648348076686156526142801635407902775525540878063046868850621391575;
    
    uint256 constant IC11x = 14388079948048458960104538438611856553955733054078117180750877026939193078249;
    uint256 constant IC11y = 6381724361050887055063801615396086142679875290221937847015029247085398413704;
    
    uint256 constant IC12x = 4008111588957022765564537516099950385633531507029251368049777679462420797314;
    uint256 constant IC12y = 277280295460613913527188442701506733509738457228177742130486981525859674102;
    
    uint256 constant IC13x = 21501732943231204265742648186340042587486959107200252822574223633349674900558;
    uint256 constant IC13y = 9414773483449335989458534732707884897296384505766889221717887101061285331161;
    
    uint256 constant IC14x = 10396920219524570301169754543968338812774244342634524777641283541169177858727;
    uint256 constant IC14y = 11418066006593946739868688004830216382167106936359458103321720549830362985539;
    
    uint256 constant IC15x = 3469196883706394275382423801210767919194145181902764272302701755794823982482;
    uint256 constant IC15y = 5015042437568412618168377076287582780072905313866494304466452230690996724889;
    
    uint256 constant IC16x = 16901587278027956326149861676412568142964257713485355614257726079591421617798;
    uint256 constant IC16y = 14250698609065657280770227774119712683801896512606118318161122954898042788291;
    
    uint256 constant IC17x = 19863288282133297809233251762404552312463901419177880056723879685632249356514;
    uint256 constant IC17y = 12375882389690868817868187307269495003530494160609344571077274479529341775783;
    
    uint256 constant IC18x = 3919265739028532932469059970402055580820627138179638405684070648470899845162;
    uint256 constant IC18y = 1236789903088387914698143149824772895844658907846829581965035355310160351413;
    
    uint256 constant IC19x = 16275346237175807139094649455347221018510996972659830655732471316721818992677;
    uint256 constant IC19y = 15483399213660568641545946756918247350663881342337028240427192431771821085553;
    
    uint256 constant IC20x = 9679180053826828416651612107967635517632885392472034312388171918512173006182;
    uint256 constant IC20y = 7037594898794672699873043347708034754087308226748737494224798696312007389823;
    
    uint256 constant IC21x = 12232041991705680226544221585304924344226305413346937603410313841514963031933;
    uint256 constant IC21y = 19879707910077753628068878487224731642092597944748500720499721244243041737831;
    
    uint256 constant IC22x = 19604878140880381414886561789166046518611908398065818993706499290330876749277;
    uint256 constant IC22y = 9334670205678727997781184531879076074419687287837854181211867988743524852396;
    
    uint256 constant IC23x = 12565153716167120301245160084428420738912584264953802120632333762910449626963;
    uint256 constant IC23y = 3152594722655681692322039818103092871955324195890615439150307991327941222228;
    
    uint256 constant IC24x = 17376205131821647453655124837109221537279935236639191731359835016774091484937;
    uint256 constant IC24y = 20112636915007931781301273866309597498293645521770927354126875662975552536565;
    
    uint256 constant IC25x = 275982185896830015547100707851827591634635268456721809937824746781017118998;
    uint256 constant IC25y = 11036354321368184764988993448192316316718769377317977702962966556806289067853;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[25] calldata _pubSignals) public view returns (bool) {
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
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
