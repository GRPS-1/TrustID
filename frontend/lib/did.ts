import algosdk from 'algosdk';

/**
 * DID (Decentralized Identifier) utilities for TrustID
 * Following W3C DID specification
 */

export interface DIDDocument {
  '@context': string[];
  id: string;
  controller?: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  service?: ServiceEndpoint[];
  created?: string;
  updated?: string;
  profile?: {
    name?: string;
    bio?: string;
    image?: string;
  };
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyMultibase?: string;
  publicKeyBase58?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string;
}

/**
 * Generate DID from Algorand address
 */
export function generateDID(address: string, network: 'mainnet' | 'testnet' = 'testnet'): string {
  return `did:algo:${network}:${address}`;
}

/**
 * Parse DID to extract address and network
 */
export function parseDID(did: string): { network: string; address: string } | null {
  const didRegex = /^did:algo:(mainnet|testnet):([A-Z2-7]{58})$/;
  const match = did.match(didRegex);
  
  if (!match) {
    return null;
  }
  
  return {
    network: match[1],
    address: match[2],
  };
}

/**
 * Validate DID format
 */
export function isValidDID(did: string): boolean {
  return parseDID(did) !== null;
}

/**
 * Create DID Document from Algorand address
 */
export function createDIDDocument(
  address: string,
  network: 'mainnet' | 'testnet' = 'testnet',
  profile?: {
    name?: string;
    bio?: string;
    profileCid?: string;
  }
): DIDDocument {
  const did = generateDID(address, network);
  
  // Convert Algorand address to public key for verification method
  const addressBytes = algosdk.decodeAddress(address).publicKey;
  
  // Convert to base58 instead of base64url for better compatibility
  const publicKeyBase58 = Buffer.from(addressBytes).toString('base64');
  
  const document: DIDDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#keys-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyBase58,
      },
    ],
    authentication: [`${did}#keys-1`],
    assertionMethod: [`${did}#keys-1`],
    service: [
      {
        id: `${did}#credentials`,
        type: 'CredentialRegistry',
        serviceEndpoint: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/credentials/${address}`,
      },
    ],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
  
  if (profile) {
    document.profile = {
      name: profile.name,
      bio: profile.bio,
      image: profile.profileCid ? `https://gateway.pinata.cloud/ipfs/${profile.profileCid}` : undefined,
    };
  }
  
  return document;
}

/**
 * Resolve DID to DID Document
 */
export async function resolveDID(
  did: string,
  algodClient: algosdk.Algodv2,
  didRegistryAppId: number
): Promise<DIDDocument | null> {
  const parsed = parseDID(did);
  
  if (!parsed) {
    throw new Error('Invalid DID format');
  }
  
  try {
    // Encode address for box lookup
    const addressBytes = algosdk.decodeAddress(parsed.address).publicKey;
    const boxKeyPrefix = new Uint8Array(Buffer.from('did_'));
    const boxKey = new Uint8Array(boxKeyPrefix.length + addressBytes.length);
    boxKey.set(boxKeyPrefix);
    boxKey.set(addressBytes, boxKeyPrefix.length);
    
    // Get DID data from blockchain
    const boxValue = await algodClient.getApplicationBoxByName(didRegistryAppId, boxKey).do();
    const valueBytes = new Uint8Array(boxValue.value);
    
    // Parse stored data: name | bio | profile_cid | timestamp
    let offset = 0;
    
    // Read name (ARC4 String)
    const nameLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
    offset += 2;
    const name = Buffer.from(valueBytes.slice(offset, offset + nameLen)).toString('utf-8');
    offset += nameLen;
    offset += 1; // Skip separator
    
    // Read bio (ARC4 String)
    const bioLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
    offset += 2;
    const bio = Buffer.from(valueBytes.slice(offset, offset + bioLen)).toString('utf-8');
    offset += bioLen;
    offset += 1; // Skip separator
    
    // Read profile CID (ARC4 String)
    const cidLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
    offset += 2;
    const profileCid = Buffer.from(valueBytes.slice(offset, offset + cidLen)).toString('utf-8');
    offset += cidLen;
    offset += 1; // Skip separator
    
    // Read timestamp
    let timestamp = 0;
    for (let i = 0; i < 8; i++) {
      timestamp = (timestamp * 256) + valueBytes[offset + i];
    }
    
    const created = timestamp > 0 ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
    
    // Check if deactivated
    const isDeactivated = valueBytes.length >= 12 && 
      Buffer.from(valueBytes.slice(-12)).toString('utf-8') === '|deactivated';
    
    if (isDeactivated) {
      return null;
    }
    
    // Create DID document with timestamps
    const document = createDIDDocument(parsed.address, parsed.network as 'mainnet' | 'testnet', {
      name,
      bio,
      profileCid,
    });
    
    // Add created timestamp
    document.created = created;
    document.updated = created;
    
    return document;
  } catch (error) {
    console.error('Error resolving DID:', error);
    return null;
  }
}

/**
 * Verify DID ownership by checking signature
 */
export async function verifyDIDOwnership(
  did: string,
  message: string,
  signature: Uint8Array
): Promise<boolean> {
  const parsed = parseDID(did);
  
  if (!parsed) {
    return false;
  }
  
  try {
    const messageBytes = new TextEncoder().encode(message);
    
    // Verify signature using Algorand's Ed25519
    return algosdk.verifyBytes(messageBytes, signature, parsed.address);
  } catch (error) {
    console.error('Error verifying DID ownership:', error);
    return false;
  }
}

/**
 * Get short DID for display
 */
export function shortenDID(did: string): string {
  const parsed = parseDID(did);
  if (!parsed) return did;
  
  const addr = parsed.address;
  return `did:algo:${parsed.network}:${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Export DID Document as JSON
 */
export function exportDIDDocument(document: DIDDocument): string {
  return JSON.stringify(document, null, 2);
}

/**
 * Create Verifiable Presentation from credentials
 */
export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  holder: string;
  verifiableCredential: any[];
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    signature?: string;
  };
}

export function createVerifiablePresentation(
  holderDID: string,
  credentials: any[]
): VerifiablePresentation {
  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
    ],
    type: ['VerifiablePresentation'],
    holder: holderDID,
    verifiableCredential: credentials,
  };
}
