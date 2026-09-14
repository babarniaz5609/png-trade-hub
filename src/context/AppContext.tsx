import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserWallet, 
  P2POffer, 
  P2PTradeOrder, 
  P2PChatMessage, 
  Deposit, 
  Withdrawal, 
  InternalTransfer, 
  SupportTicket, 
  PlatformStats,
  CryptoCurrency,
  BlockchainNetwork
} from '../types';
import { useAuth } from './AuthContext';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  wallet: UserWallet | null;
  platformStats: PlatformStats | null;
  offers: P2POffer[];
  trades: P2PTradeOrder[];
  activeTrade: P2PTradeOrder | null;
  chatMessages: P2PChatMessage[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  transfers: InternalTransfer[];
  tickets: SupportTicket[];
  toasts: Toast[];
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setActiveTradeId: (tradeId: string | null) => void;
  fetchWallet: () => Promise<void>;
  fetchMarketplace: () => Promise<void>;
  fetchTrades: () => Promise<void>;
  fetchTickets: () => Promise<void>;
  createOffer: (offerData: Partial<P2POffer>) => Promise<boolean>;
  initiateTrade: (params: { offerId: string; cryptoAmount: number; fiatAmount: number; paymentMethod?: string }) => Promise<string | null>;
  markTradePaid: (tradeId: string, reference?: string, proofUrl?: string) => Promise<boolean>;
  releaseEscrow: (tradeId: string) => Promise<boolean>;
  raiseDispute: (tradeId: string, reason: string) => Promise<boolean>;
  sendChatMessage: (tradeId: string, message: string) => Promise<boolean>;
  processDeposit: (currency: CryptoCurrency, network: BlockchainNetwork, amount: number) => Promise<boolean>;
  requestWithdrawal: (params: { currency: CryptoCurrency; network: BlockchainNetwork; amount: number; toAddress: string }) => Promise<boolean>;
  sendInternalTransfer: (params: { recipientIdentifier: string; amount: number; note?: string }) => Promise<boolean>;
  createSupportTicket: (ticketData: { subject: string; category: any; priority: any; message: string }) => Promise<boolean>;
  replySupportTicket: (ticketId: string, message: string, isAdmin?: boolean, newStatus?: any) => Promise<boolean>;
  // Admin Operations
  adminToggleUserFreeze: (userId: string) => Promise<boolean>;
  adminVerifyKYC: (userId: string, status: string) => Promise<boolean>;
  adminReviewWithdrawal: (withdrawalId: string, action: 'APPROVE' | 'REJECT', reason?: string) => Promise<boolean>;
  adminArbitrateTrade: (tradeId: string, winnerId: string, note: string) => Promise<boolean>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [trades, setTrades] = useState<P2PTradeOrder[]>([]);
  const [activeTradeId, setActiveTradeIdState] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<P2PChatMessage[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transfers, setTransfers] = useState<InternalTransfer[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace'); // 'home' | 'marketplace' | 'trade' | 'wallet' | 'deposit' | 'withdraw' | 'transfer' | 'dashboard' | 'history' | 'support' | 'admin'

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchWallet = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/wallet/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch (err) {
      console.error('Wallet fetch error', err);
    }
  }, [currentUser]);

  const fetchMarketplace = useCallback(async () => {
    try {
      const res = await fetch('/api/p2p/offers');
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch (err) {
      console.error('Offers fetch error', err);
    }
  }, []);

  const fetchTrades = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/p2p/trades?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      }
    } catch (err) {
      console.error('Trades fetch error', err);
    }
  }, [currentUser]);

  const fetchTickets = useCallback(async () => {
    if (!currentUser) return;
    try {
      const endpoint = currentUser.role === 'admin' ? '/api/support/tickets' : `/api/support/tickets?userId=${currentUser.id}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Tickets fetch error', err);
    }
  }, [currentUser]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setPlatformStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error', err);
    }
  }, []);

  const fetchChatMessages = useCallback(async (tradeId: string) => {
    try {
      const res = await fetch(`/api/p2p/trades/${tradeId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error('Chat fetch error', err);
    }
  }, []);

  // Sync on user change
  useEffect(() => {
    if (currentUser) {
      fetchWallet();
      fetchMarketplace();
      fetchTrades();
      fetchTickets();
      fetchStats();
    }
  }, [currentUser, fetchWallet, fetchMarketplace, fetchTrades, fetchTickets, fetchStats]);

  // Polling for active trade chat if open
  useEffect(() => {
    if (!activeTradeId) return;
    fetchChatMessages(activeTradeId);
    const interval = setInterval(() => {
      fetchChatMessages(activeTradeId);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTradeId, fetchChatMessages]);

  const activeTrade = trades.find(t => t.id === activeTradeId) || null;

  const setActiveTradeId = (id: string | null) => {
    setActiveTradeIdState(id);
    if (id) {
      setActiveTab('trade');
      fetchChatMessages(id);
    }
  };

  const createOffer = async (offerData: Partial<P2POffer>): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/p2p/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...offerData, userId: currentUser.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('P2P Trading Ad posted successfully!', 'success');
        fetchMarketplace();
        fetchWallet();
        return true;
      } else {
        showToast(data.error || 'Failed to post offer', 'error');
        return false;
      }
    } catch (err) {
      showToast('Error posting offer', 'error');
      return false;
    }
  };

  const initiateTrade = async (params: { offerId: string; cryptoAmount: number; fiatAmount: number; paymentMethod?: string }): Promise<string | null> => {
    if (!currentUser) return null;
    setIsLoading(true);
    try {
      const res = await fetch('/api/p2p/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: params.offerId,
          actorId: currentUser.id,
          cryptoAmount: params.cryptoAmount,
          fiatAmount: params.fiatAmount,
          paymentMethod: params.paymentMethod
        })
      });
      const data = await res.json();
      setIsLoading(false);
      if (res.ok && data.success && data.trade) {
        showToast('Trade initiated! Escrow locked safely.', 'success');
        setTrades(prev => [data.trade, ...prev]);
        setActiveTradeId(data.trade.id);
        fetchWallet();
        return data.trade.id;
      } else {
        showToast(data.error || 'Could not initiate trade', 'error');
        return null;
      }
    } catch (err) {
      setIsLoading(false);
      showToast('Network error starting trade', 'error');
      return null;
    }
  };

  const markTradePaid = async (tradeId: string, reference?: string, proofUrl?: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/p2p/trades/${tradeId}/paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: currentUser.id,
          paymentReference: reference,
          paymentProofUrl: proofUrl
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Payment marked! Seller notified to release escrow.', 'success');
        fetchTrades();
        fetchChatMessages(tradeId);
        return true;
      } else {
        showToast(data.error || 'Failed to mark as paid', 'error');
        return false;
      }
    } catch (err) {
      showToast('Error updating payment status', 'error');
      return false;
    }
  };

  const releaseEscrow = async (tradeId: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/p2p/trades/${tradeId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Trigger celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) { /* ignore */ }

        showToast('Escrow released! Crypto credited to buyer successfully.', 'success');
        fetchTrades();
        fetchWallet();
        fetchChatMessages(tradeId);
        return true;
      } else {
        showToast(data.error || 'Failed to release escrow', 'error');
        return false;
      }
    } catch (err) {
      showToast('Error releasing escrow', 'error');
      return false;
    }
  };

  const raiseDispute = async (tradeId: string, reason: string): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/p2p/trades/${tradeId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorId: currentUser.id, reason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Dispute opened. Official arbitrator assigned.', 'info');
        fetchTrades();
        fetchChatMessages(tradeId);
        return true;
      } else {
        showToast(data.error || 'Failed to open dispute', 'error');
        return false;
      }
    } catch (err) {
      showToast('Error raising dispute', 'error');
      return false;
    }
  };

  const sendChatMessage = async (tradeId: string, message: string): Promise<boolean> => {
    if (!currentUser || !message.trim()) return false;
    try {
      const res = await fetch(`/api/p2p/trades/${tradeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, message })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setChatMessages(prev => [...prev, data.message]);
        return true;
      }
    } catch (err) {
      console.error('Chat send error', err);
    }
    return false;
  };

  const processDeposit = async (currency: CryptoCurrency, network: BlockchainNetwork, amount: number): Promise<boolean> => {
    if (!currentUser) return false;
    setIsLoading(true);
    try {
      const res = await fetch('/api/wallet/deposit/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          currency,
          network,
          amount
        })
      });
      const data = await res.json();
      setIsLoading(false);
      if (res.ok && data.success) {
        showToast(`Deposit credited: +${amount} ${currency} (${network})`, 'success');
        if (data.updatedWallet) setWallet(data.updatedWallet);
        fetchStats();
        return true;
      } else {
        showToast(data.error || 'Deposit processing failed', 'error');
        return false;
      }
    } catch (err) {
      setIsLoading(false);
      showToast('Error during deposit processing', 'error');
      return false;
    }
  };

  const requestWithdrawal = async (params: { currency: CryptoCurrency; network: BlockchainNetwork; amount: number; toAddress: string }): Promise<boolean> => {
    if (!currentUser) return false;
    setIsLoading(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          ...params
        })
      });
      const data = await res.json();
      setIsLoading(false);
      if (res.ok && data.success) {
        showToast('Withdrawal submitted for compliance review!', 'success');
        if (data.updatedWallet) setWallet(data.updatedWallet);
        fetchStats();
        return true;
      } else {
        showToast(data.error || 'Withdrawal failed', 'error');
        return false;
      }
    } catch (err) {
      setIsLoading(false);
      showToast('Error submitting withdrawal', 'error');
      return false;
    }
  };

  const sendInternalTransfer = async (params: { recipientIdentifier: string; amount: number; note?: string }): Promise<boolean> => {
    if (!currentUser) return false;
    setIsLoading(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          recipientIdentifier: params.recipientIdentifier,
          amount: params.amount,
          note: params.note,
          currency: 'USDT'
        })
      });
      const data = await res.json();
      setIsLoading(false);
      if (res.ok && data.success) {
        showToast(`Instant transfer of ${params.amount} USDT sent! (0% fee)`, 'success');
        if (data.updatedWallet) setWallet(data.updatedWallet);
        return true;
      } else {
        showToast(data.error || 'Transfer failed', 'error');
        return false;
      }
    } catch (err) {
      setIsLoading(false);
      showToast('Error processing transfer', 'error');
      return false;
    }
  };

  const createSupportTicket = async (ticketData: { subject: string; category: any; priority: any; message: string }): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, ...ticketData })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Support ticket created. Our team will review shortly.', 'success');
        fetchTickets();
        return true;
      }
    } catch (err) {
      showToast('Error creating ticket', 'error');
    }
    return false;
  };

  const replySupportTicket = async (ticketId: string, message: string, isAdmin: boolean = false, newStatus?: any): Promise<boolean> => {
    if (!currentUser) return false;
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          message,
          isAdmin,
          status: newStatus
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Reply submitted', 'success');
        fetchTickets();
        return true;
      }
    } catch (err) {
      showToast('Error replying to ticket', 'error');
    }
    return false;
  };

  // Admin Actions
  const adminToggleUserFreeze = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-freeze`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`User status updated: ${data.user.isFrozen ? 'Suspended' : 'Active'}`, 'info');
        return true;
      }
    } catch (err) {
      showToast('Admin operation failed', 'error');
    }
    return false;
  };

  const adminVerifyKYC = async (userId: string, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`User KYC set to ${status}`, 'success');
        return true;
      }
    } catch (err) {
      showToast('Admin operation failed', 'error');
    }
    return false;
  };

  const adminReviewWithdrawal = async (withdrawalId: string, action: 'APPROVE' | 'REJECT', reason?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Withdrawal ${action === 'APPROVE' ? 'Approved & Broadcast' : 'Rejected'}`, 'info');
        fetchStats();
        return true;
      }
    } catch (err) {
      showToast('Admin review failed', 'error');
    }
    return false;
  };

  const adminArbitrateTrade = async (tradeId: string, winnerId: string, note: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/admin/trades/${tradeId}/arbitrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId, note })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Dispute arbitrated and settled by admin', 'success');
        fetchTrades();
        fetchChatMessages(tradeId);
        fetchStats();
        return true;
      }
    } catch (err) {
      showToast('Dispute arbitration failed', 'error');
    }
    return false;
  };

  return (
    <AppContext.Provider
      value={{
        wallet,
        platformStats,
        offers,
        trades,
        activeTrade,
        chatMessages,
        deposits,
        withdrawals,
        transfers,
        tickets,
        toasts,
        isLoading,
        activeTab,
        setActiveTab,
        setActiveTradeId,
        fetchWallet,
        fetchMarketplace,
        fetchTrades,
        fetchTickets,
        createOffer,
        initiateTrade,
        markTradePaid,
        releaseEscrow,
        raiseDispute,
        sendChatMessage,
        processDeposit,
        requestWithdrawal,
        sendInternalTransfer,
        createSupportTicket,
        replySupportTicket,
        adminToggleUserFreeze,
        adminVerifyKYC,
        adminReviewWithdrawal,
        adminArbitrateTrade,
        showToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
