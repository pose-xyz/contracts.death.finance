// SPDX-License-Identifier: CC-BY-4.0

import { VerifySignature } from "./VerifySignature.sol";
import "hardhat/console.sol";

pragma solidity >= 0.8.0;

contract FightClub {

    // TODO: Figure out fighter registration
    // TODO: Add winner resolution

    address internal controller;
    uint constant BOUTS = 10;
    uint internal elementsMatrix;
    uint internal random;
    mapping(uint => BracketStatus) internal roundBracketStatus;

    mapping(address => FighterBet) internal bets;
    mapping(address => uint80) internal bettorTotalContributions;
    // key: fighter identifier, value: bets on fighters
    mapping(uint16 => FighterBet) internal fighterTotalPots;

    Config internal config;

    struct Config {
        // Betting is open before a round has begun and after the round has completed.
        bool isError;
        bool fighterRedeemed;
        bool bettingIsOpen;
        uint8 currentRound;
        uint24 winningFighterIdentifier;
        address signerAddress;
        address verifySignatureAddress;
        uint pot;
        bytes32 provenanceHash;
    }

    struct FighterBet {
        bool isRedeemed;
        uint8 lastRoundUpdated;
        uint16 fighterIdentifier;
        uint80 amount;
        uint80 equityOfAmount;
    }

    // To avoid hitting the size limit on brackets, we have divided the bracket into four, 256 fighter groups.
    struct BracketStatus {
        uint256 fighterTrancheOne;
        uint256 fighterTrancheTwo;
        uint256 fighterTrancheThree;
        uint256 fighterTrancheFour;
    }

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

    event Winner(uint24 _winner);

    constructor (uint _elementsMatrix, address _signerAddress, address _verifySignatureAddress, bytes32 _provenanceHash) {
        controller = msg.sender;
        elementsMatrix = _elementsMatrix;
        random = (uint256(keccak256(abi.encodePacked(block.number, block.timestamp))) >> 128);
        config.winningFighterIdentifier = 16777215;
        config.signerAddress = _signerAddress;
        config.verifySignatureAddress = _verifySignatureAddress;
        config.provenanceHash = _provenanceHash;
    }

    function setConfig(bool _bettingIsOpen, uint8 _currentRound) external {
        require(msg.sender == controller, 'Must be called by controller');
        require(_currentRound >= config.currentRound, 'Requires greater current round');
        config.bettingIsOpen = _bettingIsOpen;
        config.currentRound = _currentRound;
    }

    function setConfigError(bool _isError) external {
        require(msg.sender == controller, 'Must be called by controller');
        config.isError = _isError;
    }

    function getConfig() view external returns (bool, uint8, uint24, uint) {
        return (config.bettingIsOpen, config.currentRound, config.winningFighterIdentifier, config.pot);
    }

    function isFighterAlive(uint16 _fighterIdentifier) view public returns (bool) {
        BracketStatus storage bracketStatus = roundBracketStatus[config.currentRound];
        uint trancheNum = _fighterIdentifier / 256;
        uint fighterNum = 256 - (_fighterIdentifier % 256);

        uint tranche = 0;
        if (trancheNum == 0) {
            tranche = bracketStatus.fighterTrancheOne;
        } else if (trancheNum == 1) {
            tranche = bracketStatus.fighterTrancheTwo;
        } else if (trancheNum == 2) {
            tranche = bracketStatus.fighterTrancheThree;
        } else {
            tranche = bracketStatus.fighterTrancheFour;
        }

        uint onlySetFightersBit = 1 << (fighterNum - 1);
        return (tranche & onlySetFightersBit) > 0;
    }

    function evaluateWinner() external {
        require(config.currentRound == BOUTS, 'Must be last round');
        BracketStatus storage bracketStatus = roundBracketStatus[config.currentRound - 1];

        uint tranche;
        uint offset;

        if (bracketStatus.fighterTrancheOne != 0) {
            tranche = bracketStatus.fighterTrancheOne;
            offset = 0;
        } else if (bracketStatus.fighterTrancheTwo != 0) {
            tranche = bracketStatus.fighterTrancheTwo;
            offset = 256;
        } else if (bracketStatus.fighterTrancheThree != 0) {
            tranche = bracketStatus.fighterTrancheThree;
            offset = 512;
        } else if (bracketStatus.fighterTrancheFour != 0) {
            tranche = bracketStatus.fighterTrancheFour;
            offset = 768;
        }

        for (uint r=config.currentRound - 1;r>1;r--) {
            BracketStatus storage pastBracketStatus = roundBracketStatus[r];
            if (offset == 0 && ((pastBracketStatus.fighterTrancheOne & tranche) == 0)) {
                emit Winner(16777215);
            } else if (offset == 256 && ((pastBracketStatus.fighterTrancheTwo & tranche) == 0)) {
                emit Winner(16777215);
            } else if (offset == 512 && ((pastBracketStatus.fighterTrancheThree & tranche) == 0)) {
                emit Winner(16777215);
            } else if (offset == 768 && ((pastBracketStatus.fighterTrancheFour & tranche) == 0)) {
                emit Winner(16777215);
            }
        }
        
        for (uint i=0;i<256;i++) {
            if ((tranche >> i) & 1 == 1) {
                config.winningFighterIdentifier = uint24(offset + (255 - i));
                emit Winner(uint24(offset + (255 - i)));
            }
        }

        emit Winner(16777215);
    }

    // I have no fighters, I bet on alive fighter (done)
    // I have no fighters, I bet on dead fighter (done)
    // I have a fighter and he's alive, and I bet on him (done)
    // I have a fighter and he's dead, and I bet on him (done)
    // I have a fighter and he's alive, and I bet on another (done)
    // I have a fighter and he's dead, and I bet on another (done)
    
    function placeBet(uint16 _fighterIdentifier) external payable {
        require(msg.value > 0, 'Must place a bet higher than zero');
        require(config.bettingIsOpen, 'Betting is not open; we are mid-round');

        if (config.currentRound != 0) {
            // This check isn't needed in first round, because all fighters are alive.
            require(isFighterAlive(_fighterIdentifier), 'Fighter is eliminated');
        }
        
        FighterBet storage existingBet = bets[msg.sender];
        bool hasExistingBet = existingBet.amount > 0;
        bool previousFighterStillAlive = hasExistingBet && (isFighterAlive(existingBet.fighterIdentifier) || config.currentRound == 0);

        if (previousFighterStillAlive) {
            // Don't allow them to change fighter if their fighter hasn't been eliminated
            require(_fighterIdentifier == existingBet.fighterIdentifier, "Cannot change fighters");
        }

        uint80 newBetAmount = uint80(msg.value);
        bool bettingOnNewFighter = existingBet.fighterIdentifier != _fighterIdentifier;
        if (bettingOnNewFighter || !hasExistingBet) {
            bets[msg.sender] = FighterBet(false, config.currentRound, _fighterIdentifier, newBetAmount, newBetAmount);
        } else {
            setNewBetProperties(existingBet, newBetAmount);
        }

        // Update total pot for fighter
        FighterBet storage fighterTotalPot = fighterTotalPots[_fighterIdentifier];
        if (fighterTotalPot.amount == 0) {
            fighterTotalPots[_fighterIdentifier] = FighterBet(false, config.currentRound, _fighterIdentifier, newBetAmount, newBetAmount);
        } else {
            setNewBetProperties(fighterTotalPot, newBetAmount);
        }

        // Update total pot
        bettorTotalContributions[msg.sender] += newBetAmount;
        config.pot += newBetAmount;
    }

    function setNewBetProperties(FighterBet storage _bet, uint80 newBetAmount) internal {
            uint8 roundDifference = config.currentRound - _bet.lastRoundUpdated;
            // If in the same round, 2^0 == 1; no multiplier will be applied to equityOfAmount.
            _bet.equityOfAmount *= uint80(2**roundDifference);
            _bet.equityOfAmount += newBetAmount;
            _bet.amount += newBetAmount;
            _bet.lastRoundUpdated = config.currentRound;
    }

    function getBet() external view returns (uint16, uint80, uint80, uint8) {
        FighterBet storage bet = bets[msg.sender];
        return (bet.fighterIdentifier, bet.amount, bet.equityOfAmount, bet.lastRoundUpdated);
    }

    function addRandomness(uint128 _random) external {
        require(block.number % 5 == 0, 'Blocknum not divisible by 5');
        require(_random > 1, 'Multiplier less than 2');
        random = (random * ((uint256(keccak256(abi.encodePacked(block.number, _random))) >> 128))) >> 128;
    }

    // To avoid hitting the size limit on brackets, we have divided the bracket into four, 256 member groups.
    function setBracketStatus(uint256 _fighterTrancheOne, uint256 _fighterTrancheTwo, uint256 _fighterTrancheThree, uint256 _fighterTrancheFour) external {
        require(msg.sender == controller, 'Must be called by controller');
        BracketStatus storage bracketStatus = roundBracketStatus[config.currentRound];
        bracketStatus.fighterTrancheOne = _fighterTrancheOne;
        bracketStatus.fighterTrancheTwo = _fighterTrancheTwo;
        bracketStatus.fighterTrancheThree = _fighterTrancheThree;
        bracketStatus.fighterTrancheFour = _fighterTrancheFour;
    }

    function getBracketStatus() external view returns (uint256, uint256, uint256, uint256) {
        BracketStatus storage bracketStatus = roundBracketStatus[config.currentRound];
        return (bracketStatus.fighterTrancheOne, bracketStatus.fighterTrancheTwo, bracketStatus.fighterTrancheThree, bracketStatus.fighterTrancheFour);
    }

    function fight(bool _isSimulated, uint32 _fighterOne, uint32 _fighterTwo, uint256 _random, uint256 _blockNumber) external view returns (uint128) {
        require(_isSimulated || msg.sender == controller, 'Must be called by controller');
        if (!_isSimulated) {
            _random = random;
            _blockNumber = block.number;
        }
        require(_blockNumber % 5 != 0, 'Blocknum divisible by 5');

        Fighter memory fighterTwo;
        fighterTwo.element = uint8(_fighterTwo & 15);
        fighterTwo.specialElement = uint8((_fighterTwo >> 4) & 15);
        fighterTwo.defense = uint8((_fighterTwo >> 8) & 15);
        fighterTwo.attack = uint8((_fighterTwo >> 12) & 15);
        fighterTwo.specialDefense = uint8((_fighterTwo >> 16) & 15);
        fighterTwo.specialAttack = uint8((_fighterTwo >> 20) & 15);

        Fighter memory fighterOne;
        fighterOne.element = uint8(_fighterOne & 15);
        fighterOne.specialElement = uint8((_fighterOne >> 4) & 15);
        fighterOne.defense = uint8((_fighterOne >> 8) & 15);
        fighterOne.attack = uint8((_fighterOne >> 12) & 15);
        fighterOne.specialDefense = uint8((_fighterOne >> 16) & 15);
        fighterOne.specialAttack = uint8((_fighterOne >> 20) & 15);
        fighterOne.isTurn = (fighterOne.specialDefense + fighterOne.specialAttack + fighterOne.defense + fighterOne.attack) <= (fighterTwo.specialDefense + fighterTwo.specialAttack + fighterTwo.defense + fighterTwo.attack);
        
        bool shouldSkip;
        uint128 eventLog = 1;
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(_blockNumber, _random)));

        for (uint b=0;b<BOUTS;b++) {
            eventLog = (eventLog << 1) + (fighterOne.isTurn ? 0 : 1);
            if (fighterOne.isTurn) {
                (fighterOne, fighterTwo, eventLog, shouldSkip, randomNumber) = attack(fighterOne, fighterTwo, eventLog, randomNumber, _random);
            } else {
                (fighterTwo, fighterOne, eventLog, shouldSkip, randomNumber) = attack(fighterTwo, fighterOne, eventLog, randomNumber, _random);
            }
            if (fighterOne.defense == 0 || fighterTwo.defense == 0) {
                eventLog = (eventLog << 1) + (fighterTwo.defense == 0 ? 0 : 1);
                break;
            }
            if (!shouldSkip) {
                fighterOne.isTurn = !fighterOne.isTurn;
                fighterTwo.isTurn = !fighterTwo.isTurn;
            }
            if (b == 9) {
                eventLog = (eventLog << 1) + ((uint256(keccak256(abi.encodePacked(_random, randomNumber))) % 2) == 0 ? 0 : 1);
            }
        }

        return (eventLog);
    }

    function attack(Fighter memory _attacker, Fighter memory _defender, uint128 _eventLog, uint256 _randomNumber, uint256 _random) internal view returns(Fighter memory, Fighter memory, uint128, bool, uint256) {
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
        return (_attacker, _defender, _eventLog, bout.isCritical, uint256(keccak256(abi.encodePacked(_random, _randomNumber))));
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

    function elementIsStrong(uint8 _elementOne, uint8 _elementTwo) internal view returns (bool) {
        return (elementsMatrix >> (_elementTwo * 13 + _elementOne)) & 1 > 0;
    }

    function elementIsWeak(uint8 _elementOne, uint8 _elementTwo) internal view returns (bool) {
        return (elementsMatrix >> (_elementOne * 13 + _elementTwo)) & 1 > 0;
    }

    function redeemFighterBounty(bytes memory _signature) external {
        require(!config.fighterRedeemed, 'Bounty has already been redeemed');
        require(config.currentRound == BOUTS, 'Must be last round');
        require(VerifySignature(config.verifySignatureAddress).verifyF(config.signerAddress, msg.sender, config.winningFighterIdentifier, _signature), "Purchaser not on whitelist");
        config.fighterRedeemed = true;
        payable(msg.sender).transfer(config.pot / 20);
    }

    function redeemPot() external {
        require(config.currentRound == BOUTS, 'Must be last round');

        FighterBet storage fighterBet = bets[msg.sender];
        require(isFighterAlive(fighterBet.fighterIdentifier), 'Fighter is eliminated');
        require(!fighterBet.isRedeemed, 'Bet previously redeemed');

        fighterBet.isRedeemed = true;
        uint8 roundDifference = config.currentRound - fighterBet.lastRoundUpdated;
        fighterBet.equityOfAmount *= uint80(2**roundDifference);
        fighterBet.lastRoundUpdated = config.currentRound;

        FighterBet storage fighterTotalPot = fighterTotalPots[fighterBet.fighterIdentifier];
        roundDifference = config.currentRound - fighterTotalPot.lastRoundUpdated;
        fighterTotalPot.equityOfAmount *= uint80(2**roundDifference);
        fighterTotalPot.lastRoundUpdated = config.currentRound;
        
        payable(msg.sender).transfer((config.pot * fighterBet.equityOfAmount * 19) / (fighterTotalPot.equityOfAmount * 20));
    }

    function emergencyWithdrawal() external {
        require(config.isError, 'Must be in error state');
        uint80 bettorTotalContribution = bettorTotalContributions[msg.sender];
        bettorTotalContributions[msg.sender] = 0;
        payable(msg.sender).transfer(bettorTotalContribution);
    }
}