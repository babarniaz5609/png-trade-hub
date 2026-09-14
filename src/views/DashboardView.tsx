import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Send, 
  ChevronRight, 
  FileText, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FIAT_RATES } from '../lib/tatum';

export const DashboardView: React.FC = () => {
  const { wallet, trades, offers, setActiveTradeId, setActiveTab } = useApp();
  const { currentUser, submitKYC } = useAuth();

  const [idCardNumber, setIdCardNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycError, setKycError] = useState('');

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCardNumber.trim() || !whatsappNumber.trim()) {
      setKycError('Please fill out both ID Card and WhatsApp fields.');
      return;
    }
    setIsSubmitting(true);
    setKycError('');
    try {
      const ok = await submitKYC(idCardNumber.trim(), whatsappNumber.trim());
      if (ok) {
        setIdCardNumber('');
        setWhatsappNumber('');
      } else {
        setKycError('KYC submission failed. Please try again.');
      }
    } catch (err) {
      setKycError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!wallet) return null;

  // Active P2P Trades
  const myTrades = trades.filter(t => t.buyerId === currentUser.id || t.sellerId === currentUser.id);
  const activeTrades = myTrades.filter(t => t.status === 'AWAITING_PAYMENT' || t.status === 'PAID' || t.status === 'DISPUTED');
  const completedTrades = myTrades.filter(t => t.status === 'COMPLETED');

  // Total balance in USD
  const totalUsdt = wallet.balances.usdtTrc20 + wallet.balances.usdtBep20 + wallet.balances.usdtErc20;
  const totalPgk = totalUsdt * FIAT_RATES.PGK;

  // My offers
  const myOffers = offers.filter(o => o.userId === currentUser.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Trader Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-2xl text-slate-950 shadow-lg">
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{currentUser.username}</h1>
                {currentUser.isKycVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified PNG Trader</span>
                  </span>
                )}
                {currentUser.role === 'admin' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    Compliance Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentUser.email} · {currentUser.country} · Member since {currentUser.createdAt}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
            <div>
              <div className="text-xl font-black text-white font-mono">{currentUser.tradesCount + completedTrades.length}</div>
              <div className="text-[11px] text-slate-400 uppercase">Completed</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-400 font-mono">{currentUser.completionRate}%</div>
              <div className="text-[11px] text-slate-400 uppercase">Rate</div>
            </div>
            <div>
              <div className="text-xl font-black text-white font-mono">{currentUser.positiveRating}%</div>
              <div className="text-[11px] text-slate-400 uppercase">Positive</div>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Identity Verification Sections */}
      {currentUser.kycStatus === 'unverified' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <div className="flex items-center gap-2 text-amber-500">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="text-lg font-black text-white">Identity Verification (KYC) Required</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify your identity with your ID Card and WhatsApp number to unlock ad postings, high-volume trades, and premium dealer status on NexKina.
            </p>
          </div>

          <form onSubmit={handleKycSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID Card Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 12345-6789012-3"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
              <input
                type="text"
                required
                placeholder="e.g. +923001234567"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono transition"
              />
            </div>

            {kycError && <div className="md:col-span-2 text-xs text-rose-400 font-semibold">{kycError}</div>}

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/10 transition"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Verification Details'}
              </button>
            </div>
          </form>
        </div>
      )}

      {currentUser.kycStatus === 'pending' && (
        <div className="bg-slate-900 border border-amber-500/20 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <h2 className="text-base font-black text-white">KYC Verification Under Review</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Your ID Card Number (<span className="font-mono text-slate-200">{currentUser.idCardNumber || currentUser.kycDocumentNumber || 'Submitted'}</span>) and WhatsApp Number (<span className="font-mono text-slate-200">{currentUser.whatsappNumber || 'Submitted'}</span>) are currently under review. A compliance officer will review and verify your account shortly.
            </p>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold shrink-0">
            Pending Approval
          </span>
        </div>
      )}

      {/* Quick Action Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('marketplace')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-left transition group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-white">Buy & Sell P2P</div>
          <div className="text-xs text-slate-400 mt-0.5">Explore Kina orderbook</div>
        </button>

        <button
          onClick={() => setActiveTab('deposit')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-left transition group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-white">Deposit USDT</div>
          <div className="text-xs text-slate-400 mt-0.5">TRC20, BEP20, ERC20</div>
        </button>

        <button
          onClick={() => setActiveTab('withdraw')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-left transition group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-white">Withdraw Crypto</div>
          <div className="text-xs text-slate-400 mt-0.5">Fast on-chain payout</div>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-left transition group shadow-lg"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Send className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-white">Internal Transfer</div>
          <div className="text-xs text-slate-400 mt-0.5">0% fee to users</div>
        </button>
      </div>

      {/* Active P2P Trades in Progress */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Active Orders in Escrow</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
              {activeTrades.length}
            </span>
          </div>

          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
          >
            <span>View All Trades</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {activeTrades.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No pending trades right now. You can place a new order on the marketplace.
          </div>
        ) : (
          <div className="space-y-3">
            {activeTrades.map(t => {
              const isBuyer = t.buyerId === currentUser.id;
              const counterparty = isBuyer ? t.sellerUsername : t.buyerUsername;

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isBuyer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {isBuyer ? 'BUYING' : 'SELLING'} {t.cryptoAmount} {t.cryptoCurrency}
                      </span>
                      <span className="text-xs font-bold text-white font-mono">
                        {t.fiatAmount} {t.fiatCurrency}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Counterparty: <strong className="text-slate-200">{counterparty}</strong> · Status: <span className="text-amber-400 font-semibold">{t.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTradeId(t.id)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <span>Open Trade Room</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Listed Advertisements */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">My Active P2P Advertisements</h3>
            <p className="text-xs text-slate-400">Offers you posted for other traders to accept</p>
          </div>
          <button
            onClick={() => setActiveTab('marketplace')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Ad</span>
          </button>
        </div>

        {myOffers.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            You have not posted any trading advertisements yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myOffers.map(o => (
              <div key={o.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    o.type === 'SELL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {o.type} {o.cryptoCurrency}
                  </span>
                  <span className="font-mono text-white font-bold text-sm">
                    {o.pricePerUnit.toFixed(2)} {o.fiatCurrency}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Available: {o.availableAmount} {o.cryptoCurrency}</span>
                  <span>Limits: {o.minLimit} - {o.maxLimit} {o.fiatCurrency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
