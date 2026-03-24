'use client';

import { useState } from 'react';
import { Upload, FileText, Hash, Database, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { hashFile, uploadToIPFS } from '@/lib/utils';
import { addCredential } from '@/lib/contract';
import { useWallet } from '@/components/WalletProvider';
import { CREDENTIAL_TYPES, ACCESS_LEVELS, isValidAccessLevel, isValidCredentialType } from '@/lib/constants';

export default function AddCredentialClient() {
  const { accountAddress, connect, peraWallet } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [credId, setCredId] = useState('');
  const [credType, setCredType] = useState('');
  const [access, setAccess] = useState<string>(ACCESS_LEVELS.PUBLIC);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [status, setStatus] = useState('');
  const [txId, setTxId] = useState('');
  const [dragActive, setDragActive] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !accountAddress) {
      setStatus('Please connect wallet and select a file');
      return;
    }

    // Validate inputs
    if (!isValidCredentialType(credType)) {
      setStatus('Invalid credential type');
      return;
    }

    if (!isValidAccessLevel(access)) {
      setStatus('Invalid access level');
      return;
    }

    try {
      setLoading(true);
      
      setCurrentStep('Hashing file...');
      setStatus('Generating SHA-256 hash of your document');
      await new Promise(resolve => setTimeout(resolve, 500));
      const hash = await hashFile(file);
      
      // Generate secure credential ID
      setCurrentStep('Generating credential ID...');
      setStatus('Creating secure credential identifier');
      const { generateCredentialId } = await import('@/lib/utils');
      const generatedCredId = await generateCredentialId(hash, accountAddress, Date.now());
      
      let cid: string;
      let fileToUpload: File | Blob = file;
      
      if (access === ACCESS_LEVELS.PRIVATE) {
        setCurrentStep('Encrypting file...');
        setStatus('Encrypting your private document');
        const { encryptFile, deriveEncryptionPassword } = await import('@/lib/utils');
        const encryptionPassword = deriveEncryptionPassword(accountAddress);
        fileToUpload = await encryptFile(file, encryptionPassword);
      }
      
      setCurrentStep('Uploading to IPFS...');
      setStatus(access === ACCESS_LEVELS.PRIVATE
        ? 'Storing encrypted document on decentralized storage'
        : 'Storing document on decentralized storage'
      );
      cid = await uploadToIPFS(fileToUpload);
      
      setCurrentStep('Storing on blockchain...');
      setStatus('Creating transaction on Algorand');
      const signTransactions = peraWallet.signTransaction.bind(peraWallet);
      
      const transactionId = await addCredential(
        accountAddress,
        generatedCredId,
        hash,
        cid,
        credType,
        access,
        signTransactions
      );
      
      setTxId(transactionId);
      setCurrentStep('Success!');
      setStatus(
        `Credential added successfully! ${access === ACCESS_LEVELS.PRIVATE ? 'Your file is encrypted and only you can access it.' : ''}`
      );
      
      // Show the generated credential ID to user
      setCredId(generatedCredId);
      
      // Reset form after delay
      setTimeout(() => {
        setFile(null);
        setCredId('');
        setCredType('');
        setCurrentStep('');
        setStatus('');
        setTxId('');
      }, 5000);
    } catch (error: any) {
      setCurrentStep('Error');
      setStatus(error.message || 'Failed to add credential');
    } finally {
      setLoading(false);
    }
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
              Please connect your Pera Wallet to add credentials to the blockchain.
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Add New Credential</h1>
          <p className="text-lg text-gray-600">
            Upload your document to store it securely on the blockchain
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Credential Name (Optional - for display only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Credential Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={credId}
                    onChange={(e) => setCredId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., My Computer Science Degree"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Friendly name for your reference. A secure ID will be generated automatically.
                  </p>
                </div>

                {/* Credential Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Credential Type
                  </label>
                  <select
                    value={credType}
                    onChange={(e) => setCredType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select type</option>
                    <option value={CREDENTIAL_TYPES.CERTIFICATE}>Certificate</option>
                    <option value={CREDENTIAL_TYPES.DEGREE}>Degree</option>
                    <option value={CREDENTIAL_TYPES.ID_CARD}>ID Card</option>
                    <option value={CREDENTIAL_TYPES.LICENSE}>License</option>
                    <option value={CREDENTIAL_TYPES.PASSPORT}>Passport</option>
                    <option value={CREDENTIAL_TYPES.OTHER}>Other</option>
                  </select>
                </div>

                {/* Access Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Access Level
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setAccess(ACCESS_LEVELS.PUBLIC)}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        access === ACCESS_LEVELS.PUBLIC
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccess(ACCESS_LEVELS.PRIVATE)}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        access === ACCESS_LEVELS.PRIVATE
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      Private
                    </button>
                  </div>
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
                        ? 'border-blue-500 bg-blue-50'
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
                        <FileText className="w-8 h-8 text-blue-600" />
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
                          PDF, JPG, PNG up to 100MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Add Credential'
                  )}
                </button>
              </div>
            </form>

            {/* Status */}
            {(status || txId) && (
              <div className="mt-6 space-y-4">
                {status && (
                  <div
                    className={`p-4 rounded-lg border ${
                      currentStep === 'Success!'
                        ? 'bg-green-50 border-green-200'
                        : currentStep === 'Error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {currentStep === 'Success!' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : currentStep === 'Error' ? (
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 animate-spin" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{currentStep}</p>
                        <p className="text-sm text-gray-600">{status}</p>
                      </div>
                    </div>
                  </div>
                )}

                {txId && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Credential DID:</p>
                    <div className="bg-white p-3 rounded border mb-3">
                      <p className="text-sm text-gray-600 mb-1 font-mono break-all">
                        did:algo:testnet:{credId}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`did:algo:testnet:${credId}`);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                      >
                        Copy DID
                      </button>
                    </div>
                    <p className="text-xs text-amber-600 mb-3">
                      ⚠️ This is your credential's unique DID! Use it to resolve and verify your credential on the Universal Resolver.
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mb-2">Credential ID:</p>
                    <p className="text-xs text-gray-600 mb-2 break-all font-mono bg-white p-2 rounded border">
                      {credId}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mb-2 mt-3">Transaction ID:</p>
                    <a
                      href={`https://testnet.explorer.perawallet.app/tx/${txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm break-all flex items-center"
                    >
                      {txId}
                      <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">How it works</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                    <Hash className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Hash Generation</p>
                    <p className="text-xs text-gray-600">SHA-256 hash created from your file</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                    <Upload className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">IPFS Upload</p>
                    <p className="text-xs text-gray-600">File stored on decentralized storage</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-indigo-100 p-2 rounded-lg flex-shrink-0">
                    <Database className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Blockchain Storage</p>
                    <p className="text-xs text-gray-600">Hash stored on Algorand</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 mb-2">Security Features</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✓ Files are hashed locally before upload</li>
                <li>✓ Private credentials are encrypted end-to-end</li>
                <li>✓ Secure credential IDs prevent enumeration</li>
                <li>✓ Only you can access your private credentials</li>
                <li>✓ Blockchain ensures tamper-proof verification</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
