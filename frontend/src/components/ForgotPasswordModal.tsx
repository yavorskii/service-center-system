import React, { useState } from 'react';
import { X, Key, Mail, AlertCircle, Check, Inbox } from 'lucide-react';
import { api } from '../services/api';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenResetWithToken: (token?: string) => void;
  onOpenInbox: () => void;
  onSwitchToLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onOpenResetWithToken,
  onOpenInbox,
  onSwitchToLogin
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const msg = await api.forgotPassword(email.trim());
      setSuccessMessage(msg);
    } catch (err: any) {
      setErrorMessage(err.message || 'Помилка надсилання запиту');
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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Key className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Відновлення пароля</h2>
            <p className="text-xs text-slate-400">Скидання забутого пароля через Email</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
              <Check className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Лист надіслано!</p>
                <p className="text-xs text-emerald-400/90">{successMessage}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Перейдіть у симулятор поштової скриньки, щоб скопіювати токен скидання або перейти безпосередньо до форми встановлення нового пароля.
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInbox();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center gap-2 transition"
              >
                <Inbox className="w-4 h-4 text-white" />
                <span>Відкрити скриньку повідомлень</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenResetWithToken();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              >
                Ввести токен скидання вручну
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Вкажіть адресу електронної пошти, прив'язану до вашого облікового запису. Ми надішлемо одноразове посилання з токеном для скидання пароля (термін дії: 15 хв).
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email облікового запису *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vlad@repairhub.ua"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!email.trim() || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition duration-200"
            >
              {isSubmitting ? 'Надсилання листа...' : 'Надіслати інструкції'}
            </button>

            <div className="text-center pt-2">
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
