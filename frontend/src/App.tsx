import React, { useEffect, useState, useMemo } from 'react';
import type { Order, OrderStatus, CreateOrderPayload } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { OrderCard } from './components/OrderCard';
import { OrderCreateModal } from './components/OrderCreateModal';
import { PublicTrackingView } from './components/PublicTrackingView';
import { WarehouseView } from './components/WarehouseView';
import { Search, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'warehouse' | 'tracking'>('orders');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
    showToast(`Замовлення ${created.orderNumber} успішно оформлено! Трек-код: ${created.trackingCode}`);
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    const updated = await api.updateOrderStatus(orderId, newStatus);
    setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    showToast(`Статус замовлення ${updated.orderNumber} оновлено на "${newStatus}"`);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchQuery = 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.client.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.client.phone.includes(searchQuery) ||
        order.device.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.device.brand.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = selectedStatus === 'ALL' || order.status === selectedStatus;

      return matchQuery && matchStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => setIsModalOpen(true)}
      />

      {/* View Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'tracking' && (
          <PublicTrackingView onSearch={api.getOrderByTrackingCode} />
        )}

        {activeTab === 'warehouse' && (
          <WarehouseView />
        )}

        {activeTab === 'orders' && (
          <>
            {/* Overview Stats */}
            <StatsCards orders={orders} />

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Пошук за клієнтом, телефоном, моделлю або трек-кодом..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Pill Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Статус:
                </span>
                {[
                  { key: 'ALL', label: 'Всі' },
                  { key: 'NEW', label: 'Нові' },
                  { key: 'IN_DIAGNOSTICS', label: 'Діагностика' },
                  { key: 'IN_PROGRESS', label: 'В роботі' },
                  { key: 'READY_FOR_PICKUP', label: 'Готові' },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setSelectedStatus(item.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      selectedStatus === item.key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <button
                  onClick={fetchOrders}
                  title="Оновити список"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Orders Grid */}
            {loading && orders.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-indigo-500" />
                <p className="text-sm">Завантаження замовлень сервісного центру...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
                <p className="text-sm text-slate-400">Замовлень за вказаними фільтрами не знайдено</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedStatus('ALL'); }}
                  className="mt-2 text-xs text-indigo-400 hover:underline"
                >
                  Скинути всі фільтри
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 RepairHub — Інформаційна система управління сервісним центром (Варіант 19)</span>
          <span className="font-mono text-slate-500">React + TypeScript + Tailwind CSS</span>
        </div>
      </footer>

      {/* Order Creation Modal */}
      <OrderCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrder}
      />
    </div>
  );
};

export default App;
