import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  Copy, 
  Check, 
  Building2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  ArrowLeft,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const P2PTradeRoomView: React.FC = () => {
  const { 
    activeTrade, 
    setActiveTradeId, 
    chatMessages, 
    sendChatMessage, 
    markTradePaid, 
    releaseEscrow, 
    raiseDispute,
    setActiveTab
  } = useApp();
  const { currentUser, isAdmin } = useAuth();

  const [messageText, setMessageText] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Payment sent but seller has not released crypto.');
  const [referenceCodeInput, setReferenceCodeInput] = useState('BSP-TX-' + Math.floor(100000 + Math.random() * 900000));
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins in seconds

  // Timer countdown
  useEffect(() => {
    if (!activeTrade || activeTrade.status === 'COMPLETED' || activeTrade.status === 'CANCELLED') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTrade]);

  if (!activeTrade) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Active Trade Order Selected</h2>
        <p className="text-xs text-slate-400">Please select an order from the P2P marketplace or transaction history.</p>
        <button
          onClick={() => setActiveTab('marketplace')}
          className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const isBuyer = currentUser.id === activeTrade.buyerId;
  const isSeller = currentUser.id === activeTrade.sellerId;
  const counterpartyName = isBuyer ? activeTrade.sellerUsername : activeTrade.buyerUsername;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendChatMessage(activeTrade.id, messageText.trim());
    setMessageText('');
  };

  const handleQuickChat = (text: string) => {
    sendChatMessage(activeTrade.id, text);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('marketplace')}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">
                P2P Escrow Order #{activeTrade.id.slice(-6)}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                activeTrade.status === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : activeTrade.status === 'PAID'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : activeTrade.status === 'DISPUTED'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {activeTrade.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Trading with <strong className="text-white">{counterpartyName}</strong> · {isBuyer ? 'You are BUYING' : 'You are SELLING'}
            </p>
          </div>
        </div>

        {/* Live Timer */}
        {activeTrade.status === 'AWAITING_PAYMENT' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
            <Clock className="w-4 h-4 animate-spin text-amber-400" />
            <span>Time to pay: {formattedTime}</span>
          </div>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="grid grid-cols-4 gap-2 text-xs">
          {[
            { label: '1. Order Created', done: true, active: false },
            { label: '2. Escrow Locked', done: true, active: activeTrade.status === 'AWAITING_PAYMENT' },
            { label: '3. Buyer Paid', done: activeTrade.status === 'PAID' || activeTrade.status === 'COMPLETED', active: activeTrade.status === 'PAID' },
            { label: '4. Released', done: activeTrade.status === 'COMPLETED', active: activeTrade.status === 'COMPLETED' }
          ].map((s, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                s.done 
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                  : s.active 
                  ? 'bg-amber-500 text-slate-950 animate-pulse' 
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {s.done ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`text-[11px] font-medium hidden sm:inline ${
                s.done ? 'text-emerald-400' : s.active ? 'text-amber-400' : 'text-slate-500'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two-Column Trade Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Payment Instructions & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Trade Financial Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Order Payment Breakdown
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Total Kina Amount</span>
                <span className="text-xl font-black text-white">{activeTrade.fiatAmount.toFixed(2)}</span>
                <span className="text-xs text-slate-400 ml-1 font-sans">{activeTrade.fiatCurrency}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Crypto Amount</span>
                <span className="text-xl font-black text-emerald-400">{activeTrade.cryptoAmount}</span>
                <span className="text-xs text-slate-400 ml-1 font-sans">{activeTrade.cryptoCurrency}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-sans">Locked Unit Rate</span>
                <span className="text-base font-bold text-white">{activeTrade.pricePerUnit.toFixed(2)}</span>
                <span className="text-xs text-slate-400 ml-1 font-sans">{activeTrade.fiatCurrency}</span>
              </div>
            </div>

            {/* Escrow Guarantee Pill */}
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>100% Escrow Active:</strong> {activeTrade.cryptoAmount} {activeTrade.cryptoCurrency} is currently held safely in PNG Trade Hub reserve vault.
              </span>
            </div>
          </div>

          {/* Seller's Bank Account Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Seller's Bank & Payment Details
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                {activeTrade.selectedPaymentMethod}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Bank / Provider</span>
                  <span className="font-bold text-white">{activeTrade.sellerPaymentDetails.bankName || activeTrade.selectedPaymentMethod}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(activeTrade.sellerPaymentDetails.bankName || activeTrade.selectedPaymentMethod, 'bank')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Copy"
                >
                  {copiedKey === 'bank' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Account Holder Name</span>
                  <span className="font-bold text-white">{activeTrade.sellerPaymentDetails.accountName || activeTrade.sellerUsername}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(activeTrade.sellerPaymentDetails.accountName || activeTrade.sellerUsername, 'name')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Copy"
                >
                  {copiedKey === 'name' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Bank Account / CellMoni Number</span>
                  <span className="font-bold text-white font-mono text-sm">{activeTrade.sellerPaymentDetails.accountNumber}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(activeTrade.sellerPaymentDetails.accountNumber || '', 'acct')}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Copy"
                >
                  {copiedKey === 'acct' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div>
                  <span className="text-amber-400 block text-[10px] uppercase font-bold">Transfer Remark / Reference Code (Required)</span>
                  <span className="font-bold text-amber-200 font-mono text-sm">{activeTrade.sellerPaymentDetails.referenceCode}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(activeTrade.sellerPaymentDetails.referenceCode || '', 'ref')}
                  className="p-1.5 text-amber-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  title="Copy"
                >
                  {copiedKey === 'ref' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              ⚠️ <strong>Important:</strong> Only transfer funds from a bank account under your own verified legal name. Never write crypto keywords like "USDT" or "Bitcoin" in bank transfer remarks. Use the exact reference code provided above.
            </p>
          </div>

          {/* Action Center */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Order Actions</h3>

            {/* Buyer Flow */}
            {isBuyer && activeTrade.status === 'AWAITING_PAYMENT' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  After you have transferred <strong>{activeTrade.fiatAmount} {activeTrade.fiatCurrency}</strong> via your mobile banking app, enter your payment receipt reference and click below:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referenceCodeInput}
                    onChange={e => setReferenceCodeInput(e.target.value)}
                    placeholder="Enter bank transaction reference..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => markTradePaid(activeTrade.id, referenceCodeInput)}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition whitespace-nowrap"
                  >
                    Transferred, Notify Seller
                  </button>
                </div>
              </div>
            )}

            {isBuyer && activeTrade.status === 'PAID' && (
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  You have marked this order as PAID.
                </div>
                <p className="text-slate-300">
                  Seller is verifying their bank statement. Your {activeTrade.cryptoAmount} USDT will be released immediately once confirmed.
                </p>
              </div>
            )}

            {/* Seller Flow */}
            {isSeller && activeTrade.status === 'AWAITING_PAYMENT' && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200">
                <p>Waiting for buyer ({activeTrade.buyerUsername}) to transfer {activeTrade.fiatAmount} {activeTrade.fiatCurrency} to your bank account.</p>
              </div>
            )}

            {isSeller && activeTrade.status === 'PAID' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                  <strong>Buyer has marked payment as completed!</strong> Reference: <code className="font-mono text-white">{activeTrade.paymentReference}</code>. Please open your BSP or Kina Bank app, confirm funds have arrived, and release crypto.
                </div>
                <button
                  onClick={() => setShowReleaseModal(true)}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Confirm Payment Received & Release USDT</span>
                </button>
              </div>
            )}

            {/* Completed Flow */}
            {activeTrade.status === 'COMPLETED' && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Trade Order Successfully Completed!
                </div>
                <p className="text-slate-300">
                  {activeTrade.cryptoAmount} {activeTrade.cryptoCurrency} has been released into buyer's available wallet balance.
                </p>
              </div>
            )}

            {/* Dispute Flow */}
            {activeTrade.status !== 'COMPLETED' && activeTrade.status !== 'CANCELLED' && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Encountering an issue?</span>
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 font-semibold"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Raise Escrow Dispute</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Escrow Trade Chat */}
        <div className="lg:col-span-5 flex flex-col h-[640px] bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white">Live Trade Chat</h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Encrypted Room</span>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {chatMessages.map(msg => {
              if (msg.isSystem) {
                return (
                  <div key={msg.id} className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-400 text-center leading-relaxed">
                    <span className="text-emerald-400 font-semibold block mb-0.5">🛡️ PNG Escrow System</span>
                    {msg.message}
                  </div>
                );
              }

              const isMe = msg.senderId === currentUser.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-500 mb-1 px-1">
                    {msg.senderUsername} · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl ${
                      isMe
                        ? 'bg-emerald-500 text-slate-950 rounded-br-none font-medium'
                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Replies */}
          <div className="p-2 bg-slate-950 border-t border-slate-800/80 flex gap-1.5 overflow-x-auto text-[11px] text-slate-400">
            {isBuyer ? (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickChat('Hello! Sending payment via BSP Mobile App now.')}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 whitespace-nowrap"
                >
                  Sending via BSP now
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickChat('Payment completed, please release crypto.')}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 whitespace-nowrap"
                >
                  Payment done
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleQuickChat('Hello! Account details are accurate. Awaiting your transfer.')}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 whitespace-nowrap"
                >
                  Awaiting transfer
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickChat('Confirmed receipt in BSP! Releasing crypto now.')}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 rounded border border-slate-800 whitespace-nowrap"
                >
                  Releasing now
                </button>
              </>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              placeholder="Type message to trader..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="p-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Release Confirmation Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Unlock className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-white">Confirm Crypto Release</h3>
              <p className="text-xs text-slate-300">
                Have you logged into your bank account and verified receipt of <strong>{activeTrade.fiatAmount} {activeTrade.fiatCurrency}</strong> from {activeTrade.buyerUsername}?
              </p>
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-left">
                ⚠️ Once released, {activeTrade.cryptoAmount} USDT will be irreversibly transferred to the buyer. This action cannot be undone.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReleaseModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowReleaseModal(false);
                  await releaseEscrow(activeTrade.id);
                }}
                className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
              >
                Yes, Release Escrow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Open Escrow Dispute</h3>
              <p className="text-xs text-slate-400">
                A PNG Trade Hub compliance arbitrator will review bank statements and audit logs.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Dispute Reason</label>
              <textarea
                rows={3}
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                placeholder="Explain the problem (e.g. buyer paid incorrect amount, seller offline)..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDisputeModal(false);
                  await raiseDispute(activeTrade.id, disputeReason);
                }}
                className="py-2.5 px-4 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow"
              >
                Summon Arbitrator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
