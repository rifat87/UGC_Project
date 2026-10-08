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

    
    uint256 constant IC0x = 9958973988981084773414409736342728837933779785197553223283441066406058922253;
    uint256 constant IC0y = 16250193850288954583712495045578257186039867332187645315522601536450297151215;
    
    uint256 constant IC1x = 11060072677728290401844938296703225457096401715150284289343521423680375355826;
    uint256 constant IC1y = 826692905094332569087415123104042455161809478452174995020896408409192398442;
    
    uint256 constant IC2x = 10948007747084721464778490059971680268210082736577350606743869504535408446748;
    uint256 constant IC2y = 11147943896940021754758121087546201707997702893764869772979760366450572999576;
    
    uint256 constant IC3x = 7614093057305801332485474163108573863476429104744670732099024910785881609508;
    uint256 constant IC3y = 19011855222102495421557503120660704306848133792614543266521138789679394997236;
    
    uint256 constant IC4x = 21248802490552539212677549328693773452225345186675058266564660969313117625244;
    uint256 constant IC4y = 1860002411246934854156362804891401574299538552845438817000705941574215831442;
    
    uint256 constant IC5x = 17892519451167145059343779661259827209038775918418090508078935454489334227282;
    uint256 constant IC5y = 5827624306656867825690097540723836239261914494777169314059075469014852214947;
    
    uint256 constant IC6x = 14184396831572929982575474686865274767376571405870574498976803283058828112888;
    uint256 constant IC6y = 18713609938332227409436206041573567963978522405406268263072807297640033344681;
    
    uint256 constant IC7x = 4181786689682720339300109972375541220709237432636583714464601409178222870513;
    uint256 constant IC7y = 8729863124247349460878871653856536422496197524210046782441565524011399131770;
    
    uint256 constant IC8x = 2343434179097290202105888971132858997718287278033973887563903768706891042900;
    uint256 constant IC8y = 17182356179012649243676217488893303589906812278565493721620785909937333925867;
    
    uint256 constant IC9x = 14801588005193034095434574002099429881004801405587210600598067649675577862306;
    uint256 constant IC9y = 1044719519026159652852332413990662723121974605567855210249181057836674656368;
    
    uint256 constant IC10x = 4242204630118677989564148029043428440000796956562212890910989941686779137324;
    uint256 constant IC10y = 3326704228670417478906232918448870079755861933110308708208926818088190047724;
    
    uint256 constant IC11x = 1282792849163847326618587353388966567279915806153196725295419169185305400021;
    uint256 constant IC11y = 363550696508561367084818961851866494816701013637638936441907010587809806139;
    
    uint256 constant IC12x = 19837963893189980927964210326955767066240222576963015212309502368033764366613;
    uint256 constant IC12y = 17134709281608850141274932910576940240426677639813393098067365627242394143011;
    
    uint256 constant IC13x = 11607555652326935205251702300345467074636311443563625645621614456696429339476;
    uint256 constant IC13y = 6591394132164835159392092454811470345923102663732190216033174422713861362721;
    
    uint256 constant IC14x = 4270508904374331193949209391284533828548321853191646072035160168162540233384;
    uint256 constant IC14y = 17879447124943586054620727014035377735290679657099439730295389598433780792498;
    
    uint256 constant IC15x = 9676242169591111723001468621325064644633926695249378719338632812021507746126;
    uint256 constant IC15y = 4128812168529280722123151621987257863355792980889105893123382111188624959767;
    
    uint256 constant IC16x = 7436193803065997984620788943439749716715909242866949060594059603893957322482;
    uint256 constant IC16y = 8567300524812677075777597996252020702402304917388876674990078026398961580576;
    
    uint256 constant IC17x = 6858666340460282060168260722086999055344600738767608088146346961121847616669;
    uint256 constant IC17y = 16845912441856066182579687717423045573376867837915047914194037127829362149037;
    
    uint256 constant IC18x = 20583492352610404431094590609568740022943034867326313477391908842838463814651;
    uint256 constant IC18y = 5321569241665235117200932180351461113068981570955277900200186711685685181165;
    
    uint256 constant IC19x = 16916755159226543121887361895088896241092093548657170477958334093680952844938;
    uint256 constant IC19y = 1160586458825504548063116227236712739382964844812545482553099223897036249449;
    
    uint256 constant IC20x = 4753420938861133568370388232517825988678555320606939800436832709621630054517;
    uint256 constant IC20y = 2060531958119194235818418409973253120698192288874879927183033306449898884890;
    
    uint256 constant IC21x = 2580150139886659222165934796361544595992127957736543480888803697077058922931;
    uint256 constant IC21y = 11876461974664295655931870434064332395217664008660640704564317911539008019677;
    
    uint256 constant IC22x = 13344091117246515431039679687436807590626339297267669565050308145379075078528;
    uint256 constant IC22y = 7080558452644449902959155032229539210951471679064376809936848081695975374001;
    
    uint256 constant IC23x = 1643901865387533252125622070799482783952400528540204077384968373928062967321;
    uint256 constant IC23y = 3489657832446891199562698722502509255949359928191813683286343636037362884687;
    
    uint256 constant IC24x = 16178583673359808748774317423583589091876402798254130661307815363428349842147;
    uint256 constant IC24y = 14133128261151933970401291585866072685953706438410259570305667957908765068960;
    
    uint256 constant IC25x = 1879784048479872903779272233626917112052901062043622150834239343045784293937;
    uint256 constant IC25y = 6847909487950918812256505866280103694584583077322358305426184802456176398751;
    
    uint256 constant IC26x = 10576955588773418468038158827933899235868217254190060053758975487165719375185;
    uint256 constant IC26y = 2560842945547738031072198594821510088367230630467151920911901210290704146293;
    
    uint256 constant IC27x = 12897275404857058082923875470727264911022695000066763800040488725161266869461;
    uint256 constant IC27y = 15419716211465013842353912958246761147680979232947789694359142765078644630288;
    
    uint256 constant IC28x = 1153662461968620698800410227530448163162993580588038929016368838019790311286;
    uint256 constant IC28y = 10556708672685463636883805198123800274469457063597588745265168465634635643387;
    
    uint256 constant IC29x = 1771928458215911978421080064425204155641264523508210472061802281803230440841;
    uint256 constant IC29y = 19226245998182463426213295604636382291056944953633756080718204311628352400291;
    
    uint256 constant IC30x = 9837307250597029474303635010546197923391280084627821355898189167419420406257;
    uint256 constant IC30y = 18142275784340867295740311998166291129146590457218509780483301151266527322188;
    
    uint256 constant IC31x = 12830552156774499408399723756946654098771596681915792437214080034649245796191;
    uint256 constant IC31y = 9587779786804530784539762113328663231533394744624484839531345941566377333782;
    
    uint256 constant IC32x = 15392143742365529051001976257132065582866967967157057237753517051977358262448;
    uint256 constant IC32y = 10381421867852363718562511408952429359805462472767501705908300733925337018934;
    
    uint256 constant IC33x = 19249859880926458776247151648448798857533284908679821946077554657743808699426;
    uint256 constant IC33y = 5833622499112202813960889244449797028347270236534088578436447773448452256533;
    
    uint256 constant IC34x = 20885285331020486293022515360288521895779779961557463712168933191746539132842;
    uint256 constant IC34y = 3586288800694804405453590652413434036678152839573339608205947425323869660457;
    
    uint256 constant IC35x = 2524120913924850920773063688921617123185728012888826531415444025320886305510;
    uint256 constant IC35y = 12374415618577047212539400279442656428591313668955905535863236216873409899313;
    
    uint256 constant IC36x = 6131213801289292756778342289030466369318320189110264674277751469453595244885;
    uint256 constant IC36y = 5655370543076201403716156753984709253994255698481972068387663347806609703273;
    
    uint256 constant IC37x = 5329673938986369972535861715681494468458263158385912026437174606711853807166;
    uint256 constant IC37y = 7089660215503238351153285781984873057592761543444699937150921705826103035258;
    
    uint256 constant IC38x = 13485693196134873740490298837502017821939085714280767773444135279845522096233;
    uint256 constant IC38y = 14830645307922622729958155809029765263770028609494267971010770389301888341135;
    
    uint256 constant IC39x = 1222713029560619752863207126604735745418538932275279415226915480516592085594;
    uint256 constant IC39y = 15177354270833724067600335121379619269872276563001011762195832343142448263085;
    
    uint256 constant IC40x = 14120541535743939948260699952565286432749202849590685720797221386865476426022;
    uint256 constant IC40y = 10291715210109766379329808712639309985462233929216280352662548317944341416225;
    
    uint256 constant IC41x = 9877502863408574855780856616889834920406763767080911425460678039714804229976;
    uint256 constant IC41y = 5103916115728011073490973629563205006238825081292250851489906700231349694895;
    
 
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
