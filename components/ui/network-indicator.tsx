'use client';

import { useState, useEffect } from 'react';
import { useChainId } from 'wagmi';
import { Badge } from '@/components/ui/badge';
import { baseSepolia, base } from 'viem/chains';
import { CONTRACT_ADDRESS } from '@/lib/contract';

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
    console.log('Contract address used:', chainIdEnv === 'mainnet' ? CONTRACT_ADDRESS.mainnet : CONTRACT_ADDRESS.testnet);
  }, []);

  return (
    <Badge variant={isTestnet ? "secondary" : "default"}>
      {networkName}
    </Badge>
  );
}
