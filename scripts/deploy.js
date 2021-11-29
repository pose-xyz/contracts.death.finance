async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const VerifySignature = await ethers.getContractFactory("VerifySignature");
  const verifySignature = await VerifySignature.deploy();

  console.log("VerifySignature address:", verifySignature.address);

  const ComposeArt = await ethers.getContractFactory("ComposeArt");
  const composeArt = await ComposeArt.deploy("ComposeArt", "COMP", "0x0000000000000000000000000000000000000000", verifySignature.address);
  console.log("ComposeArt address:", composeArt.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });