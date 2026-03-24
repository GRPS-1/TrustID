# TrustID - W3C Compliant Decentralized Identity on Algorand

![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue)
![Node.js 18+](https://img.shields.io/badge/node.js-18%2B-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Algorand](https://img.shields.io/badge/Algorand-Testnet-purple)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)
![W3C DID Core 1.0](https://img.shields.io/badge/W3C%20DID-Core%201.0-brightgreen)

**TrustID** is a production-grade, open-source decentralized identifier (DID) system built on the Algorand blockchain. It enables users to create, manage, and verify cryptographically-signed credentials with full W3C compliance and universal resolver compatibility.

---

## 🎯 Overview

TrustID provides a privacy-preserving identity solution where:
- **Users own their identities** — Decentralized, self-sovereign identity model
- **Credentials are cryptographically verifiable** — Ed25519 signatures on Algorand blockchain
- **Data is immutable** — All credentials stored on-chain with IPFS integration
- **Access is granular** — Public/private credentials with time-limited access grants
- **Resolution is global** — DIDs resolvable via the [Universal Resolver](https://dev.uniresolver.io)
- **Standards are met** — Full W3C DID Core 1.0 and DID Resolution specification compliance

### DID Format


---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Credential Management** | Upload, store, retrieve, and revoke credentials on-chain |
| **Access Control** | Public credentials for anyone, private credentials with owner/grantee-only access |
| **Time-Limited Access Grants** | Delegate credential access with expiration timestamps |
| **W3C Compliance** | Full DID Core 1.0 and DID Linked Data Proof specification support |
| **Universal Resolver** | DIDs resolvable globally via dev.uniresolver.io and compatible resolvers |
| **IPFS Integration** | Decentralized credential storage for large files |
| **Encryption** | AES-256-GCM encryption for private credentials with PBKDF2 key derivation |
| **Box Storage** | Efficient Algorand box storage for scalable credential indexing |
| **Multi-Page Dashboard** | Intuitive UI for DID creation, credential upload, sharing, and verification |

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.12+
- **Node.js** 18+
- **Docker** (optional, for local Algorand network)
- **git**
- **Poetry** (Python package manager)
- **AlgoKit CLI** 2.0.0+ (for smart contracts)

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Open http://localhost:3000

### Smart Contracts Setup

# From project root, navigate to Algorand directory
cd algorand/projects/trustid

# Install Python dependencies
poetry install

# Bootstrap and build contracts
algokit project bootstrap all
algokit project run build

# (Optional) Deploy to local network
algokit localnet start  # In another terminal
algokit project deploy localnet

Environment Configuration
Create a .env.local file in the frontend directory:
NEXT_PUBLIC_ALGORAND_APP_ID=757490823
NEXT_PUBLIC_NETWORK=testnet

First Run
Start the frontend: npm run dev in frontend
Open http://localhost:3000
Connect your Algorand wallet (Pera Wallet recommended)
Navigate to /profile to create your DID
Add your first credential via /add


---

## **PART 2: Architecture & Tech Stack**

Copy this second:

```markdown
---

## 🏗️ Architecture
┌─────────────────────────────────────────────────────────────┐
│ Universal Resolver (dev.uniresolver.io) │
└──────────────────────────┬──────────────────────────────────┘
│ HTTP Request (GET /identifiers/{did})
│
┌──────────────────────────▼──────────────────────────────────┐
│ TrustID Frontend (Next.js) │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Pages: │ │
│ │ • Home (/) — Feature showcase │ │
│ │ • Profile (/profile) — Create & manage DID │ │
│ │ • Add (/add) — Upload credentials │ │
│ │ • My Credentials (/my-credentials) — Dashboard │ │
│ │ • Verify (/verify) — Public credential check │ │
│ │ • DID Resolver (/did) — Resolve DIDs to documents │ │
│ │ • Share (/share) — Manage access grants │ │
│ │ │ │
│ │ Components: │ │
│ │ • Pera Wallet Connect integration │ │
│ │ • DID document rendering │ │
│ │ • Credential upload with validation │ │
│ └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
│
┌───────────────┼───────────────┐
│ │ │
Contract calls API routes Wallet signing
│ │ │
┌──────────▼───────────────▼───────────────▼──────┐
│ Algorand Blockchain (Testnet) │
│ │
│ ┌─────────────────────────────────────────┐ │
│ │ TrustID Smart Contract (App ID: ...) │ │
│ │ │ │
│ │ Methods: │ │
│ │ • add_credential() │ │
│ │ • get_credential() │ │
│ │ • grant_access() │ │
│ │ • revoke_access() │ │
│ │ │ │
│ │ Storage: Algorand box storage │ │
│ │ Format: cred_{credential_id} │ │
│ └─────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────┘
│
┌───────────────┼───────────────┐
│ │ │
IPFS nodes User wallet Revocation index
│ │ │
┌────▼─┐ ┌────▼────┐ ┌────▼────┐
│ Files │ │ Pera │ │ Status │
│ (CDN) │ │ Wallet │ │ Updates │
└───────┘ └─────────┘ └─────────┘


**Data Flow:**

1. User connects Pera Wallet in browser → obtains Algorand address
2. User creates DID at `/profile` → DID registered on blockchain
3. User uploads credential at `/add` → file hashed, stored on IPFS, record on Algorand
4. User shares credential → access grant stored on-chain with expiration
5. Verifier visits `/verify` with credential link → resolves from blockchain, validates signature
6. External resolver requests `/api/identifiers/{did}` → W3C DID Document returned

---

## 💻 Technology Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.4 | UI framework |
| Next.js | 16.2.1 | Full-stack React framework |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.x | Utility-first styling |
| Lucide React | Latest | Icon system |
| Algorand SDK | 3.5.2 | Blockchain interaction |
| Pera Wallet Connect | 1.5.1 | Wallet integration |

**Development Tools:**
- ESLint 9 — Linting
- PostCSS 8 — CSS processing
- Node.js 18+

### Smart Contracts (Blockchain)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Algorand Python | 3.x | Smart contract language |
| PyTeal / PuyaPy | Latest | Compilation to TEAL |
| AlgoKit | 2.0.0+ | Development framework |
| algokit-utils | 4.0.0 | Utilities & client generation |
| Python | 3.12+ | Language runtime |

**Development Tools:**
- Poetry — Dependency management
- pytesting — Unit testing
- Docker — LocalNet environment

### Infrastructure

- **Blockchain:** Algorand Testnet (upgradeable to Mainnet)
- **Nodes:** AlgoNode (https://algonode.io)
- **Storage:** IPFS (InterPlanetary File System)
- **Frontend Hosting:** Vercel (recommended for Next.js)
- **Package Managers:** npm (Node.js), Poetry (Python)

---

## 🔗 Smart Contracts

### TrustID Contract Overview

**Location:** [smart_contracts/trustid/contract.py](smart_contracts/trustid/contract.py)  
**Blockchain:** Algorand Testnet  
**App ID:** `757490823`  
**Language:** Algorand Python (PyTeal)

### Core Methods

| Method | Parameters | Returns | Purpose |
|--------|-----------|---------|---------|
| `add_credential` | `cred_id`, `hash_value`, `cid`, `cred_type`, `access` | Success flag | Store credential metadata on-chain |
| `get_credential` | `cred_id` | Credential data | Retrieve credential with access control checks |
| `grant_access` | `cred_id`, `grantee`, `expiry_timestamp` | Success flag | Grant time-limited access to private credential |
| `revoke_access` | `cred_id`, `grantee` | Success flag | Revoke previously granted access |
| `parse_owner` | `value`, `hash_length` | Owner address | Extract credential owner from box data |
| `parse_access` | `value` | Access level | Extract public/private flag |
| `is_revoked` | `value` | Boolean | Check revocation status |

### Storage Strategy

**Box Storage:**
- Key format: `cred_{credential_id}`
- Each credential is a box containing pipe-delimited metadata
- Data format: `hash|owner|cid|type|timestamp|status|access`
- Access grants stored in separate boxes: `g_{hash(cred_id)}_{grantee}`

**Access Control:**
- **Public credentials:** Anyone can read
- **Private credentials:** Only owner or valid access grant holders can read
- **Time-expiring grants:** Checked on-chain, automatic expiration validation
- **Revocation:** Owner can revoke accesses at any time

---

## 🔌 API Documentation

### DID Resolution Endpoint

**Endpoint:** `GET /api/identifiers/{did}`

Resolves a TrustID DID to a W3C Compliant DID Document.

**Example Request:**
```bash
curl https://yourdomain.com/api/identifiers/did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI


{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI",
  "verificationMethod": [
    {
      "id": "did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI#keys-1",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI",
      "publicKeyBase58": "..."
    }
  ],
  "authentication": [
    "did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI#keys-1"
  ]
}



Credentials API
Endpoint: GET /api/credentials/{address}

Fetch all public credentials for an Algorand address.

Example Request:
curl https://yourdomain.com/api/credentials/6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI
Response (200 OK):
{
  "credentials": [
    {
      "id": "cred_001",
      "hash": "Qm...",
      "cid": "bafyrei...",
      "type": "certificate",
      "timestamp": 1703001600,
      "access": "public"
    }
  ]
}


Debug Endpoints
GET /api/debug-boxes — Inspect all credential boxes (development only)
GET /api/test-resolver — Test DID resolution functionality


📦 Deployment
Frontend Deployment (Vercel)
Vercel is the recommended platform for Next.js deployments:
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel

Environment Variables on Vercel:
NEXT_PUBLIC_ALGORAND_APP_ID=757490823
NEXT_PUBLIC_NETWORK=testnet

Smart Contract Deployment
Deploy to Algorand Testnet:
cd algorand/projects/trustid

# Set deployer account
export DEPLOYER="<your_account_mnemonic>"

# Deploy
algokit project deploy testnet

For Mainnet deployment:
algokit project deploy mainnet

Update NEXT_PUBLIC_ALGORAND_APP_ID after deployment to reflect the new App ID.

Environment Setup Checklist
 Clone repository: git clone https://github.com/GRPS-1/TrustID.git
 Install Python 3.12+ and Node.js 18+
 Install AlgoKit: npm install -g @algorandfoundation/algokit
 Install Poetry: pip install poetry
 Generate Pera Wallet account for testing
 Create .env.local in frontend with App ID and network
 Deploy smart contracts to Algorand network
 Start frontend dev server
 Test wallet connection and credential upload

👨‍💻 Contributing
We welcome contributions! Here's how to get started:

Development Workflow
Fork the repository on GitHub

Clone your fork:
git clone https://github.com/YOUR_USERNAME/TrustID.git
cd TrustID

Create a feature branch:
git checkout -b feature/your-feature-name

Make your changes with clear commits:
git commit -m "feat: add [feature name]"
git commit -m "fix: resolve [issue]"
git commit -m "docs: update [section]"

Push and create a Pull Request:
git push origin feature/your-feature-name


Development Resources
Frontend code: frontend — React components, pages, utilities
Smart contracts: smart_contracts/trustid/contract.py
DID utilities: did.ts
Contract interaction: contract.ts
Algorand config: algorand.ts
Code Standards
TypeScript: Use strict mode, no any types
Python: Follow PEP 8, use type hints
Commits: Use conventional commits (feat:, fix:, docs:, test:)
Testing: Add tests for new features
Documentation: Update README and comments for significant changes


Reporting Issues
Found a bug? Open an issue with:

Steps to reproduce
Expected behavior
Actual behavior
Environment details

📖 References
W3C DID Specification — Official DID standard
Universal Resolver — Test DIDs globally
Algorand SDK Documentation — Algorand development
AlgoKit Documentation — Smart contract development
Next.js Documentation — Frontend framework
📄 License
This project is licensed under the MIT License — see the LICENSE file for details.

TrustID maintains full compliance with the W3C DID Core 1.0 specification and is compatible with the global DID ecosystem.

