import { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface ChatMessage {
  _id: string;
  userId?: string;
  username: string;
  text: string;
  type: 'chat' | 'system';
  createdAt: string;
}

interface ChatPanelProps {
  socket: Socket | null;
  code: string;
  disabled?: boolean;
}

export default function ChatPanel({ socket, code, disabled = false }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    // Fetch history
    socket.emit('chat:history', { code }, (res: any) => {
      if (res.success && res.history) {
        setMessages(res.history);
      }
    });

    // Listen for new messages
    const handleNewMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [socket, code]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || disabled) return;
    
    socket.emit('chat:send', { code, text: inputText.trim() });
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <h3 className="font-bold text-gray-200">Room Chat</h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm text-center italic mt-10">No messages yet.</div>
        ) : (
          messages.map(msg => (
            <div key={msg._id} className={`text-sm ${msg.type === 'system' ? 'text-center' : ''}`}>
              {msg.type === 'system' ? (
                <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-full text-xs font-semibold inline-block mx-auto border border-gray-700 shadow-inner">
                  {msg.text}
                </span>
              ) : (
                <div className="flex flex-col">
                  <span className="font-bold text-blue-400 text-xs mb-1">{msg.username}</span>
                  <span className="text-gray-200 bg-gray-800 p-2 rounded-lg rounded-tl-none border border-gray-700 shadow-sm inline-block max-w-[90%] break-words">
                    {msg.text}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-gray-800 border-t border-gray-700">
        <input 
          type="text" 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={disabled ? "Chat disabled right now..." : "Type a message..."}
          disabled={disabled}
          maxLength={200}
          className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        />
      </form>
    </div>
  );
}
