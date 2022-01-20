const { expect } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = require('bignumber.js');
const exampleBracket = require('./example-bracket.json');

describe("FightClub", function() {
    let network;
    let accounts;
    let fightClub;
    const simulatedEventLog = "11000100000001000001001000000011100001010100000010100000";

    this.timeout(120000);

    beforeEach(async () => {
        network = await ethers.provider.getNetwork();
        accounts = await ethers.getSigners();

        const VerifySignature = await ethers.getContractFactory("VerifySignature");
        if (network.name == 'kovan')
            verifySignature = await VerifySignature.attach("0x1B8144db9e010C4b39BeCC77975c96B12B8dFf0c");
        else if (network.name == 'goerli')
            verifySignature = await VerifySignature.attach("0x1B8144db9e010C4b39BeCC77975c96B12B8dFf0c");
        else
            verifySignature = await VerifySignature.deploy();

        const FightClub = await ethers.getContractFactory("FightClub");
        if (network.name == 'kovan')
            fightClub = await FightClub.attach("0xfE891216cFa520997271ad892833b514b9422AF5");
        else if (network.name == 'goerli')
            fightClub = await FightClub.attach("0xfE891216cFa520997271ad892833b514b9422AF5");
        else
            fightClub = await FightClub.deploy(
                "193660831688735064581587655956512620320321525841920",
                accounts[0].address,
                verifySignature.address,
                ethers.utils.solidityKeccak256([ "string" ], [ JSON.stringify(exampleBracket) ])
            );
    });

    it("Fight", async function() {
        
        const zeroPad = (num, places) => String(num).padStart(places, '0')

        let fighterOneStats = 14325810;
        let fighterTwoStats = 6627840;
        fighterOneStatsBin = zeroPad((fighterOneStats >>> 0).toString(2), 24);
        fighterTwoStatsBin = zeroPad((fighterTwoStats >>> 0).toString(2), 24);
        console.log("------------------PLAYER ONE------------------")
        console.log("Special Attack: ",          parseInt(fighterOneStatsBin.substring(0, 4), 2));
        console.log("Defense: ",         parseInt(fighterOneStatsBin.substring(4, 8), 2));
        console.log("Attack: ",         parseInt(fighterOneStatsBin.substring(8, 12), 2));
        console.log("Health: ",  parseInt(fighterOneStatsBin.substring(12, 16), 2));
        console.log("Special Element: ", parseInt(fighterOneStatsBin.substring(16, 20), 2));
        console.log("Element: ", parseInt(fighterOneStatsBin.substring(20, 24), 2));
        console.log("\n");
        console.log("------------------PLAYER TWO------------------")
        console.log("Special Attack: ",          parseInt(fighterTwoStatsBin.substring(0, 4), 2));
        console.log("Defense: ",         parseInt(fighterTwoStatsBin.substring(4, 8), 2));
        console.log("Attack: ",         parseInt(fighterTwoStatsBin.substring(8, 12), 2));
        console.log("Health: ",  parseInt(fighterTwoStatsBin.substring(12, 16), 2));
        console.log("Special Element: ", parseInt(fighterTwoStatsBin.substring(16, 20), 2));
        console.log("Element: ", parseInt(fighterTwoStatsBin.substring(20, 24), 2));
        console.log("\n");
        console.log("---------------------FIGHT---------------------");

        await expect(fightClub.connect(accounts[1]).addRandomness(0)).to.be.revertedWith(
            "Blocknum not divisible by 5"
        );

        await mineUntil(9);

        await expect(fightClub.connect(accounts[1]).addRandomness(0)).to.be.revertedWith(
            "Multiplier less than 2"
        );

        await mineUntil(14);

        await expect(fightClub.connect(accounts[1]).addRandomness(1)).to.be.revertedWith(
            "Multiplier less than 2"
        );

        await mineUntil(19);

        await fightClub.connect(accounts[1]).addRandomness(2423432);

        await expect(fightClub.connect(accounts[1]).fight(false, fighterOneStats, fighterTwoStats, 0, 0)).to.be.revertedWith(
            "Must be called by controller"
        );

        await mineUntil(25);

        await expect(fightClub.connect(accounts[0]).fight(false, fighterOneStats, fighterTwoStats, 0, 0)).to.be.revertedWith(
            "Blocknum divisible by 5"
        );

        await mineUntil(26);

        eventLog = await fightClub.connect(accounts[0]).fight(false, fighterOneStats, fighterTwoStats, 0, 0);
        const EVENT_SIZE = 9;
        eventLog = BigInt(eventLog.toString().replace(".", "")).toString(2);
        let isTie = (eventLog.length % EVENT_SIZE) == 1;
        
        for(let i = 1; i < eventLog.length - 1; i+=EVENT_SIZE) {
            console.log(`${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P1 Attack:": "P2 Attack:"} ${parseInt(eventLog.substring(i+1, i+5), 2)}, ${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P2 Counter:": "P1 Counter:"} ${parseInt(eventLog.substring(i+5, i+EVENT_SIZE), 2)}`);
        }
        console.log(`${isTie ? "TIE!" : parseInt(eventLog.substring(eventLog.length-1, eventLog.length), 2) == 0 ? "Fighter 1 Wins!" : "Fighter 2 Wins!"}`);

        eventLog = await fightClub.connect(accounts[1]).fight(true, fighterOneStats, fighterTwoStats, '47253922380151261668899214344815469786', 31);
        eventLog = BigInt(eventLog.toString().replace(".", "")).toString(2);
        isTie = (eventLog.length % EVENT_SIZE) == 1;
        await expect(eventLog).to.equal(simulatedEventLog);
        
        for(let i = 1; i < eventLog.length - 1; i+=EVENT_SIZE) {
            console.log(`${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P1 Attack:": "P2 Attack:"} ${parseInt(eventLog.substring(i+1, i+5), 2)}, ${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P2 Counter:": "P1 Counter:"} ${parseInt(eventLog.substring(i+5, i+EVENT_SIZE), 2)}`);
        }
        console.log(`${isTie ? "TIE!" : parseInt(eventLog.substring(eventLog.length-1, eventLog.length), 2) == 0 ? "Fighter 1 Wins!" : "Fighter 2 Wins!"}`);

    });

    it("successfully redeem bet after winning tournament", async function() {
        const fighterID = 232
        await fightClub.connect(accounts[0]).setConfig(true, 0)
        const betAmount = 69
        await fightClub.connect(accounts[1]).placeBet((fighterID), {
            value: betAmount
        });

        const amount = await fightClub.connect(accounts[1]).getBet();
        await expect(amount[1]).to.equal(betAmount);

        await fightClub.connect(accounts[0]).setConfig(false, 10);

        const winningBracket = await fightClub.connect(accounts[0]).bracketWithOnlyFighterAlive(fighterID);
        await fightClub
            .setBracketStatus(
                winningBracket,
                0,
                0,
                0);

        const totalBets = await fightClub.connect(accounts[0]).getTotalPot();
        expect(totalBets).to.equal(betAmount);

        await fightClub.connect(accounts[1]).redeemPot();
        const postRedemptionBets = await fightClub.connect(accounts[0]).getTotalPot();

        expect(postRedemptionBets).to.equal(0);
    });

    it("successfully redeem bet after winning tournament, with multiple bettors on different rounds", async function() {
        const fighterID = 232

        const winningBracket = await fightClub
            .connect(accounts[0])
            .bracketWithOnlyFighterAlive(fighterID);
        await fightClub.connect(accounts[0])
            .setBracketStatus(
                winningBracket,
                0,
                0,
                0);

        // First bettor.
        const firstBettorRound = 0
        await fightClub.connect(accounts[0]).setConfig(true, firstBettorRound)
        const firstBetAmount = 69
        await fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: firstBetAmount
        });

        // Second bettor.
        const secondBettorRound = 3
        await fightClub.connect(accounts[0]).setConfig(true, secondBettorRound);
        await fightClub.connect(accounts[0])
            .setBracketStatus(
                winningBracket,
                0,
                0,
                0);
        const secondBetAmount = 42
        await fightClub.connect(accounts[2]).placeBet((fighterID), {
            value: secondBetAmount
        });

        // Third bettor.
        const thirdBettorRound = 7
        await fightClub.connect(accounts[0]).setConfig(true, thirdBettorRound);
        await fightClub.connect(accounts[0])
            .setBracketStatus(
                winningBracket,
                0,
                0,
                0);
        const thirdBetAmount = 420
        await fightClub.connect(accounts[3]).placeBet((fighterID), {
            value: thirdBetAmount
        });

        // Final round
        await fightClub.connect(accounts[0]).setConfig(true, 10);
        await fightClub.connect(accounts[0])
            .setBracketStatus(
                winningBracket,
                0,
                0,
                0);

        // Pot includes all three bettor amounts.
        const totalBets = await fightClub.connect(accounts[0]).getTotalPot();
        expect(totalBets).to.equal(firstBetAmount + secondBetAmount + thirdBetAmount);

        const fighterTotalPot = await fightClub.connect(accounts[1]).getFighterTotalPot(fighterID);
        const fighterTotalEquity = await fightClub.connect(accounts[1]).getEquityForBet(fighterTotalPot[2], fighterTotalPot[0]);

        const totalRounds = 10
        const firstBettorBet = await fightClub.connect(accounts[1]).getBet();
        const firstBettorLastUpdatedRound = firstBettorBet[3];
        const firstBettorEquity = firstBettorBet[2] * (Math.pow(2, (totalRounds - firstBettorLastUpdatedRound)));
        await expect(firstBettorEquity).to.equal(firstBetAmount * (Math.pow(2, (totalRounds - firstBettorRound))));
        const firstBettorPercentage = firstBettorEquity / fighterTotalEquity;

        const secondBettorBet = await fightClub.connect(accounts[2]).getBet();
        const secondBettorLastUpdatedRound = secondBettorBet[3];
        const secondBettorEquity = secondBettorBet[2] * (Math.pow(2, (totalRounds - secondBettorLastUpdatedRound)));
        await expect(secondBettorEquity).to.equal(secondBetAmount * (Math.pow(2, (totalRounds - secondBettorRound))));
        const secondBettorPercentage = secondBettorEquity / fighterTotalEquity;

        const thirdBettorBet = await fightClub.connect(accounts[3]).getBet();
        const thirdBettorLastUpdatedRound = thirdBettorBet[3];
        const thirdBettorEquity = thirdBettorBet[2] * (Math.pow(2, (totalRounds - thirdBettorLastUpdatedRound)));
        await expect(thirdBettorEquity).to.equal(thirdBetAmount * (Math.pow(2, totalRounds - thirdBettorRound)));

        const preRedemptionPot = await fightClub.connect(accounts[0]).getTotalPot();
        console.log("Pre redemption pot is %s.", preRedemptionPot);
        await fightClub.connect(accounts[1]).redeemPot();
        await fightClub.connect(accounts[2]).redeemPot();
        await fightClub.connect(accounts[3]).redeemPot();
        const postRedemptionBets = await fightClub.connect(accounts[0]).getTotalPot();
        console.log("After all three redemptions, pot is %s.", postRedemptionBets);
    });

    it("fail bet if betting is closed", async function() {
        const fighterID = 232
        await fightClub.connect(accounts[0]).setConfig(false, 0)
        await expect(fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        })).to.be.revertedWith('Betting is not open; we are mid-round');
    });
 
    it("successfully place bet", async function() {
        const fighterID = 232
        await fightClub.connect(accounts[0]).setConfig(true, 0)
        await fightClub.connect(accounts[1]).placeBet((fighterID),{
            value: ethers.utils.parseEther("1.0")
        });

        const amount = await fightClub.connect(accounts[1]).getBet();
        await expect(amount[1]).to.equal(ethers.utils.parseEther("1.0"));
    });

    it("place two successful bets on same fighter, same round", async function() {
        const fighterID = 232
        await fightClub.connect(accounts[0]).setConfig(true, 0);

        await fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        });
        await fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.5")
        });

        const afterTwoBets = await fightClub.connect(accounts[1]).getBet();
        await expect(afterTwoBets[1]).to.equal(ethers.utils.parseEther("2.5"));
    });

    it("place two successful bets on same fighter, different rounds", async function() {
        
        const fighterID = 232
        await fightClub.connect(accounts[0]).setConfig(true, 0);

        await fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        });
        const firstRoundBet = await fightClub.connect(accounts[1]).getBet();
        const firstRoundBetAmount = firstRoundBet[1];
        await expect(firstRoundBetAmount).to.equal(ethers.utils.parseEther("1.0"));
        const firstRoundBetEquity = firstRoundBet[2];
        await expect(firstRoundBetEquity).to.equal(ethers.utils.parseEther("1.0"));

        await fightClub.connect(accounts[0]).setConfig(true, 1);
        await fightClub.connect(accounts[0])
        .setBracketStatus(
            allFightersAliveTranche(),
            allFightersAliveTranche(),
            allFightersAliveTranche(),
            allFightersAliveTranche());

        await fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.5")
        });
        const secondRoundBet = await fightClub.connect(accounts[1]).getBet();
        const secondRoundBetAmount = secondRoundBet[1];
        await expect(secondRoundBetAmount).to.equal(ethers.utils.parseEther("2.5"));

        const secondRoundBetEquity = secondRoundBet[2];
        await expect(secondRoundBetEquity).to.equal(ethers.utils.parseEther("3.5"));
    });

    it("place two successful bets on same fighter, same round", async function() {
        const fighterID = 232
        await fightClub.connect(accounts[0]).setConfig(true, 0);

        await fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        });
        const firstRoundBet = await fightClub.connect(accounts[1]).getBet();
        const firstRoundBetAmount = firstRoundBet[1];
        await expect(firstRoundBetAmount).to.equal(ethers.utils.parseEther("1.0"));
        const firstRoundBetEquity = firstRoundBet[2];
        await expect(firstRoundBetEquity).to.equal(ethers.utils.parseEther("1.0"));

        await fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.5")
        });
        const secondRoundBet = await fightClub.connect(accounts[1]).getBet();
        const secondRoundBetAmount = secondRoundBet[1];
        await expect(secondRoundBetAmount).to.equal(ethers.utils.parseEther("2.5"));
        const secondRoundBetEquity = secondRoundBet[2];
        await expect(secondRoundBetEquity).to.equal(ethers.utils.parseEther("2.5"));
    });

    it("fail bets on different fighters, same round", async function() {
        const fighterOneID = 24;
        const fighterTwoID = 16;
        await fightClub.connect(accounts[0]).setConfig(true, 0);

        await fightClub.connect(accounts[1]).placeBet(fighterOneID, {
            value: ethers.utils.parseEther("1.0")
        });
        const firstRoundBet = await fightClub.connect(accounts[1]).getBet();
        const firstRoundBetAmount = firstRoundBet[1];
        await expect(firstRoundBetAmount).to.equal(ethers.utils.parseEther("1.0"));
        const firstRoundBetEquity = firstRoundBet[2];
        await expect(firstRoundBetEquity).to.equal(ethers.utils.parseEther("1.0"));
        await expect(fightClub.connect(accounts[1]).placeBet(fighterTwoID, {
            value: ethers.utils.parseEther("1.0")
        })).to.be.revertedWith('Cannot change fighters');
    });

    it("fail bet our fighter is dead", async function() {
        const fighterID = 232
        await fightClub.connect(accounts[0]).setConfig(true, 1)
        const onlyOurFighterDead = parseInt("11111111011111111111111111111111", 2);

        await fightClub.connect(accounts[0])
        .setBracketStatus(
            onlyOurFighterDead, 
            allFightersAliveTranche(),
            allFightersAliveTranche(),
            allFightersAliveTranche());
        await expect(fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        })).to.be.revertedWith('Fighter is eliminated');
    });

    it("bet succeeds even if other fighters are dead", async function() {
        const fighterID = 232
        await fightClub.connect(accounts[0]).setConfig(true, 1)
        const onlyOurFighterDead = parseInt("11111111111111011111111111111111", 2);

        await fightClub.connect(accounts[0])
        .setBracketStatus(
            onlyOurFighterDead, 
            allFightersAliveTranche(), 
            allFightersAliveTranche(), 
            allFightersAliveTranche());
        await expect(fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        }));
    });

    it("emergency withdrawal succeeds in case of contract failure", async function() {
        const fighterID = 24
        await fightClub.connect(accounts[0]).setConfig(false, 1)
        await fightClub.connect(accounts[0])
        .setBracketStatus(
            allFightersAliveTranche(),
            allFightersAliveTranche(),
            allFightersAliveTranche(),
            allFightersAliveTranche());
        await fightClub.connect(accounts[0]).setConfig(true, 1);
        await expect(fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        }));
        await fightClub.connect(accounts[0]).setConfig(false, 2);
        await expect(fightClub.connect(accounts[1]).emergencyWithdrawal()).to.be.revertedWith(
            "Must be in error state"
        );
        await fightClub.connect(accounts[0]).setConfigError(true);
        await expect(await fightClub.connect(accounts[1]).emergencyWithdrawal()).to.changeEtherBalance(accounts[1], '1000000000000000000');
    });
});

const mineUntil = async function (blockNum) {
    let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    while (currentBlock.number % blockNum != 0) {
        await ethers.provider.send('evm_mine');
        currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    }
}

const allFightersAliveTranche = function () {
    
    bracketStatus = "";
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    let bn_two = new BigNumber("111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111", 2);
    for (let k = 0; k < bn_two.c.length; k++) {
        if (k > 0)
            bracketStatus += zeroPad(bn_two.c[k].toString(), 14);
        else
            bracketStatus += bn_two.c[k].toString();
    }
    return bracketStatus;
}

// Notes

// 0: [], // non elemental
// 1: [3], // earth
// 2: [1], // fire
// 3: [2], // water
// 4: [1,6], // light
// 5: [2,4], // time
// 6: [3,5], // force
// 7: [1,6,12], // moon
// 8: [1,4,7], // flower
// 9: [2,4,8], // shadow
// 10: [2,5,9], // ice
// 11: [3,5,10], // thunder
// 12: [3,6,11], // wind

// 0000000000000
// 0001000000000
// 0100000000000
// 0010000000000
// 0100001000000
// 0010100000000
// 0001010000000
// 0100001000001
// 0100100100000
// 0010100010000
// 0010010001000
// 0001010000100
// 0001001000010

// (Flip this and get 193660831688735064581587655956512620320321525841920)

// For Verifying Element Boost
// for(let i = 0; i < 13; i++) {
//     for(let j = 0; j < 13; j++) {
//         let powerUp = await fightClub.connect(accounts[0]).elementIsStrong(i, j);
//         console.log(`${i},${j}: ${powerUp}`);
//     }
// }

// 0000     = 0-15 special attack
// 0000     = 0-15 defense
// 0000     = 0-15 attack
// 0000     = 0-15 health
// 0000     = 0-15 special element
// 0000     = 0-15 element
// 0111 1111 1100 0111 1111 1010 (Example)
// 0111 1111 1011 0111 1110 0111 (Example)

// let fighterOneStats = 6250441;
// let fighterTwoStats = 6250426;
// 010111110101111111001001
// 010111110101111110111010