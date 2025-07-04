"use client";

import { useState } from "react";

export default function Home() {
  const [wallet, setWallet] = useState<string>("");

  const handleWallet = () => {
    if(wallet) {
      setWallet('');
    } else {
      setWallet('uwu');
    }
  };

  return (
    <div className="w-screen min-h-screen h-full">
      <nav className="fixed top-0 left-0 right-0 bg-white">
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <p className="font-bold text-xl">LoggerHead</p>
          <button className="font-bold text-xl px-4 py-2 bg-black text-white rounded-md" onClick={handleWallet}>Wallet</button>
        </div>
      </nav>
      {!wallet && (
      <div className="flex items-center justify-center h-[calc(100vh)]">
      <div className="max-w-2xl w-full px-4">
        <div className="flex flex-col gap-2">
          <p className="text-xl">Please connect to your account</p>
        </div>
      </div>
    </div>
      )}
      {wallet && (
      <div className="flex items-center justify-center h-[calc(100vh)]">
        <div className="max-w-2xl w-full px-4">
          <div className="flex flex-col gap-2">
            <p className="text-xl">Your Balance</p>
            <h1 className="text-7xl font-bold">1,234<span className="text-black/30">.23</span>$</h1>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
