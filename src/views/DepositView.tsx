import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Layers, 
  ArrowRight,
  Send,
  ArrowLeftRight,
  Cpu,
  Lock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BlockchainNetwork, CryptoCurrency } from '../types';
import { TATUM_SUPPORTED_CHAINS } from '../lib/tatum';

export const DepositView: React.FC = () => {
  const { wallet, setActiveTab } = useApp();
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetwork>('TRC20');

  if (!wallet) return null;

  const currentChainInfo = (selectedCrypto === 'USDT' ? TATUM_SUPPORTED_CHAINS[`USDT-${selectedNetwork}`] : TATUM_SUPPORTED_CHAINS[selectedCrypto]) || {
    name: 'TRON TRC-20',
    symbol: 'TRC20',
    chain: 'TRON',
    standardWithdrawalFee: 1.5,
    averageBlockTimeSec: 3,
    contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ArrowDownLeft className="w-6 h-6 text-emerald-400" />
          <span>Deposit USDT & Multi-Chain Assets</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Fund your NexKina balance to trade P2P or hold securely in the internal ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Asset & Network Selector */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
            {/* Step 1: Select Crypto */}
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
                      setSelectedCrypto(coin);
                      if (coin === 'TRX') setSelectedNetwork('TRON');
                      else if (coin === 'ETH') setSelectedNetwork('ETHEREUM');
                      else if (coin === 'BNB') setSelectedNetwork('BSC');
                      else setSelectedNetwork('TRC20');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center ${
                      selectedCrypto === coin
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow'
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

            {/* Step 2: Select Network (if USDT) */}
            {selectedCrypto === 'USDT' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  2. Select Network
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'TRC20' as BlockchainNetwork, name: 'TRC-20', chain: 'TRON (Fastest & Lowest Gas)', speed: '~1 min' },
                    { id: 'BEP20' as BlockchainNetwork, name: 'BEP-20', chain: 'BNB Smart Chain', speed: '~1 min' },
                    { id: 'ERC20' as BlockchainNetwork, name: 'ERC-20', chain: 'Ethereum Mainnet', speed: '~3 mins' },
                  ].map(net => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setSelectedNetwork(net.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition flex flex-col justify-between ${
                        selectedNetwork === net.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      <div className="font-bold">{net.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{net.chain}</div>
                      <div className="text-[10px] text-emerald-400 mt-1 font-mono">{net.speed}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Blockchain Network Box */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                      Secure Blockchain Gateway
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      Multi-Chain Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    Direct on-chain address derivation for <span className="font-semibold text-white">{selectedCrypto} ({selectedNetwork})</span> is securely handled on the backend.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex justify-between">
                  <span>Network Protocol:</span>
                  <span className="font-mono text-white">{currentChainInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Block Time:</span>
                  <span className="font-mono text-white">~{currentChainInfo.averageBlockTimeSec} seconds</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Network Gas Fee:</span>
                  <span className="font-mono text-white">{currentChainInfo.standardWithdrawalFee} {selectedCrypto}</span>
                </div>
              </div>

              {/* Active Alternatives */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-300">
                  Ready to deposit or fund your account right now?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Buy USDT via P2P</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setActiveTab('transfers')}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>Internal Transfer</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Platform Ledger & Security Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Production Security Architecture</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                <p>
                  <strong className="text-slate-200">Ledger Authority:</strong> All balances are enforced by server-side double-entry ledger records with atomic updates to prevent double spending.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                <p>
                  <strong className="text-slate-200">Secure Network Confirmation:</strong> Deposits automatically detect on-chain confirmations and credit balances in real time across supported networks.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5"></span>
                <p>
                  <strong className="text-slate-200">Zero-Fee Internal Transfers:</strong> User-to-user transfers within NexKina settle instantly with 0% network gas fees.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Local PNG Banking Support</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Traders in Papua New Guinea can buy and sell USDT using Bank of South Pacific (BSP) and Kina Bank. Escrow locks ensure 100% protection during transfers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
