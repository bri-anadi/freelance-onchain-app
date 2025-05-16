'use client';

import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Crear un cliente público para interactuar con la blockchain
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});
