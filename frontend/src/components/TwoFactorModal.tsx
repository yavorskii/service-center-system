import React, { useState } from 'react';
import { X, ShieldAlert, KeyRound, AlertCircle, Inbox } from 'lucide-react';
import { api } from '../services/api';
import type { AuthUser } from '../types';

interface TwoFactorModalProps {
  isOpen: boolean;
  username: string;
  tempToken: string;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  onOpenInbox: () => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  username,
  tempToken,
  onClose,
  onSuccess,
  onOpenInbox
}) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

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

  const handleFetchLatestOtp = async () => {
    try {
      const emails = await api.getMockEmails();
      const otpEmail = emails.find(e => e.type === 'TWO_FACTOR_OTP' || e.subject.includes('Двофакторна автентифікація'));
      if (otpEmail) {
        const match = otpEmail.body.match(/\b\d{6}\b/);
        if (match) {
          setCode(match[0]);
          setErrorMessage('');
          return;
        }
      }
      setErrorMessage('Нових листів з кодом 2FA не знайдено в скриньці');
    } catch {
      setErrorMessage('Не вдалося перевірити скриньку');
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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Двофакторна автентифікація</h2>
            <p className="text-xs text-slate-400">Обліковий запис: <span className="font-semibold text-slate-200">{username}</span></p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          Для безпеки вашого акаунта увімкнено 2FA. Введіть одноразовий 6-значний код перевірки (OTP), надісланий на прив'язану електронну пошту.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              6-значний код підтвердження *
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-lg text-center font-mono tracking-widest text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleFetchLatestOtp}
              className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <Inbox className="w-3.5 h-3.5 text-amber-400" />
              <span>Отримати з пошти</span>
            </button>
            <button
              type="button"
              onClick={onOpenInbox}
              className="py-2 px-3 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition"
            >
              Переглянути скриньку
            </button>
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
