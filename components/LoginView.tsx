
import React, { useState, useEffect, useRef } from 'react';
import { Delete, ChevronRight, Lock, Fingerprint, Box, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLogin: (pin: string) => void;
  onClientLogin: (username: string, password: string) => void;
  systemName: string;
  viewMode: 'client' | 'staff';
  businessName?: string;
  logoUrl?: string;
  onSwitchAccount?: () => void;
  onFocusInput?: () => void;
  supportContact?: string;
  supportEmail?: string;
}

const BACKGROUND_IMAGES = [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1550966842-28a2a2a90550?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80'
];

const LoginView: React.FC<LoginViewProps> = ({ 
  onLogin, onClientLogin, systemName, viewMode, businessName, logoUrl, onSwitchAccount, onFocusInput
}) => {
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  
  const pinSubmitRef = useRef<HTMLButtonElement>(null);

  // Background Slideshow Effect (10 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (viewMode === 'staff' && pin.length === 6) {
      setTimeout(() => {
        pinSubmitRef.current?.click();
      }, 300);
    }
  }, [pin, viewMode]);

  const handleInputFocus = () => {
    if (onFocusInput) onFocusInput();
  };

  const handleStaffFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      onLogin(pin);
      setPin(''); 
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-black">
      
      {/* FULL SCREEN BACKGROUND SLIDESHOW */}
      <div className="absolute inset-0 z-0">
          {BACKGROUND_IMAGES.map((img, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out bg-cover bg-center ${bgIndex === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                style={{ backgroundImage: `url('${img}')` }}
              />
          ))}
          {/* DARK VIGNETTE OVERLAY */}
          <div className="absolute inset-0 bg-black/40 backdrop-brightness-[0.7]"></div>
      </div>
      
      {/* GLASSMORPHIC PORTAL CONTAINER */}
      <div className="bg-white/10 backdrop-blur-2xl w-full max-w-[420px] rounded-[3.5rem] shadow-2xl overflow-hidden p-10 flex flex-col items-center relative z-10 border border-white/20">
        
        <div className="flex flex-col items-center mb-8 w-full">
            {/* LOGO */}
            <div className="relative group mb-6">
                <div className="absolute inset-0 bg-white/20 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <div className="w-32 h-32 bg-white/5 rounded-full shadow-2xl flex items-center justify-center overflow-hidden border-2 border-white/40 relative z-10 ring-4 ring-white/10 backdrop-blur-md">
                    {logoUrl ? (
                        <img src={logoUrl} className="w-full h-full object-cover" alt="Eagle Eyed POS" />
                    ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                            {viewMode === 'client' ? <ShieldCheck className="w-16 h-16 text-white" /> : <Lock className="w-16 h-16 text-white" />}
                        </div>
                    )}
                </div>
            </div>
            
            <h1 className="text-3xl font-black text-white tracking-tighter text-center leading-none uppercase drop-shadow-xl">
                {viewMode === 'client' ? systemName : businessName}
            </h1>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em] text-center mt-4 drop-shadow-md">
                {viewMode === 'client' ? 'Cloud Infrastructure' : 'Secure Staff Terminal'}
            </p>
        </div>

        {viewMode === 'staff' ? (
          <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
            <form 
              onSubmit={handleStaffFormSubmit} 
              method="POST" 
              action="javascript:void(0)"
              className="contents"
            >
              <input type="text" name="username" autoComplete="username" value="Staff" readOnly className="hidden" inputMode="none" />
              <input type="password" name="password" autoComplete="current-password" value={pin} readOnly className="hidden" inputMode="none" />
              <button ref={pinSubmitRef} type="submit" className="hidden">Submit</button>

              <div className="flex gap-4 justify-center mb-8">
                  {[...Array(6)].map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-white border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'border-white/20 bg-white/5'}`} />
                  ))}
              </div>

              <div className="grid grid-cols-3 gap-3 w-full">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'DEL'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                        if (key === 'DEL') setPin(prev => prev.slice(0, -1));
                        else if (key === 'C') setPin('');
                        else if (pin.length < 6) setPin(prev => prev + key);
                    }}
                    className={`h-14 rounded-2xl text-xl font-black transition-all shadow-lg flex items-center justify-center border backdrop-blur-xl active:scale-90 active:opacity-50 ${
                        key === 'DEL' ? 'bg-red-500/20 text-red-200 border-red-500/30' : 
                        key === 'C' ? 'bg-white/10 text-white/50 border-white/10' : 
                        'bg-white/5 text-white border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {key === 'DEL' ? <Delete className="w-5 h-5" /> : key}
                  </button>
                ))}
              </div>
            </form>
            
            {onSwitchAccount && (
                <button type="button" onClick={onSwitchAccount} className="w-full text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest mt-10 flex items-center justify-center gap-2 transition-all drop-shadow-md">
                    <Fingerprint className="w-4 h-4" /> Switch Business Instance
                </button>
            )}
          </div>
        ) : (
          <div className="w-full animate-in slide-in-from-right-4 duration-500">
            <form 
              onSubmit={(e) => { e.preventDefault(); onClientLogin(username, password); }} 
              method="POST"
              action="javascript:void(0)"
              className="space-y-6"
              autoComplete="on"
            >
              <div className="space-y-2">
                  <label htmlFor="login-id" className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Registry ID</label>
                  <input 
                    id="login-id"
                    name="username"
                    type="text" 
                    value={username} 
                    onFocus={handleInputFocus}
                    onChange={e => setUsername(e.target.value)} 
                    autoComplete="username"
                    required
                    className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-2xl outline-none focus:border-white/60 font-bold text-sm transition-all text-white placeholder:text-white/20 backdrop-blur-xl shadow-inner" 
                    placeholder="ENTER ID" 
                  />
              </div>
              <div className="space-y-2">
                  <label htmlFor="access-key" className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Passphrase</label>
                  <div className="relative">
                    <input 
                        id="access-key"
                        name="password"
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onFocus={handleInputFocus}
                        onChange={e => setPassword(e.target.value)} 
                        autoComplete="current-password"
                        required
                        className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-2xl outline-none focus:border-white/60 font-bold text-sm transition-all text-white placeholder:text-white/20 backdrop-blur-xl shadow-inner" 
                        placeholder="••••••••" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
              </div>
              <button type="submit" className="w-full py-5 bg-white/90 hover:bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl active:scale-95 mt-10 transition-all">
                Authenticate Session <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
      <div className="absolute bottom-10 flex items-center gap-3 text-white/30 text-[10px] font-black uppercase tracking-[0.5em] z-10">
          <div className="w-8 h-px bg-white/20"></div>
          Eagle Eyed Architecture v4.0
          <div className="w-8 h-px bg-white/20"></div>
      </div>
    </div>
  );
};

export default LoginView;
