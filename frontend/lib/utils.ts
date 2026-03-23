// Encryption utilities for private credentials
export async function encryptFile(file: File, password: string): Promise<Blob> {
  const fileBuffer = await file.arrayBuffer();
  const fileData = new Uint8Array(fileBuffer);
  
  // Derive encryption key from password using PBKDF2
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Derive AES key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the file
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    fileData
  );
  
  // Combine salt + iv + encrypted data
  const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encryptedData), salt.length + iv.length);
  
  return new Blob([result]);
}

export async function decryptFile(encryptedBlob: Blob, password: string): Promise<Blob> {
  const encryptedBuffer = await encryptedBlob.arrayBuffer();
  const encryptedData = new Uint8Array(encryptedBuffer);
  
  // Extract salt, iv, and encrypted content
  const salt = encryptedData.slice(0, 16);
  const iv = encryptedData.slice(16, 28);
  const ciphertext = encryptedData.slice(28);
  
  // Derive encryption key from password
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt the data
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );
  
  return new Blob([decryptedData]);
}

// Generate secure credential ID in Algorand address format (shortened for box storage)
export async function generateCredentialId(
  hash: string,
  ownerAddress: string,
  timestamp: number
): Promise<string> {
  // Create deterministic data
  const data = `${hash}|${ownerAddress}|${timestamp}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Take first 32 bytes as public key (Algorand addresses are derived from 32-byte public keys)
  const publicKey = hashArray.slice(0, 32);
  
  // Import algosdk dynamically to encode as Algorand address
  const algosdk = (await import('algosdk')).default;
  
  // Encode as Algorand address (this creates a valid 58-character base32 address)
  const credentialAddress = algosdk.encodeAddress(publicKey);
  
  return credentialAddress;
}

// Get shortened credential ID for box storage (to fit in 64 byte limit)
export function getBoxCredentialId(credentialId: string): string {
  // Use first 32 characters of the credential ID for box storage
  // This is enough to be unique while fitting in box name limits
  return credentialId.substring(0, 32);
}

export async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function uploadToIPFS(file: File | Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
  
  if (!pinataJWT) {
    throw new Error('Pinata JWT not configured');
  }

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${pinataJWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload to IPFS');
  }

  const data = await response.json();
  return data.IpfsHash;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Derive encryption password from wallet address (deterministic)
export function deriveEncryptionPassword(walletAddress: string): string {
  // Use wallet address as seed for deterministic password
  // In production, this should use the wallet's signing capability
  return `trustid_${walletAddress}_encryption_key`;
}
