import React, { useState, useEffect } from 'react';
import { X, Mail, RefreshCw, CheckCircle, Key, ShieldCheck, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import type { MockEmail } from '../types';

interface EmailInboxSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenResetWithToken: (token: string) => void;
  onActivated?: () => void;
}

export const EmailInboxSimulatorModal: React.FC<EmailInboxSimulatorModalProps> = ({
  isOpen,
  onClose,
  onOpenResetWithToken,
  onActivated
}) => {
  const [emails, setEmails] = useState<MockEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activationStatus, setActivationStatus] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEmails();
      setActivationStatus(null);
    }
  }, [isOpen]);

  const loadEmails = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMockEmails();
      setEmails(data);
      if (data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      } else if (data.length > 0 && selectedEmail) {
        const found = data.find(e => e.id === selectedEmail.id);
        setSelectedEmail(found || data[0]);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const extractToken = (body: string): string | null => {
    const match = body.match(/token=([a-zA-Z0-9_-]+)/) || body.match(/Код підтвердження:\s*([0-9]{6})/);
    return match ? match[1] : null;
  };

  const handleActivateClick = async (token: string) => {
    setIsActivating(true);
    setActivationStatus(null);
    try {
      const msg = await api.activateAccount(token);
      setActivationStatus(msg);
      if (onActivated) {
        onActivated();
      }
    } catch (err: any) {
      setActivationStatus('Помилка: ' + (err.message || 'Не вдалося активувати'));
    } finally {
      setIsActivating(false);
    }
  };

  const handleCopyOtp = (text: string) => {
    const match = text.match(/\b\d{6}\b/);
    if (match) {
      navigator.clipboard.writeText(match[0]);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Симулятор поштової скриньки</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
                  Mock Mail Server
                </span>
              </div>
              <p className="text-xs text-slate-400">Демонстрація отримання листів активації, 2FA та скидання пароля</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadEmails}
              disabled={isLoading}
              title="Оновити пошту"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activationStatus && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{activationStatus}</span>
            </div>
            <button onClick={() => setActivationStatus(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          <div className="md:col-span-5 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-slate-950/20">
            {emails.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <span>Поштових повідомлень поки що немає</span>
              </div>
            ) : (
              emails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-3.5 rounded-xl cursor-pointer border transition duration-150 ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-500/50 shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-medium text-slate-300 truncate max-w-[140px]">{email.recipient}</span>
                      <span>{email.sentAt ? email.sentAt.replace('T', ' ').substring(0, 16) : 'Щойно'}</span>
                    </div>
                    <div className="text-xs font-semibold text-white truncate mb-1">
                      {email.subject}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                        email.type === 'ACTIVATION' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : email.type === 'PASSWORD_RESET'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {email.type === 'ACTIVATION' ? 'Активація' : email.type === 'PASSWORD_RESET' ? 'Скидання' : '2FA OTP'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="md:col-span-7 flex flex-col bg-slate-900/40 overflow-y-auto p-5">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-base font-bold text-white mb-2">{selectedEmail.subject}</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500">Отримувач: </span>
                      <span className="text-slate-200 font-mono">{selectedEmail.recipient}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Час: </span>
                      <span className="text-slate-200">{selectedEmail.sentAt ? selectedEmail.sentAt.replace('T', ' ').substring(0, 19) : ''}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans text-xs sm:text-sm text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {selectedEmail.body}
                </div>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  {selectedEmail.type === 'ACTIVATION' && (
                    <button
                      type="button"
                      disabled={isActivating}
                      onClick={() => {
                        const token = extractToken(selectedEmail.body);
                        if (token) handleActivateClick(token);
                      }}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isActivating ? 'Активація...' : 'Активувати акаунт зараз'}</span>
                    </button>
                  )}

                  {selectedEmail.type === 'PASSWORD_RESET' && (
                    <button
                      type="button"
                      onClick={() => {
                        const token = extractToken(selectedEmail.body);
                        if (token) {
                          onClose();
                          onOpenResetWithToken(token);
                        }
                      }}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition"
                    >
                      <Key className="w-4 h-4" />
                      <span>Перейти до зміни пароля</span>
                    </button>
                  )}

                  {selectedEmail.type === 'TWO_FACTOR_OTP' && (
                    <button
                      type="button"
                      onClick={() => handleCopyOtp(selectedEmail.body)}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition"
                    >
                      {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? 'Скопійовано!' : 'Скопіювати 6-значний OTP'}</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Виберіть повідомлення зі списку зліва
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
