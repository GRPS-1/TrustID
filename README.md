# TrustID - Universal Resolver Compatible DID System

A complete decentralized identity system built on Algorand blockchain with W3C DID Resolution support.

**Author**: Ravi Partha Sarathi

---

## 🎯 What is TrustID?

TrustID is an innovative blockchain-based identity verification platform that creates **W3C-compliant Decentralized Identifiers (DIDs)** stored on the Algorand blockchain. These DIDs are resolvable by the Universal Resolver and fully compatible with the decentralized identity ecosystem.

### Example DID
```
did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI
```

---

## ✨ Key Features

### Core Features
- ✅ **W3C DID Compliant** - Full DID Core 1.0 specification support
- ✅ **Universal Resolver Compatible** - Resolvable via https://dev.uniresolver.io/
- ✅ **Blockchain-Based Identity** - Immutable identity storage on Algorand
- ✅ **Cryptographically Verifiable** - Ed25519 signature verification
- ✅ **Decentralized Storage** - IPFS integration for credential storage
- ✅ **Privacy-Preserving** - User-controlled data and credentials
- ✅ **Standards-Based** - Fully interoperable with DID ecosystem

### User Features
- **🏠 Home Dashboard** - View your identity status and recent activity
- **👤 Profile Management** - Create and manage your digital profile
- **🆔 DID Creation** - One-click DID generation with Pera Wallet
- **➕ Add Credentials** - Add and issue new credentials
- **📤 Share Credentials** - Share credentials with others securely
- **✅ Verify Credentials** - Verify credentials from other users
- **🔍 Identifier Resolution** - Resolve and inspect DIDs

## 🏗️ Project Structure

```
trustid/
├── frontend/                    # Next.js Web Application
│   ├── app/
│   │   ├── page.tsx            # Home dashboard
│   │   ├── profile/            # Profile management
│   │   ├── did/                # DID creation & management
│   │   ├── my-credentials/     # Your credentials
│   │   ├── add/                # Add new credentials
│   │   ├── share/              # Share credentials
│   │   ├── verify/             # Verify credentials
│   │   ├── api/                # Backend API routes
│   │   │   ├── credentials/    # Credential endpoints
│   │   │   ├── identifiers/    # DID resolution
│   │   │   └── test-resolver/  # Resolver testing
│   │   └── layout.tsx
│   ├── components/             # Reusable React components
│   │   ├── Navbar.tsx          # Navigation bar
│   │   ├── Footer.tsx          # Footer component
│   │   ├── WalletProvider.tsx  # Wallet integration
│   │   └── LayoutClient.tsx    # Client layout wrapper
│   ├── lib/                    # Utility libraries
│   │   ├── algorand.ts         # Algorand connection utilities
│   │   ├── contract.ts         # Smart contract interactions
│   │   ├── did.ts              # DID operations
│   │   ├── constants.ts        # Configuration constants
│   │   └── utils.ts            # Helper functions
│   ├── public/                 # Static assets
│   └── package.json
│
└── algorand/                    # Algorand Smart Contracts
    └── projects/
        └── trustid/
            ├── smart_contracts/
            │   ├── trustid/
            │   │   ├── contract.py         # Main DID contract
            │   │   └── deploy_config.py    # Deployment configuration
            │   └── artifacts/
            │       └── trustid/
            │           ├── TrustID.approval.teal
            │           ├── TrustID.clear.teal
            │           ├── TrustID.arc56.json
            │           └── trust_id_client.py
            ├── pyproject.toml              # Python dependencies
            └── requirements.txt
```

## 📚 Documentation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[SUMMARY.md](./SUMMARY.md)** - Project overview and architecture

### Technical Documentation
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Architecture and flow diagrams
- **[frontend/DID_RESOLVER_API.md](./frontend/DID_RESOLVER_API.md)** - API reference
- **[frontend/README.md](./frontend/README.md)** - Frontend documentation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.12+
- Pera Wallet browser extension
- Docker (optional, for local Algorand network)

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Smart Contract Setup (LocalNet)

```bash
# Navigate to Algorand project
cd algorand/projects/trustid

# Install Python dependencies
poetry install

# Bootstrap local environment
algokit project bootstrap all

# Configure environment
algokit generate env-file -a target_network localnet

# Start LocalNet
algokit localnet start

# Build contracts
algokit project run build

# Deploy contracts
algokit project deploy localnet
```

### Deploy to Production

```bash
cd frontend
npm run build
vercel deploy
```

## � User Guide

### 🏠 Home Dashboard
- View your identity status
- See recent activity
- Manage connected wallets
- Access all features from one place

### 👤 Profile Management
- Create and edit your profile
- Add profile picture
- Write bio
- View your DID

### 🆔 DID Creation
1. **Connect Wallet** - Click "Connect Wallet", select Pera Wallet
2. **Navigate to Profile** - Go to the Profile page
3. **Create DID** - Click "Create DID"
4. **Sign Transaction** - Approve in your Pera Wallet
5. **DID Generated** - Your DID is now on Algorand

### ➕ Add Credentials
1. Go to **Add** page
2. Fill in credential details
3. Click "Add Credential"
4. Credential stored on blockchain/IPFS

### 📤 Share Credentials
1. Navigate to **Share** page
2. Select credentials to share
3. Generate shareable link or QR code
4. Share with others

### ✅ Verify Credentials
1. Go to **Verify** page
2. Scan QR code or enter recipient's DID
3. View credential details
4. Verify authenticity with blockchain proof

### 🔍 Identifier Resolution
Query the Universal Resolver endpoint to resolve any DID:

```bash
curl https://your-app.vercel.app/api/identifiers/did:algo:testnet:YOUR_ADDRESS
```

## 🌐 Use Cases

### Identity Verification
```javascript
// Resolve DID to get public key
const { didDocument } = await resolveDID('did:algo:testnet:...');
const publicKey = didDocument.verificationMethod[0].publicKeyBase58;

// Verify signature
const isValid = verifySignature(message, signature, publicKey);
```

### Credential Discovery
```javascript
// Find credential service
const service = didDocument.service.find(s => s.type === 'CredentialRegistry');

// Fetch public credentials
const credentials = await fetch(service.serviceEndpoint);
```

### Decentralized Authentication
```javascript
// Challenge-response authentication
const challenge = generateChallenge();
const signature = await wallet.signMessage(challenge);
const isAuthenticated = await verifyDIDSignature(did, challenge, signature);
```

## 📋 API Reference

### Resolve DID
```http
GET /api/identifiers/{did}
Accept: application/did+ld+json
```

**Response**: DID Document
```json
{
  "@context": [...],
  "id": "did:algo:testnet:...",
  "verificationMethod": [...],
  "authentication": [...],
  "service": [...]
}
```

### Get Resolution Result
```http
GET /api/identifiers/{did}
Accept: application/did-resolution+json
```

**Response**: Full Resolution Result
```json
{
  "didResolutionMetadata": {...},
  "didDocument": {...},
  "didDocumentMetadata": {...}
}
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16.2.1
- **UI Library**: React 19.2.4
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Type Safety**: TypeScript 5
- **Linting**: ESLint 9
- **Wallet**: Pera Wallet (@perawallet/connect)

### Blockchain
- **Network**: Algorand (TestNet)
- **Smart Contract Language**: PyTeal
- **SDK**: AlgoKit, Algo SDK v3.5.2
- **Wallet**: Pera Wallet

### Infrastructure
- **Deployment**: Vercel
- **Storage**: IPFS for decentralized storage
- **Development**: Docker for local Algorand network

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Universal Resolver                         │
│           (dev.uniresolver.io)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Your TrustID App                           │
│           (trustid.vercel.app)                          │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │  DID Resolution API                             │   │
│  │  /api/identifiers/[did]                        │   │
│  └────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Query
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Algorand Blockchain                           │
│              (Testnet)                                  │
│                                                          │
│  ┌────────────────────────────────────────────────┐   │
│  │  TrustID Smart Contract                        │   │
│  │  - DID Registry                                │   │
│  │  - Credential Storage                          │   │
│  │  - Verification Methods                        │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Security & Privacy

### What's Public
- DID identifier
- DID document
- Public keys
- Public credentials
- Service endpoints

### What's Private
- Private credentials
- Credential contents
- Wallet keys
- Personal data

### Security Features
- Cryptographic verification (Ed25519)
- Blockchain immutability
- Decentralized storage (IPFS)
- User-controlled data
- No central authority

## 🧪 Testing

### Run Frontend Tests
```bash
cd frontend
npm run test
```

### Test DID Resolution
```bash
curl https://your-app.vercel.app/api/test-resolver?did=did:algo:testnet:YOUR_DID
```

### Test with Universal Resolver
```
https://dev.uniresolver.io/1.0/identifiers/did:algo:testnet:YOUR_ADDRESS
```

## 🚨 Troubleshooting

### Wallet Connection Issues
- Ensure Pera Wallet is installed
- Check that you're on the correct network (TestNet)
- Try refreshing the page

### DID Creation Failed
- Ensure sufficient balance in your wallet
- Check network connectivity
- Verify Algorand node is running (for local testing)

### Contract Deployment Failed
- Verify AlgoKit is installed: `algokit --version`
- Ensure LocalNet is running: `algokit localnet status`
- Check Python version: `python --version` (3.12+)

### Credential Sharing Issues
- Verify IPFS connectivity
- Check that credentials are properly formatted
- Ensure both parties are on the same network

## 📄 License

This project is open source. See LICENSE file for details.

## 👨‍💼 Author

**Ravi Partha Sarathi**

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bug reports and feature requests.

## 📞 Support

For more information:
- Visit: https://github.com/GRPS-1/TrustID
- Open an issue on GitHub
- Check documentation files in the root directory

---

## 🌟 Standards Compliance

- ✅ W3C DID Core 1.0
- ✅ W3C DID Resolution
- ✅ Algorand Standards (ARC-4)
- ✅ JSON-LD Context
- ✅ Ed25519 Signatures

---

**Built with ❤️ using Algorand blockchain, Next.js, and W3C DID standards**

🚀 Your identity, your control, on the blockchain!
