

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SELL = 'SELL',
  POS_LIST = 'POS_LIST',
  PRODUCTS = 'PRODUCTS',
  INVENTORY = 'INVENTORY',
  REPORTS = 'REPORTS',
  KITCHEN = 'KITCHEN',
  SETTINGS = 'SETTINGS',
  MASTER_PORTAL = 'MASTER_PORTAL',
  EXPENSES = 'EXPENSES',
  DAY_SHIFTS = 'DAY_SHIFTS',
  ORDERS = 'ORDERS',
  CRM = 'CRM',
  HRM = 'HRM',
  ESSENTIALS = 'ESSENTIALS',
  WAITER_PORTAL = 'WAITER_PORTAL',
  CATALOGUE_QR = 'CATALOGUE_QR',
  BUSINESS_PAGE = 'BUSINESS_PAGE',
  TENANTS = 'TENANTS',
  TABLES = 'TABLES',
  TENANT_SETTINGS = 'TENANT_SETTINGS',
  STORE_KEEPER = 'STORE_KEEPER',
  REQUISITION = 'REQUISITION',
  MESSAGES = 'MESSAGES',
  ACCESS_CONTROL = 'ACCESS_CONTROL',
  TEMPERATURE = 'TEMPERATURE',
  PHONEBOOK = 'PHONEBOOK',
  MASTER_PHONEBOOK = 'MASTER_PHONEBOOK', 
  SPIRITS = 'SPIRITS',
  BAR_TABS = 'BAR_TABS',
  BAR_MENU = 'BAR_MENU',
  SYSTEM_BRANDING = 'SYSTEM_BRANDING',
  VOID_LOG = 'VOID_LOG',
  KITCHEN_INVENTORY = 'KITCHEN_INVENTORY',
  BAKERY_INVENTORY = 'BAKERY_INVENTORY',
  AI_STUDIO = 'AI_STUDIO',
  WAITER_ALLOCATIONS = 'WAITER_ALLOCATIONS'
}

export type UserRole = 'WAITER' | 'CASHIER' | 'MANAGER' | 'OWNER' | 'CHEF' | 'CLIENT' | 'STORE_KEEPER' | 'BARMAN' | 'BARISTA' | 'HEAD_BAKER' | null;

export type SubscriptionTier = 'BASIC' | 'PRO' | 'ENTERPRISE';

export type PermissionAction = 
  | 'DELETE_ORDER' 
  | 'VOID_ITEM' 
  | 'PROCESS_REFUND' 
  | 'VIEW_COST_PRICE' 
  | 'MANAGE_STOCK' 
  | 'EDIT_MENU' 
  | 'VIEW_ANALYTICS' 
  | 'MANAGE_STAFF' 
  | 'CLOSE_REGISTER';

export interface RolePermissions {
  allowedViews: AppView[];
  allowedActions: PermissionAction[];
}

export interface SystemConfig {
  tenantId: string; 
  subscriptionTier: SubscriptionTier; 
  name: string;
  logo: string; 
  service: string;
  owner_contact: string; 
  support_email?: string; 
  business_contact?: string; 
  currency: string;
  master_pin: string;
  fontFamily?: string; 
  dataRetentionYears: number; // New: Policy for data keep
  colors: {
    primary: string;
    accent: string;
    success: string;
    bg: string;
  };
  receipt: {
    logoUrl: string;
    showLogo: boolean;
    headerText: string;
    headerPhone?: string; 
    headerEmail?: string; 
    footerText: string;
    fontSize: number; 
    scale: number; 
    fontFamily: string; 
    paperWidth: '58mm' | '80mm';
  };
}

export interface SystemAuditLog {
  id: string;
  timestamp: Date;
  action: 'LOGO_CHANGE' | 'STAFF_EDIT' | 'PERMISSION_CHANGE' | 'SYSTEM_REBOOT' | 'DATA_EXPORT';
  performedBy: string;
  details: string;
  metadata?: any;
}

export interface RegisterState {
  isOpen: boolean;
  openingCash: number;
  startTime: Date | null;
  closedTime: Date | null;
}

export interface Product {
  id: string;
  tenantId?: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  trackStock?: boolean;
  popularity: number;
  isAvailable?: boolean;
  unit?: string;
  spiritConfig?: {
    isSpirit: boolean;
    totSize?: 'SINGLE' | 'DOUBLE' | 'HALF_BOTTLE' | 'FULL_BOTTLE';
  };
  spiritPrices?: {
    single: number;
    double: number;
    half: number;
    full: number;
  };
  composition?: {
    itemId: string;
    quantity: number;
    unit: string;
  }[];
}

export interface StoreItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStockLevel: number;
  lastUpdated: Date;
  costPrice?: number;
  trackStock?: boolean;
}

export interface SpiritLog {
  id: string;
  timestamp: Date;
  quantityMl: number;
  tots: number;
  type: 'DIRECT' | 'COCKTAIL' | 'HALF_BOTTLE' | 'GLASS' | 'FULL_BOTTLE';
  staffName: string;
}

export type SpiritCategory = 'WHISKEY' | 'VODKA' | 'GIN' | 'RUM' | 'TEQUILA' | 'BRANDY' | 'LIQUEUR' | 'WINE' | 'CHAMPAGNE' | 'COGNAC' | 'SINGLE MALT' | 'IRISH WHISKEY' | 'BLENDED WHISKY';

export interface SpiritBottle {
  id: string;
  name: string;
  type: SpiritCategory;
  totalVolume: number;
  currentVolume: number;
  measureStandard: 'NEW_25ML' | 'OLD_30ML';
  status: 'OPEN' | 'EMPTY';
  openedAt: Date;
  openedBy: string;
  logs?: SpiritLog[];
  prices?: {
    single: number;
    double: number;
    half: number;
    full: number;
  };
  isHalfBottleStart?: boolean;
}

export interface CashEntry {
  id: string;
  date: Date;
  remark: string;
  category: string;
  mode: 'Cash' | 'Mobile Money' | 'Bank';
  amountIn: number;
  amountOut: number;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  note?: string;
  cartId?: string;
  isNew?: boolean;
  isPrintPending?: boolean;
}

export interface Order {
  id: string;
  tenantId?: string;
  customerName: string;
  customerDepartment?: string;
  staffName?: string;
  staffRole?: UserRole;
  completedBy?: string;
  table: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'served' | 'paid' | 'cancelled' | 'merged';
  timestamp: Date;
  isKitchenOrder: boolean;
  grandTotal: number;
  amountPaid?: number;
  paymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'BANK' | 'CARD' | 'OTHER' | 'SPLIT' | 'COMPLEMENTARY' | 'STAFF_CREDIT' | 'SALARY_PAY';
}

export interface ReturnRecord {
  id: string;
  originalOrderId: string;
  originalOrderTimestamp?: Date;
  originalStatus?: string;
  items: OrderItem[];
  totalRefunded: number;
  timestamp: Date;
  authorizedBy: string;
  originalCreator?: string;
  reason?: string;
  type: 'FULL_ORDER' | 'PARTIAL_ITEM';
  managerConfirmed?: boolean;
  confirmedBy?: string;
}

// Added missing Expense interface
export interface Expense {
  id: string;
  itemName: string;
  department: string;
  category: string;
  description: string;
  amount: number;
  timestamp: Date;
}

export interface BusinessPage {
  id: string;
  businessName: string;
  ownerName: string;
  contact: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PAYMENT_FAILED' | 'ARCHIVED' | 'EXPIRED';
  tier: SubscriptionTier;
  createdAt: Date;
  lastPaymentDate: Date;
  subscriptionExpiry: Date;
  isActive: boolean;
  credentials?: {
    username: string;
    password?: string;
    adminPin?: string;
  };
  settings?: {
    currency?: string;
    logo?: string;
    primaryColor?: string;
    receiptHeader?: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email?: string;
  type?: 'REGULAR' | 'STAFF';
  loyaltyPoints: number;
  lastVisit: Date;
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  contact: string;
  status: 'active' | 'inactive';
  schedule?: string;
  uniformColor?: string;
  photoUrl?: string;
  isProtected?: boolean;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  clockIn: Date;
  clockOut: Date | null;
  status: 'PRESENT' | 'COMPLETED';
}

export interface ShiftLog {
  id: string;
  openedAt: Date;
  closedAt: Date | null;
  openingCash: number;
  closingCash: number | null;
  status: 'OPEN' | 'CLOSED';
  openedBy: string;
}

export interface Table {
  id: string;
  name: string;
  section?: string;
  type: 'round' | 'square' | 'rect';
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  x: number;
  y: number;
  color?: string;
  scale?: number;
}

export interface SectionAllocation {
  id: string;
  sectionName: string;
  waiterId: string;
  waiterName: string;
  timestamp: Date;
}

export interface StockMovementLog {
  id: string;
  itemId: string;
  itemName: string;
  type: 'MARKET_PURCHASE' | 'STORE_EXIT' | 'AUDIT_ADJUSTMENT' | 'RETURN_RESTOCK';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  cost?: number;
  reason?: string;
  performedBy: string;
  timestamp: Date;
  recipient?: string;
  destination?: string;
}

export interface Requisition {
  id: string;
  requesterName: string;
  requesterRole: 'BARMAN' | 'BARISTA' | 'CHEF' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'OWNER' | 'CLIENT' | 'STORE_KEEPER' | 'HEAD_BAKER';
  items: { 
    itemId?: string;
    itemName: string; 
    quantity: number; 
    unit: string;
    department?: string;
    dateRequired?: string;
    details?: string;
  }[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: Date;
  approvedBy?: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  status: MessageStatus;
  channelId: string;
}
