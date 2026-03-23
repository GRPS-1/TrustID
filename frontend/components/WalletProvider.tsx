'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

interface WalletContextType {
  accountAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  peraWallet: PeraWalletConnect;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

const peraWallet = new PeraWalletConnect();

export function WalletProvider({ children }: { children: ReactNode }) {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);

  useEffect(() => {
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length) {
        setAccountAddress(accounts[0]);
      }
    });

    peraWallet.connector?.on('disconnect', () => {
      setAccountAddress(null);
    });
  }, []);

  const connect = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAccountAddress(accounts[0]);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const disconnect = () => {
    peraWallet.disconnect();
    setAccountAddress(null);
  };

  return (
    <WalletContext.Provider value={{ accountAddress, connect, disconnect, peraWallet }}>
      {children}
    </WalletContext.Provider>
  );
}
