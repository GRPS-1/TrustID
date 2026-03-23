import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify DID resolver is working
 */
export async function GET() {
  const testDID = 'did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    // Test the resolver endpoint
    const response = await fetch(`${baseUrl}/api/identifiers/${encodeURIComponent(testDID)}`, {
      headers: {
        'Accept': 'application/did-resolution+json',
      },
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      status: 'success',
      message: 'DID Resolver API is working',
      testDID,
      resolverEndpoint: `${baseUrl}/api/identifiers/{did}`,
      testResult: data,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      testDID,
    }, { status: 500 });
  }
}
