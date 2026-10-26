import type { 
  Order, 
  SparePart, 
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
      partName: p.name || p.partName,
      quantity: p.quantity,
      unitPrice: Number(p.unitPrice)
    })),
    services: (item.services || []).map((s: any) => ({
      id: s.id,
      serviceName: s.name || s.serviceName,
      price: Number(s.price)
    }))
  };
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
    technicianName: 'Тарас Бондаренко',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    defectDescription: 'Перегрівається під навантаженням, шум вентиляторів',
    diagnosticsNotes: 'Забруднення радіатора, пересихання термопасти. Потрібна чистка та заміна термоінтерфейсу.',
    estimatedCost: 850,
    totalCost: 850,
    createdAt: '2026-09-21 10:30',
    parts: [
      { id: 1, partName: 'Термопаста Arctic MX-4 (4г)', quantity: 1, unitPrice: 250 }
    ],
    services: [
      { id: 1, serviceName: 'Комплексна чистка та заміна термопасти', price: 600 }
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
      { id: 2, partName: 'Дисплейний модуль iPhone 13 Pro (OEM)', quantity: 1, unitPrice: 4000 }
    ],
    services: [
      { id: 2, serviceName: 'Заміна дисплейного модуля смартфона', price: 800 }
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
    technicianName: 'Тарас Бондаренко',
    status: 'NEW',
    priority: 'MEDIUM',
    defectDescription: 'Потрапила волога, перестав заряджатися',
    estimatedCost: 0,
    totalCost: 0,
    createdAt: '2026-09-22 09:00',
    parts: [],
    services: []
  },
  {
    id: 4,
    orderNumber: 'SRV-2026-0004',
    trackingCode: 'TRK-E9A22F',
    client: {
      id: 4,
      fullName: 'Олексій Мельник',
      phone: '+380679998877',
      email: 'oleksiy@example.com'
    },
    device: {
      id: 4,
      deviceType: 'Ноутбук',
      brand: 'Lenovo',
      model: 'ThinkPad T14',
      serialNumber: 'SN-LNV-88219',
      appearanceNotes: 'Потертості на кутах'
    },
    technicianName: 'Дмитро Мельник',
    status: 'COMPLETED',
    priority: 'HIGH',
    defectDescription: 'Не вмикається після стрибка напруги в мережі',
    diagnosticsNotes: 'Замінено вхідний контролер живлення BQ24780S.',
    estimatedCost: 1200,
    totalCost: 1200,
    createdAt: '2026-09-20 11:00',
    completedAt: '2026-09-21 16:30',
    parts: [],
    services: []
  },
  {
    id: 5,
    orderNumber: 'SRV-2026-0005',
    trackingCode: 'TRK-D4E12A',
    client: {
      id: 1,
      fullName: 'Іван Сидоренко',
      phone: '+380671234567',
      email: 'ivan.sydor@gmail.com',
      notes: 'Постійний клієнт, знижка 5%'
    },
    device: {
      id: 5,
      deviceType: 'Навушники',
      brand: 'Sony',
      model: 'WH-1000XM4',
      serialNumber: 'SN-SNY-31245',
      appearanceNotes: 'Затертий лівий амбушюр, не тримає заряд',
      specs: { type: 'Over-ear', wireless: 'Bluetooth 5.0' }
    },
    technicianName: 'Дмитро Мельник',
    status: 'READY_FOR_PICKUP',
    priority: 'MEDIUM',
    defectDescription: 'Швидко сідає акумулятор (тримає 20 хв)',
    diagnosticsNotes: 'Заміна акумулятора виконана, протестовано автономність 24 год.',
    estimatedCost: 650,
    totalCost: 650,
    createdAt: '2026-09-24 11:00',
    completedAt: '2026-09-25 15:30',
    parts: [
      { id: 3, partName: 'Акумулятор для навушників Sony WH-1000XM4', quantity: 1, unitPrice: 350 }
    ],
    services: [
      { id: 4, serviceName: 'Заміна елемента живлення та калібрування', price: 300 }
    ]
  }
];

let mockSpareParts: SparePart[] = [
  { id: 1, sku: 'TH-MX4-4G', name: 'Термопаста Arctic MX-4 (4г)', category: 'Витратні матеріали', stockQuantity: 15, minStockLimit: 3, retailPrice: 250, purchasePrice: 150 },
  { id: 2, sku: 'DISP-IPH13P-OEM', name: 'Дисплейний модуль iPhone 13 Pro (OEM)', category: 'Дисплеї', stockQuantity: 4, minStockLimit: 1, retailPrice: 4000, purchasePrice: 2800 },
  { id: 3, sku: 'BAT-SAM-S8', name: 'Акумулятор Samsung Galaxy Tab S8', category: 'Акумулятори', stockQuantity: 6, minStockLimit: 2, retailPrice: 1400, purchasePrice: 900 },
  { id: 4, sku: 'CON-TYPEC-GEN', name: 'Роз\'єм живлення USB Type-C', category: 'Роз\'єми', stockQuantity: 50, minStockLimit: 10, retailPrice: 120, purchasePrice: 35 }
];

let mockClients: ClientRecord[] = [
  { id: 1, fullName: 'Іван Сидоренко', phone: '+380671234567', email: 'ivan.sydor@gmail.com', address: 'м. Київ, вул. Хрещатик, 10', notes: 'Постійний клієнт, знижка 5%', ordersCount: 2 },
  { id: 2, fullName: 'Марія Василенко', phone: '+380509876543', email: 'mariya.vas@ukr.net', address: 'м. Київ, пр. Перемоги, 45', notes: 'Корпоративний клієнт (ТОВ Альфа)', ordersCount: 1 },
  { id: 3, fullName: 'Сергій Павленко', phone: '+380631122334', email: 'pavlenko.s@gmail.com', address: 'м. Івано-Франківськ, вул. Незалежності, 12', notes: 'Термінове обслуговування', ordersCount: 1 },
  { id: 4, fullName: 'Олексій Мельник', phone: '+380679998877', email: 'oleksiy@example.com', address: 'м. Львів, вул. Городоцька, 82', notes: 'Звернення по гарантії', ordersCount: 1 }
];

let mockStaff: StaffMember[] = [
  { id: 1, username: 'admin_oleg', fullName: 'Олег Петренко', role: 'ROLE_ADMIN', phone: '+380671112233', email: 'admin@repairhub.ua', emailVerified: true, isActive: true, createdAt: '2026-09-01' },
  { id: 2, username: 'mgr_alina', fullName: 'Аліна Ковальчук', role: 'ROLE_MANAGER', phone: '+380502223344', email: 'manager@repairhub.ua', emailVerified: true, isActive: true, createdAt: '2026-09-05' },
  { id: 3, username: 'tech_taras', fullName: 'Тарас Бондаренко', role: 'ROLE_TECHNICIAN', phone: '+380633334455', email: 'tech@repairhub.ua', emailVerified: true, isActive: true, createdAt: '2026-09-10' },
  { id: 4, username: 'user_vlad', fullName: 'Владислав Яворський', role: 'ROLE_USER', phone: '+380991234567', email: 'vlad@repairhub.ua', emailVerified: true, isActive: true, createdAt: '2026-10-26' }
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
      if (err.message && err.message !== 'Failed to fetch' && !err.message.includes('NetworkError') && !err.message.includes('Load failed')) {
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
    const errData = await res.json().catch(() => null);
    const msg = errData?.message || (errData?.validationErrors ? Object.values(errData.validationErrors).join(', ') : 'Помилка реєстрації');
    throw new Error(msg);
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
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || 'Невірний або прострочений токен активації');
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
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || 'Помилка надсилання запиту');
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
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || 'Невірний або прострочений токен відновлення');
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
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || 'Невірний код 2FA');
  },

  async loginOAuth(provider: string, email: string, name: string): Promise<AuthUser> {
    const res = await fetch(`${API_BASE_URL}/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, email, fullName: name, externalId: `${provider}_${Date.now()}` })
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
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || 'Помилка OAuth входу');
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
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
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
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
    await fetch(`${API_BASE_URL}/security/users/${id}/lock`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  },

  async unlockUser(id: number): Promise<void> {
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
    await fetch(`${API_BASE_URL}/security/users/${id}/unlock`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  },

  async getUserProfile(): Promise<UserSecurityProfile> {
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
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
    const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
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
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
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

  async getOrdersByPhoneOrTracking(query: string): Promise<Order[]> {
    const q = query.trim().toUpperCase();
    if (!q) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data.map(mapBackendOrderToFrontend) : [mapBackendOrderToFrontend(data)];
      }
    } catch {
    }
    return mockOrders.filter(o => 
      o.trackingCode.toUpperCase().includes(q) ||
      o.orderNumber.toUpperCase().includes(q) ||
      o.client.phone.replace(/[\s\-\(\)]/g, '').includes(q.replace(/[\s\-\(\)]/g, ''))
    );
  },

  async getOrderByTrackingCode(code: string): Promise<Order | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        return mapBackendOrderToFrontend(data);
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
    try {
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
      const res = await fetch(`${API_BASE_URL}/orders`, {
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
    } catch {
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
      technicianName: 'Тарас Бондаренко',
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
  },

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<Order> {
    try {
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
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
    } catch {
    }

    const found = mockOrders.find(o => o.id === orderId);
    if (found) {
      found.status = status;
      return { ...found };
    }
    throw new Error('Order not found');
  },

  async deleteOrder(orderId: number): Promise<void> {
    try {
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
      await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch {
    }
    mockOrders = mockOrders.filter(o => o.id !== orderId);
  },

  async getSpareParts(): Promise<SparePart[]> {
    try {
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
      const res = await fetch(`${API_BASE_URL}/warehouse/parts`, {
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
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
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
        const created: SparePart = {
          id: data.id,
          sku: data.sku,
          name: data.name,
          category: data.category,
          stockQuantity: data.stockQuantity,
          minStockLimit: data.minStockLimit,
          retailPrice: Number(data.retailPrice),
          purchasePrice: Number(data.purchasePrice)
        };
        mockSpareParts = [created, ...mockSpareParts];
        return created;
      }
    } catch {
    }

    const nextId = mockSpareParts.length > 0 ? Math.max(...mockSpareParts.map(p => p.id)) + 1 : 1;
    const created: SparePart = { ...part, id: nextId };
    mockSpareParts = [created, ...mockSpareParts];
    return created;
  },

  async getClients(): Promise<ClientRecord[]> {
    try {
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
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
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null);
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
