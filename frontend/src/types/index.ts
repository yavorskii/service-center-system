export type OrderStatus = 
  | 'NEW' 
  | 'IN_DIAGNOSTICS' 
  | 'PENDING_APPROVAL' 
  | 'IN_PROGRESS' 
  | 'READY_FOR_PICKUP' 
  | 'COMPLETED' 
  | 'CANCELED';

export type OrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type UserRole = 'ROLE_ADMIN' | 'ROLE_MANAGER' | 'ROLE_TECHNICIAN' | 'ROLE_USER' | 'ROLE_CLIENT';

export interface AuthUser {
  username: string;
  fullName: string;
  role: string;
  token: string;
  email?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorRequired?: boolean;
  tempToken?: string;
}

export interface Client {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface ClientRecord {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  ordersCount?: number;
}

export interface StaffMember {
  id: number;
  username: string;
  fullName: string;
  role: string;
  phone?: string;
  email?: string;
  emailVerified?: boolean;
  isLocked?: boolean;
  failedLoginAttempts?: number;
  twoFactorEnabled?: boolean;
  isActive: boolean;
  createdAt?: string;
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

export interface SecurityAuditLog {
  id: number;
  username: string;
  ipAddress: string;
  attemptTime: string;
  status: string;
  details: string;
}

export interface MockEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  sentAt: string;
  type: string;
}

export interface UserSecurityProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  failedLoginAttempts: number;
  isLocked: boolean;
  authProvider: string;
}

export interface CaptchaData {
  token: string;
  svg: string;
}
