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

    
    uint256 constant IC0x = 16600044362417772167039363339449093171168425318944628000071596050021172585774;
    uint256 constant IC0y = 19803149824544339449279877384857860407903155718791466772417060348824036506223;
    
    uint256 constant IC1x = 8834919457164541544095145020617115832417801391929096805000581091205648915371;
    uint256 constant IC1y = 224295320746224413527416865492446246829616483012726559798276422864820765524;
    
    uint256 constant IC2x = 8895255233391824964823265019564038024786584842868393898682673861227789663698;
    uint256 constant IC2y = 13417579957776508433881177265361286230865452779100970137973966109160375203508;
    
    uint256 constant IC3x = 2320218868706590675581976176233414022252897307949000312875764498086630748430;
    uint256 constant IC3y = 35758431312390146415327216917827203444776370506414330625512682259421099081;
    
    uint256 constant IC4x = 7266052379276882977127685559319863583492743747487307144291952066629543973305;
    uint256 constant IC4y = 17919697086758813594964352129043048170096980430522356033939117706917104621794;
    
    uint256 constant IC5x = 20656801993217947632585831252388132374173306967843528514121922247129598427032;
    uint256 constant IC5y = 8426107412009821503938624497394955222352680562458066604693165754889473217996;
    
    uint256 constant IC6x = 19974396398138153884211054529313697764738273635321806201686330900023683540008;
    uint256 constant IC6y = 574061421493874839939652896682678827749296350375589636969438950800872885413;
    
    uint256 constant IC7x = 9794594138480495398584562857200571125466264311786662183843075955973242518502;
    uint256 constant IC7y = 8500244733588852538957077252692669698351971643168813899918962506404219960337;
    
    uint256 constant IC8x = 20230050504490149254311829912222370016607834691366799251601701847733985177254;
    uint256 constant IC8y = 11011707163944586255731142962062557795367850787236844856111748814062380530678;
    
    uint256 constant IC9x = 3210250418474307446632035238629384316758861526588423795556233503884890796698;
    uint256 constant IC9y = 11103599311012439303691483614444248866181224654623246654863538411529759725258;
    
    uint256 constant IC10x = 15523140957242035445904233810788453297906514636136905047496424915043900415501;
    uint256 constant IC10y = 6985496633976591029088318472420399505633845146549821152399391279455325715902;
    
    uint256 constant IC11x = 13705522352878263320610503533284852937705035709976216823095561662868996821834;
    uint256 constant IC11y = 17381826664423337176482874576232998864833576255219383829093620711323805004611;
    
    uint256 constant IC12x = 17392829033165379008621518988930204506669589544576769926336367249843123101856;
    uint256 constant IC12y = 19895065193292680720116269662686607616348575133086145609827718340937692456213;
    
    uint256 constant IC13x = 15686686377411624168213263654525924629229082720356945150415494611024469550540;
    uint256 constant IC13y = 1406011144827583117407086882291107525616349419038913384919808691103391445723;
    
    uint256 constant IC14x = 2181878393364931767323443523152107039128234307482372807028378101911017961472;
    uint256 constant IC14y = 14259011024447217661558388777492341146676314184579824963293825445159096452803;
    
    uint256 constant IC15x = 10381729714077240507673870523718389228828064363577920367519942321993140154323;
    uint256 constant IC15y = 14008410393480285222029962626803418990075644076394671707513911981817310867631;
    
    uint256 constant IC16x = 6767695492849248734873129547132189941399073772581637190963958518859625246878;
    uint256 constant IC16y = 5694936196812799369297935161357977582210554677285567025131799587516821575758;
    
    uint256 constant IC17x = 21043133414677181690377059624372733323987430465605914140348422440702786439633;
    uint256 constant IC17y = 5309896029563659347600569241875717626017796955937262803003085984181791726757;
    
    uint256 constant IC18x = 20680829925782686301836195056543757886044860009931116498705196291840582262260;
    uint256 constant IC18y = 19294974762928560612863787024842641719326032860342448414705498266736105286805;
    
    uint256 constant IC19x = 11042093845326080727990689024246346749023706575988212128943174623088541769713;
    uint256 constant IC19y = 19380986139086114658214692116470865859083835146394589630817083698523265441971;
    
    uint256 constant IC20x = 15526085273744924813929011740243759139488017936479308934124789952109795853047;
    uint256 constant IC20y = 5189594125636205357369979850972217693873111685033069887197751929868438007100;
    
    uint256 constant IC21x = 19588272076711163442289879472168155319374104865797816926485526285445067400837;
    uint256 constant IC21y = 699145209036443685887965913947648484273336618987166955992442250053280836488;
    
    uint256 constant IC22x = 12287486051987450359486552016910797043562001306712721395601821308621158969522;
    uint256 constant IC22y = 233509294194377672457390086437760314583676332093363757425898440304557726624;
    
    uint256 constant IC23x = 293536482476698249712294436805957432691406164982575860253759615479021066277;
    uint256 constant IC23y = 16404613887980537768957289741034352596785347593895872827139735981625595539700;
    
    uint256 constant IC24x = 2856963535586908090803188956317491437338458747480139747951929159992152642740;
    uint256 constant IC24y = 6869149068824098656915453617163915523419829363871096909389845011168528034520;
    
    uint256 constant IC25x = 3573668074521399855295622862549839145877009867715939585209585141539474170956;
    uint256 constant IC25y = 14675579292393760665349078183055529546594868155015170999422467330237375937878;
    
    uint256 constant IC26x = 6723018696468469190726635861975249517803565930891673249660245778865344461996;
    uint256 constant IC26y = 13347023895532235941044406394173296493089554953337763335313041488192262381986;
    
    uint256 constant IC27x = 2829023034991659478944615428444085091904554790607132746302555275267389381034;
    uint256 constant IC27y = 13140092428221118829331694789799137561545601511841612822138067507560333680514;
    
    uint256 constant IC28x = 3808508403215429303594508645017525608508728231718311416274985244321845810221;
    uint256 constant IC28y = 10538857230014545630034715551848064156931854671175306545152754345628525360723;
    
    uint256 constant IC29x = 1536802329872192170771055322413732426487688906081425841037042987893073754817;
    uint256 constant IC29y = 3492164839666797183985626010582577375582059333617108503804519305383229140896;
    
    uint256 constant IC30x = 15305764788397369527547175447638144498764722079518026341559869563855596784987;
    uint256 constant IC30y = 14535720375848088826008994297845079457453383715482651697437344455785505542501;
    
    uint256 constant IC31x = 9951815470905492855598055867100882060578797195962191010197121710126498071029;
    uint256 constant IC31y = 3015725355344062557604158161087732433106151985444715635705213313614859466203;
    
    uint256 constant IC32x = 14554074380345218603918377237970698135306967519131335581250289247196369888192;
    uint256 constant IC32y = 18616915186566691249251922728390839271853525542076241444352631155183978712083;
    
    uint256 constant IC33x = 9105122336207802780902131042758399191398710665868139368726992150300522909669;
    uint256 constant IC33y = 11238497140411577955490081091190473678039934620146237786250419527423782654575;
    
    uint256 constant IC34x = 6596804091473379416674331508044626006869118640726433456049335664502533280804;
    uint256 constant IC34y = 15509060240944911874508845808429593335016283142242131679142367621255148273702;
    
    uint256 constant IC35x = 3710987903321527428649176419148162110495755029538150787774686598199394392208;
    uint256 constant IC35y = 833402720092747515264409875837108931481938969341573954782378529920517192671;
    
    uint256 constant IC36x = 11253373881045779343100183056769171637126260474198897827251963682310621046611;
    uint256 constant IC36y = 21529398869864213713615607634153272145288176137881096083163323972897217985442;
    
    uint256 constant IC37x = 15350170731751033486218345723598409466734913708333802912216900961576985115534;
    uint256 constant IC37y = 11038793501136182625638635830812558283657362266995658946419542705917095819565;
    
    uint256 constant IC38x = 2363235119563938927779495318422140501694965433864998945045567034360431686981;
    uint256 constant IC38y = 14723241014577234185782557817739220737431690040264569856077461421383274861513;
    
    uint256 constant IC39x = 8963974584245677754689659314788829180678882753428547266631669033398871691972;
    uint256 constant IC39y = 8130978480197314067355697387795249635111405877646146456695904103826646672298;
    
    uint256 constant IC40x = 3355780971463250717556412533051285154470441641103591402152071603512548306548;
    uint256 constant IC40y = 19215324841619159502190091561288692451402490966758920648940767002551882447227;
    
    uint256 constant IC41x = 10467792373180549008696023442470023101644332787812144821157159531577902603207;
    uint256 constant IC41y = 6490662993447620168158377355204076050971364678869670682359474963339904908177;
    
    uint256 constant IC42x = 12376644624357344212674334927687321800438539518083692169399440994043863519854;
    uint256 constant IC42y = 10283390220430179288300040131827509050860149951943469460248702930779303199985;
    
    uint256 constant IC43x = 15039117143606197002455643536838916645464956363890044300695959714238282197690;
    uint256 constant IC43y = 4049890972791878108757182753345146803378211712654440287760917439165264245054;
    
    uint256 constant IC44x = 794761905618166025958495907020326896455725986166253891953002155731182634619;
    uint256 constant IC44y = 17469515126540454875852462041837887866958093567619630914373311733484965729343;
    
    uint256 constant IC45x = 13979102994641733177987855581997528485607848096507542094422312963454219066723;
    uint256 constant IC45y = 19444884631169719354890921140201438406211636620147486130558912605183859471768;
    
    uint256 constant IC46x = 18508749007468851359170100882679884669824369996208732058995028996549257549406;
    uint256 constant IC46y = 18403704407671221344231340598692205160657277713307181571063670549514455924048;
    
    uint256 constant IC47x = 4723952240287002477321699480657300640789604851729200325292113611940333374059;
    uint256 constant IC47y = 15582145712350422538240042130703629570464175807506470684224905584709384592539;
    
    uint256 constant IC48x = 12354540030820434547510200978944527647058932105317061042207537855688419318193;
    uint256 constant IC48y = 4628537295959196398416628136830799764285829097350093844436838135033574354497;
    
    uint256 constant IC49x = 13702681166082715368483321372258895856746586711413290751462494732148396684165;
    uint256 constant IC49y = 12531914339245361894391147371575341647693198577727417781155834288878016899145;
    
    uint256 constant IC50x = 17845631623853468355437285267273751943029574443545157595442473833655001995103;
    uint256 constant IC50y = 4202351018232660690104682450203028000314764345126155728774145040644700318580;
    
    uint256 constant IC51x = 20111863096685511997526347486925050662290642753077414521572994503273959902564;
    uint256 constant IC51y = 10917162213444889240489362416051776321977351374392180109279085463410768502035;
    
    uint256 constant IC52x = 20909318081328078082817355089506800118077749383426461068063286967950465307983;
    uint256 constant IC52y = 789950848164515128325980953206364161523005777236035676003459727446504052329;
    
    uint256 constant IC53x = 13228878243314017755419112247223211698293762458375293961959613943059642632640;
    uint256 constant IC53y = 14520086467859095151478217301743083837373999931423490463039338435167585348321;
    
    uint256 constant IC54x = 5301568963406099271793334991120436458023350212460736016626108185264906034829;
    uint256 constant IC54y = 17223642385244992072789518683071682369942016810602285444734978629755249236268;
    
    uint256 constant IC55x = 12174446074041004459194661536335806725190662813882391299282737479250554543738;
    uint256 constant IC55y = 1337562211190918384988057441498872020696963701622581440714627386148501939135;
    
    uint256 constant IC56x = 14901943495013121526313900164065116511240616953432756267367568189813845417459;
    uint256 constant IC56y = 4104590147965763410299137424413944639465963770151970012826763710823862794494;
    
    uint256 constant IC57x = 5927697938259763133648300895349321724744419125947994606172132127922841601680;
    uint256 constant IC57y = 2093792081505640653812749341289536926792078562728116928464845150137079122989;
    
    uint256 constant IC58x = 16939043760686017801841337329074356232249330496193741841247697019779212212274;
    uint256 constant IC58y = 16806142048157136585882095320668738861744984932583854192478132361598699766049;
    
    uint256 constant IC59x = 20184172183248658362429373741980129724061112380394355248351007937850108649172;
    uint256 constant IC59y = 10283828197132510301617190943638507023125617547325228326154537023985200057520;
    
    uint256 constant IC60x = 13729731562274594294737816808485104168622749127166754419699324950580989188492;
    uint256 constant IC60y = 858225729815629550648611231575137440989278738093640814089775230504352516488;
    
    uint256 constant IC61x = 1758362441332205325765515605475071123429297697348288311024264953702216127161;
    uint256 constant IC61y = 7633472939208412742352877745785827930512943864464510961525391196030315000786;
    
    uint256 constant IC62x = 16901879656663242982906200638404389594633077278288857060957848047944109429737;
    uint256 constant IC62y = 16514556313898125646262701349910202029751369266398068503080596798884422667957;
    
    uint256 constant IC63x = 18896682130447784266768005954596543066222169712441262132224243825521903049013;
    uint256 constant IC63y = 11048968915365916159550633378247663332076232242280596450272266562604576029485;
    
    uint256 constant IC64x = 4200193082011299800929647170172183502715549291206776044857941962666448160571;
    uint256 constant IC64y = 19559510849007295283693191706921403339936874442203683037308719474415483577102;
    
    uint256 constant IC65x = 11792382366832098566886091205228714365748192704881862294921346114288950753081;
    uint256 constant IC65y = 10890646071540634049372780703587114382104073719660849378136674065362435913634;
    
    uint256 constant IC66x = 11504691714689519744570717927545817552886558738366022880296447424225055527881;
    uint256 constant IC66y = 2953296760998459620883859935506277997101984592038970138691051000883572004160;
    
    uint256 constant IC67x = 21230468279636611408900558839447276117431535156486389279561770120638567414563;
    uint256 constant IC67y = 7627284510533283957387369904464207182480610975801025132839395811011562528720;
    
    uint256 constant IC68x = 12542771220657006882809622149756011779302233486505577614658047184425839576998;
    uint256 constant IC68y = 13799486466978438701264710511376489588908102642545179776642935535010339711159;
    
    uint256 constant IC69x = 12765735810014379940350247719354889976106855681983519663268591519603678930065;
    uint256 constant IC69y = 15006295630070270078064010854876539813538037260142750071278750915817848080367;
    
    uint256 constant IC70x = 8207709864882646523426539858703149811566029907137078304696214762489786591722;
    uint256 constant IC70y = 7137913643934678407701798129761616484811003340853288639055604812107678176871;
    
    uint256 constant IC71x = 19130605165001713211680661593678606855412071715516235387979392407580853024749;
    uint256 constant IC71y = 13648590380025256935976586101924931696963554644696529784206211902356710293755;
    
    uint256 constant IC72x = 10867784591307995034294678420979153187969419248095506877509915567596487848154;
    uint256 constant IC72y = 662984483818550847223857168967535775479436912187833940165275301587781954085;
    
    uint256 constant IC73x = 14736438031198745646331691284872085195137347733481513427060357184849914456557;
    uint256 constant IC73y = 7257089299937815975019505052851842672798089449885256177680420960333560198588;
    
 
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
