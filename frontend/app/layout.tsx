import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletProvider } from '../components/WalletProvider';
import LayoutClient from '../components/LayoutClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TrustID - Blockchain Identity Protection',
  description: 'Secure, decentralized identity verification on Algorand blockchain',
  icons: {
    icon: '/shield.svg',
  },
  openGraph: {
    title: 'TrustID - Blockchain Identity Protection',
    description: 'Secure, decentralized identity verification on Algorand blockchain',
    images: [
      {
        url: '/SEO.png',
        width: 1200,
        height: 630,
        alt: 'TrustID - Blockchain Identity Protection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrustID - Blockchain Identity Protection',
    description: 'Secure, decentralized identity verification on Algorand blockchain',
    images: ['/SEO.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <WalletProvider>
          <LayoutClient>{children}</LayoutClient>
        </WalletProvider>
      </body>
    </html>
  );
}
