import React, { useEffect, useMemo, useState } from 'react';
import type { SparePart, AuthUser, Order } from '../types';
import { api } from '../services/api';
import {
  Package,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  X,
  RefreshCw,
  ArrowUpCircle,
  Pencil,
  Trash2,
  Layers,
  TrendingUp,
  XCircle
} from 'lucide-react';

interface WarehouseViewProps {
  currentUser: AuthUser;
  orders?: Order[];
  onNotify?: (msg: string) => void;
}

const CATEGORIES = [
  'Всі',
  'Дисплеї',
  'Акумулятори',
  "Шлейфи та роз'єми",
  'Витратні матеріали',
  'Мікросхеми',
  'Корпусні деталі',
  'Материнські плати'
];

export const WarehouseView: React.FC<WarehouseViewProps> = ({ currentUser, orders = [], onNotify }) => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Всі');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [restockingPart, setRestockingPart] = useState<SparePart | null>(null);
  const [restockDelta, setRestockDelta] = useState<number>(5);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  const canManageWarehouse = currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_MANAGER';
  const isTechnician = currentUser.role === 'ROLE_TECHNICIAN';

  const loadParts = async () => {
    setLoading(true);
    try {
      const data = await api.getSpareParts();
      setParts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, []);

  const usageByPart = useMemo(() => {
    const map = new Map<string, number>();
    orders
      .filter(o => o.status !== 'CANCELED')
      .forEach(o => {
        o.parts.forEach(p => {
          const key = p.sku || p.partName;
          map.set(key, (map.get(key) || 0) + p.quantity);
          if (p.sparePartId) {
            map.set(`id:${p.sparePartId}`, (map.get(`id:${p.sparePartId}`) || 0) + p.quantity);
          }
        });
      });
    return map;
  }, [orders]);

  const stats = useMemo(() => {
    const totalSku = parts.length;
    const totalUnits = parts.reduce((sum, p) => sum + p.stockQuantity, 0);
    const totalRetailValue = parts.reduce((sum, p) => sum + p.stockQuantity * p.retailPrice, 0);
    const lowStockCount = parts.filter(p => p.stockQuantity <= p.minStockLimit).length;
    return { totalSku, totalUnits, totalRetailValue, lowStockCount };
  }, [parts]);

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const q = filter.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'Всі' || p.category === selectedCategory;
      const matchesLowStock = !onlyLowStock || p.stockQuantity <= p.minStockLimit;
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [parts, filter, selectedCategory, onlyLowStock]);

  const openCreateModal = () => {
    setErrorMsg(null);
    setEditingPart(null);
    setFormData({
      sku: '',
      name: '',
      category: 'Дисплеї',
      stockQuantity: 5,
      minStockLimit: 2,
      purchasePrice: 500,
      retailPrice: 1000
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (part: SparePart) => {
    setErrorMsg(null);
    setEditingPart(part);
    setFormData({
      sku: part.sku,
      name: part.name,
      category: part.category,
      stockQuantity: part.stockQuantity,
      minStockLimit: part.minStockLimit,
      purchasePrice: part.purchasePrice,
      retailPrice: part.retailPrice
    });
    setIsAddModalOpen(true);
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageWarehouse) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingPart) {
        const updated = await api.updateSparePart(editingPart.id, {
          name: formData.name,
          category: formData.category,
          minStockLimit: formData.minStockLimit,
          purchasePrice: formData.purchasePrice,
          retailPrice: formData.retailPrice
        });
        setParts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
        onNotify?.(`Картку деталі ${updated.sku} оновлено`);
      } else {
        const created = await api.createSparePart(formData);
        setParts(prev => [created, ...prev]);
        onNotify?.(`Оприбутковано нову деталь ${created.sku} (${created.stockQuantity} шт.)`);
      }
      setIsAddModalOpen(false);
      setEditingPart(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Не вдалося зберегти деталь');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingPart || !canManageWarehouse || restockDelta === 0) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const updated = await api.restockSparePart(restockingPart.id, restockDelta);
      setParts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
      onNotify?.(
        restockDelta > 0
          ? `На склад прийнято +${restockDelta} шт. "${updated.name}" (залишок: ${updated.stockQuantity} шт.)`
          : `Скориговано залишок "${updated.name}" на ${restockDelta} шт. (залишок: ${updated.stockQuantity} шт.)`
      );
      setRestockingPart(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Помилка оновлення залишку');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePart = async (part: SparePart) => {
    if (!isAdmin) return;
    if (!window.confirm(`Видалити позицію "${part.name}" (${part.sku}) зі складу?`)) return;
    try {
      await api.deleteSparePart(part.id);
      setParts(prev => prev.filter(p => p.id !== part.id));
      onNotify?.(`Позицію ${part.sku} видалено зі складу`);
    } catch (err: any) {
      alert(err?.message || 'Не вдалося видалити позицію зі складу');
    }
  };

  const subtitle = canManageWarehouse
    ? 'Оприбуткування нових запчастин, прийом партій поставок та контроль списань у ремонти'
    : isTechnician
    ? 'Перевірка фактичної наявності комплектуючих для списання в активні замовлення'
    : 'Каталог наявних запчастин та роздрібних цін сервісного центру';

  return (
    <div className="max-w-7xl mx-auto py-2 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-400" />
            Склад запчастин та комплектуючих
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadParts}
            title="Оновити залишки зі складу"
            className="p-2 rounded-lg bg-[#111827] border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManageWarehouse && (
            <button
              onClick={openCreateModal}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Додати нову запчастину</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Позицій (SKU)</p>
            <p className="text-xl font-bold text-white mt-1">{stats.totalSku}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Одиниць в наявності</p>
            <p className="text-xl font-bold text-white mt-1">{stats.totalUnits} шт.</p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-[#111827] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Оцінка складу (роздріб)</p>
            <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">
              {stats.totalRetailValue.toLocaleString('uk-UA')} ₴
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
            onlyLowStock
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-slate-800 bg-[#111827] hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Потребують закупівлі {onlyLowStock ? '(фільтр увімк.)' : ''}
            </p>
            <p className={`text-xl font-bold mt-1 ${stats.lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
              {stats.lowStockCount} поз.
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </button>
      </div>

      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Пошук за назвою, категорією або артикулом SKU..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            {filter && (
              <button
                onClick={() => setFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {onlyLowStock && (
            <button
              onClick={() => setOnlyLowStock(false)}
              className="text-xs text-amber-400 hover:underline self-start sm:self-auto"
            >
              Показати всі позиції складу
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0B0F19] text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
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
                <th className="py-3 px-4 text-center">На складі</th>
                <th className="py-3 px-4 text-center">У ремонтах</th>
                {canManageWarehouse && <th className="py-3 px-4 text-right">Закупівля</th>}
                <th className="py-3 px-4 text-right">Роздріб</th>
                <th className="py-3 px-4 text-center">Статус</th>
                {canManageWarehouse && <th className="py-3 px-4 text-right">Управління</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={canManageWarehouse ? 9 : 7} className="text-center py-10 text-slate-500">
                    Завантаження номенклатури складу...
                  </td>
                </tr>
              ) : filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={canManageWarehouse ? 9 : 7} className="text-center py-10 text-slate-500">
                    Запчастин за вибраними критеріями не знайдено
                  </td>
                </tr>
              ) : (
                filteredParts.map(part => {
                  const isOut = part.stockQuantity === 0;
                  const isLowStock = !isOut && part.stockQuantity <= part.minStockLimit;
                  const usedCount =
                    usageByPart.get(`id:${part.id}`) ??
                    usageByPart.get(part.sku) ??
                    usageByPart.get(part.name) ??
                    0;

                  return (
                    <tr key={part.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-300 whitespace-nowrap">
                        {part.sku}
                      </td>
                      <td className="py-3 px-4 font-medium text-white">{part.name}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                          {part.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-white whitespace-nowrap">
                        {part.stockQuantity} шт.
                      </td>
                      <td className="py-3 px-4 text-center font-mono whitespace-nowrap">
                        {usedCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 text-[11px]">
                            {usedCount} шт.
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      {canManageWarehouse && (
                        <td className="py-3 px-4 text-right font-mono text-slate-400 whitespace-nowrap">
                          {part.purchasePrice} ₴
                        </td>
                      )}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {part.retailPrice} ₴
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                            <XCircle className="h-3 w-3" />
                            <span>Немає (0)</span>
                          </span>
                        ) : isLowStock ? (
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
                      {canManageWarehouse && (
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                setErrorMsg(null);
                                setRestockDelta(5);
                                setRestockingPart(part);
                              }}
                              title="Оприбуткувати поставку / змінити кількість"
                              className="px-2.5 py-1 rounded-md bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                            >
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                              <span>+ Прихід</span>
                            </button>

                            <button
                              onClick={() => openEditModal(part)}
                              title="Редагувати ціну та параметри"
                              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleDeletePart(part)}
                                title="Видалити позицію"
                                className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
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
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingPart(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Package className="h-5 w-5 text-blue-400" />
              {editingPart ? `Редагування картки ${editingPart.sku}` : 'Оприбуткування нової деталі на склад'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {editingPart
                ? 'Оновлення закупівельної/роздрібної вартості та порогу мінімального запасу'
                : 'Нова позиція одразу стане доступною майстрам для списання у замовленнях'}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSavePart} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Артикул (SKU)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPart}
                    placeholder="Напр. DISP-IP15-ORG"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Категорія</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.filter(c => c !== 'Всі').map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Найменування запчастини</label>
                <input
                  type="text"
                  required
                  placeholder="Напр. Дисплейний модуль Apple iPhone 15 OLED Original"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingPart && (
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Початковий залишок (шт.)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.stockQuantity}
                      onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
                <div className={editingPart ? 'col-span-2' : ''}>
                  <label className="block text-slate-400 font-medium mb-1">Критичний ліміт залишку (шт.)</label>
                  <input
                    type="number"
                    min="0"
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
                    step="1"
                    required
                    value={formData.purchasePrice}
                    onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Роздрібна ціна для ремонту (₴)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
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
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingPart(null);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-sm"
                >
                  {submitting ? 'Збереження...' : editingPart ? 'Зберегти зміни' : 'Оприбуткувати на склад'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {restockingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#111827] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-left">
            <button
              onClick={() => setRestockingPart(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <ArrowUpCircle className="h-5 w-5 text-emerald-400" />
              Прихід партії / Коригування складу
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {restockingPart.name} (<span className="font-mono text-blue-300">{restockingPart.sku}</span>)
            </p>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block">Поточний залишок:</span>
                  <span className="text-base font-bold font-mono text-white">{restockingPart.stockQuantity} шт.</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Після операції буде:</span>
                  <span
                    className={`text-base font-bold font-mono ${
                      restockingPart.stockQuantity + restockDelta < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {restockingPart.stockQuantity + restockDelta} шт.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1.5">Швидкий вибір партії приходу:</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[1, 5, 10, 25].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRestockDelta(num)}
                      className={`py-1.5 rounded-lg font-mono font-semibold border transition-colors ${
                        restockDelta === num
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      +{num} шт.
                    </button>
                  ))}
                </div>

                <label className="block text-slate-400 font-medium mb-1">
                  Кількість зміни (додатне — прихід, від'ємне — списання браку):
                </label>
                <input
                  type="number"
                  required
                  value={restockDelta}
                  onChange={e => setRestockDelta(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockingPart(null)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={submitting || restockDelta === 0 || restockingPart.stockQuantity + restockDelta < 0}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Оновлення...' : 'Підтвердити операцію'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
