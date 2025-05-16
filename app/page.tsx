'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect, WalletDropdownBasename } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import JobListingComponent from '@/components/JobListing';
import JobCreateForm from '@/components/JobCreateForm';
import UserDashboard from '@/components/UserDashboard';
import AdminPanel from '@/components/AdminPanel';
import { Toaster } from '@/components/ui/toaster';
import { useAccount } from 'wagmi';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NetworkIndicator } from '@/components/ui/network-indicator';
import { NetworkCheck } from '@/components/ui/network-check';
import { useContractRead } from '@/hooks/useContract';
export default function App() {
  const { isConnected } = useAccount();
  const { isContractOwner } = useContractRead();
  const [connected, setConnected] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loadingOwner, setLoadingOwner] = useState(true);

  // Update connected state when account connection changes
  useEffect(() => {
    const checkOwner = async () => {
      if (!isConnected) {
        setIsOwner(false);
        setLoadingOwner(false);
        return;
      }

      try {
        setLoadingOwner(true);
        const owner = await isContractOwner();
        setIsOwner(owner);

        setLoadingOwner(false);
      } catch (error) {
        console.error('Error checking owner:', error);
        setIsOwner(false);
        setLoadingOwner(false);
      }
    };

    checkOwner();
    setConnected(isConnected);
  }, [isConnected]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Unlocked.</h1>
          <div className="flex items-center gap-4">
            <NetworkIndicator />
            <ThemeToggle />
            <div className="wallet-container">
              <Wallet>
                <ConnectWallet>
                  <Avatar className="h-6 w-6" />
                  <Name className="hidden md:block" />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    <Name />
                    <Address />
                  </Identity>
                  <WalletDropdownBasename />
                  <WalletDropdownDisconnect />
                </WalletDropdown>
              </Wallet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">
        <NetworkCheck />
        {!connected ? (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
            <div className="max-w-lg text-center">
              <h2 className="text-3xl font-bold mb-4">Freelance Onchain</h2>
              <p className="mb-6 text-muted-foreground">
                Connect your wallet to access the decentralized marketplace for freelancers and clients.
                Find work, hire talent, and manage projects with the security of blockchain technology.
              </p>
            </div>
            <Wallet>
              <ConnectWallet className="mx-auto" />
            </Wallet>
          </div>
        ) : (
          <Tabs defaultValue="explore" className="w-full">
            <TabsList className={`grid mb-8 ${isOwner ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="explore">Explore Jobs</TabsTrigger>
              <TabsTrigger value="create">Post a Job</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              {isOwner && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value="explore" className="space-y-4">
              <JobListingComponent />
            </TabsContent>

            <TabsContent value="create">
              <JobCreateForm />
            </TabsContent>

            <TabsContent value="dashboard">
              <UserDashboard />
            </TabsContent>
            {/* {isOwner && ( */}
            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
            {/* )} */}
          </Tabs>
        )}
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Unlocked. - Freelance Marketplace on Base Network</p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
