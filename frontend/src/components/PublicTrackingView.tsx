import React, { useState } from 'react';
import type { Order, OrderStatus } from '../types';
import { Search, CheckCircle2, Clock, AlertCircle, Wrench, Laptop } from 'lucide-react';

interface PublicTrackingViewProps {
  onSearch: (code: string) => Promise<Order | null>;
}

const statusSteps: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'NEW', label: 'Прийом', desc: 'Зареєстровано в базі' },
  { key: 'IN_DIAGNOSTICS', label: 'Діагностика', desc: 'Тестування дефектів' },
  { key: 'PENDING_APPROVAL', label: 'Узгодження', desc: 'Погодження кошторису' },
  { key: 'IN_PROGRESS', label: 'Ремонт', desc: 'Відновлення та монтаж' },
  { key: 'READY_FOR_PICKUP', label: 'Готово', desc: 'Контроль якості пройдено' },
  { key: 'COMPLETED', label: 'Видано', desc: 'Передано клієнту' },
];

export const PublicTrackingView: React.FC<PublicTrackingViewProps> = ({ onSearch }) => {
  const [trackCode, setTrackCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackCode.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const result = await onSearch(trackCode.trim());
      setOrder(result);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepKey: OrderStatus, currentStatus: OrderStatus) => {
    const orderIndex = statusSteps.findIndex(s => s.key === currentStatus);
    const stepIndex = statusSteps.findIndex(s => s.key === stepKey);

    if (currentStatus === 'CANCELED') return 'canceled';
    if (stepIndex < orderIndex) return 'completed';
    if (stepIndex === orderIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* Search Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
          <Wrench className="h-3.5 w-3.5" /> Онлайн-трекінг ремонту
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Перевірка статусу виконання замовлення
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
          Введіть трек-код із квитанції (наприклад, <code className="text-blue-400 font-mono">TRK-B2C44E</code> або <code className="text-blue-400 font-mono">TRK-A8F91B</code>)
        </p>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="mt-5 flex max-w-md mx-auto gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Введіть трек-код..."
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-[#111827] border border-slate-800 rounded-lg text-white placeholder:text-slate-500 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shrink-0"
          >
            {loading ? 'Пошук...' : 'Перевірити'}
          </button>
        </form>
      </div>

      {/* Result Display */}
      {searched && !order && !loading && (
        <div className="text-center p-6 rounded-xl bg-[#111827] border border-slate-800 max-w-md mx-auto">
          <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white">Замовлення не знайдено</h4>
          <p className="text-xs text-slate-400 mt-1">
            Перевірте правильність трек-коду або зверніться до приймальника сервісного центру.
          </p>
        </div>
      )}

      {order && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-in fade-in duration-200">
          {/* Card Top */}
          <div className="p-5 border-b border-slate-800 bg-[#0B0F19]/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    {order.device.brand} {order.device.model}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {order.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Клієнт: <b>{order.client.fullName}</b> • Дата прийому: {order.createdAt}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Сума до сплати</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">{order.totalCost} ₴</span>
            </div>
          </div>

          {/* Stepper / Timeline */}
          <div className="p-5 border-b border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {statusSteps.map((step, idx) => {
                const state = getStepStatus(step.key, order.status);
                return (
                  <div key={idx} className="relative flex flex-col items-center text-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center border mb-1.5 transition-all ${
                        state === 'completed'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                          : state === 'current'
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300 ring-2 ring-blue-500/30'
                          : 'bg-[#0B0F19] border-slate-800 text-slate-600'
                      }`}
                    >
                      {state === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : state === 'current' ? (
                        <Clock className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-200">{step.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">{step.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details breakdown */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Діагностика та опис
              </h4>
              <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-3 space-y-2">
                <div>
                  <span className="text-slate-500 block">Несправність:</span>
                  <p className="text-slate-200 mt-0.5">{order.defectDescription}</p>
                </div>
                {order.diagnosticsNotes && (
                  <div className="pt-2 border-t border-slate-800 border-l-2 border-amber-500 pl-2">
                    <span className="text-slate-400 block font-medium">Висновок інженера:</span>
                    <p className="text-slate-300 mt-0.5">{order.diagnosticsNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Калькуляція робіт та деталей
              </h4>
              <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-3 space-y-1.5">
                {order.services.map((s, i) => (
                  <div key={i} className="flex justify-between py-0.5 border-b border-slate-800/40">
                    <span className="text-slate-300">{s.serviceName}</span>
                    <span className="font-mono text-slate-200">{s.price} ₴</span>
                  </div>
                ))}
                {order.parts.map((p, i) => (
                  <div key={i} className="flex justify-between py-0.5 border-b border-slate-800/40">
                    <span className="text-slate-300">{p.partName} ({p.quantity} шт.)</span>
                    <span className="font-mono text-slate-200">{p.unitPrice * p.quantity} ₴</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-1.5 text-white">
                  <span>Всього до сплати:</span>
                  <span className="font-mono text-emerald-400 text-sm">{order.totalCost} ₴</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
