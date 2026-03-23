'use client';
import { useState, useEffect } from 'react';
import { Share2, UserPlus, Clock, Trash2, AlertCircle, CheckCircle, Loader2, Users } from 'lucide-react';
import { useWallet } from '@/components/WalletProvider';
import { algodClient, APP_ID } from '@/lib/algorand';
import algosdk from 'algosdk';

interface Credential {
  id: string;
  type: string;
  access: string;
}

interface AccessGrant {
  grantee: string;
  expiry: number;
  credentialId: string;
}

export default function ShareCredentialsClient() {
  const { accountAddress, connect, peraWallet } = useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCred, setSelectedCred] = useState('');
  const [granteeAddress, setGranteeAddress] = useState('');
  const [expiryDays, setExpiryDays] = useState('30');
  const [noExpiry, setNoExpiry] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [grants, setGrants] = useState<AccessGrant[]>([]);

  useEffect(() => {
    if (accountAddress) {
      loadPrivateCredentials();
      loadGrants();
    }
  }, [accountAddress]);

  const loadPrivateCredentials = async () => {
    if (!accountAddress) return;

    try {
      setLoading(true);
      const boxes = await algodClient.getApplicationBoxes(APP_ID).do();
      const privateCredentials: Credential[] = [];

      for (const box of boxes.boxes) {
        try {
          const boxNameBytes = box.name;
          
          // Skip non-credential boxes (grants, etc.)
          const prefix = Buffer.from(boxNameBytes.slice(0, 5)).toString('utf-8');
          if (prefix !== 'cred_') continue;
          
          const credIdWithPrefix = boxNameBytes.slice(5);
          const length = (credIdWithPrefix[0] << 8) | credIdWithPrefix[1];
          const credIdBytes = credIdWithPrefix.slice(2, 2 + length);
          const credId = Buffer.from(credIdBytes).toString('utf-8');
          
          const boxValue = await algodClient.getApplicationBoxByName(APP_ID, boxNameBytes).do();
          const valueBytes = new Uint8Array(boxValue.value);
          
          let offset = 0;
          
          const hashLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
          offset += 2 + hashLen + 1;
          
          const ownerBytes = Buffer.from(valueBytes.slice(offset, offset + 32));
          const ownerAddress = algosdk.encodeAddress(ownerBytes);
          offset += 32 + 1;
          
          const cidLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
          offset += 2 + cidLen + 1;
          
          const typeLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
          offset += 2;
          const type = Buffer.from(valueBytes.slice(offset, offset + typeLen)).toString('utf-8');
          offset += typeLen + 1;
          
          offset += 8 + 1;
          
          let statusEnd = offset;
          while (statusEnd < valueBytes.length && valueBytes[statusEnd] !== 0x7c) {
            statusEnd++;
          }
          offset = statusEnd + 1;
          
          const accessLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
          offset += 2;
          const access = Buffer.from(valueBytes.slice(offset, offset + accessLen)).toString('utf-8');
          
          if (ownerAddress === accountAddress && access === 'private') {
            privateCredentials.push({
              id: credId,
              type: type || 'unknown',
              access,
            });
          }
        } catch (err) {
          console.error('Error parsing box:', err);
        }
      }

      setCredentials(privateCredentials);
    } catch (err: any) {
      console.error('Error loading credentials:', err);
      setStatus('Error loading credentials: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGrants = async () => {
    if (!accountAddress) return;

    try {
      const boxes = await algodClient.getApplicationBoxes(APP_ID).do();
      const userGrants: AccessGrant[] = [];

      for (const box of boxes.boxes) {
        try {
          const boxNameBytes = box.name;
          
          // Check if this is a grant box (starts with "g_")
          const prefix = Buffer.from(boxNameBytes.slice(0, 2)).toString('utf-8');
          if (prefix !== 'g_') continue;
          
          // Grant box format: g_ (2) + hash(16) + _ (1) + grantee_address(32) = 51 bytes
          if (boxNameBytes.length !== 51) continue;
          
          // Extract grantee address (last 32 bytes)
          const granteeBytes = boxNameBytes.slice(19); // Skip g_ (2) + hash (16) + _ (1)
          const granteeAddress = algosdk.encodeAddress(new Uint8Array(granteeBytes));
          
          // Get the grant value (expiry timestamp)
          const boxValue = await algodClient.getApplicationBoxByName(APP_ID, boxNameBytes).do();
          const expiryTimestamp = new Uint8Array(boxValue.value);
          let expiry = 0;
          for (let i = 0; i < 8; i++) {
            expiry = (expiry * 256) + expiryTimestamp[i];
          }
          
          // Now we need to find which credential this grant belongs to
          // We'll need to check all credentials to find the matching hash
          const credBoxes = await algodClient.getApplicationBoxes(APP_ID).do();
          let credentialId = 'Unknown';
          
          for (const credBox of credBoxes.boxes) {
            const credBoxNameBytes = credBox.name;
            const credPrefix = Buffer.from(credBoxNameBytes.slice(0, 5)).toString('utf-8');
            if (credPrefix !== 'cred_') continue;
            
            try {
              // Get credential ID
              const credIdWithPrefix = credBoxNameBytes.slice(5);
              const length = (credIdWithPrefix[0] << 8) | credIdWithPrefix[1];
              const credIdBytes = credIdWithPrefix.slice(2, 2 + length);
              const credId = Buffer.from(credIdBytes).toString('utf-8');
              
              // Check if this credential's hash matches the grant's hash
              const encoder = new TextEncoder();
              const credIdBytesForHash = encoder.encode(credId);
              const arc4CredId = new Uint8Array(2 + credIdBytesForHash.length);
              arc4CredId[0] = (credIdBytesForHash.length >> 8) & 0xff;
              arc4CredId[1] = credIdBytesForHash.length & 0xff;
              arc4CredId.set(credIdBytesForHash, 2);
              
              const credIdHash = await crypto.subtle.digest('SHA-256', arc4CredId);
              const credIdHashBytes = new Uint8Array(credIdHash).slice(0, 16);
              
              // Compare with grant box hash (bytes 2-18)
              const grantHash = boxNameBytes.slice(2, 18);
              if (Buffer.from(credIdHashBytes).equals(Buffer.from(grantHash))) {
                // Check if this credential is owned by current user
                const credBoxValue = await algodClient.getApplicationBoxByName(APP_ID, credBoxNameBytes).do();
                const credValueBytes = new Uint8Array(credBoxValue.value);
                
                const hashLen = (credValueBytes[0] << 8) | credValueBytes[1];
                const ownerStart = hashLen + 2 + 1;
                const ownerBytes = credValueBytes.slice(ownerStart, ownerStart + 32);
                const ownerAddress = algosdk.encodeAddress(ownerBytes);
                
                if (ownerAddress === accountAddress) {
                  credentialId = credId;
                  break;
                }
              }
            } catch (err) {
              // Skip this credential
            }
          }
          
          if (credentialId !== 'Unknown') {
            userGrants.push({
              grantee: granteeAddress,
              expiry,
              credentialId,
            });
          }
        } catch (err) {
          console.error('Error parsing grant box:', err);
        }
      }

      setGrants(userGrants);
    } catch (err: any) {
      console.error('Error loading grants:', err);
    }
  };

  const handleRevokeAccess = async (credentialId: string, granteeAddress: string) => {
    if (!accountAddress || !peraWallet) return;

    try {
      setLoading(true);
      setStatus('Revoking access...');

      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Create ABI method for revoke_access
      const abiMethod = new algosdk.ABIMethod({
        name: 'revoke_access',
        args: [
          { type: 'string', name: 'cred_id' },
          { type: 'address', name: 'grantee' }
        ],
        returns: { type: 'void' }
      });
      
      // Encode credential ID as ARC4 string
      const encoder = new TextEncoder();
      const credIdBytes = encoder.encode(credentialId);
      const arc4CredId = new Uint8Array(2 + credIdBytes.length);
      arc4CredId[0] = (credIdBytes.length >> 8) & 0xff;
      arc4CredId[1] = credIdBytes.length & 0xff;
      arc4CredId.set(credIdBytes, 2);
      
      // Hash for grant box name
      const credIdHash = await crypto.subtle.digest('SHA-256', arc4CredId);
      const credIdHashBytes = new Uint8Array(credIdHash).slice(0, 16);

      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: accountAddress,
        appIndex: APP_ID,
        appArgs: [
          abiMethod.getSelector(),
          arc4CredId,
          algosdk.decodeAddress(granteeAddress).publicKey,
        ],
        boxes: [
          {
            appIndex: APP_ID,
            name: new Uint8Array([
              ...Buffer.from('cred_'),
              ...arc4CredId,
            ]),
          },
          {
            appIndex: APP_ID,
            name: new Uint8Array([
              ...Buffer.from('g_'),
              ...credIdHashBytes,
              ...Buffer.from('_'),
              ...algosdk.decodeAddress(granteeAddress).publicKey,
            ]),
          },
        ],
        suggestedParams,
      });

      const signedTxns = await peraWallet.signTransaction([[{ txn: appCallTxn, signers: [accountAddress] }]]);
      const response = await algodClient.sendRawTransaction(signedTxns).do();
      await algosdk.waitForConfirmation(algodClient, response.txid, 4);

      setStatus('Access revoked successfully!');
      loadGrants(); // Reload grants
    } catch (error: any) {
      setStatus('Error: ' + (error.message || 'Failed to revoke access'));
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountAddress || !peraWallet) {
      setStatus('Please connect your wallet');
      return;
    }

    try {
      // Validate grantee address
      algosdk.decodeAddress(granteeAddress);
    } catch {
      setStatus('Invalid Algorand address');
      return;
    }

    try {
      setLoading(true);
      setStatus('Creating access grant...');

      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Calculate expiry timestamp
      let expiryTimestamp = 0;
      if (!noExpiry) {
        const days = parseInt(expiryDays);
        expiryTimestamp = Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60);
      }

      // Create grant_access transaction using proper ABI encoding
      const encoder = new TextEncoder();
      
      // Use algosdk's ABI method selector
      const abiMethod = new algosdk.ABIMethod({
        name: 'grant_access',
        args: [
          { type: 'string', name: 'cred_id' },
          { type: 'address', name: 'grantee' },
          { type: 'uint64', name: 'expiry_timestamp' }
        ],
        returns: { type: 'void' }
      });
      
      const credIdBytes = encoder.encode(selectedCred);
      const arc4CredId = new Uint8Array(2 + credIdBytes.length);
      arc4CredId[0] = (credIdBytes.length >> 8) & 0xff;
      arc4CredId[1] = credIdBytes.length & 0xff;
      arc4CredId.set(credIdBytes, 2);
      
      // Hash the ARC4-encoded credential ID for the grant box name
      const credIdHash = await crypto.subtle.digest('SHA-256', arc4CredId);
      const credIdHashBytes = new Uint8Array(credIdHash).slice(0, 16);

      // Create grant_access transaction
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        sender: accountAddress,
        appIndex: APP_ID,
        appArgs: [
          abiMethod.getSelector(),
          arc4CredId,
          algosdk.decodeAddress(granteeAddress).publicKey,
          algosdk.encodeUint64(expiryTimestamp),
        ],
        boxes: [
          {
            appIndex: APP_ID,
            name: new Uint8Array([
              ...Buffer.from('cred_'),
              ...arc4CredId,
            ]),
          },
          {
            appIndex: APP_ID,
            name: new Uint8Array([
              ...Buffer.from('g_'),
              ...credIdHashBytes,
              ...Buffer.from('_'),
              ...algosdk.decodeAddress(granteeAddress).publicKey,
            ]),
          },
        ],
        suggestedParams,
      });

      // Add box MBR payment
      // Grant box: g_ (2) + hash (16) + _ (1) + address (32) = 51 bytes
      // MBR = 2500 (base) + 400 * (box_name_size + box_value_size)
      const boxNameSize = 51; // g_ + hash + _ + address
      const boxValueSize = 8; // 8 bytes for timestamp
      const mbrPayment = 2500 + (400 * (boxNameSize + boxValueSize));
      
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: accountAddress,
        receiver: algosdk.getApplicationAddress(APP_ID),
        amount: mbrPayment,
        suggestedParams,
      });

      // Group transactions
      const txns = [paymentTxn, appCallTxn];
      algosdk.assignGroupID(txns);

      const signedTxns = await peraWallet.signTransaction([
        txns.map(txn => ({ txn, signers: [accountAddress] })),
      ]);

      const response = await algodClient.sendRawTransaction(signedTxns).do();
      await algosdk.waitForConfirmation(algodClient, response.txid, 4);

      setStatus(`Access granted successfully! ${noExpiry ? 'No expiry.' : `Expires in ${expiryDays} days.`}`);
      setGranteeAddress('');
      setSelectedCred('');
      loadGrants();
    } catch (error: any) {
      setStatus('Error: ' + (error.message || 'Failed to grant access'));
    } finally {
      setLoading(false);
    }
  };

  if (!accountAddress) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-6">
              Please connect your Pera Wallet to share credentials.
            </p>
            <button
              onClick={async () => {
                await connect();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
            >
              Connect Pera Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Share Private Credentials</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Grant temporary access to your private credentials with selective people
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Grant Access Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleGrantAccess} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <UserPlus className="w-6 h-6 mr-2 text-purple-600" />
                Grant Access
              </h2>

              <div className="space-y-6">
                {/* Select Credential */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Select Private Credential
                  </label>
                  <select
                    value={selectedCred}
                    onChange={(e) => setSelectedCred(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    required
                    disabled={credentials.length === 0}
                  >
                    <option value="">Choose a credential...</option>
                    {credentials.map((cred) => (
                      <option key={cred.id} value={cred.id}>
                        {cred.id} ({cred.type})
                      </option>
                    ))}
                  </select>
                  {credentials.length === 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        No private credentials found. 
                        <a href="/add" className="font-semibold underline ml-1">
                          Add a private credential first
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {/* Grantee Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Recipient's Algorand Address
                  </label>
                  <input
                    type="text"
                    value={granteeAddress}
                    onChange={(e) => setGranteeAddress(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-sm"
                    placeholder="AAAA...ZZZZ"
                    required
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Enter the Algorand address of the person you want to share with
                  </p>
                </div>

                {/* Expiry */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Access Duration
                  </label>
                  <div className="flex items-center space-x-4 mb-3">
                    <input
                      type="checkbox"
                      checked={noExpiry}
                      onChange={(e) => setNoExpiry(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <label className="text-sm text-gray-700">No expiry (permanent access)</label>
                  </div>
                  {!noExpiry && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        min="1"
                        max="365"
                        className="w-24 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      />
                      <span className="text-gray-700">days</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || credentials.length === 0}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Granting Access...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Grant Access
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Status Message */}
            {status && (
              <div className={`mt-6 p-4 rounded-xl border-2 ${
                status.includes('Error') 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {status.includes('Error') ? (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    status.includes('Error') ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {status}
                  </p>
                </div>
              </div>
            )}

            {/* Active Grants */}
            <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="w-6 h-6 mr-2 text-purple-600" />
                Active Access Grants
              </h2>
              {grants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No active grants yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Grant access to share your private credentials
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {grants.map((grant, index) => (
                    <div key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            {grant.credentialId}
                          </p>
                          <p className="text-xs text-gray-600 font-mono mb-2">
                            {grant.grantee.substring(0, 20)}...
                          </p>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {grant.expiry === 0 
                              ? 'No expiry' 
                              : `Expires: ${new Date(grant.expiry * 1000).toLocaleDateString()}`
                            }
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeAccess(grant.credentialId, grant.grantee)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Revoke access"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">How It Works</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <span className="text-purple-700 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Select Credential</p>
                    <p className="text-xs text-gray-600">Choose which private credential to share</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <span className="text-purple-700 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Add Recipient</p>
                    <p className="text-xs text-gray-600">Enter their Algorand address</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <span className="text-purple-700 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Set Duration</p>
                    <p className="text-xs text-gray-600">Choose how long they can access it</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <span className="text-purple-700 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Grant Access</p>
                    <p className="text-xs text-gray-600">They can now view the credential</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-6">
              <h3 className="font-bold text-purple-900 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Time-Limited Access
              </h3>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>✓ Set expiry from 1 to 365 days</li>
                <li>✓ Or grant permanent access</li>
                <li>✓ Revoke access anytime</li>
                <li>✓ Automatic expiry enforcement</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 mb-2">Security</h3>
              <p className="text-sm text-blue-800">
                Access grants are stored on the blockchain. Only you can grant or revoke access. 
                Recipients still need to decrypt the file with the shared key.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
