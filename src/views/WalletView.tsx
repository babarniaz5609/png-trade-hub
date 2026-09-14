import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  ArrowLeftRight,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CryptoCurrency, BlockchainNetwork } from '../types';
import { TATUM_SUPPORTED_CHAINS, FIAT_RATES } from '../lib/tatum';

export const WalletView: React.FC = () => {
  const { wallet, setActiveTab, isLoading, refreshData } = useApp();
  const { currentUser } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!wallet) return null;

  const b = wallet.balances;
  const le = wallet.lockedEscrow || { usdt: 0, trx: 0, eth: 0, bnb: 0 };

  // Asset rows
  const assets = [
    {
      symbol: 'USDT',
      name: 'Tether USD',
      network: 'TRC20' as BlockchainNetwork,
      networkLabel: 'TRC-20 (Tron)',
      available: Number(b.usdtTrc20 || 0),
      locked: Number(le.usdt || 0),
      total: Number(b.usdtTrc20 || 0) + Number(le.usdt || 0),
      rateUsd: 1.00,
      ratePgk: FIAT_RATES.PGK,
      depositKey: 'USDT-TRC20',
      tag: 'Primary P2P'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      network: 'BEP20' as BlockchainNetwork,
      networkLabel: 'BEP-20 (BNB Chain)',
      available: Number(b.usdtBep20 || 0),
      locked: 0,
      total: Number(b.usdtBep20 || 0),
      rateUsd: 1.00,
      ratePgk: FIAT_RATES.PGK,
      depositKey: 'USDT-BEP20',
      tag: 'Low Gas'
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      network: 'ERC20' as BlockchainNetwork,
      networkLabel: 'ERC-20 (Ethereum)',
      available: Number(b.usdtErc20 || 0),
      locked: 0,
      total: Number(b.usdtErc20 || 0),
      rateUsd: 1.00,
      ratePgk: FIAT_RATES.PGK,
      depositKey: 'USDT-ERC20',
      tag: 'Mainnet'
    },
    {
      symbol: 'TRX',
      name: 'TRON Native',
      network: 'TRON' as BlockchainNetwork,
      networkLabel: 'TRON Network',
      available: Number(b.trx || 0),
      locked: Number(le.trx || 0),
      total: Number(b.trx || 0) + Number(le.trx || 0),
      rateUsd: 0.22,
      ratePgk: 0.22 * FIAT_RATES.PGK,
      depositKey: 'TRX'
    },
    {
      symbol: 'BNB',
      name: 'BNB Smart Chain',
      network: 'BSC' as BlockchainNetwork,
      networkLabel: 'BNB Chain',
      available: Number(b.bnb || 0),
      locked: Number(le.bnb || 0),
      total: Number(b.bnb || 0) + Number(le.bnb || 0),
      rateUsd: 590.0,
      ratePgk: 590.0 * FIAT_RATES.PGK,
      depositKey: 'BNB'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      network: 'ETHEREUM' as BlockchainNetwork,
      networkLabel: 'Ethereum Mainnet',
      available: Number(b.eth || 0),
      locked: Number(le.eth || 0),
      total: Number(b.eth || 0) + Number(le.eth || 0),
      rateUsd: 2650.0,
      ratePgk: 2650.0 * FIAT_RATES.PGK,
      depositKey: 'ETH'
    }
  ];

  // Calculate totals
  const totalUsd = assets.reduce((acc, a) => acc + (a.total * a.rateUsd), 0);
  const totalPgk = totalUsd * FIAT_RATES.PGK;
  const lockedUsd = assets.reduce((acc, a) => acc + (a.locked * a.rateUsd), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Portfolio Overview Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <Wallet className="w-4 h-4" />
              <span>Real Ledger Balances · PNG Trade Hub</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-lg text-slate-400 font-semibold font-mono">
                ≈ {totalPgk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PGK
              </span>
            </div>

            {lockedUsd > 0 ? (
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-300 font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>${lockedUsd.toFixed(2)} USD currently reserved in active P2P escrow</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>No active escrow holds. All available funds can be traded or transferred.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('marketplace')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Trade P2P</span>
            </button>

            <button
              onClick={() => setActiveTab('transfers')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Internal Transfer (0%)</span>
            </button>

            <button
              onClick={() => setActiveTab('withdraw')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={() => setActiveTab('deposit')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit Info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Production Ledger Architecture Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Atomic Double-Entry Ledger Protection</h3>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                100% Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              All balances are mathematically reconciled through immutable audit records. Escrow reservations are locked server-side during trades.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshData()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Asset Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Cryptocurrency Balances</h3>
            <p className="text-xs text-slate-400">Multi-network wallets connected to secure blockchain vaults</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            <Cpu className="w-3.5 h-3.5" />
            <span>Multi-Chain Connected</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Asset & Network</th>
                <th className="px-6 py-3.5">Available Balance</th>
                <th className="px-6 py-3.5">In Escrow</th>
                <th className="px-6 py-3.5">Total Balance</th>
                <th className="px-6 py-3.5">Est. Value (PGK)</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {assets.map((asset, idx) => {
                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    {/* Asset Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-emerald-400 border border-slate-700">
                          {asset.symbol}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{asset.name}</span>
                            {asset.tag && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                                {asset.tag}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{asset.networkLabel}</div>
                        </div>
                      </div>
                    </td>

                    {/* Available */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-white font-mono text-sm">
                        {asset.available.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ≈ ${(asset.available * asset.rateUsd).toFixed(2)} USD
                      </div>
                    </td>

                    {/* Escrow */}
                    <td className="px-6 py-4">
                      {asset.locked > 0 ? (
                        <div className="font-bold text-amber-300 font-mono text-xs flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>{asset.locked.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">0.00</span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4">
                      <div className="font-black text-white font-mono">
                        {asset.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {asset.symbol}
                      </div>
                    </td>

                    {/* PGK Value */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-emerald-400 font-mono">
                        {(asset.total * asset.ratePgk).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PGK
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveTab('transfers')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xs font-semibold rounded-lg border border-slate-700 transition"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={() => setActiveTab('withdraw')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                        >
                          Withdraw
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
