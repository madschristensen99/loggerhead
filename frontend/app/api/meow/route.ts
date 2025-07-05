import { ec as EC } from "elliptic"

const ec = new EC("p256")

// Générer une nouvelle paire de clés Flow
function generateKeyPair() {
  const keypair = ec.genKeyPair()
  const privateKey = keypair.getPrivate().toString('hex')
  const publicKey = keypair.getPublic('hex').replace('04', '') // Remove '04' prefix
  return { privateKey, publicKey }
}

export async function GET() {
  try {
    // Générer une nouvelle paire de clés
    const { privateKey, publicKey } = generateKeyPair()
    
    return new Response(JSON.stringify({ 
      success: true, 
      data: {
        privateKey,
        publicKey,
        nextStep: "go on https://testnet-faucet.onflow.org/"
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: error.toString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
} 