import React from 'react';
import { Wrench, Package, Search, Plus, Laptop, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'orders' | 'warehouse' | 'tracking';
  setActiveTab: (tab: 'orders' | 'warehouse' | 'tracking') => void;
  onOpenCreateModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
}) => {
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
              <span>Замовлення</span>
            </button>

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

          {/* User profile & CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
              <UserCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Приймальник: <b className="text-white">Аліна К.</b></span>
            </div>

            <button
              onClick={onOpenCreateModal}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Прийом техніки</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
