
import React from 'react';
import { QrCode, Smartphone, ExternalLink, Printer } from 'lucide-react';

const CatalogueQRView: React.FC = () => {
  const menuUrl = "https://app.akampa.pos/menu/our-restaurant"; // Mock URL

  return (
    <div className="p-8 h-[calc(100vh-64px)] overflow-y-auto bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-2xl w-full text-center border border-gray-100">
         <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600">
            <QrCode className="w-12 h-12" />
         </div>
         
         <h1 className="text-4xl font-black text-gray-800 mb-4 tracking-tight uppercase">Digital Menu QR</h1>
         <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
            Scan this code to instantly access our full digital catalogue and place orders from your device.
         </p>

         {/* Mock QR Code Visual */}
         <div className="w-64 h-64 mx-auto bg-gray-900 rounded-3xl flex items-center justify-center mb-8 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  Download PNG
               </button>
            </div>
            {/* Simple CSS pattern to simulate QR */}
            <div className="grid grid-cols-5 gap-2 p-6">
               {[...Array(25)].map((_, i) => (
                  <div key={i} className={`w-8 h-8 rounded ${Math.random() > 0.5 ? 'bg-white' : 'bg-gray-800'}`}></div>
               ))}
            </div>
         </div>

         <div className="flex flex-col items-center gap-2 mb-8">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Public URL</p>
            <div className="flex items-center gap-2 text-blue-600 font-mono font-bold bg-blue-50 px-4 py-2 rounded-xl">
               {menuUrl} <ExternalLink className="w-4 h-4" />
            </div>
         </div>

         <div className="flex gap-4 justify-center">
            <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-3 shadow-xl hover:bg-black transition-all">
               <Printer className="w-5 h-5" /> Print Table Tent
            </button>
            <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
               <Smartphone className="w-5 h-5" /> Preview on Mobile
            </button>
         </div>
      </div>
    </div>
  );
};

export default CatalogueQRView;
