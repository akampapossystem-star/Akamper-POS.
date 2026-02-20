

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
  // New Tabs
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
  // Added WAITER_ALLOCATIONS to fix "Property does not exist on type typeof AppView" error in src/App.tsx
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
  fontFamily?: string; // Global System Font
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
    headerPhone?: string; // New: Specific phone on receipt
    headerEmail?: string; // New: Specific email on receipt
    footerText: string;
    fontSize: number; 
    scale: number; 
    fontFamily: string; // Receipt Specific Font (standard pdf fonts)
    paperWidth: '58mm' | '80mm';
  };
}

export interface RegisterState {
  isOpen: boolean;
  openingCash: number;
  startTime: Date | null;
  closedTime: Date | null;
}

export interface Product {
  id: string;
  tenantId?: string; // Reference to Restaurant
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number; // mapped to stockQuantity
  trackStock?: boolean; // New: Whether to track inventory for this item
  popularity: number; // 0 to 100 score
  isAvailable?: boolean; // Availability status
  unit?: string; // e.g., 'Plate', 'Glass', 'Kg', 'Pcs'
  spiritConfig?: {
    isSpirit: boolean;
    totSize?: 'SINGLE' | 'DOUBLE' | 'HALF_BOTTLE' | 'FULL_BOTTLE';
  };
  // New: Catalog Pricing for Spirits
  spiritPrices?: {
    single: number;
    double: number;
    half: number;
    full: number;
  };
  // New: Kitchen Recipe Composition
  composition?: {
    itemId: string; // Reference to StoreItem ID
    quantity: number; // Amount used per unit sold
    unit: string; // Unit string for display
  }[];
}

// Separate Interface for Raw Materials/Store Items
export interface StoreItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStockLevel: number;
  lastUpdated: Date;
  costPrice?: number; // Optional reference for purchase cost
  trackStock?: boolean; // New: Toggle stock tracking
}

// Spirit Usage Log Entry
export interface SpiritLog {
  id: string;
  timestamp: Date;
  quantityMl: number; // Amount poured in ml
  tots: number; // Number of tots (e.g. 1 or 2)
  type: 'DIRECT' | 'COCKTAIL' | 'HALF_BOTTLE' | 'GLASS' | 'FULL_BOTTLE';
  staffName: string;
}

// New Interface for Open Spirit Bottles
export interface SpiritBottle {
  id: string;
  name: string;
  type: 'WHISKEY' | 'VODKA' | 'GIN' | 'RUM' | 'TEQUILA' | 'BRANDY' | 'LIQUEUR';
  totalVolume: number; // e.g., 750ml, 1000ml
  currentVolume: number; // Remaining ml
  measureStandard: 'NEW_25ML' | 'OLD_30ML'; // 25ml or 30ml base
  status: 'OPEN' | 'EMPTY';
  openedAt: Date;
  openedBy: string;
  logs?: SpiritLog[]; // History of pours from this bottle
  // Pricing configuration for this specific bottle
  prices?: {
    single: number;
    double: number;
    half: number;
    full: number;
  };
  isHalfBottleStart?: boolean; // If opened as a 350ml/375ml initially
}

// Cash Book Entry for Store Keeper
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
  note?: string; // Custom instructions (e.g., "No onions")
  cartId?: string; // Unique ID for cart management (frontend only)
  isNew?: boolean; // New: Track items added in an update for Kitchen Display
  isPrintPending?: boolean; // New: Track items that haven't been printed yet in the current session
}

export interface Order {
  id: string;
  tenantId?: string; // Reference to Restaurant
  customerName: string;
  customerDepartment?: string; // New: Track Staff Department for Salary Pay
  staffName?: string; // Name of the staff member who created the order
  staffRole?: UserRole; // Role of the staff member
  completedBy?: string; // Name of the cashier/staff who finalized/printed the bill
  table: string; // mapped to tableNumber
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'served' | 'paid' | 'cancelled' | 'merged';
  timestamp: Date; // mapped to createdAt
  isKitchenOrder: boolean;
  grandTotal: number; // mapped to totalAmount
  amountPaid?: number; // New field for partial payment tracking
  paymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'BANK' | 'CARD' | 'OTHER' | 'SPLIT' | 'COMPLEMENTARY' | 'STAFF_CREDIT' | 'SALARY_PAY';
}

export interface ReturnRecord {
  id: string;
  originalOrderId: string;
  originalOrderTimestamp?: Date; // New: To calculate time difference
  originalStatus?: string; // New: Track the status when deleted (preparing, served, etc.)
  items: OrderItem[];
  totalRefunded: number;
  timestamp: Date;
  authorizedBy: string; // Role or Name of person deleting
  originalCreator?: string; // Name of person who entered the order
  reason?: string; // Mandatory Reason
  type: 'FULL_ORDER' | 'PARTIAL_ITEM';
  managerConfirmed?: boolean; // Checkbox for Manager Confirmation
  confirmedBy?: string; // Name of manager who checked the box
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
  id: string; // Tenant ID
  businessName: string;
  ownerName: string;
  contact: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PAYMENT_FAILED' | 'ARCHIVED' | 'EXPIRED'; // Modified to include ARCHIVED
  tier: SubscriptionTier; // Plan Control
  createdAt: Date;
  lastPaymentDate: Date;
  subscriptionExpiry: Date; // New: When the system access expires
  isActive: boolean;
  credentials?: {
    username: string;
    password?: string; // Optional in list view for security, required in DB
    adminPin?: string; // Master PIN for the tenant admin
  };
  // NEW: Persistent Settings for this tenant
  settings?: {
    currency?: string;
    logo?: string;
    primaryColor?: string;
    receiptHeader?: string;
  };
}

// --- NEW SHARED INTERFACES ---

export interface Customer {
  id: string;
  name: string;
  contact: string;
  email?: string;
  type?: 'REGULAR' | 'STAFF'; // New: Distinguish regular customers from staff members
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
  schedule?: string; // e.g. "Mon-Fri, 9AM-5PM"
  uniformColor?: string; // Hex code or Tailwind class for visual identity
  photoUrl?: string; // New: Staff Photo
  isProtected?: boolean; // New: If true, only Master Owner can edit/delete
}

// New Interface for Staff Attendance
export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
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
  section?: string; // New: Grouping section (e.g. Balcony, Restaurant)
  type: 'round' | 'square' | 'rect';
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  color?: string; // New: Custom table color
  scale?: number; // New: Size scale (0.5 - 2.0)
}

// Added SectionAllocation interface to fix "Module './types' has no exported member SectionAllocation" error in src/App.tsx
export interface SectionAllocation {
  id: string;
  sectionName: string;
  waiterId: string;
  waiterName: string;
  timestamp: Date;
}

export interface StockMovementLog {
  id: string;
  itemId: string; // Changed from productId to generic itemId to support StoreItems
  itemName: string;
  type: 'MARKET_PURCHASE' | 'STORE_EXIT' | 'AUDIT_ADJUSTMENT' | 'RETURN_RESTOCK';
  quantityChange: number; // Positive for IN, Negative for OUT
  previousStock: number;
  newStock: number;
  cost?: number; // Cost of goods if purchase
  reason?: string; // General notes
  performedBy: string; // Store Keeper Name
  timestamp: Date;
  recipient?: string; // Who took it (Exit) or Supplier (Import)
  destination?: string; // Where it went (Kitchen, Bar, Waste)
}

export interface Requisition {
  id: string;
  requesterName: string;
  requesterRole: 'BARMAN' | 'BARISTA' | 'CHEF' | 'MANAGER' | 'WAITER' | 'CASHIER' | 'OWNER' | 'CLIENT' | 'STORE_KEEPER' | 'HEAD_BAKER'; // Generalized
  items: { 
    itemId?: string; // Optional, link to StoreItem
    itemName: string; 
    quantity: number; 
    unit: string;
    department?: string; // New: For 'Department Name'
    dateRequired?: string; // New: For 'Dates'
    details?: string; // New: For 'Order Required Details'
  }[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: Date;
  approvedBy?: string; // Store Keeper Name
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string; // ISO String (UTC)
  status: MessageStatus;
  channelId: string; // 'GENERAL' or Staff ID for DM
}
