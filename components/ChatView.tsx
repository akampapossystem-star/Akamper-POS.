
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, User, Hash, Search, MoreVertical, Phone, Video, 
  Smile, Paperclip, Check, CheckCheck, Mic, ArrowLeft, Lock, Image as ImageIcon
} from 'lucide-react';
import { StaffMember, ChatMessage, SystemConfig } from '../types';
import { broadcast } from '../services/syncService';

interface ChatViewProps {
  currentUser: StaffMember | null;
  staff: StaffMember[];
  systemConfig: SystemConfig;
  messages: ChatMessage[];
  typingUsers: string[]; // List of names currently typing
}

const ChatView: React.FC<ChatViewProps> = ({ currentUser, staff, systemConfig, messages, typingUsers }) => {
  const [activeChannel, setActiveChannel] = useState<string>(''); // Empty string = list view on mobile
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set default channel to General on desktop mount
  useEffect(() => {
    if (window.innerWidth >= 768 && !activeChannel) {
        setActiveChannel('GENERAL');
    }
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel, typingUsers]);

  // Handle Marking Messages as Read
  useEffect(() => {
    if (!currentUser || !activeChannel) return;
    
    // Find unread messages in the active channel sent by others
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

  // Helper: DM Channel ID Generator
  const getDmChannelId = (otherUserId: string) => {
    if (!currentUser) return 'GENERAL';
    const ids = [currentUser.id, otherUserId].sort();
    return `DM-${ids[0]}-${ids[1]}`;
  };

  // ----------------------------------------------------------------------
  // DYNAMIC CHAT LIST LOGIC (Sorted by Date + Unread Counts)
  // ----------------------------------------------------------------------
  
  const chatList = useMemo(() => {
      if (!currentUser) return [];

      // 1. Define "General" Group
      const generalMsgs = messages.filter(m => m.channelId === 'GENERAL');
      const lastGeneralMsg = generalMsgs[generalMsgs.length - 1];
      const generalUnread = generalMsgs.filter(m => m.senderId !== currentUser.id && m.status !== 'read').length;

      const items: {
          type: string;
          id: string;
          name: string;
          avatar: string | null | undefined;
          lastMsg: ChatMessage | undefined;
          unread: number;
          lastTimestamp: number;
          status?: 'active' | 'inactive';
      }[] = [
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

      // 2. Define DM Items for each staff member (excluding self)
      staff.filter(s => s.id !== currentUser.id).forEach(member => {
          const dmId = getDmChannelId(member.id);
          const dmMsgs = messages.filter(m => m.channelId === dmId);
          const lastDmMsg = dmMsgs[dmMsgs.length - 1];
          const dmUnread = dmMsgs.filter(m => m.senderId !== currentUser.id && m.status !== 'read').length;

          if (searchTerm && !member.name.toLowerCase().includes(searchTerm.toLowerCase())) {
              return; // Skip if filtering
          }

          items.push({
              type: 'DM',
              id: dmId,
              name: member.name,
              avatar: member.photoUrl,
              lastMsg: lastDmMsg,
              unread: dmUnread,
              lastTimestamp: lastDmMsg ? new Date(lastDmMsg.timestamp).getTime() : 0,
              status: member.status // active/inactive
          });
      });

      // 3. Sort by Most Recent Message
      return items.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

  }, [messages, staff, currentUser, searchTerm]);


  const channelMessages = messages.filter(m => m.channelId === activeChannel);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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

  // Active Chat Info Resolution
  const activeChatInfo = useMemo(() => {
      if (activeChannel === 'GENERAL') {
          return { name: 'General Team Chat', role: 'All Staff', avatar: null, type: 'GROUP' };
      }
      const member = staff.find(s => getDmChannelId(s.id) === activeChannel);
      return member 
        ? { name: member.name, role: member.role, avatar: member.photoUrl, type: 'DM' }
        : { name: 'Unknown User', role: '', avatar: null, type: 'DM' };
  }, [activeChannel, staff, currentUser]);


  return (
    <div className="h-[calc(100vh-64px)] flex bg-[#d1d7db] overflow-hidden font-sans relative">
      
      {/* --- LEFT SIDEBAR (CONTACTS) --- */}
      <div className={`w-full md:w-[400px] bg-white border-r border-[#d1d7db] flex flex-col shrink-0 transition-transform absolute md:relative z-20 h-full ${activeChannel ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}>
        
        {/* Header */}
        <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-[#d1d7db] shrink-0">
           <div className="flex items-center gap-3">
              {currentUser?.photoUrl ? (
                  <img src={currentUser.photoUrl} alt="Me" className="w-10 h-10 rounded-full object-cover cursor-pointer border border-gray-300" />
              ) : (
                  <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center cursor-pointer text-gray-500 font-bold">
                      {currentUser?.name.charAt(0)}
                  </div>
              )}
              <span className="font-bold text-[#41525d] text-sm hidden sm:block">Chats</span>
           </div>
           <div className="flex items-center gap-5 text-[#54656f]">
               <button title="New Chat"><MoreVertical className="w-5 h-5" /></button>
           </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-[#f0f2f5] bg-white">
            <div className="bg-[#f0f2f5] rounded-lg px-4 py-2 flex items-center gap-4">
                <Search className="w-4 h-4 text-[#54656f]" />
                <input 
                   placeholder="Search or start new chat" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="bg-transparent border-none outline-none text-sm w-full placeholder-[#54656f]"
                />
            </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
           
           {chatList.map(item => {
               const isActive = activeChannel === item.id;
               
               return (
                <div 
                    key={item.id}
                    onClick={() => setActiveChannel(item.id)}
                    className={`flex items-center px-3 py-3 cursor-pointer border-b border-[#f0f2f5] hover:bg-[#f5f6f6] transition-colors ${isActive ? 'bg-[#f0f2f5]' : ''}`}
                >
                    <div className="relative shrink-0">
                        {item.type === 'GROUP' ? (
                            <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                                <Hash className="w-6 h-6" />
                            </div>
                        ) : item.avatar ? (
                            <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-[#dfe5e7] flex items-center justify-center text-gray-500 font-bold text-lg">
                                {item.name.charAt(0)}
                            </div>
                        )}
                        
                        {/* Online Indicator (for DMs) */}
                        {item.type === 'DM' && item.status === 'active' && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25d366] border-2 border-white rounded-full"></span>
                        )}
                    </div>

                    <div className="flex-1 ml-3 min-w-0 pb-1">
                        <div className="flex justify-between items-baseline">
                            <h4 className="text-[#111b21] font-normal text-base truncate">{item.name}</h4>
                            {item.lastMsg && (
                                <span className={`text-xs ${item.unread > 0 ? 'text-[#25d366] font-bold' : 'text-[#667781]'}`}>
                                    {formatTime(item.lastMsg.timestamp)}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                            <p className="text-sm text-[#667781] truncate pr-2 flex-1">
                                {item.lastMsg ? (
                                    <>
                                        {item.lastMsg.senderId === currentUser?.id && (
                                            <span className="inline-block mr-1">
                                                {item.lastMsg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] inline" /> : 
                                                 item.lastMsg.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5 text-[#667781] inline" /> :
                                                 <Check className="w-3.5 h-3.5 text-[#667781] inline" />}
                                            </span>
                                        )}
                                        {item.lastMsg.content}
                                    </>
                                ) : (
                                    <span className="italic opacity-60 text-xs">Start a conversation</span>
                                )}
                            </p>
                            
                            {/* Unread Badge */}
                            {item.unread > 0 && (
                                <span className="bg-[#25d366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center ml-2 shadow-sm animate-in zoom-in">
                                    {item.unread}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
               );
           })}
           
           <div className="p-8 text-center text-xs text-[#8696a0] flex flex-col items-center gap-2 mt-4">
              <Lock className="w-3 h-3" />
              Your personal messages are end-to-end encrypted.
           </div>
        </div>
      </div>

      {/* --- RIGHT CHAT AREA --- */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] relative w-full h-full absolute md:relative z-10 transition-transform ${activeChannel ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
         
         {/* Background Pattern */}
         <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}></div>

         {/* Chat Header */}
         <div className="h-16 bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-[#d1d7db] shrink-0 z-10">
            <div className="flex items-center gap-3 cursor-pointer">
                <div className="md:hidden" onClick={() => setActiveChannel('')}>
                    <ArrowLeft className="w-5 h-5 text-[#54656f]" />
                </div>
                
                {/* Header Avatar */}
                {activeChatInfo.type === 'GROUP' ? (
                    <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                        <Hash className="w-5 h-5" />
                    </div>
                ) : activeChatInfo.avatar ? (
                    <img src={activeChatInfo.avatar} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center text-gray-500 font-bold">
                        {activeChatInfo.name.charAt(0)}
                    </div>
                )}

                <div className="flex flex-col justify-center">
                    <h3 className="text-[#111b21] font-normal text-base leading-tight">{activeChatInfo.name}</h3>
                    {/* Typing Indicator in Header or Subtext */}
                    <p className="text-xs text-[#667781] truncate">
                        {typingUsers.length > 0 && activeChannel === 'GENERAL' 
                            ? <span className="text-[#00a884] font-bold">typing...</span> 
                            : activeChatInfo.role || 'click for info'
                        }
                    </p>
                </div>
            </div>
            
            <div className="flex items-center gap-5 text-[#54656f]">
                <button><Search className="w-5 h-5" /></button>
                <button><MoreVertical className="w-5 h-5" /></button>
            </div>
         </div>

         {/* Messages Area */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-1 custom-scrollbar z-10">
            
            <div className="flex justify-center mb-6">
                 <div className="bg-[#ffecd1] text-[#54656f] text-[10px] md:text-xs px-3 py-1.5 rounded-lg shadow-sm text-center max-w-md flex items-center gap-1">
                     <Lock className="w-3 h-3" /> Messages are immutable and cannot be deleted for audit purposes.
                 </div>
            </div>

            {channelMessages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.id;
                
                // Grouping Logic
                const prevMsg = channelMessages[idx - 1];
                const isSameSender = prevMsg && prevMsg.senderId === msg.senderId;
                const dateLabel = formatDateLabel(msg.timestamp);
                const prevDateLabel = prevMsg ? formatDateLabel(prevMsg.timestamp) : '';
                const showDateHeader = dateLabel !== prevDateLabel;
                
                const showSenderName = !isMe && activeChannel === 'GENERAL' && (!isSameSender || showDateHeader);
                
                return (
                    <React.Fragment key={msg.id}>
                        {/* Date Header */}
                        {showDateHeader && (
                            <div className="flex justify-center my-4 sticky top-0 z-20">
                                <span className="bg-[#e1f3fb] text-[#54656f] text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm uppercase tracking-widest border border-white">
                                    {dateLabel}
                                </span>
                            </div>
                        )}

                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameSender && !showDateHeader ? 'mt-0.5' : 'mt-2'}`}>
                            <div 
                                className={`relative max-w-[85%] md:max-w-[65%] px-2 py-1 rounded-lg shadow-sm text-sm ${
                                    isMe 
                                        ? 'bg-[#d9fdd3] rounded-tr-none' 
                                        : 'bg-white rounded-tl-none'
                                }`}
                            >
                                {/* Sender Name in Group */}
                                {showSenderName && (
                                    <p className={`text-[10px] font-bold mb-0.5 text-[#e55039] cursor-pointer hover:underline`}>
                                        {msg.senderName}
                                    </p>
                                )}

                                <div className="flex flex-col min-w-[80px]">
                                    <span className="text-[#111b21] leading-relaxed pr-8 pb-1 whitespace-pre-wrap">
                                    {msg.content}
                                    </span>
                                    <div className="self-end flex items-center gap-1 absolute bottom-1 right-2">
                                        <span className="text-[9px] text-[#667781] min-w-[45px] text-right">
                                            {formatTime(msg.timestamp)}
                                        </span>
                                        {isMe && (
                                            <span>
                                                {msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" /> : 
                                                msg.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5 text-[#667781]" /> : 
                                                <Check className="w-3.5 h-3.5 text-[#667781]" />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Tail SVG - Only if top of group or separate message */}
                                {(!isSameSender || showDateHeader) && (
                                    <span className="absolute top-0 w-2 h-2">
                                        {isMe ? (
                                            <svg viewBox="0 0 8 13" height="13" width="8" className="absolute top-0 -right-2 text-[#d9fdd3] fill-current">
                                                <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 8 13" height="13" width="8" className="absolute top-0 -left-2 text-white fill-current transform scale-x-[-1]">
                                                <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
                                            </svg>
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </React.Fragment>
                );
            })}
            <div ref={messagesEndRef} />
         </div>

         {/* Input Footer */}
         <div className="bg-[#f0f2f5] px-4 py-2 flex items-center gap-2 z-10 shrink-0 min-h-[60px]">
             <button className="p-2 text-[#54656f] hover:bg-gray-200 rounded-full transition-colors">
                 <Smile className="w-6 h-6" />
             </button>
             <button className="p-2 text-[#54656f] hover:bg-gray-200 rounded-full transition-colors">
                 <Paperclip className="w-6 h-6" />
             </button>
             <form onSubmit={handleSendMessage} className="flex-1 mx-2">
                 <input 
                    type="text" 
                    value={inputText}
                    onChange={handleTyping}
                    placeholder="Type a message"
                    className="w-full py-3 px-4 rounded-lg border-none outline-none text-sm placeholder-[#54656f] bg-white focus:ring-0"
                 />
             </form>
             {inputText.trim() ? (
                 <button onClick={handleSendMessage} className="p-3 bg-[#00a884] text-white rounded-full hover:bg-[#008f6f] transition-colors shadow-sm">
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

export default ChatView;
