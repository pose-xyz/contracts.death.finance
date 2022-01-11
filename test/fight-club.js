const { expect } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = require('bignumber.js');

describe("FightClub", function() {
    let network;
    let accounts;
    let fightClub;
    let allFightersAliveTranche = BigInt(2 ** 32 - 1);

    const firstRoundFighters    = "1010011001010101101010100101011001011010011010100110010110100101101010101001011001010101010101010101011001010110010110100101011001010101100101100110011010010110010101010101011010011001010101011010010101010101010110011001010101011010100101010110011010011001100101101001100110010101101001011001100110010101011010101010100101101001010101010110100101010110101001101010011001010101010101010110010110010101101001010101100110011010010101011010010101010101101001100101101010100101101010011010010101101001010101101001010101010101101010010110011010100101100110010101101010010110100101010110010101011001011010101001010101101010100110011001101001010110101001011010011001010101010101100110010110101010011001010110011001100101010110100101010101101001010110010101010101010101011001011001011001101001011010100101010110011001100110100101011001011010010110101001101001010110011001011001100101010101010101010101010110100101010101010101010110100101100110011010010110010101010101100101010101101001010110010101010101010110010101011010010101100110";
    const secondRoundFighters   = "0010010000010100001000100100001001000010001010000100010010000100001010001000010000010001010001000001001000010100000100100100010001000001000100100100010010000010000100010001001000010001000101001000010001000001010010001000000100010010000100010100001000010001000101001000000100010001100000011000000110000001001000100010000100100001000100010100100000010010100000101000001000010001010001000100000110000001001000010100000110000010000100011000000101000001001000100001100000100001100010000010000100100001000100100001010000010100100010000100010010000001100010000100001000010100000100010010010001001000001000100001000100100010000110000001001001000010001000010010001000010100000100100010010010001000001001000100010000100001000100100001010001000001000110000001000101000100010000010001001000100001001010000001000100010001100000100001001000011000010010001000100001000010001000010001000101000001000100010001010000100001000101000001000100100100000110000010000100010001000101000100010000100001010000010001000101000010000101000010010001000010";
    const thirdRoundFighters    = "0000010000000100000000100000001000000010000010000000010000000100000010000000010000000001010000000001000000000100000100000000010000000001000000100000010010000000000000010000001000000001000001001000000001000000010000000000000100000010000100000000001000000001000100000000000100000001000000010000000110000000001000000000000100000001000100000000100000000010100000001000000000000001010000000000000110000000000000010100000000000010000000010000000100000001000000100001000000100000000010000010000000000001000000100000010000000100000010000000010010000000000010000000001000000100000000010000010000001000000000100001000000000010000010000000001000000010000000010010000000010000000100000000010000001000000001000100000000000001000100000000010001000000000100000001000000000100000000010000001000100000001000000001000000000001000000100000001000001000000010001000000000000010000000010001000001000000000000010000010000000001000100000000000100000100000100000000000100000001000001000100000000000001010000000001000000000010000100000000010001000000";
    const fourthRoundFighters   = "0000000000000100000000000000001000000000000010000000000000000100000000000000010000000000010000000000000000000100000100000000000000000000000000100000000010000000000000000000001000000000000001001000000000000000010000000000000000000000000100000000000000000001000100000000000000000000000000010000000010000000001000000000000000000000000100000000100000000000000000001000000000000001000000000000000100000000000000010000000000000010000000000000000000000001000000100000000000000000000010000000000000000001000000000000010000000000000010000000010000000000000000000000001000000000000000010000010000000000000000000001000000000010000000000000001000000000000000000010000000000000000100000000000000001000000000000100000000000001000000000000000001000000000000000001000000000000000000010000000000100000000000000001000000000001000000000000000000001000000000001000000000000010000000000000000001000000000000010000000000000000000100000000000000000100000100000000000000000000000001000000000000000001010000000000000000000010000000000000010000000000";
    const fifthRoundFighters    = "0000000000000100000000000000000000000000000010000000000000000000000000000000010000000000000000000000000000000000000100000000000000000000000000100000000000000000000000000000000000000000000001000000000000000000010000000000000000000000000100000000000000000000000000000000000000000000000000010000000010000000000000000000000000000000000000000000100000000000000000001000000000000000000000000000000000000000000000010000000000000000000000000000000000000001000000100000000000000000000000000000000000000001000000000000000000000000000000000000010000000000000000000000000000000000000000010000000000000000000000000001000000000000000000000000001000000000000000000000000000000000000100000000000000001000000000000000000000000000000000000000000001000000000000000001000000000000000000000000000000000000000000000001000000000001000000000000000000000000000000000000000000000010000000000000000001000000000000000000000000000000000100000000000000000000000100000000000000000000000000000000000000000001000000000000000000000010000000000000000000000000";
    const sixthRoundFighters    = "0000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000";
    const seventhRoundFighters  = "0000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000";
    const eigthRoundFighters    = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000";
    const ninthRoundFighters    = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const tenthRoundFighters    = "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const brackets = [firstRoundFighters, secondRoundFighters, thirdRoundFighters, fourthRoundFighters, fifthRoundFighters, sixthRoundFighters, seventhRoundFighters, eigthRoundFighters, ninthRoundFighters, tenthRoundFighters];

    this.timeout(120000);

    beforeEach(async () => {
        network = await ethers.provider.getNetwork();
        accounts = await ethers.getSigners();

        const VerifySignature = await ethers.getContractFactory("VerifySignature");
        if (network.name == 'kovan')
            verifySignature = await VerifySignature.attach("0xB4615f9A9eAd41FB83195C734c0a3535462Ad3B4");
        else if (network.name == 'goerli')
            verifySignature = await VerifySignature.attach("0xB4615f9A9eAd41FB83195C734c0a3535462Ad3B4");
        else
            verifySignature = await VerifySignature.deploy();

        const FightClub = await ethers.getContractFactory("FightClub");
        if (network.name == 'kovan')
            fightClub = await FightClub.attach("0xD03D6cF8920c5fe830476dFa3A738B055b30dE81");
        else if (network.name == 'goerli')
            fightClub = await FightClub.attach("0xD03D6cF8920c5fe830476dFa3A738B055b30dE81");
        else
            fightClub = await FightClub.deploy(
                "193660831688735064581587655956512620320321525841920",
                accounts[0].address,
                verifySignature.address,
                "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A"
            );
    });

    it("Fight", async function() {
        
        const zeroPad = (num, places) => String(num).padStart(places, '0')

        let fighterOneStats = 8337395;
        let fighterTwoStats = 8333282;
        fighterOneStatsBin = zeroPad((fighterOneStats >>> 0).toString(2), 24);
        fighterTwoStatsBin = zeroPad((fighterTwoStats >>> 0).toString(2), 24);
        console.log("------------------PLAYER ONE------------------")
        console.log("Special Attack: ",          parseInt(fighterOneStatsBin.substring(0, 4), 2));
        console.log("Special Defense: ",         parseInt(fighterOneStatsBin.substring(4, 8), 2));
        console.log("Attack: ",         parseInt(fighterOneStatsBin.substring(8, 12), 2));
        console.log("Defense: ",  parseInt(fighterOneStatsBin.substring(12, 16), 2));
        console.log("Special Element: ", parseInt(fighterOneStatsBin.substring(16, 20), 2));
        console.log("Element: ", parseInt(fighterOneStatsBin.substring(20, 24), 2));
        console.log("\n");
        console.log("------------------PLAYER TWO------------------")
        console.log("Special Attack: ",          parseInt(fighterTwoStatsBin.substring(0, 4), 2));
        console.log("Special Defense: ",         parseInt(fighterTwoStatsBin.substring(4, 8), 2));
        console.log("Attack: ",         parseInt(fighterTwoStatsBin.substring(8, 12), 2));
        console.log("Defense: ",  parseInt(fighterTwoStatsBin.substring(12, 16), 2));
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

        await expect(fightClub.connect(accounts[1]).fight(fighterOneStats, fighterTwoStats)).to.be.revertedWith(
            "Must be called by controller"
        );

        await mineUntil(25);

        await expect(fightClub.connect(accounts[0]).fight(fighterOneStats, fighterTwoStats)).to.be.revertedWith(
            "Blocknum divisible by 5"
        );

        await mineUntil(26);

        eventLog = await fightClub.connect(accounts[0]).fight(fighterOneStats, fighterTwoStats);
        const EVENT_SIZE = 9;
        eventLog = BigInt(ethers.utils.formatEther(eventLog).toString().replace(".", "")).toString(2);
        const isTie = (eventLog.length % EVENT_SIZE) == 1;
        
        for(let i = 1; i < eventLog.length - 1; i+=EVENT_SIZE) {
            console.log(`${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P1 Attack:": "P2 Attack:"} ${parseInt(eventLog.substring(i+1, i+5), 2)}, ${parseInt(eventLog.substring(i, i+1), 2) == 0 ? "P2 Counter:": "P1 Counter:"} ${parseInt(eventLog.substring(i+5, i+EVENT_SIZE), 2)}`);
        }
        console.log(`${isTie ? "TIE!" : parseInt(eventLog.substring(eventLog.length-1, eventLog.length), 2) == 0 ? "Fighter 1 Wins!" : "Fighter 2 Wins!"}`);
    });

    it("Bracket", async function() {
        
        const zeroPad = (num, places) => String(num).padStart(places, '0')

        let fighters = {};
        let lastFighter = -1;

        for(let i = 0; i < 1024; i+=1) {
            let fighterStat = "";
            for(let j = 0; j < 6; j+=1) {
                fighterStat += zeroPad((Math.floor(Math.random() * 15) + 1).toString(2), 4);
            }
            fighters[i] = parseInt(fighterStat, 2);
        }
        
        for (let i of [0,1,2,3,4,5,6,7,8,9]) {
            let firstFighter = -1;
            let secondFighter = -1;

            for (let j of Object.keys(fighters)) {
                if (fighters[j] != 0) {
                    if (firstFighter == -1) {
                        firstFighter = j;
                    } else if (secondFighter == -1) {
                        secondFighter = j;
                    }
                    if (firstFighter != -1 && secondFighter != -1) {
                        eventLog = await fightClub.connect(accounts[0]).fight(fighters[firstFighter], fighters[secondFighter]);
                        eventLog = BigInt(ethers.utils.formatEther(eventLog).toString().replace(".", "")).toString(2);
                        if (parseInt(eventLog.substring(eventLog.length-1, eventLog.length), 2) == 0) {
                            fighters[secondFighter] = 0;
                            lastFighter = firstFighter;
                        } else {
                            fighters[firstFighter] = 0;
                            lastFighter = secondFighter;
                        }
                        firstFighter = -1;
                        secondFighter = -1;
                    }
                }
            }

            let bracketStatus = "";
            for(let j = 0; j < 1024; j+=1) {
                bracketStatus += fighters[j] == 0 ? "0" : "1";
            }
            
            let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
            let bracketStatusArr = [];
            for (let i = 0; i < 4; i++) {
                bracketStatusArr[i] = "";
                let bn_two = new BigNumber(bracketStatus.substring(256*i,256*(i+1)), 2);
                for (let j = 0; j < bn_two.c.length; j++) {
                    if (j > 0)
                        bracketStatusArr[i] += zeroPad(bn_two.c[j].toString(), 14);
                    else
                        bracketStatusArr[i] += bn_two.c[j].toString();
                }
            }
            await (await fightClub.connect(accounts[0]).setBracketStatus(bracketStatusArr[0], bracketStatusArr[1], bracketStatusArr[2], bracketStatusArr[3])).wait();
            await (await fightClub.connect(accounts[0]).setConfig(true, i)).wait();
            await (await fightClub.connect(accounts[0]).setConfig(false, i+1)).wait();
            await mineUntil(currentBlock.number + (6 - (currentBlock.number % 5)));
        }
        
        let winner = parseInt(((await (await fightClub.connect(accounts[0]).evaluateWinner()).wait()).events[0].data), 16);
        console.log(`Fighter ${winner} Won the Bracket!`);
        console.log(`Fighter ${lastFighter} Won the Bracket!`);
    });

    it("fail bet if betting is closed", async function() {
        const fighterID = 24
        await fightClub.connect(accounts[0]).setConfig(false, 0)
        await expect(fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        })).to.be.revertedWith('Betting is not open; we are mid-round');
    });
 
    it("successfully place bet", async function() {
        const fighterID = 24
        await fightClub.connect(accounts[0]).setConfig(true, 0)
        await fightClub.connect(accounts[1]).placeBet((fighterID),{
            value: ethers.utils.parseEther("1.0")
        });

        const amount = await fightClub.connect(accounts[1]).getBet();
        await expect(amount[1]).to.equal(ethers.utils.parseEther("1.0"));
    });

    it("place two successful bets on same fighter, same round", async function() {
        const fighterID = 24
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
        const fighterID = 24
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
            allFightersAliveTranche,
            allFightersAliveTranche,
            allFightersAliveTranche,
            allFightersAliveTranche);

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
        const fighterID = 24
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
        const fighterID = 24
        await fightClub.connect(accounts[0]).setConfig(true, 1)
        const onlyOurFighterDead = parseInt("11111111011111111111111111111111", 2);

        await fightClub.connect(accounts[0])
        .setBracketStatus(
            onlyOurFighterDead, 
            allFightersAliveTranche,
            allFightersAliveTranche,
            allFightersAliveTranche);
        await expect(fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        })).to.be.revertedWith('Fighter is eliminated');
    });

    it("bet succeeds even if other fighters are dead", async function() {
        const fighterID = 24
        await fightClub.connect(accounts[0]).setConfig(true, 1)
        const onlyOurFighterDead = parseInt("11111111111111011111111111111111", 2);

        await fightClub.connect(accounts[0])
        .setBracketStatus(
            onlyOurFighterDead, 
            allFightersAliveTranche, 
            allFightersAliveTranche, 
            allFightersAliveTranche);
        await expect(fightClub.connect(accounts[1]).placeBet(fighterID, {
            value: ethers.utils.parseEther("1.0")
        }));
    });
});

const mineUntil = async function (blockNum) {
    let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    while (currentBlock.number % blockNum != 0) {
        await ethers.provider.send('evm_mine');
        currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());
    }
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

// // For Verifying Element Boost
// for(let i = 0; i < 13; i++) {
//     for(let j = 0; j < 13; j++) {
//         let powerUp = await fight.elementIsStrong(i, j);
//         console.log(`${i},${j}: ${powerUp}`);
//     }
// }

// 0000     = 0-15 special attack
// 0000     = 0-15 special defense
// 0000     = 0-15 attack
// 0000     = 0-15 defense
// 0000     = 0-15 special element
// 0000     = 0-15 element
// 0111 1111 1100 0111 1111 1010 (Example)
// 0111 1111 1011 0111 1110 0111 (Example)