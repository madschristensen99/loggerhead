"use client";

import { usePrivy } from '@privy-io/react-auth';
import { useFundWallet } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { flowMainnet } from 'viem/chains';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { ChartLineDefault } from '@/app/components/Chart';

export default function App() {
  const { ready, authenticated, login, user } = usePrivy();
  const { fundWallet } = useFundWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [dataApi, setDataApi] = useState<any>({"EUR":"45%", "USD":"55%", "reasoning": "Based on the latest market analysis and economic data as of mid-2025, here is a detailed assessment and investment recommendation for EUR vs USD allocation:\n\n**Current Exchange Rates and Trends:**\n- EUR/USD is trading around 1.08, having gained about 5% over the past month, indicating recent euro strength against the dollar[2].\n- Bank of America forecasts only a modest rise in EUR/USD to about 1.05 by year-end 2025, signaling a stronger dollar bias overall[1].\n- JPMorgan, however, has turned tactically bullish on the euro, expecting EUR/USD to potentially reach 1.12-1.14 due to improved EU fiscal support and easing US exceptionalism[2].\n\n**Economic Indicators:**\n- Eurozone GDP growth is projected at 0.9% for 2025, with moderate recovery expected in subsequent years supported by fiscal stimulus and rising wages[3].\n- The US economy shows signs of moderation, which could weaken the dollar later in the year, according to JPMorgan[2].\n- Inflation and interest rate assumptions remain broadly stable, with ECB maintaining a cautious stance amid trade tensions and energy price volatility[3][4].\n\n**Central Bank Policies:**\n- The ECB is maintaining a cautious but supportive monetary policy, with recent decisions aimed at less restrictive financing conditions to support growth[3][4].\n- The Federal Reserve remains relatively hawkish, contributing to dollar strength, but market sentiment suggests this may moderate as US economic data softens[1][2].\n\n**Market Sentiment and Technical Analysis:**\n- Market sentiment is mixed: Bank of America leans towards a stronger dollar rally continuing into 2025, recommending hedges against dollar strength[1].\n- JPMorgan’s recent shift to bullish on EUR/USD reflects a tactical view that the euro could outperform in the medium term due to geopolitical and fiscal developments[2].\n- Technical indicators show recent euro momentum but with resistance near 1.12-1.14 levels.\n\n**Geopolitical Factors:**\n- A cease-fire and increased fiscal support in the EU have improved sentiment towards the euro[2].\n- US political developments and trade tensions continue to inject uncertainty, but no major shocks are currently expected[1][3].\n\n---\n\n### Investment Allocation Recommendation\n\n**Based on the above analysis, I recommend:**\n\n| Currency | Allocation (%) | Reasoning |\n|----------|----------------|-----------|\n| EUR      | 45%            | The euro shows tactical upside potential supported by EU fiscal stimulus, improving sentiment, and moderate GDP growth. The recent bullish shift by JPMorgan and easing US exceptionalism support this allocation. However, risks from trade tensions and ECB caution limit a higher allocation. |\n| USD      | 55%            | The US dollar remains fundamentally strong due to Fed policy and historical dollar resilience. Bank of America’s forecast of continued dollar strength and the modest EUR/USD upside cap justify a slightly higher USD allocation as a defensive position. |\n\n**Summary:**  \nA slight overweight in USD (55%) balances the current dollar strength and Fed policy with the tactical euro upside (45%) driven by EU fiscal support and improving geopolitical conditions. This allocation provides a balanced exposure to both currencies, capturing potential euro gains while hedging against dollar resilience.\n\n**Final allocation: EUR 45% and USD 55%.**"});
  const [isReadingDetails, setIsReadingDetails] = useState(false);
  //const [poolBalance, setPoolBalance] = useState<string | null>(null);

  // Fetch balances when component loads
  function fetchDataApi() {
    fetch('http://localhost:3001/api')
      .then(response => response.json())
      .then(data => {
        console.log('Data API:', data);
        setDataApi(data);
      })
      .catch(error => {
        console.error('Error fetching data:', error)
      })
  }

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
          //setPoolBalance(poolBalanceFormatted);

        } catch (error) {
          console.error('Error fetching balances:', error);
          setBalance('Error');
          setWalletAddress(null);
          //setPoolBalance('Error');
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
          <div className="min-w-1/3 grow max-w-[calc(50%-1rem)] flex flex-col gap-4"> 
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
                        chain: flowMainnet,
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
                <div className="flex gap-4">
                  <div className="flex grow aspect-video justify-center items-center flex-col gap-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <p className="text-5xl font-semibold">{dataApi.EUR}€</p>
                  </div>
                  <div className="flex grow aspect-video justify-center items-center flex-col gap-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <p className="text-5xl font-semibold">{dataApi.USD}$</p>
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  <button onClick={() => {
                    setIsReadingDetails(!isReadingDetails);
                  }} className="text-sm text-gray-500">Read Details</button>
                </div>

                {isReadingDetails && (
                  <div className="flex flex-col gap-4 bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                    <p>{dataApi.reasoning}</p>
                  </div>
                )}
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