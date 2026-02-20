
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, BookOpen, Search, Plus, Save, Trash2, ArrowRight, CheckCircle2, 
  AlertTriangle, Filter, Calculator, BarChart3, Utensils, Box, TrendingUp, 
  TrendingDown, DollarSign, PieChart, History, RefreshCw, X, Printer, Calendar, User, ArrowLeft, Croissant, Ruler
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
  viewTitle?: string;
  viewIcon?: React.ElementType;
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

const KitchenInventoryView: React.FC<KitchenInventoryViewProps> = ({ 
  products, onUpdateProducts, storeItems, orders, stockLogs, systemConfig, onAddStockLog,
  viewTitle = "Kitchen Intel",
  viewIcon: ViewIcon = Scale
}) => {
  const [activeTab, setActiveTab] = useState<'RECIPES' | 'ACCOUNTABILITY' | 'WASTAGE'>('RECIPES');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientForm, setIngredientForm] = useState<{itemId: string, quantity: string, unit: string}>({ itemId: '', quantity: '', unit: 'kg' });
  const [wasteForm, setWasteForm] = useState({ itemId: '', quantity: '', reason: '' });

  // Update unit automatically when item is selected
  useEffect(() => {
    if (ingredientForm.itemId) {
        const item = storeItems.find(i => i.id === ingredientForm.itemId);
        if (item) {
            setIngredientForm(prev => ({ ...prev, unit: item.unit }));
        }
    }
  }, [ingredientForm.itemId, storeItems]);

  const filteredProducts = useMemo(() => {
      if (!searchTerm) return products;
      return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const recipeStats = useMemo(() => {
      if (!selectedProduct || !selectedProduct.composition) return { cost: 0, margin: 0 };
      const totalCost = selectedProduct.composition.reduce((acc, comp) => {
          const item = storeItems.find(i => i.id === comp.itemId);
          // Note: In a production app, we would perform unit conversion here (e.g. g to kg)
          // For now, it assumes simple multiplication of stored cost
          return acc + (comp.quantity * (item?.costPrice || 0));
      }, 0);
      const margin = selectedProduct.price > 0 ? ((selectedProduct.price - totalCost) / selectedProduct.price) * 100 : 0;
      return { cost: totalCost, margin };
  }, [selectedProduct, storeItems]);

  const handleAddIngredient = () => {
      if (!selectedProduct || !ingredientForm.itemId || !ingredientForm.quantity) return;
      const rawItem = storeItems.find(i => i.id === ingredientForm.itemId);
      if (!rawItem) return;

      const newComposition = selectedProduct.composition ? [...selectedProduct.composition] : [];
      const existingIdx = newComposition.findIndex(c => c.itemId === ingredientForm.itemId);
      const qty = parseFloat(ingredientForm.quantity);
      
      const compositionEntry = { 
          itemId: rawItem.id, 
          quantity: qty, 
          unit: ingredientForm.unit // Uses the manually selected global unit
      };

      if (existingIdx >= 0) {
          newComposition[existingIdx] = compositionEntry;
      } else {
          newComposition.push(compositionEntry);
      }

      const updatedProduct = { ...selectedProduct, composition: newComposition };
      onUpdateProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
      setSelectedProduct(updatedProduct);
      setIngredientForm({ itemId: '', quantity: '', unit: 'kg' });
  };

  const handleLogWastage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!wasteForm.itemId || !wasteForm.quantity || !onAddStockLog) return;
      const item = storeItems.find(i => i.id === wasteForm.itemId);
      if (!item) return;
      const qty = parseFloat(wasteForm.quantity);
      onAddStockLog({ id: `WASTE-${Date.now()}`, itemId: item.id, itemName: item.name, type: 'STORE_EXIT', quantityChange: -qty, previousStock: item.stock, newStock: item.stock - qty, reason: `WASTE: ${wasteForm.reason}`, performedBy: 'Kitchen Staff', timestamp: new Date(), destination: 'Waste' });
      setWasteForm({ itemId: '', quantity: '', reason: '' });
  };

  const accountabilityData = useMemo(() => {
      const data: Record<string, { name: string, unit: string, received: number, sold: number, waste: number, variance: number }> = {};
      storeItems.forEach(item => { data[item.id] = { name: item.name, unit: item.unit, received: 0, sold: 0, waste: 0, variance: 0 }; });
      stockLogs.forEach(log => {
          if (data[log.itemId]) {
              if (log.type === 'STORE_EXIT') {
                  if (log.reason?.includes('WASTE')) data[log.itemId].waste += Math.abs(log.quantityChange);
                  else data[log.itemId].received += Math.abs(log.quantityChange);
              }
          }
      });
      orders.forEach(order => {
          if (order.status !== 'cancelled') {
              order.items.forEach(orderItem => {
                  const product = products.find(p => p.id === orderItem.product.id);
                  if (product?.composition) {
                      product.composition.forEach(comp => { if (data[comp.itemId]) data[comp.itemId].sold += (comp.quantity * orderItem.quantity); });
                  }
              });
          }
      });
      return Object.values(data).map(d => ({ ...d, variance: d.received - d.sold - d.waste })).filter(d => d.received > 0 || d.sold > 0 || d.waste > 0);
  }, [storeItems, stockLogs, orders, products]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans overflow-hidden">
      <div className="px-8 py-6 bg-white border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <ViewIcon className="w-8 h-8 text-orange-600" />
            <div><h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{viewTitle}</h1><p className="text-slate-500 font-medium text-[10px] uppercase tracking-widest">Recipe Control & Audit</p></div>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            <button onClick={() => setActiveTab('RECIPES')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'RECIPES' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-500'}`}>Recipes</button>
            <button onClick={() => setActiveTab('WASTAGE')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'WASTAGE' ? 'bg-white text-red-600 shadow-md' : 'text-slate-500'}`}>Waste</button>
            <button onClick={() => setActiveTab('ACCOUNTABILITY')} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'ACCOUNTABILITY' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>Audit</button>
         </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden">
         {activeTab === 'RECIPES' && (
             <div className="flex h-full gap-8">
                 <div className="w-80 bg-white rounded-[2rem] border border-slate-200 flex flex-col overflow-hidden shadow-sm">
                    <div className="p-4 border-b bg-slate-50/50"><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search dishes..." className="w-full px-4 py-2 bg-white border rounded-xl text-xs font-bold outline-none" /></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredProducts.map(p => (
                            <div key={p.id} onClick={() => setSelectedProduct(p)} className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedProduct?.id === p.id ? 'bg-orange-50 border-orange-200' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                                <p className="font-black text-slate-800 text-sm truncate">{p.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{p.category}</p>
                            </div>
                        ))}
                    </div>
                 </div>
                 <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    {selectedProduct ? (
                        <>
                            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                                <div><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedProduct.name}</h2><p className="text-[10px] font-black text-orange-600 mt-1 uppercase tracking-widest">Theoretical Cost: {recipeStats.cost.toLocaleString()}</p></div>
                                <div className={`px-4 py-2 rounded-xl border font-black text-xs ${recipeStats.margin < 30 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>Margin: {recipeStats.margin.toFixed(1)}%</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                {selectedProduct.composition?.map((comp, i) => {
                                    const item = storeItems.find(si => si.id === comp.itemId);
                                    return (
                                        <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                                            <div className="flex items-center gap-3"><Box className="w-4 h-4 text-slate-400"/><span className="font-bold text-sm">{item?.name}</span></div>
                                            <div className="flex items-center gap-4"><span className="text-xs font-black text-slate-500 uppercase">{comp.quantity} {comp.unit}</span><button onClick={() => { const newComp = selectedProduct.composition!.filter(c => c.itemId !== comp.itemId); onUpdateProducts(products.map(p => p.id === selectedProduct.id ? {...p, composition: newComp} : p)); setSelectedProduct({...selectedProduct, composition: newComp}); }} className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4"/></button></div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-6 bg-slate-900 flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Select Ingredient</label>
                                    <select value={ingredientForm.itemId} onChange={e => setIngredientForm({...ingredientForm, itemId: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl text-white font-bold text-xs outline-none"><option value="">Search bulk store...</option>{storeItems.map(i => <option key={i.id} value={i.id}>{i.name} (Available: {i.stock} {i.unit})</option>)}</select>
                                </div>
                                <div className="w-24">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Quantity</label>
                                    <input type="number" step="any" value={ingredientForm.quantity} onChange={e => setIngredientForm({...ingredientForm, quantity: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl text-white font-bold text-xs" placeholder="0.00" />
                                </div>
                                <div className="w-36">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Unit Measure</label>
                                    <select value={ingredientForm.unit} onChange={e => setIngredientForm({...ingredientForm, unit: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl text-white font-bold text-xs outline-none">
                                        {GLOBAL_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleAddIngredient} className="px-6 h-[44px] bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-lg shadow-orange-900/20">Add Component</button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-20"><Utensils className="w-32 h-32 mb-4" /><p className="font-black text-2xl uppercase tracking-widest">Select Product</p></div>
                    )}
                 </div>
             </div>
         )}
         {activeTab === 'WASTAGE' && (
            <div className="max-w-2xl mx-auto bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-8 bg-red-600 text-white"><h2 className="text-2xl font-black uppercase tracking-tight">Log Kitchen Loss</h2></div>
                <form onSubmit={handleLogWastage} className="p-8 space-y-6">
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wasted Item</label><select required value={wasteForm.itemId} onChange={e => setWasteForm({...wasteForm, itemId: e.target.value})} className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-red-500">{storeItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</label><input type="number" required value={wasteForm.quantity} onChange={e => setWasteForm({...wasteForm, quantity: e.target.value})} className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl font-black text-slate-800 outline-none focus:bg-white focus:border-red-500" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</label><input type="text" required value={wasteForm.reason} onChange={e => setWasteForm({...wasteForm, reason: e.target.value})} className="w-full px-4 py-3 bg-slate-100 border border-transparent rounded-xl font-bold text-slate-800 outline-none focus:bg-white focus:border-red-500" placeholder="e.g. Burnt, Expired..." /></div>
                    <button className="w-full py-4 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200">Post Wastage</button>
                </form>
            </div>
         )}
         {activeTab === 'ACCOUNTABILITY' && (
             <div className="h-full bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                <div className="p-6 border-b bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-800 uppercase">Stock Reconciliation</h3>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"><Printer className="w-4 h-4"/> Export Audit</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <table className="w-full text-left">
                        <thead><tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b"><th className="px-4 py-4">Item</th><th className="px-4 py-4 text-right">Received</th><th className="px-4 py-4 text-right">Sold (Theo)</th><th className="px-4 py-4 text-right">Wasted</th><th className="px-4 py-4 text-right">Variance</th></tr></thead>
                        <tbody className="divide-y text-xs font-bold text-slate-700">
                            {accountabilityData.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                    <td className="px-4 py-4">{row.name}</td>
                                    <td className="px-4 py-4 text-right text-blue-600">{row.received}</td>
                                    <td className="px-4 py-4 text-right">{row.sold}</td>
                                    <td className="px-4 py-4 text-right text-red-500">{row.waste}</td>
                                    <td className={`px-4 py-4 text-right font-black ${row.variance < 0 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>{row.variance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default KitchenInventoryView;
