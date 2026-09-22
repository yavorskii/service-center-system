import React from 'react';
import type { Order, OrderStatus } from '../types';
import { Smartphone, Laptop, Tablet, Phone, User, Calendar, Check, Copy, ArrowRight } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: number, newStatus: OrderStatus) => void;
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  NEW: { label: 'Нове', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  IN_DIAGNOSTICS: { label: 'Діагностика', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  PENDING_APPROVAL: { label: 'Погодження', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  IN_PROGRESS: { label: 'В роботі', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
  READY_FOR_PICKUP: { label: 'Готово до видачі', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  COMPLETED: { label: 'Видано', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/30' },
  CANCELED: { label: 'Скасовано', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
};

const priorityConfig = {
  LOW: { label: 'Низький', color: 'text-slate-400' },
  MEDIUM: { label: 'Звичайний', color: 'text-blue-400' },
  HIGH: { label: 'Високий', color: 'text-amber-400' },
  URGENT: { label: 'Терміново!', color: 'text-rose-400' },
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusChange }) => {
  const [copied, setCopied] = React.useState(false);

  const getDeviceIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('смартфон') || lower.includes('телефон')) return Smartphone;
    if (lower.includes('планшет')) return Tablet;
    return Laptop;
  };

  const DeviceIcon = getDeviceIcon(order.device.deviceType);
  const statusInfo = statusConfig[order.status];
  const priorityInfo = priorityConfig[order.priority];

  const handleCopyTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-md group">
      {/* Header: Device & Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-800 text-indigo-400 border border-slate-700">
            <DeviceIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                {order.device.brand} {order.device.model}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="font-mono text-slate-300">{order.orderNumber}</span>
              <span>•</span>
              <button
                onClick={handleCopyTrack}
                title="Копіювати трек-код"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
              >
                <span>{order.trackingCode}</span>
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base font-bold text-white">{order.totalCost} ₴</span>
          <p className="text-[11px] text-slate-400">{priorityInfo.label}</p>
        </div>
      </div>

      {/* Defect Description */}
      <div className="bg-slate-950/60 rounded-lg p-2.5 mb-3 border border-slate-800/80 text-xs">
        <p className="text-slate-300 line-clamp-2">
          <b className="text-slate-400">Дефект:</b> {order.defectDescription}
        </p>
        {order.diagnosticsNotes && (
          <p className="text-amber-400/90 mt-1 line-clamp-1 border-t border-slate-800/80 pt-1">
            <b>Майстер:</b> {order.diagnosticsNotes}
          </p>
        )}
      </div>

      {/* Meta info: Client & Technician */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60 mb-3">
        <div className="flex items-center gap-1.5 truncate">
          <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{order.client.fullName}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate justify-end">
          <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="truncate font-mono">{order.client.phone}</span>
        </div>
      </div>

      {/* Quick Action Buttons for Status Flow */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/40">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {order.createdAt}
        </span>

        <div className="flex items-center gap-1.5">
          {order.status === 'NEW' && (
            <button
              onClick={() => onStatusChange(order.id, 'IN_DIAGNOSTICS')}
              className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1 font-medium transition-all"
            >
              На діагностику <ArrowRight className="h-3 w-3" />
            </button>
          )}

          {order.status === 'IN_DIAGNOSTICS' && (
            <button
              onClick={() => onStatusChange(order.id, 'IN_PROGRESS')}
              className="text-xs px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 flex items-center gap-1 font-medium transition-all"
            >
              В роботу <ArrowRight className="h-3 w-3" />
            </button>
          )}

          {order.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onStatusChange(order.id, 'READY_FOR_PICKUP')}
              className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1 font-medium transition-all"
            >
              Готово до видачі <Check className="h-3 w-3" />
            </button>
          )}

          {order.status === 'READY_FOR_PICKUP' && (
            <button
              onClick={() => onStatusChange(order.id, 'COMPLETED')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 flex items-center gap-1 font-medium transition-all"
            >
              Видати клієнту
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
