'use client';

import { createPublicClient, http, fallback } from 'viem';
import { baseSepolia, base } from 'viem/chains';

// Determine which chain to use based on environment variable
const isMainnet = process.env.NEXT_PUBLIC_CHAIN_ID === 'mainnet';
const chain = isMainnet ? base : baseSepolia;

// Create an array of transports with fallbacks
const transports = isMainnet
  ? [
    // Primary RPC
    http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
    // Fallback RPCs
    http('https://1rpc.io/base'),
    http('https://base-mainnet.public.blastapi.io'),
    http('https://base.llamarpc.com'),
    http('https://mainnet.base.org'),
  ]
  : [
    http('https://sepolia.base.org'),
    http(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`),
  ];

// Create public client with fallback mechanism
export const publicClient = createPublicClient({
  chain,
  transport: fallback(transports),
});
