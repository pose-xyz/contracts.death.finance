// SPDX-License-Identifier: CC-BY-4.0

pragma solidity >= 0.8.0;

contract FightClub {

    address controller;
    bool[169] elementsMatrix;
    uint constant BOUTS = 10;

    struct Fighter {
        bool isTurn;
        uint32 specialElement;
        uint32 specialDefense;
        uint32 specialAttack;
        uint32 element;
        uint32 defense;
        uint32 attack;
    }

    struct Bout {
        bool isCritical;
        uint32 attack;
        uint32 counter;
        uint32 attackerElement;
        uint32 defenderElement;
        uint32 attackerAttack;
        uint32 defenderAttack;
        uint32 attackerDefense;
        uint32 defenderDefense;
    }

    constructor (uint256 _elementsMatrix) {
        controller = msg.sender;

        for(uint i=0;i<169;i++) {
            elementsMatrix[i] = ((_elementsMatrix >> i) & 1) == 1;
        }
    }

    function elementIsStrong(uint32 _elementOne, uint32 _elementTwo) internal view returns (bool) {
        return elementsMatrix[_elementTwo * 13 + _elementOne];
    }

    function elementIsWeak(uint32 _elementOne, uint32 _elementTwo) internal view returns (bool) {
        return elementsMatrix[_elementOne * 13 + _elementTwo];
    }

    function fight(uint32 _fighterOne, uint32 _fighterTwo) external view returns (uint32, uint32, uint128) {
        Fighter memory fighterTwo;
        fighterTwo.specialElement = _fighterTwo & 15;
        fighterTwo.specialDefense = (_fighterTwo >> 4) & 15;
        fighterTwo.specialAttack = (_fighterTwo >> 8) & 15;
        fighterTwo.element = (_fighterTwo >> 12) & 15;
        fighterTwo.defense = (_fighterTwo >> 16) & 15;
        fighterTwo.attack = (_fighterTwo >> 20) & 15;

        Fighter memory fighterOne;
        fighterOne.specialElement = _fighterOne & 15;
        fighterOne.specialDefense = (_fighterOne >> 4) & 15;
        fighterOne.specialAttack = (_fighterOne >> 8) & 15;
        fighterOne.element = (_fighterOne >> 12) & 15;
        fighterOne.defense = (_fighterOne >> 16) & 15;
        fighterOne.attack = (_fighterOne >> 20) & 15;
        fighterOne.isTurn = (fighterOne.specialDefense + fighterOne.specialAttack + fighterOne.defense + fighterOne.attack) <= (fighterTwo.specialDefense + fighterTwo.specialAttack + fighterTwo.defense + fighterTwo.attack);
        
        bool shouldSkip;
        uint128 eventLog = 1;
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, block.number, block.difficulty)));

        for (uint b=0;b<BOUTS;b++) {
            eventLog = (eventLog << 1) + (fighterOne.isTurn ? 0 : 1);
            if (fighterOne.isTurn) {
                (fighterOne, fighterTwo, eventLog, shouldSkip, randomNumber) = attack(fighterOne, fighterTwo, eventLog, randomNumber);
            } else {
                (fighterTwo, fighterOne, eventLog, shouldSkip, randomNumber) = attack(fighterTwo, fighterOne, eventLog, randomNumber);
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

    function attack(Fighter memory _attacker, Fighter memory _defender, uint128 _eventLog, uint256 _randomNumber) internal view returns(Fighter memory, Fighter memory, uint128, bool, uint256) {
        Bout memory bout = createBout(_attacker, _defender, _randomNumber);

        if (bout.counter > bout.attack) {
            if (_defender.specialDefense > 0)
                _attacker.specialDefense = ((bout.counter - bout.attack) > bout.attackerDefense) ? 0 : bout.attackerDefense - (bout.counter - bout.attack);
            else
                _attacker.defense = ((bout.counter - bout.attack) > bout.attackerDefense) ? 0 : bout.attackerDefense - (bout.counter - bout.attack);
        } else if (bout.counter < bout.attack) {
            if (_defender.specialDefense > 0)
                _defender.specialDefense = (bout.attack > bout.defenderDefense) ? 0 : bout.defenderDefense - bout.attack;
            else
                _defender.defense = (bout.attack > bout.defenderDefense) ? 0 : bout.defenderDefense - bout.attack;
        }

        _eventLog = (_eventLog << 8) + (bout.attack << 4) + bout.counter;
        return (_attacker, _defender, _eventLog, bout.isCritical, uint256(keccak256(abi.encodePacked(block.timestamp, block.number, _randomNumber))));
    }

    function createBout(Fighter memory _attacker, Fighter memory _defender, uint256 _randomNumber) internal view returns(Bout memory) {
        Bout memory bout;
        if (_defender.specialDefense > 0) {
            bout.attackerElement = _attacker.specialElement;
            bout.defenderElement = _defender.specialElement;
            bout.attackerAttack = _attacker.specialAttack;
            bout.defenderAttack = _defender.specialAttack;
            bout.attackerDefense = _attacker.specialDefense;
            bout.defenderDefense = _defender.specialDefense;
        } else {
            bout.attackerElement = _attacker.element;
            bout.defenderElement = _defender.element;
            bout.attackerAttack = _attacker.attack;
            bout.defenderAttack = _defender.attack;
            bout.attackerDefense = _attacker.defense;
            bout.defenderDefense = _defender.defense;
        }
        bout.attack = uint32(_randomNumber % (elementIsStrong(bout.attackerElement, bout.defenderElement) ? (bout.attackerAttack * 2) + 1 : bout.attackerAttack + 1));
        bout.attack = bout.attack > 15 ? 15 : bout.attack;
        bout.isCritical = elementIsStrong(bout.attackerElement, bout.defenderElement) ? bout.attack == (bout.attackerAttack * 2) : bout.attack == bout.attackerAttack;
        if (elementIsWeak(bout.attackerElement, bout.defenderElement))
            bout.counter = uint32(uint256(keccak256(abi.encodePacked(block.timestamp, block.number, _randomNumber))) % bout.defenderAttack + 1);
        return bout;
    }
}