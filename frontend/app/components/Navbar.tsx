import Link from 'next/link';
import { Square3Stack3DIcon, ChartBarIcon, NewspaperIcon } from '@heroicons/react/24/outline';
import { usePrivy } from '@privy-io/react-auth';

export default function Navbar() {
  const { authenticated, logout, login } = usePrivy();

  return (
    <header className="w-full">
      <div className="max-w-7xl mx-auto px-0 py-6 flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-black tracking-wider">LOGGERHEAD</h1>
        </Link>
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
          {authenticated ? (
            <button onClick={logout} className="flex items-center gap-2 bg-black text-white px-8 py-2 rounded-full hover:bg-gray-800 transition-colors">
              Logout
            </button>
          ) : (
            <button onClick={login} className="flex items-center gap-2 bg-black text-white px-8 py-2 rounded-full hover:bg-gray-800 transition-colors">
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
} 