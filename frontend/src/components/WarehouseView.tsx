import React, { useEffect, useState } from 'react';
import type { SparePart, AuthUser } from '../types';
import { api } from '../services/api';
import { Package, AlertTriangle, CheckCircle, Search, Plus, X } from 'lucide-react';

interface WarehouseViewProps {
  currentUser: AuthUser;
  onBackToPortal?: () => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({ currentUser }) => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Дисплеї',
    stockQuantity: 5,
    minStockLimit: 2,
    purchasePrice: 500,
    retailPrice: 1000
  });

  const isAdmin = currentUser.role === 'ROLE_ADMIN';
  const isTechnician = currentUser.role === 'ROLE_TECHNICIAN';

  useEffect(() => {
    api.getSpareParts().then(data => {
      setParts(data);
      setLoading(false);
    });
  }, []);

  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    p.sku.toLowerCase().includes(filter.toLowerCase()) ||
    p.category.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);
    try {
      const created = await api.createSparePart(formData);
      setParts(prev => [created, ...prev]);
      setIsAddModalOpen(false);
      setFormData({
        sku: '',
        name: '',
        category: 'Дисплеї',
        stockQuantity: 5,
        minStockLimit: 2,
        purchasePrice: 500,
        retailPrice: 1000
      });
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle = isAdmin
    ? 'Повний контроль залишків, собівартості закупівель та оприбуткування нових деталей'
    : isTechnician
    ? 'Перевірка фактичної наявності деталей на складі для виконання ремонту'
    : 'Каталог наявних запчастин та роздрібних цін для розрахунку вартості клієнтам';

  return (
    <div className="max-w-7xl mx-auto py-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" />
            Склад запчастин та комплектуючих
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Пошук за назвою або SKU..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#111827] border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Оприбуткувати деталь</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Артикул (SKU)</th>
                <th className="py-3 px-4">Найменування запчастини</th>
                <th className="py-3 px-4">Категорія</th>
                <th className="py-3 px-4 text-center">Залишок</th>
                {isAdmin && <th className="py-3 px-4 text-right">Закупівля</th>}
                <th className="py-3 px-4 text-right">Роздріб</th>
                <th className="py-3 px-4 text-center">Стан складу</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-slate-500">
                    Завантаження номенклатури складу...
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-slate-500">
                    Запчастин не знайдено
                  </td>
                </tr>
              ) : (
                filteredParts.map(part => {
                  const isLowStock = part.stockQuantity <= part.minStockLimit;
                  return (
                    <tr key={part.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-300 whitespace-nowrap">
                        {part.sku}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {part.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px]">
                          {part.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white">
                        {part.stockQuantity} шт.
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {part.purchasePrice} ₴
                        </td>
                      )}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {part.retailPrice} ₴
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Мало (мін. {part.minStockLimit})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            <CheckCircle className="h-3 w-3" />
                            <span>В наявності</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Package className="h-5 w-5 text-blue-400" />
              Оприбуткування нової деталі
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Внесення позиції в номенклатуру складу із зазначенням собівартості
            </p>

            <form onSubmit={handleCreatePart} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Артикул (SKU)</label>
                  <input
                    type="text"
                    required
                    placeholder="Напр. DISP-IP13-ORG"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Категорія</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Дисплеї">Дисплеї</option>
                    <option value="Акумулятори">Акумулятори</option>
                    <option value="Шлейфи та роз'єми">Шлейфи та роз'єми</option>
                    <option value="Корпусні деталі">Корпусні деталі</option>
                    <option value="Материнські плати">Материнські плати</option>
                    <option value="Мікросхеми">Мікросхеми</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Найменування запчастини</label>
                <input
                  type="text"
                  required
                  placeholder="Напр. Дисплейний модуль Apple iPhone 13 OLED Original"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Кількість на складі</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.stockQuantity}
                    onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Мін. залишок</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minStockLimit}
                    onChange={e => setFormData({ ...formData, minStockLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Ціна закупівлі (₴)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formData.purchasePrice}
                    onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Роздрібна ціна для клієнта (₴)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={formData.retailPrice}
                    onChange={e => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-sm"
                >
                  {submitting ? 'Збереження...' : 'Зберегти на складі'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
