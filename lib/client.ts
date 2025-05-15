'use client';

import { createPublicClient, http, parseEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/lib/contract';

// Crear un cliente público para interactuar con la blockchain
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
