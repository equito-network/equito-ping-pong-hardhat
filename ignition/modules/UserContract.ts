import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const UserContract = buildModule("UserContract", (m) => {
  const router = m.getParameter("routerAddress");
  const contractName = process.env.CONTRACT_NAME;
  if (!contractName) {
    throw new Error("Please set CONTRACT_NAME in your .env file");
  }

  const contract = m.contract(contractName, [router]);

  return { contract };
});

export default UserContract;