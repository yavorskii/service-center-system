import React from 'react';
import { Wrench, Package, Search, PlusCircle, Laptop, ShieldCheck } from 'lucide-react';

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
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('orders')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                RepairHub <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">v19</span>
              </span>
              <p className="text-xs text-slate-400 hidden sm:block">ІС Управління замовленнями сервісного центру</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Laptop className="h-4 w-4" />
              <span>Замовлення</span>
            </button>

            <button
              onClick={() => setActiveTab('warehouse')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'warehouse'
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Склад</span>
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'tracking'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Онлайн-трекінг</span>
            </button>
          </nav>

          {/* Actions & Role */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Менеджер: <b>Аліна К.</b></span>
            </div>

            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Нове замовлення</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
