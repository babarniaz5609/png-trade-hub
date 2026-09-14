import React from 'react';
import { ShieldCheck, ArrowLeftRight, Server, Cpu, Database, ExternalLink, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white">PNG Trade Hub</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Papua New Guinea's premier peer-to-peer cryptocurrency escrow trading platform. Buy and sell USDT, TRX, ETH, and BNB with PNG Kina (PGK) safely.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Demo Mode Active · Zero Real Risk
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Trading & Escrow</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => setActiveTab('marketplace')} className="hover:text-emerald-400 transition">
                  P2P Marketplace (PGK)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('wallet')} className="hover:text-emerald-400 transition">
                  USDT Multi-Chain Wallet
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('deposit')} className="hover:text-emerald-400 transition">
                  Deposit USDT (TRC20, BEP20, ERC20)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('withdraw')} className="hover:text-emerald-400 transition">
                  Withdraw to External Wallet
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('transfers')} className="hover:text-emerald-400 transition">
                  Internal Free User Transfers
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture & Tatum Support */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Tatum & Blockchain Ready</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>USDT TRC-20 (TronScan Fast)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>USDT BEP-20 (BSC Smart Chain)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>USDT ERC-20 (Ethereum Network)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Native TRX, ETH, & BNB</span>
              </li>
              <li className="pt-1 text-[11px] text-slate-500">
                Backend architecture prepared with server-side signing & webhooks.
              </li>
            </ul>
          </div>

          {/* Compliance & Security */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Escrow Security & Compliance</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>100% Locked Escrow before any PGK bank transfer is requested.</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <Database className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <span>Supabase PostgreSQL Schema with Atomic Lock & RLS Policies.</span>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => setActiveTab('support')}
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 hover:underline"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Support & Dispute Center
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} PNG Trade Hub. Built for demonstration and sandbox evaluation.</p>
          <div className="flex items-center gap-4">
            <span className="text-amber-400/90 font-medium">
              Demo Environment: No real cryptocurrency or fiat is transferred.
            </span>
            <span>·</span>
            <button onClick={() => setActiveTab('admin')} className="text-slate-400 hover:text-white">
              Admin Gateway
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
