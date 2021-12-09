const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Fight", function() {

    it("Fight", async function() {

        const network = await ethers.provider.getNetwork();
        let fight;

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

        // Get the ContractFactory and Signers here.
        const accounts = await ethers.getSigners();
        const Fight = await ethers.getContractFactory("Fight");
        if (network.name == 'kovan')
            return
        else if (network.name == 'goerli')
            return
        else
            fight = await Fight.deploy("193660831688735064581587655956512620320321525841920");
        
        // // For Verifying Element Boost
        // for(let i = 0; i < 13; i++) {
        //     for(let j = 0; j < 13; j++) {
        //         let powerUp = await fight.elementIsStrong(i, j);
        //         console.log(`${i},${j}: ${powerUp}`);
        //     }
        // }

        // 000000   = 0-63 Seed Number
        // 000000   = 0-63 Unique Token ID
        // 0000     = 0-15 attack
        // 0000     = 0-15 defense
        // 0000     = 0-15 element
        // 0000     = 0-15 special attack
        // 0000     = 0-15 special defense
        // 0000     = 0-15 special element
        // 000001 000001 0111 1111 1100 0111 1111 1010 (Example)
        // 000010 000010 0111 1111 1011 0111 1110 0111 (Example)
        // const stats = await fight.fight(32639, 32638);
        // console.log(stats);
        // 0111 1111 0011 0111 1111 0011
        // 0111 1111 0010 0111 1110 0010

        const zeroPad = (num, places) => String(num).padStart(places, '0')

        let fighterOneStats = 8337395;
        let fighterTwoStats = 8333282;
        fighterOneStatsBin = zeroPad((fighterOneStats >>> 0).toString(2), 24);
        fighterTwoStatsBin = zeroPad((fighterTwoStats >>> 0).toString(2), 24);
        console.log("------------------PLAYER ONE------------------")
        console.log("Attack: ",          parseInt(fighterOneStatsBin.substring(0, 4), 2));
        console.log("Defense: ",         parseInt(fighterOneStatsBin.substring(4, 8), 2));
        console.log("Element: ",         parseInt(fighterOneStatsBin.substring(8, 12), 2));
        console.log("Special Attack: ",  parseInt(fighterOneStatsBin.substring(12, 16), 2));
        console.log("Special Defense: ", parseInt(fighterOneStatsBin.substring(16, 20), 2));
        console.log("Special Element: ", parseInt(fighterOneStatsBin.substring(20, 24), 2));
        console.log("\n");
        console.log("------------------PLAYER TWO------------------")
        console.log("Attack: ",          parseInt(fighterTwoStatsBin.substring(0, 4), 2));
        console.log("Defense: ",         parseInt(fighterTwoStatsBin.substring(4, 8), 2));
        console.log("Element: ",         parseInt(fighterTwoStatsBin.substring(8, 12), 2));
        console.log("Special Attack: ",  parseInt(fighterTwoStatsBin.substring(12, 16), 2));
        console.log("Special Defense: ", parseInt(fighterTwoStatsBin.substring(16, 20), 2));
        console.log("Special Element: ", parseInt(fighterTwoStatsBin.substring(20, 24), 2));
        console.log("\n");
        console.log("---------------------FIGHT---------------------");
        console.log("\n");

        let isPlayerOne =   (parseInt(fighterOneStatsBin.substring(0, 4), 2) + parseInt(fighterOneStatsBin.substring(4, 8), 2) +
                            parseInt(fighterOneStatsBin.substring(12, 16), 2) + parseInt(fighterOneStatsBin.substring(16, 20), 2)) <=
                            (parseInt(fighterTwoStatsBin.substring(0, 4), 2) + parseInt(fighterTwoStatsBin.substring(4, 8), 2) +
                            parseInt(fighterTwoStatsBin.substring(12, 16), 2) + parseInt(fighterTwoStatsBin.substring(16, 20), 2));

        [fighterOneStats, fighterTwoStats, eventLog] = await fight.fight(fighterOneStats, fighterTwoStats);
        fighterOneStatsBin = zeroPad((fighterOneStats >>> 0).toString(2), 24);
        fighterTwoStatsBin = zeroPad((fighterTwoStats >>> 0).toString(2), 24);

        eventLog = BigInt(ethers.utils.formatEther(eventLog).toString().replace(".", "")).toString(2);
        eventLog = zeroPad(eventLog, eventLog.length + ((eventLog.length % 4) > 0 ? 4 - (eventLog.length % 4) : 0));
        
        for(let i = 0; i < eventLog.length; i+=4) {
            console.log(`${isPlayerOne ? "P1 Attack:": "P2 Attack:"} ${parseInt(eventLog.substring(i, i+4), 2)}`);
            isPlayerOne = !isPlayerOne;
        }

        console.log("------------------PLAYER ONE------------------")
        console.log("Attack: ",          parseInt(fighterOneStatsBin.substring(0, 4), 2));
        console.log("Defense: ",         parseInt(fighterOneStatsBin.substring(4, 8), 2));
        console.log("Element: ",         parseInt(fighterOneStatsBin.substring(8, 12), 2));
        console.log("Special Attack: ",  parseInt(fighterOneStatsBin.substring(12, 16), 2));
        console.log("Special Defense: ", parseInt(fighterOneStatsBin.substring(16, 20), 2));
        console.log("Special Element: ", parseInt(fighterOneStatsBin.substring(20, 24), 2));
        console.log("\n");
        console.log("------------------PLAYER TWO------------------")
        console.log("Attack: ",          parseInt(fighterTwoStatsBin.substring(0, 4), 2));
        console.log("Defense: ",         parseInt(fighterTwoStatsBin.substring(4, 8), 2));
        console.log("Element: ",         parseInt(fighterTwoStatsBin.substring(8, 12), 2));
        console.log("Special Attack: ",  parseInt(fighterTwoStatsBin.substring(12, 16), 2));
        console.log("Special Defense: ", parseInt(fighterTwoStatsBin.substring(16, 20), 2));
        console.log("Special Element: ", parseInt(fighterTwoStatsBin.substring(20, 24), 2));
        console.log("\n");
    });
});