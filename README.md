# TrustID - Blockchain Identity Protection

A modern, professional decentralized identity verification system built on Algorand blockchain.

## 🎨 Features

- **Modern UI/UX**: Clean, professional design with smooth animations
- **Multi-page Architecture**: Separate pages for different functionalities
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Lucide Icons**: Professional icon system throughout the app
- **Real-time Verification**: Instant credential verification
- **Wallet Integration**: Seamless Pera Wallet connection
- **W3C DID Compliance**: Universal Resolver compatible DID resolution
- **Decentralized Identity**: Full DID document support with verification methods

## 📱 Pages

### Home (`/`)
- Hero section with call-to-action
- Feature highlights
- How it works section
- Use cases showcase
- CTA section

### Add Credential (`/add`)
- Drag & drop file upload
- Form validation
- Real-time status updates
- Transaction tracking
- Info sidebar with process explanation

### Verify (`/verify`)
- Simple verification interface
- Visual verification results
- No wallet required
- Public verification

### My Credentials (`/my-credentials`)
- Credential dashboard
- Stats overview
- Manage credentials
- View credential details

### DID Resolver (`/did`)
- Resolve DIDs to DID documents
- View verification methods
- Display public credentials
- W3C DID specification compliant

### Profile (`/profile`)
- Create and manage DID
- Update profile information
- View DID document

### Share (`/share`)
- Share credentials securely
- Generate shareable links
- Control access permissions

## 🌐 DID Resolution API

TrustID implements a W3C-compliant DID Resolution API that makes your DIDs resolvable by the Universal Resolver.

### Your DID Format
```
did:algo:testnet:YOUR_ALGORAND_ADDRESS
```

Example:
```
did:algo:testnet:6E245BTHAHMBX6NCGEH2FE7MPPD7HB5AYNXNTHADTCE6RW46MEN7YNTZCI
```

### Resolution Endpoint
```
GET /api/identifiers/{did}
```

### Testing Your DID

Once deployed, your DID will be resolvable at:
```
https://your-domain.com/api/identifiers/did:algo:testnet:YOUR_ADDRESS
```

### Universal Resolver Integration

To make your DIDs resolvable by https://dev.uniresolver.io/:

1. Deploy your TrustID app to a public domain (Vercel, Netlify, etc.)
2. Your DID resolution endpoint will be: `https://your-domain.com/api/identifiers/{did}`
3. Test with curl:
   ```bash
   curl -H "Accept: application/did+ld+json" \
     https://your-domain.com/api/identifiers/did:algo:testnet:YOUR_ADDRESS
   ```

For detailed API documentation, see [DID_RESOLVER_API.md](./DID_RESOLVER_API.md)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Pera Wallet (mobile app or browser extension)
- Pinata account for IPFS

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Pinata JWT

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎨 Design System

### Colors
- Primary: Blue (#2563eb) to Indigo (#4f46e5)
- Success: Green (#16a34a) to Emerald (#059669)
- Error: Red (#dc2626)
- Warning: Amber (#f59e0b)

### Typography
- Font: Inter (Google Fonts)
- Headings: Bold, 2xl-6xl
- Body: Regular, base-lg

### Components
- Rounded corners: 8px (lg), 16px (2xl)
- Shadows: Subtle elevation
- Borders: 1-2px, gray-200
- Spacing: Consistent 4px grid

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Blockchain**: Algorand SDK
- **Wallet**: Pera Wallet Connect
- **Storage**: IPFS (Pinata)

## 🏗️ Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with navbar/footer
│   ├── page.tsx                # Home page
│   ├── add/
│   │   └── page.tsx            # Add credential page
│   ├── verify/
│   │   └── page.tsx            # Verify credential page
│   └── my-credentials/
│       └── page.tsx            # My credentials page
├── components/
│   ├── Navbar.tsx              # Navigation bar
│   └── Footer.tsx              # Footer
├── lib/
│   ├── algorand.ts             # Algorand client
│   ├── contract.ts             # Smart contract functions
│   └── utils.ts                # Utility functions
└── public/                     # Static assets
```

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_ALGORAND_APP_ID=757490823
NEXT_PUBLIC_ALGORAND_NETWORK=testnet
NEXT_PUBLIC_PINATA_JWT=your_jwt_here
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud
```

### Pinata Setup

1. Sign up at [pinata.cloud](https://pinata.cloud)
2. Create API key with pinning permissions
3. Copy JWT token to `.env.local`

## 🎯 Usage

### Adding a Credential

1. Connect Pera Wallet
2. Navigate to "Add Credential"
3. Fill in credential details
4. Upload document
5. Confirm transaction
6. Wait for blockchain confirmation

### Verifying a Credential

1. Navigate to "Verify"
2. Enter credential ID
3. Upload document
4. View verification result

### Managing Credentials

1. Connect wallet
2. Navigate to "My Credentials"
3. View all your credentials
4. Manage access and status

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Other Platforms

```bash
npm run build
npm start
```

## 🔒 Security

- Client-side hashing (SHA-256)
- Blockchain immutability
- IPFS decentralized storage
- Wallet-based authentication
- No central database

## 📝 License

Educational project for blockchain identity management.

## 🤝 Contributing

Contributions welcome! Please follow the existing code style and design patterns.

## 📧 Support

For issues or questions, please open a GitHub issue.

---

Built with ❤️ using Next.js, Algorand, and IPFS
