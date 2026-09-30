import type { Order, SparePart, CreateOrderPayload, OrderStatus } from '../types';

const API_BASE_URL = 'http://localhost:8080/api/v1';

let authToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('repairhub_token') : null;

async function getAuthToken(): Promise<string> {
  if (authToken) return authToken;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'mgr_alina', password: 'manager123' })
    });
    if (res.ok) {
      const data = await res.json();
      authToken = data.token;
      if (authToken && typeof window !== 'undefined') {
        localStorage.setItem('repairhub_token', authToken);
      }
      return authToken || '';
    }
  } catch (err) {
    console.warn('Backend login connection notice:', err);
  }
  return '';
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
  }
];

let mockSpareParts: SparePart[] = [
  { id: 1, sku: 'TH-MX4-4G', name: 'Термопаста Arctic MX-4 (4г)', category: 'Витратні матеріали', stockQuantity: 15, minStockLimit: 3, retailPrice: 250, purchasePrice: 150 },
  { id: 2, sku: 'DISP-IPH13P-OEM', name: 'Дисплейний модуль iPhone 13 Pro (OEM)', category: 'Дисплеї', stockQuantity: 4, minStockLimit: 1, retailPrice: 4000, purchasePrice: 2800 },
  { id: 3, sku: 'BAT-SAM-S8', name: 'Акумулятор Samsung Galaxy Tab S8', category: 'Акумулятори', stockQuantity: 6, minStockLimit: 2, retailPrice: 1400, purchasePrice: 900 },
  { id: 4, sku: 'CON-TYPEC-GEN', name: "Роз'єм живлення USB Type-C", category: "Роз'єми", stockQuantity: 50, minStockLimit: 10, retailPrice: 120, purchasePrice: 40 }
];

export const api = {
  async getOrders(): Promise<Order[]> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.map(mapBackendOrderToFrontend);
      }
    } catch (err) {
      console.warn('Live backend orders fetch failed, using local cache:', err);
    }
    return [...mockOrders];
  },

  async getOrderByTrackingCode(code: string): Promise<Order | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tracking/${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const data = await res.json();
        return mapBackendOrderToFrontend(data);
      }
    } catch (err) {
      console.warn('Live backend tracking failed, using local cache:', err);
    }
    const cleaned = code.trim().toUpperCase();
    const order = mockOrders.find(o => o.trackingCode.toUpperCase() === cleaned || o.orderNumber.toUpperCase() === cleaned);
    return order ? { ...order } : null;
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
        const created = mapBackendOrderToFrontend(data);
        mockOrders = [created, ...mockOrders];
        return created;
      }
    } catch (err) {
      console.warn('Live backend createOrder failed, using local cache:', err);
    }

    // Local fallback
    const nextId = mockOrders.length + 1;
    const year = new Date().getFullYear();
    const orderNumber = `SRV-${year}-${String(nextId).padStart(4, '0')}`;
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const trackingCode = `TRK-${randomHex}`;

    const newOrder: Order = {
      id: nextId,
      orderNumber,
      trackingCode,
      client: {
        id: nextId + 10,
        fullName: payload.clientName,
        phone: payload.clientPhone,
        email: payload.clientEmail
      },
      device: {
        id: nextId + 20,
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
  },

  async updateOrderStatus(orderId: number, newStatus: OrderStatus): Promise<Order> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        return mapBackendOrderToFrontend(data);
      }
    } catch (err) {
      console.warn('Live backend updateStatus failed, using local cache:', err);
    }

    const index = mockOrders.findIndex(o => o.id === orderId);
    if (index === -1) throw new Error('Замовлення не знайдено');
    
    const updated = { ...mockOrders[index], status: newStatus };
    if (newStatus === 'READY_FOR_PICKUP' || newStatus === 'COMPLETED') {
      updated.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }
    mockOrders[index] = updated;
    return updated;
  },

  async getSpareParts(): Promise<SparePart[]> {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/warehouse/parts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
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
    } catch (err) {
      console.warn('Live backend getSpareParts failed, using local cache:', err);
    }
    return [...mockSpareParts];
  }
};
