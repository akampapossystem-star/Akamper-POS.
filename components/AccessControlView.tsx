
import React from 'react';
import { 
  Shield, Check, X, Lock, Eye, EyeOff, AlertTriangle, 
  Gavel, FileKey, Users, LayoutDashboard, ShoppingCart
} from 'lucide-react';
import { AppView, UserRole, RolePermissions, PermissionAction } from '../types';

interface AccessControlViewProps {
  permissions: Record<string, RolePermissions>; // Using string key to support UserRole
  onUpdatePermissions: (role: UserRole, type: 'view' | 'action', key: string, value: boolean) => void;
}

const ROLES: UserRole[] = ['MANAGER', 'CASHIER', 'WAITER', 'CHEF', 'STORE_KEEPER', 'BARMAN', 'BARISTA'];

// Mapping of Views to Human Readable Names
// Restricted system-admin views (MASTER_PORTAL, TENANTS, etc.) are excluded here to prevent tenant visibility.
const VIEW_CONFIG: { id: AppView; label: string; icon?: any }[] = [
  { id: AppView.DASHBOARD, label: 'Dashboard Overview' },
  { id: AppView.WAITER_PORTAL, label: 'Restaurant Menu (Order)' },
  { id: AppView.ORDERS, label: 'Order Log' },
  { id: AppView.KITCHEN, label: 'Kitchen Display' },
  { id: AppView.KITCHEN_INVENTORY, label: 'Kitchen Stock & Recipes' },
  { id: AppView.BAKERY_INVENTORY, label: 'Bakery Inventory' },
  { id: AppView.SPIRITS, label: 'Spirits Inventory' },
  { id: AppView.REQUISITION, label: 'Stock Request' },
  { id: AppView.EXPENSES, label: 'Expense Tracker' },
  { id: AppView.STORE_KEEPER, label: 'Store Keeper Portal' },
  { id: AppView.INVENTORY, label: 'Product Inventory' },
  { id: AppView.REPORTS, label: 'Analytics Reports' },
  { id: AppView.CRM, label: 'Customer CRM' },
  { id: AppView.MESSAGES, label: 'Team Chat' },
  { id: AppView.DAY_SHIFTS, label: 'Day Shifts' },
  { id: AppView.HRM, label: 'Staff & HR' },
  { id: AppView.TABLES, label: 'Table Layout' },
  { id: AppView.PHONEBOOK, label: 'Phone Book' },
  { id: AppView.ESSENTIALS, label: 'Tools & Utilities' },
  { id: AppView.CATALOGUE_QR, label: 'Digital Menu QR' },
  { id: AppView.ACCESS_CONTROL, label: 'Laws & Restrictions' },
];

const ACTION_CONFIG: { id: PermissionAction; label: string; desc: string }[] = [
  { id: 'DELETE_ORDER', label: 'Delete Orders', desc: 'Can permanently remove orders' },
  { id: 'VOID_ITEM', label: 'Void Items', desc: 'Can remove items from active orders' },
  { id: 'PROCESS_REFUND', label: 'Process Refunds', desc: 'Can authorize returns and refunds' },
  { id: 'VIEW_COST_PRICE', label: 'View Cost Prices', desc: 'Can see purchase costs of stock' },
  { id: 'MANAGE_STOCK', label: 'Adjust Stock', desc: 'Can manually edit inventory counts' },
  { id: 'EDIT_MENU', label: 'Edit Menu', desc: 'Can change prices and products' },
  { id: 'VIEW_ANALYTICS', label: 'View Analytics', desc: 'Can see sensitive financial data' },
  { id: 'CLOSE_REGISTER', label: 'Close Register', desc: 'Can perform end-of-shift closure' },
];

const AccessControlView: React.FC<AccessControlViewProps> = ({ permissions, onUpdatePermissions }) => {
  return (
    <div className="p-8 h-[calc(100vh-64px)] overflow-y-auto bg-slate-50 font-sans">
      
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Gavel className="w-8 h-8 text-indigo-600" /> Laws & Restrictions
          </h1>
          <p className="text-slate-500 font-medium">Define access rights, module visibility, and operational limits for staff.</p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
           <Shield className="w-4 h-4" /> Policy Manager
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
         <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
            <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
               <LayoutDashboard className="w-5 h-5 text-indigo-400" /> Module Access Laws
            </h2>
            <p className="text-xs text-slate-400">Toggle which screens each role can see.</p>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                     <th className="p-4 w-64 border-r border-slate-100">System Module</th>
                     {ROLES.map(role => (
                        <th key={role} className="p-4 text-center min-w-[100px] border-r border-slate-100 last:border-0">
                           {role?.replace('_', ' ')}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody className="text-sm font-bold text-slate-700">
                  {VIEW_CONFIG.map((view) => (
                     <tr key={view.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 border-r border-slate-100 flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-slate-300"></span> {view.label}
                        </td>
                        {ROLES.map(role => {
                           const canSee = permissions[role as string]?.allowedViews.includes(view.id);
                           return (
                              <td key={role} className="p-4 text-center border-r border-slate-100 last:border-0">
                                 <button 
                                    onClick={() => onUpdatePermissions(role, 'view', view.id, !canSee)}
                                    className={`w-10 h-6 rounded-full p-1 transition-all duration-300 ease-in-out ${
                                       canSee ? 'bg-green-500' : 'bg-slate-200'
                                    }`}
                                 >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                                       canSee ? 'translate-x-4' : 'translate-x-0'
                                    }`}></div>
                                 </button>
                              </td>
                           );
                        })}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
         <div className="p-6 bg-indigo-900 text-white flex justify-between items-center">
            <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-orange-400" /> Action Restrictions
            </h2>
            <p className="text-xs text-indigo-200">Control sensitive operations and data visibility.</p>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-indigo-50/50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-indigo-900/60">
                     <th className="p-4 w-64 border-r border-slate-100">Restricted Action</th>
                     {ROLES.map(role => (
                        <th key={role} className="p-4 text-center min-w-[100px] border-r border-slate-100 last:border-0">
                           {role?.replace('_', ' ')}
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody className="text-sm font-bold text-slate-700">
                  {ACTION_CONFIG.map((action) => (
                     <tr key={action.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 border-r border-slate-100">
                           <div>{action.label}</div>
                           <div className="text-[10px] text-slate-400 font-medium font-sans mt-0.5">{action.desc}</div>
                        </td>
                        {ROLES.map(role => {
                           const canDo = permissions[role as string]?.allowedActions.includes(action.id);
                           return (
                              <td key={role} className="p-4 text-center border-r border-slate-100 last:border-0">
                                 <button 
                                    onClick={() => onUpdatePermissions(role, 'action', action.id, !canDo)}
                                    className={`relative inline-flex items-center justify-center p-2 rounded-lg transition-all ${
                                       canDo 
                                          ? 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200' 
                                          : 'bg-green-50 text-green-600 hover:bg-green-100 ring-1 ring-green-200'
                                    }`}
                                    title={canDo ? "Click to Restrict (Disallow)" : "Click to Allow"}
                                 >
                                    {canDo ? <Lock className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                    <span className="ml-2 text-[10px] uppercase font-black tracking-wider w-16">
                                       {canDo ? 'Allowed' : 'Denied'}
                                    </span>
                                 </button>
                              </td>
                           );
                        })}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
         <FileKey className="w-5 h-5 text-yellow-600 mt-0.5" />
         <div>
            <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wide">Security Note</h4>
            <p className="text-xs text-yellow-700 mt-1">
               Changes to laws and restrictions apply immediately. However, staff currently logged in may need to refresh their session or re-login for new permissions to take full effect.
               Owners always retain full access regardless of these settings.
            </p>
         </div>
      </div>

    </div>
  );
};

export default AccessControlView;
