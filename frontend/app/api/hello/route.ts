import { NextResponse } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';

// Initialize Privy client
const privy = new PrivyClient('cmcp6mwhf01lll40mdz8dl046', process.env.PRIVY_API_KEY!);

export async function GET(request: Request) {
  try {
    // Get ownerId from query parameters
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');

    if (!ownerId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ownerId is required' 
        },
        { status: 400 }
      );
    }

    // Create a new Ethereum wallet using server API
    const { id, address, chainType } = await privy.walletApi.create({
      chainType: 'ethereum',
      owner: {
        userId: ownerId
      }
    });

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