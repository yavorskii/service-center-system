import React, { useState } from 'react';
import type { Order, OrderStatus } from '../types';
import { Search, CheckCircle2, Clock, AlertCircle, Wrench, Laptop } from 'lucide-react';

interface PublicTrackingViewProps {
  onSearch: (code: string) => Promise<Order | null>;
}

const statusSteps: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'NEW', label: 'Прийом', desc: 'Техніку зареєстровано в базі' },
  { key: 'IN_DIAGNOSTICS', label: 'Діагностика', desc: 'Тестування та виявлення несправності' },
  { key: 'PENDING_APPROVAL', label: 'Узгодження', desc: 'Погодження кошторису робіт' },
  { key: 'IN_PROGRESS', label: 'Ремонт', desc: 'Усунення несправностей та заміна деталей' },
  { key: 'READY_FOR_PICKUP', label: 'Готово', desc: 'Пройдено вихідний контроль якості' },
  { key: 'COMPLETED', label: 'Видано', desc: 'Техніку передано власнику' },
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
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Search Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
          <Wrench className="h-3.5 w-3.5" /> Онлайн-трекінг ремонту
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Дізнайтеся статус ремонту вашої техніки
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Введіть унікальний трек-код з квитанції (наприклад, <code className="text-indigo-400 font-mono">TRK-B2C44E</code> або <code className="text-indigo-400 font-mono">TRK-A8F91B</code>), щоб миттєво побачити прогрес
        </p>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="mt-6 flex max-w-md mx-auto gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Введіть трек-код..."
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shrink-0"
          >
            {loading ? 'Пошук...' : 'Перевірити'}
          </button>
        </form>
      </div>

      {/* Result Display */}
      {searched && !order && !loading && (
        <div className="text-center p-8 rounded-2xl bg-slate-900/60 border border-slate-800 max-w-md mx-auto">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white">Замовлення не знайдено</h4>
          <p className="text-xs text-slate-400 mt-1">
            Будь ласка, перевірте правильність введеного коду або зверніться до приймальника за телефоном сервісу.
          </p>
        </div>
      )}

      {order && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Card Top */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Laptop className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {order.device.brand} {order.device.model}
                  </h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {order.orderNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Клієнт: <b>{order.client.fullName}</b> • Прийнято: {order.createdAt}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Фінальна сума до сплати</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{order.totalCost} ₴</span>
            </div>
          </div>

          {/* Stepper / Timeline */}
          <div className="p-6 border-b border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
              Етапи виконання замовлення
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {statusSteps.map((step, idx) => {
                const state = getStepStatus(step.key, order.status);
                return (
                  <div key={idx} className="relative flex flex-col items-center text-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center border-2 mb-2 transition-all ${
                        state === 'completed'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : state === 'current'
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 ring-4 ring-indigo-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-600'
                      }`}
                    >
                      {state === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : state === 'current' ? (
                        <Clock className="h-4 w-4 animate-spin" />
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
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Діагностика та виконані роботи
              </h4>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div>
                  <span className="text-xs text-slate-500 block">Заявлена несправність</span>
                  <p className="text-xs text-slate-200 mt-0.5">{order.defectDescription}</p>
                </div>
                {order.diagnosticsNotes && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs text-amber-400 block font-medium">Коментар сервісного інженера</span>
                    <p className="text-xs text-slate-300 mt-0.5">{order.diagnosticsNotes}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Калькуляція вартості (деталі + роботи)
              </h4>
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                {order.services.map((s, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800/50">
                    <span className="text-slate-300">{s.serviceName}</span>
                    <span className="font-mono text-slate-200">{s.price} ₴</span>
                  </div>
                ))}
                {order.parts.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800/50">
                    <span className="text-slate-300">{p.partName} ({p.quantity} шт.)</span>
                    <span className="font-mono text-slate-200">{p.unitPrice * p.quantity} ₴</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold pt-2 text-white">
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
