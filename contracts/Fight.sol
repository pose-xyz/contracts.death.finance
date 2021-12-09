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
        uint128 eventLog;
        bool isCritical;
        fighterOne.isTurn = (fighterOne.specialDefense + fighterOne.specialAttack + fighterOne.defense + fighterOne.attack) <= (fighterTwo.specialDefense + fighterTwo.specialAttack + fighterTwo.defense + fighterTwo.attack);

        for (uint b=0;b<BOUTS;b++) {
            if (fighterOne.isTurn) {
                (fighterTwo, eventLog, isCritical, randomNumber) = attack(fighterOne, fighterTwo, isCritical, eventLog, randomNumber);
            } else {
                (fighterOne, eventLog, isCritical, randomNumber) = attack(fighterTwo, fighterOne, isCritical, eventLog, randomNumber);
            }
            if (fighterOne.defense == 0 || fighterTwo.defense == 0)
                break;
            if (!isCritical) {
                fighterOne.isTurn = !fighterOne.isTurn;
                fighterTwo.isTurn = !fighterTwo.isTurn;
            }
        }

        return ((fighterOne.attack << 20) + (fighterOne.defense << 16) + (fighterOne.element << 12) + (fighterOne.specialAttack << 8) + (fighterOne.specialDefense << 4) + fighterOne.specialElement, (fighterTwo.attack << 20) + (fighterTwo.defense << 16) + (fighterTwo.element << 12) + (fighterTwo.specialAttack << 8) + (fighterTwo.specialDefense << 4) + fighterTwo.specialElement, eventLog);
    }

    function attack(Fighter memory _attacker, Fighter memory _defender, bool _isCritical, uint128 _eventLog, uint256 _randomNumber) internal view returns(Fighter memory, uint128, bool, uint256) {
        uint32 e;
        if (_defender.specialDefense > 0) {
            e = uint32(_randomNumber % (elementIsStrong(_attacker.specialElement, _defender.specialElement) ? (_attacker.specialAttack * 2) + 1 : _attacker.specialAttack + 1));
            _isCritical = elementIsStrong(_attacker.specialElement, _defender.specialElement) ? e == (_attacker.specialAttack * 2) : e == _attacker.specialAttack;
            if (e > _defender.specialDefense)
                _defender.specialDefense = 0;
            else
                _defender.specialDefense = _defender.specialDefense - e;
        } else {
            e = uint32(_randomNumber % (elementIsStrong(_attacker.element, _defender.element) ? (_attacker.attack * 2) + 1 : _attacker.attack + 1));
            _isCritical = elementIsStrong(_attacker.element, _defender.element) ? e == (_attacker.attack * 2) : e == _attacker.attack;
            if (e > _defender.defense)
                _defender.defense = 0;
            else
                _defender.defense = _defender.defense - e;
        }
        _eventLog = (_eventLog << 4) + e;
        return (_defender, _eventLog, _isCritical, uint256(keccak256(abi.encodePacked(block.timestamp, block.number, _randomNumber))));
    }
}