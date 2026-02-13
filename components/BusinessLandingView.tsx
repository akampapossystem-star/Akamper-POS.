import React from 'react';
import { ArrowLeft, Clock, MapPin, Phone, Star, UtensilsCrossed, ExternalLink, ShoppingBag } from 'lucide-react';
import { BusinessPage, Product } from '../types';
import { PRODUCTS_DATA } from '../mockData';

interface BusinessLandingViewProps {
  page: BusinessPage;
  onBack: () => void;
}

const BusinessLandingView: React.FC<BusinessLandingViewProps> = ({ page, onBack }) => {
  // Mock data for the view since BusinessPage only has metadata
  const featuredProducts = PRODUCTS_DATA.slice(0, 4);
  const rating = 4.8;
  const reviews = 124;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Navigation / Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-bold uppercase hidden md:inline">Back to Portal</span>
          </button>
          
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black italic">
                {page.businessName.charAt(0)}
             </div>
             <span className="font-black text-lg tracking-tight uppercase text-gray-900">{page.businessName}</span>
          </div>

          <button className="bg-black text-white px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform">
             Order Now
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 lg:pt-32 lg:pb-24 px-4 overflow-hidden">
         <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 relative z-10">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Open for Delivery</span>
               </div>
               
               <h1 className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tighter leading-[0.9]">
                  Taste the <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Excellence.</span>
               </h1>
               
               <p className="text-lg text-gray-500 font-medium max-w-md leading-relaxed">
                  Welcome to <b>{page.businessName}</b>. Experience culinary mastery curated by {page.ownerName}. Fresh ingredients, unforgettable flavors.
               </p>

               <div className="flex flex-wrap gap-4 pt-4">
                  <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 transition-all flex items-center gap-3">
                     <ShoppingBag className="w-5 h-5" /> View Full Menu
                  </button>
                  <button className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3">
                     <Phone className="w-5 h-5" /> Contact Us
                  </button>
               </div>

               <div className="flex items-center gap-6 pt-6">
                  <div className="flex items-center gap-1">
                     <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                     <span className="font-black text-gray-900">{rating}</span>
                     <span className="text-gray-400 text-sm font-medium">({reviews} reviews)</span>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="flex items-center gap-2">
                     <Clock className="w-5 h-5 text-gray-400" />
                     <span className="text-sm font-bold text-gray-600">20-30 min delivery</span>
                  </div>
               </div>
            </div>

            <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-[3rem] transform rotate-3"></div>
               <img 
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" 
                  alt="Hero Dish" 
                  className="relative rounded-[3rem] shadow-2xl object-cover w-full h-[500px] hover:scale-[1.02] transition-transform duration-500"
               />
               
               {/* Floating Card */}
               <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                     <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chef's Special</p>
                     <p className="font-bold text-gray-900">Signature Pasta</p>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Featured Items */}
      <div className="bg-gray-50 py-24">
         <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-end justify-between mb-12">
               <div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Popular Items</h2>
                  <p className="text-gray-500 font-medium mt-2">Customer favorites this week</p>
               </div>
               <button className="text-blue-600 font-black uppercase text-xs tracking-widest hover:underline flex items-center gap-1">
                  See All <ExternalLink className="w-3 h-3" />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {featuredProducts.map(product => (
                  <div key={product.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
                     <div className="relative mb-4 overflow-hidden rounded-2xl">
                        <img 
                           src={product.image} 
                           alt={product.name} 
                           className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm">
                           {product.category}
                        </div>
                     </div>
                     <h3 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h3>
                     <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-black text-blue-600">{product.price.toLocaleString()}</span>
                        <button className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                           <ShoppingBag className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
         <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
               <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{page.businessName}</h3>
               <p className="text-gray-400 text-sm max-w-xs">Experience the best dining in town. Fresh, fast, and delicious.</p>
               <div className="flex gap-4 mt-6">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 transition-all cursor-pointer">FB</div>
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-pink-600 transition-all cursor-pointer">IG</div>
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-sky-500 transition-all cursor-pointer">TW</div>
               </div>
            </div>
            <div className="md:text-right">
               <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Powered By</p>
               <div className="inline-flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-xl">
                  <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-[10px] font-black italic">A</div>
                  <span className="font-bold uppercase tracking-widest text-sm">Akamper POS</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default BusinessLandingView;