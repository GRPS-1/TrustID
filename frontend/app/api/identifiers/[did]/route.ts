import { NextRequest, NextResponse } from 'next/server';
import { parseDID, createDIDDocument } from '@/lib/did';
import { algodClient, APP_ID } from '@/lib/algorand';
import algosdk from 'algosdk';

/**
 * DID Resolution API for Credentials
 * Resolves did:algo DIDs for both user addresses and credential IDs
 */

// Helper to encode ARC4 string
function encodeARC4String(str: string): Uint8Array {
  const encoded = new TextEncoder().encode(str);
  const length = new Uint8Array(2);
  length[0] = (encoded.length >> 8) & 0xff;
  length[1] = encoded.length & 0xff;
  const result = new Uint8Array(length.length + encoded.length);
  result.set(length, 0);
  result.set(encoded, length.length);
  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> }
) {
  try {
    const { did: didParam } = await params;
    const did = decodeURIComponent(didParam);
    
    // Parse accept header
    const acceptHeader = request.headers.get('accept') || 'application/did+ld+json';
    const wantsResolutionResult = acceptHeader.includes('application/did-resolution');
    
    // Validate DID format
    const parsed = parseDID(did);
    if (!parsed) {
      const errorResponse = {
        didResolutionMetadata: {
          error: 'invalidDid',
          message: 'Invalid DID format. Expected: did:algo:testnet:{address_or_credential_id}',
        },
        didDocument: null,
        didDocumentMetadata: {},
      };
      
      if (wantsResolutionResult) {
        return NextResponse.json(errorResponse, {
          status: 400,
          headers: { 'Content-Type': 'application/did-resolution+json' },
        });
      }
      
      return NextResponse.json(
        { error: 'invalidDid', message: errorResponse.didResolutionMetadata.message },
        { status: 400 }
      );
    }
    
    // Check if method is supported
    if (parsed.network !== 'testnet' && parsed.network !== 'mainnet') {
      const errorResponse = {
        didResolutionMetadata: {
          error: 'methodNotSupported',
          message: 'Only testnet and mainnet networks are supported',
        },
        didDocument: null,
        didDocumentMetadata: {},
      };
      
      if (wantsResolutionResult) {
        return NextResponse.json(errorResponse, {
          status: 501,
          headers: { 'Content-Type': 'application/did-resolution+json' },
        });
      }
      
      return NextResponse.json(
        { error: 'methodNotSupported', message: errorResponse.didResolutionMetadata.message },
        { status: 501 }
      );
    }
    
    // Try to resolve as credential DID first
    let didDocument;
    let didDocumentMetadata: any = {};
    let isCredential = false;
    
    try {
      // For credential lookup, use shortened ID (first 32 chars) for box storage
      const credIdForBox = parsed.address.substring(0, 32);
      
      console.log('Attempting to resolve credential:', {
        fullAddress: parsed.address,
        shortenedForBox: credIdForBox,
        length: parsed.address.length
      });
      
      // Check if this is a credential ID by looking it up in blockchain
      const credIdEncoded = encodeARC4String(credIdForBox);
      const boxKeyPrefix = new Uint8Array(Buffer.from('cred_'));
      const boxKey = new Uint8Array(boxKeyPrefix.length + credIdEncoded.length);
      boxKey.set(boxKeyPrefix, 0);
      boxKey.set(credIdEncoded, boxKeyPrefix.length);
      
      console.log('Box key details:', {
        prefix: 'cred_',
        encodedLength: credIdEncoded.length,
        totalBoxKeyLength: boxKey.length
      });
      
      const boxValue = await algodClient.getApplicationBoxByName(APP_ID, boxKey).do();
      const valueBytes = new Uint8Array(boxValue.value);
      
      // Parse credential data
      let offset = 0;
      
      // Read hash
      const hashLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
      offset += 2;
      const hash = Buffer.from(valueBytes.slice(offset, offset + hashLen)).toString('utf-8');
      offset += hashLen + 1;
      
      // Read owner
      const ownerBytes = valueBytes.slice(offset, offset + 32);
      const owner = algosdk.encodeAddress(Buffer.from(ownerBytes));
      offset += 32 + 1;
      
      // Read CID
      const cidLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
      offset += 2;
      const cid = Buffer.from(valueBytes.slice(offset, offset + cidLen)).toString('utf-8');
      offset += cidLen + 1;
      
      // Read type
      const typeLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
      offset += 2;
      const type = Buffer.from(valueBytes.slice(offset, offset + typeLen)).toString('utf-8');
      offset += typeLen + 1;
      
      // Read timestamp
      let timestamp = 0;
      for (let i = 0; i < 8; i++) {
        timestamp = (timestamp * 256) + valueBytes[offset + i];
      }
      offset += 8 + 1;
      
      // Read status
      let statusEnd = offset;
      while (statusEnd < valueBytes.length && valueBytes[statusEnd] !== 0x7c) {
        statusEnd++;
      }
      const status = Buffer.from(valueBytes.slice(offset, statusEnd)).toString('utf-8');
      offset = statusEnd + 1;
      
      // Read access
      const accessLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
      offset += 2;
      const access = Buffer.from(valueBytes.slice(offset, offset + accessLen)).toString('utf-8');
      
      // Check if revoked
      const isRevoked = valueBytes.length >= 8 && 
        Buffer.from(valueBytes.slice(-8)).toString('utf-8') === '|revoked';
      
      // Create credential DID document
      isCredential = true;
      const credentialTimestamp = timestamp > 0 ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
      
      didDocument = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://www.w3.org/2018/credentials/v1',
        ],
        id: did,
        controller: `did:algo:${parsed.network}:${owner}`,
        verificationMethod: [{
          id: `${did}#key-1`,
          type: 'Ed25519VerificationKey2020',
          controller: `did:algo:${parsed.network}:${owner}`,
          publicKeyBase58: Buffer.from(algosdk.decodeAddress(owner).publicKey).toString('base64'),
        }],
        service: [{
          id: `${did}#credential`,
          type: 'VerifiableCredential',
          serviceEndpoint: `https://gateway.pinata.cloud/ipfs/${cid}`,
        }],
        credentialSubject: {
          id: did,
          type,
          hash,
          status: isRevoked ? 'revoked' : status,
          access,
          issuer: `did:algo:${parsed.network}:${owner}`,
        },
      };
      
      didDocumentMetadata = {
        created: credentialTimestamp,
        updated: credentialTimestamp,
        credentialType: type,
        credentialStatus: isRevoked ? 'revoked' : status,
      };
      
    } catch (error) {
      // Not a credential, treat as regular address DID
      didDocument = createDIDDocument(
        parsed.address, 
        parsed.network as 'mainnet' | 'testnet'
      );
      
      didDocumentMetadata = {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
    }
    
    // Build resolution result
    const resolutionResult = {
      didResolutionMetadata: {
        contentType: 'application/did+ld+json',
        ...(isCredential && { resolvedAs: 'credential' }),
      },
      didDocument,
      didDocumentMetadata,
    };
    
    // Return based on accept header
    if (wantsResolutionResult) {
      return NextResponse.json(resolutionResult, {
        status: 200,
        headers: { 'Content-Type': 'application/did-resolution+json' },
      });
    }
    
    // Return just the DID document
    return NextResponse.json(didDocument, {
      status: 200,
      headers: { 'Content-Type': 'application/did+ld+json' },
    });
    
  } catch (error: any) {
    console.error('DID Resolution error:', error);
    
    const errorResponse = {
      didResolutionMetadata: {
        error: 'internalError',
        message: error.message || 'An unexpected error occurred during DID resolution',
      },
      didDocument: null,
      didDocumentMetadata: {},
    };
    
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'application/did-resolution+json' },
    });
  }
}
