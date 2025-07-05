"use client";

import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ABIs
const erc20Abi = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

const poolAbi = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external"
];

// Helper function to ensure private key has 0x prefix
const normalizePrivateKey = (key: string) => {
  return key.startsWith('0x') ? key : `0x${key}`;
};

// Helper function to validate amount input
const isValidAmount = (value: string): boolean => {
  try {
    if (!value) return false;
    if (value.includes('.')) {
      const [, decimals] = value.split('.');
      if (decimals.length > 18) return false;
    }
    return !isNaN(Number(value));
  } catch {
    return false;
  }
};

export default function DepositPage() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDeposit = async () => {
    if (!amount || !isValidAmount(amount)) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const privateKey = user?.customMetadata?.privateKey;
      if (!privateKey || typeof privateKey !== 'string') {
        throw new Error("No private key found or invalid private key format");
      }

      const normalizedPrivateKey = normalizePrivateKey(privateKey);
      
      const provider = new ethers.JsonRpcProvider('https://mainnet.evm.nodes.onflow.org');
      const wallet = new ethers.Wallet(normalizedPrivateKey, provider);
      console.log('Wallet initialized:', wallet.address);

      // Addresses
      const poolAddress = "0xbC92aaC2DBBF42215248B5688eB3D3d2b32F2c8d";
      const usdfAddress = "0x2aaBea2058b5aC2D339b163C6Ab6f2b6d53aabED";

      // Contracts
      const usdf = new ethers.Contract(usdfAddress, erc20Abi, wallet);
      const pool = new ethers.Contract(poolAddress, poolAbi, wallet);

      // Check USDF balance before proceeding
      const balance = await usdf.balanceOf(wallet.address);
      const humanBalance = ethers.formatEther(balance);
      console.log('Current USDF balance:', humanBalance);

      if (balance < ethers.parseEther(amount)) {
        throw new Error(`Insufficient USDF balance. You have ${humanBalance} USDF`);
      }

      // Convert amount to wei (1 ether = 10^18 wei)
      const amountInWei = ethers.parseEther(amount);
      console.log('Amount to deposit in wei:', amountInWei.toString());

      // Steps
      // 1. Approve
      console.log('Approving USDF spend...');
      const approveTx = await usdf.approve(poolAddress, amountInWei);
      console.log('Approval transaction hash:', approveTx.hash);
      await approveTx.wait();
      console.log('Approval confirmed');

      // 2. Supply
      console.log('Supplying USDF to pool...');
      const supplyTx = await pool.supply(usdfAddress, amountInWei, wallet.address, 0);
      console.log('Supply transaction hash:', supplyTx.hash);
      await supplyTx.wait();
      console.log('Supply confirmed');

      setSuccess(true);
    } catch (err) {
      console.error("Deposit error:", err);
      setError(err instanceof Error ? err.message : "An error occurred during deposit");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Please connect your wallet first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Deposit USDF</h1>
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-sm border">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-medium text-gray-900">Your Private Key</h2>
              <p className="font-mono break-all text-sm bg-gray-50 p-4 rounded-md">
                {user?.customMetadata?.privateKey || 'No private key found'}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="amount" className="text-sm font-medium text-gray-700">
                Amount to Deposit
              </label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (newValue === '' || isValidAmount(newValue)) {
                    setAmount(newValue);
                  }
                }}
                placeholder="Enter amount (e.g. 1.5)"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm">
                Successfully deposited {amount} USDF!
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={isLoading || !amount}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isLoading || !amount ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Processing...' : 'Deposit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 