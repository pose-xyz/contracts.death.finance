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

    function elementBoost(uint8 _eo, uint8 _et) public view returns (bool) {
        return elementsMatrix[_eo * 13 + _et];
    }

    function fight(uint32 _fo, uint32 _ft) public view returns (uint32, uint32) {
        uint32 fosd = _fo & 15;
        uint32 fosa = (_fo >> 4) & 15;
        uint32 fod = (_fo  >> 8) & 15;
        uint32 foa = (_fo >> 12) & 15;

        uint32 ftsd = _ft & 15;
        uint32 ftsa = (_ft >> 4) & 15;
        uint32 ftd = (_ft  >> 8) & 15;
        uint32 fta = (_ft >> 12) & 15;

        bool fos = ((fosd + fosa + fod + foa) > (ftsd + ftsa + ftd + fta));
        
        uint256 rn = uint256(keccak256(abi.encodePacked(block.timestamp, block.number, block.difficulty)));

        for (uint b=0;b<10;b++) {
            if (fos)
                (ftd, ftsd, rn) = attack(foa, fosa, ftd, ftsd, rn);
                if (fod == 0 || ftd == 0)
                    break;
                (fod, fosd, rn) = attack(fta, ftsa, fod, fosd, rn);
                if (fod == 0 || ftd == 0)
                    break;
            if (!fos)
                (fod, fosd, rn) = attack(fta, ftsa, fod, fosd, rn);
                if (fod == 0 || ftd == 0)
                    break;
                (ftd, ftsd, rn) = attack(foa, fosa, ftd, ftsd, rn);
                if (fod == 0 || ftd == 0)
                    break;
        }

        return ((foa << 12) + (fod << 8) + (fosa << 4) + fosd, (fta << 12) + (ftd << 8) + (ftsa << 4) + ftsd);
    }

    function attack(uint32 _a, uint32 _sa, uint32 _d, uint32 _sd, uint256 _r) internal view returns(uint32, uint32, uint256) {
        if (_sd > 0) {
            uint32 sa = uint32(_r % _sa) + 1;
            if (sa > _sd)
                _sd = 0;
            else
                _sd = _sd - sa;
        } else {
            uint32 a = uint32(_r % _a) + 1;
            if (a > _d)
                _d = 0;
            else
                _d = _d - a;
        }
        return (_d, _sd, uint256(keccak256(abi.encodePacked(block.timestamp, block.number, _r))));
    }
}