"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ethers } from 'ethers';
import axios from 'axios';

interface QuoteRoute {
  route: string;
  error: string | null;
  srcAmount: string;
  dstAmount: string;
  srcAmountMax: string;
  fee: string;
  dstChainId: number;
}

interface QuoteResponse {
  quotes: QuoteRoute[];
}

interface RouterContract {
  address: string;
  abi: string[];
}

const ROUTER_ADDRESS = '0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590'; // Flow Router
const USDC_POOL_ID = 21; // USDC pool ID for Flow network
const ROUTER_CONTRACT: RouterContract = {
  address: ROUTER_ADDRESS,
  abi: [
    'function swap(uint16 _dstChainId, uint256 _srcPoolId, uint256 _dstPoolId, address payable _refundAddress, uint256 _amountLD, uint256 _minAmountLD, tuple(uint256 dstGasForCall, uint256 dstNativeAmount, bytes dstNativeAddr) _lzTxParams, bytes calldata _to, bytes calldata _payload) external payable',
    'function quoteLayerZeroFee(uint16 _dstChainId, uint8 _functionType, bytes calldata _toAddress, bytes calldata _transferAndCallPayload, tuple(uint256 dstGasForCall, uint256 dstNativeAmount, bytes dstNativeAddr) _lzTxParams) external view returns (uint256, uint256)',
    'function getPool(uint256 poolId) external view returns (address)',
    'function factory() external view returns (address)'
  ]
};

const FLOW_STG_USDC = '0xF1815bd50389c46847f0Bda824eC8da914045D14'; // stgUSDC on Flow
const BASE_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base
const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY || '0x235dc322af4475c1eb0f7462b2f17e518dd7c51a1a77f1f342d450d00f9e4fc6';

// Initialize providers
const flowProvider = new ethers.JsonRpcProvider('https://mainnet.evm.nodes.onflow.org');
const wallet = new ethers.Wallet(PRIVATE_KEY, flowProvider); // Connect to Flow network

// Utility function to format amount to wei (6 decimals for USDC)
const formatAmount = (amount: string): string => {
  try {
    const amountFloat = parseFloat(amount);
    const amountWei = Math.floor(amountFloat * 1000000).toString();
    return amountWei;
  } catch {
    return '0';
  }
};

// Utility function to format display amount (from wei to human readable)
const formatDisplayAmount = (amount: string): string => {
  if (!amount) return '0';
  try {
    const amountNum = parseFloat(amount);
    return (amountNum / 1000000).toFixed(6);
  } catch {
    return '0';
  }
};

export default function Bridge() {
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<QuoteRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [balance, setBalance] = useState<string>('0');

  const getBalance = async () => {
    try {
      const usdcContract = new ethers.Contract(
        FLOW_STG_USDC,
        ['function balanceOf(address owner) view returns (uint256)'],
        wallet
      );
      const balanceWei = await usdcContract.balanceOf(wallet.address);
      setBalance(balanceWei.toString());
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  useEffect(() => {
    getBalance();
  }, []);

  const handleMaxClick = () => {
    setAmount(formatDisplayAmount(balance));
  };

  const getQuote = async () => {
    if (!amount) {
      setError('Please enter an amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedAmount = formatAmount(amount);
      const minAmount = Math.floor(Number(formattedAmount) * 0.9985).toString(); // 0.15% max fee

      // Get quote from Stargate API
      const response = await axios.get<QuoteResponse>('https://stargate.finance/api/v1/quotes', {
        params: {
          srcToken: FLOW_STG_USDC,
          dstToken: BASE_USDC,
          srcAddress: wallet.address,
          dstAddress: wallet.address,
          srcChainKey: 'flow',
          dstChainKey: 'base',
          srcAmount: formattedAmount,
          dstAmountMin: minAmount,
          version: 'v2'
        }
      });

      const validQuote = response.data.quotes.find(q => !q.error);
      if (!validQuote) {
        throw new Error('No valid quotes available');
      }

      setQuote(validQuote);
      console.log('Quote received:', validQuote);
    } catch (err) {
      console.error('Error fetching quote:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Failed to get quote');
      } else {
        setError('Failed to get quote');
      }
    } finally {
      setLoading(false);
    }
  };

  const executeBridge = async () => {
    if (!quote) {
      setError('Please get a quote first');
      return;
    }

    setExecuting(true);
    setError(null);

    try {
      // First approve stgUSDC spending
      const usdcContract = new ethers.Contract(
        FLOW_STG_USDC,
        ['function approve(address spender, uint256 amount) public returns (bool)'],
        wallet
      );

      const amountBigInt = ethers.getBigInt(quote.srcAmount);
      console.log('Approving amount:', formatDisplayAmount(quote.srcAmount));
      
      const approveTx = await usdcContract.approve(ROUTER_ADDRESS, amountBigInt);
      console.log('Approval transaction sent:', approveTx.hash);
      await approveTx.wait();
      console.log('Approval confirmed');

      // Initialize Router contract
      const routerContract = new ethers.Contract(
        ROUTER_ADDRESS,
        ROUTER_CONTRACT.abi,
        wallet
      );

      // Calculate minimum amount with 0.15% max fee
      const minAmount = (amountBigInt * ethers.getBigInt(9985)) / ethers.getBigInt(10000);

      // Prepare the destination address bytes
      const dstAddress = ethers.solidityPacked(['address'], [wallet.address]);

      // Create and sign transaction according to Stargate docs
      const tx = {
        to: ROUTER_ADDRESS,
        data: routerContract.interface.encodeFunctionData('swap', [
          8453, // Base chain ID
          USDC_POOL_ID,
          USDC_POOL_ID,
          wallet.address,
          amountBigInt,
          minAmount,
          [0, 0, '0x'],
          dstAddress,
          '0x' // Empty signature for now
        ]),
        value: ethers.parseEther('0'), // No value needed for this transaction
      };
      
      const signedTx = await wallet.signTransaction(tx);
      
      // Submit transaction
      const txResponse = await flowProvider.broadcastTransaction(signedTx);
      console.log('Transaction submitted:', txResponse.hash);
      
      // Wait for confirmation
      const txReceipt = await txResponse.wait();
      console.log('Transaction confirmed:', txReceipt);

      // Reset form state on success
      setQuote(null);
      setAmount('');
      await getBalance(); // Refresh balance after successful swap
    } catch (err) {
      console.error('Error executing bridge:', err);
      if (err instanceof Error) {
        setError(err.message || 'Failed to execute bridge');
      } else {
        setError('Failed to execute bridge');
      }
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="w-full border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black tracking-wider">LOGGERHEAD</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-black mb-8">Bridge Assets</h1>

          <div className="space-y-6">
            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Bridge Details</h3>
                  <p className="text-sm text-gray-600">From: Flow stgUSDC ({FLOW_STG_USDC})</p>
                  <p className="text-sm text-gray-600">To: Base USDC ({BASE_USDC})</p>
                  <p className="text-sm text-gray-600">Wallet: {wallet.address}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      step="0.000001"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                    <div className="absolute right-3 top-3 text-sm text-gray-500">
                      USDC
                    </div>
                  </div>
                  <button
                    onClick={handleMaxClick}
                    className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Max: {formatDisplayAmount(balance)} USDC
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={getQuote}
                disabled={loading || !amount}
                className="mt-6 w-full bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 disabled:bg-gray-400 transition-colors font-medium"
              >
                {loading ? 'Getting Quote...' : 'Get Quote'}
              </button>
            </div>

            {quote && (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-medium mb-4">Quote Details</h2>
                <div className="space-y-2">
                  <p>Route: {quote.route}</p>
                  <p>Source Amount: {formatDisplayAmount(quote.srcAmount)} USDC</p>
                  <p>Destination Amount: {formatDisplayAmount(quote.dstAmount)} USDC</p>
                </div>
                <button
                  onClick={executeBridge}
                  disabled={executing}
                  className="mt-6 w-full bg-pink-500 text-white px-8 py-3 rounded-full hover:bg-pink-600 disabled:bg-pink-300 transition-colors font-medium"
                >
                  {executing ? 'Executing Bridge...' : 'Execute Bridge'}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 