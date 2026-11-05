import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface SupportTicketModalProps {
  isOpen: boolean;
  initialEmail?: string;
  initialCategory?: string;
  currentUser?: any;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const CATEGORIES = [
  { value: 'SUSPICIOUS_ACTIVITY', label: 'Підозріла активність (спроби зламу)' },
  { value: 'ACCOUNT_LOCKED', label: 'Заблокований акаунт (Brute Force)' },
  { value: 'LOGIN_ISSUE', label: 'Проблема зі входом в обліковий запис' },
  { value: 'TWO_FACTOR_ISSUE', label: 'Проблема з двофакторною автентифікацією (2FA)' }
];

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  initialEmail = '',
  initialCategory = 'SUSPICIOUS_ACTIVITY',
  currentUser,
  onClose,
  onSuccess
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [category, setCategory] = useState(initialCategory);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || currentUser?.email || '');
      setCategory(initialCategory || 'SUSPICIOUS_ACTIVITY');
      setSubject('');
      setDescription('');
      setErrorMessage('');
      setSubmittedId(null);
    }
  }, [isOpen, initialEmail, initialCategory, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !subject.trim() || !description.trim()) {
      setErrorMessage('Заповніть усі поля форми звернення');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const created = await api.createSupportTicket({
        email: email.trim(),
        category,
        subject: subject.trim(),
        description: description.trim()
      });
      setSubmittedId(created.id);
      if (onSuccess) {
        onSuccess(`Звернення #${created.id} зареєстровано в системі безпеки`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Помилка відправки звернення');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#111827] border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Служба безпеки та підтримки</h2>
            <p className="text-xs text-slate-400">Повідомлення про підозрілу активність або розблокування акаунта</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {submittedId ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">Звернення #{submittedId} надіслано!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Дякуємо за подробиці. Адміністратор безпеки перевірить журнал входів та IP-адреси і надішле офіційну відповідь на{' '}
              <span className="font-mono text-white">{email}</span>.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
            >
              Закрити вікно
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email вашого облікового запису *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Категорія інциденту *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Тема звернення *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Наприклад: Мій акаунт / Підозрілі спроби входу"
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Детальний опис ситуації *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Хтось намагається увійти в мій обліковий запис без мого відому..."
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Відправка...' : 'Надіслати звернення'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
