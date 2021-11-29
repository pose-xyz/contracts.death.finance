const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ComposeArt", () => {

  let network;
  let accounts;
  let verifySignature;
  let composeArt;

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

    const ComposeArt = await ethers.getContractFactory("ComposeArt");
    if (network.name == 'kovan')
      composeArt = await ComposeArt.attach("0x576D9ce81405a147f6BCfEB121919CdfA83E5Df4");
    else if (network.name == 'goerli')
      composeArt = await ComposeArt.attach("0x576D9ce81405a147f6BCfEB121919CdfA83E5Df4");
    else
      composeArt = await ComposeArt.deploy(
        "ComposeArt", 
        "COMP", 
        "0x0000000000000000000000000000000000000000",
        verifySignature.address);
        
  });

  describe("release", async () => {

    it("createBase", async () => {

      if (network.name != 'kovan' && network.name != 'goerli') {
        await (await composeArt.connect(accounts[0]).setCuts(5, 100)).wait();
        
        expect(await composeArt.baseCount()).to.equal(0);
        await (await composeArt.connect(accounts[1]).createBase({ value: ethers.utils.parseEther('0.01') })).wait();
        expect(await composeArt.baseCount()).to.equal(1);

        let currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());

        expect(await composeArt.releaseCount()).to.equal(0);
        await (await composeArt.connect(accounts[1]).createRelease(0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", 20, 6, ethers.utils.parseEther('0.01'), 5, currentBlock.timestamp + 5, currentBlock.timestamp + 60, false)).wait();
        expect(await composeArt.releaseCount()).to.equal(1);
        
        await expect(composeArt.connect(accounts[2]).mintPack(accounts[2].address, 0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 2)).to.be.revertedWith(
          "Sale not started"
        );
        
        for (let i = 0; i < 5; i++) {
          await ethers.provider.send('evm_mine');
        }

        await expect(composeArt.connect(accounts[2]).mintPack(accounts[2].address, 0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 2, { value: ethers.utils.parseEther('0.01') })).to.be.revertedWith(
          "Not enough ETH sent"
        );

        await expect(composeArt.connect(accounts[2]).mintPack(accounts[3].address, 0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 8, { value: ethers.utils.parseEther('0.08') })).to.be.revertedWith(
          "Max pack purchase exceeded"
        );
        
        let currentTokenId;

        tx = await composeArt.connect(accounts[2]).mintPack(accounts[2].address, 0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 5, { value: ethers.utils.parseEther('0.05') });
        receipt = await tx.wait();
        data = (await ethers.provider.getTransaction(tx.hash)).data;
        receoveredInputs = ethers.utils.defaultAbiCoder.decode(
          [ 'uint32', 'string', 'bytes32', 'address', 'uint16' ],
          ethers.utils.hexDataSlice(data, 4)
        );
        // console.log(recoveredInputs);

        currentTokenId = ethers.utils.formatEther(await composeArt.currentTokenId()) * 1000000000000000000;
        expect(currentTokenId).to.equal(25);
        await (await composeArt.connect(accounts[3]).mintPack(accounts[3].address, 0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 5, { value: ethers.utils.parseEther('0.05') })).wait();
        await (await composeArt.connect(accounts[4]).mintPack(accounts[4].address, 0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 5, { value: ethers.utils.parseEther('0.05') })).wait();
        await expect(composeArt.connect(accounts[5]).mintPack(accounts[5].address, 0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 6, { value: ethers.utils.parseEther('0.06') })).to.be.revertedWith(
          "Not enough packs remaining"
        );
        await (await composeArt.connect(accounts[5]).mintPack(accounts[5].address, 0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 5, { value: ethers.utils.parseEther('0.05') })).wait();
        await expect(composeArt.connect(accounts[6]).mintPack(accounts[6].address, 0, "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A", "0x0000000000000000000000000000000000000000", 2, { value: ethers.utils.parseEther('0.02') })).to.be.revertedWith(
          "Sale not active"
        );
        currentTokenId = ethers.utils.formatEther(await composeArt.currentTokenId()) * 1000000000000000000;
        expect(currentTokenId).to.equal(100);
      }
    })
  });

});