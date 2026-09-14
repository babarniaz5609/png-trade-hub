import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  Filter, 
  Check, 
  Building2, 
  CreditCard, 
  Smartphone, 
  ChevronRight, 
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { P2POffer, CryptoCurrency, FiatCurrency } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { PostOfferModal } from '../components/PostOfferModal';
import { TradeInitiateModal } from '../components/TradeInitiateModal';
import { PNG_PAYMENT_METHODS } from '../lib/tatum';

export const P2PMarketplaceView: React.FC = () => {
  const { offers, trades, setActiveTradeId, setActiveTab } = useApp();
  const { currentUser } = useAuth();

  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY'); // BUY = Taker wants to buy crypto from seller ads
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('USDT');
  const [selectedFiat, setSelectedFiat] = useState<FiatCurrency>('PGK');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [searchAmount, setSearchAmount] = useState<string>('');

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [activeInitiateOffer, setActiveInitiateOffer] = useState<P2POffer | null>(null);

  // Check for any active uncompleted trade
  const openTrade = trades.find(t => t.status === 'AWAITING_PAYMENT' || t.status === 'PAID' || t.status === 'DISPUTED');

  // Filter offers
  // If user wants to BUY crypto, they look for offers where maker is SELLING (offer.type === 'SELL')
  // If user wants to SELL crypto, they look for offers where maker is BUYING (offer.type === 'BUY')
  const matchingType = tradeType === 'BUY' ? 'SELL' : 'BUY';

  const filteredOffers = offers.filter(offer => {
    if (offer.status !== 'ACTIVE') return false;
    if (offer.type !== matchingType) return false;
    if (offer.cryptoCurrency !== selectedCrypto) return false;
    if (offer.fiatCurrency !== selectedFiat) return false;

    if (selectedPaymentMethod !== 'ALL') {
      const hasMethod = offer.paymentMethods.some(pm => 
        pm.toLowerCase().includes(selectedPaymentMethod.toLowerCase())
      );
      if (!hasMethod) return false;
    }

    if (searchAmount && !isNaN(Number(searchAmount))) {
      const amt = Number(searchAmount);
      if (amt < offer.minLimit || amt > offer.maxLimit) return false;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Active Trade Banner if user has an open trade */}
      {openTrade && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Active Escrow Order #{openTrade.id.slice(-6)}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {openTrade.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {openTrade.cryptoAmount} {openTrade.cryptoCurrency} for {openTrade.fiatAmount} {openTrade.fiatCurrency} · With {openTrade.buyerId === currentUser.id ? openTrade.sellerUsername : openTrade.buyerUsername}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTradeId(openTrade.id)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
          >
            <span>Enter Trade Room</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>P2P Trading Marketplace</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                0% Maker & Taker Fees
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Direct peer-to-peer crypto trades backed by automated escrow protection.
            </p>
          </div>

          {currentUser?.kycStatus === 'verified' ? (
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-2 self-start md:self-auto shadow-md"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Post Trade Ad (Dealer)</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-2 self-start md:self-auto shadow-md transition group animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-slate-950"></span>
              <span>Complete KYC to Post Ads</span>
            </button>
          )}
        </div>

        {/* Buy / Sell & Crypto Currency Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          {/* Buy/Sell Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTradeType('BUY')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                tradeType === 'BUY'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Buy Crypto
            </button>
            <button
              onClick={() => setTradeType('SELL')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                tradeType === 'SELL'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sell Crypto
            </button>
          </div>

          {/* Crypto Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['USDT', 'TRX', 'ETH', 'BNB'] as CryptoCurrency[]).map(crypto => (
              <button
                key={crypto}
                onClick={() => setSelectedCrypto(crypto)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedCrypto === crypto
                    ? 'bg-slate-800 text-white shadow-inner'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {crypto}
              </button>
            ))}
          </div>

          {/* Fiat Currency Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Fiat:</span>
            <select
              value={selectedFiat}
              onChange={e => setSelectedFiat(e.target.value as FiatCurrency)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500"
            >
              <option value="PGK">PGK (PNG Kina)</option>
              <option value="USD">USD ($)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Payment method & Amount search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Payment Method Filter */}
          <div className="sm:col-span-6 md:col-span-5">
            <div className="relative">
              <select
                value={selectedPaymentMethod}
                onChange={e => setSelectedPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All PNG Banks (BSP & Kina)</option>
                <option value="Bank of South Pacific">Bank of South Pacific (BSP)</option>
                <option value="Kina Bank">Kina Bank</option>
              </select>
            </div>
          </div>

          {/* Amount Filter */}
          <div className="sm:col-span-6 md:col-span-5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="number"
                placeholder={`Enter amount in ${selectedFiat} to filter limits...`}
                value={searchAmount}
                onChange={e => setSearchAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Reset button */}
          <div className="sm:col-span-12 md:col-span-2 flex justify-end">
            {(selectedPaymentMethod !== 'ALL' || searchAmount) && (
              <button
                onClick={() => {
                  setSelectedPaymentMethod('ALL');
                  setSearchAmount('');
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Offers Table / Card List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 font-semibold uppercase tracking-wider">
          <span>{filteredOffers.length} {tradeType === 'BUY' ? 'Sellers' : 'Buyers'} Available</span>
          <span>100% Escrow Protected</span>
        </div>

        {filteredOffers.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">No Offers Matching Your Filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No active ads match your selected payment method or amount limits. Try resetting filters or post your own trading ad.
            </p>
            {currentUser?.kycStatus === 'verified' ? (
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow transition"
              >
                Post a New Ad (Dealer)
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow transition"
              >
                Complete KYC to Post Ads
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredOffers.map(offer => {
              const isOwn = currentUser.id === offer.userId;

              return (
                <div
                  key={offer.id}
                  className={`bg-slate-900 border rounded-2xl p-5 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isOwn ? 'border-amber-500/30 bg-slate-900/90' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Trader Info */}
                  <div className="flex items-start gap-3 min-w-[240px]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs text-white border border-slate-700 shrink-0">
                      {offer.userUsername.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>{offer.userUsername}</span>
                        {offer.isMerchantVerified && (
                          <span title="Verified Merchant">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          </span>
                        )}
                        {isOwn && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{offer.userTradesCount} orders</span>
                        <span>·</span>
                        <span className="text-emerald-400 font-medium">{offer.userCompletionRate}% completion</span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{offer.paymentWindowMinutes}m window</span>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="min-w-[160px]">
                    <span className="text-[11px] text-slate-400 uppercase font-semibold block">Price per Unit</span>
                    <div className="text-2xl font-black text-white font-mono">
                      {offer.pricePerUnit.toFixed(2)}{' '}
                      <span className="text-xs text-slate-400 font-normal">{offer.fiatCurrency}</span>
                    </div>
                  </div>

                  {/* Limits & Available Crypto */}
                  <div className="min-w-[200px] text-xs space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Available:</span>
                      <span className="font-bold text-white font-mono">
                        {offer.availableAmount} {offer.cryptoCurrency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">Limit:</span>
                      <span className="font-medium text-slate-300">
                        {offer.minLimit} - {offer.maxLimit} {offer.fiatCurrency}
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="min-w-[180px] flex flex-wrap gap-1.5 max-w-xs">
                    {offer.paymentMethods.map((pm, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-200 border border-slate-700/80 font-medium flex items-center gap-1"
                      >
                        <Building2 className="w-3 h-3 text-emerald-400" />
                        {pm}
                      </span>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="w-full md:w-auto">
                    <button
                      onClick={() => setActiveInitiateOffer(offer)}
                      className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg flex items-center justify-center gap-1.5 ${
                        tradeType === 'BUY'
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      }`}
                    >
                      <span>{tradeType === 'BUY' ? 'Buy USDT' : 'Sell USDT'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <PostOfferModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      <TradeInitiateModal
        offer={activeInitiateOffer}
        onClose={() => setActiveInitiateOffer(null)}
      />
    </div>
  );
};
