
import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, PanelLeftClose, MapPin, CloudOff, Keyboard, ChevronsLeft, XSquare, UserPlus, 
  Briefcase, Calculator, Archive, Camera, Users, ArrowLeft, Minimize, Maximize,
  Utensils, ChefHat, ClipboardList, Banknote, Phone, Contact, Trash2
} from 'lucide-react';
import { UserRole, StaffMember, AppView } from '../types';

interface OnlineUser {
    id: string;
    name: string;
    role: UserRole;
    lastSeen: number;
}

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  isSidebarOpen?: boolean;
  primaryColor: string;
  userRole: UserRole;
  centerActions?: React.ReactNode;
  isSellView?: boolean;
  businessName?: string;
  networkStatus?: 'online' | 'offline' | 'syncing';
  currentUser?: StaffMember | null;
  onUpdateUserPhoto?: (file: File) => void;
  
  // Navigation
  onGlobalBack?: () => void;
  canGoBack?: boolean;
  onNavigate?: (view: AppView) => void; // New Navigation Handler

  // Toolbar Handlers
  onBack?: () => void; // Kept for interface compatibility but removed from UI
  onRecentTransactions?: () => void;
  onCloseRegister?: () => void;
  onEndOfDay?: () => void;
  onStaffSwitch?: () => void;
  onRegisterDetails?: () => void;
  onCalculator?: () => void;
  onSellReturn?: () => void;
  onViewSuspended?: () => void;
  onAddExpense?: () => void;
  onToggleKeyboard?: () => void;
  
  onlineStaffList?: OnlineUser[]; 
}

const Header: React.FC<HeaderProps> = ({ 
  title, onMenuClick, isSidebarOpen, primaryColor, userRole, 
  centerActions, isSellView, businessName,
  currentUser, onUpdateUserPhoto,
  onGlobalBack, canGoBack, onNavigate,
  onBack, onRecentTransactions, onCloseRegister, onEndOfDay, onStaffSwitch,
  onRegisterDetails, onCalculator, onSellReturn, onViewSuspended, onAddExpense,
  onToggleKeyboard, onlineStaffList = []
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.error(e));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateUserPhoto) {
      onUpdateUserPhoto(file);
    }
  };

  const TooltipButton = ({ onClick, icon: Icon, label, colorClass = "text-gray-600 hover:text-blue-600", bgClass = "bg-white hover:bg-gray-50", badgeCount = 0 }: any) => (
    <button 
      onClick={onClick}
      className={`group relative p-2 md:px-3 md:py-2 rounded-lg border border-gray-200 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${bgClass} ${colorClass}`}
      title={label}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden xl:inline text-xs font-bold uppercase tracking-tight">{label}</span>
      
      {badgeCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
              {badgeCount}
          </span>
      )}

      {/* Tooltip for smaller screens */}
      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none xl:hidden">
        {label}
      </div>
    </button>
  );

  // Permission Logic
  const canAccessRestrictedTabs = ['CASHIER', 'MANAGER', 'OWNER'].includes(userRole || '');
  const canViewMenuAndOrders = ['WAITER', 'CASHIER', 'MANAGER', 'OWNER'].includes(userRole || '');
  const canViewKitchen = ['CHEF', 'MANAGER', 'OWNER', 'WAITER', 'CASHIER'].includes(userRole || '');

  return (
    <header className="flex flex-col z-30 shadow-lg sticky top-0">
      {/* Main Bar */}
      <div className={`h-16 flex items-center justify-between px-4 md:px-6 transition-colors duration-500 ${isOnline ? 'bg-gradient-to-r from-blue-600 via-pink-500 to-emerald-500' : 'bg-gray-800'}`}>
        <div className="flex items-center gap-2 md:gap-4 shrink-0 h-full text-white">
          
          {/* Global Back Button */}
          {canGoBack && onGlobalBack && (
             <button 
                onClick={onGlobalBack}
                className="h-10 w-10 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20 mr-1"
                title="Go Back"
             >
                <ArrowLeft className="w-6 h-6" />
             </button>
          )}

          <button 
            onClick={onMenuClick}
            className="h-full w-10 md:p-2 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <h1 className="text-lg md:text-xl font-black truncate uppercase tracking-tighter drop-shadow-sm">
            {title}
          </h1>
        </div>

        {/* System Info Right */}
        <div className="flex items-center gap-4 text-white">
           
           {/* Democrat / CRM Button - Moved to Header */}
           {onNavigate && canAccessRestrictedTabs && (
                <button
                    onClick={() => onNavigate(AppView.CRM)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white flex items-center justify-center"
                    title="Democrat (CRM)"
                >
                    <Users className="w-5 h-5" />
                </button>
           )}

           {/* Phone Book Button - Moved to Header */}
           {onNavigate && (
                <button
                    onClick={() => onNavigate(AppView.PHONEBOOK)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white flex items-center justify-center"
                    title="Phone Book"
                >
                    <Contact className="w-5 h-5" />
                </button>
           )}

           {/* Add Expense Button (Moved to Header) */}
           {onAddExpense && canAccessRestrictedTabs && (
                <button
                    onClick={onAddExpense}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white flex items-center justify-center"
                    title="Log Expense"
                >
                    <Banknote className="w-5 h-5" />
                </button>
           )}

           {/* Calculator Button (Moved to Header) */}
           {onCalculator && (
                <button
                    onClick={onCalculator}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white flex items-center justify-center"
                    title="Calculator"
                >
                    <Calculator className="w-5 h-5" />
                </button>
           )}

           {/* Keyboard Button */}
           {onToggleKeyboard && (
                <button
                    onClick={onToggleKeyboard}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white flex items-center justify-center"
                    title="Virtual Keypad"
                >
                    <Keyboard className="w-5 h-5" />
                </button>
           )}

           {/* Full Screen Toggle */}
           <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white flex items-center justify-center"
              title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
           >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
           </button>

           {/* Network Status */}
           <div className="hidden sm:flex">
            {isOnline ? (
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 rounded-full text-emerald-100 text-[10px] font-black uppercase tracking-widest animate-in fade-in">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]"></div>
                <span>Online</span>
              </div>
            ) : (
               <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-full text-red-100 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <CloudOff className="w-3 h-3" />
                <span>Offline</span>
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-md border border-white/10">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-tight">{businessName || 'Location'}</span>
          </div>

          {/* User Profile Section */}
          {currentUser && (
            <div className="flex items-center gap-3 pl-4 border-l border-white/20">
              <div className="flex flex-col items-end mr-1">
                <span className="text-sm font-black leading-none">{currentUser.name}</span>
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider bg-white/10 px-1.5 rounded mt-0.5">
                  {currentUser.role?.replace('_', ' ')}
                </span>
              </div>
              
              <div 
                className="relative group cursor-pointer"
                onClick={handlePhotoClick}
                title="Click to update photo"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 overflow-hidden flex items-center justify-center shadow-md">
                  {currentUser.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{currentUser.name.charAt(0)}</span>
                  )}
                </div>
                
                {/* Hover overlay for upload */}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar - Only visible if handlers are provided (Implies POS/Interactive View) */}
      {(onNavigate) && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar relative">
          
          {/* Date Widget */}
          <div className="hidden md:flex flex-col justify-center px-4 py-1 bg-[#5848c4] text-white rounded-lg shadow-md mr-2 shrink-0">
             <div className="text-xs font-black opacity-80">{currentTime.toLocaleDateString()}</div>
             <div className="text-sm font-black flex items-center gap-2">
                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                <Keyboard className="w-3 h-3 opacity-50" />
             </div>
          </div>

          {/* Action Tabs */}
          <div className="flex items-center gap-2 flex-1">
             
             {/* NEW NAVIGATION TABS (RESTRICTED) */}
             {onNavigate && (
                <>
                  {canViewMenuAndOrders && (
                      <TooltipButton onClick={() => onNavigate(AppView.WAITER_PORTAL)} icon={Utensils} label="Restaurant Menu" colorClass="text-purple-600" />
                  )}
                  {canViewKitchen && (
                      <TooltipButton onClick={() => onNavigate(AppView.KITCHEN)} icon={ChefHat} label="Kitchen Display" colorClass="text-orange-600" />
                  )}
                  {canViewMenuAndOrders && (
                      <TooltipButton onClick={() => onNavigate(AppView.ORDERS)} icon={ClipboardList} label="Order Log" colorClass="text-blue-600" />
                  )}
                  
                  <div className="w-px h-8 bg-gray-200 mx-1 hidden md:block"></div>
                </>
             )}
             
             {/* Restricted End Day */}
             {onEndOfDay && canAccessRestrictedTabs && (
                 <TooltipButton onClick={onEndOfDay} icon={Archive} label="End Day" colorClass="text-red-600" bgClass="bg-red-50 hover:bg-red-100 border-red-200" />
             )}

             {onStaffSwitch && <TooltipButton onClick={onStaffSwitch} icon={UserPlus} label="Staff" />}
             
             {/* Restricted Details Tab */}
             {onRegisterDetails && canAccessRestrictedTabs && (
                <TooltipButton onClick={onRegisterDetails} icon={Briefcase} label="Details" />
             )}
             
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
