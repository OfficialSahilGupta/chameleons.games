import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface ChatReaction {
  emoji: string;
  userIds: string[];
}

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
  reactions?: ChatReaction[];
}

interface ChatPanelProps {
  socket: Socket | null;
  code: string;
  disabled?: boolean;
  players?: string[];
  currentUsername?: string;
}

const COMMON_EMOJIS = ['👍', '😂', '❤️', '🔥', '👀'];

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

    const handleReactionUpdated = ({ messageId, reactions }: { messageId: string, reactions: ChatReaction[] }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
    };

    socket.on('chat:message', handleNewMessage);
    socket.on('chat:reactionUpdated', handleReactionUpdated);

    return () => { 
      socket.off('chat:message', handleNewMessage); 
      socket.off('chat:reactionUpdated', handleReactionUpdated);
    };
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

  const handleReact = (msgId: string, emoji: string) => {
    if (!socket || disabled) return;
    socket.emit('chat:react', { code, messageId: msgId, emoji });
  };

  // Robust mention rendering
  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@') && part.length > 1) {
        const name = part.substring(1).toLowerCase();
        const isMe = currentUsername.toLowerCase() === name;
        const isPlayer = players.some(p => p.toLowerCase() === name);
        
        if (isMe) {
          return <span key={i} className="text-yellow-400 font-bold bg-yellow-900/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(250,204,21,0.2)]">{part}</span>;
        } else if (isPlayer) {
          return <span key={i} className="text-blue-400 font-bold bg-blue-900/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(96,165,250,0.2)]">{part}</span>;
        } else {
          return <span key={i} className="text-emerald-400 font-semibold bg-emerald-900/20 px-1 rounded">{part}</span>;
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  const chatMessages = messages.filter(m => m.type !== 'system');

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl overflow-hidden backdrop-blur-xl border border-white/5">
      <div className="bg-slate-950/80 p-4 border-b border-white/10 shrink-0 flex items-center justify-between">
        <h3 className="font-bold text-gray-300 text-sm tracking-widest uppercase flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          Room Comms
        </h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar"
      >
        {chatMessages.length === 0 ? (
          <div className="text-gray-500 text-xs font-bold tracking-widest uppercase text-center mt-10 opacity-50">No comms established.</div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.username === currentUsername;
            return (
              <div key={msg._id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[11px] font-bold tracking-widest uppercase ${isMe ? 'text-green-400' : 'text-blue-400'}`}>
                    {msg.username}
                  </span>
                  
                  {/* Action Menu (Reply) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button 
                      onClick={() => handleReplyClick(msg)}
                      className="text-[10px] text-gray-500 hover:text-white uppercase tracking-widest bg-slate-800/50 px-2 py-0.5 rounded"
                    >
                      Reply
                    </button>
                  </div>
                </div>

                <div className={`relative max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {/* Reply Block */}
                  {msg.replyTo && (
                    <div className="bg-slate-800/90 border-l-4 border-emerald-500 p-2.5 rounded-t-xl text-[11px] text-gray-400 mb-[-8px] pb-4 truncate max-w-full z-0">
                      <span className="font-bold text-gray-200">@{msg.replyTo.username}</span>: {msg.replyTo.text}
                    </div>
                  )}
                  
                  {/* Message Bubble Container */}
                  <div className="relative group/bubble flex items-center gap-2 z-10">
                    
                    {/* Reaction Bar (Left if me, Right if them) */}
                    {isMe && (
                      <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 bg-slate-800/80 rounded-full px-2 py-1 absolute -left-[140px]">
                        {COMMON_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => handleReact(msg._id, emoji)} className="hover:scale-125 transition-transform text-sm">{emoji}</button>
                        ))}
                      </div>
                    )}

                    <div className={`px-5 py-3 text-[15px] rounded-2xl shadow-xl border backdrop-blur-md ${
                      isMe 
                        ? 'bg-green-900/30 text-green-50 border-green-500/30 rounded-tr-sm shadow-[0_4px_20px_rgba(34,197,94,0.15)]' 
                        : 'bg-slate-800/80 text-gray-100 border-white/10 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                    }`}>
                      <span className="break-words leading-relaxed">
                        {renderTextWithMentions(msg.text)}
                      </span>
                    </div>

                    {/* Reaction Bar */}
                    {!isMe && (
                      <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 bg-slate-800/80 rounded-full px-2 py-1 absolute -right-[140px]">
                        {COMMON_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => handleReact(msg._id, emoji)} className="hover:scale-125 transition-transform text-sm">{emoji}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Render Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-2 z-20 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {msg.reactions.map(r => {
                        // Check if current user reacted
                        // We need the current user's ID, but we only have currentUsername. 
                        // It's just visual, so we can just render the reaction bubble.
                        return (
                          <button 
                            key={r.emoji} 
                            onClick={() => handleReact(msg._id, r.emoji)}
                            className="bg-slate-800/80 hover:bg-slate-700 border border-white/5 rounded-full px-2 py-0.5 text-[11px] flex items-center gap-1.5 transition-colors"
                          >
                            <span>{r.emoji}</span>
                            <span className="text-gray-400 font-bold">{r.userIds.length}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-slate-950/80 border-t border-white/10 shrink-0 flex flex-col p-3">
        {replyTo && (
          <div className="bg-slate-800/90 rounded-lg px-4 py-2 flex justify-between items-center text-xs border border-white/5 mb-2">
            <span className="text-gray-300 truncate">
              <span className="text-emerald-400 font-bold mr-2">Replying to @{replyTo.username}</span> 
              {replyTo.text}
            </span>
            <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-white ml-3 p-1">&times;</button>
          </div>
        )}
        <form onSubmit={handleSend} className="relative">
          <input 
            ref={inputRef}
            type="text" 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={disabled ? "Comms offline..." : "Type message or @player..."}
            disabled={disabled}
            maxLength={200}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-4 pr-12 py-3.5 text-[15px] focus:outline-none focus:border-green-500/50 focus:bg-slate-800/80 transition-all disabled:opacity-50 text-white placeholder-gray-500 shadow-inner"
          />
          <button 
            type="submit" 
            disabled={disabled || !inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-green-500 hover:text-green-400 disabled:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
