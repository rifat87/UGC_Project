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

    
    uint256 constant IC0x = 10139830208058634802397313780378022418938356968770134354329205520992494219270;
    uint256 constant IC0y = 17783104132661079864303621800987281192830608764788804568053899009894886275687;
    
    uint256 constant IC1x = 10638018593427256716038991853277767263191079932198215816728406150158031340760;
    uint256 constant IC1y = 2967684770493322288970393606901093219216683250694962031466961641229330204364;
    
    uint256 constant IC2x = 16542842749059052963048665816163612450312972471763571960878678354700669445516;
    uint256 constant IC2y = 20914771695997953096700701531928069356682677978661325207294079936931552027944;
    
    uint256 constant IC3x = 11954136346993028700755259311952351559693135543094131611214224194716079301207;
    uint256 constant IC3y = 15060124490861698008434980480810250499739003407586399275527548023107027081335;
    
    uint256 constant IC4x = 4770033685876523321001019969303554366872304640972986184495031913080534279399;
    uint256 constant IC4y = 5209334349173929184957448528358665632832025745279227750558503232332214559914;
    
    uint256 constant IC5x = 515651329395504995089721387465830297465754524056534990114960404384021911752;
    uint256 constant IC5y = 13373643726394197590817148670400946713783763818264994766738006309102785030479;
    
    uint256 constant IC6x = 11627465217482740074549355310493998062846774363681685006065446553657796173399;
    uint256 constant IC6y = 7173187500483908910304197586939323059147845475467316722455968244668014481248;
    
    uint256 constant IC7x = 18577562159776959217856226654852701541174898140995505349027673046695471342272;
    uint256 constant IC7y = 6527640810636152073947970955880378191137505489557951127275320749256013947217;
    
    uint256 constant IC8x = 20413123191803403773183960938718716550086877761820422262103124513381931129801;
    uint256 constant IC8y = 1629739648879126013039994138258024202737504738437067226943672448483954019080;
    
    uint256 constant IC9x = 15733642336683779944597550056279433638633694457640321307034446227356641815606;
    uint256 constant IC9y = 14395034152426422578043854343564389045196037939339233997673951351875049101215;
    
    uint256 constant IC10x = 17261219033369031787026312595618505147673760032823043550874947566539163504374;
    uint256 constant IC10y = 6880961000587504622607121245852584551532553516443788565675453834952625851208;
    
    uint256 constant IC11x = 10626866513088317543361090466706422844670212633081504661465747569000740337622;
    uint256 constant IC11y = 12155530120391238045249924730257678055168592696380488499646181775587360506341;
    
    uint256 constant IC12x = 6348652727582200712405293317142362313417077435598975005753905982391254104962;
    uint256 constant IC12y = 13462384676679971168361826821164534242425380574358774337716133496382278700924;
    
    uint256 constant IC13x = 6998032341152027531112976391692071823572661135095755550150669013248908692411;
    uint256 constant IC13y = 9936885263185899637137827969134947961565285710303678730754592063435347561567;
    
    uint256 constant IC14x = 10967400145565458886284699882785673192434459743388605863132636809359175642779;
    uint256 constant IC14y = 9409313433250143306577835110492951137048526492519486638617367726523190329536;
    
    uint256 constant IC15x = 16949387638995141044784749817192808829238356143672694663100042129084974968430;
    uint256 constant IC15y = 9744374212499767787833583865114763277229085880776638041671050027631604132255;
    
    uint256 constant IC16x = 10901082276985124665486635899128207261934902443127296604772233067354005098181;
    uint256 constant IC16y = 3447728806682887826726391988899636302485149483084383947514031556567180254421;
    
    uint256 constant IC17x = 15574442389530543547244869699760065213673159254681623224931504751753279542171;
    uint256 constant IC17y = 6156003456852011412691305258822121977118014054542401981743963576129110049481;
    
    uint256 constant IC18x = 17590486141579468369875999217524005462799735388588473114304219440031871774528;
    uint256 constant IC18y = 19921679310509467084610291777183329691364578167643276717053935794969395257625;
    
    uint256 constant IC19x = 6543407135586982355189895490447143028850094546150491318692139549542590045238;
    uint256 constant IC19y = 4745374450330609697357730965133205197116581954887000310509672325227204978451;
    
    uint256 constant IC20x = 17231057507944478490185905082810548628177334063816945445154873557148502134432;
    uint256 constant IC20y = 13077571060959576194120759046990571594496739267035188688340226355897820454591;
    
    uint256 constant IC21x = 14614756926416226296397887764232004614791789067000986459244804394286076555095;
    uint256 constant IC21y = 9957533617100837000796696784241838642560861582719660821293505044609414369964;
    
    uint256 constant IC22x = 3319459514565986795554160625228454246227246930239663436084406865928508454110;
    uint256 constant IC22y = 20111987114567284927889074140530204737183017737989058950311017396721278030232;
    
    uint256 constant IC23x = 3227476534466798504278239842512792133595448581527473601096718431904412575331;
    uint256 constant IC23y = 615383763108855432103868582712459535039669812251648107823497848596547840514;
    
    uint256 constant IC24x = 21678861532016415180191036909963905829161752646984511310042827427107851728502;
    uint256 constant IC24y = 21278869100504469060433125507842335830019359964860757623002566477682967392827;
    
    uint256 constant IC25x = 1836304629932024454324052032343922803695975247306841004423083378781255193319;
    uint256 constant IC25y = 1198413041849450139911581038632525423556980806793027419416234483715881422204;
    
    uint256 constant IC26x = 20095375884850003197249977040692657755611574426975512946982137344488743195466;
    uint256 constant IC26y = 7129927996580858416283039954084239372933778384867653235900045186027974878988;
    
    uint256 constant IC27x = 7817412246383619954860445299028459187061059822675749442494960167824413509997;
    uint256 constant IC27y = 6149588567980601905132338958901652312844007413594116396559285916049704766512;
    
    uint256 constant IC28x = 11030253781463617635971173587620063744924450251102066908540766763951330287946;
    uint256 constant IC28y = 658319187867241903954809883410212998801351117886100339940196056345086094356;
    
    uint256 constant IC29x = 18588598284668548306597266968220117693815235627078245149485235464221807870699;
    uint256 constant IC29y = 21085237291476699086511490819986981336776665841767343302221468899895758428395;
    
    uint256 constant IC30x = 6005282105414730301689312229954651705654996309311648042449217037637952407486;
    uint256 constant IC30y = 12825089358694700547344118107207085238430223933353738989538994802231433117377;
    
    uint256 constant IC31x = 16371595356282817765226060678897127400100160588108025961908122385614351819038;
    uint256 constant IC31y = 11795946412102849920251593702986251799276265926136885052924995540989458357130;
    
    uint256 constant IC32x = 5484999544476779619219489884289359513374025512206689295121889329066638025625;
    uint256 constant IC32y = 7669470241571164691497453349005204143912058031523672862005719941434612809111;
    
    uint256 constant IC33x = 10995442481585594738139046255803545078230621603087194835892497089768369925302;
    uint256 constant IC33y = 11140316571123406994570296999880849805716140395775240588774409845776346072932;
    
    uint256 constant IC34x = 3112084571126806498098921293358343760304478342474532770846444824040402872022;
    uint256 constant IC34y = 11665301086683946763130234352346081135590309771858977732521101499583921139260;
    
    uint256 constant IC35x = 2856245172979277247912197233241066596136537299287541406535101884498636691682;
    uint256 constant IC35y = 17512040277167407212850581494968001775965104460684784078842388288387144009802;
    
    uint256 constant IC36x = 3269977359368119368171197975610247434767984593807738116495239713726875319373;
    uint256 constant IC36y = 17446108617296877152867064527438765216510505551665607997607768594449295219799;
    
    uint256 constant IC37x = 4928485124761582920205035428125070419943405725555384186190365122576575499991;
    uint256 constant IC37y = 18572764613281808170485516854867050956756806540605283882331006559799165470470;
    
    uint256 constant IC38x = 19253857819077256146315326796175140414269182778706792275995606058366519815199;
    uint256 constant IC38y = 1010637760020759013913009248296416329002379968415996416624431291261532674407;
    
    uint256 constant IC39x = 1167503630915432264957026030811178144470141880427295267531184860084993225563;
    uint256 constant IC39y = 19975041238397793130983490513352276909590904752843062175084871574566691241160;
    
    uint256 constant IC40x = 15787106752357466906064567195667371496719215050363172071397319831193563246657;
    uint256 constant IC40y = 9177174426438038313460383647791018944456442916673046410461659518402406829329;
    
    uint256 constant IC41x = 18788472154901807171943235836829407578782339101622933650577055130253160218690;
    uint256 constant IC41y = 7331866052449256414483098532560454582207507358181072613963763746843589291970;
    
    uint256 constant IC42x = 11026268040589538381496488911879410459044774679671565405492057829759842790853;
    uint256 constant IC42y = 813525975245731708552996559594127779660442767729250226910441571323928525794;
    
    uint256 constant IC43x = 18003561423283345317851398889051590346452878656172003778482381795133497531306;
    uint256 constant IC43y = 11052930755316194192853004076412766989225005416757143254379103762119145292461;
    
    uint256 constant IC44x = 14523309736909657523341890488594148926139735831138643344046677397276401376136;
    uint256 constant IC44y = 6592052942532010527636558981492372438570435420873404217623680141456921426506;
    
    uint256 constant IC45x = 12595298045414308206755019094622638272133999918206518859734154822066454881856;
    uint256 constant IC45y = 11709825036130803579952939002827652485458478967863179596799387676345546123661;
    
    uint256 constant IC46x = 12488333343741800147005397776791446060575325854999805735186701941013320459544;
    uint256 constant IC46y = 8292223821464341217823224957388081477359506958643074420277397872125808565946;
    
    uint256 constant IC47x = 13845036290088849248001008409011633203771198051427477273252733340045977330144;
    uint256 constant IC47y = 20453573171971708366615893842925743614583586963377044587660283719738906099430;
    
    uint256 constant IC48x = 18534830708228780049034247456427920263481915571703745050382430224255421910772;
    uint256 constant IC48y = 21085679649791019226491321391908476288958928442829018020155524062542937568078;
    
    uint256 constant IC49x = 10265666684587726136142121269575472023812934791041411343357488121918926415383;
    uint256 constant IC49y = 16234082568477055169032259559095841209468038693183778495430479590971415206045;
    
    uint256 constant IC50x = 19206167136898624872833958528677516745844297037285713896612715476074319604725;
    uint256 constant IC50y = 1179958284970089361268312847073880619585854263513087706167218072688347969015;
    
    uint256 constant IC51x = 18765311339943790076499338199374825151202112616792669585886210851950275992531;
    uint256 constant IC51y = 11431329918167086404269363967255739131627933477800364049316844816897094004355;
    
    uint256 constant IC52x = 13927273034369823598008312301503103385869848829615734576688961573203448134617;
    uint256 constant IC52y = 11769197881357223311366157649563193969915856207501138861151393183615443753029;
    
    uint256 constant IC53x = 15156894465942073925672648783226948816313812513860439957009270191320989540639;
    uint256 constant IC53y = 4248831390646876556139042197780112504277777418376405249793806028714553917919;
    
    uint256 constant IC54x = 12448646456451526130471013780926378480668664086368585336827647636115602923291;
    uint256 constant IC54y = 349630025383712289664069334166098092434603687150160739132779208334105680425;
    
    uint256 constant IC55x = 20681884232788948281386927027707236653423713040500939885983892234933336487462;
    uint256 constant IC55y = 13974786182665182130252114765152166045388229308136070104998303595010371429015;
    
    uint256 constant IC56x = 6787639033966653836657019844188430109217374425981498724441488671031245012398;
    uint256 constant IC56y = 7503490924076699660670033517658509907696939596281356475662701191524933815033;
    
    uint256 constant IC57x = 12353204142669480546006910482418156816694325781835785414297347192694990921495;
    uint256 constant IC57y = 9044267937636430527475403645992252714442273190625050450092972417672198975096;
    
    uint256 constant IC58x = 9734480200617843922873085907521117418012556678261834683035654141199223220460;
    uint256 constant IC58y = 19476124731620413047887325990193041027821172612593584892441146190409380016599;
    
    uint256 constant IC59x = 15314878250893792220785236184341039690648953287133723318062029754505279877513;
    uint256 constant IC59y = 8298219287059098353373058688587251591566144854204192971172049608035023498805;
    
    uint256 constant IC60x = 7085987899664015234148002011309813372118287190774080972768779353769203183264;
    uint256 constant IC60y = 11364241124178644671166090370828663721616659225744654035482771887483657236743;
    
    uint256 constant IC61x = 3209984109304017258186611729929344111936032009235916845335351681077740914280;
    uint256 constant IC61y = 1122731956315884309370758063178532002699302891953613646564939846549387894064;
    
    uint256 constant IC62x = 16329401429491640507814439342901189158478389883333600624806123058430585964678;
    uint256 constant IC62y = 18462732764078759091632890664557327096749556327228489309886916013677073113079;
    
    uint256 constant IC63x = 13903368879929706342287886685377505669687773880928721799827780475683332843838;
    uint256 constant IC63y = 15768978242349246398965349849633869052116069659934066382375941358268435761056;
    
    uint256 constant IC64x = 13835100075569955380429687646274160754576159289737099846795225514729927286104;
    uint256 constant IC64y = 13539536422103039928127900609126681196739523649309326764995787917018734751813;
    
    uint256 constant IC65x = 10385923822953614790428251261826250940146873476538551132658211862419127438687;
    uint256 constant IC65y = 8149776953604684374129554120823498864725649121772566727739095232451468434613;
    
    uint256 constant IC66x = 17723282955898037794102350287315599503746334898647600833419425605549119398553;
    uint256 constant IC66y = 16249656067349312068934632528104657860605139983365668522760642549000765787475;
    
    uint256 constant IC67x = 2594854231891546120514867130074958172679493515268509917433777684613188463134;
    uint256 constant IC67y = 5369713991642930877668635326889115690796378688029791036419399525696448569210;
    
    uint256 constant IC68x = 2642484220155742098411252754745172375529415516026672150650759311738817764317;
    uint256 constant IC68y = 4193999635810849600669661672464479263865969199070680649282958531909997768037;
    
    uint256 constant IC69x = 17980729121663875275763696033998423522458001921451980791534977564325801991458;
    uint256 constant IC69y = 16926759978970871281692486070958842207307501610018155229123227617601375415436;
    
    uint256 constant IC70x = 5638782325377334224168189791561688377930400915792985790669834302843409412202;
    uint256 constant IC70y = 2545676061796746967135123640048413735249908575779663593317955422064126589297;
    
    uint256 constant IC71x = 18861961121404546345086697737922810773594965733847146609215075656086670556003;
    uint256 constant IC71y = 18354520334008205853752368606955633998709103825639038141446849612749118797537;
    
    uint256 constant IC72x = 904559779676198380298709739057478373063880939272521985677179442299472423368;
    uint256 constant IC72y = 13419242091979399142433640201573527595550362872169510581125429468833521267672;
    
    uint256 constant IC73x = 9408427796923510748568326529690743891503009850833667455792839900409749220560;
    uint256 constant IC73y = 13848063342244655784390523540814556974620313535508683287269761986830747004878;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[73] calldata _pubSignals) public view returns (bool) {
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
                
                g1_mulAccC(_pVk, IC42x, IC42y, calldataload(add(pubSignals, 1312)))
                
                g1_mulAccC(_pVk, IC43x, IC43y, calldataload(add(pubSignals, 1344)))
                
                g1_mulAccC(_pVk, IC44x, IC44y, calldataload(add(pubSignals, 1376)))
                
                g1_mulAccC(_pVk, IC45x, IC45y, calldataload(add(pubSignals, 1408)))
                
                g1_mulAccC(_pVk, IC46x, IC46y, calldataload(add(pubSignals, 1440)))
                
                g1_mulAccC(_pVk, IC47x, IC47y, calldataload(add(pubSignals, 1472)))
                
                g1_mulAccC(_pVk, IC48x, IC48y, calldataload(add(pubSignals, 1504)))
                
                g1_mulAccC(_pVk, IC49x, IC49y, calldataload(add(pubSignals, 1536)))
                
                g1_mulAccC(_pVk, IC50x, IC50y, calldataload(add(pubSignals, 1568)))
                
                g1_mulAccC(_pVk, IC51x, IC51y, calldataload(add(pubSignals, 1600)))
                
                g1_mulAccC(_pVk, IC52x, IC52y, calldataload(add(pubSignals, 1632)))
                
                g1_mulAccC(_pVk, IC53x, IC53y, calldataload(add(pubSignals, 1664)))
                
                g1_mulAccC(_pVk, IC54x, IC54y, calldataload(add(pubSignals, 1696)))
                
                g1_mulAccC(_pVk, IC55x, IC55y, calldataload(add(pubSignals, 1728)))
                
                g1_mulAccC(_pVk, IC56x, IC56y, calldataload(add(pubSignals, 1760)))
                
                g1_mulAccC(_pVk, IC57x, IC57y, calldataload(add(pubSignals, 1792)))
                
                g1_mulAccC(_pVk, IC58x, IC58y, calldataload(add(pubSignals, 1824)))
                
                g1_mulAccC(_pVk, IC59x, IC59y, calldataload(add(pubSignals, 1856)))
                
                g1_mulAccC(_pVk, IC60x, IC60y, calldataload(add(pubSignals, 1888)))
                
                g1_mulAccC(_pVk, IC61x, IC61y, calldataload(add(pubSignals, 1920)))
                
                g1_mulAccC(_pVk, IC62x, IC62y, calldataload(add(pubSignals, 1952)))
                
                g1_mulAccC(_pVk, IC63x, IC63y, calldataload(add(pubSignals, 1984)))
                
                g1_mulAccC(_pVk, IC64x, IC64y, calldataload(add(pubSignals, 2016)))
                
                g1_mulAccC(_pVk, IC65x, IC65y, calldataload(add(pubSignals, 2048)))
                
                g1_mulAccC(_pVk, IC66x, IC66y, calldataload(add(pubSignals, 2080)))
                
                g1_mulAccC(_pVk, IC67x, IC67y, calldataload(add(pubSignals, 2112)))
                
                g1_mulAccC(_pVk, IC68x, IC68y, calldataload(add(pubSignals, 2144)))
                
                g1_mulAccC(_pVk, IC69x, IC69y, calldataload(add(pubSignals, 2176)))
                
                g1_mulAccC(_pVk, IC70x, IC70y, calldataload(add(pubSignals, 2208)))
                
                g1_mulAccC(_pVk, IC71x, IC71y, calldataload(add(pubSignals, 2240)))
                
                g1_mulAccC(_pVk, IC72x, IC72y, calldataload(add(pubSignals, 2272)))
                
                g1_mulAccC(_pVk, IC73x, IC73y, calldataload(add(pubSignals, 2304)))
                

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
            
            checkField(calldataload(add(_pubSignals, 1312)))
            
            checkField(calldataload(add(_pubSignals, 1344)))
            
            checkField(calldataload(add(_pubSignals, 1376)))
            
            checkField(calldataload(add(_pubSignals, 1408)))
            
            checkField(calldataload(add(_pubSignals, 1440)))
            
            checkField(calldataload(add(_pubSignals, 1472)))
            
            checkField(calldataload(add(_pubSignals, 1504)))
            
            checkField(calldataload(add(_pubSignals, 1536)))
            
            checkField(calldataload(add(_pubSignals, 1568)))
            
            checkField(calldataload(add(_pubSignals, 1600)))
            
            checkField(calldataload(add(_pubSignals, 1632)))
            
            checkField(calldataload(add(_pubSignals, 1664)))
            
            checkField(calldataload(add(_pubSignals, 1696)))
            
            checkField(calldataload(add(_pubSignals, 1728)))
            
            checkField(calldataload(add(_pubSignals, 1760)))
            
            checkField(calldataload(add(_pubSignals, 1792)))
            
            checkField(calldataload(add(_pubSignals, 1824)))
            
            checkField(calldataload(add(_pubSignals, 1856)))
            
            checkField(calldataload(add(_pubSignals, 1888)))
            
            checkField(calldataload(add(_pubSignals, 1920)))
            
            checkField(calldataload(add(_pubSignals, 1952)))
            
            checkField(calldataload(add(_pubSignals, 1984)))
            
            checkField(calldataload(add(_pubSignals, 2016)))
            
            checkField(calldataload(add(_pubSignals, 2048)))
            
            checkField(calldataload(add(_pubSignals, 2080)))
            
            checkField(calldataload(add(_pubSignals, 2112)))
            
            checkField(calldataload(add(_pubSignals, 2144)))
            
            checkField(calldataload(add(_pubSignals, 2176)))
            
            checkField(calldataload(add(_pubSignals, 2208)))
            
            checkField(calldataload(add(_pubSignals, 2240)))
            
            checkField(calldataload(add(_pubSignals, 2272)))
            
            checkField(calldataload(add(_pubSignals, 2304)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
