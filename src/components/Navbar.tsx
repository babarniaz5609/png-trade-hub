import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Wallet, 
  LayoutDashboard, 
  Send, 
  ShieldCheck, 
  Clock, 
  Headphones, 
  ShieldAlert, 
  ChevronDown, 
  User as UserIcon,
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  LogOut,
  Menu,
  X,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { NexKinaLogo } from './NexKinaLogo';

interface NavbarProps {
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const { activeTab, setActiveTab, wallet, setActiveTradeId } = useApp();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Total available USDT
  const totalUsdt = wallet 
    ? (Number(wallet.balances.usdtTrc20 || 0) + Number(wallet.balances.usdtErc20 || 0) + Number(wallet.balances.usdtBep20 || 0)).toFixed(2)
    : '0.00';

  const navItems = [
    { id: 'marketplace', label: 'P2P Trading', icon: ArrowLeftRight, badge: 'Escrow' },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'transfers', label: 'Transfers', icon: Send, badge: '0% Fee' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Ledger', icon: Clock },
    { id: 'support', label: 'Support', icon: Headphones },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Top Ticker Bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              NexKina
            </span>
            <span className="hidden sm:inline text-slate-400">
              TRADE | PAY | GROW - Papua New Guinea to the World
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800 text-slate-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>P2P Index:</span>
              <span className="font-semibold text-emerald-400">1 USDT ≈ 4.15 PGK</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">1.00 USD</span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 hidden md:inline">Logged in as:</span>
                <span className="font-semibold text-white">@{currentUser.username}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                  currentUser.kycStatus === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {currentUser.kycStatus}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-bold bg-amber-500 text-slate-950">
                    Admin
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setActiveTradeId(null);
                setActiveTab('home');
              }}
              className="flex items-center gap-3 group text-left"
            >
              <NexKinaLogo size="md" />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTradeId(null);
                      setActiveTab(item.id);
                    }}
                    className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-inner'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveTradeId(null);
                    setActiveTab('admin');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'admin'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Console</span>
                </button>
              )}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                {/* Wallet Balance Pill */}
                <button
                  onClick={() => {
                    setActiveTradeId(null);
                    setActiveTab('wallet');
                  }}
                  className="flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-xl transition text-left group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Available USDT</div>
                    <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition flex items-center gap-1">
                      <span>{totalUsdt}</span>
                      <span className="text-[10px] font-normal text-slate-400">USDT</span>
                    </div>
                  </div>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 transition"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center">
                      {currentUser.username[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in">
                      <div className="px-4 py-2 border-b border-slate-800">
                        <div className="text-xs font-bold text-white truncate">{currentUser.username}</div>
                        <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${
                            currentUser.kycStatus === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            KYC {currentUser.kycStatus}
                          </span>
                        </div>
                      </div>

                      <div className="py-1 text-xs">
                        <button
                          onClick={() => {
                            setActiveTradeId(null);
                            setActiveTab('dashboard');
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" />
                          <span>Trader Dashboard</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTradeId(null);
                            setActiveTab('wallet');
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Wallet className="w-4 h-4 text-slate-400" />
                          <span>Wallet & Balances</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTradeId(null);
                            setActiveTab('history');
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>Ledger History</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setActiveTradeId(null);
                              setActiveTab('admin');
                              setUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 flex items-center gap-2 font-medium"
                          >
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            <span>Compliance Admin Console</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAuth}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTradeId(null);
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950/20 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => {
                setActiveTradeId(null);
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin Console</span>
            </button>
          )}

          {!currentUser && (
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 rounded-xl bg-emerald-500 text-xs font-bold text-slate-950"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
