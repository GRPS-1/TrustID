import { Metadata } from 'next';
import VerifyClient from './client';

export const metadata: Metadata = {
  title: 'Verify Credential - TrustID',
  description: 'Verify the authenticity of a credential by checking its hash on the Algorand blockchain.',
  openGraph: {
    title: 'Verify Credential - TrustID',
    description: 'Verify the authenticity of a credential by checking its hash on the Algorand blockchain.',
    images: [
      {
        url: '/SEO.png',
        width: 1200,
        height: 630,
        alt: 'Verify Credential - TrustID',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verify Credential - TrustID',
    description: 'Verify the authenticity of a credential by checking its hash on the Algorand blockchain.',
    images: ['/SEO.png'],
  },
};

export default function VerifyPage() {
  return <VerifyClient />;
}
