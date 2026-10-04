import React, { useEffect, useState, useMemo } from 'react';
import type { Order, OrderStatus, CreateOrderPayload, AppRole } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { OrderCard } from './components/OrderCard';
import { OrderTableView } from './components/OrderTableView';
import { OrderCreateModal } from './components/OrderCreateModal';
import { PublicTrackingView } from './components/PublicTrackingView';
import { WarehouseView } from './components/WarehouseView';
import { Search, RefreshCw, CheckCircle2, LayoutGrid, List, X } from 'lucide-react';

export const App: React.FC = () => {
  const queryParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialTab = (queryParams?.get('tab') as 'orders' | 'warehouse' | 'tracking') || 'orders';
  const initialView = (queryParams?.get('view') as 'cards' | 'table') || 'cards';
  const initialModal = queryParams?.get('modal') === 'true';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'warehouse' | 'tracking'>(initialTab);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(initialView);
  const [isModalOpen, setIsModalOpen] = useState(initialModal);

  // Role state: ADMIN vs USER (Client)
  const [currentRole, setCurrentRole] = useState<AppRole>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('repairhub_role') as AppRole) || 'ADMIN';
    }
    return 'ADMIN';
  });

  const [selectedTrackingCode, setSelectedTrackingCode] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRoleChange = (role: AppRole) => {
    setCurrentRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('repairhub_role', role);
    }
    if (role === 'USER' && activeTab === 'warehouse') {
      setActiveTab('orders');
    }
    showToast(
      role === 'ADMIN'
        ? 'Режим змінено: Адміністратор (повний доступ до системи та складу)'
        : 'Режим змінено: Користувач / Клієнт (статус замовлень та трекінг)'
    );
  };

  const handleSelectTracking = (code: string) => {
    setSelectedTrackingCode(code);
    setActiveTab('tracking');
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async (payload: CreateOrderPayload) => {
    const created = await api.createOrder(payload);
    setOrders(prev => [created, ...prev]);
    showToast(
      currentRole === 'ADMIN'
        ? `Замовлення ${created.orderNumber} успішно оформлено (код: ${created.trackingCode})`
        : `Вашу заявку прийнято! Номер квитанції: ${created.orderNumber} (код трекінгу: ${created.trackingCode})`
    );
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    const updated = await api.updateOrderStatus(orderId, newStatus);
    setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    showToast(`Статус ${updated.orderNumber} змінено на "${newStatus}"`);
  };

  // Role-based scoping: Admin views all CRM orders; Client views only their own devices
  const scopedOrders = useMemo(() => {
    if (currentRole === 'ADMIN') return orders;
    return orders.filter(order => 
      order.client.fullName.toLowerCase().includes('сидоренко') || 
      order.client.phone.includes('0671234567')
    );
  }, [orders, currentRole]);

  // Status Counts calculation for tabs based on scoped orders
  const statusCounts = useMemo(() => {
    return {
      ALL: scopedOrders.length,
      NEW: scopedOrders.filter(o => o.status === 'NEW').length,
      IN_DIAGNOSTICS: scopedOrders.filter(o => o.status === 'IN_DIAGNOSTICS').length,
      IN_PROGRESS: scopedOrders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'PENDING_APPROVAL').length,
      READY_FOR_PICKUP: scopedOrders.filter(o => o.status === 'READY_FOR_PICKUP').length,
      COMPLETED: scopedOrders.filter(o => o.status === 'COMPLETED').length,
    };
  }, [scopedOrders]);

  const filteredOrders = useMemo(() => {
    return scopedOrders.filter(order => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.trackingCode.toLowerCase().includes(q) ||
        order.client.fullName.toLowerCase().includes(q) ||
        order.client.phone.includes(q) ||
        order.device.model.toLowerCase().includes(q) ||
        order.device.brand.toLowerCase().includes(q);

      const matchStatus = 
        selectedStatus === 'ALL' || 
        order.status === selectedStatus ||
        (selectedStatus === 'IN_PROGRESS' && order.status === 'PENDING_APPROVAL');

      return matchQuery && matchStatus;
    });
  }, [scopedOrders, searchQuery, selectedStatus]);

  const statusTabs = [
    { key: 'ALL', label: currentRole === 'ADMIN' ? 'Всі' : 'Всі мої', count: statusCounts.ALL },
    { key: 'NEW', label: 'Нові', count: statusCounts.NEW },
    { key: 'IN_DIAGNOSTICS', label: 'Діагностика', count: statusCounts.IN_DIAGNOSTICS },
    { key: 'IN_PROGRESS', label: 'В роботі', count: statusCounts.IN_PROGRESS },
    { key: 'READY_FOR_PICKUP', label: 'Готові', count: statusCounts.READY_FOR_PICKUP },
    { key: 'COMPLETED', label: 'Видані', count: statusCounts.COMPLETED },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col font-sans selection:bg-blue-600 selection:text-white pb-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar with Role Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsModalOpen(true)}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
      />

      {/* View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeTab === 'tracking' && (
          <PublicTrackingView 
            onSearch={api.getOrderByTrackingCode} 
            initialCode={selectedTrackingCode} 
          />
        )}

        {activeTab === 'warehouse' && currentRole === 'ADMIN' && (
          <WarehouseView />
        )}

        {activeTab === 'orders' && (
          <>
            {/* Overview Stats (role-adaptive) */}
            <StatsCards orders={scopedOrders} currentRole={currentRole} />

            {/* Filter and Search Section */}
            <div className="space-y-3 mb-5">
              {/* Row 1: Search + View Mode Switcher */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={currentRole === 'ADMIN' ? 'Пошук за клієнтом, телефоном, моделлю чи трек-кодом...' : 'Пошук серед моїх пристроїв (модель, несправність чи код)...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-[#111827] border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View Mode Toggle: Cards / Table */}
                  <div className="bg-[#111827] border border-slate-800 p-1 rounded-lg flex items-center gap-1">
                    <button
                      onClick={() => setViewMode('cards')}
                      title="Вигляд картками"
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      title="Компактна таблиця"
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={fetchOrders}
                    title="Оновити список"
                    className="p-2 rounded-lg bg-[#111827] border border-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Row 2: Status Pills with Counts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {statusTabs.map(tab => {
                  const isActive = selectedStatus === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedStatus(tab.key)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-[#111827] text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-blue-700/60 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orders Content (Cards or Table) */}
            {loading && orders.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-2.5 text-blue-500" />
                <p className="text-xs">Завантаження замовлень сервісного центру...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center bg-[#111827] border border-slate-800 rounded-xl">
                <p className="text-xs text-slate-400">Замовлень за вказаними фільтрами не знайдено</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedStatus('ALL'); }}
                  className="mt-2 text-xs text-blue-400 hover:underline"
                >
                  Скинути всі фільтри
                </button>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    currentRole={currentRole}
                    onSelectTracking={handleSelectTracking}
                  />
                ))}
              </div>
            ) : (
              <OrderTableView
                orders={filteredOrders}
                onStatusChange={handleStatusChange}
                currentRole={currentRole}
                onSelectTracking={handleSelectTracking}
              />
            )}
          </>
        )}
      </main>

      {/* Order Creation Modal */}
      <OrderCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrder}
        currentRole={currentRole}
      />
    </div>
  );
};

export default App;
