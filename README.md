# TrustID - Universal Resolver Compatible DID System

A complete decentralized identity system built on Algorand blockchain with W3C DID Resolution support.

## 🎯 What This Is

TrustID is a blockchain-based identity verification system that creates **W3C-compliant Decentralized Identifiers (DIDs)** that are resolvable by the Universal Resolver and compatible with the global DID ecosystem.

### Your DID
```
did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI
```

## ✨ Key Features

- ✅ **W3C DID Compliant** - Full DID Core 1.0 specification support
- ✅ **Universal Resolver Compatible** - Works with https://dev.uniresolver.io/
- ✅ **Blockchain-Based** - Immutable identity on Algorand
- ✅ **Cryptographically Verifiable** - Ed25519 signatures
- ✅ **Decentralized Storage** - IPFS for credentials
- ✅ **Privacy-Preserving** - User-controlled data
- ✅ **Standards-Based** - Interoperable with DID ecosystem

## 🚀 Quick Start

### 1. Deploy Your App
```bash
cd frontend
npm install
vercel deploy
```

### 2. Create Your DID
1. Visit your deployed app
2. Connect Pera Wallet
3. Go to Profile page
4. Create DID

### 3. Test Resolution
```bash
curl https://your-app.vercel.app/api/identifiers/did:algo:testnet:YOUR_ADDRESS
```

## 📚 Documentation

### Getting Started
- **[QUICK_START.md](./QUICK_START.md)** - 5-minute setup guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[SUMMARY.md](./SUMMARY.md)** - What was built and why

### Technical Documentation
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Architecture and flow diagrams
- **[frontend/DID_RESOLVER_API.md](./frontend/DID_RESOLVER_API.md)** - API reference
- **[frontend/README.md](./frontend/README.md)** - Frontend documentation

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

## 🔑 Key Components

### 1. DID Resolution API
**Endpoint**: `/api/identifiers/{did}`

Resolves DIDs to W3C-compliant DID documents:
```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:algo:testnet:...",
  "verificationMethod": [...],
  "authentication": [...],
  "service": [...]
}
```

### 2. Smart Contract
**App ID**: 757490823 (Testnet)

Stores:
- DID profiles (name, bio, image)
- Credentials (hash, metadata)
- Verification data
- Timestamps

### 3. Frontend Application
**Tech Stack**: Next.js 15, TypeScript, Tailwind CSS

Features:
- DID creation and management
- Credential issuance
- Verification interface
- DID resolution UI

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

## 🔒 Security & Privacy

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

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Pera Wallet
- Pinata account
- Algorand testnet account

### Setup
```bash
# Clone repository
git clone <your-repo>

# Install dependencies
cd frontend
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_ALGORAND_APP_ID=757490823
NEXT_PUBLIC_ALGORAND_NETWORK=testnet
NEXT_PUBLIC_PINATA_JWT=your_jwt
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

## 📦 Project Structure

```
.
├── algorand/                    # Smart contracts
│   └── projects/trustid/
│       └── smart_contracts/
├── frontend/                    # Next.js app
│   ├── app/
│   │   ├── api/
│   │   │   ├── identifiers/    # DID Resolution API
│   │   │   └── credentials/    # Credential API
│   │   ├── did/                # DID Resolver UI
│   │   ├── profile/            # Profile management
│   │   └── ...
│   └── lib/
│       ├── did.ts              # DID utilities
│       ├── contract.ts         # Smart contract interface
│       └── algorand.ts         # Algorand client
├── QUICK_START.md              # Quick reference
├── DEPLOYMENT_GUIDE.md         # Deployment instructions
├── HOW_IT_WORKS.md            # Architecture guide
└── SUMMARY.md                  # Implementation summary
```

## 🌟 Standards Compliance

### W3C DID Core 1.0
- ✅ DID syntax
- ✅ DID documents
- ✅ Verification methods
- ✅ Service endpoints
- ✅ JSON-LD context

### W3C DID Resolution
- ✅ HTTP binding
- ✅ Resolution metadata
- ✅ Document metadata
- ✅ Error handling
- ✅ Content negotiation

### Algorand Standards
- ✅ ARC-4 encoding
- ✅ Box storage
- ✅ Transaction signing
- ✅ Account verification

## 🚢 Deployment

### Vercel (Recommended)
```bash
cd frontend
vercel deploy
```

### Other Platforms
```bash
npm run build
npm start
```

### Custom Domain
1. Add domain in Vercel
2. Update DNS records
3. Your DID resolver: `https://your-domain.com/api/identifiers/{did}`

## 🧪 Testing

### Test Resolution
```bash
# Test your DID
curl -H "Accept: application/did+ld+json" \
  https://your-app.vercel.app/api/identifiers/did:algo:testnet:YOUR_ADDRESS

# Test resolver endpoint
curl https://your-app.vercel.app/api/test-resolver
```

### Test in Browser
```
https://your-app.vercel.app/api/identifiers/did:algo:testnet:YOUR_ADDRESS
```

### Test with Universal Resolver
```
https://dev.uniresolver.io/1.0/identifiers/did:algo:testnet:YOUR_ADDRESS
```
(After submitting driver)

## 📖 Resources

### W3C Standards
- [DID Core Specification](https://www.w3.org/TR/did-core/)
- [DID Resolution](https://w3c-ccg.github.io/did-resolution/)
- [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)

### Algorand
- [Developer Portal](https://developer.algorand.org/)
- [AlgoKit](https://github.com/algorandfoundation/algokit-cli)
- [PyTeal Documentation](https://pyteal.readthedocs.io/)

### Universal Resolver
- [GitHub Repository](https://github.com/decentralized-identity/universal-resolver)
- [DID Methods](https://w3c.github.io/did-spec-registries/)
- [Driver Development](https://github.com/decentralized-identity/universal-resolver/blob/main/docs/driver-development.md)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Educational project for blockchain identity management.

## 💬 Support

- **Documentation**: See docs in this repository
- **Issues**: Open a GitHub issue
- **Questions**: Check HOW_IT_WORKS.md

## 🎉 What's Next?

1. **Deploy your app** - Follow DEPLOYMENT_GUIDE.md
2. **Create your DID** - Use the Profile page
3. **Add credentials** - Use the Add Credential page
4. **Test resolution** - Use the DID Resolver page
5. **Share your DID** - Let others verify your identity
6. **Build integrations** - Use DIDs in your apps

---

**Your identity, your control, on the blockchain!** 🚀

Built with ❤️ using Next.js, Algorand, and W3C DID standards.
