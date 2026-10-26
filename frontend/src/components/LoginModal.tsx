import React, { useState } from 'react';
import { X, Lock, ShieldCheck, UserCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import type { AuthUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  onRequireTwoFactor: (username: string, tempToken: string) => void;
  onOpenForgotPassword: () => void;
  onOpenRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onRequireTwoFactor,
  onOpenForgotPassword,
  onOpenRegister
}) => {
  const [username, setUsername] = useState('admin_oleg');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Введіть логін та пароль");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await api.login(username.trim(), password.trim());
      if (user.twoFactorRequired && user.tempToken) {
        onClose();
        onRequireTwoFactor(user.username, user.tempToken);
        return;
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Помилка автентифікації");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'GOOGLE' | 'GITHUB') => {
    setOauthLoading(provider);
    setError(null);
    try {
      const email = provider === 'GOOGLE' ? 'vlad.google@gmail.com' : 'vlad.github@users.noreply.com';
      const name = provider === 'GOOGLE' ? 'Vladyslav (Google ID)' : 'Vladyslav (GitHub)';
      const user = await api.loginOAuth(provider, email, name);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || `Помилка входу через ${provider}`);
    } finally {
      setOauthLoading(null);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Вхід до системи RepairHub</h3>
              <p className="text-[11px] text-slate-400">Безпечний доступ до CRM та клієнтського кабінету</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Логін або Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              placeholder="admin_oleg"
              className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Пароль
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenForgotPassword();
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
              >
                Забули пароль?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Швидкий вибір для захисту:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin_oleg', 'admin123')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'admin_oleg' && password === 'admin123'
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 mb-1" />
                <div className="text-[11px] font-semibold">Адмін</div>
                <div className="text-[9px] text-slate-500 font-mono">admin_oleg</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('mgr_alina', 'manager123')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'mgr_alina' && password === 'manager123'
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-400 mb-1" />
                <div className="text-[11px] font-semibold">Менеджер</div>
                <div className="text-[9px] text-slate-500 font-mono">mgr_alina</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('user_vlad', 'Vlad@2026!')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'user_vlad' && password === 'Vlad@2026!'
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400 mb-1" />
                <div className="text-[11px] font-semibold">Користувач</div>
                <div className="text-[9px] text-slate-500 font-mono">user_vlad</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Перевірка облікових даних...' : 'Увійти в акаунт'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#111827] px-2 text-slate-500 text-[11px]">або через стороннього провайдера</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!!oauthLoading}
              onClick={() => handleOAuthLogin('GOOGLE')}
              className="py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
              <span>{oauthLoading === 'GOOGLE' ? '...' : 'Google ID'}</span>
            </button>
            <button
              type="button"
              disabled={!!oauthLoading}
              onClick={() => handleOAuthLogin('GITHUB')}
              className="py-2 px-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              <span>{oauthLoading === 'GITHUB' ? '...' : 'GitHub'}</span>
            </button>
          </div>

          <div className="pt-2 text-center text-xs text-slate-400">
            <span>Немає облікового запису? </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
            >
              Створити акаунт
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
