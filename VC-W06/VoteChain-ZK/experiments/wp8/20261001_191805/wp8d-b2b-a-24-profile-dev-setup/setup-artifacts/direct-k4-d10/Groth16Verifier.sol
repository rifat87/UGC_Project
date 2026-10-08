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

    
    uint256 constant IC0x = 12131073892964080883603732956663947359996840972317508851419556090100025532591;
    uint256 constant IC0y = 5878564022653733818231026591842863781528890258110801980695653023529967368021;
    
    uint256 constant IC1x = 5908545953430153475089132764116019604135854666745218967674189159496836287336;
    uint256 constant IC1y = 15129055215194282061839654382167838020245682321999324286301089704462489529149;
    
    uint256 constant IC2x = 18480484290386895810328188784529691325728164679051204584973299297044681002411;
    uint256 constant IC2y = 10129478294424363548671253923804447884028423811303522992240175919747408881639;
    
    uint256 constant IC3x = 9744959226609915167019769190353474404758270639071751803424569798759936609055;
    uint256 constant IC3y = 1338249366996073749443439766981718175305759306476006063829496650933591370571;
    
    uint256 constant IC4x = 6267543042302357103956491383053208993878248135891774060237164344477285918798;
    uint256 constant IC4y = 20271561066327249442020522418187822341169833505826295352644070811174980688526;
    
    uint256 constant IC5x = 8368934518898805774136915392953383136501246065282538760431170377660967564484;
    uint256 constant IC5y = 5654466418216998507806844492075830531229008857078197523303009080129550475096;
    
    uint256 constant IC6x = 3987487300124847902195595901883148897653593789619192722854015198295199376016;
    uint256 constant IC6y = 20321481075491868177762676797092081251050225293749926637392438145486970969916;
    
    uint256 constant IC7x = 7868200115025493596683756585539426674252780637073957202258942656094013811629;
    uint256 constant IC7y = 3629287391564122821769272340153903696983144986772178300842477941003367010684;
    
    uint256 constant IC8x = 6084100591699588999019732689463412210969319592245914886141526790342206400312;
    uint256 constant IC8y = 12549024104194099896105223150680975346043831979652339409796545637999316464208;
    
    uint256 constant IC9x = 18460348413836324901664804581755137670317965421040324495231138589223621236600;
    uint256 constant IC9y = 14195185443299987192111137443322264837338609913734133488872901744970971277588;
    
    uint256 constant IC10x = 15166211419970591843800752386906839587105151291959967064791695978305552479512;
    uint256 constant IC10y = 8707476411702884027417354232999224497935262175260128903911320681784198599969;
    
    uint256 constant IC11x = 19851513441061183948553076787919948530957647098064688452055040126739674853487;
    uint256 constant IC11y = 2500062797798055972375519632413340754844035431271580419562057437004779784378;
    
    uint256 constant IC12x = 3998025538444127345664492965324042623093796192832679838011546110042691270276;
    uint256 constant IC12y = 12252972168707990496889516163640546055226325903325798451961123491893507525276;
    
    uint256 constant IC13x = 5946303852966739361969804378080637585588614450250165580246263818097488752549;
    uint256 constant IC13y = 19157582376752199821994455901386181465758801098670901669556168218267155113844;
    
    uint256 constant IC14x = 9077517167049358055984496592365402469270426087347198823587187957383013466124;
    uint256 constant IC14y = 2884764957348119827628848995105474399450318969732589795655781772994633361614;
    
    uint256 constant IC15x = 17362665786319109937602521680853701240792498378983124745750467087291229826942;
    uint256 constant IC15y = 19588874538165535535146529613682294443894268026188757395022231404966042036185;
    
    uint256 constant IC16x = 12515427004049527668776049533251610735003222746952308833505579149111341113098;
    uint256 constant IC16y = 2902774585073166470908147177547594714460661925264485042469100296387424942736;
    
    uint256 constant IC17x = 5193409126196748546338439090997999231103891323085791679136479726943631149315;
    uint256 constant IC17y = 15142051231784013621992448541524586000652504718789796111300850416692480706383;
    
    uint256 constant IC18x = 14091379396408077037689677261197381910337905380733134175541483372953818106388;
    uint256 constant IC18y = 18239463387274399176010059699233695525604042728204830587899427488791140458823;
    
    uint256 constant IC19x = 10417708112107660244318024648135055607351435764108938541300865917815683489039;
    uint256 constant IC19y = 11821789495025312051623833482266255394623795445163144603014679888541018186002;
    
    uint256 constant IC20x = 8192579657411931617165195195343982663539019873901074535092208393034042828033;
    uint256 constant IC20y = 19509350065654504898773950995690895749214642225569099070179981127001653043487;
    
    uint256 constant IC21x = 20515964693055576069021206218045465173607649281069405620384881944207228968450;
    uint256 constant IC21y = 13218692483381273014981118640211271636983948892867901844009281762762991584184;
    
    uint256 constant IC22x = 15196799540077592919238749166765731091709559429909896470963005695808629286911;
    uint256 constant IC22y = 21695383471694572593231656358933658920925231613555677512121423950991713398548;
    
    uint256 constant IC23x = 16699233445370350953910191758351424629149569864602864900420724358988556327180;
    uint256 constant IC23y = 508884305474554173242913442209639029322824312439246023699319690231833401850;
    
    uint256 constant IC24x = 10221118145726494825771034853167703460933266006489198612359896277502983741099;
    uint256 constant IC24y = 15681087509216722946338425944183477571295934132496949577932539695982674586365;
    
    uint256 constant IC25x = 20068358449027826676847516492537423706602014039007801467406326626454197346145;
    uint256 constant IC25y = 16609199176663897646275728915477575214056256654186240928541285222117104330692;
    
 
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
