import React, { useState, useEffect } from 'react';
import { X, User, ShieldCheck, ShieldAlert, KeyRound, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { UserSecurityProfile, AuthUser } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  currentUser: AuthUser | null;
  onClose: () => void;
  onOpenInbox: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onOpenInbox
}) => {
  const [profile, setProfile] = useState<UserSecurityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setFeedbackMessage(null);
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUserProfile();
      setProfile(data);
    } catch {
      if (currentUser) {
        setProfile({
          id: 1,
          username: currentUser.username,
          fullName: currentUser.fullName,
          email: currentUser.email || `${currentUser.username}@repairhub.ua`,
          role: currentUser.role,
          emailVerified: currentUser.emailVerified ?? true,
          twoFactorEnabled: currentUser.twoFactorEnabled ?? false,
          failedLoginAttempts: 0,
          isLocked: false,
          authProvider: 'LOCAL'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!profile) return;
    setIsToggling2FA(true);
    setFeedbackMessage(null);
    try {
      const updated = await api.toggleTwoFactor(!profile.twoFactorEnabled);
      setProfile(updated);
      setFeedbackMessage({
        text: updated.twoFactorEnabled 
          ? 'Двофакторну автентифікацію успішно активовано! При наступному вході буде вимагатися OTP.'
          : 'Двофакторну автентифікацію вимкнено.',
        isError: false
      });
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Не вдалося змінити статус 2FA', isError: true });
    } finally {
      setIsToggling2FA(false);
    }
  };

  const handleManualActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    setIsActivating(true);
    setFeedbackMessage(null);
    try {
      const msg = await api.activateAccount(manualToken.trim());
      setFeedbackMessage({ text: msg, isError: false });
      setManualToken('');
      loadProfile();
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Невірний токен активації', isError: true });
    } finally {
      setIsActivating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Профіль безпеки користувача</h2>
            <p className="text-xs text-slate-400">Параметри доступу та конфігурація захисту</p>
          </div>
        </div>

        {feedbackMessage && (
          <div className={`mb-5 p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
            feedbackMessage.isError
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            {feedbackMessage.isError ? (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        ) : profile ? (
          <div className="space-y-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Логін:</span>
                <span className="text-sm font-semibold text-white font-mono">{profile.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">ПІБ:</span>
                <span className="text-sm font-medium text-slate-200">{profile.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Електронна пошта:</span>
                <span className="text-sm font-medium text-slate-200">{profile.email || 'Не вказано'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Роль у системі:</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {profile.role}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Спосіб автентифікації:</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {profile.authProvider}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Статус Email-активації</div>
                  <div className="text-[11px] text-slate-400">Підтвердження володіння поштовою адресою</div>
                </div>
                {profile.emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Підтверджено</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Не активовано</span>
                  </span>
                )}
              </div>

              {!profile.emailVerified && (
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] text-slate-400">Активуйте через пошту або токен:</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenInbox();
                      }}
                      className="text-[11px] text-sky-400 hover:text-sky-300 underline"
                    >
                      Відкрити поштову скриньку
                    </button>
                  </div>
                  <form onSubmit={handleManualActivate} className="flex gap-2">
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Вставте токен активації"
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                    <button
                      type="submit"
                      disabled={!manualToken.trim() || isActivating}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition"
                    >
                      {isActivating ? '...' : 'Активувати'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Двофакторна автентифікація (2FA)</span>
                </div>
                <div className="text-[11px] text-slate-400">Захист входу за допомогою 6-значного OTP-коду</div>
              </div>
              <button
                type="button"
                onClick={handleToggle2FA}
                disabled={isToggling2FA}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  profile.twoFactorEnabled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {isToggling2FA ? 'Оновлення...' : profile.twoFactorEnabled ? 'Вимкнути 2FA' : 'Увімкнути 2FA'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
