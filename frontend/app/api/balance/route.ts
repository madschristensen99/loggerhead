import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth');

export async function GET(request: Request) {
  try {
    // Get address from query parameters
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'address is required' 
        },
        { status: 400 }
      );
    }

    // Get wallet balance using ethers
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);

    return NextResponse.json({
      success: true,
      balance: parseFloat(balanceInEth).toFixed(4)
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch balance' 
      },
      { status: 500 }
    );
  }
} 