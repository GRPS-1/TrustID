import { Metadata } from 'next';
import MyCredentialsClient from './client';

export const metadata: Metadata = {
  title: 'My Credentials - TrustID',
  description: 'View and manage your decentralized credentials on the Algorand blockchain.',
  openGraph: {
    title: 'My Credentials - TrustID',
    description: 'View and manage your decentralized credentials on the Algorand blockchain.',
    images: [
      {
        url: '/SEO.png',
        width: 1200,
        height: 630,
        alt: 'My Credentials - TrustID',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Credentials - TrustID',
    description: 'View and manage your decentralized credentials on the Algorand blockchain.',
    images: ['/SEO.png'],
  },
};

export default function MyCredentialsPage() {
  return <MyCredentialsClient />;
}
