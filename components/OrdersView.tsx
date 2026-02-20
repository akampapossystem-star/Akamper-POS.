import React, { useState, useMemo } from 'react';
import { 
  Search, Printer, FileText, X, User, 
  Trash2, Banknote, Table as TableIcon, 
  CreditCard, ShieldX, Smartphone, CheckCircle2, DollarSign, Clock, AlertCircle, 
  Plus, Minus, Check, Ghost, Layers, Briefcase, Wallet, Scissors, ArrowRight, Wallet2,
  Calendar, ChevronRight, Eye, Split, LayoutList, History as HistoryIcon, MoreVertical, Layers2,
  ChevronLeft, ArrowRightCircle, Save, Info, ArrowUpDown
} from 'lucide-react';
import { Order, SystemConfig, RegisterState, OrderItem, UserRole, Product } from '../types';
import { printReceipt } from '../services/receiptService';
import ReceiptPreviewModal from './ReceiptPreviewModal';

interface OrdersViewProps {
  orders: Order[];
  systemConfig: SystemConfig;
  onUpdateOrder: (order: Order) => void;
  onPlaceOrder: (order: Order) => void;
  onMergeOrders: (targetId: string, sourceIds: string[]) => void;
  userRole: UserRole;
  currentUser: any;
  onDeleteOrder: (id: string, reason: string) => void;
  returns: any[];
  registerState: RegisterState;
  onItemReturn?: (orderId: string, timestamp: Date, items: OrderItem[], refund: number, reason: string) => void;
}

const OrdersView: React.FC<OrdersViewProps> = ({ 
  orders, systemConfig, onUpdateOrder, onPlaceOrder, onDeleteOrder, onMergeOrders, onItemReturn, userRole, currentUser, registerState
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY' | 'VOID' | 'MERGE'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);

  // Split Order State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitSourceItems, setSplitSourceItems] = useState<OrderItem[]>([]);
  const [splitBuckets, setSplitBuckets] = useState<OrderItem[][]>([[]]);
  const [activeBucketIdx, setActiveBucketIdx] = useState(0);

  // UI State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('CASH');
  const [salaryStaffName, setSalaryStaffName] = useState(''); 
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [processedOrderForReceipt, setProcessedOrderForReceipt] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return (orders || []).filter(o => {
      const isCorrectTab = 
        activeTab === 'VOID' ? o.status === 'cancelled' : 
        activeTab === 'HISTORY' ? o.status === 'paid' : 
        activeTab === 'MERGE' ? (o.status !== 'paid' && o.status !== 'cancelled' && o.status !== 'merged') :
        (o.status !== 'paid' && o.status !== 'cancelled' && o.status !== 'merged');
      
      const matchesSearch = 
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.table.toLowerCase().includes(searchTerm.toLowerCase()) || 
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      return isCorrectTab && matchesSearch;
    }).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders, activeTab, searchTerm]);

  const selectedOrder = useMemo(() => 
    orders.find(o => o.id === selectedOrderId) || (!selectedOrderId && window.innerWidth >= 1024 ? filteredOrders[0] : null) || null
  , [selectedOrderId, filteredOrders, orders]);

  const summary = useMemo(() => {
      const s = { 
        dueCount: 0, 
        paidCount: 0, 
        unspecified: 0, 
        totalAmount: 0, 
        totalPaid: 0, 
        sellDue: 0, 
        sellReturn: 0 
      };
      
      orders.forEach(o => {
          const isCancelled = o.status === 'cancelled';
          const isPaid = o.status === 'paid';
          const isMerged = (o.status as any) === 'merged';

          if (isPaid) {
              s.paidCount++;
              s.totalPaid += (o.amountPaid || 0);
          } else if (isCancelled) {
              s.sellReturn += o.grandTotal;
          } else if (!isMerged) {
              s.dueCount++;
              s.sellDue += o.grandTotal;
              if (!o.paymentMethod) s.unspecified++;
          }

          if (!isMerged) {
              s.totalAmount += o.grandTotal;
          }
      });
      return s;
  }, [orders]);

  // --- HANDLERS ---
  const handleStartSplit = () => {
    if (!selectedOrder) return;
    setSplitSourceItems(JSON.parse(JSON.stringify(selectedOrder.items))); 
    setSplitBuckets([[]]);
    setActiveBucketIdx(0);
    setIsSplitModalOpen(true);
  };

  const moveItemToBucket = (sourceIdx: number) => {
    const item = splitSourceItems[sourceIdx];
    if (item.quantity <= 0) return;
    const newSource = [...splitSourceItems];
    newSource[sourceIdx].quantity -= 1;
    setSplitSourceItems(newSource);
    const newBuckets = [...splitBuckets];
    const targetBucket = newBuckets[activeBucketIdx];
    const existingInBucket = targetBucket.find(i => i.product.id === item.product.id && i.note === item.note);
    if (existingInBucket) existingInBucket.quantity += 1;
    else targetBucket.push({ ...item, quantity: 1 });
    setSplitBuckets(newBuckets);
  };

  const moveItemFromBucket = (bucketIdx: number, itemIdx: number) => {
    const bucket = splitBuckets[bucketIdx];
    const item = bucket[itemIdx];
    const newBuckets = [...splitBuckets];
    newBuckets[bucketIdx][itemIdx].quantity -= 1;
    if (newBuckets[bucketIdx][itemIdx].quantity <= 0) newBuckets[bucketIdx].splice(itemIdx, 1);
    setSplitBuckets(newBuckets);
    const newSource = [...splitSourceItems];
    const existingInSource = newSource.find(i => i.product.id === item.product.id && i.note === item.note);
    if (existingInSource) existingInSource.quantity += 1;
    else newSource.push({ ...item, quantity: 1 });
    setSplitSourceItems(newSource);
  };

  const confirmSplit = () => {
    if (!selectedOrder) return;
    const validBuckets = splitBuckets.filter(b => b.length > 0);
    if (validBuckets.length === 0) return;
    const remainingItems = splitSourceItems.filter(i => i.quantity > 0);
    validBuckets.forEach((items, idx) => {
        const bucketTotal = items.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
        const newOrder: Order = {
            ...selectedOrder,
            id: `SPLIT-${Date.now()}-${idx}`,
            customerName: `${selectedOrder.customerName} (Split ${idx + 1})`,
            items: items,
            grandTotal: bucketTotal,
            amountPaid: 0,
            timestamp: new Date()
        };
        onPlaceOrder(newOrder);
    });
    if (remainingItems.length > 0) {
        const remainingTotal = remainingItems.reduce((sum, i) => sum + (i.product.price * i.quantity), 0);
        onUpdateOrder({ ...selectedOrder, items: remainingItems, grandTotal: remainingTotal });
    } else {
        onUpdateOrder({ ...selectedOrder, status: 'merged' as any });
    }
    setIsSplitModalOpen(false);
    setSelectedOrderId(null);
  };

  const handleOpenPayment = () => {
    if (!selectedOrder) return;
    if (!registerState.isOpen) {
      alert("SHIFT ERROR: Register is closed. Please open shift in Dashboard.");
      return;
    }
    setPaymentMethod('CASH');
    setSalaryStaffName('');
    setIsPaymentModalOpen(true);
  };

  const handleCompletePayment = () => {
    if (!selectedOrder) return;
    if (paymentMethod === 'SALARY_PAY' && !salaryStaffName.trim()) return;
    const updatedOrder: Order = {
      ...selectedOrder,
      status: 'paid',
      amountPaid: selectedOrder.grandTotal,
      paymentMethod: paymentMethod,
      customerName: paymentMethod === 'SALARY_PAY' ? salaryStaffName.trim() : selectedOrder.customerName,
      completedBy: currentUser?.name || 'Cashier'
    };
    setProcessedOrderForReceipt(updatedOrder);
    onUpdateOrder(updatedOrder);
    setIsPaymentModalOpen(false);
    setPreviewOpen(true);
  };

  const toggleMergeSelection = (id: string) => {
      setSelectedForMerge(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePerformMerge = () => {
      if (selectedForMerge.length < 2) return;
      const targetId = selectedForMerge[0];
      const sourceIds = selectedForMerge.slice(1);
      if (confirm(`Merge ${selectedForMerge.length} bills?`)) {
          onMergeOrders(targetId, sourceIds);
          setSelectedForMerge([]);
          setActiveTab('ACTIVE');
          setSelectedOrderId(targetId);
      }
  };

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden font-sans relative">
      
      {/* LEFT: MAIN REGISTRY PANEL */}
      <div className={`flex-1 flex flex-col min-w-0 h-full transition-all duration-300 ${selectedOrderId && window.innerWidth < 1024 ? 'hidden' : 'flex'}`}>
        
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Header Section */}
            <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col gap-4 bg-white shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <Banknote className="w-5 h-5 text-blue-600" />
                            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Order Log</h1>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage active and past transactions.</p>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-inner">
                        {(['ACTIVE', 'HISTORY', 'VOID LOG', 'MERGE'] as const).map(tab => {
                            const id = tab === 'VOID LOG' ? 'VOID' : tab;
                            return (
                                <button 
                                    key={tab} 
                                    onClick={() => { setActiveTab(id as any); setSelectedOrderId(null); setSelectedForMerge([]); }}
                                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === id ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {tab}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-64">
                         <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" /> Date Range
                         </label>
                         <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none appearance-none">
                             <option>Today</option>
                             <option>Yesterday</option>
                             <option>This Week</option>
                         </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Search Orders</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search by ID, Name or Table..." 
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead className="bg-[#f8fafc] border-b border-gray-100 sticky top-0 z-20">
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {activeTab === 'MERGE' && <th className="px-6 py-4 w-10">Sel</th>}
                            <th className="px-6 py-4">
                                <div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="px-6 py-4">Invoice No.</th>
                            <th className="px-6 py-4">Customer Name</th>
                            <th className="px-6 py-4">Contact Number</th>
                            <th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4 text-center">Payment Status</th>
                            <th className="px-6 py-4">Payment Method</th>
                            <th className="px-6 py-4 text-right">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px] font-bold text-slate-700 divide-y divide-gray-50">
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan={10} className="p-20 text-center text-slate-300 uppercase font-black text-xs opacity-50"><Ghost className="w-12 h-12 mx-auto mb-4" />No records found in registry</td></tr>
                        ) : (
                            filteredOrders.map(o => {
                                const isPaid = o.status === 'paid';
                                const isCancelled = o.status === 'cancelled';
                                return (
                                    <tr 
                                        key={o.id} 
                                        onClick={() => activeTab === 'MERGE' ? toggleMergeSelection(o.id) : setSelectedOrderId(o.id)}
                                        className={`hover:bg-blue-50/30 cursor-pointer transition-colors ${selectedOrderId === o.id || selectedForMerge.includes(o.id) ? 'bg-blue-50/60' : ''}`}
                                    >
                                        {activeTab === 'MERGE' && (
                                            <td className="px-6 py-5">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedForMerge.includes(o.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 bg-white'}`}>
                                                    {selectedForMerge.includes(o.id) && <Check className="w-3 h-3" strokeWidth={4} />}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-5">
                                            <div className="font-black text-slate-900">{new Date(o.timestamp).toLocaleDateString()}</div>
                                            <div className="text-[9px] text-slate-400 font-bold">{new Date(o.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: true})}</div>
                                        </td>
                                        <td className="px-6 py-5 font-mono text-slate-500">INV-{o.id.slice(-4)}-{o.id.slice(4, 8)}</td>
                                        <td className="px-6 py-5 text-slate-800">
                                            {o.customerName || `Table ${o.table}`}
                                        </td>
                                        <td className="px-6 py-5 text-slate-400">0</td>
                                        <td className="px-6 py-5 text-slate-500">Kampala Cafe</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                isPaid 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : isCancelled 
                                                        ? 'bg-red-100 text-red-700' 
                                                        : 'bg-orange-100 text-orange-700'
                                            }`}>
                                                {isPaid ? 'PAID' : isCancelled ? 'VOID' : 'DUE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-slate-400">
                                            {o.paymentMethod || '-'}
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-slate-900">
                                            {systemConfig.currency} {o.grandTotal.toLocaleString()}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* RADIO VIEW SUMMARY FOOTER */}
            <div className="p-4 bg-[#e2e8f0] border-t border-gray-300 shrink-0">
                <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-6 px-4">
                    <div className="flex items-center gap-8">
                        <span className="font-bold text-gray-500 text-[11px] uppercase tracking-widest">Total:</span>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 rounded-lg border border-orange-200">
                            <span className="text-[10px] font-black text-orange-700 uppercase tracking-tighter">Due -</span>
                            <span className="text-[11px] font-black text-orange-800">{summary.dueCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-200">
                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Paid -</span>
                            <span className="text-[11px] font-black text-emerald-800">{summary.paidCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200/50 rounded-lg">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Unspecified -</span>
                            <span className="text-[11px] font-black text-gray-700">{summary.unspecified}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-12">
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Total Amount</p>
                            <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{systemConfig.currency} {summary.totalAmount.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Total Paid</p>
                            <p className="text-sm font-black text-emerald-600 uppercase tracking-tight">{systemConfig.currency} {summary.totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Sell Due</p>
                            <p className="text-sm font-black text-orange-600 uppercase tracking-tight">{systemConfig.currency} {summary.sellDue.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Sell Return Due</p>
                            <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{summary.sellReturn}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* RIGHT: ORDER DETAILS PANEL */}
      <div className={`w-full lg:w-[450px] bg-white border-l border-gray-200 flex flex-col shadow-2xl shrink-0 z-40 h-full transition-all duration-300 ${selectedOrderId ? 'flex fixed lg:relative inset-0' : 'hidden lg:flex'}`}>
        {!selectedOrder ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4 opacity-40 text-center px-10">
                <FileText className="w-16 h-16" />
                <p className="font-black uppercase text-[10px] tracking-widest">Select an invoice for details</p>
            </div>
        ) : (
            <div className="flex-1 flex flex-col h-full animate-in slide-in-from-right-4 lg:slide-in-from-right-0 duration-300">
                
                <div className="p-6 md:p-8 border-b border-gray-50 flex justify-between items-start shrink-0 bg-white">
                    <div>
                        <h2 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">Order Details</h2>
                        <p className="text-[11px] font-bold text-slate-400 font-mono tracking-widest mt-1 uppercase">#ORD-{selectedOrder.id.toUpperCase()}</p>
                    </div>
                    <button onClick={() => setSelectedOrderId(null)} className="p-2.5 text-gray-400 hover:text-gray-900 transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 bg-white">
                    {/* Table / Server Info Box */}
                    <div className="bg-[#eff6ff] border border-blue-100 rounded-2xl p-6 flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 border border-blue-100">
                                <TableIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Table</p>
                                <p className="text-2xl font-black text-blue-900 tracking-tighter uppercase leading-none mt-1">{selectedOrder.table}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Waiter / Server</p>
                            <p className="text-sm font-black text-blue-900 uppercase mt-2 flex items-center gap-1.5 justify-end">
                                <User className="w-3.5 h-3.5" />
                                {selectedOrder.staffName || 'Master Owner'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                             <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Item Breakdown</h3>
                             <button onClick={handleStartSplit} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-blue-100 transition-all border border-blue-100">
                                 <Split className="w-3 h-3" /> Split Order
                             </button>
                        </div>
                        
                        <div className="space-y-4">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <span className="font-black text-slate-800 text-base">{item.quantity}x</span>
                                        <p className="font-bold text-slate-700 text-sm leading-tight max-w-[180px] pt-0.5">{item.product.name}</p>
                                    </div>
                                    <span className="font-black text-slate-900 text-base tabular-nums">{(item.quantity * item.product.price).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-dashed border-gray-200 mt-10 space-y-4">
                            <div className="flex justify-between items-center text-gray-400 font-bold uppercase tracking-widest text-[11px]">
                                <span>Subtotal</span>
                                <span className="text-lg text-gray-600">{(selectedOrder.grandTotal).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-black text-slate-900 uppercase tracking-tighter">Total</span>
                                <span className="text-2xl font-black text-blue-600 tracking-tighter">
                                    <span className="text-xs font-bold mr-2 uppercase">{systemConfig.currency}</span>
                                    {selectedOrder.grandTotal.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-6 md:p-8 border-t border-gray-100 bg-white space-y-4">
                    {selectedOrder.status !== 'paid' && selectedOrder.status !== 'cancelled' && (
                        <button 
                            onClick={handleOpenPayment}
                            className="w-full py-5 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-200 active:scale-95 transition-all"
                        >
                            <Banknote className="w-6 h-6" /> Process Payment
                        </button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => { setProcessedOrderForReceipt(selectedOrder); setPreviewOpen(true); }}
                            className="py-4 bg-[#1e293b] hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                        >
                            <Printer className="w-4 h-4" /> Print Bill
                        </button>
                        <button 
                            onClick={() => setIsVoidModalOpen(true)}
                            className="py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-red-100 transition-all active:scale-95"
                        >
                            <Trash2 className="w-4 h-4" /> Void Order
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* SPLIT ORDER MODAL */}
      {isSplitModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-0 md:p-10 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-6xl h-full max-h-full md:max-h-[85vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-6 md:p-8 bg-blue-600 text-white flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl"><Split className="w-6 h-6 md:w-8 md:h-8" /></div>
                          <div>
                              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none">Splitter</h3>
                              <p className="text-blue-100 text-[9px] font-black uppercase tracking-widest mt-1">INV-{selectedOrder.id.slice(-4)}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsSplitModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X className="w-7 h-7"/></button>
                  </div>

                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                      <div className="flex-1 border-r border-gray-100 flex flex-col bg-gray-50/30 overflow-hidden">
                          <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
                              <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">Available</h4>
                              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-black">
                                {splitSourceItems.reduce((s, i) => s + i.quantity, 0)} Pcs
                              </span>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                              {splitSourceItems.filter(i => i.quantity > 0).map((item, idx) => (
                                  <button key={idx} onClick={() => moveItemToBucket(idx)} className="w-full flex justify-between items-center p-3 bg-white border border-gray-100 rounded-2xl shadow-sm active:scale-95 transition-all text-left">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center font-black text-xs">{item.quantity}x</div>
                                          <span className="font-bold text-gray-800 text-xs truncate max-w-[150px]">{item.product.name}</span>
                                      </div>
                                      <ArrowRightCircle className="w-5 h-5 text-blue-400" />
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="flex-1 flex flex-col overflow-hidden">
                          <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-white overflow-x-auto no-scrollbar shrink-0">
                                {splitBuckets.map((_, idx) => (
                                    <button key={idx} onClick={() => setActiveBucketIdx(idx)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeBucketIdx === idx ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500'}`}>Bill {idx + 1}</button>
                                ))}
                                <button onClick={() => { setSplitBuckets([...splitBuckets, []]); setActiveBucketIdx(splitBuckets.length); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 border border-emerald-100"><Plus className="w-4 h-4" /></button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                              {splitBuckets[activeBucketIdx].map((item, idx) => (
                                  <div key={idx} className="w-full flex justify-between items-center p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs">{item.quantity}x</div>
                                          <span className="font-bold text-gray-800 text-xs">{item.product.name}</span>
                                      </div>
                                      <button onClick={() => moveItemFromBucket(activeBucketIdx, idx)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                                  </div>
                              ))}
                              {splitBuckets[activeBucketIdx].length === 0 && <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40 italic text-xs uppercase font-black">Empty Split</div>}
                          </div>
                          <div className="p-6 bg-slate-50 border-t border-gray-100 flex justify-between items-center shrink-0">
                              <div className="text-left leading-none">
                                  <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Split Value</p>
                                  <p className="text-xl font-black text-slate-800">{splitBuckets[activeBucketIdx].reduce((s, i) => s + (i.product.price * i.quantity), 0).toLocaleString()}</p>
                              </div>
                              <button 
                                onClick={confirmSplit}
                                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                              >
                                  Finalize Splits
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
                  <div className="p-6 md:p-8 bg-[#22c55e] text-white flex justify-between items-start shrink-0">
                      <div>
                          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">Checkout</h3>
                          <p className="text-emerald-100 text-sm font-bold mt-1 uppercase tracking-widest">{systemConfig.currency} {selectedOrder.grandTotal.toLocaleString()}</p>
                      </div>
                      <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X/></button>
                  </div>
                  <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'CASH', icon: Wallet, label: 'CASH' },
                            { id: 'MOBILE_MONEY', icon: Smartphone, label: 'MOMO' },
                            { id: 'CARD', icon: CreditCard, label: 'CARD' },
                            { id: 'SALARY_PAY', icon: Briefcase, label: 'SALARY' }
                          ].map(method => (
                              <button key={method.id} onClick={() => setPaymentMethod(method.id as any)}
                                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border-2 transition-all ${paymentMethod === method.id ? 'border-[#22c55e] bg-emerald-50' : 'border-gray-100 bg-gray-50'}`}>
                                <method.icon className={`w-6 h-6 ${paymentMethod === method.id ? 'text-[#22c55e]' : 'text-gray-400'}`} />
                                <span className={`text-[9px] font-black uppercase tracking-widest ${paymentMethod === method.id ? 'text-[#22c55e]' : 'text-gray-500'}`}>{method.label}</span>
                              </button>
                          ))}
                      </div>

                      {paymentMethod === 'SALARY_PAY' && (
                          <div className="space-y-2 animate-in slide-in-from-top-2">
                             <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Staff Attribute Name</label>
                             <input autoFocus type="text" value={salaryStaffName} onChange={e => setSalaryStaffName(e.target.value)} className="w-full px-5 py-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl outline-none font-bold text-emerald-900" placeholder="Enter name..." />
                          </div>
                      )}

                      <button onClick={handleCompletePayment} className="w-full py-5 bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                         <CheckCircle2 className="w-5 h-5" /> Settle Transaction
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* VOID MODAL - REDUCED SIZE */}
      {isVoidModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-[300px] rounded-[2rem] shadow-2xl p-5 border border-gray-100">
                  <div className="text-center mb-5">
                      <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-100">
                          <ShieldX className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-black uppercase text-gray-800 tracking-tight">Void Protocol</h3>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Authorizer Required</p>
                  </div>
                  <div className="space-y-4">
                      <textarea 
                        autoFocus 
                        value={voidReason} 
                        onChange={e => setVoidReason(e.target.value)} 
                        placeholder="State reason..." 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:ring-1 focus:ring-red-500 h-20 resize-none" 
                      />
                      <div className="flex gap-2">
                          <button onClick={() => setIsVoidModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-black text-[9px] uppercase">Cancel</button>
                          <button 
                            disabled={!voidReason.trim()} 
                            onClick={() => { onDeleteOrder(selectedOrder.id, voidReason); setIsVoidModalOpen(false); setSelectedOrderId(null); }} 
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase shadow-md disabled:opacity-50"
                          >
                            Confirm
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <ReceiptPreviewModal 
        isOpen={previewOpen} 
        onClose={() => { setPreviewOpen(false); setSelectedOrderId(null); setProcessedOrderForReceipt(null); }} 
        order={processedOrderForReceipt || selectedOrder} 
        systemConfig={systemConfig} 
        type="RECEIPT" 
        printedBy={processedOrderForReceipt?.completedBy || currentUser?.name || "Cashier"} 
      />
    </div>
  );
};

export default OrdersView;