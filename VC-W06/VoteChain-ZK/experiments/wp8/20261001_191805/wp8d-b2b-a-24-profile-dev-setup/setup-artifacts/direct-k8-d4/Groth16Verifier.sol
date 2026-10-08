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

    
    uint256 constant IC0x = 10380486260347125124470756498452061162609996185388756173520169611674659363006;
    uint256 constant IC0y = 3578170455317325823983243579761360637019349549742313521372746111711017113004;
    
    uint256 constant IC1x = 8942870257756300728763196686839832862732527041080172305984198559885348859098;
    uint256 constant IC1y = 3036511581872814284074026108230139320869120094791728454785040431527677211029;
    
    uint256 constant IC2x = 9175682735819058690778318314641499443997931892569565386457285969680022843336;
    uint256 constant IC2y = 5586470566122685687652792928982871645790943618135543144934254838083696463829;
    
    uint256 constant IC3x = 19769254768192747980030091573131365596305478628019067651411642116001657168863;
    uint256 constant IC3y = 651792057345210115191309278530773890105953419550418590683257267957137221237;
    
    uint256 constant IC4x = 7335955459076116439236656955038660059917996221646991158499457061696875153097;
    uint256 constant IC4y = 16742006671283162560732599522472364271608979654857244970417844102727584735322;
    
    uint256 constant IC5x = 1293269661487930599244134095076925926220693855250633312104969385271961701124;
    uint256 constant IC5y = 5316950920109241371439239903380987957807565420869009271431755217002463810966;
    
    uint256 constant IC6x = 4416250648964561460744117977856840226056696504267065992612723407380349996468;
    uint256 constant IC6y = 5204207134538274676852694721515692086346708054252351298459934403245622886882;
    
    uint256 constant IC7x = 18476847322927316587418357854054802570863184731772483692640073325828817237118;
    uint256 constant IC7y = 490193124726951096364339097538574724069244303508183224529218447887883635975;
    
    uint256 constant IC8x = 9031471258650976007472923147450388299539556404897784029011911746126449364248;
    uint256 constant IC8y = 2677182791322636615752749004137377512453782572647708618093081299779296672562;
    
    uint256 constant IC9x = 8372288891698762870221227430419845801814635708765672660679931369602672990428;
    uint256 constant IC9y = 12497310628681964804832030823094955686662901560084460858967919925514724798431;
    
    uint256 constant IC10x = 9245559550208277447379340294853119521975783687016999285784606992056071738465;
    uint256 constant IC10y = 1812184289521755286250792927526492290645190748301968120529105610696520611189;
    
    uint256 constant IC11x = 5127896315841897338587022561781023086140714587078226179220490525217074112335;
    uint256 constant IC11y = 8631315732024413522415296459313215912791354154543347109800267674063856398227;
    
    uint256 constant IC12x = 17727678178260744319150893366048950269719112186220664292629682036035480922164;
    uint256 constant IC12y = 8226693056870623486741358589175672688934637294195412226911365427701614928843;
    
    uint256 constant IC13x = 3880616062718493678419407443271376373455626546266230439072542056722165343307;
    uint256 constant IC13y = 8937853199131416319955418668518099388721618571297715821076702684359610943392;
    
    uint256 constant IC14x = 6146631728328810861667568720182172595201248591257354334534435222214747651243;
    uint256 constant IC14y = 17472273362622984124807753891603666511463121782367835569338019252517725928334;
    
    uint256 constant IC15x = 16616680490172484398796221138763637706356913373896223813615202190794092620000;
    uint256 constant IC15y = 12600457676017482312305063397731446224412374956925348053371364374198002643780;
    
    uint256 constant IC16x = 8611093910720058155826221674699805074248989142522970400474409171220147387785;
    uint256 constant IC16y = 15800487448892104032464441429832023557812045861535064239410819583640658761077;
    
    uint256 constant IC17x = 9566664223175072445654565569040208129289233856262673349871945901944209099238;
    uint256 constant IC17y = 6013223623438899556122386589765378414595703249718762702797878689305657564238;
    
    uint256 constant IC18x = 7682723053341350998256562495346993421126566417348980539234566821195151197426;
    uint256 constant IC18y = 19314991363442553346927260864594057580596788282095742172911442055595143738499;
    
    uint256 constant IC19x = 13762755113774494852966101836176793138410015441091899662970386370135231117027;
    uint256 constant IC19y = 6822698536327941045508516814486210262234360946964912754641407486800867692103;
    
    uint256 constant IC20x = 4246645104692025728434109558129771030820491246317398500908400774071872891597;
    uint256 constant IC20y = 11673854113430434562355198142463763579397661643171156666315087577842754897044;
    
    uint256 constant IC21x = 7244041003260722856109757792444841844692212125611792951155421712351713148957;
    uint256 constant IC21y = 17209746883795515829167407215303030299339071709193866721024505567454032386225;
    
    uint256 constant IC22x = 14242294682905267277135042332158304448263819100704528811853454193353742928594;
    uint256 constant IC22y = 2548394338069021266509028301621975796292678479641987531485771360523416317534;
    
    uint256 constant IC23x = 6015912603391290417592465797920243282198053319434088767201493939315432661473;
    uint256 constant IC23y = 6299736159646118765938775765748109142330144664402963310196659462730488649372;
    
    uint256 constant IC24x = 21022410010207265776431819974859056781504533204578006793876849036580833553147;
    uint256 constant IC24y = 14329135526790223033261061217868319750553356157591049404993706031242715301858;
    
    uint256 constant IC25x = 8807075067316200983832938706347409316158123661734776650591448170162875807307;
    uint256 constant IC25y = 3515944119593474694813905820349343201851798870738348267469537157214662042924;
    
    uint256 constant IC26x = 7832846061768373821636653191753660677734474530918992799727305051846586294840;
    uint256 constant IC26y = 15065561831335630610247947250924023101647544522065825351396700395311333111987;
    
    uint256 constant IC27x = 15853660656330250286243633637584147902561096464142167034806838927041426785899;
    uint256 constant IC27y = 8369054793760326887357242034835591939670896335924971100029568022651315911678;
    
    uint256 constant IC28x = 8598588127763139702737951951299554374427498203979930373624618941322550592749;
    uint256 constant IC28y = 14927111100164124751830961357760238042661101069726501490339262126743208339219;
    
    uint256 constant IC29x = 7406434852689506689693685423917738326170477948844636493112361877061618990721;
    uint256 constant IC29y = 4867834791099108703135460330746661025019072475212062162372045150329234231115;
    
    uint256 constant IC30x = 16862143662569294281631768694399252563973371478726940221195160260819331844076;
    uint256 constant IC30y = 15029536588487190281328676225050782332793448492726981885983223251858334477953;
    
    uint256 constant IC31x = 13186196189690411862776431489379684224564249602796715617867954157359128230001;
    uint256 constant IC31y = 1690977918544397462099392985484397764088780444224113005695122968631528600009;
    
    uint256 constant IC32x = 2336785107790765587150556704338336791705342117795121269858775164118511757345;
    uint256 constant IC32y = 16230366088783352011763057834275072732608532880477339723095369147998128701027;
    
    uint256 constant IC33x = 16759214517325726117422057076861151923612746793371587301121691537117024578270;
    uint256 constant IC33y = 17852489134529343078006974553666275805021464589784924054416409339626796731177;
    
    uint256 constant IC34x = 5262788259265495854839409138566667692570828887052399734363484270754984612440;
    uint256 constant IC34y = 965219554587833577343183722514383022376113535226263754792332651681166351484;
    
    uint256 constant IC35x = 9535414669777225065088808722913506096520530023902573706504287112215219050356;
    uint256 constant IC35y = 15212310386834098530212424604816228700801817948100347692221007690872017075129;
    
    uint256 constant IC36x = 11158873574882061020619057060435999873532181636560119108233912175577790362388;
    uint256 constant IC36y = 11823984548767170165745685109173076486269046568768277911711753005806456274446;
    
    uint256 constant IC37x = 9998444454604968467878691447033160552748633290330552758646448452260463522778;
    uint256 constant IC37y = 16711318214982653584747186284792031211285278451998941643719273495625986903066;
    
    uint256 constant IC38x = 12191062843557890046301419922960419597953016496347716285496316682246329098705;
    uint256 constant IC38y = 4444421794057994612328229087733742235994036181456353246098814103743823313544;
    
    uint256 constant IC39x = 14742716874204126055943946291063538883211406802565596282856216045792447184037;
    uint256 constant IC39y = 5009262318805301299633082199641426985703381473083478517735974676345934866363;
    
    uint256 constant IC40x = 14161316455560828009452154294330179289221147396213464519079961068017812228374;
    uint256 constant IC40y = 4910522279443007300276323338252055470800480965105209941765364139868751184505;
    
    uint256 constant IC41x = 4449562467778321008141492517353331671608205547818696577894252755410795927901;
    uint256 constant IC41y = 9004642793949054744869889516207248271421700033258400303775689138925041316044;
    
 
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
