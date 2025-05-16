'use client';

import { useState, useEffect } from 'react';
import { useChainId, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { baseSepolia, base } from 'viem/chains';

export function NetworkCheck() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

  // Sesuaikan ini dengan chain ID yang diinginkan
  const expectedEnv = process.env.NEXT_PUBLIC_CHAIN_ID;
  const targetChainId = expectedEnv === 'mainnet' ? base.id : baseSepolia.id;

  useEffect(() => {
    if (chainId && chainId !== targetChainId) {
      setIsCorrectNetwork(false);
    } else {
      setIsCorrectNetwork(true);
    }

    // Log info untuk debugging
    console.log('Current chain ID:', chainId);
    console.log('Expected chain ID:', targetChainId);
    console.log('NEXT_PUBLIC_CHAIN_ID:', expectedEnv);
  }, [chainId, targetChainId, expectedEnv]);

  if (isCorrectNetwork) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTitle>Jaringan Tidak Sesuai</AlertTitle>
      <AlertDescription>
        Anda terhubung ke jaringan dengan ID {chainId}.
        Harap beralih ke {expectedEnv === 'mainnet' ? 'Base Mainnet' : 'Base Sepolia'}.
      </AlertDescription>
      <Button
        className="mt-2"
        onClick={() => switchChain?.({ chainId: targetChainId })}
      >
        Switch Network
      </Button>
    </Alert>
  );
}
