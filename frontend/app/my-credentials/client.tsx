'use client';
import { useState, useEffect } from 'react';
import { FileText, Calendar, Lock, Globe, AlertCircle, ExternalLink, Trash2, Loader2, Users } from 'lucide-react';
import { useWallet } from '@/components/WalletProvider';
import { algodClient, APP_ID } from '@/lib/algorand';
import algosdk from 'algosdk';

interface Credential {
  id: string;
  type: string;
  access: string;
  timestamp: string;
  status: string;
}

export default function MyCredentialsClient() {
  const { accountAddress, connect } = useWallet();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (accountAddress) {
      loadCredentials();
    }
  }, [accountAddress]);

  const loadCredentials = async () => {
    if (!accountAddress) return;

    try {
      setLoading(true);
      setError('');

      const boxes = await algodClient.getApplicationBoxes(APP_ID).do();
      const ownedCredentials: Credential[] = [];
      const grantedCredentials: Credential[] = [];

      // Load credentials
      for (const box of boxes.boxes) {
        try {
          const boxNameBytes = box.name;
          
          // Skip non-credential boxes (grants start with "g_", credentials with "cred_")
          const prefix = Buffer.from(boxNameBytes.slice(0, 5)).toString('utf-8');
          if (prefix !== 'cred_') {
            continue; // Skip grant boxes
          }
          
          // Skip "cred_" prefix (5 bytes)
          const credIdWithPrefix = boxNameBytes.slice(5);
          
          // Read ARC4 length (2 bytes, big-endian)
          const length = (credIdWithPrefix[0] << 8) | credIdWithPrefix[1];
          
          // Extract the actual credential ID
          const credIdBytes = credIdWithPrefix.slice(2, 2 + length);
          const credId = Buffer.from(credIdBytes).toString('utf-8');
          
          // Get box value
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
          const status = Buffer.from(valueBytes.slice(offset, statusEnd)).toString('utf-8');
          offset = statusEnd + 1;
          
          const accessLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
          offset += 2;
          const access = Buffer.from(valueBytes.slice(offset, offset + accessLen)).toString('utf-8');
          
          const isRevoked = valueBytes.length >= 8 && 
            Buffer.from(valueBytes.slice(-8)).toString('utf-8') === '|revoked';
          
          const timestampNum = 0; // We skipped reading it above, would need to parse properly
          const timestamp = new Date().toISOString().split('T')[0];
          
          // Add owned credentials
          if (ownerAddress === accountAddress) {
            ownedCredentials.push({
              id: credId,
              type: type || 'unknown',
              access: access || 'public',
              timestamp,
              status: isRevoked ? 'revoked' : (status || 'active'),
            });
          }
          // Check if user has been granted access to this private credential
          else if (access === 'private') {
            // Check for grant
            const encoder = new TextEncoder();
            const credIdBytesForHash = encoder.encode(credId);
            const arc4CredId = new Uint8Array(2 + credIdBytesForHash.length);
            arc4CredId[0] = (credIdBytesForHash.length >> 8) & 0xff;
            arc4CredId[1] = credIdBytesForHash.length & 0xff;
            arc4CredId.set(credIdBytesForHash, 2);
            
            const credIdHash = await crypto.subtle.digest('SHA-256', arc4CredId);
            const credIdHashBytes = new Uint8Array(credIdHash).slice(0, 16);
            
            const grantBoxName = new Uint8Array([
              ...Buffer.from('g_'),
              ...credIdHashBytes,
              ...Buffer.from('_'),
              ...algosdk.decodeAddress(accountAddress).publicKey,
            ]);
            
            try {
              const grantBox = await algodClient.getApplicationBoxByName(APP_ID, grantBoxName).do();
              const grantValue = new Uint8Array(grantBox.value);
              
              // Check expiry
              let expiry = 0;
              for (let i = 0; i < 8; i++) {
                expiry = (expiry * 256) + grantValue[i];
              }
              
              const now = Math.floor(Date.now() / 1000);
              const isGrantValid = expiry === 0 || expiry > now;
              
              if (isGrantValid) {
                grantedCredentials.push({
                  id: credId,
                  type: type || 'unknown',
                  access: 'granted',
                  timestamp,
                  status: isRevoked ? 'revoked' : (status || 'active'),
                });
              }
            } catch (err) {
              // No grant found, skip
            }
          }
        } catch (err) {
          console.error('Error loading box:', err);
        }
      }

      // Combine owned and granted credentials
      setCredentials([...ownedCredentials, ...grantedCredentials]);
    } catch (err: any) {
      console.error('Error loading credentials:', err);
      setError(err.message || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    return <FileText className="w-5 h-5" />;
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      degree: 'Degree',
      certificate: 'Certificate',
      id_card: 'ID Card',
      license: 'License',
      passport: 'Passport',
      other: 'Other',
    };
    return labels[type] || type;
  };

  if (!accountAddress) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallet Not Connected</h2>
            <p className="text-gray-600 mb-6">
              Please connect your Pera Wallet to view your credentials.
            </p>
            <button
              onClick={async () => {
                await connect();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Connect Pera Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">My Credentials</h1>
            <p className="text-lg text-gray-600">
              Manage all your blockchain-verified credentials in one place
            </p>
          </div>
          <button
            onClick={loadCredentials}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading && credentials.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading your credentials...</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Credentials Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't added any credentials to the blockchain yet.
            </p>
            <a
              href="/add"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              Add Your First Credential
            </a>
          </div>
        ) : (
          <>
            {/* Owned Credentials Section */}
            {credentials.filter((c) => c.access !== 'granted').length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Credentials</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {credentials
                    .filter((c) => c.access !== 'granted')
                    .map((credential) => (
                      <div
                        key={credential.id}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              {getTypeIcon(credential.type)}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                credential.access === 'public'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {credential.access === 'public' ? (
                                <Globe className="w-3 h-3 inline mr-1" />
                              ) : (
                                <Lock className="w-3 h-3 inline mr-1" />
                              )}
                              {credential.access}
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 mb-2 break-all">
                            {credential.id}
                          </h3>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="w-4 h-4 mr-2" />
                              {getTypeLabel(credential.type)}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              {credential.timestamp}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                              credential.status === 'revoked' 
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {credential.status}
                            </span>
                            <div className="flex space-x-2">
                              <a
                                href={`https://testnet.explorer.perawallet.app/application/${APP_ID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View on Explorer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              {credential.status !== 'revoked' && (
                                <button
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Revoke"
                                  onClick={() => alert('Revoke functionality coming soon!')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Granted Credentials Section */}
            {credentials.filter((c) => c.access === 'granted').length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Granted to Me</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <Users className="w-4 h-4 inline mr-2" />
                    These credentials have been shared with you by their owners. You have read-only access.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {credentials
                    .filter((c) => c.access === 'granted')
                    .map((credential) => (
                      <div
                        key={credential.id}
                        className="bg-white rounded-2xl shadow-sm border border-blue-200 hover:shadow-md transition-all overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              {getTypeIcon(credential.type)}
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              <Users className="w-3 h-3 inline mr-1" />
                              granted
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-gray-900 mb-2 break-all">
                            {credential.id}
                          </h3>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="w-4 h-4 mr-2" />
                              {getTypeLabel(credential.type)}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2" />
                              {credential.timestamp}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                              credential.status === 'revoked' 
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {credential.status}
                            </span>
                            <div className="flex space-x-2">
                              <a
                                href={`https://testnet.explorer.perawallet.app/application/${APP_ID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View on Explorer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}

        {credentials.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Credentials</p>
                  <p className="text-3xl font-bold text-gray-900">{credentials.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Public</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {credentials.filter((c) => c.access === 'public').length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Private</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {credentials.filter((c) => c.access === 'private').length}
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <Lock className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Granted</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {credentials.filter((c) => c.access === 'granted').length}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
