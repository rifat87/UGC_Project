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

    
    uint256 constant IC0x = 5144391785547581305342675862223849239465487485863544350205151426669114453364;
    uint256 constant IC0y = 755538909982351184227091901621051752319799213858178809781372568119797965753;
    
    uint256 constant IC1x = 3455113765310862960910276751112444982609025313396082698547810840726738270819;
    uint256 constant IC1y = 13695244096305834351650504937688488623192820325466439384022904484061975363690;
    
    uint256 constant IC2x = 4703036874059298618490201048450444678411728005528943785349018264161433780661;
    uint256 constant IC2y = 16422198130289661513114753356124975089156303478174533285935555844357350037677;
    
    uint256 constant IC3x = 11000738473744557363638617867399318535136652162785393940445099177421289757251;
    uint256 constant IC3y = 2415830455401782577666280602723704667162343940010457793897048369498220574976;
    
    uint256 constant IC4x = 3444517738240698836679676964269311865242578856587628388742279919137629052514;
    uint256 constant IC4y = 13634647867771975931358934881745966126088083268375043987767343996094437929777;
    
    uint256 constant IC5x = 10873857390627947115510484263088833299382182340229457098037250359693698069861;
    uint256 constant IC5y = 1322972442844007955081333208557398747344320547378401840635873229513541455831;
    
    uint256 constant IC6x = 13061140561834081898761615148564457021398975299251440518170791920788944067859;
    uint256 constant IC6y = 3090228414179281087963347754370536896010572822729872251724844064330043418275;
    
    uint256 constant IC7x = 11591189338124965499663628695600070463217819054939231866733053474821702184434;
    uint256 constant IC7y = 1439944486982506613616193764897015411459771401923373296903671760821776334185;
    
    uint256 constant IC8x = 8790339644282514303910159327288923219526337955541988686026187647324569419175;
    uint256 constant IC8y = 12002989062379402520265470297906284600252547880057695100606094369184659359560;
    
    uint256 constant IC9x = 2468994793500542492873625595357690750067575198226164164097286704542171387906;
    uint256 constant IC9y = 12904368843810561728099776346197639686359270790897057450551226332304529275472;
    
    uint256 constant IC10x = 20850129561025871053901912146451130919978316145711788756507867020579651555630;
    uint256 constant IC10y = 18881340725138935140090886451533554367681167584236218936147611981432768278428;
    
    uint256 constant IC11x = 2807204379882437670598025140812379693993388553809314968062968962009988423099;
    uint256 constant IC11y = 11090742924663963954780138224992413666573733083528483681058459553928431681380;
    
    uint256 constant IC12x = 15559259742463830286547109821507279560564670019197800569806717829078903654333;
    uint256 constant IC12y = 6601675141130353385912188886993061720183961061482857297154186586793262828180;
    
    uint256 constant IC13x = 21271360619047285967546336484788381675103585379800652561417806564880387882268;
    uint256 constant IC13y = 20486666326940578937263537895658762362172066900078733758751462415547614938257;
    
    uint256 constant IC14x = 19501999917235067575953865497017948124147633900288722818373809015049249517418;
    uint256 constant IC14y = 3119354810585458961659961322675243756814655176996457394070249204823715886865;
    
    uint256 constant IC15x = 6158665694693542926483791918806749301217848043152780250786174249425723928655;
    uint256 constant IC15y = 7825858246388202655954536186915215454510531597621047366296663034903094998151;
    
    uint256 constant IC16x = 14236577922295879708837205292670893700733990925952030911523470113300785239841;
    uint256 constant IC16y = 2665639981319982428786648864694218006037139704056121095113063363574676302225;
    
    uint256 constant IC17x = 15164220478650761190329607864955879472553102954425200234728765843389471570783;
    uint256 constant IC17y = 2403172636851967854859189182694105395166742913396687137438895829792777964858;
    
    uint256 constant IC18x = 9391857715058053734530417797848298679763806726832549430097059793285050413390;
    uint256 constant IC18y = 9974200528171254321704326959114259612612639289005599000443532884237546531215;
    
    uint256 constant IC19x = 9677460254291547376603867912303802451011891121124423032765503154493942368395;
    uint256 constant IC19y = 18058461943443118122342468042094515339169154347864271285683864825291267630955;
    
    uint256 constant IC20x = 4693710219251640394625257557794820355900583369929716012819542852418734951781;
    uint256 constant IC20y = 20054035698875930228061746074442220106445917705638486011033113639802750204538;
    
    uint256 constant IC21x = 11323290477478040931833522508386009698048702715215096875718155780711060275395;
    uint256 constant IC21y = 8674979907129621123011781114731965348535960952561223881977442156274193228417;
    
    uint256 constant IC22x = 8683411576482273398610808620107089598391061441415647289682365386926950746389;
    uint256 constant IC22y = 5035368710597119548376511107008178836782939198960128109498542384281439178932;
    
    uint256 constant IC23x = 2521000886852767126516628878263377991905539043757085448001185501904099900985;
    uint256 constant IC23y = 4466341419021246399920623060420290316286482541065156539388596181212522868202;
    
    uint256 constant IC24x = 1128288893833495154469419014914054988789771984365587233008082992508281273619;
    uint256 constant IC24y = 334882177820438265864631387231737354038793985350081912193999596159978094892;
    
    uint256 constant IC25x = 14880862509772438970355693315465463584200755925215486939670035182153340476383;
    uint256 constant IC25y = 18906548082349983409120870750112308345564605242243951374270114122684609702752;
    
 
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
