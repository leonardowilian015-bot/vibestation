import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { geminiService } from '../services/geminiService';

export const GeminiChat = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await geminiService.chat(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response || 'Sorry, I couldn\'t process that.' }]);
    } catch (error: any) {
      console.error("Chat failed:", error.message || error);
      setMessages(prev => [...prev, { role: 'bot', text: 'Error connecting to Gemini.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto psp-glass rounded-2xl overflow-hidden border border-white/10">
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-orange-400" />
          <span className="font-bold text-sm uppercase tracking-tighter text-orange-100">Gemini::Link</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/40 text-center p-8">
            <Bot size={48} className="mb-4 opacity-20 text-orange-400" />
            <p className="text-sm">Hello! I'm your AI music companion. Ask me about artists, genres, or for recommendations.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-orange-600 text-white rounded-tr-none sao-glow' 
                : 'bg-white/10 text-white/90 rounded-tl-none border border-orange-500/20'
            }`}>
              <div className="markdown-body prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none border border-white/10">
              <Loader2 size={16} className="animate-spin text-blue-400" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/20 border-t border-white/10">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Input command..."
            className="w-full bg-white/5 border border-orange-500/20 rounded-xl py-2 pl-4 pr-12 text-sm focus:outline-none focus:border-orange-500/50 transition-all font-mono"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-1 top-1 bottom-1 px-3 bg-orange-600 rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
