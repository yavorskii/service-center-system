import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, KeyRound, AlertCircle, Smartphone, Mail } from 'lucide-react';
import { api } from '../services/api';
import type { AuthUser } from '../types';

interface TwoFactorModalProps {
  isOpen: boolean;
  username: string;
  tempToken: string;
  method?: string;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  username,
  tempToken,
  method = 'TOTP',
  onClose,
  onSuccess
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCode('');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTotp = method.toUpperCase() === 'TOTP';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setErrorMessage('Код повинен містити рівно 6 цифр');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const user = await api.verify2FA(username, code.trim(), tempToken);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Невірний або прострочений код');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            {isTotp ? <Smartphone className="w-6 h-6 text-white" /> : <ShieldAlert className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Підтвердження 2FA</h2>
            <p className="text-xs text-slate-400">
              Акаунт: <span className="font-semibold text-slate-200 font-mono">{username}</span>
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-5 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
          {isTotp ? (
            <>
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Введіть поточний 6-значний код із застосунку <strong>Google Authenticator</strong>. Комбінація оновлюється кожні 30 секунд.
              </span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                На вашу електронну пошту надіслано одноразовий 6-значний код підтвердження (дійсний 5 хвилин).
              </span>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {isTotp ? '6-значний код з автентифікатора *' : '6-значний код із листа *'}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                autoFocus
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-lg text-center font-mono tracking-[0.35em] text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={code.length !== 6 || isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/25 transition duration-200"
          >
            {isSubmitting ? 'Перевірка коду...' : 'Підтвердити вхід'}
          </button>
        </form>
      </div>
    </div>
  );
};
