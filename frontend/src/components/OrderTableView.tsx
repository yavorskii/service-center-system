import React from 'react';
import type { Order, OrderStatus, AuthUser } from '../types';
import { statusConfig } from './OrderCard';
import { ArrowRight, Check, Copy, Package, Trash2, Wrench } from 'lucide-react';

interface OrderTableViewProps {
  orders: Order[];
  currentUser: AuthUser;
  onStatusChange: (orderId: number, newStatus: OrderStatus) => void;
  onOpenDetails: (order: Order) => void;
  onDeleteOrder?: (orderId: number) => void;
}

export const OrderTableView: React.FC<OrderTableViewProps> = ({
  orders,
  currentUser,
  onStatusChange,
  onOpenDetails,
  onDeleteOrder
}) => {
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  const isAdmin = currentUser.role === 'ROLE_ADMIN';
  const isTechnician = currentUser.role === 'ROLE_TECHNICIAN';

  const handleCopy = (e: React.MouseEvent, id: number, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">№ Замовлення</th>
              <th className="py-3 px-4">Трек-код</th>
              <th className="py-3 px-4">Клієнт / Телефон</th>
              <th className="py-3 px-4">Пристрій</th>
              <th className="py-3 px-4">Склад / Роботи</th>
              <th className="py-3 px-4 text-center">Статус</th>
              <th className="py-3 px-4 text-right">Сума</th>
              <th className="py-3 px-4 text-right">Дія</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {orders.map(order => {
              const statusInfo = statusConfig[order.status];
              const partsQty = order.parts.reduce((s, p) => s + p.quantity, 0);
              const canAdvance =
                statusInfo.nextStatus &&
                !(isTechnician && order.status === 'READY_FOR_PICKUP') &&
                !(isTechnician && order.status === 'PENDING_APPROVAL');

              return (
                <tr
                  key={order.id}
                  onClick={() => onOpenDetails(order)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">
                    <button
                      onClick={e => handleCopy(e, order.id, order.trackingCode)}
                      title="Скопіювати трек-код"
                      className="text-slate-400 hover:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                      <span>{order.trackingCode}</span>
                      {copiedId === order.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-slate-500" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{order.client.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{order.client.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-200">
                      {order.device.brand} {order.device.model}
                    </span>
                    <span className="text-[11px] text-slate-500 block">{order.device.deviceType}</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[11px]">
                        <Package className="h-3 w-3" />
                        {partsQty} шт.
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[11px]">
                        <Wrench className="h-3 w-3" />
                        {order.services.length}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                    {order.totalCost} ₴
                  </td>
                  <td
                    className="py-3 px-4 text-right whitespace-nowrap"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenDetails(order)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] inline-flex items-center gap-1"
                      >
                        <Wrench className="h-3 w-3 text-indigo-400" />
                        <span>Ремонт</span>
                      </button>

                      {canAdvance && (
                        <button
                          onClick={() => onStatusChange(order.id, statusInfo.nextStatus!)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition-all inline-flex items-center gap-1 active:scale-95"
                        >
                          <span>{statusInfo.nextActionLabel}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}

                      {isAdmin && onDeleteOrder && (
                        <button
                          onClick={() => onDeleteOrder(order.id)}
                          title="Видалити замовлення"
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
