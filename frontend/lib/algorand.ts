import algosdk from 'algosdk';

export const APP_ID = parseInt(process.env.NEXT_PUBLIC_ALGORAND_APP_ID || '757490823');

export const algodClient = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  ''
);

export const indexerClient = new algosdk.Indexer(
  '',
  'https://testnet-idx.algonode.cloud',
  ''
);
