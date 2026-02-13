import React, { useState } from 'react';
import { X, Delete } from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  if (!isOpen) return null;

  const handlePress = (val: string) => {
    if (val === '=') {
      try {
        // eslint-disable-next-line
        const result = eval(equation + display); 
        setDisplay(String(result));
        setEquation('');
      } catch {
        setDisplay('Error');
        setEquation('');
      }
    } else if (val === 'C') {
      setDisplay('0');
      setEquation('');
    } else if (val === 'DEL') {
      setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (['+', '-', '*', '/'].includes(val)) {
      setEquation(prev => prev + display + val);
      setDisplay('0');
    } else {
      setDisplay(prev => prev === '0' ? val : prev + val);
    }
  };

  const buttons = [
    'C', '/', '*', 'DEL',
    '7', '8', '9', '-',
    '4', '5', '6', '+',
    '1', '2', '3', '=',
    '0', '.',
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden border border-gray-700 animate-in zoom-in-95 duration-200">
        <div className="p-4 bg-gray-800 flex justify-between items-center border-b border-gray-700">
          <span className="text-white font-bold uppercase tracking-widest text-xs">Calculator</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6">
          <div className="bg-gray-100 rounded-xl p-4 mb-4 text-right shadow-inner">
            <div className="text-gray-500 text-xs h-4">{equation}</div>
            <div className="text-3xl font-black text-gray-900 truncate">{display}</div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {buttons.map((btn) => (
              <button
                key={btn}
                onClick={() => handlePress(btn)}
                className={`h-14 rounded-xl font-bold text-lg shadow-sm transition-all active:scale-95 flex items-center justify-center
                  ${btn === '=' ? 'col-span-1 bg-blue-600 text-white hover:bg-blue-500' : 
                    btn === 'DEL' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                    ['C', '/', '*', '-', '+'].includes(btn) ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 
                    'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                  }
                `}
              >
                {btn === 'DEL' ? <Delete className="w-5 h-5" /> : btn}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
