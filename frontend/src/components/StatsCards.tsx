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
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      label: 'В процесі ремонту',
      value: inProgress,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    },
    {
      label: 'Готові до видачі',
      value: ready,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      label: 'Загальний обіг',
      value: `${totalRevenue.toLocaleString('uk-UA')} ₴`,
      icon: DollarSign,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border bg-slate-900/60 backdrop-blur ${item.bg} flex items-center justify-between transition-all hover:border-slate-700`}
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{item.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-1">{item.value}</p>
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
