// SPDX-License-Identifier: CC-BY-4.0

pragma solidity >= 0.8.0;

contract FightClub {

    // TODO: Figure out bracket betting
    // TODO: Figure out fighter registration
    // TODO: Add tie-breaker logic

    address controller;
    uint constant BOUTS = 10;
    uint elementsMatrix;
    uint random;

    struct Fighter {
        bool isTurn;
        uint8 specialElement;
        uint8 specialDefense;
        uint8 specialAttack;
        uint8 element;
        uint8 defense;
        uint8 attack;
    }

    struct Bout {
        bool isCritical;
        uint8 attack;
        uint8 counter;
        uint8 attackerElement;
        uint8 defenderElement;
        uint8 attackerAttack;
        uint8 defenderAttack;
        uint8 attackerDefense;
        uint8 defenderDefense;
    }

    constructor (uint _elementsMatrix) {
        controller = msg.sender;
        elementsMatrix = _elementsMatrix;
        random = 0;
    }

    function setRandom(uint _random) external {
        require(block.number % 10 == 0, 'Blocknum not divisible by 10');
        random = _random;
    }

    function elementIsStrong(uint8 _elementOne, uint8 _elementTwo) internal view returns (bool) {
        return (elementsMatrix >> (_elementTwo * 13 + _elementOne)) & 1 > 0;
    }

    function elementIsWeak(uint8 _elementOne, uint8 _elementTwo) internal view returns (bool) {
        return (elementsMatrix >> (_elementOne * 13 + _elementTwo)) & 1 > 0;
    }

    function fight(uint32 _fighterOne, uint32 _fighterTwo) external view returns (uint128) {
        require(block.number % 10 != 0, 'Blocknum not divisible by 10');

        Fighter memory fighterTwo;
        fighterTwo.specialElement = uint8(_fighterTwo & 15);
        fighterTwo.specialDefense = uint8((_fighterTwo >> 4) & 15);
        fighterTwo.specialAttack = uint8((_fighterTwo >> 8) & 15);
        fighterTwo.element = uint8((_fighterTwo >> 12) & 15);
        fighterTwo.defense = uint8((_fighterTwo >> 16) & 15);
        fighterTwo.attack = uint8((_fighterTwo >> 20) & 15);

        Fighter memory fighterOne;
        fighterOne.specialElement = uint8(_fighterOne & 15);
        fighterOne.specialDefense = uint8((_fighterOne >> 4) & 15);
        fighterOne.specialAttack = uint8((_fighterOne >> 8) & 15);
        fighterOne.element = uint8((_fighterOne >> 12) & 15);
        fighterOne.defense = uint8((_fighterOne >> 16) & 15);
        fighterOne.attack = uint8((_fighterOne >> 20) & 15);
        fighterOne.isTurn = (fighterOne.specialDefense + fighterOne.specialAttack + fighterOne.defense + fighterOne.attack) <= (fighterTwo.specialDefense + fighterTwo.specialAttack + fighterTwo.defense + fighterTwo.attack);
        
        bool shouldSkip;
        uint128 eventLog = 1;
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, random)));

        for (uint b=0;b<BOUTS;b++) {
            eventLog = (eventLog << 1) + (fighterOne.isTurn ? 0 : 1);
            if (fighterOne.isTurn) {
                (fighterOne, fighterTwo, eventLog, shouldSkip, randomNumber) = attack(fighterOne, fighterTwo, eventLog, randomNumber);
            } else {
                (fighterTwo, fighterOne, eventLog, shouldSkip, randomNumber) = attack(fighterTwo, fighterOne, eventLog, randomNumber);
            }
            if (fighterOne.defense == 0 || fighterTwo.defense == 0) {
                eventLog = (eventLog << 1) + (fighterTwo.defense == 0 ? 0 : 1);
                break;
            }
            if (!shouldSkip) {
                fighterOne.isTurn = !fighterOne.isTurn;
                fighterTwo.isTurn = !fighterTwo.isTurn;
            }
        }

        return (eventLog);
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
        return (_attacker, _defender, _eventLog, bout.isCritical, uint256(keccak256(abi.encodePacked(random, _randomNumber))));
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
        bout.attack = uint8(_randomNumber % (elementIsStrong(bout.attackerElement, bout.defenderElement) ? (bout.attackerAttack * 2) + 1 : bout.attackerAttack + 1));
        bout.attack = bout.attack > 15 ? 15 : bout.attack;
        bout.isCritical = elementIsStrong(bout.attackerElement, bout.defenderElement) ? bout.attack == (bout.attackerAttack * 2) : bout.attack == bout.attackerAttack;
        if (elementIsWeak(bout.attackerElement, bout.defenderElement))
            bout.counter = uint8(uint256(keccak256(abi.encodePacked(random, _randomNumber))) % bout.defenderAttack + 1);
        return bout;
    }
}