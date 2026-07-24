import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface ChatMessage {
  _id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  type?: 'user' | 'system';
  replyTo?: {
    messageId: string;
    username: string;
    text: string;
  };
  reactions?: {
    emoji: string;
    userIds: string[];
  }[];
}

interface ChatPanelProps {
  socket: Socket | null;
  code: string;
  disabled?: boolean;
  players?: string[]; // Array of player usernames
  currentUsername?: string;
}

const COMMON_EMOJIS = ['👍', '😂', '🔥', '👀', '💯'];

export default function ChatPanel({ socket, code, disabled = false, players = [], currentUsername = '' }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  
  // Mention search state
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat:history', (history: ChatMessage[]) => {
      setMessages(history);
      scrollToBottom();
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    });

    socket.on('chat:reactionUpdated', (updatedMsg: ChatMessage) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    return () => {
      socket.off('chat:history');
      socket.off('chat:message');
      socket.off('chat:reactionUpdated');
    };
  }, [socket]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
      }, 50);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    
    // Check for @mention trigger at current cursor position
    const cursor = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    
    if (match) {
      setMentionSearch(match[1].toLowerCase());
    } else {
      setMentionSearch(null);
    }
  };

  const handleMentionSelect = (username: string) => {
    if (!inputRef.current) return;
    const cursor = inputRef.current.selectionStart || inputText.length;
    const textBeforeCursor = inputText.slice(0, cursor);
    const textAfterCursor = inputText.slice(cursor);
    
    const newTextBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `);
    
    setInputText(newTextBefore + textAfterCursor);
    setMentionSearch(null);
    inputRef.current.focus();
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || disabled) return;

    const payload: any = { code, text: inputText.trim() };
    if (replyTo) {
      payload.replyToId = replyTo._id;
    }

    socket.emit('chat:send', payload);
    setInputText('');
    setReplyTo(null);
    setMentionSearch(null);
  };

  const handleReplyClick = (msg: ChatMessage) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  };

  const handleReact = (msgId: string, emoji: string) => {
    if (!socket || disabled) return;
    socket.emit('chat:react', { code, messageId: msgId, emoji });
  };

  // Robust exact-match mention rendering for all players
  const renderTextWithMentions = (text: string) => {
    if (!players || players.length === 0) return <span>{text}</span>;

    const escapedPlayers = [...players]
      .sort((a, b) => b.length - a.length) // Match longer names first
      .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      
    const regex = new RegExp(`(@(?:${escapedPlayers.join('|')}))`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (part.startsWith('@') && part.length > 1) {
        const name = part.substring(1).toLowerCase();
        const isMe = currentUsername?.toLowerCase() === name;
        const isPlayer = players.some(p => p.toLowerCase() === name);
        
        if (isMe) {
          return <span key={i} className="text-yellow-400 font-black bg-yellow-900/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(250,204,21,0.2)]">{part}</span>;
        } else if (isPlayer) {
          return <span key={i} className="text-blue-400 font-black bg-blue-900/40 px-1.5 py-0.5 rounded shadow-[0_0_8px_rgba(96,165,250,0.2)]">{part}</span>;
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  const chatMessages = messages.filter(m => m.type !== 'system');
  
  // Filter for autocomplete
  const mentionCandidates = mentionSearch !== null 
    ? players.filter(p => p.toLowerCase().includes(mentionSearch)).slice(0, 5)
    : [];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl overflow-hidden backdrop-blur-xl border border-white/5 relative">
      <div className="bg-slate-950/80 p-4 border-b border-white/10 shrink-0 flex items-center justify-between shadow-md z-20">
        <h3 className="font-black text-gray-300 text-sm tracking-widest uppercase flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          Room Comms
        </h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-5 space-y-8 no-scrollbar relative z-10"
      >
        {chatMessages.length === 0 ? (
          <div className="text-gray-500 text-xs font-bold tracking-widest uppercase text-center mt-10 opacity-50">No comms established.</div>
        ) : (
          chatMessages.map(msg => {
            const isMe = msg.username === currentUsername;
            return (
              <div key={msg._id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[11px] font-black tracking-widest uppercase ${isMe ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {msg.username}
                  </span>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button 
                      onClick={() => handleReplyClick(msg)}
                      className="text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest bg-slate-800/80 px-2 py-0.5 rounded transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </div>

                <div className={`relative max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  <div className="relative group/bubble flex items-center z-10">
                    
                    {isMe && (
                      <div className="absolute right-full mr-3 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-full px-3 py-1.5 shadow-2xl z-50 whitespace-nowrap">
                        {COMMON_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => handleReact(msg._id, emoji)} className="hover:scale-150 transition-transform text-base">{emoji}</button>
                        ))}
                      </div>
                    )}

                    <div className={`px-5 py-3 text-[15px] rounded-2xl shadow-xl border backdrop-blur-md flex flex-col gap-2 ${
                      isMe 
                        ? 'bg-emerald-900/30 text-emerald-50 border-emerald-500/30 rounded-tr-sm shadow-[0_4px_20px_rgba(16,185,129,0.15)]' 
                        : 'bg-slate-800/80 text-gray-100 border-white/10 rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
                    }`}>
                      {msg.replyTo && (
                        <div className={`rounded mb-1 p-2.5 text-xs border-l-2 border-emerald-500/50 ${isMe ? 'bg-black/20 text-emerald-100/70' : 'bg-black/30 text-gray-400'}`}>
                          <div className="font-black text-emerald-400 mb-0.5">@{msg.replyTo.username}</div>
                          <div className="truncate">{msg.replyTo.text}</div>
                        </div>
                      )}
                      <span className="break-words leading-relaxed font-medium">
                        {renderTextWithMentions(msg.text)}
                      </span>
                    </div>

                    {!isMe && (
                      <div className="absolute left-full ml-3 opacity-0 group-hover/bubble:opacity-100 transition-all duration-200 flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-full px-3 py-1.5 shadow-2xl z-50 whitespace-nowrap">
                        {COMMON_EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => handleReact(msg._id, emoji)} className="hover:scale-150 transition-transform text-base">{emoji}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1.5 mt-2 z-20 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {msg.reactions.map(r => (
                        <button 
                          key={r.emoji} 
                          onClick={() => handleReact(msg._id, r.emoji)}
                          className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5 transition-colors shadow-md"
                        >
                          <span>{r.emoji}</span>
                          <span className="text-gray-300 font-bold">{r.userIds.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-slate-950/80 border-t border-white/10 shrink-0 flex flex-col p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] z-30 relative">
        {mentionSearch !== null && mentionCandidates.length > 0 && (
          <div className="absolute bottom-full left-0 w-full p-2">
            <div className="bg-slate-800 border border-emerald-500/30 rounded-xl shadow-[0_-5px_30px_rgba(0,0,0,0.5)] overflow-hidden">
              <div className="px-3 py-2 text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-slate-900/50">
                Mention Player
              </div>
              {mentionCandidates.map(player => (
                <button
                  key={player}
                  onClick={() => handleMentionSelect(player)}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-500/20 text-white font-bold transition-colors border-t border-white/5 flex items-center gap-2"
                >
                  <span className="text-emerald-400">@</span>{player}
                </button>
              ))}
            </div>
          </div>
        )}

        {replyTo && (
          <div className="bg-slate-800/90 rounded-lg px-4 py-3 flex justify-between items-center text-xs border border-emerald-500/30 mb-3 shadow-lg">
            <span className="text-gray-300 truncate">
              <span className="text-emerald-400 font-black mr-2 uppercase tracking-widest text-[10px]">Replying to @{replyTo.username}</span> 
              <br/>
              <span className="opacity-80 mt-1 block truncate">{replyTo.text}</span>
            </span>
            <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-white ml-3 p-1 text-lg leading-none">&times;</button>
          </div>
        )}
        <form onSubmit={handleSend} className="relative">
          <input 
            ref={inputRef}
            type="text" 
            value={inputText}
            onChange={handleInputChange}
            placeholder={disabled ? "Comms offline..." : "Type message or @player..."}
            disabled={disabled}
            maxLength={200}
            className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl pl-5 pr-14 py-4 text-[15px] focus:outline-none focus:border-emerald-500/50 focus:bg-slate-800 transition-all disabled:opacity-50 text-white placeholder-gray-500 shadow-inner font-medium"
          />
          <button 
            type="submit" 
            disabled={disabled || !inputText.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-500/10 rounded-lg text-emerald-500 hover:bg-emerald-500 hover:text-white disabled:bg-transparent disabled:text-slate-600 transition-all"
          >
            <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
