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

    
    uint256 constant IC0x = 19427659379788470635347752445978065939172948624000350747968592507599829374836;
    uint256 constant IC0y = 6273967263330480602990682795891446247105516622224884463704435149255417955516;
    
    uint256 constant IC1x = 20721497523418345865416688449416456052799509029015800000583836584440367309777;
    uint256 constant IC1y = 6803999527241698429225775574220535496387191212576990162723555388401793058322;
    
    uint256 constant IC2x = 6694743192596964892898265943137356247257695142321892411715349924160418509797;
    uint256 constant IC2y = 12997906701647086847941066750356454698946656262669430344287024240701068297073;
    
    uint256 constant IC3x = 9787318154275522298881112180535589067199725334707453544568819388055034847674;
    uint256 constant IC3y = 19495222168747715606861521064154832548026217922471514984547926220106305200289;
    
    uint256 constant IC4x = 10313531410465636771129341231752925144721076314403876774210436163273219828242;
    uint256 constant IC4y = 9233946892613773485531635794569272147846488694625414389871966221153992599549;
    
    uint256 constant IC5x = 20323836345650719548699882958034200296035753209618826910548752329909412893433;
    uint256 constant IC5y = 11024716793899432104049728744378069409570394552734875389731117502947186966093;
    
    uint256 constant IC6x = 13773915894843134597650620822853115779266422801496913259937912285419373915871;
    uint256 constant IC6y = 19928358012075656834600602397976099364554469525980930569970768747759973920661;
    
    uint256 constant IC7x = 15762297994797705446776253182679096846656023830730428062366722704578742767586;
    uint256 constant IC7y = 16419979793072810618932455376863827800019753973296167167757528942719826095378;
    
    uint256 constant IC8x = 14735151727751465160995306817206458166942426590185776004603740280907878622579;
    uint256 constant IC8y = 20442289551823197025113011523461429377859667795265664632914408236417843453005;
    
    uint256 constant IC9x = 14144487853229018171010405441826045031660224751022978079820581538945678532538;
    uint256 constant IC9y = 13067363580848622608860495276075062591439825585948941853810560943358558535417;
    
    uint256 constant IC10x = 12515800176477666959771283078816074088046466845717442899222735471826038392073;
    uint256 constant IC10y = 16351239699203164870639400821653527482323632103496748377328211368366133993468;
    
    uint256 constant IC11x = 18534107351610016131459710415241501039158914343328682522270436767824259380060;
    uint256 constant IC11y = 15122810783008757463953111276176590137767961495325792338287595187945328845929;
    
    uint256 constant IC12x = 6362492805066816869191077709262962227067212088151577638064732960377189413294;
    uint256 constant IC12y = 15099974730195657601571740397880326865241642057539712602261807199765676504465;
    
    uint256 constant IC13x = 20971494028223200061819788457236458076589407868800177675044498582581922667452;
    uint256 constant IC13y = 995213767904033920796118868096479141610190297697338690349791505487876357429;
    
    uint256 constant IC14x = 7465136094880085042392633230891170497092893167535138457384249138626694099044;
    uint256 constant IC14y = 13396895782555926983992138832181336546832575521832145758169522660498871666619;
    
    uint256 constant IC15x = 6124416120490718553002666748418860860372418480143925011612548599523876854833;
    uint256 constant IC15y = 21139781128163258937650288322801875797138183903865769027638572864322968475694;
    
    uint256 constant IC16x = 14796588634713153137347943353175587851463776494838770254593869659152985199107;
    uint256 constant IC16y = 17784185994224409553938754754508276234515703121646471252313705952692646605542;
    
    uint256 constant IC17x = 9370159404242575682689946144608387663902976189110794122603140266631612118658;
    uint256 constant IC17y = 10068333619293258996391003562326041797820832575994734998376776265805408125464;
    
    uint256 constant IC18x = 4588793638138618207936162334794382556048949996805132837145999856336703209053;
    uint256 constant IC18y = 1942979853900483564479046500739176766981535998547072051026428405885806055513;
    
    uint256 constant IC19x = 2245999347497024730126502548481800038791501736903133197128711746102562320301;
    uint256 constant IC19y = 8376652676170261613426353536359539355303483355848592672178374642710872026574;
    
    uint256 constant IC20x = 10389709104734108105474328704949099768981027304578610478419436087515151081917;
    uint256 constant IC20y = 6867084277688593368415247203999986012805131852363677497208020946410237899979;
    
    uint256 constant IC21x = 6042004432955442789820368681492397053200866082651707488514726495689425808765;
    uint256 constant IC21y = 19354633108991527990639576703318522967094460284215793764797488714506176701916;
    
    uint256 constant IC22x = 14735352628124400645284683436063958415006183207808777177027866105188241809353;
    uint256 constant IC22y = 16387945295379468689588271104562048688666879038764270552746432098045898420038;
    
    uint256 constant IC23x = 21388797947236245512409151893252066736431061605823873853524060993592234760295;
    uint256 constant IC23y = 2646259557838917584585066240225414205036792873124402436001474502403286694985;
    
    uint256 constant IC24x = 380037410408047039805787333875167555674211924892615125563424741138306393469;
    uint256 constant IC24y = 20476620218269576879061963480787984045656677389589249093586720075877496725708;
    
    uint256 constant IC25x = 15019176534666925555147438172609418949327996644464818949465858946079267720504;
    uint256 constant IC25y = 21468389950769963108812274441542821231971146691403850338710529940229707664236;
    
    uint256 constant IC26x = 12459389957998660585239813160671407139519011282411762054503275045691209627167;
    uint256 constant IC26y = 18237096632846795071815710037824590003617691350546303727306834259294666945168;
    
    uint256 constant IC27x = 21174837121451118209514501722563691396169324382073069201022393838994299287185;
    uint256 constant IC27y = 13801225380879291630063871961288149140387920530967106689995115724394788193580;
    
    uint256 constant IC28x = 8441647825927556957681987619737652670967103042052096300883829101564826341702;
    uint256 constant IC28y = 19251622495606786594972313439049339995847510108848257080402094310852410042968;
    
    uint256 constant IC29x = 9184001612766133930261289498534956618846196312810739475203378748304782789948;
    uint256 constant IC29y = 18757270176428093264312341381540841484042105191431556164599629023831096965864;
    
    uint256 constant IC30x = 393745726718559700670493152810482917192798857289649317142919452453736370422;
    uint256 constant IC30y = 2620164868415550780381065208136609055835787025284498135622596249963855438667;
    
    uint256 constant IC31x = 2094820605660172107808442235543083424261818580177128369002637081826722949491;
    uint256 constant IC31y = 14955872262421335491003014919473510241240851467307050872617814540171348279982;
    
    uint256 constant IC32x = 8322819835602470505826580706377362853321449920018778019920911309884777406262;
    uint256 constant IC32y = 17317163146182568291222948528271257720537034091236179031219429524214732722721;
    
    uint256 constant IC33x = 253324236980999288336066682738177193478292739400471404631824731399051063980;
    uint256 constant IC33y = 445494125595135469120289051772374363712005263012362461572199108549882547894;
    
    uint256 constant IC34x = 11755510150816386629964730648051036518603747992502098068700409094285403662279;
    uint256 constant IC34y = 2315536980010977485675771307289696837804398873775858676248305759409649761440;
    
    uint256 constant IC35x = 21541730669860082899985323066746430428034440050266503404821862123125993684726;
    uint256 constant IC35y = 11556608097990872167765496354175588158070416930324303420099923347196374957709;
    
    uint256 constant IC36x = 2898582248182681219660653681900855658192803855533208351762765413828571459629;
    uint256 constant IC36y = 6575877331699969265997112331636421730034217769999048213068691677269590037538;
    
    uint256 constant IC37x = 9350571730738807974655889072856116808674002684028266133962733453129710174951;
    uint256 constant IC37y = 8756935021220429175879534206442076401577983061348096979841730915995633812317;
    
    uint256 constant IC38x = 12969299143625607461560093772523859993518000556833077282711021138196242867544;
    uint256 constant IC38y = 16479075894027005475860621318254571675549173200444390773139921417691118925427;
    
    uint256 constant IC39x = 4369963964056155046754025221388251266446053490451834439977322946730898473748;
    uint256 constant IC39y = 3794153571760971010980316179405733136602481391281075316376218764654635147205;
    
    uint256 constant IC40x = 1658138217791150079783147945900011236941800995142039089399369652621458061576;
    uint256 constant IC40y = 5986353743588460590700189561857477274390276574705958126991114172776826539301;
    
    uint256 constant IC41x = 17463055130896667019701629136196219150817331059144326662359231270577727258087;
    uint256 constant IC41y = 16423936844890440885361315626734034958117539879722410364048945495980799871269;
    
    uint256 constant IC42x = 1811303203319104278362969684139526784358903253581461172264014876721773348461;
    uint256 constant IC42y = 21521903103758762965300594045879571579327896090920047503148925193873444914690;
    
    uint256 constant IC43x = 5721599425939164984592631558004109502981618503371064556147595298484175262644;
    uint256 constant IC43y = 13409210294148214866055237919342241437647346379741132823111537738419820433228;
    
    uint256 constant IC44x = 15513540529840790742609031052681605594092894487191537466293577467104805717457;
    uint256 constant IC44y = 16681211746065457571550112080548440864632553813384807957638788709536408584389;
    
    uint256 constant IC45x = 19136402549719204952978043571231994309494122387702753404155084522929875732048;
    uint256 constant IC45y = 1191211054800652576154604308997714969645614560841044469538854437109736151323;
    
    uint256 constant IC46x = 37494396546818985391752174249168518126350780467243841426077557387818081259;
    uint256 constant IC46y = 21018260024738706958304753095647736007498158430924509919064274048648842595592;
    
    uint256 constant IC47x = 10329705881654004851981171426167282033126806374112663246665057666407735007765;
    uint256 constant IC47y = 18610957148407173417784326936989842779901079466226170287877764461642782434557;
    
    uint256 constant IC48x = 1558853801581470028438769087719308184475070878811819290871445991003217548324;
    uint256 constant IC48y = 12846788564142716240486575204815752117540200668010948897753747974542185172440;
    
    uint256 constant IC49x = 12627633455830861717709640832970206836036912164591560230739080285705761477758;
    uint256 constant IC49y = 21703664052578406343717511448804541875056839248866473198980393422470376948252;
    
    uint256 constant IC50x = 21146296487081603364060007768314167251498308500389235437667214086877265023825;
    uint256 constant IC50y = 10865986387938161444138437450789670442151835367940513543916346377071974550802;
    
    uint256 constant IC51x = 15827326168944518549789226892855945424852432771699259377424379704749753176914;
    uint256 constant IC51y = 449156355844250059933100771724561315469821900386345050016636728019602739204;
    
    uint256 constant IC52x = 4848297419033048810294920098592693973486567647026804801829227086989067972370;
    uint256 constant IC52y = 17294286677432092042871663837111720613352371236030317856499661733131609665297;
    
    uint256 constant IC53x = 16827761260406008945611437916212339167913522149001594913356494196530821704308;
    uint256 constant IC53y = 11789489378936048038807882986118869581983812853781836646869100693954986660008;
    
    uint256 constant IC54x = 7928356051422299725446932838143459590437184761685450546224731429388010788788;
    uint256 constant IC54y = 1385670916478476441776979759938545799252920370246426874890873739088676750375;
    
    uint256 constant IC55x = 1372251977319152458787403106206284134599984191594535660715004006824411565457;
    uint256 constant IC55y = 19191411728751234022537327622521836088628229966204826162318002935251316752488;
    
    uint256 constant IC56x = 4780423771057633185761383094308821343081369333180429833734301704612435016796;
    uint256 constant IC56y = 10411447978090297481461075594870272018917218279783965895143400471015573328317;
    
    uint256 constant IC57x = 4075202798730624734652826506417651603679368008036899776860334698657134927882;
    uint256 constant IC57y = 12200659725612939084539032230925199267963925477705393216143580339622156072529;
    
    uint256 constant IC58x = 14783807344529949005314764872687143066718369077244196389586934975606414839058;
    uint256 constant IC58y = 16618520603616327282569004578753810421360322368330156760260537953749166021657;
    
    uint256 constant IC59x = 12900021924273992796997314006943009524699297657150465054649393511212014350424;
    uint256 constant IC59y = 10695205997874041717514471539040105202141453534078714964816016433968499647993;
    
    uint256 constant IC60x = 16080475117062716960030935225093403282839252585956976583801290122014461817037;
    uint256 constant IC60y = 1045647026067326033401667255319681045078707796517154712775953431803056254178;
    
    uint256 constant IC61x = 6882864115470925364339566891104068250744291454121165528018663451713042756688;
    uint256 constant IC61y = 12749142350704376544806362433374916877276223478550999190565960046124638331539;
    
    uint256 constant IC62x = 20586295288626333313845741964203492751152001365996195289499123228058469578653;
    uint256 constant IC62y = 12327713337546404538576582644268272755947318595740246446743711217560764130470;
    
    uint256 constant IC63x = 12456042895243483574306628178829175120888810088994883916404287513918799448290;
    uint256 constant IC63y = 2733468617895624554188936942148830436832245445285835686150208133135666113064;
    
    uint256 constant IC64x = 595639179087668108912457461088457447247344186533617426236336820021188705633;
    uint256 constant IC64y = 3437737984147848223820057289472695198768964987987823985055322401355484220000;
    
    uint256 constant IC65x = 4482196597559123476699720995152127043056743281626570452028416082021251371113;
    uint256 constant IC65y = 20200515938148971936931950498288151374917986020720012930892497894899126607044;
    
    uint256 constant IC66x = 15909722646127415251776310309662078099520492443342608019458068994603026650191;
    uint256 constant IC66y = 3583436352379400336640984999256015936487521268133600276285570021444482805699;
    
    uint256 constant IC67x = 3760136618160861050043510441911065259335230706622231268674031602281723802483;
    uint256 constant IC67y = 166358976809277278598898887921369507907071852906954360388647849125428598406;
    
    uint256 constant IC68x = 16622458474622564443612001194349962760374038532431213870487845471988823485454;
    uint256 constant IC68y = 4346233288524067174558323888557196679390675225610602192619801478849776430724;
    
    uint256 constant IC69x = 8503097968283459454696057818765578355995050286784599450688744571117192320223;
    uint256 constant IC69y = 20777491631253709092618357611847533154502196352203437945737338065566750723035;
    
    uint256 constant IC70x = 7547350519459500838866457294400578783456767367160102323972898844111624377874;
    uint256 constant IC70y = 8730513979264231635631624715864637268219390370722751975242851603897398969601;
    
    uint256 constant IC71x = 2201350088972343126441663732320893510066589690446393642378884253584668170993;
    uint256 constant IC71y = 597911224418287609800824402538874317428960123253983318014576848646087483015;
    
    uint256 constant IC72x = 6694488324678067553462591179043491689414814024421247435726434429883305619777;
    uint256 constant IC72y = 10453581880346249423945000510081326300236637624058569544127775818574083459498;
    
    uint256 constant IC73x = 16277756787289621134222749421072573906409882628649823313669011140433202755616;
    uint256 constant IC73y = 18782056687573512900741228883706277508862145137520976625735479543833529363682;
    
 
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
