'use client';

import Link from 'next/link';
import { 
  Square3Stack3DIcon, 
  ChartBarIcon,
  NewspaperIcon,
  UserCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full">
        <div className="max-w-7xl mx-auto px-0 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-wider">LOGGERHEAD</h1>
          <div className="flex items-center">
            <div className="flex gap-6 items-center bg-pink-200 rounded-full px-6 py-2 mr-6">
              <Link href="/balance" className="flex items-center gap-2">
                <Square3Stack3DIcon className="w-5 h-5" />
                Balance
              </Link>
              <Link href="/chart" className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                Chart
              </Link>
              <Link href="/news" className="flex items-center gap-2">
                <NewspaperIcon className="w-5 h-5" />
                News
              </Link>
            </div>
            <Link href="/app" className="flex items-center gap-2 bg-black text-white px-8 py-2 rounded-full hover:bg-gray-800 transition-colors">
              Start Now
            </Link>
          </div>
        </div>
      </header>

      <main className="flex h-full min-h-[calc(100vh-100px)] items-center">
        {/* Left Section */}
        <div className="max-w-7xl h-full mx-auto flex-1 flex justify-between items-center">
          <div>
            <div className="max-w-xl">
              <h2 className="text-5xl font-light leading-tight mb-6">
                <span className="font-black">Invest</span><br />
                Let us grow your <span className="font-black">money</span><br />
                Only for <span className="font-black">you</span>
              </h2>
              <Link href="/app" className="bg-black text-white px-8 py-3 rounded-full hover:bg-gray-800 transition-colors">
                Start Now
              </Link>
            </div>
          </div>

        {/* Right Section - News */}
        <div className="w-[480px] h-full border border-gray-200 rounded-lg p-12">
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-8">RECENT NEWS</h3>
            <div className="flex gap-3 mb-6">
              <button className="px-4 py-1.5 bg-pink-200 rounded-full text-sm">Global</button>
              <button className="px-4 py-1.5 rounded-full text-sm">Stablecoin</button>
              <button className="px-4 py-1.5 rounded-full text-sm">US</button>
              <button className="px-4 py-1.5 rounded-full text-sm">EUROPE</button>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg">
                <div className="flex justify-between text-sm text-gray-700 mb-1">
                  <span>15min ago, Coindesk</span>
                </div>
                <h4 className="font-medium mb-1">Dollar Weakness</h4>
                <p className="text-sm text-gray-600">The US dollar has experienced its worst half-year performance in 50 years....</p>
              </div>

              <div className="rounded-lg">
                <div className="text-sm text-gray-700 mb-1">1h ago, Bloomberg</div>
                <h4 className="font-medium mb-1">EUR/USD Forecasts</h4>
                <p className="text-sm text-gray-600">Several analysts now see the EUR/USD pair reaching 1.20 by year-end...</p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
