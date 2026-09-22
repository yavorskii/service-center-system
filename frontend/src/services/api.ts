import type { Order, SparePart, CreateOrderPayload, OrderStatus } from '../types';

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
    createdAt: '2026-09-21 12:15',
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
      email: 'serg.p@gmail.com',
      notes: 'Новий клієнт'
    },
    device: {
      id: 3,
      deviceType: 'Планшет',
      brand: 'Samsung',
      model: 'Galaxy Tab S8',
      imei: '359871029384756',
      appearanceNotes: 'Стан ідеальний, не вмикається після води',
      specs: { color: 'Graphite', lte: 'true' }
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
  { id: 1, sku: 'TH-MX4-4G', name: 'Термопаста Arctic MX-4 (4г)', category: 'Витратні матеріали', purchasePrice: 150, retailPrice: 250, stockQuantity: 15, minStockLimit: 3 },
  { id: 2, sku: 'DISP-IPH13P-OEM', name: 'Дисплейний модуль iPhone 13 Pro (OEM)', category: 'Дисплеї', purchasePrice: 2800, retailPrice: 4000, stockQuantity: 4, minStockLimit: 1 },
  { id: 3, sku: 'BAT-SAM-S8', name: 'Акумулятор Samsung Galaxy Tab S8', category: 'Акумулятори', purchasePrice: 900, retailPrice: 1400, stockQuantity: 6, minStockLimit: 2 },
  { id: 4, sku: 'CON-TYPEC-GEN', name: "Роз'єм живлення USB Type-C", category: "Роз'єми", purchasePrice: 40, retailPrice: 120, stockQuantity: 50, minStockLimit: 10 }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  async getOrders(): Promise<Order[]> {
    await delay(250);
    return [...mockOrders];
  },

  async getOrderByTrackingCode(code: string): Promise<Order | null> {
    await delay(300);
    const cleaned = code.trim().toUpperCase();
    const order = mockOrders.find(o => o.trackingCode.toUpperCase() === cleaned || o.orderNumber.toUpperCase() === cleaned);
    return order ? { ...order } : null;
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    await delay(400);
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
    await delay(300);
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
    await delay(200);
    return [...mockSpareParts];
  }
};
