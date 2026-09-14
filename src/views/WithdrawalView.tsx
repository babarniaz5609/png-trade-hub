import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  CheckCircle2, 
  Lock,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BlockchainNetwork, CryptoCurrency } from '../types';
import { TATUM_SUPPORTED_CHAINS } from '../lib/tatum';

export const WithdrawalView: React.FC = () => {
  const { wallet, withdrawals, requestWithdrawal, isLoading, showToast, refreshData } = useApp();
  const { currentUser } = useAuth();

  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency>('USDT');
  const [network, setNetwork] = useState<BlockchainNetwork>('TRC20');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [amount, setAmount] = useState<number>(25);

  if (!wallet) return null;

  // Available balance lookup
  const getAvailable = () => {
    if (cryptoCurrency === 'USDT') {
      if (network === 'TRC20') return Number(wallet.balances.usdtTrc20 || 0);
      if (network === 'BEP20') return Number(wallet.balances.usdtBep20 || 0);
      return Number(wallet.balances.usdtErc20 || 0);
    }
    if (cryptoCurrency === 'TRX') return Number(wallet.balances.trx || 0);
    if (cryptoCurrency === 'ETH') return Number(wallet.balances.eth || 0);
    if (cryptoCurrency === 'BNB') return Number(wallet.balances.bnb || 0);
    return 0;
  };

  const available = getAvailable();
  const fee: number = TATUM_SUPPORTED_CHAINS[network]?.standardWithdrawalFee ?? 1.5;
  const netAmount = Math.max(0, amount - fee);

  const handleMax = () => {
    setAmount(available);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationAddress.trim()) {
      showToast('Please provide a valid destination address.', 'error');
      return;
    }
    if (amount <= fee) {
      showToast(`Amount must be higher than the network fee (${fee} ${cryptoCurrency}).`, 'error');
      return;
    }
    if (amount > available) {
      showToast('Insufficient available balance to cover amount and network fee.', 'error');
      return;
    }

    const ok = await requestWithdrawal({
      cryptoCurrency,
      network,
      amount,
      destinationAddress: destinationAddress.trim()
    });

    if (ok) {
      setDestinationAddress('');
      showToast('Withdrawal request submitted for compliance review. Balance reserved in internal ledger.', 'success');
      refreshData();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ArrowUpRight className="w-6 h-6 text-amber-400" />
          <span>Withdraw USDT & Cryptocurrency</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Submit an on-chain payout request. Available funds are atomically reserved in the ledger pending compliance review.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            {/* Step 1: Asset */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                1. Select Asset
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['USDT', 'TRX', 'ETH', 'BNB'] as CryptoCurrency[]).map(coin => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => {
                      setCryptoCurrency(coin);
                      if (coin === 'TRX') setNetwork('TRON');
                      else if (coin === 'ETH') setNetwork('ETHEREUM');
                      else if (coin === 'BNB') setNetwork('BSC');
                      else setNetwork('TRC20');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center ${
                      cryptoCurrency === coin
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <span>{coin}</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      {coin === 'USDT' ? 'Tether' : coin === 'TRX' ? 'Tron' : coin === 'ETH' ? 'Ethereum' : 'Binance'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Network */}
            {cryptoCurrency === 'USDT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  2. Select Blockchain Network
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'TRC20' as BlockchainNetwork, name: 'TRC-20', fee: '1.5 USDT', badge: 'Fastest' },
                    { id: 'BEP20' as BlockchainNetwork, name: 'BEP-20', fee: '0.8 USDT', badge: 'Lowest Fee' },
                    { id: 'ERC20' as BlockchainNetwork, name: 'ERC-20', fee: '5.0 USDT', badge: 'High Gas' },
                  ].map(net => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setNetwork(net.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                        network === net.id
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      <div className="font-bold">{net.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Network Fee: {net.fee}</div>
                      <span className="text-[10px] font-medium text-amber-400 mt-1">{net.badge}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Destination Address Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destination {network} Wallet Address
              </label>
              <input
                type="text"
                required
                value={destinationAddress}
                onChange={e => setDestinationAddress(e.target.value)}
                placeholder={network === 'TRC20' || network === 'TRON' ? 'e.g. TXp3B4... (TRON Base58 Address)' : 'e.g. 0x71C... (EVM Address)'}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Amount */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>Withdrawal Amount</span>
                <span className="text-slate-400">
                  Available: <strong className="text-white font-mono">{available.toFixed(2)} {cryptoCurrency}</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  min={fee + 0.1}
                  max={available}
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-16 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleMax}
                  className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-bold text-amber-400 transition"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Breakdown Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Standard Network Fee:</span>
                <span className="font-mono text-white">{fee} {cryptoCurrency}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Reserved From Balance:</span>
                <span className="font-mono text-white">{(amount + fee).toFixed(2)} {cryptoCurrency}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                <span className="text-slate-300">Recipient Will Receive:</span>
                <span className="text-amber-400 font-mono">{amount > 0 ? amount.toFixed(4) : '0.00'} {cryptoCurrency}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || amount <= 0 || (amount + fee) > available}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Processing...' : `Submit Withdrawal Request (${amount} ${cryptoCurrency})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Information & Real History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Security & Workflow Assurance Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 text-xs text-slate-400">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Production Payout Protocol</span>
            </h3>
            <p className="leading-relaxed">
              When a withdrawal is submitted, the exact amount plus network fee is locked in your escrow ledger. The compliance team verifies the destination address. Once approved, the funds are broadcast. If rejected, the full amount is refunded to your available balance immediately.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                <Cpu className="w-3.5 h-3.5" />
                <span>Tatum KMS Node Ready</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Blockchain transactions are held in PENDING state until Tatum live keys are connected. No simulated transaction hashes are created.
              </p>
            </div>
          </div>

          {/* Recent Withdrawals List */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Your Payout Requests ({withdrawals.length})
              </h3>
              <button
                onClick={() => refreshData()}
                className="text-slate-400 hover:text-white transition text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {withdrawals.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No withdrawal requests yet.</p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map(w => (
                  <div key={w.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white font-mono text-sm">
                        -{w.amount} {w.currency}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        w.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : w.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {w.status === 'PENDING_APPROVAL' ? 'Pending Review' : w.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Network: {w.network}</span>
                      <span>Fee: {w.fee} {w.currency}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      To: {w.toAddress}
                    </div>

                    {w.rejectionReason && (
                      <div className="text-[10px] text-rose-400 bg-rose-950/30 p-1.5 rounded border border-rose-500/30">
                        Reason: {w.rejectionReason} (Amount refunded to available balance)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
