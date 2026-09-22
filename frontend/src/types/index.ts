export type OrderStatus = 
  | 'NEW' 
  | 'IN_DIAGNOSTICS' 
  | 'PENDING_APPROVAL' 
  | 'IN_PROGRESS' 
  | 'READY_FOR_PICKUP' 
  | 'COMPLETED' 
  | 'CANCELED';

export type OrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type UserRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_TECHNICIAN';

export interface Client {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface Device {
  id: number;
  deviceType: string;
  brand: string;
  model: string;
  serialNumber?: string;
  imei?: string;
  appearanceNotes?: string;
  specs?: Record<string, string>;
}

export interface OrderPartItem {
  id: number;
  partName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderServiceItem {
  id: number;
  serviceName: string;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  trackingCode: string;
  client: Client;
  device: Device;
  technicianName?: string;
  status: OrderStatus;
  priority: OrderPriority;
  defectDescription: string;
  diagnosticsNotes?: string;
  estimatedCost: number;
  totalCost: number;
  createdAt: string;
  completedAt?: string;
  parts: OrderPartItem[];
  services: OrderServiceItem[];
}

export interface SparePart {
  id: number;
  sku: string;
  name: string;
  category: string;
  purchasePrice: number;
  retailPrice: number;
  stockQuantity: number;
  minStockLimit: number;
}

export interface CreateOrderPayload {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  deviceType: string;
  brand: string;
  model: string;
  serialNumberOrImei?: string;
  appearanceNotes?: string;
  defectDescription: string;
  priority: OrderPriority;
  estimatedCost: number;
}
