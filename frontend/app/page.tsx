import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Zap, Users, CheckCircle, ArrowRight, FileCheck, Database, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'TrustID - Secure Your Digital Identity',
  description: 'Store, verify, and manage credentials on the Algorand blockchain. Tamper-proof, decentralized, and completely under your control.',
  openGraph: {
    title: 'TrustID - Secure Your Digital Identity',
    description: 'Store, verify, and manage credentials on the Algorand blockchain. Tamper-proof, decentralized, and completely under your control.',
    images: [
      {
        url: '/SEO.png',
        width: 1200,
        height: 630,
        alt: 'TrustID - Secure Your Digital Identity',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrustID - Secure Your Digital Identity',
    description: 'Store, verify, and manage credentials on the Algorand blockchain. Tamper-proof, decentralized, and completely under your control.',
    images: ['/SEO.png'],
  },
};

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Shield className="w-4 h-4" />
                <span>Powered by Algorand Blockchain</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Secure Your Digital Identity
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Store, verify, and manage credentials on the blockchain. 
                Tamper-proof, decentralized, and completely under your control.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/add"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/verify"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200"
                >
                  Verify Credential
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Verified
                </div>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileCheck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Credential Type</p>
                      <p className="font-semibold text-gray-900">University Degree</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Database className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Storage</p>
                      <p className="font-semibold text-gray-900">IPFS + Blockchain</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      <Globe className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Network</p>
                      <p className="font-semibold text-gray-900">Algorand TestNet</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose TrustID?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built on cutting-edge blockchain technology to provide unmatched security and transparency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tamper-Proof</h3>
              <p className="text-gray-700 leading-relaxed">
                Documents stored as cryptographic hashes on the blockchain cannot be altered, 
                ensuring complete integrity and authenticity.
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl border border-indigo-200">
              <div className="bg-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Instant Verification</h3>
              <p className="text-gray-700 leading-relaxed">
                Verify any credential in seconds without relying on central authorities. 
                Fast, efficient, and globally accessible.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border border-purple-200">
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">User Controlled</h3>
              <p className="text-gray-700 leading-relaxed">
                You own your identity. Only you can modify or revoke your credentials. 
                Complete control, complete privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, secure, and transparent process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Connect Wallet',
                description: 'Connect your Pera Wallet to get started',
              },
              {
                step: '02',
                title: 'Upload Document',
                description: 'Upload your credential document securely',
              },
              {
                step: '03',
                title: 'Store on Chain',
                description: 'Document hash stored on Algorand blockchain',
              },
              {
                step: '04',
                title: 'Verify Anytime',
                description: 'Anyone can verify your credential instantly',
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="text-5xl font-bold text-blue-100 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Real-World Applications
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              TrustID can be used across various industries and use cases
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Academic Certificates', desc: 'University degrees and diplomas' },
              { title: 'Government IDs', desc: 'Digital identity verification' },
              { title: 'Professional Licenses', desc: 'Medical, legal certifications' },
              { title: 'Employment Records', desc: 'Work history verification' },
              { title: 'Medical Records', desc: 'Health document storage' },
              { title: 'KYC Documents', desc: 'Identity verification' },
              { title: 'Property Deeds', desc: 'Ownership certificates' },
              { title: 'Digital Passports', desc: 'Travel documentation' },
            ].map((useCase, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{useCase.title}</h3>
                <p className="text-sm text-gray-600">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Secure Your Digital Identity?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the decentralized identity revolution today
          </p>
          <Link
            href="/add"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg"
          >
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
