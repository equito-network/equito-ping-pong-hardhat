import { ethers } from "hardhat";
import { expect } from "chai";
import { AbiCoder } from "ethers";
import { Bytes64Struct } from "../utils";
import { generateHash } from "@equito-sdk/ethers";

describe("PingPong Contract Tests", function () {
  let owner: any;
  let routerAddress: string;
  let routerAddressAtChain2: string;
  let equitoAddress: Bytes64Struct;
  let peer1: Bytes64Struct;
  let peer2: Bytes64Struct;
  let pingPongAddress: Bytes64Struct;
  let pingPongAtChain2: any;
  let pingPongAddressAtChain2: Bytes64Struct;
  let pingPong: any;
  let router: any;
  let routerAtChain2: any;
  let defaultAbiCoder: AbiCoder;
  let fees: any;
  let verifiers: any;
  const chain_selector_0 = 0;
  const chain_selector_1 = 1;
  const chain_selector_2 = 2;

  before(async function () {
    defaultAbiCoder = new ethers.AbiCoder();
    [owner] = await ethers.getSigners();
    equitoAddress = Bytes64Struct.fromEvmAddress(
      "0xD42086961E21BC9895E649CE421b8328655D962D",
    );
    peer1 = Bytes64Struct.fromEvmAddress(
      "0x7EdaC442D616D5D3cBe7F3d82D28569873541aCf",
    );
    peer2 = Bytes64Struct.fromEvmAddress(
      "0x9C57A42B6B9289a5306671B28cBC8C5fBC95Dcc3",
    );

    const Verifiers = await ethers.getContractFactory("MockVerifier");
    verifiers = await Verifiers.deploy();

    const Fees = await ethers.getContractFactory("MockEquitoFees");
    fees = await Fees.deploy();
    const Router = await ethers.getContractFactory("Router");
    router = await Router.deploy(
      chain_selector_0,
      verifiers,
      fees,
      equitoAddress,
    );
    routerAtChain2 = await Router.deploy(
      chain_selector_2,
      verifiers,
      fees,
      equitoAddress,
    );
    routerAddress = await router.getAddress();
    routerAddressAtChain2 = await routerAtChain2.getAddress();

    const PingPong = await ethers.getContractFactory("PingPong");
    pingPong = await PingPong.deploy(routerAddress);
    pingPongAddress = Bytes64Struct.fromEvmAddress(await pingPong.getAddress());

    pingPongAtChain2 = await PingPong.deploy(routerAddressAtChain2);
    pingPongAddressAtChain2 = Bytes64Struct.fromEvmAddress(
      await pingPongAtChain2.getAddress(),
    );

    await pingPong.setPeers(
      [0, 1, 2],
      [pingPongAddress, peer1, pingPongAddressAtChain2],
    );

    await pingPongAtChain2.setPeers(
      [0, 1, 2],
      [pingPongAddress, peer1, pingPongAddressAtChain2],
    );
  });

  it("Should send a ping", async function () {
    const ownChainSelector = chain_selector_0;
    const peerChainSelector = chain_selector_1;
    const pingMessage = "Ping!";
    const messageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["ping", pingMessage],
    );

    const blockNumber = await ethers.provider.getBlockNumber();
    const message = [
      blockNumber + 1, // blockNumber after the tx call
      ownChainSelector, // sourceChainSelector
      pingPongAddress, // sender
      peerChainSelector, // destinationChainSelector
      peer1, // receiver
      ethers.keccak256(messageData), // hashedData
    ];

    const fee = await router.getFee(owner);
    const feesBalanceBefore = await ethers.provider.getBalance(
      await fees.getAddress(),
    );
    await expect(
      pingPong.connect(owner).sendPing(peerChainSelector, pingMessage, {
        value: fee,
      }),
    )
      .to.emit(pingPong, "PingSent")
      .withArgs(peerChainSelector, generateHash(message));

    const feesBalanceAfter = await ethers.provider.getBalance(
      await fees.getAddress(),
    );
    expect(feesBalanceAfter - feesBalanceBefore).to.equal(fee);
  });

  it("Should revert on insufficient fee payment", async function () {
    const peerChainSelector = chain_selector_1;
    const pingMessage = "Ping!";

    const fee = await router.getFee(owner);
    // Subtracting a minimal amount to simulate insufficient fee
    const insufficientFee = fee - BigInt("1");
    await expect(
      pingPong.connect(owner).sendPing(peerChainSelector, pingMessage, {
        value: insufficientFee,
      }),
    ).to.be.revertedWithCustomError(fees, "InsufficientFee");
  });

  it("Should receive a pong from peer1", async function () {
    const ownChainSelector = chain_selector_0;
    const peerChainSelector = chain_selector_1;
    const pongMessage = "Pong!";
    const messageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["pong", pongMessage],
    );

    const blockNumber = await ethers.provider.getBlockNumber();
    const message = [
      blockNumber + 1, // blockNumber in next tx
      peerChainSelector, // sourceChainSelector
      peer1, // sender
      ownChainSelector, // destinationChainSelector
      pingPongAddress, // receiver
      ethers.keccak256(messageData), // hashedData
    ];
    // owner is to call the router, get the fee for account owner
    const fee = await router.getFee(owner);
    // Dummy verifier checks the len of the proof only
    const dummyProof = ethers.randomBytes(8);
    await expect(
      router
        .connect(owner)
        .deliverAndExecuteMessage(message, messageData, 0, dummyProof, {
          value: fee,
        }),
    )
      .to.emit(pingPong, "PongReceived")
      .withArgs(peerChainSelector, generateHash(message));
  });

  it("Should receive a ping", async function () {
    const ownChainSelector = chain_selector_0;
    const peerChainSelector = chain_selector_1;
    const pingMessage = "Ping!";
    const messageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["ping", pingMessage],
    );
    const blockNumber = await ethers.provider.getBlockNumber();
    const message = [
      blockNumber + 1, // blockNumber
      peerChainSelector, // sourceChainSelector
      peer1, // sender
      ownChainSelector, // destinationChainSelector
      pingPongAddress, // receiver
      ethers.keccak256(messageData), // hashedData
    ];
    // owner is to call the router, get the fee for account owner
    const fee = await router.getFee(owner);

    // Dummy verifier checks the len of the proof only
    const dummyProof = ethers.randomBytes(8);
    await expect(
      router
        .connect(owner)
        .deliverAndExecuteMessage(message, messageData, 0, dummyProof, {
          value: fee,
        }),
    )
      .to.emit(pingPong, "PingReceived")
      .withArgs(peerChainSelector, generateHash(message));
  });

  it("Receive a ping and send a pong", async function () {
    const pingMessage = "Ping from a peer at chain 1";
    const pingMessageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["ping", pingMessage],
    );

    const blockNumber = await ethers.provider.getBlockNumber();
    const message1 = [
      blockNumber + 1, // blockNumber after the tx call
      chain_selector_1, // sourceChainSelector
      peer1, // sender
      chain_selector_0, // destinationChainSelector
      pingPongAddress, // receiver
      ethers.keccak256(pingMessageData), // hashedData
    ];
    const fee = await router.getFee(owner);

    const pongMessage = pingMessage; // same payload is used in Pong
    const pongMessageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["pong", pongMessage],
    );

    const message2 = [
      blockNumber + 1, // blockNumber
      chain_selector_0, // sourceChainSelector
      pingPongAddress, // sender
      chain_selector_1, // destinationChainSelector
      peer1, // receiver
      ethers.keccak256(pongMessageData), // hashedData
    ];

    // Receive Ping then send a Pong
    const dummyProof = ethers.randomBytes(8);
    await expect(
      router
        .connect(owner)
        .deliverAndExecuteMessage(message1, pingMessageData, 0, dummyProof, {
          value: fee,
        }),
    )
      .to.emit(pingPong, "PingReceived")
      .withArgs(chain_selector_1, generateHash(message1))
      .to.emit(pingPong, "PongSent")
      .withArgs(chain_selector_1, generateHash(message2));
  });

  it("Should complete the ping-pong flow from self to self on same chain", async function () {
    const ownChainSelector = chain_selector_0;
    const pingMessage = "Ping from self to self";
    const pingMessageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["ping", pingMessage],
    );

    let blockNumber = await ethers.provider.getBlockNumber();
    const message1 = [
      blockNumber + 1, // blockNumber after the tx call
      ownChainSelector, // sourceChainSelector
      pingPongAddress, // sender
      ownChainSelector, // destinationChainSelector
      pingPongAddress, // receiver
      ethers.keccak256(pingMessageData), // hashedData
    ];
    const fee = await router.getFee(owner);
    await expect(
      pingPong.connect(owner).sendPing(ownChainSelector, pingMessage, {
        value: fee,
      }),
    )
      .to.emit(pingPong, "PingSent")
      .withArgs(ownChainSelector, generateHash(message1));

    // Dummy verifier checks the len of the proof only
    const dummyProof = ethers.randomBytes(8);
    await expect(
      router
        .connect(owner)
        .deliverAndExecuteMessage(message1, pingMessageData, 0, dummyProof, {
          value: fee,
        }),
    )
      .to.emit(pingPong, "PingReceived")
      .withArgs(ownChainSelector, generateHash(message1));

    const pongMessage = "Pong from self to self";
    const pongMessageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["pong", pongMessage],
    );
    blockNumber = await ethers.provider.getBlockNumber();
    const message2 = [
      blockNumber + 1, // blockNumber
      ownChainSelector, // sourceChainSelector
      pingPongAddress, // sender
      ownChainSelector, // destinationChainSelector
      pingPongAddress, // receiver
      ethers.keccak256(pongMessageData), // hashedData
    ];

    await expect(
      router
        .connect(owner)
        .deliverAndExecuteMessage(message2, pongMessageData, 0, dummyProof, {
          value: fee,
        }),
    )
      .to.emit(pingPong, "PongReceived")
      .withArgs(ownChainSelector, generateHash(message2));
  });

  it("Should complete the ping-pong flow from chain 0 to chain 2", async function () {
    const pingMessage = "Ping from chain 0 to peer at chain 2";
    const pingMessageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["ping", pingMessage],
    );

    let blockNumber = await ethers.provider.getBlockNumber();
    const message1 = [
      blockNumber + 1, // blockNumber after the tx call
      chain_selector_0, // sourceChainSelector
      pingPongAddress, // sender
      chain_selector_2, // destinationChainSelector
      pingPongAddressAtChain2, // receiver
      ethers.keccak256(pingMessageData), // hashedData
    ];
    const fee = await router.getFee(owner);
    await expect(
      pingPong.connect(owner).sendPing(chain_selector_2, pingMessage, {
        value: fee,
      }),
    )
      .to.emit(pingPong, "PingSent")
      .withArgs(chain_selector_2, generateHash(message1));

    // Receive Ping at chain 2
    const dummyProof = ethers.randomBytes(8);
    await expect(
      routerAtChain2
        .connect(owner)
        .deliverAndExecuteMessage(message1, pingMessageData, 0, dummyProof, {
          value: fee,
        }),
    )
      .to.emit(pingPongAtChain2, "PingReceived")
      .withArgs(chain_selector_0, generateHash(message1));

    const pongMessage = "Pong from chain 2 to chain 0";
    const pongMessageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["pong", pongMessage],
    );
    blockNumber = await ethers.provider.getBlockNumber();
    const message2 = [
      blockNumber + 1, // blockNumber
      chain_selector_2, // sourceChainSelector
      pingPongAddressAtChain2, // sender
      chain_selector_0, // destinationChainSelector
      pingPongAddress, // receiver
      ethers.keccak256(pongMessageData), // hashedData
    ];

    await expect(
      router
        .connect(owner)
        .deliverAndExecuteMessage(message2, pongMessageData, 0, dummyProof, {
          value: fee,
        }),
    )
      .to.emit(pingPong, "PongReceived")
      .withArgs(chain_selector_2, generateHash(message2));
  });

  it("Should revert on invalid message type", async function () {
    const invalidMessage = "Invalid";
    const messageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["invalid", invalidMessage],
    );

    const message = [
      1, // blockNumber
      1, // sourceChainSelector
      peer1, // sender
      0, // destinationChainSelector
      pingPongAddress, // receiver
      ethers.keccak256(messageData), // hashedData
    ];
    // owner is to call the router, get the fee for account owner
    const fee = await router.getFee(owner);

    // Dummy verifier checks the len of the proof only
    const dummyProof = ethers.randomBytes(8);
    await expect(
      router
        .connect(owner)
        .deliverAndExecuteMessage(message, messageData, 0, dummyProof, {
          value: fee,
        }),
    ).to.be.revertedWithCustomError(pingPong, "InvalidMessageType");
  });

  it("Should revert on wrong peer", async function () {
    const ownChainSelector = chain_selector_0;
    const peerChainSelector = chain_selector_1;
    const invalidMessage = "Invalid";
    const messageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["invalid", invalidMessage],
    );

    const message = [
      1, // blockNumber
      peerChainSelector, // sourceChainSelector
      peer2, // sender: peer 2 instead of peer1
      ownChainSelector, // destinationChainSelector
      pingPongAddress, // receiver
      ethers.keccak256(messageData), // hashedData
    ];
    // owner is to call the router, get the fee for account owner
    const fee = await router.getFee(owner);

    // Dummy verifier checks the len of the proof only
    const dummyProof = ethers.randomBytes(8);
    await expect(
      router
        .connect(owner)
        .deliverAndExecuteMessage(message, messageData, 0, dummyProof, {
          value: fee,
        }),
    ).to.be.revertedWithCustomError(pingPong, "InvalidMessageSender");
  });

  it("Should revert on invalid receiver", async function () {
    const ownChainSelector = chain_selector_0;
    const peerChainSelector = chain_selector_1;

    const invalidMessage = "Invalid";
    const messageData = defaultAbiCoder.encode(
      ["string", "string"],
      ["invalid", invalidMessage],
    );
    // Invalid peer address does not implement IEquitoReceiver
    const invalid_receiver_address = Bytes64Struct.fromEvmAddress(
      "0xDE8dd3C08e673c77e41C2D5f7F96Da2CD16216A5",
    );
    const message = [
      1, // blockNumber
      peerChainSelector, // sourceChainSelector
      peer1, // sender
      ownChainSelector, // destinationChainSelector
      invalid_receiver_address, // receiver
      ethers.keccak256(messageData), // hashedData
    ];
    // owner is to call the router, get the fee for account owner
    const fee = await router.getFee(owner);

    // Dummy verifier checks the len of the proof only
    const dummyProof = ethers.randomBytes(8);
    await expect(
      router
        .connect(owner)
        .deliverAndExecuteMessage(message, messageData, 0, dummyProof, {
          value: fee,
        }),
    ).to.be.revertedWithoutReason();
  });
});