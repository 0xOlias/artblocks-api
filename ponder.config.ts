import type { PonderConfig } from "@ponder/core";
import { graphqlPlugin } from "@ponder/graphql";

export const config: PonderConfig = {
  plugins: [graphqlPlugin()],
  networks: [
    { name: "mainnet", chainId: 1, rpcUrl: process.env.PONDER_RPC_URL_1 },
  ],
  contracts: [
    {
      name: "GenArt721CoreV1",
      network: "mainnet",
      abi: "./abis/GenArt721CoreV1.json",
      address: "0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270",
      isIndexed: false,
    },
    {
      name: "GenArt721CoreV3",
      network: "mainnet",
      abi: "./abis/GenArt721CoreV3.json",
      address: "0x99a9B7c1116f9ceEB1652de04d5969CcE509B069",
      startBlock: 15726706,
      blockLimit: 1000,
    },
  ],
};
