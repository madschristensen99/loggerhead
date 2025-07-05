'use client';

import Link from 'next/link';
import Navbar from './components/Navbar';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

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
