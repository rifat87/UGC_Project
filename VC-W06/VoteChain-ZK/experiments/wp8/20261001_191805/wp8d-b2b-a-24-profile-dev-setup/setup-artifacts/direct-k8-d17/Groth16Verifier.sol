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

    
    uint256 constant IC0x = 19122663387744992185449112249854120974237318886640320169134046677067098084897;
    uint256 constant IC0y = 14219524492468714569888908790588452789245341222958111946703671303449106013693;
    
    uint256 constant IC1x = 2132084258962052260164352714393178551568701814389037351010560430701034834796;
    uint256 constant IC1y = 17208406027479068294979786389770359830756816000918167603382819394377410632465;
    
    uint256 constant IC2x = 10538228192923997835454764252074085900677934322347602985542861288103834364423;
    uint256 constant IC2y = 3993128637099739247746827086857155742900464512622946100149014982951376176071;
    
    uint256 constant IC3x = 2406904633944998716080110274391935455986804771819105461564510712345988342165;
    uint256 constant IC3y = 19926904966087056985040421607509423913529085525596221214331395009993118364701;
    
    uint256 constant IC4x = 350684945790301894336786329082118463654524117861603711317581222525000959536;
    uint256 constant IC4y = 17610359308015730139511362244180056223947412209690150279143758902896038752038;
    
    uint256 constant IC5x = 2534862826664173329186969018578389646713560332427434519287862527880668402575;
    uint256 constant IC5y = 15968172782009419507557831059766140791431722241132810525856379015104202623250;
    
    uint256 constant IC6x = 12120748906638590419722514667749876959020593508709249770672779029627399031481;
    uint256 constant IC6y = 1457227780385953322480821508589114349283868304557505708304092449597151504334;
    
    uint256 constant IC7x = 12125533169429637548815021419617825930234858896558808445740130409663923281742;
    uint256 constant IC7y = 3307477974902074599734270143083489932722183632140394738227829223857561001376;
    
    uint256 constant IC8x = 10400060765397812407111338528447044596472485941020464400118211900358608137773;
    uint256 constant IC8y = 635719074316485919616747391289670430986495246514160954699269840626059041901;
    
    uint256 constant IC9x = 6417584489705356839088792569013390700869455971335938796847942717551608682932;
    uint256 constant IC9y = 1949492891048425853993196159564903113673011704106567986608625123121151474583;
    
    uint256 constant IC10x = 19929278056780023351063655133433537800506275113487792177161313012573531078435;
    uint256 constant IC10y = 20917660457876171619915326257950272471678239415188303264333234019588324297561;
    
    uint256 constant IC11x = 9200043218641911624663660783515365716819919247295074325117569145785915889545;
    uint256 constant IC11y = 4459933465808780020796135876435130088711868368269697644726619078489984827425;
    
    uint256 constant IC12x = 13571371646879571039648283753546596730997501271560556428866991261465586146557;
    uint256 constant IC12y = 11511642249379906309468878644799689699714628203347293513829856964180796288703;
    
    uint256 constant IC13x = 5079305009546633081661590548919317615862865596246295192929004701345114943915;
    uint256 constant IC13y = 19750447261542184037352791748536882831786951592757456516337514027144507512416;
    
    uint256 constant IC14x = 4306325756659182508436611953532339158893719550570934929176621742137431875716;
    uint256 constant IC14y = 14832621088127460969015309320202643685403839265799604539518994425858760849127;
    
    uint256 constant IC15x = 12606124580774338239103196747221887003020028962377523677806830249262751867594;
    uint256 constant IC15y = 1652591960918496799215690828362952944004211148147519532235140670678042687914;
    
    uint256 constant IC16x = 17813338007997658264898333557169627826968853593936839987210103933969602249880;
    uint256 constant IC16y = 5944659348255265118756908653575103373232226597238930602059846509237851813876;
    
    uint256 constant IC17x = 8131087755555968841677351240089505511154974560491589127534363809676290778511;
    uint256 constant IC17y = 20604873501429076023450970092274063815015051955048013978049658252574326272397;
    
    uint256 constant IC18x = 4766885640652865317449228076350899752828441041368800907776986432164065981874;
    uint256 constant IC18y = 11334509142858833238149374333156564305072433062639312231069167429077585815214;
    
    uint256 constant IC19x = 18802834596739216046763897970874804054055913119019811569353237968680273658998;
    uint256 constant IC19y = 4046477915803104638080056417951084539284541339559158789579929936546758431553;
    
    uint256 constant IC20x = 18182253953363550675552455831459957883035896520193775789383716600761682955383;
    uint256 constant IC20y = 4777493983417765081017837226957721317965188344731042370340686652768029555899;
    
    uint256 constant IC21x = 8054847974085169254354296509225554180477103859398975473681092527744332993361;
    uint256 constant IC21y = 11643068429467238282656970121425012203912845177436814451925711362754746240299;
    
    uint256 constant IC22x = 10589168748761324604581141357451624116156198195342347523539586099750164078507;
    uint256 constant IC22y = 19275839132170835583335435765350993808961124103420117869001526916386103305703;
    
    uint256 constant IC23x = 15785379722173177802454325809034504711352580705401264032091865775198819107911;
    uint256 constant IC23y = 2240741637669783190337989373972862973792311083530875186436698654458453910166;
    
    uint256 constant IC24x = 9557369135742727947957483936666729880632403942456932819594312678563794402624;
    uint256 constant IC24y = 17100952980055658849364555288532911468029220026475464630399010167858489478213;
    
    uint256 constant IC25x = 16554106818545140614106915276261863625931489246333611421230098316206756059723;
    uint256 constant IC25y = 8553280395918275741013458045625935011944535246392235972935553763645932423456;
    
    uint256 constant IC26x = 1185260487181098001234953535818748700362921953426007328309729105821492194505;
    uint256 constant IC26y = 3837568961831735390486817620221501538158901054068885054126925087835928499607;
    
    uint256 constant IC27x = 210424877073645774847268796560282446112019925275700091747370699135523763036;
    uint256 constant IC27y = 11563438897012238470824959240635814341639618500358970340301564179918684932435;
    
    uint256 constant IC28x = 18492194951046870954452445046601132640681368787599455280147242158908223185797;
    uint256 constant IC28y = 5054239402708460060810429938303293173618824045244631466090139323733017034432;
    
    uint256 constant IC29x = 4746190826925672793992345725124647236982963278339192796340630553475485327779;
    uint256 constant IC29y = 17567812135831971927095930295106286791314416657075643418716689546112553667185;
    
    uint256 constant IC30x = 477605197538015338148658090066870642118266363909405673890346125847093025655;
    uint256 constant IC30y = 10906492029568717546928195056655461607347045602039957806344111620078489869067;
    
    uint256 constant IC31x = 11569512974554422747684438041493513310580296890807101114070044289819383150085;
    uint256 constant IC31y = 6132857382496885889143344667763740466161170951435677748352352505461961867974;
    
    uint256 constant IC32x = 2186356953332225541680175176763163529482325294756275546786532393874496485090;
    uint256 constant IC32y = 20782384334764232984694516986753402246244827154962380178813945316047862370994;
    
    uint256 constant IC33x = 19004728961724306531863080998483250081212914433796081919547855686020499007395;
    uint256 constant IC33y = 12700259326964160763646976058897761979672514338681456167214005284257204208723;
    
    uint256 constant IC34x = 8515231440183603356257826755211740387032746941540936747105254277695978217664;
    uint256 constant IC34y = 9767987926931356905903325913543839591592728298568629773516841626809853392010;
    
    uint256 constant IC35x = 6409713932151319894212868920921086278658917771106705530666351416829726593890;
    uint256 constant IC35y = 14087135727510484727045974001498227179215132685583945241473142695738973928074;
    
    uint256 constant IC36x = 4207110235936496061030727099819497377951993489884344085967914462813987012064;
    uint256 constant IC36y = 15269279382344846264430455381168443184318178788591958145426361461305494574199;
    
    uint256 constant IC37x = 21325971334892572296702401693159519651995137585990917190036871176319536590076;
    uint256 constant IC37y = 1183735598562836381196700390712188569133959828146075710759104074600165806206;
    
    uint256 constant IC38x = 18248376152460893681572307534292224314291346309067941271648839722451996477777;
    uint256 constant IC38y = 11432008314654390946045970127388491607057079410406040033950308695724372883274;
    
    uint256 constant IC39x = 10071300151025804052286486044558994482489218917503747655615792138390559480005;
    uint256 constant IC39y = 15666894374252004850060440702514104069141078098267877542485167339238726449861;
    
    uint256 constant IC40x = 16788222517256769275890741446900205214603516487578536772448793891302262754372;
    uint256 constant IC40y = 9532907678585847554467461983438637456209425569497448113746264437222901149422;
    
    uint256 constant IC41x = 2778593043997201194843221442627514993252778197111908318045706910038128436738;
    uint256 constant IC41y = 8693519153448902405339775567159753625665248969941215366246531030947564102435;
    
 
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
