
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppView, SystemConfig, UserRole, Order, Product, StaffMember, Customer, RegisterState, Table, Expense, StockMovementLog, Requisition, BusinessPage, ChatMessage, StoreItem, RolePermissions, PermissionAction, ReturnRecord, OrderItem, AttendanceRecord, SpiritBottle } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SellView from './components/SellView';
import KitchenView from './components/KitchenView';
import Dashboard from './components/Dashboard';
import OrdersView from './components/OrdersView';
import HRMView from './components/HRMView';
import CRMView from './components/CRMView';
import InventoryView from './components/InventoryView';
import ExpensesView from './components/ExpensesView';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import MasterPortalView from './components/MasterPortalView';
import TenantsView from './components/TenantsView';
import StoreKeeperView from './components/StoreKeeperView';
import RequisitionPortal from './components/RequisitionPortal';
import TableManagementView from './components/TableManagementView';
import PhoneBookView from './components/PhoneBookView';
import AccessControlView from './components/AccessControlView';
import TemperatureView from './components/TemperatureView';
import EssentialsView from './components/EssentialsView';
import CatalogueQRView from './components/CatalogueQRView';
import WaiterPortalView from './components/WaiterPortalView';
import DayShiftsView from './components/DayShiftsView';
import ChatView from './components/ChatView';
import Calculator from './components/Calculator';
import VirtualKeyboard from './components/VirtualKeyboard';
import SpiritsInventoryView from './components/SpiritsInventoryView'; 
import ReportsView from './components/ReportsView'; 
import SystemBrandingView from './components/SystemBrandingView';
import BarTabsView from './components/BarTabsView';
import BarMenuView from './components/BarMenuView';
import KitchenInventoryView from './components/KitchenInventoryView'; 
import ErrorBoundary from './components/ErrorBoundary';
import ExpenseModal from './components/ExpenseModal';
import { ToastContainer, Notification, NotificationType } from './components/Notifications';
import { PRODUCTS_DATA, TABLES_DATA, MOCK_TENANTS, STORE_ITEMS_DATA } from './mockData';
import { initSync, broadcast } from './services/syncService';
import { Croissant } from 'lucide-react';

// Default Master Config (for Login Screen and initial Fallback)
const MASTER_SYSTEM_CONFIG: SystemConfig = {
  tenantId: 'ROOT',
  subscriptionTier: 'ENTERPRISE',
  name: 'Akampa POS System',
  logo: '', // System Logo
  service: 'SaaS Platform',
  owner_contact: '+256 7413 50786',
  support_email: 'akamperpos@gmail.com',
  business_contact: 'Admin',
  currency: 'UGX',
  master_pin: '0000',
  fontFamily: 'Inter',
  colors: { primary: '#2563eb', accent: '#f59e0b', success: '#10b981', bg: '#f3f4f6' },
  receipt: {
    logoUrl: '',
    showLogo: true,
    headerText: 'System Receipt',
    footerText: 'System Generated',
    fontSize: 12,
    scale: 100,
    fontFamily: 'courier',
    paperWidth: '80mm'
  }
};

const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  OWNER: { 
    allowedViews: Object.values(AppView), 
    allowedActions: ['DELETE_ORDER', 'VOID_ITEM', 'PROCESS_REFUND', 'VIEW_COST_PRICE', 'MANAGE_STOCK', 'EDIT_MENU', 'VIEW_ANALYTICS', 'MANAGE_STAFF', 'CLOSE_REGISTER'] 
  },
  MANAGER: { 
    allowedViews: [AppView.DASHBOARD, AppView.SELL, AppView.POS_LIST, AppView.ORDERS, AppView.KITCHEN, AppView.PRODUCTS, AppView.INVENTORY, AppView.EXPENSES, AppView.REPORTS, AppView.HRM, AppView.CRM, AppView.MESSAGES, AppView.STORE_KEEPER, AppView.REQUISITION, AppView.ACCESS_CONTROL, AppView.PHONEBOOK, AppView.DAY_SHIFTS, AppView.SPIRITS, AppView.BAR_TABS, AppView.BAR_MENU, AppView.TABLES, AppView.KITCHEN_INVENTORY, AppView.BAKERY_INVENTORY, AppView.WAITER_PORTAL], 
    allowedActions: ['VOID_ITEM', 'PROCESS_REFUND', 'MANAGE_STOCK', 'CLOSE_REGISTER', 'VIEW_ANALYTICS', 'MANAGE_STAFF'] 
  },
  CASHIER: { 
    allowedViews: [AppView.DASHBOARD, AppView.SELL, AppView.EXPENSES, AppView.CRM, AppView.ORDERS, AppView.MESSAGES, AppView.REQUISITION, AppView.PHONEBOOK, AppView.DAY_SHIFTS, AppView.BAR_TABS, AppView.WAITER_PORTAL, AppView.SPIRITS], 
    allowedActions: ['CLOSE_REGISTER', 'PROCESS_REFUND'] 
  },
  WAITER: { 
    allowedViews: [AppView.WAITER_PORTAL, AppView.ORDERS, AppView.KITCHEN, AppView.TEMPERATURE, AppView.PHONEBOOK, AppView.MESSAGES, AppView.REQUISITION, AppView.BAR_MENU], 
    allowedActions: [] 
  },
  CHEF: { 
    allowedViews: [AppView.KITCHEN, AppView.REQUISITION, AppView.MESSAGES, AppView.PHONEBOOK], 
    allowedActions: [] 
  },
  HEAD_BAKER: {
    allowedViews: [AppView.BAKERY_INVENTORY, AppView.REQUISITION, AppView.MESSAGES, AppView.PHONEBOOK],
    allowedActions: [] 
  },
  STORE_KEEPER: { 
    allowedViews: [AppView.STORE_KEEPER, AppView.MESSAGES, AppView.PHONEBOOK], 
    allowedActions: ['MANAGE_STOCK'] 
  },
  BARMAN: { 
    allowedViews: [AppView.REQUISITION, AppView.MESSAGES, AppView.SPIRITS, AppView.PHONEBOOK], 
    allowedActions: [] 
  },
  BARISTA: { 
    allowedViews: [AppView.REQUISITION, AppView.MESSAGES, AppView.PHONEBOOK], 
    allowedActions: [] 
  }
};

// Persistence Hook
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item, (k, v) => {
            if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
                return new Date(v);
            }
            return v;
        });
      }
      return initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
}

const App: React.FC = () => {
  // Authentication & Session
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginMode, setLoginMode] = useState<'client' | 'staff'>('client');
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Master Config (Login Screen Identity)
  const [masterConfig, setMasterConfig] = usePersistentState<SystemConfig>('masterSystemConfig', MASTER_SYSTEM_CONFIG);

  // Active Session Config (Tenant's Settings)
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(MASTER_SYSTEM_CONFIG);

  // Persistent Tenant Data
  const [businessPages, setBusinessPages] = usePersistentState<BusinessPage[]>('businessPages', MOCK_TENANTS);

  const [registerState, setRegisterState] = usePersistentState<RegisterState>('registerState', { isOpen: false, openingCash: 0, startTime: null, closedTime: null });
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Persistent Access Control
  const [rolePermissions, setRolePermissions] = usePersistentState<Record<string, RolePermissions>>('rolePermissions', DEFAULT_ROLE_PERMISSIONS);

  // Persistent Data State
  const [masterOrders, setMasterOrders] = usePersistentState<Order[]>('masterOrders', []);
  const [masterProducts, setMasterProducts] = usePersistentState<Product[]>('masterProducts', PRODUCTS_DATA);
  const [customers, setCustomers] = usePersistentState<Customer[]>('customers', []);
  const [staff, setStaff] = usePersistentState<StaffMember[]>('staff', [
      { id: 'ROOT', name: 'Master Owner', role: 'OWNER', pin: '000000', contact: '000', status: 'active', isProtected: true, uniformColor: '#1e293b' },
      { id: 'S-001', name: 'Manager Andre', role: 'MANAGER', pin: '123456', contact: '+256 700 111222', status: 'active', schedule: 'Mon-Sat, 8am-5pm', uniformColor: '#3b82f6', isProtected: true },
      { id: 'S-C1', name: 'Cashier Sarah', role: 'CASHIER', pin: '200001', contact: '+256 700 200001', status: 'active', schedule: 'Mon-Fri, 8am-4pm', uniformColor: '#ec4899', isProtected: true },
      { id: 'S-W1', name: 'Waiter Alice', role: 'WAITER', pin: '100001', contact: '+256 700 100001', status: 'active', schedule: 'Mon-Sat, 9am-5pm', uniformColor: '#10b981', isProtected: true },
      { id: 'S-K1', name: 'Chef Gordon', role: 'CHEF', pin: '500001', contact: '+256 700 500001', status: 'active', schedule: 'Mon-Fri, 10am-6pm', uniformColor: '#ea580c', isProtected: true },
      { id: 'S-SK1', name: 'Store Keeper Quinn', role: 'STORE_KEEPER', pin: '600001', contact: '+256 700 600001', status: 'active', schedule: 'Mon-Fri, 8am-5pm', uniformColor: '#475569', isProtected: true },
      { id: 'S-BM1', name: 'Barman Mike', role: 'BARMAN', pin: '400001', contact: '+256 700 400001', status: 'active', schedule: 'Thu-Sun, 5pm-2am', uniformColor: '#7c2d12', isProtected: true },
      { id: 'S-BK1', name: 'Baker Barney', role: 'HEAD_BAKER', pin: '300001', contact: '+256 700 300001', status: 'active', schedule: 'Mon-Sat, 4am-1pm', uniformColor: '#d97706', isProtected: true },
  ]);
  const [attendance, setAttendance] = usePersistentState<AttendanceRecord[]>('attendance', []);

  const [tables, setTables] = usePersistentState<Table[]>('tables', TABLES_DATA);
  const [expenses, setExpenses] = usePersistentState<Expense[]>('expenses', []);
  const [stockLogs, setStockLogs] = usePersistentState<StockMovementLog[]>('stockLogs', []);
  const [storeItems, setStoreItems] = usePersistentState<StoreItem[]>('storeItems', STORE_ITEMS_DATA);
  const [requisitions, setRequisitions] = usePersistentState<Requisition[]>('requisitions', []);
  const [shifts, setShifts] = usePersistentState<any[]>('shifts', []); 
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]); 
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  // Persistent Returns & Spirits
  const [returns, setReturns] = usePersistentState<ReturnRecord[]>('returns', []);
  const [bottles, setBottles] = usePersistentState<SpiritBottle[]>('bottles', []);
  
  // Cash Book Entries
  const [cashEntries, setCashEntries] = usePersistentState<any[]>('cashEntries', []);

  // Notifications
  const [isBellActive, setIsBellActive] = useState(false);
  const [latestKitchenAlert, setLatestKitchenAlert] = useState<{sender: string, timestamp: number} | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Apply System Font (Based on Current Config)
  useEffect(() => {
      document.body.style.fontFamily = systemConfig.fontFamily || 'Inter';
  }, [systemConfig.fontFamily]);

  // Sync Logic
  useEffect(() => {
    const unsubscribe = initSync((msg) => {
        switch(msg.type) {
            case 'KITCHEN_CALL':
                setIsBellActive(true);
                setLatestKitchenAlert(msg.payload);
                notify(`🔔 Kitchen call from ${msg.payload.sender}`, 'info');
                break;
            case 'CHAT_MESSAGE':
                setChatMessages(prev => [...prev, msg.payload]);
                if (currentView !== AppView.MESSAGES) {
                    setUnreadMessageCount(prev => prev + 1);
                    notify(`New message from ${msg.payload.senderName}`, 'info');
                }
                break;
            case 'TYPING_EVENT':
                if (msg.payload.isTyping) {
                    setTypingUsers(prev => [...prev.filter(u => u !== msg.payload.userName), msg.payload.userName]);
                } else {
                    setTypingUsers(prev => prev.filter(u => u !== msg.payload.userName));
                }
                break;
            case 'MESSAGE_READ':
                setChatMessages(prev => prev.map(m => msg.payload.ids.includes(m.id) ? { ...m, status: 'read' } : m));
                break;
        }
    });
    return () => { unsubscribe(); };
  }, [currentView]);

  const notify = (message: string, type: NotificationType = 'info') => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, message, type }]);
  };

  const dismissNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const currentTenantOrders = useMemo(() => masterOrders.filter(o => o.tenantId === systemConfig.tenantId), [masterOrders, systemConfig.tenantId]);
  const currentTenantProducts = useMemo(() => masterProducts.filter(p => p.tenantId === systemConfig.tenantId), [masterProducts, systemConfig.tenantId]);

  // --- Handlers ---

  const handleUpdatePermissions = (role: UserRole, type: 'view' | 'action', key: string, value: boolean) => {
    if (!role) return;
    setRolePermissions(prev => {
        const currentRolePerms = prev[role] || { allowedViews: [], allowedActions: [] };
        let newViews = [...currentRolePerms.allowedViews];
        let newActions = [...currentRolePerms.allowedActions];

        if (type === 'view') {
            if (value) {
                if (!newViews.includes(key as AppView)) newViews.push(key as AppView);
            } else {
                newViews = newViews.filter(v => v !== key);
            }
        } else {
            if (value) {
                if (!newActions.includes(key as PermissionAction)) newActions.push(key as PermissionAction);
            } else {
                newActions = newActions.filter(a => a !== key);
            }
        }

        return {
            ...prev,
            [role]: {
                allowedViews: newViews,
                allowedActions: newActions
            }
        };
    });
    notify("Permissions updated successfully", 'success');
  };

  // --- SETTINGS MANAGEMENT ---
  
  // Updates the GLOBAL Master System Branding (Login Screen)
  const handleUpdateMasterConfig = (newConfig: SystemConfig) => {
      setMasterConfig(newConfig);
      // If currently logged in as Root, update the session too
      if (currentUser?.id === 'ROOT') {
          setSystemConfig(newConfig);
      }
  };

  // Updates the TENANT'S Specific Settings
  const handleUpdateTenantSettings = (newConfig: SystemConfig) => {
      // 1. Update Active Session
      setSystemConfig(newConfig);
      
      // 2. Persist to Business Pages (The Database)
      setBusinessPages(prev => prev.map(page => 
          page.id === newConfig.tenantId 
          ? { ...page, settings: newConfig } // Store the entire config object
          : page
      ));
  };

  const handleLogin = (pin: string) => {
      // Root Login
      if (pin === masterConfig.master_pin) { 
          setIsAuthenticated(true);
          setUserRole('OWNER');
          setCurrentUser({ 
              id: `OWNER-ROOT`, 
              name: 'Administrator', 
              role: 'OWNER', 
              pin: masterConfig.master_pin, 
              contact: masterConfig.owner_contact, 
              status: 'active' 
          });
          setSystemConfig(masterConfig); // Root uses Master Config
          setCurrentView(AppView.DASHBOARD);
          notify("Welcome, Administrator", 'success');
          return;
      }

      const member = staff.find(s => s.pin === pin && s.status === 'active');
      if (member) {
          setIsAuthenticated(true);
          setUserRole(member.role);
          setCurrentUser(member);
          
          // Restricted Access Routing
          switch (member.role) {
              case 'WAITER': 
                  setCurrentView(AppView.WAITER_PORTAL); 
                  break;
              case 'CHEF': 
                  setCurrentView(AppView.KITCHEN); 
                  break;
              case 'HEAD_BAKER': 
                  setCurrentView(AppView.BAKERY_INVENTORY); 
                  break;
              case 'STORE_KEEPER': 
                  setCurrentView(AppView.STORE_KEEPER); 
                  break;
              case 'BARMAN': 
                  setCurrentView(AppView.SPIRITS); 
                  break;
              case 'BARISTA': 
                  setCurrentView(AppView.REQUISITION); 
                  break;
              case 'CASHIER':
              case 'MANAGER':
              case 'OWNER':
                  setCurrentView(AppView.DASHBOARD);
                  break;
              default:
                  setCurrentView(AppView.DASHBOARD);
          }
          notify(`Welcome back, ${member.name}`, 'success');
      } else {
          notify("Invalid PIN Code. Access Denied.", 'error');
      }
  };

  const handleClientLogin = (u: string, p: string) => {
      // Root Master Login
      if (u === 'taatamalikh@gmail.com' && p === 'Akamper2026') {
          setIsAuthenticated(true);
          setUserRole('OWNER');
          setCurrentUser({ 
              id: 'ROOT', 
              name: 'Master Admin', 
              role: 'OWNER', 
              pin: '000000', 
              contact: 'System Master', 
              status: 'active',
              isProtected: true 
          });
          setSystemConfig(masterConfig); // Load Master Config
          setCurrentView(AppView.TENANTS);
          notify("Master Root Access Granted", 'warning');
          return;
      }

      // Tenant Login
      const tenant = businessPages.find(b => b.credentials?.username === u && b.credentials?.password === p);
      if (tenant) {
          if (tenant.status !== 'ACTIVE' && tenant.status !== 'EXPIRED') {
              notify("Account Suspended. Contact Admin.", 'error');
              return;
          }
          if (new Date() > new Date(tenant.subscriptionExpiry)) {
              notify("Subscription Expired. Renew to access.", 'warning');
          }

          // LOAD TENANT SETTINGS (Isolation Logic)
          // If tenant has saved settings, use them. Else, use defaults but override Tenant ID & Name
          const tenantConfig: SystemConfig = tenant.settings || {
              ...MASTER_SYSTEM_CONFIG, // Base on default structure
              tenantId: tenant.id,
              name: tenant.businessName,
              owner_contact: tenant.contact,
              subscriptionTier: tenant.tier,
              master_pin: tenant.credentials?.adminPin || '0000',
              logo: '' // Reset logo if not set by tenant
          };

          setSystemConfig(tenantConfig); // Set Active Session Config
          setLoginMode('staff'); 
          notify(`Welcome to ${tenant.businessName}. Enter PIN.`, 'info');
      } else {
          notify("Invalid Credentials. Try Again.", 'error');
      }
  };

  const handleLogout = useCallback(() => {
      setIsAuthenticated(false);
      setLoginMode('staff'); 
      setCurrentUser(null);
      setUserRole(null);
      notify("Terminal Locked", 'info');
  }, []);

  const handleFullLogout = () => {
      setIsAuthenticated(false);
      setLoginMode('client');
      // Reset Session Config to Master Defaults so Login Screen is standard
      setSystemConfig(MASTER_SYSTEM_CONFIG); 
      setCurrentUser(null);
      setUserRole(null);
      notify("Logged out successfully", 'success');
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const TIMEOUT_DURATION = 300000; // 5 mins
    let timeoutId: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleLogout(), TIMEOUT_DURATION);
    };
    resetTimer();
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => resetTimer();
    events.forEach(event => window.addEventListener(event, handleActivity));
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [isAuthenticated, handleLogout]);

  const handleImpersonate = (page: BusinessPage, targetView: AppView = AppView.DASHBOARD) => {
      // Logic for Impersonation: Load that specific tenant's settings
      const tenantConfig: SystemConfig = page.settings || {
          ...MASTER_SYSTEM_CONFIG,
          tenantId: page.id,
          name: page.businessName,
          owner_contact: page.contact,
          subscriptionTier: page.tier,
          master_pin: page.credentials?.adminPin || '0000',
          logo: ''
      };

      setSystemConfig(tenantConfig);
      
      setCurrentUser({ 
          id: `MASTER_OVERRIDE_${Date.now()}`, 
          name: 'Master Admin (Override)', 
          role: 'OWNER', 
          pin: '000000', 
          contact: 'System', 
          status: 'active' 
      });
      setUserRole('OWNER');
      setCurrentView(targetView);
      notify(`Accessed ${page.businessName} as Admin`, 'warning');
  };

  const handlePlaceOrder = (order: Order) => {
      setMasterOrders(prev => [order, ...prev]);
      if (order.isKitchenOrder) {
          broadcast('KITCHEN_CALL', { sender: order.staffName || 'System', timestamp: Date.now() });
          setIsBellActive(true);
      }
      notify("Order Placed Successfully", 'success');
  };

  const handleMergeOrders = (targetOrderId: string, sourceOrderId: string) => {
      const targetOrder = masterOrders.find(o => o.id === targetOrderId);
      const sourceOrder = masterOrders.find(o => o.id === sourceOrderId);

      if (!targetOrder || !sourceOrder) return;

      const newItems = [...targetOrder.items];
      sourceOrder.items.forEach(sourceItem => {
          const existingItem = newItems.find(
              i => i.product.id === sourceItem.product.id && i.note === sourceItem.note
          );
          if (existingItem) {
              existingItem.quantity += sourceItem.quantity;
          } else {
              newItems.push(sourceItem);
          }
      });

      const newTotal = newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

      const updatedTargetOrder: Order = {
          ...targetOrder,
          items: newItems,
          grandTotal: newTotal,
      };

      setMasterOrders(prev => prev.map(o => {
          if (o.id === targetOrderId) return updatedTargetOrder;
          if (o.id === sourceOrderId) return { ...o, status: 'cancelled' };
          return o;
      }));
      
      notify(`Orders merged successfully`, 'success');
  };
  
  const handleUpdateOrder = (updatedOrder: Order) => {
      setMasterOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      
      const hasNewItems = updatedOrder.items.some(item => item.isNew === true);
      if (hasNewItems) {
          broadcast('KITCHEN_CALL', { sender: updatedOrder.staffName || 'System', timestamp: Date.now() });
          setIsBellActive(true);
      }
      
      notify(`Order #${updatedOrder.id.substring(0,4)} Updated`, 'success');
  };

  const handleDeleteOrder = (orderId: string, reason?: string) => {
      const order = masterOrders.find(o => o.id === orderId);
      if (order) {
          setMasterOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
          const record: ReturnRecord = {
              id: `RET-${Date.now()}`,
              originalOrderId: order.id,
              originalOrderTimestamp: order.timestamp,
              items: order.items,
              totalRefunded: order.grandTotal,
              timestamp: new Date(),
              authorizedBy: currentUser?.name || 'System',
              originalCreator: order.staffName,
              reason: reason || 'Order Cancelled',
              type: 'FULL_ORDER',
              originalStatus: order.status
          };
          setReturns(prev => [record, ...prev]);
          notify("Order Cancelled & Logged", 'warning');
      }
  };

  const handleItemReturn = (orderId: string, originalTime: Date, items: OrderItem[], totalRefund: number, reason: string) => {
      const originalOrder = masterOrders.find(o => o.id === orderId);
      
      const record: ReturnRecord = {
          id: `VOID-${Date.now()}`,
          originalOrderId: orderId,
          originalOrderTimestamp: originalTime,
          items: items,
          totalRefunded: totalRefund,
          timestamp: new Date(),
          authorizedBy: currentUser?.name || 'System',
          originalCreator: originalOrder?.staffName,
          reason: reason || 'Item Voided',
          type: 'PARTIAL_ITEM'
      };
      setReturns(prev => [record, ...prev]);
      notify(`Items Voided. Refund: ${totalRefund}`, 'warning');
  };

  const handleAddCustomer = (customer: Customer) => {
      setCustomers(prev => [customer, ...prev]);
      notify(`Customer ${customer.name} Added`, 'success');
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
      setMasterProducts(updatedProducts);
      notify("Inventory Updated", 'success');
  };

  const handleCloseRegister = () => {
      if (!registerState.isOpen) return;
      const shift: any = {
          id: `SHIFT-${Date.now()}`,
          openedAt: registerState.startTime!,
          closedAt: new Date(),
          openingCash: registerState.openingCash,
          closingCash: 0, 
          status: 'CLOSED',
          openedBy: currentUser?.name || 'Unknown'
      };
      setShifts(prev => [shift, ...prev]);
      setRegisterState({ isOpen: false, openingCash: 0, startTime: null, closedTime: null });
      notify("Register Closed. Shift Report Generated.", 'success');
  };

  const handleOpenRegister = (amount: number) => {
      setRegisterState({ isOpen: true, openingCash: amount, startTime: new Date(), closedTime: null });
      notify("Register Opened Successfully", 'success');
  };

  const handleSaveExpense = (expenseData: { itemName: string; department: string; category: string; amount: number; description: string }) => {
      if (editingExpense) {
          setExpenses(prev => prev.map(e => e.id === editingExpense.id ? {
              ...e,
              ...expenseData
          } : e));
          notify("Expense Updated Successfully", "success");
      } else {
          const newExpense: Expense = {
              id: `EXP-${Date.now()}`,
              timestamp: new Date(),
              ...expenseData
          };
          setExpenses(prev => [newExpense, ...prev]);
          notify("Expense Logged Successfully", "success");
      }
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
  };

  const initiateEditExpense = (expense: Expense) => {
      setEditingExpense(expense);
      setIsExpenseModalOpen(true);
  };

  const initiateAddExpense = () => {
      setEditingExpense(null);
      setIsExpenseModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginView 
          onLogin={handleLogin} 
          onClientLogin={handleClientLogin}
          systemName={masterConfig.name} // Use Master Config name for Login
          viewMode={loginMode}
          businessName={systemConfig.name} // Use Active Config for PIN Pad
          logoUrl={masterConfig.logo} // Use Master Logo for Login Screen
          onSwitchAccount={loginMode === 'staff' ? handleFullLogout : undefined}
          supportContact={masterConfig.owner_contact}
          supportEmail={masterConfig.support_email}
        />
        <ToastContainer notifications={notifications} onDismiss={dismissNotification} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-gray-100 font-sans text-slate-900">
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          systemConfig={systemConfig} // Sidebar uses TENANT config
          userRole={userRole}
          onLogout={handleLogout} 
          onFullLogout={handleFullLogout} 
          currentUser={currentUser}
          unreadMessageCount={unreadMessageCount}
          permissions={rolePermissions} 
          onExitImpersonation={currentUser?.id?.startsWith('MASTER_OVERRIDE') ? () => {
              setSystemConfig(MASTER_SYSTEM_CONFIG); // Revert to Master
              setCurrentUser({ id: 'ROOT', name: 'Master Admin', role: 'OWNER', pin: '000000', contact: 'System Master', status: 'active', isProtected: true });
              setCurrentView(AppView.TENANTS);
              notify("Exited Tenant View", 'info');
          } : undefined}
        />
        
        <div className="flex-1 flex flex-col min-w-0 relative transition-all duration-300">
          <Header 
            title={currentView.replace('_', ' ')} 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen}
            primaryColor={systemConfig.colors.primary}
            userRole={userRole}
            isSellView={currentView === AppView.SELL}
            businessName={systemConfig.name}
            onGlobalBack={() => {
               if(currentView !== AppView.DASHBOARD && userRole !== 'WAITER') setCurrentView(AppView.DASHBOARD);
            }}
            canGoBack={currentView !== AppView.DASHBOARD && currentView !== AppView.TENANTS && userRole !== 'WAITER'}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            onNavigate={setCurrentView}
            onCloseRegister={handleCloseRegister}
            onCalculator={() => setIsCalculatorOpen(true)}
            onRecentTransactions={currentView === AppView.SELL ? () => {} : undefined} 
            onToggleKeyboard={() => setIsKeyboardOpen(!isKeyboardOpen)}
            onAddExpense={() => setIsExpenseModalOpen(true)}
            currentUser={currentUser}
          />
          
          <main className="flex-1 overflow-hidden relative">
            {currentView === AppView.DASHBOARD && (
               <Dashboard 
                 orders={currentTenantOrders} 
                 expenses={expenses} 
                 registerState={registerState} 
                 systemConfig={systemConfig} 
                 userRole={userRole} 
                 onCloseRegister={handleCloseRegister}
                 onOpenRegister={handleOpenRegister}
                 returns={returns}
               />
            )}
            
            {currentView === AppView.SELL && (
                <SellView
                    systemConfig={systemConfig}
                    onPlaceOrder={handlePlaceOrder}
                    onUpdateOrder={handleUpdateOrder}
                    onDeleteOrder={handleDeleteOrder}
                    onItemReturn={handleItemReturn}
                    onAddCustomer={handleAddCustomer}
                    orders={currentTenantOrders}
                    userRole={userRole}
                    registerState={registerState}
                    onOpenRegister={handleOpenRegister}
                    tables={tables}
                    products={currentTenantProducts}
                    returns={returns}
                    customers={customers}
                    staff={staff}
                    currentUser={currentUser}
                    bottles={bottles}
                    onUpdateBottles={setBottles}
                />
            )}

            {currentView === AppView.KITCHEN && (
               <KitchenView 
                  systemConfig={systemConfig}
                  orders={currentTenantOrders}
                  onUpdateStatus={(id, status) => {
                      setMasterOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
                  }}
                  onAddOrder={handlePlaceOrder}
                  onUpdateOrder={handleUpdateOrder} 
                  userRole={userRole}
                  products={currentTenantProducts}
                  isBellActive={isBellActive}
                  onStopBell={() => setIsBellActive(false)}
                  kitchenAlertProp={latestKitchenAlert}
               />
            )}
            {currentView === AppView.WAITER_PORTAL && (
                <WaiterPortalView 
                    orders={currentTenantOrders}
                    products={currentTenantProducts}
                    systemConfig={systemConfig}
                    currentUser={currentUser}
                    staff={staff}
                    tables={tables} 
                    onLogout={handleLogout}
                    onNavigate={setCurrentView}
                    onPlaceOrder={handlePlaceOrder}
                    onUpdateOrder={handleUpdateOrder}
                    onDeleteOrder={handleDeleteOrder}
                    onItemReturn={handleItemReturn}
                    bottles={bottles}
                    onUpdateBottles={setBottles}
                />
            )}
            {currentView === AppView.TENANTS && (
                <TenantsView 
                    businessPages={businessPages}
                    setBusinessPages={setBusinessPages}
                    onPreviewPage={(p) => {}}
                    onImpersonate={handleImpersonate}
                />
            )}
            {currentView === AppView.MASTER_PORTAL && (
                <MasterPortalView 
                    onKillSwitch={() => { notify("SYSTEM KILL SWITCH ACTIVATED", 'error'); }}
                    systemConfig={masterConfig} // Pass Master Config for editing global settings
                    onUpdateConfig={(cfg) => { handleUpdateMasterConfig(cfg); notify("System Config Updated", 'success'); }}
                    businessPages={businessPages}
                    setBusinessPages={setBusinessPages}
                    onPreviewPage={() => {}}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                />
            )}
            {currentView === AppView.SYSTEM_BRANDING && (
                <SystemBrandingView 
                    systemConfig={masterConfig} // Pass Master Config
                    onUpdateConfig={(cfg) => { handleUpdateMasterConfig(cfg); notify("System Identity Updated", 'success'); }}
                />
            )}
            {(currentView === AppView.SETTINGS || currentView === AppView.TENANT_SETTINGS) && (
                <SettingsView 
                    config={systemConfig}
                    setConfig={(cfg) => { handleUpdateTenantSettings(cfg); notify("Tenant Settings Saved", 'success'); }}
                    userRole={userRole}
                    isMasterView={currentUser?.id === 'ROOT'}
                    currentUser={currentUser}
                />
            )}
            {currentView === AppView.INVENTORY && (
                <InventoryView 
                    systemConfig={systemConfig}
                    products={currentTenantProducts}
                    onUpdateProducts={handleUpdateProducts}
                    orders={currentTenantOrders}
                />
            )}
            {currentView === AppView.STORE_KEEPER && (
                <StoreKeeperView 
                    storeItems={storeItems}
                    onUpdateStoreItems={setStoreItems}
                    logs={stockLogs}
                    onAddLog={(log) => setStockLogs(prev => [...prev, log])}
                    systemConfig={systemConfig}
                    currentUser={currentUser}
                    requisitions={requisitions}
                    onUpdateRequisition={(req) => setRequisitions(prev => prev.map(r => r.id === req.id ? req : r))}
                    cashEntries={cashEntries}
                    onUpdateCashEntries={setCashEntries}
                />
            )}
            {currentView === AppView.REQUISITION && (
                <RequisitionPortal 
                    storeItems={storeItems}
                    onCreateRequisition={(req) => setRequisitions(prev => [...prev, req])}
                    myRequisitions={requisitions.filter(r => r.requesterName === currentUser?.name)}
                    currentUser={currentUser}
                />
            )}
            {currentView === AppView.HRM && (
                <HRMView 
                    staff={staff}
                    setStaff={setStaff}
                    systemConfig={systemConfig}
                    currentUser={currentUser}
                    attendanceRecords={attendance}
                    onUpdateAttendance={(record) => {
                        setAttendance(prev => {
                            const exists = prev.find(r => r.id === record.id);
                            if (exists) return prev.map(r => r.id === record.id ? record : r);
                            return [record, ...prev];
                        });
                        notify(`Attendance updated for ${record.staffName}`, 'success');
                    }}
                />
            )}
            {currentView === AppView.CRM && (
                <CRMView 
                    customers={customers}
                    setCustomers={setCustomers}
                    systemConfig={systemConfig}
                />
            )}
            {(currentView === AppView.ORDERS || currentView === AppView.POS_LIST || currentView === AppView.VOID_LOG) && (
                <OrdersView 
                    orders={currentTenantOrders}
                    systemConfig={systemConfig}
                    onUpdateOrder={handleUpdateOrder}
                    onPlaceOrder={handlePlaceOrder} 
                    onMergeOrders={handleMergeOrders}
                    userRole={userRole}
                    currentUser={currentUser}
                    onItemReturn={handleItemReturn} 
                    onDeleteOrder={handleDeleteOrder}
                    returns={returns}
                    initialTab={currentView === AppView.VOID_LOG ? 'VOID' : (currentView === AppView.POS_LIST ? 'HISTORY' : 'ACTIVE')}
                    registerState={registerState}
                />
            )}
            {currentView === AppView.TABLES && (
                <TableManagementView 
                    tables={tables}
                    onAddTable={(t) => setTables(prev => [...prev, t])}
                    onUpdateTable={(t) => setTables(prev => prev.map(old => old.id === t.id ? t : old))}
                    onDeleteTable={(id) => setTables(prev => prev.filter(t => t.id !== id))}
                    userRole={userRole}
                    currentUser={currentUser}
                    orders={currentTenantOrders}
                />
            )}
            {currentView === AppView.EXPENSES && (
                <ExpensesView 
                    expenses={expenses}
                    onDeleteExpense={(id) => setExpenses(prev => prev.filter(e => e.id !== id))}
                    onAddExpense={initiateAddExpense}
                    onEditExpense={initiateEditExpense}
                    systemConfig={systemConfig}
                />
            )}
            {currentView === AppView.MESSAGES && (
                <ChatView 
                    currentUser={currentUser}
                    staff={staff}
                    systemConfig={systemConfig}
                    messages={chatMessages}
                    typingUsers={typingUsers}
                />
            )}
            {currentView === AppView.PHONEBOOK && (
                <PhoneBookView currentUser={currentUser} variant="tenant" />
            )}
            {currentView === AppView.MASTER_PHONEBOOK && (
                <PhoneBookView currentUser={currentUser} variant="master" />
            )}
            {currentView === AppView.ACCESS_CONTROL && (
                <AccessControlView permissions={rolePermissions} onUpdatePermissions={handleUpdatePermissions} />
            )}
            {currentView === AppView.TEMPERATURE && (
                <TemperatureView currentUser={currentUser} />
            )}
            {currentView === AppView.SPIRITS && (
                <SpiritsInventoryView 
                    bottles={bottles} 
                    onUpdateBottles={setBottles} 
                    currentUser={currentUser} 
                    systemConfig={systemConfig} 
                    products={currentTenantProducts}
                    storeItems={storeItems}
                    onUpdateStoreItems={setStoreItems}
                    onUpdateProducts={handleUpdateProducts}
                    onAddStockLog={(log) => setStockLogs(prev => [...prev, log])}
                />
            )}
            {currentView === AppView.KITCHEN_INVENTORY && (
                <KitchenInventoryView 
                    products={currentTenantProducts}
                    onUpdateProducts={handleUpdateProducts}
                    storeItems={storeItems}
                    orders={currentTenantOrders}
                    stockLogs={stockLogs}
                    systemConfig={systemConfig}
                    onAddStockLog={(log) => setStockLogs(prev => [...prev, log])}
                />
            )}
            {currentView === AppView.BAKERY_INVENTORY && (
                <KitchenInventoryView 
                    products={currentTenantProducts}
                    onUpdateProducts={handleUpdateProducts}
                    storeItems={storeItems}
                    orders={currentTenantOrders}
                    stockLogs={stockLogs}
                    systemConfig={systemConfig}
                    onAddStockLog={(log) => setStockLogs(prev => [...prev, log])}
                    viewTitle="Bakery Inventory"
                    viewIcon={Croissant}
                />
            )}
            {currentView === AppView.BAR_TABS && (
                <BarTabsView
                    orders={currentTenantOrders}
                    products={currentTenantProducts}
                    systemConfig={systemConfig}
                    currentUser={currentUser}
                    onUpdateOrder={handleUpdateOrder}
                    onPlaceOrder={handlePlaceOrder}
                    onDeleteOrder={handleDeleteOrder}
                    tables={tables}
                />
            )}
            {currentView === AppView.BAR_MENU && (
                <BarMenuView
                    products={currentTenantProducts}
                    systemConfig={systemConfig}
                />
            )}
            {currentView === AppView.REPORTS && <ReportsView orders={currentTenantOrders} expenses={expenses} systemConfig={systemConfig} />}
            {currentView === AppView.ESSENTIALS && <EssentialsView systemConfig={systemConfig} />}
            {currentView === AppView.CATALOGUE_QR && <CatalogueQRView />}
            {currentView === AppView.DAY_SHIFTS && <DayShiftsView shifts={shifts} systemConfig={systemConfig} />}
          </main>

          <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
          <VirtualKeyboard isOpen={isKeyboardOpen} onClose={() => setIsKeyboardOpen(false)} />
          <ExpenseModal 
              isOpen={isExpenseModalOpen}
              onClose={() => setIsExpenseModalOpen(false)}
              onSave={handleSaveExpense}
              systemConfig={systemConfig}
              initialData={editingExpense}
          />
          <ToastContainer notifications={notifications} onDismiss={dismissNotification} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
