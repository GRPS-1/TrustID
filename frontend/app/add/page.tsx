import { Metadata } from 'next';
import AddCredentialClient from './client';

export const metadata: Metadata = {
  title: 'Add New Credential - TrustID',
  description: 'Securely add a new credential to your digital identity on the Algorand blockchain.',
  openGraph: {
    title: 'Add New Credential - TrustID',
    description: 'Securely add a new credential to your digital identity on the Algorand blockchain.',
    images: [
      {
        url: '/SEO.png',
        width: 1200,
        height: 630,
        alt: 'Add New Credential - TrustID',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Add New Credential - TrustID',
    description: 'Securely add a new credential to your digital identity on the Algorand blockchain.',
    images: ['/SEO.png'],
  },
};

export default function AddCredentialPage() {
  return <AddCredentialClient />;
}
