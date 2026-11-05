import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { Order, OrderStatus, CreateOrderPayload, AuthUser } from './types';
import { api } from './services/api';
import { ClientPortal } from './components/ClientPortal';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { TwoFactorModal } from './components/TwoFactorModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SecurityAuditView } from './components/SecurityAuditView';
import { SupportTicketModal } from './components/SupportTicketModal';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { OrderCard, statusConfig } from './components/OrderCard';
import { OrderTableView } from './components/OrderTableView';
import { OrderCreateModal } from './components/OrderCreateModal';
import { OrderDetailsModal } from './components/OrderDetailsModal';
import { PublicTrackingView } from './components/PublicTrackingView';
import { WarehouseView } from './components/WarehouseView';
import { ClientsView } from './components/ClientsView';
import { StaffView } from './components/StaffView';
import { Search, RefreshCw, CheckCircle2, AlertCircle, LayoutGrid, List, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => api.getCurrentUser());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordToken, setResetPasswordToken] = useState('');
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ username: string; tempToken: string; method?: string } | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportEmailHint, setSupportEmailHint] = useState('');
  const [forgotPasswordEmailHint, setForgotPasswordEmailHint] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [oauthProcessing, setOauthProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'warehouse' | 'tracking' | 'clients' | 'staff' | 'security'>('orders');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);
  const handledCallbackRef = useRef(false);

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchOrders = async () => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === 'undefined' || handledCallbackRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    if (path.includes('/support')) {
      handledCallbackRef.current = true;
      const emailParam = params.get('email') || '';
      window.history.replaceState({}, '', '/');
      setSupportEmailHint(emailParam);
      setIsSupportModalOpen(true);
      return;
    }

    if (path.includes('/auth/google/callback')) {
      handledCallbackRef.current = true;
      const code = params.get('code');
      const oauthError = params.get('error');
      const googleMode = typeof window !== 'undefined' ? localStorage.getItem('repairhub_google_mode') : null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('repairhub_google_mode');
      }
      window.history.replaceState({}, '', '/');

      if (oauthError) {
        showToast('Вхід через Google скасовано або відхилено', true);
        return;
      }
      if (code) {
        setOauthProcessing(true);
        if (googleMode === 'link' && currentUser) {
          api.linkGoogleCode(code)
            .then(profile => {
              showToast(`Google-акаунт (${profile.googleEmail || profile.email}) успішно підключено!`);
              setIsProfileModalOpen(true);
            })
            .catch((err: any) => {
              showToast(err?.message || 'Не вдалося підключити Google-акаунт', true);
              setIsProfileModalOpen(true);
            })
            .finally(() => setOauthProcessing(false));
        } else {
          api.exchangeGoogleCode(code)
            .then(res => {
              if (res.twoFactorRequired) {
                handleRequireTwoFactor(res.username, res.tempToken || '', res.twoFactorMethod || 'EMAIL');
                showToast('Вхід через Google: потрібне підтвердження 2FA');
              } else {
                setCurrentUser(res);
                showToast(`Ви успішно увійшли через Google як ${res.fullName}`);
              }
            })
            .catch((err: any) => {
              showToast(err?.message || 'Не вдалося завершити вхід через Google', true);
              setIsLoginModalOpen(true);
            })
            .finally(() => setOauthProcessing(false));
        }
      }
      return;
    }

    const token = params.get('token');
    if (token && path.includes('/activate')) {
      handledCallbackRef.current = true;
      window.history.replaceState({}, '', '/');
      api.activateAccount(token)
        .then(msg => {
          showToast(msg);
          setIsLoginModalOpen(true);
        })
        .catch((err: any) => showToast(err?.message || 'Помилка підтвердження електронної пошти', true));
    } else if (token && path.includes('/reset-password')) {
      handledCallbackRef.current = true;
      window.history.replaceState({}, '', '/');
      setResetPasswordToken(token);
      setIsResetPasswordModalOpen(true);
    }
  }, []);

  const isRegularUser = currentUser?.role === 'ROLE_USER' || currentUser?.role === 'ROLE_CLIENT';
  const isStaffUser = Boolean(currentUser && !isRegularUser);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';
  const isManager = currentUser?.role === 'ROLE_MANAGER';

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    showToast(`Ви успішно увійшли як ${user.fullName}`);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setSelectedOrder(null);
    setOrders([]);
    setActiveTab('orders');
    showToast('Ви вийшли з облікового запису');
  };

  const handleRequireTwoFactor = (username: string, tempToken: string, method?: string) => {
    setTwoFactorData({ username, tempToken, method });
    setIsTwoFactorModalOpen(true);
  };

  const handleCreateOrder = async (payload: CreateOrderPayload) => {
    const created = await api.createOrder(payload);
    if (currentUser) {
      setOrders(prev => [created, ...prev]);
    }
    showToast(`Заявку ${created.orderNumber} створено! Код відстеження: ${created.trackingCode}`);
  };

  const handleOrderUpdated = (updated: Order, toastMsg?: string) => {
    setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
    setSelectedOrder(prev => (prev && prev.id === updated.id ? updated : prev));
    if (toastMsg) {
      showToast(toastMsg);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      handleOrderUpdated(updated, `Статус ${updated.orderNumber} змінено на "${statusConfig[newStatus].label}"`);
    } catch (err: any) {
      showToast(err?.message || 'Не вдалося змінити статус', true);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (currentUser?.role !== 'ROLE_ADMIN') return;
    if (!window.confirm('Ви дійсно бажаєте безповоротно видалити це замовлення? Невидані запчастини повернуться на склад.')) return;
    try {
      await api.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
      showToast('Замовлення успішно видалено з бази даних');
    } catch (err: any) {
      showToast(err?.message || 'Помилка видалення замовлення', true);
    }
  };

  const statusCounts = useMemo(() => {
    return {
      ALL: orders.length,
      NEW: orders.filter(o => o.status === 'NEW').length,
      IN_DIAGNOSTICS: orders.filter(o => o.status === 'IN_DIAGNOSTICS').length,
      IN_PROGRESS: orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'PENDING_APPROVAL').length,
      READY_FOR_PICKUP: orders.filter(o => o.status === 'READY_FOR_PICKUP').length,
      COMPLETED: orders.filter(o => o.status === 'COMPLETED').length
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
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
    { key: 'COMPLETED', label: 'Видані', count: statusCounts.COMPLETED }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans antialiased">
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200 ${
          toast.isError
            ? 'bg-rose-950/95 border-rose-500/40 text-rose-100'
            : 'bg-slate-900 border-slate-700 text-white'
        }`}>
          {toast.isError ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {oauthProcessing && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl px-6 py-5 flex items-center gap-3 shadow-2xl">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
            <span className="text-sm font-medium text-white">Завершення входу через Google...</span>
          </div>
        </div>
      )}

      {!isStaffUser || !currentUser ? (
        <ClientPortal
          currentUser={currentUser}
          myOrders={orders}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenRegister={() => setIsRegisterModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onOpenSupport={() => setIsSupportModalOpen(true)}
          onLogout={handleLogout}
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
            onOpenProfile={() => setIsProfileModalOpen(true)}
          />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
            {activeTab === 'tracking' && (
              <PublicTrackingView onSearch={code => api.getOrderByTrackingCode(code)} />
            )}

            {activeTab === 'warehouse' && (
              <WarehouseView currentUser={currentUser} orders={orders} onNotify={msg => showToast(msg)} />
            )}

            {(isAdmin || isManager) && activeTab === 'clients' && <ClientsView />}

            {isAdmin && activeTab === 'staff' && <StaffView />}

            {isAdmin && activeTab === 'security' && <SecurityAuditView currentUser={currentUser} />}

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
                        onChange={e => setSearchQuery(e.target.value)}
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
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                              isActive ? 'bg-indigo-700/60 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
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
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStatus('ALL');
                      }}
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
                        onOpenDetails={o => setSelectedOrder(o)}
                        onDeleteOrder={handleDeleteOrder}
                      />
                    ))}
                  </div>
                ) : (
                  <OrderTableView
                    orders={filteredOrders}
                    currentUser={currentUser}
                    onStatusChange={handleStatusChange}
                    onOpenDetails={o => setSelectedOrder(o)}
                    onDeleteOrder={handleDeleteOrder}
                  />
                )}
              </>
            )}
          </main>

          <OrderDetailsModal
            order={selectedOrder}
            isOpen={!!selectedOrder}
            currentUser={currentUser}
            onClose={() => setSelectedOrder(null)}
            onOrderUpdated={handleOrderUpdated}
            onOpenWarehouseTab={() => setActiveTab('warehouse')}
          />
        </>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
        onRequireTwoFactor={handleRequireTwoFactor}
        onOpenForgotPassword={() => setIsForgotPasswordModalOpen(true)}
        onOpenRegister={() => setIsRegisterModalOpen(true)}
        onOpenSupport={(emailHint) => {
          setIsLoginModalOpen(false);
          setSupportEmailHint(emailHint || '');
          setIsSupportModalOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleLoginSuccess}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      {twoFactorData && (
        <TwoFactorModal
          isOpen={isTwoFactorModalOpen}
          username={twoFactorData.username}
          tempToken={twoFactorData.tempToken}
          method={twoFactorData.method}
          onClose={() => {
            setIsTwoFactorModalOpen(false);
            setTwoFactorData(null);
          }}
          onSuccess={handleLoginSuccess}
        />
      )}

      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        initialEmail={forgotPasswordEmailHint}
        onClose={() => {
          setIsForgotPasswordModalOpen(false);
          setForgotPasswordEmailHint('');
        }}
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

      <UserProfileModal
        isOpen={isProfileModalOpen}
        currentUser={currentUser}
        onClose={() => setIsProfileModalOpen(false)}
        onRequestPasswordReset={(email) => {
          setForgotPasswordEmailHint(email);
          setIsForgotPasswordModalOpen(true);
        }}
        onSessionExpired={() => {
          handleLogout();
          showToast('Сеанс завершено. Будь ласка, увійдіть знову.', true);
        }}
        onProfileUpdated={(profile, newToken) => {
          if (currentUser) {
            const updated: AuthUser = {
              ...currentUser,
              username: profile.username || currentUser.username,
              fullName: profile.fullName || currentUser.fullName,
              token: newToken || currentUser.token,
              emailVerified: profile.emailVerified,
              twoFactorEnabled: profile.twoFactorEnabled,
              twoFactorMethod: profile.twoFactorMethod
            };
            setCurrentUser(updated);
            localStorage.setItem('repairhub_user', JSON.stringify(updated));
            if (newToken) {
              localStorage.setItem('repairhub_token', newToken);
            }
          }
        }}
      />

      <OrderCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrder}
        isStaff={isStaffUser}
        currentUser={currentUser}
      />

      <SupportTicketModal
        isOpen={isSupportModalOpen}
        initialEmail={supportEmailHint}
        currentUser={currentUser}
        onClose={() => {
          setIsSupportModalOpen(false);
          setSupportEmailHint('');
        }}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
};

export default App;
