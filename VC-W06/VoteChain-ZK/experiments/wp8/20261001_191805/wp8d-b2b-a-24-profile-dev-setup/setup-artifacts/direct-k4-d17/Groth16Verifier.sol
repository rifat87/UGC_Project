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

    
    uint256 constant IC0x = 16045193186833317855622418983057393200539190540306563941965213041423120576804;
    uint256 constant IC0y = 15244658064666036699590788042950271325564522061816702808164931857874384090732;
    
    uint256 constant IC1x = 17089798226657012443036170582588705859940810172904592288609186784717140362963;
    uint256 constant IC1y = 12277493991405885081279709718484545217143486175034790705856474299104437329482;
    
    uint256 constant IC2x = 2751021059220491290372383628395499485129839794521621566095440958373529385599;
    uint256 constant IC2y = 19058376573587259540636071996632080762499483822408910430334069336331592094726;
    
    uint256 constant IC3x = 13633566852822792509530916125363906585822021562956829101748642028256061799455;
    uint256 constant IC3y = 6150056668185026412700237353646277017106547626618136340134004876006208151819;
    
    uint256 constant IC4x = 21416688708524665235270545415191263936599561705027727445740914094448620253094;
    uint256 constant IC4y = 1401219657891837876731303987390657103004043895118610839639012326202687719908;
    
    uint256 constant IC5x = 1875029734731736353818438813817403552806818870420031060365540540416081383022;
    uint256 constant IC5y = 5905410631509756048943171894596758432507945658281080542011799950640537641448;
    
    uint256 constant IC6x = 16716666946058982379500171410630612312095929481731602954575662961948182836989;
    uint256 constant IC6y = 15379315873849733950012465879458616009115074418992062982516452022262831353908;
    
    uint256 constant IC7x = 5658988492064372924707732006576337846065583233068753440433177463625762405981;
    uint256 constant IC7y = 19633216739517337867455484958411748258801430012750713760322348328144471483487;
    
    uint256 constant IC8x = 12582137663896002958839581430181041387017087032004454165503145067430460756166;
    uint256 constant IC8y = 11740686021384668890611458904848927273756702859913648137498864301445841952168;
    
    uint256 constant IC9x = 1302370533054022730779429095270338911151020010040271725444318239948084330612;
    uint256 constant IC9y = 4758102622844561095041224885976027322073241492332496314680439220347416080554;
    
    uint256 constant IC10x = 14926141813556545543430917950363915936894358485455482383315575799153299749730;
    uint256 constant IC10y = 8485039320968538297922534751329907770145731967720841217937175128351587639079;
    
    uint256 constant IC11x = 15885397065054761450965613467237495721416559248015073749355323628860805848067;
    uint256 constant IC11y = 21802577888481578279009113367952855063354140449490518905883798868049307138992;
    
    uint256 constant IC12x = 20453963693126121501777010455835624729440231264707729872729370060010854895071;
    uint256 constant IC12y = 9932940215191014177536343054485911622327879625628997202734533902267024768322;
    
    uint256 constant IC13x = 8433675202926442515391147061736607033865735152489258637208626365268234933565;
    uint256 constant IC13y = 3349287119046776795440803375358215663170184830867945387028182598755212324097;
    
    uint256 constant IC14x = 16573660646149651439301591951906567659248466739822511540136606036332474073594;
    uint256 constant IC14y = 3621621612798015303217916073690884758917499519084666999066831870948979307074;
    
    uint256 constant IC15x = 3862617721630239136038125736342515368364844372450712068746079814426254802824;
    uint256 constant IC15y = 19065803185089416805472878370758782382470365332668344560964714423945088243762;
    
    uint256 constant IC16x = 15555939681913120062087078886766889261879992553625782959968762920235891224951;
    uint256 constant IC16y = 1129273169989887274316777798151121263022437903932088452800580970839997703824;
    
    uint256 constant IC17x = 1825918946841050421127285910439343708216918966428415173134434519719436672112;
    uint256 constant IC17y = 4708111596055806499115626352500610600722819660170259197560211819587496838393;
    
    uint256 constant IC18x = 1074615874059136645983626378502629367846138717721942819618093981803033505260;
    uint256 constant IC18y = 14745704410650456303640282911116519270430409914946438111120336285406089146344;
    
    uint256 constant IC19x = 10813730789629330218339516101027097402928198563050829379218778960580407262791;
    uint256 constant IC19y = 9467119497597870937182942031926897721919918175566813550090309317672360181190;
    
    uint256 constant IC20x = 19741799493231328293528820811061303066346878244397523949946029550703194028942;
    uint256 constant IC20y = 16609841178353826191371795752628875381849028842921599534249715685480630239117;
    
    uint256 constant IC21x = 7505677385211342094438134083281097241907688256411684909836394679983389312981;
    uint256 constant IC21y = 14696375117331592582995345679190530572654123195133207666770323373896737763484;
    
    uint256 constant IC22x = 21673804110035255032179435090508914939100229855444085488321557637233805184329;
    uint256 constant IC22y = 16985476821775820961364555507496858068804851642930386719945434301321896721453;
    
    uint256 constant IC23x = 16673416245450332719853359501692780194410221436157604381365660715403196879675;
    uint256 constant IC23y = 3622800350557611411487861079614644120545081355100050559314838248110770381109;
    
    uint256 constant IC24x = 13071159213027241281900284759899550678701539676264032891905218551163016412484;
    uint256 constant IC24y = 13122473843155733668429523332989613758294475525832279157877369434725714421544;
    
    uint256 constant IC25x = 9269846018290422328434585311617300913893972993061989054066834022331316601285;
    uint256 constant IC25y = 20908047330469863072210417417604650112404195168664786067677441304114655588525;
    
 
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
