
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, User, Hash, Search, MoreVertical, Phone, Video, 
  Smile, Paperclip, Check, CheckCheck, Mic, ArrowLeft, Lock, Image as ImageIcon, Users
} from 'lucide-react';
import { StaffMember, ChatMessage, SystemConfig } from '../types';
import { broadcast } from '../services/syncService';

interface ChatViewProps {
  currentUser: StaffMember | null;
  staff: StaffMember[];
  systemConfig: SystemConfig;
  messages: ChatMessage[];
  typingUsers: string[]; 
}

const ChatView: React.FC<ChatViewProps> = ({ currentUser, staff, systemConfig, messages, typingUsers }) => {
  const [activeChannel, setActiveChannel] = useState<string>('GENERAL'); 
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel, typingUsers]);

  // Handle Marking Messages as Read
  useEffect(() => {
    if (!currentUser || !activeChannel) return;
    
    const unreadIds = messages
      .filter(m => m.channelId === activeChannel && m.senderId !== currentUser.id && m.status !== 'read')
      .map(m => m.id);

    if (unreadIds.length > 0) {
      broadcast('MESSAGE_READ', { ids: unreadIds, readerId: currentUser.id, channelId: activeChannel });
    }
  }, [activeChannel, messages, currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    const newMessage: ChatMessage = {
      id: `MSG-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      status: 'sent',
      channelId: activeChannel
    };

    broadcast('CHAT_MESSAGE', newMessage);
    broadcast('TYPING_EVENT', { userId: currentUser.id, userName: currentUser.name, isTyping: false });
    setInputText('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!currentUser) return;

    broadcast('TYPING_EVENT', { userId: currentUser.id, userName: currentUser.name, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcast('TYPING_EVENT', { userId: currentUser.id, userName: currentUser.name, isTyping: false });
    }, 2000);
  };

  const getDmChannelId = (otherUserId: string) => {
    if (!currentUser) return 'GENERAL';
    const ids = [currentUser.id, otherUserId].sort();
    return `DM-${ids[0]}-${ids[1]}`;
  };

  const chatList = useMemo(() => {
      if (!currentUser) return [];

      const generalMsgs = messages.filter(m => m.channelId === 'GENERAL');
      const lastGeneralMsg = generalMsgs[generalMsgs.length - 1];
      const generalUnread = generalMsgs.filter(m => m.senderId !== currentUser.id && m.status !== 'read').length;

      const items: any[] = [
          {
              type: 'GROUP',
              id: 'GENERAL',
              name: 'General Team Chat',
              avatar: null,
              lastMsg: lastGeneralMsg,
              unread: generalUnread,
              lastTimestamp: lastGeneralMsg ? new Date(lastGeneralMsg.timestamp).getTime() : 0
          }
      ];

      staff.filter(s => s.id !== currentUser.id).forEach(member => {
          const dmId = getDmChannelId(member.id);
          const dmMsgs = messages.filter(m => m.channelId === dmId);
          const lastDmMsg = dmMsgs[dmMsgs.length - 1];
          const dmUnread = dmMsgs.filter(m => m.senderId !== currentUser.id && m.status !== 'read').length;

          if (searchTerm && !member.name.toLowerCase().includes(searchTerm.toLowerCase())) {
              return;
          }

          items.push({
              type: 'DM',
              id: dmId,
              name: member.name,
              avatar: member.photoUrl,
              lastMsg: lastDmMsg,
              unread: dmUnread,
              lastTimestamp: lastDmMsg ? new Date(lastDmMsg.timestamp).getTime() : 0,
              status: member.status
          });
      });

      return items.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  }, [messages, staff, currentUser, searchTerm]);

  const channelMessages = messages.filter(m => m.channelId === activeChannel);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDateLabel = (isoString: string) => {
      const date = new Date(isoString);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (date.toDateString() === today.toDateString()) return 'TODAY';
      if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
      return date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  };

  const activeChatInfo = useMemo(() => {
      if (activeChannel === 'GENERAL') {
          return { name: 'General Team Chat', role: 'Staff Group', avatar: null, type: 'GROUP' };
      }
      const member = staff.find(s => getDmChannelId(s.id) === activeChannel);
      return member 
        ? { name: member.name, role: member.role, avatar: member.photoUrl, type: 'DM' }
        : { name: 'Chat', role: '', avatar: null, type: 'DM' };
  }, [activeChannel, staff, currentUser]);

  return (
    <div className="h-full flex bg-[#e4e7eb] overflow-hidden font-sans relative">
      
      {/* --- SIDEBAR: STAFF & GROUPS --- */}
      <div className={`w-full md:w-[400px] bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300 absolute md:relative z-20 h-full ${activeChannel && window.innerWidth < 768 ? '-translate-x-full' : 'translate-x-0'}`}>
        
        {/* Profile Header */}
        <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-gray-300">
                {currentUser?.photoUrl ? <img src={currentUser.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{currentUser?.name.charAt(0)}</div>}
              </div>
              <span className="font-black text-[#41525d] text-sm uppercase tracking-tight">Staff Portal</span>
           </div>
           <div className="flex items-center gap-4 text-[#54656f]">
               <button title="Group"><Users className="w-5 h-5" /></button>
               <button title="Settings"><MoreVertical className="w-5 h-5" /></button>
           </div>
        </div>

        {/* Search / Filter */}
        <div className="p-3 bg-white border-b border-gray-100">
            <div className="bg-[#f0f2f5] rounded-xl px-4 py-2 flex items-center gap-4">
                <Search className="w-4 h-4 text-[#54656f]" />
                <input 
                   placeholder="Search staff or messages" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="bg-transparent border-none outline-none text-sm w-full font-medium"
                />
            </div>
        </div>

        {/* Chat Threads List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
           {chatList.map(item => (
            <div 
                key={item.id}
                onClick={() => setActiveChannel(item.id)}
                className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-50 hover:bg-[#f5f6f6] transition-all ${activeChannel === item.id ? 'bg-[#f0f2f5]' : ''}`}
            >
                <div className="relative shrink-0">
                    {item.type === 'GROUP' ? (
                        <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-sm border border-emerald-600">
                            <Hash className="w-6 h-6" />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-gray-200">
                            {item.avatar ? <img src={item.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-lg">{item.name.charAt(0)}</div>}
                        </div>
                    )}
                    {item.type === 'DM' && item.status === 'active' && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-white rounded-full"></span>
                    )}
                </div>

                <div className="flex-1 ml-3 min-w-0">
                    <div className="flex justify-between items-baseline">
                        <h4 className="text-[#111b21] font-bold text-sm truncate uppercase tracking-tight">{item.name}</h4>
                        {item.lastMsg && <span className={`text-[10px] ${item.unread > 0 ? 'text-[#25d366] font-black' : 'text-gray-400'}`}>{formatTime(item.lastMsg.timestamp)}</span>}
                    </div>
                    <div className="flex justify-between items-center mt-0.5">
                        <p className="text-xs text-[#667781] truncate pr-2 flex-1 font-medium">
                            {item.lastMsg ? item.lastMsg.content : <span className="italic opacity-50">No messages yet</span>}
                        </p>
                        {item.unread > 0 && <span className="bg-[#25d366] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">{item.unread}</span>}
                    </div>
                </div>
            </div>
           ))}
        </div>
      </div>

      {/* --- MAIN CHAT PANEL --- */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] relative h-full ${!activeChannel && window.innerWidth < 768 ? 'translate-x-full' : 'translate-x-0'}`}>
         
         {/* WhatsApp Pattern Background */}
         <div className="absolute inset-0 opacity-10 pointer-events-none grayscale" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}></div>

         {/* Active Chat Header */}
         <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0 z-10">
            <div className="flex items-center gap-3">
                <button className="md:hidden p-2" onClick={() => setActiveChannel('')}><ArrowLeft className="w-5 h-5 text-[#54656f]" /></button>
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-gray-300">
                    {activeChatInfo.avatar ? <img src={activeChatInfo.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 uppercase">{activeChatInfo.name.charAt(0)}</div>}
                </div>
                <div>
                    <h3 className="text-[#111b21] font-black text-sm leading-tight uppercase tracking-tight">{activeChatInfo.name}</h3>
                    <p className="text-[10px] text-[#00a884] font-black uppercase tracking-widest mt-0.5">
                        {typingUsers.length > 0 && activeChannel === 'GENERAL' ? 'Member typing...' : activeChatInfo.role}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4 text-[#54656f]">
                <Search className="w-5 h-5" />
                <MoreVertical className="w-5 h-5" />
            </div>
         </div>

         {/* Message Bubbles Container */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2 custom-scrollbar z-10">
            {channelMessages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.id;
                const prevMsg = channelMessages[idx - 1];
                const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;
                const showDateHeader = idx === 0 || formatDateLabel(msg.timestamp) !== formatDateLabel(prevMsg.timestamp);
                
                return (
                    <React.Fragment key={msg.id}>
                        {showDateHeader && (
                            <div className="flex justify-center my-4">
                                <span className="bg-[#e1f3fb] text-[#54656f] text-[10px] font-black px-3 py-1 rounded-lg shadow-sm uppercase tracking-widest border border-white">
                                    {formatDateLabel(msg.timestamp)}
                                </span>
                            </div>
                        )}

                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameSender ? 'mt-0.5' : 'mt-3'}`}>
                            <div className={`relative max-w-[85%] md:max-w-[70%] px-2 py-1.5 rounded-lg shadow-sm ${isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                {!isMe && activeChannel === 'GENERAL' && !isSameSender && (
                                    <p className="text-[10px] font-black mb-1 text-emerald-600 uppercase tracking-tight">{msg.senderName}</p>
                                )}
                                <div className="flex flex-col min-w-[60px]">
                                    <span className="text-[#111b21] text-sm leading-relaxed pr-10 whitespace-pre-wrap font-medium">{msg.content}</span>
                                    <div className="self-end flex items-center gap-1 absolute bottom-1 right-2">
                                        <span className="text-[9px] text-[#667781] font-bold">{formatTime(msg.timestamp)}</span>
                                        {isMe && (
                                            msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-[#53bdeb]" /> :
                                            msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-[#667781]" /> :
                                            <Check className="w-3 h-3 text-[#667781]" />
                                        )}
                                    </div>
                                </div>
                                {!isSameSender && (
                                    <span className={`absolute top-0 w-2 h-2 ${isMe ? '-right-2 text-[#d9fdd3]' : '-left-2 text-white'}`}>
                                        <svg viewBox="0 0 8 13" height="13" width="8" className={`fill-current ${!isMe ? 'transform scale-x-[-1]' : ''}`}>
                                            <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
                                        </svg>
                                    </span>
                                )}
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
            <div ref={messagesEndRef} />
         </div>

         {/* Chat Input Footer */}
         <div className="bg-[#f0f2f5] px-4 py-2 flex items-center gap-2 z-10 shrink-0">
             <button className="p-2 text-[#54656f] hover:bg-gray-200 rounded-full transition-colors"><Smile className="w-6 h-6" /></button>
             <button className="p-2 text-[#54656f] hover:bg-gray-200 rounded-full transition-colors"><Paperclip className="w-6 h-6" /></button>
             <form onSubmit={handleSendMessage} className="flex-1 mx-2">
                 <input 
                    type="text" 
                    value={inputText}
                    onChange={handleTyping}
                    placeholder="Type a message"
                    className="w-full py-3 px-5 rounded-xl border-none outline-none text-sm bg-white focus:ring-1 focus:ring-emerald-500 font-medium"
                 />
             </form>
             {inputText.trim() ? (
                 <button onClick={handleSendMessage} className="p-3 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] shadow-md transition-all active:scale-90">
                     <Send className="w-5 h-5 fill-current" />
                 </button>
             ) : (
                 <button className="p-3 text-[#54656f] hover:bg-gray-200 rounded-full transition-colors"><Mic className="w-6 h-6" /></button>
             )}
         </div>

      </div>
    </div>
  );
};

export default ChatView;
