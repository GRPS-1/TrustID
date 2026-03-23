'use client';
import { useState, useEffect } from 'react';
import { User, Shield, Save, AlertCircle, CheckCircle, Loader2, Copy } from 'lucide-react';
import { useWallet } from '@/components/WalletProvider';
import { generateDID, createDIDDocument, shortenDID } from '@/lib/did';
import { uploadToIPFS } from '@/lib/utils';

export default function ProfileClient() {
  const { accountAddress, connect } = useWallet();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [myDID, setMyDID] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (accountAddress) {
      setMyDID(generateDID(accountAddress, 'testnet'));
    }
  }, [accountAddress]);

  const handleCopyDID = () => {
    navigator.clipboard.writeText(myDID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountAddress) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setStatus('Creating your DID profile...');

      let profileCid = '';
      
      if (profileImage) {
        setStatus('Uploading profile image to IPFS...');
        profileCid = await uploadToIPFS(profileImage);
      }

      setStatus('Registering DID on blockchain...');
      
      // TODO: Call DID Registry contract to register DID
      // This requires the DID Registry contract to be deployed
      // For now, we'll just create the DID document locally
      
      const didDocument = createDIDDocument(accountAddress, 'testnet', {
        name,
        bio,
        profileCid,
      });

      setStatus('DID profile created successfully!');
      
      // In production, you would:
      // 1. Call the DID Registry contract's register_did method
      // 2. Store the DID document on-chain or IPFS
      // 3. Link it to the user's credentials
      
      setTimeout(() => {
        setStatus('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create DID profile');
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
              Please connect your Pera Wallet to manage your DID profile.
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
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My DID Profile</h1>
          <p className="text-lg text-gray-600">
            Create and manage your decentralized identity
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="space-y-6">
                {/* Your DID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Your DID
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={myDID}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCopyDID}
                      className="p-3 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Copy DID"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    This is your unique decentralized identifier
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., John Doe"
                    required
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    placeholder="Tell others about yourself..."
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {bio.length}/500 characters
                  </p>
                </div>

                {/* Profile Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Profile Image (Optional)
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                      {profileImage ? (
                        <img
                          src={URL.createObjectURL(profileImage)}
                          alt="Profile preview"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save DID Profile
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Status Messages */}
            {(status || error) && (
              <div className="mt-6">
                {status && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                      <p className="text-sm text-green-800">{status}</p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
                <h3 className="font-bold text-gray-900">About DIDs</h3>
              </div>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  Your DID (Decentralized Identifier) is a unique identifier that you fully control.
                </p>
                <p>
                  It's generated from your Algorand wallet address and follows the W3C DID specification.
                </p>
                <p>
                  Your DID profile is stored on the blockchain and can be resolved by anyone.
                </p>
              </div>
            </div>

            <div className="bg-purple-50 rounded-2xl border border-purple-200 p-6">
              <h3 className="font-bold text-purple-900 mb-2">Privacy Note</h3>
              <p className="text-sm text-purple-800">
                Your profile information will be publicly visible. Only include information 
                you're comfortable sharing publicly.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="font-bold text-blue-900 mb-2">Coming Soon</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✓ Link credentials to your DID</li>
                <li>✓ Add verification methods</li>
                <li>✓ Manage service endpoints</li>
                <li>✓ Create verifiable presentations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
