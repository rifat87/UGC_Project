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

    
    uint256 constant IC0x = 2884092365439282415678249449186473732401301935382219324807198117866878360912;
    uint256 constant IC0y = 13741091725479229443347288273395469256562489849524467488309300531584900276784;
    
    uint256 constant IC1x = 11102558228481612701609644552535656463433698201647483374186590504751341067196;
    uint256 constant IC1y = 11636275979966086708925725622315896124407584883790541201395333864377991912468;
    
    uint256 constant IC2x = 14265659126728911900365280963190847810434616497245527676552555221847737874211;
    uint256 constant IC2y = 9656520671864368269546023692856814049001652715555744347892985610826284834794;
    
    uint256 constant IC3x = 8022189162814897897756240463125278688083862482894040593145429240437281273704;
    uint256 constant IC3y = 2704924278792950262443621149554945945244590866781792763923744768256708685963;
    
    uint256 constant IC4x = 8806747133419123247511845888480452915428361353999300138102410730796265405620;
    uint256 constant IC4y = 11602550379372305860730895198287797017325657786601556423039586088296773436072;
    
    uint256 constant IC5x = 14662594190907200299706048543491263590547093486675554707652511558210678301501;
    uint256 constant IC5y = 18326352531404440249130007524035668157494835045267657523273310767111358876022;
    
    uint256 constant IC6x = 4146323395725901322054440402996664707387341212755101852220116049781472743651;
    uint256 constant IC6y = 4042932033518074851116683321950081753223557318390091450002136111489219254651;
    
    uint256 constant IC7x = 12179004288639265817103029431840524094832570664750283889786639591964890363448;
    uint256 constant IC7y = 2534514991037325105705755132901037688390253893798683024358952948227459271871;
    
    uint256 constant IC8x = 14289278560337494210026648739208681348614194118720176290117305845563451742764;
    uint256 constant IC8y = 731688988469841392452051807825268245553366772672681017410181159376318504435;
    
    uint256 constant IC9x = 20110298301270612276883609688123389120771640304110244039892196321149606425963;
    uint256 constant IC9y = 15030024734862068981643663120936634842477054380216304649811854516833981528961;
    
    uint256 constant IC10x = 4959915347882035624829541402972664565589279558627151972529408598346803258491;
    uint256 constant IC10y = 10824088968759065021172739967759330934620270777694773206212733154489547802799;
    
    uint256 constant IC11x = 17638023910783373693567513420050949664960999674007891956684269553607422074267;
    uint256 constant IC11y = 11382411181225770016284494783365092976921187467802512648953159316806846640247;
    
    uint256 constant IC12x = 19625623114279490737753257768646765955738801669202660137082645850378872122698;
    uint256 constant IC12y = 8146585246956493583626434150002404898775625452250215526971839062243864792233;
    
    uint256 constant IC13x = 6985992830279350453790062640744169606268136085540175456896879535881765089536;
    uint256 constant IC13y = 3324558169280804810489281691107826081803497281389400857246983455563273165937;
    
    uint256 constant IC14x = 6339198086705896260518040282735597295863735425313006098748300426148919333920;
    uint256 constant IC14y = 18360677967620185443323847645238634636919851922486601239555100598345539368185;
    
    uint256 constant IC15x = 8670182349591596913724167833365130478113913125954315457925498019946908033652;
    uint256 constant IC15y = 2836223167237272515564772358996062451147555692956231934939064894528683795172;
    
    uint256 constant IC16x = 20991415100176162123853663582114134653378516857350010671859241152435992485768;
    uint256 constant IC16y = 161965463416495423789531567883868085304214941684737952463730135879389326152;
    
    uint256 constant IC17x = 7340722160959419923827937062600592416507680620267306638919617221613417794042;
    uint256 constant IC17y = 16252328973123404954510175628497662946480949536657760234259303856545877796983;
    
    uint256 constant IC18x = 17027958092490420228451553047194935498324699730900367425100199817521925064809;
    uint256 constant IC18y = 9443383116555676479212085046208971990669100214754904812403774847376865763018;
    
    uint256 constant IC19x = 3858455631038823610974430183430692482999869761132660281956318200046780189799;
    uint256 constant IC19y = 11646585536673448108562113389610161585643079674133371896059848061131998259748;
    
    uint256 constant IC20x = 13823988876013157983859580406263869709016634693816507063702381606541287405485;
    uint256 constant IC20y = 16338838441151823329792979484250293984153240216271878690456949092433137447616;
    
    uint256 constant IC21x = 20927071958444338313807904708378504907686809555646169006180824065478352226136;
    uint256 constant IC21y = 2172903651200892382111717867316062962861066675614602630607162672805178193419;
    
    uint256 constant IC22x = 19714120868879544348205598982261051079521531241254407673057286118220606899039;
    uint256 constant IC22y = 18203239674728184005021914439017713070160577057224812501086517578012251000450;
    
    uint256 constant IC23x = 10490691289041887336867970010888833496475745811771563635903022801701697285889;
    uint256 constant IC23y = 11119993864224701452431959889875114272438914812023240641641393252853263392725;
    
    uint256 constant IC24x = 4485332998500093844164691843988360012927714290433585805524696044774680944301;
    uint256 constant IC24y = 9595396064086526966760264353291472169207484901145125373579432783652370575452;
    
    uint256 constant IC25x = 15508359067777788791702598375821555676285832905910527838820204123619907318430;
    uint256 constant IC25y = 10661138618605261344892020829209217408727205410033819855661254806002681185681;
    
    uint256 constant IC26x = 6556735736577343509119408147030147462418871077720898246774577760405265180514;
    uint256 constant IC26y = 18491954629667047949617824539160955911496030488243640511390680696595053267871;
    
    uint256 constant IC27x = 8947458069385498388065310035711711379608262072961891684427382663137684878579;
    uint256 constant IC27y = 11037027177161422380799997816507819000100585593374822409398376257070696735917;
    
    uint256 constant IC28x = 10803778486779318630436737991472068137572742340153944781638605173557372324856;
    uint256 constant IC28y = 7075858923982247301560612013918228322193946354235091826264701232963360704643;
    
    uint256 constant IC29x = 15509622666120458158284558796276783638374021832494255562088987274064259926922;
    uint256 constant IC29y = 3433539371010731543989278546470178524834501625396713983104504005540684272481;
    
    uint256 constant IC30x = 15869793581065447820465181548942216494157805750676592330077957652322158377704;
    uint256 constant IC30y = 2228668399744160869841165164168245035125073759785798413248962906206329767195;
    
    uint256 constant IC31x = 16937173078510195111540959137963928037712566781253487346389243942458588235019;
    uint256 constant IC31y = 357235271757775093730615490495231341173254903227125647097877646432588905848;
    
    uint256 constant IC32x = 9137268237981799277278081874860778163714027984538400937784141853907000623958;
    uint256 constant IC32y = 4051502454965211793309505682948343395164067322563097903266142636143129039597;
    
    uint256 constant IC33x = 19984084805617458076890607146868890722866052490751155779406038352692550949472;
    uint256 constant IC33y = 17794529992494832646173861185050606990762092641891127911738171669591189850238;
    
    uint256 constant IC34x = 16506165676669936710703330090329228998215788472897500536435957023418034700983;
    uint256 constant IC34y = 17271828612456991256948961749080002662863711802572539987232094893071962545716;
    
    uint256 constant IC35x = 6830939408844467076265420409713966574699150029515505632743498933367227646875;
    uint256 constant IC35y = 15947085714198406268793496905277052756498986070356488578948560731312303326501;
    
    uint256 constant IC36x = 13226511790501492537067266646993317128905563038214645351125645458285203382500;
    uint256 constant IC36y = 6452210749660307136807164941925348702716452117134849022452875507793099686756;
    
    uint256 constant IC37x = 16004246945369576553013676754041503948990886948808044485335168577080392206880;
    uint256 constant IC37y = 9608673573031205357759401017445417499549353138646818678304154113654437100730;
    
    uint256 constant IC38x = 8100737577301229271089065751508857330685622716440687334620427244184553166971;
    uint256 constant IC38y = 8225105581254150306497105057910656479048109878343624719998986085976539605709;
    
    uint256 constant IC39x = 8900608322963194213283578597386775937930689571153539924023021304638687395148;
    uint256 constant IC39y = 2401186543528835259814728133883961203483398348360781473245246665380286842837;
    
    uint256 constant IC40x = 8935490983855080874990525109058505431505889662818443659212695085303647553828;
    uint256 constant IC40y = 9207010994576965086897738077891378539249914771342674289295686856804166530868;
    
    uint256 constant IC41x = 11610236973856208692234994572300930325299293161929861038052730917788585609612;
    uint256 constant IC41y = 20762752040622183046740160923216140929185878249696290913492971097626031684477;
    
 
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
