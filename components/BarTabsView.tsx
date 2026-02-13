
import React, { useState, useMemo } from 'react';
import { 
  Search, Beer, User, Lock, Printer, FileText, AlertTriangle, 
  Wine, ChefHat, ArrowLeft, Trash2, LayoutGrid, Map as MapIcon,
  ChevronRight
} from 'lucide-react';
import { Order, Product, SystemConfig, StaffMember, Table } from '../types';
import { printReceipt } from '../services/receiptService';

interface BarTabsViewProps {
  orders: Order[];
  products: Product[];
  systemConfig: SystemConfig;
  currentUser: StaffMember | null;
  onUpdateOrder: (order: Order) => void;
  onPlaceOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string, reason: string) => void;
  tables: Table[]; 
}

// Categories matched from the image
const CATEGORY_ORDER = ['ALL', 'BRANDY', 'DRINKS', 'GIN', 'LIQUEUR', 'RUM', 'WHISKEY', 'WINE', 'VODKA', 'TEQUILA', 'FOOD'];

const BarTabsView: React.FC<BarTabsViewProps> = ({ 
  orders = [], 
  products = [], 
  systemConfig, 
  currentUser, 
  onUpdateOrder, 
  onPlaceOrder, 
  onDeleteOrder, 
  tables = [] 
}) => {
  const [viewMode, setViewMode] = useState<'MAP' | 'ORDER'>('MAP');
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('Garden 1'); // Default from image
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Void/Delete Modal State
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [itemToVoidIndex, setItemToVoidIndex] = useState<number | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Active Orders (Not paid/completed)
  const activeTabs = useMemo(() => {
    return (orders || []).filter(o => !['paid', 'completed', 'cancelled', 'merged'].includes(o.status));
  }, [orders]);

  const currentTab = activeTabs.find(o => o.id === activeTabId);

  // --- DERIVED DATA ---
  
  // 1. Sections from Tables
  const sections = useMemo(() => {
      const distinct = Array.from(new Set(tables.map(t => t.section || 'General'))).sort();
      return distinct.length > 0 ? distinct : ['General'];
  }, [tables]);

  // 2. Visible Tables
  const visibleTables = useMemo(() => {
      return tables.filter(t => (t.section || 'General') === activeSection);
  }, [tables, activeSection]);

  // 3. Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category Match
      let catMatch = true;
      if (selectedCategory !== 'ALL') {
          // Loose matching to handle casing differences
          catMatch = p.category.toUpperCase() === selectedCategory; 
          // Fallback map for common mismatches if necessary
          if (!catMatch && selectedCategory === 'DRINKS' && ['Water', 'Soda', 'Juice'].includes(p.category)) catMatch = true;
      }

      // Search Match
      const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return catMatch && searchMatch;
    });
  }, [products, selectedCategory, searchTerm]);

  // --- ACTIONS ---

  const handleTableClick = (table: Table) => {
      const existingOrder = activeTabs.find(o => o.table === table.name);
      
      if (existingOrder) {
          setActiveTabId(existingOrder.id);
          setViewMode('ORDER');
      } else {
          // Create new Table Order
          const newOrder: Order = {
              id: `TAB-${Date.now()}`,
              tenantId: systemConfig.tenantId,
              customerName: `Table ${table.name}`,
              table: table.name,
              items: [],
              status: 'pending',
              timestamp: new Date(),
              isKitchenOrder: false,
              grandTotal: 0,
              amountPaid: 0,
              staffName: currentUser?.name,
              staffRole: currentUser?.role || 'BARMAN'
          };
          onPlaceOrder(newOrder);
          setActiveTabId(newOrder.id);
          setViewMode('ORDER');
      }
  };

  const addItemToTab = (product: Product) => {
      if (!currentTab) return;
      const existingIdx = currentTab.items.findIndex(i => i.product.id === product.id && !i.note);
      let newItems = [...currentTab.items];
      if (existingIdx >= 0) newItems[existingIdx] = { ...newItems[existingIdx], quantity: newItems[existingIdx].quantity + 1 };
      else newItems.push({ product, quantity: 1 });
      
      const newTotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      onUpdateOrder({ ...currentTab, items: newItems, grandTotal: newTotal });
  };

  const initiateVoidItem = (index: number) => {
      setItemToVoidIndex(index);
      setVoidReason('');
      setIsVoidModalOpen(true);
  };

  const confirmVoidItem = () => {
      if (!currentTab || itemToVoidIndex === null) return;
      const newItems = [...currentTab.items];
      newItems.splice(itemToVoidIndex, 1);
      const newTotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      onUpdateOrder({ ...currentTab, items: newItems, grandTotal: newTotal });
      setIsVoidModalOpen(false);
      setItemToVoidIndex(null);
  };

  const handleSendToKitchen = () => {
      if (!currentTab) return;
      onUpdateOrder({ ...currentTab, status: 'preparing' });
      printReceipt(systemConfig, currentTab, 'KITCHEN');
  };

  const handlePrintKOT = () => {
      if (!currentTab) return;
      printReceipt(systemConfig, currentTab, 'KITCHEN');
  };

  const handlePrintBill = () => {
      if (!currentTab) return;
      printReceipt(systemConfig, currentTab, 'RECEIPT');
  };

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5] overflow-hidden font-sans">
      
      {/* --- HEADER (Purple Bar) --- */}
      <div className="h-12 bg-[#6b4c60] flex items-center justify-between px-4 shrink-0 shadow-md z-30 text-white select-none">
          
          {/* Breadcrumbs */}
          <div className="flex items-center h-full">
              <button 
                  onClick={() => setViewMode('MAP')}
                  className={`px-6 h-full flex items-center justify-center text-sm font-bold transition-colors ${viewMode === 'MAP' ? 'bg-[#513849]' : 'hover:bg-white/10 text-white/70'}`}
              >
                  Plan
              </button>
              
              <div className="h-full w-px bg-white/10"></div>

              <div className={`px-6 h-full flex items-center justify-center text-sm font-bold transition-colors ${viewMode === 'ORDER' ? 'bg-[#513849]' : 'text-white/40'}`}>
                  Table
              </div>

              {/* Specific Table Breadcrumb */}
              {currentTab && viewMode === 'ORDER' && (
                  <>
                    <div className="h-full w-px bg-white/10"></div>
                    <div className="px-6 h-full flex items-center justify-center gap-1 text-sm font-bold bg-[#513849]">
                        <ChevronRight className="w-4 h-4 opacity-50" />
                        {currentTab.table}
                    </div>
                  </>
              )}
          </div>

          <div className="flex items-center gap-4 text-white/90">
              <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-green-500/20 rounded border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Online</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-1.5 rounded border border-white/10">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{currentUser?.name || 'Admin'}</span>
              </div>
              <Lock className="w-4 h-4 opacity-70 cursor-pointer hover:text-white" />
          </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
          
          {/* VIEW: FLOOR PLAN */}
          {viewMode === 'MAP' && (
              <>
                  {/* Section Tabs */}
                  <div className="h-12 bg-white border-b border-gray-200 flex items-center px-2 gap-1 overflow-x-auto no-scrollbar shrink-0">
                      {sections.map(sec => (
                          <button
                              key={sec}
                              onClick={() => setActiveSection(sec)}
                              className={`px-6 py-1.5 mx-1 text-sm font-bold rounded transition-all whitespace-nowrap border ${
                                  activeSection === sec 
                                      ? 'bg-[#e0f2f1] border-[#b2dfdb] text-[#00796b]' 
                                      : 'bg-white border-transparent text-gray-500 hover:bg-gray-50'
                              }`}
                          >
                              {sec}
                          </button>
                      ))}
                      <div className="ml-auto px-4">
                          <button className="text-[#00796b] font-bold text-xs uppercase hover:underline">
                              Edit Sections
                          </button>
                      </div>
                  </div>

                  {/* Canvas */}
                  <div className="flex-1 bg-white relative overflow-hidden p-8 shadow-inner">
                        {/* Background Grid */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
                        </div>

                        {visibleTables.map(table => {
                            const isOccupied = activeTabs.some(o => o.table === table.name);
                            const isRound = table.type === 'round';

                            return (
                                <button
                                    key={table.id}
                                    onClick={() => handleTableClick(table)}
                                    className={`absolute flex flex-col items-center justify-center transition-all hover:scale-105 shadow-sm border-2 ${
                                        isRound ? 'rounded-full w-24 h-24' : 'rounded-xl w-28 h-28'
                                    } ${
                                        isOccupied 
                                            ? 'bg-red-50 border-red-200 text-red-700' 
                                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                    }`}
                                    style={{ 
                                        left: `${table.x}%`, 
                                        top: `${table.y}%`, 
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                >
                                    <span className="font-black text-2xl tracking-tighter">{table.name}</span>
                                    <div className="text-[9px] font-bold mt-1 uppercase opacity-60">
                                        {table.seats} Seats
                                    </div>
                                    
                                    {/* Status Badge Icon */}
                                    <div className={`absolute -top-1 -right-1 p-1 rounded-full shadow-sm text-white ${isOccupied ? 'bg-red-500' : 'bg-green-500'}`}>
                                        {isOccupied ? <Beer className="w-3 h-3 fill-current" /> : <div className="w-3 h-3 rounded-full bg-white/30" />}
                                    </div>
                                </button>
                            );
                        })}
                  </div>
              </>
          )}

          {/* VIEW: ORDER TERMINAL */}
          {viewMode === 'ORDER' && currentTab && (
              <div className="flex-1 flex overflow-hidden">
                  
                  {/* LEFT COLUMN: PRODUCTS */}
                  <div className="flex-1 flex flex-col bg-white border-r border-gray-200 min-w-0">
                      
                      {/* Search */}
                      <div className="p-3 border-b border-gray-200 flex gap-2">
                          <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                  autoFocus
                                  value={searchTerm}
                                  onChange={e => setSearchTerm(e.target.value)}
                                  placeholder="Search products..." 
                                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-[#6b4c60] outline-none"
                              />
                          </div>
                      </div>

                      {/* Dark Category Bar (Scrollable) */}
                      <div className="bg-[#212529] text-gray-400 flex items-center overflow-x-auto no-scrollbar shadow-inner shrink-0 h-12">
                          {CATEGORY_ORDER.map(cat => (
                              <button
                                  key={cat}
                                  onClick={() => setSelectedCategory(cat)}
                                  className={`h-full px-5 text-[11px] font-bold uppercase whitespace-nowrap transition-colors border-b-4 hover:bg-white/5 hover:text-white ${
                                      selectedCategory === cat 
                                          ? 'border-white bg-white/10 text-white' 
                                          : 'border-transparent'
                                  }`}
                              >
                                  {cat}
                              </button>
                          ))}
                      </div>

                      {/* Product Grid (Dense) */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-[#f8f9fa]">
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                              {filteredProducts.map(product => (
                                  <button 
                                      key={product.id} 
                                      onClick={() => addItemToTab(product)}
                                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col text-left hover:shadow-md transition-shadow h-32 group"
                                  >
                                      <div className="h-16 bg-gray-100 relative overflow-hidden w-full">
                                          {product.image && (
                                              <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                                          )}
                                          {/* Stock Badge */}
                                          <div className="absolute top-1 right-1 bg-black/60 backdrop-blur text-white text-[9px] font-bold px-1.5 rounded-sm">
                                              {product.stock > 0 ? product.stock : '-'}
                                          </div>
                                      </div>
                                      <div className="p-2 flex-1 flex flex-col justify-between w-full">
                                          <span className="font-bold text-gray-800 text-[10px] leading-tight line-clamp-2">
                                              {product.name}
                                          </span>
                                          <span className="font-black text-[#6b4c60] text-[11px]">
                                              {product.price.toLocaleString()}
                                          </span>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* RIGHT COLUMN: BILL / CART */}
                  <div className="w-[350px] lg:w-[380px] bg-white flex flex-col shadow-2xl z-20 border-l border-gray-200 shrink-0">
                      
                      {/* Header */}
                      <div className="p-5 border-b border-gray-200 bg-gray-50/50">
                          <h2 className="text-2xl font-black uppercase text-gray-800 tracking-tighter">Table {currentTab.table}</h2>
                          <div className="flex justify-between items-center mt-1 text-xs text-gray-500 font-bold">
                              <span className="flex items-center gap-1"><User className="w-3 h-3"/> {currentUser?.name || 'Staff'}</span>
                              <span>{new Date(currentTab.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                      </div>

                      {/* Items List */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                          <div className="space-y-1">
                              {currentTab.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-start p-2 hover:bg-red-50 rounded-lg group transition-colors cursor-pointer border border-transparent hover:border-red-100">
                                      <div className="flex-1 pr-2">
                                          <div className="flex gap-2 items-start">
                                              <span className="font-black text-green-600 text-sm min-w-[20px]">{item.quantity}</span>
                                              <div>
                                                  <span className="font-bold text-gray-700 text-sm block leading-tight">{item.product.name}</span>
                                                  <span className="text-[10px] text-gray-400 font-medium">@ {item.product.price.toLocaleString()}</span>
                                              </div>
                                          </div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                          <span className="font-black text-gray-800 text-sm">
                                              {(item.quantity * item.product.price).toLocaleString()}
                                          </span>
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); initiateVoidItem(idx); }}
                                              className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                          >
                                              <Trash2 className="w-3 h-3" />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              {currentTab.items.length === 0 && (
                                  <div className="p-8 text-center text-gray-400 text-xs font-bold uppercase">
                                      Cart is empty
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <div className="flex justify-between items-center mb-4 px-2">
                              <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Total</span>
                              <span className="text-3xl font-black text-gray-900 tracking-tight">
                                  <span className="text-sm text-gray-400 align-top mr-1 font-medium">{systemConfig.currency}</span>
                                  {currentTab.grandTotal.toLocaleString()}
                              </span>
                          </div>

                          <div className="space-y-2">
                              {/* Primary Action */}
                              <button 
                                  onClick={handleSendToKitchen}
                                  className="w-full py-4 bg-[#0097a7] hover:bg-[#00838f] text-white rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 active:scale-95 transition-all"
                              >
                                  <ChefHat className="w-5 h-5" /> Send to Kitchen
                              </button>

                              <div className="grid grid-cols-2 gap-2">
                                  <button 
                                      onClick={handlePrintKOT}
                                      className="py-3 bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95"
                                  >
                                      <Printer className="w-4 h-4" /> Token
                                  </button>
                                  
                                  <button 
                                      onClick={handlePrintBill}
                                      className="py-3 bg-[#374151] hover:bg-[#1f2937] text-white rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                                  >
                                      <FileText className="w-4 h-4" /> Bill
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* Security Void Modal */}
      {isVoidModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 border border-gray-200">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                          <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-gray-800">Void Item</h3>
                      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                          Manager Authorization Required
                      </p>
                  </div>
                  <div className="space-y-4">
                      <textarea 
                          autoFocus 
                          value={voidReason} 
                          onChange={e => setVoidReason(e.target.value)} 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-bold text-sm outline-none focus:border-red-500 h-24 resize-none placeholder:text-gray-400" 
                          placeholder="Reason for removal..." 
                      />
                      <div className="flex gap-3">
                          <button onClick={() => setIsVoidModalOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase transition-colors">Cancel</button>
                          <button 
                            disabled={!voidReason.trim()} 
                            onClick={confirmVoidItem} 
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase shadow-lg shadow-red-900/20 disabled:opacity-50 transition-colors"
                          >
                            Confirm
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default BarTabsView;
