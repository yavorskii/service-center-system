import React from 'react';
import type { Order, OrderStatus } from '../types';
import { statusConfig } from './OrderCard';
import { ArrowRight, Check, Copy } from 'lucide-react';

interface OrderTableViewProps {
  orders: Order[];
  onStatusChange: (orderId: number, newStatus: OrderStatus) => void;
}

export const OrderTableView: React.FC<OrderTableViewProps> = ({ orders, onStatusChange }) => {
  const [copiedId, setCopiedId] = React.useState<number | null>(null);

  const handleCopy = (id: number, code: string) => {
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
              <th className="py-3 px-4">Несправність</th>
              <th className="py-3 px-4 text-center">Статус</th>
              <th className="py-3 px-4 text-right">Сума</th>
              <th className="py-3 px-4 text-right">Дія</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status];
              return (
                <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-4 font-mono whitespace-nowrap">
                    <button
                      onClick={() => handleCopy(order.id, order.trackingCode)}
                      title="Скопіювати"
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
                  <td className="py-3 px-4 max-w-xs truncate text-slate-400" title={order.defectDescription}>
                    {order.defectDescription}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                    {order.totalCost} ₴
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    {statusInfo.nextStatus ? (
                      <button
                        onClick={() => onStatusChange(order.id, statusInfo.nextStatus!)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition-all inline-flex items-center gap-1"
                      >
                        <span>{statusInfo.nextActionLabel}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">—</span>
                    )}
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
