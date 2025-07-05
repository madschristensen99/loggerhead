"use client";

import { usePrivy } from '@privy-io/react-auth';

export default function Home() {
  const { ready, authenticated, login, logout, user } = usePrivy();

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
