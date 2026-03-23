import { Shield, Github, Twitter, Mail } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">TrustID</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Decentralized identity verification powered by Algorand blockchain. 
              Secure, tamper-proof, and user-controlled digital credentials.
            </p>
            <div className="flex space-x-4">
              <a href="https://github.com/" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/add" className="text-gray-400 hover:text-white transition-colors">
                  Add Credential
                </Link>
              </li>
              <li>
                <Link href="/verify" className="text-gray-400 hover:text-white transition-colors">
                  Verify
                </Link>
              </li>
              <li>
                <Link href="/my-credentials" className="text-gray-400 hover:text-white transition-colors">
                  My Credentials
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://developer.algorand.org/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  Algorand Docs
                </a>
              </li>
              <li>
                <a href="https://perawallet.app/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  Pera Wallet
                </a>
              </li>
              <li>
                <a href="https://testnet.explorer.perawallet.app/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  TestNet Explorer
                </a>
              </li>
              <li>
                <a href="https://bank.testnet.algorand.network/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  Get TestNet ALGO
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2026 TrustID. Built on Algorand TestNet.
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0">
            App ID: 757490823
          </p>
        </div>
      </div>
    </footer>
  );
}
