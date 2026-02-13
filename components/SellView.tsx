
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Grid, User, Coffee, Utensils, X, Trash2, Printer, Save, RefreshCw, Plus, Minus, Search, ChevronLeft, CreditCard, Banknote, Smartphone, Briefcase, LayoutGrid, Wine, GlassWater, Beer, Eye } from 'lucide-react';
import { Order, SystemConfig, UserRole, RegisterState, Product, Table, Customer, StaffMember, SpiritBottle, OrderItem } from '../types';
import { printReceipt, generateReceiptHtml } from '../services/receiptService';

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
  
  // Measure Selection State
  const [measureModalOpen, setMeasureModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  // Preview State
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Dummy logic for categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Initiate add - checks if measure selection is needed
  const handleItemClick = (product: Product) => {
      // Check if item is a spirit/wine that needs measure selection
      const isSpiritOrWine = product.spiritConfig?.isSpirit || 
                             product.category === 'Wine' || 
                             product.category === 'Champagne' || 
                             product.category === 'Whiskey' || 
                             product.category === 'Vodka' ||
                             product.category === 'Gin' ||
                             product.category === 'Rum' ||
                             product.category === 'Tequila' ||
                             product.category === 'Liqueur' ||
                             product.category === 'Brandy';

      if (isSpiritOrWine && product.spiritPrices) {
          setPendingProduct(product);
          setMeasureModalOpen(true);
      } else {
          // Standard product
          addItemToCart(product);
      }
  };

  const addItemToCart = (product: Product, variantName?: string, variantPrice?: number) => {
    // If a variant is selected (e.g. Glass of Wine), we create a temporary product object for the cart
    const cartProduct = variantName ? {
        ...product,
        name: `${product.name} (${variantName})`,
        price: variantPrice || product.price
    } : product;

    if (!occupiedOrder) {
      // Create new order
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        tenantId: systemConfig.tenantId,
        customerName: 'Walk-in Customer',
        table: 'Walk-in',
        items: [{ product: cartProduct, quantity: 1 }],
        status: 'pending',
        timestamp: new Date(),
        isKitchenOrder: true,
        grandTotal: cartProduct.price,
        amountPaid: 0,
        staffName: currentUser?.name || 'Cashier', // Set current user as Waiter
        staffRole: currentUser?.role
      };
      setOccupiedOrder(newOrder);
    } else {
      // Update existing order
      // Check for exact product ID match AND name match (to differentiate Glass vs Bottle of same ID)
      const existingItemIndex = occupiedOrder.items.findIndex(i => i.product.id === cartProduct.id && i.product.name === cartProduct.name);
      let newItems = [...occupiedOrder.items];
      
      if (existingItemIndex >= 0) {
        newItems[existingItemIndex].quantity += 1;
      } else {
        newItems.push({ product: cartProduct, quantity: 1 });
      }
      
      const newTotal = newItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
      
      setOccupiedOrder({
        ...occupiedOrder,
        items: newItems,
        grandTotal: newTotal
      });
    }
    
    // Close modal if open
    setMeasureModalOpen(false);
    setPendingProduct(null);
  };

  const handlePrintAndClear = () => {
      if (!occupiedOrder) return;
      
      // Register Check
      if (!registerState.isOpen) {
          alert("REGISTER CLOSED: Please start your shift in the Dashboard to process payments.");
          return;
      }
      
      const orderToPrint: Order = {
          ...occupiedOrder,
          completedBy: currentUser?.name || 'Cashier' 
      };

      printReceipt(systemConfig, orderToPrint, 'RECEIPT');
      
      const completedOrder: Order = { 
          ...orderToPrint, 
          status: 'paid', 
          amountPaid: occupiedOrder.grandTotal, 
          paymentMethod: 'CASH' 
      };
      
      onUpdateOrder(completedOrder);
      if (!orders.find(o => o.id === completedOrder.id)) {
          onPlaceOrder(completedOrder);
      }
      setOccupiedOrder(null);
  };

  const handleSaveOrder = () => {
      if (!occupiedOrder) return;
      if (!orders.find(o => o.id === occupiedOrder.id)) {
          onPlaceOrder(occupiedOrder);
      } else {
          onUpdateOrder(occupiedOrder);
      }
      setOccupiedOrder(null);
  };

  const handlePreviewReceipt = () => {
      if (!occupiedOrder) return;
      const orderToPreview: Order = {
          ...occupiedOrder,
          completedBy: currentUser?.name || 'Cashier' 
      };
      const html = generateReceiptHtml(systemConfig, orderToPreview, 'RECEIPT');
      setPreviewHtml(html);
  };

  // Helper to determine if product is wine type for labeling
  const isWineOrChampagne = pendingProduct && ['Wine', 'Champagne', 'Red Wine', 'White Wine'].includes(pendingProduct.category);

  return (
    <div className="flex h-full bg-gray-100 font-sans">
      {/* Left: Product Grid */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-colors ${
                selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => handleItemClick(product)}
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between group h-40"
            >
              <div>
                <h3 className="font-bold text-gray-800 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{product.category}</p>
              </div>
              <div className="mt-2 font-black text-blue-600">
                {systemConfig.currency} {product.price.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-10">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-black text-lg text-gray-800">Current Order</h2>
          <p className="text-xs text-gray-500 font-medium">
            {occupiedOrder ? `Order #${occupiedOrder.id.slice(-4)}` : 'Empty Cart'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {occupiedOrder?.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
              <div>
                <p className="font-bold text-sm text-gray-800">{item.product.name}</p>
                <p className="text-xs text-gray-500">{item.quantity} x {item.product.price.toLocaleString()}</p>
              </div>
              <div className="font-black text-gray-900 text-sm">
                {(item.quantity * item.product.price).toLocaleString()}
              </div>
            </div>
          ))}
          {!occupiedOrder && (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
              Add items to start order
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-600">Total</span>
            <span className="font-black text-2xl text-gray-900">
              {systemConfig.currency} {occupiedOrder?.grandTotal.toLocaleString() || '0'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setOccupiedOrder(null)}
              disabled={!occupiedOrder}
              className="py-3 bg-red-100 text-red-600 rounded-xl font-bold text-sm hover:bg-red-200 disabled:opacity-50"
            >
              Clear
            </button>
            <button 
              onClick={handleSaveOrder}
              disabled={!occupiedOrder}
              className="py-3 bg-blue-100 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-200 disabled:opacity-50"
            >
              Save
            </button>
            <button 
              onClick={handlePreviewReceipt}
              disabled={!occupiedOrder}
              className="col-span-2 py-3 bg-gray-800 text-white rounded-xl font-bold text-sm hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" /> Preview Bill
            </button>
            <button 
              onClick={handlePrintAndClear}
              disabled={!occupiedOrder}
              className="col-span-2 py-4 bg-green-600 text-white rounded-xl font-black text-lg shadow-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Printer className="w-5 h-5" /> Pay & Print
            </button>
          </div>
        </div>
      </div>

      {/* --- MEASURE SELECTION MODAL --- */}
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
                            onClick={() => addItemToCart(pendingProduct, isWineOrChampagne ? "Glass" : "Single Tot", pendingProduct.spiritPrices?.single)}
                            className="flex justify-between items-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all group"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700"><GlassWater className="w-5 h-5"/></div>
                                  <span className="font-bold text-gray-700">{isWineOrChampagne ? "Glass" : "Single Tot"}</span>
                              </div>
                              <span className="font-black text-blue-700">{systemConfig.currency} {pendingProduct.spiritPrices.single.toLocaleString()}</span>
                          </button>
                      ) : null}

                      {pendingProduct.spiritPrices?.double ? (
                          <button 
                            onClick={() => addItemToCart(pendingProduct, "Double Tot", pendingProduct.spiritPrices?.double)}
                            className="flex justify-between items-center p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all group"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-700"><GlassWater className="w-5 h-5"/><Plus className="w-3 h-3"/></div>
                                  <span className="font-bold text-gray-700">Double Tot</span>
                              </div>
                              <span className="font-black text-purple-700">{systemConfig.currency} {pendingProduct.spiritPrices.double.toLocaleString()}</span>
                          </button>
                      ) : null}

                      {pendingProduct.spiritPrices?.half ? (
                          <button 
                            onClick={() => addItemToCart(pendingProduct, "Half Bottle", pendingProduct.spiritPrices?.half)}
                            className="flex justify-between items-center p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all group"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700"><Wine className="w-5 h-5"/></div>
                                  <span className="font-bold text-gray-700">Half Bottle</span>
                              </div>
                              <span className="font-black text-orange-700">{systemConfig.currency} {pendingProduct.spiritPrices.half.toLocaleString()}</span>
                          </button>
                      ) : null}

                      <button 
                        onClick={() => addItemToCart(pendingProduct, "Full Bottle", pendingProduct.spiritPrices?.full || pendingProduct.price)}
                        className="flex justify-between items-center p-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-all group"
                      >
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700"><Beer className="w-5 h-5"/></div>
                              <span className="font-bold text-gray-700">{isWineOrChampagne ? "Bottle" : "Full Bottle"}</span>
                          </div>
                          <span className="font-black text-green-700">{systemConfig.currency} {(pendingProduct.spiritPrices?.full || pendingProduct.price).toLocaleString()}</span>
                      </button>
                  </div>

                  <button onClick={() => setMeasureModalOpen(false)} className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold uppercase text-xs">Cancel</button>
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
                          className="flex-1 py-3 bg-green-600 text-white rounded-xl font-black text-xs uppercase hover:bg-green-700 flex items-center justify-center gap-2"
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

export default SellView;
