"use client";

import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

export default function Home() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [balance, setBalance] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      const privateKey = user?.customMetadata?.privateKey;
      if (typeof privateKey === 'string') {
        try {
          // Flow EVM Testnet RPC URL - official endpoint
          const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
          const wallet = new ethers.Wallet(privateKey, provider);
          
          // Get public key from private key using SigningKey
          const signingKey = new ethers.SigningKey(privateKey);
          const publicKey = signingKey.publicKey;
          console.log('Public Key:', publicKey);
          setPublicKey(publicKey);
          
          console.log('Wallet address:', wallet.address);
          setWalletAddress(wallet.address);

          // Get balance of specific contract
          const contractAddress = '0x2aaBea2058b5aC2D339b163C6Ab6f2b6d53aabED';
          const balanceWei = await provider.getBalance(contractAddress);
          console.log('Contract Balance in Wei:', balanceWei.toString());
          const balanceEth = ethers.formatEther(balanceWei);
          console.log('Contract Balance in FLOW:', balanceEth);
          setBalance(balanceEth);
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance('Error');
          setPublicKey(null);
          setWalletAddress(null);
        }
      }
    };

    if (authenticated && user?.customMetadata?.privateKey) {
      fetchBalance();
    }
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
                <p className="text-xl">Your Private Key</p>
                <p className="font-mono break-all text-black">{user?.customMetadata?.privateKey}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
