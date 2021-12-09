// SPDX-License-Identifier: CC-BY-4.0

pragma solidity >= 0.8.0;

contract Fight {

    address controller;
    bool[169] elementsMatrix;
    uint constant BOUTS = 20;

    constructor (uint256 _elementsMatrix) {
        controller = msg.sender;

        for(uint i=0;i<169;i++) {
            elementsMatrix[i] = ((_elementsMatrix >> i) & 1) == 1;
        }
    }

    function elementIsStrong(uint8 _eo, uint8 _et) public view returns (bool) {
        return elementsMatrix[_eo * 13 + _et];
    }

    function elementIsWeak(uint8 _eo, uint8 _et) public view returns (bool) {
        return elementsMatrix[_et * 13 + _eo];
    }

    function fight(uint32 _fo, uint32 _ft) public view returns (uint32, uint32, uint128) {
        uint32 fosd = _fo & 15;
        uint32 fosa = (_fo >> 4) & 15;
        uint32 fod = (_fo  >> 8) & 15;
        uint32 foa = (_fo >> 12) & 15;

        uint32 ftsd = _ft & 15;
        uint32 ftsa = (_ft >> 4) & 15;
        uint32 ftd = (_ft  >> 8) & 15;
        uint32 fta = (_ft >> 12) & 15;
        
        uint256 rn = uint256(keccak256(abi.encodePacked(block.timestamp, block.number, block.difficulty)));
        uint128 el;
        bool pom = (fosd + fosa + fod + foa) <= (ftsd + ftsa + ftd + fta);

        for (uint b=0;b<BOUTS;b++) {
            if (pom) {
                (ftd, ftsd, el, rn) = attack(foa, fosa, ftd, ftsd, el, rn);
            } else {
                (fod, fosd, el, rn) = attack(fta, ftsa, fod, fosd, el, rn);
            }
            if (fod == 0 || ftd == 0)
                break;
            pom = !pom;
        }

        return ((foa << 12) + (fod << 8) + (fosa << 4) + fosd, (fta << 12) + (ftd << 8) + (ftsa << 4) + ftsd, el);
    }

    function attack(uint32 _a, uint32 _sa, uint32 _d, uint32 _sd, uint128 _el, uint256 _r) internal view returns(uint32, uint32, uint128, uint256) {
        uint32 e;
        if (_sd > 0) {
            e = uint32(_r % _sa) + 1;
            if (e > _sd)
                _sd = 0;
            else
                _sd = _sd - e;
        } else {
            e = uint32(_r % _a) + 1;
            if (e > _d)
                _d = 0;
            else
                _d = _d - e;
        }
        _el = (_el << 4) + e;
        return (_d, _sd, _el, uint256(keccak256(abi.encodePacked(block.timestamp, block.number, _r))));
    }
}