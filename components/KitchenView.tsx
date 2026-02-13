
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ChefHat, Clock, CheckCircle, Flame, StopCircle, History, Bell, AlertTriangle, CheckSquare, XCircle, Utensils
} from 'lucide-react';
import { Order, SystemConfig, UserRole, Product } from '../types';

interface KitchenViewProps {
  systemConfig: SystemConfig;
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
  onAddOrder: (order: Order) => void;
  onUpdateOrder?: (order: Order) => void;
  userRole: UserRole;
  products: Product[];
  isBellActive: boolean; 
  onStopBell: () => void;
  kitchenAlertProp?: {sender: string, timestamp: number} | null;
}

interface TicketCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
  onAcknowledgeUpdate?: (order: Order) => void;
  isReadOnly: boolean;
}

const TicketCard: React.FC<TicketCardProps> = ({ order, onUpdateStatus, onAcknowledgeUpdate, isReadOnly }) => {
  const timeElapsed = Math.floor((new Date().getTime() - new Date(order.timestamp).getTime()) / 1000 / 60);
  
  const senderDisplay = order.staffName 
    ? `${order.staffName} (${order.staffRole?.replace('_', ' ').toLowerCase() || 'staff'})`
    : order.customerName;

  // Split items into New and Previously Sent
  const newItems = order.items.filter(i => i.isNew);
  const oldItems = order.items.filter(i => !i.isNew);
  const hasUpdates = newItems.length > 0;
  const isServed = order.status === 'served';

  return (
    <div className={`p-4 rounded-xl border-l-8 shadow-sm flex flex-col h-full transition-all hover:shadow-lg animate-in fade-in zoom-in-95 duration-300 ${
      hasUpdates ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200' :
      order.status === 'ready' ? 'bg-green-50 border-green-500' :
      order.status === 'served' ? 'bg-gray-100 border-gray-400 opacity-75' : // Served styling
      order.status === 'preparing' ? 'bg-blue-50 border-blue-500' :
      'bg-white border-orange-400'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="overflow-hidden">
           <div className="flex items-center gap-2 mb-1">
              <span className={`px-3 py-1 rounded text-xl font-black ${order.status === 'pending' || hasUpdates ? 'bg-orange-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700'}`}>
                {order.table}
              </span>
              <span className="text-xs font-mono text-gray-400 font-bold">#{order.id.slice(-4).toUpperCase()}</span>
           </div>
           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate" title={senderDisplay}>
              {senderDisplay}
           </p>
        </div>
        <div className="text-right shrink-0">
           <div className="flex items-center gap-1 text-xs font-black text-gray-500 justify-end">
              <Clock className="w-3.5 h-3.5" /> {timeElapsed}m
           </div>
           <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded mt-1 inline-block ${
              order.status === 'ready' ? 'bg-green-200 text-green-700' :
              order.status === 'preparing' ? 'bg-blue-200 text-blue-700' :
              order.status === 'served' ? 'bg-gray-300 text-gray-700' :
              'bg-orange-200 text-orange-700'
           }`}>
              {hasUpdates ? 'NEW ARRIVAL' : order.status}
           </span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3 flex-1 mb-4 overflow-y-auto custom-scrollbar pr-1 min-h-[120px]">
         
         {/* NEW ARRIVAL SECTION (GREEN) */}
         {newItems.length > 0 && (
             <div className="space-y-2 border-b-2 border-dashed border-amber-200 pb-3 mb-2">
                 <p className="text-[9px] font-black text-green-600 uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                     <AlertTriangle className="w-3 h-3" /> New Items (To Make)
                 </p>
                 {newItems.map((item, idx) => (
                    <div key={`new-${idx}`} className="bg-green-50 p-2 rounded-lg border border-green-200 shadow-sm animate-pulse">
                       <div className="flex justify-between text-sm font-black text-green-800 items-start">
                          <span className="flex-1 leading-tight">{item.product.name}</span>
                          <span className="font-black bg-green-200 text-green-800 px-2 py-0.5 rounded ml-2 h-fit text-xs">x{item.quantity}</span>
                       </div>
                       {item.note && (
                           <p className="text-[10px] text-red-600 font-bold italic mt-1 bg-white/50 p-1 rounded border border-red-100 flex items-start gap-1">
                               <span className="text-red-500 font-black">*</span> {item.note}
                           </p>
                       )}
                    </div>
                 ))}
             </div>
         )}

         {/* OLD ITEMS SECTION (RED) */}
         {oldItems.length > 0 && (
            <div className="space-y-1.5">
               {hasUpdates && (
                   <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">Already Made</p>
               )}
               {oldItems.map((item, idx) => (
                  <div key={`old-${idx}`} className="flex flex-col border-b border-red-100 pb-1.5 last:border-0 last:pb-0">
                     <div className="flex justify-between text-sm font-bold text-red-800/70 items-start">
                        <span className="flex-1 leading-tight">{item.product.name}</span>
                        <span className="font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded ml-2 h-fit text-xs">x{item.quantity}</span>
                     </div>
                     {item.note && (
                         <p className="text-[10px] text-gray-400 font-bold italic mt-0.5 ml-1 leading-tight">
                             * {item.note}
                         </p>
                     )}
                  </div>
               ))}
            </div>
         )}
      </div>

      {/* Actions */}
      {!isReadOnly && !isServed && (
         <div className="pt-2 mt-auto space-y-2 border-t border-gray-100">
            
            {/* Acknowledgement Button for New Items */}
            {hasUpdates && onAcknowledgeUpdate && (
                <button 
                    onClick={() => onAcknowledgeUpdate(order)}
                    className="w-full py-3 bg-amber-500 text-white rounded-xl font-black text-xs uppercase hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-md"
                >
                    <CheckCircle className="w-4 h-4" /> Acknowledge New
                </button>
            )}

            {!hasUpdates && order.status === 'pending' && (
               <button 
                 onClick={() => onUpdateStatus(order.id, 'preparing')}
                 className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-md"
               >
                  <Flame className="w-4 h-4" /> Start Preparing
               </button>
            )}
            {!hasUpdates && order.status === 'preparing' && (
               <button 
                 onClick={() => onUpdateStatus(order.id, 'ready')}
                 className="w-full py-3 bg-green-600 text-white rounded-xl font-black text-xs uppercase hover:bg-green-700 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-md"
               >
                  <CheckCircle className="w-4 h-4" /> Mark Ready
               </button>
            )}
            {order.status === 'ready' && !hasUpdates && (
               <button 
                 onClick={() => onUpdateStatus(order.id, 'served')}
                 className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase hover:bg-black transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-md border-2 border-white/20"
               >
                  <Utensils className="w-4 h-4" /> Served (Clear)
               </button>
            )}
         </div>
      )}
      
      {/* Served State Banner */}
      {isServed && (
          <div className="mt-auto pt-2 border-t border-gray-200">
              <div className="w-full py-2 bg-gray-200 text-gray-500 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2">
                  <Utensils className="w-4 h-4" /> Currently Eating
              </div>
          </div>
      )}
    </div>
  );
};

const KitchenView: React.FC<KitchenViewProps> = ({ 
  systemConfig, orders, onUpdateStatus, onAddOrder, onUpdateOrder, userRole, products,
  isBellActive, onStopBell, kitchenAlertProp
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<'LIVE' | 'SAVAGE'>('LIVE');
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isReadOnly = userRole === 'WAITER';

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio Logic
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
    }
    
    if (isBellActive) {
        audioRef.current.play().catch(e => {
            console.warn("Autoplay blocked", e);
            setAudioBlocked(true);
        });
    } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  }, [isBellActive]);

  const handleAcknowledge = (order: Order) => {
      // Clear 'isNew' flags
      const updatedItems = order.items.map(i => ({ ...i, isNew: false }));
      if (onUpdateOrder) {
          // Keep status same, just clear flags
          onUpdateOrder({ ...order, items: updatedItems });
      }
  };

  const filteredOrders = useMemo(() => {
      return orders
        .filter(o => o.isKitchenOrder && o.status !== 'cancelled')
        .filter(o => {
            if (viewMode === 'LIVE') {
                // Live shows everything EXCEPT paid orders. 
                // Served orders remain here until paid.
                return o.status !== 'paid';
            } else {
                // Savage (History) shows ONLY paid orders from today
                const isToday = new Date(o.timestamp).toDateString() === new Date().toDateString();
                return isToday && o.status === 'paid';
            }
        })
        .sort((a, b) => {
            // Sort logic: New items/updates to top, then by time
            const aHasUpdates = a.items.some(i => i.isNew);
            const bHasUpdates = b.items.some(i => i.isNew);
            if (aHasUpdates && !bHasUpdates) return -1;
            if (!aHasUpdates && bHasUpdates) return 1;
            
            // Pending/Preparing above Served
            const aActive = a.status !== 'served';
            const bActive = b.status !== 'served';
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;

            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
  }, [orders, viewMode]);

  const liveCount = orders.filter(o => o.isKitchenOrder && o.status !== 'paid' && o.status !== 'cancelled').length;

  return (
    <div className={`h-[calc(100vh-64px)] flex flex-col font-sans overflow-hidden transition-colors duration-500 ${isBellActive ? 'bg-red-50' : 'bg-slate-50'}`}>
      
      {/* --- KDS HEADER --- */}
      <div className={`p-4 shadow-md z-20 flex flex-col md:flex-row gap-4 md:items-center justify-between shrink-0 transition-all duration-300 ${isBellActive ? 'bg-red-600 text-white border-b-4 border-red-800' : 'bg-white border-b border-slate-200 text-slate-800'}`}>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl shadow-lg relative ${isBellActive ? 'bg-white text-red-600' : 'bg-orange-600 text-white'}`}>
                <ChefHat className="w-8 h-8" />
                {liveCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white animate-bounce">{liveCount}</span>}
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight leading-none">Kitchen Display</h1>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ${isBellActive ? 'text-white/70' : 'text-slate-400'}`}>{systemConfig.name}</p>
              </div>
            </div>
            <div className={`hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl border ${isBellActive ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
               <Clock className="w-4 h-4 opacity-50" />
               <span className="text-sm font-mono font-black tracking-widest">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
            </div>
        </div>

        <div className="flex items-center gap-3">
             <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button 
                    onClick={() => setViewMode('LIVE')} 
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'LIVE' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                   <Flame className="w-4 h-4" /> Live Tickets
                </button>
                <button 
                    onClick={() => setViewMode('SAVAGE')} 
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${viewMode === 'SAVAGE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                >
                   <History className="w-4 h-4" /> Savage Log
                </button>
             </div>
             {isBellActive && (
                <button onClick={onStopBell} className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 hover:bg-red-50 rounded-2xl font-black uppercase text-xs animate-bounce shadow-2xl border-2 border-red-500 transition-all">
                  <StopCircle className="w-6 h-6 fill-current" /> SILENCE BELL
                </button>
             )}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
         {filteredOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-400">
               <ChefHat className="w-32 h-32 mb-6" />
               <h2 className="text-3xl font-black uppercase tracking-[0.3em]">
                   {viewMode === 'LIVE' ? 'No Active Orders' : 'History Empty'}
               </h2>
               <p className="font-bold text-sm mt-4 tracking-widest">
                   {viewMode === 'LIVE' ? 'Paid orders move to Savage Log automatically.' : 'Completed paid orders appear here.'}
               </p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-24">
              {filteredOrders.map(order => (
                <TicketCard 
                  key={order.id} 
                  order={order} 
                  onUpdateStatus={onUpdateStatus}
                  onAcknowledgeUpdate={handleAcknowledge} 
                  isReadOnly={isReadOnly || viewMode === 'SAVAGE'}
                />
              ))}
            </div>
         )}
      </div>

      {/* Manual Autoplay trigger for some browsers */}
      {audioBlocked && isBellActive && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
              <button 
                onClick={() => { audioRef.current?.play(); setAudioBlocked(false); }}
                className="bg-red-600 text-white px-6 py-3 rounded-full font-black uppercase text-xs shadow-2xl border-2 border-white"
              >
                  Click to Activate Bell Sound
              </button>
          </div>
      )}
    </div>
  );
};

export default KitchenView;
