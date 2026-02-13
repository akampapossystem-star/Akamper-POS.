
import React, { useState, useEffect, useRef } from 'react';
import { X, Delete, ArrowUp, Globe, CornerDownLeft, Space, Hash, Type, ChevronDown } from 'lucide-react';

interface VirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ isOpen, onClose }) => {
  const [layout, setLayout] = useState<'ALPHA' | 'NUMERIC' | 'SYMBOLS'>('ALPHA');
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
  
  // Track the last focused element to target input
  const lastActiveElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const handleFocus = () => {
        const active = document.activeElement;
        if (active && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
          lastActiveElementRef.current = active;
          
          // Auto-switch layout based on input type
          const inputType = active.getAttribute('type');
          const inputMode = active.getAttribute('inputmode');
          if (inputType === 'number' || inputMode === 'numeric' || inputMode === 'decimal') {
            setLayout('NUMERIC');
          } else {
            setLayout('ALPHA');
          }
        }
      };

      // Initial check
      handleFocus();

      document.addEventListener('focusin', handleFocus);
      return () => document.removeEventListener('focusin', handleFocus);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyPress = (key: string) => {
    // Fix: Properly narrow type of target element to HTMLInputElement or HTMLTextAreaElement to access selection and value properties
    const active = document.activeElement;
    const target = (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)
      ? active
      : lastActiveElementRef.current;
    
    if (!target) return;

    // Fix: target is now narrowed correctly
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    const currentValue = target.value;

    let newValue = currentValue;
    let newCursorPos = start;

    if (key === 'BACKSPACE') {
      if (start === end && start > 0) {
        newValue = currentValue.slice(0, start - 1) + currentValue.slice(end);
        newCursorPos = start - 1;
      } else if (start !== end) {
        newValue = currentValue.slice(0, start) + currentValue.slice(end);
        newCursorPos = start;
      }
    } else if (key === 'SPACE') {
      newValue = currentValue.slice(0, start) + ' ' + currentValue.slice(end);
      newCursorPos = start + 1;
    } else if (key === 'ENTER') {
      if (target.tagName === 'TEXTAREA') {
        newValue = currentValue.slice(0, start) + '\n' + currentValue.slice(end);
        newCursorPos = start + 1;
      } else {
        const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', which: 13, bubbles: true });
        target.dispatchEvent(event);
        // Fix: target is narrowed correctly
        target.blur();
        return; 
      }
    } else {
      let char = key;
      if (layout === 'ALPHA' && /^[a-z]$/.test(key)) {
        char = (isShift || isCaps) ? key.toUpperCase() : key.toLowerCase();
      }
      newValue = currentValue.slice(0, start) + char + currentValue.slice(end);
      newCursorPos = start + 1;
    }

    // Trigger React's onChange by using the native value setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      target.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(target, newValue);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // Fix: target is narrowed correctly
      target.value = newValue;
    }
    
    // Fix: target is narrowed correctly
    target.focus();
    target.setSelectionRange(newCursorPos, newCursorPos);
    
    if (isShift && !isCaps) setIsShift(false);
  };

  const preventBlur = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const alphaLayout = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const symbolLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
    ['.', ',', '?', '!', "'", '#', '%', '^', '*', '+']
  ];

  const numericPadLayout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'BACKSPACE']
  ];

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-slate-900 p-4 pb-8 z-[9999] shadow-[0_-12px_40px_rgba(0,0,0,0.6)] border-t border-slate-800 animate-in slide-in-from-bottom-10 duration-300 select-none"
      onMouseDown={preventBlur}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        
        {/* Keyboard Toolbar */}
        <div className="flex justify-between items-center px-2 mb-1">
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => setLayout('ALPHA')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${layout === 'ALPHA' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Type className="w-3.5 h-3.5" /> ABC
              </button>
              <button 
                onClick={() => setLayout('NUMERIC')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${layout === 'NUMERIC' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                <Hash className="w-3.5 h-3.5" /> 123
              </button>
              <button 
                onClick={() => setLayout('SYMBOLS')}
                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${layout === 'SYMBOLS' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                #+=
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
              <Globe className="w-3 h-3" /> Akampa System Input
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-slate-700"
          >
            <ChevronDown className="w-4 h-4" /> Hide Keyboard
          </button>
        </div>

        {/* Layout Engine */}
        {layout === 'NUMERIC' ? (
          <div className="flex justify-center gap-6">
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
              {numericPadLayout.flat().map((key) => (
                <button
                  key={key}
                  onMouseDown={preventBlur}
                  onClick={() => handleKeyPress(key)}
                  className={`h-16 rounded-2xl font-black text-2xl shadow-lg border-b-4 transition-all active:border-b-0 active:translate-y-1 ${
                    key === 'BACKSPACE' 
                      ? 'bg-red-600 text-white border-red-900 flex items-center justify-center' 
                      : 'bg-slate-700 text-white border-slate-950 hover:bg-slate-600'
                  }`}
                >
                  {key === 'BACKSPACE' ? <Delete className="w-8 h-8" /> : key}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 w-32">
                <button 
                  onMouseDown={preventBlur} 
                  onClick={() => handleKeyPress('ENTER')}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center gap-2"
                >
                  <CornerDownLeft className="w-6 h-6" />
                  Enter
                </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Standard Key Rows */}
            {(layout === 'ALPHA' ? alphaLayout : symbolLayout).map((row, idx) => (
              <div key={idx} className="flex gap-2 justify-center">
                {idx === 2 && layout === 'ALPHA' && (
                  <button 
                    onMouseDown={preventBlur}
                    onClick={() => { setIsShift(!isShift); if(isShift && isCaps) setIsCaps(false); }} 
                    onDoubleClick={() => setIsCaps(!isCaps)}
                    className={`flex-[1.5] h-14 rounded-xl font-black shadow-lg border-b-4 transition-all flex items-center justify-center max-w-[90px] ${
                      isShift || isCaps ? 'bg-blue-600 text-white border-blue-900' : 'bg-slate-800 text-slate-400 border-slate-950 hover:bg-slate-700'
                    }`}
                  >
                    <ArrowUp className={`w-6 h-6 ${isCaps ? 'fill-current' : ''}`} />
                  </button>
                )}

                {row.map(key => (
                  <button 
                    key={key} 
                    onMouseDown={preventBlur} 
                    onClick={() => handleKeyPress(key)} 
                    className="flex-1 h-14 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black text-xl shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all max-w-[75px] uppercase"
                  >
                    {layout === 'ALPHA' ? ((isShift || isCaps) ? key.toUpperCase() : key) : key}
                  </button>
                ))}

                {idx === 2 && (
                  <button onMouseDown={preventBlur} onClick={() => handleKeyPress('BACKSPACE')} className="flex-[1.5] h-14 bg-slate-800 hover:bg-red-900 text-white rounded-xl font-black shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center max-w-[90px]">
                    <Delete className="w-6 h-6" />
                  </button>
                )}
              </div>
            ))}

            {/* Bottom Row */}
            <div className="flex gap-2 justify-center mt-1 px-4">
                <button onMouseDown={preventBlur} onClick={() => handleKeyPress(',')} className="flex-1 h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xl border-b-4 border-slate-950 max-w-[75px]">
                    ,
                </button>

                <button 
                  onMouseDown={preventBlur} 
                  onClick={() => handleKeyPress('SPACE')} 
                  className="flex-[6] h-14 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl font-black text-xs uppercase tracking-[0.6em] shadow-lg border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center"
                >
                  <Space className="w-5 h-5 opacity-40 mr-2" /> Space
                </button>

                <button onMouseDown={preventBlur} onClick={() => handleKeyPress('.')} className="flex-1 h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xl border-b-4 border-slate-950 max-w-[75px]">
                    .
                </button>

                <button onMouseDown={preventBlur} onClick={() => handleKeyPress('ENTER')} className="flex-[2] h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black shadow-lg border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center max-w-[140px] gap-2 uppercase text-xs tracking-widest">
                    <CornerDownLeft className="w-5 h-5" />
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
