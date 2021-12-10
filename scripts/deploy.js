async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // const VerifySignature = await ethers.getContractFactory("VerifySignature");
  // const verifySignature = await VerifySignature.deploy();
  // console.log("VerifySignature deployed to:", verifySignature.address);

  // const ComposeArt = await ethers.getContractFactory("ComposeArt");
  // const composeArt = await ComposeArt.deploy("ComposeArt", "COMP", "0x0000000000000000000000000000000000000000", verifySignature.address);
  // console.log("ComposeArt deployed to:", composeArt.address);

  const FightClub = await ethers.getContractFactory("FightClub");
  const fightClub = await FightClub.deploy("193660831688735064581587655956512620320321525841920");
  console.log("FightClub deployed to:", fightClub.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });