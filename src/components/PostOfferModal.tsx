import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { CryptoCurrency, FiatCurrency } from '../types';
import { useApp } from '../context/AppContext';
import { PNG_PAYMENT_METHODS } from '../lib/tatum';

interface PostOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PostOfferModal: React.FC<PostOfferModalProps> = ({ isOpen, onClose }) => {
  const { createOffer, wallet } = useApp();

  const [type, setType] = useState<'SELL' | 'BUY'>('SELL');
  const [cryptoCurrency, setCryptoCurrency] = useState<CryptoCurrency>('USDT');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('PGK');
  const [pricePerUnit, setPricePerUnit] = useState<number>(4.15);
  const [totalAmount, setTotalAmount] = useState<number>(500);
  const [minLimit, setMinLimit] = useState<number>(100);
  const [maxLimit, setMaxLimit] = useState<number>(2000);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([PNG_PAYMENT_METHODS[0].name]);
  const [paymentWindowMinutes, setPaymentWindowMinutes] = useState<number>(15);
  const [terms, setTerms] = useState<string>('Fast bank transfer in PNG. Please include reference code.');
  const [autoReply, setAutoReply] = useState<string>('Hello! Please transfer to my registered BSP account and mark paid.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const togglePaymentMethod = (name: string) => {
    if (paymentMethods.includes(name)) {
      if (paymentMethods.length > 1) {
        setPaymentMethods(paymentMethods.filter(p => p !== name));
      }
    } else {
      setPaymentMethods([...paymentMethods, name]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const ok = await createOffer({
      type,
      cryptoCurrency,
      fiatCurrency,
      pricePerUnit,
      totalAmount,
      availableAmount: totalAmount,
      minLimit,
      maxLimit,
      paymentMethods,
      paymentWindowMinutes,
      terms,
      autoReply
    });

    setIsSubmitting(false);
    if (ok) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Post P2P Trading Ad
            </h3>
            <p className="text-xs text-slate-400">List an offer for others to buy or sell crypto with Kina</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Ad Type */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">I Want To</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('SELL')}
                className={`py-3 px-4 rounded-xl border font-bold transition flex flex-col items-center ${
                  type === 'SELL'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <span>SELL CRYPTO</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">Takers pay you PGK / Fiat</span>
              </button>
              <button
                type="button"
                onClick={() => setType('BUY')}
                className={`py-3 px-4 rounded-xl border font-bold transition flex flex-col items-center ${
                  type === 'BUY'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                }`}
              >
                <span>BUY CRYPTO</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">You pay takers PGK / Fiat</span>
              </button>
            </div>
          </div>

          {/* Currency Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Cryptocurrency</label>
              <select
                value={cryptoCurrency}
                onChange={e => setCryptoCurrency(e.target.value as CryptoCurrency)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="TRX">TRX (Tron)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="BNB">BNB (Binance Coin)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Fiat Currency</label>
              <select
                value={fiatCurrency}
                onChange={e => setFiatCurrency(e.target.value as FiatCurrency)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="PGK">PGK (PNG Kina)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="AUD">AUD (Australian Dollar)</option>
              </select>
            </div>
          </div>

          {/* Pricing & Total Volume */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Fixed Price per 1 {cryptoCurrency}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={pricePerUnit}
                  onChange={e => setPricePerUnit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold font-mono focus:outline-none focus:border-emerald-500 pr-12"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">{fiatCurrency}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Total Trading Quantity
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={totalAmount}
                  onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold font-mono focus:outline-none focus:border-emerald-500 pr-14"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-emerald-400">{cryptoCurrency}</span>
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Min Order Limit</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={minLimit}
                  onChange={e => setMinLimit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500 pr-12"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">{fiatCurrency}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Max Order Limit</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  required
                  value={maxLimit}
                  onChange={e => setMaxLimit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500 pr-12"
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400">{fiatCurrency}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Accepted Payment Methods (PNG & Global)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {PNG_PAYMENT_METHODS.map(pm => {
                const selected = paymentMethods.includes(pm.name);
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => togglePaymentMethod(pm.name)}
                    className={`p-2 rounded-lg border text-left font-medium transition flex items-center justify-between ${
                      selected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                    }`}
                  >
                    <span className="truncate">{pm.name}</span>
                    {selected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Window */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Payment Time Window</label>
            <div className="flex gap-2">
              {[15, 20, 30, 45].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setPaymentWindowMinutes(mins)}
                  className={`flex-1 py-1.5 rounded-lg border font-medium transition ${
                    paymentWindowMinutes === mins
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {mins} Mins
                </button>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Trade Terms & Instructions</label>
            <textarea
              rows={2}
              value={terms}
              onChange={e => setTerms(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Please send payment from your personal bank account matching your KYC name."
            />
          </div>

          {/* Auto reply */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Auto-Reply Message (Sent on order creation)</label>
            <input
              type="text"
              value={autoReply}
              onChange={e => setAutoReply(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Account Number: 1001239841 (BSP). I will release crypto within 2 mins of receipt."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || paymentMethods.length === 0}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 mt-2"
          >
            <span>{isSubmitting ? 'Publishing Ad...' : 'Publish Trading Ad'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
