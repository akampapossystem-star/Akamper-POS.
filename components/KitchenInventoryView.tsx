
import React, { useState, useMemo } from 'react';
import { 
  Scale, BookOpen, Search, Plus, Save, Trash2, ArrowRight, CheckCircle2, 
  AlertTriangle, Filter, Calculator, BarChart3, Utensils, Box, TrendingUp, 
  TrendingDown, DollarSign, PieChart, History, RefreshCw, X, Printer, Calendar, User, ArrowLeft, Croissant
} from 'lucide-react';
import { Product, StoreItem, Order, StockMovementLog, SystemConfig } from '../types';

interface KitchenInventoryViewProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  storeItems: StoreItem[];
  orders: Order[];
  stockLogs: StockMovementLog[];
  systemConfig: SystemConfig;
  onAddStockLog?: (log: StockMovementLog) => void;
  // New props for dynamic context
  viewTitle?: string;
  viewIcon?: React.ElementType;
}

const KitchenInventoryView: React.FC<KitchenInventoryViewProps> = ({ 
  products, onUpdateProducts, storeItems, orders, stockLogs, systemConfig, onAddStockLog,
  viewTitle = "Kitchen Intelligence",
  viewIcon: ViewIcon = Scale
}) => {
  const [activeTab, setActiveTab] = useState<'RECIPES' | 'ACCOUNTABILITY' | 'WASTAGE'>('RECIPES');
  const [auditView, setAuditView] = useState<'SUMMARY' | 'RECEIVED' | 'WASTED'>('SUMMARY');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Recipe Form State
  const [ingredientForm, setIngredientForm] = useState<{itemId: string, quantity: string}>({ itemId: '', quantity: '' });

  // Wastage Form State
  const [wasteForm, setWasteForm] = useState({ itemId: '', quantity: '', reason: '' });

  // Filter products for recipe builder
  const filteredProducts = useMemo(() => {
      if (!searchTerm) return products;
      return products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [products, searchTerm]);

  // --- RECIPE COSTING LOGIC ---
  const recipeStats = useMemo(() => {
      if (!selectedProduct || !selectedProduct.composition) return { cost: 0, margin: 0 };
      
      const totalCost = selectedProduct.composition.reduce((acc, comp) => {
          const item = storeItems.find(i => i.id === comp.itemId);
          return acc + (comp.quantity * (item?.costPrice || 0));
      }, 0);

      const margin = selectedProduct.price > 0 
        ? ((selectedProduct.price - totalCost) / selectedProduct.price) * 100 
        : 0;

      return { cost: totalCost, margin };
  }, [selectedProduct, storeItems]);

  const handleAddIngredient = () => {
      if (!selectedProduct || !ingredientForm.itemId || !ingredientForm.quantity) return;
      
      const rawItem = storeItems.find(i => i.id === ingredientForm.itemId);
      if (!rawItem) return;

      const newComposition = selectedProduct.composition ? [...selectedProduct.composition] : [];
      const existingIdx = newComposition.findIndex(c => c.itemId === ingredientForm.itemId);
      const qty = parseFloat(ingredientForm.quantity);

      if (existingIdx >= 0) {
          newComposition[existingIdx].quantity = qty;
      } else {
          newComposition.push({
              itemId: rawItem.id,
              quantity: qty,
              unit: rawItem.unit
          });
      }

      const updatedProduct = { ...selectedProduct, composition: newComposition };
      onUpdateProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
      setSelectedProduct(updatedProduct);
      setIngredientForm({ itemId: '', quantity: '' });
  };

  const handleRemoveIngredient = (itemId: string) => {
      if (!selectedProduct || !selectedProduct.composition) return;
      const newComposition = selectedProduct.composition.filter(c => c.itemId !== itemId);
      const updatedProduct = { ...selectedProduct, composition: newComposition };
      onUpdateProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
      setSelectedProduct(updatedProduct);
  };

  // --- WASTAGE LOGIC ---
  const handleLogWastage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!wasteForm.itemId || !wasteForm.quantity || !onAddStockLog) return;

      const item = storeItems.find(i => i.id === wasteForm.itemId);
      if (!item) return;

      const qty = parseFloat(wasteForm.quantity);
      
      const log: StockMovementLog = {
          id: `WASTE-${Date.now()}`,
          itemId: item.id,
          itemName: item.name,
          type: 'STORE_EXIT',
          quantityChange: -qty,
          previousStock: item.stock,
          newStock: item.stock - qty,
          reason: `KITCHEN_WASTE: ${wasteForm.reason}`,
          performedBy: 'Chef',
          timestamp: new Date(),
          destination: 'Waste'
      };

      onAddStockLog(log);
      setWasteForm({ itemId: '', quantity: '', reason: '' });
      alert("Wastage logged and deducted from inventory.");
  };

  // --- ACCOUNTABILITY DATA ---
  const accountabilityData = useMemo(() => {
      const data: Record<string, { 
          name: string, 
          unit: string, 
          received: number, 
          sold: number, 
          waste: number,
          variance: number 
      }> = {};

      storeItems.forEach(item => {
          data[item.id] = { name: item.name, unit: item.unit, received: 0, sold: 0, waste: 0, variance: 0 };
      });

      // Calculate Received & Wasted from logs
      stockLogs.forEach(log => {
          if (data[log.itemId]) {
              if (log.type === 'STORE_EXIT') {
                  if (log.reason?.includes('KITCHEN_WASTE')) {
                      data[log.itemId].waste += Math.abs(log.quantityChange);
                  } else {
                      data[log.itemId].received += Math.abs(log.quantityChange);
                  }
              }
          }
      });

      // Calculate Sold (Theoretical)
      orders.forEach(order => {
          if (order.status !== 'cancelled') {
              order.items.forEach(orderItem => {
                  const product = products.find(p => p.id === orderItem.product.id);
                  if (product?.composition) {
                      product.composition.forEach(comp => {
                          if (data[comp.itemId]) {
                              data[comp.itemId].sold += (comp.quantity * orderItem.quantity);
                          }
                      });
                  }
              });
          }
      });

      return Object.values(data)
        .map(d => ({ ...d, variance: d.received - d.sold - d.waste }))
        .filter(d => d.received > 0 || d.sold > 0 || d.waste > 0);
  }, [storeItems, stockLogs, orders, products]);

  // --- DETAILED LOGS FOR AUDIT ---
  const receivedLogs = useMemo(() => {
      return stockLogs.filter(log => 
          log.type === 'STORE_EXIT' && 
          !log.reason?.includes('KITCHEN_WASTE') &&
          storeItems.some(i => i.id === log.itemId)
      ).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [stockLogs, storeItems]);

  const wastedLogs = useMemo(() => {
      return stockLogs.filter(log => 
          log.type === 'STORE_EXIT' && 
          log.reason?.includes('KITCHEN_WASTE')
      ).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [stockLogs]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans overflow-hidden">
      {/* Header Tabs */}
      <div className="px-8 py-6 bg-white border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
               <ViewIcon className="w-8 h-8 text-orange-600" /> {viewTitle}
            </h1>
            <p className="text-slate-500 font-medium text-xs uppercase tracking-widest mt-1">Recipes & Food Cost Accounting</p>
         </div>
         
         <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
            <button 
                onClick={() => setActiveTab('RECIPES')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'RECIPES' ? 'bg-white text-orange-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <BookOpen className="w-4 h-4" /> Recipes
            </button>
            <button 
                onClick={() => setActiveTab('WASTAGE')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'WASTAGE' ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <Trash2 className="w-4 h-4" /> Wastage
            </button>
            <button 
                onClick={() => setActiveTab('ACCOUNTABILITY')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ACCOUNTABILITY' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <BarChart3 className="w-4 h-4" /> Audit
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-hidden p-8">
         
         {/* --- TAB: RECIPE BUILDER --- */}
         {activeTab === 'RECIPES' && (
             <div className="flex h-full gap-8 animate-in fade-in duration-300">
                 {/* Product List Panel */}
                 <div className="w-80 lg:w-96 bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                     <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search Dish..."
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                        {filteredProducts.map(product => (
                            <div 
                                key={product.id}
                                onClick={() => setSelectedProduct(product)}
                                className={`group p-4 rounded-2xl cursor-pointer transition-all flex justify-between items-center border ${selectedProduct?.id === product.id ? 'bg-orange-50 border-orange-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold shrink-0 relative overflow-hidden">
                                        {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : product.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-black text-slate-800 text-sm truncate">{product.name}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{product.category}</p>
                                    </div>
                                </div>
                                {product.composition && product.composition.length > 0 ? (
                                    <div className="bg-green-100 text-green-700 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>
                                ) : (
                                    <div className="bg-slate-100 text-slate-400 p-1 rounded-full"><Plus className="w-4 h-4" /></div>
                                )}
                            </div>
                        ))}
                     </div>
                 </div>

                 {/* Recipe Editor Panel */}
                 <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
                    {!selectedProduct ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            <Utensils className="w-24 h-24 mb-4 opacity-10" />
                            <p className="font-black text-xl uppercase tracking-widest">Select a Dish to Edit Recipe</p>
                        </div>
                    ) : (
                        <>
                            {/* Panel Header */}
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedProduct.name}</h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[10px] font-black uppercase bg-slate-200 text-slate-600 px-3 py-1 rounded-full">Menu Item</span>
                                        <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                                            <DollarSign className="w-3 h-3" /> Sell: {selectedProduct.price.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-right p-4 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Recipe Cost</p>
                                        <p className="text-xl font-black text-slate-900">{systemConfig.currency} {recipeStats.cost.toLocaleString()}</p>
                                    </div>
                                    <div className={`text-right p-4 rounded-2xl border ${recipeStats.margin < 30 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Profit Margin</p>
                                        <p className={`text-xl font-black ${recipeStats.margin < 30 ? 'text-red-600' : 'text-green-600'}`}>{recipeStats.margin.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>

                            {/* Ingredient List */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Required Ingredients</h3>
                                {selectedProduct.composition && selectedProduct.composition.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedProduct.composition.map((comp, idx) => {
                                            const item = storeItems.find(i => i.id === comp.itemId);
                                            const itemCost = comp.quantity * (item?.costPrice || 0);
                                            return (
                                                <div key={idx} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-3xl shadow-sm group hover:border-orange-200 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Box className="w-5 h-5" /></div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{item?.name || 'Unknown'}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{comp.quantity} {comp.unit} <span className="mx-1">•</span> {systemConfig.currency} {itemCost.toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRemoveIngredient(comp.itemId)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X className="w-5 h-5" /></button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold">No ingredients mapped yet.</p>
                                        <p className="text-[10px] text-slate-400 uppercase mt-1">Start adding raw materials below to track costs.</p>
                                    </div>
                                )}
                            </div>

                            {/* Add Ingredient Bar */}
                            <div className="p-8 bg-slate-900 border-t border-slate-800">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Select Raw Material</label>
                                        <select 
                                            value={ingredientForm.itemId}
                                            onChange={e => setIngredientForm({...ingredientForm, itemId: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="">-- Choose Ingredient --</option>
                                            {storeItems.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-32">
                                        <label className="block text-[9px] font-black text-slate-500 uppercase mb-2">Qty per Sale</label>
                                        <input 
                                            type="number" 
                                            value={ingredientForm.quantity}
                                            onChange={e => setIngredientForm({...ingredientForm, quantity: e.target.value})}
                                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm outline-none"
                                            placeholder="0.0"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button 
                                            onClick={handleAddIngredient}
                                            disabled={!ingredientForm.itemId || !ingredientForm.quantity}
                                            className="h-[52px] px-8 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            Add to Recipe
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                 </div>
             </div>
         )}

         {/* --- TAB: WASTAGE LOGGING --- */}
         {activeTab === 'WASTAGE' && (
             <div className="max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-300">
                 <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-10 bg-red-600 text-white flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tight">Record Kitchen Waste</h2>
                            <p className="text-red-100 font-medium text-sm mt-2 opacity-80">Log spoiled, burnt or damaged stock for accurate variance reports.</p>
                        </div>
                        <Trash2 className="w-16 h-16 text-red-400 opacity-30" />
                    </div>
                    
                    <form onSubmit={handleLogWastage} className="p-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Select Wasted Item</label>
                                <select 
                                    required
                                    value={wasteForm.itemId}
                                    onChange={e => setWasteForm({...wasteForm, itemId: e.target.value})}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-800 outline-none focus:border-red-500 transition-all"
                                >
                                    <option value="">-- Search Inventory --</option>
                                    {storeItems.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Quantity Wasted</label>
                                <input 
                                    required
                                    type="number"
                                    step="0.01"
                                    value={wasteForm.quantity}
                                    onChange={e => setWasteForm({...wasteForm, quantity: e.target.value})}
                                    placeholder="0.00"
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-800 outline-none focus:border-red-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Reason for Wastage</label>
                            <textarea 
                                required
                                value={wasteForm.reason}
                                onChange={e => setWasteForm({...wasteForm, reason: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold text-slate-800 outline-none focus:border-red-500 transition-all h-32 resize-none"
                                placeholder="e.g. Expired, Burnt in oven, Spilled on floor..."
                            />
                        </div>

                        <button className="w-full py-6 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-2xl shadow-red-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                            <Save className="w-6 h-6" /> Commit to Waste Log
                        </button>
                    </form>
                 </div>
             </div>
         )}

         {/* --- TAB: ACCOUNTABILITY REPORT --- */}
         {activeTab === 'ACCOUNTABILITY' && (
             <div className="flex flex-col h-full bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in zoom-in duration-300">
                 <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <PieChart className="w-6 h-6 text-blue-600" /> Stock Reconciliation
                        </h3>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Audit of received vs used items</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Interactive Toggle Tabs for Audit View */}
                        <button 
                            onClick={() => setAuditView('SUMMARY')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                auditView === 'SUMMARY' ? 'bg-white text-slate-800 shadow-sm border-slate-200' : 'text-slate-400 border-transparent hover:text-slate-600'
                            }`}
                        >
                            Summary
                        </button>
                        <button 
                            onClick={() => setAuditView('RECEIVED')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                auditView === 'RECEIVED' ? 'bg-blue-600 text-white shadow-md border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                            }`}
                        >
                           <ArrowRight className="w-3 h-3" /> Received Log
                        </button>
                        <button 
                            onClick={() => setAuditView('WASTED')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                auditView === 'WASTED' ? 'bg-red-600 text-white shadow-md border-red-600' : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                            }`}
                        >
                           <Trash2 className="w-3 h-3" /> Wasted Log
                        </button>
                    </div>
                 </div>

                 {/* DYNAMIC CONTENT AREA BASED ON AUDIT VIEW */}
                 <div className="flex-1 overflow-auto custom-scrollbar p-6">
                    {auditView === 'SUMMARY' && (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-6 py-5">Ingredient</th>
                                    <th className="px-6 py-5 text-right">Received</th>
                                    <th className="px-6 py-5 text-right">Used (Sales)</th>
                                    <th className="px-6 py-5 text-right">Wasted</th>
                                    <th className="px-6 py-5 text-right">Variance Balance</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                                {accountabilityData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <span className="block font-black text-slate-800">{row.name}</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Per {row.unit}</span>
                                        </td>
                                        <td className="px-6 py-5 text-right text-blue-600 font-black">{row.received.toLocaleString()}</td>
                                        <td className="px-6 py-5 text-right text-slate-800">{row.sold.toLocaleString()}</td>
                                        <td className="px-6 py-5 text-right text-red-500">{row.waste.toLocaleString()}</td>
                                        <td className={`px-6 py-5 text-right font-black text-lg ${row.variance < 0 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                                            {row.variance.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {row.variance < 0 ? (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase border border-red-200">Critical Loss</span>
                                            ) : row.variance < 10 ? (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase border border-amber-200">Low Buffer</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase border border-green-200">In Control</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {accountabilityData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-30">
                                                <Calculator className="w-16 h-16 mb-4" />
                                                <p className="font-black text-xl uppercase tracking-widest">No audit data available</p>
                                                <p className="text-xs mt-2 max-w-xs mx-auto">Once recipes are mapped and stock is moved from the main store to the kitchen, reports will appear here.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}

                    {auditView === 'RECEIVED' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            {receivedLogs.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-blue-50/50 border-b border-blue-100 sticky top-0 z-10">
                                        <tr className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                            <th className="px-6 py-4">Time Received</th>
                                            <th className="px-6 py-4">Ingredient</th>
                                            <th className="px-6 py-4 text-right">Quantity In</th>
                                            <th className="px-6 py-4 text-right">Unit</th>
                                            <th className="px-6 py-4 text-right">Source / Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-blue-50/50 text-sm font-bold text-slate-700">
                                        {receivedLogs.map((log) => {
                                            const item = storeItems.find(i => i.id === log.itemId);
                                            return (
                                                <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" />
                                                            {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-blue-900">{log.itemName}</td>
                                                    <td className="px-6 py-4 text-right font-black text-blue-600">+{Math.abs(log.quantityChange)}</td>
                                                    <td className="px-6 py-4 text-right text-xs uppercase text-slate-400">{item?.unit || 'Units'}</td>
                                                    <td className="px-6 py-4 text-right text-xs italic text-slate-500">
                                                        {log.destination ? `To: ${log.destination}` : 'Store Transfer'}
                                                        {log.recipient && ` by ${log.recipient}`}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-20 text-center flex flex-col items-center justify-center opacity-40">
                                    <ArrowRight className="w-16 h-16 text-blue-300 mb-4" />
                                    <p className="font-black text-lg text-blue-900 uppercase">No Stock Received</p>
                                    <p className="text-xs text-blue-700 mt-1">No store transfers to kitchen recorded yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {auditView === 'WASTED' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            {wastedLogs.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-red-50/50 border-b border-red-100 sticky top-0 z-10">
                                        <tr className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                                            <th className="px-6 py-4">Time Logged</th>
                                            <th className="px-6 py-4">Wasted Item</th>
                                            <th className="px-6 py-4 text-right">Quantity Lost</th>
                                            <th className="px-6 py-4">Reason / Cause</th>
                                            <th className="px-6 py-4 text-right">Recorded By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-50/50 text-sm font-bold text-slate-700">
                                        {wastedLogs.map((log) => {
                                            const item = storeItems.find(i => i.id === log.itemId);
                                            return (
                                                <tr key={log.id} className="hover:bg-red-50/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                        {log.timestamp.toLocaleDateString()} {log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-900">{log.itemName}</td>
                                                    <td className="px-6 py-4 text-right font-black text-red-600">-{Math.abs(log.quantityChange)} {item?.unit}</td>
                                                    <td className="px-6 py-4 italic text-red-800/70 text-xs">
                                                        {log.reason?.replace('KITCHEN_WASTE: ', '')}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-xs uppercase flex items-center justify-end gap-1 text-slate-500">
                                                        <User className="w-3 h-3" /> {log.performedBy}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-20 text-center flex flex-col items-center justify-center opacity-40">
                                    <Trash2 className="w-16 h-16 text-red-300 mb-4" />
                                    <p className="font-black text-lg text-red-900 uppercase">No Waste Recorded</p>
                                    <p className="text-xs text-red-700 mt-1">Kitchen efficiency is at 100%.</p>
                                </div>
                            )}
                        </div>
                    )}
                 </div>

                 {/* Footer Info */}
                 <div className="p-6 bg-slate-900 text-white flex justify-between items-center px-10">
                     <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-orange-400">
                             <AlertTriangle className="w-6 h-6" />
                         </div>
                         <div>
                             <p className="text-xs font-black uppercase tracking-widest text-slate-400">Audit Protocol</p>
                             <p className="text-sm font-bold">
                                 {auditView === 'SUMMARY' ? 'Negative variance implies stock missing or unrecorded usage.' : 
                                  auditView === 'RECEIVED' ? 'Track all raw materials entering the kitchen.' : 
                                  'Monitor and reduce kitchen waste to improve margins.'}
                             </p>
                         </div>
                     </div>
                     <button className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-slate-100 transition-all shadow-xl">
                        <Printer className="w-4 h-4" /> Export {auditView.toLowerCase()} PDF
                     </button>
                 </div>
             </div>
         )}

      </div>
    </div>
  );
};

export default KitchenInventoryView;
