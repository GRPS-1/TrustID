import { Metadata } from 'next';
import ProfileClient from './client';

export const metadata: Metadata = {
  title: 'My Profile - TrustID',
  description: 'Manage your Decentralized Identifier (DID) profile on the Algorand blockchain.',
  openGraph: {
    title: 'My Profile - TrustID',
    description: 'Manage your Decentralized Identifier (DID) profile on the Algorand blockchain.',
    images: [
      {
        url: '/SEO.png',
        width: 1200,
        height: 630,
        alt: 'My Profile - TrustID',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Profile - TrustID',
    description: 'Manage your Decentralized Identifier (DID) profile on the Algorand blockchain.',
    images: ['/SEO.png'],
  },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
