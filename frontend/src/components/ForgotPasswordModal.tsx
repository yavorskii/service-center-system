import React, { useState, useEffect } from 'react';
import { X, Key, Mail, AlertCircle, Check, Smartphone } from 'lucide-react';
import { api } from '../services/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  initialEmail = '',
  onClose,
  onSwitchToLogin
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [highlight2FA, setHighlight2FA] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || '');
      setTwoFactorCode('');
      setHighlight2FA(false);
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const msg = await api.forgotPassword(email.trim(), twoFactorCode.trim() || undefined);
      setSuccessMessage(msg);
    } catch (err: any) {
      const raw = String(err.message || 'Помилка надсилання запиту');
      if (raw.startsWith('2FA_REQUIRED:')) {
        setHighlight2FA(true);
        setErrorMessage(raw.replace('2FA_REQUIRED:', ''));
      } else {
        setErrorMessage(raw);
      }
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
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Відновлення пароля</h2>
            <p className="text-xs text-slate-400">Генерація одноразового токена на пошту (діє 30 хв)</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Перевірте вашу пошту!</p>
                <p className="text-xs text-emerald-400/90">{successMessage}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Перейдіть за одноразовим посиланням у листі (термін дії — 30 хвилин), щоб встановити новий пароль та завершити попередні сеанси.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition"
              >
                Повернутися до входу
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Вкажіть електронну пошту або логін акаунта. Якщо на профілі увімкнено 2FA-автентифікатор, підтвердіть запит актуальним 6-значним кодом.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email або логін акаунта *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com або логін"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className={`p-3 rounded-xl border transition ${
              highlight2FA ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <label className="block text-xs font-medium text-slate-200 mb-1 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Код з автентифікатора (якщо увімкнено 2FA)</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-значний код TOTP (необов'язково без 2FA)"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-mono tracking-widest text-center text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition duration-200 text-xs sm:text-sm"
            >
              {isSubmitting ? 'Надсилання листа...' : 'Надіслати посилання для скидання'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
              >
                Повернутися до входу
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
