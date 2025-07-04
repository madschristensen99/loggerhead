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

    // Get user data which includes linked accounts (wallets)
    const user = await privy.getUser(ownerId);
    const wallets = user.linkedAccounts.filter(account => account.type === 'wallet');

    return NextResponse.json({
      success: true,
      wallets: wallets
    });
  } catch (error) {
    console.error('Error listing wallets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to list wallets' 
      },
      { status: 500 }
    );
  }
} 