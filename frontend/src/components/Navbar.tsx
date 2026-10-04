import React, { useState, useRef, useEffect } from 'react';
import { Wrench, Package, Search, Plus, Laptop, ShieldCheck, User, ChevronDown, Check } from 'lucide-react';
import type { AppRole } from '../types';

interface NavbarProps {
  activeTab: 'orders' | 'warehouse' | 'tracking';
  setActiveTab: (tab: 'orders' | 'warehouse' | 'tracking') => void;
  onOpenCreateModal: () => void;
  currentRole: AppRole;
  onRoleChange: (role: AppRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  currentRole,
  onRoleChange,
}) => {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRole = (role: AppRole) => {
    onRoleChange(role);
    setRoleMenuOpen(false);
    // If regular user was on warehouse tab, switch to orders
    if (role === 'USER' && activeTab === 'warehouse') {
      setActiveTab('orders');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#111827]/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('orders')}>
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                RepairHub <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">CRM</span>
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">Система управління сервісним центром</p>
            </div>
          </div>

          {/* Navigation Tabs */}
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
              <span>{currentRole === 'ADMIN' ? 'Замовлення' : 'Мої ремонти'}</span>
            </button>

            {/* Warehouse is only visible for ADMIN */}
            {currentRole === 'ADMIN' && (
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
              <span>Онлайн-трекінг</span>
            </button>
          </nav>

          {/* User Role Switcher & Primary CTA */}
          <div className="flex items-center gap-2.5">
            {/* Interactive Role Switcher Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  currentRole === 'ADMIN'
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-300 hover:bg-blue-900/50'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                }`}
                title="Натисніть для зміни ролі (Адмін / Користувач)"
              >
                {currentRole === 'ADMIN' ? (
                  <>
                    <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="hidden sm:inline font-medium">Адміністратор: <b className="text-white font-semibold">Владислав Я.</b></span>
                    <span className="sm:hidden font-semibold text-white">Адмін</span>
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="hidden sm:inline font-medium">Клієнт: <b className="text-white font-semibold">Іван Сидоренко</b></span>
                    <span className="sm:hidden font-semibold text-white">Іван С.</span>
                  </>
                )}
                <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
              </button>

              {/* Role Selection Dropdown Menu */}
              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Оберіть профіль доступу
                  </div>

                  {/* Option 1: Administrator */}
                  <button
                    type="button"
                    onClick={() => handleSelectRole('ADMIN')}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-slate-800/70 transition-colors ${
                      currentRole === 'ADMIN' ? 'bg-blue-600/10' : ''
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5 shrink-0">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Адміністратор (Владислав Я.)</span>
                        {currentRole === 'ADMIN' && <Check className="h-3.5 w-3.5 text-blue-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Режим співробітника: доступ до замовлень усіх клієнтів, складу та каси.
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Regular User / Client */}
                  <button
                    type="button"
                    onClick={() => handleSelectRole('USER')}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-slate-800/70 transition-colors ${
                      currentRole === 'USER' ? 'bg-emerald-600/10' : ''
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5 shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Клієнт (Іван Сидоренко)</span>
                        {currentRole === 'USER' && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        Особистий кабінет: перегляд тільки власних пристроїв, статусів та трекінгу.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={onOpenCreateModal}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-95 ${
                currentRole === 'ADMIN'
                  ? 'bg-blue-600 hover:bg-blue-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{currentRole === 'ADMIN' ? 'Прийом техніки' : 'Подати заявку'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
