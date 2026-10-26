import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Unlock, RefreshCw, Activity, CheckCircle, XCircle, Search } from 'lucide-react';
import { api } from '../services/api';
import type { SecurityAuditLog, StaffMember } from '../types';

export const SecurityAuditView: React.FC = () => {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const [logsData, staffData] = await Promise.all([
        api.getSecurityAuditLogs(),
        api.getStaff()
      ]);
      setLogs(logsData);
      setStaff(staffData);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = async (id: number, username: string) => {
    try {
      await api.lockUser(id);
      setActionMessage(`Користувача ${username} успішно заблоковано`);
      loadData();
    } catch {
      setActionMessage(`Помилка блокування ${username}`);
    }
  };

  const handleUnlock = async (id: number, username: string) => {
    try {
      await api.unlockUser(id);
      setActionMessage(`Користувача ${username} успішно розблоковано`);
      loadData();
    } catch {
      setActionMessage(`Помилка розблокування ${username}`);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAttempts = logs.length;
  const successAttempts = logs.filter(l => l.status === 'SUCCESS').length;
  const failedAttempts = logs.filter(l => l.status === 'FAILED').length;
  const lockedEvents = logs.filter(l => l.status === 'LOCKED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-400" />
            <span>Аудит безпеки та моніторинг Brute Force</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Журнал реєстрації подій автентифікації, спроб несанкціонованого доступу та керування блокуваннями
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Оновити дані</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-indigo-400 hover:text-white">✕</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Всього спроб входу</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalAttempts}</div>
          <div className="text-[11px] text-slate-500 mt-1">Зафіксовано системою</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Успішні входи</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{successAttempts}</div>
          <div className="text-[11px] text-slate-500 mt-1">Успішна авторизація</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Невдалі спроби</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{failedAttempts}</div>
          <div className="text-[11px] text-slate-500 mt-1">Невірний пароль / логін</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Заблоковані запити</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{lockedEvents}</div>
          <div className="text-[11px] text-slate-500 mt-1">Brute Force захист (15 хв)</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Керування статусом блокування облікових записів</span>
          </h3>
          <span className="text-xs text-slate-400">Політика: макс. 5 спроб → тимчасове блокування</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Користувач</th>
                <th className="py-2.5 px-3">ПІБ</th>
                <th className="py-2.5 px-3">Роль</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Помилок входу</th>
                <th className="py-2.5 px-3">Статус</th>
                <th className="py-2.5 px-3 text-right">Дія</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {staff.map((user) => {
                const isLocked = user.isLocked || (user.failedLoginAttempts && user.failedLoginAttempts >= 5);
                return (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-white font-medium">{user.username}</td>
                    <td className="py-2.5 px-3 text-slate-300">{user.fullName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px] border border-slate-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{user.email || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono font-semibold ${user.failedLoginAttempts && user.failedLoginAttempts > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {user.failedLoginAttempts || 0} / 5
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" />
                          <span>Заблоковано</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          <span>Активний</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isLocked ? (
                        <button
                          onClick={() => handleUnlock(user.id, user.username)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition shadow"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>Розблокувати</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLock(user.id, user.username)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-medium text-[11px] transition shadow"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Заблокувати</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <span>Журнал останніх спроб автентифікації</span>
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Пошук за логіном або IP..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Всі статуси</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="LOCKED">LOCKED</option>
              <option value="TWO_FACTOR_REQUIRED">TWO_FACTOR_REQUIRED</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Час</th>
                <th className="py-2.5 px-3">Логін</th>
                <th className="py-2.5 px-3">IP-адреса</th>
                <th className="py-2.5 px-3">Статус</th>
                <th className="py-2.5 px-3">Деталі</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    Жодного запису не знайдено
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const getStatusBadge = () => {
                    switch (log.status) {
                      case 'SUCCESS':
                        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">SUCCESS</span>;
                      case 'FAILED':
                        return <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">FAILED</span>;
                      case 'LOCKED':
                        return <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">LOCKED</span>;
                      case 'TWO_FACTOR_REQUIRED':
                        return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">2FA REQUIRED</span>;
                      default:
                        return <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">{log.status}</span>;
                    }
                  };

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {log.attemptTime ? log.attemptTime.replace('T', ' ').substring(0, 19) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-white">{log.username}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{log.ipAddress}</td>
                      <td className="py-2.5 px-3">{getStatusBadge()}</td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={log.details}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
