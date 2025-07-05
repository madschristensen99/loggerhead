import { ethers } from "ethers";

// Flow EVM RPC endpoint
const provider = new ethers.JsonRpcProvider("https://rpc-testnet.flow.com");

// Hardcoded values for simplicity
const FLOW_CONFIG = {
  privateKey: "private key",
};

export async function GET() {
  try {
    // Create wallet from private key
    const wallet = new ethers.Wallet(FLOW_CONFIG.privateKey, provider);

    // Simple transaction that logs a message
    const tx = {
      to: wallet.address,  // Send to self
      value: 0,  // No value transfer
      data: "0x" + Buffer.from("Hello from Flow EVM!").toString("hex")  // Message in hex
    };

    // Send transaction
    const txResponse = await wallet.sendTransaction(tx);
    
    // Wait for transaction to be mined
    const receipt = await txResponse.wait();

    return new Response(
      JSON.stringify({
        success: true,
        data: receipt
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Transaction error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 