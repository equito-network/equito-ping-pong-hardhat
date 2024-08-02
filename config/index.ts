import * as fs from "fs";
import * as path from "path";
import { EquitoClient } from "@equito-sdk/client";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, "../.env") });

// Path to the chain-selectors.json file
const chainSelectorsPath = path.join(__dirname, "chainSelector.json");

// Ensure EQUITO_RPC_URL is defined in the .env file
const wsProvider = process.env.EQUITO_RPC_URL;
if (!wsProvider) {
  throw new Error("Please set EQUITO_RPC_URL in your .env file");
}

// Read and parse the chain-selectors.json file
const chainSelectors = JSON.parse(
  fs.readFileSync(chainSelectorsPath, "utf-8"),
) as Record<string, string[]>;

// Function to get the chain selector value for a given chain name
export function chainSelector(name: string): number {
  const lowerCaseName = name.toLowerCase();

  for (const [selector, names] of Object.entries(chainSelectors)) {
    if (names.includes(lowerCaseName)) {
      return Number(selector);
    }
  }

  throw new Error(`Invalid or un-supported Chain Name: ${name}`);
}

// Function to get the router address for a given chain name
async function getRouter(name: string): Promise<string> {
  const client = await EquitoClient.create({
    wsProvider: wsProvider as string,
    archiveWsProvider: wsProvider as string,
  });

  try {
    const router = client.getRouter(chainSelector(name));
    return router;
  } catch (error) {
    throw new Error(`Could not fetch router for: ${name}. Caused by: ${error}`);
  }
}

export default getRouter;
