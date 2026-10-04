import type { Order, SparePart, CreateOrderPayload, OrderStatus, AuthUser } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

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
      email: 'serg.p@gmail.com'
    },
    device: {
      id: 3,
      deviceType: 'Планшет',
      brand: 'Samsung',
      model: 'Galaxy Tab S8',
      serialNumber: 'SN-SAMS-44190',
      imei: '359871029384756',
      appearanceNotes: 'Стан ідеальний, не вмикається після води',
      specs: { screen: '11 inch', storage: '128GB' }
    },
    technicianName: 'Тарас Бондаренко',
    status: 'NEW',
    priority: 'URGENT',
    defectDescription: 'Потрапила волога, перестав заряджатися',
    diagnosticsNotes: 'Прийнято на термінову діагностику.',
    estimatedCost: 500,
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
        authToken = data.token;
        const user: AuthUser = {
          username: data.username || username,
          fullName: data.fullName || (username === 'admin_oleg' ? 'Олег Петренко' : username === 'mgr_alina' ? 'Аліна Ковальчук' : 'Тарас Бондаренко'),
          role: data.role || (username.startsWith('admin') ? 'ROLE_ADMIN' : username.startsWith('mgr') ? 'ROLE_MANAGER' : 'ROLE_TECHNICIAN'),
          token: data.token
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('repairhub_token', data.token);
          localStorage.setItem('repairhub_user', JSON.stringify(user));
        }
        return user;
      }
    } catch {
    }

    let role = 'ROLE_TECHNICIAN';
    let fullName = 'Тарас Бондаренко';
    if (username.toLowerCase().includes('admin') || username === 'admin_oleg') {
      role = 'ROLE_ADMIN';
      fullName = 'Владислав Яворський (Адмін)';
    } else if (username.toLowerCase().includes('mgr') || username === 'mgr_alina') {
      role = 'ROLE_MANAGER';
      fullName = 'Аліна Ковальчук (Менеджер)';
    }

    const mockToken = 'mock-jwt-token-' + Date.now();
    authToken = mockToken;
    const user: AuthUser = {
      username,
      fullName,
      role,
      token: mockToken
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('repairhub_token', mockToken);
      localStorage.setItem('repairhub_user', JSON.stringify(user));
    }
    return user;
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
        return [mapBackendOrderToFrontend(data)];
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
      technicianName: 'Черговий майстер',
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
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status?status=${status}`, {
        method: 'PUT',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
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
  }
};
