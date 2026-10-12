import React from 'react';
import type { Order, AuthUser } from '../types';
import { ClipboardList, Clock, CheckCircle2, DollarSign, Wrench, Search, PackageCheck } from 'lucide-react';

interface StatsCardsProps {
  orders: Order[];
  currentUser: AuthUser;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ orders, currentUser }) => {
  const totalOrders = orders.length;
  const inProgress = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'IN_DIAGNOSTICS' || o.status === 'PENDING_APPROVAL').length;
  const ready = orders.filter(o => o.status === 'READY_FOR_PICKUP').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);

  const getStats = () => {
    if (currentUser.role === 'ROLE_TECHNICIAN') {
      const inDiag = orders.filter(o => o.status === 'NEW' || o.status === 'IN_DIAGNOSTICS').length;
      const inRepair = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'PENDING_APPROVAL').length;
      const done = orders.filter(o => o.status === 'READY_FOR_PICKUP' || o.status === 'COMPLETED').length;

      return [
        {
          label: 'Всього замовлень',
          value: totalOrders,
          icon: ClipboardList,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10'
        },
        {
          label: 'На діагностику',
          value: inDiag,
          icon: Search,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10'
        },
        {
          label: 'В процесі ремонту',
          value: inRepair,
          icon: Wrench,
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10'
        },
        {
          label: 'Відремонтовано',
          value: done,
          icon: PackageCheck,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10'
        }
      ];
    }

    if (currentUser.role === 'ROLE_MANAGER') {
      const pendingApproval = orders.filter(o => o.status === 'PENDING_APPROVAL' || o.status === 'IN_DIAGNOSTICS').length;

      return [
        {
          label: 'Всього замовлень',
          value: totalOrders,
          icon: ClipboardList,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10'
        },
        {
          label: 'Потребують узгодження',
          value: pendingApproval,
          icon: Clock,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10'
        },
        {
          label: 'Очікують видачі клієнту',
          value: ready,
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10'
        },
        {
          label: 'Каса сервісу',
          value: `${totalRevenue.toLocaleString('uk-UA')} ₴`,
          icon: DollarSign,
          color: 'text-emerald-300',
          bg: 'bg-emerald-500/10'
        }
      ];
    }

    return [
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
  };

  const stats = getStats();

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
