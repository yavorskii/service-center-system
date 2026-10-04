import React, { useState } from 'react';
import type { Order, OrderStatus } from '../types';
import { Search, CheckCircle2, Clock, AlertCircle, Laptop } from 'lucide-react';

interface PublicTrackingViewProps {
  onSearch: (code: string) => Promise<Order | null>;
  initialCode?: string;
}

const statusSteps: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'NEW', label: 'Прийом', desc: 'Зареєстровано в базі' },
  { key: 'IN_DIAGNOSTICS', label: 'Діагностика', desc: 'Тестування дефектів' },
  { key: 'PENDING_APPROVAL', label: 'Узгодження', desc: 'Погодження кошторису' },
  { key: 'IN_PROGRESS', label: 'Ремонт', desc: 'Відновлення та монтаж' },
  { key: 'READY_FOR_PICKUP', label: 'Готово', desc: 'Контроль якості пройдено' },
  { key: 'COMPLETED', label: 'Видано', desc: 'Передано клієнту' },
];

export const PublicTrackingView: React.FC<PublicTrackingViewProps> = ({ onSearch, initialCode }) => {
  const queryCode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('code') : null;
  const effectiveCode = initialCode || queryCode || '';
  const [trackCode, setTrackCode] = useState(effectiveCode);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  React.useEffect(() => {
    if (effectiveCode) {
      setTrackCode(effectiveCode);
      setLoading(true);
      setSearched(true);
      onSearch(effectiveCode)
        .then(res => setOrder(res))
        .finally(() => setLoading(false));
    }
  }, [effectiveCode, onSearch]);

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
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl mb-6">
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600/10 text-blue-400 mb-3 border border-blue-500/20">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Онлайн-трекінг ремонту техніки</h2>
          <p className="text-xs text-slate-400 mt-1">
            Введіть унікальний трек-код із квитанції для перевірки поточного стану та кошторису робіт
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="TRK-A8F91B"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-blue-500 uppercase tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shrink-0 disabled:opacity-50"
          >
            {loading ? 'Пошук...' : 'Перевірити'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <span className="text-[11px] text-slate-500">
            Тестові коди: <button type="button" onClick={() => setTrackCode('TRK-A8F91B')} className="text-blue-400 font-mono hover:underline">TRK-A8F91B</button>, <button type="button" onClick={() => setTrackCode('TRK-B2C44E')} className="text-blue-400 font-mono hover:underline">TRK-B2C44E</button>, <button type="button" onClick={() => setTrackCode('TRK-D4E12A')} className="text-blue-400 font-mono hover:underline">TRK-D4E12A</button>
          </span>
        </div>
      </div>

      {searched && !order && !loading && (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-8 text-center animate-in fade-in duration-200">
          <AlertCircle className="h-10 w-10 text-rose-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">Замовлення не знайдено</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Перевірте правильність коду або зверніться до приймальника сервісного центру.
          </p>
        </div>
      )}

      {order && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-200">
          <div className="bg-slate-900/90 border-b border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white font-mono">{order.orderNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  {order.trackingCode}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <Laptop className="h-3.5 w-3.5 text-slate-500" />
                <span>{order.device.brand} {order.device.model} ({order.device.deviceType})</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block uppercase">Загальна вартість</span>
              <span className="text-xl font-bold font-mono text-white">{order.totalCost} ₴</span>
            </div>
          </div>

          <div className="p-6 border-b border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">
              Поточний прогрес виконання робіт
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {statusSteps.map((step, idx) => {
                const state = getStepStatus(step.key, order.status);
                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center border-2 mb-2 transition-all ${
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
