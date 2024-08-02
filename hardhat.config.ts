import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-foundry";
import "@nomicfoundation/hardhat-ethers";
import "hardhat-dependency-compiler";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },
  networks: {
    localhost: {
      url: `http://127.0.0.1:${process.env.RPC_PORT || "8545"}`,
    },
    hardhat: {
      chainId: 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  dependencyCompiler: {
    paths: [
      "lib/equito/src/ECDSAVerifier.sol",
      "lib/equito/src/Router.sol",
      "lib/equito/test/mock/MockOracle.sol",
      "lib/equito/test/mock/MockEquitoFees.sol",
      "lib/equito/test/mock/MockVerifier.sol",
    ],
  },
};

export default config;
