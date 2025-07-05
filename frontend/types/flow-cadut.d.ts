declare module 'flow-cadut' {
  export function sendTransaction(params: {
    code: string;
    signers: Array<{
      address: string;
      keyId: number;
      privateKey: string;
      hashAlgorithm: string;
      signatureAlgorithm: string;
    }>;
  }): Promise<any>;
  
  export function authorization(params: {
    address: string;
    keyId: number;
    privateKey: string;
    hashAlgorithm: string;
    signatureAlgorithm: string;
  }): any;
} 