export * from "./bytes64";

/**
 * @title Peer
 * @notice Represents a peer in the Equito network, including the chain and the peer's address.
 * @dev Used for identifying and interacting with peers across different blockchain networks.
 */
export interface Peer {
  /**
   * @notice The ID of the blockchain network the peer is on.
   */
  chain: string;

  /**
   * @notice The Ethereum address of the peer.
   */
  address: string;
}
