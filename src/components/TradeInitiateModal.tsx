import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Clock, ArrowRight, AlertCircle, Building2, Check } from 'lucide-react';
import { P2POffer } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface TradeInitiateModalProps {
  offer: P2POffer | null;
  onClose: () => void;
}

export const TradeInitiateModal: React.FC<TradeInitiateModalProps> = ({ offer, onClose }) => {
  const { initiateTrade, isLoading } = useApp();
  const { currentUser } = useAuth();

  const [fiatAmount, setFiatAmount] = useState<number>(500);
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (offer) {
      // Default to minimum limit
      const initialFiat = Math.max(offer.minLimit, Math.min(500, offer.maxLimit));
      setFiatAmount(initialFiat);
      setCryptoAmount(Number((initialFiat / offer.pricePerUnit).toFixed(2)));
      setSelectedPaymentMethod(offer.paymentMethods[0] || 'Bank of South Pacific (BSP)');
      setErrorMsg(null);
    }
  }, [offer]);

  if (!offer) return null;

  // Is current user the maker?
  const isOwnOffer = currentUser.id === offer.userId;

  // Is taker buying or selling?
  // If offer.type is 'SELL', maker is selling -> taker BUYS crypto
  const isTakerBuying = offer.type === 'SELL';

  const handleFiatChange = (val: number) => {
    setFiatAmount(val);
    const calculatedCrypto = val > 0 ? Number((val / offer.pricePerUnit).toFixed(2)) : 0;
    setCryptoAmount(calculatedCrypto);

    if (val < offer.minLimit) {
      setErrorMsg(`Minimum trade limit is ${offer.minLimit} ${offer.fiatCurrency}`);
    } else if (val > offer.maxLimit) {
      setErrorMsg(`Maximum trade limit is ${offer.maxLimit} ${offer.fiatCurrency}`);
    } else {
      setErrorMsg(null);
    }
  };

  const handleCryptoChange = (val: number) => {
    setCryptoAmount(val);
    const calculatedFiat = Number((val * offer.pricePerUnit).toFixed(2));
    setFiatAmount(calculatedFiat);

    if (calculatedFiat < offer.minLimit) {
      setErrorMsg(`Minimum trade limit is ${offer.minLimit} ${offer.fiatCurrency}`);
    } else if (calculatedFiat > offer.maxLimit) {
      setErrorMsg(`Maximum trade limit is ${offer.maxLimit} ${offer.fiatCurrency}`);
    } else {
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (errorMsg || fiatAmount <= 0 || cryptoAmount <= 0) return;

    const tradeId = await initiateTrade({
      offerId: offer.id,
      cryptoAmount,
      fiatAmount,
      paymentMethod: selectedPaymentMethod
    });

    if (tradeId) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              isTakerBuying ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isTakerBuying ? 'BUY USDT' : 'SELL USDT'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {offer.userUsername}
                {offer.isMerchantVerified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                {offer.userTradesCount} trades · {offer.userCompletionRate}% completion
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Metrics */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-950/30 border-b border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Unit Price</span>
            <span className="text-white font-bold font-mono text-sm">
              {offer.pricePerUnit.toFixed(2)} {offer.fiatCurrency}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Payment Window</span>
            <span className="text-white font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              {offer.paymentWindowMinutes} Mins
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Available</span>
            <span className="text-white font-medium font-mono">
              {offer.availableAmount} {offer.cryptoCurrency}
            </span>
          </div>
        </div>

        {/* Trade Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isOwnOffer && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>This is your own listing. You cannot trade against yourself. Switch to another user account to trade.</span>
            </div>
          )}

          {/* Calculator Inputs */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>{isTakerBuying ? 'I will pay' : 'I will sell'}</span>
                <span className="text-slate-500 font-normal">
                  Limit: {offer.minLimit} - {offer.maxLimit} {offer.fiatCurrency}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={offer.minLimit}
                  max={offer.maxLimit}
                  step="any"
                  value={fiatAmount}
                  onChange={e => handleFiatChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold font-mono text-sm focus:outline-none focus:border-emerald-500 transition pr-16"
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                  {offer.fiatCurrency}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                <span>{isTakerBuying ? 'I will receive' : 'Buyer pays me'}</span>
                <span className="text-emerald-400 font-normal text-[11px]">0% Trading Fee</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={cryptoAmount}
                  onChange={e => handleCryptoChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold font-mono text-sm focus:outline-none focus:border-emerald-500 transition pr-16"
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-emerald-400">
                  {offer.cryptoCurrency}
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}

          {/* Payment Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {offer.paymentMethods.map(pm => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setSelectedPaymentMethod(pm)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                    selectedPaymentMethod === pm
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{pm}</span>
                  </div>
                  {selectedPaymentMethod === pm && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Terms */}
          {offer.terms && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">Merchant Terms & Conditions:</span>
              <p className="line-clamp-3 leading-relaxed">{offer.terms}</p>
            </div>
          )}

          {/* Escrow Guarantee Pill */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Escrow Protection: {cryptoAmount} {offer.cryptoCurrency} will be locked upon placing order.</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isOwnOffer || Boolean(errorMsg) || isLoading}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Locking Escrow...' : `Open Escrow Trade (${cryptoAmount} USDT)`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
