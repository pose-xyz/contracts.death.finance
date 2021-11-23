const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComposeArt", () => {

  let accounts;
  let verifySignature;
  let composeArt;

  beforeEach(async () => {
      accounts = await ethers.getSigners();
      const VerifySignature = await ethers.getContractFactory("VerifySignature");
      verifySignature = await VerifySignature.deploy();

      const ComposeArt = await ethers.getContractFactory("ComposeArt");
      composeArt = await ComposeArt.deploy(
          "ComposeArt", 
          "COMP", 
          "0x0000000000000000000000000000000000000000",
          verifySignature.address);
      await composeArt.deployed();
  });



  describe("mining", async () => {
    it("mining works", async () => {
      const blockNumBefore = await ethers.provider.getBlockNumber();
      const blockBefore = await ethers.provider.getBlock(blockNumBefore);
      const timestampBefore = blockBefore.timestamp;

      await ethers.provider.send('evm_mine');

      const blockNumAfter = await ethers.provider.getBlockNumber();
      const blockAfter = await ethers.provider.getBlock(blockNumAfter);
      const timestampAfter = blockAfter.timestamp;
      
      expect(blockNumAfter).to.be.equal(blockNumBefore + 1);
      expect(timestampAfter).to.be.equal(timestampBefore + 1);
    })
  });

  describe("release", async () => {

    it("createBase", async () => {

      await (await composeArt.connect(accounts[0]).setCuts(5, 100)).wait();
      
      expect(await composeArt.baseCount()).to.equal(0);
      await (await composeArt.connect(accounts[1]).createBase({ value: ethers.utils.parseEther('0.01') })).wait();
      expect(await composeArt.baseCount()).to.equal(1);

      let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());

      expect(await composeArt.releaseCount()).to.equal(0);
      await (await composeArt.connect(accounts[1]).createRelease(0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", 20, 6, ethers.utils.parseEther('0.01'), 5, currentBlock.timestamp + 5, currentBlock.timestamp + 60, false)).wait();
      expect(await composeArt.releaseCount()).to.equal(1);
      
      await expect(composeArt.connect(accounts[2]).mintPack(0, "", "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 2)).to.be.revertedWith(
        "Sale not started"
      );
      
      for (let i = 0; i < 5; i++) {
        await ethers.provider.send('evm_mine');
      }

      await expect(composeArt.connect(accounts[2]).mintPack(0, "", "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 2, { value: ethers.utils.parseEther('0.01') })).to.be.revertedWith(
        "Not enough ETH sent"
      );

      await expect(composeArt.connect(accounts[2]).mintPack(0, "", "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 8, { value: ethers.utils.parseEther('0.08') })).to.be.revertedWith(
        "Max pack purchase exceeded"
      );
      await (await composeArt.connect(accounts[2]).mintPack(0, "", "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 5, { value: ethers.utils.parseEther('0.05') })).wait();
      await (await composeArt.connect(accounts[3]).mintPack(0, "", "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 5, { value: ethers.utils.parseEther('0.05') })).wait();
      await (await composeArt.connect(accounts[4]).mintPack(0, "", "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 5, { value: ethers.utils.parseEther('0.05') })).wait();
      await expect(composeArt.connect(accounts[5]).mintPack(0, "", "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 6, { value: ethers.utils.parseEther('0.06') })).to.be.revertedWith(
        "Not enough packs remaining"
      );
      await (await composeArt.connect(accounts[5]).mintPack(0, "", "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 5, { value: ethers.utils.parseEther('0.05') })).wait();
      await expect(composeArt.connect(accounts[6]).mintPack(0, "", "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 2, { value: ethers.utils.parseEther('0.02') })).to.be.revertedWith(
        "Sale not active"
      );
    })
  });

});