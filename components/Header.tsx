import React, { useState, useEffect } from 'react';
import { 
  Menu, Users, Calendar, Banknote, Calculator, Keyboard, Maximize, Minimize,
  MapPin, Utensils, ChefHat, ClipboardList, X, Clock, LayoutGrid
} from 'lucide-react';
import { UserRole, StaffMember, AppView } from '../types';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  isSidebarOpen?: boolean;
  primaryColor: string;
  userRole: UserRole;
  businessName?: string;
  currentUser?: StaffMember | null;
  onNavigate: (view: AppView) => void; 
  onCalculator: () => void;
  onToggleKeyboard: () => void;
  onLogout: () => void; 
}

const Header: React.FC<HeaderProps> = ({ 
  title, onMenuClick, isSidebarOpen, businessName,
  onNavigate, onCalculator, onToggleKeyboard
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.error(e));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const TopIconButton = ({ onClick, icon: Icon }: { onClick?: () => void, icon: any }) => (
    <button 
      onClick={onClick}
      className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all active:scale-90"
    >
      <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
    </button>
  );

  const BottomTabButton = ({ onClick, icon: Icon, colorClass }: { onClick: () => void, icon: any, colorClass: string }) => (
    <button 
      onClick={onClick}
      className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl border border-gray-100 bg-white hover:bg-gray-50 hover:shadow-md transition-all active:scale-95"
    >
      <Icon className={`w-5 h-5 md:w-6 md:h-6 ${colorClass}`} />
    </button>
  );

  return (
    <header className="flex flex-col z-[60] shrink-0 font-sans shadow-sm">
      {/* TIER 1: THE GRADIENT BAR */}
      <div className="h-14 md:h-16 bg-gradient-to-r from-[#4d51be] via-[#d53f8c] via-[#38b2ac] to-[#319795] flex items-center justify-between px-4 md:px-6">
        
        {/* Left: Sidebar Toggle & App Title */}
        <div className="flex items-center gap-3 md:gap-5">
          <button onClick={onMenuClick} className="text-white hover:opacity-80 transition-opacity">
            <Menu className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
          </button>
          <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-tight drop-shadow-sm">
            {title}
          </h1>
        </div>

        {/* Right: Functional Icons & Status */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex items-center gap-2 md:gap-2 mr-2 md:mr-4">
             <TopIconButton icon={Users} onClick={() => onNavigate(AppView.HRM)} />
             <TopIconButton icon={Calendar} onClick={() => onNavigate(AppView.DAY_SHIFTS)} />
             <TopIconButton icon={Banknote} onClick={() => onNavigate(AppView.EXPENSES)} />
             <TopIconButton icon={Calculator} onClick={onCalculator} />
             <TopIconButton icon={Keyboard} onClick={onToggleKeyboard} />
             <TopIconButton icon={isFullscreen ? Minimize : Maximize} onClick={toggleFullscreen} />
          </div>

          {/* Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
             <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Online</span>
          </div>

          {/* Location / Business Box */}
          <button 
            onClick={() => onNavigate(AppView.SETTINGS)}
            className="flex items-center gap-2 px-3 py-1.5 md:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl border border-white/10 ml-2 md:ml-3 text-left group transition-all"
          >
             <MapPin className="w-3.5 h-3.5 text-white/80 group-hover:scale-110 transition-transform" />
             <div className="leading-tight pr-1">
                <p className="text-[7px] md:text-[8px] font-black text-white uppercase tracking-widest opacity-80">Location</p>
                <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-tighter truncate max-w-[60px] md:max-w-[100px]">{businessName || 'Kampala Cafe'}</p>
             </div>
          </button>
        </div>
      </div>

      {/* TIER 2: SECONDARY OPERATIONAL BAR */}
      <div className="h-12 md:h-14 bg-white border-b border-gray-100 flex items-center px-4 md:px-6 justify-between shrink-0">
        <div className="flex items-center gap-3">
            {/* Real-time Clock Badge - COMPACT VERSION */}
            <div className="flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2 bg-[#5c56d6] text-white rounded-xl shadow-md transition-transform hover:scale-[1.01]">
                <div className="leading-none flex flex-col justify-center">
                    <p className="text-[8px] md:text-[9px] font-bold text-white/60 tracking-tight mb-0.5">{currentTime.toLocaleDateString()}</p>
                    <p className="text-sm md:text-base font-black tabular-nums tracking-tighter">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </p>
                </div>
                <div className="w-px h-5 md:h-6 bg-white/20"></div>
                <Keyboard className="w-3.5 h-3.5 text-white/60" />
            </div>

            {/* Quick Navigation Shortcuts */}
            <div className="flex gap-2 md:gap-2 ml-2 md:ml-3">
               <BottomTabButton 
                onClick={() => onNavigate(AppView.SELL)} 
                icon={Utensils} 
                colorClass="text-[#a855f7]" 
               />
               <BottomTabButton 
                onClick={() => onNavigate(AppView.KITCHEN)} 
                icon={ChefHat} 
                colorClass="text-[#f97316]" 
               />
               <BottomTabButton 
                onClick={() => onNavigate(AppView.ORDERS)} 
                icon={ClipboardList} 
                colorClass="text-[#3b82f6]" 
               />
            </div>
        </div>

        <div className="h-6 w-px bg-gray-100 mx-3 hidden md:block"></div>
        
        <div className="hidden lg:block">
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em]">Protocol v4.0.1</p>
        </div>
      </div>
    </header>
  );
};

export default Header;