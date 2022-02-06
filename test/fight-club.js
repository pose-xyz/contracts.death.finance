const { expect } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = require('bignumber.js');
const exampleBracket = require('./example-bracket.json');

var sleep = timeout => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, timeout);
    });
};

describe("FightClub", function() {
    let isGoerli = false;
    let network;
    let accounts;
    let fightClub;
    const simulatedEventLog = "11000100000001000001001000000011100001010100000010100000";

    const firstRoundFighters    = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111";
    const secondRoundFighters   = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111";
    const thirdRoundFighters    = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111";
    const fourthRoundFighters   = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011";
    const fifthRoundFighters    = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001";
    const brackets = [firstRoundFighters, secondRoundFighters, thirdRoundFighters, fourthRoundFighters, fifthRoundFighters];


    this.timeout(6000000);

    beforeEach(async () => {
        network = await ethers.provider.getNetwork();
        accounts = await ethers.getSigners();

        if (network.name == 'goerli') {
            isGoerli = true;
        }

        const VerifySignature = await ethers.getContractFactory("VerifySignature");
        if (network.name == 'kovan')
            verifySignature = await VerifySignature.attach("0xAbE190d309EE79E7780B1d255e89e7da62D6716C");
        else if (network.name == 'goerli')
            verifySignature = await VerifySignature.attach("0xAbE190d309EE79E7780B1d255e89e7da62D6716C");
        else
            verifySignature = await VerifySignature.deploy();

        const FightClub = await ethers.getContractFactory("FightClub");
        if (network.name == 'kovan')
            fightClub = await FightClub.attach("0xeB069B764DB9081b8eCc081D7EF25212D8aE2eb1");
        else if (network.name == 'goerli')
            fightClub = await FightClub.attach("0xeB069B764DB9081b8eCc081D7EF25212D8aE2eb1");
        else
            fightClub = await FightClub.deploy(
                "193660831688735064581587655956512620320321525841920",
                accounts[0].address,
                verifySignature.address,
                10,
                ethers.utils.solidityKeccak256([ "string" ], [ JSON.stringify(exampleBracket) ])
            );
    });



    describe("FightClub", function() {

        it("testnet: Fight", async function() {

            if (!isGoerli) {
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
                    "Multiplier less than 2"
                );
    
                await mineUntilBlock(12);
    
                await expect(fightClub.connect(accounts[1]).addRandomness(0)).to.be.revertedWith(
                    "Blocknum has odd tens digit or betting is not open."
                );
    
                await mineUntilBlock(20);
                
                await expect((await fightClub.connect(accounts[1]).getUserRandomness(accounts[1].address)).toString()).to.equal('0');
                await fightClub.connect(accounts[1]).addRandomness(2423432, { gasPrice: 2000000000, gasLimit: 85000 });
                await expect((await fightClub.connect(accounts[1]).getUserRandomness(accounts[1].address)).toString()).to.equal('1');
    
                await mineUntilBlock(25);
    
                await expect(fightClub.connect(accounts[1]).fight(false, fighterOneStats, fighterTwoStats, 0, 0)).to.be.revertedWith(
                    "Must be called by controller"
                );
    
                await expect(fightClub.connect(accounts[0]).fight(false, fighterOneStats, fighterTwoStats, 0, 0)).to.be.revertedWith(
                    "Blocknum has even tens digit"
                );
    
                await mineUntilBlock(36);
    
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
            } else {
                return this.skip();
            }
        });

        it("testnet: successfully redeem bet after winning tournament", async function() {
            
            if (!isGoerli) {
                const fighterID = 1023
                await fightClub.connect(accounts[0]).setConfig(true, 0)
                const betAmount = ethers.utils.parseEther("0.001")
                await fightClub.connect(accounts[1]).placeBet((fighterID), {
                    value: betAmount
                });

                const amount = await fightClub.connect(accounts[1]).getBet();
                await expect(amount[1]).to.equal(betAmount);

                await fightClub.connect(accounts[0]).setConfig(false, 9);
                await expect(fightClub.connect(accounts[1]).redeemPot()).to.be.revertedWith('Must be last round');
                await fightClub.connect(accounts[0]).setConfig(false, 10);

                const winningBracket = await fightClub.connect(accounts[0]).bracketWithOnlyFighterAlive(fighterID);
                await fightClub
                    .setBracketStatus(
                        0,
                        0,
                        0,
                        winningBracket);
                
                const totalBets = await fightClub.connect(accounts[0]).getTotalPot();
                expect(totalBets).to.equal(betAmount);

                console.log(await fightClub.connect(accounts[0]).getConfig())

                await fightClub.connect(accounts[1]).redeemPot();
                const postRedemptionBets = await fightClub.connect(accounts[0]).getTotalPot();

                expect(postRedemptionBets).to.equal(0);
            } else {
                return this.skip();
            }
        });

        it("testnet: successfully redeem bet after winning tournament, with multiple bettors on different rounds", async function() {
            
            if (!isGoerli) {
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
            } else {
                return this.skip();
            }
        });

        it("testnet: fail bet if betting is closed", async function() {
            if (!isGoerli) {
                const fighterID = 232
                await fightClub.connect(accounts[0]).setConfig(false, 0)
                await expect(fightClub.connect(accounts[1]).placeBet(fighterID, {
                    value: ethers.utils.parseEther("1.0")
                })).to.be.revertedWith('Betting is not open; we are mid-round');
            } else {
                return this.skip();
            }
        });
    
        it("testnet: successfully place bet", async function() {
            if (!isGoerli) {
                const fighterID = 232
                await fightClub.connect(accounts[0]).setConfig(true, 0)
                await fightClub.connect(accounts[1]).placeBet((fighterID),{
                    value: ethers.utils.parseEther("1.0")
                });

                const amount = await fightClub.connect(accounts[1]).getBet();
                await expect(amount[1]).to.equal(ethers.utils.parseEther("1.0"));
            } else {
                return this.skip();
            }
        });

        it("testnet: place two successful bets on same fighter, same round", async function() {
            if (!isGoerli) {
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
            } else {
                return this.skip();
            }
        });

        it("testnet: place two successful bets on same fighter, different rounds", async function() {
            if (!isGoerli) {
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
            } else {
                return this.skip();
            }
        });

        it("testnet: place two successful bets on same fighter, same round", async function() {
            if (!isGoerli) {
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
            } else {
                return this.skip();
            }
        });

        it("testnet: fail bets on different fighters, same round", async function() {
            if (!isGoerli) {
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
            } else {
                return this.skip();
            }
        });

        it("testnet: fail bet our fighter is dead", async function() {
            if (!isGoerli) {
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
            } else {
                return this.skip();
            }
        });

        it("testnet: bet succeeds even if other fighters are dead", async function() {
            if (!isGoerli) {
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
            } else {
                return this.skip();
            }
        });

        it("testnet: emergency withdrawal succeeds in case of contract failure", async function() {
            if (!isGoerli) {
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
            } else {
                return this.skip();
            }
        });

        it("testnet: getBracketStatus", async function() {
            
            if (isGoerli) {
                let bracketStatus = await fightClub.connect(accounts[0]).getBracketStatus();
                await expect(bracketStatus[0]).to.equal("0");
                await fightClub.connect(accounts[0]).setBracketStatus(
                    allFightersAliveTranche(),
                    allFightersAliveTranche(),
                    allFightersAliveTranche(),
                    allFightersAliveTranche());
                let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
                await goerliMineUntilBlock(currentBlock.number + 5);
                bracketStatus = await fightClub.connect(accounts[0]).getBracketStatus();
                await expect(bracketStatus[0]).to.equal("57896044618658097711785492504343953926634992332820282019728792003956564819967");
                await fightClub.connect(accounts[0]).setBracketStatus(
                    0,
                    0,
                    0,
                    0);
                currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
                await goerliMineUntilBlock(currentBlock.number + 5);
                bracketStatus = await fightClub.connect(accounts[0]).getBracketStatus();
                await expect(bracketStatus[0]).to.equal("0");
            } else {
                return this.skip();
            }
        });


        // it("goerli: successfully update contract randomness", async function() {
            
        //     if (isGoerli) {
        //         let currentBlock = await goerlimineUntilBlock(true);
        //         const originalUserRandomness = (await fightClub.connect(accounts[1]).getUserRandomness(accounts[1].address)).toString();
        //         const originalRandomness = (await fightClub.connect(accounts[1]).getRandomness()).toString();
        //         await fightClub.connect(accounts[1]).addRandomness(2423432, { gasPrice: 2000000000, gasLimit: 85000 });
        //         await goerliMineUntilBlock(currentBlock.number + 5);
        //         const updatedUserRandomness = (await fightClub.connect(accounts[1]).getUserRandomness(accounts[1].address)).toString();
        //         const updatedRandomness = (await fightClub.connect(accounts[1]).getRandomness()).toString();
        //         await expect(originalUserRandomness).to.not.equal(updatedUserRandomness);
        //         await expect(originalRandomness).to.not.equal(updatedRandomness);
        //     } else {
        //         return this.skip();
        //     }
        // });


        // it("goerli: successfully update bettingIsOpen", async function() {
            
        //     if (isGoerli) {
        //         let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        //         const originalConfig = await fightClub.connect(accounts[0]).getConfig({ gasPrice: 2000000000, gasLimit: 85000 });
        //         let originalBettingOpen = originalConfig[2];
        //         let originalCurrentRound = originalConfig[3];
        //         await fightClub.connect(accounts[0]).setConfig(!originalBettingOpen, originalCurrentRound, { gasPrice: 2000000000, gasLimit: 85000 })
        //         await goerliMineUntilBlock(currentBlock.number + 5);
        //         const updatedConfig = await fightClub.connect(accounts[0]).getConfig();
        //         let updatedBettingOpen = updatedConfig[2];
        //         let updatedCurrentRound = updatedConfig[3];
        //         await expect(originalBettingOpen).to.not.equal(updatedBettingOpen);
        //         await expect(originalCurrentRound).to.equal(updatedCurrentRound);
        //     } else {
        //         return this.skip();
        //     }
        // });


        // it("goerli: successfully update bracketStatus", async function() {
            
        //     if (isGoerli) {

        //         let bracketStatus = brackets[0];
        //         let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        //         let bracketStatusArr = [];
        //         for (let j = 0; j < 4; j++) {
        //             bracketStatusArr[j] = "";
        //             let bn_two = new BigNumber(bracketStatus.substring(256*j,256*(j+1)), 2);
        //             for (let k = 0; k < bn_two.c.length; k++) {
        //                 if (k > 0)
        //                     bracketStatusArr[j] += zeroPad(bn_two.c[k].toString(), 14);
        //                 else
        //                     bracketStatusArr[j] += bn_two.c[k].toString();
        //             }
        //         }
        //         await fightClub.connect(accounts[0]).setBracketStatus(bracketStatusArr[0], bracketStatusArr[1], bracketStatusArr[2], bracketStatusArr[3]);
        //         await goerliMineUntilBlock(currentBlock.number + 5);
        //         const updatedConfig = await fightClub.connect(accounts[0]).getConfig();
        //         let updatedBettingOpen = updatedConfig[2];
        //         let updatedCurrentRound = updatedConfig[3];
        //         await expect(originalBettingOpen).to.not.equal(updatedBettingOpen);
        //         await expect(originalCurrentRound).to.equal(updatedCurrentRound);
        //     } else {
        //         return this.skip();
        //     }
        // });

        // it("goerli: successfully run entire bracket", async function() {
        //     const zeroPad = (num, places) => String(num).padStart(places, '0')
        //     for (let i = 0; i < brackets.length; i++) {
        //         let bracketStatus = brackets[i];
        //         let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        //         let bracketStatusArr = [];
        //         for (let j = 0; j < 4; j++) {
        //             bracketStatusArr[j] = "";
        //             let bn_two = new BigNumber(bracketStatus.substring(256*j,256*(j+1)), 2);
        //             for (let k = 0; k < bn_two.c.length; k++) {
        //                 if (k > 0)
        //                     bracketStatusArr[j] += zeroPad(bn_two.c[k].toString(), 14);
        //                 else
        //                     bracketStatusArr[j] += bn_two.c[k].toString();
        //             }
        //         }
        //         console.log('bracketStatusArr[3]: ', bracketStatusArr[3]);
        //         await fightClub.connect(accounts[0]).setBracketStatus(bracketStatusArr[0], bracketStatusArr[1], bracketStatusArr[2], bracketStatusArr[3], { gasPrice: 2000000000, gasLimit: 85000 });
        //         console.log("waiting for bracket status to be set");
        //         await goerliMineUntilBlock(currentBlock.number + 3);
        //         await fightClub.connect(accounts[0]).setConfig(true, i, { gasPrice: 2000000000, gasLimit: 85000 });
        //         console.log("waiting for config to be updated");
        //         await goerliMineUntilBlock(currentBlock.number + 6);
        //         await fightClub.connect(accounts[1]).placeBet(1023, {
        //             value: ethers.utils.parseEther("0.001")
        //         });
        //         console.log("waiting for bet to be placed");
        //         await goerliMineUntilBlock(currentBlock.number + 9);
        //         await fightClub.connect(accounts[0]).setConfig(false, i+1, { gasPrice: 2000000000, gasLimit: 85000 });
        //         await goerliMineUntilBlock(currentBlock.number + 12);
        //     }
        //     let winner = parseInt(((await (await fightClub.connect(accounts[0]).evaluateWinner()).wait()).events[0].data), 16);
        //     console.log(`Fighter ${winner} Won the Bracket!`);
        // });


        // it("goerli: debug contract", async function() {
            
        //     if (isGoerli) {
        //         let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        //         const originalConfig = await fightClub.connect(accounts[0]).getConfig({ gasPrice: 2000000000, gasLimit: 85000 });
        //         console.log('originalConfig: ', originalConfig);
        //         const bracketStatus = await fightClub.connect(accounts[0]).getBracketStatus();
        //         console.log('bracketStatus: ', bracketStatus);
        //         const totalBets = await fightClub.connect(accounts[0]).getTotalPot();
        //         console.log('totalBets: ', totalBets);
        //         let userBet = await fightClub.connect(accounts[1]).getBet();
        //         console.log('userBet: ', userBet);
        //         await fightClub.connect(accounts[1]).placeBet(100, {
        //             value: ethers.utils.parseEther("0.001")
        //         });
        //         await goerliMineUntilBlock(currentBlock.number + 3);
        //         userBet = await fightClub.connect(accounts[1]).getBet();
        //         console.log('userBet: ', userBet);
        //         await fightClub.connect(accounts[0]).setBracketStatus(
        //             allFightersAliveTranche(),
        //             allFightersAliveTranche(),
        //             allFightersAliveTranche(),
        //             allFightersAliveTranche());
        //         await goerliMineUntilBlock(currentBlock.number + 3);
        //         await fightClub.connect(accounts[0]).setConfig(true, 0, { gasPrice: 2000000000, gasLimit: 85000 });
        //         await goerliMineUntilBlock(currentBlock.number + 3);
        //         await fightClub.connect(accounts[1]).placeBet(1023, {
        //             value: ethers.utils.parseEther("0.001"),
        //             gasPrice: 2000000000, 
        //             gasLimit: 85000
        //         });
        //         await goerliMineUntilBlock(currentBlock.number + 6);
        //         console.log('originalConfig: ', (await fightClub.connect(accounts[0]).getConfig({ gasPrice: 2000000000, gasLimit: 85000 })));
        //     } else {
        //         return this.skip();
        //     }
        // });
    });
});

const mineUntilBlock = async function (blockNum) {
    let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    while (currentBlock.number % blockNum != 0) {
        await ethers.provider.send('evm_mine');
        currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    }
}

const goerliMineUntil = async function (isEven) {
    let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    while (Math.floor((currentBlock.number / 10) % 2) != (isEven ? 0 : 1)) {
        await sleep(10000);
    }
    return currentBlock;
}

const goerliMineUntilBlock = async function (blockNum) {
    let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    while (currentBlock.number != blockNum) {
        currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
        await sleep(10000);
    }
    return currentBlock;
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
