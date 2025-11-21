// frontend/src/wagmi-config.js
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Anvil local chain
export const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  testnet: true,
});

// Configure wagmi with RainbowKit
export const config = getDefaultConfig({
  appName: 'Ticket NFT System',
  projectId: '2ace89a7cea9fd759b5f4bf9271a7953', // Get from https://cloud.walletconnect.com
  chains: [anvilChain],
  ssr: false, // If using Next.js, set to true
});