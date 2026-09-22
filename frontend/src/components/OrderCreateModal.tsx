import React, { useState } from 'react';
import type { CreateOrderPayload, OrderPriority } from '../types';
import { X, Check, AlertCircle } from 'lucide-react';

interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateOrderPayload) => Promise<void>;
}

export const OrderCreateModal: React.FC<OrderCreateModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateOrderPayload>({
    clientName: '',
    clientPhone: '+380',
    clientEmail: '',
    deviceType: 'Ноутбук',
    brand: '',
    model: '',
    serialNumberOrImei: '',
    appearanceNotes: '',
    defectDescription: '',
    priority: 'MEDIUM',
    estimatedCost: 500,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim()) {
      setError("Вкажіть ПІБ клієнта");
      return;
    }
    if (formData.clientPhone.trim().length < 10) {
      setError("Вкажіть коректний номер телефону (+380...)");
      return;
    }
    if (!formData.brand.trim() || !formData.model.trim()) {
      setError("Вкажіть бренд та модель техніки");
      return;
    }
    if (!formData.defectDescription.trim()) {
      setError("Опишіть заявлену несправність");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || "Помилка при створенні замовлення");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Оформлення нового замовлення</h3>
            <p className="text-xs text-slate-400">Внесення даних клієнта та реєстрація пристрою на ремонт</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Client Info */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Дані клієнта
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="ПІБ клієнта *"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Телефон (+380...) *"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Device Info */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              2. Інформація про техніку
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {['Ноутбук', 'Смартфон', 'Планшет'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setFormData({ ...formData, deviceType: type })}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                    formData.deviceType === type
                      ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Бренд (Asus, Apple, Lenovo) *"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
              <input
                type="text"
                placeholder="Модель (iPhone 13, ROG G14) *"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <input
                type="text"
                placeholder="Серійний номер або IMEI"
                value={formData.serialNumberOrImei}
                onChange={(e) => setFormData({ ...formData, serialNumberOrImei: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono placeholder:text-slate-500"
              />
              <input
                type="text"
                placeholder="Зовнішній стан (подряпини, тріщини)"
                value={formData.appearanceNotes}
                onChange={(e) => setFormData({ ...formData, appearanceNotes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Section 3: Defect & Cost */}
          <div className="pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              3. Несправність та умови
            </label>
            <textarea
              rows={2}
              placeholder="Детальний опис поломки зі слів клієнта *"
              value={formData.defectDescription}
              onChange={(e) => setFormData({ ...formData, defectDescription: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500 mb-3"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Пріоритет замовлення</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as OrderPriority })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="LOW">Низький</option>
                  <option value="MEDIUM">Звичайний</option>
                  <option value="HIGH">Високий</option>
                  <option value="URGENT">Терміново (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Орієнтовна вартість (грн)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Збереження...</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Оформити замовлення</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
