import type { 
  Order, 
  SparePart, 
  ServiceCatalogItem,
  CreateOrderPayload, 
  OrderStatus, 
  AuthUser, 
  ClientRecord, 
  StaffMember,
  SecurityAuditLog,
  MockEmail,
  UserSecurityProfile,
  CaptchaData
} from '../types';

const API_BASE_URL = typeof window !== 'undefined' && window.location.port === '3000'
  ? '/api/v1'
  : 'http://localhost:8080/api/v1';

let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null;

function getToken(): string | null {
  return authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
}

function isNetworkFailure(err: any): boolean {
  const msg = String(err?.message || '');
  return msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('Load failed');
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  const errData = await res.json().catch(() => null);
  if (errData?.validationErrors && typeof errData.validationErrors === 'object') {
    return Object.values(errData.validationErrors).join(', ');
  }
  return errData?.message || fallback;
}

function mapBackendOrderToFrontend(item: any): Order {
  return {
    id: item.id,
    orderNumber: item.orderNumber,
    trackingCode: item.trackingCode,
    client: {
      id: item.client?.id || item.id,
      fullName: item.client?.fullName || 'Клієнт',
      phone: item.client?.phone || '',
      email: item.client?.email,
      notes: item.client?.notes
    },
    device: {
      id: item.device?.id || item.id,
      deviceType: item.device?.deviceType || 'Пристрій',
      brand: item.device?.brand || '',
      model: item.device?.model || '',
      serialNumber: item.device?.serialNumber,
      imei: item.device?.imei,
      appearanceNotes: item.device?.appearanceNotes
    },
    technicianId: item.technicianId || undefined,
    technicianName: item.technicianName || undefined,
    status: item.status,
    priority: item.priority || 'MEDIUM',
    defectDescription: item.defectDescription || '',
    diagnosticsNotes: item.diagnosticsNotes,
    estimatedCost: Number(item.estimatedCost) || 0,
    totalCost: Number(item.totalCost) || 0,
    createdAt: item.createdAt ? item.createdAt.replace('T', ' ').substring(0, 16) : new Date().toISOString().substring(0, 16),
    completedAt: item.completedAt ? item.completedAt.replace('T', ' ').substring(0, 16) : undefined,
    parts: (item.parts || []).map((p: any) => ({
      id: p.id,
      sparePartId: p.sparePartId,
      sku: p.sku,
      partName: p.name || p.partName,
      quantity: p.quantity,
      unitPrice: Number(p.unitPrice)
    })),
    services: (item.services || []).map((s: any) => ({
      id: s.id,
      serviceId: s.serviceId,
      serviceName: s.name || s.serviceName,
      price: Number(s.price),
      status: s.status
    }))
  };
}

function recalculateMockOrderTotal(order: Order): void {
  const partsSum = order.parts.reduce((acc, p) => acc + p.unitPrice * p.quantity, 0);
  const servicesSum = order.services.reduce((acc, s) => acc + s.price, 0);
  if (order.parts.length === 0 && order.services.length === 0) {
    order.totalCost = order.estimatedCost || 0;
  } else {
    order.totalCost = partsSum + servicesSum;
  }
}

let mockOrders: Order[] = [
  {
    id: 1,
    orderNumber: 'SRV-2026-0001',
    trackingCode: 'TRK-A8F91B',
    client: {
      id: 1,
      fullName: 'Іван Сидоренко',
      phone: '+380671234567',
      email: 'ivan.sydor@gmail.com',
      notes: 'Постійний клієнт, знижка 5%'
    },
    device: {
      id: 1,
      deviceType: 'Ноутбук',
      brand: 'Asus',
      model: 'ROG Zephyrus G14',
      serialNumber: 'SN-ASUS-98231',
      appearanceNotes: 'Дрібні подряпини на верхній кришці',
      specs: { cpu: 'Ryzen 9', ram: '16GB', ssd: '1TB' }
    },
    technicianId: 3,
    technicianName: 'Тарас Бондаренко',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    defectDescription: 'Перегрівається під навантаженням, шум вентиляторів',
    diagnosticsNotes: 'Забруднення радіатора, пересихання термопасти. Потрібна чистка та заміна термоінтерфейсу.',
    estimatedCost: 850,
    totalCost: 850,
    createdAt: '2026-09-21 10:30',
    parts: [
      { id: 1, sparePartId: 1, sku: 'TH-MX4-4G', partName: 'Термопаста Arctic MX-4 (4г)', quantity: 1, unitPrice: 250 }
    ],
    services: [
      { id: 1, serviceId: 1, serviceName: 'Комплексна чистка та заміна термопасти', price: 600 }
    ]
  },
  {
    id: 2,
    orderNumber: 'SRV-2026-0002',
    trackingCode: 'TRK-B2C44E',
    client: {
      id: 2,
      fullName: 'Марія Василенко',
      phone: '+380509876543',
      email: 'mariya.vas@ukr.net',
      notes: 'Корпоративний клієнт (ТОВ Альфа)'
    },
    device: {
      id: 2,
      deviceType: 'Смартфон',
      brand: 'Apple',
      model: 'iPhone 13 Pro',
      imei: '356987123456789',
      appearanceNotes: 'Тріщина на склі дисплея, камери цілі',
      specs: { color: 'Sierra Blue', storage: '256GB' }
    },
    technicianId: 4,
    technicianName: 'Дмитро Мельник',
    status: 'READY_FOR_PICKUP',
    priority: 'HIGH',
    defectDescription: 'Розбитий екран, сенсор не реагує у верхній частині',
    diagnosticsNotes: 'Пошкоджена матриця. Замінено оригінальний екранний модуль.',
    estimatedCost: 4800,
    totalCost: 4800,
    createdAt: '2026-09-21 14:15',
    completedAt: '2026-09-22 17:00',
    parts: [
      { id: 2, sparePartId: 2, sku: 'DISP-IPH13P-OEM', partName: 'Дисплейний модуль iPhone 13 Pro (OEM)', quantity: 1, unitPrice: 4000 }
    ],
    services: [
      { id: 2, serviceId: 2, serviceName: 'Заміна дисплейного модуля смартфона', price: 800 }
    ]
  },
  {
    id: 3,
    orderNumber: 'SRV-2026-0003',
    trackingCode: 'TRK-F7D33A',
    client: {
      id: 3,
      fullName: 'Сергій Павленко',
      phone: '+380631122334',
      email: 'pavlenko.s@gmail.com'
    },
    device: {
      id: 3,
      deviceType: 'Планшет',
      brand: 'Samsung',
      model: 'Galaxy Tab S8',
      serialNumber: 'SN-SMG-44122',
      appearanceNotes: 'Без видимих пошкоджень'
    },
    technicianId: 3,
    technicianName: 'Тарас Бондаренко',
    status: 'NEW',
    priority: 'MEDIUM',
    defectDescription: 'Потрапила волога, перестав заряджатися',
    estimatedCost: 0,
    totalCost: 0,
    createdAt: '2026-09-22 09:00',
    parts: [],
    services: []
  }
];

let mockSpareParts: SparePart[] = [
  { id: 1, sku: 'TH-MX4-4G', name: 'Термопаста Arctic MX-4 (4г)', category: 'Витратні матеріали', stockQuantity: 15, minStockLimit: 3, retailPrice: 250, purchasePrice: 150 },
  { id: 2, sku: 'DISP-IPH13P-OEM', name: 'Дисплейний модуль iPhone 13 Pro (OEM)', category: 'Дисплеї', stockQuantity: 4, minStockLimit: 2, retailPrice: 4000, purchasePrice: 2800 },
  { id: 3, sku: 'BAT-SAM-S8', name: 'Акумулятор Samsung Galaxy Tab S8', category: 'Акумулятори', stockQuantity: 6, minStockLimit: 2, retailPrice: 1400, purchasePrice: 900 },
  { id: 4, sku: 'CON-TYPEC-GEN', name: 'Роз\'єм живлення USB Type-C', category: 'Шлейфи та роз\'єми', stockQuantity: 50, minStockLimit: 10, retailPrice: 120, purchasePrice: 35 }
];

let mockServiceCatalog: ServiceCatalogItem[] = [
  { id: 1, name: 'Комплексна чистка та заміна термопасти', description: 'Розбирання, видалення пилу, нанесення термопасти', standardPrice: 600 },
  { id: 2, name: 'Заміна дисплейного модуля смартфона', description: 'Демонтаж пошкодженого екрана, проклейка та калібрування', standardPrice: 800 },
  { id: 3, name: 'Ультразвукова чистка плати після рідини', description: 'Сушка, видалення оксидів в ультразвуковій ванні', standardPrice: 700 },
  { id: 4, name: 'Апаратна діагностика вузлів', description: 'Тестування живлення та компонентів материнської плати', standardPrice: 250 }
];

let mockClients: ClientRecord[] = [
  { id: 1, fullName: 'Іван Сидоренко', phone: '+380671234567', email: 'ivan.sydor@gmail.com', address: 'м. Київ, вул. Хрещатик, 10', notes: 'Постійний клієнт, знижка 5%', ordersCount: 2 },
  { id: 2, fullName: 'Марія Василенко', phone: '+380509876543', email: 'mariya.vas@ukr.net', address: 'м. Київ, пр. Перемоги, 45', notes: 'Корпоративний клієнт (ТОВ Альфа)', ordersCount: 1 },
  { id: 3, fullName: 'Сергій Павленко', phone: '+380631122334', email: 'pavlenko.s@gmail.com', address: 'м. Івано-Франківськ, вул. Незалежності, 12', notes: 'Термінове обслуговування', ordersCount: 1 }
];

let mockStaff: StaffMember[] = [
  { id: 1, username: 'admin_oleg', fullName: 'Олег Петренко', role: 'ROLE_ADMIN', phone: '+380671112233', email: 'admin@repairhub.ua', emailVerified: true, isActive: true, createdAt: '2026-09-01' },
  { id: 2, username: 'mgr_alina', fullName: 'Аліна Ковальчук', role: 'ROLE_MANAGER', phone: '+380502223344', email: 'manager@repairhub.ua', emailVerified: true, isActive: true, createdAt: '2026-09-05' },
  { id: 3, username: 'tech_taras', fullName: 'Тарас Бондаренко', role: 'ROLE_TECHNICIAN', phone: '+380633334455', email: 'tech@repairhub.ua', emailVerified: true, isActive: true, createdAt: '2026-09-10' },
  { id: 4, username: 'tech_dmytro', fullName: 'Дмитро Мельник', role: 'ROLE_TECHNICIAN', phone: '+380994445566', email: 'dmytro@repairhub.ua', emailVerified: true, isActive: true, createdAt: '2026-09-12' }
];

export const api = {
  async login(username: string, password: string): Promise<AuthUser> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.twoFactorRequired || data.requiresTwoFactor) {
          return {
            username: data.username || username,
            fullName: data.fullName || '',
            role: data.role || 'ROLE_USER',
            token: '',
            twoFactorRequired: true,
            tempToken: data.tempToken
          };
        }
        authToken = data.token;
        const user: AuthUser = {
          username: data.username || username,
          fullName: data.fullName || username,
          role: data.role || 'ROLE_USER',
          token: data.token,
          email: data.email,
          emailVerified: data.emailVerified,
          twoFactorEnabled: data.twoFactorEnabled
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('repairhub_token', data.token);
          localStorage.setItem('repairhub_user', JSON.stringify(user));
        }
        return user;
      }
      if (res.status === 423) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Обліковий запис заблоковано через перевищення кількості невдалих спроб входу.');
      }
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || "Невірне ім'я користувача або пароль");
    } catch (err: any) {
      if (!isNetworkFailure(err)) {
        throw err;
      }
      const validAccounts: Record<string, { pass: string; role: string; name: string }> = {
        'admin_oleg': { pass: 'admin123', role: 'ROLE_ADMIN', name: 'Олег Петренко' },
        'mgr_alina': { pass: 'manager123', role: 'ROLE_MANAGER', name: 'Аліна Ковальчук' },
        'tech_taras': { pass: 'tech123', role: 'ROLE_TECHNICIAN', name: 'Тарас Бондаренко' },
        'user_vlad': { pass: 'Vlad@2026!', role: 'ROLE_USER', name: 'Владислав Яворський' }
      };
      const found = validAccounts[username];
      if (found && found.pass === password) {
        const mockToken = 'mock-jwt-token-' + Date.now();
        authToken = mockToken;
        const user: AuthUser = {
          username,
          fullName: found.name,
          role: found.role,
          token: mockToken,
          email: `${username}@repairhub.ua`,
          emailVerified: true
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('repairhub_token', mockToken);
          localStorage.setItem('repairhub_user', JSON.stringify(user));
        }
        return user;
      }
      throw new Error("Невірне ім'я користувача або пароль");
    }
  },

  logout(): void {
    authToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('repairhub_token');
      localStorage.removeItem('repairhub_user');
    }
  },

  getCurrentUser(): AuthUser | null {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('repairhub_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
        }
      }
    }
    return null;
  },

  async getCaptcha(): Promise<CaptchaData> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/captcha`);
      if (res.ok) {
        const data = await res.json();
        return {
          token: data.captchaToken || data.token,
          svg: data.captchaSvg || data.svg
        };
      }
    } catch {
    }
    return {
      token: 'mock-token-' + Date.now(),
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="50" viewBox="0 0 160 50"><rect width="100%" height="100%" fill="#0f172a"/><text x="35" y="34" font-family="monospace" font-size="28" font-weight="bold" fill="#38bdf8" letter-spacing="4">8K4M</text></svg>'
    };
  },

  async register(payload: { username: string; password: string; fullName: string; email?: string; phone?: string; role?: string; captchaToken?: string; captchaAnswer?: string }): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      const user: AuthUser = {
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        token: data.token || '',
        email: data.email,
        emailVerified: data.emailVerified,
        twoFactorEnabled: data.twoFactorEnabled
      };
      if (data.token) {
        authToken = data.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('repairhub_token', data.token);
          localStorage.setItem('repairhub_user', JSON.stringify(user));
        }
      }
      return user;
    }
    throw new Error(await extractErrorMessage(res, 'Помилка реєстрації'));
  },

  async activateAccount(token: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/auth/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    if (res.ok) {
      const data = await res.json();
      return data.message || 'Обліковий запис успішно активовано';
    }
    throw new Error(await extractErrorMessage(res, 'Невірний або прострочений токен активації'));
  },

  async forgotPassword(email: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      const data = await res.json();
      return data.message || 'Інструкції для відновлення пароля надіслано на email';
    }
    throw new Error(await extractErrorMessage(res, 'Помилка надсилання запиту'));
  },

  async resetPassword(token: string, newPassword: string): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    if (res.ok) {
      const data = await res.json();
      return data.message || 'Пароль успішно змінено';
    }
    throw new Error(await extractErrorMessage(res, 'Невірний або прострочений токен відновлення'));
  },

  async verify2FA(username: string, code: string, tempToken: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code, tempToken })
    });
    if (res.ok) {
      const data = await res.json();
      authToken = data.token;
      const user: AuthUser = {
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        token: data.token,
        email: data.email,
        emailVerified: data.emailVerified,
        twoFactorEnabled: data.twoFactorEnabled
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('repairhub_token', data.token);
        localStorage.setItem('repairhub_user', JSON.stringify(user));
      }
      return user;
    }
    throw new Error(await extractErrorMessage(res, 'Невірний код 2FA'));
  },

  async loginOAuth(provider: string, email: string, name: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, email, fullName: name, externalId: `${provider}_${email.toLowerCase()}` })
    });
    if (res.ok) {
      const data = await res.json();
      authToken = data.token;
      const user: AuthUser = {
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        token: data.token,
        email: data.email,
        emailVerified: data.emailVerified,
        twoFactorEnabled: data.twoFactorEnabled
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('repairhub_token', data.token);
        localStorage.setItem('repairhub_user', JSON.stringify(user));
      }
      return user;
    }
    throw new Error(await extractErrorMessage(res, 'Помилка OAuth входу'));
  },

  async getMockEmails(): Promise<MockEmail[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/emails`);
      if (res.ok) {
        const data = await res.json();
        return data.map((e: any) => ({
          id: e.id,
          recipient: e.toEmail || e.recipient,
          subject: e.subject,
          body: e.body,
          sentAt: e.createdAt || e.sentAt,
          type: e.type,
          token: e.token,
          actionUrl: e.actionUrl
        }));
      }
    } catch {
    }
    return [];
  },

  async getSecurityAuditLogs(): Promise<SecurityAuditLog[]> {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/security/audit-logs`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      return await res.json();
    }
    return [];
  },

  async lockUser(id: number): Promise<void> {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/security/users/${id}/lock`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Не вдалося заблокувати користувача'));
    }
  },

  async unlockUser(id: number): Promise<void> {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/security/users/${id}/unlock`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Не вдалося розблокувати користувача'));
    }
  },

  async getUserProfile(): Promise<UserSecurityProfile> {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/profile`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Помилка завантаження профілю');
  },

  async toggleTwoFactor(enabled: boolean): Promise<UserSecurityProfile> {
    const token = getToken();
    const res = await fetch(`${API_BASE_URL}/profile/2fa/toggle`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ enabled })
    });
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Помилка зміни статусу 2FA');
  },

  async getOrders(): Promise<Order[]> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map(mapBackendOrderToFrontend);
      }
    } catch {
    }
    return [...mockOrders];
  },

  async getOrderById(orderId: number): Promise<Order> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        return mapBackendOrderToFrontend(await res.json());
      }
      throw new Error(await extractErrorMessage(res, 'Замовлення не знайдено'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const found = mockOrders.find(o => o.id === orderId);
      if (found) return { ...found };
      throw new Error('Замовлення не знайдено');
    }
  },

  async getOrdersByPhoneOrTracking(query: string): Promise<Order[]> {
    const q = query.trim();
    if (!q) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/search?query=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data.map(mapBackendOrderToFrontend) : [mapBackendOrderToFrontend(data)];
      }
      const singleRes = await fetch(`${API_BASE_URL}/tracking/${encodeURIComponent(q)}`);
      if (singleRes.ok) {
        const data = await singleRes.json();
        return [mapBackendOrderToFrontend(data)];
      }
      return [];
    } catch {
      const upper = q.toUpperCase();
      return mockOrders.filter(o =>
        o.trackingCode.toUpperCase().includes(upper) ||
        o.orderNumber.toUpperCase().includes(upper) ||
        o.client.phone.replace(/[\s\-()]/g, '').includes(upper.replace(/[\s\-()]/g, ''))
      );
    }
  },

  async getOrderByTrackingCode(code: string): Promise<Order | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        return mapBackendOrderToFrontend(data);
      }
      if (res.status === 404) {
        return null;
      }
    } catch {
    }
    const cleaned = code.trim().toUpperCase();
    const order = mockOrders.find(o =>
      o.trackingCode.toUpperCase() === cleaned ||
      o.orderNumber.toUpperCase() === cleaned
    );
    return order ? { ...order } : null;
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const token = getToken();
    const endpoint = token ? `${API_BASE_URL}/orders` : `${API_BASE_URL}/tracking/request`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientName: payload.clientName,
          clientPhone: payload.clientPhone,
          clientEmail: payload.clientEmail,
          deviceType: payload.deviceType,
          brand: payload.brand,
          model: payload.model,
          serialNumber: payload.serialNumberOrImei,
          appearanceNotes: payload.appearanceNotes,
          defectDescription: payload.defectDescription,
          priority: payload.priority,
          estimatedCost: payload.estimatedCost
        })
      });
      if (res.ok) {
        const data = await res.json();
        return mapBackendOrderToFrontend(data);
      }
      throw new Error(await extractErrorMessage(res, 'Не вдалося створити замовлення'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) {
        throw err;
      }
      const nextId = mockOrders.length > 0 ? Math.max(...mockOrders.map(o => o.id)) + 1 : 1;
      const padNum = String(nextId).padStart(4, '0');
      const orderNum = `SRV-2026-${padNum}`;
      const trackCode = `TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const newOrder: Order = {
        id: nextId,
        orderNumber: orderNum,
        trackingCode: trackCode,
        client: {
          id: nextId,
          fullName: payload.clientName,
          phone: payload.clientPhone,
          email: payload.clientEmail
        },
        device: {
          id: nextId,
          deviceType: payload.deviceType,
          brand: payload.brand,
          model: payload.model,
          serialNumber: payload.serialNumberOrImei,
          appearanceNotes: payload.appearanceNotes
        },
        status: 'NEW',
        priority: payload.priority,
        defectDescription: payload.defectDescription,
        estimatedCost: payload.estimatedCost,
        totalCost: payload.estimatedCost,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        parts: [],
        services: []
      };

      mockOrders = [newOrder, ...mockOrders];
      return newOrder;
    }
  },

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        return mapBackendOrderToFrontend(data);
      }
      throw new Error(await extractErrorMessage(res, 'Не вдалося змінити статус замовлення'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const found = mockOrders.find(o => o.id === orderId);
      if (found) {
        if (status === 'CANCELED' && found.status !== 'CANCELED') {
          found.parts.forEach(op => {
            const sp = mockSpareParts.find(p => p.id === op.sparePartId || p.name === op.partName);
            if (sp) sp.stockQuantity += op.quantity;
          });
          found.parts = [];
          found.totalCost = 0;
        }
        found.status = status;
        return { ...found };
      }
      throw new Error('Замовлення не знайдено');
    }
  },

  async updateOrderDiagnostics(
    orderId: number,
    payload: { diagnosticsNotes: string; technicianId?: number; estimatedCost?: number }
  ): Promise<Order> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/diagnostics`, {
        method: 'PATCH',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return mapBackendOrderToFrontend(await res.json());
      }
      throw new Error(await extractErrorMessage(res, 'Помилка збереження діагностики'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const found = mockOrders.find(o => o.id === orderId);
      if (!found) throw new Error('Замовлення не знайдено');
      found.diagnosticsNotes = payload.diagnosticsNotes;
      if (payload.estimatedCost !== undefined) found.estimatedCost = payload.estimatedCost;
      if (payload.technicianId) {
        const tech = mockStaff.find(s => s.id === payload.technicianId);
        if (tech) {
          found.technicianId = tech.id;
          found.technicianName = tech.fullName;
        }
      }
      if (found.status === 'NEW' || found.status === 'IN_DIAGNOSTICS') {
        found.status = 'IN_PROGRESS';
      }
      recalculateMockOrderTotal(found);
      return { ...found };
    }
  },

  async addPartToOrder(orderId: number, sparePartId: number, quantity: number): Promise<Order> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/parts`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sparePartId, quantity })
      });
      if (res.ok) {
        return mapBackendOrderToFrontend(await res.json());
      }
      throw new Error(await extractErrorMessage(res, 'Помилка списання деталі зі складу'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const found = mockOrders.find(o => o.id === orderId);
      const sp = mockSpareParts.find(p => p.id === sparePartId);
      if (!found || !sp) throw new Error('Замовлення або деталь не знайдено');
      if (sp.stockQuantity < quantity) {
        throw new Error(`Недостатньо деталей на складі для "${sp.name}": доступно ${sp.stockQuantity} шт.`);
      }
      sp.stockQuantity -= quantity;
      const existing = found.parts.find(p => p.sparePartId === sparePartId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        found.parts.push({
          id: Date.now(),
          sparePartId: sp.id,
          sku: sp.sku,
          partName: sp.name,
          quantity,
          unitPrice: sp.retailPrice
        });
      }
      if (found.status === 'NEW' || found.status === 'IN_DIAGNOSTICS') {
        found.status = 'IN_PROGRESS';
      }
      recalculateMockOrderTotal(found);
      return { ...found, parts: [...found.parts] };
    }
  },

  async removePartFromOrder(orderId: number, orderPartId: number): Promise<Order> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/parts/${orderPartId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        return mapBackendOrderToFrontend(await res.json());
      }
      throw new Error(await extractErrorMessage(res, 'Не вдалося повернути деталь на склад'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const found = mockOrders.find(o => o.id === orderId);
      if (!found) throw new Error('Замовлення не знайдено');
      const target = found.parts.find(p => p.id === orderPartId);
      if (target) {
        const sp = mockSpareParts.find(p => p.id === target.sparePartId || p.name === target.partName);
        if (sp) sp.stockQuantity += target.quantity;
        found.parts = found.parts.filter(p => p.id !== orderPartId);
      }
      recalculateMockOrderTotal(found);
      return { ...found, parts: [...found.parts] };
    }
  },

  async addServiceToOrder(
    orderId: number,
    payload: { serviceId?: number; customServiceName?: string; price?: number }
  ): Promise<Order> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/services`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return mapBackendOrderToFrontend(await res.json());
      }
      throw new Error(await extractErrorMessage(res, 'Не вдалося додати роботу до замовлення'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const found = mockOrders.find(o => o.id === orderId);
      if (!found) throw new Error('Замовлення не знайдено');
      const cat = payload.serviceId ? mockServiceCatalog.find(s => s.id === payload.serviceId) : undefined;
      const name = cat ? cat.name : (payload.customServiceName || 'Послуга ремонту');
      const price = payload.price !== undefined ? payload.price : (cat?.standardPrice || 0);
      found.services.push({
        id: Date.now(),
        serviceId: cat?.id,
        serviceName: name,
        price
      });
      if (found.status === 'NEW' || found.status === 'IN_DIAGNOSTICS') {
        found.status = 'IN_PROGRESS';
      }
      recalculateMockOrderTotal(found);
      return { ...found, services: [...found.services] };
    }
  },

  async removeServiceFromOrder(orderId: number, orderServiceId: number): Promise<Order> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/services/${orderServiceId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        return mapBackendOrderToFrontend(await res.json());
      }
      throw new Error(await extractErrorMessage(res, 'Не вдалося видалити послугу'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const found = mockOrders.find(o => o.id === orderId);
      if (!found) throw new Error('Замовлення не знайдено');
      found.services = found.services.filter(s => s.id !== orderServiceId);
      recalculateMockOrderTotal(found);
      return { ...found, services: [...found.services] };
    }
  },

  async deleteOrder(orderId: number): Promise<void> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Помилка видалення замовлення'));
      }
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
    }
    mockOrders = mockOrders.filter(o => o.id !== orderId);
  },

  async getSpareParts(search?: string): Promise<SparePart[]> {
    try {
      const token = getToken();
      const url = search
        ? `${API_BASE_URL}/warehouse/parts?search=${encodeURIComponent(search)}`
        : `${API_BASE_URL}/warehouse/parts`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          stockQuantity: p.stockQuantity,
          minStockLimit: p.minStockLimit,
          retailPrice: Number(p.retailPrice),
          purchasePrice: Number(p.purchasePrice)
        }));
      }
    } catch {
    }
    return [...mockSpareParts];
  },

  async createSparePart(part: Omit<SparePart, 'id'>): Promise<SparePart> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/warehouse/parts`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(part)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          sku: data.sku,
          name: data.name,
          category: data.category,
          stockQuantity: data.stockQuantity,
          minStockLimit: data.minStockLimit,
          retailPrice: Number(data.retailPrice),
          purchasePrice: Number(data.purchasePrice)
        };
      }
      throw new Error(await extractErrorMessage(res, 'Не вдалося додати деталь на склад'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const nextId = mockSpareParts.length > 0 ? Math.max(...mockSpareParts.map(p => p.id)) + 1 : 1;
      const created: SparePart = { ...part, sku: part.sku.trim().toUpperCase(), id: nextId };
      mockSpareParts = [created, ...mockSpareParts];
      return created;
    }
  },

  async updateSparePart(
    id: number,
    payload: { name: string; category: string; purchasePrice: number; retailPrice: number; minStockLimit: number }
  ): Promise<SparePart> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/warehouse/parts/${id}`, {
        method: 'PUT',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          sku: data.sku,
          name: data.name,
          category: data.category,
          stockQuantity: data.stockQuantity,
          minStockLimit: data.minStockLimit,
          retailPrice: Number(data.retailPrice),
          purchasePrice: Number(data.purchasePrice)
        };
      }
      throw new Error(await extractErrorMessage(res, 'Не вдалося оновити картку деталі'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const idx = mockSpareParts.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Деталь не знайдено');
      mockSpareParts[idx] = { ...mockSpareParts[idx], ...payload };
      return { ...mockSpareParts[idx] };
    }
  },

  async restockSparePart(id: number, quantityDelta: number): Promise<SparePart> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/warehouse/parts/${id}/stock?quantity=${quantityDelta}`, {
        method: 'PATCH',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          sku: data.sku,
          name: data.name,
          category: data.category,
          stockQuantity: data.stockQuantity,
          minStockLimit: data.minStockLimit,
          retailPrice: Number(data.retailPrice),
          purchasePrice: Number(data.purchasePrice)
        };
      }
      throw new Error(await extractErrorMessage(res, 'Помилка зміни залишку на складі'));
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
      const sp = mockSpareParts.find(p => p.id === id);
      if (!sp) throw new Error('Деталь не знайдено');
      if (sp.stockQuantity + quantityDelta < 0) {
        throw new Error('Залишок не може бути від\'ємним');
      }
      sp.stockQuantity += quantityDelta;
      return { ...sp };
    }
  },

  async deleteSparePart(id: number): Promise<void> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/warehouse/parts/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, 'Не вдалося видалити позицію зі складу'));
      }
    } catch (err: any) {
      if (!isNetworkFailure(err)) throw err;
    }
    mockSpareParts = mockSpareParts.filter(p => p.id !== id);
  },

  async getServiceCatalog(): Promise<ServiceCatalogItem[]> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/services`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          standardPrice: Number(s.standardPrice)
        }));
      }
    } catch {
    }
    return [...mockServiceCatalog];
  },

  async getTechnicians(): Promise<StaffMember[]> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users/technicians`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map((u: any) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          role: u.role,
          phone: u.phone,
          isActive: u.isActive
        }));
      }
    } catch {
    }
    return mockStaff.filter(s => s.role === 'ROLE_TECHNICIAN');
  },

  async getClients(): Promise<ClientRecord[]> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/clients`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map((c: any) => ({
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          address: c.address,
          notes: c.notes,
          ordersCount: mockOrders.filter(o => o.client.phone === c.phone).length
        }));
      }
    } catch {
    }
    return [...mockClients];
  },

  async getStaff(): Promise<StaffMember[]> {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map((u: any) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          role: u.role,
          phone: u.phone,
          email: u.email,
          emailVerified: u.emailVerified,
          isLocked: u.isLocked,
          failedLoginAttempts: u.failedLoginAttempts,
          twoFactorEnabled: u.twoFactorEnabled,
          isActive: u.isActive,
          createdAt: u.createdAt
        }));
      }
    } catch {
    }
    return [...mockStaff];
  }
};
