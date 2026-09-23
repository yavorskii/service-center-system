import React from 'react';
import type { Order } from '../types';
import { ClipboardList, Clock, CheckCircle2, DollarSign } from 'lucide-react';

interface StatsCardsProps {
  orders: Order[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ orders }) => {
  const totalOrders = orders.length;
  const inProgress = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'IN_DIAGNOSTICS').length;
  const ready = orders.filter(o => o.status === 'READY_FOR_PICKUP').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);

  const stats = [
    {
      label: 'Всього замовлень',
      value: totalOrders,
      icon: ClipboardList,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'В роботі / Діагностика',
      value: inProgress,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Готові до видачі',
      value: ready,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Загальний обіг',
      value: `${totalRevenue.toLocaleString('uk-UA')} ₴`,
      icon: DollarSign,
      color: 'text-slate-300',
      bg: 'bg-slate-800'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-800 bg-[#111827] flex items-center justify-between transition-colors hover:border-slate-700"
          >
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{item.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-sans">{item.value}</p>
            </div>
            <div className={`p-2.5 rounded-lg ${item.bg} ${item.color}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
