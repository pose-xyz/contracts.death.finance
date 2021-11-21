const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComposeArt", function () {
  it("Should deploy", async function () {
    
    const VerifySignature = await ethers.getContractFactory("VerifySignature");
    const verifySignature = await VerifySignature.deploy();

    const ComposeArt = await ethers.getContractFactory("ComposeArt");
    const composeArt = await ComposeArt.deploy(
        "ComposeArt", 
        "COMP", 
        "0x0000000000000000000000000000000000000000",
        verifySignature.address);
    await composeArt.deployed();
    console.log(composeArt.address)

    // expect(await composeArt.greet()).to.equal("Hello, world!");
  });
});
