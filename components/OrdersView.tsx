
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Eye, Trash2, RotateCcw, CheckCircle2, MoreVertical, X, Printer, User, Ban, ChevronDown, Receipt, Clock, CreditCard, Utensils, AlertCircle, Banknote, Smartphone, Briefcase, Wallet, FileX, AlertTriangle, Calendar, DollarSign, CheckSquare, Square, Split, ArrowRight, UserCheck, ShieldAlert, ArrowUpDown } from 'lucide-react';
import { Order, SystemConfig, UserRole, ReturnRecord, OrderItem, StaffMember, RegisterState } from '../types';
import { printReceipt, generateReceiptHtml } from '../services/receiptService';

interface OrdersViewProps {
  orders: Order[];
  systemConfig: SystemConfig;
  onUpdateOrder: (order: Order) => void;
  onPlaceOrder: (order: Order) => void;
  onMergeOrders: (targetId: string, sourceId: string) => void;
  userRole: UserRole;
  currentUser: StaffMember | null;
  onItemReturn?: (orderId: string, timestamp: Date, items: OrderItem[], refund: number, reason: string) => void;
  onDeleteOrder: (id: string, reason: string) => void;
  returns: ReturnRecord[];
  initialTab?: 'ACTIVE' | 'HISTORY' | 'VOID' | 'MERGE';
  registerState: RegisterState; // New prop
}

const formatInvoiceId = (id: string) => {
  const numeric = id.replace(/\D/g, '');
  const shortened = numeric.slice(-8).padStart(8, '0');
  return `INV-${shortened.slice(0, 4)}-${shortened.slice(4)}`;
};

const OrdersView: React.FC<OrdersViewProps> = ({ 
  orders, systemConfig, onUpdateOrder, onPlaceOrder, onMergeOrders, userRole, currentUser,
  onItemReturn, onDeleteOrder, returns, initialTab = 'ACTIVE', registerState
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY' | 'VOID' | 'MERGE'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null); // New state for viewing void details
  const [mergeSelection, setMergeSelection] = useState<string[]>([]); 

  // New Filter States
  const [dateFilter, setDateFilter] = useState<string>('TODAY');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('ALL');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'CARD' | 'SALARY_PAY'>('CASH');
  const [salaryStaffName, setSalaryStaffName] = useState('');
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState(true);

  // Void Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [orderToVoid, setOrderToVoid] = useState<Order | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Split Modal State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitItems, setSplitItems] = useState<{itemIndex: number, quantity: number}[]>([]); 
  
  // Receipt Preview State
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Permissions
  const canVoid = ['MANAGER', 'OWNER', 'CASHIER'].includes(userRole || '');
  const isCashierOrManager = ['CASHIER', 'MANAGER', 'OWNER'].includes(userRole || '');
  
  // Sync tab if initialTab changes prop changes (e.g. navigation)
  useEffect(() => {
      setActiveTab(initialTab);
  }, [initialTab]);

  // Close details when tab changes
  useEffect(() => {
      setSelectedOrder(null);
      setSelectedReturn(null);
      setMergeSelection([]);
  }, [activeTab]);

  // Filter Logic
  const filteredOrders = useMemo(() => {
      let data = orders;
      
      // 1. Tab Filtering
      if (activeTab === 'ACTIVE') {
          data = data.filter(o => !['paid', 'completed', 'cancelled', 'merged'].includes(o.status));
      } else if (activeTab === 'HISTORY') {
          data = data.filter(o => ['paid', 'completed', 'merged'].includes(o.status));
      } else if (activeTab === 'VOID') {
          // VOID TAB NOW USES 'returns' prop in the rendering logic, not filteredOrders
          // But we keep this consistent for search/date filters if we wanted to filter returns
          // We will handle returns filtering separately
          return [];
      } else if (activeTab === 'MERGE') {
          data = data.filter(o => !['paid', 'completed', 'cancelled', 'merged'].includes(o.status));
      }

      // 2. Date Filtering
      const now = new Date();
      const start = new Date();
      const end = new Date();
      
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);

      let useDateFilter = true;

      switch (dateFilter) {
        case 'TODAY': break;
        case 'YESTERDAY':
          start.setDate(start.getDate() - 1);
          end.setDate(end.getDate() - 1);
          break;
        case 'LAST_7_DAYS':
          start.setDate(start.getDate() - 7);
          break;
        case 'LAST_30_DAYS':
          start.setDate(start.getDate() - 30);
          break;
        case 'THIS_MONTH':
          start.setDate(1);
          break;
        case 'THIS_YEAR':
           start.setMonth(0, 1);
           break;
        case 'ALL':
          useDateFilter = false;
          break;
        default:
          useDateFilter = false;
      }

      if (useDateFilter) {
          data = data.filter(o => {
              const t = new Date(o.timestamp);
              return t >= start && t <= end;
          });
      }

      // 3. Payment Status Filtering
      if (paymentStatusFilter !== 'ALL') {
          data = data.filter(o => {
              const paid = o.amountPaid || 0;
              const total = o.grandTotal;
              
              if (paymentStatusFilter === 'PAID') return paid >= total && total > 0;
              if (paymentStatusFilter === 'DUE') return paid < total;
              if (paymentStatusFilter === 'PARTIAL') return paid > 0 && paid < total;
              if (paymentStatusFilter === 'OVERDUE') {
                  const isOld = new Date(o.timestamp) < new Date(new Date().setHours(0,0,0,0));
                  return paid < total && isOld;
              }
              return true;
          });
      }

      // 4. Search Filtering
      if (searchTerm) {
          const lower = searchTerm.toLowerCase();
          data = data.filter(o => 
              o.id.toLowerCase().includes(lower) || 
              o.customerName.toLowerCase().includes(lower) || 
              o.table.toLowerCase().includes(lower) ||
              (o.staffName && o.staffName.toLowerCase().includes(lower)) ||
              (o.completedBy && o.completedBy.toLowerCase().includes(lower))
          );
      }

      return data.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders, activeTab, searchTerm, dateFilter, paymentStatusFilter]);

  // --- FILTERED RETURNS FOR VOID TAB ---
  const filteredReturns = useMemo(() => {
      let data = [...returns];
      return data.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [returns]);

  // Derive Void Details if selected order is cancelled
  const voidDetails = useMemo(() => {
      if (!selectedOrder || selectedOrder.status !== 'cancelled') return null;
      return returns.find(r => r.originalOrderId === selectedOrder.id);
  }, [selectedOrder, returns]);

  // Calculate Footer Aggregates
  const totals = useMemo(() => {
    return filteredOrders.reduce((acc, o) => {
      const paid = o.amountPaid || 0;
      const due = o.grandTotal - paid;
      const isFullyPaid = paid >= o.grandTotal && o.grandTotal > 0;
      const isDue = paid < o.grandTotal;
      
      acc.totalAmount += o.grandTotal;
      acc.totalPaid += paid;
      acc.totalDue += (due > 0 ? due : 0);
      
      if (isFullyPaid) acc.countPaid += 1;
      if (isDue && o.grandTotal > 0) acc.countDue += 1;
      
      const method = o.paymentMethod ? o.paymentMethod.replace('_', ' ') : 'Unspecified';
      acc.methods[method] = (acc.methods[method] || 0) + 1;
      
      return acc;
    }, { totalAmount: 0, totalPaid: 0, totalDue: 0, countPaid: 0, countDue: 0, methods: {} as Record<string, number> });
  }, [filteredOrders]);

  const handlePrint = (order: Order) => {
      // Check Register for Cashiers
      if (isCashierOrManager && !registerState.isOpen) {
          alert("REGISTER CLOSED: Please start your shift in the Dashboard to process receipts.");
          return;
      }

      if (order.status === 'cancelled') {
          printReceipt(systemConfig, order, 'VOID', { reason: voidDetails?.reason, authorizedBy: voidDetails?.authorizedBy });
      } else {
          const orderWithContext = {
              ...order,
              completedBy: order.completedBy || currentUser?.name || 'Cashier'
          };
          printReceipt(systemConfig, orderWithContext, 'RECEIPT');
      }
  };

  const handlePreviewReceipt = (order: Order, type: 'RECEIPT' | 'VOID' = 'RECEIPT') => {
      const orderWithContext = {
          ...order,
          completedBy: order.completedBy || currentUser?.name || 'Cashier'
      };
      
      const extraData = type === 'VOID' ? { reason: voidDetails?.reason, authorizedBy: voidDetails?.authorizedBy } : undefined;
      const html = generateReceiptHtml(systemConfig, orderWithContext, type, extraData);
      setPreviewHtml(html);
  };

  // --- VOID LOGIC ---
  const initiateVoidOrder = (order: Order) => {
      setOrderToVoid(order);
      setVoidReason('');
      setIsVoidModalOpen(true);
  };

  const confirmVoidOrder = () => {
      if (orderToVoid && voidReason.trim()) {
          onDeleteOrder(orderToVoid.id, voidReason);
          setIsVoidModalOpen(false);
          setOrderToVoid(null);
          setVoidReason('');
          setSelectedOrder(null);
      }
  };

  const toggleMergeSelect = (id: string) => {
      if (mergeSelection.includes(id)) {
          setMergeSelection(prev => prev.filter(mid => mid !== id));
      } else {
          if (mergeSelection.length < 2) {
              setMergeSelection(prev => [...prev, id]);
          } else {
              setMergeSelection(prev => [prev[0], id]);
          }
      }
  };

  const executeMerge = () => {
      if (mergeSelection.length !== 2) return;
      if (confirm(`Merge Order ${formatInvoiceId(mergeSelection[1])} into ${formatInvoiceId(mergeSelection[0])}?`)) {
          onMergeOrders(mergeSelection[0], mergeSelection[1]);
          setMergeSelection([]);
          setActiveTab('ACTIVE');
      }
  };

  const handleRowClick = (item: Order | ReturnRecord) => {
      if (activeTab === 'VOID') {
          setSelectedReturn(item as ReturnRecord);
      } else if (activeTab === 'MERGE') {
          toggleMergeSelect((item as Order).id);
      } else {
          setSelectedOrder(item as Order);
      }
  };

  // --- Payment Processing Logic ---
  const initiatePayment = () => {
      // Check Register
      if (isCashierOrManager && !registerState.isOpen) {
          alert("REGISTER CLOSED: Please start your shift in the Dashboard to accept payments.");
          return;
      }

      setPaymentMethod('CASH');
      setSalaryStaffName('');
      setShouldPrintReceipt(true); // Default to true
      setIsPaymentModalOpen(true);
  };

  const confirmPayment = () => {
      if (!selectedOrder) return;
      
      if (paymentMethod === 'SALARY_PAY' && !salaryStaffName.trim()) {
          alert("Please enter the name of the staff member responsible for this Salary Pay.");
          return;
      }

      const updatedOrder: Order = {
          ...selectedOrder,
          status: 'paid',
          amountPaid: selectedOrder.grandTotal,
          paymentMethod: paymentMethod,
          customerName: paymentMethod === 'SALARY_PAY' ? `${salaryStaffName} (Staff)` : selectedOrder.customerName,
          completedBy: currentUser?.name || 'Cashier'
      };

      // 1. Update system state
      onUpdateOrder(updatedOrder);
      
      // 2. Print immediately if enabled
      if (shouldPrintReceipt) {
          printReceipt(systemConfig, updatedOrder, 'RECEIPT');
      }
      
      setIsPaymentModalOpen(false);
      setSelectedOrder(null);
  };

  // --- SPLIT ORDER LOGIC ---
  const initiateSplitOrder = () => {
      if (!selectedOrder) return;
      setSplitItems([]);
      setIsSplitModalOpen(true);
  };

  const toggleItemSplit = (index: number) => {
      const exists = splitItems.find(i => i.itemIndex === index);
      if (exists) {
          setSplitItems(prev => prev.filter(i => i.itemIndex !== index));
      } else {
          if (!selectedOrder) return;
          const item = selectedOrder.items[index];
          setSplitItems(prev => [...prev, { itemIndex: index, quantity: item.quantity }]);
      }
  };

  const confirmSplitOrder = () => {
      if (!selectedOrder || splitItems.length === 0) return;

      const originalItems = [...selectedOrder.items];
      const itemsToMove: OrderItem[] = [];
      const itemsToKeep: OrderItem[] = [];

      originalItems.forEach((item, index) => {
          const splitInfo = splitItems.find(s => s.itemIndex === index);
          if (splitInfo) {
              itemsToMove.push(item);
          } else {
              itemsToKeep.push(item);
          }
      });

      if (itemsToKeep.length === 0) {
          alert("Cannot move all items. Use Merge or Void instead.");
          return;
      }

      const keepTotal = itemsToKeep.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
      const moveTotal = itemsToMove.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);

      const updatedOriginal: Order = {
          ...selectedOrder,
          items: itemsToKeep,
          grandTotal: keepTotal
      };

      const newOrder: Order = {
          ...selectedOrder,
          id: `ORD-SPLIT-${Date.now()}`,
          items: itemsToMove,
          grandTotal: moveTotal,
          status: 'pending',
          amountPaid: 0,
          customerName: `${selectedOrder.customerName} (Part 2)`,
          timestamp: new Date()
      };

      onUpdateOrder(updatedOriginal);
      onPlaceOrder(newOrder);
      
      setIsSplitModalOpen(false);
      setSplitItems([]);
      setSelectedOrder(updatedOriginal); 
      alert("Order Split Successfully!");
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden font-sans">
        
        {/* --- LEFT SIDE: ORDER LIST --- */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
            {/* ... (Header and Filters unchanged) ... */}
            <div className="p-6 pb-4 shrink-0 bg-white border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                            {activeTab === 'VOID' ? <FileX className="w-6 h-6 text-red-600" /> : <Receipt className="w-6 h-6 text-blue-600" />}
                            {activeTab === 'VOID' ? 'Void Log & Returns' : 'Order Log'}
                        </h1>
                        <p className="text-gray-500 font-medium text-xs">
                            {activeTab === 'VOID' ? 'Detailed audit trail of cancelled orders and items.' : 'Manage active and past transactions.'}
                        </p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                        <button onClick={() => setActiveTab('ACTIVE')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'ACTIVE' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Active</button>
                        <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'HISTORY' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>History</button>
                        <button onClick={() => setActiveTab('VOID')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 ${activeTab === 'VOID' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}><FileX className="w-3 h-3" /> Void Log</button>
                        <button onClick={() => setActiveTab('MERGE')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'MERGE' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Merge</button>
                    </div>
                </div>

                {/* FILTERS */}
                {activeTab !== 'VOID' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Date Range
                            </label>
                            <div className="relative">
                                <select 
                                    value={dateFilter} 
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                >
                                    <option value="TODAY">Today</option>
                                    <option value="YESTERDAY">Yesterday</option>
                                    <option value="LAST_7_DAYS">Last 7 Days</option>
                                    <option value="ALL">All Time</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="md:col-span-2 flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Search Orders</label>
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search by ID, Name or Table..." 
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Merge Action Banner */}
                {activeTab === 'MERGE' && (
                    <div className="mt-4 flex items-center justify-between bg-orange-50 p-3 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-orange-800 uppercase tracking-tight">Merge Mode Active</p>
                                <p className="text-xs text-orange-600 font-bold">{mergeSelection.length} of 2 Orders Selected</p>
                            </div>
                        </div>
                        <button 
                            disabled={mergeSelection.length !== 2}
                            onClick={executeMerge}
                            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-black text-xs uppercase shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Merge Selected
                        </button>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 bg-gray-50/50">
                {/* ... (Table code unchanged) ... */}
                <div className="flex-1 bg-white rounded-t-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {activeTab === 'MERGE' && <th className="px-4 py-3 w-10 bg-gray-100">Select</th>}
                                {activeTab === 'VOID' ? (
                                    <>
                                        <th className="px-4 py-3 bg-gray-100">Time</th>
                                        <th className="px-4 py-3 bg-gray-100">Type</th>
                                        <th className="px-4 py-3 bg-gray-100">Order Ref</th>
                                        <th className="px-4 py-3 bg-gray-100">Entered By</th>
                                        <th className="px-4 py-3 bg-gray-100">Voided By</th>
                                        <th className="px-4 py-3 bg-gray-100">Reason</th>
                                        <th className="px-4 py-3 text-right bg-gray-100">Value</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-4 py-3 whitespace-nowrap bg-gray-100 flex items-center gap-1 cursor-pointer">Date <ArrowUpDown className="w-3 h-3"/></th>
                                        <th className="px-4 py-3 whitespace-nowrap bg-gray-100">Invoice No.</th>
                                        <th className="px-4 py-3 whitespace-nowrap bg-gray-100">Customer Name</th>
                                        <th className="px-4 py-3 whitespace-nowrap bg-gray-100">Contact Number</th>
                                        <th className="px-4 py-3 whitespace-nowrap bg-gray-100">Location</th>
                                        <th className="px-4 py-3 text-center whitespace-nowrap bg-gray-100">Payment Status</th>
                                        <th className="px-4 py-3 whitespace-nowrap bg-gray-100">Payment Method</th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap bg-gray-100">Total Amount</th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap bg-gray-100">Total Paid</th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap bg-gray-100">Sell Due</th>
                                        <th className="px-4 py-3 whitespace-nowrap bg-gray-100">Added By</th>
                                        <th className="px-4 py-3 whitespace-nowrap bg-gray-100">Completed By</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs font-medium text-slate-700">
                            {/* VOID TAB RENDER LOGIC */}
                            {activeTab === 'VOID' ? (
                                filteredReturns.length === 0 ? (
                                    <tr><td colSpan={7} className="p-12 text-center text-gray-400 font-bold uppercase">No void records found</td></tr>
                                ) : (
                                    filteredReturns.map(ret => (
                                        <tr 
                                            key={ret.id} 
                                            onClick={() => handleRowClick(ret)}
                                            className={`cursor-pointer transition-colors hover:bg-red-50/50 ${selectedReturn?.id === ret.id ? 'bg-red-50 border-l-4 border-red-500' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-gray-500 font-mono">
                                                {new Date(ret.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide ${ret.type === 'FULL_ORDER' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {ret.type === 'FULL_ORDER' ? 'Full Cancel' : 'Item Void'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-700">#{formatInvoiceId(ret.originalOrderId)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    <span className="font-bold text-gray-700">{ret.originalCreator || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <ShieldAlert className="w-3 h-3 text-red-400" />
                                                    <span className="font-bold text-red-600">{ret.authorizedBy}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 italic truncate max-w-[150px]">{ret.reason}</td>
                                            <td className="px-4 py-3 text-right font-black text-red-600">
                                                -{systemConfig.currency} {ret.totalRefunded.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : (
                                /* STANDARD ORDER RENDER LOGIC */
                                filteredOrders.length === 0 ? (
                                    <tr><td colSpan={12} className="p-12 text-center text-gray-400 font-bold uppercase">No orders match current filters</td></tr>
                                ) : (
                                    filteredOrders.map((order, idx) => {
                                        const isSelected = selectedOrder?.id === order.id;
                                        const isMergeSelected = mergeSelection.includes(order.id);
                                        const isPaid = (order.amountPaid || 0) >= order.grandTotal && order.grandTotal > 0;
                                        const sellDue = Math.max(0, order.grandTotal - (order.amountPaid || 0));
                                        
                                        return (
                                            <tr 
                                                key={order.id} 
                                                onClick={() => handleRowClick(order)}
                                                className={`cursor-pointer transition-colors border-b border-gray-100 hover:bg-blue-50/30 ${
                                                    isSelected || isMergeSelected ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                                }`}
                                            >
                                                {/* ... Columns ... */}
                                                {activeTab === 'MERGE' && (
                                                    <td className="px-4 py-3">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isMergeSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                                                            {isMergeSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-700">{new Date(order.timestamp).toLocaleDateString()}</span>
                                                        <span className="text-[10px] text-gray-400">{new Date(order.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-600">{formatInvoiceId(order.id)}</td>
                                                <td className="px-4 py-3 font-medium text-gray-800">{order.customerName}</td>
                                                <td className="px-4 py-3 text-gray-500">0</td>
                                                <td className="px-4 py-3 text-gray-600 text-xs">{systemConfig.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase text-white ${isPaid ? 'bg-green-500' : 'bg-orange-400'}`}>
                                                        {isPaid ? 'PAID' : 'DUE'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs uppercase">{order.paymentMethod ? order.paymentMethod.replace('_', ' ') : '-'}</td>
                                                <td className="px-4 py-3 text-right font-medium">{systemConfig.currency} {order.grandTotal.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-gray-600">{systemConfig.currency} {(order.amountPaid || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-800">{systemConfig.currency} {sellDue.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-xs text-gray-600">{order.staffName || 'System'}</td>
                                                <td className="px-4 py-3 text-xs text-gray-600">{order.completedBy || '-'}</td>
                                            </tr>
                                        );
                                    })
                                )
                            )}
                        </tbody>
                    </table>
                    </div>
                    {/* FOOTER TOTALS */}
                    {activeTab !== 'VOID' && (
                        <div className="bg-gray-200 border-t border-gray-300 p-4 shrink-0 flex flex-wrap gap-4 items-center justify-between text-xs text-gray-700 font-bold">
                            {/* ... Totals ... */}
                            <div className="flex gap-4">
                                <span>Total:</span>
                            </div>
                            <div className="flex gap-4 bg-gray-300/50 px-3 py-1 rounded">
                                <span className="text-orange-600">Due - {totals.countDue}</span>
                                <span className="text-green-700">Paid - {totals.countPaid}</span>
                            </div>
                            <div className="flex gap-4 bg-gray-300/50 px-3 py-1 rounded">
                                {Object.entries(totals.methods).map(([method, count]) => (
                                    <span key={method}>{method} - {count}</span>
                                ))}
                            </div>
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <span className="block text-[10px] uppercase text-gray-500">Total Amount</span>
                                    <span className="text-sm">{systemConfig.currency} {totals.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[10px] uppercase text-gray-500">Total Paid</span>
                                    <span className="text-sm text-green-700">{systemConfig.currency} {totals.totalPaid.toLocaleString()}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[10px] uppercase text-gray-500">Sell Due</span>
                                    <span className="text-sm text-orange-600">{systemConfig.currency} {totals.totalDue.toLocaleString()}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[10px] uppercase text-gray-500">Sell Return Due</span>
                                    <span className="text-sm">0</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- RIGHT SIDE: ORDER INSPECTOR --- */}
        {selectedOrder ? (
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl animate-in slide-in-from-right-4 duration-300 z-20">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Order Details</h2>
                        <p className="text-xs text-gray-500 font-bold mt-1">#{selectedOrder.id}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* Meta Info */}
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Utensils className="w-4 h-4"/></div>
                                <div>
                                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Table</p>
                                    <p className="font-black text-blue-900 text-lg">{selectedOrder.table}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Waiter / Server</p>
                                <p className="font-bold text-blue-800 text-sm flex items-center justify-end gap-1">
                                    <User className="w-3 h-3" /> {selectedOrder.staffName || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Item Breakdown</h3>
                        {selectedOrder.status !== 'paid' && selectedOrder.status !== 'cancelled' && (
                            <button 
                                onClick={initiateSplitOrder}
                                className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"
                            >
                                <Split className="w-3 h-3" /> Split Order
                            </button>
                        )}
                    </div>
                    
                    <div className="space-y-3">
                        {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className={`flex justify-between items-start`}>
                                <div className="flex gap-3">
                                    <span className="font-black text-gray-900 text-sm w-6">{item.quantity}x</span>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 leading-tight">{item.product.name}</p>
                                        {item.note && <p className="text-[10px] text-orange-500 italic mt-0.5 no-line-through">* {item.note}</p>}
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900 text-sm">
                                    {(item.product.price * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-200 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Subtotal</span>
                            <span className="font-bold text-gray-800">{selectedOrder.grandTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl pt-2 border-t border-gray-100">
                            <span className="font-black text-gray-900 uppercase">Total</span>
                            <span className="font-black text-blue-600">{systemConfig.currency} {selectedOrder.grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Payment Info */}
                    {(selectedOrder.amountPaid || 0) > 0 && selectedOrder.status !== 'cancelled' && (
                        <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" /> Paid Amount
                                </span>
                                <span className="font-black text-green-700">{systemConfig.currency} {selectedOrder.amountPaid?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-green-500 uppercase">Method</span>
                                <span className="text-xs font-bold text-green-700 uppercase">{selectedOrder.paymentMethod ? selectedOrder.paymentMethod.replace('_', ' ') : 'Cash'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-green-500 uppercase">Cashier</span>
                                <span className="text-xs font-bold text-green-700 uppercase">{selectedOrder.completedBy || '-'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-3 shrink-0">
                    
                    {/* Pay Button */}
                    {activeTab === 'ACTIVE' && selectedOrder.status !== 'paid' && selectedOrder.status !== 'cancelled' && (
                        <button 
                            onClick={initiatePayment}
                            className="w-full py-3 bg-green-600 text-white rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-lg active:scale-95"
                        >
                            <CreditCard className="w-5 h-5" /> Process Payment
                        </button>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                        <button 
                            onClick={() => handlePreviewReceipt(selectedOrder, 'RECEIPT')}
                            className="py-3 bg-blue-100 text-blue-700 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors col-span-1"
                            title="Preview Receipt"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handlePrint(selectedOrder)}
                            className="py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-black transition-colors col-span-2"
                        >
                            <Printer className="w-4 h-4" /> {selectedOrder.status === 'paid' ? 'Re-Print' : 'Print Bill'}
                        </button>
                    </div>
                    {canVoid && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'paid' && (
                        <button 
                            onClick={() => initiateVoidOrder(selectedOrder)}
                            className="w-full py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Void Order
                        </button>
                    )}
                </div>
            </div>
        ) : selectedReturn ? (
            /* --- RIGHT SIDE: VOID INSPECTOR --- */
            <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-xl animate-in slide-in-from-right-4 duration-300 z-20">
               {/* ... (Existing Void Inspector UI) ... */}
               <div className="p-6 border-b border-red-100 bg-red-50 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-red-900 uppercase tracking-tight flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" /> Void Details
                        </h2>
                        <p className="text-xs text-red-700 font-bold mt-1">Transaction #{selectedReturn.id}</p>
                    </div>
                    <button onClick={() => setSelectedReturn(null)} className="p-2 hover:bg-red-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-red-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* ... (Existing Void Details) ... */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entered By</p>
                            <div className="flex items-center gap-2 text-gray-700">
                                <User className="w-4 h-4" />
                                <span className="font-bold text-sm">{selectedReturn.originalCreator || 'Unknown'}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Voided By</p>
                            <div className="flex items-center gap-2 text-red-700">
                                <ShieldAlert className="w-4 h-4" />
                                <span className="font-bold text-sm">{selectedReturn.authorizedBy}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-bold text-gray-500">{new Date(selectedReturn.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Reason</p>
                            <p className="text-sm font-medium text-red-800 italic">"{selectedReturn.reason}"</p>
                        </div>
                    </div>

                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">Deleted Items</h3>
                    <div className="space-y-3">
                        {selectedReturn.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center opacity-75 grayscale hover:grayscale-0 transition-all">
                                <div className="flex gap-3">
                                    <span className="font-black text-gray-900 text-sm w-6">{item.quantity}x</span>
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 leading-tight">{item.product.name}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900 text-sm line-through decoration-red-500 decoration-2">
                                    {(item.product.price * item.quantity).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-4 border-t-2 border-dashed border-red-200 flex justify-between items-center">
                        <span className="text-red-500 font-bold uppercase text-xs">Total Void Value</span>
                        <span className="text-xl font-black text-red-600">
                            -{systemConfig.currency} {selectedReturn.totalRefunded.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        ) : (
            /* Placeholder for right side */
            <div className="hidden lg:flex w-96 flex-col items-center justify-center bg-gray-50 border-l border-gray-200 text-gray-400 p-8 text-center shrink-0">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Receipt className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-300">No Selection</h3>
                <p className="text-xs font-medium max-w-[200px] mt-2 opacity-60">Select an order or void record from the list to view full details.</p>
            </div>
        )}

        {/* ... Modals ... */}
        {/* Same as provided but just returning the structure */}
        {isSplitModalOpen && selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
                    <div className="p-6 bg-orange-600 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2"><Split className="w-5 h-5"/> Split Order #{selectedOrder.id.slice(-4)}</h2>
                            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mt-1">Select items to move to a new separate bill</p>
                        </div>
                        <button onClick={() => setIsSplitModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-8">
                        {/* Original Order Items */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Original Order</h3>
                            {selectedOrder.items.map((item, idx) => {
                                const isMoving = splitItems.some(s => s.itemIndex === idx);
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => toggleItemSplit(idx)}
                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${isMoving ? 'border-transparent opacity-40 bg-gray-50' : 'border-blue-100 bg-blue-50 hover:border-blue-300'}`}
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{item.product.name}</p>
                                            <p className="text-xs text-gray-500">{item.quantity} x {item.product.price.toLocaleString()}</p>
                                        </div>
                                        {!isMoving && <ArrowRight className="w-4 h-4 text-blue-500" />}
                                    </div>
                                );
                            })}
                        </div>

                        {/* New Split Order Preview */}
                        <div className="space-y-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                            <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest border-b border-orange-200 pb-2">New Order (Split)</h3>
                            {splitItems.length === 0 ? (
                                <p className="text-gray-400 text-xs italic text-center py-4">Click items on the left to move them here.</p>
                            ) : (
                                splitItems.map((split, idx) => {
                                    const item = selectedOrder.items[split.itemIndex];
                                    return (
                                        <div key={idx} onClick={() => toggleItemSplit(split.itemIndex)} className="p-3 bg-white rounded-xl border border-orange-200 shadow-sm cursor-pointer hover:bg-red-50 flex justify-between items-center group">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{item.product.name}</p>
                                                <p className="text-xs text-gray-500">{item.quantity} x {item.product.price.toLocaleString()}</p>
                                            </div>
                                            <X className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    );
                                })
                            )}
                            
                            <div className="pt-4 mt-4 border-t border-orange-200">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold text-gray-500 uppercase">New Total</span>
                                    <span className="text-lg font-black text-gray-900">
                                        {systemConfig.currency} {
                                            splitItems.reduce((acc, split) => {
                                                const item = selectedOrder.items[split.itemIndex];
                                                return acc + (item.quantity * item.product.price);
                                            }, 0).toLocaleString()
                                        }
                                    </span>
                                </div>
                                <button 
                                    onClick={confirmSplitOrder}
                                    disabled={splitItems.length === 0}
                                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs uppercase shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Confirm Split
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ... Payment Modal ... */}
        {isPaymentModalOpen && selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    
                    <div className="p-8 bg-green-600 text-white border-b border-green-700">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-2xl font-black uppercase tracking-tight">Complete Order</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="bg-white/20 p-2 rounded-full hover:bg-white/30"><X className="w-5 h-5"/></button>
                        </div>
                        <p className="text-green-100 text-xs font-bold uppercase tracking-widest">Total Due: {systemConfig.currency} {selectedOrder.grandTotal.toLocaleString()}</p>
                    </div>

                    <div className="p-8 space-y-6">
                        
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Select Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setPaymentMethod('CASH')}
                                    className={`py-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${paymentMethod === 'CASH' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Banknote className="w-6 h-6" /> <span className="font-bold text-xs uppercase">Cash</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('MOBILE_MONEY')}
                                    className={`py-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${paymentMethod === 'MOBILE_MONEY' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Smartphone className="w-6 h-6" /> <span className="font-bold text-xs uppercase">Mobile Money</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('CARD')}
                                    className={`py-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <CreditCard className="w-6 h-6" /> <span className="font-bold text-xs uppercase">Card</span>
                                </button>
                                <button 
                                    onClick={() => setPaymentMethod('SALARY_PAY')}
                                    className={`py-4 rounded-xl flex flex-col items-center gap-2 transition-all border-2 ${paymentMethod === 'SALARY_PAY' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <Briefcase className="w-6 h-6" /> <span className="font-bold text-xs uppercase">Salary Pay</span>
                                </button>
                            </div>
                        </div>

                        {/* SALARY PAY INPUT */}
                        {paymentMethod === 'SALARY_PAY' && (
                            <div className="animate-in slide-in-from-top-2 fade-in">
                                <label className="text-xs font-black text-purple-600 uppercase tracking-widest block mb-2">Staff Member Name</label>
                                <input 
                                    autoFocus
                                    value={salaryStaffName}
                                    onChange={(e) => setSalaryStaffName(e.target.value)}
                                    placeholder="Enter name of staff responsible..."
                                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none font-bold text-gray-800"
                                />
                                <p className="text-[10px] text-gray-400 mt-2">This amount will be recorded as a debt against the staff member.</p>
                            </div>
                        )}

                        {/* RECEIPT PRINT TOGGLE */}
                        <div className="pt-4 border-t border-gray-100">
                             <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-3">Receipt Output</label>
                             <div className="flex gap-2">
                                <div 
                                    onClick={() => setShouldPrintReceipt(!shouldPrintReceipt)}
                                    className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all group ${shouldPrintReceipt ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                                >
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors relative ${shouldPrintReceipt ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${shouldPrintReceipt ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    <div>
                                        <p className={`font-bold text-sm ${shouldPrintReceipt ? 'text-blue-700' : 'text-gray-500'}`}>
                                            {shouldPrintReceipt ? 'Print Receipt' : 'Skip Printing'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handlePreviewReceipt(selectedOrder)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-transparent hover:border-gray-300 transition-all"
                                    title="Preview Receipt"
                                >
                                    <Eye className="w-5 h-5" />
                                    <span className="text-[9px] font-bold uppercase">Preview</span>
                                </button>
                             </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                onClick={confirmPayment}
                                className={`w-full py-4 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all text-white ${shouldPrintReceipt ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-900'}`}
                            >
                                {shouldPrintReceipt ? <Printer className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                {shouldPrintReceipt ? 'Confirm & Print' : 'Confirm (No Receipt)'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        )}

        {/* ... Void Modal ... */}
        {isVoidModalOpen && orderToVoid && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200">
                    <div className="p-8 bg-red-600 text-white text-center relative overflow-hidden">
                        <div className="relative z-10">
                            <AlertTriangle className="w-16 h-16 mx-auto mb-2 text-red-200" />
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Void Order</h2>
                            <p className="text-red-100 text-xs font-bold uppercase tracking-widest mt-1">Order #{orderToVoid.id.slice(-6)} • {orderToVoid.table}</p>
                        </div>
                        <div className="absolute inset-0 bg-red-700/30 skew-y-12 transform scale-150"></div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <p className="text-xs text-red-800 font-medium text-center">
                                Warning: This action cannot be undone. The order will be permanently removed from active sales and archived in the Void Log.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Reason for Deletion <span className="text-red-500">*</span></label>
                            <textarea 
                                autoFocus
                                value={voidReason}
                                onChange={e => setVoidReason(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none font-bold text-gray-800 min-h-[100px] resize-none"
                                placeholder="E.g. Customer changed mind, Kitchen error, Wrong entry..."
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => { setIsVoidModalOpen(false); setOrderToVoid(null); }} 
                                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm uppercase transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmVoidOrder}
                                disabled={!voidReason.trim()}
                                className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" /> Confirm Void
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- RECEIPT PREVIEW MODAL --- */}
        {previewHtml && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-4 bg-gray-900 text-white flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-sm uppercase tracking-widest">Receipt Preview</h3>
                        <button onClick={() => setPreviewHtml(null)} className="hover:text-gray-300"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 bg-gray-200 p-4 overflow-y-auto flex justify-center">
                        <div className="bg-white shadow-lg w-full h-full min-h-[400px]">
                            <iframe 
                                srcDoc={previewHtml} 
                                title="Receipt Preview"
                                className="w-full h-full border-none"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
                        <button 
                            onClick={() => setPreviewHtml(null)} 
                            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase hover:bg-gray-200"
                        >
                            Close
                        </button>
                        <button 
                            onClick={() => {
                                const iframe = document.createElement('iframe');
                                iframe.style.position = 'fixed';
                                iframe.style.visibility = 'hidden';
                                document.body.appendChild(iframe);
                                iframe.contentWindow?.document.open();
                                iframe.contentWindow?.document.write(previewHtml);
                                iframe.contentWindow?.document.close();
                                iframe.onload = () => {
                                    iframe.contentWindow?.focus();
                                    iframe.contentWindow?.print();
                                    setTimeout(() => document.body.removeChild(iframe), 2000);
                                };
                            }} 
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> Print Now
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default OrdersView;
