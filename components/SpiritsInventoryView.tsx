
import React, { useState, useMemo } from 'react';
import { 
  Wine, Plus, Scale, AlertCircle, History, GlassWater, Droplets, CheckCircle2, 
  Trash2, Archive, Settings, ArrowRight, Save, Martini, X, BarChart2, Calendar, Filter, Search, Printer, DollarSign, BookOpen, Crown,
  TrendingUp, Circle, ClipboardList, Utensils, Box
} from 'lucide-react';
import { SpiritBottle, StaffMember, SystemConfig, SpiritLog, Product, StoreItem, StockMovementLog } from '../types';

interface SpiritsInventoryViewProps {
  bottles: SpiritBottle[];
  onUpdateBottles: (bottles: SpiritBottle[]) => void;
  currentUser: StaffMember | null;
  systemConfig: SystemConfig;
  products?: Product[]; // Pass products to access the catalog
  onUpdateProducts?: (products: Product[]) => void; // New Prop to update products
  // NEW PROPS FOR RECIPES
  storeItems: StoreItem[];
  onUpdateStoreItems: (items: StoreItem[]) => void;
  onAddStockLog: (log: StockMovementLog) => void;
}

const BOTTLE_SIZES = [
  { label: '1 Litre', value: 1000 },
  { label: '750ml', value: 750 },
  { label: '500ml', value: 500 },
  { label: '375ml (Half)', value: 375 },
  { label: '350ml', value: 350 },
  { label: '250ml', value: 250 },
  { label: '200ml', value: 200 },
];

const SPIRIT_TYPES = [
    'WHISKEY', 'VODKA', 'GIN', 'RUM', 'TEQUILA', 'BRANDY', 'LIQUEUR', 'WINE', 'CHAMPAGNE',
    'COGNAC', 'SINGLE MALT', 'IRISH WHISKEY', 'BLENDED WHISKY'
];

type ReportPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'LAST_MONTH';

const SpiritsInventoryView: React.FC<SpiritsInventoryViewProps> = ({ 
    bottles, onUpdateBottles, currentUser, systemConfig, products = [], onUpdateProducts,
    storeItems = [], onUpdateStoreItems, onAddStockLog
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'WINE' | 'RECIPES' | 'HISTORY' | 'ANALYTICS' | 'SEARCH'>('ACTIVE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('TODAY');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Bottle Form
  const [newBottle, setNewBottle] = useState<{
      name: string;
      type: string;
      size: number;
      standard: 'NEW_25ML' | 'OLD_30ML';
      prices: { single: string, double: string, half: string, full: string };
  }>({
      name: '',
      type: 'WHISKEY',
      size: 750,
      standard: 'NEW_25ML',
      prices: { single: '', double: '', half: '', full: '' }
  });

  const [showCatalogSuggestions, setShowCatalogSuggestions] = useState(false);

  // --- RECIPE TAB STATE ---
  const [recipeForm, setRecipeForm] = useState({
      cocktailName: '',
      staffName: currentUser?.name || 'Barman',
      ingredients: [] as { itemId: string, name: string, quantity: number, unit: string, isProduct: boolean }[]
  });
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [recipeHistory, setRecipeHistory] = useState<{timestamp: Date, cocktail: string, staff: string, details: string}[]>([]);

  // Filter Catalog Items from Products
  const catalogSpirits = useMemo(() => {
      return products.filter(p => p.spiritConfig?.isSpirit);
  }, [products]);

  // Filter Store Items & Products for Mixers
  const filteredMixers = useMemo(() => {
      if (!ingredientSearch) return [];
      const term = ingredientSearch.toLowerCase();
      
      // Filter Store Items (Raw Materials)
      const matchesStore = storeItems.filter(i => 
          i.name.toLowerCase().includes(term) && 
          (i.category === 'Beverage Stock' || i.category === 'Raw Materials' || i.category === 'Consumables')
      ).map(i => ({...i, type: 'STORE_ITEM'}));

      // Filter Products (e.g. Soda, Water) - Only stock trackable items
      const matchesProducts = products.filter(p => 
          p.trackStock && 
          p.name.toLowerCase().includes(term) && 
          !p.spiritConfig?.isSpirit // Exclude spirits themselves usually
      ).map(p => ({
          id: p.id,
          name: p.name,
          unit: p.unit || 'unit',
          stock: p.stock,
          category: p.category,
          type: 'PRODUCT'
      }));

      return [...matchesStore, ...matchesProducts];
  }, [storeItems, products, ingredientSearch]);

  // Pour Confirmation State
  const [pendingPour, setPendingPour] = useState<{
      bottleId: string;
      bottleName: string;
      sizeType: 'SINGLE' | 'DOUBLE' | 'HALF_BOTTLE' | 'GLASS' | 'FULL_BOTTLE';
      volume: number;
  } | null>(null);
  
  const [consumptionMode, setConsumptionMode] = useState<'DIRECT' | 'COCKTAIL' | 'HALF_BOTTLE' | 'GLASS' | 'FULL_BOTTLE'>('DIRECT');

  // SPLIT BOTTLES BY TYPE
  const activeSpirits = bottles.filter(b => b.status === 'OPEN' && !['WINE', 'CHAMPAGNE'].includes(b.type));
  const activeWines = bottles.filter(b => b.status === 'OPEN' && ['WINE', 'CHAMPAGNE'].includes(b.type));
  
  const historyBottles = bottles.filter(b => b.status === 'EMPTY').sort((a,b) => b.openedAt.getTime() - a.openedAt.getTime());

  // Logic to calculate remaining tots based on standard
  const getRemainingTots = (bottle: SpiritBottle) => {
      const singleSize = bottle.measureStandard === 'NEW_25ML' ? 25 : 30;
      return Math.floor(bottle.currentVolume / singleSize);
  };

  // --- WINE ANALYTICS ENGINE (Independent) ---
  const wineStats = useMemo(() => {
      const logs: SpiritLog[] = [];
      bottles.forEach(b => {
          if (['WINE', 'CHAMPAGNE'].includes(b.type) && b.logs) {
              b.logs.forEach(l => logs.push(l));
          }
      });
      
      const glassesSold = logs.filter(l => l.type === 'GLASS').length;
      const halfBottlesSold = logs.filter(l => l.type === 'HALF_BOTTLE').length;
      const fullBottlesSold = logs.filter(l => l.type === 'FULL_BOTTLE').length;
      
      const halfBottleVolumeLiters = logs.filter(l => l.type === 'HALF_BOTTLE').reduce((sum, l) => sum + l.quantityMl, 0) / 1000;

      return { glassesSold, halfBottlesSold, fullBottlesSold, halfBottleVolumeLiters };
  }, [bottles]);

  const handleCatalogSelect = (product: Product) => {
      // Auto-detect type from category
      let type = 'WHISKEY';
      const cat = product.category.toUpperCase();
      if (SPIRIT_TYPES.includes(cat)) type = cat;
      else if (cat === 'DRINKS' && product.name.toLowerCase().includes('wine')) type = 'WINE';
      
      setNewBottle({
          ...newBottle,
          name: product.name,
          type: type,
          prices: {
              single: product.spiritPrices?.single.toString() || '',
              double: product.spiritPrices?.double.toString() || '',
              half: product.spiritPrices?.half.toString() || '',
              full: product.spiritPrices?.full.toString() || '',
          }
      });
      setShowCatalogSuggestions(false);
  };

  const handleOpenBottle = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newBottle.name) return;

      const isHalfStart = newBottle.size <= 375;

      const bottle: SpiritBottle = {
          id: `BTL-${Date.now()}`,
          name: newBottle.name,
          type: newBottle.type as any,
          totalVolume: newBottle.size,
          currentVolume: newBottle.size,
          measureStandard: newBottle.standard,
          status: 'OPEN',
          openedAt: new Date(),
          openedBy: currentUser?.name || 'Barman',
          logs: [],
          isHalfBottleStart: isHalfStart,
          prices: {
              single: parseFloat(newBottle.prices.single) || 0,
              double: parseFloat(newBottle.prices.double) || 0,
              half: parseFloat(newBottle.prices.half) || 0,
              full: parseFloat(newBottle.prices.full) || 0,
          }
      };

      onUpdateBottles([bottle, ...bottles]);
      setIsModalOpen(false);
      setNewBottle({ name: '', type: 'WHISKEY', size: 750, standard: 'NEW_25ML', prices: { single: '', double: '', half: '', full: '' } });
  };

  const initiatePour = (bottle: SpiritBottle, type: 'SINGLE' | 'DOUBLE' | 'HALF_BOTTLE') => {
      const singleSize = bottle.measureStandard === 'NEW_25ML' ? 25 : 30;
      const doubleSize = bottle.measureStandard === 'NEW_25ML' ? 50 : 60;
      
      let deductAmount = 0;
      if (type === 'SINGLE') deductAmount = singleSize;
      else if (type === 'DOUBLE') deductAmount = doubleSize;
      else if (type === 'HALF_BOTTLE') deductAmount = Math.floor(bottle.totalVolume / 2); // Dynamic Half based on full size

      if (bottle.currentVolume < deductAmount) {
          alert(`Not enough spirit remaining! Only ${bottle.currentVolume}ml left.`);
          return;
      }

      setPendingPour({
          bottleId: bottle.id,
          bottleName: bottle.name,
          sizeType: type,
          volume: deductAmount
      });
      setConsumptionMode(type === 'HALF_BOTTLE' ? 'HALF_BOTTLE' : 'DIRECT'); 
  };

  const initiateWineSale = (bottle: SpiritBottle, type: 'GLASS' | 'HALF_BOTTLE' | 'FULL_BOTTLE') => {
      let volume = 0;
      let mode: 'GLASS' | 'HALF_BOTTLE' | 'FULL_BOTTLE' = 'GLASS';

      if (type === 'GLASS') {
          volume = 150; // Standard Wine Glass
          mode = 'GLASS';
      } else if (type === 'HALF_BOTTLE') {
          volume = Math.floor(bottle.totalVolume / 2); 
          mode = 'HALF_BOTTLE';
      } else {
          volume = bottle.currentVolume;
          mode = 'FULL_BOTTLE';
      }

      if (bottle.currentVolume < volume) {
          alert(`Insufficient volume! Only ${bottle.currentVolume}ml remaining.`);
          return;
      }

      setPendingPour({
          bottleId: bottle.id,
          bottleName: bottle.name,
          sizeType: type,
          volume: volume
      });
      setConsumptionMode(mode);
  };

  const printTotTicket = (bottleName: string, type: string, volume: number) => {
      const printWindow = window.open('', '', 'width=300,height=400');
      if (!printWindow) return;

      const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const waiterName = currentUser?.name || 'System';

      const html = `
        <html>
          <head>
            <title>BAR TICKET</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 10px; margin: 0; width: 100%; text-align: center; }
              .box { border: 2px solid #000; padding: 10px; border-radius: 5px; }
              .title { font-size: 18px; font-weight: 900; margin-bottom: 5px; text-decoration: underline; }
              .item { font-size: 16px; font-weight: bold; margin: 10px 0; }
              .meta { font-size: 12px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
              .footer { font-size: 10px; margin-top: 10px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="box">
              <div class="title">BARMAN COPY</div>
              <div class="item">
                ${bottleName}<br/>
                <span style="font-size: 20px;">[ ${type} ]</span><br/>
                <small>${volume}ml</small>
              </div>
              <div class="meta">
                Waiter: ${waiterName}<br/>
                Time: ${time}
              </div>
              <div class="footer">CONFIRM ENTRY IN SYSTEM</div>
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  const confirmPour = () => {
      if (!pendingPour) return;

      // Print the ticket first
      printTotTicket(pendingPour.bottleName, pendingPour.sizeType, pendingPour.volume);

      onUpdateBottles(bottles.map(b => {
          if (b.id === pendingPour.bottleId) {
              const newVolume = b.currentVolume - pendingPour.volume;
              const singleSize = b.measureStandard === 'NEW_25ML' ? 25 : 30;
              
              const emptyThreshold = pendingPour.sizeType === 'GLASS' ? 20 : singleSize;
              const newStatus = newVolume < emptyThreshold ? 'EMPTY' : 'OPEN';
              
              let logType: SpiritLog['type'] = 'DIRECT';
              if (['WINE', 'CHAMPAGNE'].includes(b.type)) {
                  if (pendingPour.sizeType === 'GLASS') logType = 'GLASS';
                  else if (pendingPour.sizeType === 'HALF_BOTTLE') logType = 'HALF_BOTTLE';
                  else if (pendingPour.sizeType === 'FULL_BOTTLE') logType = 'FULL_BOTTLE';
              } else {
                  logType = consumptionMode as SpiritLog['type']; 
              }

              const logEntry: SpiritLog = {
                  id: `LOG-${Date.now()}`,
                  timestamp: new Date(),
                  quantityMl: pendingPour.volume,
                  tots: (['GLASS', 'FULL_BOTTLE', 'HALF_BOTTLE'].includes(pendingPour.sizeType) && ['WINE', 'CHAMPAGNE'].includes(b.type)) ? 1 :
                        pendingPour.sizeType === 'SINGLE' ? 1 : 
                        (pendingPour.sizeType === 'DOUBLE' ? 2 : Math.floor(pendingPour.volume / singleSize)),
                  type: logType,
                  staffName: currentUser?.name || 'Staff'
              };

              const updatedLogs = b.logs ? [...b.logs, logEntry] : [logEntry];
              
              return { ...b, currentVolume: Math.max(0, newVolume), status: newStatus, logs: updatedLogs };
          }
          return b;
      }));

      setPendingPour(null);
  };

  const handleMarkEmpty = (id: string) => {
      if(confirm("Mark this bottle as finished/empty?")) {
          onUpdateBottles(bottles.map(b => b.id === id ? { ...b, currentVolume: 0, status: 'EMPTY' } : b));
      }
  };

  // --- RECIPE LOGIC ---
  const handleAddMixer = (item: any) => {
      setRecipeForm(prev => {
          const exists = prev.ingredients.find(i => i.itemId === item.id);
          if (exists) return prev; // Already added
          return {
              ...prev,
              ingredients: [...prev.ingredients, { 
                  itemId: item.id, 
                  name: item.name, 
                  quantity: 1, 
                  unit: item.unit,
                  isProduct: item.type === 'PRODUCT'
              }]
          };
      });
      setIngredientSearch(''); // Clear search
  };

  const handleUpdateMixerQty = (itemId: string, qty: number) => {
      setRecipeForm(prev => ({
          ...prev,
          ingredients: prev.ingredients.map(i => i.itemId === itemId ? { ...i, quantity: qty } : i)
      }));
  };

  const handleRemoveMixer = (itemId: string) => {
      setRecipeForm(prev => ({
          ...prev,
          ingredients: prev.ingredients.filter(i => i.itemId !== itemId)
      }));
  };

  const handleRecordRecipe = () => {
      if (!recipeForm.cocktailName || recipeForm.ingredients.length === 0) {
          alert("Please enter cocktail name and select at least one ingredient.");
          return;
      }

      // 1. Deduct from Store Items
      const updatedStoreItems = [...storeItems];
      let storeItemsChanged = false;

      // 2. Deduct from Products (NEW)
      const updatedProducts = [...products];
      let productsChanged = false;

      recipeForm.ingredients.forEach(ing => {
          if (ing.isProduct) {
              // Deduct from Products
              const prodIndex = updatedProducts.findIndex(p => p.id === ing.itemId);
              if (prodIndex > -1) {
                  updatedProducts[prodIndex] = {
                      ...updatedProducts[prodIndex],
                      stock: updatedProducts[prodIndex].stock - ing.quantity
                  };
                  productsChanged = true;
              }
          } else {
              // Deduct from Store Items
              const itemIndex = updatedStoreItems.findIndex(i => i.id === ing.itemId);
              if (itemIndex > -1) {
                  updatedStoreItems[itemIndex] = {
                      ...updatedStoreItems[itemIndex],
                      stock: updatedStoreItems[itemIndex].stock - ing.quantity,
                      lastUpdated: new Date()
                  };
                  storeItemsChanged = true;
              }
          }
      });

      if (storeItemsChanged) onUpdateStoreItems(updatedStoreItems);
      if (productsChanged && onUpdateProducts) onUpdateProducts(updatedProducts);

      // 3. Add to Stock Movement Logs (Central)
      recipeForm.ingredients.forEach(ing => {
          const item = ing.isProduct 
            ? products.find(p => p.id === ing.itemId)
            : storeItems.find(i => i.id === ing.itemId);
            
          onAddStockLog({
              id: `LOG-MIX-${Date.now()}-${ing.itemId}`,
              itemId: ing.itemId,
              itemName: ing.name,
              type: 'STORE_EXIT',
              quantityChange: -ing.quantity,
              previousStock: item?.stock || 0,
              newStock: (item?.stock || 0) - ing.quantity,
              reason: `Recipe: ${recipeForm.cocktailName}`,
              performedBy: recipeForm.staffName,
              timestamp: new Date(),
              destination: 'Bar',
              recipient: 'Customer'
          });
      });

      // 3. Add to Local History for Display
      const summary = recipeForm.ingredients.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ');
      setRecipeHistory(prev => [
          {
              timestamp: new Date(),
              cocktail: recipeForm.cocktailName,
              staff: recipeForm.staffName,
              details: summary
          },
          ...prev
      ]);

      // Reset
      setRecipeForm({
          cocktailName: '',
          staffName: currentUser?.name || 'Barman',
          ingredients: []
      });
      alert("Recipe usage recorded and stock deducted from both Store & Products.");
  };

  // --- ANALYTICS LOGIC ---
  const getFilteredLogs = () => {
      const allLogs: (SpiritLog & { bottleName: string })[] = [];
      bottles.forEach(b => {
          if(b.logs) {
              b.logs.forEach(l => allLogs.push({ ...l, bottleName: b.name }));
          }
      });

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let startDate = startOfToday;
      let endDate = new Date(now);

      if (reportPeriod === 'WEEK') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
      } else if (reportPeriod === 'MONTH') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (reportPeriod === 'LAST_MONTH') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      }

      return allLogs.filter(l => l.timestamp >= startDate && l.timestamp <= endDate).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const analyticsData = useMemo(() => {
      const logs = getFilteredLogs();
      const directTots = logs.filter(l => l.type === 'DIRECT').reduce((sum, l) => sum + l.tots, 0);
      const cocktailTots = logs.filter(l => l.type === 'COCKTAIL').reduce((sum, l) => sum + l.tots, 0);
      const halfBottleVolume = logs.filter(l => l.type === 'HALF_BOTTLE').reduce((sum, l) => sum + l.quantityMl, 0);
      return { logs, directTots, cocktailTots, halfBottleVolume };
  }, [bottles, reportPeriod]);

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden font-sans">
      
      {/* Header */}
      <div className="p-8 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
         <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
               <Wine className="w-8 h-8 text-purple-600" /> Spirits Inventory
            </h1>
            <p className="text-gray-500 font-medium">Track open bottles, tots, and recipes.</p>
         </div>
         
         <div className="flex gap-3">
             <div className="bg-gray-100 p-1 rounded-xl flex">
                <button onClick={() => setActiveTab('ACTIVE')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'ACTIVE' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Active Bar</button>
                <button onClick={() => setActiveTab('WINE')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 ${activeTab === 'WINE' ? 'bg-pink-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Wine Cellar</button>
                <button onClick={() => setActiveTab('RECIPES')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 ${activeTab === 'RECIPES' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>
                    <Martini className="w-4 h-4" /> Recipes
                </button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'HISTORY' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Empty Logs</button>
                <button onClick={() => setActiveTab('ANALYTICS')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'ANALYTICS' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}><BarChart2 className="w-4 h-4" /> Analytics</button>
             </div>
             {(activeTab === 'ACTIVE' || activeTab === 'WINE') && (
                 <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Open Bottle</button>
             )}
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
         
         {activeTab === 'ACTIVE' ? (
             <>
                {activeSpirits.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <Wine className="w-24 h-24 mb-4 text-gray-300" />
                        <p className="font-black text-lg uppercase tracking-widest">No Open Spirits</p>
                        <p className="text-sm">Click "Open Bottle" to start tracking.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeSpirits.map(bottle => {
                            const remainingTots = getRemainingTots(bottle);
                            const percentage = (bottle.currentVolume / bottle.totalVolume) * 100;
                            const isLow = percentage < 20;
                            const halfSize = Math.floor(bottle.totalVolume / 2);

                            return (
                                <div key={bottle.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                                    <div className={`h-2 w-full ${isLow ? 'bg-red-500' : 'bg-purple-500'}`}></div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-xl text-gray-800 leading-tight">{bottle.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                                        {bottle.totalVolume}ml
                                                    </span>
                                                    <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide border border-purple-100">
                                                        {bottle.measureStandard === 'NEW_25ML' ? '25ml Base' : '30ml Base'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold border border-gray-100">
                                                {remainingTots}
                                            </div>
                                        </div>

                                        {/* Visual Level */}
                                        <div className="mb-6 relative">
                                            <div className="flex justify-between text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                                <span>Level</span>
                                                <span className={isLow ? 'text-red-500' : 'text-purple-600'}>{bottle.currentVolume}ml left</span>
                                            </div>
                                            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2 mt-auto">
                                            <button onClick={() => initiatePour(bottle, 'SINGLE')} className="py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-xl font-bold text-[10px] uppercase flex flex-col items-center justify-center gap-1 active:scale-95">
                                                <span className="text-sm font-black">1</span> Single
                                            </button>
                                            <button onClick={() => initiatePour(bottle, 'DOUBLE')} className="py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-xl font-bold text-[10px] uppercase flex flex-col items-center justify-center gap-1 active:scale-95">
                                                <span className="text-sm font-black">2</span> Double
                                            </button>
                                            <button onClick={() => initiatePour(bottle, 'HALF_BOTTLE')} className="col-span-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95">
                                                <Wine className="w-3 h-3" /> Sell Half Bottle ({halfSize}ml)
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Footer */}
                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Open: {bottle.openedBy}</span>
                                        <button onClick={() => handleMarkEmpty(bottle.id)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase flex items-center gap-1"><Trash2 className="w-3 h-3" /> Mark Empty</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
             </>
         ) : activeTab === 'WINE' ? (
             <>
                {/* WINE DASHBOARD HEADER */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-pink-50 border border-pink-100 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-xs font-black text-pink-400 uppercase tracking-widest mb-1">Glasses Sold</p>
                        <h3 className="text-4xl font-black text-pink-700">{wineStats.glassesSold}</h3>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-1">Half Bottles</p>
                        <h3 className="text-4xl font-black text-purple-700">{wineStats.halfBottlesSold} <span className="text-sm text-purple-400">({wineStats.halfBottleVolumeLiters.toFixed(1)} L)</span></h3>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm">
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Bottles Sold</p>
                        <h3 className="text-4xl font-black text-indigo-700">{wineStats.fullBottlesSold}</h3>
                    </div>
                </div>

                {activeWines.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <Wine className="w-24 h-24 mb-4 text-pink-200" />
                        <p className="font-black text-lg uppercase tracking-widest text-pink-400">Wine Cellar Empty</p>
                        <p className="text-sm">Click "Open Bottle" and select Wine/Champagne type.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activeWines.map(bottle => {
                            const percentage = (bottle.currentVolume / bottle.totalVolume) * 100;
                            const isLow = percentage < 25;
                            const isChampagne = bottle.type === 'CHAMPAGNE';

                            return (
                                <div key={bottle.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group">
                                    <div className={`h-2 w-full ${isChampagne ? 'bg-amber-400' : 'bg-pink-500'}`}></div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-xl text-gray-800 leading-tight">{bottle.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${isChampagne ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-pink-50 text-pink-700 border-pink-200'}`}>
                                                        {bottle.type}
                                                    </span>
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                                        {bottle.totalVolume}ml
                                                    </span>
                                                </div>
                                            </div>
                                            {isChampagne && <Crown className="w-6 h-6 text-amber-400 fill-current" />}
                                        </div>

                                        {/* Visual Level */}
                                        <div className="mb-6 relative">
                                            <div className="flex justify-between text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
                                                <span>Remaining</span>
                                                <span className={isLow ? 'text-red-500' : 'text-gray-600'}>{bottle.currentVolume}ml</span>
                                            </div>
                                            <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden border border-gray-100 relative">
                                                {/* Liquid Animation Effect */}
                                                <div 
                                                    className={`h-full transition-all duration-700 ${isChampagne ? 'bg-amber-300/80' : 'bg-pink-400/80'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                                {/* Glass markers */}
                                                <div className="absolute inset-0 flex justify-evenly opacity-30">
                                                    <div className="w-px h-full bg-black"></div>
                                                    <div className="w-px h-full bg-black"></div>
                                                    <div className="w-px h-full bg-black"></div>
                                                    <div className="w-px h-full bg-black"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="grid grid-cols-2 gap-2 mt-auto">
                                            <button 
                                                onClick={() => initiateWineSale(bottle, 'GLASS')} 
                                                className={`py-3 rounded-xl font-black text-[10px] uppercase flex flex-col items-center justify-center gap-1 active:scale-95 border ${isChampagne ? 'bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100' : 'bg-pink-50 text-pink-800 border-pink-100 hover:bg-pink-100'}`}
                                            >
                                                <GlassWater className="w-4 h-4" /> Glass
                                            </button>
                                            <button 
                                                onClick={() => initiateWineSale(bottle, 'HALF_BOTTLE')} 
                                                className={`py-3 rounded-xl font-black text-[10px] uppercase flex flex-col items-center justify-center gap-1 active:scale-95 border ${isChampagne ? 'bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100' : 'bg-pink-50 text-pink-800 border-pink-100 hover:bg-pink-100'}`}
                                            >
                                                <div className="flex"><Wine className="w-3 h-3"/><span className="text-[8px]">1/2</span></div>
                                                Half
                                            </button>
                                            <button 
                                                onClick={() => initiateWineSale(bottle, 'FULL_BOTTLE')} 
                                                className="col-span-2 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                                            >
                                                <Wine className="w-4 h-4" /> Full Bottle
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Open: {bottle.openedBy}</span>
                                        <button onClick={() => handleMarkEmpty(bottle.id)} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase flex items-center gap-1"><Trash2 className="w-3 h-3" /> Finish</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
             </>
         ) : activeTab === 'RECIPES' ? (
             /* --- RECIPES & MIXERS TAB --- */
             <div className="flex flex-col xl:flex-row gap-8 animate-in fade-in duration-300">
                 
                 {/* LEFT: RECIPE FORM */}
                 <div className="w-full xl:w-5/12 space-y-6">
                     <div className="bg-white rounded-[2.5rem] border border-orange-100 shadow-xl overflow-hidden">
                         <div className="p-8 bg-orange-500 text-white">
                             <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                                 <Martini className="w-8 h-8 text-orange-200" /> Recipe Tracker
                             </h2>
                             <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mt-1">Record cocktail production & mixer usage</p>
                         </div>
                         
                         <div className="p-8 space-y-6">
                             {/* Basic Info */}
                             <div className="space-y-4">
                                 <div className="space-y-1">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cocktail Name</label>
                                     <input 
                                        value={recipeForm.cocktailName}
                                        onChange={e => setRecipeForm({...recipeForm, cocktailName: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
                                        placeholder="e.g. Long Island Iced Tea"
                                     />
                                 </div>
                                 <div className="space-y-1">
                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prepared By</label>
                                     <input 
                                        value={recipeForm.staffName}
                                        onChange={e => setRecipeForm({...recipeForm, staffName: e.target.value})}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-orange-500"
                                     />
                                 </div>
                             </div>

                             {/* Ingredients Search & List */}
                             <div className="space-y-3">
                                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mixers & Ingredients (Store & Products)</label>
                                 
                                 {/* Search */}
                                 <div className="relative">
                                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                     <input 
                                        value={ingredientSearch}
                                        onChange={e => setIngredientSearch(e.target.value)}
                                        placeholder="Search sodas, juices, garnishes..."
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                     />
                                     {/* Suggestions Dropdown */}
                                     {ingredientSearch && filteredMixers.length > 0 && (
                                         <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                             {filteredMixers.map(item => (
                                                 <div 
                                                    key={item.id}
                                                    onClick={() => handleAddMixer(item)}
                                                    className="px-4 py-2 hover:bg-orange-50 cursor-pointer flex justify-between items-center border-b border-gray-50"
                                                 >
                                                     <div>
                                                        <span className="font-bold text-sm text-gray-800 block">{item.name}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{item.type === 'PRODUCT' ? 'Product Inventory' : 'Store Inventory'}</span>
                                                     </div>
                                                     <span className="text-[10px] font-bold text-gray-400">{item.stock} {item.unit} available</span>
                                                 </div>
                                             ))}
                                         </div>
                                     )}
                                 </div>

                                 {/* Selected Ingredients List */}
                                 <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px]">
                                     {recipeForm.ingredients.length === 0 ? (
                                         <p className="text-center text-gray-400 text-xs italic py-4">No ingredients added yet.</p>
                                     ) : (
                                         recipeForm.ingredients.map((ing, idx) => (
                                             <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                 <div>
                                                     <span className="font-bold text-sm text-gray-700 block">{ing.name}</span>
                                                     <span className="text-[9px] font-bold text-gray-400 uppercase">{ing.isProduct ? 'Product' : 'Store'}</span>
                                                 </div>
                                                 <div className="flex items-center gap-3">
                                                     <div className="flex items-center bg-gray-100 rounded-lg">
                                                         <button onClick={() => handleUpdateMixerQty(ing.itemId, Math.max(0.1, ing.quantity - 1))} className="px-2 py-1 text-gray-500 hover:text-black font-bold">-</button>
                                                         <span className="text-xs font-black w-8 text-center">{ing.quantity}</span>
                                                         <button onClick={() => handleUpdateMixerQty(ing.itemId, ing.quantity + 1)} className="px-2 py-1 text-gray-500 hover:text-black font-bold">+</button>
                                                     </div>
                                                     <span className="text-[10px] text-gray-400 font-bold uppercase w-8">{ing.unit}</span>
                                                     <button onClick={() => handleRemoveMixer(ing.itemId)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                                 </div>
                                             </div>
                                         ))
                                     )}
                                 </div>
                             </div>

                             <button 
                                onClick={handleRecordRecipe}
                                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition-all"
                             >
                                 <Save className="w-5 h-5" /> Record & Deduct Stock
                             </button>
                         </div>
                     </div>
                 </div>

                 {/* RIGHT: HISTORY LOG */}
                 <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px] xl:h-auto">
                     <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                         <h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                             <History className="w-5 h-5 text-gray-400" /> Recent Cocktails
                         </h3>
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{recipeHistory.length} Recorded</span>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                         {recipeHistory.length === 0 ? (
                             <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-60">
                                 <ClipboardList className="w-16 h-16 mb-4" />
                                 <p className="font-black text-sm uppercase tracking-widest">No Recent Logs</p>
                             </div>
                         ) : (
                             <div className="space-y-4">
                                 {recipeHistory.map((log, idx) => (
                                     <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                                         <div className="flex justify-between items-start mb-2">
                                             <div>
                                                 <h4 className="font-black text-gray-800">{log.cocktail}</h4>
                                                 <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mt-1">
                                                     <Utensils className="w-3 h-3" /> By {log.staff}
                                                 </p>
                                             </div>
                                             <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                                                 {log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                             </span>
                                         </div>
                                         <div className="pt-3 border-t border-gray-50">
                                             <p className="text-xs font-medium text-gray-600 leading-relaxed">
                                                 <span className="font-bold text-orange-600">Used:</span> {log.details}
                                             </p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                 </div>

             </div>
         ) : activeTab === 'ANALYTICS' ? (
             /* ANALYTICS REPORT VIEW */
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 {/* ... (Existing Analytics View) ... */}
                 {/* Filters & Stats */}
                 <div className="flex flex-col md:flex-row gap-6">
                     <div className="w-full md:w-64 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm shrink-0">
                         <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Filter className="w-3 h-3" /> Report Period</h4>
                         <div className="space-y-2">
                             {['TODAY', 'WEEK', 'MONTH', 'LAST_MONTH'].map(p => (
                                 <button key={p} onClick={() => setReportPeriod(p as ReportPeriod)} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-xs uppercase transition-all ${reportPeriod === p ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>{p.replace('_', ' ')}</button>
                             ))}
                         </div>
                     </div>
                     <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                             <div className="relative z-10"><p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Direct Sales</p><h3 className="text-4xl font-black text-purple-600">{analyticsData.directTots} <span className="text-lg text-gray-400">Tots</span></h3><p className="text-xs text-gray-500 mt-2 font-medium">Straight pours & shots</p></div>
                             <div className="absolute -right-4 -bottom-4 bg-purple-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><GlassWater className="w-10 h-10 text-purple-200" /></div>
                         </div>
                         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                             <div className="relative z-10"><p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Cocktail Usage</p><h3 className="text-4xl font-black text-pink-500">{analyticsData.cocktailTots} <span className="text-lg text-gray-400">Tots</span></h3><p className="text-xs text-gray-500 mt-2 font-medium">Used in mixed drinks</p></div>
                             <div className="absolute -right-4 -bottom-4 bg-pink-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Martini className="w-10 h-10 text-pink-200" /></div>
                         </div>
                         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                             <div className="relative z-10"><p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Half Bottles</p><h3 className="text-4xl font-black text-indigo-500">{Math.round(analyticsData.halfBottleVolume / 100) / 10} <span className="text-lg text-gray-400">Ltrs</span></h3><p className="text-xs text-gray-500 mt-2 font-medium">Sold as half units</p></div>
                             <div className="absolute -right-4 -bottom-4 bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Wine className="w-10 h-10 text-indigo-200" /></div>
                         </div>
                     </div>
                 </div>
                 {/* Table */}
                 <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                         <div><h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2"><History className="w-5 h-5 text-gray-400" /> Usage Log</h3></div>
                         <div className="text-right"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Volume</p><p className="text-2xl font-black text-gray-900">{analyticsData.logs.reduce((sum, l) => sum + l.quantityMl, 0).toLocaleString()} ml</p></div>
                     </div>
                     <div className="overflow-x-auto">
                         <table className="w-full text-left">
                             <thead>
                                 <tr className="bg-white text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                                     <th className="px-6 py-4">Date & Time</th>
                                     <th className="px-6 py-4">Bottle Name</th>
                                     <th className="px-6 py-4">Type</th>
                                     <th className="px-6 py-4 text-center">Tots/Units</th>
                                     <th className="px-6 py-4 text-right">Volume</th>
                                     <th className="px-6 py-4 text-right">Staff</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100 text-sm font-bold text-gray-700">
                                 {analyticsData.logs.map((log) => (
                                     <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                         <td className="px-6 py-4 text-gray-800">{log.timestamp.toLocaleString()}</td>
                                         <td className="px-6 py-4 text-gray-800">{log.bottleName}</td>
                                         <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] uppercase font-black ${log.type === 'DIRECT' ? 'bg-purple-100 text-purple-700' : 'bg-pink-100 text-pink-700'}`}>{log.type}</span></td>
                                         <td className="px-6 py-4 text-center">{log.tots}</td>
                                         <td className="px-6 py-4 text-right font-mono text-gray-500">-{log.quantityMl} ml</td>
                                         <td className="px-6 py-4 text-right text-xs uppercase">{log.staffName}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 </div>
             </div>
         ) : activeTab === 'SEARCH' ? (
             <div className="bg-white rounded-[2.5rem] p-8 text-center text-gray-400">Search implementation coming soon...</div>
         ) : activeTab === 'HISTORY' ? (
             /* HISTORY VIEW */
             <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
                 <table className="w-full text-left">
                     <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                         <tr><th className="px-6 py-4">Bottle</th><th className="px-6 py-4">Size</th><th className="px-6 py-4">Opened By</th><th className="px-6 py-4">Opened Date</th><th className="px-6 py-4 text-center">Status</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 text-sm font-bold text-gray-700">
                         {historyBottles.map(bottle => (
                             <tr key={bottle.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-6 py-4">{bottle.name}</td>
                                 <td className="px-6 py-4">{bottle.totalVolume}ml</td>
                                 <td className="px-6 py-4">{bottle.openedBy}</td>
                                 <td className="px-6 py-4">{bottle.openedAt.toLocaleDateString()}</td>
                                 <td className="px-6 py-4 text-center"><span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">Finished</span></td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
         ) : null}

      </div>

      {/* --- CONFIRMATION MODAL (SALE) --- */}
      {pendingPour && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 bg-gray-900 text-white">
                      <h3 className="text-xl font-black uppercase tracking-tight text-center">Confirm Sale</h3>
                      <p className="text-gray-400 text-xs font-bold text-center mt-1 uppercase tracking-widest">Print Ticket for Barman</p>
                  </div>
                  
                  <div className="p-6 space-y-6">
                      <div className="text-center space-y-1">
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Selling</p>
                          <p className="text-2xl font-black text-purple-600">
                              {pendingPour.sizeType.replace('_', ' ')} ({pendingPour.volume}ml)
                          </p>
                          <p className="font-bold text-gray-800">{pendingPour.bottleName}</p>
                      </div>

                      {pendingPour.sizeType !== 'HALF_BOTTLE' && pendingPour.sizeType !== 'GLASS' && pendingPour.sizeType !== 'FULL_BOTTLE' && (
                          <div className="space-y-3">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Select Consumption Type</p>
                              <div className="grid grid-cols-2 gap-3">
                                  <button onClick={() => setConsumptionMode('DIRECT')} className={`py-4 rounded-xl font-black text-xs uppercase flex flex-col items-center gap-2 border-2 transition-all ${consumptionMode === 'DIRECT' ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-purple-200'}`}>
                                      <GlassWater className="w-6 h-6" /> Direct / Plain
                                  </button>
                                  <button onClick={() => setConsumptionMode('COCKTAIL')} className={`py-4 rounded-xl font-black text-xs uppercase flex flex-col items-center gap-2 border-2 transition-all ${consumptionMode === 'COCKTAIL' ? 'bg-pink-500 text-white border-pink-500 shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-pink-200'}`}>
                                      <Martini className="w-6 h-6" /> Cocktail Mix
                                  </button>
                              </div>
                          </div>
                      )}

                      <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
                          <button onClick={confirmPour} className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-white ${consumptionMode === 'DIRECT' ? 'bg-purple-700 hover:bg-purple-800' : 'bg-pink-600 hover:bg-pink-700'}`}>
                              <Printer className="w-5 h-5" /> Print Ticket & Record
                          </button>
                          <button onClick={() => setPendingPour(null)} className="w-full py-3 text-gray-400 font-bold text-xs uppercase hover:text-gray-600">Cancel</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- OPEN BOTTLE MODAL --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="p-8 bg-purple-700 text-white flex justify-between items-center">
                      <div>
                          <h2 className="text-xl font-black uppercase tracking-tight">Open New Bottle</h2>
                          <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mt-1">Register Spirit Inventory & Prices</p>
                      </div>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <form onSubmit={handleOpenBottle} className="p-8 space-y-6">
                      
                      {/* Name Input with Catalog Suggestions */}
                      <div className="space-y-2 relative">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                              Spirit Name
                              <span className="text-purple-600 cursor-pointer hover:underline flex items-center gap-1" onClick={() => setShowCatalogSuggestions(!showCatalogSuggestions)}>
                                  <BookOpen className="w-3 h-3" /> Catalog
                              </span>
                          </label>
                          <div className="relative">
                              <input 
                                  autoFocus 
                                  required 
                                  value={newBottle.name} 
                                  onChange={e => {
                                      setNewBottle({...newBottle, name: e.target.value});
                                      setShowCatalogSuggestions(true);
                                  }} 
                                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500" 
                                  placeholder="e.g. Jameson" 
                              />
                              {showCatalogSuggestions && catalogSpirits.length > 0 && (
                                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                      {catalogSpirits.filter(p => p.name.toLowerCase().includes(newBottle.name.toLowerCase())).map(p => (
                                          <div 
                                              key={p.id}
                                              onClick={() => handleCatalogSelect(p)}
                                              className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 flex justify-between items-center"
                                          >
                                              <span className="font-bold text-sm text-gray-800">{p.name}</span>
                                              <span className="text-[10px] font-bold text-gray-400 uppercase">{p.category}</span>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Type Selection */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Beverage Type</label>
                          <select 
                              value={newBottle.type}
                              onChange={(e) => setNewBottle({...newBottle, type: e.target.value})}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
                          >
                              {SPIRIT_TYPES.map(type => (
                                  <option key={type} value={type}>{type}</option>
                              ))}
                          </select>
                      </div>

                      {/* Size Selection */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bottle Size (Total Volume)</label>
                          <div className="grid grid-cols-3 gap-2">
                              {BOTTLE_SIZES.map(size => (
                                  <button key={size.value} type="button" onClick={() => setNewBottle({...newBottle, size: size.value})} className={`py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${newBottle.size === size.value ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>{size.label}</button>
                              ))}
                          </div>
                      </div>

                      {/* Standard Selection */}
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Scale className="w-3 h-3" /> Measuring Standard</label>
                          <div className="flex flex-col gap-2">
                              <label className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${newBottle.standard === 'NEW_25ML' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                                  <input type="radio" name="standard" className="accent-purple-600 w-4 h-4" checked={newBottle.standard === 'NEW_25ML'} onChange={() => setNewBottle({...newBottle, standard: 'NEW_25ML'})} />
                                  <div><p className={`font-black text-xs uppercase ${newBottle.standard === 'NEW_25ML' ? 'text-purple-900' : 'text-gray-700'}`}>New Standard (25ml)</p></div>
                              </label>
                              <label className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${newBottle.standard === 'OLD_30ML' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                                  <input type="radio" name="standard" className="accent-purple-600 w-4 h-4" checked={newBottle.standard === 'OLD_30ML'} onChange={() => setNewBottle({...newBottle, standard: 'OLD_30ML'})} />
                                  <div><p className={`font-black text-xs uppercase ${newBottle.standard === 'OLD_30ML' ? 'text-purple-900' : 'text-gray-700'}`}>Old Standard (30ml)</p></div>
                              </label>
                          </div>
                      </div>

                      {/* Price Configuration */}
                      <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><DollarSign className="w-3 h-3"/> Selling Prices</label>
                          <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase">Single Tot</label>
                                  <input type="number" value={newBottle.prices.single} onChange={e => setNewBottle({...newBottle, prices: {...newBottle.prices, single: e.target.value}})} className="w-full px-3 py-2 border rounded-lg text-sm font-bold" placeholder="0.00" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase">Double Tot</label>
                                  <input type="number" value={newBottle.prices.double} onChange={e => setNewBottle({...newBottle, prices: {...newBottle.prices, double: e.target.value}})} className="w-full px-3 py-2 border rounded-lg text-sm font-bold" placeholder="0.00" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase">Half Bottle</label>
                                  <input type="number" value={newBottle.prices.half} onChange={e => setNewBottle({...newBottle, prices: {...newBottle.prices, half: e.target.value}})} className="w-full px-3 py-2 border rounded-lg text-sm font-bold" placeholder="0.00" />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-gray-400 uppercase">Full Bottle</label>
                                  <input type="number" value={newBottle.prices.full} onChange={e => setNewBottle({...newBottle, prices: {...newBottle.prices, full: e.target.value}})} className="w-full px-3 py-2 border rounded-lg text-sm font-bold" placeholder="0.00" />
                              </div>
                          </div>
                      </div>

                      <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                          <CheckCircle2 className="w-5 h-5" /> Confirm & Open
                      </button>

                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default SpiritsInventoryView;
