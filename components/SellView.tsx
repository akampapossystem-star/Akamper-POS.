import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingCart, Grid, User, Coffee, Utensils, X, Trash2, Printer, Save, RefreshCw, Plus, Minus, Search, ChevronLeft, CreditCard, Banknote, Smartphone, Briefcase, LayoutGrid, Wine, GlassWater, Beer, Eye, AlertTriangle, Martini, ChevronRight, ShoppingBag, ArrowRight } from 'lucide-react';
import { Order, SystemConfig, UserRole, RegisterState, Product, Table, Customer, StaffMember, SpiritBottle, OrderItem, SpiritLog } from '../types';
import { printReceipt } from '../services/receiptService';
import ReceiptPreviewModal from './ReceiptPreviewModal';

interface SellViewProps {
  systemConfig: SystemConfig;
  onPlaceOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string, reason: string) => void;
  onItemReturn: (orderId: string, originalTime: Date, items: OrderItem[], totalRefund: number, reason: string) => void;
  onAddCustomer: (customer: Customer) => void;
  orders: Order[];
  userRole: UserRole;
  registerState: RegisterState;
  onOpenRegister: (amount: number) => void;
  tables: Table[];
  products: Product[];
  returns: any[];
  customers: Customer[];
  staff: StaffMember[];
  currentUser: StaffMember | null;
  bottles: SpiritBottle[];
  onUpdateBottles: (bottles: SpiritBottle[]) => void;
}

const SellView: React.FC<SellViewProps> = ({ 
  systemConfig, onPlaceOrder, onUpdateOrder, onDeleteOrder, onItemReturn, onAddCustomer,
  orders, userRole, registerState, onOpenRegister, tables, products, returns, customers, staff, currentUser, bottles, onUpdateBottles 
}) => {
  const [occupiedOrder, setOccupiedOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileCartVisible, setIsMobileCartVisible] = useState(false);
  
  // Measure Selection State
  const [measureModalOpen, setMeasureModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  // Spirit Coordination State
  const [bottleSelectModalOpen, setBottleSelectModalOpen] = useState(false);
  const [activeBottlePour, setActiveBottlePour] = useState<{product: Product, variantName: string, variantPrice: number} | null>(null);
  const [spiritConsumptionMode, setSpiritConsumptionMode] = useState<'DIRECT' | 'COCKTAIL'>('DIRECT');

  const [stockError, setStockError] = useState<string | null>(null);

  // Receipt Preview State
  const [previewOpen, setPreviewOpen] = useState(false);

  const catScrollRef = useRef<HTMLDivElement>(null);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const scrollCats = (dir: 'L' | 'R') => {
      if (catScrollRef.current) {
          catScrollRef.current.scrollBy({ left: dir === 'L' ? -250 : 250, behavior: 'smooth' });
      }
  };

  const handleItemClick = (product: Product) => {
      if (product.trackStock && product.stock <= 0) {
          setStockError(`INVENTORY ERROR: "${product.name}" is out of stock.`);
          setTimeout(() => setStockError(null), 3000);
          return;
      }
      const isSpiritOrWine = product.spiritConfig?.isSpirit || 
                             ['Wine', 'Champagne', 'Whiskey', 'Vodka', 'Gin', 'Rum', 'Tequila', 'Cognac'].includes(product.category);
      if (isSpiritOrWine && product.spiritPrices) {
          setPendingProduct(product);
          setMeasureModalOpen(true);
      } else {
          addItemToCart(product);
      }
  };

  const addItemToCart = (product: Product, variantName?: string, variantPrice?: number) => {
    const price = variantPrice || product.price;
    const name = variantName ? `${product.name} (${variantName})` : product.name;
    
    const isAlcoholMeasure = variantName && (variantName.includes('Tot') || variantName.includes('Glass') || variantName.includes('Bottle'));
    if (isAlcoholMeasure) {
        setActiveBottlePour({ product, variantName, variantPrice: price });
        setSpiritConsumptionMode('DIRECT');
        setBottleSelectModalOpen(true);
        return;
    }

    applyItemToOrder(product, name, price);
  };

  const applyItemToOrder = (product: Product, name: string, price: number) => {
    if (!occupiedOrder) {
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        tenantId: systemConfig.tenantId,
        customerName: 'Walk-in Customer',
        table: 'Walk-in',
        items: [{ product: { ...product, name, price }, quantity: 1 }],
        status: 'pending',
        timestamp: new Date(),
        isKitchenOrder: true,
        grandTotal: price,
        amountPaid: 0,
        staffName: currentUser?.name || 'Cashier', 
        staffRole: currentUser?.role
      };
      setOccupiedOrder(newOrder);
    } else {
      const existingItemIndex = occupiedOrder.items.findIndex(i => i.product.id === product.id && i.product.name === name);
      let newItems = [...occupiedOrder.items];
      if (existingItemIndex >= 0) {
        newItems[existingItemIndex].quantity += 1;
      } else {
        newItems.push({ product: { ...product, name, price }, quantity: 1 });
      }
      const newTotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      setOccupiedOrder({ ...occupiedOrder, items: newItems, grandTotal: newTotal });
    }
    setMeasureModalOpen(false);
    setPendingProduct(null);
  };

  const confirmBottlePour = (bottleId: string) => {
    if (!activeBottlePour) return;
    const { product, variantName, variantPrice } = activeBottlePour;
    const bottle = bottles.find(b => b.id === bottleId);
    if (!bottle) return;

    const isWine = ['WINE', 'CHAMPAGNE'].includes(bottle.type);
    let vol = 0;
    let totCount = 1;
    if (variantName === 'Single Tot' || variantName === 'Glass') {
        vol = isWine ? 150 : (bottle.measureStandard === 'NEW_25ML' ? 25 : 30);
        totCount = 1;
    } else if (variantName === 'Double Tot') {
        vol = bottle.measureStandard === 'NEW_25ML' ? 50 : 60;
        totCount = 2;
    } else if (variantName === 'Half Bottle') {
        vol = Math.floor(bottle.totalVolume / 2);
        totCount = 10;
    } else if (variantName === 'Bottle' || variantName === 'Full Bottle') {
        vol = bottle.currentVolume;
        totCount = Math.floor(bottle.totalVolume / (bottle.measureStandard === 'NEW_25ML' ? 25 : 30));
    }

    if (bottle.currentVolume < vol) {
        alert(`Insufficient volume! Only ${bottle.currentVolume}ml left.`);
        return;
    }

    const logEntry: SpiritLog = {
        id: `LOG-SALE-${Date.now()}`,
        timestamp: new Date(),
        quantityMl: vol,
        tots: totCount,
        type: isWine ? 'GLASS' : spiritConsumptionMode,
        staffName: currentUser?.name || 'Cashier'
    };

    const updatedBottles = bottles.map(b => {
        if (b.id === bottleId) {
            const newVol = Math.max(0, b.currentVolume - vol);
            return { ...b, currentVolume: newVol, status: (newVol < 20 ? 'EMPTY' : 'OPEN') as any, logs: b.logs ? [...b.logs, logEntry] : [logEntry] };
        }
        return b;
    });
    onUpdateBottles(updatedBottles);

    applyItemToOrder(product, `${product.name} (${variantName})`, variantPrice);
    setBottleSelectModalOpen(false);
    setActiveBottlePour(null);
  };

  const handleProcessFinish = () => {
      if (!occupiedOrder) return;
      const orderToSave: Order = { 
        ...occupiedOrder, 
        completedBy: currentUser?.name || 'Cashier',
        status: 'paid', 
        amountPaid: occupiedOrder.grandTotal, 
        paymentMethod: 'CASH' 
      };
      onUpdateOrder(orderToSave);
      if (!orders.find(o => o.id === orderToSave.id)) { onPlaceOrder(orderToSave); }
      setOccupiedOrder(null);
      setIsMobileCartVisible(false);
  };

  const handleStartPreview = () => {
    if (!occupiedOrder) return;
    if (!registerState.isOpen) {
        setStockError("ACCESS ERROR: Register is closed. Start shift in Dashboard.");
        setTimeout(() => setStockError(null), 4000);
        return;
    }
    setPreviewOpen(true);
  };

  const isWineOrChampagne = pendingProduct && ['Wine', 'Champagne', 'Red Wine', 'White Wine'].includes(pendingProduct.category);

  const cartItemCount = occupiedOrder?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const OrderSummaryPanel = () => (
    <div className={`flex flex-col h-full bg-white shadow-xl z-[80]`}>
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center shrink-0">
            <h2 className="font-black text-lg text-gray-800 uppercase tracking-tight">Active Ticket</h2>
            <button onClick={() => setIsMobileCartVisible(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-900"><X /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {occupiedOrder?.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start border-b border-gray-50 pb-3">
              <div className="flex gap-3">
                 <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs shrink-0">{item.quantity}x</div>
                 <div><p className="font-bold text-sm text-gray-800 leading-tight">{item.product.name}</p><p className="text-[10px] text-gray-400 font-bold uppercase mt-1">@ {item.product.price.toLocaleString()}</p></div>
              </div>
              <div className="font-black text-gray-900 text-sm">{(item.quantity * item.product.price).toLocaleString()}</div>
            </div>
          ))}
          {!occupiedOrder?.items.length && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
                  <ShoppingBag className="w-16 h-16 mb-4" />
                  <p className="font-black uppercase text-xs">Empty Order</p>
              </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0">
          <div className="flex justify-between items-center mb-6">
              <span className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Grand Total</span>
              <span className="font-black text-3xl text-gray-900 tracking-tighter">
                  <span className="text-xs text-blue-400 mr-2 uppercase">{systemConfig.currency}</span>
                  {occupiedOrder?.grandTotal.toLocaleString() || '0'}
              </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setOccupiedOrder(null); setIsMobileCartVisible(false); }} disabled={!occupiedOrder} className="py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-red-100 active:scale-95 transition-all">Clear</button>
            <button onClick={() => { if(occupiedOrder) onUpdateOrder(occupiedOrder); setOccupiedOrder(null); setIsMobileCartVisible(false); }} disabled={!occupiedOrder} className="py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-100 active:scale-95 transition-all">Park</button>
            <button onClick={handleStartPreview} disabled={!occupiedOrder} className="col-span-2 py-5 bg-green-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95 transition-all"><Printer className="w-5 h-5" /> Print Receipt</button>
          </div>
        </div>
    </div>
  );

  return (
    <div className="flex h-full bg-gray-100 font-sans relative overflow-hidden">
      {stockError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[300] bg-red-600 text-white px-6 py-3 rounded-full font-black shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
              <AlertTriangle className="w-5 h-5" /> {stockError}
              <button onClick={() => setStockError(null)} className="p-1 hover:bg-red-50 rounded-full transition-colors"><X className="w-4 h-4"/></button>
          </div>
      )}

      {/* Main Product Feed */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
        
        {/* SCROLLABLE CATEGORIES */}
        <div className="relative flex items-center mb-6 group/catstrip">
            <button 
                onClick={() => scrollCats('L')}
                className="absolute left-0 z-20 p-2 bg-white/90 rounded-full shadow-lg border border-gray-100 text-gray-400 hover:text-blue-600 transition-all opacity-0 lg:group-hover/catstrip:opacity-100 -translate-x-2"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-100 to-transparent z-10 pointer-events-none"></div>

            <div 
                ref={catScrollRef}
                className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth px-10 py-1"
            >
                {categories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)} 
                        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-100 to-transparent z-10 pointer-events-none"></div>

            <button 
                onClick={() => scrollCats('R')}
                className="absolute right-0 z-20 p-2 bg-white/90 rounded-full shadow-lg border border-gray-100 text-gray-400 hover:text-blue-600 transition-all opacity-0 lg:group-hover/catstrip:opacity-100 translate-x-2"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 pb-24 custom-scrollbar">
          {filteredProducts.map(product => (
              <button 
                key={product.id} 
                onClick={() => handleItemClick(product)} 
                className="bg-white p-4 rounded-3xl shadow-sm hover:shadow-xl transition-all text-left flex flex-col h-44 group relative overflow-hidden border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-800 text-sm leading-tight line-clamp-2 uppercase tracking-tight">{product.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{product.category}</p>
                </div>
                <div className="mt-auto flex justify-between items-end">
                    <div className="font-black text-blue-600 text-lg leading-none">
                        <span className="text-[10px] opacity-40 mr-1">{systemConfig.currency}</span>
                        {product.price.toLocaleString()}
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Plus className="w-4 h-4" />
                    </div>
                </div>
              </button>
          ))}
        </div>
      </div>

      {/* Side Cart (Desktop) */}
      <div className="hidden lg:flex w-96 border-l border-gray-200 h-full">
        <OrderSummaryPanel />
      </div>

      {/* Mobile Cart Overlay */}
      {isMobileCartVisible && (
          <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileCartVisible(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-[400px] animate-in slide-in-from-right-full duration-500 shadow-2xl">
                  <OrderSummaryPanel />
              </div>
          </div>
      )}

      {/* Mobile Floating Action Button (Cart) */}
      {occupiedOrder && !isMobileCartVisible && (
          <button 
            onClick={() => setIsMobileCartVisible(true)}
            className="lg:hidden fixed bottom-6 right-6 p-6 bg-[#2563eb] text-white rounded-full shadow-2xl z-[90] flex items-center gap-3 animate-bounce active:scale-90 transition-all border-4 border-white/20"
          >
              <ShoppingCart className="w-7 h-7" />
              <div className="flex flex-col items-start leading-none pr-1">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Review Bill</span>
                <span className="font-black text-lg">{cartItemCount} Items</span>
              </div>
              <ArrowRight className="w-5 h-5 ml-1 opacity-50" />
          </button>
      )}

      <ReceiptPreviewModal 
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          order={occupiedOrder}
          systemConfig={systemConfig}
          type="RECEIPT"
          onConfirm={handleProcessFinish}
          printedBy={currentUser?.name || "System Admin"}
      />

      {/* Bottle/Measure Modals (Already Responsive) */}
      {bottleSelectModalOpen && activeBottlePour && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 animate-in zoom-in-95">
                  <h3 className="text-xl font-black uppercase text-slate-900 mb-2">Bottle Match</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-6">Select bottle for {activeBottlePour.product.name}</p>
                  
                  {!['WINE', 'CHAMPAGNE'].includes(activeBottlePour.product.category.toUpperCase()) && !activeBottlePour.variantName.includes('Bottle') && (
                      <div className="mb-6 space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-center">Pour Type</label>
                        <div className="flex bg-slate-100 p-1 rounded-2xl">
                            <button onClick={() => setSpiritConsumptionMode('DIRECT')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${spiritConsumptionMode === 'DIRECT' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>Direct</button>
                            <button onClick={() => setSpiritConsumptionMode('COCKTAIL')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${spiritConsumptionMode === 'COCKTAIL' ? 'bg-white text-pink-600 shadow-md' : 'text-slate-400'}`}>Cocktail</button>
                        </div>
                      </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2 mb-6">
                      {bottles.filter(b => b.status === 'OPEN' && b.name.toLowerCase().includes(activeBottlePour.product.name.toLowerCase())).map(bottle => (
                          <button key={bottle.id} onClick={() => confirmBottlePour(bottle.id)} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-2xl transition-all">
                              <span className="font-bold text-gray-800 text-sm">{bottle.name}</span>
                              <span className="font-black text-blue-600 text-xs">{bottle.currentVolume}ml Left</span>
                          </button>
                      ))}
                  </div>
                  <button onClick={() => { setBottleSelectModalOpen(false); setActiveBottlePour(null); }} className="w-full py-4 text-gray-400 font-bold uppercase text-xs">Cancel</button>
              </div>
          </div>
      )}

      {measureModalOpen && pendingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-sm rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95">
                  <div className="text-center mb-6"><h3 className="text-xl font-black text-gray-800">{pendingProduct.name}</h3><p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-1">Select Measure</p></div>
                  <div className="grid grid-cols-1 gap-3">
                      {pendingProduct.spiritPrices?.single && <button onClick={() => addItemToCart(pendingProduct, isWineOrChampagne ? "Glass" : "Single Tot", pendingProduct.spiritPrices?.single)} className="flex justify-between items-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all group"><span className="font-bold text-gray-700">{isWineOrChampagne ? "Glass" : "Single Tot"}</span><span className="font-black text-blue-700">{systemConfig.currency} {pendingProduct.spiritPrices.single.toLocaleString()}</span></button>}
                      {pendingProduct.spiritPrices?.double && <button onClick={() => addItemToCart(pendingProduct, "Double Tot", pendingProduct.spiritPrices?.double)} className="flex justify-between items-center p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all group"><span className="font-bold text-gray-700">Double Tot</span><span className="font-black text-purple-700">{systemConfig.currency} {pendingProduct.spiritPrices.double.toLocaleString()}</span></button>}
                      <button onClick={() => addItemToCart(pendingProduct, "Full Bottle", pendingProduct.spiritPrices?.full || pendingProduct.price)} className="flex justify-between items-center p-4 bg-green-50 hover:bg-green-100 border-green-200 rounded-xl transition-all group"><span className="font-bold text-gray-700">Full Bottle</span><span className="font-black text-green-700">{systemConfig.currency} {(pendingProduct.spiritPrices?.full || pendingProduct.price).toLocaleString()}</span></button>
                  </div>
                  <button onClick={() => setMeasureModalOpen(false)} className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold uppercase text-xs">Cancel</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default SellView;