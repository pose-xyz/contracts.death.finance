// SPDX-License-Identifier: CC-BY-4.0

import { VerifySignature } from "./VerifySignature.sol";
import "hardhat/console.sol";

pragma solidity >= 0.8.0;

contract FightClub {

    address internal controller;
    uint internal elementsMatrix;
    uint internal random;
    mapping(uint => BracketStatus) internal roundBracketStatus;

    mapping(address => FighterBet) internal bets;
    mapping(address => uint80) internal bettorTotalContributions;
    mapping(address => uint) internal userTotalChaos;
    mapping(uint16 => FighterBet) internal fighterTotalPots;

    Config internal config;

    struct Config {
        // Betting is open before a round has begun and after the round has completed.
        bool isError;
        bool fighterRedeemed;
        bool bettingIsOpen;
        uint8 currentRound;
        uint8 rounds;
        uint24 winningFighterIdentifier;
        address signerAddress;
        address verifySignatureAddress;
        uint pot;
        uint potHighWaterMark;
        uint winningFighterOwnerPayout;
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
        uint8 defense;
        uint8 specialAttack;
        uint8 element;
        uint8 health;
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
        uint8 attackerHealth;
        uint8 defenderHealth;
    }

    event Winner(uint24 _winner);

    constructor (uint _elementsMatrix, address _signerAddress, address _verifySignatureAddress, uint8 _rounds, bytes32 _provenanceHash) {
        controller = msg.sender;
        elementsMatrix = _elementsMatrix;
        random = (uint256(keccak256(abi.encodePacked(block.number, block.timestamp))) >> 128);
        config.winningFighterIdentifier = 16777215;
        config.signerAddress = _signerAddress;
        config.verifySignatureAddress = _verifySignatureAddress;
        config.rounds = _rounds;
        config.provenanceHash = _provenanceHash;
    }

    function setConfig(bool _bettingIsOpen, uint8 _currentRound) external {
        require(msg.sender == controller, 'Must be called by controller');
        require(_currentRound >= config.currentRound, 'Requires greater current round');
        require(config.currentRound < config.rounds, 'Tournament is over!');
        config.bettingIsOpen = _bettingIsOpen;
        config.currentRound = _currentRound;
    }

    function getConfig() view external returns (bool, bool, bool, uint8, uint24, address, address, uint, uint, uint, bytes32) {
        return (config.isError, config.fighterRedeemed, config.bettingIsOpen, config.currentRound, config.winningFighterIdentifier, config.signerAddress, config.verifySignatureAddress, config.pot, config.potHighWaterMark, config.winningFighterOwnerPayout, config.provenanceHash);
    }

    function setConfigError(bool _isError) external {
        require(msg.sender == controller, 'Must be called by controller');
        config.isError = _isError;
    }

    function getTotalPot() view public returns (uint) {
        return config.pot;
    }

    function isFighterAlive(uint16 _fighterIdentifier) view public returns (bool) {
        BracketStatus storage bracketStatus = roundBracketStatus[config.currentRound];
        uint trancheNum = _fighterIdentifier / 256;

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

        uint onlyThisFighter = bracketWithOnlyFighterAlive(_fighterIdentifier);
        uint andAdded = tranche & onlyThisFighter;
        return andAdded > 0;
    }

    function bracketWithOnlyFighterAlive(uint16 _fighterIdentifier) pure public returns (uint256) {
        uint fighterNum = 256 - (_fighterIdentifier % 256);
        return 1 << (fighterNum - 1);
    }

    function getEquityForBet(uint80 _equity, uint8 _lastRoundUpdated) public view returns (uint80) {
        uint8 roundDifference = config.currentRound - _lastRoundUpdated;
        uint80 multiplier = uint80(2) ** roundDifference;
        return _equity * multiplier;
    }

    function evaluateWinner() external {
        require(config.currentRound == config.rounds, 'Must be last round');
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

    function getFighterTotalPot(uint16 _fighterIdentifier) public view returns (uint8, uint80, uint80) {
        FighterBet storage pot = fighterTotalPots[_fighterIdentifier];
        return (
            pot.lastRoundUpdated,
            pot.amount,
            pot.equityOfAmount
        );
    }
    
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

        // Add randomness to fight club
        addRandomness(uint128(block.timestamp));

        // Update total pot
        bettorTotalContributions[msg.sender] += newBetAmount;
        config.pot += newBetAmount;
        config.potHighWaterMark += newBetAmount;
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

    function addRandomness(uint128 _random) public {
        require((block.number / 10) % 2 == 0 || config.bettingIsOpen, 'Blocknum has odd tens digit or betting is not open.');
        require(_random > 1, 'Multiplier less than 2');
        random = (random * ((uint256(keccak256(abi.encodePacked(block.number, _random))) >> 128))) >> 128;
        userTotalChaos[msg.sender] += 1;
    }

    function getRandomness() external view returns(uint) {
        return random;
    }

    function getUserRandomness(address _user) external view returns(uint) {
        return userTotalChaos[_user];
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
        require((_blockNumber / 10) % 2 != 0, 'Blocknum has even tens digit');

        Fighter memory fighterTwo;
        fighterTwo.element = uint8(_fighterTwo & 15);
        fighterTwo.specialElement = uint8((_fighterTwo >> 4) & 15);
        fighterTwo.health = uint8((_fighterTwo >> 8) & 15);
        fighterTwo.attack = uint8((_fighterTwo >> 12) & 15);
        fighterTwo.defense = uint8((_fighterTwo >> 16) & 15);
        fighterTwo.specialAttack = uint8((_fighterTwo >> 20) & 15);

        Fighter memory fighterOne;
        fighterOne.element = uint8(_fighterOne & 15);
        fighterOne.specialElement = uint8((_fighterOne >> 4) & 15);
        fighterOne.health = uint8((_fighterOne >> 8) & 15);
        fighterOne.attack = uint8((_fighterOne >> 12) & 15);
        fighterOne.defense = uint8((_fighterOne >> 16) & 15);
        fighterOne.specialAttack = uint8((_fighterOne >> 20) & 15);
        fighterOne.isTurn = (fighterOne.defense + fighterOne.specialAttack + fighterOne.health + fighterOne.attack) <= (fighterTwo.defense + fighterTwo.specialAttack + fighterTwo.health + fighterTwo.attack);
        
        bool shouldSkip;
        uint128 eventLog = 1;
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(_blockNumber, _random)));

        for (uint b=0;b<10;b++) {
            eventLog = (eventLog << 1) + (fighterOne.isTurn ? 0 : 1);
            if (fighterOne.isTurn) {
                (fighterOne, fighterTwo, eventLog, shouldSkip, randomNumber) = attack(fighterOne, fighterTwo, eventLog, randomNumber, _random);
            } else {
                (fighterTwo, fighterOne, eventLog, shouldSkip, randomNumber) = attack(fighterTwo, fighterOne, eventLog, randomNumber, _random);
            }
            if (fighterOne.health == 0 || fighterTwo.health == 0) {
                eventLog = (eventLog << 1) + (fighterTwo.health == 0 ? 0 : 1);
                break;
            }
            if (!shouldSkip) {
                fighterOne.isTurn = !fighterOne.isTurn;
                fighterTwo.isTurn = !fighterTwo.isTurn;
            }
            if (b == 9) {
                eventLog = fighterOne.health == fighterTwo.health ? ((eventLog << 1) + ((uint256(keccak256(abi.encodePacked(_random, randomNumber))) % 2) == 0 ? 0 : 1)) : fighterOne.health > fighterTwo.health ? ((eventLog << 1) + 0) : ((eventLog << 1) + 1);
            }
        }
        return (eventLog);
    }

    function attack(Fighter memory _attacker, Fighter memory _defender, uint128 _eventLog, uint256 _randomNumber, uint256 _random) internal view returns(Fighter memory, Fighter memory, uint128, bool, uint256) {
        Bout memory bout = createBout(_attacker, _defender, _randomNumber);

        if (bout.counter > bout.attack) {
            if (_defender.defense > 0 && _attacker.defense > 0) 
                _attacker.defense = ((bout.counter - bout.attack) > bout.attackerHealth) ? 0 : bout.attackerHealth - (bout.counter - bout.attack);
            else if (_defender.defense == 0 && _attacker.defense == 0) 
                _attacker.health = ((bout.counter - bout.attack) > bout.attackerHealth) ? 0 : bout.attackerHealth - (bout.counter - bout.attack);
        } else if (bout.counter < bout.attack) {
            if (_defender.defense > 0) 
                _defender.defense = (bout.attack > bout.defenderHealth) ? 0 : bout.defenderHealth - bout.attack;
            else 
                _defender.health = (bout.attack > bout.defenderHealth) ? 0 : bout.defenderHealth - bout.attack;
        }
        
        _eventLog = (_eventLog << 8) + (bout.attack << 4) + bout.counter;
        return (_attacker, _defender, _eventLog, bout.isCritical, uint256(keccak256(abi.encodePacked(_random, _randomNumber))));
    }

    function createBout(Fighter memory _attacker, Fighter memory _defender, uint256 _randomNumber) internal view returns(Bout memory) {
        Bout memory bout;
        if (_defender.defense > 0) {
            bout.attackerElement = _attacker.specialElement;
            bout.defenderElement = _defender.specialElement;
            bout.attackerAttack = _attacker.specialAttack;
            bout.defenderAttack = _defender.specialAttack;
            bout.attackerHealth = _attacker.defense;
            bout.defenderHealth = _defender.defense;
        } else {
            bout.attackerElement = _attacker.element;
            bout.defenderElement = _defender.element;
            bout.attackerAttack = _attacker.attack;
            bout.defenderAttack = _defender.attack;
            bout.attackerHealth = _attacker.health;
            bout.defenderHealth = _defender.health;
        }
        bout.attack = uint8(_randomNumber % (elementIsStrong(bout.attackerElement, bout.defenderElement) ? (bout.attackerAttack * 2) : bout.attackerAttack));
        uint8 maxHit = 15 > bout.attackerAttack * 2 ? bout.attackerAttack * 2 : 15;
        bout.attack = bout.attack > 15 ? 15 : bout.attack;
        bout.isCritical = elementIsStrong(bout.attackerElement, bout.defenderElement) ? bout.attack == maxHit : bout.attack == bout.attackerAttack;

        if (elementIsWeak(bout.attackerElement, bout.defenderElement))
            bout.counter = uint8(uint256(keccak256(abi.encodePacked(random, _randomNumber))) % bout.attackerAttack);
        return bout;
    }

    function elementIsStrong(uint8 _elementOne, uint8 _elementTwo) internal view returns (bool) {
        return (elementsMatrix >> (_elementOne * 13 + _elementTwo)) & 1 > 0;
    }

    function elementIsWeak(uint8 _elementOne, uint8 _elementTwo) internal view returns (bool) {
        return (elementsMatrix >> (_elementTwo * 13 + _elementOne)) & 1 > 0;
    }

    function redeemFighterBounty(bytes memory _signature) external {
        require(!config.fighterRedeemed, 'Bounty has already been redeemed');
        require(config.currentRound == config.rounds, 'Must be last round');
        require(VerifySignature(config.verifySignatureAddress).verifyF(config.signerAddress, msg.sender, config.winningFighterIdentifier, _signature), "Purchaser not on whitelist");
        config.fighterRedeemed = true;
        payable(msg.sender).transfer(config.pot / 20);
    }

    function redeemPot() external {
        require(config.currentRound == config.rounds, 'Must be last round');
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

        console.log("In redeemPot(), fighterEquity is %s and fighterTotalEquity is %s.",
            fighterBet.equityOfAmount,
            fighterTotalPot.equityOfAmount);

        if (config.winningFighterOwnerPayout == 0) {
            setWinningFighterOwnerPayout();
        }

        uint bettorsShare = (config.potHighWaterMark * fighterBet.equityOfAmount) / fighterTotalPot.equityOfAmount;
        console.log("Transferring bettor's share of %s to bettor.", bettorsShare);
        payable(msg.sender).transfer(bettorsShare);
        config.pot -= bettorsShare;
        console.log("Pot share of %s redeemed, total pot is now %s.", bettorsShare, config.pot);
    }

    // 5% of the pot is left for the fighter's owner, regardless if the owner was a bettor or not.
    function setWinningFighterOwnerPayout() internal {
        uint ownersShare = config.pot / 20;
        console.log("Setting aside 5% of pot for owner, totalling %s", ownersShare);
        config.winningFighterOwnerPayout = ownersShare;
        config.pot -= ownersShare;
        config.potHighWaterMark -= ownersShare;
    }

    function emergencyWithdrawal() external {
        require(config.isError, 'Must be in error state');
        uint80 bettorTotalContribution = bettorTotalContributions[msg.sender];
        bettorTotalContributions[msg.sender] = 0;
        payable(msg.sender).transfer(bettorTotalContribution);
    }
}
