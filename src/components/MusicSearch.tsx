import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, Music, ExternalLink, Plus, Check, Download, AlertCircle } from 'lucide-react';
import { geminiService } from '../services/geminiService';

// Add this helper function inside the component or as a prop
const downloadFile = (url: string) => {
  if (!url || url === '#') return;
  // Open in new tab as direct download is restricted by CORS for external links
  window.open(url, '_blank', 'noopener,noreferrer');
};

interface MusicSearchProps {
  onAddMusic: (music: any) => void;
}

export const MusicSearch = ({ onAddMusic }: MusicSearchProps) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [status, setStatus] = useState('IDLE');

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;
    setIsSearching(true);
    setResult(null);
    setIsAdded(false);
    setStatus('CONNECTING');
    
    const statusInterval = setInterval(() => {
      const statuses = ['QUERYING_NODES', 'DECRYPTING_DATA', 'LINK_START', 'SYNCING_METADATA'];
      setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 1200);

    try {
      const data = await geminiService.searchMusic(query);
      if (data) {
        // Add a placeholder cover if none found
        if (!data.coverUrl) {
          data.coverUrl = `https://picsum.photos/seed/${encodeURIComponent(data.title)}/300/300`;
        }
        setResult(data);
      }
    } catch (error: any) {
      console.error("Search failed:", error.message || error);
    } finally {
      clearInterval(statusInterval);
      setIsSearching(false);
      setStatus('IDLE');
    }
  };

  const handleAdd = () => {
    if (result) {
      onAddMusic({
        id: Math.random().toString(36).substr(2, 9),
        title: result.title,
        artist: result.artist,
        cover: result.coverUrl,
        url: result.listenLink || '#'
      });
      setIsAdded(true);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto psp-glass rounded-2xl overflow-hidden border border-white/10 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 clip-hexagon bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
          <Search className="text-orange-400" size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold uppercase tracking-widest text-orange-100">Database Search</h2>
          <p className="text-[10px] font-mono text-orange-400/50">Querying external music nodes...</p>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter search query..."
          className="w-full bg-white/5 border border-orange-500/20 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-orange-500/50 transition-all font-mono"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="absolute right-2 top-2 bottom-2 px-3 bg-orange-600 rounded-lg hover:bg-orange-500 transition-colors disabled:opacity-50 sao-glow flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span className="text-[10px] font-mono hidden sm:inline">{status}</span>
            </>
          ) : (
            <Search size={18} />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4"
            >
              <div className="flex gap-4">
                <img 
                  src={result.coverUrl} 
                  alt={result.title} 
                  className="w-24 h-24 clip-hexagon shadow-xl object-cover border border-orange-500/30"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate uppercase tracking-tight">{result.title}</h3>
                  <p className="text-orange-400 text-sm font-mono">{result.artist}</p>
                  <p className="text-white/40 text-xs mt-1 font-mono">{result.album} ({result.year})</p>
                </div>
              </div>
              
              <p className="text-xs text-white/60 leading-relaxed italic">
                {result.description}
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAdd}
                  disabled={isAdded || !result.listenLink}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest",
                    isAdded ? "bg-green-600/20 text-green-400 border border-green-500/30" : 
                    !result.listenLink ? "bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed" :
                    "bg-orange-500 text-white hover:scale-[1.02] sao-glow"
                  )}
                >
                  {isAdded ? (
                    <>
                      <Check size={16} />
                      <span>Added to Library</span>
                    </>
                  ) : !result.listenLink ? (
                    <>
                      <AlertCircle size={16} />
                      <span>No Link Found</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Add to Library</span>
                    </>
                  )}
                </button>
                {result.listenLink && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadFile(result.listenLink)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white/60 hover:text-white"
                      title="Open Audio Source"
                    >
                      <Download size={20} />
                    </button>
                    <a
                      href={result.listenLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ) : isSearching ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-40">
              <Loader2 size={48} className="animate-spin text-blue-400" />
              <p className="text-sm animate-pulse">Searching the web...</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-white/20 text-center p-8">
              <Music size={48} className="mb-4 opacity-10" />
              <p className="text-sm">Search for a song to see details and add it to your collection.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
