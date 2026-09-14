import React, { useState } from 'react';
import { 
  FileText, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Send, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TransactionType, TransactionStatus } from '../types';

export const TransactionHistoryView: React.FC = () => {
  const { transactions, showToast } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = transactions.filter(t => {
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchId = t.id.toLowerCase().includes(q);
      const matchTx = t.txHash?.toLowerCase().includes(q);
      const matchCoin = t.cryptoCurrency.toLowerCase().includes(q);
      if (!matchId && !matchTx && !matchCoin) return false;
    }
    return true;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'DEPOSIT':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'WITHDRAWAL':
        return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'P2P_ESCROW_LOCK':
      case 'P2P_ESCROW_RELEASE':
        return <ArrowLeftRight className="w-4 h-4 text-blue-400" />;
      case 'INTERNAL_TRANSFER':
        return <Send className="w-4 h-4 text-teal-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-400" />
          <span>Transaction & Escrow History</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete ledger of deposits, withdrawals, internal peer transfers, and P2P escrow settlements.
        </p>
      </div>

      {/* Filters Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by TxID, hash, or asset..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3 md:col-span-4">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Transaction Types</option>
              <option value="DEPOSIT">Deposits (Inbound Blockchain)</option>
              <option value="WITHDRAWAL">Withdrawals (Outbound Blockchain)</option>
              <option value="P2P_ESCROW_RELEASE">P2P Escrow Trades</option>
              <option value="INTERNAL_TRANSFER">Internal Peer Transfers</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3 md:col-span-3">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No transactions match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Type & Time</th>
                  <th className="px-6 py-3.5">Asset Amount</th>
                  <th className="px-6 py-3.5">Network / Channel</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">TxHash / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map(tx => {
                  const isPositive = tx.type === 'DEPOSIT' || tx.type === 'P2P_ESCROW_RELEASE';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      {/* Type & Time */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                            {getTypeIcon(tx.type)}
                          </div>
                          <div>
                            <div className="font-bold text-white capitalize">
                              {tx.type.replace(/_/g, ' ').toLowerCase()}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(tx.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <div className={`font-mono font-bold text-sm ${
                          isPositive ? 'text-emerald-400' : 'text-slate-200'
                        }`}>
                          {isPositive ? '+' : '-'}{tx.amount} {tx.cryptoCurrency}
                        </div>
                        {tx.fee > 0 && (
                          <div className="text-[10px] text-slate-500">
                            Fee: {tx.fee} {tx.cryptoCurrency}
                          </div>
                        )}
                      </td>

                      {/* Network */}
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
                          {tx.network || 'OFF-CHAIN'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {tx.status}
                        </span>
                      </td>

                      {/* TxHash / Ref */}
                      <td className="px-6 py-4 font-mono text-[11px]">
                        {tx.txHash ? (
                          <div className="flex items-center gap-2 text-slate-400">
                            <span className="truncate max-w-[140px]">{tx.txHash}</span>
                            <button
                              onClick={() => handleCopy(tx.txHash!, tx.id)}
                              className="text-slate-500 hover:text-white"
                              title="Copy Hash"
                            >
                              {copiedId === tx.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600">Off-chain DB</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
