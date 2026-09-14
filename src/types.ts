export type UserRole = 'user' | 'admin';
export type KYCStatus = 'unverified' | 'pending' | 'verified';

export interface User {
  id: string;
  email: string;
  username: string;
  binanceId?: string;
  role: UserRole;
  kycStatus: KYCStatus;
  kycSubmittedAt?: string;
  kycVerifiedAt?: string;
  kycDocumentType?: string;
  kycDocumentNumber?: string;
  idCardNumber?: string;
  whatsappNumber?: string;
  isFrozen: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  totalTrades: number;
  completionRate: number; // e.g. 99.4
  positiveReviews: number;
  negativeReviews: number;
  phoneNumber?: string;
  country: string;
}

export type CryptoCurrency = 'USDT' | 'TRX' | 'ETH' | 'BNB';
export type BlockchainNetwork = 'TRC20' | 'ERC20' | 'BEP20' | 'TRON' | 'ETHEREUM' | 'BSC';

export interface TokenBalance {
  symbol: CryptoCurrency;
  network: BlockchainNetwork;
  networkLabel: string;
  available: number;
  lockedInEscrow: number;
  total: number;
  usdRate: number;
}

export interface UserWallet {
  userId: string;
  balances: {
    // USDT sub-networks
    usdtTrc20: number;
    usdtErc20: number;
    usdtBep20: number;
    // Native coins
    trx: number;
    eth: number;
    bnb: number;
  };
  lockedInEscrow: {
    usdt: number;
    trx: number;
    eth: number;
    bnb: number;
  };
  depositAddresses: Record<string, string>; // e.g. 'USDT-TRC20': 'TXYZ...'
}

export type DepositStatus = 'PENDING' | 'CONFIRMING' | 'COMPLETED' | 'FAILED';

export interface Deposit {
  id: string;
  userId: string;
  userEmail: string;
  currency: CryptoCurrency;
  network: BlockchainNetwork;
  amount: number;
  fee: number;
  toAddress: string;
  txHash: string;
  status: DepositStatus;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  completedAt?: string;
}

export type WithdrawalStatus = 'PENDING_APPROVAL' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';

export interface Withdrawal {
  id: string;
  userId: string;
  userEmail: string;
  currency: CryptoCurrency;
  network: BlockchainNetwork;
  amount: number;
  fee: number;
  netAmount: number;
  toAddress: string;
  txHash?: string;
  status: WithdrawalStatus;
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'P2P_ESCROW_LOCK' | 'P2P_ESCROW_RELEASE' | 'INTERNAL_TRANSFER';
export type TransactionStatus = 'COMPLETED' | 'PENDING' | 'FAILED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  cryptoCurrency: CryptoCurrency;
  amount: number;
  fee: number;
  network?: BlockchainNetwork;
  status: TransactionStatus;
  txHash?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface InternalTransfer {
  id: string;
  senderId: string;
  senderEmail: string;
  senderUsername: string;
  recipientId: string;
  recipientEmail: string;
  recipientUsername: string;
  currency: CryptoCurrency;
  amount: number;
  note?: string;
  createdAt: string;
}

export type P2POfferType = 'BUY' | 'SELL'; // Ad type: BUY = User is buying crypto, SELL = User is selling crypto
export type FiatCurrency = 'PGK' | 'USD' | 'AUD';

export interface PaymentMethodInfo {
  id: string;
  name: string;
  category: 'Bank' | 'Mobile' | 'Other';
  iconName: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  instructions?: string;
}

export interface P2POffer {
  id: string;
  userId: string;
  userUsername: string;
  userTradesCount: number;
  userCompletionRate: number;
  userRating: number;
  isMerchantVerified: boolean;
  type: P2POfferType; // SELL = Maker is selling crypto (Taker BUYS), BUY = Maker is buying crypto (Taker SELLS)
  cryptoCurrency: CryptoCurrency;
  fiatCurrency: FiatCurrency;
  pricePerUnit: number; // e.g. 4.15 PGK per USDT
  availableAmount: number; // in Crypto
  minLimit: number; // in Fiat (e.g. 100 PGK)
  maxLimit: number; // in Fiat (e.g. 5000 PGK)
  paymentMethods: string[]; // ['Bank of South Pacific (BSP)', 'Kina Bank', 'Digicel CellMoni']
  paymentWindowMinutes: number; // e.g. 15 or 30 mins
  terms: string;
  autoReply?: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  createdAt: string;
}

export type P2PTradeStatus = 
  | 'AWAITING_PAYMENT' 
  | 'PAID' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'DISPUTED';

export interface P2PTradeOrder {
  id: string;
  offerId: string;
  buyerId: string;
  buyerUsername: string;
  buyerEmail: string;
  sellerId: string;
  sellerUsername: string;
  sellerEmail: string;
  cryptoCurrency: CryptoCurrency;
  fiatCurrency: FiatCurrency;
  cryptoAmount: number;
  fiatAmount: number;
  pricePerUnit: number;
  status: P2PTradeStatus;
  escrowLocked: boolean;
  selectedPaymentMethod: string;
  sellerPaymentDetails: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    mobileNumber?: string;
    referenceCode?: string;
    notes?: string;
  };
  paymentReference?: string;
  paymentProofUrl?: string;
  disputeReason?: string;
  disputeRaisedBy?: string;
  disputeWinnerId?: string;
  adminResolutionNote?: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  completedAt?: string;
}

export interface P2PChatMessage {
  id: string;
  tradeId: string;
  senderId: string;
  senderUsername: string;
  message: string;
  isSystem: boolean;
  timestamp: string;
  attachmentUrl?: string;
}

export type TicketCategory = 
  | 'P2P_DISPUTE' 
  | 'DEPOSIT_ISSUE' 
  | 'WITHDRAWAL_DELAY' 
  | 'KYC_VERIFICATION' 
  | 'ACCOUNT_SECURITY' 
  | 'GENERAL';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  message: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  tradeId?: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface PlatformStats {
  totalUsers: number;
  total24hVolumeUsd: number;
  totalTradesCompleted: number;
  escrowLockedUsdt: number;
  pendingWithdrawalsCount: number;
  pendingWithdrawalsUsd: number;
  pendingDepositsCount: number;
  activeDisputesCount: number;
  openTicketsCount: number;
}
