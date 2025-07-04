"use client";

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

interface CreatedWallet {
  id: string;
  address: string;
  chainType: string;
  walletIndex?: number;
}

export default function Home() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [createdWallets, setCreatedWallets] = useState<CreatedWallet[]>([]);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [balance, setBalance] = useState("0.0000");

  // Get the latest wallet's address
  const latestWalletAddress = createdWallets.length > 0 ? createdWallets[createdWallets.length - 1].address : undefined;

  useEffect(() => {
    const fetchBalance = async () => {
      if (!latestWalletAddress) return;
      try {
        const response = await fetch(`/api/balance?address=${latestWalletAddress}`);
        const data = await response.json();
        if (data.success) {
          setBalance(data.balance);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    if (authenticated && latestWalletAddress) {
      fetchBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, latestWalletAddress]);

  const createWallet = async () => {
    if (!user?.id) return;
    
    setIsCreatingWallet(true);
    try {
      const response = await fetch(`/api/hello?ownerId=${user.id}`);
      const data = await response.json();
      if (data.success && data.wallet) {
        setCreatedWallets(prev => [...prev, data.wallet]);
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
    } finally {
      setIsCreatingWallet(false);
    }
  };

  useEffect(() => {
    const fetchCreatedWallets = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/wallets?ownerId=${user.id}`);
          const data = await response.json();
          if (data.success && data.wallets) {
            setCreatedWallets(data.wallets);
          }
        } catch (error) {
          console.error('Error fetching created wallets:', error);
        }
      }
    };

    if (authenticated && user?.id) {
      fetchCreatedWallets();
    }
  }, [authenticated, user?.id]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen h-full">
      <nav className="fixed top-0 left-0 right-0 bg-white">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <p className="font-bold text-xl">LoggerHead</p>
          <button 
            className="font-bold text-xl px-4 py-2 bg-black text-white rounded-md" 
            onClick={authenticated ? logout : login}
          >
            {authenticated ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>
      </nav>
      {!authenticated && (
        <div className="flex items-center justify-center h-[calc(100vh)]">
          <div className="max-w-2xl w-full px-4">
            <div className="flex flex-col gap-2">
              <p className="text-xl">Please connect to your account</p>
            </div>
          </div>
        </div>
      )}
      {authenticated && (
        <div className="flex items-center justify-center h-[calc(100vh)]">
          <div className="max-w-2xl w-full px-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-xl">Your Balance</p>
                <p>{user?.id}</p>
                <h1 className="text-7xl font-bold">
                  {balance}
                  <span className="text-black/30">ETH</span>
                </h1>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xl">Created Wallets</p>
                {createdWallets.length === 0 && (
                  <div className="flex flex-col gap-4">
                    <p className="text-gray-500">No wallets created yet</p>
                    <button
                      onClick={createWallet}
                      disabled={isCreatingWallet}
                      className="bg-black text-white px-4 py-2 rounded-md hover:bg-black/80 disabled:bg-black/50"
                    >
                      {isCreatingWallet ? 'Creating Wallet...' : 'Create New Wallet'}
                    </button>
                  </div>
                )}
                {createdWallets.length > 0 && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <p className="font-mono">Address: {createdWallets[createdWallets.length - 1].address}</p>
                    <p>Type: {createdWallets[createdWallets.length - 1].chainType}</p>
                    <p>Index: {createdWallets[createdWallets.length - 1].walletIndex ?? 'N/A'}</p>
                    <p>ID: {createdWallets[createdWallets.length - 1].id}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
