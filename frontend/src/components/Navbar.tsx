import React from 'react';
import { Wrench, Package, Search, Plus, Laptop, ShieldCheck, UserCheck, LogOut, ArrowLeft, Users, Shield, ShieldAlert, Mail, User } from 'lucide-react';
import type { AuthUser } from '../types';

interface NavbarProps {
  activeTab: 'orders' | 'warehouse' | 'tracking' | 'clients' | 'staff' | 'security';
  setActiveTab: (tab: 'orders' | 'warehouse' | 'tracking' | 'clients' | 'staff' | 'security') => void;
  onOpenCreateModal: () => void;
  currentUser: AuthUser;
  onLogout: () => void;
  onBackToPortal: () => void;
  onOpenInbox: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  currentUser,
  onLogout,
  onBackToPortal,
  onOpenInbox,
  onOpenProfile,
}) => {
  const isAdmin = currentUser.role === 'ROLE_ADMIN';
  const isManager = currentUser.role === 'ROLE_MANAGER';

  const getRoleBadge = (role: string) => {
    if (role === 'ROLE_ADMIN') {
      return {
        label: 'Адміністратор',
        icon: ShieldCheck,
        class: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      };
    }
    if (role === 'ROLE_MANAGER') {
      return {
        label: 'Менеджер',
        icon: UserCheck,
        class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      };
    }
    if (role === 'ROLE_USER') {
      return {
        label: 'Клієнт',
        icon: User,
        class: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
      };
    }
    return {
      label: 'Прийомщик',
      icon: Wrench,
      class: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
  };

  const badge = getRoleBadge(currentUser.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="sticky top-0 z-30 bg-[#111827]/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onBackToPortal}
              title="Перейти на клієнтський сайт"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60 flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">На сайт</span>
            </button>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('orders')}>
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                RepairHub <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">CRM</span>
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 min-w-0">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>Замовлення</span>
            </button>

            <button
              onClick={() => setActiveTab('warehouse')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'warehouse'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Склад</span>
            </button>

            {(isAdmin || isManager) && (
              <button
                onClick={() => setActiveTab('clients')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'clients'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Клієнти</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'staff'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Персонал</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('security')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'security'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Аудит безпеки</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === 'tracking'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Трекінг</span>
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenInbox}
              title="Поштова скринька (Mock Mail)"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700/60 transition-colors flex items-center gap-1 text-xs"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Пошта</span>
            </button>

            <button
              onClick={onOpenProfile}
              title="Профіль безпеки та 2FA"
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition ${badge.class}`}
            >
              <BadgeIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-[110px]">{currentUser.fullName}</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Прийом техніки</span>
              <span className="sm:hidden">Прийом</span>
            </button>

            <button
              onClick={onLogout}
              title="Вийти з CRM (Logout)"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700/60 transition-colors flex items-center gap-1 text-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Вийти</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
