import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Laptop,
  QrCode,
  Copy,
  Mail,
  ExternalLink,
  LogOut,
  Check,
  ArrowRight,
  UserCog,
  History
} from 'lucide-react';
import { api } from '../services/api';
import type { UserSecurityProfile, AuthUser, UserSessionItem, SecurityAuditLog, TotpSetupData } from '../types';
import { describeSecurityEvent, getToneBadgeClasses, formatUtcTimestamp } from '../utils/securityLabels';

interface UserProfileModalProps {
  isOpen: boolean;
  currentUser: AuthUser | null;
  onClose: () => void;
  onProfileUpdated?: (profile: UserSecurityProfile, newToken?: string) => void;
  onRequestPasswordReset?: (email: string) => void;
  onSessionExpired?: () => void;
}

type TabType = 'security' | 'sessions' | 'events' | 'profile';

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onProfileUpdated,
  onRequestPasswordReset,
  onSessionExpired
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('security');
  const [profile, setProfile] = useState<UserSecurityProfile | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // 2FA TOTP state
  const [totpSetup, setTotpSetup] = useState<TotpSetupData | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [isSettingUpTotp, setIsSettingUpTotp] = useState(false);
  const [isVerifyingTotp, setIsVerifyingTotp] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [isTogglingEmail2FA, setIsTogglingEmail2FA] = useState(false);

  // Google OAuth state
  const [isGoogleLinking, setIsGoogleLinking] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [terminatingSessionId, setTerminatingSessionId] = useState<number | null>(null);
  const [isTerminatingOthers, setIsTerminatingOthers] = useState(false);
  const [sessionsMessage, setSessionsMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Events state
  const [personalEvents, setPersonalEvents] = useState<SecurityAuditLog[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Profile edit state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNewUsername, setEditNewUsername] = useState('');
  const [editCurrentPassword, setEditCurrentPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setFeedbackMessage(null);
      setSessionsMessage(null);
      setTotpSetup(null);
      setTotpCode('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'sessions') {
        loadSessions();
      } else if (activeTab === 'events') {
        loadEvents();
      }
    }
  }, [activeTab, isOpen]);

  const loadProfile = async () => {
    try {
      const data = await api.getUserProfile();
      setProfile(data);
      setEditFullName(data.fullName || '');
      setEditPhone(data.phone || '');
      setEditNewUsername('');
      setEditCurrentPassword('');
      if (onProfileUpdated) {
        onProfileUpdated(data);
      }
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        onSessionExpired?.();
        return;
      }
      if (currentUser) {
        const fallback: UserSecurityProfile = {
          id: 1,
          username: currentUser.username,
          fullName: currentUser.fullName,
          email: currentUser.email || '',
          role: currentUser.role,
          phone: '',
          emailVerified: currentUser.emailVerified ?? true,
          twoFactorEnabled: currentUser.twoFactorEnabled ?? false,
          twoFactorMethod: currentUser.twoFactorMethod || 'EMAIL',
          failedLoginAttempts: 0,
          isLocked: false,
          authProvider: 'LOCAL'
        };
        setProfile(fallback);
        setEditFullName(currentUser.fullName || '');
      }
    }
  };

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    setSessionsMessage(null);
    try {
      const list = await api.getActiveSessions();
      setSessions(list);
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        onSessionExpired?.();
      } else {
        setSessionsMessage({ text: err.message || 'Не вдалося завантажити сеанси', isError: true });
      }
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const list = await api.getPersonalEvents();
      setPersonalEvents(list);
    } catch (err: any) {
      if (err.message === 'SESSION_EXPIRED') {
        onSessionExpired?.();
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleStartTotpSetup = async () => {
    setIsSettingUpTotp(true);
    setFeedbackMessage(null);
    try {
      const data = await api.setupTotp();
      setTotpSetup(data);
      setTotpCode('');
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Не вдалося створити QR-код для 2FA', isError: true });
    } finally {
      setIsSettingUpTotp(false);
    }
  };

  const handleConfirmTotp = async () => {
    if (!totpSetup || !totpCode.trim()) return;
    setIsVerifyingTotp(true);
    setFeedbackMessage(null);
    try {
      const updated = await api.enableTotp(totpSetup.secret, totpCode.trim());
      setProfile(updated);
      setTotpSetup(null);
      setTotpCode('');
      setFeedbackMessage({
        text: '2FA через Google Authenticator успішно активовано! Тепер під час входу потрібно вводити 6-значний код із додатка.',
        isError: false
      });
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Невірний код або помилка активації', isError: true });
    } finally {
      setIsVerifyingTotp(false);
    }
  };

  const handleToggleEmail2FA = async (enable: boolean) => {
    setIsTogglingEmail2FA(true);
    setFeedbackMessage(null);
    try {
      const updated = await api.toggleTwoFactor(enable);
      setProfile(updated);
      setTotpSetup(null);
      setFeedbackMessage({
        text: enable
          ? '2FA через Email OTP увімкнено! Коди надходитимуть на вашу електронну пошту.'
          : 'Двофакторну автентифікацію повністю вимкнено.',
        isError: false
      });
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Не вдалося змінити статус 2FA', isError: true });
    } finally {
      setIsTogglingEmail2FA(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsGoogleLinking(true);
    setFeedbackMessage(null);
    try {
      localStorage.setItem('repairhub_google_mode', 'link');
      const url = await api.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Не вдалося підключити Google-акаунт', isError: true });
      setIsGoogleLinking(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!window.confirm("Ви дійсно бажаєте від'єднати Google-акаунт?")) return;
    setIsGoogleLinking(true);
    setFeedbackMessage(null);
    try {
      const updated = await api.unlinkGoogle();
      setProfile(updated);
      setFeedbackMessage({ text: "Google-акаунт успішно від'єднано від вашого профілю.", isError: false });
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || "Не вдалося від'єднати Google-акаунт", isError: true });
    } finally {
      setIsGoogleLinking(false);
    }
  };

  const handleTerminateOtherSessions = async () => {
    setIsTerminatingOthers(true);
    setSessionsMessage(null);
    try {
      const res = await api.terminateOtherSessions();
      setSessionsMessage({
        text: res.message || `Усі інші сеанси (${res.terminatedCount}) успішно завершено!`,
        isError: false
      });
      loadSessions();
    } catch (err: any) {
      setSessionsMessage({ text: err.message || 'Помилка завершення інших сеансів', isError: true });
    } finally {
      setIsTerminatingOthers(false);
    }
  };

  const handleTerminateSingleSession = async (session: UserSessionItem) => {
    setTerminatingSessionId(session.id);
    setSessionsMessage(null);
    try {
      await api.terminateSession(session.id);
      if (session.current) {
        onSessionExpired?.();
      } else {
        setSessionsMessage({ text: 'Сеанс успішно завершено', isError: false });
        loadSessions();
      }
    } catch (err: any) {
      setSessionsMessage({ text: err.message || 'Не вдалося завершити сеанс', isError: true });
    } finally {
      setTerminatingSessionId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setFeedbackMessage(null);
    try {
      const payload: {
        fullName?: string;
        phone?: string;
        newUsername?: string;
        currentPassword?: string;
      } = {
        fullName: editFullName,
        phone: editPhone
      };

      if (editNewUsername.trim()) {
        payload.newUsername = editNewUsername.trim();
        payload.currentPassword = editCurrentPassword;
      }

      const updated = await api.updateProfileDetails(payload);
      setProfile(updated);
      setEditNewUsername('');
      setEditCurrentPassword('');
      setFeedbackMessage({
        text: 'Профіль успішно оновлено' + (payload.newUsername ? '. Логін змінено, авторизаційні ключі оновлено!' : '!'),
        isError: false
      });
      if (onProfileUpdated) {
        onProfileUpdated(updated, updated.updatedToken);
      }
    } catch (err: any) {
      setFeedbackMessage({ text: err.message || 'Не вдалося оновити дані профілю', isError: true });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Центр безпеки та профіль
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-normal">
                  @{profile?.username || currentUser?.username}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Керування двофакторною автентифікацією, сеансами та персональними даними</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Захист акаунта
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Laptop className="w-4 h-4" />
            Активні сеанси
            {sessions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {sessions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'events'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <History className="w-4 h-4" />
            Журнал захисту
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <UserCog className="w-4 h-4" />
            Налаштування
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-200">
          {feedbackMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs animate-fadeIn ${
                feedbackMessage.isError
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {feedbackMessage.isError ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">{feedbackMessage.text}</div>
            </div>
          )}

          {/* TAB 1: SECURITY (2FA, GOOGLE, PASSWORD RESET) */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Quick Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Електронна пошта</div>
                  <div className="mt-1 font-semibold text-xs text-white truncate" title={profile?.email || '—'}>
                    {profile?.email || '—'}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                    {profile?.emailVerified !== false ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Підтверджено
                      </span>
                    ) : (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Не активовано
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Статус 2FA</div>
                  <div className="mt-1 font-semibold text-xs">
                    {profile?.twoFactorEnabled ? (
                      <span className="text-emerald-400">
                        {profile.twoFactorMethod === 'TOTP' ? 'Google Authenticator' : 'Email OTP'}
                      </span>
                    ) : (
                      <span className="text-slate-400">Вимкнено</span>
                    )}
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400">
                    {profile?.twoFactorEnabled ? 'Захист активний' : 'Рекомендовано увімкнути'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Google OAuth 2.0</div>
                  <div className="mt-1 font-semibold text-xs truncate">
                    {profile?.googleConnected ? (
                      <span className="text-emerald-400">Підключено</span>
                    ) : (
                      <span className="text-slate-400">Не підключено</span>
                    )}
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400 truncate" title={profile?.googleEmail || ''}>
                    {profile?.googleEmail || 'Вхід за паролем'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[11px] text-slate-400">Останній вхід (IP)</div>
                  <div className="mt-1 font-semibold text-xs text-white">
                    {profile?.lastLoginIp || '127.0.0.1'}
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400">
                    {formatUtcTimestamp(profile?.lastLoginAt)}
                  </div>
                </div>
              </div>

              {/* 2FA Management */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/70 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Двофакторна автентифікація (2FA)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Підвищує безпеку: окрім пароля вимагає введення 6-значного коду з Google Authenticator або пошти.
                    </p>
                  </div>
                  {profile?.twoFactorEnabled && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Активно: {profile.twoFactorMethod === 'TOTP' ? 'TOTP App' : 'Email'}
                    </span>
                  )}
                </div>

                {/* When 2FA is OFF */}
                {!profile?.twoFactorEnabled && !totpSetup && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={handleStartTotpSetup}
                      disabled={isSettingUpTotp}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                    >
                      <QrCode className="w-4 h-4" />
                      {isSettingUpTotp ? 'Генерація QR-коду...' : 'Налаштувати 2FA (Google Authenticator)'}
                    </button>
                    <button
                      onClick={() => handleToggleEmail2FA(true)}
                      disabled={isTogglingEmail2FA}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {isTogglingEmail2FA ? 'Увімкнення...' : 'Увімкнути 2FA через Email OTP'}
                    </button>
                  </div>
                )}

                {/* TOTP Setup Card */}
                {totpSetup && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/40 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-blue-400" />
                        Сканування QR-коду в Google Authenticator
                      </h4>
                      <button
                        onClick={() => setTotpSetup(null)}
                        className="text-xs text-slate-400 hover:text-slate-200"
                      >
                        Скасувати
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* SVG QR Code */}
                      <div
                        className="bg-white p-2 rounded-xl shadow shrink-0 w-44 h-44 flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: totpSetup.qrCodeSvg }}
                      />

                      <div className="space-y-3 flex-1 text-xs">
                        <p className="text-slate-300">
                          1. Відкрийте <strong>Google Authenticator</strong> (або інший TOTP-додаток) на телефоні.
                        </p>
                        <p className="text-slate-300">
                          2. Відскануйте QR-код або введіть секретний ключ вручну:
                        </p>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                          <code className="text-blue-300 font-mono text-[11px] select-all flex-1 break-all">
                            {totpSetup.secret}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(totpSetup.secret)}
                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                            title="Скопіювати ключ"
                          >
                            {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleStartTotpSetup}
                            disabled={isSettingUpTotp}
                            className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Створити новий QR-код
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Verification input */}
                    <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          3. Введіть 6-значний код із додатка для підтвердження:
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={totpCode}
                          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleConfirmTotp}
                          disabled={isVerifyingTotp || totpCode.length !== 6}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors shadow-lg shadow-emerald-500/20"
                        >
                          {isVerifyingTotp ? 'Перевірка...' : 'Підтвердити та увімкнути 2FA'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* When 2FA is ON */}
                {profile?.twoFactorEnabled && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs">
                      <span className="text-slate-300">Поточний метод автентифікації: </span>
                      <strong className="text-emerald-400">
                        {profile.twoFactorMethod === 'TOTP' ? 'Google Authenticator (RFC 6238 TOTP)' : 'Одноразові коди на Email'}
                      </strong>
                    </div>
                    <button
                      onClick={() => handleToggleEmail2FA(false)}
                      disabled={isTogglingEmail2FA}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                    >
                      {isTogglingEmail2FA ? 'Вимкнення...' : 'Вимкнути 2FA'}
                    </button>
                  </div>
                )}
              </div>

              {/* Google OAuth Account Linking */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/70 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      Google-акаунт (OAuth 2.0)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Прив'язка облікового запису Google дозволяє входити в 1 клік без введення пароля.
                    </p>
                  </div>

                  {profile?.googleConnected ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                      Підключено
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                      Не прив'язано
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs truncate">
                    {profile?.googleConnected ? (
                      <span className="text-slate-300">
                        Прив'язаний email: <strong className="text-white">{profile.googleEmail || profile.email}</strong>
                      </span>
                    ) : (
                      <span className="text-slate-400">Вхід за допомогою Google зараз не налаштовано для цього профілю.</span>
                    )}
                  </div>
                  <div>
                    {profile?.googleConnected ? (
                      <button
                        onClick={handleUnlinkGoogle}
                        disabled={isGoogleLinking}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                      >
                        {isGoogleLinking ? "Від'єднання..." : "Від'єднати Google"}
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectGoogle}
                        disabled={isGoogleLinking}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 shadow"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {isGoogleLinking ? 'Перехід...' : 'Підключити Google-акаунт'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Password via Email */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Відновлення або зміна пароля</div>
                  <div className="text-[11px] text-slate-400">
                    Надіслати лист із захищеним криптографічним посиланням на зміну пароля
                  </div>
                </div>
                {onRequestPasswordReset && profile?.email && (
                  <button
                    onClick={() => {
                      onClose();
                      onRequestPasswordReset(profile.email);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    Змінити пароль через Email <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-blue-300 mb-0.5">Керування активними сеансами (Security Sessions)</div>
                  <p className="text-[11px] leading-relaxed text-blue-200/90">
                    Кожен вхід створює унікальний сеанс на сервері із прив'язкою до ідентифікатора JWT-токена (<code className="text-blue-300 font-mono">jti</code>).
                    <strong> Правило первинного сеансу:</strong> примусово завершити всі інші активні пристрої може лише сеанс, який увійшов раніше (первинний),
                    що запобігає перехопленню керування зловмисником, який щойно заволодів паролем.
                  </p>
                </div>
              </div>

              {sessionsMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    sessionsMessage.isError
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {sessionsMessage.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{sessionsMessage.text}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={loadSessions}
                  disabled={isLoadingSessions}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                  Оновити список
                </button>

                <button
                  type="button"
                  onClick={handleTerminateOtherSessions}
                  disabled={isTerminatingOthers || sessions.length <= 1}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600/90 hover:bg-rose-600 disabled:opacity-40 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-rose-600/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {isTerminatingOthers ? 'Завершення...' : 'Завершити інші сеанси'}
                </button>
              </div>

              {/* Sessions list */}
              <div className="space-y-2.5">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`p-4 rounded-xl border transition-all ${
                      sess.current
                        ? 'bg-slate-800/80 border-blue-500/50 shadow-md shadow-blue-500/5'
                        : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            sess.current
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <Laptop className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{sess.deviceInfo || 'Браузер'}</span>
                            {sess.current && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold">
                                Цей пристрій
                              </span>
                            )}
                            {sess.primary && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                                Первинний сеанс
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-1">
                            <span>
                              IP: <code className="text-slate-300 font-mono">{sess.ipAddress}</code>
                            </span>
                            <span>Вхід: {formatUtcTimestamp(sess.createdAt)}</span>
                            <span>Активність: {formatUtcTimestamp(sess.lastActiveAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {sess.current ? (
                          <button
                            onClick={() => handleTerminateSingleSession(sess)}
                            disabled={terminatingSessionId === sess.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          >
                            Вийти
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTerminateSingleSession(sess)}
                            disabled={terminatingSessionId === sess.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                          >
                            {terminatingSessionId === sess.id ? 'Завершення...' : 'Завершити'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {sessions.length === 0 && !isLoadingSessions && (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Немає активних сеансів для відображення
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PERSONAL SECURITY EVENTS */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Журнал останніх подій безпеки вашого облікового запису (входи, зміна налаштувань, 2FA):
                </p>
                <button
                  onClick={loadEvents}
                  disabled={isLoadingEvents}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                  Оновити
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[11px]">
                      <th className="py-2.5 px-4 font-semibold">Час (UTC)</th>
                      <th className="py-2.5 px-4 font-semibold">Подія</th>
                      <th className="py-2.5 px-4 font-semibold">IP-адреса</th>
                      <th className="py-2.5 px-4 font-semibold">Пристрій</th>
                      <th className="py-2.5 px-4 font-semibold">Деталі</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {personalEvents.map((ev) => {
                      const meta = describeSecurityEvent(ev.status);
                      const badgeClass = getToneBadgeClasses(meta.tone);
                      return (
                        <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {formatUtcTimestamp(ev.attemptTime)}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-300">
                            {ev.ipAddress || '127.0.0.1'}
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-400 truncate max-w-[140px]" title={ev.userAgent || ''}>
                            {ev.userAgent || 'Chrome • Linux'}
                          </td>
                          <td className="py-2.5 px-4 text-[11px] text-slate-400 truncate max-w-[200px]" title={ev.details}>
                            {ev.details || '—'}
                          </td>
                        </tr>
                      );
                    })}
                    {personalEvents.length === 0 && !isLoadingEvents && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                          Журнал подій порожній
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Прізвище та ім'я</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Іван Сидоренко"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Контактний телефон</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                  placeholder="+380..."
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  Зміна логіна входу (Username)
                </div>
                <p className="text-[11px] text-slate-400">
                  Зміна імені користувача вимагає обов'язкового підтвердження поточним паролем. Після зміни логіна
                  сервер автоматично перегенезує JWT-токен.
                </p>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Новий логін</label>
                  <input
                    type="text"
                    value={editNewUsername}
                    onChange={(e) => setEditNewUsername(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                    placeholder="новий_логін"
                  />
                </div>

                {editNewUsername.trim() && (
                  <div className="animate-fadeIn">
                    <label className="block text-[11px] font-medium text-amber-300 mb-1">
                      Поточний пароль (для підтвердження)
                    </label>
                    <input
                      type="password"
                      value={editCurrentPassword}
                      onChange={(e) => setEditCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-amber-500/50 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                      placeholder="Введіть ваш діючий пароль"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile || (!!editNewUsername.trim() && !editCurrentPassword)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors shadow-lg shadow-blue-500/20"
                >
                  {isSavingProfile ? 'Збереження...' : 'Зберегти зміни'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Роль:</span>
            <span className="font-semibold text-white">
              {profile?.role === 'ROLE_ADMIN'
                ? 'Адміністратор'
                : profile?.role === 'ROLE_MANAGER'
                ? 'Менеджер'
                : profile?.role === 'ROLE_TECHNICIAN'
                ? 'Інженер'
                : 'Клієнт'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
};
