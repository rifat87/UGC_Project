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

    
    uint256 constant IC0x = 14002354835574372475666631694271160749303950917818606344816661326089313540090;
    uint256 constant IC0y = 11574536661794981572419071049821943250117451718508492589084299736678889392264;
    
    uint256 constant IC1x = 330749145356472532386858456888603681021037455237353038706782090315408829087;
    uint256 constant IC1y = 5190309519474601392245805686324240183255746334208604761642392397935395293291;
    
    uint256 constant IC2x = 21321197079677915226991028838070678991598090506357262790901277646558609629075;
    uint256 constant IC2y = 20569921922211673102534207386238171941029638469110183356304605411298627711396;
    
    uint256 constant IC3x = 16534324861585909009515090590955761717898077166028159012938256642265268863727;
    uint256 constant IC3y = 9928179040418647539383870973999787657514486717014648201534729789294674668485;
    
    uint256 constant IC4x = 16732511977568444883260577300731370423694242550987464981117786074084082190779;
    uint256 constant IC4y = 12699391775088704221310056038169153486171928566725879343721244185243227090035;
    
    uint256 constant IC5x = 4587638185556072848380734875376998970484958740731604812635630824830014816141;
    uint256 constant IC5y = 3163294612753829144612732764796109968533943777271149609224648327629791907442;
    
    uint256 constant IC6x = 5134784756320908209578003307514741219145345773389345090134236742606892830753;
    uint256 constant IC6y = 7065790846708023627149457113889308259576818327406589790650043902693249769909;
    
    uint256 constant IC7x = 5734300323365267680149724520390439979942631253267378667083104761249139360760;
    uint256 constant IC7y = 7604175796745159392680027230398966712825760419993257712185875080042565468760;
    
    uint256 constant IC8x = 10592990427750628353813481443623420867042770145266713836465262235285925156437;
    uint256 constant IC8y = 684181096842836891401679522179347061912388397019517092315775795998694814880;
    
    uint256 constant IC9x = 15241353538516155155568518295259644318713453129990526791273152839330069514353;
    uint256 constant IC9y = 14127792179072300217488171382844697368524820077777048173837608886017211035535;
    
    uint256 constant IC10x = 7602322560260491074775468889355750720161517685376090896462456210175529282333;
    uint256 constant IC10y = 19562118893675517461349265496080734615979753592506059133391896435781137590083;
    
    uint256 constant IC11x = 13451773622820496757457024990467889848489757071644753573693781423308793149378;
    uint256 constant IC11y = 17668721902767338824387588783034376864295346899558591159739193008734644218992;
    
    uint256 constant IC12x = 9892519932209104984039170315515334371237932725948089576268382568770379124909;
    uint256 constant IC12y = 9298772990091512547739239602014336358203344094005129100317258441759841714721;
    
    uint256 constant IC13x = 833558701240075158175437848483357751100279508135187915630793806292945071771;
    uint256 constant IC13y = 12579431452750572701882065566312484715552044942836983216083915127815994762239;
    
    uint256 constant IC14x = 6585359941201537529848279592272323258983521943983202094925600785582762573582;
    uint256 constant IC14y = 16012253832614225709012355321694987979635037468296159802159423117448640551481;
    
    uint256 constant IC15x = 18316731747647546221239110911015194618546686770056348981204319180451712660;
    uint256 constant IC15y = 9576616107007005929544837538709007299701315257965621298315065373782659841643;
    
    uint256 constant IC16x = 3797748139279127423480257012857822789252312946965777415615658675438787606851;
    uint256 constant IC16y = 3818038398768743684212312757851225818022942458663059671329977639785905795715;
    
    uint256 constant IC17x = 13042487791020779032689776696183350771346254637359365194633971783565839125669;
    uint256 constant IC17y = 2847438431100006744672190598333499801430524123028452605145984175383945957186;
    
    uint256 constant IC18x = 1579855965659349732713335527172501745636516948138445892955839159185108589764;
    uint256 constant IC18y = 7150156987424841866486676676016440351336101669154229190890183651408629158629;
    
    uint256 constant IC19x = 390310204498508813944220423839543649182812091742814104580170486150256777354;
    uint256 constant IC19y = 12341691873747010992473515290451182039410531785355868034603578716284671311569;
    
    uint256 constant IC20x = 21213317968084386490445994788462660463574368573369077371557648532174779169792;
    uint256 constant IC20y = 19928467504438207043762311998375939119221981465055709579846985151488976280774;
    
    uint256 constant IC21x = 3582902509300702881222193756538479428607188682634022342478397802580165279434;
    uint256 constant IC21y = 19150457112483565173388265706249930435714028119050542903780407150791191974413;
    
    uint256 constant IC22x = 12428116384043820980381276524748169694202134522462812020962013114258095923516;
    uint256 constant IC22y = 12644948260501203271120380648838900351573421210875564925973767845053149535515;
    
    uint256 constant IC23x = 3670913685981441568918204137014826639426778721204285170648117404132908718418;
    uint256 constant IC23y = 12977364914293324997930652133961142504402977978835007919495483096286201376928;
    
    uint256 constant IC24x = 12326796985056679876315226627824981314705546644736657596478430684441175777568;
    uint256 constant IC24y = 11646001693977111140428224899315231684483780533901626020306541632689468363005;
    
    uint256 constant IC25x = 7583599554855591460034347106224668480011117835984036367268275383892337414464;
    uint256 constant IC25y = 17245992160555216049477146109004003308056327559827511366232643012419421677449;
    
    uint256 constant IC26x = 10259526869185763498829961706011482274751112012344178947868959819617028532098;
    uint256 constant IC26y = 1112338142661663055364134176937065861603681441948959389551883550169553695366;
    
    uint256 constant IC27x = 6947043680029576337996953855702424560765234397717744158914070181780527515845;
    uint256 constant IC27y = 12837560710182042987152426980380718286037808507391628877166243304569720568481;
    
    uint256 constant IC28x = 13182676179325676634219462419239272163915419282506188449741706003849812056756;
    uint256 constant IC28y = 6704912611775531189636222266381932205834659469000727346042685527229531386765;
    
    uint256 constant IC29x = 12421035497158748993576591393978972630671454806968960051898781790386023319572;
    uint256 constant IC29y = 908175639164401042551652347220234529841121729533894396061817023977502217005;
    
    uint256 constant IC30x = 21881298141506689468809379537232897433994364493397150803150025158661837101769;
    uint256 constant IC30y = 6240768746594260121816121336018281405714011361384715468266208634186685411163;
    
    uint256 constant IC31x = 14185219223496373416515574157050139920271661628589472466273399938688558175266;
    uint256 constant IC31y = 12751614636020150201474887483586707787492681096775182153002479738985876288535;
    
    uint256 constant IC32x = 18663321329582927506687826336140610286386716863655126518781506739166567945745;
    uint256 constant IC32y = 3119003602065240895653847881121044166626725704930826879914385387967372467513;
    
    uint256 constant IC33x = 14230415210756443746625957401011640829409060696378554617698093920778305402606;
    uint256 constant IC33y = 211403927481511010058937352520962416794069257918026874733616421460580266287;
    
    uint256 constant IC34x = 2439793282261867044872951642362368196618263895685770808979414716335688422119;
    uint256 constant IC34y = 9545299667090690527567004630307080722308596598369350581609504143656647588757;
    
    uint256 constant IC35x = 12635600952335904943301685306837971808895350048446403956038868726500867529988;
    uint256 constant IC35y = 9173746481535935782509996798285185318775652741793689633884478383250285076736;
    
    uint256 constant IC36x = 15776971245179990774019334795640699981603585488095796580484598797984564545774;
    uint256 constant IC36y = 2940546537863760074718383761097180950228976437500762713939351636688498797497;
    
    uint256 constant IC37x = 17323710548557539225048370461981733679582067583565356619328401412589009754794;
    uint256 constant IC37y = 18603420575447003810654598441576559804985589632069641895770276138231252396197;
    
    uint256 constant IC38x = 12910323387182793049031713440187700221437894342534094785609333592219441365750;
    uint256 constant IC38y = 15687419956161621589318160054244809263628084595001559849609749417681742206451;
    
    uint256 constant IC39x = 17074261022692344245505108569216333543323199836032144663301580930576921516465;
    uint256 constant IC39y = 17511088645486594465017254318115033035987928654621669146175214294804333244257;
    
    uint256 constant IC40x = 6168759409205163963277032857844611215300471321412513546955834996024172449160;
    uint256 constant IC40y = 9993520089233000499778146757005684594570806186823834922209560597682855531445;
    
    uint256 constant IC41x = 13421961804926180002397137721680963880494371952347510065652742171545279880568;
    uint256 constant IC41y = 8588824663854803899387706714504841806730562302138676417698233805979806127347;
    
    uint256 constant IC42x = 2510757338168071905864519884152251831422675168994304840663331464367279758226;
    uint256 constant IC42y = 6319787829499578803748073474084765499229939129416678692181098927490690553979;
    
    uint256 constant IC43x = 7926082925664961998962370881445103475316515326703413190651728736875942174138;
    uint256 constant IC43y = 7369040490920378754221226957767498890655934548438971124736065345096793466479;
    
    uint256 constant IC44x = 13553196381022808497330886301323682603546903907781835359372245694680732638638;
    uint256 constant IC44y = 17910168392266474293893447970383349649632933794740694441054664375540295125877;
    
    uint256 constant IC45x = 5506624880674447074746266883857857363793561149575630692061357044974608724949;
    uint256 constant IC45y = 16181587783332576310624370129552805662104243479212672766160722178645822601876;
    
    uint256 constant IC46x = 13539072328507894729749288468993991462583337829685201205375482898176655833159;
    uint256 constant IC46y = 21347253797035665522172535587546196560528014211031923772559427108648194808336;
    
    uint256 constant IC47x = 19698573473978016751462186461201421949693187670005875429409452769911741764427;
    uint256 constant IC47y = 18454174029110730233976574892858613058457648196828064909679735147078883512221;
    
    uint256 constant IC48x = 9815005470350764404583478223051909621207687331781741728446836116558570563215;
    uint256 constant IC48y = 15819521835361047685267107859198795544161244007816463836411072209760111341724;
    
    uint256 constant IC49x = 14458586840511436502244780271563192930822086275957525104125488740513527305241;
    uint256 constant IC49y = 5624374718156130401660033572672942684321770513408454803355040486451106494137;
    
    uint256 constant IC50x = 15323827374159667908329986429686696938287838803165415286169990844127554033330;
    uint256 constant IC50y = 18124602092082288001217515179016854573105255089017215194993886384157191727566;
    
    uint256 constant IC51x = 9172820332757412656687959142376772510796122315159134927334396853146301837259;
    uint256 constant IC51y = 8288834639835274354938861789924220574911529602953215269148529744460492040004;
    
    uint256 constant IC52x = 6121153041509984899782985666481795694439867920086258868882847683677833833189;
    uint256 constant IC52y = 21343505550598477671719339584987874742407798396489195945027564926763808257230;
    
    uint256 constant IC53x = 9373640466933924041748894268840405322292597311360982794001704592400205137648;
    uint256 constant IC53y = 13757197315288804160069280880751054348173239272120994615984872175020033854075;
    
    uint256 constant IC54x = 2417778409395361800480485305176853274052173415054599283502560755776648053041;
    uint256 constant IC54y = 10623638871161494335305083980014545876741317585277633725859980232913995083626;
    
    uint256 constant IC55x = 5494715988803300498907446052640312000154875467861403391987316341670808654580;
    uint256 constant IC55y = 20722515592935520108096706387118387234464153770193991109769961104066392467432;
    
    uint256 constant IC56x = 6837584664703545845484034938224322794384778043586133410643080943670808082634;
    uint256 constant IC56y = 19294464212822586803594139446331757382722409296211865904330857910584178522824;
    
    uint256 constant IC57x = 11945553813458441392594265329862505142490480462192604767641579080577674608617;
    uint256 constant IC57y = 18823399748444836100973403700298407385159142973696361907804692465096709026705;
    
    uint256 constant IC58x = 7938001275253607277761635926357684108898495274943085910666203249612043609686;
    uint256 constant IC58y = 7424578945626159170852864547283766012777278055660460890555462617611744310948;
    
    uint256 constant IC59x = 369885728857448737549386652344472967784979805854018720233490816198266146178;
    uint256 constant IC59y = 21596079458354014384111113457656618004978076195732344996254242591858585358972;
    
    uint256 constant IC60x = 14082887488982722666861302804916114924342540034005027051933402513681799233790;
    uint256 constant IC60y = 10254125151207911100685652726898245550960545390723421361612036466295996324531;
    
    uint256 constant IC61x = 14445752208563505282448717211246628963204427513363690175752544356552076295843;
    uint256 constant IC61y = 16404499019932181548108460348651019209007980635863841281268881723242201116385;
    
    uint256 constant IC62x = 18837140646035650454186994553651727635656694870264661043002416365536711666268;
    uint256 constant IC62y = 18142977044896992025789667042576310538131126447970674587259835400688702364555;
    
    uint256 constant IC63x = 3127975540337486749864313504129599616506907527204167981413453696642364081027;
    uint256 constant IC63y = 20757892251196644088942833352090687695715601460035729500150560085537925752685;
    
    uint256 constant IC64x = 2386123860699518150398818136753724006564897243920084863379700269200001887191;
    uint256 constant IC64y = 7197174682166567857966174122575226794046825278287813157690443699675066440443;
    
    uint256 constant IC65x = 17405710354733180032189131048966622213690940004965774546369928199805176370343;
    uint256 constant IC65y = 20437125059044926092414633706557156448473664202374224113718933576992561719436;
    
    uint256 constant IC66x = 18459816043237822130189858565310538138416627236473007113404867055106931975864;
    uint256 constant IC66y = 4987085278237121987873588509748501451956875405900205750945878606316529977729;
    
    uint256 constant IC67x = 11719270160514836444188967434578502051240804722220521834917209794320607442349;
    uint256 constant IC67y = 10415358925239784950228431728512369973996353079073912459173674285030543392290;
    
    uint256 constant IC68x = 16145714275059645368822774855607319375712603248151891335633140346886858766906;
    uint256 constant IC68y = 1235753217620915262795769254367885986651360322917534688812835739702245942380;
    
    uint256 constant IC69x = 21013483076781131279689566946492076362408062366189120674395196903505556596911;
    uint256 constant IC69y = 6768712781791452985947863211402862698574755349302553807877613019209962098401;
    
    uint256 constant IC70x = 11446107649626182837246679287942366196324074532317739357750520103335824403284;
    uint256 constant IC70y = 19694550326999967761829659140824007686990849491883155644433744150612870833416;
    
    uint256 constant IC71x = 657996674053439570096827914577045424122932344804111882629165065176267625831;
    uint256 constant IC71y = 11307457443788799990607983964268799353848404618730191266210599029692751223357;
    
    uint256 constant IC72x = 4716374198295067208650349663899738524814900548903837113541798092096102220029;
    uint256 constant IC72y = 15870489469152021420130941690718235879093827734451590655836111567907627793204;
    
    uint256 constant IC73x = 1102574355102072334404674290888944404321368651675182260884184483689270229439;
    uint256 constant IC73y = 16884557288500856400996334436627862343491621523467134081116861680592206561722;
    
 
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
