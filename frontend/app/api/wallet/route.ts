import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

// Initialize Privy client
const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_API_KEY!
);

export async function GET() {
  try {
    // Create a new Ethereum wallet
    const { id, address, chainType } = await privy.walletApi.create({ chainType: 'ethereum' });

    return NextResponse.json({
      success: true,
      wallet: {
        id,
        address,
        chainType
      }
    });
  } catch (error) {
    console.error('Error creating wallet:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create wallet' 
      },
      { status: 500 }
    );
  }
} 