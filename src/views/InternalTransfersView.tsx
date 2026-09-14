import React, { useState } from 'react';
import { 
  Send, 
  Zap, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CryptoCurrency } from '../types';

export const InternalTransfersView: React.FC = () => {
  const { wallet, transfers, transactions, internalTransfer, isLoading, showToast, refreshData } = useApp();
  const { allUsers, currentUser } = useAuth();

  const [recipient, setRecipient] = useState('Sarah_Merchant');
  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency>('USDT');
  const [amount, setAmount] = useState<number>(20);
  const [note, setNote] = useState('');

  if (!wallet) return null;

  const available = cryptoCurrency === 'USDT' 
    ? Number(wallet.balances.usdtTrc20 || 0) 
    : cryptoCurrency === 'TRX' 
    ? Number(wallet.balances.trx || 0) 
    : cryptoCurrency === 'ETH' 
    ? Number(wallet.balances.eth || 0) 
    : Number(wallet.balances.bnb || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) {
      showToast('Please specify a recipient username or email.', 'error');
      return;
    }
    if (amount <= 0 || amount > available) {
      showToast('Invalid or insufficient amount.', 'error');
      return;
    }

    const ok = await internalTransfer({
      recipientIdentifier: recipient.trim(),
      cryptoCurrency,
      amount,
      note
    });

    if (ok) {
      showToast(`Transferred ${amount} ${cryptoCurrency} to @${recipient} with 0% fee.`, 'success');
      setAmount(10);
      setNote('');
      refreshData();
    }
  };

  const internalHistory = transfers.length > 0 
    ? transfers 
    : transactions.filter(t => t.type === 'INTERNAL_TRANSFER');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-emerald-400" />
          <span>Internal USDT Transfers (Instant & 0% Fee)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Send USDT or crypto directly to any registered PNG Trade Hub user. Settles atomically via internal ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            {/* 0% Fee Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Network Gas · Instant Atomic Double-Entry Settlement</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">0% FEE</span>
            </div>

            {/* Quick Registered Trader Chips */}
            {allUsers.length > 1 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Registered Trader / Merchant
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {allUsers
                    .filter(u => u.id !== currentUser?.id)
                    .slice(0, 6)
                    .map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setRecipient(u.username)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition ${
                          recipient.toLowerCase() === u.username.toLowerCase() || recipient.toLowerCase() === u.email.toLowerCase()
                            ? 'bg-emerald-500/20 border-emerald-500 text-white shadow'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                        }`}
                      >
                        <div className="font-bold truncate">@{u.username}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{u.role}</div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Recipient Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Recipient Username or Registered Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                  placeholder="e.g. Sarah_Merchant or name@pngtradehub.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Asset Choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Asset</label>
              <div className="grid grid-cols-4 gap-2">
                {(['USDT', 'TRX', 'ETH', 'BNB'] as CryptoCurrency[]).map(coin => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => setCryptoCurrency(coin)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 ${
                      cryptoCurrency === coin
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <span>{coin}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Transfer Amount</span>
                <span className="text-slate-400">
                  Available: <strong className="text-white font-mono">{available.toFixed(2)} {cryptoCurrency}</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  min={0.01}
                  max={available}
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-16 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setAmount(available)}
                  className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-bold text-emerald-400 transition"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Optional Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction Note / Memo (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Payment for invoice #PNG-202"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || amount <= 0 || amount > available}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Settling...' : `Send ${amount} ${cryptoCurrency} Instantly (0% Fee)`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Recent Internal Transfers */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Recent Internal Transfers</span>
              </h3>
              <button
                onClick={() => refreshData()}
                className="text-slate-400 hover:text-white transition text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync</span>
              </button>
            </div>

            {internalHistory.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No internal transfers sent or received yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {internalHistory.slice(0, 8).map((item: any, idx: number) => {
                  const isSent = item.senderId === currentUser?.id || item.type === 'INTERNAL_TRANSFER_SENT';
                  const amountVal = item.amount || 0;
                  const curr = item.currency || item.cryptoCurrency || 'USDT';

                  return (
                    <div key={item.id || idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className={`font-bold font-mono text-sm ${isSent ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isSent ? `-${amountVal}` : `+${amountVal}`} {curr}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Instant 0%
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300">
                        {isSent ? (
                          <span>Sent to: <strong className="text-white">@{item.recipientUsername || 'Recipient'}</strong></span>
                        ) : (
                          <span>Received from: <strong className="text-white">@{item.senderUsername || 'Sender'}</strong></span>
                        )}
                      </div>

                      {item.note && (
                        <div className="text-[11px] text-slate-400 italic">
                          "{item.note}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
