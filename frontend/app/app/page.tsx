"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useFundWallet } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { mainnet } from 'viem/chains';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { ChartLineDefault } from '@/app/components/Chart';

export default function App() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { fundWallet } = useFundWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [poolBalance, setPoolBalance] = useState<string | null>(null);

  // Fetch balances when component loads
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
    <div className="w-screen min-h-screen h-full bg-white">
      <Navbar />
      
      <main className="pt-20 max-w-7xl mx-auto">

        <div className="flex gap-4">
          <div className="min-w-1/3 grow max-w-[calc(50%-1rem)]">
            <ChartLineDefault />
          </div>
          <div className="min-w-1/3 grow max-w-[calc(50%-1rem)]"> 
        <div className='flex flex-col gap-4 bg-zinc-50 border border-zinc-200 rounded-xl p-4'>
          <div className="flex items-center justify-center">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold text-center">Your Balance (total)</h2>
                <div className="text-6xl font-light text-black">
                  {balance ? (
                    <>
                      {balance === 'Error' ? 'Error fetching balance' : (
                        <>
                          {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                          <span className="text-black/50">$ USDf</span>
                        </>
                        )}
                      </>
                    ) : (
                      'Loading...'
                    )}
                  </div>
                </div>

                {/*<div className="mt-4">
                  <h2 className="font-semibold mb-4">Pool Balance (Yield)</h2>
                  <div className="text-xl font-bold text-blue-600">
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
                </div>*/}
              </div>

              <div className="flex gap-2 justify-center">

              <button
                    onClick={() => {
                      setIsFundingWallet(true);
                      fundWallet("0x5228062c16A5c023ae598F0326D5f806Aa6a9c8E", {
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
                    className="bg-black text-white px-6 py-3 rounded-md font-semibold"
                  >
                    {isFundingWallet ? 'Funding Wallet...' : 'Fund Wallet'}
                  </button>

                <Link
                  href="/deposit"
                  className="inline-block px-6 py-3 bg-pink-200 text-black rounded-md font-semibold text-lg transition-colors"
                >
                  Flow Yield
                </Link>
                </div>
                </div>
        </div>
        </div>

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
             

              <div className="">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Wallet Address</p>
                    {walletAddress ? (
                      <a 
                        href={`https://evm-testnet.flowscan.io/address/${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        Check the wallet on Explorer
                      </a>
                    ) : (
                      <p className="font-mono text-gray-400">Loading...</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 