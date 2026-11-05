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
  twoFactorMethod?: string;
  twoFactorRequired?: boolean;
  tempToken?: string;
  authProvider?: string;
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
  lockedUntil?: string;
  failedLoginAttempts?: number;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: string;
  authProvider?: string;
  googleEmail?: string;
  lastLoginIp?: string;
  lastLoginAt?: string;
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
  sparePartId?: number;
  sku?: string;
  partName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderServiceItem {
  id: number;
  serviceId?: number;
  serviceName: string;
  price: number;
  status?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  trackingCode: string;
  client: Client;
  device: Device;
  technicianId?: number;
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

export interface ServiceCatalogItem {
  id: number;
  name: string;
  description?: string;
  standardPrice: number;
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
  actorUsername?: string;
  userIpAddress?: string;
  ipAddress: string;
  userAgent?: string;
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
  token?: string;
  actionUrl?: string;
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
  twoFactorMethod?: string;
  failedLoginAttempts: number;
  isLocked: boolean;
  authProvider: string;
  googleConnected?: boolean;
  googleEmail?: string;
  lastLoginIp?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedToken?: string;
}

export interface UserSessionItem {
  id: number;
  ipAddress: string;
  deviceInfo: string;
  createdAt: string;
  lastActiveAt: string;
  current: boolean;
  primary: boolean;
  canTerminate: boolean;
}

export interface TotpSetupData {
  secret: string;
  otpAuthUrl: string;
  qrCodeSvg: string;
}

export interface SentEmailLogItem {
  id: number;
  recipientEmail: string;
  username?: string;
  subject: string;
  emailType: string;
  deliveryStatus: string;
  sentAt: string;
}

export interface SupportTicketItem {
  id: number;
  email: string;
  username?: string;
  userId?: number;
  category: string;
  subject: string;
  description: string;
  ipAddress?: string;
  status: string;
  adminNote?: string;
  adminReply?: string;
  repliedBy?: string;
  repliedAt?: string;
  createdAt: string;
  linkedUser?: StaffMember;
  recentEvents?: SecurityAuditLog[];
}

export interface CaptchaData {
  token: string;
  svg: string;
}
