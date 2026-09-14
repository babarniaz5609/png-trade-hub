/**
 * Tatum Blockchain Integration Architecture Definition
 * Secure server-side interface for future multi-chain Tatum API v3/v4 integration
 * Supported: USDT (TRC20, ERC20, BEP20), TRX, ETH, BNB
 */

export interface TatumChainConfig {
  name: string;
  symbol: string;
  networkKey: string;
  chain: 'TRON' | 'ETHEREUM' | 'BSC';
  network?: string;
  nativeAsset?: string;
  estFee?: number | string;
  protocol: 'TRC20' | 'ERC20' | 'BEP20' | 'NATIVE';
  contractAddress?: string;
  decimals: number;
  explorerTxUrl: string;
  explorerAddressUrl: string;
  averageBlockTimeSec: number;
  standardWithdrawalFee: number;
  testnetContractAddress?: string;
}

export const TATUM_SUPPORTED_CHAINS: Record<string, TatumChainConfig> = {
  'USDT-TRC20': {
    name: 'Tether USD (TRC-20)',
    symbol: 'USDT',
    networkKey: 'TRC20',
    network: 'TRON (TRC-20)',
    nativeAsset: 'TRX (Gas)',
    estFee: '1.5 USDT',
    chain: 'TRON',
    protocol: 'TRC20',
    contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    testnetContractAddress: 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
    decimals: 6,
    explorerTxUrl: 'https://tronscan.org/#/transaction/',
    explorerAddressUrl: 'https://tronscan.org/#/address/',
    averageBlockTimeSec: 3,
    standardWithdrawalFee: 1.5, // 1.5 USDT
  },
  'USDT-BEP20': {
    name: 'Tether USD (BEP-20)',
    symbol: 'USDT',
    networkKey: 'BEP20',
    network: 'BNB Smart Chain (BEP-20)',
    nativeAsset: 'BNB (Gas)',
    estFee: '0.8 USDT',
    chain: 'BSC',
    protocol: 'BEP20',
    contractAddress: '0x55d398326f99059ff775485246999027b3197955',
    testnetContractAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    decimals: 18,
    explorerTxUrl: 'https://bscscan.com/tx/',
    explorerAddressUrl: 'https://bscscan.com/address/',
    averageBlockTimeSec: 3,
    standardWithdrawalFee: 0.8, // 0.8 USDT
  },
  'USDT-ERC20': {
    name: 'Tether USD (ERC-20)',
    symbol: 'USDT',
    networkKey: 'ERC20',
    network: 'Ethereum (ERC-20)',
    nativeAsset: 'ETH (Gas)',
    estFee: '5.0 USDT',
    chain: 'ETHEREUM',
    protocol: 'ERC20',
    contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    testnetContractAddress: '0x6175a82C3fDeFF9e5d7D05096b68701077610411',
    decimals: 6,
    explorerTxUrl: 'https://etherscan.io/tx/',
    explorerAddressUrl: 'https://etherscan.io/address/',
    averageBlockTimeSec: 12,
    standardWithdrawalFee: 5.0, // 5.0 USDT (Ethereum gas)
  },
  'TRX': {
    name: 'TRON (TRX)',
    symbol: 'TRX',
    networkKey: 'TRON',
    network: 'TRON Network',
    nativeAsset: 'TRX',
    estFee: '2.0 TRX',
    chain: 'TRON',
    protocol: 'NATIVE',
    decimals: 6,
    explorerTxUrl: 'https://tronscan.org/#/transaction/',
    explorerAddressUrl: 'https://tronscan.org/#/address/',
    averageBlockTimeSec: 3,
    standardWithdrawalFee: 2.0, // 2 TRX
  },
  'BNB': {
    name: 'BNB Smart Chain (BNB)',
    symbol: 'BNB',
    networkKey: 'BSC',
    network: 'BNB Chain',
    nativeAsset: 'BNB',
    estFee: '0.001 BNB',
    chain: 'BSC',
    protocol: 'NATIVE',
    decimals: 18,
    explorerTxUrl: 'https://bscscan.com/tx/',
    explorerAddressUrl: 'https://bscscan.com/address/',
    averageBlockTimeSec: 3,
    standardWithdrawalFee: 0.001, // 0.001 BNB
  },
  'ETH': {
    name: 'Ethereum (ETH)',
    symbol: 'ETH',
    networkKey: 'ETHEREUM',
    network: 'Ethereum Mainnet',
    nativeAsset: 'ETH',
    estFee: '0.003 ETH',
    chain: 'ETHEREUM',
    protocol: 'NATIVE',
    decimals: 18,
    explorerTxUrl: 'https://etherscan.io/tx/',
    explorerAddressUrl: 'https://etherscan.io/address/',
    averageBlockTimeSec: 12,
    standardWithdrawalFee: 0.003, // 0.003 ETH
  }
};

export interface TatumWebhookEvent {
  subscriptionType: 'ADDRESS_TRANSACTION';
  chain: string;
  txId: string;
  blockNumber: number;
  subscriptionId: string;
  address: string;
  counterAddress?: string;
  amount: string;
  tokenAddress?: string; // Contract address for USDT
  currency: string;
}

export const PNG_PAYMENT_METHODS = [
  { id: 'bsp', name: 'Bank South Pacific (BSP)', category: 'Bank', fee: '0%', badge: 'Popular in PNG' },
  { id: 'kina_bank', name: 'Kina Bank', category: 'Bank', fee: '0%', badge: 'Instant App Transfer' },
  { id: 'cellmoni', name: 'Digicel CellMoni', category: 'Mobile', fee: '0%', badge: 'Mobile Wallet' },
  { id: 'anz_png', name: 'ANZ Papua New Guinea', category: 'Bank', fee: '0%', badge: 'Corporate/Private' },
  { id: 'moniplus', name: 'MoniPlus', category: 'Mobile', fee: '0%', badge: 'Fast Transfer' },
  { id: 'wise', name: 'Wise (International)', category: 'Other', fee: '0%', badge: 'AUD / USD' },
  { id: 'cash_pom', name: 'Cash in Person (Port Moresby)', category: 'Other', fee: '0%', badge: 'Escrow Meetup' },
];

export const FIAT_RATES: Record<string, number> = {
  PGK: 4.18, // 1 USDT = ~4.18 PNG Kina
  USD: 1.00,
  AUD: 1.54,
};
