
import React, { useState, useMemo } from 'react';
import { Database, Search, Plus, List, BarChart2, Edit2, Trash2, Tag, Archive } from 'lucide-react';
import { Product, SystemConfig, UserRole } from '../types';

interface InventoryViewProps {
  systemConfig: SystemConfig;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  permissions: { allowedViews: any[]; allowedActions: string[] };
  userRole: UserRole;
  isMaster: boolean;
}

const InventoryView: React.FC<InventoryViewProps> = ({ systemConfig, products, onUpdateProducts, userRole, isMaster }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);

  const canDelete = userRole === 'OWNER' || isMaster;

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  return (
    <div className="p-8 h-full bg-slate-50 overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-100"><Database className="w-8 h-8" /></div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Inventory Portal</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Stock management & Liquor audits</p>
             </div>
          </div>
          <div className="flex gap-2">
             <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs uppercase flex items-center gap-2 hover:bg-slate-50 shadow-sm"><BarChart2 className="w-4 h-4" /> Analytics</button>
             <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"><Plus className="w-4 h-4" /> Add Product</button>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
           <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search catalogue..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
           </div>
           <div className="flex bg-slate-100 p-1 rounded-xl">
              <button className="p-2.5 bg-white text-slate-800 rounded-lg shadow-sm"><List className="w-4 h-4" /></button>
              <button className="p-2.5 text-slate-400 hover:text-slate-800"><Tag className="w-4 h-4" /></button>
           </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(c => (
                <button key={c} onClick={() => setSelectedCategory(c)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedCategory === c ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>{c}</button>
            ))}
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-8 py-5">Product</th>
                    <th className="px-8 py-5">Type & Price</th>
                    <th className="px-8 py-5 text-center">Stock Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[12px] font-bold text-slate-700">
                 {filtered.map(p => {
                    const isLiquor = p.category.toLowerCase().includes('liquor') || p.category.toLowerCase().includes('vodka') || p.category.toLowerCase().includes('whisky') || p.category.toLowerCase().includes('wine');
                    return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-20 h-20 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shrink-0 shadow-inner">
                                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" alt={p.name} />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-lg font-black text-slate-900 truncate">{p.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded tracking-widest">{p.category}</span>
                                        {isLiquor && <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded tracking-widest">Liquor</span>}
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              {isLiquor && p.spiritPrices ? (
                                  <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                                      <p className="text-[10px] text-slate-400 font-black uppercase">Sgl/Glass: <span className="text-indigo-600 text-[11px]">{systemConfig.currency} {p.spiritPrices.single.toLocaleString()}</span></p>
                                      <p className="text-[10px] text-slate-400 font-black uppercase">Double: <span className="text-indigo-600 text-[11px]">{systemConfig.currency} {p.spiritPrices.double.toLocaleString()}</span></p>
                                      <p className="text-[10px] text-slate-400 font-black uppercase">Half: <span className="text-indigo-600 text-[11px]">{systemConfig.currency} {p.spiritPrices.half.toLocaleString()}</span></p>
                                      <p className="text-[10px] text-slate-400 font-black uppercase">Bottle: <span className="text-indigo-600 text-[11px]">{systemConfig.currency} {p.spiritPrices.full.toLocaleString()}</span></p>
                                  </div>
                              ) : (
                                  <span className="text-lg font-black text-blue-600 bg-blue-50 px-4 py-1 rounded-xl border border-blue-100">{systemConfig.currency} {p.price.toLocaleString()}</span>
                              )}
                           </td>
                           <td className="px-8 py-6 text-center">
                               {p.trackStock ? (
                                   <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${p.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{p.stock} Units</span>
                               ) : (
                                   <span className="text-slate-300 uppercase tracking-widest text-[10px] font-black">Unlimited</span>
                               )}
                           </td>
                           <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-3 bg-white border border-slate-200 rounded-xl text-blue-600 hover:bg-blue-50 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                                 {canDelete && (
                                     <button className="p-3 bg-white border border-slate-200 rounded-xl text-red-500 hover:bg-red-50 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                 )}
                              </div>
                           </td>
                        </tr>
                    )
                 })}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryView;
