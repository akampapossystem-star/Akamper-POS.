
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MoreVertical, Paperclip, Smile, Mic, Send, Phone, Video, 
  ArrowLeft, Thermometer, Check, CheckCheck, Snowflake, Flame, Droplets, Utensils, Lock
} from 'lucide-react';
import { StaffMember } from '../types';

interface TemperatureViewProps {
  currentUser: StaffMember | null;
}

interface TempGroup {
  id: string;
  name: string;
  type: 'FRIDGE' | 'FREEZER' | 'HOT_HOLD' | 'AMBIENT';
  lastReading: string;
  lastTime: Date;
  messages: TempMessage[];
  unread: number;
}

interface TempMessage {
  id: string;
  text: string;
  sender: 'SENSOR' | 'USER';
  senderName?: string; // If User
  time: Date;
  status: 'sent' | 'delivered' | 'read';
  isAlert?: boolean;
}

const MOCK_GROUPS: TempGroup[] = [
  {
    id: 'g1',
    name: 'Main Kitchen Fridge',
    type: 'FRIDGE',
    lastReading: '4.2°C',
    lastTime: new Date(),
    unread: 2,
    messages: [
      { id: 'm1', text: 'Daily Check: 3.5°C', sender: 'USER', senderName: 'John Doe', time: new Date(Date.now() - 3600000), status: 'read' },
      { id: 'm2', text: 'Sensor Auto-Log: 4.0°C', sender: 'SENSOR', time: new Date(Date.now() - 1800000), status: 'read' },
      { id: 'm3', text: 'Sensor Auto-Log: 4.2°C', sender: 'SENSOR', time: new Date(Date.now() - 60000), status: 'read' },
    ]
  },
  {
    id: 'g2',
    name: 'Walk-in Freezer',
    type: 'FREEZER',
    lastReading: '-18.5°C',
    lastTime: new Date(Date.now() - 7200000),
    unread: 0,
    messages: [
        { id: 'm4', text: 'Sensor Auto-Log: -19.0°C', sender: 'SENSOR', time: new Date(Date.now() - 8000000), status: 'read' },
        { id: 'm5', text: 'Defrost cycle complete', sender: 'SENSOR', time: new Date(Date.now() - 7200000), status: 'read' },
    ]
  },
  {
    id: 'g3',
    name: 'Hot Pass / Grill',
    type: 'HOT_HOLD',
    lastReading: '65°C',
    lastTime: new Date(Date.now() - 300000),
    unread: 5,
    messages: [
        { id: 'm6', text: 'Warning: Temp drop to 60°C', sender: 'SENSOR', time: new Date(Date.now() - 900000), status: 'read', isAlert: true },
        { id: 'm7', text: 'Boost heating active', sender: 'SENSOR', time: new Date(Date.now() - 300000), status: 'read' },
    ]
  },
  {
    id: 'g4',
    name: 'Bar Fridge 1',
    type: 'FRIDGE',
    lastReading: '6.0°C',
    lastTime: new Date(Date.now() - 86400000),
    unread: 0,
    messages: []
  }
];

const TemperatureView: React.FC<TemperatureViewProps> = ({ currentUser }) => {
  const [activeGroupId, setActiveGroupId] = useState<string>('g1');
  const [input, setInput] = useState('');
  const [groups, setGroups] = useState<TempGroup[]>(MOCK_GROUPS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groups, activeGroupId]);

  const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Simulate sending message
    const newMsg: TempMessage = {
      id: `msg-${Date.now()}`,
      text: input,
      sender: 'USER',
      senderName: currentUser?.name || 'Staff',
      time: new Date(),
      status: 'sent'
    };

    setGroups(prev => prev.map(g => {
        if (g.id === activeGroupId) {
            return {
                ...g,
                lastReading: input.includes('°') ? input : g.lastReading, // Simple logic to update last reading if it looks like temp
                lastTime: new Date(),
                messages: [...g.messages, newMsg]
            };
        }
        return g;
    }));

    setInput('');

    // Simulate Sensor Response
    setTimeout(() => {
        const responseMsg: TempMessage = {
            id: `resp-${Date.now()}`,
            text: 'Log recorded ✔️',
            sender: 'SENSOR',
            time: new Date(),
            status: 'read'
        };
        setGroups(prev => prev.map(g => {
            if (g.id === activeGroupId) {
                // Update previous message status to read
                const updatedMessages = g.messages.map(m => m.id === newMsg.id ? { ...m, status: 'read' as const } : m);
                return {
                    ...g,
                    messages: [...updatedMessages, responseMsg]
                };
            }
            return g;
        }));
    }, 1000);
  };

  const getIcon = (type: TempGroup['type']) => {
      switch(type) {
          case 'FREEZER': return <Snowflake className="w-5 h-5 text-blue-500" />;
          case 'HOT_HOLD': return <Flame className="w-5 h-5 text-red-500" />;
          case 'AMBIENT': return <Droplets className="w-5 h-5 text-purple-500" />;
          default: return <Thermometer className="w-5 h-5 text-teal-600" />;
      }
  };

  const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#d1d7db] overflow-hidden font-sans">
      
      {/* --- LEFT SIDEBAR (CHAT LIST) --- */}
      <div className="w-full md:w-[400px] bg-white border-r border-[#d1d7db] flex flex-col shrink-0">
         
         {/* Sidebar Header */}
         <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-[#d1d7db] shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center cursor-pointer overflow-hidden">
                {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="User" className="w-full h-full object-cover" />
                ) : (
                    <span className="font-bold text-gray-500">{currentUser?.name.charAt(0)}</span>
                )}
            </div>
            <div className="flex items-center gap-5 text-[#54656f]">
                <button title="Status"><div className="w-5 h-5 border-2 border-[#54656f] rounded-full"></div></button>
                <button title="New Chat"><MoreVertical className="w-5 h-5" /></button>
            </div>
         </div>

         {/* Search */}
         <div className="p-2 border-b border-[#f0f2f5] bg-white">
             <div className="bg-[#f0f2f5] rounded-lg px-4 py-2 flex items-center gap-4">
                 <Search className="w-4 h-4 text-[#54656f]" />
                 <input 
                    placeholder="Search or start new check" 
                    className="bg-transparent border-none outline-none text-sm w-full placeholder-[#54656f]"
                 />
             </div>
         </div>

         {/* Chat List */}
         <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
             {groups.map(group => (
                 <div 
                    key={group.id}
                    onClick={() => setActiveGroupId(group.id)}
                    className={`flex items-center px-3 py-3 cursor-pointer border-b border-[#f0f2f5] hover:bg-[#f5f6f6] transition-colors ${activeGroupId === group.id ? 'bg-[#f0f2f5]' : ''}`}
                 >
                     {/* Avatar */}
                     <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-[#dfe5e7] flex items-center justify-center overflow-hidden">
                            {getIcon(group.type)}
                        </div>
                     </div>
                     
                     {/* Content */}
                     <div className="flex-1 ml-3 min-w-0">
                         <div className="flex justify-between items-baseline">
                             <h4 className="text-[#111b21] font-normal text-base truncate">{group.name}</h4>
                             <span className={`text-xs ${group.unread > 0 ? 'text-[#00a884] font-bold' : 'text-[#667781]'}`}>
                                 {formatTime(group.lastTime)}
                             </span>
                         </div>
                         <div className="flex justify-between items-center mt-1">
                             <p className="text-sm text-[#667781] truncate pr-2">
                                {group.messages[group.messages.length - 1]?.text || 'No logs yet'}
                             </p>
                             {group.unread > 0 && (
                                 <span className="bg-[#25d366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                                     {group.unread}
                                 </span>
                             )}
                         </div>
                     </div>
                 </div>
             ))}
             
             <div className="p-8 text-center text-xs text-[#8696a0] flex flex-col items-center gap-2 border-t border-[#f0f2f5]">
                <Lock className="w-3 h-3" />
                Your temperature logs are end-to-end encrypted for audit safety.
             </div>
         </div>
      </div>

      {/* --- RIGHT CHAT AREA --- */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] relative ${activeGroupId ? 'block' : 'hidden md:block'}`}>
         
         {/* Background Pattern Overlay */}
         <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}></div>

         {/* Chat Header */}
         <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-[#d1d7db] shrink-0 z-10">
             <div className="flex items-center gap-3">
                 <div className="md:hidden" onClick={() => setActiveGroupId('')}><ArrowLeft className="w-5 h-5 text-[#54656f]" /></div>
                 <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center cursor-pointer">
                    {getIcon(activeGroup.type)}
                 </div>
                 <div className="cursor-pointer">
                     <h4 className="text-[#111b21] font-normal text-sm md:text-base">{activeGroup.name}</h4>
                     <p className="text-xs text-[#667781] truncate">
                        {activeGroup.messages.some(m => m.sender === 'SENSOR') ? 'Sensor Online, Staff Active' : 'Staff Active'}
                     </p>
                 </div>
             </div>
             <div className="flex items-center gap-4 text-[#54656f]">
                 <Search className="w-5 h-5 cursor-pointer" />
                 <MoreVertical className="w-5 h-5 cursor-pointer" />
             </div>
         </div>

         {/* Messages Container */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 custom-scrollbar z-10">
             {/* Encryption Notice */}
             <div className="flex justify-center mb-6">
                 <div className="bg-[#ffecd1] text-[#54656f] text-[10px] md:text-xs px-3 py-1.5 rounded-lg shadow-sm text-center max-w-md flex items-center gap-1">
                     <Lock className="w-3 h-3" /> Messages are generated by calibrated sensors and authenticated staff.
                 </div>
             </div>

             {/* Messages */}
             {activeGroup.messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} mb-1`}>
                     <div 
                        className={`relative max-w-[85%] md:max-w-[65%] px-2 py-1 rounded-lg shadow-sm text-sm ${
                            msg.sender === 'USER' 
                                ? 'bg-[#d9fdd3] rounded-tr-none' 
                                : 'bg-white rounded-tl-none'
                        }`}
                     >
                         {/* Sender Name (if group chat style needed, mostly for 'System' or distinct user) */}
                         {msg.sender === 'SENSOR' && (
                             <p className="text-[10px] font-bold text-[#e55039] mb-0.5">Sensor Node 1</p>
                         )}
                         {msg.sender === 'USER' && msg.senderName && (
                             <p className="text-[10px] font-bold text-[#128c7e] mb-0.5">{msg.senderName}</p>
                         )}

                         <div className="flex flex-col">
                             <span className="text-[#111b21] leading-relaxed pr-8 pb-1">
                                {msg.text}
                             </span>
                             <div className="self-end flex items-center gap-1 absolute bottom-1 right-2">
                                 <span className="text-[9px] text-[#667781] min-w-[30px] text-right">
                                     {formatTime(msg.time)}
                                 </span>
                                 {msg.sender === 'USER' && (
                                     <span>
                                         {msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-[#53bdeb]" /> : 
                                          msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-[#667781]" /> : 
                                          <Check className="w-3 h-3 text-[#667781]" />}
                                     </span>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
             ))}
             <div ref={messagesEndRef} />
         </div>

         {/* Footer Input */}
         <div className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-2 z-10">
             <button className="p-2 text-[#54656f] hover:bg-gray-200 rounded-full transition-colors">
                 <Smile className="w-6 h-6" />
             </button>
             <button className="p-2 text-[#54656f] hover:bg-gray-200 rounded-full transition-colors">
                 <Paperclip className="w-6 h-6" />
             </button>
             <form onSubmit={handleSend} className="flex-1 mx-2">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Log temperature reading..."
                    className="w-full py-3 px-4 rounded-lg border-none outline-none text-sm placeholder-[#54656f] bg-white focus:ring-0"
                 />
             </form>
             {input.trim() ? (
                 <button onClick={handleSend} className="p-3 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] transition-colors shadow-sm">
                     <Send className="w-5 h-5 fill-current" />
                 </button>
             ) : (
                 <button className="p-3 text-[#54656f] hover:bg-gray-200 rounded-full transition-colors">
                     <Mic className="w-6 h-6" />
                 </button>
             )}
         </div>

      </div>
    </div>
  );
};

export default TemperatureView;
