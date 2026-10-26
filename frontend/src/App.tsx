import React, { useEffect, useState, useMemo } from 'react';
import type { Order, OrderStatus, CreateOrderPayload, AuthUser } from './types';
import { api } from './services/api';
import { ClientPortal } from './components/ClientPortal';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { TwoFactorModal } from './components/TwoFactorModal';
import { EmailInboxSimulatorModal } from './components/EmailInboxSimulatorModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SecurityAuditView } from './components/SecurityAuditView';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { OrderCard } from './components/OrderCard';
import { OrderTableView } from './components/OrderTableView';
import { OrderCreateModal } from './components/OrderCreateModal';
import { PublicTrackingView } from './components/PublicTrackingView';
import { WarehouseView } from './components/WarehouseView';
import { ClientsView } from './components/ClientsView';
import { StaffView } from './components/StaffView';
import { Search, RefreshCw, CheckCircle2, LayoutGrid, List, X, Mail } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => api.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState('');
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ username: string; tempToken: string } | null>(null);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'warehouse' | 'tracking' | 'clients' | 'staff' | 'security'>('orders');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
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
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    showToast(`Ви успішно увійшли як ${user.fullName}`);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveTab('orders');
    showToast('Ви вийшли з внутрішньої панелі CRM');
  };

  const handleRequireTwoFactor = (username: string, tempToken: string) => {
    setTwoFactorData({ username, tempToken });
    setIsTwoFactorModalOpen(true);
  };

  const handleOpenResetWithToken = (token?: string) => {
    if (token) {
      setResetPasswordToken(token);
    }
    setIsForgotPasswordModalOpen(false);
    setIsResetPasswordModalOpen(true);
  };

  const handleCreateOrder = async (payload: CreateOrderPayload) => {
    const created = await api.createOrder(payload);
    setOrders(prev => [created, ...prev]);
    showToast(`Замовлення ${created.orderNumber} успішно створено (код трекінгу: ${created.trackingCode})`);
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    const updated = await api.updateOrderStatus(orderId, newStatus);
    setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    showToast(`Статус ${updated.orderNumber} змінено на "${newStatus}"`);
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (currentUser?.role !== 'ROLE_ADMIN') return;
    if (!window.confirm('Ви дійсно бажаєте безповоротно видалити це замовлення?')) return;
    try {
      await api.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      showToast('Замовлення успішно видалено з бази даних');
    } catch {
      showToast('Помилка видалення замовлення');
    }
  };

  const statusCounts = useMemo(() => {
    return {
      ALL: orders.length,
      NEW: orders.filter(o => o.status === 'NEW').length,
      IN_DIAGNOSTICS: orders.filter(o => o.status === 'IN_DIAGNOSTICS').length,
      IN_PROGRESS: orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'PENDING_APPROVAL').length,
      READY_FOR_PICKUP: orders.filter(o => o.status === 'READY_FOR_PICKUP').length,
      COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
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
  }, [orders, searchQuery, selectedStatus]);

  const statusTabs = [
    { key: 'ALL', label: 'Всі замовлення', count: statusCounts.ALL },
    { key: 'NEW', label: 'Нові', count: statusCounts.NEW },
    { key: 'IN_DIAGNOSTICS', label: 'Діагностика', count: statusCounts.IN_DIAGNOSTICS },
    { key: 'IN_PROGRESS', label: 'В роботі', count: statusCounts.IN_PROGRESS },
    { key: 'READY_FOR_PICKUP', label: 'Готові до видачі', count: statusCounts.READY_FOR_PICKUP },
    { key: 'COMPLETED', label: 'Видані', count: statusCounts.COMPLETED },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans antialiased">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <button
        onClick={() => setIsInboxModalOpen(true)}
        title="Поштовий клієнт (Mock Email)"
        className="fixed bottom-5 left-5 z-40 p-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-xl shadow-sky-500/20 flex items-center gap-2 text-xs font-semibold transition active:scale-95"
      >
        <Mail className="w-4 h-4" />
        <span className="hidden sm:inline">Поштова скринька</span>
      </button>

      {!currentUser ? (
        <ClientPortal
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenRegister={() => setIsRegisterModalOpen(true)}
          onOpenInbox={() => setIsInboxModalOpen(true)}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <>
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            currentUser={currentUser}
            onLogout={handleLogout}
            onBackToPortal={() => setCurrentUser(null)}
            onOpenInbox={() => setIsInboxModalOpen(true)}
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
            {activeTab === 'tracking' && (
              <PublicTrackingView onSearch={(code) => api.getOrderByTrackingCode(code)} />
            )}

            {activeTab === 'warehouse' && (
              <WarehouseView currentUser={currentUser} />
            )}

            {activeTab === 'clients' && (
              <ClientsView />
            )}

            {activeTab === 'staff' && (
              <StaffView />
            )}

            {activeTab === 'security' && (
              <SecurityAuditView />
            )}

            {activeTab === 'orders' && (
              <>
                <StatsCards orders={orders} currentUser={currentUser} />

                <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Пошук за номером, кодом трекінгу, телефоном, клієнтом..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-[#0B0F19] border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
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
                      <div className="bg-[#0B0F19] border border-slate-800 p-1 rounded-lg flex items-center gap-1">
                        <button
                          onClick={() => setViewMode('cards')}
                          title="Вигляд картками"
                          className={`p-1.5 rounded transition-colors ${
                            viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setViewMode('table')}
                          title="Компактна таблиця"
                          className={`p-1.5 rounded transition-colors ${
                            viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <List className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={fetchOrders}
                        title="Оновити список"
                        className="p-2 rounded-lg bg-[#0B0F19] border border-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {statusTabs.map(tab => {
                      const isActive = selectedStatus === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setSelectedStatus(tab.key)}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-[#0B0F19] text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isActive ? 'bg-indigo-700/60 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {loading && orders.length === 0 ? (
                  <div className="py-20 text-center text-slate-500">
                    <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-2.5 text-indigo-500" />
                    <p className="text-xs">Завантаження замовлень сервісного центру...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="py-16 text-center bg-[#111827] border border-slate-800 rounded-xl">
                    <p className="text-xs text-slate-400">Замовлень за вказаними фільтрами не знайдено</p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedStatus('ALL'); }}
                      className="mt-2 text-xs text-indigo-400 hover:underline"
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
                        currentUser={currentUser}
                        onStatusChange={handleStatusChange}
                        onDeleteOrder={handleDeleteOrder}
                      />
                    ))}
                  </div>
                ) : (
                  <OrderTableView
                    orders={filteredOrders}
                    currentUser={currentUser}
                    onStatusChange={handleStatusChange}
                    onDeleteOrder={handleDeleteOrder}
                  />
                )}
              </>
            )}
          </main>
        </>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        onRequireTwoFactor={handleRequireTwoFactor}
        onOpenForgotPassword={() => setIsForgotPasswordModalOpen(true)}
        onOpenRegister={() => setIsRegisterModalOpen(true)}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleLoginSuccess}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        onOpenInbox={() => setIsInboxModalOpen(true)}
      />

      {twoFactorData && (
        <TwoFactorModal
          isOpen={isTwoFactorModalOpen}
          username={twoFactorData.username}
          tempToken={twoFactorData.tempToken}
          onClose={() => {
            setIsTwoFactorModalOpen(false);
            setTwoFactorData(null);
          }}
          onSuccess={handleLoginSuccess}
          onOpenInbox={() => setIsInboxModalOpen(true)}
        />
      )}

      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
        onOpenResetWithToken={handleOpenResetWithToken}
        onOpenInbox={() => setIsInboxModalOpen(true)}
        onSwitchToLogin={() => {
          setIsForgotPasswordModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        initialToken={resetPasswordToken}
        onClose={() => {
          setIsResetPasswordModalOpen(false);
          setResetPasswordToken('');
        }}
        onSwitchToLogin={() => {
          setIsResetPasswordModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <EmailInboxSimulatorModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        onOpenResetWithToken={handleOpenResetWithToken}
        onActivated={() => {
          showToast('Акаунт успішно активовано через пошту!');
        }}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        currentUser={currentUser}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenInbox={() => setIsInboxModalOpen(true)}
      />

      <OrderCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrder}
        isStaff={!!currentUser}
      />
    </div>
  );
};

export default App;
