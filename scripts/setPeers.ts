import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import hre from "hardhat";
import { Peer, Bytes64Struct } from "../utils";
import { chainSelector } from "../config";
// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Sets the peers specified in the config file, equito.json, at the contract address
 * specified as `user_contract_address` in the config file.
 */
async function main() {
  // Read configuration from the equito.json file
  const configPath = path.join(__dirname, "../config/equito.json");
  const rawData = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(rawData);
  // Retrieve peer address for the current chain ID
  const chain = hre.network.name;
  if (!chain) {
    throw new Error(`Failed to fetch chain name!`);
  } else {
    console.log(`Connected to chain: ${chain}`);
  }

  // Get the contract address for the chain
  const peer = config.peers.find((peer: Peer) => peer.chain === chain);
  if (!peer) {
    throw new Error(`No peer found for chain: ${chain}`);
  }

  if (!peer.address || !ethers.isAddress(peer.address)) {
    throw new Error(
      `Invalid peer address found in equito.json: ${peer.address}`,
    );
  } else {
    console.log(`Peer address at chain: ${chain} is ${peer.address}`);
  }

  // Get the contract name from the environment variable
  const contractName = process.env.CONTRACT_NAME;
  if (!contractName) {
    throw new Error("Please set CONTRACT_NAME in your .env file");
  }

  // Dynamically import the contract type
  const { [contractName]: ContractType } = await import(`../typechain`);

  // Get the deployed contract instance
  const ContractFactory = await ethers.getContractFactory(contractName);
  const contract = ContractFactory.attach(peer.address) as InstanceType<
    typeof ContractType
  >;

  // prepare chainIds and peers arguments for the contract call
  const chainSelectors = config.peers.map((peer: Peer) =>
    chainSelector(peer.chain),
  );
  const peerAddresses = config.peers.map((peer: Peer) => {
    if (!peer.address || !ethers.isAddress(peer.address)) {
      throw new Error(`Invalid peer address: ${peer.address}.`);
    }
    return Bytes64Struct.fromEvmAddress(peer.address);
  });

  console.log("setting peers:", config.peers);

  // Ensure the lengths of chainSelectors and peerAddresses match
  if (chainSelectors.length !== peerAddresses.length) {
    throw new Error(
      "The lengths of chainSelectors and peerAddresses do not match",
    );
  }
  // Call contract to set peers
  await contract.setPeers(chainSelectors, peerAddresses);

  console.log("Peers set successfully");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
