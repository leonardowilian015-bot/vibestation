import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Settings, 
  MessageSquare, 
  Video, 
  Mic, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Search,
  Cpu,
  Volume2,
  Clock,
  Battery,
  Wifi,
  Loader2,
  Plus,
  Download
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { GeminiChat } from './components/GeminiChat';
import { VideoGen } from './components/VideoGen';
import { LiveVoice } from './components/LiveVoice';
import { MusicSearch } from './components/MusicSearch';
import { geminiService } from './services/geminiService';

// Add this helper function outside the component
const downloadFile = async (url: string, filename: string) => {
  if (!url || url === '#') return;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback to opening in new tab if fetch fails (e.g. CORS)
    window.open(url, '_blank');
  }
};

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type Category = 'settings' | 'music' | 'search' | 'chat' | 'video' | 'voice';

interface MediaItem {
  id: string;
  title: string;
  artist: string;
  cover: string;
  url: string;
}

// --- Mock Data ---

const MOCK_MUSIC: MediaItem[] = [
  { id: '1', title: 'Midnight City', artist: 'M83', cover: 'https://picsum.photos/seed/m83/300/300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Starboy', artist: 'The Weeknd', cover: 'https://picsum.photos/seed/weeknd/300/300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Blinding Lights', artist: 'The Weeknd', cover: 'https://picsum.photos/seed/blinding/300/300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: '4', title: 'Levitating', artist: 'Dua Lipa', cover: 'https://picsum.photos/seed/dua/300/300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: '5', title: 'Save Your Tears', artist: 'The Weeknd', cover: 'https://picsum.photos/seed/save/300/300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: '6', title: 'Stay', artist: 'The Kid LAROI', cover: 'https://picsum.photos/seed/stay/300/300', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
];

// --- Components ---

const WaveBackground = () => (
  <div className="fixed inset-0 z-[-1] bg-[#0a0a0a] overflow-hidden">
    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
    <motion.div 
      animate={{ 
        opacity: [0.1, 0.2, 0.1],
      }}
      transition={{ duration: 5, repeat: Infinity }}
      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,165,0,0.1)_0%,_transparent_70%)]"
    />
    {/* Digital Grid lines */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,165,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,165,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
  </div>
);

const StatusBar = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-10 px-8 flex items-center justify-between text-white/70 text-sm z-50">
      <div className="flex items-center gap-4">
        <Wifi size={16} className="text-orange-500" />
        <span className="font-mono tracking-tighter text-orange-500/80">VibeStation::OS</span>
      </div>
      <div className="flex items-center gap-4">
        <Clock size={16} />
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <Battery size={16} />
        <span>85%</span>
      </div>
    </div>
  );
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState<Category>('music');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicLibrary, setMusicLibrary] = useState<MediaItem[]>(MOCK_MUSIC);
  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(MOCK_MUSIC[0]);
  const [isThinking, setIsThinking] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlayback = async () => {
      try {
        if (isPlaying) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Playback failed:", err.message || err);
        }
      }
    };

    handlePlayback();
  }, [isPlaying, currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleNext = () => {
    if (musicLibrary.length === 0) return;
    const currentIndex = musicLibrary.findIndex(m => m.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % musicLibrary.length;
    setCurrentTrack(musicLibrary[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (musicLibrary.length === 0) return;
    const currentIndex = musicLibrary.findIndex(m => m.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + musicLibrary.length) % musicLibrary.length;
    setCurrentTrack(musicLibrary[prevIndex]);
    setIsPlaying(true);
  };

  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'VibeStation',
        artwork: [
          { src: currentTrack.cover, sizes: '512x512', type: 'image/png' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('previoustrack', handlePrevious);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
    }
  }, [currentTrack, musicLibrary]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const handleAddMusic = (newMusic: MediaItem) => {
    setMusicLibrary(prev => [newMusic, ...prev]);
  };

  const handleGetInsight = async () => {
    if (!currentTrack || isThinking) return;
    setIsThinking(true);
    try {
      const result = await geminiService.think(`Provide a deep, philosophical insight about the song "${currentTrack.title}" by ${currentTrack.artist}. Why does it resonate with people?`);
      setInsight(result || "No insight found.");
    } catch (err) {
      setInsight("Failed to generate insight.");
    } finally {
      setIsThinking(false);
    }
  };

  const categories: { id: Category; icon: any; label: string }[] = [
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'music', icon: Music, label: 'Music' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'chat', icon: MessageSquare, label: 'AI Chat' },
    { id: 'video', icon: Video, label: 'Video Gen' },
    { id: 'voice', icon: Mic, label: 'Live Voice' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const catIndex = categories.findIndex(c => c.id === activeCategory);
    
    if (e.key === 'ArrowLeft') {
      const nextIndex = (catIndex - 1 + categories.length) % categories.length;
      setActiveCategory(categories[nextIndex].id);
      setSelectedIndex(0);
    } else if (e.key === 'ArrowRight') {
      const nextIndex = (catIndex + 1) % categories.length;
      setActiveCategory(categories[nextIndex].id);
      setSelectedIndex(0);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown') {
      const maxIndex = activeCategory === 'music' ? musicLibrary.length - 1 : 0;
      setSelectedIndex(prev => Math.min(maxIndex, prev + 1));
    }
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden select-none outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <WaveBackground />
      <StatusBar />

      <audio 
        ref={audioRef}
        src={currentTrack?.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onError={() => {
          console.error("Audio playback failed: No compatible source found.");
          setIsBuffering(false);
          // Set current track URL to null to stop trying to load the broken link
          if (currentTrack) {
            setCurrentTrack({ ...currentTrack, url: '#' });
          }
          setInsight("### [SYSTEM ERROR]\n\n**Neural Link Failed:** The audio stream for this track is encrypted or unavailable. \n\n**Suggestion:** Try searching for a different version or a 'Live' performance which might have a more accessible data node.");
          setIsPlaying(false);
        }}
      />

      {/* XMB Horizontal Menu */}
      <div className="absolute top-20 left-0 right-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-full max-w-4xl px-12 flex items-center gap-16">
          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            
            return (
              <motion.div
                key={cat.id}
                animate={{
                  scale: isActive ? 1.2 : 0.8,
                  opacity: isActive ? 1 : 0.4,
                  x: (categories.findIndex(c => c.id === activeCategory) - idx) * -100,
                }}
                className={cn(
                  "flex flex-col items-center gap-2 pointer-events-auto cursor-pointer transition-all",
                  isActive ? "text-white" : "text-white/50"
                )}
                onClick={() => setActiveCategory(cat.id)}
              >
                <div className={cn(
                  "w-16 h-16 flex items-center justify-center transition-all relative",
                  isActive ? "bg-orange-500 clip-hexagon sao-glow" : "bg-white/10 clip-hexagon opacity-40"
                )}>
                  <Icon size={28} className={isActive ? "text-white" : "text-white/50"} />
                  {isActive && (
                    <motion.div 
                      layoutId="active-ring"
                      className="absolute inset-[-4px] border-2 border-orange-500/50 clip-hexagon animate-pulse"
                    />
                  )}
                </div>
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="text-xs font-bold uppercase tracking-widest"
                    >
                      {cat.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Vertical Content Area */}
      <div className="absolute top-[180px] left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 h-[calc(100vh-300px)] overflow-hidden">
        <AnimatePresence mode="wait">
          {activeCategory === 'music' && (
            <motion.div
              key="music-list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-2 max-w-2xl mx-auto overflow-y-auto pr-2 scrollbar-hide h-full pb-32"
            >
              {musicLibrary.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <motion.div
                    key={item.id}
                    animate={{
                      scale: isSelected ? 1.05 : 1,
                      x: isSelected ? 20 : 0,
                      opacity: isSelected ? 1 : 0.6,
                    }}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all",
                      isSelected ? "bg-white/10 border border-white/20" : "hover:bg-white/5"
                    )}
                    onClick={() => {
                      setSelectedIndex(idx);
                      setCurrentTrack(item);
                      setIsPlaying(true);
                    }}
                  >
                    <img src={item.cover} alt={item.title} className="w-12 h-12 clip-hexagon shadow-lg object-cover" />
                    <div className="flex-1">
                      <h3 className="font-bold text-sm uppercase tracking-tight">{item.title}</h3>
                      <p className="text-xs text-orange-400/70 font-mono">{item.artist}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(item.url, `${item.title} - ${item.artist}.mp3`);
                        }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                        title="Download MP3"
                      >
                        <Download size={16} />
                      </button>
                      {isSelected && isPlaying && (
                        <div className="flex gap-1 items-end h-4">
                          {[1, 2, 3].map(i => (
                            <motion.div
                              key={i}
                              animate={{ height: [4, 16, 4] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                              className="w-1 bg-white"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeCategory === 'search' && (
            <motion.div
              key="search-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <MusicSearch onAddMusic={handleAddMusic} />
            </motion.div>
          )}

          {activeCategory === 'chat' && (
            <motion.div
              key="chat-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <GeminiChat />
            </motion.div>
          )}

          {activeCategory === 'video' && (
            <motion.div
              key="video-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <VideoGen />
            </motion.div>
          )}

          {activeCategory === 'voice' && (
            <motion.div
              key="voice-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full"
            >
              <LiveVoice />
            </motion.div>
          )}

          {activeCategory === 'settings' && (
            <motion.div
              key="settings-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center gap-4"
            >
              <Settings size={48} className="text-white/20" />
              <div>
                <h2 className="text-xl font-bold">System Settings</h2>
                <p className="text-sm text-white/40">VibeStation Firmware v4.0.0-AI</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {['Theme', 'Network', 'Display', 'Sound'].map(item => (
                  <div key={item} className="p-4 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 cursor-pointer transition-all">
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini Player */}
      <AnimatePresence>
        {currentTrack && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 h-24 psp-glass border-t border-white/10 px-8 flex items-center justify-between z-50"
          >
            <div className="flex items-center gap-4 w-1/3">
              <img src={currentTrack.cover} alt={currentTrack.title} className="w-14 h-14 rounded-lg shadow-2xl" />
              <div>
                <h4 className="font-bold text-sm truncate">{currentTrack.title}</h4>
                <p className="text-xs text-white/60 truncate">{currentTrack.artist}</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 w-1/3">
              <div className="flex items-center gap-8">
                <button 
                  onClick={handlePrevious}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <SkipBack size={24} />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={isBuffering}
                  className="w-12 h-12 clip-hexagon bg-orange-500 text-white flex items-center justify-center hover:scale-110 transition-transform sao-glow disabled:opacity-50"
                >
                  {isBuffering ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : isPlaying ? (
                    <Pause size={24} />
                  ) : (
                    <Play size={24} fill="currentColor" />
                  )}
                </button>
                <button 
                  onClick={handleNext}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <SkipForward size={24} />
                </button>
              </div>
              <div className="w-full max-w-xs h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                  className="h-full bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 w-1/3 text-white/60">
              <button 
                onClick={handleGetInsight}
                disabled={isThinking}
                className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                {isThinking ? <Loader2 size={12} className="animate-spin" /> : <Cpu size={12} />}
                AI Insight
              </button>
              <Volume2 size={20} />
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-white/40" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insight Modal */}
      <AnimatePresence>
        {insight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-8"
            onClick={() => setInsight(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-xl psp-glass p-8 rounded-3xl space-y-4 text-center"
              onClick={e => e.stopPropagation()}
            >
              <Cpu size={48} className={cn("mx-auto", insight.includes('ERROR') ? "text-red-500" : "text-orange-400")} />
              <h3 className="text-xl font-bold uppercase tracking-widest">
                {insight.includes('ERROR') ? "System::Warning" : "Neural::Insight"}
              </h3>
              <div className="text-sm text-white/80 leading-relaxed max-h-[40vh] overflow-y-auto pr-2">
                <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
              <button 
                onClick={() => setInsight(null)}
                className="px-8 py-2 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-500 transition-all uppercase tracking-widest sao-glow"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
