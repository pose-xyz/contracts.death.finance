// SPDX-License-Identifier: CC-BY-4.0

pragma solidity >= 0.8.0;

contract Fight {

    address controller;
    bool[169] elementsMatrix;
    uint constant BOUTS = 10;

    struct Fighter {
        uint32 specialElement;
        uint32 specialDefense;
        uint32 specialAttack;
        uint32 element;
        uint32 defense;
        uint32 attack;
        bool isTurn;
    }

    constructor (uint256 _elementsMatrix) {
        controller = msg.sender;

        for(uint i=0;i<169;i++) {
            elementsMatrix[i] = ((_elementsMatrix >> i) & 1) == 1;
        }
    }

    function elementIsStrong(uint32 _elementOne, uint32 _elementTwo) public view returns (bool) {
        return elementsMatrix[_elementTwo * 13 + _elementOne];
    }

    function elementIsWeak(uint32 _elementOne, uint32 _elementTwo) public view returns (bool) {
        return elementsMatrix[_elementOne * 13 + _elementTwo];
    }

    function fight(uint32 _fighterOne, uint32 _fighterTwo) public view returns (uint32, uint32, uint128) {
        Fighter memory fighterOne;
        fighterOne.specialElement = _fighterOne & 15;
        fighterOne.specialDefense = (_fighterOne >> 4) & 15;
        fighterOne.specialAttack = (_fighterOne >> 8) & 15;
        fighterOne.element = (_fighterOne >> 12) & 15;
        fighterOne.defense = (_fighterOne >> 16) & 15;
        fighterOne.attack = (_fighterOne >> 20) & 15;

        Fighter memory fighterTwo;
        fighterTwo.specialElement = _fighterTwo & 15;
        fighterTwo.specialDefense = (_fighterTwo >> 4) & 15;
        fighterTwo.specialAttack = (_fighterTwo >> 8) & 15;
        fighterTwo.element = (_fighterTwo >> 12) & 15;
        fighterTwo.defense = (_fighterTwo >> 16) & 15;
        fighterTwo.attack = (_fighterTwo >> 20) & 15;
        
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, block.number, block.difficulty)));
        uint128 eventLog = 1;
        bool shouldSkip;
        fighterOne.isTurn = (fighterOne.specialDefense + fighterOne.specialAttack + fighterOne.defense + fighterOne.attack) <= (fighterTwo.specialDefense + fighterTwo.specialAttack + fighterTwo.defense + fighterTwo.attack);

        for (uint b=0;b<BOUTS;b++) {
            eventLog = (eventLog << 1) + (fighterOne.isTurn ? 0 : 1);
            if (fighterOne.isTurn) {
                (fighterOne, fighterTwo, eventLog, shouldSkip, randomNumber) = attack(fighterOne, fighterTwo, shouldSkip, eventLog, randomNumber);
            } else {
                (fighterTwo, fighterOne, eventLog, shouldSkip, randomNumber) = attack(fighterTwo, fighterOne, shouldSkip, eventLog, randomNumber);
            }
            if (fighterOne.defense == 0 || fighterTwo.defense == 0)
                break;
            if (!shouldSkip) {
                fighterOne.isTurn = !fighterOne.isTurn;
                fighterTwo.isTurn = !fighterTwo.isTurn;
            }
        }

        return ((fighterOne.attack << 20) + (fighterOne.defense << 16) + (fighterOne.element << 12) + (fighterOne.specialAttack << 8) + (fighterOne.specialDefense << 4) + fighterOne.specialElement, (fighterTwo.attack << 20) + (fighterTwo.defense << 16) + (fighterTwo.element << 12) + (fighterTwo.specialAttack << 8) + (fighterTwo.specialDefense << 4) + fighterTwo.specialElement, eventLog);
    }

    function attack(Fighter memory _attacker, Fighter memory _defender, bool _shouldSkip, uint128 _eventLog, uint256 _randomNumber) internal view returns(Fighter memory, Fighter memory, uint128, bool, uint256) {
        uint32 atk;
        uint32 ctr;
        if (_defender.specialDefense > 0) {
            atk = uint32(_randomNumber % (elementIsStrong(_attacker.specialElement, _defender.specialElement) ? (_attacker.specialAttack * 2) + 1 : _attacker.specialAttack + 1));
            atk = atk > 15 ? 15 : atk;
            _shouldSkip = elementIsStrong(_attacker.specialElement, _defender.specialElement) ? atk == (_attacker.specialAttack * 2) : atk == _attacker.specialAttack;
            if (elementIsWeak(_attacker.specialElement, _defender.specialElement)) {
                _randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, block.number, _randomNumber)));
                ctr = uint32(_randomNumber % _defender.specialAttack + 1);
            }
            if (ctr > atk) {
                if ((ctr - atk) > _attacker.specialDefense)
                    _attacker.specialDefense = 0;
                else
                    _attacker.specialDefense = _attacker.specialDefense - (ctr - atk);
            } else if (ctr < atk) {
                if (atk > _defender.specialDefense)
                    _defender.specialDefense = 0;
                else
                    _defender.specialDefense = _defender.specialDefense - atk;
            }
        } else {
            atk = uint32(_randomNumber % (elementIsStrong(_attacker.element, _defender.element) ? (_attacker.attack * 2) + 1 : _attacker.attack + 1));
            atk = atk > 15 ? 15 : atk;
            _shouldSkip = elementIsStrong(_attacker.element, _defender.element) ? atk == (_attacker.attack * 2) : atk == _attacker.attack;
            if (elementIsWeak(_attacker.element, _defender.element)) {
                _randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, block.number, _randomNumber)));
                ctr = uint32(_randomNumber % _defender.attack + 1);
            }
            if (ctr > atk) {
                if ((ctr - atk) > _attacker.defense)
                    _attacker.defense = 0;
                else
                    _attacker.defense = _attacker.defense - (ctr - atk);
            } else if (ctr < atk) {
                if (atk > _defender.defense)
                    _defender.defense = 0;
                else
                    _defender.defense = _defender.defense - atk;
            }
        }
        _eventLog = (_eventLog << 8) + (atk << 4) + ctr;
        return (_attacker, _defender, _eventLog, _shouldSkip, uint256(keccak256(abi.encodePacked(block.timestamp, block.number, _randomNumber))));
    }
}