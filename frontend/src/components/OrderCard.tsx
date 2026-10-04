import React, { useState } from 'react';
import type { Order, OrderStatus, AppRole } from '../types';
import { Smartphone, Laptop, Tablet, Phone, User, Check, Copy, ArrowRight, MoreHorizontal, Printer, Search, Wrench } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: number, newStatus: OrderStatus) => void;
  currentRole?: AppRole;
  onSelectTracking?: (trackingCode: string) => void;
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

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onStatusChange, 
  currentRole = 'ADMIN',
  onSelectTracking 
}) => {
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

  const handleCopyTrack = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(order.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 shadow-sm relative group">
      <div>
        {/* Top: Header with Ticket Number + Tracking + Status Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-white tracking-tight">
                {order.orderNumber}
              </span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded font-mono ${
                order.priority === 'URGENT' 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : order.priority === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {order.priority === 'URGENT' ? 'Терміново' : order.priority === 'HIGH' ? 'Високий' : 'Звичайний'}
              </span>
            </div>

            {/* Clickable Tracking Code */}
            <button
              onClick={handleCopyTrack}
              title="Натисніть для копіювання трек-коду"
              className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 font-mono transition-colors group/track"
            >
              <span>{order.trackingCode}</span>
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3 text-slate-500 group-hover/track:text-blue-400 transition-colors" />
              )}
            </button>
          </div>

          {/* Unified Compact Status Badge */}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-md border shrink-0 ${statusInfo.badgeClass}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Device Information */}
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-slate-800 text-slate-300">
            <DeviceIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-200 truncate">
              {order.device.brand} {order.device.model}
            </h4>
            <span className="text-[11px] text-slate-500 block truncate">
              {order.device.deviceType} {order.device.serialNumber ? `• S/N: ${order.device.serialNumber}` : ''}
            </span>
          </div>
        </div>

        {/* Defect Description */}
        <div className="bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/80 mb-3">
          <span className="text-[10px] text-slate-500 font-medium uppercase block mb-1">
            Заявлена несправність
          </span>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {order.defectDescription}
          </p>
          {order.diagnosticsNotes && (
            <p className="text-[11px] text-amber-300/80 mt-1 border-t border-slate-800/80 pt-1 italic line-clamp-1">
              Діагностика: {order.diagnosticsNotes}
            </p>
          )}
        </div>

        {/* Client Contacts (Admin) vs Assigned Technician & Dates (Client) */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3 pt-1">
          {currentRole === 'ADMIN' ? (
            <>
              <div className="flex items-center gap-1.5 truncate">
                <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{order.client.fullName}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate justify-end">
                <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="truncate font-mono">{order.client.phone}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 truncate">
                <Wrench className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                <span className="truncate text-slate-300">Майстер: <b className="text-white font-medium">{order.technicianName || 'Тарас Бондаренко'}</b></span>
              </div>
              <div className="flex items-center gap-1.5 truncate justify-end text-[11px] text-slate-500">
                <span>Прийом: {order.createdAt.substring(0, 10)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer: Price + Actions (Role-dependent) */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 mt-auto">
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-medium">До сплати</span>
          <span className="text-base font-bold text-white font-mono">{order.totalCost} ₴</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Admin Mode Actions: Status advancement button */}
          {currentRole === 'ADMIN' ? (
            <>
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
                      onClick={() => { 
                        navigator.clipboard.writeText(order.trackingCode); 
                        alert(`Трек-код ${order.trackingCode} скопійовано!`); 
                        setMenuOpen(false); 
                      }}
                      className="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Скопіювати трек-код</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* User / Client Mode Actions: Online Tracking button */
            <button
              onClick={() => onSelectTracking ? onSelectTracking(order.trackingCode) : handleCopyTrack()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Трекінг статусу</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
