const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VerifySignature", function() {

  it("Recover address from signature", async function() {

    // Get the ContractFactory and Signers here.
    const accounts = await ethers.getSigners();
    const VerifySignature = await ethers.getContractFactory("VerifySignature");
    const verifySignature = await VerifySignature.deploy();

    let messageHash = ethers.utils.solidityKeccak256([ "address", "uint32" ], [ accounts[1].address, 0 ]);
    const msgBytes = ethers.utils.arrayify(messageHash);

    //Sign the messageHash
    const signature = await accounts[0].signMessage(msgBytes);
    //Recover the address from signature
    const recoveredAddress = ethers.utils.verifyMessage(msgBytes, signature);
    //Expect the recovered address is equal to the address of accounts[0] 
    expect(recoveredAddress).to.equal(accounts[0].address);

    const isValidSignature = await verifySignature.verify(accounts[0].address, accounts[1].address, 0, signature);
    expect(isValidSignature).to.be.true;
  });
});