import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface ChatMessage {
  _id: string;
  userId?: string;
  username: string;
  text: string;
  type: 'chat' | 'system';
  createdAt: string;
  replyTo?: {
    messageId: string;
    username: string;
    text: string;
  };
}

interface ChatPanelProps {
  socket: Socket | null;
  code: string;
  disabled?: boolean;
  players?: string[];
  currentUsername?: string;
}

export default function ChatPanel({ socket, code, disabled = false, players = [], currentUsername = '' }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.emit('chat:history', { code }, (res: any) => {
      if (res.success && res.history) {
        setMessages(res.history);
      }
    });

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('chat:message', handleNewMessage);
    return () => { socket.off('chat:message', handleNewMessage); };
  }, [socket, code]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || disabled) return;
    
    const payload: any = { code, text: inputText.trim() };
    if (replyTo) {
      payload.replyTo = {
        messageId: replyTo._id,
        username: replyTo.username,
        text: replyTo.text
      };
    }
    
    socket.emit('chat:send', payload);
    setInputText('');
    setReplyTo(null);
  };

  const handleReplyClick = (msg: ChatMessage) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  };

  // Function to render text with highlighted @mentions
  const renderTextWithMentions = (text: string) => {
    const words = text.split(/(\s+)/); // split by whitespace but keep the spaces
    return words.map((word, i) => {
      if (word.startsWith('@') && word.length > 1) {
        // Strip punctuation at the end for matching
        const cleanName = word.substring(1).replace(/[.,!?]+$/, '').toLowerCase();
        const punctuation = word.substring(1).match(/[.,!?]+$/)?.[0] || '';
        const originalName = word.substring(1, word.length - punctuation.length);
        
        const isMe = currentUsername.toLowerCase() === cleanName;
        const isPlayer = players.some(p => p.toLowerCase() === cleanName);
        
        if (isMe) {
          return <span key={i}><span className="text-yellow-400 font-bold bg-yellow-900/30 px-1 rounded">@{originalName}</span>{punctuation}</span>;
        } else if (isPlayer) {
          return <span key={i}><span className="text-blue-400 font-bold bg-blue-900/30 px-1 rounded">@{originalName}</span>{punctuation}</span>;
        }
      }
      return <span key={i}>{word}</span>;
    });
  };

  // Filter out system messages since they are now handled by toast notifications in Room.tsx
  const chatMessages = messages.filter(m => m.type !== 'system');

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl overflow-hidden backdrop-blur-md">
      <div className="bg-slate-950/60 p-4 border-b border-white/5 shrink-0">
        <h3 className="font-bold text-gray-300 text-xs tracking-widest uppercase">Room Comms</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar"
      >
        {chatMessages.length === 0 ? (
          <div className="text-gray-500 text-xs font-bold tracking-widest uppercase text-center mt-10 opacity-50">No comms established.</div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.username === currentUsername;
            return (
              <div key={msg._id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${isMe ? 'text-green-400' : 'text-blue-400'}`}>
                    {msg.username}
                  </span>
                  <button 
                    onClick={() => handleReplyClick(msg)}
                    className="opacity-0 group-hover:opacity-100 text-[9px] text-gray-500 hover:text-white uppercase tracking-widest transition-opacity"
                  >
                    Reply
                  </button>
                </div>

                <div className={`relative max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {msg.replyTo && (
                    <div className="bg-slate-800/80 border-l-2 border-slate-500 p-2 rounded-t-lg text-[10px] text-gray-400 mb-[-5px] pb-3 truncate max-w-full">
                      <span className="font-bold text-gray-300">@{msg.replyTo.username}:</span> {msg.replyTo.text}
                    </div>
                  )}
                  
                  <div className={`relative z-10 px-4 py-2.5 text-sm rounded-2xl shadow-lg border ${
                    isMe 
                      ? 'bg-green-900/20 text-green-50 border-green-500/20 rounded-tr-none' 
                      : 'bg-slate-800/60 text-gray-100 border-white/5 rounded-tl-none'
                  }`}>
                    <span className="break-words leading-relaxed">
                      {renderTextWithMentions(msg.text)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-slate-950/60 border-t border-white/5 shrink-0 flex flex-col">
        {replyTo && (
          <div className="bg-slate-800/90 px-4 py-2 flex justify-between items-center text-xs border-b border-white/5">
            <span className="text-gray-400 truncate"><span className="text-blue-400 font-bold">Replying to {replyTo.username}:</span> {replyTo.text}</span>
            <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white ml-2">&times;</button>
          </div>
        )}
        <form onSubmit={handleSend} className="p-3">
          <input 
            ref={inputRef}
            type="text" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={disabled ? "Comms offline..." : "Type message or @player..."}
            disabled={disabled}
            maxLength={200}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500/50 focus:bg-slate-800 transition-all disabled:opacity-50 text-white placeholder-gray-500"
          />
        </form>
      </div>
    </div>
  );
}
