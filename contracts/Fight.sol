// SPDX-License-Identifier: CC-BY-4.0

pragma solidity >= 0.8.0;

contract Fight {

    address controller;
    bool[169] elementsMatrix;

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

    function fight(uint32 _fo, uint32 _ft) public view returns (uint32, uint32, uint256) {
        uint32 fosd = _fo & 15;
        uint32 fosa = (_fo >> 4) & 15;
        uint32 fod = (_fo  >> 8) & 15;
        uint32 foa = (_fo >> 12) & 15;

        uint32 ftsd = _ft & 15;
        uint32 ftsa = (_ft >> 4) & 15;
        uint32 ftd = (_ft  >> 8) & 15;
        uint32 fta = (_ft >> 12) & 15;
        
        uint256 rn = uint256(keccak256(abi.encodePacked(block.timestamp, block.number, block.difficulty)));
        uint32 e;
        uint256 el;

        for (uint b=0;b<2;b++) {
            if ((fosd + fosa + fod + foa) > (ftsd + ftsa + ftd + fta)) {
                (ftd, ftsd, e, rn) = attack(foa, fosa, ftd, ftsd, rn);
                el = (el << 4) + e;
                if (fod == 0 || ftd == 0)
                    break;
                (fod, fosd, e, rn) = attack(fta, ftsa, fod, fosd, rn);
                el = (el << 4) + e;
                if (fod == 0 || ftd == 0)
                    break;
            } else {
                (fod, fosd, e, rn) = attack(fta, ftsa, fod, fosd, rn);
                el = (el << 4) + e;
                if (fod == 0 || ftd == 0)
                    break;
                (ftd, ftsd, e, rn) = attack(foa, fosa, ftd, ftsd, rn);
                el = (el << 4) + e;
                if (fod == 0 || ftd == 0)
                    break;
            }
        }

        return ((foa << 12) + (fod << 8) + (fosa << 4) + fosd, (fta << 12) + (ftd << 8) + (ftsa << 4) + ftsd, el);
    }

    function attack(uint32 _a, uint32 _sa, uint32 _d, uint32 _sd, uint256 _r) internal view returns(uint32, uint32, uint32, uint256) {
        uint32 a;
        if (_sd > 0) {
            a = uint32(_r % _sa) + 1;
            if (a > _sd)
                _sd = 0;
            else
                _sd = _sd - a;
        } else {
            a = uint32(_r % _a) + 1;
            if (a > _d)
                _d = 0;
            else
                _d = _d - a;
        }
        return (_d, _sd, a, uint256(keccak256(abi.encodePacked(block.timestamp, block.number, _r))));
    }
}