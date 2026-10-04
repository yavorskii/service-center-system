import React, { useEffect, useState } from 'react';
import type { SparePart } from '../types';
import { api } from '../services/api';
import { Package, AlertTriangle, CheckCircle, Search } from 'lucide-react';

interface WarehouseViewProps {
  onBackToPortal?: () => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = () => {
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
    <div className="max-w-7xl mx-auto py-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" />
            Склад запчастин та комплектуючих
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Контроль складських залишків, мінімальних лімітів та собівартості деталей
          </p>
        </div>

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
                <th className="py-3 px-4 text-right">Закупівля</th>
                <th className="py-3 px-4 text-right">Роздріб</th>
                <th className="py-3 px-4 text-center">Стан складу</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Завантаження номенклатури складу...
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
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
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {part.purchasePrice} ₴
                      </td>
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
    </div>
  );
};
