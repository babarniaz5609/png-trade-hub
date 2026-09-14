import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  ShieldCheck, 
  Lock, 
  Zap, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Building2, 
  CreditCard, 
  Smartphone, 
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Flame,
  FileCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FIAT_RATES } from '../lib/tatum';

export const HomeView: React.FC = () => {
  const { setActiveTab, offers, platformStats } = useApp();
  const { currentUser } = useAuth();

  const [calcCrypto, setCalcCrypto] = useState<number>(100);
  const [calcFiat, setCalcFiat] = useState<number>(415);
  const rate = 4.15; // 1 USDT = 4.15 PGK

  const handleCryptoCalc = (val: number) => {
    setCalcCrypto(val);
    setCalcFiat(Number((val * rate).toFixed(2)));
  };

  const handleFiatCalc = (val: number) => {
    setCalcFiat(val);
    setCalcCrypto(val > 0 ? Number((val / rate).toFixed(2)) : 0);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        {/* Background glow & accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Papua New Guinea's Premier P2P Crypto Exchange</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                Trade USDT & Crypto with{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  PNG Kina (PGK)
                </span>{' '}
                Safely.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
                Connect directly with verified local traders in Port Moresby, Lae, and nationwide. Buy or sell USDT across <strong className="text-emerald-400">TRC-20, BEP-20, and ERC-20</strong> networks with 100% Escrow Protection.
              </p>

              {/* Payment Methods Badges */}
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Supported PNG Payment Rails:</p>
                <div className="flex flex-wrap gap-2">
                  {['Bank of South Pacific (BSP)', 'Kina Bank', 'Digicel CellMoni', 'ANZ PNG', 'Instant Transfers'].map((p, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-slate-800/90 border border-slate-700 text-xs text-slate-200 font-medium flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/25 transition-all flex items-center gap-2 group"
                >
                  <span>Explore P2P Market</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setActiveTab('wallet')}
                  className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm transition flex items-center gap-2"
                >
                  <span>Manage Wallet</span>
                </button>
              </div>

              {/* Trust Metric Counters */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 max-w-xl">
                <div>
                  <div className="text-2xl font-black text-white font-mono">100%</div>
                  <div className="text-xs text-slate-400">Escrow Protected</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">0%</div>
                  <div className="text-xs text-slate-400">P2P Maker Fee</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-mono">&lt; 15m</div>
                  <div className="text-xs text-slate-400">Average Release Time</div>
                </div>
              </div>
            </div>

            {/* Right Quick Trade Calculator Card */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white">Instant P2P Converter</h3>
                    <p className="text-xs text-slate-400">Estimated market index</p>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                    1 USDT ≈ 4.15 PGK
                  </div>
                </div>

                <div className="space-y-4 pt-5">
                  {/* Crypto Input */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>I Want to Buy</span>
                      <span className="text-slate-400">Supported: TRC20, BEP20, ERC20</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={calcCrypto}
                        onChange={e => handleCryptoCalc(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold font-mono text-lg focus:outline-none focus:border-emerald-500 pr-20"
                      />
                      <div className="absolute right-3 top-3 px-2 py-1 rounded-md bg-slate-700 text-xs font-bold text-emerald-400">
                        USDT
                      </div>
                    </div>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="flex justify-center -my-1">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shadow-md">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Fiat Output */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                      <span>I Will Pay (Kina)</span>
                      <span className="text-emerald-400 text-xs font-medium">BSP or CellMoni</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={calcFiat}
                        onChange={e => handleFiatCalc(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold font-mono text-lg focus:outline-none focus:border-emerald-500 pr-20"
                      />
                      <div className="absolute right-3 top-3 px-2 py-1 rounded-md bg-slate-700 text-xs font-bold text-amber-300">
                        PGK
                      </div>
                    </div>
                  </div>

                  {/* Features checklist */}
                  <div className="pt-2 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Funds locked in automated smart escrow contract</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Zero network gas fee on internal peer transfers</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 mt-4"
                  >
                    <span>Find Seller at {calcFiat} PGK</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How P2P Escrow Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
            Safe & Transparent Trading
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-white">
            How Escrow Protection Protects Both Buyer & Seller
          </p>
          <p className="text-slate-400 text-sm mt-3">
            PNG Trade Hub acts as a neutral third-party vault holding crypto until payment is verified by the seller.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Order Placed & Escrow Locked',
              desc: 'When an order is created, the sellers USDT is immediately locked into the PNG Trade Hub secure vault.',
              icon: Lock,
              color: 'text-emerald-400'
            },
            {
              step: '02',
              title: 'Buyer Transfers PGK',
              desc: 'Buyer sends Kina via BSP Mobile, Kina Bank app, or Digicel CellMoni directly to seller bank account.',
              icon: CreditCard,
              color: 'text-blue-400'
            },
            {
              step: '03',
              title: 'Seller Verifies Payment',
              desc: 'Seller checks their bank balance or SMS alert to confirm Kina has arrived in their account.',
              icon: CheckCircle2,
              color: 'text-amber-400'
            },
            {
              step: '04',
              title: 'Instant Crypto Release',
              desc: 'Seller clicks Release and the USDT is credited instantly into the buyers wallet with 0% fee.',
              icon: Zap,
              color: 'text-emerald-400'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative hover:border-slate-700 transition"
              >
                <div className="text-3xl font-black text-slate-800 font-mono mb-4">
                  {item.step}
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-4">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Multi-Network & Blockchain Architecture Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                <Layers className="w-3.5 h-3.5" />
                Multi-Chain Blockchain Ready
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Tatum Multi-Chain Integration Architecture
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                The platform is architected to seamlessly interface with Tatum’s blockchain engine for automated address generation, incoming webhook monitoring, and multi-network withdrawals without exposing private keys.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {[
                  { name: 'USDT TRC-20', speed: '~3 sec', fee: '1.5 USDT', badge: 'Lowest Gas' },
                  { name: 'USDT BEP-20', speed: '~3 sec', fee: '0.8 USDT', badge: 'BSC Speed' },
                  { name: 'USDT ERC-20', speed: '~12 sec', fee: '5.0 USDT', badge: 'Ethereum' },
                  { name: 'TRON (TRX)', speed: 'Native', fee: '2.0 TRX', badge: 'TRC20 Gas' },
                  { name: 'BNB Smart Chain', speed: 'Native', fee: '0.001 BNB', badge: 'BEP20 Gas' },
                  { name: 'Ethereum (ETH)', speed: 'Native', fee: '0.003 ETH', badge: 'ERC20 Gas' },
                ].map((net, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 text-xs">
                    <div className="font-bold text-white">{net.name}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Est. Fee: {net.fee}</div>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-400">
                      {net.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">DATABASE SCHEMA</span>
                  <span className="text-emerald-400 font-bold">Supabase Postgres</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Atomic Escrow:</span>
                    <span className="text-emerald-300">PL/pgSQL Trigger</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Row Level Security:</span>
                    <span className="text-emerald-300">Enabled (10 Tables)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Backend API:</span>
                    <span className="text-emerald-300">Express + TypeScript</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Security:</span>
                    <span className="text-emerald-300">Zero Keys in Client</span>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('admin')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                  >
                    View Live SQL Schema & Tatum Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Marketplace Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Live Merchant Offers</h3>
            <p className="text-xs text-slate-400">Real-time P2P advertisements available right now</p>
          </div>
          <button
            onClick={() => setActiveTab('marketplace')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>View All ({offers.length}) Offers</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.slice(0, 3).map(offer => (
            <div
              key={offer.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                      {offer.userUsername.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1">
                        {offer.userUsername}
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {offer.userTradesCount} trades · {offer.userCompletionRate}%
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    offer.type === 'SELL' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {offer.type === 'SELL' ? 'SELL USDT' : 'BUY USDT'}
                  </span>
                </div>

                <div className="my-3">
                  <div className="text-xs text-slate-400">Unit Price</div>
                  <div className="text-xl font-black text-white font-mono">
                    {offer.pricePerUnit.toFixed(2)} <span className="text-xs text-slate-400 font-normal">{offer.fiatCurrency}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-slate-400 border-t border-slate-800 pt-2 mb-3">
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium text-slate-200">{offer.availableAmount} {offer.cryptoCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Limits:</span>
                    <span className="font-medium text-slate-200">{offer.minLimit} - {offer.maxLimit} {offer.fiatCurrency}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {offer.paymentMethods.map((pm, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {pm}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('marketplace')}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition text-center"
              >
                {offer.type === 'SELL' ? 'Buy USDT' : 'Sell USDT'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Safety & Compliance Guarantee */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <Shield className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white">Strict Compliance & Escrow Protection</h2>
            <p className="text-xs text-slate-400 mt-2">
              Every trade is protected by automated smart contracts and our 24/7 Port Moresby compliance desk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                PNG KYC & AML Compliance
              </div>
              <p className="text-slate-400 leading-relaxed">
                Merchants and high-volume traders must verify with PNG National ID, Passport, or IPA company documentation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Automated Payment Timers
              </div>
              <p className="text-slate-400 leading-relaxed">
                Strict 15 to 30-minute payment countdowns ensure orders do not leave escrow funds in limbo.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Live Dispute Arbitration
              </div>
              <p className="text-slate-400 leading-relaxed">
                If payment receipt is contested, official arbitrators verify bank statements and hold escrow until settled.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
