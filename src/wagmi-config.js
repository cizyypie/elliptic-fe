import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const anvil = defineChain({
  id: 31337, 
  name: "Anvil Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
    },
  },
});

export const config = getDefaultConfig({
  appName: "Ellipticheck (Local Anvil)",
  projectId: "2ace89a7cea9fd759b5f4bf9271a7953", 
  chains: [anvil],
});
