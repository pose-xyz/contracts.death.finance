async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const VerifySignature = await ethers.getContractFactory("VerifySignature");
  const verifySignature = await VerifySignature.deploy();
  console.log("VerifySignature deployed to:", verifySignature.address);

  // const ComposeArt = await ethers.getContractFactory("ComposeArt");
  // const composeArt = await ComposeArt.deploy("ComposeArt", "COMP", "0x0000000000000000000000000000000000000000", verifySignature.address);
  // console.log("ComposeArt deployed to:", composeArt.address);

  const FightClub = await ethers.getContractFactory("FightClub");
  const fightClub = await FightClub.deploy(
    "193660831688735064581587655956512620320321525841920",
    deployer.address,
    verifySignature.address,
    "0xB3B3886F389F27BC1F2A41F0ADD45A84453F0D2A877FCD1225F13CD95953A86A"
  );
  console.log("FightClub deployed to:", fightClub.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });