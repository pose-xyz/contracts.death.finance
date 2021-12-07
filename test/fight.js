const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Fight", function() {

  it("Fight", async function() {

    const network = await ethers.provider.getNetwork();
    let fight;

    // Get the ContractFactory and Signers here.
    const accounts = await ethers.getSigners();
    const Fight = await ethers.getContractFactory("Fight");
    if (network.name == 'kovan')
        return
    else if (network.name == 'goerli')
        return
    else
        fight = await Fight.deploy();

    // 000000   = 0-63 Seed Number
    // 000000   = 0-63 Unique Token ID
    // 0000     = 0-15 attack
    // 0000     = 0-15 defense
    // 0000     = 0-15 special attack
    // 0000     = 0-15 special defense
    // 000001 000001 0011 1111 0011 1111 (Example)
    // 000010 000010 0011 1111 0011 1111 (Example)
    // const stats = await fight.fight(4276031, 4276031);
    // console.log(stats);

    const zeroPad = (num, places) => String(num).padStart(places, '0')

    const [fighterOneStats, fighterTwoStats] = await fight.fight(4276031, 4276031);
    fighterOneStatsBin = zeroPad((fighterOneStats >>> 0).toString(2), 16);
    fighterTwoStatsBin = zeroPad((fighterTwoStats >>> 0).toString(2), 16);
    
    console.log("------------------PLAYER ONE------------------")
    console.log("Attack: ",          parseInt(fighterOneStatsBin.substring(0, 4), 2));
    console.log("Defense: ",         parseInt(fighterOneStatsBin.substring(4, 8), 2));
    console.log("Special Attack: ",  parseInt(fighterOneStatsBin.substring(8, 12), 2));
    console.log("Special Defense: ", parseInt(fighterOneStatsBin.substring(12, 16), 2));
    console.log("\n");
    console.log("------------------PLAYER TWO------------------")
    console.log("Attack: ",          parseInt(fighterTwoStatsBin.substring(0, 4), 2));
    console.log("Defense: ",         parseInt(fighterTwoStatsBin.substring(4, 8), 2));
    console.log("Special Attack: ",  parseInt(fighterTwoStatsBin.substring(8, 12), 2));
    console.log("Special Defense: ", parseInt(fighterTwoStatsBin.substring(12, 16), 2));
    console.log("\n");
});
});