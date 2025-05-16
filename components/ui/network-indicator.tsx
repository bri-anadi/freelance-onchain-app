'use client';

import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { Badge } from '@/components/ui/badge';
import { baseSepolia, base } from 'viem/chains';

export function NetworkIndicator() {
  const chainId = useChainId();
  const [networkName, setNetworkName] = useState<string>('Unknown');
  const [isTestnet, setIsTestnet] = useState<boolean>(false);

  useEffect(() => {
    if (chainId === base.id) {
      setNetworkName('Base Mainnet');
      setIsTestnet(false);
    } else if (chainId === baseSepolia.id) {
      setNetworkName('Base Sepolia');
      setIsTestnet(true);
    } else {
      setNetworkName(`Unknown (${chainId})`);
      setIsTestnet(false);
    }
  }, [chainId]);

  // Lihat juga alamat kontrak yang digunakan
  useEffect(() => {
    const chainIdEnv = process.env.NEXT_PUBLIC_CHAIN_ID;
    console.log('Environment Chain ID setting:', chainIdEnv);
    console.log('Contract address used:', chainIdEnv === 'mainnet'
      ? '0xB2295D19D18011F0FEC919c7e2427cB024e91ef7'
      : '0x553af81FCd141bA428bc93b345B9E91A81D4641C');
  }, []);

  return (
    <Badge variant={isTestnet ? "secondary" : "default"}>
      {networkName}
    </Badge>
  );
}
