
import React, { useState, useEffect } from 'react';
import { LifeBuoy, Lock, FileText, Upload, Save, CheckCircle, UtensilsCrossed, ImageIcon, Printer, Coins, Palette, Monitor, Ruler, Type, Phone, Mail, Eye } from 'lucide-react';
import { SystemConfig, UserRole, StaffMember } from '../types';
import { printTestReceipt, generateReceiptHtml } from '../services/receiptService';

interface SettingsViewProps {
  config: SystemConfig;
  setConfig: (config: SystemConfig) => void;
  userRole: UserRole;
  isMasterView: boolean;
  currentUser: StaffMember | null;
}

const CURRENCY_OPTIONS = [
  { label: 'Ugandan Shilling (UGX)', value: 'UGX' },
  { label: 'US Dollar ($)', value: '$' },
  { label: 'Euro (€)', value: '€' },
  { label: 'British Pound (£)', value: '£' },
  { label: 'Kenyan Shilling (KES)', value: 'KES' },
  { label: 'Tanzanian Shilling (TZS)', value: 'TZS' },
  { label: 'Rwandan Franc (RWF)', value: 'RWF' },
  { label: 'South Sudanese Pound (SSP)', value: 'SSP' },
];

const THEME_COLORS = [
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Crimson Red', value: '#ef4444' },
  { name: 'Sunset Orange', value: '#f97316' },
  { name: 'Deep Purple', value: '#7c3aed' },
  { name: 'Hot Pink', value: '#db2777' },
  { name: 'Slate Dark', value: '#1e293b' },
  { name: 'Golden Amber', value: '#d97706' },
];

const SYSTEM_FONTS = [
  'Inter', 'Roboto Mono', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 
  'Source Sans Pro', 'Slabo 27px', 'Raleway', 'PT Sans', 'Merriweather', 
  'Nunito', 'Prompt', 'Work Sans', 'Fira Code', 'Playfair Display', 
  'Rubik', 'Mukta', 'Kanit', 'Barlow', 'Quicksand', 'Karla', 'Inconsolata', 
  'Titillium Web', 'Josefin Sans', 'Libre Baskerville', 'Anton', 'Cabin', 
  'Dancing Script', 'Pacifico', 'Cinzel', 'Comfortaa', 'Exo 2', 'Heebo', 
  'Maven Pro', 'Oxygen', 'Signika', 'Varela Round'
];

const SettingsView: React.FC<SettingsViewProps> = ({ config, setConfig, userRole, isMasterView, currentUser }) => {
  const [local, setLocal] = useState<SystemConfig>(config);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  
  useEffect(() => {
    setLocal(config);
  }, [config]);

  // Root Admin Check (Strictly for UI elements)
  const isRootAdmin = currentUser?.id === 'ROOT' || currentUser?.id?.startsWith('MASTER_OVERRIDE');

  const handleReceiptChange = (key: keyof SystemConfig['receipt'], value: any) => {
    setLocal(prev => ({
      ...prev,
      receipt: {
        ...prev.receipt,
        [key]: value
      }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocal(prev => ({ 
            ...prev, 
            logo: reader.result as string,
            receipt: { ...prev.receipt, logoUrl: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = () => {
    // Passes local state up to App.tsx which handles saving to specific tenant record
    setConfig(local);
  };

  const handlePreview = () => {
      const html = generateReceiptHtml(local, null, 'TEST');
      setPreviewHtml(html);
      setShowPreview(true);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">
                {isMasterView ? 'Master System Settings' : 'Page Settings'}
            </h2>
            <button 
                onClick={saveSettings}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
            >
                <Save className="w-5 h-5" /> Save Changes
            </button>
        </div>

        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Palette className="w-4 h-4" /> System Visuals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                        <Type className="w-3 h-3" /> System Font Style
                    </label>
                    <select 
                        value={local.fontFamily || 'Inter'}
                        onChange={(e) => setLocal({...local, fontFamily: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-bold text-gray-700"
                    >
                        {SYSTEM_FONTS.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block flex items-center gap-2">
                        <Palette className="w-3 h-3" /> Page Theme Color
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {THEME_COLORS.map(color => (
                            <button
                                key={color.value}
                                onClick={() => setLocal(prev => ({...prev, colors: { ...prev.colors, primary: color.value } }))}
                                className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${local.colors.primary === color.value ? 'ring-2 ring-offset-2 ring-gray-400 border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: color.value }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>

        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                {isMasterView ? <Monitor className="w-4 h-4" /> : <UtensilsCrossed className="w-4 h-4" />} 
                {isMasterView ? 'Global System Identity' : 'Business Identity'}
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8 mb-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center relative overflow-hidden group shrink-0">
                    {local.logo ? (
                        <img src={local.logo} alt="Business Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                        <ImageIcon className="w-12 h-12 text-gray-300" />
                    )}
                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                        <Upload className="w-6 h-6 text-white" />
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                </div>
                <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Page Name</label>
                        <input 
                            type="text" 
                            value={local.name}
                            onChange={(e) => setLocal({...local, name: e.target.value})}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700"
                        />
                    </div>
                </div>
            </div>
        </section>

        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-pink-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Receipt & Printing Engine
                </h3>
                <div className="flex gap-2">
                    <button onClick={handlePreview} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 hover:bg-gray-200">
                        <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button onClick={() => printTestReceipt(local)} className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 hover:bg-pink-200">
                        <Printer className="w-3.5 h-3.5" /> Test Print
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                 {/* NEW: Editable Header Contacts */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                            <Phone className="w-3 h-3" /> Receipt Header Phone
                        </label>
                        <input 
                            type="text" 
                            value={local.receipt.headerPhone || ''}
                            onChange={(e) => handleReceiptChange('headerPhone', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-sm"
                            placeholder="+256 000 000 000"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-2">
                            <Mail className="w-3 h-3" /> Receipt Header Email
                        </label>
                        <input 
                            type="email" 
                            value={local.receipt.headerEmail || ''}
                            onChange={(e) => handleReceiptChange('headerEmail', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-bold text-sm"
                            placeholder="support@business.com"
                        />
                    </div>
                    <p className="col-span-full text-[9px] text-gray-400 font-bold uppercase tracking-wider">These contacts appear below the logo on printed receipts.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Header Message</label>
                      <textarea 
                        value={local.receipt.headerText}
                        onChange={(e) => handleReceiptChange('headerText', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none font-medium text-sm h-20 resize-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Footer Message</label>
                      <textarea 
                        value={local.receipt.footerText}
                        onChange={(e) => handleReceiptChange('footerText', e.target.value)}
                        // If not root, this might be disabled depending on business logic, but per user request, tenants should control their settings independently.
                        disabled={false} 
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl outline-none font-medium text-sm h-20 resize-none bg-gray-50`}
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-pink-50/50 rounded-2xl border border-pink-100">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Paper Width</label>
                        <select 
                            value={local.receipt.paperWidth}
                            onChange={(e) => handleReceiptChange('paperWidth', e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm"
                        >
                            <option value="80mm">80mm (Standard)</option>
                            <option value="58mm">58mm (Narrow)</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Font Size (pt)</label>
                        <input 
                            type="number" 
                            min="8" max="16"
                            value={local.receipt.fontSize}
                            onChange={(e) => handleReceiptChange('fontSize', parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm"
                        />
                    </div>
                 </div>
            </div>
        </section>

        <section className={`rounded-3xl p-6 shadow-sm border ${isRootAdmin ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-200'}`}>
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                <LifeBuoy className="w-4 h-4" /> Global System Support
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Support Phone</label>
                    <input 
                        type="text" 
                        value={local.owner_contact} 
                        disabled={!isRootAdmin} // Only Root can change global support contact
                        onChange={e => setLocal({...local, owner_contact: e.target.value})}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl font-bold ${!isRootAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Support Email</label>
                    <input 
                        type="email" 
                        value={local.support_email} 
                        disabled={!isRootAdmin}
                        onChange={e => setLocal({...local, support_email: e.target.value})}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-xl font-bold ${!isRootAdmin ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                    />
                </div>
            </div>
        </section>
      </div>

      {/* Preview Modal */}
      {showPreview && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 bg-gray-900 text-white flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-sm uppercase tracking-widest">Receipt Preview</h3>
                      <button onClick={() => setShowPreview(false)} className="hover:text-gray-300">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-gray-200 p-4 flex justify-center">
                      <div 
                        className="bg-white shadow-lg p-2" 
                        style={{ width: local.receipt.paperWidth, minHeight: '300px' }}
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                      />
                  </div>
                  <div className="p-4 bg-white border-t border-gray-200 flex justify-end">
                      <button onClick={() => setShowPreview(false)} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase">Done</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsView;
