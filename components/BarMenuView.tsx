
import React, { useState, useMemo } from 'react';
import { Search, GlassWater, Wine, Beer, Martini, Filter, X } from 'lucide-react';
import { Product, SystemConfig } from '../types';

interface BarMenuViewProps {
  products: Product[];
  systemConfig: SystemConfig;
}

const ALCOHOL_CATEGORIES = [
    'Whiskey', 'Vodka', 'Gin', 'Rum', 'Tequila', 'Brandy', 'Liqueur', 'Wine', 'Beer',
    'Cognac', 'Single Malt', 'Irish Whiskey', 'Blended Whisky', 'Red Wine', 'White Wine', 'Champagne'
];

const BarMenuView: React.FC<BarMenuViewProps> = ({ products, systemConfig }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const barProducts = useMemo(() => {
    return products.filter(p => {
      // Alcohol is either in the specific categories or categorized as 'Drinks' but looks like a beer
      const isAlcohol = ALCOHOL_CATEGORIES.includes(p.category) || 
                       (p.category === 'Drinks' && !p.name.toLowerCase().includes('coffee') && !p.name.toLowerCase().includes('tea') && !p.name.toLowerCase().includes('water') && !p.name.toLowerCase().includes('soda'));
      
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Beer' && p.category === 'Drinks');
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return isAlcohol && matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
        if (ALCOHOL_CATEGORIES.includes(p.category)) {
            cats.add(p.category);
        }
    });
    // Add Beer specifically if it's mixed in drinks
    if (products.some(p => p.category === 'Drinks' && !p.name.toLowerCase().includes('coffee') && !p.name.toLowerCase().includes('tea'))) {
        cats.add('Beer');
    }
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  const getCategoryIcon = (category: string) => {
      if (category.includes('Wine') || category === 'Champagne') return <Wine className="w-4 h-4" />;
      if (category === 'Beer') return <Beer className="w-4 h-4" />;
      if (category.includes('Whiskey') || category.includes('Malt') || category === 'Cognac' || category === 'Brandy') return <GlassWater className="w-4 h-4" />;
      return <Martini className="w-4 h-4" />;
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              <GlassWater className="w-8 h-8 text-amber-600" /> Bar Menu
            </h1>
            <p className="text-gray-500 font-medium mt-1">Full beverage catalog and pricing.</p>
          </div>

          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search beverages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold shadow-sm"
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            )}
          </div>
        </header>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm ${
                        selectedCategory === cat 
                            ? 'bg-amber-600 text-white shadow-amber-200' 
                            : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                    }`}
                >
                    {cat !== 'All' && getCategoryIcon(cat)}
                    {cat}
                </button>
            ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {barProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center">
                <GlassWater className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No matching beverages found</p>
            </div>
          ) : (
            barProducts.map(product => (
              <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col">
                <div className="h-48 relative overflow-hidden bg-gray-100">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm text-[10px] font-black uppercase text-amber-600 border border-amber-100">
                        {product.category}
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-black text-gray-800 text-lg leading-tight mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">{product.name}</h3>
                        {product.spiritConfig?.isSpirit && (
                            <div className="flex flex-wrap gap-1 mt-1 mb-4">
                                {product.spiritPrices?.single && <span className="text-[9px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Tot: {systemConfig.currency}{product.spiritPrices.single.toLocaleString()}</span>}
                                {product.spiritPrices?.half && <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Half: {systemConfig.currency}{product.spiritPrices.half.toLocaleString()}</span>}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                        <div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Full Unit</span>
                            <span className="text-xl font-black text-gray-900">{systemConfig.currency} {product.price.toLocaleString()}</span>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${product.stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {product.stock > 0 ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        </div>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Helper components not imported but used in logic
const CheckCircle2 = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);

const XCircle = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);

export default BarMenuView;
