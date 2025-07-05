'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import { base } from 'viem/chains';
import { mainnet } from 'viem/chains';

// Base network is imported directly from viem/chains

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId="cmcp6mwhf01lll40mdz8dl046"
      config={{
        defaultChain: base,
        supportedChains: [base, mainnet]
      }}
    >
      {children}
    </PrivyProvider>
  );
}