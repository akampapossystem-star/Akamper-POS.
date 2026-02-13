
import React, { useState, useEffect, useRef } from 'react';
import { Delete, ChevronRight, User, Key, Eye, EyeOff, LogOut, X, Lock, Users, ArrowLeft, Fingerprint } from 'lucide-react';

interface LoginViewProps {
  onLogin: (pin: string) => void;
  onClientLogin: (username: string, password: string) => void;
  systemName: string;
  viewMode: 'client' | 'staff'; // client = Admin/Company Login, staff = PIN Pad
  businessName?: string;
  logoUrl?: string;
  onSwitchAccount?: () => void;
  supportContact?: string;
  supportEmail?: string;
}

const LoginView: React.FC<LoginViewProps> = ({ 
  onLogin, 
  onClientLogin, 
  systemName, 
  viewMode,
  businessName,
  logoUrl,
  onSwitchAccount,
  supportContact,
  supportEmail
}) => {
  const [pin, setPin] = useState('');
  const pinInputRef = useRef<HTMLInputElement>(null);
  
  // Client Credentials
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Screensaver State
  const [isScreensaverActive, setIsScreensaverActive] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- INACTIVITY TIMER LOGIC ---
  useEffect(() => {
    // Only run timer if in Staff PIN mode and screensaver is NOT already active
    if (viewMode === 'staff' && !isScreensaverActive) {
        
        const resetTimer = () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = setTimeout(() => {
                setIsScreensaverActive(true);
            }, 30000); // 30 Seconds
        };

        // Initial start
        resetTimer();

        // Activity Listeners
        const events = ['mousedown', 'mousemove', 'keypress', 'touchstart', 'scroll', 'click'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }
  }, [viewMode, isScreensaverActive]);

  // Focus PIN input on mount or resume
  useEffect(() => {
    if (viewMode === 'staff' && !isScreensaverActive) {
      // Small timeout to ensure render visibility
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    }
  }, [viewMode, isScreensaverActive]);

  // Auto-submit PIN logic
  useEffect(() => {
    if (viewMode === 'staff' && pin.length === 6 && !isScreensaverActive) {
      const timer = setTimeout(() => {
        onLogin(pin);
        setPin(''); 
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pin, onLogin, viewMode, isScreensaverActive]);

  const handleKeyClick = (key: string) => {
    if (pin.length < 6) {
        const newPin = pin + key;
        setPin(newPin);
        // Keep focus on input to prevent keyboard flickering if mixed usage
        pinInputRef.current?.focus();
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    pinInputRef.current?.focus();
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      // Allow only numbers
      if (/^\d*$/.test(val)) {
          setPin(val);
      }
  };

  const handleSubmitClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) onClientLogin(username, password);
  };

  // --- SCREENSAVER VIEW (Dark Mode for contrast) ---
  if (isScreensaverActive && viewMode === 'staff') {
      return (
          <div 
            onClick={() => setIsScreensaverActive(false)}
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-700"
          >
              <div className="flex flex-col items-center gap-8 animate-pulse">
                  {/* Floating Logo */}
                  <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.2)] p-4">
                      {logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                          <Lock className="w-24 h-24 text-gray-400" />
                      )}
                  </div>
                  
                  {/* Business Name */}
                  <div className="text-center space-y-4">
                      <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
                          {businessName || systemName}
                      </h1>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-white/60 font-bold uppercase tracking-[0.5em] text-xs animate-bounce mt-4">
                            Touch Screen to Access
                        </p>
                      </div>
                  </div>
              </div>

              {/* Secure Status */}
              <div className="absolute bottom-10 flex items-center gap-2 text-white/20 text-[10px] font-mono uppercase tracking-widest">
                  <Fingerprint className="w-3 h-3" /> Secure Terminal • Auto-Locked
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen w-full bg-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      {/* Main Card with Imaginary Boundary (Shadow & Border) */}
      <div className={`bg-white w-full rounded-3xl shadow-2xl overflow-hidden p-6 flex flex-col items-center relative z-10 animate-in fade-in zoom-in duration-500 transition-all max-w-[340px] border-4 border-white ring-1 ring-gray-200/50`}>
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-6 w-full">
            {/* BIG LOGO AREA */}
            <div className="w-24 h-24 bg-white rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center p-3 mb-4 border border-gray-100">
                {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                        <Lock className="w-8 h-8" />
                    </div>
                )}
            </div>
            
            <h1 className="text-xl font-black text-gray-900 tracking-tighter text-center leading-none uppercase">
                {viewMode === 'client' ? systemName : businessName}
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] text-center mt-2">
                {viewMode === 'client' ? 'Secure Login Portal' : 'Staff Access Terminal'}
            </p>
        </div>

        {/* --- STAFF PIN MODE (Generic Keypad) --- */}
        {viewMode === 'staff' && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="text-center mb-4">
                <p className="text-gray-500 text-xs font-bold">Enter 6-Digit PIN Code</p>
            </div>

            {/* PIN INPUT CONTAINER */}
            <div className="relative mb-6 group cursor-text" onClick={() => pinInputRef.current?.focus()}>
                
                {/* Hidden Real Input for Keyboard Support */}
                <input
                    ref={pinInputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pin}
                    onChange={handlePinChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 caret-transparent text-transparent bg-transparent"
                    autoFocus
                    autoComplete="off"
                />

                {/* Visual PIN Dots */}
                <div className="flex gap-3 justify-center pointer-events-none relative z-10">
                {[...Array(6)].map((_, i) => (
                    <div 
                    key={i} 
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                        pin.length > i 
                        ? 'bg-blue-600 border-blue-600 scale-110' 
                        : 'border-gray-300 bg-gray-100 group-hover:border-blue-300'
                    }`}
                    />
                ))}
                </div>
            </div>

            {/* Keypad (Light Buttons) */}
            <div className="grid grid-cols-3 gap-3 w-full mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0].map((key, idx) => (
                key === '' ? <div key={idx}></div> : // Spacer
                <button
                  key={key}
                  onClick={() => handleKeyClick(key.toString())}
                  className="h-14 rounded-xl bg-gray-50 text-xl font-bold text-gray-800 hover:bg-gray-100 active:scale-95 transition-all shadow-sm border border-gray-200"
                >
                  {key}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="h-14 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all border border-red-100 shadow-sm"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
            
            {onSwitchAccount && (
                <button 
                    onClick={onSwitchAccount}
                    className="w-full text-gray-400 hover:text-gray-800 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors mt-2 py-2"
                >
                    <ArrowLeft className="w-3 h-3" /> Back to Administration
                </button>
            )}
          </div>
        )}

        {/* --- CLIENT LOGIN MODE (Username/Password) --- */}
        {viewMode === 'client' && (
          <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300">
            <form onSubmit={handleSubmitClient} className="space-y-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Login ID</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 focus:ring-0 font-bold text-sm text-gray-900 placeholder:text-gray-400 transition-all"
                      placeholder="Enter Tenant ID"
                      autoFocus
                    />
                  </div>
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Password</label>
                  <div className="relative group">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 focus:ring-0 font-bold text-sm text-gray-900 placeholder:text-gray-400 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
              </div>
              
              <button 
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-xl shadow-blue-200 active:scale-[0.98] mt-4 tracking-widest"
              >
                Access Dashboard <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Support Footer */}
        {(supportContact || supportEmail) && (
            <div className="mt-6 pt-4 border-t border-gray-100 w-full text-center">
                <div className="flex flex-col items-center gap-1">
                    <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-0.5">
                        Technical Support
                    </p>
                    {supportContact && <span className="text-gray-600 text-[10px] font-mono font-bold bg-gray-50 px-2 py-0.5 rounded-full">{supportContact}</span>}
                    {supportEmail && <span className="text-gray-500 text-[10px] font-mono">{supportEmail}</span>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginView;
