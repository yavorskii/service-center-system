import React, { useState } from 'react';
import type { CreateOrderPayload } from '../types';
import { X, Check, AlertCircle } from 'lucide-react';

interface OrderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateOrderPayload) => Promise<void>;
  isStaff?: boolean;
}

export const OrderCreateModal: React.FC<OrderCreateModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  isStaff = false 
}) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0B0F19]/60">
          <div>
            <h3 className="text-base font-bold text-white">
              {isStaff ? 'Оформлення квитанції прийому техніки' : 'Запис на ремонт техніки'}
            </h3>
            <p className="text-xs text-slate-400">
              {isStaff 
                ? 'Реєстрація клієнта та обладнання в базі сервісного центру' 
                : 'Заповніть форму, і наш менеджер зв\'яжеться з вами протягом 15 хвилин'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              1. Контактні дані
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Ваше ПІБ або назва компанії *"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Номер телефону (+380...) *"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500 font-mono"
                />
              </div>
            </div>
            <div className="mt-2">
              <input
                type="email"
                placeholder="Електронна пошта (опціонально для квитанцій)"
                value={formData.clientEmail || ''}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              2. Інформація про техніку
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <select
                  value={formData.deviceType}
                  onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Ноутбук">Ноутбук</option>
                  <option value="Смартфон">Смартфон</option>
                  <option value="Планшет">Планшет</option>
                  <option value="ПК">Системний блок / ПК</option>
                  <option value="Монітор">Монітор</option>
                  <option value="Навушники">Навушники / Акустика</option>
                  <option value="Інше">Інша техніка</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Бренд (Apple, Asus, Lenovo...) *"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Модель (напр. iPhone 13 Pro) *"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              <input
                type="text"
                placeholder="Серійний номер (S/N) або IMEI"
                value={formData.serialNumberOrImei || ''}
                onChange={(e) => setFormData({ ...formData, serialNumberOrImei: e.target.value })}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500 font-mono"
              />
              <input
                type="text"
                placeholder="Зовнішній стан (подряпини, комплектація)"
                value={formData.appearanceNotes || ''}
                onChange={(e) => setFormData({ ...formData, appearanceNotes: e.target.value })}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              3. Опис проблеми та пріоритет
            </label>
            <textarea
              rows={3}
              placeholder="Детально опишіть ознаки несправності (не вмикається, розбитий екран, шумить кулер, потрапила вода)... *"
              value={formData.defectDescription}
              onChange={(e) => setFormData({ ...formData, defectDescription: e.target.value })}
              className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Терміновість виконання
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="LOW">Звичайна черга</option>
                <option value="MEDIUM">Стандартний ремонт (1-3 дні)</option>
                <option value="HIGH">Високий пріоритет (до 24 год)</option>
                <option value="URGENT">Терміново (день у день)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Орієнтовний бюджет (₴)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <span>Відправка даних...</span>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{isStaff ? 'Оформити квитанцію' : 'Надіслати заявку на ремонт'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
