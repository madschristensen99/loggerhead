'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import { flowMainnet } from 'viem/chains';

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId="cmcp6mwhf01lll40mdz8dl046"
      config={{
        defaultChain: flowMainnet,
        // Replace this with a list of your desired supported chains
        supportedChains: [flowMainnet]
      }}
    >
      {children}
    </PrivyProvider>
  );
}