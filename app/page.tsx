'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectWallet, Wallet, WalletDropdown, WalletDropdownDisconnect, WalletDropdownBasename } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Badge, Address } from '@coinbase/onchainkit/identity';
import JobListingComponent from '@/components/JobListing';
import JobCreateForm from '@/components/JobCreateForm';
import UserDashboard from '@/components/UserDashboard';
import AdminPanel from '@/components/AdminPanel';
import { Toaster } from '@/components/ui/toaster';
import { useAccount } from 'wagmi';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function App() {
  const { isConnected } = useAccount();
  const [connected, setConnected] = useState(false);

  // Update connected state when account connection changes
  useEffect(() => {
    setConnected(isConnected);
  }, [isConnected]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">BaseLance</h1>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="wallet-container">
              <Wallet>
                <ConnectWallet>
                  <Avatar className="h-6 w-6" />
                  <Name />
                </ConnectWallet>
                <WalletDropdown>
                  <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                    <Avatar />
                    {/* Simplified structure to avoid tag issues */}
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
        {!connected ? (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-6">
            <div className="max-w-lg text-center">
              <h2 className="text-3xl font-bold mb-4">Freelance Onchain</h2>
              <p className="mb-6 text-muted-foreground">
                Connect your wallet to access the decentralized marketplace for freelancers and clients.
                Find work, hire talent, and manage projects with the security of blockchain technology.
              </p>
              <Wallet>
                <ConnectWallet className="mx-auto" />
              </Wallet>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="explore" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="explore">Explore Jobs</TabsTrigger>
              <TabsTrigger value="create">Post a Job</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
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

            <TabsContent value="admin">
              <AdminPanel />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 BaseLance - Freelance Marketplace on Base Network</p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
