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

contract VoteChainVoteDirectVerifier {
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
    uint256 constant deltax1 = 464854374863243960333898220621719695055979248236649983602121528165150020124;
    uint256 constant deltax2 = 16069611601507337166521067864997608567898771024492011812922699973358291542111;
    uint256 constant deltay1 = 7805088676300532088859802550153282707837349045892811658250130636252926855737;
    uint256 constant deltay2 = 14190552727242429802855621061276405333085043383362343914127224168953012973180;

    
    uint256 constant IC0x = 2318917228452392812801575227121753941853407277144162384457857381283071472479;
    uint256 constant IC0y = 6017847483618057669268984251192213986292125662963311280382342966903031297238;
    
    uint256 constant IC1x = 16891472786516922587746692158558996906134953725882696151968968452694495660723;
    uint256 constant IC1y = 15127022885110798084508180706030596052746706155022109575376000523004549959526;
    
    uint256 constant IC2x = 18871762560962680965259217113069547433990871559938092958406337519858377586000;
    uint256 constant IC2y = 3538360880844526192755346023850981716682539125497131103740238937696572533083;
    
    uint256 constant IC3x = 14329855237875523365805447371520823106739824598317316306340089122348953496644;
    uint256 constant IC3y = 19656573762011237371433269972394716363674234452726489846172264143268191099775;
    
    uint256 constant IC4x = 19368627680518896855330224011438455603512837648868267850264862230982736903595;
    uint256 constant IC4y = 10614329583762669304210078100238321999348511770288299783024041552610374764596;
    
    uint256 constant IC5x = 8524863377904538289657571281092519818113535213681392917773368833334057129692;
    uint256 constant IC5y = 9881572041663554000396077869081371091868361560938961800869438601762693867607;
    
    uint256 constant IC6x = 3410154346382149084414394682433510620579686136543495081403354177424704081104;
    uint256 constant IC6y = 2471802235208764784697021887584159892336636168540109074826302291791127630395;
    
    uint256 constant IC7x = 12739189175302826865279831601578307236535695855411956831664221242550442267327;
    uint256 constant IC7y = 7503563576073190522588310863152297303642002096177632538718106017203634017351;
    
    uint256 constant IC8x = 16052884909360422465700488213773897594635076591989611606764643489204655710904;
    uint256 constant IC8y = 16146256198061724770530025216566347107591577783661031566183007938038302416749;
    
    uint256 constant IC9x = 19971325939135663666216644708686918549369974613469928258008043873938206303590;
    uint256 constant IC9y = 698284509414018674191666115358665719970366955757184224766947655284598424000;
    
    uint256 constant IC10x = 14153137851907483292680970857965582368408361081759712412629469533375346607093;
    uint256 constant IC10y = 10451850859592527842945635214950653738997492388200851006849729561226292691570;
    
    uint256 constant IC11x = 13377734453051978271862636022123258798129167726191482606871285495121528135351;
    uint256 constant IC11y = 1009726789279554280310699740602831572827341305119309586528839167640751080120;
    
    uint256 constant IC12x = 6607580715688753994562431575261904818821063775712920986670689692817799718329;
    uint256 constant IC12y = 3884751883609426723231492683578135511247592279326418618887288126047091306604;
    
    uint256 constant IC13x = 10602862316120543456695818963590358786152359349449765234136341355735842682849;
    uint256 constant IC13y = 21569015770160039719213779864404903081496612164629259422855718909947681645690;
    
    uint256 constant IC14x = 12177988187179529938783034991723861755180531364852026881120699706146155647267;
    uint256 constant IC14y = 17916940195973584137472378869973017130374685196222020192770622269778396167523;
    
    uint256 constant IC15x = 15213014716432564621359377633873226428544232596034841306685285188414581907927;
    uint256 constant IC15y = 10912681891323010325938995284996728668604797076487339153890676493795249684043;
    
    uint256 constant IC16x = 1183788474119653808513358702352016205976482596968140719572925718734781324598;
    uint256 constant IC16y = 14519383729132507613092015385847357561208109919057084017730422600197125715327;
    
    uint256 constant IC17x = 20636647512322798384664211159316655398053950024793798667687301170420914612304;
    uint256 constant IC17y = 10331499482172991587874213835833532217098942024396767186608375171058905000949;
    
    uint256 constant IC18x = 8401411125362216841628598308412926758289809060727385394580962420954196703367;
    uint256 constant IC18y = 17114671491080440330632260832718432911136974694092040279221340452461391499816;
    
    uint256 constant IC19x = 7913513471892530042393650434445330926410258480988242491578309991432287764509;
    uint256 constant IC19y = 9927890994332635062872174492556858763631310662705166912962031974940630741736;
    
    uint256 constant IC20x = 15233231453041795649038184422333260365032261659402306129973158308033049891283;
    uint256 constant IC20y = 11274874940729462977987672946118227059727585622257002108488031520039525153740;
    
    uint256 constant IC21x = 16312745583983119501132243794240645975580955007557312595898825172001364422607;
    uint256 constant IC21y = 1068875132185128331628791253953170383953245326886059512804525582025382780912;
    
    uint256 constant IC22x = 10982488569705229553254748242276017867824965623476911840788835452211453075201;
    uint256 constant IC22y = 15703466283714494362776269790547838725465890045136586853681095010563238329704;
    
    uint256 constant IC23x = 12234745982951257385828042774296442105227467906368358366593877006601676359186;
    uint256 constant IC23y = 16045964227694188706854008736335302843759543403550161430303700109170087613349;
    
    uint256 constant IC24x = 8970720301435082057735710509103088652937987098507978543920751801831850286241;
    uint256 constant IC24y = 9335244178294986019564043600818441150349666533409063516697303615261222278382;
    
    uint256 constant IC25x = 16836761837756992640349329463902861486695009323641552811145710536643445738233;
    uint256 constant IC25y = 14708583105424676990391127185542485468157660967182453036929299576950696035620;
    
    uint256 constant IC26x = 18011872976348728497364889575346365954057121441310014544853124299734373798756;
    uint256 constant IC26y = 10192514574979694055923856540980811858936992630154326482673406252026927774072;
    
    uint256 constant IC27x = 2328823225226461712936132685247887613735921576290531286709905036740903799391;
    uint256 constant IC27y = 11993366924801979370889641178881110486633797778866161073103963416666586536328;
    
    uint256 constant IC28x = 1546872417406771119205141296435998526528621140833145143742228489920742372104;
    uint256 constant IC28y = 15064687718442328262285846114377612825963313913708215556953050491148801343559;
    
    uint256 constant IC29x = 692932701446661596593430068743964068539701813118095607701327321194433252095;
    uint256 constant IC29y = 8786936068414661552383895360094730831293431611005261221021785866976876460909;
    
    uint256 constant IC30x = 6383493143016201789907779419767073175415157447054229444897016380353782845283;
    uint256 constant IC30y = 11773345041504190844521276433006240472345559048709362257166579630725729592778;
    
    uint256 constant IC31x = 14258435509539619136441571542060375431284457238228781510370364984750130031349;
    uint256 constant IC31y = 84366570180533109520104751592246801049522181836892977714204447895450351592;
    
    uint256 constant IC32x = 3257497296499086249200812059629214137416475630785811324833945323973678431422;
    uint256 constant IC32y = 21273703228921794142840584356400650925385047602112383714319458268808211562937;
    
    uint256 constant IC33x = 9315344431735393729079759672547234950148123301608400573400096830843844168890;
    uint256 constant IC33y = 13110574770426373279241948538635497256665752351344012972957820257827535889923;
    
    uint256 constant IC34x = 18066995716805599715895332418555333646208619703716790865138642701678603755940;
    uint256 constant IC34y = 17716792402547648666605270987029029074265249450537372674667701209360831240839;
    
    uint256 constant IC35x = 7377864068437404649708011282483467684006963031315654215203994359082269371123;
    uint256 constant IC35y = 4826605728698974807142591670423971274689650671173095248044883936386015956015;
    
    uint256 constant IC36x = 21225282898039697836529420108811176137371585219664423091900510879889697500176;
    uint256 constant IC36y = 5017036161241812060186695784663432885960282289906266323569957660365107946755;
    
    uint256 constant IC37x = 1877445120217842716553239860398445867513421061110992462771778049071931418461;
    uint256 constant IC37y = 6568195665161124065920333955428655468836812453477515538082836358458090970333;
    
    uint256 constant IC38x = 12597851832847563607837677472663540566180643154332330105775044327771425045426;
    uint256 constant IC38y = 13019727063640373162201717083645910085151234576774310173460485706854038433556;
    
    uint256 constant IC39x = 5215362866220246021979851738680009383533796385897187542094666151729162510525;
    uint256 constant IC39y = 7378985072674122209791522887402182879120450833211850912119014782425076421143;
    
    uint256 constant IC40x = 18212946492633486350870476560927145669909295139822558883383510257206807474365;
    uint256 constant IC40y = 4129710891115349043398056848401397772902556336122490856040073110779046262107;
    
    uint256 constant IC41x = 17237440019175507143041512377827469688120095391092961224535361699347840551232;
    uint256 constant IC41y = 14621671836409149100553486008249517830266568509606840320758068508994771098148;
    
    uint256 constant IC42x = 3386246282932179973150173122836423217121081754966570689695962982834420408656;
    uint256 constant IC42y = 7592091023844176536223149920633642781553181046361433274940243679566534919229;
    
    uint256 constant IC43x = 13342990885244689180570161401341577553813941822979800421324849465229238721188;
    uint256 constant IC43y = 8020604044625015733139185792272952817465157225584418820946130185758463891307;
    
    uint256 constant IC44x = 14979368293369255093869526467860526029892787808390849146187444062984969918284;
    uint256 constant IC44y = 12387122889503444992797130571256217556698012474977247544558996967306544180938;
    
    uint256 constant IC45x = 6572597007198306920113504801550161301992162674291804681932651761874823657830;
    uint256 constant IC45y = 12643884342891565782185741549895052285742775370460463676831506422694109989268;
    
    uint256 constant IC46x = 7561750907286791410177632362584216813618414042460935950592804379156797119614;
    uint256 constant IC46y = 831152870153477294143413259581092857530472835326368255404642324659689037867;
    
    uint256 constant IC47x = 21010642961127422484323828749476180679749743300555478184999645088237044867692;
    uint256 constant IC47y = 1812443146407100516123334273283999113769637910978113176259209429950386695344;
    
    uint256 constant IC48x = 1306833831192488483629032455711616440849092873801529569962930707829718930352;
    uint256 constant IC48y = 12668825454268954482982773429724957026829388880314307468736721751597826281770;
    
    uint256 constant IC49x = 950810047751030253222970985564143978876700338768167921317246732386790259877;
    uint256 constant IC49y = 19654280228980500504215099759107646773403377929112940755878324825687656300312;
    
    uint256 constant IC50x = 20847559591665303141673010153363742811134251808142751375116249943775524361299;
    uint256 constant IC50y = 16808597908959339392621723254114881729895861393661003889881001623119441955476;
    
    uint256 constant IC51x = 6112354712324103790897569714252292576641729122573368458493830524960577758286;
    uint256 constant IC51y = 20955632746089930179293905150426654378294018269637001076345955207882076218403;
    
    uint256 constant IC52x = 13823181675462511090699827270703828332817227181912016957817753973685116508776;
    uint256 constant IC52y = 5247336690097557275637895881195221768935761604024344673216663112353254786673;
    
    uint256 constant IC53x = 4881749423002773129103685631480914419065549126366861685408974326448411675232;
    uint256 constant IC53y = 18559675115941286375263408319429626098057188992055870821586631064392924741791;
    
    uint256 constant IC54x = 11876235627769026515967568004387676523881084105412712209946429401563557760416;
    uint256 constant IC54y = 6361685958637527673911079103141801914554000979771241424965393963400519779393;
    
    uint256 constant IC55x = 20948474792081561697197405106351296245487750903646024467190828852601012866452;
    uint256 constant IC55y = 13097535171474738160929302356323870997228881724774147209926011836091039987865;
    
    uint256 constant IC56x = 5120593193305519805448269358644374146069097615487817970449972506482363583933;
    uint256 constant IC56y = 8819726780970464131681232455200688920308215182893595545053584996211193133023;
    
    uint256 constant IC57x = 8550280711508442591040442394840002521270853423192570332538388452102790817220;
    uint256 constant IC57y = 20895211534108462160045438445559177677725157406458935483105930129007269861498;
    
    uint256 constant IC58x = 15901561272240189275242788506611561523052633762420872901584140978167303818302;
    uint256 constant IC58y = 911308660663184413181800834356105069702523324668588194078286326748842336233;
    
    uint256 constant IC59x = 21774641774309320238926645338307343525541922999603561589959434388421541066852;
    uint256 constant IC59y = 19252297174841482396083237662907159369287120043329707328021327968532865355319;
    
    uint256 constant IC60x = 6080685731621303150808545030363439403355095835492956727342239279356135546427;
    uint256 constant IC60y = 13847222309786500970168754412790665659509715837630045556475546915396966465870;
    
    uint256 constant IC61x = 21512790417828997927482172499691651705412738367692321039429267932159617428540;
    uint256 constant IC61y = 20902965311254882302974142240126868000644356427417946767702264522677967633903;
    
    uint256 constant IC62x = 5059943304459182830083746945386605518627356473345748682744790509975509162190;
    uint256 constant IC62y = 3375219136161507717700907542617524926611813129143029002533772097099146057035;
    
    uint256 constant IC63x = 11820502490099077071118610305318380357233741746486989861959085976985072619035;
    uint256 constant IC63y = 21041577115855053074288810865328647413864316693550017731607371734210287214118;
    
    uint256 constant IC64x = 16363950296056058835979859602185304479021700340155076511374524531801953500093;
    uint256 constant IC64y = 12060531347319734450106629475234683420793744893392943243988823367802700440536;
    
    uint256 constant IC65x = 7843037680240443262840540216418619432496485252009659099040209743647696717783;
    uint256 constant IC65y = 13801541723238720493234962822884336400695150890711798345329546983519798384852;
    
    uint256 constant IC66x = 3772076030703564959763938741098908927324923358257997468131903026358672395320;
    uint256 constant IC66y = 8533962458337974191915192451596083520344500693796175028662676977339263397869;
    
    uint256 constant IC67x = 17789303543869330369408799915574665902236754445746060965410702557593608985018;
    uint256 constant IC67y = 1706619608792216483421703427938220446922037422692801409177230348863405260264;
    
    uint256 constant IC68x = 8721818038152514270046681254587726097403223592639175138026777869567532972905;
    uint256 constant IC68y = 2762407703473425932406132591499334242380240143845366137244763083001279042049;
    
    uint256 constant IC69x = 13920457486479674176230247896558490029613473995975460890399651467887013242113;
    uint256 constant IC69y = 8627976094323143264481177064930368670250153958560835957890762074313877671739;
    
    uint256 constant IC70x = 847628836878022108918838484392622559352157270246133716360027954204965613710;
    uint256 constant IC70y = 8787162965592869533031507441387422447882429856865305634610323072027686118618;
    
    uint256 constant IC71x = 13804741971972925035531973994111794598672735112726570807959418821636007338099;
    uint256 constant IC71y = 8861780477915853966825698467196064207833607763119306438983343139872205524621;
    
    uint256 constant IC72x = 19665815512893702297647939325828007046818801955207229270083548328804293941635;
    uint256 constant IC72y = 7763013452130858690837321439510746716572788641896669511445529083567728106788;
    
    uint256 constant IC73x = 11091895807406459370862770211532331710152648826117550780356443251760961347225;
    uint256 constant IC73y = 20464439247602669377720725991647658874764648834371720490429523402185861069761;
    
 
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
