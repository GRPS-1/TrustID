'use client';
import { useState } from 'react';
import { Search, User, Shield, CheckCircle, XCircle, Copy, Download, Loader2, ExternalLink, FileText } from 'lucide-react';
import { generateDID, parseDID, isValidDID, shortenDID, createDIDDocument, exportDIDDocument, DIDDocument } from '@/lib/did';
import { algodClient, APP_ID } from '@/lib/algorand';
import algosdk from 'algosdk';

export default function DIDResolverClient() {
  const [didInput, setDidInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [didDocument, setDidDocument] = useState<DIDDocument | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [credentials, setCredentials] = useState<any[]>([]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!didInput) {
      setError('Please enter a DID');
      return;
    }

    if (!isValidDID(didInput)) {
      setError('Invalid DID format. Expected: did:algo:testnet:{address}');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setDidDocument(null);
      setCredentials([]);

      // Resolve DID using the API endpoint
      const response = await fetch(`/api/identifiers/${encodeURIComponent(didInput)}`, {
        headers: {
          'Accept': 'application/did+ld+json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to resolve DID');
        return;
      }

      const document = await response.json();
      setDidDocument(document);

      const parsed = parseDID(didInput);
      if (!parsed) {
        return;
      }

      // Fetch public credentials for this DID
      try {
        const boxes = await algodClient.getApplicationBoxes(APP_ID).do();
        const userCredentials: any[] = [];

        for (const box of boxes.boxes) {
          try {
            const boxNameBytes = box.name;
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
            offset += 2;
            const cid = Buffer.from(valueBytes.slice(offset, offset + cidLen)).toString('utf-8');
            offset += cidLen + 1;
            
            const typeLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
            offset += 2;
            const type = Buffer.from(valueBytes.slice(offset, offset + typeLen)).toString('utf-8');
            offset += typeLen + 1;
            
            let timestampNum = 0;
            for (let i = 0; i < 8; i++) {
              timestampNum = (timestampNum * 256) + valueBytes[offset + i];
            }
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
            
            if (ownerAddress === parsed.address && access === 'public') {
              const timestamp = timestampNum > 0
                ? new Date(timestampNum * 1000).toISOString()
                : new Date().toISOString();
              
              userCredentials.push({
                id: credId,
                type: type || 'unknown',
                access,
                timestamp,
                status: isRevoked ? 'revoked' : status,
                cid,
              });
            }
          } catch (err) {
            // Skip invalid boxes
          }
        }

        setCredentials(userCredentials);
      } catch (err) {
        // Credentials fetch failed, but DID is still valid
      }

    } catch (err: any) {
      setError(err.message || 'Failed to resolve DID');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDID = () => {
    if (didDocument) {
      navigator.clipboard.writeText(didDocument.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadDocument = () => {
    if (didDocument) {
      const json = exportDIDDocument(didDocument);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${didDocument.id.replace(/:/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExampleDID = () => {
    setDidInput('did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">DID Resolver</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Resolve Decentralized Identifiers to discover verified identities and credentials
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-8">
          <form onSubmit={handleResolve} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Enter Decentralized Identifier (DID)
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={didInput}
                  onChange={(e) => setDidInput(e.target.value)}
                  className="w-full px-4 py-4 pl-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-sm font-mono"
                  placeholder="did:algo:testnet:..."
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  'Resolve'
                )}
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Format: <code className="bg-gray-100 px-2 py-1 rounded">did:algo:testnet:{'<address>'}</code>
              </p>
              <button
                type="button"
                onClick={handleExampleDID}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
              >
                Try example DID
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
        </div>

        {didDocument && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-1">
                      {didDocument.profile?.name || 'TrustID User'}
                    </h2>
                    <p className="text-sm text-gray-600 font-mono bg-gray-100 px-3 py-1 rounded-lg inline-block">
                      {shortenDID(didDocument.id)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCopyDID}
                    className="p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors shadow-sm hover:shadow-md"
                    title="Copy DID"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={handleDownloadDocument}
                    className="p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors shadow-sm hover:shadow-md"
                    title="Download DID Document"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-semibold text-green-600">Active & Verified</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Network</p>
                  <p className="text-sm font-medium text-gray-900">Algorand Testnet</p>
                </div>
              </div>
            </div>

            {credentials.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-2 text-purple-600" />
                  Public Credentials ({credentials.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {credentials.map((cred, index) => (
                    <div key={index} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 border border-purple-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-semibold text-gray-900">{cred.type}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          cred.status === 'active' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {cred.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {new Date(cred.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 font-mono break-all">
                        {cred.id.substring(0, 32)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Verification Methods</h3>
              <div className="space-y-4">
                {didDocument.verificationMethod.map((method, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-semibold text-gray-900">{method.type}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-mono bg-white px-2 py-1 rounded">{method.id.split('#')[1]}</span>
                    </div>
                    <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded">
                      {method.publicKeyMultibase || method.publicKeyBase58}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {didDocument.service && didDocument.service.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Service Endpoints</h3>
                <div className="space-y-4">
                  {didDocument.service.map((service, index) => (
                    <div key={index} className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900">{service.type}</span>
                        <a
                          href={service.serviceEndpoint}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-xs text-gray-600 break-all">{service.serviceEndpoint}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!didDocument && !loading && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What are DIDs?</h3>
              <div className="space-y-4 text-gray-600">
                <p className="text-lg">
                  <strong className="text-gray-900">Decentralized Identifiers (DIDs)</strong> are a new type of identifier that enables verifiable, 
                  decentralized digital identity. DIDs are fully under the control of the DID subject, 
                  independent from any centralized registry, identity provider, or certificate authority.
                </p>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6">
                  <p className="text-purple-900 font-semibold mb-3 text-lg">TrustID DID Format:</p>
                  <code className="text-sm bg-white px-4 py-3 rounded-lg border border-purple-200 block font-mono">
                    did:algo:testnet:{'<algorand_address>'}
                  </code>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Decentralized</h4>
                    <p className="text-sm text-gray-600">No central authority controls your identity</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <Shield className="w-8 h-8 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Secure</h4>
                    <p className="text-sm text-gray-600">Cryptographically verified on blockchain</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <User className="w-8 h-8 text-purple-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Portable</h4>
                    <p className="text-sm text-gray-600">Use your identity across platforms</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
