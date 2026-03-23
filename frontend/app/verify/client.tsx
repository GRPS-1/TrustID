'use client';
import { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Search, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { hashFile } from '@/lib/utils';
import { verifyCredential } from '@/lib/contract';
import { useWallet } from '@/components/WalletProvider';

export default function VerifyClient() {
  const { accountAddress } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [credId, setCredId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null);
  const [status, setStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [lookupMode, setLookupMode] = useState(false);
  const [credentialData, setCredentialData] = useState<any>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setStatus('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setStatus('Hashing file...');
      
      const hash = await hashFile(file);
      
      setStatus('Verifying on blockchain...');
      const isValid = await verifyCredential(credId, hash);
      
      setResult(isValid ? 'valid' : 'invalid');
      setStatus(isValid ? 'Credential verified successfully' : 'Credential verification failed');
    } catch (error: any) {
      setStatus('Error: ' + (error.message || 'Verification failed'));
      setResult('invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setStatus('Looking up credential...');
      setCredentialData(null);
      
      const { algodClient, APP_ID } = await import('@/lib/algorand');
      const algosdk = await import('algosdk');
      
      // Encode credential ID as ARC4 string
      const encoder = new TextEncoder();
      const credIdBytes = encoder.encode(credId);
      const length = credIdBytes.length;
      const arc4Encoded = new Uint8Array(2 + length);
      arc4Encoded[0] = (length >> 8) & 0xff;
      arc4Encoded[1] = length & 0xff;
      arc4Encoded.set(credIdBytes, 2);
      
      // Create box name: "cred_" + ARC4_encoded_string
      const prefix = encoder.encode('cred_');
      const boxName = new Uint8Array(prefix.length + arc4Encoded.length);
      boxName.set(prefix);
      boxName.set(arc4Encoded, prefix.length);
      
      try {
        const boxValue = await algodClient.getApplicationBoxByName(APP_ID, boxName).do();
        const valueBytes = new Uint8Array(boxValue.value);
        
        // Parse the data structure properly
        let offset = 0;
        
        // Read hash (ARC4 String)
        const hashLen = (valueBytes[offset] << 8) | valueBytes[offset + 1];
        offset += 2;
        const hash = Buffer.from(valueBytes.slice(offset, offset + hashLen)).toString('utf-8');
        offset += hashLen;
        
        // Skip separator |
        offset += 1;
        
        // Read owner (32 bytes raw address)
        const ownerBytes = Buffer.from(valueBytes.slice(offset, offset + 32));
        const owner = algosdk.default.encodeAddress(ownerBytes);
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
        let timestampNum = 0;
        for (let i = 0; i < 8; i++) {
          timestampNum = (timestampNum * 256) + valueBytes[offset + i];
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
        
        // Check for revoked status
        const isRevoked = Buffer.from(valueBytes.slice(-8)).toString('utf-8') === '|revoked';
        
        const timestamp = timestampNum > 0
          ? new Date(timestampNum * 1000).toISOString()
          : new Date().toISOString();
        
        // Check access control for private credentials
        if (access === 'private') {
          if (!accountAddress) {
            setStatus('Access denied: Please connect your wallet to view private credentials.');
            return;
          }
          
          // Check if current user is owner
          const isOwner = accountAddress === owner;
          
          // Check if current user has been granted access
          let hasGrant = false;
          if (!isOwner) {
            try {
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
                ...algosdk.default.decodeAddress(accountAddress).publicKey,
              ]);
              
              const grantBox = await algodClient.getApplicationBoxByName(APP_ID, grantBoxName).do();
              const grantValue = new Uint8Array(grantBox.value);
              
              // Check expiry
              let expiry = 0;
              for (let i = 0; i < 8; i++) {
                expiry = (expiry * 256) + grantValue[i];
              }
              
              const now = Math.floor(Date.now() / 1000);
              hasGrant = expiry === 0 || expiry > now;
            } catch (err) {
              // No grant found
              hasGrant = false;
            }
          }
          
          if (!isOwner && !hasGrant) {
            setStatus('Access denied: This is a private credential. Only the owner or granted users can view it.');
            return;
          }
        }
        
        setCredentialData({
          id: credId,
          hash,
          owner,
          cid,
          type,
          timestamp,
          status: isRevoked ? 'revoked' : status,
          access,
        });
        setStatus('Credential found!');
      } catch (error: any) {
        if (error.message?.includes('Access denied')) {
          setStatus('Access denied: This is a private credential. Only the owner can view it.');
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      setStatus('Credential not found or error: ' + (error.message || 'Lookup failed'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setCredId('');
    setResult(null);
    setStatus('');
    setCredentialData(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Verify Credential</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {lookupMode 
              ? 'Look up credential details and download the original file'
              : 'Upload a document to verify its authenticity against the blockchain'}
          </p>
          
          {/* Mode Toggle */}
          <div className="mt-6 inline-flex rounded-lg border border-gray-300 p-1 bg-white">
            <button
              onClick={() => { setLookupMode(false); resetForm(); }}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                !lookupMode
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Verify File
            </button>
            <button
              onClick={() => { setLookupMode(true); resetForm(); }}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                lookupMode
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Lookup & Download
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Verification Form */}
          <div className="lg:col-span-2">
            {lookupMode ? (
              /* Lookup Form */
              <form onSubmit={handleLookup} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Credential ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={credId}
                        onChange={(e) => setCredId(e.target.value)}
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="e.g., DEGREE_CS_2024"
                        required
                      />
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Looking up...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Lookup Credential
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Verify Form */
              <form onSubmit={handleVerify} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Credential ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Credential ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={credId}
                      onChange={(e) => setCredId(e.target.value)}
                      className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="e.g., DEGREE_CS_2024"
                      required
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Enter the credential ID you want to verify
                  </p>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Upload Document
                  </label>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                      dragActive
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    {file ? (
                      <div className="flex items-center justify-center space-x-3">
                        <FileText className="w-8 h-8 text-green-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-700 font-medium mb-2">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Upload the document you want to verify
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Verify Credential
                    </>
                  )}
                </button>
              </div>
            </form>
            )}

            {/* Credential Details (Lookup Mode) */}
            {lookupMode && credentialData && (
              <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Credential Details</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">ID:</span>
                    <span className="col-span-2 text-sm text-gray-900 break-all">{credentialData.id}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Type:</span>
                    <span className="col-span-2 text-sm text-gray-900">{credentialData.type}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Status:</span>
                    <span className="col-span-2">
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                        {credentialData.status}
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Access:</span>
                    <span className="col-span-2 text-sm text-gray-900">{credentialData.access}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Timestamp:</span>
                    <span className="col-span-2 text-sm text-gray-900">
                      {new Date(credentialData.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Owner:</span>
                    <span className="col-span-2 text-sm text-gray-900 break-all font-mono text-xs">
                      {credentialData.owner}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">Hash:</span>
                    <span className="col-span-2 text-sm text-gray-900 break-all font-mono text-xs">
                      {credentialData.hash}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">IPFS CID:</span>
                    <span className="col-span-2 text-sm text-gray-900 break-all font-mono text-xs">
                      {credentialData.cid}
                    </span>
                  </div>
                </div>

                {/* Download Button */}
                {credentialData.status !== 'revoked' && (
                  <>
                    {/* Show download for public credentials OR private credentials where user is owner/has grant */}
                    {(credentialData.access === 'public' || 
                      (credentialData.access === 'private' && accountAddress && 
                       (accountAddress === credentialData.owner))) && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${credentialData.cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Download from IPFS
                        </a>
                        <p className="mt-3 text-xs text-gray-500 text-center">
                          {credentialData.access === 'private' 
                            ? 'Note: This file is encrypted. You will need to decrypt it after downloading.'
                            : 'After downloading, switch to "Verify File" mode to verify the document'}
                        </p>
                      </div>
                    )}
                    
                    {/* Show access denied message for private credentials when user is not owner and has no grant */}
                    {credentialData.access === 'private' && 
                     (!accountAddress || accountAddress !== credentialData.owner) && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <p className="text-sm text-amber-800">
                            🔒 This is a private credential. Only the owner or granted users can download and decrypt it.
                            {!accountAddress && ' Please connect your wallet if you have access.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {credentialData.status === 'revoked' && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 font-semibold">
                        ⚠️ This credential has been revoked and is no longer valid.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verification Result */}
            {result && (
              <div className="mt-6">
                <div
                  className={`rounded-2xl border-2 p-8 text-center ${
                    result === 'valid'
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="mb-6">
                    {result === 'valid' ? (
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full">
                        <CheckCircle className="w-12 h-12 text-white" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full">
                        <XCircle className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  <h2
                    className={`text-3xl font-bold mb-3 ${
                      result === 'valid' ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result === 'valid' ? 'VERIFIED' : 'NOT VERIFIED'}
                  </h2>
                  <p
                    className={`text-lg mb-6 ${
                      result === 'valid' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {status}
                  </p>
                  {result === 'valid' ? (
                    <div className="bg-white rounded-lg p-4 text-left">
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold text-gray-900">Credential ID:</span> {credId}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">File:</span> {file?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4 text-left">
                      <p className="text-sm text-gray-700">
                        This document does not match the credential stored on the blockchain. 
                        It may have been tampered with or the credential ID is incorrect.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={resetForm}
                    className="mt-6 px-6 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all border border-gray-300"
                  >
                    Verify Another
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Verification Process</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <span className="text-green-700 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enter Credential ID</p>
                    <p className="text-xs text-gray-600">Unique identifier for the credential</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <span className="text-green-700 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Upload Document</p>
                    <p className="text-xs text-gray-600">The file you want to verify</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <span className="text-green-700 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Instant Verification</p>
                    <p className="text-xs text-gray-600">Compare hash with blockchain</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-2">Important</h3>
                  <p className="text-sm text-amber-800">
                    Verification requires the exact same file that was originally uploaded. 
                    Any modification will result in verification failure.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 mb-2">No Wallet Needed</h3>
              <p className="text-sm text-blue-800">
                Verification is completely public and doesn't require connecting a wallet. 
                Anyone can verify credentials at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
