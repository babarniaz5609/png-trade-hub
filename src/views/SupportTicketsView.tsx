import React, { useState } from 'react';
import { 
  HelpCircle, 
  PlusCircle, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SupportTicket } from '../types';

export const SupportTicketsView: React.FC = () => {
  const { supportTickets, createTicket, respondToTicket, showToast } = useApp();
  const { currentUser } = useAuth();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'P2P_DISPUTE' | 'DEPOSIT_ISSUE' | 'WITHDRAWAL_ISSUE' | 'KYC' | 'GENERAL'>('P2P_DISPUTE');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [description, setDescription] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  const myTickets = currentUser.role === 'admin' 
    ? supportTickets 
    : supportTickets.filter(t => t.userId === currentUser.id);

  const selectedTicket = supportTickets.find(t => t.id === selectedTicketId) || (myTickets[0] || null);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast('Please fill out all ticket fields.', 'error');
      return;
    }

    const ok = await createTicket({
      subject,
      category,
      priority,
      description
    });

    if (ok) {
      setIsCreating(false);
      setSubject('');
      setDescription('');
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    respondToTicket(selectedTicket.id, replyMessage.trim());
    setReplyMessage('');
    showToast('Reply logged on ticket.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-emerald-400" />
            <span>Support & Dispute Mediation Desk</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official Papua New Guinea escrow arbitration and 24/7 technical assistance.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Open New Ticket</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ticket List (Left) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Your Cases ({myTickets.length})
          </h3>

          {myTickets.length === 0 ? (
            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
              No support cases open.
            </div>
          ) : (
            <div className="space-y-2">
              {myTickets.map(t => {
                const isSelected = selectedTicket?.id === t.id;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTicketId(t.id);
                      setIsCreating(false);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left transition ${
                      isSelected
                        ? 'bg-slate-850 border-emerald-500/50 shadow-md'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono text-slate-400">#{t.id.slice(-6)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'URGENT' || t.priority === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {t.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-xs text-white line-clamp-1">{t.subject}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                    <div className="text-[10px] text-slate-500 mt-2">
                      Created: {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket Details or New Ticket Form (Right) */}
        <div className="lg:col-span-7">
          {isCreating ? (
            /* New Ticket Form */
            <form onSubmit={handleCreateTicket} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Create New Support Case</h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subject / Summary</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Buyer sent BSP transfer without reference code"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="P2P_DISPUTE">P2P Escrow Dispute</option>
                    <option value="DEPOSIT_ISSUE">Deposit Blockchain Issue</option>
                    <option value="WITHDRAWAL_ISSUE">Withdrawal Payout Issue</option>
                    <option value="KYC">Identity / KYC Verification</option>
                    <option value="GENERAL">General Question</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Urgency</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Locked Escrow)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Explanation & Bank Reference</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Please describe the issue in full, including trade ID, transaction amount, and bank transfer reference if applicable..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
              >
                Submit Support Ticket
              </button>
            </form>
          ) : selectedTicket ? (
            /* Selected Ticket View */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[11px] font-mono text-emerald-400">Case #{selectedTicket.id}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedTicket.subject}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted by <strong>{selectedTicket.userUsername}</strong> · Category: {selectedTicket.category}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedTicket.status === 'RESOLVED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {selectedTicket.status}
                  </span>
                </div>
              </div>

              {/* Original Description */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Case Statement:</span>
                <p className="text-slate-200 leading-relaxed">{selectedTicket.description}</p>
              </div>

              {/* Message Thread */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Case Activity & Official Mediation Log
                </h4>

                <div className="space-y-2.5">
                  {selectedTicket.messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl text-xs ${
                        m.senderRole === 'admin'
                          ? 'bg-amber-950/20 border border-amber-500/30 text-amber-200'
                          : 'bg-slate-800/80 border border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                        <span>{m.senderUsername} ({m.senderRole === 'admin' ? '🛡️ Compliance Arbitrator' : 'Trader'})</span>
                        <span className="text-slate-400 font-normal">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed">{m.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Post reply or statement to this case..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!replyMessage.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-xs text-slate-500">
              Select a ticket or click "Open New Ticket" to reach our Port Moresby support desk.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
