import algosdk from 'algosdk';
import { algodClient, APP_ID } from './algorand';

// ARC4 String encoding helper
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

// Helper to parse credential data from box storage
export function parseCredentialData(valueBytes: Uint8Array) {
  let offset = 0;
  
  // Read hash (ARC4 String)
  const hashLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
  offset += 2;
  const hash = Buffer.from(valueBytes.slice(offset, offset + hashLen)).toString('utf-8');
  offset += hashLen;
  
  // Skip separator |
  offset += 1;
  
  // Read owner (32 bytes raw address)
  const ownerBytes = valueBytes.slice(offset, offset + 32);
  const owner = algosdk.encodeAddress(Buffer.from(ownerBytes));
  offset += 32;
  
  // Skip separator |
  offset += 1;
  
  // Read CID (ARC4 String)
  const cidLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
  offset += 2;
  const cid = Buffer.from(valueBytes.slice(offset, offset + cidLen)).toString('utf-8');
  offset += cidLen;
  
  // Skip separator |
  offset += 1;
  
  // Read type (ARC4 String)
  const typeLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
  offset += 2;
  const type = Buffer.from(valueBytes.slice(offset, offset + typeLen)).toString('utf-8');
  offset += typeLen;
  
  // Skip separator |
  offset += 1;
  
  // Read timestamp (8 bytes big-endian integer)
  let timestamp = 0;
  for (let i = 0; i < 8; i++) {
    timestamp = (timestamp * 256) + valueBytes[offset + i];
  }
  offset += 8;
  
  // Skip separator |
  offset += 1;
  
  // Read status (until next |)
  let statusEnd = offset;
  while (statusEnd < valueBytes.length && valueBytes[statusEnd] !== 0x7c) { // 0x7c is '|'
    statusEnd++;
  }
  const status = Buffer.from(valueBytes.slice(offset, statusEnd)).toString('utf-8');
  offset = statusEnd + 1;
  
  // Read access (ARC4 String)
  const accessLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
  offset += 2;
  const access = Buffer.from(valueBytes.slice(offset, offset + accessLen)).toString('utf-8');
  
  return {
    hash,
    owner,
    cid,
    type,
    timestamp,
    status,
    access,
  };
}

export async function addCredential(
  sender: string,
  credId: string,
  hashValue: string,
  cid: string,
  credType: string,
  access: string,
  signTransactions: (txGroups: any[][]) => Promise<Uint8Array[]>
) {
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  // Create ABI method
  const addCredentialMethod = new algosdk.ABIMethod({
    name: 'add_credential',
    args: [
      { name: 'cred_id', type: 'string' },
      { name: 'hash_value', type: 'string' },
      { name: 'cid', type: 'string' },
      { name: 'cred_type', type: 'string' },
      { name: 'access', type: 'string' },
    ],
    returns: { type: 'void' },
  });

  // Use shortened credential ID for box storage (to fit in 64 byte limit)
  const { getBoxCredentialId } = await import('./utils');
  const boxCredId = getBoxCredentialId(credId);

  const appArgs = [
    addCredentialMethod.getSelector(),
    encodeARC4String(boxCredId),
    encodeARC4String(hashValue),
    encodeARC4String(cid),
    encodeARC4String(credType),
    encodeARC4String(access),
  ];

  // Box key must match what the contract computes: b"cred_" + arc4_encoded_cred_id
  const credIdEncoded = encodeARC4String(boxCredId);
  const boxKeyPrefix = new Uint8Array(Buffer.from('cred_'));
  const boxKey = new Uint8Array(boxKeyPrefix.length + credIdEncoded.length);
  boxKey.set(boxKeyPrefix, 0);
  boxKey.set(credIdEncoded, boxKeyPrefix.length);

  // Calculate box storage cost with optimized calculation
  // Box MBR = 2500 + 400 * (key_size + value_size)
  // Use shortened credential ID (32 chars) to reduce box key size
  
  const hashSize = 2 + hashValue.length;
  const cidSize = 2 + cid.length;
  const typeSize = 2 + credType.length;
  const accessSize = 2 + access.length;
  const valueSize = hashSize + 1 + 32 + 1 + cidSize + 1 + typeSize + 1 + 8 + 1 + 6 + 1 + accessSize;
  
  const boxMBR = 2500 + 400 * (boxKey.length + valueSize);
  
  // Check current app balance to determine payment amount needed
  const appAddress = algosdk.getApplicationAddress(APP_ID);
  let estimatedPayment = boxMBR; // Default estimate
  
  try {
    const appAccountInfo = await algodClient.accountInformation(appAddress).do();
    const appBalance = Number(appAccountInfo.amount);
    const appMinBalance = Number(appAccountInfo.minBalance);
    const newAppMinBalance = appMinBalance + boxMBR;
    
    if (appBalance < newAppMinBalance) {
      estimatedPayment = newAppMinBalance - appBalance;
    }
  } catch (error: any) {
    // Use default estimate if we can't check
    estimatedPayment = boxMBR;
  }
  
  // Check sender's available balance
  const senderInfo = await algodClient.accountInformation(sender).do();
  const senderBalance = Number(senderInfo.amount);
  const senderMinBalance = Number(senderInfo.minBalance);
  const senderAvailable = senderBalance - senderMinBalance;
  
  // Minimum required: estimated payment to app + transaction fees (2 txns in group)
  const minRequired = estimatedPayment + 3000; // 3000 microALGO for fees (1000 for payment + 2000 for app call)
  
  if (senderAvailable < minRequired) {
    throw new Error(
      `Insufficient balance. You need ${(minRequired / 1000000).toFixed(4)} ALGO available to add this credential.\n\n` +
      `Your balance:\n` +
      `- Total: ${(senderBalance / 1000000).toFixed(4)} ALGO\n` +
      `- Locked (min balance): ${(senderMinBalance / 1000000).toFixed(4)} ALGO\n` +
      `- Available: ${(senderAvailable / 1000000).toFixed(4)} ALGO\n\n` +
      `Required: ${(estimatedPayment / 1000000).toFixed(4)} ALGO for storage + 0.003 ALGO for fees\n\n` +
      `Get more testnet ALGO from: https://bank.testnet.algorand.network/`
    );
  }
  
  // Now calculate the actual payment amount (reuse the check from above)
  let paymentAmount = estimatedPayment;
  
  const txns = [];
  
  // Add payment transaction to cover box storage
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender: sender,
    receiver: appAddress,
    amount: paymentAmount,
    suggestedParams,
  });
  txns.push(paymentTxn);
  
  // Create app call transaction
  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    sender,
    appIndex: APP_ID,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs,
    boxes: [{ appIndex: APP_ID, name: boxKey }],
    suggestedParams: {
      ...suggestedParams,
      fee: 2000,
      flatFee: true,
    },
  });

  txns.push(appCallTxn);

  // Group transactions if there's more than one
  if (txns.length > 1) {
    algosdk.assignGroupID(txns);
  }

  // Sign transactions
  const signedTxns = await signTransactions([
    txns.map((txn, index) => ({ txn, signers: [sender] }))
  ]);
  
  const response = await algodClient.sendRawTransaction(signedTxns).do();
  await algosdk.waitForConfirmation(algodClient, response.txid, 4);
  
  return response.txid;
}

export async function getCredential(credId: string) {
  try {
    // Use shortened credential ID for box lookup
    const { getBoxCredentialId } = await import('./utils');
    const boxCredId = getBoxCredentialId(credId);
    
    const credIdEncoded = encodeARC4String(boxCredId);
    const boxKeyPrefix = new Uint8Array(Buffer.from('cred_'));
    const boxKey = new Uint8Array(boxKeyPrefix.length + credIdEncoded.length);
    boxKey.set(boxKeyPrefix, 0);
    boxKey.set(credIdEncoded, boxKeyPrefix.length);
    
    const boxValue = await algodClient.getApplicationBoxByName(APP_ID, boxKey).do();
    const valueBytes = new Uint8Array(boxValue.value);
    
    return parseCredentialData(valueBytes);
  } catch (error) {
    console.error('Error getting credential:', error);
    throw error;
  }
}

export async function verifyCredential(credId: string, hashValue: string) {
  try {
    // Use shortened credential ID for box lookup
    const { getBoxCredentialId } = await import('./utils');
    const boxCredId = getBoxCredentialId(credId);
    
    const credIdEncoded = encodeARC4String(boxCredId);
    const boxKeyPrefix = new Uint8Array(Buffer.from('cred_'));
    const boxKey = new Uint8Array(boxKeyPrefix.length + credIdEncoded.length);
    boxKey.set(boxKeyPrefix, 0);
    boxKey.set(credIdEncoded, boxKeyPrefix.length);
    
    const boxValue = await algodClient.getApplicationBoxByName(APP_ID, boxKey).do();
    const valueBytes = new Uint8Array(boxValue.value);
    
    // Parse hash (ARC4 String) - first 2 bytes are length
    const hashLen = (valueBytes[0] << 8) | valueBytes[1];
    const storedHash = Buffer.from(valueBytes.slice(2, 2 + hashLen)).toString('utf-8');
    
    return storedHash === hashValue;
  } catch (error) {
    console.error('Error verifying credential:', error);
    return false;
  }
}

export async function revokeCredential(
  sender: string,
  credId: string,
  signTransactions: (txGroups: any[][]) => Promise<Uint8Array[]>
) {
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  // Use shortened credential ID for box lookup
  const { getBoxCredentialId } = await import('./utils');
  const boxCredId = getBoxCredentialId(credId);
  
  const revokeMethod = new algosdk.ABIMethod({
    name: 'revoke_credential',
    args: [{ name: 'cred_id', type: 'string' }],
    returns: { type: 'void' },
  });

  const appArgs = [
    revokeMethod.getSelector(),
    encodeARC4String(boxCredId),
  ];

  const credIdEncoded = encodeARC4String(boxCredId);
  const boxKeyPrefix = new Uint8Array(Buffer.from('cred_'));
  const boxKey = new Uint8Array(boxKeyPrefix.length + credIdEncoded.length);
  boxKey.set(boxKeyPrefix, 0);
  boxKey.set(credIdEncoded, boxKeyPrefix.length);
  
  const txn = algosdk.makeApplicationCallTxnFromObject({
    sender,
    appIndex: APP_ID,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    appArgs,
    boxes: [{ appIndex: APP_ID, name: boxKey }],
    suggestedParams: {
      ...suggestedParams,
      fee: 1000,
      flatFee: true,
    },
  });

  const signedTxns = await signTransactions([[{ txn, signers: [sender] }]]);
  const response = await algodClient.sendRawTransaction(signedTxns).do();
  await algosdk.waitForConfirmation(algodClient, response.txid, 4);
  
  return response.txid;
}