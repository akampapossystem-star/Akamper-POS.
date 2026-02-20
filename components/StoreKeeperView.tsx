
import React, { useState, useMemo } from 'react';
import { 
  Package, TrendingUp, TrendingDown, ClipboardList, 
  Search, Plus, Minus, Archive, Truck, ArrowRightLeft, 
  FileText, Calendar, AlertCircle, Save, History, Scale, User, MapPin, Box, Bell, CheckCircle2, XCircle, Link, DollarSign, ShoppingBag, Wallet, CreditCard, Banknote, List, Edit, Eye, Tag, AlertTriangle, Coins, Trash2, Layers, CheckSquare, Filter, X, ChevronRight, Settings
} from 'lucide-react';
import { StoreItem, SystemConfig, StockMovementLog, StaffMember, Requisition, CashEntry } from '../types';

interface StoreKeeperViewProps {
  storeItems: StoreItem[]; 
  onUpdateStoreItems: (items: StoreItem[]) => void;
  logs: StockMovementLog[];
  onAddLog: (log: StockMovementLog) => void;
  systemConfig: SystemConfig;
  currentUser: StaffMember | null;
  requisitions: Requisition[]; 
  onUpdateRequisition: (req: Requisition) => void; 
  cashEntries: CashEntry[]; 
  onUpdateCashEntries: (entries: CashEntry[]) => void;
}

const GLOBAL_UNITS = [
    { label: 'Grams (g)', value: 'g' },
    { label: 'Kilograms (kg)', value: 'kg' },
    { label: 'Milligrams (mg)', value: 'mg' },
    { label: 'Milliliters (ml)', value: 'ml' },
    { label: 'Liters (ltr)', value: 'ltr' },
    { label: 'Pieces (pcs)', value: 'pcs' },
    { label: 'Bag', value: 'bag' },
    { label: 'Box', value: 'box' },
    { label: 'Packet (pkt)', value: 'pkt' },
    { label: 'Tin', value: 'tin' },
    { label: 'Cup', value: 'cup' },
    { label: 'Teaspoon (tsp)', value: 'tsp' },
    { label: 'Tablespoon (tbsp)', value: 'tbsp' },
    { label: 'Crate', value: 'crate' },
    { label: 'Roll', value: 'roll' },
    { label: 'Jerrycan', value: 'jerrycan' },
    { label: 'Tray', value: 'tray' },
    { label: 'Bucket', value: 'bucket' },
    { label: 'Pound (lb)', value: 'lb' },
    { label: 'Ounce (oz)', value: 'oz' },
];

const StoreKeeperView: React.FC<StoreKeeperViewProps> = ({ 
  storeItems, onUpdateStoreItems, logs, onAddLog, systemConfig, currentUser, requisitions = [], onUpdateRequisition,
  cashEntries, onUpdateCashEntries
}) => {
  const [activeTab, setActiveTab] = useState<'MATERIAL_PURCHASE' | 'EXIT' | 'AUDIT' | 'REQUESTS' | 'CASH_BOOK' | 'INVENTORY' | 'LOW_STOCK'>('MATERIAL_PURCHASE');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInventoryCategory, setSelectedInventoryCategory] = useState('All');
  
  // Stock Form State
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  
  // Accountability Fields
  const [recipient, setRecipient] = useState(''); 
  const [destination, setDestination] = useState(''); 
  const [reason, setReason] = useState(''); 

  // Modal State for Add/Edit
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [itemForm, setItemForm] = useState<Partial<StoreItem>>({ unit: 'kg', minStockLevel: 5, trackStock: true });

  const [storeCategories, setStoreCategories] = useState<string[]>(() => {
      const defaults = ['Raw Materials', 'Assets', 'Consumables', 'Beverage Stock', 'Cleaning'];
      const existing = new Set(storeItems.map(i => i.category));
      return Array.from(new Set([...defaults, ...existing])).sort();
  });

  const [departments] = useState<string[]>(['Kitchen', 'Bar', 'Front House', 'Cleaning', 'Staff', 'Maintenance']);

  // Cash Book Form State
  const [cashForm, setCashForm] = useState({
      type: 'OUT' as 'IN' | 'OUT',
      amount: '',
      remark: '',
      category: 'Materials',
      mode: 'Cash' as 'Cash' | 'Mobile Money' | 'Bank'
  });
  
  const filteredItems = useMemo(() => {
      return storeItems.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.category.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesCategory = selectedInventoryCategory === 'All' || p.category === selectedInventoryCategory;
          return matchesSearch && matchesCategory;
      });
  }, [storeItems, searchTerm, selectedInventoryCategory]);

  const lowStockItems = useMemo(() => {
      return storeItems.filter(i => (i.trackStock !== false) && i.stock <= i.minStockLevel);
  }, [storeItems]);

  const cashLedger = useMemo(() => {
      let balance = 0;
      const chronological = [...cashEntries].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return chronological.map(entry => {
          balance += entry.amountIn;
          balance -= entry.amountOut;
          return { ...entry, balance };
      }).reverse(); 
  }, [cashEntries]);

  const handleOpenItemModal = (item?: StoreItem) => {
      if (item) {
          setEditingItem(item);
          setItemForm(item);
      } else {
          setEditingItem(null);
          setItemForm({ unit: 'kg', minStockLevel: 5, trackStock: true, stock: 0 });
      }
      setIsItemModalOpen(true);
  };

  const handleSaveStoreItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!itemForm.name || !itemForm.category) return;

      if (editingItem) {
          // If stock was adjusted, log it as an audit
          if (Number(itemForm.stock) !== editingItem.stock) {
              onAddLog({
                  id: `AUDIT-${Date.now()}`,
                  itemId: editingItem.id,
                  itemName: itemForm.name,
                  type: 'AUDIT_ADJUSTMENT',
                  quantityChange: Number(itemForm.stock) - editingItem.stock,
                  previousStock: editingItem.stock,
                  newStock: Number(itemForm.stock) || 0,
                  reason: 'Manual Inventory Edit',
                  performedBy: currentUser?.name || 'Store Keeper',
                  timestamp: new Date()
              });
          }
          onUpdateStoreItems(storeItems.map(item => item.id === editingItem.id ? { ...item, ...itemForm, lastUpdated: new Date() } as StoreItem : item));
      } else {
          const newItem: StoreItem = {
              id: `MAT-${Date.now()}`,
              name: itemForm.name,
              category: itemForm.category,
              stock: Number(itemForm.stock) || 0,
              unit: itemForm.unit || 'pcs',
              minStockLevel: itemForm.minStockLevel || 5,
              lastUpdated: new Date(),
              costPrice: itemForm.costPrice || 0,
              trackStock: itemForm.trackStock !== false
          };
          onUpdateStoreItems([...storeItems, newItem]);
          onAddLog({
              id: `INIT-${Date.now()}`,
              itemId: newItem.id,
              itemName: newItem.name,
              type: 'MARKET_PURCHASE',
              quantityChange: newItem.stock,
              previousStock: 0,
              newStock: newItem.stock,
              reason: 'Initial Product Registration',
              performedBy: currentUser?.name || 'Store Keeper',
              timestamp: new Date()
          });
      }
      setIsItemModalOpen(false);
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !quantity) return;

    const qty = parseFloat(quantity); 
    if (isNaN(qty) || qty <= 0) return;

    let newStock = selectedItem.stock;
    let type: StockMovementLog['type'] = 'MARKET_PURCHASE';

    if (activeTab === 'MATERIAL_PURCHASE') {
        newStock += qty; 
        type = 'MARKET_PURCHASE';
        if (cost) {
            const unitCost = parseFloat(cost);
            onUpdateStoreItems(storeItems.map(p => p.id === selectedItem.id ? { ...p, stock: newStock, costPrice: unitCost, lastUpdated: new Date() } : p));
            onUpdateCashEntries([...cashEntries, { id: `CASH-AUTO-${Date.now()}`, date: new Date(), remark: `Purchased: ${selectedItem.name} (${qty}${selectedItem.unit})`, category: 'Inventory', mode: 'Cash', amountIn: 0, amountOut: unitCost * qty }]);
        } else {
             onUpdateStoreItems(storeItems.map(p => p.id === selectedItem.id ? { ...p, stock: newStock, lastUpdated: new Date() } : p));
        }
    } else if (activeTab === 'EXIT') {
        if (qty > selectedItem.stock) { alert("Insufficient stock!"); return; }
        newStock -= qty;
        type = 'STORE_EXIT';
        onUpdateStoreItems(storeItems.map(p => p.id === selectedItem.id ? { ...p, stock: newStock, lastUpdated: new Date() } : p));
    }

    onAddLog({ id: `LOG-${Date.now()}`, itemId: selectedItem.id, itemName: selectedItem.name, type, quantityChange: activeTab === 'EXIT' ? -qty : qty, previousStock: selectedItem.stock, newStock, cost: cost ? parseFloat(cost) : undefined, reason, performedBy: currentUser?.name || 'Store Keeper', timestamp: new Date(), recipient, destination });
    setQuantity(''); setCost(''); setReason(''); setRecipient(''); setDestination(''); setSelectedItem(null);
  };

  const handleCashTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      if (!cashForm.amount || !cashForm.remark) return;
      const amountVal = parseFloat(cashForm.amount);
      onUpdateCashEntries([...cashEntries, { id: `CASH-${Date.now()}`, date: new Date(), remark: cashForm.remark, category: cashForm.category, mode: cashForm.mode, amountIn: cashForm.type === 'IN' ? amountVal : 0, amountOut: cashForm.type === 'OUT' ? amountVal : 0 }]);
      setCashForm({ ...cashForm, amount: '', remark: '' });
  };

  const handleApproveRequisition = (req: Requisition) => {
     let currentItems = [...storeItems];
     let deductedAny = false;
     req.items.forEach(reqItem => {
         if (reqItem.itemId) { 
             const item = currentItems.find(p => p.id === reqItem.itemId);
             if (item && item.stock >= reqItem.quantity) {
                 const newStock = item.stock - reqItem.quantity;
                 currentItems = currentItems.map(p => p.id === item.id ? { ...p, stock: newStock, lastUpdated: new Date() } : p);
                 onAddLog({ id: `LOG-REQ-${Date.now()}-${reqItem.itemId}`, itemId: item.id, itemName: item.name, type: 'STORE_EXIT', quantityChange: -reqItem.quantity, previousStock: item.stock, newStock, reason: `Requisition Fulfill: ${reqItem.department}`, performedBy: currentUser?.name || 'Store Keeper', timestamp: new Date(), recipient: req.requesterName, destination: reqItem.department });
                 deductedAny = true;
             }
         }
     });
     if (deductedAny) onUpdateStoreItems(currentItems);
     onUpdateRequisition({ ...req, status: 'APPROVED', approvedBy: currentUser?.name || 'Store Keeper' });
  };

  return (
    <div className="h-full bg-[#f1f5f9] font-sans flex flex-col md:flex-row overflow-hidden relative">
      
      {/* FORM PANE */}
      <div className="w-full md:w-5/12 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl z-10">
         <div className="p-6 bg-slate-900 text-white shrink-0">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
               <Archive className="w-6 h-6 text-emerald-400" /> Store Master
            </h2>
         </div>

         <div className="grid grid-cols-3 gap-2 p-2 bg-slate-100 shrink-0">
            <button onClick={() => setActiveTab('MATERIAL_PURCHASE')} className={`py-3 rounded-lg text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all ${activeTab === 'MATERIAL_PURCHASE' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400'}`}>
               <ShoppingBag className="w-5 h-5" /> Receive
            </button>
            <button onClick={() => setActiveTab('EXIT')} className={`py-3 rounded-lg text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all ${activeTab === 'EXIT' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-400'}`}>
               <ArrowRightLeft className="w-5 h-5" /> Issue
            </button>
            <button onClick={() => setActiveTab('REQUESTS')} className={`py-3 rounded-lg text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all relative ${activeTab === 'REQUESTS' ? 'bg-white text-purple-600 shadow-md' : 'text-slate-400'}`}>
               <Bell className="w-5 h-5" /> Req Log
               {requisitions.filter(r => r.status === 'PENDING').length > 0 && <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] px-1 rounded-full">{requisitions.filter(r => r.status === 'PENDING').length}</span>}
            </button>
            <button onClick={() => setActiveTab('CASH_BOOK')} className={`py-3 rounded-lg text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all ${activeTab === 'CASH_BOOK' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>
               <Wallet className="w-5 h-5" /> Cash Book
            </button>
            <button onClick={() => setActiveTab('INVENTORY')} className={`py-3 rounded-lg text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all ${activeTab === 'INVENTORY' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>
               <List className="w-5 h-5" /> Inventory
            </button>
            <button onClick={() => setActiveTab('LOW_STOCK')} className={`py-3 rounded-lg text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all ${activeTab === 'LOW_STOCK' ? 'bg-white text-red-600 shadow-md' : 'text-slate-400'}`}>
               <AlertTriangle className="w-5 h-5" /> Shortage
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            {(activeTab === 'MATERIAL_PURCHASE' || activeTab === 'EXIT') && (
                <form onSubmit={handleTransaction} className="space-y-6">
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Item Selection</label>
                            <select required value={selectedItem?.id || ''} onChange={e => setSelectedItem(storeItems.find(i => i.id === e.target.value) || null)} className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500">
                                <option value="">Select Item from Bulk Store...</option>
                                {storeItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.stock} {i.unit} in stock)</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Quantity</label>
                                <input type="number" step="any" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl font-black text-slate-800 outline-none focus:bg-white focus:border-blue-500" placeholder="0" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dept (Issue)</label>
                                <select value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500">
                                    <option value="">N/A</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Notes</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl font-medium text-sm outline-none focus:bg-white focus:border-blue-500 h-20 resize-none" placeholder="Reason for movement..." />
                        </div>
                        <button type="submit" className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${activeTab === 'MATERIAL_PURCHASE' ? 'bg-emerald-600' : 'bg-orange-600'}`}>
                           Confirm Transaction
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'REQUESTS' && (
                <div className="space-y-4">
                    {requisitions.filter(r => r.status === 'PENDING').length === 0 ? (
                        <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-bold uppercase text-xs">No pending fulfillments</div>
                    ) : (
                        requisitions.filter(r => r.status === 'PENDING').map(req => (
                            <div key={req.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="font-black text-slate-800 uppercase text-xs">{req.requesterName}</p>
                                    <span className="text-[9px] font-mono text-slate-400">{new Date(req.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="space-y-2 mb-6">
                                    {req.items.map((it, idx) => (
                                        <div key={idx} className="bg-slate-50 p-3 rounded-xl flex justify-between text-xs font-bold border border-slate-100">
                                            <span>{it.itemName}</span> <span>{it.quantity} {it.unit}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onUpdateRequisition({ ...req, status: 'REJECTED' })} className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase">Reject</button>
                                    <button onClick={() => handleApproveRequisition(req)} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-200">Issue Items</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'CASH_BOOK' && (
                <div className="space-y-6">
                    <form onSubmit={handleCashTransaction} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button type="button" onClick={() => setCashForm({...cashForm, type: 'IN'})} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${cashForm.type === 'IN' ? 'bg-green-600 text-white' : 'text-slate-500'}`}>In (+)</button>
                            <button type="button" onClick={() => setCashForm({...cashForm, type: 'OUT'})} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${cashForm.type === 'OUT' ? 'bg-red-600 text-white' : 'text-slate-500'}`}>Out (-)</button>
                        </div>
                        <input type="number" required value={cashForm.amount} onChange={e => setCashForm({...cashForm, amount: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800" placeholder="0.00 Amount" />
                        <input type="text" required value={cashForm.remark} onChange={e => setCashForm({...cashForm, remark: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800" placeholder="Remark / Detail" />
                        <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Post Entry</button>
                    </form>
                </div>
            )}
         </div>
      </div>

      {/* DATA PANE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          <div className="p-6 border-b border-gray-100 shrink-0 bg-gray-50/50 flex flex-col md:flex-row justify-between md:items-center gap-4">
             <div>
                <h3 className="text-xl font-black uppercase text-slate-800">{activeTab.replace('_', ' ')} Records</h3>
             </div>
             <div className="flex gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold" placeholder="Search data..." />
                </div>
                {activeTab === 'INVENTORY' && (
                    <button onClick={() => handleOpenItemModal()} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                        <Plus className="w-4 h-4" /> New Product
                    </button>
                )}
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
             {activeTab === 'INVENTORY' || activeTab === 'LOW_STOCK' ? (
                 <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(activeTab === 'LOW_STOCK' ? lowStockItems : filteredItems).map(item => (
                        <div key={item.id} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm flex flex-col justify-between hover:shadow-lg transition-all group">
                            <div>
                                <p className="font-black text-slate-800 leading-tight mb-1">{item.name}</p>
                                <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded tracking-widest">{item.category}</span>
                            </div>
                            <div className="mt-4 flex justify-between items-end">
                                <div>
                                    <p className={`text-xl font-black ${item.stock <= item.minStockLevel ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>{item.stock} <span className="text-[10px] font-bold text-slate-400">{item.unit}</span></p>
                                    <p className="text-[8px] font-bold text-slate-300 uppercase">Val: {(item.costPrice || 0).toLocaleString()}/unit</p>
                                </div>
                                <button onClick={() => handleOpenItemModal(item)} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                                    <Edit className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                    ))}
                 </div>
             ) : activeTab === 'CASH_BOOK' ? (
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b sticky top-0"><tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest"><th className="px-4 py-4">Date</th><th className="px-4 py-4">Remark</th><th className="px-4 py-4 text-right">In</th><th className="px-4 py-4 text-right">Out</th><th className="px-4 py-4 text-right">Balance</th></tr></thead>
                    <tbody className="divide-y text-[11px] font-bold text-slate-700">
                        {cashLedger.map(entry => (
                            <tr key={entry.id} className="hover:bg-blue-50 transition-colors">
                                <td className="px-4 py-4">{new Date(entry.date).toLocaleDateString()}</td>
                                <td className="px-4 py-4">{entry.remark}</td>
                                <td className="px-4 py-4 text-right text-emerald-600">{entry.amountIn ? `+${entry.amountIn.toLocaleString()}` : '-'}</td>
                                <td className="px-4 py-4 text-right text-red-600">{entry.amountOut ? `-${entry.amountOut.toLocaleString()}` : '-'}</td>
                                <td className="px-4 py-4 text-right font-black">{entry.balance.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             ) : (
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b sticky top-0"><tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><th className="px-4 py-4">Time</th><th className="px-4 py-4">Item</th><th className="px-4 py-4 text-right">Qty</th><th className="px-4 py-4">Destination</th><th className="px-4 py-4">By</th></tr></thead>
                    <tbody className="divide-y text-[11px] font-bold text-slate-700">
                        {logs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime()).map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-4 font-mono text-slate-400">{log.timestamp.toLocaleTimeString()}</td>
                                <td className="px-4 py-4 font-black">{log.itemName}</td>
                                <td className={`px-4 py-4 text-right font-black ${log.quantityChange > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>{log.quantityChange > 0 ? '+' : ''}{log.quantityChange}</td>
                                <td className="px-4 py-4 uppercase text-[9px]">{log.destination || log.type.replace('_', ' ')}</td>
                                <td className="px-4 py-4 uppercase text-[9px] text-slate-400">{log.performedBy}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             )}
          </div>
      </div>

      {/* --- ADD/EDIT ITEM MODAL --- */}
      {isItemModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                  <div className="p-8 bg-indigo-900 text-white flex justify-between items-center shrink-0">
                      <div>
                          <h2 className="text-2xl font-black uppercase tracking-tighter">{editingItem ? 'Modify Product' : 'Register Store Product'}</h2>
                          <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest mt-1">Independent Bulk Stock Registry</p>
                      </div>
                      <button onClick={() => setIsItemModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                  </div>

                  <form onSubmit={handleSaveStoreItem} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Package className="w-3 h-3 text-indigo-500" /> Item Label Name
                          </label>
                          <input 
                            required 
                            autoFocus
                            value={itemForm.name || ''} 
                            onChange={e => setItemForm({...itemForm, name: e.target.value})} 
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. Sugar 50kg, Hand Soap 5L"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-3 h-3 text-indigo-500" /> Category
                            </label>
                            <select 
                                value={itemForm.category} 
                                onChange={e => setItemForm({...itemForm, category: e.target.value})}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                            >
                                <option value="">Select Category...</option>
                                {storeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Scale className="w-3 h-3 text-indigo-500" /> Base Unit
                            </label>
                            <select 
                                value={itemForm.unit} 
                                onChange={e => setItemForm({...itemForm, unit: e.target.value})}
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                            >
                                {GLOBAL_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                            </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3 h-3" /> Current Volume
                            </label>
                            <input 
                                type="number" 
                                step="any"
                                value={itemForm.stock} 
                                onChange={e => setItemForm({...itemForm, stock: parseFloat(e.target.value)})}
                                className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl font-black text-lg text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                <Bell className="w-3 h-3" /> Alert Threshold
                            </label>
                            <input 
                                type="number"
                                step="any"
                                value={itemForm.minStockLevel} 
                                onChange={e => setItemForm({...itemForm, minStockLevel: parseFloat(e.target.value)})}
                                className="w-full px-4 py-3 bg-white border border-red-100 rounded-xl font-black text-lg text-red-900 outline-none focus:ring-2 focus:ring-red-400"
                            />
                        </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Coins className="w-3 h-3 text-indigo-500" /> Cost Price (per {itemForm.unit})
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">{systemConfig.currency}</span>
                            <input 
                                type="number"
                                step="any"
                                value={itemForm.costPrice} 
                                onChange={e => setItemForm({...itemForm, costPrice: parseFloat(e.target.value)})}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="0.00"
                            />
                          </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <input 
                            type="checkbox" 
                            id="trackStock"
                            checked={itemForm.trackStock}
                            onChange={e => setItemForm({...itemForm, trackStock: e.target.checked})}
                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor="trackStock" className="text-xs font-black text-slate-600 uppercase tracking-tight cursor-pointer select-none">
                              Enforce Real-time Stock Tracking
                          </label>
                      </div>

                      <div className="pt-4 flex flex-col gap-3">
                          <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-3 active:scale-95">
                             <Save className="w-6 h-6" /> {editingItem ? 'Commit Updates' : 'Add to Bulk Store'}
                          </button>
                          <button type="button" onClick={() => setIsItemModalOpen(false)} className="w-full py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600">Dismiss</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default StoreKeeperView;
