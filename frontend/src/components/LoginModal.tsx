import React, { useState } from 'react';
import { X, Lock, ShieldCheck, UserCheck, Wrench, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { AuthUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('admin_oleg');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Введіть логін та пароль");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await api.login(username.trim(), password.trim());
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Помилка автентифікації");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Вхід для персоналу</h3>
              <p className="text-[11px] text-slate-400">Внутрішня панель управління RepairHub CRM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Логін співробітника
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin_oleg"
              className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Пароль
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Швидкий вхід для демонстрації:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin_oleg', 'admin123')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'admin_oleg'
                    ? 'border-blue-500/60 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400 mb-1" />
                <div className="text-[11px] font-semibold">Адмін</div>
                <div className="text-[9px] text-slate-500 font-mono">admin_oleg</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('mgr_alina', 'manager123')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'mgr_alina'
                    ? 'border-blue-500/60 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-400 mb-1" />
                <div className="text-[11px] font-semibold">Менеджер</div>
                <div className="text-[9px] text-slate-500 font-mono">mgr_alina</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('tech_taras', 'tech123')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  username === 'tech_taras'
                    ? 'border-blue-500/60 bg-blue-500/10 text-white'
                    : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Wrench className="h-3.5 w-3.5 text-amber-400 mb-1" />
                <div className="text-[11px] font-semibold">Майстер</div>
                <div className="text-[9px] text-slate-500 font-mono">tech_taras</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Перевірка облікових даних...' : 'Увійти в CRM систему'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
