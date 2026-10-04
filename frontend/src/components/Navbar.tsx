import React from 'react';
import { Wrench, Package, Search, Plus, Laptop, ShieldCheck, UserCheck, LogOut, ArrowLeft } from 'lucide-react';
import type { AuthUser } from '../types';

interface NavbarProps {
  activeTab: 'orders' | 'warehouse' | 'tracking';
  setActiveTab: (tab: 'orders' | 'warehouse' | 'tracking') => void;
  onOpenCreateModal: () => void;
  currentUser: AuthUser;
  onLogout: () => void;
  onBackToPortal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  currentUser,
  onLogout,
  onBackToPortal,
}) => {
  const isManagerOrAdmin = currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_MANAGER';

  const getRoleBadge = (role: string) => {
    if (role === 'ROLE_ADMIN') {
      return {
        label: 'Адміністратор',
        icon: ShieldCheck,
        class: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      };
    }
    if (role === 'ROLE_MANAGER') {
      return {
        label: 'Менеджер',
        icon: UserCheck,
        class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      };
    }
    return {
      label: 'Майстер-інженер',
      icon: Wrench,
      class: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    };
  };

  const badge = getRoleBadge(currentUser.role);
  const BadgeIcon = badge.icon;

  return (
    <header className="sticky top-0 z-30 bg-[#111827]/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPortal}
              title="Перейти на клієнтський сайт"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60 flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">На сайт</span>
            </button>

            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('orders')}>
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  RepairHub <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">CRM</span>
                </span>
              </div>
            </div>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              <span>Замовлення</span>
            </button>

            {isManagerOrAdmin && (
              <button
                onClick={() => setActiveTab('warehouse')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'warehouse'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                <span>Склад деталей</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'tracking'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Трекінг</span>
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <div className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium ${badge.class}`}>
              <BadgeIcon className="h-3.5 w-3.5 shrink-0" />
              <span>{currentUser.fullName}</span>
              <span className="text-[10px] opacity-75 font-mono">({badge.label})</span>
            </div>

            <button
              onClick={onOpenCreateModal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
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
              <span className="hidden lg:inline">Вийти</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
