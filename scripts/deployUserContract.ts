import hre from "hardhat";
import { ethers } from "hardhat";
import UserContract from "../ignition/modules/UserContract";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import getRouter from "../config";
import { Peer } from "../utils";

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Deploys the user contract specified in the .env file as `CONTRACT_NAME` and stores
 * the user contract address in the equito.json config file after deployment.
 */
async function main() {
  // Read router address from the equito.json file
  const configPath = path.join(__dirname, "../config/equito.json");
  const rawData = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(rawData);

  // Fetch router address from the equito network
  const routerAddress = await getRouter(hre.network.name);

  if (!routerAddress) {
    throw new Error(`Invalid chain: ${hre.network.name}.`);
  } else if (!ethers.isAddress(routerAddress)) {
    throw new Error(
      `Invalid Equito Router Address: ${routerAddress} for chain: ${hre.network.name}. Contact support!`,
    );
  }

  // Read contract name from .env file
  const contractName = process.env.CONTRACT_NAME;
  if (!contractName) {
    throw new Error("Please set CONTRACT_NAME in your .env file");
  }
  console.log(`deploying contract : ${contractName}`);
  // Deploy the contract using the generic Ignition module
  const { contract } = await hre.ignition.deploy(UserContract, {
    parameters: {
      UserContract: {
        routerAddress: routerAddress,
      },
    },
  });

  const contractAddress = await contract.getAddress();
  console.log(`${contractName} deployed to: ${contractAddress}`);

  const chain = hre.network.name;
  if (!chain) {
    throw new Error(`Failed to fetch chain name !`);
  } else {
    console.log(`Connected to chain: ${chain}`);
  }
  // New peer to be added
  const newPeer: Peer = {
    chain: hre.network.name,
    address: contractAddress,
  };

  // Check if the new peer already exists at current chain
  const existingPeerIndex = config.peers.findIndex(
    (peer: Peer) => peer.chain === newPeer.chain,
  );

  if (existingPeerIndex === -1) {
    // If the peer does not exist, add the new peer
    config.peers.push(newPeer);
    // Write the updated configuration back to the file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(
      `Added new peer: ${JSON.stringify(newPeer)} into the config ${configPath}`,
    );
  } else {
    const existingPeer = config.peers[existingPeerIndex];
    if (existingPeer.address !== newPeer.address) {
      // If the address does not match, update the address
      config.peers[existingPeerIndex] = newPeer;
      console.log(
        `Updated peer at chain ${newPeer.chain} with new address: ${newPeer.address}`,
      );
    } else {
      console.log(`Peer at chain ${newPeer.chain} already exists.`);
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
