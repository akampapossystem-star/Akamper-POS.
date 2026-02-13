
import React from 'react';
import { 
  Home, ShoppingCart, Package, Database, Clock, BarChart2, 
  List, Users, ChefHat, ClipboardList, Briefcase, Zap, User, Lock, 
  PanelLeftClose, Globe, Settings, LayoutGrid, Box, Banknote, QrCode, Sliders, LogOut, Archive, ShoppingBasket, ShieldCheck, ArrowLeft, MessageSquare, Gavel, Contact, MessageCircle, Wine, Palette, Beer, GlassWater, Utensils, Scale, Croissant
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
  permissions?: Record<string, RolePermissions>;
  unreadMessageCount?: number; 
}

// Helper to check tier permission
const checkTier = (required: SubscriptionTier, current: SubscriptionTier): boolean => {
  const levels = { 'BASIC': 1, 'PRO': 2, 'ENTERPRISE': 3 };
  return levels[current] >= levels[required];
};

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, onViewChange, isOpen, onClose, systemConfig, userRole, 
  onLogout, onFullLogout, onExitImpersonation, currentUser, permissions, unreadMessageCount = 0 
}) => {
  
  // Root Check
  const isRoot = currentUser?.id === 'ROOT';
  // Impersonation Check
  const isImpersonating = currentUser?.id?.startsWith('MASTER_OVERRIDE') || false;
  // Master Level Access
  const isMasterUser = isRoot || isImpersonating;
  
  const isOwner = userRole === 'OWNER';

  // Navigation Items
  const navItems = [
    // --- MASTER PORTAL (Root Only) ---
    { id: AppView.TENANTS, label: 'Tenants', icon: Globe, minTier: 'BASIC', forceRoot: true },
    { id: AppView.MASTER_PORTAL, label: 'Master Page', icon: ShieldCheck, minTier: 'BASIC', forceRoot: true },
    { id: AppView.SYSTEM_BRANDING, label: 'System Identity', icon: Palette, minTier: 'BASIC', forceRoot: true }, 
    { id: AppView.MASTER_PHONEBOOK, label: 'My Contacts', icon: MessageCircle, minTier: 'BASIC', forceRoot: true },

    // --- TENANT OPERATIONS (Filtered for Root) ---
    { id: AppView.DASHBOARD, label: 'Dashboard', icon: Home, minTier: 'BASIC' },
    
    // Main Point of Sale
    { 
      id: AppView.WAITER_PORTAL, 
      label: 'Restaurant Menu', 
      icon: Utensils, 
      minTier: 'BASIC' 
    },
    
    { id: AppView.ORDERS, label: 'Order Log', icon: ClipboardList, minTier: 'BASIC' },
    { id: AppView.KITCHEN, label: 'Kitchen Display', icon: ChefHat, minTier: 'BASIC' },
    
    // Inventory & Stock
    { id: AppView.KITCHEN_INVENTORY, label: 'Kitchen Stock', icon: Scale, minTier: 'PRO' },
    { id: AppView.BAKERY_INVENTORY, label: 'Bakery Inventory', icon: Croissant, minTier: 'PRO' },
    { id: AppView.SPIRITS, label: 'Spirits Inventory', icon: Wine, minTier: 'PRO' },
    { id: AppView.REQUISITION, label: 'Stock Request', icon: ShoppingBasket, minTier: 'PRO' },
    { id: AppView.EXPENSES, label: 'Expenses', icon: Banknote, minTier: 'PRO' },
    { id: AppView.STORE_KEEPER, label: 'Store Keeper', icon: Archive, minTier: 'PRO' },
    { id: AppView.INVENTORY, label: 'Product Inventory', icon: Database, minTier: 'PRO' },
    
    // Management
    { id: AppView.REPORTS, label: 'Analytics & Reports', icon: BarChart2, minTier: 'PRO' },
    { id: AppView.CRM, label: 'CRM & Loyalty', icon: Users, minTier: 'PRO' },
    { id: AppView.MESSAGES, label: 'Team Chat', icon: MessageSquare, minTier: 'BASIC' },
    { id: AppView.DAY_SHIFTS, label: 'Day Shifts', icon: Clock, minTier: 'BASIC' },
    { id: AppView.HRM, label: 'HRM (Staff)', icon: Briefcase, minTier: 'BASIC' },
    { id: AppView.TABLES, label: 'Table Layout', icon: LayoutGrid, minTier: 'PRO' },
    { id: AppView.PHONEBOOK, label: 'Phone Book', icon: Contact, minTier: 'BASIC' },
    
    // Enterprise & Admin
    { id: AppView.ESSENTIALS, label: 'Tools & Utilities', icon: Zap, minTier: 'ENTERPRISE' },
    { id: AppView.CATALOGUE_QR, label: 'Digital Menu QR', icon: QrCode, minTier: 'ENTERPRISE' },
    { id: AppView.ACCESS_CONTROL, label: 'Laws & Restrictions', icon: Gavel, minTier: 'BASIC' },

    // SETTINGS: This is TENANT settings.
    { id: AppView.TENANT_SETTINGS, label: 'Receipt Settings', icon: Sliders, minTier: 'BASIC', forceMaster: false }, 
    { id: AppView.SETTINGS, label: 'Page Settings', icon: Settings, minTier: 'BASIC', forceMaster: false },
  ];

  // Filter based on User Role AND Subscription Tier AND Dynamic Permissions
  const filteredItems = navItems.filter(item => {
    
    // 1. STRICT ROOT ONLY ITEMS (Master Portal, Tenants, Branding)
    // These should NEVER appear for normal tenants
    if ((item as any).forceRoot) {
        if (!isRoot) return false;
    }

    // 2. ROOT USER SEES EVERYTHING except explicitly hidden stuff?
    // Actually, Root shouldn't see 'Page Settings' if they are in Master View, but here we assume Sidebar renders contextually.
    // If user is Root, they see forceRoot items.
    
    // 3. Subscription Check (Skip for Root/Impersonation)
    if (!isRoot && !isImpersonating) {
        const tierMatch = checkTier(item.minTier as SubscriptionTier, systemConfig.subscriptionTier);
        if (!tierMatch) return false;
    }

    // 4. Role Specific Visibility (Hardcoded logic for specialized views)
    if (item.id === AppView.SPIRITS) {
        if (!['BARMAN', 'MANAGER', 'OWNER'].includes(userRole || '')) return false;
    }
    if (item.id === AppView.KITCHEN_INVENTORY) {
        if (!['CHEF', 'MANAGER', 'OWNER'].includes(userRole || '')) return false;
    }
    if (item.id === AppView.BAKERY_INVENTORY) {
        if (!['CHEF', 'MANAGER', 'OWNER'].includes(userRole || '')) return false;
    }

    // 5. Permission Check (Dynamic)
    if (isOwner || isMasterUser) return true; // Owners see everything available to their tier

    if (permissions && userRole) {
        const rolePerms = permissions[userRole];
        if (rolePerms) {
            // Keep specialized views visible for specific roles regardless of dynamic perms if hardcoded above? 
            // No, dynamic perms override except for the hardcoded blocks above which act as "Role Prerequisites".
            if (item.id === AppView.SPIRITS && ['BARMAN', 'MANAGER'].includes(userRole || '')) return true;
            if (item.id === AppView.KITCHEN_INVENTORY && ['CHEF', 'MANAGER'].includes(userRole || '')) return true;
            if (item.id === AppView.BAKERY_INVENTORY && ['CHEF', 'MANAGER'].includes(userRole || '')) return true;
            
            return rolePerms.allowedViews.includes(item.id as AppView);
        }
    }

    return false; 
  });

  const handleNavClick = (view: AppView) => {
    onViewChange(view);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const avatarBg = currentUser?.uniformColor || 'linear-gradient(to bottom right, #34d399, #10b981)';

  // Determine Logo to display
  // If Root, use system config logo (which is Master config passed in)
  // If Tenant, use tenant logo from systemConfig. If not set, use placeholder icon.
  const displayLogo = systemConfig.logo; 

  return (
    <>
    <div className={`
      bg-[linear-gradient(to_bottom,#F9A44C,#FF41A1,#9E49E5,#417DF9)]
      text-white
      h-screen flex-shrink-0 flex flex-col z-50
      relative transition-[width,min-width] duration-300 ease-in-out 
      ${isOpen ? 'w-64' : 'w-0 md:w-20'}
      overflow-hidden
    `}>
      <div className="w-full h-full flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* Brand Header */}
        <div className={`flex items-center gap-3 shrink-0 mb-2 transition-all duration-300 ${isOpen ? 'p-6' : 'p-4 justify-center'}`}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/10 overflow-hidden shrink-0">
            {displayLogo ? (
              <img src={displayLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Box className="w-6 h-6 text-white" />
            )}
          </div>
          {isOpen && (
            <div className="min-w-0 flex-1 animate-in fade-in duration-300">
                <h1 className="text-white font-black text-lg leading-none truncate tracking-tight">
                  {isRoot ? "Master Control" : systemConfig.name}
                </h1>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                  {isRoot ? "System Admin" : "Management System"}
                </p>
            </div>
          )}
          <button 
            onClick={onClose}
            className={`md:hidden p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors ${!isOpen && 'hidden'}`}
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation List */}
        <nav className={`flex-1 space-y-1.5 pb-4 ${isOpen ? 'px-3' : 'px-2'}`}>
          {isOpen && (
            <p className="px-4 text-[10px] font-extrabold uppercase tracking-widest text-white/40 mb-3 mt-2 animate-in fade-in">
               {isRoot ? "Administration" : "Main Menu"}
            </p>
          )}
          {filteredItems.map((item) => {
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id as AppView)}
                className={`
                  w-full flex items-center py-3 text-sm transition-all duration-200 ease-in-out rounded-xl group relative whitespace-nowrap
                  ${isOpen ? 'px-4' : 'justify-center px-2'}
                  ${isActive 
                    ? 'bg-white text-[#9E49E5] shadow-lg shadow-black/10 font-extrabold translate-x-1' 
                    : 'font-medium text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1'
                  }
                `}
                title={!isOpen ? item.label : ''}
              >
                <item.icon 
                  className={`w-5 h-5 transition-colors flex-shrink-0 ${isOpen ? 'mr-3' : ''} ${
                    isActive ? 'text-[#9E49E5]' : 'text-white/60 group-hover:text-white'
                  }`} 
                />
                
                {isOpen && <span className="truncate tracking-wide animate-in fade-in">{item.label}</span>}
                
                {isActive && isOpen && (
                  <div className="absolute right-3 w-2 h-2 bg-[#9E49E5] rounded-full animate-pulse"></div>
                )}

                {item.id === AppView.MESSAGES && unreadMessageCount > 0 && (
                   <div className={`absolute bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white/20 shadow-md animate-in zoom-in ${isOpen ? 'right-3 w-5 h-5' : 'top-2 right-2 w-3 h-3'}`}>
                      {isOpen ? (unreadMessageCount > 9 ? '9+' : unreadMessageCount) : ''}
                   </div>
                )}
              </button>
            );
          })}

          {/* UPGRADE TEASER */}
          {isOpen && !isRoot && !isImpersonating && systemConfig.subscriptionTier !== 'ENTERPRISE' && (
            <div className="mt-8 mx-2 p-5 bg-gradient-to-br from-black/20 to-black/10 rounded-2xl border border-white/5 text-center backdrop-blur-sm relative overflow-hidden group animate-in fade-in">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Zap className="w-16 h-16 rotate-12" />
                </div>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-3 relative z-10">Unlock Full Power</p>
                <button className="w-full py-2.5 bg-white text-[#9E49E5] rounded-xl text-xs font-black shadow-lg hover:bg-indigo-50 transition-colors relative z-10">
                  Upgrade Plan
                </button>
            </div>
          )}
        </nav>

        {/* User Footer */}
        <div className={`bg-black/20 shrink-0 border-t border-white/10 backdrop-blur-sm ${isOpen ? 'p-4' : 'p-2 py-4'}`}>
          
          <div className={`flex items-center rounded-xl transition-all hover:bg-black/10 cursor-pointer group mb-2 ${isOpen ? 'gap-3 p-3' : 'justify-center p-2'}`}>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md border-2 border-white/20 shrink-0 group-hover:border-white/40 transition-colors"
              style={{ background: avatarBg }}
            >
              {currentUser?.name?.charAt(0) || userRole?.slice(0, 1)}
            </div>
            {isOpen && (
              <div className="flex-1 min-w-0 overflow-hidden animate-in fade-in">
                <p className="text-sm font-bold text-white truncate group-hover:text-white transition-colors">{currentUser?.name || userRole}</p>
                <p className="text-xs text-white/50 font-bold uppercase tracking-wide truncate group-hover:text-white/70 transition-colors">
                  {userRole?.replace('_', ' ')}
                </p>
              </div>
            )}
            {isOpen && !isMasterUser && (
              <button 
                onClick={onLogout} 
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0" 
                title="Lock Terminal (PIN Required)"
              >
                  <Lock className="w-4 h-4" />
              </button>
            )}
          </div>

          {isImpersonating && onExitImpersonation ? (
             <button 
               onClick={onExitImpersonation}
               className={`w-full bg-white text-[#9E49E5] hover:bg-gray-100 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg mb-2 group ${isOpen ? 'py-3 px-3 text-xs' : 'p-2'}`}
               title="Back to Master"
             >
                <ArrowLeft className={`w-4 h-4 transition-transform ${isOpen ? 'group-hover:-translate-x-1' : ''}`} /> 
                {isOpen && "Back to Master"}
             </button>
          ) : (
             <button 
               onClick={onFullLogout}
               className={`w-full bg-red-500/20 hover:bg-red-50 text-red-100 hover:text-white rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all group border border-red-500/20 ${isOpen ? 'py-2 px-3 text-xs' : 'p-2'}`}
               title={isRoot ? "System Logout" : "Switch Business"}
             >
               <LogOut className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'group-hover:-translate-x-0.5' : ''}`} />
               {isOpen && (isRoot ? "System Logout" : "Switch Business")}
             </button>
          )}

        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
