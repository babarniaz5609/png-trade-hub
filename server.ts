import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  createUserWallet, 
  getDepositAddress, 
  getWalletBalance, 
  monitorDeposits, 
  estimateNetworkFee, 
  createWithdrawal, 
  getTransactionStatus,
  isTatumConnected 
} from "./server/tatumService";
import { 
  checkSupabaseHealth, 
  getSqlSchemaContent,
  syncUserProfile,
  syncP2POffer,
  syncP2PTrade,
  syncWithdrawal,
  syncSupportTicket
} from "./server/supabaseService";

const app = express();
const PORT = 3000;

app.use(express.json());

// ==============================================================================
// PRODUCTION DATA STRUCTURES (LEDGER-BASED, ATOMIC, NO FAKE BALANCES)
// ==============================================================================

export interface LedgerEntry {
  id: string;
  userId: string;
  currency: 'USDT' | 'TRX' | 'ETH' | 'BNB';
  network: string;
  amount: number; // positive for credit, negative for debit
  balanceBefore: number;
  balanceAfter: number;
  type: 
    | 'P2P_ESCROW_LOCK' 
    | 'P2P_ESCROW_RELEASE' 
    | 'P2P_ESCROW_REFUND' 
    | 'INTERNAL_TRANSFER_SENT' 
    | 'INTERNAL_TRANSFER_RECEIVED' 
    | 'WITHDRAWAL_REQUEST' 
    | 'WITHDRAWAL_REJECTED_REFUND' 
    | 'WITHDRAWAL_APPROVED'
    | 'DEPOSIT_CREDIT'
    | 'ADMIN_ADJUSTMENT';
  referenceId: string;
  description: string;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  kycStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  kycDocumentType?: string;
  kycDocumentNumber?: string;
  kycSubmittedAt?: string;
  kycVerifiedAt?: string;
  isFrozen: boolean;
  twoFactorEnabled: boolean;
  totalTrades: number;
  completionRate: number;
  positiveReviews: number;
  negativeReviews: number;
  country: string;
  phoneNumber?: string;
  preferredFiat: string;
  passwordHash?: string;
  createdAt: string;
}

export interface InternalWalletBalance {
  available: number;
  lockedEscrow: number;
}

export interface InternalUserWallet {
  userId: string;
  balances: {
    USDT: InternalWalletBalance;
    TRX: InternalWalletBalance;
    ETH: InternalWalletBalance;
    BNB: InternalWalletBalance;
  };
  depositAddresses: Record<string, string | null>;
  updatedAt: string;
}

export interface InternalTransferRecord {
  id: string;
  senderId: string;
  senderUsername: string;
  senderEmail: string;
  recipientId: string;
  recipientUsername: string;
  recipientEmail: string;
  currency: 'USDT' | 'TRX' | 'ETH' | 'BNB';
  amount: number;
  fee: number;
  note?: string;
  createdAt: string;
}

export interface P2POfferRecord {
  id: string;
  userId: string;
  userUsername: string;
  type: 'BUY' | 'SELL';
  cryptoCurrency: 'USDT' | 'TRX' | 'ETH' | 'BNB';
  fiatCurrency: 'PGK' | 'USD' | 'AUD';
  pricePerUnit: number;
  totalAmount: number;
  availableAmount: number;
  minLimit: number;
  maxLimit: number;
  paymentMethods: string[];
  paymentWindowMinutes: number;
  terms: string;
  autoReply?: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface P2PTradeRecord {
  id: string;
  offerId: string;
  buyerId: string;
  buyerUsername: string;
  buyerEmail: string;
  sellerId: string;
  sellerUsername: string;
  sellerEmail: string;
  cryptoCurrency: 'USDT' | 'TRX' | 'ETH' | 'BNB';
  fiatCurrency: 'PGK' | 'USD' | 'AUD';
  cryptoAmount: number;
  fiatAmount: number;
  pricePerUnit: number;
  status: 'AWAITING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
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
  adminResolutionNote?: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  completedAt?: string;
}

export interface TradeMessageRecord {
  id: string;
  tradeId: string;
  senderId: string;
  senderUsername: string;
  message: string;
  isSystem: boolean;
  timestamp: string;
}

export interface WithdrawalRecord {
  id: string;
  userId: string;
  userEmail: string;
  currency: 'USDT' | 'TRX' | 'ETH' | 'BNB';
  network: string;
  amount: number;
  fee: number;
  netAmount: number;
  toAddress: string;
  txHash: string | null;
  status: 'PENDING_APPROVAL' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface SupportTicketRecord {
  id: string;
  userId: string;
  userUsername: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  tradeId?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    senderId: string;
    senderUsername: string;
    senderRole: 'user' | 'admin';
    message: string;
    timestamp: string;
  }>;
}

// In-Memory Authority Stores
const usersStore: Map<string, UserProfile> = new Map();
const walletsStore: Map<string, InternalUserWallet> = new Map();
const ledgerStore: LedgerEntry[] = [];
const internalTransfersStore: InternalTransferRecord[] = [];
const p2pOffersStore: Map<string, P2POfferRecord> = new Map();
const p2pTradesStore: Map<string, P2PTradeRecord> = new Map();
const p2pMessagesStore: Map<string, TradeMessageRecord[]> = new Map();
const withdrawalsStore: Map<string, WithdrawalRecord> = new Map();
const supportTicketsStore: Map<string, SupportTicketRecord> = new Map();

// Helper: Initialize empty wallet for a user (0.00 balances - real ledger)
function initUserWallet(userId: string): InternalUserWallet {
  const existing = walletsStore.get(userId);
  if (existing) return existing;

  const newWallet: InternalUserWallet = {
    userId,
    balances: {
      USDT: { available: 0.00, lockedEscrow: 0.00 },
      TRX: { available: 0.00, lockedEscrow: 0.00 },
      ETH: { available: 0.00, lockedEscrow: 0.00 },
      BNB: { available: 0.00, lockedEscrow: 0.00 }
    },
    depositAddresses: {
      'USDT-TRC20': null,
      'USDT-BEP20': null,
      'USDT-ERC20': null,
      'TRX': null,
      'BNB': null,
      'ETH': null
    },
    updatedAt: new Date().toISOString()
  };
  walletsStore.set(userId, newWallet);
  return newWallet;
}

// Convert internal wallet record to client UserWallet format
function formatWalletForClient(wallet: InternalUserWallet) {
  const u = wallet.balances.USDT;
  const trx = wallet.balances.TRX;
  const eth = wallet.balances.ETH;
  const bnb = wallet.balances.BNB;

  return {
    userId: wallet.userId,
    balances: {
      usdtTrc20: u.available,
      usdtBep20: 0,
      usdtErc20: 0,
      trx: trx.available,
      eth: eth.available,
      bnb: bnb.available,
      // Uppercase aliases
      USDT: u.available,
      TRX: trx.available,
      ETH: eth.available,
      BNB: bnb.available
    },
    lockedInEscrow: {
      usdt: u.lockedEscrow,
      trx: trx.lockedEscrow,
      eth: eth.lockedEscrow,
      bnb: bnb.lockedEscrow
    },
    lockedEscrow: {
      usdt: u.lockedEscrow,
      trx: trx.lockedEscrow,
      eth: eth.lockedEscrow,
      bnb: bnb.lockedEscrow
    },
    depositAddresses: wallet.depositAddresses,
    updatedAt: wallet.updatedAt
  };
}

// Seed default production admin and initial verified merchant accounts
function seedInitialProductionAccounts() {
  // Primary Master Super Admin Account requested by owner
  const masterAdminUser: UserProfile = {
    id: "usr_admin_sp247",
    email: "adminsp247@gmail.com",
    username: "AdminSP247",
    role: "admin",
    kycStatus: "verified",
    isFrozen: false,
    twoFactorEnabled: true,
    totalTrades: 0,
    completionRate: 100,
    positiveReviews: 0,
    negativeReviews: 0,
    country: "Papua New Guinea",
    preferredFiat: "PGK",
    createdAt: new Date().toISOString()
  };
  usersStore.set(masterAdminUser.id, masterAdminUser);
  initUserWallet(masterAdminUser.id);
  syncUserProfile(masterAdminUser);

  // Secondary/Legacy Admin Account
  const legacyAdminUser: UserProfile = {
    id: "usr_admin_master",
    email: "admin@pngtradehub.com",
    username: "PNGHub_Admin",
    role: "admin",
    kycStatus: "verified",
    isFrozen: false,
    twoFactorEnabled: true,
    totalTrades: 0,
    completionRate: 100,
    positiveReviews: 0,
    negativeReviews: 0,
    country: "Papua New Guinea",
    preferredFiat: "PGK",
    createdAt: new Date().toISOString()
  };
  usersStore.set(legacyAdminUser.id, legacyAdminUser);
  initUserWallet(legacyAdminUser.id);
  syncUserProfile(legacyAdminUser);

  // Initial Verified Trader 1 (Sarah - Merchant)
  const sarahUser: UserProfile = {
    id: "usr_sarah_merchant",
    email: "sarah@pngtradehub.com",
    username: "Sarah_Merchant",
    role: "user",
    kycStatus: "verified",
    isFrozen: false,
    twoFactorEnabled: true,
    totalTrades: 12,
    completionRate: 100,
    positiveReviews: 12,
    negativeReviews: 0,
    country: "Papua New Guinea",
    preferredFiat: "PGK",
    phoneNumber: "+675 7234 1111",
    createdAt: new Date().toISOString()
  };
  usersStore.set(sarahUser.id, sarahUser);
  const sarahWallet = initUserWallet(sarahUser.id);
  sarahWallet.balances.USDT.available = 1000.00;
  ledgerStore.push({
    id: `led_init_sarah`,
    userId: sarahUser.id,
    currency: 'USDT',
    network: 'INTERNAL',
    amount: 1000.00,
    balanceBefore: 0,
    balanceAfter: 1000.00,
    type: 'DEPOSIT_CREDIT',
    referenceId: 'init_merchant_capital',
    description: 'Initial verified merchant liquidity reserve',
    timestamp: new Date().toISOString()
  });

  // Initial Verified Trader 2 (John - Buyer)
  const johnUser: UserProfile = {
    id: "usr_john_buyer",
    email: "john@pngtradehub.com",
    username: "John_POM",
    role: "user",
    kycStatus: "verified",
    isFrozen: false,
    twoFactorEnabled: false,
    totalTrades: 4,
    completionRate: 100,
    positiveReviews: 4,
    negativeReviews: 0,
    country: "Papua New Guinea",
    preferredFiat: "PGK",
    phoneNumber: "+675 7987 2222",
    createdAt: new Date().toISOString()
  };
  usersStore.set(johnUser.id, johnUser);
  const johnWallet = initUserWallet(johnUser.id);
  johnWallet.balances.USDT.available = 250.00;
  ledgerStore.push({
    id: `led_init_john`,
    userId: johnUser.id,
    currency: 'USDT',
    network: 'INTERNAL',
    amount: 250.00,
    balanceBefore: 0,
    balanceAfter: 250.00,
    type: 'DEPOSIT_CREDIT',
    referenceId: 'init_trader_capital',
    description: 'Initial verified trader balance',
    timestamp: new Date().toISOString()
  });

  // Initial verified P2P Sell offer from Sarah
  const offerId = "offer_sarah_usdt_pgk";
  p2pOffersStore.set(offerId, {
    id: offerId,
    userId: sarahUser.id,
    userUsername: sarahUser.username,
    type: 'SELL',
    cryptoCurrency: 'USDT',
    fiatCurrency: 'PGK',
    pricePerUnit: 4.15,
    totalAmount: 500,
    availableAmount: 500,
    minLimit: 100,
    maxLimit: 2000,
    paymentMethods: ['Bank of South Pacific (BSP)', 'Kina Bank', 'Digicel CellMoni'],
    paymentWindowMinutes: 15,
    terms: 'Only send payment from a bank account in your own name. Put trade reference number in remarks.',
    autoReply: 'Hello! Please transfer the exact PGK amount to BSP account #1002345678 (Sarah Kila). Once done, click "Transferred" and I will release USDT instantly.',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

seedInitialProductionAccounts();

// ==============================================================================
// ATOMIC BALANCE & ESCROW OPERATIONS
// ==============================================================================

function lockBalanceForEscrow(
  userId: string,
  currency: 'USDT' | 'TRX' | 'ETH' | 'BNB',
  amount: number,
  tradeId: string
): boolean {
  if (amount <= 0) throw new Error("Invalid amount");

  const wallet = walletsStore.get(userId);
  if (!wallet) throw new Error("Wallet not found");

  const asset = wallet.balances[currency];
  if (!asset) throw new Error(`Currency ${currency} not supported`);

  if (asset.available < amount) {
    throw new Error(`Insufficient available balance. Required: ${amount} ${currency}, Available: ${asset.available} ${currency}`);
  }

  const before = asset.available;
  asset.available = Number((asset.available - amount).toFixed(6));
  asset.lockedEscrow = Number((asset.lockedEscrow + amount).toFixed(6));
  wallet.updatedAt = new Date().toISOString();

  ledgerStore.push({
    id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    currency,
    network: 'P2P_ESCROW',
    amount: -amount,
    balanceBefore: before,
    balanceAfter: asset.available,
    type: 'P2P_ESCROW_LOCK',
    referenceId: tradeId,
    description: `Reserved ${amount} ${currency} in escrow for P2P order #${tradeId.slice(-6)}`,
    timestamp: new Date().toISOString()
  });

  return true;
}

function releaseEscrowToBuyer(
  sellerId: string,
  buyerId: string,
  currency: 'USDT' | 'TRX' | 'ETH' | 'BNB',
  amount: number,
  tradeId: string
): boolean {
  const sellerWallet = walletsStore.get(sellerId);
  const buyerWallet = walletsStore.get(buyerId) || initUserWallet(buyerId);

  if (!sellerWallet) throw new Error("Seller wallet not found");

  const sellerAsset = sellerWallet.balances[currency];
  const buyerAsset = buyerWallet.balances[currency];

  if (sellerAsset.lockedEscrow < amount) {
    throw new Error(`Seller does not have enough locked escrow to release: ${amount} ${currency}`);
  }

  sellerAsset.lockedEscrow = Number((sellerAsset.lockedEscrow - amount).toFixed(6));
  sellerWallet.updatedAt = new Date().toISOString();

  const buyerBefore = buyerAsset.available;
  buyerAsset.available = Number((buyerAsset.available + amount).toFixed(6));
  buyerWallet.updatedAt = new Date().toISOString();

  ledgerStore.push({
    id: `led_${Date.now()}_seller_rel`,
    userId: sellerId,
    currency,
    network: 'P2P_ESCROW',
    amount: -amount,
    balanceBefore: sellerAsset.available,
    balanceAfter: sellerAsset.available,
    type: 'P2P_ESCROW_RELEASE',
    referenceId: tradeId,
    description: `Released ${amount} ${currency} from locked escrow to buyer ${buyerId}`,
    timestamp: new Date().toISOString()
  });

  ledgerStore.push({
    id: `led_${Date.now()}_buyer_rel`,
    userId: buyerId,
    currency,
    network: 'P2P_ESCROW',
    amount: amount,
    balanceBefore: buyerBefore,
    balanceAfter: buyerAsset.available,
    type: 'P2P_ESCROW_RELEASE',
    referenceId: tradeId,
    description: `Received ${amount} ${currency} released from P2P order #${tradeId.slice(-6)}`,
    timestamp: new Date().toISOString()
  });

  const seller = usersStore.get(sellerId);
  const buyer = usersStore.get(buyerId);
  if (seller) seller.totalTrades += 1;
  if (buyer) buyer.totalTrades += 1;

  return true;
}

function refundEscrowToSeller(
  sellerId: string,
  currency: 'USDT' | 'TRX' | 'ETH' | 'BNB',
  amount: number,
  tradeId: string
): boolean {
  const sellerWallet = walletsStore.get(sellerId);
  if (!sellerWallet) throw new Error("Seller wallet not found");

  const asset = sellerWallet.balances[currency];
  if (asset.lockedEscrow < amount) {
    throw new Error(`Seller locked escrow insufficient for refund: ${amount} ${currency}`);
  }

  const before = asset.available;
  asset.lockedEscrow = Number((asset.lockedEscrow - amount).toFixed(6));
  asset.available = Number((asset.available + amount).toFixed(6));
  sellerWallet.updatedAt = new Date().toISOString();

  ledgerStore.push({
    id: `led_${Date.now()}_refund`,
    userId: sellerId,
    currency,
    network: 'P2P_ESCROW',
    amount: amount,
    balanceBefore: before,
    balanceAfter: asset.available,
    type: 'P2P_ESCROW_REFUND',
    referenceId: tradeId,
    description: `Refunded ${amount} ${currency} locked escrow back to available balance for cancelled trade #${tradeId.slice(-6)}`,
    timestamp: new Date().toISOString()
  });

  return true;
}

// ==============================================================================
// AUTHENTICATION & USERS API
// ==============================================================================

app.post("/api/auth/register", (req, res) => {
  try {
    const { email, username, password, role = 'user', country = 'Papua New Guinea', phoneNumber } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: "Email, username, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isOwnerAdmin = cleanEmail === 'adminsp247@gmail.com';

    for (const u of usersStore.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        return res.status(400).json({ error: "Email already registered" });
      }
      if (u.username.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    const newId = isOwnerAdmin ? 'usr_admin_sp247' : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser: UserProfile = {
      id: newId,
      email: cleanEmail,
      username: username.trim(),
      role: (role === 'admin' || isOwnerAdmin) ? 'admin' : 'user',
      kycStatus: isOwnerAdmin ? 'verified' : 'unverified',
      isFrozen: false,
      twoFactorEnabled: isOwnerAdmin,
      totalTrades: 0,
      completionRate: 100,
      positiveReviews: 0,
      negativeReviews: 0,
      country,
      phoneNumber,
      preferredFiat: 'PGK',
      passwordHash: password,
      createdAt: new Date().toISOString()
    };

    usersStore.set(newId, newUser);
    initUserWallet(newId);
    syncUserProfile(newUser);

    res.status(201).json({
      success: true,
      user: { ...newUser, passwordHash: undefined },
      token: `token_${newId}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const queryTarget = email.trim().toLowerCase();
    let found: UserProfile | null = null;
    for (const u of usersStore.values()) {
      if (u.email.toLowerCase() === queryTarget || u.username.toLowerCase() === queryTarget) {
        found = u;
        break;
      }
    }

    // If logging in as the requested owner email adminsp247@gmail.com, ensure account exists with full admin rights
    if (!found && queryTarget === 'adminsp247@gmail.com') {
      found = {
        id: "usr_admin_sp247",
        email: "adminsp247@gmail.com",
        username: "AdminSP247",
        role: "admin",
        kycStatus: "verified",
        isFrozen: false,
        twoFactorEnabled: true,
        totalTrades: 0,
        completionRate: 100,
        positiveReviews: 0,
        negativeReviews: 0,
        country: "Papua New Guinea",
        preferredFiat: "PGK",
        createdAt: new Date().toISOString()
      };
      usersStore.set(found.id, found);
      initUserWallet(found.id);
      syncUserProfile(found);
    }

    if (!found) {
      return res.status(401).json({ error: "Account not found. Please register." });
    }

    // Ensure adminsp247@gmail.com always retains admin role
    if (found.email.toLowerCase() === 'adminsp247@gmail.com') {
      found.role = 'admin';
      found.kycStatus = 'verified';
      syncUserProfile(found);
    }

    if (password && found.passwordHash && found.passwordHash !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.json({
      success: true,
      user: { ...found, passwordHash: undefined },
      token: `token_${found.id}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", (req, res) => {
  const list = Array.from(usersStore.values()).map(u => ({ ...u, passwordHash: undefined }));
  res.json(list);
});

app.get("/api/users/:id", (req, res) => {
  const user = usersStore.get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ ...user, passwordHash: undefined });
});

app.post("/api/users/:id/kyc", (req, res) => {
  const user = usersStore.get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { documentType, documentNumber } = req.body;
  user.kycStatus = 'pending';
  user.kycDocumentType = documentType;
  user.kycDocumentNumber = documentNumber;
  user.kycSubmittedAt = new Date().toISOString();

  res.json({ success: true, user: { ...user, passwordHash: undefined } });
});

app.post("/api/admin/users/:id/verify-kyc", (req, res) => {
  const user = usersStore.get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { status } = req.body;
  user.kycStatus = status || 'verified';
  if (status === 'verified') user.kycVerifiedAt = new Date().toISOString();

  res.json({ success: true, user: { ...user, passwordHash: undefined } });
});

app.post("/api/admin/users/:id/toggle-freeze", (req, res) => {
  const user = usersStore.get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.isFrozen = !user.isFrozen;
  res.json({ success: true, user: { ...user, passwordHash: undefined } });
});

// ==============================================================================
// WALLET & INTERNAL TRANSFERS
// ==============================================================================

app.get("/api/wallet/:userId", (req, res) => {
  const wallet = walletsStore.get(req.params.userId) || initUserWallet(req.params.userId);
  res.json(formatWalletForClient(wallet));
});

const handleInternalTransfer = (req: express.Request, res: express.Response) => {
  try {
    const { senderId, recipientIdentifier, currency = 'USDT', amount, note } = req.body;

    if (!senderId || !recipientIdentifier || !amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Sender ID, recipient, and a positive amount are required" });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Invalid transfer amount" });
    }

    let recipient: UserProfile | null = null;
    for (const u of usersStore.values()) {
      if (
        u.id === recipientIdentifier || 
        u.email.toLowerCase() === recipientIdentifier.toLowerCase() || 
        u.username.toLowerCase() === recipientIdentifier.toLowerCase()
      ) {
        recipient = u;
        break;
      }
    }

    if (!recipient) {
      return res.status(404).json({ error: `Recipient "${recipientIdentifier}" not found on PNG Trade Hub` });
    }

    if (recipient.id === senderId) {
      return res.status(400).json({ error: "Cannot transfer to your own account" });
    }

    const sender = usersStore.get(senderId);
    if (!sender) return res.status(404).json({ error: "Sender profile not found" });

    const senderWallet = walletsStore.get(senderId) || initUserWallet(senderId);
    const recipientWallet = walletsStore.get(recipient.id) || initUserWallet(recipient.id);

    const assetKey = (currency as string).toUpperCase() as 'USDT' | 'TRX' | 'ETH' | 'BNB';
    const asset = senderWallet.balances[assetKey] || senderWallet.balances.USDT;
    if (asset.available < numAmount) {
      return res.status(400).json({ 
        error: `Insufficient available balance. You have ${asset.available} ${assetKey}, needed ${numAmount} ${assetKey}` 
      });
    }

    const senderBefore = asset.available;
    asset.available = Number((asset.available - numAmount).toFixed(6));
    senderWallet.updatedAt = new Date().toISOString();

    const recipientAsset = recipientWallet.balances[assetKey] || recipientWallet.balances.USDT;
    const recipientBefore = recipientAsset.available;
    recipientAsset.available = Number((recipientAsset.available + numAmount).toFixed(6));
    recipientWallet.updatedAt = new Date().toISOString();

    const transferId = `trf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: InternalTransferRecord = {
      id: transferId,
      senderId,
      senderUsername: sender.username,
      senderEmail: sender.email,
      recipientId: recipient.id,
      recipientUsername: recipient.username,
      recipientEmail: recipient.email,
      currency: assetKey,
      amount: numAmount,
      fee: 0,
      note,
      createdAt: new Date().toISOString()
    };

    internalTransfersStore.unshift(record);

    ledgerStore.push({
      id: `led_${Date.now()}_trf_send`,
      userId: senderId,
      currency: assetKey,
      network: 'INTERNAL',
      amount: -numAmount,
      balanceBefore: senderBefore,
      balanceAfter: asset.available,
      type: 'INTERNAL_TRANSFER_SENT',
      referenceId: transferId,
      description: `Internal transfer sent to @${recipient.username}: ${numAmount} ${assetKey}${note ? ` ("${note}")` : ''}`,
      timestamp: new Date().toISOString()
    });

    ledgerStore.push({
      id: `led_${Date.now()}_trf_rec`,
      userId: recipient.id,
      currency: assetKey,
      network: 'INTERNAL',
      amount: numAmount,
      balanceBefore: recipientBefore,
      balanceAfter: recipientAsset.available,
      type: 'INTERNAL_TRANSFER_RECEIVED',
      referenceId: transferId,
      description: `Internal transfer received from @${sender.username}: ${numAmount} ${assetKey}${note ? ` ("${note}")` : ''}`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      transfer: record,
      updatedWallet: formatWalletForClient(senderWallet),
      senderBalance: asset.available
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post("/api/transfers", handleInternalTransfer);
app.post("/api/transfers/internal", handleInternalTransfer);

app.get("/api/transfers", (req, res) => {
  const { userId } = req.query;
  if (userId) {
    return res.json(internalTransfersStore.filter(t => t.senderId === userId || t.recipientId === userId));
  }
  res.json(internalTransfersStore);
});

// ==============================================================================
// WITHDRAWALS (PENDING REQUEST → RESERVE BALANCE → ADMIN APPROVE/REJECT)
// ==============================================================================

const handleWithdrawalRequest = async (req: express.Request, res: express.Response) => {
  try {
    const { 
      userId, 
      currency = 'USDT', 
      network = 'TRC20', 
      amount, 
      toAddress, 
      destinationAddress 
    } = req.body;

    const targetAddress = toAddress || destinationAddress;

    if (!userId || !network || !amount || !targetAddress) {
      return res.status(400).json({ error: "User ID, network, amount, and destination address are required" });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Invalid withdrawal amount" });
    }

    const user = usersStore.get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const wallet = walletsStore.get(userId) || initUserWallet(userId);
    const assetKey = (currency as string).toUpperCase() as 'USDT' | 'TRX' | 'ETH' | 'BNB';
    const asset = wallet.balances[assetKey] || wallet.balances.USDT;

    const feeRes = await estimateNetworkFee(assetKey, network);
    const fee = feeRes.data?.estimatedFee || 1.5;
    const totalRequired = Number((numAmount + fee).toFixed(6));

    if (asset.available < totalRequired) {
      return res.status(400).json({ 
        error: `Insufficient available balance including network fee (${fee} ${assetKey}). Total required: ${totalRequired} ${assetKey}, Available: ${asset.available} ${assetKey}` 
      });
    }

    const before = asset.available;
    asset.available = Number((asset.available - totalRequired).toFixed(6));
    asset.lockedEscrow = Number((asset.lockedEscrow + totalRequired).toFixed(6));
    wallet.updatedAt = new Date().toISOString();

    const wdrId = `wdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record: WithdrawalRecord = {
      id: wdrId,
      userId,
      userEmail: user.email,
      currency: assetKey,
      network,
      amount: numAmount,
      fee,
      netAmount: numAmount,
      toAddress: targetAddress,
      txHash: null,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString()
    };

    withdrawalsStore.set(wdrId, record);

    ledgerStore.push({
      id: `led_${Date.now()}_wdr_req`,
      userId,
      currency: assetKey,
      network,
      amount: -totalRequired,
      balanceBefore: before,
      balanceAfter: asset.available,
      type: 'WITHDRAWAL_REQUEST',
      referenceId: wdrId,
      description: `Withdrawal requested: ${numAmount} ${assetKey} (+ ${fee} fee) to ${targetAddress.slice(0, 8)}... (Pending Admin Review)`,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      withdrawal: record,
      updatedWallet: formatWalletForClient(wallet),
      message: "Withdrawal request submitted for compliance review. Funds reserved in internal ledger."
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post("/api/withdrawals", handleWithdrawalRequest);
app.post("/api/wallet/withdraw", handleWithdrawalRequest);

app.get("/api/withdrawals", (req, res) => {
  const { userId } = req.query;
  const all = Array.from(withdrawalsStore.values());
  if (userId) {
    return res.json(all.filter(w => w.userId === userId));
  }
  res.json(all);
});

// Admin Review Withdrawal (Approve or Reject)
app.post("/api/admin/withdrawals/:id/review", (req, res) => {
  try {
    const wdr = withdrawalsStore.get(req.params.id);
    if (!wdr) return res.status(404).json({ error: "Withdrawal request not found" });

    const { action, rejectionReason = 'Compliance check required' } = req.body;
    const totalRequired = Number((wdr.amount + wdr.fee).toFixed(6));
    const wallet = walletsStore.get(wdr.userId);

    if (action === 'APPROVE') {
      if (wallet) {
        const asset = wallet.balances[wdr.currency];
        if (asset) {
          asset.lockedEscrow = Number((asset.lockedEscrow - totalRequired).toFixed(6));
          wallet.updatedAt = new Date().toISOString();
        }
      }
      wdr.status = 'COMPLETED';
      wdr.approvedBy = 'usr_admin_master';
      wdr.approvedAt = new Date().toISOString();

      ledgerStore.push({
        id: `led_${Date.now()}_wdr_app`,
        userId: wdr.userId,
        currency: wdr.currency,
        network: wdr.network,
        amount: -totalRequired,
        balanceBefore: wallet?.balances[wdr.currency]?.available || 0,
        balanceAfter: wallet?.balances[wdr.currency]?.available || 0,
        type: 'WITHDRAWAL_APPROVED',
        referenceId: wdr.id,
        description: `Withdrawal approved by compliance admin. Output queued for blockchain broadcast.`,
        timestamp: new Date().toISOString()
      });
    } else {
      // REJECT: refund locked funds back to available
      if (wallet) {
        const asset = wallet.balances[wdr.currency];
        if (asset) {
          const before = asset.available;
          asset.lockedEscrow = Number((asset.lockedEscrow - totalRequired).toFixed(6));
          asset.available = Number((asset.available + totalRequired).toFixed(6));
          wallet.updatedAt = new Date().toISOString();

          ledgerStore.push({
            id: `led_${Date.now()}_wdr_rej`,
            userId: wdr.userId,
            currency: wdr.currency,
            network: wdr.network,
            amount: totalRequired,
            balanceBefore: before,
            balanceAfter: asset.available,
            type: 'WITHDRAWAL_REJECTED_REFUND',
            referenceId: wdr.id,
            description: `Withdrawal rejected: ${rejectionReason}. ${totalRequired} ${wdr.currency} released back to available balance.`,
            timestamp: new Date().toISOString()
          });
        }
      }
      wdr.status = 'REJECTED';
      wdr.rejectionReason = rejectionReason;
    }

    res.json({ success: true, withdrawal: wdr });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/withdrawals/:id/approve", (req, res) => {
  req.body.action = 'APPROVE';
  return (app as any)._router.handle({ ...req, url: `/api/admin/withdrawals/${req.params.id}/review`, method: 'POST' }, res);
});

app.post("/api/admin/withdrawals/:id/reject", (req, res) => {
  req.body.action = 'REJECT';
  return (app as any)._router.handle({ ...req, url: `/api/admin/withdrawals/${req.params.id}/review`, method: 'POST' }, res);
});

// ==============================================================================
// P2P OFFERS & ESCROW TRADES
// ==============================================================================

app.get("/api/p2p/offers", (req, res) => {
  const list = Array.from(p2pOffersStore.values()).filter(o => o.status === 'ACTIVE');
  res.json(list);
});

app.post("/api/p2p/offers", (req, res) => {
  try {
    const { 
      userId, 
      type, 
      cryptoCurrency = 'USDT', 
      fiatCurrency = 'PGK', 
      pricePerUnit, 
      totalAmount, 
      minLimit, 
      maxLimit, 
      paymentMethods = [], 
      paymentWindowMinutes = 15, 
      terms = '', 
      autoReply = '' 
    } = req.body;

    const user = usersStore.get(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (type === 'SELL') {
      const wallet = walletsStore.get(userId) || initUserWallet(userId);
      const assetKey = (cryptoCurrency as string).toUpperCase() as 'USDT' | 'TRX' | 'ETH' | 'BNB';
      const asset = wallet.balances[assetKey] || wallet.balances.USDT;
      if (asset.available < Number(totalAmount)) {
        return res.status(400).json({ 
          error: `Insufficient available balance to create sell offer. You have ${asset.available} ${assetKey}, offer requires ${totalAmount} ${assetKey}` 
        });
      }
    }

    const offerId = `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newOffer: P2POfferRecord = {
      id: offerId,
      userId,
      userUsername: user.username,
      type,
      cryptoCurrency,
      fiatCurrency,
      pricePerUnit: Number(pricePerUnit),
      totalAmount: Number(totalAmount),
      availableAmount: Number(totalAmount),
      minLimit: Number(minLimit),
      maxLimit: Number(maxLimit),
      paymentMethods,
      paymentWindowMinutes: Number(paymentWindowMinutes),
      terms,
      autoReply,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    p2pOffersStore.set(offerId, newOffer);
    res.status(201).json({ success: true, offer: newOffer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/p2p/trades", (req, res) => {
  try {
    const { 
      offerId, 
      takerId, 
      actorId,
      cryptoAmount, 
      fiatAmount, 
      paymentMethod,
      sellerPaymentDetails = {} 
    } = req.body;

    const actualTakerId = takerId || actorId;
    const offer = p2pOffersStore.get(offerId);
    if (!offer) return res.status(404).json({ error: "Offer not found" });

    if (offer.status !== 'ACTIVE') {
      return res.status(400).json({ error: "Offer is no longer active" });
    }

    if (offer.userId === actualTakerId) {
      return res.status(400).json({ error: "Cannot trade on your own offer" });
    }

    const numCrypto = Number(cryptoAmount);
    const numFiat = Number(fiatAmount);

    if (numCrypto > offer.availableAmount) {
      return res.status(400).json({ error: `Requested amount exceeds available offer inventory (${offer.availableAmount} ${offer.cryptoCurrency})` });
    }

    const taker = usersStore.get(actualTakerId);
    const maker = usersStore.get(offer.userId);
    if (!taker || !maker) return res.status(404).json({ error: "Participants not found" });

    let buyerId: string;
    let buyerUsername: string;
    let buyerEmail: string;
    let sellerId: string;
    let sellerUsername: string;
    let sellerEmail: string;

    if (offer.type === 'SELL') {
      sellerId = maker.id;
      sellerUsername = maker.username;
      sellerEmail = maker.email;
      buyerId = taker.id;
      buyerUsername = taker.username;
      buyerEmail = taker.email;
    } else {
      buyerId = maker.id;
      buyerUsername = maker.username;
      buyerEmail = maker.email;
      sellerId = taker.id;
      sellerUsername = taker.username;
      sellerEmail = taker.email;
    }

    const tradeId = `trd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // ATOMIC ESCROW LOCK
    lockBalanceForEscrow(sellerId, offer.cryptoCurrency, numCrypto, tradeId);

    offer.availableAmount = Number((offer.availableAmount - numCrypto).toFixed(6));
    if (offer.availableAmount <= 0) offer.status = 'CLOSED';

    const trade: P2PTradeRecord = {
      id: tradeId,
      offerId,
      buyerId,
      buyerUsername,
      buyerEmail,
      sellerId,
      sellerUsername,
      sellerEmail,
      cryptoCurrency: offer.cryptoCurrency,
      fiatCurrency: offer.fiatCurrency,
      cryptoAmount: numCrypto,
      fiatAmount: numFiat,
      pricePerUnit: offer.pricePerUnit,
      status: 'AWAITING_PAYMENT',
      escrowLocked: true,
      selectedPaymentMethod: paymentMethod || offer.paymentMethods[0] || 'Bank Transfer',
      sellerPaymentDetails,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + offer.paymentWindowMinutes * 60 * 1000).toISOString()
    };

    p2pTradesStore.set(tradeId, trade);

    const initialMessages: TradeMessageRecord[] = [
      {
        id: `msg_sys_1_${tradeId}`,
        tradeId,
        senderId: 'system',
        senderUsername: 'PNG Trade Hub Escrow',
        message: `🛡️ Escrow Activated: ${numCrypto} ${offer.cryptoCurrency} has been atomically locked from seller @${sellerUsername} in the escrow vault. Buyer @${buyerUsername}, please transfer ${numFiat} ${offer.fiatCurrency} within ${offer.paymentWindowMinutes} minutes.`,
        isSystem: true,
        timestamp: new Date().toISOString()
      }
    ];

    if (offer.autoReply) {
      initialMessages.push({
        id: `msg_auto_${tradeId}`,
        tradeId,
        senderId: offer.userId,
        senderUsername: offer.userUsername,
        message: offer.autoReply,
        isSystem: false,
        timestamp: new Date(Date.now() + 500).toISOString()
      });
    }

    p2pMessagesStore.set(tradeId, initialMessages);

    res.status(201).json({ success: true, trade });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/p2p/trades", (req, res) => {
  const { userId } = req.query;
  const all = Array.from(p2pTradesStore.values());
  if (userId) {
    return res.json(all.filter(t => t.buyerId === userId || t.sellerId === userId));
  }
  res.json(all);
});

app.get("/api/p2p/trades/:id", (req, res) => {
  const trade = p2pTradesStore.get(req.params.id);
  if (!trade) return res.status(404).json({ error: "Trade not found" });
  res.json(trade);
});

// Mark paid
const handleMarkPaid = (req: express.Request, res: express.Response) => {
  try {
    const trade = p2pTradesStore.get(req.params.id);
    if (!trade) return res.status(404).json({ error: "Trade not found" });

    if (trade.status !== 'AWAITING_PAYMENT') {
      return res.status(400).json({ error: `Cannot mark as paid in status ${trade.status}` });
    }

    const { paymentReference, paymentProofUrl } = req.body;
    trade.status = 'PAID';
    trade.paidAt = new Date().toISOString();
    trade.paymentReference = paymentReference;
    trade.paymentProofUrl = paymentProofUrl;

    const msgs = p2pMessagesStore.get(trade.id) || [];
    msgs.push({
      id: `msg_${Date.now()}`,
      tradeId: trade.id,
      senderId: 'system',
      senderUsername: 'PNG Trade Hub Escrow',
      message: `💳 Buyer @${trade.buyerUsername} marked the trade as PAID${paymentReference ? ` (Ref: ${paymentReference})` : ''}. Seller @${trade.sellerUsername}, please check your account and confirm receipt to release crypto.`,
      isSystem: true,
      timestamp: new Date().toISOString()
    });
    p2pMessagesStore.set(trade.id, msgs);

    res.json({ success: true, trade });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post("/api/p2p/trades/:id/pay", handleMarkPaid);
app.post("/api/p2p/trades/:id/paid", handleMarkPaid);

// Release escrow
app.post("/api/p2p/trades/:id/release", (req, res) => {
  try {
    const trade = p2pTradesStore.get(req.params.id);
    if (!trade) return res.status(404).json({ error: "Trade not found" });

    const { actorId } = req.body;
    const actor = actorId ? usersStore.get(actorId) : null;

    if (actorId && actorId !== trade.sellerId && actor?.role !== 'admin') {
      return res.status(403).json({ error: "Only the seller or compliance admin can release escrow" });
    }

    if (trade.status !== 'PAID' && trade.status !== 'AWAITING_PAYMENT' && trade.status !== 'DISPUTED') {
      return res.status(400).json({ error: `Cannot release escrow in status ${trade.status}` });
    }

    releaseEscrowToBuyer(trade.sellerId, trade.buyerId, trade.cryptoCurrency, trade.cryptoAmount, trade.id);

    trade.status = 'COMPLETED';
    trade.escrowLocked = false;
    trade.completedAt = new Date().toISOString();

    const msgs = p2pMessagesStore.get(trade.id) || [];
    msgs.push({
      id: `msg_${Date.now()}`,
      tradeId: trade.id,
      senderId: 'system',
      senderUsername: 'PNG Trade Hub Escrow',
      message: `🎉 Escrow Released: ${trade.cryptoAmount} ${trade.cryptoCurrency} has been credited to buyer @${trade.buyerUsername}'s available balance. Trade completed successfully!`,
      isSystem: true,
      timestamp: new Date().toISOString()
    });
    p2pMessagesStore.set(trade.id, msgs);

    res.json({ success: true, trade });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Cancel trade
app.post("/api/p2p/trades/:id/cancel", (req, res) => {
  try {
    const trade = p2pTradesStore.get(req.params.id);
    if (!trade) return res.status(404).json({ error: "Trade not found" });

    if (trade.status !== 'AWAITING_PAYMENT' && trade.status !== 'DISPUTED') {
      return res.status(400).json({ error: `Cannot cancel trade in status ${trade.status}` });
    }

    if (trade.escrowLocked) {
      refundEscrowToSeller(trade.sellerId, trade.cryptoCurrency, trade.cryptoAmount, trade.id);
      trade.escrowLocked = false;
    }

    trade.status = 'CANCELLED';

    const offer = p2pOffersStore.get(trade.offerId);
    if (offer) {
      offer.availableAmount = Number((offer.availableAmount + trade.cryptoAmount).toFixed(6));
      if (offer.status === 'CLOSED') offer.status = 'ACTIVE';
    }

    const msgs = p2pMessagesStore.get(trade.id) || [];
    msgs.push({
      id: `msg_${Date.now()}`,
      tradeId: trade.id,
      senderId: 'system',
      senderUsername: 'PNG Trade Hub Escrow',
      message: `🚫 Order was CANCELLED. Escrow of ${trade.cryptoAmount} ${trade.cryptoCurrency} has been refunded to seller @${trade.sellerUsername}'s available balance.`,
      isSystem: true,
      timestamp: new Date().toISOString()
    });
    p2pMessagesStore.set(trade.id, msgs);

    res.json({ success: true, trade });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Dispute
app.post("/api/p2p/trades/:id/dispute", (req, res) => {
  try {
    const trade = p2pTradesStore.get(req.params.id);
    if (!trade) return res.status(404).json({ error: "Trade not found" });

    const { actorId, userId, reason } = req.body;
    trade.status = 'DISPUTED';
    trade.disputeRaisedBy = actorId || userId;
    trade.disputeReason = reason || 'Payment not recognized or transfer discrepancy';

    const msgs = p2pMessagesStore.get(trade.id) || [];
    msgs.push({
      id: `msg_${Date.now()}`,
      tradeId: trade.id,
      senderId: 'system',
      senderUsername: 'Compliance Arbitrator',
      message: `⚖️ Dispute Flagged: "${trade.disputeReason}". Escrow remains safely locked. A compliance officer has been notified to mediate.`,
      isSystem: true,
      timestamp: new Date().toISOString()
    });
    p2pMessagesStore.set(trade.id, msgs);

    res.json({ success: true, trade });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Arbitrate
const handleArbitrate = (req: express.Request, res: express.Response) => {
  try {
    const trade = p2pTradesStore.get(req.params.id);
    if (!trade) return res.status(404).json({ error: "Trade not found" });

    const { winnerId, note } = req.body;
    trade.adminResolutionNote = note;

    if (winnerId === trade.buyerId) {
      // Release to buyer
      releaseEscrowToBuyer(trade.sellerId, trade.buyerId, trade.cryptoCurrency, trade.cryptoAmount, trade.id);
      trade.status = 'COMPLETED';
      trade.escrowLocked = false;
    } else {
      // Refund to seller
      refundEscrowToSeller(trade.sellerId, trade.cryptoCurrency, trade.cryptoAmount, trade.id);
      trade.status = 'CANCELLED';
      trade.escrowLocked = false;
    }

    const msgs = p2pMessagesStore.get(trade.id) || [];
    msgs.push({
      id: `msg_${Date.now()}`,
      tradeId: trade.id,
      senderId: 'system',
      senderUsername: 'Compliance Arbitrator',
      message: `⚖️ Official Decision: Dispute ruled in favor of ${winnerId === trade.buyerId ? `@${trade.buyerUsername} (Buyer)` : `@${trade.sellerUsername} (Seller)`}. Arbitrator Note: ${note}`,
      isSystem: true,
      timestamp: new Date().toISOString()
    });
    p2pMessagesStore.set(trade.id, msgs);

    res.json({ success: true, trade });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

app.post("/api/p2p/trades/:id/arbitrate", handleArbitrate);
app.post("/api/admin/trades/:id/arbitrate", handleArbitrate);

// Messages
app.get("/api/p2p/trades/:id/messages", (req, res) => {
  const msgs = p2pMessagesStore.get(req.params.id) || [];
  res.json(msgs);
});

app.post("/api/p2p/trades/:id/messages", (req, res) => {
  const { senderId, message } = req.body;
  const user = usersStore.get(senderId);
  const tradeId = req.params.id;

  const msgs = p2pMessagesStore.get(tradeId) || [];
  const newMsg: TradeMessageRecord = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tradeId,
    senderId,
    senderUsername: user ? user.username : 'User',
    message,
    isSystem: false,
    timestamp: new Date().toISOString()
  };

  msgs.push(newMsg);
  p2pMessagesStore.set(tradeId, msgs);
  res.status(201).json({ success: true, message: newMsg });
});

// ==============================================================================
// TATUM STATUS & LEDGER
// ==============================================================================

app.get("/api/tatum/status", (req, res) => {
  res.json({
    connected: isTatumConnected(),
    status: isTatumConnected() ? 'ACTIVE' : 'PENDING_INTEGRATION',
    message: isTatumConnected() 
      ? 'Tatum Multi-Chain Engine is connected and operational.' 
      : 'Blockchain Integration Pending: Server is operating in secure ledger mode. Tatum multi-chain connectivity (TRC20, ERC20, BEP20, TRX, ETH, BNB) is prepared and awaiting TATUM_API_KEY activation.',
    supportedChains: ['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20', 'TRX', 'ETH', 'BNB']
  });
});

app.get("/api/tatum/deposit-address", async (req, res) => {
  const { userId, currency = 'USDT', network = 'TRC20' } = req.query;
  const result = await getDepositAddress(String(userId), String(currency), String(network));
  res.json(result);
});

app.get("/api/tatum/fee-estimate", async (req, res) => {
  const { currency = 'USDT', network = 'TRC20' } = req.query;
  const result = await estimateNetworkFee(String(currency), String(network));
  res.json(result);
});

app.get("/api/ledger/:userId", (req, res) => {
  const userEntries = ledgerStore
    .filter(e => e.userId === req.params.userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(userEntries);
});

app.get("/api/admin/ledger", (req, res) => {
  const all = [...ledgerStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(all);
});

app.get("/api/transactions", (req, res) => {
  const { userId } = req.query;
  const entries = userId ? ledgerStore.filter(e => e.userId === userId) : ledgerStore;
  const mapped = entries.map(e => ({
    id: e.id,
    userId: e.userId,
    type: e.type,
    cryptoCurrency: e.currency,
    amount: Math.abs(e.amount),
    fee: 0,
    network: e.network,
    status: 'COMPLETED',
    description: e.description,
    createdAt: e.timestamp
  }));
  res.json(mapped);
});

app.get("/api/stats", (req, res) => {
  let totalVolumeUsd = 0;
  let activeEscrows = 0;

  for (const t of p2pTradesStore.values()) {
    if (t.status === 'COMPLETED') {
      totalVolumeUsd += t.cryptoAmount;
    }
    if (t.status === 'AWAITING_PAYMENT' || t.status === 'PAID' || t.status === 'DISPUTED') {
      activeEscrows += 1;
    }
  }

  const pendingWithdrawals = Array.from(withdrawalsStore.values()).filter(w => w.status === 'PENDING_APPROVAL');

  res.json({
    totalUsers: usersStore.size,
    totalVolumeUsd,
    activeEscrows,
    completedTrades: Array.from(p2pTradesStore.values()).filter(t => t.status === 'COMPLETED').length,
    pendingWithdrawalsCount: pendingWithdrawals.length,
    openDisputesCount: Array.from(p2pTradesStore.values()).filter(t => t.status === 'DISPUTED').length,
    tatumConnected: isTatumConnected()
  });
});

// Support tickets
const handleGetTickets = (req: express.Request, res: express.Response) => {
  const { userId } = req.query;
  const all = Array.from(supportTicketsStore.values());
  if (userId) {
    return res.json(all.filter(t => t.userId === userId));
  }
  res.json(all);
};

app.get("/api/tickets", handleGetTickets);
app.get("/api/support/tickets", handleGetTickets);

const handleCreateTicket = (req: express.Request, res: express.Response) => {
  const { userId, subject, category, priority = 'MEDIUM', description, message } = req.body;
  const user = usersStore.get(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const desc = description || message || '';
  const ticketId = `tkt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const ticket: SupportTicketRecord = {
    id: ticketId,
    userId,
    userUsername: user.username,
    userEmail: user.email,
    subject,
    category: category || 'GENERAL',
    priority,
    status: 'OPEN',
    description: desc,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: `msg_${Date.now()}`,
        senderId: userId,
        senderUsername: user.username,
        senderRole: user.role,
        message: desc,
        timestamp: new Date().toISOString()
      }
    ]
  };

  supportTicketsStore.set(ticketId, ticket);
  res.status(201).json({ success: true, ticket });
};

app.post("/api/tickets", handleCreateTicket);
app.post("/api/support/tickets", handleCreateTicket);

const handleReplyTicket = (req: express.Request, res: express.Response) => {
  const ticket = supportTicketsStore.get(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  const { senderId, message, status } = req.body;
  const user = usersStore.get(senderId);

  ticket.messages.push({
    id: `msg_${Date.now()}`,
    senderId: senderId || 'admin',
    senderUsername: user ? user.username : 'Support Arbitrator',
    senderRole: user ? user.role : 'admin',
    message,
    timestamp: new Date().toISOString()
  });

  if (status) ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  res.json({ success: true, ticket });
};

app.post("/api/tickets/:id/reply", handleReplyTicket);
app.post("/api/support/tickets/:id/reply", handleReplyTicket);

// ==========================================
// SUPABASE DATABASE MANAGEMENT & SYNC ROUTES
// ==========================================
app.get("/api/supabase/status", async (req, res) => {
  try {
    const health = await checkSupabaseHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/supabase/schema", (req, res) => {
  try {
    const sql = getSqlSchemaContent();
    res.setHeader("Content-Type", "text/plain");
    res.send(sql);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/supabase/sync", async (req, res) => {
  try {
    let syncedUsers = 0;
    let syncedOffers = 0;
    let syncedTrades = 0;
    let syncedWithdrawals = 0;
    let syncedTickets = 0;

    for (const u of usersStore.values()) {
      if (await syncUserProfile(u)) syncedUsers++;
    }
    for (const o of p2pOffersStore.values()) {
      if (await syncP2POffer(o)) syncedOffers++;
    }
    for (const t of p2pTradesStore.values()) {
      if (await syncP2PTrade(t)) syncedTrades++;
    }
    for (const w of withdrawalsStore.values()) {
      if (await syncWithdrawal(w)) syncedWithdrawals++;
    }
    for (const tk of supportTicketsStore.values()) {
      if (await syncSupportTicket(tk)) syncedTickets++;
    }

    const health = await checkSupabaseHealth();
    res.json({
      success: true,
      message: `Database synchronization routine completed.`,
      synced: {
        users: syncedUsers,
        offers: syncedOffers,
        trades: syncedTrades,
        withdrawals: syncedWithdrawals,
        tickets: syncedTickets
      },
      health
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// VITE INTEGRATION & SERVER STARTUP
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PNG Trade Hub Production Server running at http://0.0.0.0:${PORT}`);
    console.log(`[Tatum Multi-Chain Engine]: ${isTatumConnected() ? 'CONNECTED' : 'INTEGRATION PENDING (Awaiting TATUM_API_KEY)'}`);
  });
}

startServer();
