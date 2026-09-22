import React, { useEffect, useState } from 'react';
import type { SparePart } from '../types';
import { api } from '../services/api';
import { Package, AlertTriangle, CheckCircle, Search } from 'lucide-react';

export const WarehouseView: React.FC = () => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

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

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-400" />
            Склад запчастин та витратних матеріалів
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Контроль залишків на складі, закупівельних цін та автоматичне списання під замовлення
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Пошук за назвою чи артикулом..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Артикул (SKU)</th>
                <th className="py-3.5 px-4">Найменування запчастини</th>
                <th className="py-3.5 px-4">Категорія</th>
                <th className="py-3.5 px-4 text-center">Залишок</th>
                <th className="py-3.5 px-4 text-right">Ціна закупівлі</th>
                <th className="py-3.5 px-4 text-right">Ціна продажу</th>
                <th className="py-3.5 px-4 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Завантаження номенклатури складу...</td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Запчастин за запитом не знайдено</td>
                </tr>
              ) : (
                filteredParts.map((part) => {
                  const isLow = part.stockQuantity <= part.minStockLimit;
                  return (
                    <tr key={part.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{part.sku}</td>
                      <td className="py-3.5 px-4 font-medium text-white">{part.name}</td>
                      <td className="py-3.5 px-4 text-slate-400">{part.category}</td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded ${isLow ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-200'}`}>
                          {part.stockQuantity} шт.
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">{part.purchasePrice} ₴</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">{part.retailPrice} ₴</td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            <AlertTriangle className="h-3 w-3" /> Закінчується
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCircle className="h-3 w-3" /> В наявності
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
    </div>
  );
};
