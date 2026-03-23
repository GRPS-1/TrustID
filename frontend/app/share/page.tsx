import { Metadata } from 'next';
import ShareCredentialsClient from './client';

export const metadata: Metadata = {
  title: 'Share Credentials - TrustID',
  description: 'Securely share your private credentials with others for a specified period.',
  openGraph: {
    title: 'Share Credentials - TrustID',
    description: 'Securely share your private credentials with others for a specified period.',
    images: [
      {
        url: '/SEO.png',
        width: 1200,
        height: 630,
        alt: 'Share Credentials - TrustID',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Share Credentials - TrustID',
    description: 'Securely share your private credentials with others for a specified period.',
    images: ['/SEO.png'],
  },
};

export default function ShareCredentialsPage() {
  return <ShareCredentialsClient />;
}
