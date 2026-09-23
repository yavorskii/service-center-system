import React, { useState } from 'react';
import type { Order, OrderStatus } from '../types';
import { Smartphone, Laptop, Tablet, Phone, User, Check, Copy, ArrowRight, MoreHorizontal, Printer } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: number, newStatus: OrderStatus) => void;
}

export const statusConfig: Record<OrderStatus, { label: string; badgeClass: string; nextStatus?: OrderStatus; nextActionLabel?: string }> = {
  NEW: { 
    label: 'Нове', 
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    nextStatus: 'IN_DIAGNOSTICS',
    nextActionLabel: 'На діагностику'
  },
  IN_DIAGNOSTICS: { 
    label: 'Діагностика', 
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    nextStatus: 'IN_PROGRESS',
    nextActionLabel: 'В роботу'
  },
  PENDING_APPROVAL: { 
    label: 'Узгодження', 
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    nextStatus: 'IN_PROGRESS',
    nextActionLabel: 'Погоджено'
  },
  IN_PROGRESS: { 
    label: 'В роботі', 
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    nextStatus: 'READY_FOR_PICKUP',
    nextActionLabel: 'Готово до видачі'
  },
  READY_FOR_PICKUP: { 
    label: 'Готово до видачі', 
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    nextStatus: 'COMPLETED',
    nextActionLabel: 'Видати клієнту'
  },
  COMPLETED: { 
    label: 'Видано', 
    badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20' 
  },
  CANCELED: { 
    label: 'Скасовано', 
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
  },
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusChange }) => {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const getDeviceIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('смартфон') || lower.includes('телефон')) return Smartphone;
    if (lower.includes('планшет')) return Tablet;
    return Laptop;
  };

  const DeviceIcon = getDeviceIcon(order.device.deviceType);
  const statusInfo = statusConfig[order.status];

  const handleCopyTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-sm">
      <div>
        {/* Header: Left Device Icon + Name, Right ONLY Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-slate-800/80 text-blue-400 border border-slate-700/50 shrink-0">
              <DeviceIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">
                {order.device.brand} {order.device.model}
              </h4>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                <span>{order.orderNumber}</span>
                <span>•</span>
                <button
                  onClick={handleCopyTrack}
                  title="Скопіювати трек-код"
                  className="flex items-center gap-1 text-slate-400 hover:text-blue-400 transition-colors"
                >
                  <span>{order.trackingCode}</span>
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>

          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusInfo.badgeClass}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Defect Block */}
        <div className="bg-slate-800/40 border border-slate-800/60 rounded-lg p-2.5 mb-2.5 text-xs text-slate-300">
          <p className="line-clamp-2">
            <span className="text-slate-400 font-medium">Дефект:</span> {order.defectDescription}
          </p>

          {/* Technician diagnostic note with subtle left border accent */}
          {order.diagnosticsNotes && (
            <div className="border-l-2 border-amber-500 bg-slate-800/30 pl-2.5 py-1 mt-2 rounded-r text-[11px] text-slate-300">
              <span className="text-slate-400 font-medium">Майстер:</span> {order.diagnosticsNotes}
            </div>
          )}
        </div>

        {/* Client & Metadata Row */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3 pt-1">
          <div className="flex items-center gap-1.5 truncate">
            <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{order.client.fullName}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate justify-end">
            <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate font-mono">{order.client.phone}</span>
          </div>
        </div>
      </div>

      {/* Footer: Price prominent + Unified Primary Button + Quick Actions (···) */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-auto">
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-medium">До сплати</span>
          <span className="text-base font-bold text-white font-mono">{order.totalCost} ₴</span>
        </div>

        <div className="flex items-center gap-1.5">
          {statusInfo.nextStatus && (
            <button
              onClick={() => onStatusChange(order.id, statusInfo.nextStatus!)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1 active:scale-95"
            >
              <span>{statusInfo.nextActionLabel}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          )}

          {/* More options menu button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              title="Додаткові дії"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div 
                className="absolute right-0 bottom-full mb-1 w-44 bg-slate-900 border border-slate-700/80 rounded-lg shadow-xl py-1 z-20 text-xs"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => { alert(`Друк квитанції для ${order.orderNumber}`); setMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-400" />
                  <span>Друк квитанції</span>
                </button>
                <button
                  onClick={() => { alert(`Копіювати посилання трекінгу: https://service.ua/track/${order.trackingCode}`); setMenuOpen(false); }}
                  className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Посилання для клієнта</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
