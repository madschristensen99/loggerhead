'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import { defineChain } from 'viem';
import { mainnet } from 'viem/chains';

const flowEVM = defineChain({
  id: 646,
  name: 'Flow EVM',
  network: 'flow-evm',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: { http: ['https://rpc.flow.com/evm'] },
    public: { http: ['https://rpc.flow.com/evm'] },
  },
  blockExplorers: {
    default: { name: 'FlowScan', url: 'https://flowscan.org' },
  },
});

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <PrivyProvider
      appId="cmcp6mwhf01lll40mdz8dl046"
      config={{
        defaultChain: flowEVM,
        supportedChains: [flowEVM, mainnet]
      }}
    >
      {children}
    </PrivyProvider>
  );
}