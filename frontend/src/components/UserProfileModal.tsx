import React, { useState, useEffect } from 'react';
import { X, User, ShieldCheck, ShieldAlert, KeyRound, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import type { UserSecurityProfile, AuthUser } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  currentUser: AuthUser | null;
  onClose: () => void;
  onProfileUpdated?: (profile: UserSecurityProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<UserSecurityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
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
      if (onProfileUpdated) {
        onProfileUpdated(data);
      }
    } catch {
      if (currentUser) {
        setProfile({
          id: 1,
          username: currentUser.username,
          fullName: currentUser.fullName,
          email: currentUser.email || '',
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
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      setFeedbackMessage({
        text: updated.twoFactorEnabled
          ? 'Двофакторну автентифікацію увімкнено! При наступному вході на вашу електронну пошту надходитиме 6-значний код.'
          : 'Двофакторну автентифікацію вимкнено.',
        isError: false
      });
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Не вдалося змінити статус 2FA', isError: true });
    } finally {
      setIsToggling2FA(false);
    }
  };

  const formatRoleLabel = (role: string) => {
    if (role === 'ROLE_ADMIN') return 'Адміністратор';
    if (role === 'ROLE_MANAGER') return 'Менеджер';
    if (role === 'ROLE_TECHNICIAN') return 'Інженер сервісу';
    return 'Клієнт';
  };

  const formatProviderLabel = (provider: string) => {
    if (provider === 'GOOGLE') return 'Google OAuth 2.0';
    if (provider === 'LOCAL+GOOGLE') return 'Пароль + Google OAuth 2.0';
    return 'Логін та пароль';
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
            <h2 className="text-xl font-bold tracking-tight text-white">Мій профіль та безпека</h2>
            <p className="text-xs text-slate-400">Керування обліковим записом і двофакторним захистом</p>
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
                <span className="text-xs text-slate-400">ПІБ:</span>
                <span className="text-sm font-semibold text-white">{profile.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Логін:</span>
                <span className="text-xs font-semibold text-slate-200 font-mono">{profile.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Електронна пошта:</span>
                <span className="text-xs font-medium text-slate-200 font-mono">{profile.email || 'Не вказано'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Роль:</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {formatRoleLabel(profile.role)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">Спосіб входу:</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {formatProviderLabel(profile.authProvider)}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Підтвердження електронної пошти</div>
                <div className="text-[11px] text-slate-400">Статус верифікації поштової скриньки</div>
              </div>
              {profile.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Підтверджено</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Очікує підтвердження</span>
                </span>
              )}
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>Двофакторна автентифікація (2FA)</span>
                </div>
                <div className="text-[11px] text-slate-400">Одноразовий 6-значний код на вашу пошту під час входу</div>
              </div>
              <button
                type="button"
                onClick={handleToggle2FA}
                disabled={isToggling2FA}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                  profile.twoFactorEnabled
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {isToggling2FA ? 'Збереження...' : profile.twoFactorEnabled ? 'Вимкнути 2FA' : 'Увімкнути 2FA'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
