import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppView, SystemConfig, UserRole, Order, Product, StaffMember, Customer, RegisterState, Table, Expense, StockMovementLog, Requisition, BusinessPage, ChatMessage, StoreItem, RolePermissions, PermissionAction, ReturnRecord, OrderItem, AttendanceRecord, SpiritBottle, SectionAllocation } from './types';
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
import AIStudioView from './components/AIStudioView';
import ExpenseModal from './components/ExpenseModal';
import WaiterAllocationsView from './components/WaiterAllocationsView';
import VoidLogView from './components/VoidLogView';
import POSListView from './components/POSListView';
import IdleLockScreen from './components/IdleLockScreen';
import { ToastContainer, Notification, NotificationType } from './components/Notifications';
import { PRODUCTS_DATA, TABLES_DATA, MOCK_TENANTS, STORE_ITEMS_DATA } from './mockData';
import { initSync, broadcast } from './services/syncService';
import { Croissant } from 'lucide-react'; 

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  tenantId: 'ROOT',
  subscriptionTier: 'ENTERPRISE',
  name: 'EAGLE 🦅 EYED POS',
  logo: 'input_file_0.png',
  service: 'Hospitality',
  owner_contact: '+256 7413 50786',
  support_email: 'akamperpos@gmail.com',
  currency: 'UGX',
  master_pin: '0000',
  fontFamily: 'Inter',
  colors: { primary: '#2563eb', accent: '#f59e0b', success: '#10b981', bg: '#f3f4f6' },
  receipt: {
    logoUrl: 'input_file_0.png',
    showLogo: true,
    headerText: 'Welcome to EAGLE 🦅 EYED POS',
    footerText: 'Thank you for your business!',
    fontSize: 12,
    scale: 100,
    fontFamily: 'courier',
    paperWidth: '80mm'
  }
};

const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  OWNER: { 
    allowedViews: Object.values(AppView).filter(v => v !== AppView.AI_STUDIO && v !== AppView.ACCESS_CONTROL), 
    allowedActions: ['DELETE_ORDER', 'VOID_ITEM', 'PROCESS_REFUND', 'VIEW_COST_PRICE', 'MANAGE_STOCK', 'EDIT_MENU', 'VIEW_ANALYTICS', 'MANAGE_STAFF', 'CLOSE_REGISTER'] 
  },
  MANAGER: { 
    allowedViews: [AppView.DASHBOARD, AppView.SELL, AppView.POS_LIST, AppView.ORDERS, AppView.KITCHEN, AppView.PRODUCTS, AppView.INVENTORY, AppView.EXPENSES, AppView.REPORTS, AppView.HRM, AppView.CRM, AppView.MESSAGES, AppView.STORE_KEEPER, AppView.REQUISITION, AppView.ACCESS_CONTROL, AppView.PHONEBOOK, AppView.DAY_SHIFTS, AppView.SPIRITS, AppView.BAR_TABS, AppView.BAR_MENU, AppView.TABLES, AppView.KITCHEN_INVENTORY, AppView.BAKERY_INVENTORY, AppView.WAITER_PORTAL, AppView.WAITER_ALLOCATIONS, AppView.VOID_LOG, AppView.AI_STUDIO], 
    allowedActions: ['VOID_ITEM', 'PROCESS_REFUND', 'MANAGE_STOCK', 'CLOSE_REGISTER', 'VIEW_ANALYTICS', 'MANAGE_STAFF', 'EDIT_MENU'] 
  },
  CASHIER: { 
    allowedViews: [AppView.DASHBOARD, AppView.SELL, AppView.EXPENSES, AppView.CRM, AppView.ORDERS, AppView.MESSAGES, AppView.REQUISITION, AppView.PHONEBOOK, AppView.DAY_SHIFTS, AppView.BAR_TABS, AppView.WAITER_PORTAL, AppView.SPIRITS, AppView.POS_LIST, AppView.AI_STUDIO], 
    allowedActions: ['CLOSE_REGISTER', 'PROCESS_REFUND'] 
  },
  WAITER: { 
    allowedViews: [AppView.WAITER_PORTAL, AppView.ORDERS, AppView.KITCHEN, AppView.TEMPERATURE, AppView.PHONEBOOK, AppView.MESSAGES, AppView.REQUISITION, AppView.BAR_MENU, AppView.AI_STUDIO], 
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

function useIsolatedState<T>(tenantId: string, key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const fullKey = `${tenantId}_${key}`;
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(fullKey);
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
      return initialValue;
    }
  });

  useEffect(() => {
    const item = localStorage.getItem(fullKey);
    if (item) {
      setState(JSON.parse(item, (k, v) => {
          if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
              return new Date(v);
          }
          return v;
      }));
    } else {
      setState(initialValue);
    }
  }, [fullKey]);

  useEffect(() => {
    localStorage.setItem(fullKey, JSON.stringify(state));
  }, [fullKey, state]);

  return [state, setState];
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isIdleLocked, setIsIdleLocked] = useState(false);
  const [loginMode, setLoginMode] = useState<'client' | 'staff'>('client');
  const [currentUser, setCurrentUser] = useState<StaffMember | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(() => {
      const saved = localStorage.getItem('global_system_config');
      return saved ? JSON.parse(saved) : DEFAULT_SYSTEM_CONFIG;
  });
  
  const [businessPages, setBusinessPages] = useState<BusinessPage[]>(() => {
      const saved = localStorage.getItem('global_business_pages');
      return saved ? JSON.parse(saved) : MOCK_TENANTS;
  });

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { localStorage.setItem('global_system_config', JSON.stringify(systemConfig)); }, [systemConfig]);
  useEffect(() => { localStorage.setItem('global_business_pages', JSON.stringify(businessPages)); }, [businessPages]);

  const tId = systemConfig.tenantId;

  const [orders, setOrders] = useIsolatedState<Order[]>(tId, 'orders', []);
  const [products, setProducts] = useIsolatedState<Product[]>(tId, 'products', PRODUCTS_DATA);
  const [customers, setCustomers] = useIsolatedState<Customer[]>(tId, 'customers', []);
  const [staff, setStaff] = useIsolatedState<StaffMember[]>(tId, 'staff', [
      { id: `S-001-${tId}`, name: 'Manager Andre', role: 'MANAGER', pin: '123456', contact: '+256 700 111222', status: 'active', schedule: 'Mon-Sat, 8am-5pm', uniformColor: '#3b82f6', isProtected: true }
  ]);
  const [attendance, setAttendance] = useIsolatedState<AttendanceRecord[]>(tId, 'attendance', []);
  const [tables, setTables] = useIsolatedState<Table[]>(tId, 'tables', TABLES_DATA);
  const [expenses, setExpenses] = useIsolatedState<Expense[]>(tId, 'expenses', []);
  const [stockLogs, setStockLogs] = useIsolatedState<StockMovementLog[]>(tId, 'stockLogs', []);
  const [storeItems, setStoreItems] = useIsolatedState<StoreItem[]>(tId, 'storeItems', STORE_ITEMS_DATA);
  const [requisitions, setRequisitions] = useIsolatedState<Requisition[]>(tId, 'requisitions', []);
  const [shifts, setShifts] = useIsolatedState<any[]>(tId, 'shifts', []); 
  const [returns, setReturns] = useIsolatedState<ReturnRecord[]>(tId, 'returns', []);
  const [bottles, setBottles] = useIsolatedState<SpiritBottle[]>(tId, 'bottles', []);
  const [cashEntries, setCashEntries] = useIsolatedState<any[]>(tId, 'cashEntries', []);
  const [registerState, setRegisterState] = useIsolatedState<RegisterState>(tId, 'registerState', { isOpen: false, openingCash: 0, startTime: null, closedTime: null });
  const [rolePermissions, setRolePermissions] = useIsolatedState<Record<string, RolePermissions>>(tId, 'rolePermissions', DEFAULT_ROLE_PERMISSIONS);
  const [allocations, setAllocations] = useIsolatedState<SectionAllocation[]>(tId, 'allocations', []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isBellActive, setIsBellActive] = useState(false);
  const [latestKitchenAlert, setLatestKitchenAlert] = useState<{sender: string, timestamp: number} | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [chatMessages, setChatMessages] = useIsolatedState<ChatMessage[]>(tId, 'chatMessages', []); 
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isAuthenticated && !isIdleLocked) {
        // High-security automatic locking (15s)
        idleTimerRef.current = setTimeout(() => {
            setIsIdleLocked(true);
        }, 15000); 
    }
  }, [isAuthenticated, isIdleLocked]);

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown'];
    const handler = () => resetIdleTimer();
    if (isAuthenticated && !isIdleLocked) {
        events.forEach(event => window.addEventListener(event, handler));
        resetIdleTimer();
    }
    return () => {
        events.forEach(event => window.removeEventListener(event, handler));
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isAuthenticated, isIdleLocked, resetIdleTimer]);

  useEffect(() => { document.body.style.fontFamily = systemConfig.fontFamily || 'Inter'; }, [systemConfig.fontFamily]);

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
        }
    }, tId);
    return () => { unsubscribe(); };
  }, [currentView, setChatMessages, tId]);

  const notify = (message: string, type: NotificationType = 'info') => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, message, type }]);
  };

  const dismissNotification = (id: string) => { setNotifications(prev => prev.filter(n => n.id !== id)); };

  const handleUpdatePermissions = (role: UserRole, type: 'view' | 'action', key: string, value: boolean) => {
    if (!role) return;
    setRolePermissions(prev => {
        const currentRolePerms = prev[role] || { allowedViews: [], allowedActions: [] };
        let newViews = [...currentRolePerms.allowedViews];
        let newActions = [...currentRolePerms.allowedActions];
        if (type === 'view') {
            if (value) { if (!newViews.includes(key as AppView)) newViews.push(key as AppView); }
            else { newViews = newViews.filter(v => v !== key); }
        } else {
            if (value) { if (!newActions.includes(key as PermissionAction)) newActions.push(key as PermissionAction); }
            else { newActions = newActions.filter(a => a !== key); }
        }
        return { ...prev, [role]: { allowedViews: newViews, allowedActions: newActions } };
    });
    notify("Permissions updated successfully", 'success');
  };

  const handleLogin = (pin: string) => {
      if (pin === systemConfig.master_pin) { 
          setIsAuthenticated(true);
          setUserRole('OWNER');
          setCurrentUser({ id: `OWNER-${tId}`, name: 'Business Owner', role: 'OWNER', pin: systemConfig.master_pin, contact: systemConfig.owner_contact, status: 'active' });
          setCurrentView(AppView.DASHBOARD);
          notify(`Welcome back, ${systemConfig.name} Admin`, 'success');
          return;
      }
      const member = staff.find(s => s.pin === pin && s.status === 'active');
      if (member) {
          setIsAuthenticated(true);
          setUserRole(member.role);
          setCurrentUser(member);
          switch (member.role) {
              case 'WAITER': setCurrentView(AppView.WAITER_PORTAL); break;
              case 'CHEF': setCurrentView(AppView.KITCHEN); break;
              case 'HEAD_BAKER': setCurrentView(AppView.BAKERY_INVENTORY); break;
              case 'STORE_KEEPER': setCurrentView(AppView.STORE_KEEPER); break;
              case 'BARMAN': setCurrentView(AppView.SPIRITS); break;
              default: setCurrentView(AppView.DASHBOARD);
          }
          notify(`Welcome back, ${member.name}`, 'success');
      } else {
          notify("Invalid PIN Code. Access Denied.", 'error');
      }
  };

  const handleClientLogin = (u: string, p: string) => {
      if (u === 'taatamalikh@gmail.com' && p === 'Akamper2026') {
          setIsAuthenticated(true);
          setUserRole('OWNER');
          setCurrentUser({ id: 'ROOT', name: 'Master Admin', role: 'OWNER', pin: '000000', contact: 'System Master', status: 'active', isProtected: true });
          setSystemConfig({ ...DEFAULT_SYSTEM_CONFIG, tenantId: 'ROOT' });
          setCurrentView(AppView.TENANTS);
          notify("Master Root Access Granted", 'warning');
          return;
      }
      const tenant = businessPages.find(b => b.credentials?.username === u && b.credentials?.password === p);
      if (tenant) {
          setSystemConfig(prev => ({
              ...prev,
              tenantId: tenant.id,
              name: tenant.businessName,
              owner_contact: tenant.contact,
              subscriptionTier: tenant.tier,
              logo: tenant.settings?.logo || prev.logo,
              master_pin: tenant.credentials?.adminPin || '0000'
          }));
          setLoginMode('staff'); 
          notify("Private Business Session Initialized.", 'info');
      } else {
          notify("Invalid Business Credentials.", 'error');
      }
  };

  const handleLogout = useCallback(() => {
      setIsAuthenticated(false);
      setIsIdleLocked(false);
      setLoginMode('staff'); 
      setCurrentUser(null);
      setUserRole(null);
      notify("Business Instance Locked", 'info');
  }, []);

  const handleFullLogout = () => {
      setIsAuthenticated(false);
      setIsIdleLocked(false);
      setLoginMode('client');
      setSystemConfig(DEFAULT_SYSTEM_CONFIG);
      setCurrentUser(null);
      setUserRole(null);
      notify("Logged out from all businesses", 'success');
  };

  const handleImpersonate = (page: BusinessPage, targetView: AppView = AppView.DASHBOARD) => {
      setSystemConfig(prev => ({
          ...prev,
          tenantId: page.id,
          name: page.businessName,
          owner_contact: page.contact,
          subscriptionTier: page.tier,
          logo: page.settings?.logo || prev.logo,
          master_pin: page.credentials?.adminPin || '0000'
      }));
      setCurrentUser({ id: `MASTER_OVERRIDE_${Date.now()}`, name: 'System Auditor', role: 'OWNER', pin: '000000', contact: 'System', status: 'active' });
      setUserRole('OWNER');
      setCurrentView(targetView);
      notify(`Private Access to ${page.businessName}`, 'warning');
  };

  const handlePlaceOrder = (order: Order) => {
      setOrders(prev => [order, ...prev]);
      if (order.isKitchenOrder) {
          broadcast('KITCHEN_CALL', { sender: order.staffName || 'System', timestamp: Date.now() });
          setIsBellActive(true);
      }
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      const hasNewItems = updatedOrder.items.some(item => item.isNew === true);
      if (hasNewItems) {
          broadcast('KITCHEN_CALL', { sender: updatedOrder.staffName || 'System', timestamp: Date.now() });
          setIsBellActive(true);
      }
  };

  const handleDeleteOrder = (orderId: string, reason?: string) => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
          const record: ReturnRecord = {
              id: `RET-${Date.now()}`,
              originalOrderId: order.id,
              originalOrderTimestamp: order.timestamp,
              items: order.items,
              totalRefunded: order.grandTotal,
              timestamp: new Date(),
              authorizedBy: currentUser?.name || 'Admin',
              originalCreator: order.staffName, 
              reason: reason || 'Cancelled',
              type: 'FULL_ORDER'
          };
          setReturns(prev => [record, ...prev]);
      }
  };

  const handleMergeOrders = (targetId: string, sourceIds: string[]) => {
      const targetOrder = orders.find(o => o.id === targetId);
      if (!targetOrder) return;

      const sources = orders.filter(o => sourceIds.includes(o.id));
      const combinedItems = [...targetOrder.items];

      sources.forEach(src => {
          src.items.forEach(srcItem => {
              const existingIdx = combinedItems.findIndex(i => i.product.id === srcItem.product.id && i.note === srcItem.note);
              if (existingIdx >= 0) {
                  combinedItems[existingIdx] = { ...combinedItems[existingIdx], quantity: combinedItems[existingIdx].quantity + srcItem.quantity };
              } else {
                  combinedItems.push({ ...srcItem });
              }
          });
      });

      const newTotal = combinedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      const updatedOrders = orders.map(o => {
          if (o.id === targetId) {
              return { 
                  ...o, 
                  items: combinedItems, 
                  grandTotal: newTotal,
                  customerName: `${o.customerName} (Merged Bill)`
              };
          }
          if (sourceIds.includes(o.id)) {
              return { ...o, status: 'merged' as any };
          }
          return o;
      });

      setOrders(updatedOrders);
      notify(`Orders consolidated into bill ${targetId.slice(-4)}`, 'success');
  };

  const handleItemReturn = (orderId: string, originalTime: Date, items: OrderItem[], totalRefund: number, reason: string) => {
      const originalOrder = orders.find(o => o.id === orderId);
      const record: ReturnRecord = {
          id: `VOID-${Date.now()}`,
          originalOrderId: orderId,
          originalOrderTimestamp: originalTime,
          items: items,
          totalRefunded: totalRefund,
          timestamp: new Date(),
          authorizedBy: currentUser?.name || 'Admin',
          originalCreator: originalOrder?.staffName, 
          reason: reason || 'Voided',
          type: 'PARTIAL_ITEM'
      };
      setReturns(prev => [record, ...prev]);
  };

  const handleClaimSection = (section: string) => {
      if (!currentUser) return;
      const newAlloc: SectionAllocation = {
          id: `ALC-${Date.now()}`,
          sectionName: section,
          waiterId: currentUser.id,
          waiterName: currentUser.name,
          timestamp: new Date()
      };
      const updated = [...allocations, newAlloc];
      setAllocations(updated);
      broadcast('TABLE_UPDATE', updated);
      notify(`Section ${section} allocated to you.`, 'success');
  };

  const handleUpdateAllocations = (newAllocations: SectionAllocation[]) => {
      setAllocations(newAllocations);
      broadcast('TABLE_UPDATE', newAllocations);
  };

  const handleAddCustomer = (customer: Customer) => { setCustomers(prev => [customer, ...prev]); };
  const handleUpdateProducts = (updatedProducts: Product[]) => { setProducts(updatedProducts); };
  const handleCloseRegister = () => {
      if (!registerState.isOpen) return;
      const shift: any = { id: `SHIFT-${Date.now()}`, openedAt: registerState.startTime!, closedAt: new Date(), openingCash: registerState.openingCash, closingCash: 0, status: 'CLOSED', openedBy: currentUser?.name || 'Unknown' };
      setShifts(prev => [shift, ...prev]);
      setRegisterState({ isOpen: false, openingCash: 0, startTime: null, closedTime: null });
  };
  const handleOpenRegister = (amount: number) => { setRegisterState({ isOpen: true, openingCash: amount, startTime: new Date(), closedTime: null }); };

  const handleSaveExpense = (expenseData: { itemName: string; department: string; category: string; amount: number; description: string }) => {
    if (editingExpense) {
        setExpenses(prev => prev.map(e => e.id === editingExpense.id ? { ...e, ...expenseData } : e));
    } else {
        const newExpense: Expense = {
            id: `EXP-${Date.now()}`,
            timestamp: new Date(),
            ...expenseData
        };
        setExpenses(prev => [newExpense, ...prev]);
    }
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const initiateAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const initiateEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleUpdateUserPhoto = (file: File) => {
    if (!currentUser) return;
    const reader = new FileReader();
    reader.onerror = () => notify("Failed to read image format", "error");
    reader.onloadend = () => {
        const result = reader.result as string;
        setCurrentUser(prev => prev ? { ...prev, photoUrl: result } : null);
        setStaff(prev => prev.map(s => s.id === currentUser.id ? { ...s, photoUrl: result } : s));
        notify("Profile photo updated", 'success');
    };
    reader.readAsDataURL(file);
  };

  const isMaster = currentUser?.id === 'ROOT' || currentUser?.id?.startsWith('MASTER_OVERRIDE');
  
  // Mobile Navigation Handling
  const handleViewChange = (view: AppView) => {
      setCurrentView(view);
      setIsSidebarOpen(false); // Auto close sidebar on mobile navigation
  };

  if (isIdleLocked && isAuthenticated) {
    return (
        <ErrorBoundary>
            <IdleLockScreen 
                onUnlock={() => {
                    setIsIdleLocked(false);
                    setIsAuthenticated(false); 
                    setLoginMode('staff');
                }} 
                systemConfig={systemConfig}
            />
        </ErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginView 
          onLogin={handleLogin} onClientLogin={handleClientLogin}
          systemName="EAGLE 🦅 EYED POS" viewMode={loginMode}
          businessName={systemConfig.name} logoUrl={systemConfig.logo}
          onSwitchAccount={loginMode === 'staff' ? handleFullLogout : undefined}
        />
        <VirtualKeyboard isOpen={isKeyboardOpen} onClose={() => setIsKeyboardOpen(false)} />
        <ToastContainer notifications={notifications} onDismiss={dismissNotification} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden bg-gray-100 font-sans text-slate-900">
        <Sidebar 
          currentView={currentView} onViewChange={handleViewChange}
          isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
          systemConfig={systemConfig} userRole={userRole}
          onLogout={handleLogout} onFullLogout={handleFullLogout} 
          currentUser={currentUser} unreadMessageCount={unreadMessageCount}
          permissions={rolePermissions} 
          onExitImpersonation={currentUser?.id?.startsWith('MASTER_OVERRIDE') ? () => {
              setSystemConfig(DEFAULT_SYSTEM_CONFIG);
              setCurrentUser({ id: 'ROOT', name: 'Master Admin', role: 'OWNER', pin: '000000', contact: 'System Master', status: 'active', isProtected: true });
              setCurrentView(AppView.TENANTS);
          } : undefined}
        />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <Header 
            title={currentView.replace('_', ' ')} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            isSidebarOpen={isSidebarOpen} primaryColor={systemConfig.colors.primary}
            userRole={userRole} businessName={systemConfig.name}
            onGlobalBack={() => { if(currentView !== AppView.DASHBOARD && userRole !== 'WAITER') setCurrentView(AppView.DASHBOARD); }}
            canGoBack={currentView !== AppView.DASHBOARD && currentView !== AppView.TENANTS && userRole !== 'WAITER'}
            onNavigate={setCurrentView} onCloseRegister={handleCloseRegister}
            onCalculator={() => setIsCalculatorOpen(true)} 
            onToggleKeyboard={() => setIsKeyboardOpen(!isKeyboardOpen)}
            onAddExpense={initiateAddExpense} currentUser={currentUser} onLogout={handleLogout}
            onUpdateUserPhoto={handleUpdateUserPhoto}
          />
          <main className={`flex-1 overflow-hidden relative transition-all duration-300`}>
            <div className="h-full overflow-y-auto custom-scrollbar">
                {currentView === AppView.DASHBOARD && <Dashboard orders={orders} expenses={expenses} registerState={registerState} systemConfig={systemConfig} userRole={userRole} currentUser={currentUser} onCloseRegister={handleCloseRegister} onOpenRegister={handleOpenRegister} returns={returns} />}
                {currentView === AppView.SELL && <SellView systemConfig={systemConfig} onPlaceOrder={handlePlaceOrder} onUpdateOrder={handleUpdateOrder} onDeleteOrder={handleDeleteOrder} onItemReturn={handleItemReturn} onAddCustomer={handleAddCustomer} orders={orders} userRole={userRole} registerState={registerState} onOpenRegister={handleOpenRegister} tables={tables} products={products} returns={returns} customers={customers} staff={staff} currentUser={currentUser} bottles={bottles} onUpdateBottles={setBottles} />}
                {currentView === AppView.KITCHEN && <KitchenView systemConfig={systemConfig} orders={orders} onUpdateStatus={(id, status) => { setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); }} onAddOrder={handlePlaceOrder} onUpdateOrder={handleUpdateOrder} userRole={userRole} products={products} isBellActive={isBellActive} onStopBell={() => setIsBellActive(false)} kitchenAlertProp={latestKitchenAlert} />}
                {currentView === AppView.WAITER_PORTAL && <WaiterPortalView orders={orders} products={products} systemConfig={systemConfig} currentUser={currentUser} staff={staff} tables={tables} onLogout={handleLogout} onNavigate={setCurrentView} onPlaceOrder={handlePlaceOrder} onUpdateOrder={handleUpdateOrder} onDeleteOrder={handleDeleteOrder} onItemReturn={handleItemReturn} bottles={bottles} onUpdateBottles={setBottles} allocations={allocations} onClaimSection={handleClaimSection} />}
                {currentView === AppView.TENANTS && <TenantsView businessPages={businessPages} setBusinessPages={setBusinessPages} onPreviewPage={() => {}} onImpersonate={handleImpersonate} />}
                {currentView === AppView.MASTER_PORTAL && <MasterPortalView onKillSwitch={() => { alert("System Locked"); }} systemConfig={systemConfig} onUpdateConfig={setSystemConfig} businessPages={businessPages} setBusinessPages={setBusinessPages} onPreviewPage={() => {}} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />}
                {(currentView === AppView.SETTINGS || currentView === AppView.TENANT_SETTINGS) && <SettingsView config={systemConfig} setConfig={setSystemConfig} userRole={userRole} isMasterView={currentUser?.id === 'ROOT'} currentUser={currentUser} />}
                {currentView === AppView.INVENTORY && <InventoryView systemConfig={systemConfig} products={products} onUpdateProducts={handleUpdateProducts} permissions={{ allowedViews: [], allowedActions: [] }} userRole={userRole} isMaster={isMaster} />}
                {currentView === AppView.STORE_KEEPER && <StoreKeeperView storeItems={storeItems} onUpdateStoreItems={setStoreItems} logs={stockLogs} onAddLog={(log) => setStockLogs(prev => [...prev, log])} systemConfig={systemConfig} currentUser={currentUser} requisitions={requisitions} onUpdateRequisition={(req) => setRequisitions(prev => prev.map(r => r.id === req.id ? req : r))} cashEntries={cashEntries} onUpdateCashEntries={setCashEntries} />}
                {currentView === AppView.REQUISITION && <RequisitionPortal storeItems={storeItems} onCreateRequisition={(req) => setRequisitions(prev => [...prev, req])} myRequisitions={requisitions.filter(r => r.requesterName === currentUser?.name)} currentUser={currentUser} />}
                {currentView === AppView.HRM && <HRMView staff={staff} setStaff={setStaff} systemConfig={systemConfig} currentUser={currentUser} attendanceRecords={attendance} onUpdateAttendance={(record) => { setAttendance(prev => { const exists = prev.find(r => r.id === record.id); if (exists) return prev.map(r => r.id === record.id ? record : r); return [record, ...prev]; }); }} />}
                {currentView === AppView.CRM && <CRMView customers={customers} setCustomers={setCustomers} systemConfig={systemConfig} />}
                {currentView === AppView.TABLES && <TableManagementView tables={tables} onAddTable={(t) => setTables(prev => [...prev, t])} onUpdateTable={(t) => setTables(prev => prev.map(old => old.id === t.id ? t : old))} onDeleteTable={(id) => setTables(prev => prev.filter(t => t.id !== id))} userRole={userRole} currentUser={currentUser} orders={orders} />}
                {currentView === AppView.EXPENSES && <ExpensesView expenses={expenses} onDeleteExpense={(id) => setExpenses(prev => prev.filter(e => e.id !== id))} onAddExpense={initiateAddExpense} onEditExpense={initiateEditExpense} systemConfig={systemConfig} />}
                {currentView === AppView.MESSAGES && <ChatView currentUser={currentUser} staff={staff} systemConfig={systemConfig} messages={chatMessages} typingUsers={typingUsers} />}
                {currentView === AppView.SPIRITS && <SpiritsInventoryView bottles={bottles} onUpdateBottles={setBottles} currentUser={currentUser} systemConfig={systemConfig} products={products} storeItems={storeItems} onUpdateStoreItems={setStoreItems} onUpdateProducts={handleUpdateProducts} onAddStockLog={(log) => setStockLogs(prev => [...prev, log])} />}
                {currentView === AppView.KITCHEN_INVENTORY && <KitchenInventoryView products={products} onUpdateProducts={handleUpdateProducts} storeItems={storeItems} orders={orders} stockLogs={stockLogs} systemConfig={systemConfig} onAddStockLog={(log) => setStockLogs(prev => [...prev, log])} />}
                {currentView === AppView.BAKERY_INVENTORY && <KitchenInventoryView products={products} onUpdateProducts={handleUpdateProducts} storeItems={storeItems} orders={orders} stockLogs={stockLogs} systemConfig={systemConfig} onAddStockLog={(log) => setStockLogs(prev => [...prev, log])} viewTitle="Bakery Inventory" viewIcon={Croissant} />}
                {currentView === AppView.BAR_TABS && <BarTabsView orders={orders} products={products} systemConfig={systemConfig} currentUser={currentUser} onUpdateOrder={handleUpdateOrder} onPlaceOrder={handlePlaceOrder} onDeleteOrder={handleDeleteOrder} tables={tables} />}
                {currentView === AppView.BAR_MENU && <BarMenuView products={products} systemConfig={systemConfig} />}
                {currentView === AppView.REPORTS && <ReportsView orders={orders} expenses={expenses} systemConfig={systemConfig} />}
                {currentView === AppView.ESSENTIALS && <EssentialsView systemConfig={systemConfig} />}
                {currentView === AppView.DAY_SHIFTS && <DayShiftsView shifts={shifts} systemConfig={systemConfig} />}
                {currentView === AppView.AI_STUDIO && <AIStudioView />}
                {currentView === AppView.WAITER_ALLOCATIONS && <WaiterAllocationsView staff={staff} tables={tables} allocations={allocations} onUpdateAllocations={handleUpdateAllocations} systemConfig={systemConfig} />}
                {currentView === AppView.VOID_LOG && <VoidLogView returns={returns} systemConfig={systemConfig} />}
                {currentView === AppView.POS_LIST && <POSListView onNavigate={setCurrentView} businessName={systemConfig.name} />}
                {currentView === AppView.ORDERS && <OrdersView orders={orders} systemConfig={systemConfig} onUpdateOrder={handleUpdateOrder} onPlaceOrder={handlePlaceOrder} onMergeOrders={handleMergeOrders} userRole={userRole} currentUser={currentUser} onDeleteOrder={handleDeleteOrder} returns={returns} registerState={registerState} onItemReturn={handleItemReturn} />}
                {currentView === AppView.PHONEBOOK && <PhoneBookView currentUser={currentUser} variant="tenant" />}
                {currentView === AppView.MASTER_PHONEBOOK && <PhoneBookView currentUser={currentUser} variant="master" />}
                {currentView === AppView.SYSTEM_BRANDING && <SystemBrandingView systemConfig={systemConfig} onUpdateConfig={setSystemConfig} />}
                {currentView === AppView.CATALOGUE_QR && <CatalogueQRView />}
                {currentView === AppView.ACCESS_CONTROL && <AccessControlView permissions={rolePermissions} onUpdatePermissions={handleUpdatePermissions} />}
                {currentView === AppView.TEMPERATURE && <TemperatureView currentUser={currentUser} />}
            </div>
          </main>
          <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
          <VirtualKeyboard isOpen={isKeyboardOpen} onClose={() => setIsKeyboardOpen(false)} />
          <ExpenseModal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} onSave={handleSaveExpense} systemConfig={systemConfig} initialData={editingExpense} />
          <ToastContainer notifications={notifications} onDismiss={dismissNotification} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;