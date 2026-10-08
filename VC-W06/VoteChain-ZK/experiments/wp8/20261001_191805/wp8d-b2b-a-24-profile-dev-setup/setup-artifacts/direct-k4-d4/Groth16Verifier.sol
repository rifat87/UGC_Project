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

    
    uint256 constant IC0x = 15988238649269368094860149496503113754451680323080104799089277140550452055191;
    uint256 constant IC0y = 19301575127183046263675177476283341531766665887248367024236311736785984718146;
    
    uint256 constant IC1x = 3451810832174383971827360743137118624396100510293300794882961122028918799920;
    uint256 constant IC1y = 3432390395798627055121937487225799603315565122200160387564670438538025342014;
    
    uint256 constant IC2x = 21658049271090812802934871852687957390544815781780116002129104346834677761;
    uint256 constant IC2y = 3340569010262660155180808123872925513904133393269689725039344355999793209046;
    
    uint256 constant IC3x = 2637214534647313427804785014558690394533668149993292431173705796015718873868;
    uint256 constant IC3y = 3824649520459794291397946455255965758370502776224840126786399590213417522150;
    
    uint256 constant IC4x = 19128893440748351377716624372279748445290878980804112588925385806846287868152;
    uint256 constant IC4y = 724511790001537123771586938369149538995960800157694183116385380824168316764;
    
    uint256 constant IC5x = 2931562977830869867278926364106045006795287488289283436038224294849896148170;
    uint256 constant IC5y = 2614394001636523882070891548010551188070799217667371670340680351531041317850;
    
    uint256 constant IC6x = 15418278212704326349925011340806050970104692556026633367604264587173608244536;
    uint256 constant IC6y = 9526172858630059672394170850871061825755380067539662054802694720625483660820;
    
    uint256 constant IC7x = 4200275613933842625044147748787864102043618326256952953497707224080429115146;
    uint256 constant IC7y = 9278874496535490729182531070599155013658260557709115337284739031841782196404;
    
    uint256 constant IC8x = 9791716601792222051059948562178186319903565954480081201267017623421459409175;
    uint256 constant IC8y = 4624589489638907887102014842212436701271361753342052062797023781590986065666;
    
    uint256 constant IC9x = 14424597195240897104845094571204070696378743382273517657525377878529043781717;
    uint256 constant IC9y = 12921643994648856561303786275375062495072491374697369466571858913643522580831;
    
    uint256 constant IC10x = 7283929359543374102412650097604287911070044662612171314997852667696756641386;
    uint256 constant IC10y = 13766339724547356646500064393256981602628268711020256365451095954517845406268;
    
    uint256 constant IC11x = 10514663796920894903278090452403463703259050556727051357672605526159495657521;
    uint256 constant IC11y = 7030634740705931612392631211905822229172719355267214550248694212714962610845;
    
    uint256 constant IC12x = 14497921468377168863959032303458394881633261756023173729502216012816622201993;
    uint256 constant IC12y = 18723060000370407117485875520641660474604357516769539781577969535456979481789;
    
    uint256 constant IC13x = 11307247678261186634674358276421415254587274391640752310418819220115649021343;
    uint256 constant IC13y = 19951065056273520735125489327888626771785800102088763742612557300319023441791;
    
    uint256 constant IC14x = 7404621563739656606110730809863192974738833235985863720437197386755611650213;
    uint256 constant IC14y = 17997597648262785177478755972178153968922042652356346546001311487589211993719;
    
    uint256 constant IC15x = 3604404489852348884252179355865922355768929263441984716290467511037194600375;
    uint256 constant IC15y = 11440937241120665501368792031759479034566243114395932439494163888048743847426;
    
    uint256 constant IC16x = 16646177521974896917917564119949296073893667703060505446889678731272198460207;
    uint256 constant IC16y = 13988910359133228000610523819020674134765587855946194885290713890342483923358;
    
    uint256 constant IC17x = 10544978914888452429411265340141516723484305928956564315326878699415714036946;
    uint256 constant IC17y = 432054857382255975109718193291659011947667664910307993783420896175047824929;
    
    uint256 constant IC18x = 938868880212140934238032963557361058421951966859436245646742598000368373224;
    uint256 constant IC18y = 9111423119133461405587086652675299094810611413134658754674460228437987204846;
    
    uint256 constant IC19x = 7008685698740708320928753721956848391660993022279543100953754548125266148918;
    uint256 constant IC19y = 5876976166915478238705150523276173387394363341516321870558434567952750744299;
    
    uint256 constant IC20x = 16145892443376214879103516493498595145788239960246488398497336201580811151544;
    uint256 constant IC20y = 1082294981425687751831048438249109291368651533959683670012568946728138712419;
    
    uint256 constant IC21x = 5273810783257236292557924984249473642697020859113706792759762540946851986296;
    uint256 constant IC21y = 15219911721336867904993826123533828202637490082241337045106160507039139760712;
    
    uint256 constant IC22x = 134448722194068249401749698381400117482978923688928376863321955680372519241;
    uint256 constant IC22y = 2196060766106332984882964583967672569754033704645012360305652192077660147775;
    
    uint256 constant IC23x = 18427520640493746169998484412594139810636083594561154856967906339269435401691;
    uint256 constant IC23y = 14785526568220860358938845808543995787916392105964618764228011899363658665458;
    
    uint256 constant IC24x = 21725443927886638376773384893504669822009907944332606215394332931596956653284;
    uint256 constant IC24y = 5139971388289198242726299562714608468084023380416702581733181262485248447119;
    
    uint256 constant IC25x = 1040454924584789130731276092626566887637092970697241707838577219673421825219;
    uint256 constant IC25y = 9732316580777359361112976244246839893234716502063363281472717335078587263174;
    
 
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
