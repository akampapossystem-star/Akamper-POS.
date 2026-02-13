
import React, { useState, useEffect } from 'react';
import { 
  Palette, Upload, Phone, Mail, Save, Monitor, 
  ImageIcon, ShieldCheck, LifeBuoy, AlertCircle 
} from 'lucide-react';
import { SystemConfig } from '../types';

interface SystemBrandingViewProps {
  systemConfig: SystemConfig;
  onUpdateConfig: (config: SystemConfig) => void;
}

const SystemBrandingView: React.FC<SystemBrandingViewProps> = ({ systemConfig, onUpdateConfig }) => {
  const [localConfig, setLocalConfig] = useState<SystemConfig>(systemConfig);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(systemConfig);
  }, [systemConfig]);

  const handleChange = (key: keyof SystemConfig, value: any) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    setHasChanges(true);
    // Instant Effect:
    onUpdateConfig(updated);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        handleChange('logo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  // HARDCODED CONTACTS FOR DISPLAY
  const SUPPORT_PHONE = "+256 7413 50786";
  const SUPPORT_EMAIL = "akamperpos@gmail.com";

  return (
    <div className="p-8 h-full bg-[#111827] text-white overflow-y-auto">
      
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-900/50">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">System Identity</h1>
            <p className="text-gray-400 font-medium text-sm mt-1">Configure global branding and technical support channels.</p>
          </div>
        </div>
        
        {hasChanges && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 animate-in fade-in slide-in-from-right-4">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-black uppercase tracking-widest">Changes Applied Live</span>
            </div>
        )}
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- LEFT COLUMN: BRANDING --- */}
        <div className="space-y-8">
            <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <ImageIcon className="w-32 h-32 text-indigo-500 rotate-12" />
                </div>

                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 mb-6 relative z-10">
                    <Monitor className="w-6 h-6 text-indigo-500" /> Visual Identity
                </h3>

                <div className="space-y-8 relative z-10">
                    {/* Logo Uploader */}
                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 bg-gray-800 rounded-3xl border-4 border-gray-700 flex items-center justify-center relative overflow-hidden group shadow-inner">
                            {localConfig.logo ? (
                                <img src={localConfig.logo} alt="System Logo" className="w-full h-full object-contain p-2" />
                            ) : (
                                <span className="text-xs font-bold text-gray-600 uppercase text-center px-2">No Logo Set</span>
                            )}
                            
                            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="w-8 h-8 text-white mb-1" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoUpload} 
                                    className="hidden" 
                                />
                            </label>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-lg">System Logo</h4>
                            <p className="text-xs text-gray-500 mb-3">
                                This logo appears on the Login Screen and Sidebar for all tenants. Supports PNG, JPG, SVG, WEBP.
                            </p>
                            <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-indigo-900/40 inline-flex items-center gap-2 transition-all active:scale-95">
                                <Upload className="w-4 h-4" /> Upload New Image
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoUpload} 
                                    className="hidden" 
                                />
                            </label>
                        </div>
                    </div>

                    {/* App Name */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Application Name</label>
                        <input 
                            type="text" 
                            value={localConfig.name} 
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full px-5 py-4 bg-gray-950 border border-gray-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold text-lg placeholder:text-gray-700 transition-all"
                            placeholder="e.g. Akamper POS"
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: SUPPORT --- */}
        <div className="space-y-8">
            <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <LifeBuoy className="w-32 h-32 text-emerald-500 -rotate-12" />
                </div>

                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 mb-6 relative z-10">
                    <ShieldCheck className="w-6 h-6 text-emerald-500" /> Technical Support
                </h3>

                <p className="text-sm text-gray-400 mb-8 leading-relaxed relative z-10">
                    These contact details are hardcoded into the system core. They appear on every receipt footer and cannot be changed by tenants or administrators via this panel.
                </p>

                <div className="space-y-6 relative z-10">
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Phone className="w-3 h-3 text-emerald-500" /> Emergency Support Number (Locked)
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={SUPPORT_PHONE} 
                                disabled
                                className="w-full pl-5 pr-12 py-4 bg-gray-950 border border-gray-800 rounded-2xl outline-none text-gray-500 font-mono font-bold text-lg tracking-wide cursor-not-allowed opacity-70"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Phone className="w-5 h-5 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Mail className="w-3 h-3 text-emerald-500" /> Support Email Address (Locked)
                        </label>
                        <div className="relative">
                            <input 
                                type="email" 
                                value={SUPPORT_EMAIL} 
                                disabled
                                className="w-full pl-5 pr-12 py-4 bg-gray-950 border border-gray-800 rounded-2xl outline-none text-gray-500 font-bold text-lg cursor-not-allowed opacity-70"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Mail className="w-5 h-5 text-gray-600" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-2xl flex items-start gap-3 mt-4">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wide">System Hardcoded</h4>
                            <p className="text-xs text-red-600/80 mt-1">
                                To modify these values, a system patch is required. They are permanent for this version.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SystemBrandingView;
