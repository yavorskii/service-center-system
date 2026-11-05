import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Users,
  KeyRound,
  FileText,
  Mail,
  LifeBuoy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  X
} from 'lucide-react';
import { api } from '../services/api';
import type { SecurityAuditLog, StaffMember, SentEmailLogItem, SupportTicketItem, AuthUser } from '../types';
import { describeSecurityEvent, getToneBadgeClasses, formatUtcTimestamp } from '../utils/securityLabels';

interface SecurityAuditViewProps {
  currentUser?: AuthUser | null;
}

type TabType = 'users' | 'two_factor' | 'audit' | 'emails' | 'support';

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [emailLogs, setEmailLogs] = useState<SentEmailLogItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionMessage, setActionMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Delete user modal
  const [userToDelete, setUserToDelete] = useState<StaffMember | null>(null);
  const [confirmIdentifier, setConfirmIdentifier] = useState('');
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Support ticket detail / reply
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [ticketStatus, setTicketStatus] = useState<string>('IN_PROGRESS');
  const [adminNote, setAdminNote] = useState<string>('');
  const [adminReply, setAdminReply] = useState<string>('');
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const [logsData, staffData, emailData, ticketData] = await Promise.all([
        api.getSecurityAuditLogs(),
        api.getStaff(),
        api.getSentEmailLogs(),
        api.getSupportTickets()
      ]);
      setLogs(logsData);
      setStaff(staffData);
      setEmailLogs(emailData);
      setTickets(ticketData);

      // Keep selected ticket refreshed if open
      if (selectedTicket) {
        const found = ticketData.find((t) => t.id === selectedTicket.id);
        if (found) {
          setSelectedTicket(found);
          setTicketStatus(found.status);
          setAdminNote(found.adminNote || '');
          setAdminReply(found.adminReply || '');
        }
      }
    } catch {
      setActionMessage({ text: 'Не вдалося завантажити всі дані безпеки', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = async (id: number, username: string) => {
    try {
      await api.lockUser(id);
      setActionMessage({ text: `Користувача ${username} успішно заблоковано`, isError: false });
      loadAllData();
    } catch (err: any) {
      setActionMessage({ text: err?.message || `Помилка блокування ${username}`, isError: true });
    }
  };

  const handleUnlock = async (id: number, username: string) => {
    try {
      await api.unlockUser(id);
      setActionMessage({ text: `Користувача ${username} успішно розблоковано`, isError: false });
      loadAllData();
    } catch (err: any) {
      setActionMessage({ text: err?.message || `Помилка розблокування ${username}`, isError: true });
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToDelete) return;
    setIsDeleting(true);
    setActionMessage(null);
    try {
      await api.deleteUserByAdmin(userToDelete.id, confirmIdentifier.trim(), confirmKeyword.trim());
      setActionMessage({ text: `Користувача ${userToDelete.username} успішно видалено`, isError: false });
      setUserToDelete(null);
      setConfirmIdentifier('');
      setConfirmKeyword('');
      loadAllData();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Не вдалося видалити користувача', isError: true });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenTicket = (ticket: SupportTicketItem) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status);
    setAdminNote(ticket.adminNote || '');
    setAdminReply(ticket.adminReply || '');
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setIsUpdatingTicket(true);
    setActionMessage(null);
    try {
      const updated = await api.updateSupportTicket(selectedTicket.id, {
        status: ticketStatus,
        adminNote,
        replyMessage: adminReply
      });
      setSelectedTicket(updated);
      setActionMessage({
        text: `Звернення #${selectedTicket.id} успішно оновлено! ${
          adminReply.trim() ? 'Відповідь надіслано на email ' + updated.email : ''
        }`,
        isError: false
      });
      loadAllData();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Помилка оновлення звернення', isError: true });
    } finally {
      setIsUpdatingTicket(false);
    }
  };

  // KPI Calculations
  const totalAccounts = staff.length;
  const activatedEmails = staff.filter((u) => u.emailVerified !== false).length;
  const lockedAccounts = staff.filter((u) => u.isLocked).length;
  const twoFactorAccounts = staff.filter((u) => u.twoFactorEnabled).length;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actorUsername && log.actorUsername.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.ipAddress.includes(searchTerm) ||
      (log.userIpAddress && log.userIpAddress.includes(searchTerm)) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'SUCCESS_GROUP') {
      return matchesSearch && (log.status === 'SUCCESS' || log.status === 'SUCCESS_2FA' || log.status.startsWith('OAUTH_'));
    }
    if (statusFilter === 'FAILED_GROUP') {
      return matchesSearch && (log.status.startsWith('FAILED_') || log.status === 'ACTIVATION_REQUIRED');
    }
    if (statusFilter === 'LOCKED_GROUP') {
      return (
        matchesSearch &&
        (log.status === 'ACCOUNT_LOCKED' || log.status === 'BLOCKED_BY_ADMIN' || log.status === 'OAUTH_BLOCKED')
      );
    }
    if (statusFilter === '2FA_GROUP') {
      return matchesSearch && log.status.includes('2FA');
    }
    if (statusFilter === 'SESSION_GROUP') {
      return matchesSearch && log.status.includes('SESSION');
    }
    return matchesSearch && log.status === statusFilter;
  });

  const twoFactorStaff = staff.filter((u) => u.twoFactorEnabled);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-blue-400" />
            <span>Панель безпеки, сеансів та аудиту (Security Operations Center)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Моніторинг сеансів, журналювання IP-адрес дій vs власника, захист від Brute Force та обробка інцидентів
          </p>
        </div>

        <button
          onClick={loadAllData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Оновити дані</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs animate-fadeIn ${
            actionMessage.isError
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {actionMessage.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <div className="flex-1">{actionMessage.text}</div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{totalAccounts}</div>
            <div className="text-xs font-semibold text-slate-300">Усього акаунтів</div>
            <div className="text-[11px] text-slate-400">Облікові записи в базі</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">{activatedEmails}</div>
            <div className="text-xs font-semibold text-slate-300">Активовані Email</div>
            <div className="text-[11px] text-slate-400">Підтверджені адреси</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-400">{lockedAccounts}</div>
            <div className="text-xs font-semibold text-slate-300">Заблоковані</div>
            <div className="text-[11px] text-slate-400">Brute Force або адмін</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400">{twoFactorAccounts}</div>
            <div className="text-xs font-semibold text-slate-300">Захищені 2FA</div>
            <div className="text-[11px] text-slate-400">TOTP або Email OTP</div>
          </div>
        </div>
      </div>

      {/* 5-Tab Bar */}
      <div className="flex border-b border-slate-800 bg-slate-900/40 rounded-t-2xl px-4 gap-2 pt-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          Користувачі ({staff.length})
        </button>

        <button
          onClick={() => setActiveTab('two_factor')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'two_factor'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Захищені 2FA ({twoFactorAccounts})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          Журнал аудиту ({logs.length})
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'emails'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Mail className="w-4 h-4" />
          Надіслані листи ({emailLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'support'
              ? 'border-blue-500 text-blue-400 bg-slate-800/80'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          Підтримка ({tickets.length})
        </button>
      </div>

      {/* TAB 1: USERS LIST & MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Облікові записи системи</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Керування статусом блокування, перевірка 2FA та безпечне подвійне підтвердження видалення
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
                    <th className="py-3 px-4 font-semibold">#ID</th>
                    <th className="py-3 px-4 font-semibold">Логін / ПІБ</th>
                    <th className="py-3 px-4 font-semibold">Роль</th>
                    <th className="py-3 px-4 font-semibold">Email / Статус</th>
                    <th className="py-3 px-4 font-semibold">Вхід</th>
                    <th className="py-3 px-4 font-semibold">2FA Метод</th>
                    <th className="py-3 px-4 font-semibold">Помилок</th>
                    <th className="py-3 px-4 font-semibold">Останній IP</th>
                    <th className="py-3 px-4 font-semibold">Статус</th>
                    <th className="py-3 px-4 font-semibold text-right">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  {staff.map((u) => {
                    const isSelf = u.username === currentUser?.username;
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">#{u.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {u.username}
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                Поточний сеанс
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{u.fullName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {u.role.replace('ROLE_', '')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-[11px] text-slate-200">{u.email || '—'}</div>
                          {u.emailVerified !== false ? (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Активовано
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Очікує підтвердження
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[11px]">
                          {u.authProvider === 'GOOGLE' ? (
                            <span className="text-blue-400 font-semibold">Google</span>
                          ) : u.authProvider === 'LOCAL+GOOGLE' ? (
                            <span className="text-purple-400 font-semibold">Пароль+Google</span>
                          ) : (
                            <span className="text-slate-300">Пароль</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {u.twoFactorEnabled ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              {u.twoFactorMethod === 'TOTP' ? 'TOTP QR' : 'Email OTP'}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Вимкнено</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-mono text-xs font-bold ${
                              (u.failedLoginAttempts || 0) >= 5
                                ? 'text-rose-400'
                                : (u.failedLoginAttempts || 0) > 0
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {u.failedLoginAttempts || 0}/5
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                          {u.lastLoginIp || '—'}
                        </td>
                        <td className="py-3 px-4">
                          {u.isLocked ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 w-fit">
                              <Lock className="w-3 h-3" /> Заблоковано
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                              <ShieldCheck className="w-3 h-3" /> Активний
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isSelf && (
                              <>
                                {u.isLocked ? (
                                  <button
                                    onClick={() => handleUnlock(u.id, u.username)}
                                    className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
                                    title="Розблокувати акаунт"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleLock(u.id, u.username)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                                    title="Заблокувати акаунт"
                                  >
                                    <Lock className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setUserToDelete(u);
                                    setConfirmIdentifier('');
                                    setConfirmKeyword('');
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                                  title="Видалити акаунт (подвійне підтвердження)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compact Recent Events */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Останні 10 подій безпеки
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 text-[11px] border-b border-slate-800">
                    <th className="py-2 px-3">Час</th>
                    <th className="py-2 px-3">Подія</th>
                    <th className="py-2 px-3">Акаунт</th>
                    <th className="py-2 px-3">IP дії</th>
                    <th className="py-2 px-3">Деталі</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {logs.slice(0, 10).map((l) => {
                    const meta = describeSecurityEvent(l.status);
                    const badgeClass = getToneBadgeClasses(meta.tone);
                    return (
                      <tr key={l.id}>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{formatUtcTimestamp(l.attemptTime)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-white">{l.username}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-300">{l.ipAddress}</td>
                        <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-xs">{l.details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 2FA PROTECTED ACCOUNTS */}
      {activeTab === 'two_factor' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Акаунти із захистом двофакторної автентифікації ({twoFactorStaff.length})
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Перелік співробітників та користувачів із активованим другим фактором (TOTP / Email)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px]">
                  <th className="py-3 px-4 font-semibold">#ID</th>
                  <th className="py-3 px-4 font-semibold">Логін</th>
                  <th className="py-3 px-4 font-semibold">ПІБ</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Роль</th>
                  <th className="py-3 px-4 font-semibold">Метод 2FA</th>
                  <th className="py-3 px-4 font-semibold">Останній IP</th>
                  <th className="py-3 px-4 font-semibold">Останній вхід</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {twoFactorStaff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">#{u.id}</td>
                    <td className="py-3 px-4 font-bold text-white">{u.username}</td>
                    <td className="py-3 px-4">{u.fullName}</td>
                    <td className="py-3 px-4 text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {u.role.replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {u.twoFactorMethod === 'TOTP' ? 'Google Authenticator (RFC 6238)' : 'Одноразовий Email OTP'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">{u.lastLoginIp || '—'}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">{formatUtcTimestamp(u.lastLoginAt)}</td>
                  </tr>
                ))}
                {twoFactorStaff.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                      Немає акаунтів з увімкненим 2FA
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOG (WITH OWNER IP VS ACTION IP) */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Пошук за логіном, актором, IP або деталями..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Всі ({logs.length})
              </button>
              <button
                onClick={() => setStatusFilter('SUCCESS_GROUP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === 'SUCCESS_GROUP'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Успішні
              </button>
              <button
                onClick={() => setStatusFilter('FAILED_GROUP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === 'FAILED_GROUP'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Невдалі
              </button>
              <button
                onClick={() => setStatusFilter('LOCKED_GROUP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === 'LOCKED_GROUP'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Блокування
              </button>
              <button
                onClick={() => setStatusFilter('2FA_GROUP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === '2FA_GROUP'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                2FA
              </button>
              <button
                onClick={() => setStatusFilter('SESSION_GROUP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === 'SESSION_GROUP'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Сеанси
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[11px]">
                  <th className="py-3 px-3 font-semibold">Час (UTC)</th>
                  <th className="py-3 px-3 font-semibold">Подія</th>
                  <th className="py-3 px-3 font-semibold">Хто виконав</th>
                  <th className="py-3 px-3 font-semibold">Акаунт</th>
                  <th className="py-3 px-3 font-semibold">IP власника</th>
                  <th className="py-3 px-3 font-semibold">IP дії</th>
                  <th className="py-3 px-3 font-semibold">Пристрій</th>
                  <th className="py-3 px-3 font-semibold">Деталі</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLogs.map((log) => {
                  const meta = describeSecurityEvent(log.status);
                  const badgeClass = getToneBadgeClasses(meta.tone);
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {formatUtcTimestamp(log.attemptTime)}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                        {log.actorUsername || log.username}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{log.username}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.userIpAddress || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-blue-300 whitespace-nowrap">
                        {log.ipAddress}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400 truncate max-w-[140px]" title={log.userAgent}>
                        {log.userAgent || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400 truncate max-w-xs" title={log.details}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                      Не знайдено записів аудиту за вказаними фільтрами
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SENT EMAIL LOGS */}
      {activeTab === 'emails' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                Журнал надісланих email-повідомлень (DB & Gmail SMTP)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Історія відправки листів активації, сповіщень про Brute Force, кодів 2FA та відповідей служби підтримки
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[11px]">
                  <th className="py-3 px-4 font-semibold">Час (UTC)</th>
                  <th className="py-3 px-4 font-semibold">Отримувач</th>
                  <th className="py-3 px-4 font-semibold">Акаунт</th>
                  <th className="py-3 px-4 font-semibold">Тема листа</th>
                  <th className="py-3 px-4 font-semibold">Тип</th>
                  <th className="py-3 px-4 font-semibold">Статус доставки</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {emailLogs.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {formatUtcTimestamp(m.sentAt)}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">{m.recipientEmail}</td>
                    <td className="py-2.5 px-4 text-slate-400">{m.username || '—'}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-200">{m.subject}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {m.emailType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {m.deliveryStatus === 'SENT_SMTP' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Gmail SMTP (Доставлено)
                        </span>
                      ) : m.deliveryStatus === 'LOCAL_LOG' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Локальний журнал
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          Помилка відправки
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {emailLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                      Журнал відправлених листів порожній
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SUPPORT TICKETS & INVESTIGATION */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-blue-400" />
                Звернення користувачів ({tickets.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleOpenTicket(t)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500 shadow'
                        : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {t.category}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                        }`}
                      >
                        {t.status === 'NEW' ? 'Нове' : t.status === 'IN_PROGRESS' ? 'В обробці' : 'Вирішено'}
                      </span>
                    </div>

                    <div className="mt-2 font-bold text-xs text-white">{t.subject}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">{t.description}</div>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                      <span>{t.email}</span>
                      <span>{formatUtcTimestamp(t.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              {tickets.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-500">
                  Звернень до служби безпеки наразі немає
                </div>
              )}
            </div>
          </div>

          {/* Ticket Inspection & Reply Panel */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow">
            {selectedTicket ? (
              <div className="space-y-5 animate-fadeIn">
                {/* Header */}
                <div className="border-b border-slate-800 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-blue-400 font-bold">Звернення #{selectedTicket.id}</span>
                    <span className="text-xs text-slate-400">{formatUtcTimestamp(selectedTicket.createdAt)}</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{selectedTicket.subject}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
                    <span>
                      Email: <strong className="text-slate-200">{selectedTicket.email}</strong>
                    </span>
                    {selectedTicket.username && (
                      <span>
                        Логін: <strong className="text-blue-300">@{selectedTicket.username}</strong>
                      </span>
                    )}
                    {selectedTicket.ipAddress && (
                      <span>
                        IP відправника: <code className="text-slate-300 font-mono">{selectedTicket.ipAddress}</code>
                      </span>
                    )}
                  </div>
                </div>

                {/* Ticket Message */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>

                {/* Linked Account Deep Inspection Card */}
                {selectedTicket.linkedUser && (
                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-blue-300 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        Пов'язаний обліковий запис (Розслідування інциденту)
                      </div>
                      {selectedTicket.linkedUser.isLocked && (
                        <button
                          onClick={() => handleUnlock(selectedTicket.linkedUser!.id, selectedTicket.linkedUser!.username)}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Розблокувати акаунт
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">ПІБ</div>
                        <div className="font-semibold text-white truncate">{selectedTicket.linkedUser.fullName}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Невдалі спроби</div>
                        <div className="font-semibold text-amber-300">
                          {selectedTicket.linkedUser.failedLoginAttempts || 0}/5
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Статус акаунта</div>
                        <div className="font-semibold">
                          {selectedTicket.linkedUser.isLocked ? (
                            <span className="text-rose-400">Заблоковано</span>
                          ) : (
                            <span className="text-emerald-400">Активний</span>
                          )}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Останній IP</div>
                        <div className="font-mono text-[11px] text-slate-300">
                          {selectedTicket.linkedUser.lastLoginIp || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Events for this user */}
                {selectedTicket.recentEvents && selectedTicket.recentEvents.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Останні спроби входу та події акаунта:
                    </div>
                    <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-lg bg-slate-950/40 text-[11px]">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                          {selectedTicket.recentEvents.map((ev) => (
                            <tr key={ev.id} className="hover:bg-slate-800/20">
                              <td className="py-1.5 px-3 font-mono text-[10px] text-slate-400">
                                {formatUtcTimestamp(ev.attemptTime)}
                              </td>
                              <td className="py-1.5 px-3">
                                <span className="font-semibold text-white">{ev.status}</span>
                              </td>
                              <td className="py-1.5 px-3 font-mono text-blue-300">{ev.ipAddress}</td>
                              <td className="py-1.5 px-3 text-slate-400 truncate max-w-xs">{ev.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Status & Reply Form */}
                <div className="space-y-4 pt-3 border-t border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Статус розгляду</label>
                      <select
                        value={ticketStatus}
                        onChange={(e) => setTicketStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      >
                        <option value="NEW">Нове (NEW)</option>
                        <option value="IN_PROGRESS">В обробці (IN_PROGRESS)</option>
                        <option value="RESOLVED">Вирішено (RESOLVED)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Внутрішня примітка адміна
                      </label>
                      <input
                        type="text"
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Коментар для команди підтримки..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Відповідь користувачу на Email (Gmail SMTP)</span>
                      <span className="text-[10px] text-slate-400">Буде надіслано реальний лист</span>
                    </label>
                    <textarea
                      rows={3}
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      placeholder="Доброго дня! Ваш акаунт було перевірено та розблоковано. Рекомендуємо змінити пароль..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleUpdateTicket}
                      disabled={isUpdatingTicket}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isUpdatingTicket ? 'Збереження та відправка...' : 'Зберегти та надіслати відповідь'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center space-y-2">
                <LifeBuoy className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-semibold text-slate-300">Оберіть звернення зі списку зліва</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Тут відобразяться деталі запиту, дані розслідування пов'язаного акаунта та форма відповіді через Gmail SMTP.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOUBLE-CONFIRMATION DELETE USER MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Видалення облікового запису</h3>
                <p className="text-xs text-rose-300/90">Незворотна операція безпеки</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Ви збираєтесь повністю видалити акаунт <strong>{userToDelete.username}</strong> ({userToDelete.email}).
              Для підтвердження дії введіть точний email або логін користувача, а також слово <strong>ВИДАЛИТИ</strong>.
            </p>

            <form onSubmit={handleConfirmDelete} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  1. Введіть email або логін ({userToDelete.email || userToDelete.username}):
                </label>
                <input
                  type="text"
                  value={confirmIdentifier}
                  onChange={(e) => setConfirmIdentifier(e.target.value)}
                  placeholder={userToDelete.email || userToDelete.username}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  2. Введіть слово <span className="text-rose-400 font-bold">ВИДАЛИТИ</span> великими літерами:
                </label>
                <input
                  type="text"
                  value={confirmKeyword}
                  onChange={(e) => setConfirmKeyword(e.target.value)}
                  placeholder="ВИДАЛИТИ"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={
                    isDeleting ||
                    (confirmIdentifier.trim().toLowerCase() !== (userToDelete.email || '').toLowerCase() &&
                      confirmIdentifier.trim().toLowerCase() !== userToDelete.username.toLowerCase()) ||
                    confirmKeyword.trim() !== 'ВИДАЛИТИ'
                  }
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white transition-colors shadow-lg shadow-rose-600/30"
                >
                  {isDeleting ? 'Видалення...' : 'Підтвердити видалення'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
