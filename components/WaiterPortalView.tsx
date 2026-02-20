import React, { useState, useMemo, useRef } from 'react';
import { 
  Utensils, Search, ShoppingCart, ArrowLeft, Plus, Minus, ChefHat, X, Martini, 
  User, Edit3, Grid, List, Clock, CheckCircle2, ChevronRight, Lock, ShieldCheck, AlertCircle, MapPin,
  RotateCcw, Eye, Printer, FileText, MessageSquare, ChevronLeft, ClipboardList, Wallet, CheckSquare, XCircle,
  History, GlassWater, AlertTriangle
} from 'lucide-react';
import { Order, Product, SystemConfig, StaffMember, Table, OrderItem, AppView, SpiritBottle, SectionAllocation, SpiritLog } from '../types';
import { printReceipt } from '../services/receiptService';
import ReceiptPreviewModal from './ReceiptPreviewModal';

interface WaiterPortalViewProps {
  orders: Order[];
  products: Product[];
  systemConfig: SystemConfig;
  currentUser: StaffMember | null;
  staff: StaffMember[];
  tables: Table[];
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
  onPlaceOrder: (order: Order, silent?: boolean) => void;
  onUpdateOrder: (order: Order, silent?: boolean) => void;
  onDeleteOrder: (orderId: string, reason: string) => void;
  onItemReturn: (orderId: string, timestamp: Date, items: OrderItem[], refund: number, reason: string) => void;
  bottles: SpiritBottle[];
  onUpdateBottles: (bottles: SpiritBottle[]) => void;
  allocations: SectionAllocation[];
  onClaimSection: (section: string) => void;
}

const WaiterPortalView: React.FC<WaiterPortalViewProps> = ({ 
  orders, products, systemConfig, currentUser, tables, onLogout, onPlaceOrder, onUpdateOrder, onDeleteOrder,
  allocations, onClaimSection, bottles, onUpdateBottles
}) => {
  const [activeTab, setActiveTab] = useState<'TABLES' | 'MENU' | 'MY_ORDERS'>('TABLES');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [accessError, setAccessError] = useState<string | null>(null);
  
  // Spirit Integration State
  const [measureModalOpen, setMeasureModalOpen] = useState(false);
  const [bottleSelectModalOpen, setBottleSelectModalOpen] = useState(false);
  const [pendingSpiritProduct, setPendingSpiritProduct] = useState<Product | null>(null);
  const [activeBottlePour, setActiveBottlePour] = useState<{product: Product, variantName: string, variantPrice: number} | null>(null);

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [orderToPreview, setOrderToPreview] = useState<Order | null>(null);

  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // Added handleTableSelect to fix the reference error on line 251
  const handleTableSelect = (table: Table) => {
    const existingOrder = activeOrders.find(o => o.table === table.name);
    if (existingOrder) {
      setCurrentOrder({ ...existingOrder });
    } else {
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        tenantId: systemConfig.tenantId,
        customerName: `Table ${table.name}`,
        table: table.name,
        items: [],
        status: 'pending',
        timestamp: new Date(),
        isKitchenOrder: true,
        grandTotal: 0,
        amountPaid: 0,
        staffName: currentUser?.name || 'Waiter',
        staffRole: currentUser?.role
      };
      setCurrentOrder(newOrder);
    }
    setSelectedTable(table);
    setActiveTab('MENU');
  };

  // Added scrollCategories to fix the reference errors on line 259
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 250;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const mySpecificOrders = useMemo(() => {
      if (!currentUser) return [];
      return orders.filter(o => o.staffName === currentUser.name)
                   .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders, currentUser]);

  const unpaidTotal = useMemo(() => {
      return mySpecificOrders
        .filter(o => o.status !== 'paid' && o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.grandTotal, 0);
  }, [mySpecificOrders]);

  const sections = useMemo(() => {
    const distinct = Array.from(new Set(tables.map(t => t.section || 'General'))).sort();
    return distinct.length > 0 ? distinct : ['General'];
  }, [tables]);
  
  const [activeSection, setActiveSection] = useState<string>(sections[0]);

  const currentAllocation = useMemo(() => allocations.find(a => a.sectionName === activeSection), [allocations, activeSection]);
  const isAllocatedToMe = currentAllocation?.waiterId === currentUser?.id;
  const isLockedForMe = currentAllocation && currentAllocation.waiterId !== currentUser?.id;

  const visibleTables = useMemo(() => {
    return tables.filter(t => (t.section || 'General') === activeSection);
  }, [tables, activeSection]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => !['paid', 'cancelled', 'merged'].includes(o.status));
  }, [orders]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => cats.add(p.category.toUpperCase()));
    return ['ALL', ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return products.filter(p => {
      const catMatch = selectedCategory === 'ALL' || p.category.toUpperCase() === selectedCategory;
      const searchMatch = p.name.toLowerCase().includes(lowerTerm);
      return catMatch && searchMatch;
    });
  }, [products, searchTerm, selectedCategory]);

  const handleProductClick = (product: Product) => {
    const isSpirit = product.spiritConfig?.isSpirit || ['Whiskey', 'Vodka', 'Gin', 'Rum', 'Tequila', 'Wine', 'Champagne'].includes(product.category);
    if (isSpirit && product.spiritPrices) {
        setPendingSpiritProduct(product);
        setMeasureModalOpen(true);
    } else {
        addToCart(product);
    }
  };

  const selectMeasure = (variantName: string, variantPrice: number) => {
      if (!pendingSpiritProduct) return;
      setActiveBottlePour({ product: pendingSpiritProduct, variantName, variantPrice });
      setMeasureModalOpen(false);
      setBottleSelectModalOpen(true);
  };

  const confirmBottlePour = (bottleId: string) => {
    if (!activeBottlePour || !currentOrder) return;
    const { product, variantName, variantPrice } = activeBottlePour;
    const bottle = bottles.find(b => b.id === bottleId);
    if (!bottle) return;

    const isWine = ['WINE', 'CHAMPAGNE'].includes(bottle.type);
    let vol = 0;
    let totCount = 1;
    
    if (variantName.includes('Single') || variantName === 'Glass') {
        vol = isWine ? 150 : (bottle.measureStandard === 'NEW_25ML' ? 25 : 30);
        totCount = 1;
    } else if (variantName.includes('Double')) {
        vol = bottle.measureStandard === 'NEW_25ML' ? 50 : 60;
        totCount = 2;
    } else if (variantName.includes('Bottle')) {
        vol = bottle.currentVolume;
        totCount = Math.floor(bottle.totalVolume / (bottle.measureStandard === 'NEW_25ML' ? 25 : 30));
    }

    if (bottle.currentVolume < vol) {
        alert(`Insufficient volume! Only ${bottle.currentVolume}ml left.`);
        return;
    }

    // Deduct from Spirit Inventory
    const logEntry: SpiritLog = {
        id: `LOG-WAITER-${Date.now()}`,
        timestamp: new Date(),
        quantityMl: vol,
        tots: totCount,
        type: isWine ? 'GLASS' : 'DIRECT',
        staffName: currentUser?.name || 'Waiter'
    };

    const updatedBottles = bottles.map(b => {
        if (b.id === bottleId) {
            const newVol = Math.max(0, b.currentVolume - vol);
            return { ...b, currentVolume: newVol, status: (newVol < 20 ? 'EMPTY' : 'OPEN') as any, logs: b.logs ? [...b.logs, logEntry] : [logEntry] };
        }
        return b;
    });
    onUpdateBottles(updatedBottles);

    // Add to Cart
    const nameWithVariant = `${product.name} (${variantName})`;
    let newItems = [...currentOrder.items];
    newItems.push({ product: { ...product, name: nameWithVariant, price: variantPrice }, quantity: 1, isNew: true });
    const newTotal = newItems.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
    setCurrentOrder({ ...currentOrder, items: newItems, grandTotal: newTotal });

    setBottleSelectModalOpen(false);
    setActiveBottlePour(null);
    setPendingSpiritProduct(null);
  };

  const addToCart = (product: Product) => {
    if (!currentOrder) return;
    let newItems = [...currentOrder.items];
    const existingIdx = newItems.findIndex(i => i.product.id === product.id && !i.note && i.product.name === product.name);
    
    if (existingIdx >= 0) {
      newItems[existingIdx] = { ...newItems[existingIdx], quantity: newItems[existingIdx].quantity + 1, isNew: true };
    } else {
      newItems.push({ product: { ...product }, quantity: 1, isNew: true });
    }

    const newTotal = newItems.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
    setCurrentOrder({ ...currentOrder, items: newItems, grandTotal: newTotal });
  };

  const updateQty = (idx: number, delta: number) => {
    if (!currentOrder) return;
    if (delta < 0) {
        setAccessError("WAITER RESTRICTION: You cannot reduce quantities. Contact Cashier to modify items.");
        setTimeout(() => setAccessError(null), 4000);
        return;
    }
    let newItems = [...currentOrder.items];
    const newQty = newItems[idx].quantity + delta;
    newItems[idx] = { ...newItems[idx], quantity: newQty, isNew: true };
    const newTotal = newItems.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
    setCurrentOrder({ ...currentOrder, items: newItems, grandTotal: newTotal });
  };

  const handleSendOrder = (type: 'KITCHEN' | 'BARMAN') => {
    if (!currentOrder || currentOrder.items.length === 0) return;
    const orderToSubmit = { ...currentOrder, isKitchenOrder: type === 'KITCHEN' };
    const exists = orders.find(o => o.id === currentOrder.id);
    if (exists) onUpdateOrder(orderToSubmit);
    else onPlaceOrder(orderToSubmit);
    printReceipt(systemConfig, orderToSubmit, type === 'KITCHEN' ? 'KITCHEN' : 'BAR', null, currentUser?.name || 'Waiter');
    setSelectedTable(null);
    setCurrentOrder(null);
    setActiveTab('TABLES');
  };

  const isWine = pendingSpiritProduct && ['WINE', 'CHAMPAGNE', 'RED WINE', 'WHITE WINE'].includes(pendingSpiritProduct.category.toUpperCase());

  return (
    <div className="h-full flex flex-col bg-[#f4f7f6] overflow-hidden font-sans">
      <div className="h-16 bg-[#34495e] flex items-center justify-between px-6 shrink-0 shadow-lg z-30 text-white">
        <div className="flex items-center gap-4">
          <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ArrowLeft className="w-6 h-6" /></button>
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          <div><h1 className="text-xl font-black uppercase tracking-tighter">Waiter Portal</h1><p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none mt-0.5">Terminal Active</p></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex bg-[#2c3e50] p-1 rounded-xl shadow-inner border border-white/5">
             <button onClick={() => setActiveTab('TABLES')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'TABLES' || activeTab === 'MENU' ? 'bg-white text-[#34495e] shadow-md' : 'text-white/60 hover:text-white'}`}>TABLES</button>
             <button onClick={() => { setActiveTab('MY_ORDERS'); setSelectedTable(null); }} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'MY_ORDERS' ? 'bg-white text-[#34495e] shadow-md' : 'text-white/60 hover:text-white'}`}>MY SHIFT HISTORY</button>
          </div>
          <div className="flex items-center gap-3 pl-6 border-l border-white/10">
             <div className="text-right"><p className="text-xs font-black uppercase leading-tight">{currentUser?.name}</p><p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Online</p></div>
             <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white/20 shadow-lg font-black text-white">{currentUser?.name?.charAt(0)}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeTab === 'TABLES' && (
            <div className="flex-1 flex flex-col p-8 animate-in fade-in duration-300 overflow-y-auto custom-scrollbar">
               {accessError && <div className="mb-4 p-4 bg-red-600 text-white rounded-2xl shadow-xl flex items-center gap-3 animate-bounce"><AlertCircle className="w-6 h-6" /><span className="font-black text-sm uppercase tracking-tight">{accessError}</span></div>}
               <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">{sections.map(sec => { const alloc = allocations.find(a => a.sectionName === sec); const isMine = alloc?.waiterId === currentUser?.id; const isTheirs = alloc && !isMine; return (<button key={sec} onClick={() => setActiveSection(sec)} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-3 ${activeSection === sec ? (isTheirs ? 'bg-red-50 border-red-200 text-red-600' : 'bg-blue-600 border-blue-600 text-white shadow-xl') : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}>{isMine && <ShieldCheck className="w-4 h-4" />}{isTheirs && <Lock className="w-4 h-4" />}{sec}</button>);})}</div>
               <div className="bg-slate-50 p-6 rounded-3xl mb-8 flex justify-between items-center border border-slate-100 shadow-inner">
                  <div className="flex items-center gap-4"><div className={`p-3 rounded-2xl ${isAllocatedToMe ? 'bg-indigo-600 text-white' : isLockedForMe ? 'bg-red-600 text-white' : 'bg-white text-slate-400'}`}>{isAllocatedToMe ? <ShieldCheck className="w-6 h-6" /> : isLockedForMe ? <Lock className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}</div><div><h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">{activeSection}</h2><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isAllocatedToMe ? "My Current Allocation" : isLockedForMe ? `Assigned to ${currentAllocation.waiterName}` : "Open Section - Unallocated"}</p></div></div>
                  {!currentAllocation && <button onClick={() => onClaimSection(activeSection)} className="px-6 py-3 bg-white border border-slate-200 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95">Claim Section</button>}
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">{visibleTables.map(t => { const isOccupied = activeOrders.some(o => o.table === t.name); return (<button key={t.id} onClick={() => handleTableSelect(t)} disabled={isLockedForMe} className={`aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center relative transition-all group hover:scale-[1.02] ${isLockedForMe ? 'opacity-40 grayscale bg-slate-100 border-transparent cursor-not-allowed' : isOccupied ? 'bg-red-50 border-red-200 shadow-lg' : 'bg-white border-gray-100 hover:border-blue-400 shadow-sm'}`}>{isLockedForMe && <Lock className="w-6 h-6 text-slate-400 mb-2" />}{!isLockedForMe && isOccupied && <div className="absolute top-6 right-6 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>}<span className={`text-4xl font-black tracking-tighter ${isOccupied ? 'text-red-800' : 'text-slate-800'}`}>{t.name}</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{t.seats} Seats</span></button>);})}</div>
            </div>
          )}

          {activeTab === 'MENU' && (
            <div className="flex-1 flex flex-col overflow-hidden">
               <div className="p-6 border-b border-gray-100 bg-white shadow-sm z-10 shrink-0">
                  <div className="relative mb-6"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search menu..." className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-bold text-lg transition-all" /></div>
                  <div className="relative flex items-center group/cat"><button onClick={() => scrollCategories('left')} className="absolute left-0 z-20 p-2 bg-white/90 rounded-full shadow-lg border border-gray-100 text-gray-400 hover:text-blue-600 transition-all opacity-0 group-hover/cat:opacity-100 -translate-x-2"><ChevronLeft className="w-5 h-5" /></button><div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div><div ref={categoryScrollRef} className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth px-8 py-1">{categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-100'}`}>{cat}</button>))}</div><div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div><button onClick={() => scrollCategories('right')} className="absolute right-0 z-20 p-2 bg-white/90 rounded-full shadow-lg border border-gray-100 text-gray-400 hover:text-blue-600 transition-all opacity-0 group-hover/cat:opacity-100 translate-x-2"><ChevronRight className="w-5 h-5" /></button></div>
               </div>
               <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 custom-scrollbar">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">{filteredProducts.map(p => (<div key={p.id} onClick={() => handleProductClick(p)} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col overflow-hidden h-64"><div className="h-32 bg-gray-100 relative overflow-hidden shrink-0"><img src={p.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} /></div><div className="p-4 flex-1 flex flex-col justify-between"><h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{p.name}</h3><p className="text-xl font-black text-blue-600 tracking-tight mt-2">{p.price.toLocaleString()}</p></div></div>))}</div>
               </div>
            </div>
          )}

          {activeTab === 'MY_ORDERS' && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
               <div className="p-8 border-b border-gray-100 bg-white flex justify-between items-center shrink-0"><div><h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-3"><ClipboardList className="w-8 h-8 text-blue-600" /> Personal Transaction Registry</h2><p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Shift performance & table clearance tracking</p></div><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Settle</p><p className="text-3xl font-black text-blue-600 tabular-nums">{systemConfig.currency} {unpaidTotal.toLocaleString()}</p></div></div>
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50"><div className="max-w-6xl mx-auto space-y-4">{mySpecificOrders.length === 0 ? (<div className="py-20 text-center text-slate-300 opacity-40 uppercase font-black"><History className="w-20 h-20 mx-auto mb-4" />No orders recorded in your name this shift.</div>) : (mySpecificOrders.map(o => { const isPaid = o.status === 'paid'; const isCancelled = o.status === 'cancelled'; return (<div key={o.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group ${isPaid ? 'opacity-70 grayscale-[0.5]' : ''}`}><div className="flex items-center gap-6"><div className={`w-16 h-16 rounded-3xl flex flex-col items-center justify-center font-black text-2xl border-2 ${isPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : isCancelled ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>{o.table}</div><div><div className="flex items-center gap-3"><h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">Order #{o.id.slice(-6).toUpperCase()}</h3><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : isCancelled ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border border-orange-100 animate-pulse'}`}>{o.status}</span></div><div className="flex items-center gap-4 mt-1 text-xs font-bold text-slate-400 uppercase tracking-wider"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(o.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span><span className="flex items-center gap-1"><Utensils className="w-3 h-3" /> {o.items.length} items</span></div></div></div><div className="flex items-center gap-8"><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Total</p><p className={`text-xl font-black tabular-nums ${isPaid ? 'text-slate-400' : 'text-slate-900'}`}>{systemConfig.currency} {o.grandTotal.toLocaleString()}</p></div><div className="flex gap-2">{!isPaid && !isCancelled && (<button onClick={() => { setSelectedTable(tables.find(t => t.name === o.table) || null); setCurrentOrder({...o}); setActiveTab('MENU'); }} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90" title="Modify Order"><Plus className="w-5 h-5" /></button>)}<button onClick={() => { setOrderToPreview(o); setPreviewOpen(true); }} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-90" title="View Receipt"><FileText className="w-5 h-5" /></button></div></div></div>);}))}</div></div>
            </div>
          )}
        </div>

        {activeTab !== 'MY_ORDERS' && (
            <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col shadow-2xl z-20 shrink-0">
            {!selectedTable || !currentOrder ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center opacity-40">
                <Utensils className="w-20 h-20 mb-6" />
                <h3 className="text-xl font-black uppercase tracking-widest">Select Table</h3>
                <p className="text-xs font-bold mt-2">Choose an area on the left to start an order session.</p>
                </div>
            ) : (
                <>
                <div className="p-8 border-b border-gray-100 flex justify-between items-start shrink-0"><div><h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{selectedTable.name}</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Current Order</p></div><button onClick={() => { setSelectedTable(null); setCurrentOrder(null); setActiveTab('TABLES'); }} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X /></button></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">{currentOrder.items.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60"><ShoppingCart className="w-16 h-16 mb-4" /><p className="text-xs font-black uppercase tracking-widest">Awaiting Items</p></div>) : (currentOrder.items.map((item, idx) => (<div key={idx} className="flex gap-4 items-start animate-in slide-in-from-right-4 duration-300"><div className="flex flex-col items-center bg-[#f1f5f9] rounded-2xl p-1 shrink-0 border border-slate-200"><button onClick={() => updateQty(idx, 1)} className="p-2 text-blue-600 hover:bg-white rounded-xl transition-all active:scale-90"><Plus className="w-5 h-5" /></button><span className="font-black text-lg py-1 px-2 text-slate-900">{item.quantity}</span><button onClick={() => updateQty(idx, -1)} className="p-2 text-red-500 hover:bg-white rounded-xl transition-all active:scale-90 opacity-40 grayscale cursor-not-allowed" title="Contact Cashier to reduce quantity"><Minus className="w-5 h-5" /></button></div><div className="flex-1 min-w-0 pt-1"><div className="flex justify-between items-start"><p className="font-bold text-slate-800 text-base leading-tight pr-4">{item.product.name}</p><p className="font-black text-slate-900 tabular-nums">{(item.quantity * item.product.price).toLocaleString()}</p></div><button onClick={() => { setEditingItemIndex(idx); setNoteText(item.note || ''); setNoteModalOpen(true); }} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1.5 mt-2"><Edit3 className="w-3.5 h-3.5" /> {item.note ? 'Edit Note' : 'Add Note'}</button>{item.note && <p className="text-[11px] text-red-600 font-bold italic mt-2 leading-tight bg-red-50/50 p-2 rounded-xl border border-red-100 flex items-start gap-1.5"><span className="font-black not-italic">@</span> {item.note}</p>}</div></div>)))}</div>
                <div className="p-8 border-t border-gray-100 bg-[#f8fafc] shrink-0"><div className="flex justify-between items-center mb-8"><span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Total Amount</span><div className="text-right"><p className="text-xs font-black text-slate-400 uppercase leading-none mb-1">UGX</p><p className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums">{currentOrder.grandTotal.toLocaleString()}</p></div></div><div className="grid grid-cols-2 gap-4"><button onClick={() => handleSendOrder('KITCHEN')} disabled={currentOrder.items.length === 0} className="flex flex-col items-center justify-center py-6 bg-[#f39c12] hover:bg-[#e67e22] text-white rounded-[2rem] shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale group"><ChefHat className="w-8 h-8 mb-2 group-hover:-rotate-12 transition-transform" /><span className="text-[11px] font-black uppercase tracking-widest">To Kitchen</span></button><button onClick={() => handleSendOrder('BARMAN')} disabled={currentOrder.items.length === 0} className="flex flex-col items-center justify-center py-6 bg-[#9b59b6] hover:bg-[#8e44ad] text-white rounded-[2rem] shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale group"><Martini className="w-8 h-8 mb-2 group-hover:rotate-12 transition-transform" /><span className="text-[11px] font-black uppercase tracking-widest">To Barman</span></button></div></div>
                </>
            )}
            </div>
        )}
      </div>

      {/* Spirit Measure Selection */}
      {measureModalOpen && pendingSpiritProduct && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-sm rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95">
                  <div className="text-center mb-6"><h3 className="text-xl font-black text-gray-800">{pendingSpiritProduct.name}</h3><p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-1">Select Measure</p></div>
                  <div className="grid grid-cols-1 gap-3">
                      {pendingSpiritProduct.spiritPrices?.single && <button onClick={() => selectMeasure(isWine ? "Glass" : "Single Tot", pendingSpiritProduct.spiritPrices?.single!)} className="flex justify-between items-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all group"><span className="font-bold text-gray-700">{isWine ? "Glass" : "Single Tot"}</span><span className="font-black text-blue-700">{systemConfig.currency} {pendingSpiritProduct.spiritPrices?.single.toLocaleString()}</span></button>}
                      {pendingSpiritProduct.spiritPrices?.double && <button onClick={() => selectMeasure("Double Tot", pendingSpiritProduct.spiritPrices?.double!)} className="flex justify-between items-center p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all group"><span className="font-bold text-gray-700">Double Tot</span><span className="font-black text-purple-700">{systemConfig.currency} {pendingSpiritProduct.spiritPrices?.double.toLocaleString()}</span></button>}
                      <button onClick={() => selectMeasure("Full Bottle", pendingSpiritProduct.spiritPrices?.full || pendingSpiritProduct.price)} className="flex justify-between items-center p-4 bg-green-50 hover:bg-green-100 border-green-200 rounded-xl transition-all group"><span className="font-bold text-gray-700">Full Bottle</span><span className="font-black text-green-700">{systemConfig.currency} {(pendingSpiritProduct.spiritPrices?.full || pendingSpiritProduct.price).toLocaleString()}</span></button>
                  </div>
                  <button onClick={() => { setMeasureModalOpen(false); setPendingSpiritProduct(null); }} className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold uppercase text-xs">Cancel</button>
              </div>
          </div>
      )}

      {/* Spirit Bottle Selection */}
      {bottleSelectModalOpen && activeBottlePour && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 animate-in zoom-in-95">
                  <h3 className="text-xl font-black uppercase text-slate-900 mb-2">Bottle Match</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Pour from open stock for {activeBottlePour.product.name}</p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2 mb-6">
                      {bottles.filter(b => b.status === 'OPEN' && b.name.toLowerCase().includes(activeBottlePour.product.name.toLowerCase())).map(bottle => (
                          <button key={bottle.id} onClick={() => confirmBottlePour(bottle.id)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-2xl transition-all">
                              <span className="font-bold text-gray-800 text-sm">{bottle.name}</span>
                              <span className="font-black text-blue-600 text-xs">{bottle.currentVolume}ml Left</span>
                          </button>
                      ))}
                      {bottles.filter(b => b.status === 'OPEN' && b.name.toLowerCase().includes(activeBottlePour.product.name.toLowerCase())).length === 0 && (
                          <div className="text-center p-8 bg-red-50 rounded-2xl border border-red-100">
                             <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                             <p className="text-xs font-bold text-red-800 uppercase">No open bottles found!</p>
                             <p className="text-[10px] text-red-600 mt-1">Please open a new bottle in Spirits Inventory first.</p>
                          </div>
                      )}
                  </div>
                  <button onClick={() => { setBottleSelectModalOpen(false); setActiveBottlePour(null); setPendingSpiritProduct(null); }} className="w-full py-4 text-gray-400 font-bold uppercase text-xs">Cancel</button>
              </div>
          </div>
      )}

      {noteModalOpen && editingItemIndex !== null && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
              <div className="bg-white w-full max-sm rounded-[3rem] shadow-2xl p-8 animate-in zoom-in"><div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Edit3 className="w-6 h-6" /></div><h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Order Note</h3></div><textarea autoFocus value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Enter instructions..." className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-800 transition-all resize-none" /><div className="grid grid-cols-2 gap-3 mt-6"><button onClick={() => setNoteModalOpen(false)} className="py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button><button onClick={() => { if (!currentOrder) return; const newItems = [...currentOrder.items]; newItems[editingItemIndex].note = noteText; setCurrentOrder({...currentOrder, items: newItems}); setNoteModalOpen(false); }} className="py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-200">Save Note</button></div></div>
          </div>
      )}

      <ReceiptPreviewModal 
        isOpen={previewOpen} 
        onClose={() => { setPreviewOpen(false); setOrderToPreview(null); }} 
        order={orderToPreview} 
        systemConfig={systemConfig} 
        type="RECEIPT" 
        printedBy={currentUser?.name || "Waiter"}
      />
    </div>
  );
};

export default WaiterPortalView;