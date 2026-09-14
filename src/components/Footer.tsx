import React from 'react';
import { ShieldCheck, ArrowLeftRight, Server, Cpu, Database, ExternalLink, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { NexKinaLogo } from './NexKinaLogo';

export const Footer: React.FC = () => {
  const { setActiveTab } = useApp();
  const { isAdmin } = useAuth();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <NexKinaLogo size="sm" showTagline={false} />
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              NexKina is Papua New Guinea's premier peer-to-peer cryptocurrency escrow trading platform. TRADE | PAY | GROW safely from Papua New Guinea to the World.
            </p>
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

          {/* Multi-Chain Networks */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] mb-3">Multi-Chain USDT Networks</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>USDT TRC-20 (Tron Network)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>USDT BEP-20 (Binance Smart Chain)</span>
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
                Optimized for fast and secure peer-to-peer settlement.
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
                <Database className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Secure Bank-grade Encryption & Verified KYC Standards.</span>
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
          <p>© {new Date().getFullYear()} NexKina. Built for secure and reliable P2P trading.</p>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button onClick={() => setActiveTab('admin')} className="text-slate-400 hover:text-white">
                Admin Gateway
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
