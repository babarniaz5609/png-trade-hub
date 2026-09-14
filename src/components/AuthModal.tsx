import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Globe, Shield, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, allUsers } = useAuth();
  const { showToast } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'login') {
      const ok = await login(email, password);
      if (ok) {
        showToast('Successfully authenticated into PNG Trade Hub.', 'success');
        onClose();
      } else {
        showToast('Authentication failed. Check credentials or register a new account.', 'error');
      }
    } else {
      if (!username || !email || !password) {
        showToast('Please provide username, email, and password.', 'error');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        setLoading(false);
        return;
      }
      const ok = await signup({
        email,
        username,
        password,
        role,
        phoneNumber,
        country: 'Papua New Guinea'
      });
      if (ok) {
        showToast('Account successfully registered in ledger.', 'success');
        onClose();
      } else {
        showToast('Failed to register account. Username or email may already be taken.', 'error');
      }
    }
    setLoading(false);
  };

  const handleFillCredentials = (credEmail: string) => {
    setEmail(credEmail);
    setPassword('password123');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
          <div>
            <h3 className="text-base font-bold text-white">
              {mode === 'login' ? 'Sign In to PNG Trade Hub' : 'Register New Trader Account'}
            </h3>
            <p className="text-xs text-slate-400">Production Ledger Escrow · Papua New Guinea</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Credential Fills */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Verified Accounts (Click to Fill)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFillCredentials('sarah@pngtradehub.com')}
              className="p-2 rounded-xl text-left border border-slate-800 bg-slate-850 hover:bg-slate-800 hover:border-emerald-500/40 text-slate-200 transition"
            >
              <div className="font-bold text-xs truncate">Sarah</div>
              <div className="text-[10px] text-emerald-400">Merchant (1000 USDT)</div>
            </button>
            <button
              type="button"
              onClick={() => handleFillCredentials('john@pngtradehub.com')}
              className="p-2 rounded-xl text-left border border-slate-800 bg-slate-850 hover:bg-slate-800 hover:border-emerald-500/40 text-slate-200 transition"
            >
              <div className="font-bold text-xs truncate">John</div>
              <div className="text-[10px] text-slate-400">Buyer (250 USDT)</div>
            </button>
            <button
              type="button"
              onClick={() => handleFillCredentials('adminsp247@gmail.com')}
              className="p-2 rounded-xl text-left border border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/30 text-amber-200 transition"
              title="Master Super Admin (adminsp247@gmail.com)"
            >
              <div className="font-bold text-xs truncate">Super Admin</div>
              <div className="text-[10px] text-amber-400 truncate">adminsp247@gmail.com</div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username / Trading Handle
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. MoresbyTrader"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PNG Mobile Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="+675 7XXX XXXX"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Processing...</span>
            ) : mode === 'login' ? (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Create Trader Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Register here
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-emerald-400 font-bold hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
