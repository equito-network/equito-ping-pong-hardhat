import { ethers } from "hardhat";

/**
 * @title Bytes64Struct
 * @notice Represents a structure containing two 32-byte address strings.
 * @dev Used to store 64-byte long values for the sender and receiver addresses in the EquitoMessage struct.
 */
export class Bytes64Struct {
  lower: string;
  upper: string;

  constructor(lower: string, upper: string) {
    this.lower = lower;
    this.upper = upper;
  }

  /**
   * @notice Converts an Ethereum address to a Bytes64Struct, containing a padded lower part
   * and a zeroed upper part.
   * @dev Ensures the address is padded to 32 bytes and sets the upper 32 bytes to zero.
   * 
   * @param {string} addr - The Ethereum address to convert.
   * @returns {Bytes64Struct} An object with `lower` containing the padded address
   *                          and `upper` set to zero hash.
   */
  static fromEvmAddress(addr: string): Bytes64Struct {
    return new Bytes64Struct(
      ethers.zeroPadValue(ethers.getAddress(addr), 32),
      ethers.ZeroHash
    );
  }

  /**
   * @notice Converts the Bytes64Struct back to an Ethereum address.
   * @dev Extracts the lower 20 bytes from the `lower` field to obtain the original Ethereum address.
   * 
   * @returns {string} The Ethereum address represented by this Bytes64Struct.
   */
  toEvmAddress(): string {
    // Extract the last 20 bytes (40 hex characters) from the lower 32-byte hex string
    const addressBytes = this.lower.slice(-40);
    return ethers.getAddress("0x" + addressBytes);
  }
}

// Test cases
function runTests() {
  const testAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const bytes64Address = Bytes64Struct.fromEvmAddress(testAddress);

  console.log("Bytes64Struct:", bytes64Address);

  // Check conversion to Bytes64Struct
  console.assert(
    bytes64Address.lower === ethers.zeroPadValue(testAddress, 32),
    "fromEvmAddress failed to correctly pad the lower part"
  );
  console.assert(
    bytes64Address.upper === ethers.ZeroHash,
    "fromEvmAddress failed to correctly set the upper part to zero hash"
  );

  // Check conversion back to EVM address
  const evmAddress = bytes64Address.toEvmAddress();
  console.assert(
    evmAddress === ethers.getAddress(testAddress),
    `toEvmAddress failed to return the correct Ethereum address. Got ${evmAddress}`
  );

  console.log("All tests passed.");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
