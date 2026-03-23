import { Metadata } from 'next';
import DIDResolverClient from './client';

export const metadata: Metadata = {
  title: 'DID Resolver - TrustID',
  description: 'Resolve and verify Decentralized Identifiers (DIDs) on the Algorand blockchain.',
  openGraph: {
    title: 'DID Resolver - TrustID',
    description: 'Resolve and verify Decentralized Identifiers (DIDs) on the Algorand blockchain.',
    images: [
      {
        url: '/SEO.png',
        width: 1200,
        height: 630,
        alt: 'DID Resolver - TrustID',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DID Resolver - TrustID',
    description: 'Resolve and verify Decentralized Identifiers (DIDs) on the Algorand blockchain.',
    images: ['/SEO.png'],
  },
};

export default function DIDResolverPage() {
  return <DIDResolverClient />;
}
