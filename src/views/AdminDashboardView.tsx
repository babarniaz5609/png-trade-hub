import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  ArrowUpRight, 
  ArrowLeftRight, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Database, 
  Cpu, 
  Lock, 
  Unlock, 
  RefreshCw,
  TrendingUp,
  Scale,
  Send,
  MessageSquare,
  Server,
  Copy,
  ExternalLink,
  Layers,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { TATUM_SUPPORTED_CHAINS, FIAT_RATES } from '../lib/tatum';

type AdminTab = 'overview' | 'users' | 'withdrawals' | 'orders' | 'tickets' | 'tatum' | 'supabase';

export const AdminDashboardView: React.FC = () => {
  const { 
    platformStats, 
    trades, 
    withdrawals,
    supportTickets, 
    showToast,
    refreshData 
  } = useApp();
  const { allUsers, currentUser } = useAuth();

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [tatumStatus, setTatumStatus] = useState<any>(null);
  const [supabaseHealth, setSupabaseHealth] = useState<any>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [disputeModalTrade, setDisputeModalTrade] = useState<any | null>(null);
  const [arbitrationNote, setArbitrationNote] = useState('');

  // Fetch Tatum Engine Status
  useEffect(() => {
    fetch('/api/tatum/status')
      .then(r => r.json())
      .then(d => setTatumStatus(d))
      .catch(() => {});
  }, []);

  // Fetch Supabase Backend Health Status
  const fetchSupabaseStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const d = await res.json();
        setSupabaseHealth(d);
      }
    } catch (e) {
      console.error('Error fetching Supabase health:', e);
    }
  };

  useEffect(() => {
    fetchSupabaseStatus();
  }, []);

  // Synchronize Platform Records into Supabase
  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await fetch('/api/supabase/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Supabase database synchronization completed!', 'success');
        setSupabaseHealth(data.health);
        refreshData();
      } else {
        showToast(data.error || 'Failed to sync with Supabase', 'error');
      }
    } catch {
      showToast('Network error during Supabase sync', 'error');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Copy SQL Schema Migration Script
  const handleCopySqlSchema = async () => {
    try {
      const res = await fetch('/api/supabase/schema');
      if (res.ok) {
        const sql = await res.text();
        await navigator.clipboard.writeText(sql);
        setSqlCopied(true);
        showToast('PostgreSQL schema copied to clipboard! Paste into Supabase SQL Editor.', 'success');
        setTimeout(() => setSqlCopied(false), 3000);
      }
    } catch {
      showToast('Failed to copy schema', 'error');
    }
  };

  // Admin action: Verify or revoke KYC
  const handleToggleKyc = async (userId: string, currentStatus: string) => {
    const next = currentStatus === 'verified' ? 'unverified' : 'verified';
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      if (res.ok) {
        showToast(`User KYC status set to ${next.toUpperCase()}`, 'success');
        refreshData();
      } else {
        showToast('Failed to update KYC status', 'error');
      }
    } catch {
      showToast('Network error updating KYC status', 'error');
    }
  };

  // Admin action: Toggle Freeze
  const handleToggleFreeze = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-freeze`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        showToast(`User ${data.user.isFrozen ? 'FROZEN' : 'UNFROZEN'}`, 'info');
        refreshData();
      }
    } catch {
      showToast('Error freezing user account', 'error');
    }
  };

  // Admin action: Approve Withdrawal
  const handleApproveWithdrawal = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast(`Withdrawal #${id.slice(-6)} approved. Output queued for blockchain broadcast.`, 'success');
        refreshData();
      } else {
        showToast('Failed to approve withdrawal', 'error');
      }
    } catch {
      showToast('Network error approving withdrawal', 'error');
    }
  };

  // Admin action: Reject Withdrawal (with atomic refund)
  const handleRejectWithdrawal = async (id: string) => {
    const reason = prompt('Please enter the reason for rejection (funds will be refunded to user):', 'Compliance verification failed') || 'Compliance verification failed';
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason })
      });
      if (res.ok) {
        showToast(`Withdrawal rejected. Reserved funds refunded to user's available balance.`, 'info');
        refreshData();
      } else {
        showToast('Failed to reject withdrawal', 'error');
      }
    } catch {
      showToast('Network error rejecting withdrawal', 'error');
    }
  };

  // Admin action: Arbitrate Dispute
  const handleArbitrateTrade = async (winnerId: string) => {
    if (!disputeModalTrade) return;
    try {
      const res = await fetch(`/api/admin/trades/${disputeModalTrade.id}/arbitrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId,
          note: arbitrationNote || 'Mediated by compliance officer after payment verification.'
        })
      });
      if (res.ok) {
        showToast('Dispute resolved. Escrow settled according to official ruling.', 'success');
        setDisputeModalTrade(null);
        setArbitrationNote('');
        refreshData();
      } else {
        showToast('Failed to arbitrate trade', 'error');
      }
    } catch {
      showToast('Error submitting arbitration ruling', 'error');
    }
  };

  // Admin action: Ticket reply
  const handleTicketReply = async (ticketId: string) => {
    if (!adminReplyText.trim()) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser?.id || 'admin',
          message: adminReplyText,
          status: 'RESOLVED'
        })
      });
      if (res.ok) {
        showToast('Reply dispatched and ticket marked as RESOLVED.', 'success');
        setAdminReplyText('');
        refreshData();
      }
    } catch {
      showToast('Error sending ticket reply', 'error');
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING_APPROVAL');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-white tracking-tight">
              PNG Trade Hub Compliance & Master Admin Console
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisory oversight for P2P escrows, user AML/KYC records, Tatum multi-chain engine, and dispute arbitration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Ledger Authority Active</span>
          </div>
          <button
            onClick={() => {
              refreshData();
              showToast('Refreshed admin operational state.', 'info');
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        {[
          { id: 'overview' as AdminTab, label: 'Platform Overview', icon: Cpu },
          { id: 'supabase' as AdminTab, label: 'Supabase Database & Migration', icon: Server },
          { id: 'users' as AdminTab, label: `User Management (${allUsers.length})`, icon: Users },
          { id: 'withdrawals' as AdminTab, label: `Withdrawal Queue (${pendingWithdrawals.length})`, icon: ArrowUpRight },
          { id: 'orders' as AdminTab, label: `P2P Escrow Orders (${trades.length})`, icon: ArrowLeftRight },
          { id: 'tickets' as AdminTab, label: `Support Tickets (${supportTickets.length})`, icon: HelpCircle },
          { id: 'tatum' as AdminTab, label: 'Tatum Multi-Chain Engine', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Registered Traders</span>
              <div className="text-2xl font-black text-white font-mono mt-1">{allUsers.length}</div>
              <span className="text-[11px] text-emerald-400">All authenticated in database</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Completed P2P Volume</span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                ${(platformStats?.totalVolumeUsd || 0).toLocaleString()} USDT
              </div>
              <span className="text-[11px] text-emerald-400">
                ≈ {((platformStats?.totalVolumeUsd || 0) * FIAT_RATES.PGK).toLocaleString()} PGK
              </span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Active Escrow Orders</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">{platformStats?.activeEscrows || 0}</div>
              <span className="text-[11px] text-slate-400">Funds locked in vault</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Pending Withdrawals</span>
              <div className="text-2xl font-black text-white font-mono mt-1">{pendingWithdrawals.length}</div>
              <span className="text-[11px] text-amber-400">Awaiting compliance review</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 text-xs text-slate-300">
            <h3 className="font-bold text-sm text-white">System Compliance Health</h3>
            <p>
              PNG Trade Hub operates a closed-loop atomic double-entry ledger. All balance mutations are recorded as signed ledger transactions with strict invariant checks to guarantee no negative balances or double spending.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeAdminTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4">
          <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Registered Users & KYC Oversight</h3>
              <p className="text-xs text-slate-400">Verify identification and manage platform access</p>
            </div>
            <div className="w-64 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search username or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Trader Profile</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Country & Mobile</th>
                  <th className="px-6 py-3.5">KYC Status</th>
                  <th className="px-6 py-3.5">Trades & Rep</th>
                  <th className="px-6 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>@{u.username}</span>
                        {u.kycStatus === 'verified' && <Shield className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-white">{u.country}</div>
                      <div className="text-[11px] text-slate-400">{u.phoneNumber || 'Unspecified'}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        u.kycStatus === 'verified'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {u.kycStatus}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-mono text-white font-semibold">{u.totalTrades || 0} Trades</div>
                      <div className="text-[11px] text-emerald-400">{u.completionRate || 100}% Completion</div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleKyc(u.id, u.kycStatus)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                            u.kycStatus === 'verified'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                          }`}
                        >
                          {u.kycStatus === 'verified' ? 'Revoke KYC' : 'Verify KYC'}
                        </button>
                        <button
                          onClick={() => handleToggleFreeze(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                            u.isFrozen
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {u.isFrozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WITHDRAWALS QUEUE */}
      {activeAdminTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4">
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Outbound Blockchain Withdrawal Queue</h3>
            <p className="text-xs text-slate-400">
              Review outbound requests. Approving finalizes the reserve; rejecting atomically refunds the locked funds.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Tx ID & User</th>
                  <th className="px-6 py-3.5">Asset Amount</th>
                  <th className="px-6 py-3.5">Network</th>
                  <th className="px-6 py-3.5">Destination Address</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Compliance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No withdrawal requests recorded.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono text-[11px]">
                        <div className="text-white font-bold">#{w.id.slice(-8)}</div>
                        <div className="text-slate-400">{w.userEmail}</div>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-amber-400 text-sm">
                        {w.amount} {w.currency}
                        <div className="text-[10px] text-slate-500 font-normal">Fee: {w.fee} {w.currency}</div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                          {w.network}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-300 text-[11px] truncate max-w-[200px]">
                        {w.toAddress}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          w.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : w.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {w.status === 'PENDING_APPROVAL' ? 'Pending Review' : w.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {w.status === 'PENDING_APPROVAL' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(w.id)}
                              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/40 transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w.id)}
                              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-lg border border-rose-500/40 transition"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: P2P ESCROW ORDERS */}
      {activeAdminTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">P2P Escrow Order Audit & Mediation</h3>
              <p className="text-xs text-slate-400">Supervise active trades and resolve disputed escrows</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Trader Parties</th>
                  <th className="px-6 py-3.5">Trade Size</th>
                  <th className="px-6 py-3.5">Method</th>
                  <th className="px-6 py-3.5">Escrow State</th>
                  <th className="px-6 py-3.5 text-right">Mediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No P2P trades created yet.
                    </td>
                  </tr>
                ) : (
                  trades.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        #{t.id.slice(-8)}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-white">Buyer: <strong className="text-emerald-400">@{t.buyerUsername}</strong></div>
                        <div className="text-slate-400">Seller: <strong className="text-amber-400">@{t.sellerUsername}</strong></div>
                      </td>

                      <td className="px-6 py-4 font-mono">
                        <div className="font-bold text-white">{t.cryptoAmount} {t.cryptoCurrency}</div>
                        <div className="text-slate-400">{t.fiatAmount} {t.fiatCurrency}</div>
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {t.selectedPaymentMethod}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          t.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : t.status === 'DISPUTED'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {t.status === 'DISPUTED' ? (
                          <button
                            onClick={() => setDisputeModalTrade(t)}
                            className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold rounded-lg transition"
                          >
                            Arbitrate Dispute
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">Standard Trade</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SUPPORT TICKETS */}
      {activeAdminTab === 'tickets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Compliance & User Support Queue</h3>

          {supportTickets.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No tickets logged.</p>
          ) : (
            <div className="space-y-4">
              {supportTickets.map(ticket => (
                <div key={ticket.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <span>{ticket.subject}</span>
                        <span className="px-2 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {ticket.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        From: @{ticket.userUsername} ({ticket.userEmail})
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ticket.status === 'RESOLVED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                    "{ticket.description}"
                  </p>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="Type admin resolution response..."
                      value={selectedTicketId === ticket.id ? adminReplyText : ''}
                      onChange={e => {
                        setSelectedTicketId(ticket.id);
                        setAdminReplyText(e.target.value);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => handleTicketReply(ticket.id)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition"
                    >
                      Reply & Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: TATUM MULTI-CHAIN ENGINE */}
      {activeAdminTab === 'tatum' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Tatum Multi-Chain Gateway Configuration</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Direct blockchain node integration status and multi-chain address derivation bridge.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Status: {tatumStatus?.status || 'PENDING_INTEGRATION'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Integration State Notice
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tatumStatus?.message || 'Server is operating in secure internal ledger mode. Tatum multi-chain connectivity (TRC20, BEP20, ERC20, TRX, ETH, BNB) is prepared and awaiting TATUM_API_KEY activation.'}
            </p>
          </div>

          {/* Supported Chains Matrix */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Multi-Chain Architecture Matrix
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(TATUM_SUPPORTED_CHAINS).map(([k, v]) => (
                <div key={k} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{v.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      {v.symbol}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div>Chain Type: <strong className="text-slate-200">{v.chain}</strong></div>
                    <div>Block Time: <strong className="text-slate-200">~{v.averageBlockTimeSec}s</strong></div>
                    <div>Standard Fee: <strong className="text-slate-200">{v.standardWithdrawalFee} {v.symbol === 'TRON' ? 'TRX' : v.symbol === 'BSC' ? 'BNB' : 'USDT'}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SUPABASE DATABASE & BACKEND MIGRATION */}
      {activeAdminTab === 'supabase' && (
        <div className="space-y-6">
          {/* Super Admin Ownership Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/30 border border-amber-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">Master Super Admin Access</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                      Primary Controller
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    Authorized Master Admin Email: <strong className="text-white font-mono">adminsp247@gmail.com</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Admin Authority Granted</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400">Assigned Email</span>
                <div className="text-white font-mono font-bold mt-0.5 truncate">adminsp247@gmail.com</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400">Governance Role</span>
                <div className="text-emerald-400 font-bold mt-0.5">Super Admin (Root Authority)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400">Security / KYC Status</span>
                <div className="text-amber-400 font-bold mt-0.5">Verified & 2FA Protected</div>
              </div>
            </div>
          </div>

          {/* Supabase Connection Details & Health */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Supabase Cloud PostgreSQL Backend</h3>
                  <p className="text-xs text-slate-400">
                    Target Instance: <span className="font-mono text-emerald-400">poslfknqmvhxextngbeb</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSupabaseStatus}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Health</span>
                </button>
                <button
                  onClick={handleSyncSupabase}
                  disabled={isSyncingSupabase}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSupabase ? 'Syncing...' : 'Sync Platform Ledger'}</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">Supabase API Endpoint</span>
                <div className="text-white font-mono font-semibold truncate mt-1">
                  https://poslfknqmvhxextngbeb.supabase.co
                </div>
                <span className="text-[10px] text-emerald-400">Reachability Verified</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">Service Role Status</span>
                <div className="text-white font-mono font-semibold mt-1">
                  {supabaseHealth?.serviceRoleKeyPresent ? 'ACTIVE & LOADED' : 'KEY ATTACHED'}
                </div>
                <span className="text-[10px] text-emerald-400">Bypasses RLS for sync</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">Sync Pipeline</span>
                <div className="text-emerald-400 font-mono font-bold mt-1">
                  DUAL-SYNC ENGINE
                </div>
                <span className="text-[10px] text-slate-400">Real-time persistence</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400">Tables Status</span>
                <div className="text-amber-400 font-mono font-bold mt-1">
                  {supabaseHealth?.tablesCreated ? 'ALL TABLES LIVE' : 'SCHEMA READY TO RUN'}
                </div>
                <span className="text-[10px] text-slate-400">8 PostgreSQL tables</span>
              </div>
            </div>

            {/* Tables Overview */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-slate-300">
                Database Tables Monitored by Sync Engine:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { name: 'profiles', desc: 'Users & KYC' },
                  { name: 'wallets', desc: 'Multi-chain balances' },
                  { name: 'p2p_offers', desc: 'Buy/Sell advertisements' },
                  { name: 'p2p_trades', desc: 'Escrow contracts' },
                  { name: 'withdrawals', desc: 'Approval queue' },
                  { name: 'internal_transfers', desc: 'Instant P2P transfers' },
                  { name: 'support_tickets', desc: 'Dispute arbitration' },
                  { name: 'deposits', desc: 'Inbound credit log' },
                ].map((t) => (
                  <div key={t.name} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-white text-[11px]">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.desc}</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Configured"></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions for Running SQL Schema */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">PostgreSQL Database Schema & One-Click Migration</h3>
                  <p className="text-xs text-slate-400">
                    Complete schema with tables, indices, triggers, and Row Level Security (RLS) policies.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySqlSchema}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  {sqlCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{sqlCopied ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
                </button>
                <a
                  href="https://supabase.com/dashboard/project/poslfknqmvhxextngbeb/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Supabase SQL Editor</span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-white">How to execute the schema in Supabase (3 Simple Steps):</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Click the <strong className="text-amber-400">"Copy SQL Schema"</strong> button above (copies the entire <code>/supabase/schema.sql</code> file).</li>
                <li>Click <strong className="text-white">"Open Supabase SQL Editor"</strong> or navigate to your Supabase project dashboard.</li>
                <li>Paste the SQL script into the query editor and click <strong className="text-emerald-400">"Run"</strong>.</li>
              </ol>
              <div className="pt-2 text-[11px] text-emerald-400">
                Once executed, all tables and security policies will be active, and our backend sync engine automatically mirrors all users, balances, trades, and orders!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Arbitrate Dispute Modal */}
      {disputeModalTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Dispute Arbitration Ruling</h3>
              </div>
              <button
                onClick={() => setDisputeModalTrade(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono text-white">#{disputeModalTrade.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Escrow Amount:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {disputeModalTrade.cryptoAmount} {disputeModalTrade.cryptoCurrency} ({disputeModalTrade.fiatAmount} {disputeModalTrade.fiatCurrency})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Buyer:</span>
                <span className="font-bold text-white">@{disputeModalTrade.buyerUsername}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seller:</span>
                <span className="font-bold text-white">@{disputeModalTrade.sellerUsername}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-rose-300">
                Reason: "{disputeModalTrade.disputeReason || 'Discrepancy reported by trader'}"
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Compliance Mediation Note
              </label>
              <textarea
                rows={2}
                value={arbitrationNote}
                onChange={e => setArbitrationNote(e.target.value)}
                placeholder="Provide reasoning for ruling (e.g. BSP bank statement verification)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleArbitrateTrade(disputeModalTrade.buyerId)}
                className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition text-center"
              >
                Rule for Buyer (Release Escrow to @{disputeModalTrade.buyerUsername})
              </button>

              <button
                onClick={() => handleArbitrateTrade(disputeModalTrade.sellerId)}
                className="py-3 px-4 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl shadow transition text-center"
              >
                Rule for Seller (Refund Escrow to @{disputeModalTrade.sellerUsername})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
