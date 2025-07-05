"use client";

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useFundWallet } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { mainnet } from 'viem/chains';

interface CreatedWallet {
  id: string;
  address: string;
  chainType: string;
  walletIndex?: number;
}

export default function Home() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  // We're not using wallets from useWallets() yet, but keeping the hook for future use
  const { } = useWallets();
  const { fundWallet } = useFundWallet();
  const [balance, setBalance] = useState<string | null>(null);
  // publicKey is set but not displayed in UI per user preference for clean interface
  const [, setPublicKey] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [createdWallets, setCreatedWallets] = useState<CreatedWallet[]>([]);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isFundingWallet, setIsFundingWallet] = useState(false);

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

  // Fetch user wallets when component loads
  useEffect(() => {
    const fetchUserWallets = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`/api/wallets?ownerId=${user.id}`);
        const data = await response.json();
        if (data.success && data.wallets) {
          const formattedWallets = data.wallets.map((wallet: {
            id: string;
            address: string;
            chainType: string;
            walletIndex?: number;
          }) => ({
            id: wallet.id,
            address: wallet.address,
            chainType: wallet.chainType,
            walletIndex: wallet.walletIndex
          }));
          setCreatedWallets(formattedWallets);
        }
      } catch (error) {
        console.error('Error fetching wallets:', error);
      }
    };

    if (authenticated && user?.id) {
      fetchUserWallets();
    }
  }, [authenticated, user]);

  useEffect(() => {
    console.log('Effect triggered. Auth status:', authenticated, 'Has private key:', !!user?.customMetadata?.privateKey);
    
    if (!authenticated || !user?.customMetadata?.privateKey) {
      console.log('Skipping balance fetch - not authenticated or no private key');
      return;
    }

    console.log('Conditions met, fetching balances...');
    const fetchBalances = async () => {
      const privateKey = user?.customMetadata?.privateKey;
      console.log('Checking private key availability:', !!privateKey);
      
      if (!privateKey) {
        console.log('Private key not yet available');
        return;
      }

      if (typeof privateKey === 'string') {
        try {
          console.log('Initializing provider and wallet...');
          const provider = new ethers.JsonRpcProvider('https://mainnet.evm.nodes.onflow.org');
          const wallet = new ethers.Wallet(privateKey, provider);
          
          // Get public key from private key using SigningKey
          const signingKey = new ethers.SigningKey(privateKey);
          const publicKey = signingKey.publicKey;
          console.log('Public Key:', publicKey);
          setPublicKey(publicKey);
          
          console.log('Wallet address:', wallet.address);
          setWalletAddress(wallet.address);

          // USDf token contract ABI (minimal for balanceOf)
          const tokenAbi = [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)"
          ];
          
          // Get balance of USDf token
          const contractAddress = '0x2aaBea2058b5aC2D339b163C6Ab6f2b6d53aabED';
          const tokenContract = new ethers.Contract(contractAddress, tokenAbi, provider);
          
          console.log('Checking balance for address:', wallet.address);
          const decimals = await tokenContract.decimals();
          console.log('Token decimals:', decimals);
          
          const balanceWei = await tokenContract.balanceOf(wallet.address);
          console.log('Token Balance in Wei:', balanceWei.toString());
          const balanceFormatted = ethers.formatUnits(balanceWei, decimals);
          console.log('Token Balance in USDf:', balanceFormatted);
          setBalance(balanceFormatted);

          // Get pool balance
          const poolContractAddress = '0xe43fe00AEA059f3A756CF556655B5A27FAf9bEC5';
          const poolContract = new ethers.Contract(poolContractAddress, tokenAbi, provider);
          const poolBalanceWei = await poolContract.balanceOf(wallet.address);
          console.log('Pool Balance in Wei:', poolBalanceWei.toString());
          const poolBalanceFormatted = ethers.formatUnits(poolBalanceWei, decimals);
          console.log('Pool Balance in USDf:', poolBalanceFormatted);
          setPoolBalance(poolBalanceFormatted);

        } catch (error) {
          console.error('Error fetching balances:', error);
          setBalance('Error');
          setPublicKey(null);
          setWalletAddress(null);
          setPoolBalance('Error');
        }
      }
    };

    fetchBalances();
  }, [authenticated, user]);

  console.log(user);

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
                  {balance ? (
                    <>
                      {balance === 'Error' ? 'Error fetching balance' : (
                        <>
                          {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          <span className="text-black/30"> USDf</span>
                        </>
                      )}
                    </>
                  ) : (
                    'Loading...'
                  )}
                </h1>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xl">Your Pool Balance</p>
                <h1 className="text-7xl font-bold">
                  {poolBalance ? (
                    <>
                      {poolBalance === 'Error' ? 'Error fetching pool balance' : (
                        <>
                          {parseFloat(poolBalance).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          <span className="text-black/30"> USDf</span>
                        </>
                      )}
                    </>
                  ) : (
                    'Loading...'
                  )}
                </h1>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xl">Your Wallet Address</p>
                {walletAddress ? (
                  <a 
                    href={`https://evm-testnet.flowscan.io/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono break-all text-blue-600 hover:text-blue-800 underline"
                  >
                    {walletAddress}
                  </a>
                ) : (
                  <p className="font-mono break-all text-black">Loading...</p>
                )}
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
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setIsFundingWallet(true);
                          fundWallet(createdWallets[createdWallets.length - 1].address, {
                            chain: mainnet,
                            amount: '0.01' // Default amount in ETH
                          })
                            .then(() => {
                              setIsFundingWallet(false);
                              console.log('Funding complete');
                            })
                            .catch((error: Error) => {
                              setIsFundingWallet(false);
                              console.error('Funding error:', error);
                            });
                        }}
                        disabled={isFundingWallet}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-400 mt-2"
                      >
                        {isFundingWallet ? 'Funding Wallet...' : 'Fund Wallet'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xl">Your Private Key</p>
                <p className="font-mono break-all text-black">{user?.customMetadata?.privateKey}</p>
              </div>
              <p className="text-xl">Your Public Key</p>
              <p className="font-mono break-all text-black">{publicKey}</p>
              <div className="mt-4">
                <a
                  href="/deposit"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Deposit USDF
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
