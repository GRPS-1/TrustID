'use client';

import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useWallet } from '@/components/WalletProvider';

export default function LayoutClient({ children }: { children: ReactNode }) {
  const { accountAddress, connect, disconnect } = useWallet();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar
        accountAddress={accountAddress}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
