
import React, { useState, useMemo } from 'react';
import { 
  Database, AlertTriangle, Package, RefreshCcw, TrendingDown, 
  CheckCircle, ListFilter, X, Plus, Image as ImageIcon, Tag, DollarSign, Archive, Edit2, Save, Settings2,
  ArrowUpDown, ArrowUp, ArrowDown, Star, Upload, Layers, Trash2, Eye, EyeOff, Scale, MonitorSmartphone, Search, CheckCircle2,
  BoxSelect, BarChart2, Calendar, ZoomIn, Wine, ExternalLink, Globe, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { SystemConfig, Product, Order } from '../types';

interface InventoryViewProps {
  systemConfig: SystemConfig;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  orders?: Order[];
}

type SortKey = keyof Product;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const GLOBAL_UNITS = [
  'piece(s)', 'plate(s)', 'cup(s)', 'portion(s)', 'glass(es)', 'scoop(s)', 
  'kg(s)', 'liter(s)', 'bottle(s)', 'can(s)', 'pack(s)', 'box(es)', 'set(s)', 
  'pair(s)', 'roll(s)', 'slice(s)', 'tray(s)', 'bucket(s)'
];

const InventoryView: React.FC<InventoryViewProps> = ({ systemConfig, products, onUpdateProducts, orders = [] }) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'ANALYTICS'>('INVENTORY');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Category State
  const [inventoryCategories, setInventoryCategories] = useState<string[]>(() => {
      const defaults = [
          'Food', 'Drinks', 'Snacks', 'Desserts', 'Alcohol',
          'Wine', 'Champagne', 'Whiskey', 'Vodka', 'Gin', 'Rum', 'Tequila', 'Cognac', 'Brandy', 'Liqueur', 'Single Malt', 'Irish Whiskey', 'Blended Whisky',
          'Soft Drinks', 'Hot Beverages', 'Beer', 'Quick Foods', 'Main Course', 'Fast Food', 'Platters', 'Indian (Veg)', 'Indian (Non-Veg)', 'Breakfast', 'Bites', 'Pasta', 'Accompaniments', 'Mexican'
      ];
      const existing = new Set(products.map(p => p.category));
      return Array.from(new Set([...defaults, ...existing])).sort();
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ original: string, new: string } | null>(null);

  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'name', direction: 'asc' });
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);

  // --- PRODUCT FORM STATE ---
  type ProductType = 'STANDARD' | 'SPIRIT' | 'WINE';
  
  const [formType, setFormType] = useState<ProductType>('STANDARD');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    image: '',
    stock: '',
    unit: 'piece(s)',
    trackStock: true,
    // Pricing
    standardPrice: '',
    // Spirit/Wine Specifics
    singlePrice: '', // Tot or Glass
    doublePrice: '', // Double Tot
    halfBottlePrice: '',
    fullBottlePrice: '',
  });

  // --- ANALYTICS LOGIC ---
  const salesData = useMemo(() => {
      if (!orders || orders.length === 0) return [];
      const itemCounts: Record<string, { name: string, category: string, count: number, revenue: number, image: string }> = {};
      orders.filter(o => o.status !== 'cancelled').forEach(order => {
          order.items.forEach(item => {
              const pid = item.product.id;
              if (!itemCounts[pid]) {
                  itemCounts[pid] = { name: item.product.name, category: item.product.category, count: 0, revenue: 0, image: item.product.image };
              }
              itemCounts[pid].count += item.quantity;
              itemCounts[pid].revenue += (item.product.price * item.quantity);
          });
      });
      return Object.values(itemCounts).sort((a, b) => b.count - a.count);
  }, [orders]);

  const totalItemsSold = salesData.reduce((acc, curr) => acc + curr.count, 0);
  const topMover = salesData.length > 0 ? salesData[0] : null;

  // --- INVENTORY FILTER LOGIC ---
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(lowerTerm) || p.category.toLowerCase().includes(lowerTerm));
    }

    if (selectedCategory !== 'All') {
        result = result.filter(p => p.category === selectedCategory);
    }
    
    if (sortConfig) {
      result.sort((a, b) => {
        const key = sortConfig.key;
        const aValue = a[key] ?? '';
        const bValue = b[key] ?? '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [products, selectedCategory, sortConfig, searchTerm]);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // --- ACTIONS ---

  const handleRestock = (id: string) => {
    onUpdateProducts(products.map(p => p.id === id ? { ...p, stock: p.stock + 10 } : p));
  };

  const handleDeleteProduct = (id: string) => {
      if (confirm('Permanently delete this product?')) {
          onUpdateProducts(products.filter(p => p.id !== id));
      }
  };

  // --- CATEGORY ACTIONS ---
  const handleAddCategory = () => {
      if (newCategoryName && !inventoryCategories.includes(newCategoryName)) {
          setInventoryCategories(prev => [...prev, newCategoryName].sort());
          setNewCategoryName('');
      }
  };

  const handleSaveEditCategory = () => {
      if (editingCategory && editingCategory.new && editingCategory.new !== editingCategory.original) {
          setInventoryCategories(prev => prev.map(c => c === editingCategory.original ? editingCategory.new : c).sort());
          const updatedProducts = products.map(p => 
              p.category === editingCategory.original ? { ...p, category: editingCategory.new } : p
          );
          onUpdateProducts(updatedProducts);
          if (selectedCategory === editingCategory.original) setSelectedCategory(editingCategory.new);
          setEditingCategory(null);
      }
  };

  const handleDeleteCategory = (cat: string) => {
      if (confirm(`Delete category "${cat}"? Products will keep this label until changed.`)) {
          setInventoryCategories(prev => prev.filter(c => c !== cat));
      }
  };

  // --- PRODUCT FORM HANDLERS ---

  const resetForm = () => {
      setFormData({
          name: '', category: '', image: '', stock: '', unit: 'piece(s)', trackStock: true,
          standardPrice: '', singlePrice: '', doublePrice: '', halfBottlePrice: '', fullBottlePrice: ''
      });
      setFormType('STANDARD');
      setEditingProduct(null);
  };

  const openAddModal = () => {
      resetForm();
      setFormData(prev => ({ ...prev, category: inventoryCategories[0] || 'Food' }));
      setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
      setEditingProduct(product);
      
      // Determine Type
      let type: ProductType = 'STANDARD';
      if (product.spiritConfig?.isSpirit) {
          // Heuristic: If "Wine" or "Champagne" category or name, set to WINE type for easier editing
          if (product.category.toLowerCase().includes('wine') || product.category.toLowerCase().includes('champagne')) {
              type = 'WINE';
          } else {
              type = 'SPIRIT';
          }
      }

      setFormType(type);
      setFormData({
          name: product.name,
          category: product.category,
          image: product.image,
          stock: product.stock.toString(),
          unit: product.unit || 'piece(s)',
          trackStock: product.trackStock !== false,
          standardPrice: product.price.toString(),
          singlePrice: product.spiritPrices?.single.toString() || '',
          doublePrice: product.spiritPrices?.double.toString() || '',
          halfBottlePrice: product.spiritPrices?.half.toString() || '',
          fullBottlePrice: product.spiritPrices?.full.toString() || ''
      });
      setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.category) return;

      const basePrice = parseFloat(formData.standardPrice) || 0;
      
      // Logic for Spirits/Wines
      let spiritConfig = undefined;
      let spiritPrices = undefined;

      if (formType === 'SPIRIT' || formType === 'WINE') {
          spiritConfig = { isSpirit: true };
          spiritPrices = {
              single: parseFloat(formData.singlePrice) || 0, // Tot or Glass
              double: parseFloat(formData.doublePrice) || 0,
              half: parseFloat(formData.halfBottlePrice) || 0,
              full: parseFloat(formData.fullBottlePrice) || 0 // Bottle
          };
      }

      const productToSave: Product = {
          id: editingProduct ? editingProduct.id : `PROD-${Date.now()}`,
          tenantId: systemConfig.tenantId,
          name: formData.name,
          category: formData.category,
          price: formType === 'STANDARD' ? basePrice : (spiritPrices?.full || 0), // Base price for sort
          image: formData.image || `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
          stock: formData.trackStock ? parseInt(formData.stock) || 0 : 0,
          trackStock: formData.trackStock,
          unit: formData.unit,
          popularity: editingProduct ? editingProduct.popularity : 0,
          isAvailable: true,
          spiritConfig,
          spiritPrices
      };

      if (editingProduct) {
          onUpdateProducts(products.map(p => p.id === editingProduct.id ? productToSave : p));
      } else {
          onUpdateProducts([productToSave, ...products]);
      }
      setIsModalOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, image: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGoogleSearch = () => {
      if (!formData.name) {
          alert("Enter a product name first!");
          return;
      }
      const query = encodeURIComponent(formData.name + " drink bottle");
      window.open(`https://www.google.com/search?tbm=isch&q=${query}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="shrink-0 p-8 pb-4">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              {activeTab === 'INVENTORY' ? <Database className="w-8 h-8 text-indigo-600" /> : <BarChart2 className="w-8 h-8 text-blue-600" />}
              {activeTab === 'INVENTORY' ? 'Inventory Portal' : 'Sales Analytics'}
            </h1>
            <p className="text-gray-500 font-medium">
               {activeTab === 'INVENTORY' ? 'Manage products, stocks, spirits, and wines.' : 'Track item performance and stock movement.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
               <button onClick={() => setActiveTab('INVENTORY')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'INVENTORY' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                  <BoxSelect className="w-4 h-4" /> Products
               </button>
               <button onClick={() => setActiveTab('ANALYTICS')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'ANALYTICS' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>
                  <BarChart2 className="w-4 h-4" /> Analytics
               </button>
            </div>

            {activeTab === 'INVENTORY' && (
                <>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-48 transition-all"
                        />
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                        <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg ${viewMode === 'LIST' ? 'bg-gray-100 text-gray-800' : 'text-gray-400'}`}><ListIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('GRID')} className={`p-2 rounded-lg ${viewMode === 'GRID' ? 'bg-gray-100 text-gray-800' : 'text-gray-400'}`}><LayoutGrid className="w-5 h-5"/></button>
                    </div>
                    <button onClick={() => setIsCategoryManagerOpen(true)} className="p-3 bg-white border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 shadow-sm transition-all">
                        <Layers className="w-5 h-5" />
                    </button>
                    <button onClick={openAddModal} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                        <Plus className="w-5 h-5" /> Add Product
                    </button>
                </>
            )}
          </div>
        </header>

        {activeTab === 'INVENTORY' && (
            <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
                <button 
                    onClick={() => setSelectedCategory('All')} 
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all border ${selectedCategory === 'All' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                >
                    All Items
                </button>
                {inventoryCategories.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)} 
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
        {activeTab === 'INVENTORY' ? (
            viewMode === 'LIST' ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-8 py-6 cursor-pointer" onClick={() => handleSort('name')}>Product <ArrowUpDown className="w-3 h-3 inline"/></th>
                                    <th className="px-8 py-6">Type & Price</th>
                                    <th className="px-8 py-6">Stock Status</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.map((product) => {
                                    const isSpirit = product.spiritConfig?.isSpirit;
                                    const isLow = product.trackStock && product.stock < lowStockThreshold;
                                    
                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 relative group-hover:shadow-md transition-all">
                                                        {product.image ? (
                                                            <img src={product.image} className="w-full h-full object-cover" alt={product.name} />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><ImageIcon className="w-6 h-6" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-lg">{product.name}</p>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{product.category}</span>
                                                            {isSpirit && <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-purple-200">Liquor</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {isSpirit ? (
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                                        {product.spiritPrices?.single ? <span className="text-gray-600">Sgl/Glass: <b className="text-gray-900">{systemConfig.currency} {product.spiritPrices.single.toLocaleString()}</b></span> : null}
                                                        {product.spiritPrices?.double ? <span className="text-gray-600">Double: <b className="text-gray-900">{systemConfig.currency} {product.spiritPrices.double.toLocaleString()}</b></span> : null}
                                                        {product.spiritPrices?.half ? <span className="text-gray-600">Half: <b className="text-gray-900">{systemConfig.currency} {product.spiritPrices.half.toLocaleString()}</b></span> : null}
                                                        {product.spiritPrices?.full ? <span className="text-gray-600">Bottle: <b className="text-gray-900">{systemConfig.currency} {product.spiritPrices.full.toLocaleString()}</b></span> : null}
                                                    </div>
                                                ) : (
                                                    <span className="text-lg font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                                        {systemConfig.currency} {product.price.toLocaleString()}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6">
                                                {product.trackStock ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className={`text-sm font-bold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                                                            {product.stock} {product.unit}
                                                        </div>
                                                        {isLow && <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Unlimited</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openEditModal(product)} className="p-2 bg-white border border-gray-200 text-indigo-600 rounded-xl hover:bg-indigo-50 hover:border-indigo-200"><Edit2 className="w-4 h-4" /></button>
                                                    {product.trackStock && <button onClick={() => handleRestock(product.id)} className="p-2 bg-white border border-gray-200 text-green-600 rounded-xl hover:bg-green-50 hover:border-green-200"><RefreshCcw className="w-4 h-4" /></button>}
                                                    <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-white border border-gray-200 text-red-500 rounded-xl hover:bg-red-50 hover:border-red-200"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredProducts.map(product => {
                        const isSpirit = product.spiritConfig?.isSpirit;
                        return (
                            <div key={product.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden group hover:shadow-lg transition-all flex flex-col">
                                <div className="h-40 w-full bg-gray-100 relative overflow-hidden">
                                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.name} />
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur">
                                        {product.trackStock ? `${product.stock} left` : 'Unltd'}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => openEditModal(product)} className="p-2 bg-white rounded-full text-indigo-600"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-white rounded-full text-red-500"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                                <div className="p-3 flex flex-col flex-1">
                                    <span className="text-[10px] font-black uppercase text-gray-400 mb-1">{product.category}</span>
                                    <h4 className="font-bold text-gray-800 text-sm leading-tight mb-2 line-clamp-2">{product.name}</h4>
                                    <div className="mt-auto pt-2 border-t border-gray-50 flex justify-between items-center">
                                        <span className="font-black text-indigo-600 text-sm">{systemConfig.currency} {product.price.toLocaleString()}</span>
                                        {isSpirit && <Wine className="w-4 h-4 text-purple-400" />}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )
        ) : (
            /* ANALYTICS VIEW */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-purple-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-purple-200 uppercase tracking-widest">Total Sales Volume</p>
                            <h3 className="text-5xl font-black mt-2">{totalItemsSold.toLocaleString()}</h3>
                            <p className="text-sm mt-1 font-medium opacity-80">Units moved across all categories</p>
                        </div>
                        <TrendingDown className="absolute right-[-20px] bottom-[-30px] w-48 h-48 opacity-10 rotate-180" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top Performer</p>
                            <h3 className="text-3xl font-black text-gray-800 mt-2">{topMover ? topMover.name : 'N/A'}</h3>
                            <span className="inline-block mt-2 bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-black uppercase">
                                {topMover ? `${topMover.count} Sold` : '-'}
                            </span>
                        </div>
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Star className="w-10 h-10 text-yellow-600 fill-current" />
                        </div>
                    </div>
                </div>
                {/* Simple List */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-black text-gray-800 mb-4 uppercase">Sales Breakdown</h3>
                    <div className="space-y-2">
                        {salesData.slice(0, 10).map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-gray-300 font-bold w-6">#{i+1}</span>
                                    <span className="font-bold text-gray-800">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-black text-indigo-600">{item.count}</span> <span className="text-xs text-gray-400">units</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* --- MODAL: ADD/EDIT PRODUCT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
                <div className="p-8 bg-gray-900 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">{editingProduct ? 'Edit Item' : 'New Item'}</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Inventory Management</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="overflow-y-auto custom-scrollbar p-8">
                    <form onSubmit={handleSaveProduct} className="space-y-8">
                        
                        {/* Type Selection */}
                        <div className="p-1 bg-gray-100 rounded-2xl flex">
                            <button type="button" onClick={() => setFormType('STANDARD')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${formType === 'STANDARD' ? 'bg-white shadow-md text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Standard Product</button>
                            <button type="button" onClick={() => setFormType('SPIRIT')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${formType === 'SPIRIT' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>Spirit / Liquor</button>
                            <button type="button" onClick={() => setFormType('WINE')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${formType === 'WINE' ? 'bg-white shadow-md text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>Wine / Champagne</button>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Item Name</label>
                                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Tusker Lager" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-700 outline-none">
                                    <option value="">Select Category</option>
                                    {inventoryCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Image Handling */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                                Product Image
                                <button type="button" onClick={handleGoogleSearch} className="text-blue-600 hover:underline flex items-center gap-1">
                                    <Globe className="w-3 h-3" /> Search Google for Image
                                </button>
                            </label>
                            <div className="flex gap-4 items-start">
                                <div className="w-24 h-24 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                                    {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-gray-300" />}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <input type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs" placeholder="Paste Image URL..." />
                                    <div className="relative">
                                        <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold text-center border border-gray-200 hover:bg-gray-200 cursor-pointer">Upload from Device</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PRICING SECTION - DYNAMIC */}
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4">
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><DollarSign className="w-3 h-3" /> Pricing Configuration</h4>
                            
                            {formType === 'STANDARD' && (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Unit Price</label>
                                    <input type="number" value={formData.standardPrice} onChange={e => setFormData({...formData, standardPrice: e.target.value})} className="w-full px-4 py-3 border rounded-xl font-black text-lg outline-none focus:border-indigo-500" placeholder="0.00" />
                                </div>
                            )}

                            {formType === 'SPIRIT' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-bold text-purple-600 uppercase">Single Tot</label><input type="number" value={formData.singlePrice} onChange={e => setFormData({...formData, singlePrice: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-bold" /></div>
                                    <div><label className="text-[10px] font-bold text-purple-600 uppercase">Double Tot</label><input type="number" value={formData.doublePrice} onChange={e => setFormData({...formData, doublePrice: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-bold" /></div>
                                    <div><label className="text-[10px] font-bold text-purple-600 uppercase">Half Bottle</label><input type="number" value={formData.halfBottlePrice} onChange={e => setFormData({...formData, halfBottlePrice: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-bold" /></div>
                                    <div><label className="text-[10px] font-bold text-purple-600 uppercase">Full Bottle</label><input type="number" value={formData.fullBottlePrice} onChange={e => setFormData({...formData, fullBottlePrice: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-bold" /></div>
                                </div>
                            )}

                            {formType === 'WINE' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-bold text-red-600 uppercase">Per Glass</label><input type="number" value={formData.singlePrice} onChange={e => setFormData({...formData, singlePrice: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-bold" placeholder="Leave 0 if bottle only" /></div>
                                    <div><label className="text-[10px] font-bold text-red-600 uppercase">Full Bottle</label><input type="number" value={formData.fullBottlePrice} onChange={e => setFormData({...formData, fullBottlePrice: e.target.value})} className="w-full px-3 py-2 border rounded-xl font-bold" /></div>
                                </div>
                            )}
                        </div>

                        {/* Stock Control */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock Quantity</label>
                                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none" placeholder="0" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unit Type</label>
                                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                                    {GLOBAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">
                            <Save className="w-5 h-5 inline mr-2" /> Save Product
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL: CATEGORY MANAGER --- */}
      {isCategoryManagerOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
                      <h3 className="font-black uppercase tracking-tight">Manage Categories</h3>
                      <button onClick={() => setIsCategoryManagerOpen(false)}><X className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="flex gap-2">
                          <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 px-3 py-2 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" placeholder="New Category..." />
                          <button onClick={handleAddCategory} className="bg-indigo-600 text-white p-2 rounded-xl"><Plus className="w-5 h-5" /></button>
                      </div>
                      <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                          {inventoryCategories.map(cat => (
                              <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl group hover:bg-gray-100">
                                  {editingCategory?.original === cat ? (
                                      <div className="flex gap-2 w-full">
                                          <input autoFocus value={editingCategory.new} onChange={e => setEditingCategory({...editingCategory, new: e.target.value})} className="flex-1 px-2 py-1 bg-white border rounded text-sm font-bold" />
                                          <button onClick={handleSaveEditCategory}><CheckCircle2 className="w-4 h-4 text-green-600" /></button>
                                      </div>
                                  ) : (
                                      <>
                                        <span className="font-bold text-gray-700 text-sm">{cat}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingCategory({ original: cat, new: cat })}><Edit2 className="w-3.5 h-3.5 text-indigo-500" /></button>
                                            <button onClick={() => handleDeleteCategory(cat)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                                        </div>
                                      </>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default InventoryView;
