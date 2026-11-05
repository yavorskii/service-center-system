import React, { useState, useEffect } from 'react';
import { X, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import type { AuthUser, CaptchaData } from '../types';
import { TurnstileWidget } from './TurnstileWidget';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  onRequireTwoFactor: (username: string, tempToken: string, method?: string) => void;
  onOpenForgotPassword: () => void;
  onOpenRegister: () => void;
  onOpenSupport: (emailHint?: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onRequireTwoFactor,
  onOpenForgotPassword,
  onOpenRegister,
  onOpenSupport
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCaptcha = async () => {
    try {
      const data = await api.getCaptcha();
      setCaptchaData(data);
      setCaptchaAnswer('');
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setGoogleLoading(false);
      setTurnstileToken(null);
      loadCaptcha();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Введіть логін або email та пароль');
      return;
    }
    if (!turnstileToken && (!captchaData || !captchaAnswer.trim())) {
      setError('Будь ласка, підтвердіть перевірку Cloudflare Turnstile');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await api.login(username.trim(), password, {
        captchaToken: turnstileToken || captchaData?.token || '',
        captchaAnswer: turnstileToken ? 'turnstile' : captchaAnswer.trim()
      });
      if (user.twoFactorRequired) {
        onClose();
        onRequireTwoFactor(user.username, user.tempToken || '', user.twoFactorMethod);
        return;
      }
      setUsername('');
      setPassword('');
      setCaptchaAnswer('');
      setTurnstileToken(null);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Помилка автентифікації');
      setTurnstileToken(null);
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      localStorage.removeItem('repairhub_google_mode');
      const url = await api.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Не вдалося відкрити сторінку входу Google');
      setGoogleLoading(false);
    }
  };

  const isLockedError = Boolean(error && (error.includes('заблоковано') || error.includes('обмежено')));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Вхід до облікового запису</h3>
              <p className="text-[11px] text-slate-400">Захищена автентифікація сервісного центру RepairHub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-3.5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
              {isLockedError && (
                <button
                  type="button"
                  onClick={() => {
                    const hint = username.includes('@') ? username.trim() : '';
                    onClose();
                    onOpenSupport(hint);
                  }}
                  className="w-full mt-1 py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Повідомити у службу безпеки / Розблокувати</span>
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            disabled={googleLoading || loading}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>{googleLoading ? 'Перехід до Google...' : 'Увійти через Google'}</span>
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#111827] px-2.5 text-slate-500 text-[11px]">або за логіном / поштою</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Логін або Email
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
              placeholder="Введіть ваш логін або email"
              className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Введіть пароль"
                className="w-full pl-3.5 pr-10 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <TurnstileWidget
            onVerify={(token) => {
              setTurnstileToken(token);
              setError(null);
            }}
            onExpire={() => setTurnstileToken(null)}
          />

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Перевірка даних...' : 'Увійти'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
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
            <button
              type="button"
              onClick={() => {
                const hint = username.includes('@') ? username.trim() : '';
                onClose();
                onOpenSupport(hint);
              }}
              className="text-slate-400 hover:text-slate-200 transition"
            >
              Служба підтримки
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
