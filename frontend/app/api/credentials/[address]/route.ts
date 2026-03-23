import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const APP_ID = parseInt(process.env.NEXT_PUBLIC_APP_ID || '757494334');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Validate Algorand address
    try {
      algosdk.decodeAddress(address);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Algorand address' },
        { status: 400 }
      );
    }

    const algodClient = new algosdk.Algodv2('', ALGOD_SERVER, ALGOD_PORT);

    // Fetch all boxes from the credential contract
    const boxes = await algodClient.getApplicationBoxes(APP_ID).do();
    const credentials: any[] = [];

    for (const box of boxes.boxes) {
      try {
        const boxNameBytes = box.name;
        
        // Skip if not a credential box (should start with "cred_")
        if (boxNameBytes.length < 5) continue;
        
        const credIdWithPrefix = boxNameBytes.slice(5);
        const length = (credIdWithPrefix[0] << 8) | credIdWithPrefix[1];
        const credIdBytes = credIdWithPrefix.slice(2, 2 + length);
        const credId = Buffer.from(credIdBytes).toString('utf-8');
        
        const boxValue = await algodClient.getApplicationBoxByName(APP_ID, boxNameBytes).do();
        const valueBytes = new Uint8Array(boxValue.value);
        
        let offset = 0;
        
        // Parse hash
        const hashLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
        offset += 2 + hashLen + 1;
        
        // Parse owner
        const ownerBytes = Buffer.from(valueBytes.slice(offset, offset + 32));
        const ownerAddress = algosdk.encodeAddress(ownerBytes);
        offset += 32 + 1;
        
        // Only include credentials owned by this address
        if (ownerAddress !== address) continue;
        
        // Parse CID
        const cidLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
        offset += 2;
        const cid = Buffer.from(valueBytes.slice(offset, offset + cidLen)).toString('utf-8');
        offset += cidLen + 1;
        
        // Parse type
        const typeLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
        offset += 2;
        const type = Buffer.from(valueBytes.slice(offset, offset + typeLen)).toString('utf-8');
        offset += typeLen + 1;
        
        // Parse timestamp
        let timestampNum = 0;
        for (let i = 0; i < 8; i++) {
          timestampNum = (timestampNum * 256) + valueBytes[offset + i];
        }
        offset += 8 + 1;
        
        // Parse status
        let statusEnd = offset;
        while (statusEnd < valueBytes.length && valueBytes[statusEnd] !== 0x7c) {
          statusEnd++;
        }
        const status = Buffer.from(valueBytes.slice(offset, statusEnd)).toString('utf-8');
        offset = statusEnd + 1;
        
        // Parse access
        const accessLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
        offset += 2;
        const access = Buffer.from(valueBytes.slice(offset, offset + accessLen)).toString('utf-8');
        
        // Check if revoked
        const isRevoked = valueBytes.length >= 8 && 
          Buffer.from(valueBytes.slice(-8)).toString('utf-8') === '|revoked';
        
        // Only include public credentials in API response
        if (access === 'public') {
          const timestamp = timestampNum > 0
            ? new Date(timestampNum * 1000).toISOString()
            : new Date().toISOString();
          
          credentials.push({
            id: credId,
            type: type || 'unknown',
            access,
            timestamp,
            status: isRevoked ? 'revoked' : status,
            cid,
            owner: ownerAddress,
          });
        }
      } catch (err) {
        // Skip invalid boxes
        console.error('Error parsing box:', err);
      }
    }

    return NextResponse.json({
      address,
      credentials,
      count: credentials.length,
    });
  } catch (error: any) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}
