"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useFundWallet } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { base } from 'viem/chains';
import Link from 'next/link';

interface CreatedWallet {
  id: string;
  address: string;
  chainType: string;
  walletIndex?: number;
}

export default function App() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { fundWallet } = useFundWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [createdWallets, setCreatedWallets] = useState<CreatedWallet[]>([]);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [poolBalance, setPoolBalance] = useState<string | null>(null);

  const createWallet = async () => {
    if (!user?.id) return;
    
    setIsCreatingWallet(true);
    try {
      const response = await fetch(`/api/hello?ownerId=${user.id}`);
      const data = await response.json();
      if (data.success && data.wallet) {
        setCreatedWallets((prev: CreatedWallet[]) => [...prev, data.wallet]);
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
          const formattedWallets = data.wallets.map((wallet: { id: string; address: string; chainType: string; walletIndex?: number }) => ({
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
          const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
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
          
          // Get balance of USDC token on Base
          const usdcContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
          const tokenContract = new ethers.Contract(usdcContractAddress, tokenAbi, provider);
          
          console.log('Checking balance for address:', wallet.address);
          const decimals = await tokenContract.decimals();
          console.log('Token decimals:', decimals);
          
          const balanceWei = await tokenContract.balanceOf(wallet.address);
          console.log('Token Balance in Wei:', balanceWei.toString());
          const balanceFormatted = ethers.formatUnits(balanceWei, decimals);
          console.log('Token Balance in USDC:', balanceFormatted);
          setBalance(balanceFormatted);

          // Get EURC balance
          const eurcContractAddress = '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c';
          const poolContract = new ethers.Contract(eurcContractAddress, tokenAbi, provider);
          const poolBalanceWei = await poolContract.balanceOf(wallet.address);
          console.log('EURC Balance in Wei:', poolBalanceWei.toString());
          const poolBalanceFormatted = ethers.formatUnits(poolBalanceWei, decimals);
          console.log('EURC Balance:', poolBalanceFormatted);
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

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen h-full bg-gray-50">
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <Link href="/" className="font-bold text-xl text-blue-600 hover:text-blue-700">LoggerHead</Link>
          <button 
            className="font-bold text-xl px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" 
            onClick={authenticated ? logout : login}
          >
            {authenticated ? 'Disconnect' : 'Connect Wallet'}
          </button>
        </div>
      </nav>
      
      <main className="pt-20">
        {!authenticated && (
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="max-w-2xl w-full px-4">
              <div className="flex flex-col gap-2 text-center">
                <h2 className="text-2xl font-bold mb-4">Welcome to LoggerHead</h2>
                <p className="text-xl text-gray-600 mb-8">Please connect your wallet to continue</p>
                <button
                  onClick={login}
                  className="mx-auto px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        )}
        
        {authenticated && (
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Your Balance</h2>
                <p className="text-sm text-gray-500 mb-2">User ID: {user?.id}</p>
                <div className="text-4xl font-bold text-blue-600">
                  {balance ? (
                    <>
                      {balance === 'Error' ? 'Error fetching balance' : (
                        <>
                          {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          <span className="text-blue-400"> USDf</span>
                        </>
                      )}
                    </>
                  ) : (
                    'Loading...'
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Pool Balance</h2>
                <div className="text-4xl font-bold text-blue-600">
                  {poolBalance ? (
                    <>
                      {poolBalance === 'Error' ? 'Error fetching pool balance' : (
                        <>
                          {parseFloat(poolBalance).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          <span className="text-blue-400"> USDf</span>
                        </>
                      )}
                    </>
                  ) : (
                    'Loading...'
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Wallet Information</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Wallet Address</p>
                    {walletAddress ? (
                      <a 
                        href={`https://basescan.org/address/${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {walletAddress}
                      </a>
                    ) : (
                      <p className="font-mono text-gray-400">Loading...</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Public Key</p>
                    <p className="font-mono break-all">{publicKey || 'Loading...'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Created Wallets</h2>
                {createdWallets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No wallets created yet</p>
                    <button
                      onClick={createWallet}
                      disabled={isCreatingWallet}
                      className="px-6 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                    >
                      {isCreatingWallet ? 'Creating Wallet...' : 'Create New Wallet'}
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-2">
                      <p className="font-mono">Address: {createdWallets[createdWallets.length - 1].address}</p>
                      <p>Type: {createdWallets[createdWallets.length - 1].chainType}</p>
                      <p>Index: {createdWallets[createdWallets.length - 1].walletIndex ?? 'N/A'}</p>
                      <p>ID: {createdWallets[createdWallets.length - 1].id}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsFundingWallet(true);
                        fundWallet(createdWallets[createdWallets.length - 1].address, {
                          chain: base,
                          amount: '0.01'
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
                      className="mt-4 px-6 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 disabled:bg-green-400 transition-colors"
                    >
                      {isFundingWallet ? 'Funding Wallet...' : 'Fund Wallet'}
                    </button>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 text-center">
                <Link
                  href="/deposit"
                  className="inline-block px-8 py-4 bg-blue-600 text-white rounded-full font-semibold text-lg hover:bg-blue-700 transition-colors"
                >
                  Deposit USDC
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 