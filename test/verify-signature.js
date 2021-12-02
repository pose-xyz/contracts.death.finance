const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VerifySignature", function() {

  it("Recover address from signature", async function() {

    const network = await ethers.provider.getNetwork();
    let verifySignature;

    // Get the ContractFactory and Signers here.
    const accounts = await ethers.getSigners();
    const VerifySignature = await ethers.getContractFactory("VerifySignature");
    if (network.name == 'kovan')
      verifySignature = await VerifySignature.attach("0xB4615f9A9eAd41FB83195C734c0a3535462Ad3B4");
    else if (network.name == 'goerli')
      verifySignature = await VerifySignature.attach("0xB4615f9A9eAd41FB83195C734c0a3535462Ad3B4");
    else
      verifySignature = await VerifySignature.deploy();

    let messageHash = ethers.utils.solidityKeccak256([ "address", "uint32", "bool" ], [ accounts[1].address, 0, false ]);
    const msgBytes = ethers.utils.arrayify(messageHash);

    //Sign the messageHash
    const signature = await accounts[0].signMessage(msgBytes);
    //Recover the address from signature
    const recoveredAddress = ethers.utils.verifyMessage(msgBytes, signature);
    //Expect the recovered address is equal to the address of accounts[0] 
    expect(recoveredAddress).to.equal(accounts[0].address);

    const isValidSignature = await verifySignature.verify(accounts[0].address, accounts[1].address, 0, false, signature);
    expect(isValidSignature).to.be.true;
  });
});