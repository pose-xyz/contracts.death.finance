require('dotenv').config()
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.4",
  settings: {
    optimizer: {enabled: process.env.DEBUG ? false : true},
  },
  gasReporter: {
    enabled: (process.env.REPORT_GAS) ? true : false
  },
  networks: {
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      chainId: 42,
      accounts: [
        `${process.env.DEPLOYER_PRIVATE_KEY}`, 
        `${process.env.CLIENT_PRIVATE_KEY}`
      ],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      chainId: 5,
      accounts: [
        `${process.env.DEPLOYER_PRIVATE_KEY}`, 
        `${process.env.CLIENT_PRIVATE_KEY}`
      ],
    }
  }
};
