import React, { useEffect, useMemo, useState } from 'react';
import type {
  Order,
  OrderStatus,
  AuthUser,
  SparePart,
  ServiceCatalogItem,
  StaffMember
} from '../types';
import { api } from '../services/api';
import { statusConfig } from './OrderCard';
import {
  X,
  Wrench,
  Package,
  Plus,
  RotateCcw,
  Check,
  Copy,
  User,
  Phone,
  Stethoscope,
  Trash2,
  ExternalLink,
  AlertCircle,
  Save,
  ClipboardCheck
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  currentUser: AuthUser;
  onClose: () => void;
  onOrderUpdated: (updated: Order, toastMsg?: string) => void;
  onOpenWarehouseTab: () => void;
}

const ALL_STATUSES: OrderStatus[] = [
  'NEW',
  'IN_DIAGNOSTICS',
  'PENDING_APPROVAL',
  'IN_PROGRESS',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELED'
];

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  isOpen,
  currentUser,
  onClose,
  onOrderUpdated,
  onOpenWarehouseTab
}) => {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>([]);
  const [technicians, setTechnicians] = useState<StaffMember[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);

  const [diagnosticsNotes, setDiagnosticsNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [selectedTechId, setSelectedTechId] = useState<string>('');

  const [partSearch, setPartSearch] = useState('');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [partQuantity, setPartQuantity] = useState<number>(1);

  const [serviceMode, setServiceMode] = useState<'catalog' | 'custom'>('catalog');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(0);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isTechnician = currentUser.role === 'ROLE_TECHNICIAN';
  const isClosed = order?.status === 'COMPLETED' || order?.status === 'CANCELED';

  const loadReferenceData = async () => {
    setLoadingCatalogs(true);
    try {
      const [partsData, servicesData, techsData] = await Promise.all([
        api.getSpareParts(),
        api.getServiceCatalog(),
        api.getTechnicians()
      ]);
      setSpareParts(partsData);
      setServiceCatalog(servicesData);
      setTechnicians(techsData);

      if (servicesData.length > 0 && !selectedServiceId) {
        setSelectedServiceId(String(servicesData[0].id));
        setServicePrice(servicesData[0].standardPrice);
      }
    } finally {
      setLoadingCatalogs(false);
    }
  };

  useEffect(() => {
    if (isOpen && order) {
      setErrorMsg(null);
      setDiagnosticsNotes(order.diagnosticsNotes || '');
      setEstimatedCost(order.estimatedCost || 0);
      setSelectedTechId(order.technicianId ? String(order.technicianId) : '');
      setPartQuantity(1);
      loadReferenceData();
    }
  }, [isOpen, order?.id]);

  const filteredWarehouseParts = useMemo(() => {
    const q = partSearch.toLowerCase().trim();
    return spareParts.filter(
      p =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [spareParts, partSearch]);

  useEffect(() => {
    const firstAvailable = filteredWarehouseParts.find(p => p.stockQuantity > 0) || filteredWarehouseParts[0];
    if (firstAvailable && !filteredWarehouseParts.some(p => String(p.id) === selectedPartId)) {
      setSelectedPartId(String(firstAvailable.id));
    } else if (!firstAvailable) {
      setSelectedPartId('');
    }
  }, [filteredWarehouseParts, selectedPartId]);

  if (!isOpen || !order) return null;

  const selectedSparePart = spareParts.find(p => String(p.id) === selectedPartId);
  const partsSum = order.parts.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0);
  const servicesSum = order.services.reduce((acc, s) => acc + s.price, 0);

  const handleCopyTrack = () => {
    navigator.clipboard.writeText(order.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleStatusSelect = async (newStatus: OrderStatus) => {
    if (newStatus === order.status) return;
    if (newStatus === 'CANCELED' && order.parts.length > 0) {
      const ok = window.confirm(
        `Скасувати замовлення ${order.orderNumber}? Усі списані деталі (${order.parts.length} поз.) будуть автоматично повернені на склад.`
      );
      if (!ok) return;
    }
    setBusyAction('status');
    setErrorMsg(null);
    try {
      const updated = await api.updateOrderStatus(order.id, newStatus);
      await loadReferenceData();
      onOrderUpdated(
        updated,
        newStatus === 'CANCELED'
          ? `Замовлення ${updated.orderNumber} скасовано, запчастини повернено на склад`
          : `Статус замовлення змінено на "${statusConfig[newStatus].label}"`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Помилка зміни статусу');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveDiagnostics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosticsNotes.trim()) {
      setErrorMsg('Введіть технічний висновок діагностики');
      return;
    }
    setBusyAction('diagnostics');
    setErrorMsg(null);
    try {
      const updated = await api.updateOrderDiagnostics(order.id, {
        diagnosticsNotes: diagnosticsNotes.trim(),
        technicianId: selectedTechId ? Number(selectedTechId) : undefined,
        estimatedCost: estimatedCost
      });
      onOrderUpdated(updated, 'Результати діагностики збережено');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Не вдалося зберегти діагностику');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSparePart) return;
    setBusyAction('addPart');
    setErrorMsg(null);
    try {
      const updated = await api.addPartToOrder(order.id, selectedSparePart.id, partQuantity);
      await loadReferenceData();
      setPartQuantity(1);
      onOrderUpdated(
        updated,
        `Зі складу списано "${selectedSparePart.name}" (${partQuantity} шт.) у замовлення ${order.orderNumber}`
      );
    } catch (err: any) {
      setErrorMsg(err?.message || 'Помилка списання запчастини зі складу');
    } finally {
      setBusyAction(null);
    }
  };

  const handleReturnPart = async (orderPartId: number, partName: string, qty: number) => {
    setBusyAction(`removePart-${orderPartId}`);
    setErrorMsg(null);
    try {
      const updated = await api.removePartFromOrder(order.id, orderPartId);
      await loadReferenceData();
      onOrderUpdated(updated, `Повернено на склад: "${partName}" (+${qty} шт.)`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Не вдалося повернути деталь на склад');
    } finally {
      setBusyAction(null);
    }
  };

  const handleServiceCatalogChange = (idStr: string) => {
    setSelectedServiceId(idStr);
    const found = serviceCatalog.find(s => String(s.id) === idStr);
    if (found) {
      setServicePrice(found.standardPrice);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction('addService');
    setErrorMsg(null);
    try {
      const payload =
        serviceMode === 'catalog'
          ? { serviceId: Number(selectedServiceId), price: servicePrice }
          : { customServiceName: customServiceName.trim(), price: servicePrice };

      const updated = await api.addServiceToOrder(order.id, payload);
      if (serviceMode === 'custom') {
        setCustomServiceName('');
        await loadReferenceData();
      }
      onOrderUpdated(updated, 'Виконану роботу додано до кошторису замовлення');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Не вдалося додати роботу');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemoveService = async (orderServiceId: number) => {
    setBusyAction(`removeService-${orderServiceId}`);
    setErrorMsg(null);
    try {
      const updated = await api.removeServiceFromOrder(order.id, orderServiceId);
      onOrderUpdated(updated, 'Послугу видалено з кошторису');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Не вдалося видалити послугу');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left">
        <div className="bg-[#111827] border-b border-slate-800 px-5 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-base font-bold text-white">{order.orderNumber}</span>
              <button
                type="button"
                onClick={handleCopyTrack}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400 hover:text-blue-300"
              >
                <span>{order.trackingCode}</span>
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
              <span className="text-xs text-slate-400">• Прийнято: {order.createdAt}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Пристрій:{' '}
              <span className="text-slate-200 font-semibold">
                {order.device.brand} {order.device.model}
              </span>{' '}
              ({order.device.deviceType}
              {order.device.serialNumber ? `, S/N: ${order.device.serialNumber}` : ''})
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={order.status}
              disabled={busyAction === 'status'}
              onChange={e => handleStatusSelect(e.target.value as OrderStatus)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
            >
              {ALL_STATUSES.map(st => {
                const disabledForTech = isTechnician && (st === 'COMPLETED' || st === 'CANCELED');
                return (
                  <option key={st} value={st} disabled={disabledForTech}>
                    Статус: {statusConfig[st].label}
                  </option>
                );
              })}
            </select>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                Дані клієнта
              </span>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-blue-400" />
                  {order.client.fullName}
                </span>
                <span className="font-mono text-slate-300 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-slate-500" />
                  {order.client.phone}
                </span>
              </div>
              {order.device.appearanceNotes && (
                <p className="text-slate-400 pt-1 border-t border-slate-800/80">
                  Зовнішній стан: <span className="text-slate-300">{order.device.appearanceNotes}</span>
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 block">
                Заявлена клієнтом несправність
              </span>
              <p className="text-slate-200 leading-relaxed">{order.defectDescription}</p>
              <p className="text-slate-400 pt-1 border-t border-slate-800/80">
                Відповідальний інженер:{' '}
                <span className="text-indigo-300 font-medium">
                  {order.technicianName || 'Ще не призначено'}
                </span>
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSaveDiagnostics}
            className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                <Stethoscope className="h-4 w-4 text-amber-400" />
                1. Технічна діагностика та призначення майстра
              </h4>
              <button
                type="submit"
                disabled={isClosed || busyAction === 'diagnostics'}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{busyAction === 'diagnostics' ? 'Збереження...' : 'Зберегти діагностику'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Відповідальний майстер</label>
                <select
                  value={selectedTechId}
                  disabled={isClosed}
                  onChange={e => setSelectedTechId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Автоматично (поточний інженер)</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.username})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">
                  Попередня оцінка ремонту до списання деталей (₴)
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isClosed}
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Технічний висновок інженера (видно клієнту у трекінгу)</label>
              <textarea
                rows={2}
                disabled={isClosed}
                placeholder="Опишіть виявлений дефект, необхідні роботи та запчастини..."
                value={diagnosticsNotes}
                onChange={e => setDiagnosticsNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </form>

          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-blue-400" />
                  2. Запчастини та матеріали зі складу
                </h4>
                <p className="text-[11px] text-slate-400">
                  При додаванні деталі її кількість миттєво списується з балансу складу, а при видаленні — повертається назад
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWarehouseTab();
                }}
                className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
              >
                <span>Відкрити склад</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>

            {!isClosed && (
              <form
                onSubmit={handleAddPart}
                className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
              >
                <div className="sm:col-span-4">
                  <label className="block text-slate-400 mb-1">Фільтр по складу</label>
                  <input
                    type="text"
                    placeholder="Назва або SKU..."
                    value={partSearch}
                    onChange={e => setPartSearch(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-slate-400 mb-1">
                    Номенклатура складу {loadingCatalogs ? '(оновлення...)' : ''}
                  </label>
                  <select
                    value={selectedPartId}
                    onChange={e => {
                      setSelectedPartId(e.target.value);
                      setPartQuantity(1);
                    }}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {filteredWarehouseParts.length === 0 ? (
                      <option value="">Нічого не знайдено на складі</option>
                    ) : (
                      filteredWarehouseParts.map(sp => (
                        <option key={sp.id} value={sp.id} disabled={sp.stockQuantity === 0}>
                          [{sp.sku}] {sp.name} — {sp.retailPrice} ₴ (залишок: {sp.stockQuantity} шт.)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-slate-400 mb-1">К-сть</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedSparePart?.stockQuantity || 1}
                    value={partQuantity}
                    onChange={e => setPartQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-center focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={
                      !selectedSparePart ||
                      selectedSparePart.stockQuantity < partQuantity ||
                      busyAction === 'addPart'
                    }
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Списати</span>
                  </button>
                </div>
              </form>
            )}

            {order.parts.length === 0 ? (
              <div className="text-center py-4 text-slate-500 bg-[#0B0F19]/60 rounded-lg border border-slate-800/60">
                Запчастини зі складу ще не списувалися на це замовлення
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Артикул / Деталь</th>
                      <th className="py-2 px-3 text-center">Кількість</th>
                      <th className="py-2 px-3 text-right">Ціна</th>
                      <th className="py-2 px-3 text-right">Сума</th>
                      {!isClosed && <th className="py-2 px-3 text-right">Дія</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {order.parts.map(p => (
                      <tr key={p.id} className="bg-[#0B0F19]/80">
                        <td className="py-2.5 px-3">
                          {p.sku && (
                            <span className="font-mono text-[11px] text-blue-400 mr-2">[{p.sku}]</span>
                          )}
                          <span className="text-white font-medium">{p.partName}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300">{p.quantity} шт.</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">{p.unitPrice} ₴</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {p.unitPrice * p.quantity} ₴
                        </td>
                        {!isClosed && (
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              disabled={busyAction === `removePart-${p.id}`}
                              onClick={() => handleReturnPart(p.id, p.partName, p.quantity)}
                              title="Повернути деталь назад на склад"
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 inline-flex items-center gap-1 text-[11px] transition-colors"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>На склад</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Wrench className="h-4 w-4 text-emerald-400" />
                  3. Виконані роботи та послуги інженера
                </h4>
                <p className="text-[11px] text-slate-400">
                  Оберіть типову роботу з прайс-листа або вкажіть індивідуальну послугу
                </p>
              </div>

              {!isClosed && (
                <div className="inline-flex rounded-lg bg-[#0B0F19] border border-slate-800 p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setServiceMode('catalog')}
                    className={`px-2.5 py-1 rounded-md font-medium ${
                      serviceMode === 'catalog' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    З прайсу
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceMode('custom')}
                    className={`px-2.5 py-1 rounded-md font-medium ${
                      serviceMode === 'custom' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Інша робота
                  </button>
                </div>
              )}
            </div>

            {!isClosed && (
              <form
                onSubmit={handleAddService}
                className="p-3 rounded-xl bg-[#0B0F19] border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
              >
                <div className="sm:col-span-7">
                  <label className="block text-slate-400 mb-1">
                    {serviceMode === 'catalog' ? 'Стандартна послуга з прайсу' : 'Назва виконаної роботи'}
                  </label>
                  {serviceMode === 'catalog' ? (
                    <select
                      value={selectedServiceId}
                      onChange={e => handleServiceCatalogChange(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    >
                      {serviceCatalog.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} (стандарт: {s.standardPrice} ₴)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Напр. Відновлення ланцюга живлення контролера..."
                      value={customServiceName}
                      onChange={e => setCustomServiceName(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-400 mb-1">Вартість роботи (₴)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={servicePrice}
                    onChange={e => setServicePrice(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={
                      busyAction === 'addService' ||
                      (serviceMode === 'catalog' && !selectedServiceId) ||
                      (serviceMode === 'custom' && !customServiceName.trim())
                    }
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center justify-center gap-1 disabled:opacity-40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Додати</span>
                  </button>
                </div>
              </form>
            )}

            {order.services.length === 0 ? (
              <div className="text-center py-4 text-slate-500 bg-[#0B0F19]/60 rounded-lg border border-slate-800/60">
                Виконані роботи ще не додані
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Найменування послуги / роботи</th>
                      <th className="py-2 px-3 text-right">Вартість</th>
                      {!isClosed && <th className="py-2 px-3 text-right">Дія</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {order.services.map(s => (
                      <tr key={s.id} className="bg-[#0B0F19]/80">
                        <td className="py-2.5 px-3 text-white font-medium">{s.serviceName}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          {s.price} ₴
                        </td>
                        {!isClosed && (
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              disabled={busyAction === `removeService-${s.id}`}
                              onClick={() => handleRemoveService(s.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#111827] border-t border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shrink-0 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>
              Запчастини зі складу:{' '}
              <strong className="font-mono text-white">{partsSum} ₴</strong> ({order.parts.length} поз.)
            </span>
            <span>•</span>
            <span>
              Роботи майстра:{' '}
              <strong className="font-mono text-white">{servicesSum} ₴</strong> ({order.services.length} поз.)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Підсумкова сума до сплати
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400">{order.totalCost} ₴</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold inline-flex items-center gap-1.5"
            >
              <ClipboardCheck className="h-4 w-4 text-emerald-400" />
              <span>Готово</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
