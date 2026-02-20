import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Delete, ArrowUp, CornerDownLeft, Space, 
  Minimize2, Maximize2, GripHorizontal,
  Plus, Minus
} from 'lucide-react';

interface VirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY_POS = 'eagle_eyed_vk_pos';
const STORAGE_KEY_SCALE = 'eagle_eyed_vk_scale';

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ isOpen, onClose }) => {
  const [layout, setLayout] = useState<'ALPHA' | 'NUMERIC' | 'SYMBOLS'>('ALPHA');
  const [isShift, setIsShift] = useState(false);
  const [isCaps, setIsCaps] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  
  const [scale, setScale] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCALE);
    return saved ? parseFloat(saved) : 1;
  });

  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_POS);
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { return { x: window.innerWidth - 650, y: window.innerHeight - 450 }; }
    }
    return { x: window.innerWidth - 650, y: window.innerHeight - 450 };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const keyboardRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop && isOpen) onClose();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_POS, JSON.stringify(position));
  }, [position]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCALE, scale.toString());
  }, [scale]);

  useEffect(() => {
    if (isOpen && isDesktop) {
      const kbWidth = 600 * scale;
      const kbHeight = (isMinimized ? 60 : 350) * scale;
      
      let newX = position.x;
      let newY = position.y;

      if (newX + 50 > window.innerWidth) newX = window.innerWidth - kbWidth - 20;
      if (newY + 50 > window.innerHeight) newY = window.innerHeight - kbHeight - 20;
      if (newX < 0) newX = 20;
      if (newY < 0) newY = 20;

      if (newX !== position.x || newY !== position.y) {
          setPosition({ x: newX, y: newY });
      }

      const handleFocus = () => {
        const active = document.activeElement;
        if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
          lastActiveElementRef.current = active;
          const inputMode = active.getAttribute('inputmode');
          if (inputMode === 'numeric' || inputMode === 'decimal') {
            setLayout('NUMERIC');
          } else {
            setLayout('ALPHA');
          }
        }
      };

      handleFocus();
      document.addEventListener('focusin', handleFocus);
      return () => document.removeEventListener('focusin', handleFocus);
    }
  }, [isOpen, scale, isMinimized, isDesktop]);

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      const kbWidth = 600 * scale;
      const kbHeight = (isMinimized ? 60 : 320) * scale;
      const margin = 10;
      let nextX = Math.max(margin, Math.min(clientX - dragOffset.x, window.innerWidth - kbWidth - margin));
      let nextY = Math.max(margin, Math.min(clientY - dragOffset.y, window.innerHeight - kbHeight - margin));
      setPosition({ x: nextX, y: nextY });
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
        if (isDragging) e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, dragOffset, scale, isMinimized]);

  if (!isOpen || !isDesktop) return null;

  const handleScaleChange = (delta: number) => {
    setScale(prev => {
        const newVal = Math.max(0.7, Math.min(1.5, prev + delta));
        return parseFloat(newVal.toFixed(1));
    });
  };

  const handleKeyPress = (key: string) => {
    const active = document.activeElement;
    const target = (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)
      ? active
      : lastActiveElementRef.current;
    
    if (!target) return;

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

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(target, newValue);
      target.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      target.value = newValue;
    }
    
    target.focus();
    try { target.setSelectionRange(newCursorPos, newCursorPos); } catch (e) {}
    if (isShift && !isCaps) setIsShift(false);
  };

  const onStartDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragOffset({ x: clientX - position.x, y: clientY - position.y });
  };

  const alphaRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const Key = ({ val, flex = 1, isAction = false, isSpecial = false, onClick, children }: any) => {
    const displayLabel = useMemo(() => {
        if (layout === 'ALPHA' && val && /^[a-z]$/.test(val)) {
            return (isShift || isCaps) ? val.toUpperCase() : val.toLowerCase();
        }
        return val;
    }, [val, layout, isShift, isCaps]);

    return (
        <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onClick ? onClick() : handleKeyPress(val)}
            className={`rounded-lg font-black transition-all active:scale-95 shadow-[0_3px_0_rgba(0,0,0,0.3)] active:shadow-none select-none ${isAction ? 'bg-indigo-600 text-white hover:bg-indigo-500' : isSpecial ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600/30'} flex items-center justify-center`}
            style={{ flex, height: `${42 * scale}px`, fontSize: `${15 * scale}px` }}
        >
            {children || displayLabel}
        </button>
    );
  };

  return (
    <div 
      ref={keyboardRef}
      style={{ left: position.x, top: position.y, width: `${600 * scale}px`, zIndex: 9999 }}
      className="fixed pointer-events-auto select-none transition-shadow duration-300"
    >
        <div className={`flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-[2rem] border border-slate-800 overflow-hidden ${isMinimized ? 'w-fit' : 'w-full'}`}>
            <div 
                onMouseDown={(e) => onStartDrag(e.clientX, e.clientY)}
                onTouchStart={(e) => onStartDrag(e.touches[0].clientX, e.touches[0].clientY)}
                className={`bg-slate-900 border-b border-slate-800 flex items-center justify-between h-12 px-5 cursor-grab active:cursor-grabbing ${isDragging ? 'bg-indigo-900/40' : ''} transition-colors`}
            >
                 <div className="flex items-center gap-3">
                    <GripHorizontal className="w-5 h-5 text-slate-600" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Input Terminal</span>
                 </div>
                 <div className="flex gap-1.5 items-center">
                    <div className="flex items-center bg-slate-800 rounded-xl px-1 mr-3 border border-slate-700">
                      <button onClick={(e) => { e.stopPropagation(); handleScaleChange(-0.1); }} className="p-2 text-slate-400 hover:text-white transition-colors active:scale-75"><Minus className="w-4 h-4" /></button>
                      <span className="text-[10px] font-black text-indigo-400 px-2 w-10 text-center">{Math.round(scale * 100)}%</span>
                      <button onClick={(e) => { e.stopPropagation(); handleScaleChange(0.1); }} className="p-2 text-slate-400 hover:text-white transition-colors active:scale-75"><Plus className="w-4 h-4" /></button>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-2 text-slate-500 hover:text-white transition-colors">{isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}</button>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                 </div>
            </div>
            {!isMinimized && (
                <div className="bg-slate-900/95 backdrop-blur-3xl p-3 flex flex-col animate-in slide-in-from-top-2 duration-200" style={{ gap: `${8 * scale}px` }}>
                    {layout === 'ALPHA' && (
                      <>
                        <div className="flex" style={{ gap: `${6 * scale}px` }}>{alphaRows[0].map(key => <Key key={key} val={key} isSpecial={true} />)}</div>
                        {alphaRows.slice(1, 3).map((row, rIdx) => (
                          <div key={rIdx} className="flex" style={{ gap: `${6 * scale}px`, paddingLeft: `${10 * scale}px`, paddingRight: `${10 * scale}px` }}>{row.map(key => <Key key={key} val={key} />)}</div>
                        ))}
                        <div className="flex" style={{ gap: `${6 * scale}px` }}>
                          <Key val="SHIFT" flex={1.5} onClick={() => setIsShift(!isShift)} isAction={isShift || isCaps}><ArrowUp className="w-5 h-5" style={{ width: `${18 * scale}px`, height: `${18 * scale}px` }} /></Key>
                          {alphaRows[3].map(key => <Key key={key} val={key} />)}
                          <Key val="BACKSPACE" flex={1.5} isAction={true}><Delete className="w-6 h-6" style={{ width: `${22 * scale}px`, height: `${22 * scale}px` }} /></Key>
                        </div>
                        <div className="flex" style={{ gap: `${6 * scale}px` }}>
                          <Key val="?123" flex={1.5} isSpecial={true} onClick={() => setLayout('SYMBOLS')} />
                          <Key val="," flex={1} /><Key val="SPACE" flex={5} /><Key val="." flex={1} />
                          <Key val="ENTER" flex={1.5} isAction={true}><CornerDownLeft className="w-6 h-6" style={{ width: `${22 * scale}px`, height: `${22 * scale}px` }} /></Key>
                        </div>
                      </>
                    )}
                    {(layout === 'NUMERIC' || layout === 'SYMBOLS') && (
                      <div className="flex flex-col animate-in fade-in duration-200" style={{ gap: `${8 * scale}px` }}>
                        <div className="flex" style={{ gap: `${6 * scale}px` }}>{['1','2','3','4','5','6','7','8','9','0'].map(k => <Key key={k} val={k} />)}</div>
                        <div className="flex" style={{ gap: `${6 * scale}px` }}>{['@','#','$','_','&','-','+','(',')','/'].map(k => <Key key={k} val={k} isSpecial={true} />)}</div>
                        <div className="flex" style={{ gap: `${6 * scale}px` }}>{['*','"',"'",':',';','!','?','\\','|','`'].map(k => <Key key={k} val={k} isSpecial={true} />)}</div>
                        <div className="flex" style={{ gap: `${6 * scale}px` }}>
                            <Key val="ABC" flex={1.5} isAction={true} onClick={() => setLayout('ALPHA')} />
                            <Key val="[" flex={1} isSpecial={true} /><Key val="SPACE" flex={4} /><Key val="]" flex={1} isSpecial={true} />
                            <Key val="BACKSPACE" flex={1.5} isAction={true}><Delete className="w-6 h-6" style={{ width: `${22 * scale}px`, height: `${22 * scale}px` }} /></Key>
                        </div>
                      </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default VirtualKeyboard;