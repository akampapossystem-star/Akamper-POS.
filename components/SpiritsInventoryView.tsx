
import React, { useState, useMemo } from 'react';
import { 
  Wine, Plus, Scale, AlertCircle, History, GlassWater, Droplets, CheckCircle2, 
  Trash2, Archive, Settings, ArrowRight, Save, Martini, X, BarChart2, Calendar, Filter, Search, Printer, DollarSign, BookOpen, Crown,
  TrendingUp, Circle, ClipboardList, Utensils, Box, Info, Clock, Tag, ChevronRight, FileText, Activity
} from 'lucide-react';
import { SpiritBottle, StaffMember, SystemConfig, SpiritLog, Product, StoreItem, StockMovementLog, OrderItem, SpiritCategory } from '../types';

interface SpiritsInventoryViewProps {
  bottles: SpiritBottle[];
  onUpdateBottles: (bottles: SpiritBottle[]) => void;
  currentUser: StaffMember | null;
  systemConfig: SystemConfig;
  products?: Product[]; 
  onUpdateProducts?: (products: Product[]) => void; 
  storeItems: StoreItem[];
  onUpdateStoreItems: (items: StoreItem[]) => void;
  onAddStockLog: (log: StockMovementLog) => void;
  onInjectOrderItems?: (tableName: string, items: OrderItem[]) => void;
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

const SPIRIT_TYPES: SpiritCategory[] = [
    'WHISKEY', 'VODKA', 'GIN', 'RUM', 'TEQUILA', 'BRANDY', 'LIQUEUR', 'WINE', 'CHAMPAGNE',
    'COGNAC', 'SINGLE MALT', 'IRISH WHISKEY', 'BLENDED WHISKY'
];

type ReportPeriod = 'TODAY' | 'WEEK' | 'MONTH';

const SpiritsInventoryView: React.FC<SpiritsInventoryViewProps> = ({ 
    bottles, onUpdateBottles, currentUser, systemConfig, products = [], onUpdateProducts,
    storeItems = [], onUpdateStoreItems, onAddStockLog, onInjectOrderItems
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'WINE' | 'HISTORY' | 'ANALYTICS'>('ACTIVE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('TODAY');
  
  const [showDetailedInfo, setShowDetailedInfo] = useState<string | null>(null);
  const [selectedTableName, setSelectedTableName] = useState('');

  const [newBottle, setNewBottle] = useState<{
      name: string;
      type: SpiritCategory;
      size: number;
      standard: 'NEW_25ML' | 'OLD_30ML';
      openedAt: string;
      status: 'OPEN' | 'EMPTY';
      prices: { single: string, double: string, half: string, full: string };
  }>({
      name: '',
      type: 'WHISKEY',
      size: 750,
      standard: 'NEW_25ML',
      openedAt: new Date().toISOString().split('T')[0],
      status: 'OPEN',
      prices: { single: '', double: '', half: '', full: '' }
  });

  const [showCatalogSuggestions, setShowCatalogSuggestions] = useState(false);

  const catalogSpirits = useMemo(() => {
      return products.filter(p => p.spiritConfig?.isSpirit);
  }, [products]);

  const [pendingPour, setPendingPour] = useState<{
      bottleId: string;
      bottleName: string;
      sizeType: 'SINGLE' | 'DOUBLE' | 'HALF_BOTTLE' | 'GLASS' | 'FULL_BOTTLE';
      volume: number;
      price: number;
  } | null>(null);
  
  const [consumptionMode, setConsumptionMode] = useState<'DIRECT' | 'COCKTAIL'>('DIRECT');

  const isWinePour = useMemo(() => {
    if (!pendingPour) return false;
    const bottle = bottles.find(b => b.id === pendingPour.bottleId);
    return !!(bottle && ['WINE', 'CHAMPAGNE'].includes(bottle.type));
  }, [pendingPour, bottles]);

  const activeSpirits = bottles.filter(b => b.status === 'OPEN' && !['WINE', 'CHAMPAGNE'].includes(b.type));
  const activeWines = bottles.filter(b => b.status === 'OPEN' && ['WINE', 'CHAMPAGNE'].includes(b.type));

  const reportData = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    if (reportPeriod === 'TODAY') startDate.setHours(0, 0, 0, 0);
    else if (reportPeriod === 'WEEK') startDate.setDate(now.getDate() - 7);
    else if (reportPeriod === 'MONTH') startDate.setMonth(now.getMonth() - 1);

    const allLogs: (SpiritLog & { bottleName: string, bottleType: string })[] = [];
    bottles.forEach(b => {
      b.logs?.forEach(log => {
        const logDate = new Date(log.timestamp);
        if (logDate >= startDate) {
          allLogs.push({ ...log, bottleName: b.name, bottleType: b.type });
        }
      });
    });

    const sortedLogs = allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const revenue = sortedLogs.reduce((sum, log) => {
        const bottle = bottles.find(b => b.name === log.bottleName);
        let logPrice = 0;
        if (log.type === 'GLASS') logPrice = bottle?.prices?.single || 0;
        else if (log.type === 'HALF_BOTTLE') logPrice = bottle?.prices?.half || 0;
        else if (log.type === 'FULL_BOTTLE') logPrice = bottle?.prices?.full || 0;
        else if (log.type === 'DIRECT' || log.type === 'COCKTAIL') {
            if (log.tots === 1) logPrice = bottle?.prices?.single || 0;
            else if (log.tots === 2) logPrice = bottle?.prices?.double || 0;
            else logPrice = (bottle?.prices?.single || 0) * log.tots;
        }
        return sum + logPrice;
    }, 0);

    const movers = sortedLogs.reduce((acc, log) => {
        acc[log.bottleName] = (acc[log.bottleName] || 0) + log.tots;
        return acc;
    }, {} as Record<string, number>);

    const topMovers = Object.entries(movers)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return { logs: sortedLogs, revenue, topMovers, totalTots: sortedLogs.reduce((s, l) => s + l.tots, 0), volume: sortedLogs.reduce((s, l) => s + l.quantityMl, 0) };
  }, [bottles, reportPeriod]);

  const getRemainingTots = (bottle: SpiritBottle) => {
      const singleSize = bottle.measureStandard === 'NEW_25ML' ? 25 : 30;
      return Math.floor(bottle.currentVolume / singleSize);
  };

  const handleCatalogSelect = (product: Product) => {
      let type: SpiritCategory = 'WHISKEY';
      const cat = product.category.toUpperCase() as SpiritCategory;
      if (SPIRIT_TYPES.includes(cat)) type = cat;
      else if (cat === 'DRINKS' as any && product.name.toLowerCase().includes('wine')) type = 'WINE';
      
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
      const bottle: SpiritBottle = {
          id: `BTL-${Date.now()}`,
          name: newBottle.name,
          type: newBottle.type,
          totalVolume: newBottle.size,
          currentVolume: newBottle.size,
          measureStandard: newBottle.standard,
          status: 'OPEN',
          openedAt: new Date(newBottle.openedAt),
          openedBy: currentUser?.name || 'Barman',
          logs: [],
          isHalfBottleStart: newBottle.size <= 375,
          prices: {
              single: parseFloat(newBottle.prices.single) || 0,
              double: parseFloat(newBottle.prices.double) || 0,
              half: parseFloat(newBottle.prices.half) || 0,
              full: parseFloat(newBottle.prices.full) || 0,
          }
      };
      onUpdateBottles([bottle, ...bottles]);
      setIsModalOpen(false);
      setNewBottle({ name: '', type: 'WHISKEY', size: 750, standard: 'NEW_25ML', openedAt: new Date().toISOString().split('T')[0], status: 'OPEN', prices: { single: '', double: '', half: '', full: '' } });
  };

  const initiatePour = (bottle: SpiritBottle, type: 'SINGLE' | 'DOUBLE' | 'HALF_BOTTLE') => {
      const singleSize = bottle.measureStandard === 'NEW_25ML' ? 25 : 30;
      const doubleSize = bottle.measureStandard === 'NEW_25ML' ? 50 : 60;
      let deductAmount = type === 'SINGLE' ? singleSize : type === 'DOUBLE' ? doubleSize : Math.floor(bottle.totalVolume / 2);

      if (bottle.currentVolume < deductAmount) {
          alert(`Not enough spirit remaining! Only ${bottle.currentVolume}ml left.`);
          return;
      }

      let price = 0;
      if (type === 'SINGLE') price = bottle.prices?.single || 0;
      else if (type === 'DOUBLE') price = bottle.prices?.double || 0;
      else if (type === 'HALF_BOTTLE') price = bottle.prices?.half || 0;

      setPendingPour({ bottleId: bottle.id, bottleName: bottle.name, sizeType: type, volume: deductAmount, price });
      setConsumptionMode('DIRECT'); 
  };

  const initiateWineSale = (bottle: SpiritBottle, type: 'GLASS' | 'HALF_BOTTLE' | 'FULL_BOTTLE') => {
      let volume = type === 'GLASS' ? 150 : type === 'HALF_BOTTLE' ? Math.floor(bottle.totalVolume / 2) : bottle.currentVolume;
      if (bottle.currentVolume < volume) {
          alert(`Insufficient volume! Only ${bottle.currentVolume}ml remaining.`);
          return;
      }

      let price = 0;
      if (type === 'GLASS') price = bottle.prices?.single || 0;
      else if (type === 'HALF_BOTTLE') price = bottle.prices?.half || 0;
      else if (type === 'FULL_BOTTLE') price = bottle.prices?.full || 0;

      setPendingPour({ bottleId: bottle.id, bottleName: bottle.name, sizeType: type, volume: volume, price });
  };

  const confirmPour = () => {
      if (!pendingPour) return;
      
      if (selectedTableName && onInjectOrderItems) {
          const product: Product = {
              id: pendingPour.bottleId,
              name: `${pendingPour.bottleName} (${pendingPour.sizeType.replace('_', ' ')})`,
              price: pendingPour.price,
              category: 'Alcohol',
              image: '',
              stock: 1,
              popularity: 0
          };
          onInjectOrderItems(selectedTableName, [{ product, quantity: 1 }]);
      }

      onUpdateBottles(bottles.map(b => {
          if (b.id === pendingPour.bottleId) {
              const newVolume = b.currentVolume - pendingPour.volume;
              const singleSize = b.measureStandard === 'NEW_25ML' ? 25 : 30;
              const emptyThreshold = pendingPour.sizeType === 'GLASS' ? 20 : singleSize;
              const newStatus = newVolume < emptyThreshold ? 'EMPTY' : 'OPEN';
              
              let logType: SpiritLog['type'] = consumptionMode;
              if (['WINE', 'CHAMPAGNE'].includes(b.type)) {
                  logType = (pendingPour.sizeType === 'GLASS' ? 'GLASS' : (pendingPour.sizeType === 'HALF_BOTTLE' ? 'HALF_BOTTLE' : 'FULL_BOTTLE')) as any;
              } else if (pendingPour.sizeType === 'HALF_BOTTLE') {
                  logType = 'HALF_BOTTLE';
              }

              const logEntry: SpiritLog = {
                  id: `LOG-${Date.now()}`,
                  timestamp: new Date(),
                  quantityMl: pendingPour.volume,
                  tots: (['GLASS', 'FULL_BOTTLE', 'HALF_BOTTLE'].includes(pendingPour.sizeType) && ['WINE', 'CHAMPAGNE'].includes(b.type)) ? 1 : (pendingPour.sizeType === 'SINGLE' ? 1 : (pendingPour.sizeType === 'DOUBLE' ? 2 : Math.floor(pendingPour.volume / singleSize))),
                  type: logType,
                  staffName: currentUser?.name || 'Staff'
              };
              return { ...b, currentVolume: Math.max(0, newVolume), status: newStatus, logs: b.logs ? [...b.logs, logEntry] : [logEntry] };
          }
          return b;
      }));
      setPendingPour(null);
  };

  const BottleCard: React.FC<{ bottle: SpiritBottle }> = ({ bottle }) => {
      const remainingTots = getRemainingTots(bottle);
      const percentage = (bottle.currentVolume / bottle.totalVolume) * 100;
      const isExpanded = showDetailedInfo === bottle.id;
      const isWine = ['WINE', 'CHAMPAGNE'].includes(bottle.type);

      return (
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group">
              <div className={`h-2 w-full ${percentage < 20 ? 'bg-red-500' : isWine ? 'bg-pink-500' : 'bg-purple-600'}`}></div>
              <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0">
                          <h3 className="font-black text-lg text-gray-800 leading-tight truncate" title={bottle.name}>{bottle.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-black uppercase tracking-widest">{bottle.type}</span>
                              <span className="text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-purple-100">{bottle.measureStandard.replace('NEW_', '').replace('OLD_', '')}</span>
                          </div>
                      </div>
                      <button 
                        onClick={() => setShowDetailedInfo(isExpanded ? null : bottle.id)}
                        className={`p-2 rounded-full transition-all ${isExpanded ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:text-purple-600'}`}
                      >
                          <Info className="w-4 h-4" />
                      </button>
                  </div>

                  {isExpanded ? (
                      <div className="flex-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="grid grid-cols-2 gap-2">
                              <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                  <p className="text-[8px] font-black text-gray-400 uppercase">Single</p>
                                  <p className="text-xs font-black text-slate-800">{systemConfig.currency} {bottle.prices?.single.toLocaleString() || '-'}</p>
                              </div>
                              <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                  <p className="text-[8px] font-black text-gray-400 uppercase">Double</p>
                                  <p className="text-xs font-black text-slate-800">{systemConfig.currency} {bottle.prices?.double.toLocaleString() || '-'}</p>
                              </div>
                              <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                  <p className="text-[8px] font-black text-gray-400 uppercase">Half Bottle</p>
                                  <p className="text-xs font-black text-slate-800">{systemConfig.currency} {bottle.prices?.half.toLocaleString() || '-'}</p>
                              </div>
                              <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 text-center">
                                  <p className="text-[8px] font-black text-gray-400 uppercase">Full Bottle</p>
                                  <p className="text-xs font-black text-slate-800">{systemConfig.currency} {bottle.prices?.full.toLocaleString() || '-'}</p>
                              </div>
                          </div>
                          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400">
                              <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(bottle.openedAt).toLocaleDateString()}</div>
                              <span className="uppercase text-emerald-600 bg-emerald-50 px-1.5 rounded">{bottle.status}</span>
                          </div>
                      </div>
                  ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Remaining</span>
                                <span className="text-xl font-black text-gray-800">{bottle.currentVolume}ml</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Tots</span>
                                <span className="text-xl font-black text-purple-600">{remainingTots}</span>
                            </div>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                            <div className={`h-full rounded-full transition-all duration-700 ${percentage < 20 ? 'bg-red-500' : isWine ? 'bg-pink-500' : 'bg-purple-600'}`} style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                            {isWine ? (
                                <>
                                    <button onClick={() => initiateWineSale(bottle, 'GLASS')} className="py-3 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-100 rounded-xl font-black text-[10px] uppercase active:scale-95">Glass</button>
                                    <button onClick={() => initiateWineSale(bottle, 'FULL_BOTTLE')} className="py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase active:scale-95">Bottle</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => initiatePour(bottle, 'SINGLE')} className="py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-xl font-black text-[10px] uppercase active:scale-95">Single</button>
                                    <button onClick={() => initiatePour(bottle, 'DOUBLE')} className="py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100 rounded-xl font-black text-[10px] uppercase active:scale-95">Double</button>
                                </>
                            )}
                        </div>
                      </>
                  )}
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  <span>Opener: {bottle.openedBy}</span>
                  <button onClick={() => onUpdateBottles(bottles.map(b => b.id === bottle.id ? { ...b, currentVolume: 0, status: 'EMPTY' } : b))} className="text-red-400 hover:text-red-600">Finish</button>
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden font-sans">
      <div className="p-8 border-b border-gray-200 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0 shadow-sm z-10">
         <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3"><Wine className="w-8 h-8 text-purple-600" /> Spirits module</h1>
            <p className="text-gray-500 font-medium">Detailed audit of open stock and multi-measure pricing.</p>
         </div>
         <div className="flex gap-3">
             <div className="bg-gray-100 p-1 rounded-xl flex shadow-inner">
                <button onClick={() => setActiveTab('ACTIVE')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ACTIVE' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Spirits</button>
                <button onClick={() => setActiveTab('WINE')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1 ${activeTab === 'WINE' ? 'bg-pink-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Wines</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1 ${activeTab === 'HISTORY' ? 'bg-slate-700 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>Empty Log</button>
                <button onClick={() => setActiveTab('ANALYTICS')} className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ANALYTICS' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}><BarChart2 className="w-4 h-4" /> Reports</button>
             </div>
             <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-2 active:scale-95"><Plus className="w-4 h-4" /> Open New</button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
         {activeTab === 'ACTIVE' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {activeSpirits.map(bottle => <BottleCard key={bottle.id} bottle={bottle} />)}
                {activeSpirits.length === 0 && <div className="col-span-full py-20 text-center opacity-30 font-black uppercase tracking-[0.3em] text-slate-400"><Wine className="w-20 h-20 mx-auto mb-4" /> No Active Spirits</div>}
             </div>
         )}
         {activeTab === 'WINE' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {activeWines.map(bottle => <BottleCard key={bottle.id} bottle={bottle} />)}
                {activeWines.length === 0 && <div className="col-span-full py-20 text-center opacity-30 font-black uppercase tracking-[0.3em] text-slate-400"><Wine className="w-20 h-20 mx-auto mb-4" /> Cellar is Empty</div>}
             </div>
         )}
         {activeTab === 'HISTORY' && (
             <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200">
                        <tr>
                            <th className="p-6">Time Finished</th>
                            <th className="p-6">Bottle Detail</th>
                            <th className="p-6">Total Vol.</th>
                            <th className="p-6">Standard</th>
                            <th className="p-6">Opener</th>
                            <th className="p-6 text-right">Log History</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm font-bold text-slate-800">
                        {bottles.filter(b => b.status === 'EMPTY').sort((a,b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()).map(b => (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6 text-xs text-gray-400 font-mono">{new Date(b.openedAt).toLocaleString()}</td>
                                <td className="p-6">
                                    <span className="block">{b.name}</span>
                                    <span className="text-[9px] uppercase text-purple-600 bg-purple-50 px-1 rounded">{b.type}</span>
                                </td>
                                <td className="p-6">{b.totalVolume}ml</td>
                                <td className="p-6 text-[10px] font-black">{b.measureStandard.replace('_', ' ')}</td>
                                <td className="p-6 uppercase text-[10px] text-gray-500">{b.openedBy}</td>
                                <td className="p-6 text-right"><span className="bg-gray-100 px-3 py-1 rounded-full text-[10px]">{b.logs?.length || 0} Pours</span></td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
         )}
         {activeTab === 'ANALYTICS' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center">
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 flex">
                        {(['TODAY', 'WEEK', 'MONTH'] as ReportPeriod[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setReportPeriod(p)}
                                className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportPeriod === p ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><DollarSign className="w-20 h-20 text-emerald-600" /></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Spirit Revenue</p>
                        <h3 className="text-3xl font-black text-slate-900">{systemConfig.currency} {reportData.revenue.toLocaleString()}</h3>
                        <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded">
                            <TrendingUp className="w-3 h-3" /> Live Audit
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-10"><GlassWater className="w-20 h-20 text-purple-600" /></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pours</p>
                        <h3 className="text-3xl font-black text-slate-900">{reportData.totalTots} <span className="text-sm font-medium text-gray-400 uppercase">Tots</span></h3>
                        <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase">Across all measures</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-10"><Droplets className="w-20 h-20 text-blue-600" /></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Volume Lost</p>
                        <h3 className="text-3xl font-black text-slate-900">{reportData.volume} <span className="text-sm font-medium text-gray-400 uppercase">ml</span></h3>
                        <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase">Deducted from stock</p>
                    </div>
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-20"><Activity className="w-20 h-20 text-white" /></div>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Active Bottles</p>
                        <h3 className="text-3xl font-black">{bottles.filter(b => b.status === 'OPEN').length}</h3>
                        <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-blue-400">
                             Inventory Depth: {bottles.length}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-500" /> Most Poured
                        </h4>
                        <div className="space-y-4">
                            {reportData.topMovers.map((mover, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 flex items-center justify-center bg-white rounded-lg text-[10px] font-black text-gray-400 shadow-sm border border-gray-100 group-hover:text-purple-600 transition-colors">{i+1}</span>
                                        <span className="font-bold text-gray-700 text-sm truncate max-w-[150px]">{mover.name}</span>
                                    </div>
                                    <span className="font-black text-purple-600 text-sm">{mover.count} <span className="text-[10px] text-gray-400">tots</span></span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <History className="w-5 h-5 text-purple-600" /> Pour Audit Trail
                            </h4>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b sticky top-0 z-10"><tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-4">Time</th><th className="px-6 py-4">Spirit</th><th className="px-6 py-4">Measure</th><th className="px-6 py-4">Vol.</th><th className="px-6 py-4 text-right">Staff</th></tr></thead>
                                <tbody className="divide-y divide-gray-100 text-xs font-bold text-slate-700">
                                    {reportData.logs.map(log => (
                                        <tr key={log.id} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-gray-400 text-[10px]">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span>{log.bottleName}</span>
                                                    <span className="text-[8px] uppercase text-purple-400">{log.bottleType}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                                    log.type === 'DIRECT' ? 'bg-blue-50 text-blue-600' :
                                                    log.type === 'COCKTAIL' ? 'bg-pink-50 text-pink-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>{log.type} ({log.tots}T)</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">{log.quantityMl}ml</td>
                                            <td className="px-6 py-4 text-right uppercase text-[9px] text-gray-500">{log.staffName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
         )}
      </div>

      {pendingPour && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 bg-slate-900 text-white text-center">
                    <h3 className="text-xl font-black uppercase">Confirm Pour</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Injection to Billing Terminal</p>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="text-center">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Recording</p>
                        <p className="text-3xl font-black text-purple-600 mt-1">{pendingPour.sizeType.replace('_', ' ')}</p>
                        <p className="font-bold text-gray-800 text-lg">{pendingPour.bottleName}</p>
                    </div>

                    {!isWinePour && pendingPour.sizeType !== 'HALF_BOTTLE' && pendingPour.sizeType !== 'FULL_BOTTLE' && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-center">Select Consumption Mode</label>
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                <button 
                                    onClick={() => setConsumptionMode('DIRECT')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${consumptionMode === 'DIRECT' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}
                                >
                                    <GlassWater className="w-4 h-4" /> Direct
                                </button>
                                <button 
                                    onClick={() => setConsumptionMode('COCKTAIL')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${consumptionMode === 'COCKTAIL' ? 'bg-white text-pink-600 shadow-md' : 'text-slate-500'}`}
                                >
                                    <Martini className="w-4 h-4" /> Cocktail
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block text-center mb-2">Assign to Table (Optional)</label>
                        <input value={selectedTableName} onChange={e => setSelectedTableName(e.target.value)} placeholder="e.g. Table 12" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-center text-lg outline-none focus:ring-2 focus:ring-purple-600 transition-all" />
                    </div>
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                        <button onClick={confirmPour} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-purple-900/20 flex items-center justify-center gap-2 active:scale-95 transition-all"><CheckCircle2 className="w-5 h-5" /> Record & Pour</button>
                        <button onClick={() => setPendingPour(null)} className="w-full py-3 text-gray-400 font-bold uppercase text-xs hover:text-gray-600">Cancel</button>
                    </div>
                  </div>
              </div>
          </div>
      )}

      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="p-8 bg-purple-700 text-white flex justify-between items-center shrink-0">
                    <div><h2 className="text-2xl font-black uppercase tracking-tight">Open New Stock</h2><p className="text-purple-200 text-xs font-bold uppercase tracking-widest mt-1">Register Detailed Spirit Information</p></div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleOpenBottle} className="p-8 space-y-6">
                    <div className="space-y-2 relative">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between items-center">
                            Spirit Label Name
                            <span className="text-purple-600 cursor-pointer hover:underline flex items-center gap-1" onClick={() => setShowCatalogSuggestions(!showCatalogSuggestions)}><BookOpen className="w-3 h-3" /> Fast Catalog</span>
                        </label>
                        <div className="relative">
                            <input autoFocus required value={newBottle.name} onChange={e => { setNewBottle({...newBottle, name: e.target.value}); setShowCatalogSuggestions(true); }} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Hennessy VS" />
                            {showCatalogSuggestions && catalogSpirits.length > 0 && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar">
                                    {catalogSpirits.filter(p => p.name.toLowerCase().includes(newBottle.name.toLowerCase())).map(p => (
                                        <div key={p.id} onClick={() => handleCatalogSelect(p)} className="px-5 py-4 hover:bg-purple-50 cursor-pointer border-b border-gray-50 flex justify-between items-center transition-colors">
                                            <div>
                                                <span className="font-bold text-sm text-gray-800 block">{p.name}</span>
                                                <span className="text-[9px] font-black text-gray-400 uppercase">{p.category}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detailed Category</label>
                            <select value={newBottle.type} onChange={(e) => setNewBottle({...newBottle, type: e.target.value as SpiritCategory})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 appearance-none">
                                {SPIRIT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opening Date</label>
                            <input type="date" value={newBottle.openedAt} onChange={e => setNewBottle({...newBottle, openedAt: e.target.value})} className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Volume Size</label>
                        <div className="grid grid-cols-4 gap-2">
                            {BOTTLE_SIZES.map(size => (
                                <button key={size.value} type="button" onClick={() => setNewBottle({...newBottle, size: size.value})} className={`py-2 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${newBottle.size === size.value ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-500'}`}>{size.label}</button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-2"><DollarSign className="w-3 h-3 text-purple-600"/> Multi-Measure Prices ({systemConfig.currency})</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase">Single / Glass</label>
                                <input type="number" value={newBottle.prices.single} onChange={e => setNewBottle({...newBottle, prices: {...newBottle.prices, single: e.target.value}})} className="w-full px-4 py-2 border-2 border-white bg-white rounded-xl text-sm font-black focus:border-purple-200 outline-none" placeholder="0.00" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase">Double Tot</label>
                                <input type="number" value={newBottle.prices.double} onChange={e => setNewBottle({...newBottle, prices: {...newBottle.prices, double: e.target.value}})} className="w-full px-4 py-2 border-2 border-white bg-white rounded-xl text-sm font-black focus:border-purple-200 outline-none" placeholder="0.00" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase">Half Bottle</label>
                                <input type="number" value={newBottle.prices.half} onChange={e => setNewBottle({...newBottle, prices: {...newBottle.prices, half: e.target.value}})} className="w-full px-4 py-2 border-2 border-white bg-white rounded-xl text-sm font-black focus:border-purple-200 outline-none" placeholder="0.00" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-gray-400 uppercase">Full Bottle Price</label>
                                <input type="number" value={newBottle.prices.full} onChange={e => setNewBottle({...newBottle, prices: {...newBottle.prices, full: e.target.value}})} className="w-full px-4 py-2 border-2 border-white bg-white rounded-xl text-sm font-black focus:border-purple-200 outline-none" placeholder="0.00" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                        <p className="text-[10px] text-purple-700 font-bold uppercase tracking-tight leading-relaxed">System will set status to 'OPEN' and deduct initial volume from master stock if linked. Tots calculation based on 25ml standard.</p>
                    </div>

                    <button type="submit" className="w-full py-5 bg-purple-700 hover:bg-purple-800 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-purple-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3"><Save className="w-5 h-5" /> Open & Register Bottle</button>
                </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SpiritsInventoryView;
