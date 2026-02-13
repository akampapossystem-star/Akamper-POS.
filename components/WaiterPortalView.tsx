
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Utensils, Coffee, Search, ShoppingCart, LogOut, ArrowLeft, 
  Trash2, Send, Plus, Minus, ChefHat, X, CheckCircle2, Beer, Printer, CheckSquare, Square,
  LayoutGrid, Armchair, Wine, GlassWater, Clock, Receipt, Calendar, ChevronRight, User, MessageSquare, Edit3, Image as ImageIcon,
  StickyNote
} from 'lucide-react';
import { Order, Product, SystemConfig, StaffMember, Table, OrderItem, AppView, SpiritBottle } from '../types';
import { printReceipt } from '../services/receiptService';

interface WaiterPortalViewProps {
  orders: Order[];
  products: Product[];
  systemConfig: SystemConfig;
  currentUser: StaffMember | null;
  staff: StaffMember[];
  tables: Table[];
  onLogout: () => void;
  onNavigate: (view: AppView) => void;
  onPlaceOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string, reason: string) => void;
  onItemReturn: (orderId: string, timestamp: Date, items: OrderItem[], refund: number, reason: string) => void;
  bottles?: SpiritBottle[];
  onUpdateBottles?: (bottles: SpiritBottle[]) => void;
}

const COMMON_NOTES = ["No Salt", "Less Sugar", "Spicy", "No Ice", "Well Done", "Medium Rare", "Extra Sauce", "Takeaway", "No Onions", "Hot"];

const WaiterPortalView: React.FC<WaiterPortalViewProps> = ({ 
  orders, products, systemConfig, currentUser, tables, onLogout, onPlaceOrder, onUpdateOrder
}) => {
  const [activeTab, setActiveTab] = useState<'TABLES' | 'MENU' | 'MY_ORDERS'>('TABLES');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Measure Modal
  const [measureModalOpen, setMeasureModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  // Note/Comment Modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  // Section State
  const [activeSection, setActiveSection] = useState<string>('');

  // Categories
  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return products.filter(p => {
      if (searchTerm) {
          const nameMatch = p.name.toLowerCase().includes(lowerTerm);
          const categoryMatch = p.category.toLowerCase().includes(lowerTerm);
          return nameMatch || categoryMatch;
      }
      return selectedCategory === 'All' || p.category === selectedCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Derived Table Data
  const activeTables = useMemo(() => {
      return tables.map(t => {
          const isOccupied = orders.some(o => o.table === t.name && !['paid', 'cancelled', 'merged'].includes(o.status));
          return { ...t, isOccupied };
      });
  }, [tables, orders]);

  // Group tables by section
  const tablesBySection = useMemo(() => {
      const groups: Record<string, typeof activeTables> = {};
      activeTables.forEach(t => {
          const sectionName = t.section || 'General Area';
          if (!groups[sectionName]) {
              groups[sectionName] = [];
          }
          groups[sectionName].push(t);
      });
      return groups;
  }, [activeTables]);

  const sortedSections = useMemo(() => Object.keys(tablesBySection).sort(), [tablesBySection]);

  // "My Orders Today"
  const myOrders = useMemo(() => {
      const today = new Date().toDateString();
      const currentUserName = currentUser?.name;
      return orders.filter(o => {
          const isMyOrder = o.staffName === currentUserName;
          const isToday = new Date(o.timestamp).toDateString() === today;
          return isMyOrder && isToday;
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [orders, currentUser]);

  // Initialize active section
  useEffect(() => {
      if (sortedSections.length > 0 && (!activeSection || !sortedSections.includes(activeSection))) {
          setActiveSection(sortedSections[0]);
      }
  }, [sortedSections, activeSection]);

  // Handle Table Selection
  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    // Check for active order
    const existingOrder = orders.find(o => o.table === table.name && !['paid', 'completed', 'cancelled', 'merged'].includes(o.status));
    
    if (existingOrder) {
      const loadedOrder = {
          ...existingOrder,
          items: existingOrder.items.map(item => ({ ...item, isPrintPending: false }))
      };
      setCurrentOrder(loadedOrder);
    } else {
      // New Order Stub
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        tenantId: systemConfig.tenantId,
        customerName: `Table ${table.name}`,
        table: table.name,
        items: [],
        status: 'pending',
        timestamp: new Date(),
        isKitchenOrder: false, // Default to FALSE. Set true only if sent to kitchen.
        grandTotal: 0,
        amountPaid: 0,
        staffName: currentUser?.name,
        staffRole: currentUser?.role || 'WAITER'
      };
      setCurrentOrder(newOrder);
    }
    setActiveTab('MENU');
  };

  const handleResumeOrder = (order: Order) => {
      const table = tables.find(t => t.name === order.table);
      if (table) setSelectedTable(table);
      setCurrentOrder(order);
      setActiveTab('MENU');
  };

  const handleItemClick = (product: Product) => {
      const isSpiritOrWine = product.spiritConfig?.isSpirit || 
                             product.category === 'Wine' || 
                             product.category === 'Champagne' || 
                             product.category === 'Whiskey';

      if (isSpiritOrWine && product.spiritPrices) {
          setPendingProduct(product);
          setMeasureModalOpen(true);
      } else {
          handleAddToOrder(product);
      }
  };

  const handleAddToOrder = (product: Product, variantName?: string, variantPrice?: number) => {
      if (!currentOrder) return;
      
      const price = variantPrice || product.price;
      const name = variantName ? `${product.name} (${variantName})` : product.name;
      
      // Check if item exists in current cart
      const existingIdx = currentOrder.items.findIndex(i => i.product.id === product.id && i.product.name === name);
      
      let newItems = [...currentOrder.items];
      if (existingIdx >= 0) {
          // Increment
          const existingItem = newItems[existingIdx];
          newItems[existingIdx] = {
              ...existingItem,
              quantity: existingItem.quantity + 1,
              isNew: true // Mark as new/updated
          };
      } else {
          // Add new
          newItems.push({
              product: { ...product, name, price },
              quantity: 1,
              isNew: true,
              note: ''
          });
      }
      
      const newTotal = newItems.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
      
      setCurrentOrder({
          ...currentOrder,
          items: newItems,
          grandTotal: newTotal
      });
      
      setMeasureModalOpen(false);
      setPendingProduct(null);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
      if (!currentOrder) return;
      const newItems = [...currentOrder.items];
      const item = newItems[index];
      const newQty = item.quantity + delta;

      if (newQty <= 0) {
          newItems.splice(index, 1);
      } else {
          newItems[index] = { ...item, quantity: newQty, isNew: true };
      }

      const newTotal = newItems.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
      setCurrentOrder({ ...currentOrder, items: newItems, grandTotal: newTotal });
  };

  // --- NOTE / COMMENT LOGIC ---
  const handleOpenNoteModal = (index: number) => {
      if (!currentOrder) return;
      setEditingItemIndex(index);
      setNoteText(currentOrder.items[index].note || '');
      setNoteModalOpen(true);
  };

  const handleSaveNote = () => {
      if (!currentOrder || editingItemIndex === null) return;
      const newItems = [...currentOrder.items];
      newItems[editingItemIndex] = {
          ...newItems[editingItemIndex],
          note: noteText,
          isNew: true // Mark as changed so kitchen sees the update
      };
      setCurrentOrder({ ...currentOrder, items: newItems });
      setNoteModalOpen(false);
      setEditingItemIndex(null);
      setNoteText('');
  };

  const handleQuickTag = (tag: string) => {
      setNoteText(prev => prev ? `${prev}, ${tag}` : tag);
  };

  const handleSendOrder = (destination: 'KITCHEN' | 'BAR') => {
      if (!currentOrder) return;

      const isKitchen = destination === 'KITCHEN' ? true : currentOrder.isKitchenOrder;

      const orderToSave: Order = {
          ...currentOrder,
          status: 'pending',
          isKitchenOrder: isKitchen,
          timestamp: new Date()
      };

      if (orders.find(o => o.id === orderToSave.id)) {
          onUpdateOrder(orderToSave);
      } else {
          onPlaceOrder(orderToSave);
      }

      // Reset View
      setSelectedTable(null);
      setCurrentOrder(null);
      setActiveTab('TABLES');
  };

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5] overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="h-16 bg-[#1e293b] flex items-center justify-between px-4 shrink-0 shadow-md z-30 text-white">
          <div className="flex items-center gap-4">
              <button 
                  onClick={onLogout}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Logout"
              >
                  <LogOut className="w-5 h-5 text-red-400" />
              </button>
              
              <div className="h-8 w-px bg-white/20"></div>

              <button 
                  onClick={() => setActiveTab('TABLES')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'TABLES' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
              >
                  <LayoutGrid className="w-4 h-4" /> Tables
              </button>
              <button 
                  onClick={() => setActiveTab('MY_ORDERS')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'MY_ORDERS' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
              >
                  <Receipt className="w-4 h-4" /> My Orders
              </button>
          </div>

          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                  <User className="w-3 h-3 text-green-400" />
                  <span className="text-xs font-bold">{currentUser?.name || 'Waiter'}</span>
              </div>
          </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
          
          {/* VIEW: TABLES */}
          {activeTab === 'TABLES' && (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                  <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {sortedSections.map(sec => (
                          <button
                              key={sec}
                              onClick={() => setActiveSection(sec)}
                              className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider shadow-sm transition-all whitespace-nowrap ${
                                  activeSection === sec 
                                      ? 'bg-[#3b82f6] text-white shadow-blue-200' 
                                      : 'bg-white text-gray-500 hover:bg-gray-50'
                              }`}
                          >
                              {sec}
                          </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-20">
                          {activeTables.filter(t => (t.section || 'General Area') === activeSection).map(table => (
                              <button
                                  key={table.id}
                                  onClick={() => handleTableSelect(table)}
                                  className={`relative aspect-square rounded-[2rem] flex flex-col items-center justify-center transition-all hover:scale-105 shadow-sm border-4 ${
                                      table.isOccupied 
                                          ? 'bg-red-50 border-red-200 text-red-600' 
                                          : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'
                                  }`}
                              >
                                  <span className="text-3xl font-black">{table.name}</span>
                                  <span className="text-[10px] font-bold uppercase mt-1 opacity-60">{table.seats} Seats</span>
                                  {table.isOccupied && (
                                      <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-200"></div>
                                  )}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* VIEW: MY ORDERS */}
          {activeTab === 'MY_ORDERS' && (
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-6">My Active Orders</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myOrders.length === 0 ? (
                          <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase">No active orders found today.</div>
                      ) : (
                          myOrders.map(order => (
                              <div key={order.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                                  <div className="flex justify-between items-start mb-4">
                                      <div>
                                          <h3 className="text-xl font-black text-gray-800">{order.table}</h3>
                                          <p className="text-xs font-bold text-gray-400">#{order.id.slice(-4)}</p>
                                      </div>
                                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                                          order.status === 'ready' ? 'bg-green-100 text-green-700' : 
                                          order.status === 'preparing' ? 'bg-blue-100 text-blue-700' : 
                                          'bg-gray-100 text-gray-600'
                                      }`}>
                                          {order.status}
                                      </span>
                                  </div>
                                  <div className="space-y-1 mb-4">
                                      {order.items.slice(0, 3).map((item, i) => (
                                          <div key={i} className="flex justify-between text-sm text-gray-600">
                                              <span>{item.quantity}x {item.product.name}</span>
                                          </div>
                                      ))}
                                      {order.items.length > 3 && <p className="text-xs text-gray-400 italic">...and {order.items.length - 3} more</p>}
                                  </div>
                                  <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                                      <span className="font-black text-lg text-gray-900">{systemConfig.currency} {order.grandTotal.toLocaleString()}</span>
                                      <button 
                                          onClick={() => handleResumeOrder(order)}
                                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-blue-700 transition-colors"
                                      >
                                          Modify
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}

          {/* VIEW: MENU & CART (SPLIT SCREEN) */}
          {activeTab === 'MENU' && currentOrder && (
              <div className="flex-1 flex overflow-hidden">
                  
                  {/* LEFT: MENU */}
                  <div className="flex-1 flex flex-col bg-white border-r border-gray-200 min-w-0">
                      {/* Search & Cats */}
                      <div className="p-4 border-b border-gray-200 space-y-4">
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input 
                                  autoFocus
                                  value={searchTerm}
                                  onChange={e => setSearchTerm(e.target.value)}
                                  placeholder="Search menu..." 
                                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                          </div>
                          <div className="flex gap-2 overflow-x-auto no-scrollbar">
                              {categories.map(cat => (
                                  <button
                                      key={cat}
                                      onClick={() => setSelectedCategory(cat)}
                                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase whitespace-nowrap transition-all border ${
                                          selectedCategory === cat 
                                              ? 'bg-blue-600 text-white border-blue-600' 
                                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                      }`}
                                  >
                                      {cat}
                                  </button>
                              ))}
                          </div>
                      </div>

                      {/* Products Grid */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-gray-50/50">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                              {filteredProducts.map(product => (
                                  <button 
                                      key={product.id} 
                                      onClick={() => handleItemClick(product)}
                                      className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col text-left hover:shadow-md transition-all group h-40"
                                  >
                                      <div className="flex-1 w-full bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                                          {product.image ? (
                                              <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils className="w-6 h-6" /></div>
                                          )}
                                          <div className="absolute top-1 right-1 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[9px] font-bold text-gray-600 uppercase shadow-sm">
                                              {product.stock > 0 ? product.stock : '-'}
                                          </div>
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-gray-800 text-xs leading-tight line-clamp-2 mb-1">{product.name}</h4>
                                          <span className="font-black text-blue-600 text-sm">{product.price.toLocaleString()}</span>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* RIGHT: CART */}
                  <div className="w-[350px] lg:w-[400px] bg-white flex flex-col shadow-2xl z-20 border-l border-gray-200 shrink-0">
                      
                      {/* Cart Header */}
                      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                          <div>
                              <h2 className="text-2xl font-black uppercase text-gray-800 tracking-tighter">{currentOrder.table}</h2>
                              <p className="text-xs font-bold text-gray-400 uppercase">Current Order</p>
                          </div>
                          <button onClick={() => { setCurrentOrder(null); setActiveTab('TABLES'); }} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                              <X className="w-5 h-5" />
                          </button>
                      </div>

                      {/* Items */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                          {currentOrder.items.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-100 transition-colors shadow-sm">
                                  <div className="flex flex-col items-center gap-1 bg-gray-50 p-1 rounded-lg">
                                      <button onClick={() => handleUpdateQuantity(idx, 1)} className="p-1 hover:bg-green-100 text-green-600 rounded"><Plus className="w-3 h-3" /></button>
                                      <span className="text-sm font-black text-gray-800">{item.quantity}</span>
                                      <button onClick={() => handleUpdateQuantity(idx, -1)} className="p-1 hover:bg-red-100 text-red-600 rounded"><Minus className="w-3 h-3" /></button>
                                  </div>
                                  <div className="flex-1 pt-1">
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <h4 className="font-bold text-gray-800 text-sm leading-tight">{item.product.name}</h4>
                                              <div className="flex items-center gap-2 mt-1">
                                                  <button 
                                                    onClick={() => handleOpenNoteModal(idx)}
                                                    className="text-[10px] text-blue-500 hover:bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors"
                                                  >
                                                      <Edit3 className="w-3 h-3" /> {item.note ? 'Edit Note' : 'Add Note'}
                                                  </button>
                                                  {item.note && (
                                                      <span className="text-[10px] text-red-500 font-bold italic truncate max-w-[120px]">
                                                          * {item.note}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                          <span className="font-bold text-gray-900 text-sm">{(item.quantity * item.product.price).toLocaleString()}</span>
                                      </div>
                                      <p className="text-[10px] text-gray-400 font-medium">@ {item.product.price.toLocaleString()}</p>
                                  </div>
                              </div>
                          ))}
                          {currentOrder.items.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                  <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
                                  <p className="font-black text-xs uppercase tracking-widest">Cart Empty</p>
                              </div>
                          )}
                      </div>

                      {/* Footer Actions */}
                      <div className="p-6 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                          <div className="flex justify-between items-center mb-6">
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Amount</span>
                              <span className="text-3xl font-black text-gray-900 tracking-tight">
                                  <span className="text-lg text-gray-400 mr-1 font-medium">{systemConfig.currency}</span>
                                  {currentOrder.grandTotal.toLocaleString()}
                              </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                              {/* TO KITCHEN BUTTON */}
                              <button 
                                  onClick={() => handleSendOrder('KITCHEN')}
                                  disabled={currentOrder.items.length === 0}
                                  className="py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-orange-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                              >
                                  <ChefHat className="w-5 h-5" /> To Kitchen
                              </button>

                              {/* TO BARMAN BUTTON */}
                              <button 
                                  onClick={() => handleSendOrder('BAR')}
                                  disabled={currentOrder.items.length === 0}
                                  className="py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-purple-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                              >
                                  <Beer className="w-5 h-5" /> To Barman
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}

      </div>

      {/* NOTE / COMMENT MODAL */}
      {noteModalOpen && editingItemIndex !== null && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-xl font-black text-gray-800">Add Item Note</h3>
                          <p className="text-sm text-gray-500 font-bold">
                              {currentOrder?.items[editingItemIndex].product.name}
                          </p>
                      </div>
                      <button onClick={() => setNoteModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
                  </div>

                  <div className="space-y-4">
                      <textarea 
                          autoFocus
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm text-gray-800 resize-none placeholder:text-gray-400"
                          placeholder="Type instructions here (e.g. No Sugar, Extra Spicy)..."
                      />
                      
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quick Tags</p>
                          <div className="flex flex-wrap gap-2">
                              {COMMON_NOTES.map(tag => (
                                  <button
                                      key={tag}
                                      onClick={() => handleQuickTag(tag)}
                                      className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-xs font-bold text-gray-600 transition-colors border border-gray-200"
                                  >
                                      {tag}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                          <button 
                              onClick={() => setNoteText('')}
                              className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase hover:bg-gray-200 transition-colors"
                          >
                              Clear
                          </button>
                          <button 
                              onClick={handleSaveNote}
                              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                          >
                              Save Note
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MEASURE MODAL */}
      {measureModalOpen && pendingProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95">
                  <div className="text-center mb-6">
                      <h3 className="text-xl font-black text-gray-800">{pendingProduct.name}</h3>
                      <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-1">Select Measure</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                      {pendingProduct.spiritPrices?.single ? (
                          <button 
                            onClick={() => handleAddToOrder(pendingProduct, "Single Tot", pendingProduct.spiritPrices?.single)}
                            className="flex justify-between items-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all group"
                          >
                              <span className="font-bold text-gray-700">Single / Glass</span>
                              <span className="font-black text-blue-700">{systemConfig.currency} {pendingProduct.spiritPrices.single.toLocaleString()}</span>
                          </button>
                      ) : null}

                      {pendingProduct.spiritPrices?.double ? (
                          <button 
                            onClick={() => handleAddToOrder(pendingProduct, "Double Tot", pendingProduct.spiritPrices?.double)}
                            className="flex justify-between items-center p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all group"
                          >
                              <span className="font-bold text-gray-700">Double Tot</span>
                              <span className="font-black text-purple-700">{systemConfig.currency} {pendingProduct.spiritPrices.double.toLocaleString()}</span>
                          </button>
                      ) : null}

                      <button 
                        onClick={() => handleAddToOrder(pendingProduct, "Bottle", pendingProduct.spiritPrices?.full || pendingProduct.price)}
                        className="flex justify-between items-center p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all group"
                      >
                          <span className="font-bold text-gray-700">Full Bottle</span>
                          <span className="font-black text-green-700">{systemConfig.currency} {(pendingProduct.spiritPrices?.full || pendingProduct.price).toLocaleString()}</span>
                      </button>
                  </div>

                  <button onClick={() => setMeasureModalOpen(false)} className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold uppercase text-xs">Cancel</button>
              </div>
          </div>
      )}

    </div>
  );
};

export default WaiterPortalView;
