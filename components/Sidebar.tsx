import React from 'react';
import { 
  Home, Globe, ShieldCheck, Palette, MessageSquare, Utensils, ClipboardList, ChefHat, 
  Scale, Croissant, Wine, ShoppingBasket, Banknote, Box, Database, BarChart2, 
  Users, History, Briefcase, LayoutGrid, Contact, Zap, QrCode, Gavel, Sliders, Settings, LogOut, ArrowLeft, UserCheck, Sparkles, Shield, X
} from 'lucide-react';
import { AppView, SystemConfig, UserRole, SubscriptionTier, StaffMember, RolePermissions } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isOpen: boolean;
  onClose: () => void;
  systemConfig: SystemConfig;
  userRole: UserRole;
  onLogout: () => void;
  onFullLogout: () => void;
  onExitImpersonation?: () => void;
  currentUser?: StaffMember | null;
  unreadMessageCount?: number; 
  permissions?: Record<string, RolePermissions>;
}

const checkTier = (required: SubscriptionTier, current: SubscriptionTier): boolean => {
  const levels = { 'BASIC': 1, 'PRO': 2, 'ENTERPRISE': 3 };
  return levels[current] >= levels[required];
};

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, onViewChange, isOpen, onClose, systemConfig, userRole, 
  onLogout, onFullLogout, currentUser, permissions, unreadMessageCount = 0,
  onExitImpersonation
}) => {
  
  const isRoot = currentUser?.id === 'ROOT';
  const isImpersonating = currentUser?.id?.startsWith('MASTER_OVERRIDE') || false;
  const isMasterUser = isRoot || isImpersonating;

  const navItems = [
    { id: AppView.TENANTS, label: 'Tenants', icon: Globe, minTier: 'BASIC', forceRoot: true },
    { id: AppView.MASTER_PORTAL, label: 'Master Page', icon: ShieldCheck, minTier: 'BASIC', forceRoot: true },
    { id: AppView.SYSTEM_BRANDING, label: 'System Identity', icon: Palette, minTier: 'BASIC', forceRoot: true },
    { id: AppView.MASTER_PHONEBOOK, label: 'My Contacts', icon: MessageSquare, minTier: 'BASIC', forceRoot: true },
    { id: AppView.AI_STUDIO, label: 'AI Innovation Lab', icon: Sparkles, minTier: 'BASIC', forceRoot: true },
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: Home, minTier: 'BASIC' },
    { id: AppView.WAITER_ALLOCATIONS, label: 'Waiter Zoning', icon: UserCheck, minTier: 'BASIC' },
    { id: AppView.WAITER_PORTAL, label: 'Restaurant Menu', icon: Utensils, minTier: 'BASIC' },
    { id: AppView.ORDERS, label: 'System Registry', icon: ClipboardList, minTier: 'BASIC' },
    { id: AppView.KITCHEN, label: 'Kitchen Display', icon: ChefHat, minTier: 'BASIC' },
    { id: AppView.KITCHEN_INVENTORY, label: 'Kitchen Stock', icon: Scale, minTier: 'PRO' },
    { id: AppView.BAKERY_INVENTORY, label: 'Bakery Inventory', icon: Croissant, minTier: 'PRO' },
    { id: AppView.SPIRITS, label: 'Spirits Inventory', icon: Wine, minTier: 'PRO' },
    { id: AppView.REQUISITION, label: 'Stock Request', icon: ShoppingBasket, minTier: 'BASIC' },
    { id: AppView.EXPENSES, label: 'Expenses', icon: Banknote, minTier: 'BASIC' },
    { id: AppView.STORE_KEEPER, label: 'Store Keeper', icon: Box, minTier: 'PRO' },
    { id: AppView.INVENTORY, label: 'Product Inventory', icon: Database, minTier: 'BASIC' },
    { id: AppView.REPORTS, label: 'Analytics & Reports', icon: BarChart2, minTier: 'PRO' },
    { id: AppView.CRM, label: 'CRM & Loyalty', icon: Users, minTier: 'PRO' },
    { id: AppView.MESSAGES, label: 'Team Chat', icon: MessageSquare, minTier: 'BASIC', badge: unreadMessageCount },
    { id: AppView.DAY_SHIFTS, label: 'Day Shifts', icon: History, minTier: 'BASIC' },
    { id: AppView.HRM, label: 'HRM (Staff)', icon: Briefcase, minTier: 'BASIC' },
    { id: AppView.TABLES, label: 'Table Layout', icon: LayoutGrid, minTier: 'PRO' },
    { id: AppView.PHONEBOOK, label: 'Phone Book', icon: Contact, minTier: 'BASIC' },
    { id: AppView.ESSENTIALS, label: 'Tools & Utilities', icon: Zap, minTier: 'BASIC' },
    { id: AppView.CATALOGUE_QR, label: 'Digital Menu QR', icon: QrCode, minTier: 'BASIC' },
    { id: AppView.ACCESS_CONTROL, label: 'Laws & Restrictions', icon: Gavel, minTier: 'ENTERPRISE', allowedRoles: ['MANAGER'] },
    { id: AppView.SETTINGS, label: 'Receipt Settings', icon: Sliders, minTier: 'BASIC' },
    { id: AppView.TENANT_SETTINGS, label: 'Page Settings', icon: Settings, minTier: 'BASIC' },
  ];

  const canView = (item: any) => {
      if (item.forceRoot) return isRoot;
      if (item.allowedRoles && !isRoot) {
          if (!item.allowedRoles.includes(userRole)) return false;
      }
      if (isMasterUser) return true;
      const tierMatch = checkTier(item.minTier as SubscriptionTier, systemConfig.subscriptionTier);
      if (!tierMatch) return false;
      if (userRole === 'OWNER') return true;
      if (permissions && userRole) {
          return permissions[userRole]?.allowedViews.includes(item.id);
      }
      return false;
  };

  const visibleItems = navItems.filter(canView);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      <div 
        className={`fixed lg:relative h-screen flex-shrink-0 flex flex-col z-[70] transition-all duration-300 ${isOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'} overflow-hidden shadow-2xl relative`}
        style={{ 
          background: 'linear-gradient(to bottom, #6de640 0%, #facc15 15%, #f43f5e 30%, #d946ef 45%, #8b5cf6 60%, #3b82f6 75%, #06b6d4 90%, #ec4899 100%)' 
        }}
      >
        {/* FACETED GEOMETRIC OVERLAY - Darkened slightly for better text contrast */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 1000">
                <polygon points="0,0 100,0 50,150" fill="white" opacity="0.1" />
                <polygon points="100,0 100,200 0,300" fill="black" opacity="0.1" />
                <polygon points="0,300 100,500 0,600" fill="white" opacity="0.08" />
                <polygon points="100,600 0,750 100,900" fill="black" opacity="0.15" />
                <polygon points="0,900 100,1000 0,1000" fill="white" opacity="0.12" />
                <polygon points="50,200 100,350 0,350" fill="black" opacity="0.05" />
                <polygon points="20,400 80,600 20,800" fill="white" opacity="0.05" />
            </svg>
        </div>

        {/* BOTTOM RIGHT SPARKLE ICON */}
        <div className="absolute bottom-6 right-6 pointer-events-none opacity-50 scale-125">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
        </div>

        <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar relative z-10">
          {/* Mobile Close Button */}
          <button 
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors bg-black/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          <div className={`flex items-center gap-4 shrink-0 transition-all duration-300 ${isOpen ? 'p-8 pb-4' : 'p-4 py-6 justify-center'}`}>
            <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/30 overflow-hidden shrink-0">
              {systemConfig.logo ? (
                  <img src={systemConfig.logo} alt="Business Logo" className="w-full h-full object-cover" />
              ) : (
                  <Shield className="w-8 h-8 text-indigo-500" />
              )}
            </div>
            {isOpen && (
              <div className="min-w-0 flex-1">
                  <h1 className="text-white font-black text-xl leading-none truncate tracking-tighter uppercase drop-shadow-md">
                      {systemConfig.name}
                  </h1>
                  <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.25em] mt-1.5 drop-shadow-sm">
                      {isRoot ? 'System Master' : 'Terminal Node'}
                  </p>
              </div>
            )}
          </div>

          {isOpen && (
            <div className="px-8 py-5 flex flex-col">
              <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em] drop-shadow-sm">Global Registry</p>
              <div className="h-1 w-12 bg-white/40 mt-2 rounded-full shadow-sm"></div>
            </div>
          )}
          
          <nav className={`flex-1 pb-12 ${isOpen ? 'px-5' : 'px-2'} space-y-1.5`}>
            {visibleItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id as AppView)}
                    className={`w-full flex items-center py-3.5 transition-all rounded-2xl group relative ${isOpen ? 'px-5' : 'justify-center px-2'} ${
                        isActive 
                          ? 'bg-white/40 text-white font-black shadow-2xl ring-1 ring-white/30 backdrop-blur-md' 
                          : 'text-white hover:bg-white/10 hover:text-white'
                    }`}
                    title={!isOpen ? item.label : ''}
                  >
                    <div className={`transition-transform duration-300 shrink-0 flex items-center justify-center ${isOpen ? 'mr-4' : ''} ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'} drop-shadow-md`} />
                    </div>
                    
                    {isOpen && (
                      <span className={`truncate flex-1 text-left text-[15px] tracking-tight drop-shadow-sm ${isActive ? 'font-black' : 'font-bold'}`}>
                        {item.label}
                      </span>
                    )}
                    
                    {isActive && isOpen && (
                        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)]"></div>
                    )}

                    {item.badge !== undefined && item.badge > 0 && (
                        <span className={`absolute ${isOpen ? 'right-3' : 'top-1 right-1'} bg-white text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-white/30 shadow-lg`}>
                            {item.badge}
                        </span>
                    )}
                  </button>
                );
            })}
          </nav>

          <div className={`bg-black/10 shrink-0 border-t border-white/20 backdrop-blur-sm ${isOpen ? 'p-6' : 'p-2 py-6'}`}>
            {onExitImpersonation && (
                <button 
                  onClick={onExitImpersonation}
                  className="w-full mb-4 flex items-center gap-3 p-3 bg-white/20 hover:bg-white/30 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] text-white transition-all border border-white/20 shadow-md"
                >
                    <ArrowLeft className="w-4 h-4" /> Exit Session
                </button>
            )}
            <div className={`flex items-center rounded-3xl p-3 mb-4 ${isOpen ? 'gap-4 bg-black/10' : 'justify-center'}`}>
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white text-sm border border-white/40 shadow-xl shrink-0 overflow-hidden">
                  {currentUser?.photoUrl ? (
                      <img src={currentUser.photoUrl} className="w-full h-full object-cover" alt="User" />
                  ) : (
                      <span className="drop-shadow-sm">{currentUser?.name?.charAt(0) || 'U'}</span>
                  )}
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate uppercase tracking-tight drop-shadow-md">{currentUser?.name}</p>
                  <p className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em] mt-1 drop-shadow-sm">{userRole}</p>
                </div>
              )}
            </div>
            <button 
              onClick={onLogout} 
              className={`w-full group bg-black/20 hover:bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all p-3.5 text-xs border border-white/10 shadow-lg active:scale-95`}
            >
               <LogOut className="w-5 h-5 drop-shadow-md" />
               {isOpen && "Sign Out"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;