
import React, { useState, useEffect } from 'react';
import { ShieldCheck, ChevronUp, Lock } from 'lucide-react';
import { SystemConfig } from '../types';

interface IdleLockScreenProps {
  onUnlock: () => void;
  systemConfig?: SystemConfig;
}

const BACKGROUND_IMAGES = [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1550966842-28a2a2a90550?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80'
];

const IdleLockScreen: React.FC<IdleLockScreenProps> = ({ onUnlock, systemConfig }) => {
  const [isBrandingVisible, setIsBrandingVisible] = useState(true);
  const [bgIndex, setBgIndex] = useState(0);

  // Background Slideshow Effect (10 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Branding Animation Logic: 8 seconds visible, 8 seconds hidden
  useEffect(() => {
    const interval = setInterval(() => {
      setIsBrandingVisible((prev) => !prev);
    }, 8000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none"
      onClick={onUnlock}
    >
      {/* FULL SCREEN BACKGROUND SLIDESHOW */}
      <div className="absolute inset-0 z-0">
          {BACKGROUND_IMAGES.map((img, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out bg-cover bg-center ${bgIndex === idx ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
                style={{ backgroundImage: `url('${img}')` }}
              />
          ))}
          {/* DARK VIGNETTE & BLUR OVERLAY */}
          <div className="absolute inset-0 bg-black/30 backdrop-brightness-[0.6]"></div>
      </div>

      {/* AMBIENT BACKGROUND GLOWS */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white/5 blur-[180px] rounded-full pointer-events-none animate-pulse"></div>

      {/* 2. CENTRAL ANIMATED BRANDING CLUSTER (Business Logo + Name) */}
      <div className={`relative z-10 flex flex-col items-center gap-10 text-center transition-all duration-[3000ms] ease-in-out transform ${
        isBrandingVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
      }`}>
        
        {/* Business Logo Container - Strictly Round & Transparent Glass */}
        <div className="group relative">
            <div className="absolute inset-0 bg-white/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
            <div className="relative w-56 h-56 bg-white/10 backdrop-blur-3xl rounded-full border-2 border-white/40 flex items-center justify-center shadow-[0_30px_80px_rgba(0,0,0,0.8)] overflow-hidden ring-4 ring-white/10">
                {systemConfig?.logo ? (
                <img src={systemConfig.logo} className="w-full h-full object-cover" alt="Business Logo" />
                ) : (
                <div className="w-16 h-16 bg-white/20 rounded-full animate-pulse" />
                )}
            </div>
        </div>

        {/* Business Name */}
        <div className="space-y-6">
          <h1 className="text-white text-5xl md:text-7xl font-black uppercase tracking-[0.3em] drop-shadow-[0_15px_45px_rgba(0,0,0,0.9)] leading-tight">
            {systemConfig?.name || 'EAGLE EYED POS'}
          </h1>
          <div className="flex flex-col items-center gap-5">
            <div className="h-1.5 w-64 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]"></div>
            <p className="text-white/60 text-xs font-black uppercase tracking-[0.8em] animate-pulse drop-shadow-lg">
              Session Locked • Instance Protected
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM INTERACTION FEEDBACK */}
      <div className="absolute bottom-16 left-0 right-0 z-10 flex flex-col items-center gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
         <div className="flex flex-col items-center gap-4 group">
            <div className="animate-bounce">
              <ChevronUp className="w-10 h-10 text-white" strokeWidth={4} />
            </div>
            <p className="text-white/50 font-black text-[11px] uppercase tracking-[1.2em] ml-[1.2em] drop-shadow-md">
                Tap to Unlock
            </p>
         </div>

         <div className="flex items-center gap-5 px-12 py-6 bg-white/5 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            <ShieldCheck className="w-6 h-6 text-white" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] whitespace-nowrap">
                FIPS 140-2 Validated Encryption Active
            </span>
         </div>
      </div>

      {/* VIGNETTE EFFECT */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 opacity-90 pointer-events-none"></div>
    </div>
  );
};

export default IdleLockScreen;
