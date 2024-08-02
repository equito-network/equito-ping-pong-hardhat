# Equito Hardhat Template

Welcome to the Equito Hardhat Template! This project is pre-configured for Equito EVM smart contract development and deployment using Hardhat. It also includes contracts from the [equito-evm-contracts](https://github.com/equito-network/equito-evm-contracts) repository. If you're looking to use Hardhat as a framework to build and deploy your smart contracts, this template repository offers a robust foundation to get started quickly. Fork this template, create new files in the `contracts/` folder, and start building your smart contracts right away!

## Project structure

- **lib/**: Equito EVM Contracts and additional libraries or dependencies.
- **contracts/**: your Solidity smart contracts.
- **test/**: test scripts for your contracts.
- **scripts/**: scripts for deployments or interaction with your contracts.
- **ignition/**: utilities for deploying your contracts.
- **utils/**: utilities for your scripts or tests.

## Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en) (version 18.15.0 or higher)
- [npm](https://www.npmjs.com) (Node Package Manager)
- [Hardhat](https://hardhat.org) (globally or locally installed)
- [TypeScript](https://www.typescriptlang.org/) (globally or locally installed)


### Create a new repository

1. In the current repository, click the `Use this template` button.
2. In the dropdown list, choose `Create a new repository`.
3. Choose a new repository name, for example, `equito-ping-pong-hardhat`.
4. Click `Create repository from template`.

Now you have a new repository based on the Equito Hardhat Template, which you can pull to your local machine and start developing your smart contracts. 

### Install dependencies

Navigate to your project directory and install the dependencies:

```bash
npm install
```

Clone the Equito EVM contracts dependencies:

```bash
git submodule update --init --recursive
```

### Set environment variables

Create a `.env` file in the root directory and add the following variables:

```makefile
# Equito RPC
EQUITO_RPC_URL=wss://testnet.testequito.live

# Addresses: Addresses are case sensitive and use proper checksum encoded addresses.
# PRIVATE_KEY is used as the contract deployer key.
PRIVATE_KEY=<your_private_key>

# Specify your contract name
CONTRACT_NAME=<your_contract_name>
```

## Usage

This Hardhat project provides essential commands to streamline and enhance your development workflow. Write your contract inheriting `EquitoApp.sol` in the `contracts/` directory. The name of the contract should be the same as the name `CONTRACT_NAME` specified in the `.env` file.

### Compile contracts

Compile your smart contracts with the following command:

```bash
npm run hardhat:compile
```

### Run unit tests

This template includes a predefined command for running unit tests, even though it does not contain any unit tests by default.

To run the unit tests, use the following command:

```bash
npm run hardhat:test
```

### Generate TypeChain files

```bash
npm run hardhat:typechain
```

### Add a new network

To add a new network, you can add an entry in the `hardhat.config.ts` file, under the `networks` object. For example:

```typescript
const config: HardhatUserConfig = {
  networks: {
    // more networks ...
    bscTestnet: {
      chainId: 97,
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  }
  // more configurations ...
};
```

### Deploy contracts

The following command will deploy the contract with the router address corresponding to the chain, fetched from Equito.

```bash
npm run hardhat:deploy -- --network localhost
```

### Set peers

It is crucial to set the peers after deployment of your contract. Before running the command, make sure that the configuration file `equito.json` is updated with the correct networks and peer addresses. For example:

```json
{
  "peers": [
    {
      "name": "ethereum sepolia",
      "address": "0x<your-contract-address-here>"
    },
    {
      "name": "bsc testnet",
      "address": "0x<your-contract-address-here>"
    }
  ]
}
```

To set the peers of your Dapp deployed on different chains, run the following command: 

```bash
npm run hardhat:setpeers -- --network localhost
```
